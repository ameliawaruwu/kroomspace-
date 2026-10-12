import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  user: any;
  unreadCount?: number;
  sidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  setDarkMode,
  onNotificationClick,
  onProfileClick,
  user,
  unreadCount = 0,
  sidebarCollapsed = false
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className={cn(
      "h-12 md:h-13 flex items-center justify-between px-3 md:px-5 fixed top-0 right-0 z-[35] transition-all duration-300",
      sidebarCollapsed ? "left-0 lg:left-[64px]" : "left-0 lg:left-[225px]",
      darkMode 
        ? "bg-[#0D1B35]/90 backdrop-blur-xl border-b border-[#1E3A5F]/50" 
        : "bg-white/90 backdrop-blur-xl border-b border-[#BFDFFF]/40 shadow-xs shadow-[#3FA9F5]/5"
    )}>

      {/* Mobile title placeholder */}
      <div className="md:hidden flex-1 pl-10">
        <span className="font-black text-xs tracking-wider bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] bg-clip-text text-transparent">KroomSpace</span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 ml-auto">
        {/* Dark Mode Toggle */}
        <button 
          id="btn_dark_mode"
          onClick={() => setDarkMode(!darkMode)}
          className={cn(
            "p-1.5 md:p-2 rounded-xl border transition-all flex items-center justify-center hover:scale-105",
            darkMode 
              ? "bg-[#1E3A5F]/50 border-[#1E3A5F]/60 text-amber-400 hover:bg-[#1E3A5F] shadow-inner" 
              : "bg-[#F0F9FF] border-[#BFDFFF]/60 text-[#2D7FEA] hover:bg-[#DBEEFF] hover:shadow-xs hover:shadow-[#3FA9F5]/10"
          )}
        >
          {darkMode ? <Sun size={15} className="pointer-events-none" /> : <Moon size={15} className="pointer-events-none" />}
        </button>

        {/* Language Switcher */}
        <div className={cn(
          "hidden md:flex items-center p-0.5 rounded-xl border transition-all",
          darkMode 
            ? "bg-[#1E3A5F]/40 border-[#1E3A5F]/60" 
            : "bg-[#F0F9FF] border-[#BFDFFF]/60"
        )}>
          <button 
            onClick={() => setLanguage('en')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all",
              language === 'en' 
                ? (darkMode 
                    ? "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] text-white shadow-xs" 
                    : "bg-white text-[#2D7FEA] shadow-xs border border-[#BFDFFF]/50") 
                : "text-slate-400 hover:text-[#3FA9F5]"
            )}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('id')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all",
              language === 'id' 
                ? (darkMode 
                    ? "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] text-white shadow-xs" 
                    : "bg-white text-[#2D7FEA] shadow-xs border border-[#BFDFFF]/50") 
                : "text-slate-400 hover:text-[#3FA9F5]"
            )}
          >
            ID
          </button>
        </div>


        {/* Notifications */}
        <button 
          id="btn_notification"
          onClick={onNotificationClick}
          className={cn(
            "p-1.5 md:p-2 rounded-xl border shadow-xs transition-all relative group hover:scale-105",
            darkMode 
              ? "bg-[#1E3A5F]/50 border-[#1E3A5F]/60 text-slate-400 hover:text-[#3FA9F5] hover:bg-[#1E3A5F]" 
              : "bg-[#F0F9FF] border-[#BFDFFF]/60 text-slate-400 hover:text-[#2D7FEA] hover:bg-[#DBEEFF] hover:shadow-xs hover:shadow-[#3FA9F5]/10"
          )}
        >
          <Bell size={15} className="group-hover:rotate-12 transition-transform pointer-events-none" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-xs animate-in zoom-in"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Button */}
        <button 
          onClick={onProfileClick}
          title={user.name}
          className={cn(
            "p-0.5 rounded-full border transition-all flex items-center justify-center hover:scale-105 shrink-0 relative aspect-square",
            darkMode 
              ? "bg-[#1E3A5F]/50 border-[#1E3A5F]/60 hover:bg-[#1E3A5F] hover:border-[#3FA9F5]/40" 
              : "bg-[#F0F9FF] border-[#BFDFFF]/60 shadow-xs hover:border-[#3FA9F5]/40 hover:shadow-xs hover:shadow-[#3FA9F5]/10 hover:bg-[#DBEEFF]/50"
          )}
        >
          <div className="relative w-7 h-7 shrink-0 aspect-square">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white dark:border-[#1C2B45] shadow-xs shrink-0 aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full object-cover object-center aspect-square" 
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#3FA9F5] border-2 border-white dark:border-[#1C2B45] rounded-full z-10" />
          </div>
        </button>
      </div>
    </header>
  );
};
