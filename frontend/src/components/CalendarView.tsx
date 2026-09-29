import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Download, 
  Filter, 
  User as UserIcon, 
  Users,
  Wrench, 
  Sparkles, 
  Send, 
  FileCheck, 
  X,
  Edit3,
  MapPin,
  ChevronDown,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Project, User, Documentation } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  user: User;
  darkMode: boolean;
  onUpdateTask: (task: Task) => void;
  onAddNotification: (message: string, type: any, sendWhatsApp?: boolean) => void;
  onSelectProject?: (projectId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  projects,
  users,
  user,
  darkMode,
  onUpdateTask,
  onAddNotification,
  onSelectProject
}) => {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'monthlyReport'>('calendar');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  
  // Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Modals & Details
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ dateStr: string; dateTasks: Task[] } | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [documentations, setDocumentations] = useState<Documentation[]>([]);

  // Close dropdowns when clicking outside
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch documentations for PDF reports
  useEffect(() => {
    fetch('/api/dokumentasi')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mappedDocs: Documentation[] = data.map((d: any) => ({
            id: d.id_dokumentasi,
            taskId: d.id_tugas,
            completionNotes: d.catatan_selesai,
            obstacles: d.kendala || '',
            solutions: d.solusi || '',
            attachments: [],
            authorId: d.id_pengguna,
            authorName: d.pengguna?.nama || 'Tim KroomSpace',
            authorAvatar: d.pengguna?.foto_profil,
            createdAt: d.dibuat_pada,
          }));
          setDocumentations(mappedDocs);
        }
      })
      .catch(console.error);
  }, []);

  // WIB (Asia/Jakarta UTC+7) Date Helper Functions
  const getWibDateString = (dateObj: Date): string => {
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(dateObj);

    const y = parts.find(p => p.type === 'year')?.value || '';
    const m = parts.find(p => p.type === 'month')?.value || '';
    const d = parts.find(p => p.type === 'day')?.value || '';
    return `${y}-${m}-${d}`;
  };

  const todayWibStr = useMemo(() => getWibDateString(new Date()), []);
  const tomorrowWibStr = useMemo(() => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    return getWibDateString(nextDay);
  }, []);

  // Filter tasks based on selections
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedProjectFilter !== 'all' && task.projectId !== selectedProjectFilter) return false;
      if (selectedPriorityFilter !== 'all' && task.priority !== selectedPriorityFilter) return false;
      if (selectedTypeFilter !== 'all' && task.type !== selectedTypeFilter) return false;
      if (selectedAssigneeFilter !== 'all') {
        const isAssignee = task.assignee === selectedAssigneeFilter;
        const isContributor = task.contributors?.includes(selectedAssigneeFilter);
        if (!isAssignee && !isContributor) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectFilter, selectedPriorityFilter, selectedTypeFilter, selectedAssigneeFilter]);

  // Detect H-1 (Tomorrow) and Today's Deadlines based on WIB (Asia/Jakarta)
  const deadlineWarnings = useMemo(() => {
    return filteredTasks.filter(task => {
      if (!task.deadline || task.status === 'Done') return false;
      const dDateStr = task.deadline.split('T')[0];
      return dDateStr === todayWibStr || dDateStr === tomorrowWibStr;
    });
  }, [filteredTasks, todayWibStr, tomorrowWibStr]);

  // Calendar Date Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'];
  const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Current Week Days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    // Monday is 1, Sunday is 0 -> adjust so Monday is first day (0 offset)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);

    const result = [];
    for (let i = 0; i < 7; i++) {
      const itemDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const mName = language === 'en' ? monthNamesEn[itemDate.getMonth()] : monthNames[itemDate.getMonth()];
      result.push({
        date: itemDate,
        dateStr: getWibDateString(itemDate),
        dayName: language === 'en' ? dayNamesEn[i] : dayNames[i],
        // Match Stellarsync reference format: "04 April"
        formattedHeader: `${String(itemDate.getDate()).padStart(2, '0')} ${mName}`,
        isToday: getWibDateString(itemDate) === todayWibStr
      });
    }
    return result;
  }, [currentDate, language, todayWibStr]);

  // Month grid days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();

  const monthGridDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: getWibDateString(d)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: getWibDateString(d)
      });
    }

    // Next month padding
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: getWibDateString(d)
      });
    }

    return days;
  }, [year, month, startingDayOfWeek, daysInMonth]);

  // Tasks mapped by date string
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      const targetDate = task.deadline || task.startDate || task.createdAt;
      if (targetDate) {
        const dateKey = targetDate.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  // Hourly slots for timetable (08:00 - 18:00)
  const timeSlots = useMemo(() => [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ], []);

  // Helper to get attendees list for a task
  const getTaskAttendees = (task: Task): User[] => {
    const result: User[] = [];
    if (task.assignee) {
      const mainUser = users.find(u => u.id === task.assignee);
      if (mainUser) result.push(mainUser);
    }
    if (task.contributors && Array.isArray(task.contributors)) {
      task.contributors.forEach(cId => {
        if (cId !== task.assignee) {
          const cUser = users.find(u => u.id === cId);
          if (cUser && !result.some(r => r.id === cUser.id)) result.push(cUser);
        }
      });
    }
    return result;
  };

  // Helper: Schedule start hour and time badge for timetable cards
  const getTaskSchedule = (task: Task, indexInDay: number = 0) => {
    let startHour = 8;
    let endHour = 9;
    let startMin = '00';
    let endMin = '30';

    const source = task.deadline || task.startDate || task.createdAt;
    if (source) {
      const match = /(\d{1,2}):(\d{2})/.exec(source);
      if (match) {
        startHour = parseInt(match[1], 10);
        startMin = match[2];
        endHour = (startHour + 1) % 24;
        endMin = startMin;
      } else {
        const workdayHours = [8, 9, 11, 12, 14, 15];
        startHour = workdayHours[indexInDay % workdayHours.length];
        endHour = startHour + (indexInDay % 2 === 0 ? 1 : 2);
        startMin = '00';
        endMin = '30';
      }
    }

    const timePillText = `${String(startHour).padStart(2, '0')}:${startMin} - ${String(endHour).padStart(2, '0')}:${endMin}`;
    return { startHour, endHour, timePillText };
  };

  // Pastel Color Themes matching reference image (Image 2)
  const getCardTheme = (task: Task) => {
    const themes = [
      {
        // Pink / Rose
        bg: 'bg-pink-50/90 dark:bg-pink-950/40',
        border: 'border-pink-200 dark:border-pink-800/80',
        text: 'text-pink-950 dark:text-pink-100',
        timePill: 'bg-white/90 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300 border border-pink-200/50 dark:border-pink-700/50',
        dot: 'bg-pink-500'
      },
      {
        // Cyan / Sky
        bg: 'bg-cyan-50/90 dark:bg-cyan-950/40',
        border: 'border-cyan-200 dark:border-cyan-800/80',
        text: 'text-cyan-950 dark:text-cyan-100',
        timePill: 'bg-white/90 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-700/50',
        dot: 'bg-cyan-500'
      },
      {
        // Light Green / Emerald / Lime
        bg: 'bg-lime-50/90 dark:bg-emerald-950/40',
        border: 'border-lime-200 dark:border-emerald-800/80',
        text: 'text-lime-950 dark:text-emerald-100',
        timePill: 'bg-white/90 dark:bg-lime-900/60 text-lime-700 dark:text-emerald-300 border border-lime-200/50 dark:border-emerald-700/50',
        dot: 'bg-emerald-500'
      },
      {
        // Peach / Orange / Amber
        bg: 'bg-amber-50/90 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/80',
        text: 'text-amber-950 dark:text-amber-100',
        timePill: 'bg-white/90 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50',
        dot: 'bg-amber-500'
      },
      {
        // Purple / Lavender
        bg: 'bg-purple-50/90 dark:bg-purple-950/40',
        border: 'border-purple-200 dark:border-purple-800/80',
        text: 'text-purple-950 dark:text-purple-100',
        timePill: 'bg-white/90 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50',
        dot: 'bg-purple-500'
      }
    ];

    let code = 0;
    for (let i = 0; i < (task.id || '').length; i++) {
      code = (code * 31 + task.id.charCodeAt(i)) % themes.length;
    }
    return themes[code];
  };

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title display (e.g. "July 2025" or "September 2026")
  const displayHeaderDate = useMemo(() => {
    const curMonthName = language === 'en' ? monthNamesEn[currentDate.getMonth()] : monthNames[currentDate.getMonth()];
    if (viewMode === 'day') {
      return `${currentDate.getDate()} ${curMonthName} ${currentDate.getFullYear()}`;
    }
    return `${curMonthName} ${currentDate.getFullYear()}`;
  }, [currentDate, viewMode, language]);

  // Monthly Report Calculations (DONE Tasks Only)
  const monthlyDoneTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.status !== 'Done') return false;
      const dStr = t.deadline || t.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [tasks, year, month]);

  const maintenanceDoneTasks = useMemo(() => {
    return monthlyDoneTasks.filter(t => t.type === 'Maintenance');
  }, [monthlyDoneTasks]);

  const developmentDoneTasks = useMemo(() => {
    return monthlyDoneTasks.filter(t => t.type === 'Development');
  }, [monthlyDoneTasks]);

  const doneDocs = useMemo(() => {
    return documentations.filter(d => monthlyDoneTasks.some(t => t.id === d.taskId));
  }, [documentations, monthlyDoneTasks]);

  // Trigger WhatsApp warning for H-1 tasks
  const handleSendH1WhatsApp = (task: Task) => {
    const assigneeUser = users.find(u => u.id === task.assignee);
    const phone = assigneeUser?.whatsapp || '+6281234567890';
    const msg = `🚨 *PERINGATAN H-1 DEADLINE - KROOMSPACE*\n\nTugas: *${task.title}*\nPrioritas: ${task.priority}\nTenggat Waktu: ${task.deadline}\n\nMohon segera selesaikan sebelum tenggat waktu berakhir!`;
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    onAddNotification(`Peringatan H-1 WA dikirim untuk tugas: ${task.title}`, 'Task', true);
  };

  // Download Monthly Report PDF directly to device
  const handleDownloadPdf = async () => {
    try {
      const fileName = `Laporan_Bulanan_KroomSpace_${monthNames[month]}_${year}.pdf`;

      const tableRowsHtml = monthlyDoneTasks.length > 0 ? monthlyDoneTasks.map((t, idx) => {
        const assignee = users.find(u => u.id === t.assignee)?.name || 'Tim KroomSpace';
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; text-align: center; color: #64748b;">${idx + 1}</td>
            <td style="padding: 10px; font-weight: bold; color: #1e293b;">${t.deadline || t.createdAt}</td>
            <td style="padding: 10px; font-weight: bold; color: #0f172a;">${t.title}</td>
            <td style="padding: 10px; text-transform: uppercase; font-size: 11px; font-weight: bold;">${t.type}</td>
            <td style="padding: 10px; font-weight: bold; color: #475569;">${t.priority}</td>
            <td style="padding: 10px; color: #334155;">${assignee}</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: #059669;">Done</td>
          </tr>
        `;
      }).join('') : `
        <tr>
          <td colspan="7" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">
            Belum ada tugas berstatus DONE pada bulan ${monthNames[month]} ${year}.
          </td>
        </tr>
      `;

      const docsHtml = doneDocs.length > 0 ? `
        <div style="margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #334155; margin-bottom: 15px;">
            Dokumentasi Pekerjaan Selesai
          </h3>
          ${doneDocs.map((doc, idx) => {
            const relatedTask = monthlyDoneTasks.find(t => t.id === doc.taskId);
            return `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="font-weight: bold; color: #0f172a; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
                  ${idx + 1}. ${relatedTask?.title || 'Tugas Selesai'} (${new Date(doc.createdAt).toLocaleDateString('id-ID')} WIB)
                </div>
                <div style="color: #334155; font-size: 12px; margin-bottom: 6px;">
                  <strong>Catatan Selesai:</strong> ${doc.completionNotes.replace(/\n/g, '<br>')}
                </div>
                ${doc.obstacles ? `<div style="color: #475569; font-size: 12px; margin-bottom: 6px;"><strong>Kendala:</strong> ${doc.obstacles.replace(/\n/g, '<br>')}</div>` : ''}
                ${doc.solutions ? `<div style="color: #475569; font-size: 12px; margin-bottom: 6px;"><strong>Solusi:</strong> ${doc.solutions.replace(/\n/g, '<br>')}</div>` : ''}
                <div style="color: #94a3b8; font-size: 11px; margin-top: 6px;">Oleh: ${doc.authorName}</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; padding: 30px; color: #1e293b; background: #ffffff;">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #0f172a;">Rekapan Laporan Bulanan (Tugas Selesai)</h2>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">
                Periode: ${monthNames[month]} ${year} • Waktu Indonesia Barat (WIB)
              </p>
            </div>
            <div style="font-size: 11px; color: #64748b; text-align: right;">
              Waktu Unduh: ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div style="display: flex; gap: 15px; margin-bottom: 25px;">
            <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Total Done</div>
              <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${monthlyDoneTasks.length} Task</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Maintenance</div>
              <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${maintenanceDoneTasks.length} Event</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Development</div>
              <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${developmentDoneTasks.length} Fitur</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Dokumentasi</div>
              <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${doneDocs.length} Dokumen</div>
            </div>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; color: #334155; margin-bottom: 12px;">Daftar Tugas Selesai</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px;">
            <thead>
              <tr style="border-bottom: 2px solid #cbd5e1; background: #f8fafc; font-weight: bold; color: #334155;">
                <th style="padding: 10px; text-align: center; width: 40px;">No</th>
                <th style="padding: 10px; text-align: left; width: 120px;">Tanggal (WIB)</th>
                <th style="padding: 10px; text-align: left;">Judul Tugas</th>
                <th style="padding: 10px; text-align: left; width: 90px;">Tipe</th>
                <th style="padding: 10px; text-align: left; width: 80px;">Prioritas</th>
                <th style="padding: 10px; text-align: left; width: 130px;">Penanggung Jawab</th>
                <th style="padding: 10px; text-align: center; width: 60px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
          ${docsHtml}
        </div>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body { margin: 0; padding: 20px; background-color: #f1f5f9; }
                @media print {
                  body { background: transparent; padding: 0; }
                  @page { margin: 15mm; size: A4 portrait; }
                }
              </style>
            </head>
            <body>
              ${htmlContent}
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      console.error(err);
      onAddNotification('Gagal mencetak dokumen PDF bulanan.', 'System');
    }
  };

  // Selected Task Details formatted for the Reference Modal Card
  const selectedTaskMeta = useMemo(() => {
    if (!selectedTaskDetail) return null;
    const taskDateObj = new Date(selectedTaskDetail.deadline || selectedTaskDetail.startDate || selectedTaskDetail.createdAt || new Date());
    const mShort = taskDateObj.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'short' });
    const dayNum = taskDateObj.getDate();
    const proj = projects.find(p => p.id === selectedTaskDetail.projectId);
    const attendees = getTaskAttendees(selectedTaskDetail);
    const mainUser = users.find(u => u.id === selectedTaskDetail.assignee);

    return {
      monthShort: mShort,
      dayNumber: dayNum,
      projectName: proj?.name || 'Kroomspace Project',
      attendees,
      mainUser
    };
  }, [selectedTaskDetail, projects, users, language]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header & Tab Switcher ── */}
      <header className="px-4 md:px-8 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={cn("text-2xl font-black tracking-tight", darkMode ? "text-white" : "text-slate-900")}>
              {t('calendar')} & {t('monthlyReport')}
            </h1>
            <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">
              WIB (UTC+7)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t('calendarSubHeader')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all",
              activeTab === 'calendar'
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white"
            )}
          >
            <CalendarIcon size={14} />
            {language === 'en' ? "Calendar" : "Kalender Papan"}
          </button>
          <button
            onClick={() => setActiveTab('monthlyReport')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all",
              activeTab === 'monthlyReport'
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white"
            )}
          >
            <FileText size={14} />
            {language === 'en' ? "Monthly Report & PDF" : "Laporan Bulanan & PDF"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-4 md:px-8 space-y-6">

        {/* ── H-1 Deadline Warning Banner ── */}
        <AnimatePresence>
          {deadlineWarnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-blue-500/10 border border-amber-500/30 dark:border-amber-500/20 backdrop-blur-md print:hidden shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                        {language === 'en' ? "H-1 Deadline Warning" : "Peringatan H-1 Deadline"} ({deadlineWarnings.length} {language === 'en' ? "Tasks Nearing Deadline" : "Tugas Mendekati Tenggat Waktu"})
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider">
                        URGENT
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                      {language === 'en' ? "The following tasks are due today or tomorrow. Ensure your team prioritizes completion." : "Tugas berikut jatuh tempo hari ini atau esok hari. Pastikan tim memprioritaskan penyelesaiannya."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 shrink-0 custom-scrollbar">
                  {deadlineWarnings.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-xs shrink-0"
                    >
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-800 dark:text-white max-w-[140px] truncate">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <Clock size={10} /> {task.deadline}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendH1WhatsApp(task)}
                        className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                        title={language === 'en' ? "Send H-1 WA Alert" : "Kirim Notifikasi WA H-1"}
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TAB 1: KALENDER (REFERENCE DESIGN: STELLARSYNC) ── */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            
            {/* ── Stellarsync Header Controls Bar ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs print:hidden">
              
              {/* Left Controls: < > Month Year Today */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
                    title={language === 'en' ? "Previous" : "Sebelumnya"}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
                    title={language === 'en' ? "Next" : "Berikutnya"}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight px-1">
                  {displayHeaderDate}
                </h2>

                <button
                  onClick={handleGoToToday}
                  className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  {language === 'en' ? "Today" : "Hari Ini"}
                </button>
              </div>

              {/* Right Controls: [ Day | Week | Month ] + Filter + All Assignees */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Segmented View Mode Switcher */}
                <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
                  {(['day', 'week', 'month'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer",
                        viewMode === mode
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      )}
                    >
                      {language === 'en' 
                        ? (mode === 'day' ? 'Day' : mode === 'week' ? 'Week' : 'Month')
                        : (mode === 'day' ? 'Hari' : mode === 'week' ? 'Minggu' : 'Bulan')}
                    </button>
                  ))}
                </div>

                {/* Filter Popover Button */}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    onClick={() => {
                      setShowFilterDropdown(!showFilterDropdown);
                      setShowAssigneeDropdown(false);
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all shadow-2xs cursor-pointer",
                      showFilterDropdown || selectedProjectFilter !== 'all' || selectedPriorityFilter !== 'all' || selectedTypeFilter !== 'all'
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    <Filter size={14} />
                    <span>Filter</span>
                    {(selectedProjectFilter !== 'all' || selectedPriorityFilter !== 'all' || selectedTypeFilter !== 'all') && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </button>

                  {/* Filter Dropdown Menu */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 z-30 animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          {language === 'en' ? "Filter Tasks" : "Filter Tugas"}
                        </span>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Project Filter */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {language === 'en' ? "Project" : "Proyek"}
                        </label>
                        <select
                          value={selectedProjectFilter}
                          onChange={(e) => setSelectedProjectFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                        >
                          <option value="all">{language === 'en' ? "All Projects" : "Semua Proyek"}</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {language === 'en' ? "Priority" : "Prioritas"}
                        </label>
                        <select
                          value={selectedPriorityFilter}
                          onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                        >
                          <option value="all">{language === 'en' ? "All Priorities" : "Semua Prioritas"}</option>
                          <option value="High">High (Tinggi)</option>
                          <option value="Medium">Medium (Sedang)</option>
                          <option value="Low">Low (Rendah)</option>
                        </select>
                      </div>

                      {/* Type Filter */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {language === 'en' ? "Task Type" : "Tipe Tugas"}
                        </label>
                        <select
                          value={selectedTypeFilter}
                          onChange={(e) => setSelectedTypeFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                        >
                          <option value="all">{language === 'en' ? "All Types" : "Semua Tipe"}</option>
                          <option value="Development">Development</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Bug Fix">Bug Fix</option>
                          <option value="Infrastructure">Infrastructure</option>
                        </select>
                      </div>

                      {/* Reset Button */}
                      {(selectedProjectFilter !== 'all' || selectedPriorityFilter !== 'all' || selectedTypeFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSelectedProjectFilter('all');
                            setSelectedPriorityFilter('all');
                            setSelectedTypeFilter('all');
                          }}
                          className="w-full py-1.5 text-center text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer pt-1"
                        >
                          {language === 'en' ? "Reset Filters" : "Reset Filter"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* All Assignees Popover Button */}
                <div className="relative" ref={assigneeDropdownRef}>
                  <button
                    onClick={() => {
                      setShowAssigneeDropdown(!showAssigneeDropdown);
                      setShowFilterDropdown(false);
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all shadow-2xs cursor-pointer",
                      showAssigneeDropdown || selectedAssigneeFilter !== 'all'
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    <Users size={14} />
                    <span className="max-w-[110px] truncate">
                      {selectedAssigneeFilter === 'all'
                        ? (language === 'en' ? "All Assignees" : "Semua Anggota")
                        : (users.find(u => u.id === selectedAssigneeFilter)?.name || "Anggota")}
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {/* Assignees Dropdown Menu */}
                  {showAssigneeDropdown && (
                    <div className="absolute right-0 mt-2 w-64 max-h-72 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 z-30 animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => {
                          setSelectedAssigneeFilter('all');
                          setShowAssigneeDropdown(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer",
                          selectedAssigneeFilter === 'all'
                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-black"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                      >
                        <span>{language === 'en' ? "All Assignees" : "Semua Anggota"}</span>
                        {selectedAssigneeFilter === 'all' && <Check size={14} />}
                      </button>
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedAssigneeFilter(u.id);
                            setShowAssigneeDropdown(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-colors cursor-pointer",
                            selectedAssigneeFilter === u.id
                              ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-black"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          )}
                        >
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                            alt={u.name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                          <span className="truncate flex-1">{u.name}</span>
                          {selectedAssigneeFilter === u.id && <Check size={14} className="shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── VIEW MODE: WEEK (Exact reference design: Stellarsync schedule grid) ── */}
            {viewMode === 'week' && (
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-[880px]">
                    
                    {/* Header Row: GMT+7 & 7 Day Headers */}
                    <div className="grid grid-cols-[90px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50">
                      {/* Timezone Indicator */}
                      <div className="py-3 px-2 text-center text-xs font-black text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-700">
                        GMT+7
                      </div>

                      {/* 7 Days of Current Week */}
                      {weekDays.map(day => (
                        <div
                          key={day.dateStr}
                          className={cn(
                            "py-3 text-center text-xs font-bold border-r border-slate-200 dark:border-slate-700 last:border-r-0 transition-colors",
                            day.isToday
                              ? "text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50/40 dark:bg-indigo-950/20"
                              : "text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {day.formattedHeader}
                        </div>
                      ))}
                    </div>

                    {/* Hourly Timetable Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {timeSlots.map((slotTime) => {
                        const slotHourNum = parseInt(slotTime.split(':')[0], 10);

                        return (
                          <div
                            key={slotTime}
                            className="grid grid-cols-[90px_repeat(7,1fr)] min-h-[96px]"
                          >
                            {/* Left Time Label Column */}
                            <div className="py-2.5 text-center text-xs font-bold text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-700/50">
                              {slotTime}
                            </div>

                            {/* 7 Day Columns for this time slot */}
                            {weekDays.map(day => {
                              const dayTasks = tasksByDate[day.dateStr] || [];
                              // Find tasks that start in this hourly slot
                              const slotTasks = dayTasks.filter((t, idx) => {
                                const sched = getTaskSchedule(t, idx);
                                return sched.startHour === slotHourNum;
                              });

                              return (
                                <div
                                  key={day.dateStr}
                                  className={cn(
                                    "p-1.5 border-r border-slate-100 dark:border-slate-700/50 last:border-r-0 relative transition-colors flex flex-col gap-1.5",
                                    day.isToday && "bg-indigo-50/15 dark:bg-indigo-950/10"
                                  )}
                                >
                                  {slotTasks.map((task, idx) => {
                                    const sched = getTaskSchedule(task, idx);
                                    const theme = getCardTheme(task);
                                    const attendees = getTaskAttendees(task);

                                    return (
                                      <motion.div
                                        key={task.id}
                                        whileHover={{ scale: 1.015 }}
                                        onClick={() => setSelectedTaskDetail(task)}
                                        className={cn(
                                          "rounded-2xl p-3 border transition-all cursor-pointer shadow-xs flex flex-col justify-between group",
                                          theme.bg,
                                          theme.border
                                        )}
                                      >
                                        <div>
                                          {/* Time Pill Badge */}
                                          <div className="mb-2">
                                            <span className={cn(
                                              "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight inline-block shadow-2xs",
                                              theme.timePill
                                            )}>
                                              {sched.timePillText}
                                            </span>
                                          </div>

                                          {/* Task Title */}
                                          <h4 className={cn(
                                            "text-xs font-black tracking-tight leading-snug line-clamp-2",
                                            theme.text
                                          )}>
                                            {task.title}
                                          </h4>
                                        </div>

                                        {/* Assignee Avatar Stack at Bottom */}
                                        <div className="flex items-center -space-x-1.5 mt-3 pt-1">
                                          {attendees.slice(0, 3).map((att) => (
                                            <img
                                              key={att.id}
                                              src={att.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${att.name}`}
                                              alt={att.name}
                                              className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-2xs shrink-0"
                                              title={att.name}
                                            />
                                          ))}
                                          {attendees.length > 3 && (
                                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-800 shrink-0">
                                              +{attendees.length - 3}
                                            </span>
                                          )}
                                          {attendees.length === 0 && (
                                            <span className="w-5 h-5 rounded-full bg-white/80 dark:bg-slate-800 text-slate-400 text-[9px] font-bold flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700">
                                              <UserIcon size={10} />
                                            </span>
                                          )}
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ── VIEW MODE: MONTH (Aesthetic Grid matching Stellarsync) ── */}
            {viewMode === 'month' && (
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50">
                  {(language === 'en' ? dayNamesEn : dayNames).map((day, idx) => (
                    <div
                      key={day}
                      className={cn(
                        "py-3 text-center text-xs font-extrabold uppercase tracking-wider",
                        idx >= 5 ? "text-rose-500 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Date Grid Cells */}
                <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-700/50 border-t-0">
                  {monthGridDays.map(({ date, isCurrentMonth, dateStr }) => {
                    const dateTasks = tasksByDate[dateStr] || [];
                    const isToday = dateStr === todayWibStr;

                    return (
                      <div
                        key={dateStr}
                        onClick={() => dateTasks.length > 0 && setSelectedDayTasks({ dateStr, dateTasks })}
                        className={cn(
                          "min-h-[120px] md:min-h-[135px] p-2 transition-all group flex flex-col justify-between relative",
                          isCurrentMonth ? "bg-white dark:bg-slate-800/80" : "bg-slate-50/40 dark:bg-slate-900/30 opacity-60",
                          isToday && "bg-indigo-50/20 dark:bg-indigo-950/20",
                          dateTasks.length > 0 && "cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/30"
                        )}
                      >
                        {/* Header: Date Number */}
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all",
                            isToday
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                              : isCurrentMonth ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"
                          )}>
                            {date.getDate()}
                          </span>

                          {dateTasks.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              {dateTasks.length} {language === 'en' ? 'tasks' : 'tugas'}
                            </span>
                          )}
                        </div>

                        {/* Tasks in month cell */}
                        <div className="space-y-1.5 overflow-y-auto max-h-[85px] pr-0.5 custom-scrollbar">
                          {dateTasks.slice(0, 3).map((task) => {
                            const theme = getCardTheme(task);
                            const attendees = getTaskAttendees(task);

                            return (
                              <div
                                key={task.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskDetail(task);
                                }}
                                className={cn(
                                  "px-2 py-1 rounded-xl text-[10px] font-black transition-all truncate flex items-center justify-between gap-1 shadow-2xs cursor-pointer border",
                                  theme.bg,
                                  theme.border,
                                  theme.text
                                )}
                                title={task.title}
                              >
                                <span className="truncate flex-1 font-bold">
                                  {task.title}
                                </span>
                                {attendees[0] && (
                                  <img
                                    src={attendees[0].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${attendees[0].name}`}
                                    alt={attendees[0].name}
                                    className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                  />
                                )}
                              </div>
                            );
                          })}

                          {dateTasks.length > 3 && (
                            <div className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 pl-1">
                              +{dateTasks.length - 3} lainnya...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── VIEW MODE: DAY (Single Day Schedule) ── */}
            {viewMode === 'day' && (
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    {currentDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    {(tasksByDate[getWibDateString(currentDate)] || []).length} {language === 'en' ? 'Scheduled Tasks' : 'Tugas Terjadwal'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {timeSlots.map((slotTime) => {
                    const slotHourNum = parseInt(slotTime.split(':')[0], 10);
                    const curDateStr = getWibDateString(currentDate);
                    const dayTasks = tasksByDate[curDateStr] || [];
                    const slotTasks = dayTasks.filter((t, idx) => {
                      const sched = getTaskSchedule(t, idx);
                      return sched.startHour === slotHourNum;
                    });

                    return (
                      <div key={slotTime} className="grid grid-cols-[90px_1fr] min-h-[85px]">
                        <div className="py-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-700/50">
                          {slotTime}
                        </div>
                        <div className="p-2.5 flex flex-wrap gap-3 items-center">
                          {slotTasks.map((task, idx) => {
                            const sched = getTaskSchedule(task, idx);
                            const theme = getCardTheme(task);
                            const attendees = getTaskAttendees(task);

                            return (
                              <motion.div
                                key={task.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedTaskDetail(task)}
                                className={cn(
                                  "rounded-2xl p-3 border transition-all cursor-pointer shadow-xs max-w-sm flex-1 min-w-[240px]",
                                  theme.bg,
                                  theme.border
                                )}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-2xs", theme.timePill)}>
                                    {sched.timePillText}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {task.priority}
                                  </span>
                                </div>
                                <h4 className={cn("text-xs font-black tracking-tight", theme.text)}>
                                  {task.title}
                                </h4>
                                <div className="flex items-center -space-x-1.5 mt-2.5">
                                  {attendees.map(att => (
                                    <img
                                      key={att.id}
                                      src={att.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${att.name}`}
                                      alt={att.name}
                                      className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-2xs"
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── TAB 2: LAPORAN BULANAN & REKAPAN PDF ── */}
        {activeTab === 'monthlyReport' && (
          <div className="space-y-8">
            
            {/* Header Laporan & Export Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm print:hidden">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'en' ? "Monthly Report Summary" : "Ringkasan & Rekapan Laporan Bulanan"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {language === 'en' 
                    ? `Complete summary of all tasks, facility maintenance, and operational events for ${monthNamesEn[month]} ${year}.`
                    : `Rekapan lengkap seluruh tugas, maintenance fasilitas, dan event operasional bulan ${monthNames[month]} ${year}.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Month Selector Dropdown */}
                <select
                  value={month}
                  onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {(language === 'en' ? monthNamesEn : monthNames).map((mName, idx) => (
                    <option key={mName} value={idx}>{mName}</option>
                  ))}
                </select>

                {/* Year Selector Dropdown */}
                <select
                  value={year}
                  onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map(yVal => (
                    <option key={yVal} value={yVal}>{yVal}</option>
                  ))}
                </select>

                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>

            {/* 4 Summary Cards (DONE Tasks) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    {language === 'en' ? "Total Tasks Done" : "Total Tugas Selesai (Done)"}
                  </span>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {monthlyDoneTasks.length}
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {language === 'en' ? "100% Verified Completed" : "100% Terverifikasi Selesai"}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    {language === 'en' ? "Completed Maintenance" : "Maintenance Selesai"}
                  </span>
                  <Wrench size={18} className="text-amber-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {maintenanceDoneTasks.length}
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {language === 'en' ? "Successful Maintenance" : "Pemeliharaan Berhasil"}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    {language === 'en' ? "Completed Development" : "Development Selesai"}
                  </span>
                  <Sparkles size={18} className="text-blue-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {developmentDoneTasks.length}
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {language === 'en' ? "Feature Development" : "Pengembangan Fitur"}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    {language === 'en' ? "Attached PDF Reports" : "Laporan PDF Terlampir"}
                  </span>
                  <FileCheck size={18} className="text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {doneDocs.length}
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {language === 'en' ? "Completed Task Documentation" : "Dokumentasi Tugas Selesai"}
                </div>
              </div>
            </div>

            {/* Casual Minimalist Monthly Report Document */}
            <div
              id="printable-monthly-report-document"
              className="bg-white text-slate-900 p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6"
            >
              <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Rekapan Laporan Bulanan (Tugas Selesai)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Periode: {monthNames[month]} {year} • Waktu Indonesia Barat (WIB)
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 font-medium">
                  Waktu Unduh: {new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Minimalist Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                <div className="p-3.5 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Done</span>
                  <span className="text-lg font-black text-slate-900">{monthlyDoneTasks.length} Task</span>
                </div>
                <div className="p-3.5 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Maintenance</span>
                  <span className="text-lg font-black text-slate-900">{maintenanceDoneTasks.length} Event</span>
                </div>
                <div className="p-3.5 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Development</span>
                  <span className="text-lg font-black text-slate-900">{developmentDoneTasks.length} Fitur</span>
                </div>
                <div className="p-3.5 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Dokumentasi</span>
                  <span className="text-lg font-black text-slate-900">{doneDocs.length} Dokumen</span>
                </div>
              </div>

              {/* Clean Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Daftar Tugas Selesai
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="border-b border-slate-200 font-bold text-slate-700">
                        <th className="p-2.5 border-b border-slate-200 text-center w-10">No</th>
                        <th className="p-2.5 border-b border-slate-200">Tanggal (WIB)</th>
                        <th className="p-2.5 border-b border-slate-200">Judul Tugas</th>
                        <th className="p-2.5 border-b border-slate-200">Tipe</th>
                        <th className="p-2.5 border-b border-slate-200">Prioritas</th>
                        <th className="p-2.5 border-b border-slate-200">Penanggung Jawab</th>
                        <th className="p-2.5 border-b border-slate-200 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {monthlyDoneTasks.length > 0 ? (
                        monthlyDoneTasks.map((task, idx) => {
                          const assigneeUser = users.find(u => u.id === task.assignee);
                          return (
                            <tr key={task.id} className="text-slate-800">
                              <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-bold">{task.deadline || task.createdAt}</td>
                              <td className="p-2.5 font-bold text-slate-900">{task.title}</td>
                              <td className="p-2.5 font-semibold uppercase">{task.type}</td>
                              <td className="p-2.5 font-semibold">{task.priority}</td>
                              <td className="p-2.5">{assigneeUser?.name || 'Tim KroomSpace'}</td>
                              <td className="p-2.5 text-center font-bold text-slate-900">Done</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 font-medium italic">
                            Belum ada tugas berstatus DONE pada bulan ${monthNames[month]} ${year}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Documentation Section */}
              {doneDocs.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Dokumentasi Pekerjaan Selesai
                  </h3>

                  <div className="space-y-3">
                    {doneDocs.map((doc, idx) => {
                      const relatedTask = monthlyDoneTasks.find(t => t.id === doc.taskId);
                      return (
                        <div key={doc.id} className="p-3 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-800">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="font-bold text-slate-900">
                              {idx + 1}. {relatedTask?.title || 'Tugas Selesai'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(doc.createdAt).toLocaleDateString('id-ID')} (WIB)
                            </span>
                          </div>
                          <p className="text-slate-700">
                            <strong>Catatan Selesai:</strong> {doc.completionNotes}
                          </p>
                          {doc.obstacles && (
                            <p className="text-slate-700">
                              <strong>Kendala:</strong> {doc.obstacles}
                            </p>
                          )}
                          {doc.solutions && (
                            <p className="text-slate-700">
                              <strong>Solusi:</strong> {doc.solutions}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 pt-0.5">
                            Oleh: {doc.authorName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ── STELLARSYNC FLOATING TASK DETAIL MODAL CARD (Exact Reference Image 2) ── */}
      <AnimatePresence>
        {selectedTaskDetail && selectedTaskMeta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskDetail(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4 z-10"
            >
              {/* Header: Date Badge + Title + Subtitle + Close 'X' */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Red Calendar Date Badge matching Reference Image */}
                  <div className="shrink-0 w-11 rounded-xl overflow-hidden shadow-xs border border-rose-200 dark:border-rose-900/50">
                    <div className="bg-rose-500 text-white text-[10px] font-black uppercase text-center py-0.5 tracking-wider">
                      {selectedTaskMeta.monthShort}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-base font-black text-center py-1">
                      {selectedTaskMeta.dayNumber}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {selectedTaskDetail.title}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                      {selectedTaskMeta.projectName} · {selectedTaskDetail.type}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Attendees Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? "Attendees" : "Attendees"}
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTaskMeta.attendees.length > 0 ? (
                    selectedTaskMeta.attendees.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600/60 shadow-2xs"
                      >
                        <img
                          src={att.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${att.name}`}
                          alt={att.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {att.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      {language === 'en' ? "No assignees specified" : "Belum ditentukan penanggung jawab"}
                    </span>
                  )}
                </div>

                {/* Location / Assignee Line matching Reference Image */}
                {selectedTaskMeta.mainUser && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{selectedTaskMeta.mainUser.name}</span>
                  </div>
                )}
              </div>

              {/* Color Tags / Dots Section matching Reference Image */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? "Attendees" : "Attendees"}
                </h4>
                <div className="flex items-center gap-2">
                  {['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#06b6d4', '#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444'].map((colorHex, idx) => (
                    <button
                      key={colorHex}
                      type="button"
                      className="w-4 h-4 rounded-full transition-transform hover:scale-125 focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 cursor-pointer"
                      style={{ backgroundColor: colorHex }}
                      title={`Label Tag ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Notes Container matching Reference Image */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? "Notes" : "Notes"}
                </h4>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal min-h-[64px]">
                  {selectedTaskDetail.description || (
                    <span className="italic text-slate-400">
                      {language === 'en' ? "Review the latest design system components and discuss improvements." : "Review komponen sistem desain terbaru dan diskusikan peningkatannya."}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit & Delete / Complete matching Reference Image */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (selectedTaskDetail.projectId && onSelectProject) {
                      onSelectProject(selectedTaskDetail.projectId);
                    }
                    setSelectedTaskDetail(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Edit3 size={14} />
                  {language === 'en' ? "Edit" : "Edit"}
                </button>

                <button
                  onClick={() => {
                    const nextStatus = selectedTaskDetail.status === 'Done' ? 'In Progress' : 'Done';
                    onUpdateTask({ ...selectedTaskDetail, status: nextStatus });
                    setSelectedTaskDetail(null);
                    onAddNotification(
                      language === 'en' ? `Task status updated to ${nextStatus}` : `Status tugas diubah menjadi ${nextStatus}`,
                      'Task'
                    );
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  {selectedTaskDetail.status === 'Done' ? (language === 'en' ? "Reopen" : "Buka Kembali") : (language === 'en' ? "Delete / Done" : "Delete")}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Day Tasks Detail Modal (When day cell is clicked in Month view) ── */}
      <AnimatePresence>
        {selectedDayTasks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDayTasks(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar z-10"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {language === 'en' ? "Tasks for:" : "Tugas Tanggal:"} {selectedDayTasks.dateStr}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    {language === 'en' ? `Total ${selectedDayTasks.dateTasks.length} tasks on this date` : `Total ${selectedDayTasks.dateTasks.length} tugas pada tanggal ini`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDayTasks(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5">
                {selectedDayTasks.dateTasks.map(t => {
                  const statusLabel = language === 'en' ? t.status : (t.status === 'Done' ? 'Selesai' : t.status === 'In Progress' ? 'Sedang Dikerjakan' : 'Belum Dimulai');
                  const priorityLabel = language === 'en' ? t.priority : (t.priority === 'High' ? 'Tinggi' : t.priority === 'Medium' ? 'Sedang' : 'Rendah');
                  const typeLabel = language === 'en' ? t.type : (t.type === 'Maintenance' ? 'Pemeliharaan' : 'Pengembangan');

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedDayTasks(null);
                        setSelectedTaskDetail(t);
                      }}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 hover:border-blue-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                          t.status === 'Done' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {statusLabel}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                        <span>{language === 'en' ? "Priority:" : "Prioritas:"} {priorityLabel}</span>
                        <span>{language === 'en' ? "Type:" : "Tipe:"} {typeLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
