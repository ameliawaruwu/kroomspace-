import React, { useState } from 'react';
import { 
  Bell, 
  AlertCircle, 
  Info, 
  Check, 
  Trash2,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockNotifications } from '../services/apiService';
import { cn } from '../lib/utils';
import { Task } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NotificationsProps {
  darkMode: boolean;
  notifications: any[];
  setNotifications: (notifs: any[]) => void;
  user: any;
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ 
  darkMode, 
  notifications, 
  setNotifications,
  user,
  tasks,
  onUpdateTask
}) => {
  const { t } = useLanguage();
  // Filter notifications for the current user
  const userNotifications = notifications.filter(n => !n.userId || n.userId === user.id);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    fetch(`/api/notifikasi/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sudah_dibaca: true })
    }).catch(console.error);
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    fetch(`/api/notifikasi/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const handleAction = (n: any) => {
    if (n.taskId) {
      const task = tasks.find(t => t.id === n.taskId);
      if (task) {
        if (n.actionRequired === 'start') {
          onUpdateTask({ ...task, status: 'In Progress', updatedAt: new Date().toISOString() });
        } else if (n.actionRequired === 'complete') {
          // Open the completion flow or just set to Review/Done for simplicity in notification
          onUpdateTask({ ...task, status: 'Done', updatedAt: new Date().toISOString() });
        }
      }
    }
    // Show a small alert to simulate immediate action without switching pages
    alert(`Aksi "${t(n.actionRequired)}" berhasil dijalankan untuk tugas: ${n.message}`);
    markAsRead(n.id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end sticky top-0 z-20 py-4 -mt-4 mb-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('notifHeader')}</h1>
          <p className="text-slate-500 mt-2 font-medium">{t('notifSubHeader')}</p>
        </div>
        <button 
          onClick={() => {
            const unread = notifications.filter(n => (n.userId === user.id || !n.userId) && !n.read);
            setNotifications(notifications.map(n => (n.userId === user.id || !n.userId) ? { ...n, read: true } : n));
            unread.forEach(n => {
              fetch(`/api/notifikasi/${n.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sudah_dibaca: true })
              }).catch(console.error);
            });
          }}
          className="px-6 py-2.5 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-sm font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10"
        >
          {t('markAllRead')}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {userNotifications.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
               <Bell size={48} className="mx-auto mb-4 text-slate-200" />
               <p className="text-slate-400 font-bold">{t('notifEmpty')}</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {userNotifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "p-6 rounded-[2.5rem] border transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group",
                  n.read 
                    ? "bg-white border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 opacity-60 shadow-sm" 
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none"
                )}
              >
                {!n.read && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />}
                
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                  n.type === 'Alert' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20" :
                  n.type === 'Warning' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20" :
                  "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                )}>
                  {n.type === 'Alert' ? <AlertCircle size={28} /> : 
                   n.type === 'Warning' ? <AlertCircle size={28} /> : 
                   <Bell size={28} />}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                         {n.badge && (
                           <span className={cn(
                             "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                             n.badge === 'URGENT' ? "bg-rose-500 text-white" :
                             n.badge === 'OVERDUE' ? "bg-amber-500 text-white" :
                             "bg-blue-500 text-white"
                           )}>
                             {n.badge}
                           </span>
                         )}
                         <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                           {n.type === 'Alert' ? t('priorityHigh') : t('taskUpdate')}
                         </span>
                       </div>
                      <p className={cn("font-bold text-lg leading-tight tracking-tight", !n.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                        {n.message}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums shrink-0">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {n.actionRequired && (
                        <button 
                          onClick={() => handleAction(n)}
                          className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                        >
                          {t(n.actionRequired === 'complete' ? 'done' : n.actionRequired)}
                        </button>
                      )}
                      
                      {!n.read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {t('markRead')}
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 dark:bg-slate-900/40 rounded-lg opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <Smartphone size={20} className="text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('waAlertTitle')}</h3>
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
               {t('waAlertSub')}
             </p>
             <button className="w-full py-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-500/20">
               {t('waSettingsBtn')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
