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
  Key,
  PanelLeftClose,
  PanelLeftOpen
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
  onCollapse?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout, darkMode, onCollapse }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    setIsMobileOpen(false);
  };

  const handleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapse?.(next);
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Spacer for mobile hamburger */}
      <div className="h-14 lg:h-0 shrink-0" />

      {/* Brand Logo - centered, logo above, text below */}
      <div className={cn(
        "hidden lg:flex flex-col items-center border-b shrink-0 transition-all duration-300 relative",
        collapsed ? "py-3 px-2" : "py-6 px-4",
        darkMode ? "border-[#1E3A5F]/50" : "border-[#EBF5FF]"
      )}>
        {/* Toggle button - inside brand section, top right */}
        <button
          onClick={handleCollapse}
          className={cn(
            "absolute w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110 z-10",
            collapsed ? "top-1.5 right-1.5" : "top-3 right-2",
            darkMode
              ? "text-slate-500 hover:bg-[#1E3A5F] hover:text-white"
              : "text-slate-300 hover:bg-slate-100 hover:text-slate-600"
          )}
        >
          {collapsed
            ? <PanelLeftOpen size={14} />
            : <PanelLeftClose size={14} />
          }
        </button>

        <img
          src="https://i.ibb.co.com/Fk4YB1cM/logo-ks.png"
          alt="KroomSpace Logo"
          style={{ height: collapsed ? '26px' : '72px', width: 'auto' }}
          className="object-contain transition-all duration-300"
        />
        {!collapsed && (
          <span className={cn(
            "mt-2 text-base font-black tracking-wider uppercase",
            darkMode ? "text-white" : "text-slate-800"
          )}>
            KroomSpace
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            title={collapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-2xl transition-all duration-200 group relative overflow-hidden",
              collapsed ? "justify-center" : "",
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
            {!collapsed && (
              <span className="font-bold text-sm tracking-wide whitespace-nowrap relative z-10">{item.label}</span>
            )}
            {!collapsed && activeTab === item.id && (
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
        {!collapsed ? (
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
        ) : (
          <div className="flex justify-center mb-3">
            <div className="relative">
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3FA9F5] border-2 border-white rounded-full shadow" />
            </div>
          </div>
        )}
        <button
          id="btn_logout"
          onClick={onLogout}
          title={collapsed ? t('logout') : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm group",
            collapsed ? "justify-center px-2" : "",
            darkMode
              ? "text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
              : "text-slate-400 hover:bg-red-50 hover:text-red-500"
          )}
        >
          <LogOut size={18} strokeWidth={2.5} className="group-hover:translate-x-[-2px] transition-transform pointer-events-none shrink-0" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        id="btn_menu_toggle"
        className="lg:hidden fixed top-0 left-0 z-[60] w-12 h-full flex flex-col items-center justify-center text-white transition-all"
        style={{ background: 'linear-gradient(180deg, #3FA9F5, #2D7FEA)' }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? <X size={20} className="pointer-events-none" /> : (
          <div className="flex flex-col items-center gap-1">
            <Menu size={20} className="pointer-events-none" />
            <span className="text-[8px] font-bold tracking-widest [writing-mode:vertical-lr] mt-2">MENU</span>
          </div>
        )}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
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
            <SidebarContent collapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - collapsible drawer */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 250 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r",
          darkMode
            ? "bg-[#0D1B35]/95 border-[#1E3A5F]/60 text-slate-300"
            : "bg-white/95 border-[#E8F4FD]/80 text-slate-600"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <SidebarContent collapsed={isCollapsed} />
        </div>
      </motion.aside>
    </>
  );
};
