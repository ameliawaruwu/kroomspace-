import React, { useState } from 'react';
import {
  LayoutDashboard,
  Trello,
  FileText,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Users,
  ChevronRight,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  darkMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'board', label: t('kanban'), icon: Trello },
    { id: 'templates', label: t('templates'), icon: FileText },
  ];

  if (user.role === 'Admin') {
    menuItems.push({ id: 'admin', label: t('userManagement'), icon: Users });
    menuItems.push({ id: 'ai-settings', label: t('aiSettings'), icon: Key });
    menuItems.push({ id: 'settings', label: t('profileSettings'), icon: UserIcon });
  }

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false); // close on mobile after nav
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-4 lg:p-6 pb-2 flex flex-col items-center gap-0 shrink-0">
        <div className="relative group">
          <div className="absolute inset-0 bg-[#3FA9F5]/15 rounded-full blur-2xl group-hover:bg-[#3FA9F5]/25 transition-all duration-500" />
          <img
            src="https://i.ibb.co.com/Fk4YB1cM/logo-ks.png"
            alt="KroomSpace Logo"
            className="w-14 h-14 lg:w-16 lg:h-16 object-contain relative group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <span className="text-base lg:text-lg font-black tracking-wider uppercase -mt-2 bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] bg-clip-text text-transparent transition-colors">
          KroomSpace
        </span>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#3FA9F5]/30 to-transparent mt-4 mb-2" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              "w-full flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-2xl transition-all duration-200 group relative overflow-hidden",
              activeTab === item.id
                ? "text-white shadow-lg shadow-[#2D7FEA]/25"
                : darkMode
                  ? "hover:bg-[#3FA9F5]/10 hover:text-white text-slate-400"
                  : "hover:bg-[#EBF5FF] hover:text-[#2D7FEA] text-slate-500"
            )}
            style={activeTab === item.id ? { background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' } : {}}
          >
            {activeTab === item.id && (
              <div className="absolute inset-0 bg-white/10 opacity-50" />
            )}
            <item.icon
              size={18}
              strokeWidth={2.5}
              className={cn(
                "relative z-10 transition-colors shrink-0",
                activeTab === item.id
                  ? "text-white"
                  : darkMode ? "text-slate-500 group-hover:text-[#3FA9F5]" : "text-slate-400 group-hover:text-[#2D7FEA]"
              )}
            />
            <span className="font-bold text-sm tracking-wide whitespace-nowrap relative z-10">{item.label}</span>
            {activeTab === item.id && (
              <ChevronRight size={14} className="ml-auto text-white/60 relative z-10 shrink-0" />
            )}
          </button>
        ))}
      </nav>

      {/* User Footer */}
      <div className={cn(
        "p-3 border-t shrink-0",
        darkMode ? "border-[#1E3A5F]/50" : "border-[#EBF5FF]"
      )}>
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-2xl mb-3 border transition-colors",
          darkMode
            ? "bg-[#1E3A5F]/40 border-[#1E3A5F]/50"
            : "bg-[#F0F9FF] border-[#BFDFFF]/50"
        )}>
          <div className="relative shrink-0">
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3FA9F5] border-2 border-white rounded-full shadow" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-bold truncate", darkMode ? "text-white" : "text-slate-800")}>{user.name}</p>
            <p className="text-[10px] font-black uppercase tracking-wider truncate text-[#3FA9F5]">{user.role}</p>
          </div>
        </div>
        <button
          id="btn_logout"
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm group",
            darkMode
              ? "text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
              : "text-slate-400 hover:bg-red-50 hover:text-red-500"
          )}
        >
          <LogOut size={18} strokeWidth={2.5} className="group-hover:translate-x-[-2px] transition-transform pointer-events-none" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        id="btn_menu_toggle"
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 text-white rounded-xl transition-all shadow-lg shadow-[#2D7FEA]/30"
        style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} className="pointer-events-none" /> : <Menu size={20} className="pointer-events-none" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar - slide in from left */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed inset-y-0 left-0 z-[50] w-[260px] max-w-[85vw] border-r flex flex-col lg:hidden",
              darkMode
                ? "bg-[#0D1B35]/98 border-[#1E3A5F]/60 text-slate-300"
                : "bg-white border-[#E8F4FD]/80 text-slate-600"
            )}
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - always visible, responsive width */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-[220px] xl:w-[250px] border-r",
          darkMode
            ? "bg-[#0D1B35]/95 border-[#1E3A5F]/60 text-slate-300"
            : "bg-white/95 border-[#E8F4FD]/80 text-slate-600"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};
