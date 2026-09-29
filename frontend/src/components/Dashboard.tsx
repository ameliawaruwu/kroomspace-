import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Upload,
  ShieldCheck,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Play,
  Check,
  User as UserIcon,
  Activity,
  Layers,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Task, User, Project } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  tasks: Task[];
  users: User[];
  projects?: Project[];
  user: User;
  darkMode: boolean;
  notifications: any[];
  onUpdateTask: (task: Task) => void;
  onViewAll: () => void;
}

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible opacity-70 group-hover:opacity-100 transition-opacity duration-300">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
    <div className="flex justify-between items-center pt-2">
      <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  users, 
  projects,
  user, 
  darkMode, 
  notifications,
  onUpdateTask,
  onViewAll
}) => {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [executingTask, setExecutingTask] = useState<Task | null>(null);
  const [completeNote, setCompleteNote] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'Admin';

  // Calculate local dashboard data dynamically from database-synced props
  const myTasksList = tasks.filter(t => {
    if (isAdmin) return true;
    const isAssignee = String(t.assignee) === String(user.id) || t.assignee === user.name || t.assignee === user.email;
    const isContributor = t.contributors?.some((c: any) => String(c) === String(user.id));
    const project = projects?.find(p => p.id === t.projectId);
    const isProjectMember = project?.anggota?.some((a: any) => {
      const targetId = typeof a === 'object' && a !== null ? (a.id_pengguna || a.id) : a;
      return String(targetId) === String(user.id);
    }) || String(project?.id_pengguna) === String(user.id);
    return isAssignee || isContributor || isProjectMember;
  });

  const completedTasks = myTasksList.filter(t => t.status === 'Done');
  const totalCompleted = completedTasks.length;

  const completedWithDeadline = completedTasks.filter(t => t.deadline);
  const completedOnTime = completedWithDeadline.filter(t => {
    const dl = new Date(t.deadline!);
    const up = new Date(t.updatedAt || t.createdAt);
    return up <= dl;
  });
  const onTimeRate = completedWithDeadline.length > 0 
    ? Math.round((completedOnTime.length / completedWithDeadline.length) * 100) 
    : 100;

  const activeTasks = myTasksList.filter(t => t.status !== 'Done');
  const now = new Date();
  const overdueTasks = activeTasks.filter(t => t.deadline && new Date(t.deadline) < now);
  const blockedTasks = activeTasks.filter(t => t.isBlocked);
  const healthyTasksCount = myTasksList.length - overdueTasks.length - blockedTasks.length;
  const aiProjectHealth = myTasksList.length > 0
    ? Math.max(0, Math.round((healthyTasksCount / myTasksList.length) * 100))
    : 100;

  // Helper: Cek apakah sebuah kartu tugas kanban berkategori Maintenance / Perbaikan
  const isMaintenanceTask = (t: Task) => {
    const proj = projects?.find(p => p.id === t.projectId);
    const tType = ((t.type || (t as any).category || '') as string).toLowerCase().trim();
    const pType = ((proj?.type || '') as string).toLowerCase().trim();
    return (
      tType === 'maintenance' ||
      tType === 'perbaikan' ||
      pType === 'maintenance' ||
      pType === 'perbaikan' ||
      proj?.mode === 'Operational'
    );
  };

  // Helper bobot prioritas: High (3) -> Medium (2) -> Low (1)
  const getPriorityWeight = (priority?: string): number => {
    const p = (priority || '').toLowerCase().trim();
    if (p === 'high' || p === 'tinggi' || p === 'urgent' || p === 'darurat') return 3;
    if (p === 'medium' || p === 'sedang') return 2;
    if (p === 'low' || p === 'rendah') return 1;
    return 0;
  };

  // Ambil kartu kanban proyek yang berkategori maintenance
  const maintenanceTaskPool = (tasks && tasks.length > 0) ? tasks : myTasksList;
  const maintenanceCards = maintenanceTaskPool.filter(isMaintenanceTask);

  // Tiket Perbaikan Aktif (yang belum selesai / status bukan Done)
  const activeMaintenanceCards = maintenanceCards.filter(t => t.status !== 'Done');
  const openMaintenanceTickets = activeMaintenanceCards.length;

  const sparklineCompleted: number[] = [];
  const sparklineOnTimeRate: number[] = [];
  const sparklineHealth: number[] = [];
  const sparklineMaintenance: number[] = [];
  const trendChart: { date: string; completed: number; active: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'short', day: 'numeric' });
    d.setHours(23, 59, 59, 999);
    const cutoff = d;
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);

    const complUpToCutoff = completedTasks.filter(t => new Date(t.updatedAt || t.createdAt) <= cutoff);
    sparklineCompleted.push(complUpToCutoff.length);

    const complDeadlineUpToCutoff = complUpToCutoff.filter(t => t.deadline);
    const onTimeUpToCutoff = complDeadlineUpToCutoff.filter(t => new Date(t.updatedAt || t.createdAt) <= new Date(t.deadline!));
    sparklineOnTimeRate.push(complDeadlineUpToCutoff.length > 0 ? Math.round((onTimeUpToCutoff.length / complDeadlineUpToCutoff.length) * 100) : 100);

    const tasksUpToCutoff = myTasksList.filter(t => new Date(t.createdAt) <= cutoff);
    const activeUpToCutoff = tasksUpToCutoff.filter(t => t.status !== 'Done' || new Date(t.updatedAt || t.createdAt) > cutoff);
    const overdueUpToCutoff = activeUpToCutoff.filter(t => t.deadline && new Date(t.deadline) < cutoff);
    const blockedUpToCutoff = activeUpToCutoff.filter(t => t.isBlocked);
    const healthVal = tasksUpToCutoff.length > 0
      ? Math.max(0, Math.round(((tasksUpToCutoff.length - overdueUpToCutoff.length - blockedUpToCutoff.length) / tasksUpToCutoff.length) * 100))
      : 100;
    sparklineHealth.push(healthVal);

    const maintActive = activeUpToCutoff.filter(isMaintenanceTask).length;
    sparklineMaintenance.push(maintActive);

    const completedOnThisDay = completedTasks.filter(t => {
      const dateVal = new Date(t.updatedAt || t.createdAt);
      return dateVal >= startOfDay && dateVal <= cutoff;
    }).length;

    trendChart.push({
      date: dateStr,
      completed: completedOnThisDay,
      active: activeUpToCutoff.length
    });
  }

  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const twoWeeksAgoDate = new Date();
  twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);

  const completedLastWeek = completedTasks.filter(t => new Date(t.updatedAt || t.createdAt) >= lastWeekDate).length;
  const completedPrevWeek = completedTasks.filter(t => {
    const dateVal = new Date(t.updatedAt || t.createdAt);
    return dateVal >= twoWeeksAgoDate && dateVal < lastWeekDate;
  }).length;

  let completedTrend = 0;
  if (completedPrevWeek > 0) {
    completedTrend = Math.round(((completedLastWeek - completedPrevWeek) / completedPrevWeek) * 100);
  } else if (completedLastWeek > 0) {
    completedTrend = 100;
  }
  const onTimeRateTrend = onTimeRate >= 90 ? 3 : -2;
  const healthTrend = aiProjectHealth >= 80 ? 2 : -5;
  const maintTrend = openMaintenanceTickets > 8 ? 12 : -5;

  const statuses: string[] = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
  const statusDistribution = statuses.map(status => ({
    name: status,
    value: myTasksList.filter(t => t.status === status).length
  }));

  const teamActivity = (notifications || []).slice(0, 6).map(n => {
    const foundUser = users?.find(u => u.id === n.userId);
    return {
      id: n.id,
      user: {
        name: foundUser?.name || n.userName || 'User',
        avatar: foundUser?.avatar || n.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundUser?.name || 'User'}`
      },
      action: n.message || n.text,
      time: n.time || n.timestamp || new Date().toISOString(),
      type: n.type || 'Task'
    };
  });

  // Urutkan kartu kanban proyek kategori maintenance:
  // DIUTAMAKAN PRIORITAS TINGGI (High) BARU KE TERENDAH (Low)
  const sortedMaintenanceTasks = [...maintenanceCards].sort((a, b) => {
    // 1. Prioritas: Tinggi (High) -> Sedang (Medium) -> Rendah (Low)
    const pA = getPriorityWeight(a.priority);
    const pB = getPriorityWeight(b.priority);
    if (pB !== pA) return pB - pA;

    // 2. Tiket yang masih aktif (belum Done) didahulukan daripada yang selesai
    const isADone = a.status === 'Done';
    const isBDone = b.status === 'Done';
    if (!isADone && isBDone) return -1;
    if (isADone && !isBDone) return 1;

    // 3. Waktu pembuatan terbaru
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const maintenanceOverview = sortedMaintenanceTasks
    .slice(0, 6)
    .map(t => {
      const assigneeUser = users?.find(u => u.id === t.assignee);
      const project = projects?.find(p => p.id === t.projectId);
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectName: project?.name,
        assignee: assigneeUser ? {
          name: assigneeUser.name,
          avatar: assigneeUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assigneeUser.name}`
        } : null,
        deadline: t.deadline
      };
    });

  const dashboardData = {
    kpis: {
      taskCompleted: {
        value: totalCompleted,
        trend: completedTrend,
        sparkline: sparklineCompleted
      },
      onTimeRate: {
        value: onTimeRate,
        trend: onTimeRateTrend,
        sparkline: sparklineOnTimeRate
      },
      aiProjectHealth: {
        value: aiProjectHealth,
        trend: healthTrend,
        sparkline: sparklineHealth
      },
      openMaintenance: {
        value: openMaintenanceTickets,
        trend: maintTrend,
        sparkline: sparklineMaintenance
      }
    },
    charts: {
      statusDistribution,
      trendChart
    },
    teamActivity,
    maintenanceOverview
  };

  const fetchDashboardData = async (showIndicator = false) => {
    if (showIndicator) {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Handle manual execute or task done
  const handleExecute = (task: Task) => {
    if (task.status === 'To Do' || task.status === 'Backlog') {
      const updated: Task = { 
        ...task, 
        status: 'In Progress' as const, 
        assignee: task.assignee || user.id,
        updatedAt: new Date().toISOString() 
      };
      onUpdateTask(updated);
      setTimeout(() => fetchDashboardData(false), 500);
    } else if (task.status === 'In Progress' || task.status === 'Review') {
      setExecutingTask(task);
    }
  };

  const submitCompletion = () => {
    if (!executingTask) return;
    const updated = { 
      ...executingTask, 
      status: 'Done' as const, 
      updatedAt: new Date().toISOString(),
      notes: completeNote 
    };
    onUpdateTask(updated);
    setExecutingTask(null);
    setCompleteNote('');
    setAttachedFile(null);
    setTimeout(() => fetchDashboardData(false), 500);
  };

  // Helper cek apakah tugas ditugaskan langsung ke pengguna
  const isDirectlyAssignedToMe = (t: Task) => {
    return (
      String(t.assignee) === String(user.id) ||
      t.assignee === user.name ||
      t.assignee === user.email ||
      t.contributors?.some((c: any) => String(c) === String(user.id))
    );
  };

  const getStatusWeight = (status: string) => {
    switch (status) {
      case 'In Progress': return 4;
      case 'Review': return 3;
      case 'To Do': return 2;
      case 'Backlog': return 1;
      default: return 0;
    }
  };

  // Tugas aktif yang ada di papan kanban proyek pengguna
  const myActiveTasks = tasks.length > 0 ? (() => {
    // Ambil tugas kanban yang relevan (dari proyek/kanban board pengguna)
    const taskPool = (myTasksList && myTasksList.length > 0) ? myTasksList : tasks;
    const activeTasks = taskPool.filter(t => t.status !== 'Done');

    return [...activeTasks].sort((a, b) => {
      // 1. Tugas yang ditugaskan langsung ke pengguna didahulukan
      const aDirect = isDirectlyAssignedToMe(a) ? 1 : 0;
      const bDirect = isDirectlyAssignedToMe(b) ? 1 : 0;
      if (bDirect !== aDirect) return bDirect - aDirect;

      // 2. Status pekerjaan: In Progress -> Review -> To Do -> Backlog
      const sA = getStatusWeight(a.status);
      const sB = getStatusWeight(b.status);
      if (sB !== sA) return sB - sA;

      // 3. Bobot prioritas: High -> Medium -> Low
      const pA = getPriorityWeight(a.priority);
      const pB = getPriorityWeight(b.priority);
      if (pB !== pA) return pB - pA;

      // 4. Waktu pembuatan terbaru
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }).slice(0, 6);
  })() : [];

  // Colors
  const COLORS = {
    primary: '#2563EB', // Enterprise SaaS Blue
    success: '#10B981', // emerald-500
    info: '#3B82F6', // blue-500
    warning: '#F59E0B', // amber-500
    danger: '#EF4444', // rose-500
    purple: '#8B5CF6' // purple-500
  };

  const pieColors = ['#6366F1', '#0EA5E9', '#F43F5E', '#F59E0B', '#10B981'];

  // Format activity timestamp relative
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return language === 'en' ? 'Just now' : 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return language === 'en' ? `${minutes}m ago` : `${minutes}m lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return language === 'en' ? `${hours}h ago` : `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return language === 'en' ? `${days}d ago` : `${days} hari lalu`;
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300">
      
      <header className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 md:px-8 py-5 border-b sticky top-0 z-30 backdrop-blur-md transition-all",
        darkMode ? "bg-[#0D1B35]/90 border-slate-800" : "bg-white/90 border-slate-100"
      )}>
        <div>
          <h1 className={cn("text-2xl font-extrabold tracking-tight", darkMode ? "text-white" : "text-slate-900")}>
            {language === 'en' ? 'Welcome, ' : 'Selamat Datang, '}
            <span className="text-[#3498DB]">{user.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {isAdmin && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest",
              darkMode ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-600"
            )}>
              <ShieldCheck size={13} />
              Admin Mode
            </div>
          )}
          <button 
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className={cn(
              "p-2.5 rounded-xl border transition-all active:scale-95",
              darkMode 
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700" 
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            )}
            title="Refresh Data"
          >
            <RefreshCw size={15} className={cn("transition-transform duration-700", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 md:px-8 space-y-8">

        {/* 4 Smart KPI Cards */}
        <section className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:sticky lg:top-14 lg:md:top-16 lg:z-20 py-4 -my-4 backdrop-blur-md transition-all duration-300",
          darkMode ? "bg-slate-900/95" : "bg-slate-50/95"
        )}>
          {loading || !dashboardData ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* Card 1: Task Completed */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={cn(
                  "p-6 rounded-2xl border shadow-sm flex flex-col justify-between group transition-all duration-300",
                  darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {language === 'en' ? 'Task Completed' : 'Tugas Selesai'}
                    </span>
                    <h3 className={cn("text-3xl font-extrabold mt-1", darkMode ? "text-white" : "text-slate-900")}>
                      {dashboardData.kpis.taskCompleted.value}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className="flex justify-between items-end mt-6 gap-2">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'en' ? 'vs prev week' : 'vs minggu lalu'}
                  </div>
                  <Sparkline data={dashboardData.kpis.taskCompleted.sparkline} color={COLORS.success} />
                </div>
              </motion.div>

              {/* Card 2: On-Time Rate */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={cn(
                  "p-6 rounded-2xl border shadow-sm flex flex-col justify-between group transition-all duration-300",
                  darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {language === 'en' ? 'On-Time Rate' : 'Rasio Tepat Waktu'}
                    </span>
                    <h3 className={cn("text-3xl font-extrabold mt-1", darkMode ? "text-white" : "text-slate-900")}>
                      {dashboardData.kpis.onTimeRate.value}%
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <Clock size={20} />
                  </div>
                </div>
                <div className="flex justify-between items-end mt-6 gap-2">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'en' ? 'vs prev rate' : 'vs rasio lalu'}
                  </div>
                  <Sparkline data={dashboardData.kpis.onTimeRate.sparkline} color={COLORS.info} />
                </div>
              </motion.div>

              {/* Card 3: Project Health */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={cn(
                  "p-6 rounded-2xl border shadow-sm flex flex-col justify-between group transition-all duration-300",
                  darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {language === 'en' ? 'Project Health' : 'Kesehatan Proyek'}
                    </span>
                    <h3 className={cn("text-3xl font-extrabold mt-1", darkMode ? "text-white" : "text-slate-900")}>
                      {dashboardData.kpis.aiProjectHealth.value}%
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                    <Activity size={20} />
                  </div>
                </div>
                <div className="flex justify-between items-end mt-6 gap-2">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'en' ? 'vs yesterday' : 'vs kemarin'}
                  </div>
                  <Sparkline data={dashboardData.kpis.aiProjectHealth.sparkline} color={COLORS.purple} />
                </div>
              </motion.div>

              {/* Card 4: Open Maintenance Tickets */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={cn(
                  "p-6 rounded-2xl border shadow-sm flex flex-col justify-between group transition-all duration-300",
                  darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {language === 'en' ? 'Open Maintenance' : 'Tiket Perbaikan Aktif'}
                    </span>
                    <h3 className={cn("text-3xl font-extrabold mt-1", darkMode ? "text-white" : "text-slate-900")}>
                      {dashboardData.kpis.openMaintenance.value}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                    <Wrench size={20} />
                  </div>
                </div>
                <div className="flex justify-between items-end mt-6 gap-2">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'en' ? 'vs prev week' : 'vs minggu lalu'}
                  </div>
                  <Sparkline data={dashboardData.kpis.openMaintenance.sparkline} color={COLORS.warning} />
                </div>
              </motion.div>
            </>
          )}
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Task Completion Trend */}
          <div className={cn(
            "lg:col-span-2 p-6 rounded-2xl border shadow-sm",
            darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
          )}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className={cn("text-base font-extrabold", darkMode ? "text-white" : "text-slate-900")}>
                  {language === 'en' ? 'Task Completion Trend' : 'Tren Penyelesaian Tugas'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {language === 'en' ? 'Daily metrics for active and completed tasks' : 'Metrik harian tugas aktif dan diselesaikan'}
                </p>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              {loading || !dashboardData ? (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-700/40 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.charts.trendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    />
                    <ChartTooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        color: darkMode ? '#f8fafc' : '#0f172a',
                        fontFamily: 'Poppins',
                        fontSize: '11px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke={COLORS.success} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCompleted)" 
                      name={language === 'en' ? 'Completed' : 'Selesai'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="active" 
                      stroke={COLORS.purple} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorActive)" 
                      name={language === 'en' ? 'Active' : 'Aktif'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Task Status Distribution */}
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm flex flex-col justify-between",
            darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
          )}>
            <div>
              <h3 className={cn("text-base font-extrabold", darkMode ? "text-white" : "text-slate-900")}>
                {language === 'en' ? 'Status Distribution' : 'Distribusi Status'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                {language === 'en' ? 'Task breakdown across workflow columns' : 'Pembagian tugas berdasarkan kolom alur kerja'}
              </p>
            </div>

            <div className="h-[180px] w-full flex items-center justify-center relative">
              {loading || !dashboardData ? (
                <div className="w-32 h-32 rounded-full border-8 border-slate-100 dark:border-slate-700 border-t-blue-500 animate-spin" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.charts.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {dashboardData.charts.statusDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center percentage/total */}
                  <div className="absolute text-center">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{language === 'en' ? 'Total' : 'Total'}</p>
                    <p className={cn("text-2xl font-black", darkMode ? "text-white" : "text-slate-900")}>
                      {dashboardData.charts.statusDistribution.reduce((acc: number, cur: any) => acc + cur.value, 0)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Custom Legend */}
            {!loading && dashboardData && (
              <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-bold text-slate-400">
                {dashboardData.charts.statusDistribution.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-1.5 truncate">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                    <span className="truncate">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Bottom Panel Section (3 Columns) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: My Tasks Panel */}
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm flex flex-col justify-between",
            darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
          )}>
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={cn("text-base font-extrabold flex items-center gap-2", darkMode ? "text-white" : "text-slate-900")}>
                  <div className="w-1.5 h-5 rounded-full bg-blue-600" />
                  {t('myTasks')}
                </h3>
                <button 
                  onClick={onViewAll} 
                  className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline transition-all"
                >
                  {t('viewAll')}
                </button>
              </div>

              <div className="space-y-3">
                {myActiveTasks.length > 0 ? (
                  myActiveTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleExecute(task)}
                      className={cn(
                        "group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5",
                        darkMode 
                          ? "bg-slate-900/40 border-slate-800 hover:border-blue-500/30 hover:bg-slate-900/70" 
                          : "bg-slate-50 border-slate-100 hover:border-blue-500/20 hover:bg-white hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          task.priority === 'High' ? "bg-red-500" :
                          task.priority === 'Medium' ? "bg-amber-500" : "bg-blue-400"
                        )} />
                        <div className="min-w-0">
                          <h4 className={cn("text-xs font-bold truncate group-hover:text-blue-600 transition-colors", darkMode ? "text-white" : "text-slate-800")}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase",
                              task.status === 'In Progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                              task.status === 'To Do' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                              task.status === 'Review' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" :
                              "bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              {task.status}
                            </span>
                            <span>•</span>
                            <span className="truncate">{task.projectId ? projects?.find(p=>p.id === task.projectId)?.name || 'KroomSpace' : 'KroomSpace'}</span>
                            {task.deadline && (
                              <>
                                <span>•</span>
                                <span className="text-rose-500 font-bold">{task.deadline.split('T')[0]}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecute(task);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors shrink-0"
                      >
                        {task.status === 'In Progress' ? <Check size={14} className="text-emerald-500" /> : <Play size={12} className="text-blue-500 fill-blue-500" />}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle2 size={36} className="mb-2 text-emerald-500 opacity-60" />
                    <p className="text-xs font-bold">{t('allTasksDone')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Recent Team Activity Timeline */}
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm flex flex-col justify-between",
            darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
          )}>
            <div>
              <h3 className={cn("text-base font-extrabold flex items-center gap-2 mb-6", darkMode ? "text-white" : "text-slate-900")}>
                <Activity size={16} className="text-blue-600" />
                {t('teamActivity')}
              </h3>

              <div className="relative border-l border-slate-100 dark:border-slate-800/80 ml-2.5 pl-5 space-y-5">
                {loading || !dashboardData ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3 items-center animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  dashboardData.teamActivity.length > 0 ? (
                    dashboardData.teamActivity.map((act: any) => (
                      <div key={act.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 bg-blue-600" />
                        
                        <div className="flex gap-3 min-w-0">
                          <img 
                            src={act.user.avatar} 
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 object-cover" 
                            alt={act.user.name} 
                          />
                          <div className="min-w-0">
                            <p className={cn("text-xs font-semibold leading-relaxed", darkMode ? "text-slate-300" : "text-slate-700")}>
                              <span className={cn("font-bold mr-1", darkMode ? "text-white" : "text-slate-900")}>{act.user.name}</span>
                              {act.action}
                            </p>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                              {formatTimeAgo(act.time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <p className="text-xs font-semibold">{language === 'en' ? 'No recent activities' : 'Tidak ada aktivitas baru'}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Maintenance Overview Section */}
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm flex flex-col justify-between",
            darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100"
          )}>
            <div>
              <h3 className={cn("text-base font-extrabold flex items-center gap-2 mb-6", darkMode ? "text-white" : "text-slate-900")}>
                <Wrench size={16} className="text-amber-500" />
                {language === 'en' ? 'Maintenance Overview' : 'Ikhtisar Perbaikan'}
              </h3>

              <div className="space-y-3.5">
                {loading || !dashboardData ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 bg-slate-100 dark:bg-slate-700/20 rounded-xl animate-pulse">
                      <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                      <div className="flex gap-2 justify-between">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  dashboardData.maintenanceOverview.length > 0 ? (
                    dashboardData.maintenanceOverview.map((item: any) => (
                      <div 
                        key={item.id}
                        className={cn(
                          "p-3.5 rounded-xl border flex flex-col justify-between gap-3 hover:shadow-md transition-all duration-300",
                          darkMode ? "bg-slate-900/20 border-slate-800" : "bg-slate-50 border-slate-100"
                        )}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("text-xs font-bold line-clamp-2", darkMode ? "text-white" : "text-slate-800")}>
                              {item.title}
                            </h4>
                            {item.projectName && (
                              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                {item.projectName}
                              </p>
                            )}
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0",
                            item.priority === 'High' ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                            item.priority === 'Medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                            "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          )}>
                            {item.priority}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <div className="flex items-center gap-1.5">
                            {item.assignee ? (
                              <>
                                <img 
                                  src={item.assignee.avatar} 
                                  className="w-4 h-4 rounded-full" 
                                  alt={item.assignee.name} 
                                />
                                <span className="truncate max-w-[80px]">{item.assignee.name}</span>
                              </>
                            ) : (
                              <span className="italic">{language === 'en' ? 'Unassigned' : 'Belum Ditugasi'}</span>
                            )}
                          </div>
                          
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold",
                            item.status === 'Done' ? "text-emerald-500" :
                            item.status === 'In Progress' ? "text-blue-500" : "text-slate-400"
                          )}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                      <Wrench size={32} className="mb-2 opacity-40" />
                      <p className="text-xs font-semibold">{language === 'en' ? 'No active tickets' : 'Tidak ada tiket aktif'}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Task Completion Modal */}
      <AnimatePresence>
        {executingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn("w-full max-w-md rounded-2xl p-8 shadow-2xl border flex flex-col gap-6", darkMode ? "bg-[#152844] border-slate-800" : "bg-white border-slate-100")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className={cn("text-lg font-bold", darkMode ? "text-white" : "text-slate-900")}>{t('completeTask')}</h3>
              </div>
              <p className={cn("text-xs font-medium leading-relaxed -mt-2", darkMode ? "text-slate-400" : "text-slate-500")}>{executingTask.title}</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">{t('workNotes')}</label>
                  <textarea 
                    value={completeNote}
                    onChange={(e) => setCompleteNote(e.target.value)}
                    placeholder={t('workNotesPlaceholder')}
                    className={cn(
                      "w-full rounded-xl p-3 text-xs border outline-none transition-all h-24 resize-none font-medium",
                      darkMode 
                        ? "bg-slate-900/60 border-slate-800 text-white focus:border-blue-500/50" 
                        : "bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500/50 focus:bg-white"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">
                    {t('uploadProof')}
                  </label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAttachedFile(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30 overflow-hidden",
                      darkMode 
                        ? "border-slate-850 bg-slate-900/20" 
                        : "border-slate-200 bg-slate-50"
                    )}
                  >
                    {attachedFile ? (
                      <div className="w-full aspect-video rounded-lg overflow-hidden">
                        <img src={attachedFile} className="w-full h-full object-cover" alt="Proof" />
                      </div>
                    ) : (
                      <>
                        <Upload size={22} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400">
                          {t('clickOrDragToUpload')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setExecutingTask(null);
                      setCompleteNote('');
                      setAttachedFile(null);
                    }}
                    className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all", darkMode ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={submitCompletion}
                    className="flex-[2] py-3 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                  >
                    {t('saveAndFinish')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
