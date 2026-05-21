import React from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Zap,
  ArrowUpRight,
  Play,
  Check,
  Star,
  Calendar,
  AlertTriangle,
  Upload,
  ShieldCheck,
  Layers,
  Trello,
  Monitor,
  LayoutGrid,
  Activity,
  BarChart3,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { Task, User } from '../types';
import { mockKPIs } from '../services/apiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  tasks: Task[];
  users: User[];
  user: User;
  darkMode: boolean;
  notifications: any[];
  onUpdateTask: (task: Task) => void;
  onViewAll: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  users, 
  user, 
  darkMode, 
  notifications,
  onUpdateTask,
  onViewAll
}) => {
  const { language, t } = useLanguage();
  const [executingTask, setExecutingTask] = React.useState<Task | null>(null);
  const [completeNote, setCompleteNote] = React.useState('');
  const [attachedFile, setAttachedFile] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'Admin';

  const handleExecute = (task: Task) => {
    if (task.status === 'To Do' || task.status === 'Backlog') {
      const updated = { ...task, status: 'In Progress' as const, updatedAt: new Date().toISOString() };
      onUpdateTask(updated);
    } else if (task.status === 'In Progress') {
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
  };

  // Data Calculations
  const now = new Date();
  
  const myTasks = tasks.filter(t => t.assignee === user.id);
  const myActiveTasks = myTasks.filter(t => t.status !== 'Done');
  const myDoneTasks = myTasks.filter(t => t.status === 'Done');
  const myNotifications = notifications
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  const recommendedTasks = [...myActiveTasks]
    .sort((a, b) => {
      const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const aP = priorityMap[a.priority] || 0;
      const bP = priorityMap[b.priority] || 0;
      if (bP !== aP) return bP - aP;
      return new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
    })
    .slice(0, 3);

  const myOverdueTasks = myActiveTasks.filter(t => t.deadline && new Date(t.deadline) < now);
  const myOnTimeTasks = myDoneTasks.filter(t => {
    if (!t.deadline || !t.updatedAt) return true;
    return new Date(t.updatedAt) <= new Date(t.deadline);
  });
  const myOnTimeRate = myDoneTasks.length > 0 
    ? Math.round((myOnTimeTasks.length / myDoneTasks.length) * 100) 
    : 100;

  const allProjectsCount = Array.from(new Set(tasks.map(t => t.projectId).filter(Boolean))).length;
  const allActiveTasks = tasks.filter(t => t.status !== 'Done');
  const allDoneTasks = tasks.filter(t => t.status === 'Done');
  const globalOnTimeTasks = allDoneTasks.filter(t => {
    if (!t.deadline || !t.updatedAt) return true;
    return new Date(t.updatedAt) <= new Date(t.deadline);
  });
  const globalOnTimeRate = allDoneTasks.length > 0 
    ? Math.round((globalOnTimeTasks.length / allDoneTasks.length) * 100) 
    : 100;

  const systemNotifications = notifications
    .filter(n => !n.userId || n.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  // Color palette constants
  const C = {
    primary: '#3FA9F5',
    secondary: '#2D7FEA',
    accent: '#67C6FF',
    dark: '#142B6F',
    bg: darkMode ? '#0D1B35' : '#F4F8FC',
    card: darkMode ? 'bg-[#152844]' : 'bg-white',
    cardBorder: darkMode ? 'border-[#1E3A5F]/50' : 'border-[#BFDFFF]/40',
    text: darkMode ? 'text-white' : 'text-slate-800',
    sub: darkMode ? 'text-slate-400' : 'text-slate-500',
  };

  const renderAdminDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className={cn(
        "flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-30 px-8 py-6 backdrop-blur-xl border-b transition-all gap-4",
        darkMode 
          ? "bg-[#0D1B35]/90 border-[#1E3A5F]/40" 
          : "bg-[#F4F8FC]/90 border-[#BFDFFF]/30"
      )}>
        <div>
          <h1 className={cn("text-3xl font-black tracking-tight", C.text)}>{t('adminDashboardHeader')}</h1>
          <p className={cn("mt-1 font-medium text-sm", C.sub)}>{t('adminDashboardSub')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-sm"
          style={{ 
            background: darkMode ? 'rgba(63,169,245,0.1)' : 'rgba(63,169,245,0.08)',
            borderColor: 'rgba(63,169,245,0.25)'
          }}>
          <ShieldCheck size={14} style={{ color: C.primary }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.primary }}>
            {t('admin')} Mode
          </span>
        </div>
      </header>

      {/* Global Metrics */}
      <section className="px-8 grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: t('totalTasks'), value: tasks.length, icon: LayoutGrid, gradient: 'from-[#3FA9F5] to-[#2D7FEA]', glow: 'shadow-[#3FA9F5]/20' },
          { label: t('activeProjects'), value: allProjectsCount, icon: Trello, gradient: 'from-[#67C6FF] to-[#3FA9F5]', glow: 'shadow-[#67C6FF]/20' },
          { label: t('systemHealth'), value: `${globalOnTimeRate}%`, icon: Zap, gradient: 'from-[#F59E0B] to-[#D97706]', glow: 'shadow-amber-400/20' },
          { label: t('teamPerformance'), value: '94%', icon: TrendingUp, gradient: 'from-[#8B5CF6] to-[#7C3AED]', glow: 'shadow-violet-400/20' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 hover:shadow-md transition-all group hover:-translate-y-0.5",
              C.card, C.cardBorder
            )}
          >
            <div className={cn("p-3.5 rounded-2xl bg-gradient-to-br text-white shadow-lg", stat.gradient, stat.glow)}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest", C.sub)}>{stat.label}</p>
              <h3 className={cn("text-2xl font-black mt-0.5", C.text)}>{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-10">
        <div className="lg:col-span-2 space-y-6">
          {/* User Performance */}
          <section className={cn("p-8 rounded-[2.5rem] border shadow-sm", C.card, C.cardBorder)}>
            <h2 className={cn("text-xl font-bold tracking-tight mb-8 flex items-center gap-3", C.text)}>
              <div className="p-2 rounded-xl" style={{ background: 'rgba(63,169,245,0.12)' }}>
                <TrendingUp size={18} style={{ color: C.primary }} />
              </div>
              {t('userPerformance')}
            </h2>
            <div className="space-y-5">
              {users.slice(0, 5).map((u, i) => {
                const userTasks = tasks.filter(t => t.assignee === u.id);
                const donePercent = userTasks.length > 0 
                  ? Math.round((userTasks.filter(t => t.status === 'Done').length / userTasks.length) * 100)
                  : 0;
                
                return (
                  <div key={u.id} className="flex items-center gap-5 group">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-11 h-11 rounded-full border-2 border-white shadow-sm shrink-0" alt={u.name} />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className={cn("text-sm font-bold", C.text)}>{u.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.primary }}>{u.role}</p>
                        </div>
                        <span className="text-sm font-black" style={{ color: C.secondary }}>{donePercent}%</span>
                      </div>
                      <div className={cn("h-2 w-full rounded-full overflow-hidden border", darkMode ? "bg-[#1E3A5F] border-[#1E3A5F]" : "bg-[#EBF5FF] border-[#D1EAFF]")}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${donePercent}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)', boxShadow: '0 0 8px rgba(63,169,245,0.4)' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Kanban Distribution */}
          <section className={cn("p-8 rounded-[2.5rem] border shadow-sm", C.card, C.cardBorder)}>
            <h2 className={cn("text-xl font-bold tracking-tight mb-8 flex items-center gap-3", C.text)}>
              <div className="p-2 rounded-xl" style={{ background: 'rgba(63,169,245,0.12)' }}>
                <Monitor size={18} style={{ color: C.primary }} />
              </div>
              {t('monitoringAndControl')}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { status: 'Backlog', color: '#94A3B8', bg: darkMode ? 'rgba(148,163,184,0.08)' : '#F8FAFC' },
                { status: 'To Do', color: '#3FA9F5', bg: darkMode ? 'rgba(63,169,245,0.08)' : '#EBF5FF' },
                { status: 'In Progress', color: '#2D7FEA', bg: darkMode ? 'rgba(45,127,234,0.08)' : '#DBEEFF' },
                { status: 'Done', color: '#22C55E', bg: darkMode ? 'rgba(34,197,94,0.08)' : '#F0FDF4' },
              ].map(({ status, color, bg }) => {
                const count = tasks.filter(t => t.status === status).length;
                const percent = Math.round((count / (tasks.length || 1)) * 100);
                return (
                  <div key={status} className={cn("p-5 rounded-3xl border transition-all hover:-translate-y-0.5 hover:shadow-md", C.cardBorder)} style={{ background: bg }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color }}>{status}</p>
                    <h3 className={cn("text-3xl font-black mb-2", C.text)}>{count}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black" style={{ color }}>{percent}%</span>
                      <div className={cn("h-1.5 flex-1 rounded-full overflow-hidden", darkMode ? "bg-white/10" : "bg-white/80")}>
                        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Project Stats */}
          <section className="p-8 rounded-[2.5rem] text-white shadow-xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #142B6F 0%, #1E3A8A 50%, #2D7FEA 100%)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: '#3FA9F5' }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-20" style={{ background: '#67C6FF' }} />
            <h2 className="text-lg font-bold tracking-tight mb-8 flex items-center gap-3 relative z-10">
              <BarChart3 size={20} style={{ color: '#67C6FF' }} />
              {t('projectStatsGlobal')}
            </h2>
            <div className="space-y-5 relative z-10">
              {mockKPIs.slice(0, 4).map((kpi, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-200">
                    <span>{kpi.name}</span>
                    <span style={{ color: '#67C6FF' }}>{Math.round((kpi.value/kpi.target)*100)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(kpi.value/kpi.target)*100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(to right, #3FA9F5, #67C6FF)', boxShadow: '0 0 8px rgba(103,198,255,0.5)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Stats Card */}
          <section className={cn("p-6 rounded-[2.5rem] border shadow-sm", C.card, C.cardBorder)}>
            <h3 className={cn("text-sm font-black uppercase tracking-widest mb-5 flex items-center gap-2", C.sub)}>
              <Activity size={14} style={{ color: C.primary }} />
              Tim Overview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl flex items-center justify-center" style={{ background: 'rgba(63,169,245,0.1)' }}>
                  <Users size={18} style={{ color: C.primary }} />
                </div>
                <div>
                  <p className={cn("text-lg font-black", C.text)}>{users.length}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", C.sub)}>Anggota Tim</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className={cn("text-lg font-black", C.text)}>{allDoneTasks.length}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", C.sub)}>Tugas Selesai</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div>
                  <p className={cn("text-lg font-black", C.text)}>{allActiveTasks.filter(t => t.deadline && new Date(t.deadline) < now).length}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", C.sub)}>Tugas Terlambat</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderUserDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className={cn(
        "flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-30 px-8 py-6 backdrop-blur-xl border-b transition-all gap-4",
        darkMode 
          ? "bg-[#0D1B35]/90 border-[#1E3A5F]/40" 
          : "bg-[#F4F8FC]/90 border-[#BFDFFF]/30"
      )}>
        <div>
          <h1 className={cn("text-3xl font-black tracking-tight", C.text)}>
            {t('hi')}, <span style={{ color: C.primary }}>{user.name.split(' ')[0]}</span>!
          </h1>
          <p className={cn("mt-1 font-medium text-sm", C.sub)}>{t('dashboardSubHeader')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-sm"
          style={{ 
            background: darkMode ? 'rgba(63,169,245,0.1)' : 'rgba(63,169,245,0.08)',
            borderColor: 'rgba(63,169,245,0.25)'
          }}>
          <Zap size={14} style={{ color: C.primary }} className="fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.primary }}>
            {t('productivity')}: {myOnTimeRate}%
          </span>
        </div>
      </header>

      {/* Priority Tasks */}
      <section className="px-8 space-y-4">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-400 fill-amber-400" />
          <h2 className={cn("text-lg font-bold tracking-tight", C.text)}>{t('priorityToday')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recommendedTasks.length > 0 ? recommendedTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn("p-6 rounded-[2rem] border shadow-sm hover:shadow-lg transition-all group relative overflow-hidden hover:-translate-y-0.5", C.card, C.cardBorder)}
              style={{ boxShadow: `0 4px 20px rgba(63,169,245,0.05)` }}
            >
              {/* AI badge */}
              <div className="absolute top-0 right-0 py-1.5 px-4 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1"
                style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' }}>
                ✦ {t('aiSuggestion')}
              </div>
              <div className="flex flex-col h-full">
                <div className="mb-4 mt-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    task.priority === 'High' 
                      ? "bg-rose-50 text-rose-600 border-rose-100" 
                      : task.priority === 'Medium'
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-[#EBF5FF] border-[#BFDFFF]"
                  )}
                    style={task.priority === 'Low' ? { color: C.primary } : {}}>
                    {t(task.priority.toLowerCase())}
                  </span>
                </div>
                <h3 className={cn("font-bold group-hover:text-[#2D7FEA] transition-colors line-clamp-2 mb-2", C.text)}>{task.title}</h3>
                <p className={cn("text-[11px] line-clamp-2 mb-6 leading-relaxed", C.sub)}>
                  {task.description || t('noDescription')}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className={cn("flex items-center gap-2 text-[10px] font-bold", C.sub)}>
                    <Clock size={12} />
                    {task.deadline ? new Date(task.deadline).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' }) : '-'}
                  </div>
                  <button 
                    onClick={() => handleExecute(task)}
                    className="px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                    style={{ 
                      background: task.status === 'In Progress' 
                        ? 'linear-gradient(135deg, #22C55E, #16A34A)' 
                        : 'linear-gradient(135deg, #3FA9F5, #2D7FEA)',
                      boxShadow: task.status === 'In Progress' ? '0 4px 15px rgba(34,197,94,0.3)' : '0 4px 15px rgba(63,169,245,0.3)'
                    }}
                  >
                    {task.status === 'In Progress' ? <Check size={10} /> : <Play size={10} className="fill-white" />}
                    {task.status === 'In Progress' ? t('done') : t('execute')}
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className={cn("col-span-full py-12 rounded-[2rem] border border-dashed flex flex-col items-center justify-center", C.sub, C.cardBorder)}
              style={{ background: darkMode ? 'rgba(63,169,245,0.03)' : 'rgba(63,169,245,0.04)' }}>
              <CheckCircle2 size={40} className="mb-3 opacity-20" style={{ color: C.primary }} />
              <p className="text-sm font-bold">{t('allTasksDone')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Personal KPI */}
      <section className="px-8 space-y-4">
        <h2 className={cn("text-lg font-bold tracking-tight", C.text)}>{t('personalKPI')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('completedTasks'), value: myDoneTasks.length, icon: CheckCircle2, gradient: 'from-[#3FA9F5] to-[#2D7FEA]', glow: 'rgba(63,169,245,0.25)' },
            { label: t('avgCompletionTime'), value: t('avgCompletionTimeValue'), icon: Clock, gradient: 'from-[#67C6FF] to-[#3FA9F5]', glow: 'rgba(103,198,255,0.25)' },
            { label: t('onTimeRate'), value: `${myOnTimeRate}%`, icon: TrendingUp, gradient: 'from-[#8B5CF6] to-[#7C3AED]', glow: 'rgba(139,92,246,0.25)' },
            { label: t('overdueTasks'), value: myOverdueTasks.length, icon: AlertTriangle, gradient: 'from-[#EF4444] to-[#DC2626]', glow: 'rgba(239,68,68,0.25)' },
          ].map((kpi, i) => (
            <div key={i} className={cn("p-5 rounded-3xl border shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-all", C.card, C.cardBorder)}>
              <div className={cn("p-3 rounded-2xl bg-gradient-to-br text-white shadow-md", kpi.gradient)} style={{ boxShadow: `0 4px 12px ${kpi.glow}` }}>
                <kpi.icon size={18} />
              </div>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest leading-tight", C.sub)}>{kpi.label}</p>
                <h3 className={cn("text-xl font-black mt-0.5", C.text)}>{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-10">
        <div className="lg:col-span-2 space-y-6">
          <section className={cn("p-8 rounded-[2.5rem] border shadow-sm", C.card, C.cardBorder)}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #3FA9F5, #2D7FEA)' }} />
                <h2 className={cn("text-xl font-bold tracking-tight", C.text)}>{t('myTasks')}</h2>
              </div>
              <button onClick={onViewAll} className="text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: C.primary }}>
                {t('viewAll')}
              </button>
            </div>
            <div className="space-y-2.5">
              {myActiveTasks.slice(0, 6).map(task => (
                <div key={task.id} className={cn(
                  "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer hover:-translate-y-0.5",
                  darkMode 
                    ? "bg-[#1E3A5F]/20 border-[#1E3A5F]/30 hover:border-[#3FA9F5]/40 hover:bg-[#1E3A5F]/40" 
                    : "bg-[#F0F9FF]/60 border-[#BFDFFF]/30 hover:border-[#3FA9F5]/40 hover:bg-white"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full ring-4 ring-opacity-20",
                      task.priority === 'High' ? "bg-rose-500 ring-rose-500" : 
                      task.priority === 'Medium' ? "bg-amber-500 ring-amber-500" : 
                      "ring-[#3FA9F5]"
                    )} style={task.priority === 'Low' ? { background: C.primary } : {}} />
                    <div>
                      <h4 className={cn("text-sm font-bold group-hover:text-[#2D7FEA] transition-colors", C.text)}>{task.title}</h4>
                      <p className={cn("text-[10px] font-medium tracking-wide uppercase", C.sub)}>{(t('status') as any)[task.status] || task.status}</p>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-[#3FA9F5] transition-all" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Deadlines card */}
          <section className="p-8 rounded-[2.5rem] text-white shadow-xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #142B6F 0%, #1E3A8A 50%, #2D7FEA 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: '#3FA9F5' }} />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Calendar size={18} style={{ color: '#67C6FF' }} />
              <h2 className="text-base font-bold tracking-tight">{t('deadlinesAndReminders')}</h2>
            </div>
            <div className="space-y-5 relative z-10">
              {myActiveTasks.filter(t => t.deadline).slice(0, 4).map(task => {
                const deadline = new Date(task.deadline!);
                const isUrgent = deadline.getTime() - now.getTime() < 86400000 * 2;
                return (
                  <div key={task.id} className="relative pl-5 border-l-2 group"
                    style={{ borderColor: isUrgent ? '#EF4444' : '#3FA9F5' }}>
                    <div className={cn("absolute -left-[5px] top-0.5 w-2 h-2 rounded-full", isUrgent ? "bg-rose-500 animate-pulse" : "")}
                      style={!isUrgent ? { background: '#3FA9F5' } : {}} />
                    <h4 className="text-xs font-bold leading-tight line-clamp-1 text-white">{task.title}</h4>
                    <p className="text-[10px] text-blue-200 mt-1">
                      {deadline.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                );
              })}
              {myActiveTasks.filter(t => t.deadline).length === 0 && (
                <p className="text-blue-300 text-xs font-medium">Tidak ada deadline mendatang</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 relative">
      {isAdmin ? renderAdminDashboard() : renderUserDashboard()}

      {/* Task Completion Modal */}
      {executingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,27,53,0.7)', backdropFilter: 'blur(8px)' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border", C.card, C.cardBorder)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' }}>
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <h3 className={cn("text-xl font-bold", C.text)}>{t('completeTask')}</h3>
            </div>
            <p className={cn("text-sm mb-8 font-medium", C.sub)}>{executingTask.title}</p>
            
            <div className="space-y-6">
              <div>
                <label className={cn("block text-[10px] font-black uppercase tracking-widest mb-3", C.sub)}>{t('workNotes')}</label>
                <textarea 
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  placeholder={t('workNotesPlaceholder')}
                  className={cn(
                    "w-full rounded-2xl p-4 text-sm border outline-none transition-all h-32 resize-none font-medium",
                    darkMode 
                      ? "bg-[#1E3A5F]/40 border-[#1E3A5F]/60 text-white focus:border-[#3FA9F5]/50" 
                      : "bg-[#F0F9FF] border-[#BFDFFF]/50 text-slate-700 focus:border-[#3FA9F5]/50 focus:bg-white"
                  )}
                />
              </div>

              <div>
                <label className={cn("block text-[10px] font-black uppercase tracking-widest mb-3", C.sub)}>
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
                    "w-full border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 transition-all group overflow-hidden",
                    darkMode 
                      ? "border-[#1E3A5F] hover:border-[#3FA9F5]/50 bg-[#1E3A5F]/20" 
                      : "border-[#BFDFFF] hover:border-[#3FA9F5]/50 hover:bg-[#EBF5FF]/30"
                  )}
                >
                  {attachedFile ? (
                    <div className="w-full aspect-video rounded-xl overflow-hidden">
                      <img src={attachedFile} className="w-full h-full object-cover" alt="Proof" />
                    </div>
                  ) : (
                    <>
                      <Upload size={28} style={{ color: C.primary }} />
                      <span className="text-xs font-bold" style={{ color: C.secondary }}>
                        <span className="text-white px-2 py-0.5 rounded mr-1" style={{ background: C.primary }}>{t('clickToUpload')}</span> 
                        {t('clickOrDragToUpload')}
                      </span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setExecutingTask(null)}
                  className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all", C.sub, darkMode ? "hover:bg-white/5" : "hover:bg-slate-50")}
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={submitCompletion}
                  className="flex-[2] py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)', boxShadow: '0 8px 25px rgba(63,169,245,0.35)' }}
                >
                  {t('saveAndFinish')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
