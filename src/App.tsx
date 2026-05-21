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
import { mockUsers as initialUsers, mockTasks, mockProjects, mockNotifications } from './services/apiService';
import { Task, Project, User, Notification } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ShieldCheck, User as UserIcon, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { cn } from './lib/utils';
import { useLanguage } from './context/LanguageContext';

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
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
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
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string>(mockProjects[0].id);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

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
      
      // Fetch users
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch(console.error);

      // Fetch projects
      fetch('/api/proyek')
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
                columns: p.kolom_papan?.map((c:any) => ({ id: c.id_kolom, title: c.judul_kolom, status: c.status_tugas, order: c.urutan }))
             }));
             if (mappedProjects.length > 0) {
               setProjects(mappedProjects);
               setCurrentProjectId(mappedProjects[0].id);
             }
           }
        })
        .catch(console.error);
    }
  }, [isLoggedIn]);

  // Polling for tasks and notifications every 5 seconds for real-time monitoring
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUpdates = () => {
      // Fetch tasks
      fetch('/api/tugas')
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
                checklist: t.daftar_periksa?.map((c:any) => ({ id: c.id_periksa, text: c.teks_periksa, completed: c.apakah_selesai })) || [],
                comments: t.komentar?.map((c:any) => ({ id: c.id_komentar, userId: c.id_pengguna, text: c.isi_komentar, timestamp: c.dibuat_pada })) || [],
                attachments: t.lampiran?.map((a:any) => ({ id: a.id_lampiran, name: a.nama_file, url: a.tautan_url, type: a.tipe_lampiran, createdAt: a.dibuat_pada })) || [],
                contributors: t.kontributor?.map((c:any) => c.id_pengguna) || [],
                notes: t.catatan_selesai,
                deadline: t.batas_waktu ? new Date(t.batas_waktu).toISOString().split('T')[0] : undefined
             }));
              setTasks(mappedTasks);
           }
        })
        .catch(console.error);

      // Fetch notifications
      fetch('/api/notifikasi')
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

  const handleUpdateProfile = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    showSuccess(t('success'));
  };

  if (showLanding && !isLoggedIn) {
    return <LandingPage onStart={() => setShowLanding(false)} language={language} setLanguage={setLanguage} />;
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
                  catatan_selesai: updatedTask.notes,
                  batas_waktu: updatedTask.deadline
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
          setTasks={(newTasks) => {
            const prevProjectTasks = tasks.filter(t => t.projectId === currentProjectId);
            
            newTasks.forEach(task => {
              const oldTask = prevProjectTasks.find(t => t.id === task.id);
              if (oldTask) {
                // Update task if anything changed
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
                      catatan_selesai: task.notes,
                      batas_waktu: task.deadline
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
              } else {
                // New task added from Kanban Board
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
                    batas_waktu: task.deadline
                  })
                }).then(res => res.json()).then(dbTask => {
                   setTasks(prev => prev.map(t => t.id === task.id ? { ...t, id: dbTask.id_tugas } : t));
                }).catch(console.error);
              }
            });

            setTasks(prevTasks => {
              const otherTasks = prevTasks.filter(t => t.projectId !== currentProjectId);
              // Note: new tasks from board still have their temp IDs here until the fetch promise resolves
              return [...otherTasks, ...newTasks];
            });
            showSuccess(t('success'));
          }} 
          projects={projects}
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
                  columns: project.columns
                })
              });
              const newP = await res.json();
              const formattedP = {
                id: newP.id_proyek || project.id,
                name: newP.nama_proyek,
                description: newP.deskripsi,
                type: newP.tipe_tugas,
                mode: newP.mode_kanban,
                createdAt: newP.dibuat_pada || project.createdAt,
                columns: project.columns
              };

              setProjects(prev => {
                const exists = prev.find(p => p.id === project.id);
                if (exists) return prev.map(p => p.id === project.id ? formattedP : p);
                return [...prev, formattedP];
              });
              
              if (projectTasks && projectTasks.length > 0) {
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
                         contributors: t.contributors
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
          onAddTask={async (task) => {
            try {
              const res = await fetch('/api/tugas', {
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
                  contributors: task.contributors
                })
              });
              const newT = await res.json();
              setTasks(prev => [...prev, { ...task, id: newT.id_tugas } as Task]);
              showSuccess(t('success'));
            } catch (e) { console.error(e); }
          }}
          onAddProject={(project, projectTasks) => {
            setProjects([...projects, project]);
            setTasks([...tasks, ...projectTasks]);
            setCurrentProjectId(project.id);
            setIsBoardOpen(true);
            setActiveTab('board');
            showSuccess(t('success'));
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
                  id_penanggung_jawab: updatedTask.assignee || null
                })
              });
              setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            } catch (e) { console.error(e); }
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
      default: return <Dashboard tasks={tasks} users={users} user={currentUser} darkMode={darkMode} />;
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex overflow-hidden selection:bg-blue-100 uppercase-none transition-colors duration-300",
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
      />
      
      <main className="flex-1 lg:ml-[300px] min-h-screen flex flex-col relative overflow-hidden">
        <Header 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onNotificationClick={() => setActiveTab('notifications')} 
          onProfileClick={() => setActiveTab('settings')}
          user={currentUser}
          unreadCount={notifications.filter(n => !n.read && (!n.userId || n.userId === currentUser.id)).length}
        />
        <div className="flex-1 overflow-y-auto scroll-smooth pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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
