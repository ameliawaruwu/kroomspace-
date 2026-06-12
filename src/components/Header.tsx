import React from 'react';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  user: any;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  setDarkMode,
  onNotificationClick,
  onProfileClick,
  user,
  unreadCount = 0
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className={cn(
      "h-16 md:h-20 flex items-center justify-between px-4 md:px-8 fixed top-0 right-0 left-0 lg:left-[300px] z-30 transition-all duration-300",
      darkMode 
        ? "bg-[#0D1B35]/90 backdrop-blur-xl border-b border-[#1E3A5F]/50" 
        : "bg-white/90 backdrop-blur-xl border-b border-[#BFDFFF]/40 shadow-sm shadow-[#3FA9F5]/5"
    )}>
      {/* Search Bar - hidden on mobile, visible md+ */}
      <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#3FA9F5]" 
            size={18} 
            color={darkMode ? '#4A6FA5' : '#94A3B8'}
          />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className={cn(
              "w-full pl-12 pr-4 py-3 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-medium border",
              darkMode 
                ? "bg-[#1E3A5F]/40 border-[#1E3A5F]/60 focus:ring-2 focus:ring-[#3FA9F5]/30 focus:border-[#3FA9F5]/50 text-white" 
                : "bg-[#F0F9FF] border-[#BFDFFF]/60 focus:ring-2 focus:ring-[#3FA9F5]/20 focus:border-[#3FA9F5]/50 text-slate-700 focus:bg-white"
            )}
          />
        </div>
      </div>
      {/* Mobile title placeholder */}
      <div className="md:hidden flex-1 pl-10">
        <span className="font-black text-sm tracking-wider bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] bg-clip-text text-transparent">KroomSpace</span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={cn(
            "p-3 rounded-2xl border transition-all flex items-center justify-center hover:scale-105",
            darkMode 
              ? "bg-[#1E3A5F]/50 border-[#1E3A5F]/60 text-amber-400 hover:bg-[#1E3A5F] shadow-inner" 
              : "bg-[#F0F9FF] border-[#BFDFFF]/60 text-[#2D7FEA] hover:bg-[#DBEEFF] hover:shadow-md hover:shadow-[#3FA9F5]/10"
          )}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Language Switcher - hidden on mobile */}
        <div className={cn(
          "hidden md:flex items-center p-1 rounded-2xl border transition-all",
          darkMode 
            ? "bg-[#1E3A5F]/40 border-[#1E3A5F]/60" 
            : "bg-[#F0F9FF] border-[#BFDFFF]/60"
        )}>
          <button 
            onClick={() => setLanguage('en')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all",
              language === 'en' 
                ? (darkMode 
                    ? "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] text-white shadow-lg" 
                    : "bg-white text-[#2D7FEA] shadow-sm border border-[#BFDFFF]/50") 
                : "text-slate-400 hover:text-[#3FA9F5]"
            )}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('id')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all",
              language === 'id' 
                ? (darkMode 
                    ? "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] text-white shadow-lg" 
                    : "bg-white text-[#2D7FEA] shadow-sm border border-[#BFDFFF]/50") 
                : "text-slate-400 hover:text-[#3FA9F5]"
            )}
          >
            ID
          </button>
        </div>

        {/* Notifications */}
        <button 
          onClick={onNotificationClick}
          className={cn(
            "p-3 rounded-2xl border shadow-sm transition-all relative group hover:scale-105",
            darkMode 
              ? "bg-[#1E3A5F]/50 border-[#1E3A5F]/60 text-slate-400 hover:text-[#3FA9F5] hover:bg-[#1E3A5F]" 
              : "bg-[#F0F9FF] border-[#BFDFFF]/60 text-slate-400 hover:text-[#2D7FEA] hover:bg-[#DBEEFF] hover:shadow-md hover:shadow-[#3FA9F5]/10"
          )}
        >
          <Bell size={18} className="group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in zoom-in"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Button */}
        <button 
          onClick={onProfileClick}
          className={cn(
            "flex items-center gap-3 pl-3 pr-4 py-2 rounded-2xl border group transition-all hover:scale-[1.02]",
            darkMode 
              ? "bg-[#1E3A5F]/50 border-[#1E3A5F]/60 hover:bg-[#1E3A5F] hover:border-[#3FA9F5]/40" 
              : "bg-[#F0F9FF] border-[#BFDFFF]/60 shadow-sm hover:border-[#3FA9F5]/40 hover:shadow-md hover:shadow-[#3FA9F5]/10 hover:bg-[#DBEEFF]/50"
          )}
        >
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3FA9F5] border-2 border-white rounded-full" />
          </div>
          <div className="hidden md:block text-left">
            <p className={cn("text-xs font-bold leading-none", darkMode ? "text-white" : "text-slate-800")}>
              {user.name.split(' ')[0]}
            </p>
            <p className="text-[9px] font-black text-[#3FA9F5] uppercase tracking-widest mt-0.5">
              {t('profile')}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
