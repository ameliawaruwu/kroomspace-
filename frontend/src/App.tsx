import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskTemplates } from './components/TaskTemplates';
import { Notifications } from './components/Notifications';
import { Auth } from './components/Auth';
import { AdminPanel } from './components/AdminPanel';
import { LandingPage } from './components/LandingPage';
import { ProfileSettings } from './components/ProfileSettings';
import { ApiKeySettings } from './components/ApiKeySettings';
import { CalendarView } from './components/CalendarView';
import { mockUsers as initialUsers, mockTasks, mockProjects, mockNotifications } from './services/apiService';
import { Task, Project, User, Notification } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ShieldCheck, User as UserIcon, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { cn } from './lib/utils';
import { useLanguage } from './context/LanguageContext';

function sortTasksBySavedOrder(tasksArray: any[]): any[] {
  const projectsGroup: { [key: string]: any[] } = {};
  tasksArray.forEach(task => {
    if (!projectsGroup[task.projectId]) {
      projectsGroup[task.projectId] = [];
    }
    projectsGroup[task.projectId].push(task);
  });

  const sortedTasks: any[] = [];

  Object.keys(projectsGroup).forEach(projId => {
    const projTasks = projectsGroup[projId];
    const savedOrderJson = localStorage.getItem(`task_order_${projId}`);
    if (savedOrderJson) {
      try {
        const orderIds: string[] = JSON.parse(savedOrderJson);
        const orderMap = new Map<string, number>();
        orderIds.forEach((id, index) => {
          orderMap.set(id, index);
        });

        projTasks.sort((a, b) => {
          const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
          const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
          return indexA - indexB;
        });
      } catch (e) {
        console.error("Failed to parse saved task order", e);
      }
    }
    sortedTasks.push(...projTasks);
  });

  return sortedTasks;
}

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users');
    let currentUsers = saved ? JSON.parse(saved) : initialUsers;
    
    // Safety sync: Ensure mock users passwords are updated if they were changed in apiService
    const syncedUsers = currentUsers.map((u: User) => {
      const initialMatch = initialUsers.find(iu => iu.email === u.email);
      if (initialMatch && initialMatch.password !== u.password) {
        return { ...u, password: initialMatch.password };
      }
      return u;
    });

    return syncedUsers;
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : initialUsers[0];
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [successToast, setSuccessToast] = useState<{message: string, show: boolean}>({ message: '', show: false });
  const [notifications, setNotifications] = useState<any[]>(() => {
    return [
      ...mockNotifications,
      { 
        id: 'crm-init', 
        userId: '1',
        type: 'CRM', 
        message: 'Keluhan CRM Baru: Pengguna melaporkan masalah login', 
        timestamp: new Date().toISOString(), 
        read: false,
        actionRequired: 'view',
        badge: 'URGENT'
      }
    ];
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isLoggedIn) {
      setShowLanding(false);
      setIsLoadingData(true);
      
      // Fetch users
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUsers(data);
            const freshUser = data.find(u => u.id === currentUser.id);
            if (freshUser) {
              setCurrentUser(freshUser);
            }
          }
        })
        .catch(console.error);

      // Fetch projects and tasks in parallel, then mark loading as done
      const projFetch = fetch('/api/proyek?userId=' + currentUser.id)
        .then(res => res.json())
        .then(data => {
           if (Array.isArray(data)) {
             const mappedProjects = data.map((p:any) => ({
                id: p.id_proyek,
                name: p.nama_proyek,
                description: p.deskripsi,
                createdAt: p.dibuat_pada,
                type: p.tipe_tugas,
                mode: p.mode_kanban,
                columns: p.kolom_papan?.map((c:any) => ({ id: c.id_kolom, title: c.judul_kolom, status: c.status_tugas, order: c.urutan })),
                anggota: p.anggota,
                id_pengguna: p.id_pengguna,
                apakah_selesai: p.apakah_selesai
             }));
             setProjects(mappedProjects);
             if (mappedProjects.length > 0) {
               setCurrentProjectId(mappedProjects[0].id);
             } else {
               setCurrentProjectId('');
             }
           }
        })
        .catch(console.error);
      
      const taskFetch = fetch('/api/tugas?userId=' + currentUser.id)
        .then(res => res.json())
        .then(data => {
           if (Array.isArray(data)) {
              const mappedTasks = data.map((t:any) => ({
                id: t.id_tugas,
                title: t.judul_tugas,
                description: t.deskripsi,
                status: t.status,
                priority: t.prioritas,
                type: t.tipe,
                projectId: t.id_proyek,
                assignee: t.id_penanggung_jawab,
                createdAt: t.dibuat_pada,
                startDate: t.tanggal_mulai ? new Date(t.tanggal_mulai).toISOString().split('T')[0] : undefined,
                deadline: t.tanggal_selesai ? new Date(t.tanggal_selesai).toISOString().split('T')[0] : undefined,
                isBlocked: t.apakah_diblokir,
                blockReason: t.alasan_diblokir,
                checklist: t.daftar_periksa?.map((c:any) => ({ 
                  id: c.id_periksa, 
                  text: c.teks_periksa, 
                  completed: c.apakah_selesai,
                  startDate: c.tanggal_mulai ? new Date(c.tanggal_mulai).toISOString().split('T')[0] : undefined,
                  endDate: c.tanggal_selesai ? new Date(c.tanggal_selesai).toISOString().split('T')[0] : undefined
                })) || [],
                comments: t.komentar?.map((c:any) => ({ id: c.id_komentar, userId: c.id_pengguna, text: c.isi_komentar, timestamp: c.dibuat_pada })) || [],
                attachments: t.lampiran?.map((a:any) => ({ id: a.id_lampiran, name: a.nama_file, url: a.tautan_url, type: a.tipe_lampiran, createdAt: a.dibuat_pada })) || [],
                contributors: t.kontributor?.map((c:any) => c.id_pengguna) || [],
             }));
             setTasks(sortTasksBySavedOrder(mappedTasks));
           }
        })
        .catch(console.error);

      Promise.allSettled([projFetch, taskFetch]).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [isLoggedIn]);

  // Polling for tasks and notifications every 5 seconds for real-time monitoring
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUpdates = () => {
      // Fetch tasks
      fetch('/api/tugas?userId=' + currentUser.id)
        .then(res => res.json())
        .then(data => {
           if (Array.isArray(data)) {
              const mappedTasks = data.map((t:any) => ({
                id: t.id_tugas,
                title: t.judul_tugas,
                description: t.deskripsi,
                status: t.status,
                priority: t.prioritas,
                type: t.tipe,
                projectId: t.id_proyek,
                assignee: t.id_penanggung_jawab,
                createdAt: t.dibuat_pada,
                startDate: t.tanggal_mulai ? new Date(t.tanggal_mulai).toISOString().split('T')[0] : undefined,
                deadline: t.tanggal_selesai ? new Date(t.tanggal_selesai).toISOString().split('T')[0] : undefined,
                isBlocked: t.apakah_diblokir,
                blockReason: t.alasan_diblokir,
                checklist: t.daftar_periksa?.map((c:any) => ({ 
                  id: c.id_periksa, 
                  text: c.teks_periksa, 
                  completed: c.apakah_selesai,
                  startDate: c.tanggal_mulai ? new Date(c.tanggal_mulai).toISOString().split('T')[0] : undefined,
                  endDate: c.tanggal_selesai ? new Date(c.tanggal_selesai).toISOString().split('T')[0] : undefined
                })) || [],
                comments: t.komentar?.map((c:any) => ({ id: c.id_komentar, userId: c.id_pengguna, text: c.isi_komentar, timestamp: c.dibuat_pada })) || [],
                attachments: t.lampiran?.map((a:any) => ({ id: a.id_lampiran, name: a.nama_file, url: a.tautan_url, type: a.tipe_lampiran, createdAt: a.dibuat_pada })) || [],
                contributors: t.kontributor?.map((c:any) => c.id_pengguna) || [],
             }));
              setTasks(sortTasksBySavedOrder(mappedTasks));
           }
        })
        .catch(console.error);

      // Fetch notifications
      fetch('/api/notifikasi?userId=' + currentUser.id)
        .then(res => res.json())
        .then(data => {
           if (Array.isArray(data)) {
              const mappedNotifs = data.map((n:any) => ({
                id: n.id_notifikasi,
                message: n.pesan,
                type: n.tipe,
                timestamp: n.waktu,
                read: n.sudah_dibaca,
                userId: n.id_pengguna,
                taskId: n.id_tugas,
                badge: n.badge,
                actionRequired: n.aksi_diperlukan
             }));
              setNotifications(mappedNotifs);
           }
        })
        .catch(console.error);
    };

    fetchUpdates(); // Run immediately

    const interval = setInterval(fetchUpdates, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [isLoggedIn, currentUser]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLanding(true);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowLanding(false);
  };

  const showSuccess = (message: string) => {
    setSuccessToast({ message, show: true });
    setTimeout(() => setSuccessToast({ message: '', show: false }), 3000);
  };

  const handleUpdateProfile = async (updatedUser: User, currentPassword?: string, newPassword?: string) => {
    try {
      const res = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
          'X-User-Role': currentUser.role
        },
        body: JSON.stringify({
          name: updatedUser.name,
          email: updatedUser.email,
          whatsapp: updatedUser.whatsapp,
          avatar: updatedUser.avatar,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal memperbarui profil' };
      }

      const syncedUser = {
        ...updatedUser,
        password: data.password,
        whatsapp: data.whatsapp
      };

      setUsers(prev => prev.map(u => u.id === syncedUser.id ? syncedUser : u));
      setCurrentUser(syncedUser);
      showSuccess(t('success'));
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Terjadi kesalahan jaringan' };
    }
  };

  if (showLanding && !isLoggedIn) {
    return (
      <LandingPage 
        onStart={() => setShowLanding(false)} 
        language={language} 
        setLanguage={setLanguage} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <Auth 
        onLogin={handleLogin} 
        users={users} 
        setUsers={setUsers} 
      />
    );
  }

  const addNotification = (
    message: string, 
    type: Notification['type'], 
    sendWhatsApp: boolean = false, 
    userId?: string, 
    taskId?: string, 
    actionRequired?: Notification['actionRequired'],
    badge?: string
  ) => {
    const newNotif: Notification = {
      id: `n${Date.now()}`,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      whatsappSent: sendWhatsApp,
      userId: userId || currentUser.id,
      taskId,
      actionRequired,
      badge
    };
    
    fetch('/api/notifikasi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_pengguna: newNotif.userId,
        id_tugas: newNotif.taskId || null,
        pesan: newNotif.message,
        tipe: newNotif.type,
        sudah_dibaca: newNotif.read
      })
    }).then(res => res.json()).then(dbNotif => {
      setNotifications(prev => [{ ...newNotif, id: dbNotif.id_notifikasi }, ...prev]);
    }).catch(e => {
      console.error(e);
      setNotifications(prev => [newNotif, ...prev]);
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return (
        <Dashboard 
          tasks={tasks} 
          users={users} 
          projects={projects}
          user={currentUser} 
          darkMode={darkMode} 
          notifications={notifications}
          onUpdateTask={async (updatedTask) => {
            try {
              await fetch(`/api/tugas/${updatedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: updatedTask.status,
                  judul_tugas: updatedTask.title,
                  prioritas: updatedTask.priority,
                  id_penanggung_jawab: updatedTask.assignee || null,
                  tanggal_mulai: updatedTask.startDate,
                  tanggal_selesai: updatedTask.deadline,
                  apakah_diblokir: updatedTask.isBlocked,
                  alasan_diblokir: updatedTask.blockReason
                })
              });
              setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            } catch (e) { console.error(e); }
          }}
          onViewAll={() => setActiveTab('board')}
        />
      );
      case 'board': return (
        <KanbanBoard 
          tasks={tasks.filter(t => t.projectId === currentProjectId)}
          allTasks={tasks}
          setTasks={(newTasks) => {            // newTasks contains only the current project's tasks (from KanbanBoard's internal state)
            // We need to merge them back into global tasks without losing other projects' tasks
            const prevProjectTasks = tasks.filter(t => t.projectId === currentProjectId);
            
            // Check for deleted tasks in this project and remove from DB
            const deletedTasks = prevProjectTasks.filter(pt => !newTasks.some(nt => nt.id === pt.id));
            deletedTasks.forEach(dt => {
              if (dt.id && !dt.id.startsWith('t') && !dt.id.startsWith('temp-')) {
                fetch(`/api/tugas/${dt.id}`, { method: 'DELETE' }).catch(console.error);
              }
            });

            newTasks.forEach(task => {
              const oldTask = prevProjectTasks.find(t => t.id === task.id);
              if (oldTask) {
                // Task exists in DB - only PUT if something changed  
                if (JSON.stringify(oldTask) !== JSON.stringify(task)) {
                  fetch(`/api/tugas/${task.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      status: task.status,
                      judul_tugas: task.title,
                      deskripsi: task.description,
                      prioritas: task.priority,
                      id_penanggung_jawab: task.assignee || null,
                      checklist: task.checklist,
                      comments: task.comments,
                      attachments: task.attachments,
                      contributors: task.contributors,
                      tanggal_mulai: task.startDate,
                      tanggal_selesai: task.deadline,
                      apakah_diblokir: task.isBlocked,
                      alasan_diblokir: task.blockReason
                    })
                  }).catch(console.error);

                  if (oldTask.status !== 'Done' && task.status === 'Done') {
                    const assignee = users.find(u => u.id === task.assignee);
                    addNotification(
                      `Tugas "${task.title}" telah selesai dikerjakan`,
                      'Task',
                      !!assignee?.whatsapp,
                      '1',
                      task.id,
                      'view'
                    );
                  }
                }
              } else if (task.id.startsWith('t')) {
                if (!task.title || task.title.trim() === '') return; // Wait for user to enter title
                // Brand new task (temp ID) - POST to create in DB
                fetch('/api/tugas', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id_proyek: task.projectId || currentProjectId,
                    judul_tugas: task.title,
                    deskripsi: task.description || '',
                    status: task.status,
                    prioritas: task.priority,
                    tipe: task.type,
                    id_penanggung_jawab: task.assignee || null,
                    checklist: task.checklist,
                    comments: task.comments,
                    attachments: task.attachments,
                    contributors: task.contributors,
                    tanggal_mulai: task.startDate,
                    tanggal_selesai: task.deadline,
                    apakah_diblokir: task.isBlocked,
                    alasan_diblokir: task.blockReason
                  })
                }).then(res => res.json()).then(dbTask => {
                  if (dbTask.id_tugas) {
                    // Replace temp ID with real DB ID
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, id: dbTask.id_tugas } : t));
                  } else {
                    console.error('POST task failed, removing temp task:', dbTask);
                    // Remove failed temp task so polling will show correct state
                    setTasks(prev => prev.filter(t => t.id !== task.id));
                  }
                }).catch(err => {
                  console.error('Network error creating task:', err);
                  setTasks(prev => prev.filter(t => t.id !== task.id));
                });
              }
            });

            // Merge: keep other projects' tasks, replace current project with newTasks
            // Make sure newTasks all have the correct projectId
            const newTasksWithProject = newTasks.map(t => ({
              ...t,
              projectId: t.projectId || currentProjectId
            }));

            // Save the new task ordering for this project
            const taskIdsOrder = newTasksWithProject.map(t => t.id);
            localStorage.setItem(`task_order_${currentProjectId}`, JSON.stringify(taskIdsOrder));

            setTasks(prevTasks => {
              const otherTasks = prevTasks.filter(t => t.projectId !== currentProjectId);
              const merged = [...otherTasks, ...newTasksWithProject];
              return sortTasksBySavedOrder(merged);
            });
            showSuccess(t('success'));
          }} 
          projects={projects}
          setProjects={setProjects}
          currentProjectId={currentProjectId}
          setCurrentProjectId={setCurrentProjectId}
          isBoardOpen={isBoardOpen}
          setIsBoardOpen={setIsBoardOpen}
          onAddProject={async (project, projectTasks) => {
            try {
              const exists = projects.find(p => p.id === project.id);
              const url = exists ? `/api/proyek/${project.id}` : '/api/proyek';
              const method = exists ? 'PUT' : 'POST';

              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  nama_proyek: project.name,
                  tipe_tugas: project.type,
                  mode_kanban: project.mode,
                  deskripsi: project.description || '',
                  columns: project.columns,
                  userId: currentUser.id
                })
              });
              const newP = await res.json();
              const formattedP = {
                id: newP.id_proyek || project.id,
                name: newP.nama_proyek,
                description: newP.deskripsi,
                type: newP.tipe_tugas,
                members: newP.anggota?.map((a:any) => a.id_pengguna) || [],
                createdAt: newP.dibuat_pada || project.createdAt,
                columns: typeof newP.columns === 'string' ? JSON.parse(newP.columns) : newP.columns,
                apakah_selesai: newP.apakah_selesai
              };

              setProjects(prev => {
                const exists = prev.find(p => p.id === project.id);
                if (exists) return prev.map(p => p.id === project.id ? formattedP : p);
                return [...prev, formattedP];
              });
              
              if (!exists && projectTasks && projectTasks.length > 0) {
                 for (const t of projectTasks) {
                    const taskRes = await fetch('/api/tugas', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                         id_proyek: formattedP.id,
                         judul_tugas: t.title,
                         deskripsi: t.description || '',
                         status: t.status,
                         prioritas: t.priority,
                         tipe: t.type,
                         id_penanggung_jawab: t.assignee || null,
                         checklist: t.checklist,
                         comments: t.comments,
                         attachments: t.attachments,
                         contributors: t.contributors,
                         tanggal_mulai: t.startDate,
                         tanggal_selesai: t.deadline,
                         apakah_diblokir: t.isBlocked,
                         alasan_diblokir: t.blockReason
                      })
                    });
                    const newT = await taskRes.json();
                    setTasks(prev => [...prev, { ...t, id: newT.id_tugas, projectId: formattedP.id }]);
                 }
              }
              setCurrentProjectId(formattedP.id);
              setIsBoardOpen(true);
              showSuccess(t('success'));
            } catch (e) { console.error(e); }
          }}
          user={currentUser}
          darkMode={darkMode}
          onAddNotification={addNotification}
          onSuccess={showSuccess}
        />
      );
      case 'templates': return (
        <TaskTemplates 
          onAddProject={(project, projectTasks) => {
            // Project dan tasks sudah dibuat oleh server via /api/proyek-templates/:id/terapkan
            // Kita hanya perlu update state lokal
            setProjects(prev => {
              const exists = prev.find(p => p.id === project.id);
              if (exists) return prev;
              return [...prev, project];
            });
            if (projectTasks && projectTasks.length > 0) {
              setTasks(prev => [...prev, ...projectTasks]);
            }
            setCurrentProjectId(project.id);
            setIsBoardOpen(true);
            setActiveTab('board');
            showSuccess(`Proyek "${project.name}" berhasil dibuat dari template!`);
          }}
          projects={projects}
          darkMode={darkMode}
          user={currentUser}
        />
      );
      case 'notifications': return (
        <Notifications 
          notifications={notifications}
          setNotifications={setNotifications}
          darkMode={darkMode}
          user={currentUser}
          tasks={tasks}
          onUpdateTask={async (updatedTask) => {
            try {
              await fetch(`/api/tugas/${updatedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: updatedTask.status,
                  judul_tugas: updatedTask.title,
                  prioritas: updatedTask.priority,
                  id_penanggung_jawab: updatedTask.assignee || null,
                  tanggal_mulai: updatedTask.startDate,
                  tanggal_selesai: (updatedTask as any).endDate,
                  apakah_diblokir: updatedTask.isBlocked,
                  alasan_diblokir: updatedTask.blockReason
                })
              });
              setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            } catch (e) { console.error(e); }
          }}
        />
      );
      case 'calendar': return (
        <CalendarView
          tasks={tasks}
          projects={projects}
          users={users}
          user={currentUser}
          darkMode={darkMode}
          onUpdateTask={async (updatedTask) => {
            try {
              await fetch(`/api/tugas/${updatedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: updatedTask.status,
                  judul_tugas: updatedTask.title,
                  prioritas: updatedTask.priority,
                  id_penanggung_jawab: updatedTask.assignee || null,
                  tanggal_mulai: updatedTask.startDate,
                  tanggal_selesai: updatedTask.deadline,
                  apakah_diblokir: updatedTask.isBlocked,
                  alasan_diblokir: updatedTask.blockReason
                })
              });
              setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            } catch (e) { console.error(e); }
          }}
          onAddNotification={(msg, type, sendWa) => addNotification(msg, type, sendWa)}
          onSelectProject={(projId) => {
            setCurrentProjectId(projId);
            setActiveTab('board');
          }}
        />
      );
      case 'admin': return (
        <AdminPanel 
          users={users} 
          setUsers={setUsers} 
          currentUser={currentUser} 
          darkMode={darkMode}
          onSuccess={showSuccess}
        />
      );
      case 'settings': return (
        <ProfileSettings 
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          darkMode={darkMode}
        />
      );
      case 'ai-settings': return (
        <ApiKeySettings 
          darkMode={darkMode}
          onSuccess={showSuccess}
        />
      );
      default: return <Dashboard tasks={tasks} users={users} user={currentUser} darkMode={darkMode} />;
    }
  };

  if (isLoadingData) {
    return (
      <div className={cn(
        "min-h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden",
        darkMode ? "bg-[#0D1B35] text-slate-100" : "bg-[#F4F8FC] text-slate-900"
      )}>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#3FA9F5]/10 via-transparent to-[#2D7FEA]/10 animate-pulse" />
        <div className={cn(
          "p-10 rounded-2xl border backdrop-blur-xl flex flex-col items-center justify-center gap-6 shadow-2xl relative z-10",
          darkMode ? "bg-[#1C2B45]/80 border-[#1E3A5F]/60" : "bg-white/80 border-[#BFDFFF]/40 shadow-slate-200/60"
        )}>
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3FA9F5] border-r-[#3FA9F5] animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#2D7FEA] border-l-[#2D7FEA] animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
          </div>
          <div className="text-center space-y-2">
            <h3 className={cn("text-xl font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>
              Menghubungkan ke KroomSpace...
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
              Menyiapkan workspace interaktif Anda
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex overflow-x-hidden selection:bg-blue-100 transition-colors duration-300",
      darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      {/* Success Toast */}
      <AnimatePresence>
        {successToast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md"
          >
            <CheckCircle2 size={20} className="text-blue-400 dark:text-white" />
            <span className="font-bold text-sm tracking-tight">{successToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'board') setIsBoardOpen(false);
          setActiveTab(tab);
        }} 
        user={currentUser}
        onLogout={handleLogout}
        darkMode={darkMode}
        onCollapse={setIsSidebarCollapsed}
      />
      
      <main className={cn(
        "flex-1 min-h-screen flex flex-col relative overflow-x-hidden transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[250px]"
      )}>
        <Header 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onNotificationClick={() => setActiveTab('notifications')} 
          onProfileClick={() => setActiveTab('settings')}
          user={currentUser}
          unreadCount={notifications.filter(n => !n.read && (!n.userId || n.userId === currentUser.id)).length}
          sidebarCollapsed={isSidebarCollapsed}
        />
        <div className="flex-1 overflow-y-auto scroll-smooth pt-14 md:pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pb-20"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
