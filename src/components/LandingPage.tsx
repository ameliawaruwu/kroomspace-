import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Play,
  Globe,
  Layout,
  CheckCircle2, 
  Settings, 
  Wrench, 
  Kanban,
  LayoutDashboard,
  ShieldAlert,
  Users,
  Activity,
  Search,
  ClipboardList,
  BarChart3,
  Instagram,
  Twitter,
  Facebook,
  Zap,
  Wallet,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface LandingPageProps {
  onStart: () => void;
  language: 'en' | 'id';
  setLanguage: (lang: 'en' | 'id') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, language, setLanguage }) => {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Beranda');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Scrollspy setup
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (id) {
            const menuMapping: Record<string, string> = {
              'beranda': 'Beranda',
              'tentang': 'Tentang',
              'fitur': 'Fitur',
              'keunggulan': 'Keunggulan',
              'faq': 'FAQ'
            };
            if (menuMapping[id]) setActiveMenu(menuMapping[id]);
          }
        }
      });
    }, { rootMargin: '-30% 0px -50% 0px' });

    sections.forEach(section => observer.observe(section));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string, name: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#2C3E50] font-sans selection:bg-[#3498DB]/20 overflow-x-hidden relative">
      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-[#1E3A8A]/5 to-transparent" />
        <div className="absolute top-1/4 right-0 w-[50vw] h-[50vw] bg-[#3498DB]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[#1E3A8A]/5 rounded-full blur-[150px]" />
      </div>

      {/* Modern SaaS Navigation */}
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled 
            ? "bg-[#0B1727]/90 backdrop-blur-xl py-3" 
            : "bg-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveMenu('Beranda')}>
            <div className="relative">
              <div className={cn("absolute inset-0 blur-xl rounded-full transition-all duration-500", isScrolled ? "bg-white opacity-60" : "bg-transparent opacity-0")} />
              <img src="https://i.ibb.co.com/Fk4YB1cM/logo-ks.png" alt="KroomSpace Logo" className={cn("relative object-contain transition-all duration-300", isScrolled ? "h-[45px]" : "h-[60px]")} />
            </div>
            <span className={cn("text-xl md:text-2xl font-black tracking-tight uppercase transition-colors duration-500", isScrolled ? "text-white" : "text-[#0B1727]")}>KROOMSPACE</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-10">
            {[
              { name: 'Beranda', id: 'beranda' }, 
              { name: 'Tentang', id: 'tentang' }, 
              { name: 'Fitur', id: 'fitur' }, 
              { name: 'Keunggulan', id: 'keunggulan' }, 
              { name: 'FAQ', id: 'faq' }
            ].map((item) => (
              <a 
                key={item.name}
                href={`#${item.id}`} 
                onClick={(e) => handleNavClick(e, item.id, item.name)}
                className={cn(
                  "relative text-[14px] font-bold transition-colors group py-2",
                  activeMenu === item.name 
                    ? (isScrolled ? "text-white" : "text-[#0B1727]") 
                    : (isScrolled ? "text-blue-100/70 hover:text-white" : "text-[#4B5563] hover:text-[#0B1727]")
                )}
              >
                {item.name}
                <span 
                  className={cn(
                    "absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#3498DB] to-[#00D2FF] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(52,152,219,0.8)]",
                    activeMenu === item.name ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                  )} 
                />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-6">
            <button 
              onClick={onStart}
              className={cn(
                "text-[14px] font-bold transition-colors",
                isScrolled ? "text-blue-100/70 hover:text-white" : "text-[#4B5563] hover:text-[#0B1727]"
              )}
            >
              Login
            </button>
            <button 
              onClick={onStart}
              className="relative overflow-hidden group bg-gradient-to-r from-[#1E3A8A] to-[#3498DB] text-white px-7 py-2.5 rounded-full text-[14px] font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(52,152,219,0.4)] hover:shadow-[0_0_30px_rgba(52,152,219,0.6)] active:scale-95 border border-blue-400/20"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-2">Mulai Sekarang <ArrowRight size={16} /></span>
            </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className={cn("lg:hidden p-2 transition-colors duration-500", isScrolled ? "text-blue-100 hover:text-white" : "text-[#4B5563] hover:text-[#0B1727]")}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Slide */}
      <div 
        className={cn(
          "fixed inset-0 bg-[#0B1727] z-40 lg:hidden transition-transform duration-500 ease-in-out pt-24 px-6 flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col gap-6 text-xl font-bold text-white">
            {[
              { name: 'Beranda', id: 'beranda' }, 
              { name: 'Tentang', id: 'tentang' }, 
              { name: 'Fitur', id: 'fitur' }, 
              { name: 'Keunggulan', id: 'keunggulan' }, 
              { name: 'FAQ', id: 'faq' }
            ].map((item) => (
            <a 
              key={item.name}
              href={`#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id, item.name)}
              className={cn(
                "border-b border-[#1E3A8A]/30 pb-4 transition-colors",
                activeMenu === item.name ? "text-[#3498DB]" : "text-blue-100/70 hover:text-[#3498DB]"
              )}
            >
              {item.name}
            </a>
          ))}
        </div>
        <div className="mt-auto mb-10 flex flex-col gap-4">
            <button 
              onClick={() => { setIsMobileMenuOpen(false); onStart(); }}
              className="w-full py-4 text-center text-[16px] font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3498DB] rounded-xl shadow-lg shadow-blue-500/25 border border-blue-400/20"
            >
            Mulai Sekarang
          </button>
        </div>
      </div>

      {/* 1. Hero Section */}
      <section id="beranda" className="pt-40 pb-32 px-4 md:px-8 max-w-7xl mx-auto relative overflow-visible z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E3A8A0A_1px,transparent_1px),linear-gradient(to_bottom,#1E3A8A0A_1px,transparent_1px)] bg-[size:32px_32px] -z-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Radial Gradient Glowing Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-[#3498DB]/15 via-[#1E3A8A]/5 to-transparent blur-[100px] -z-10 rounded-full pointer-events-none" />
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#3498DB]/10 rounded-full blur-[120px] -z-10 pointer-events-none" 
        />
        
        {/* Abstract Floating Dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#3498DB]/50 blur-[1px] pointer-events-none"
            animate={{
              y: [0, Math.random() * 40 - 20, 0],
              x: [0, Math.random() * 40 - 20, 0],
              scale: [1, Math.random() * 0.5 + 1, 1],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
            style={{
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`
            }}
          />
        ))}
        
        <div className="text-center space-y-8 max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#3498DB]/20 shadow-[0_4px_20px_rgba(52,152,219,0.15)] mb-4"
          >
            <div className="w-2 h-2 rounded-full bg-[#3498DB] animate-pulse shadow-[0_0_8px_#3498DB]" />
            <span className="text-[12px] font-black uppercase tracking-widest text-[#1E3A8A]">
              Pusat Kendali <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] to-[#3498DB]">Operasional</span>
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-[#0B1727] tracking-tight leading-[1.15]"
          >
            Visualisasikan Proyek dan Selesaikan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] via-[#3498DB] to-[#00D2FF] drop-shadow-sm">Maintenance</span> Tepat Waktu.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#4B5563] max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Platform manajemen proyek berbasis <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498DB] to-[#1E3A8A] font-bold">Kanban</span> yang memadukan pelacakan tugas dengan sistem pemeliharaan fasilitas dalam satu ekosistem SaaS terpadu.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-4 relative group overflow-hidden bg-gradient-to-r from-[#0B1727] to-[#1E3A8A] text-white rounded-2xl text-[16px] font-bold transition-all shadow-[0_10px_30px_rgba(11,23,39,0.3)] hover:shadow-[0_15px_40px_rgba(30,58,138,0.4)] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] to-[#3498DB] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                Mulai Kelola Proyek <ArrowRight size={20} className="text-[#3498DB] group-hover:text-white transition-colors" />
              </span>
            </button>
          </motion.div>
        </div>

        {/* Hero Dashboard Mockup & Floating Elements */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, type: "spring", stiffness: 50 }}
          className="mt-24 relative max-w-6xl mx-auto perspective-1000"
        >
          {/* Main Dashboard Mockup */}
          <div className="relative z-10 bg-[#0B1727] border border-white/10 rounded-[2rem] p-3 shadow-[0_30px_80px_rgba(11,23,39,0.4)] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_rgba(52,152,219,0.3)] ring-1 ring-white/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#3498DB]/30 blur-[80px] pointer-events-none" />
            
            <div className="bg-[#131B2F] rounded-t-[1.5rem] border border-white/5 flex flex-col overflow-hidden h-[550px] relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E3A8A]/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Dashboard Header */}
              <div className="bg-[#0B1727]/80 backdrop-blur-md px-6 py-4 border-b border-white/10 flex items-center justify-between z-10">
                <div className="flex items-center gap-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#E74C3C]" />
                    <div className="w-3 h-3 rounded-full bg-[#F1C40F]" />
                    <div className="w-3 h-3 rounded-full bg-[#2ECC71]" />
                  </div>
                  <div className="hidden md:flex gap-6 text-xs font-bold text-blue-100/50">
                    <span className="text-[#3498DB] flex items-center gap-2 bg-[#3498DB]/10 px-3 py-1.5 rounded-md"><Kanban size={14}/> Kanban Board</span>
                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><Layout size={14}/> Timeline</span>
                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><BarChart3 size={14}/> Analytics</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48 h-8 bg-[#0B1727] rounded-full border border-white/10 flex items-center px-3 shadow-inner">
                    <Search size={14} className="text-blue-100/40" />
                    <span className="text-xs text-blue-100/40 ml-2">Search task...</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-[#3498DB] p-0.5">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" className="w-full h-full rounded-full bg-[#0B1727]" alt="Avatar"/>
                  </div>
                </div>
              </div>

              {/* Dashboard Content Layout */}
              <div className="flex-1 flex overflow-hidden z-10">
                {/* Sidebar Mini */}
                <div className="hidden md:flex w-16 border-r border-white/5 bg-[#0B1727]/50 flex-col items-center py-6 gap-6">
                  <div className="p-2 bg-[#3498DB]/10 rounded-xl text-[#3498DB]"><LayoutDashboard size={20} /></div>
                  <div className="p-2 text-blue-100/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Kanban size={20} /></div>
                  <div className="p-2 text-blue-100/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Wrench size={20} /></div>
                  <div className="p-2 text-blue-100/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Users size={20} /></div>
                </div>

                {/* Kanban Main Area */}
                <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#131B2F] relative overflow-hidden">
                  
                  {/* To-Do */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-500" /> To Do
                      </span>
                      <span className="text-xs font-bold text-slate-500 bg-[#0B1727] px-2 py-0.5 rounded-full border border-white/5">3</span>
                    </div>
                    <div className="bg-[#0B1727]/80 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-lg group hover:border-slate-500/50 transition-colors cursor-pointer">
                      <div className="text-[10px] font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded w-max mb-3 border border-slate-600/30">DESIGN</div>
                      <p className="text-sm font-bold text-white mb-4">UI Revamp Homepage</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <CheckCircle2 size={14}/> 0/4
                        </div>
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=A" className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600" alt=""/>
                      </div>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#3498DB] shadow-[0_0_8px_#3498DB]" /> In Progress
                      </span>
                      <span className="text-xs font-bold text-[#3498DB] bg-[#3498DB]/10 px-2 py-0.5 rounded-full border border-[#3498DB]/20">2</span>
                    </div>
                    <div className="bg-[#1E3A8A]/20 backdrop-blur-md p-4 rounded-xl border border-[#3498DB]/30 shadow-[0_8px_30px_rgba(52,152,219,0.1)] group hover:border-[#3498DB] transition-all cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#3498DB] shadow-[0_0_10px_#3498DB]" />
                      <div className="text-[10px] font-bold text-[#3498DB] bg-[#3498DB]/10 px-2 py-1 rounded w-max mb-3 border border-[#3498DB]/20">DEVELOPMENT</div>
                      <p className="text-sm font-bold text-white mb-3">API Integration Auth</p>
                      <div className="w-full bg-[#0B1727] rounded-full h-1.5 mb-4 border border-white/5 overflow-hidden">
                        <div className="bg-[#3498DB] h-full rounded-full w-[65%] shadow-[0_0_10px_#3498DB]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-[#3498DB] font-medium">
                          <CheckCircle2 size={14}/> 3/5
                        </div>
                        <div className="flex -space-x-2">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=D" className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600" alt=""/>
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=E" className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600" alt=""/>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Alert */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#E74C3C] shadow-[0_0_8px_#E74C3C]" /> Maintenance
                      </span>
                      <span className="text-xs font-bold text-[#E74C3C] bg-[#E74C3C]/10 px-2 py-0.5 rounded-full border border-[#E74C3C]/20">1</span>
                    </div>
                    <div className="bg-[#E74C3C]/10 backdrop-blur-md p-4 rounded-xl border border-[#E74C3C]/30 shadow-[0_8px_30px_rgba(231,76,60,0.1)] group hover:border-[#E74C3C] transition-all cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#E74C3C]/10 rounded-bl-full blur-xl" />
                      <div className="text-[10px] font-bold text-[#E74C3C] bg-[#E74C3C]/20 px-2 py-1 rounded w-max mb-3 border border-[#E74C3C]/30 flex items-center gap-1">
                        <Wrench size={12}/> URGENT
                      </div>
                      <p className="text-sm font-bold text-white mb-4">Server Downtime DB-01</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#E74C3C] bg-[#E74C3C]/10 px-2 py-1 rounded-md">Menunggu Teknisi</span>
                        <div className="w-2 h-2 rounded-full bg-[#E74C3C] animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Done */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#2ECC71] shadow-[0_0_8px_#2ECC71]" /> Done
                      </span>
                      <span className="text-xs font-bold text-[#2ECC71] bg-[#2ECC71]/10 px-2 py-0.5 rounded-full border border-[#2ECC71]/20">12</span>
                    </div>
                    <div className="bg-[#2ECC71]/5 backdrop-blur-md p-4 rounded-xl border border-[#2ECC71]/20 opacity-80 group hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="text-[10px] font-bold text-[#2ECC71] bg-[#2ECC71]/10 px-2 py-1 rounded w-max mb-3 border border-[#2ECC71]/20">COMPLETED</div>
                      <p className="text-sm font-bold text-slate-300 line-through mb-4">Setup Repository</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">2 hari yang lalu</span>
                        <CheckCircle2 size={16} className="text-[#2ECC71]" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* FLOATING CARDS - Desktop Only */}
          {/* 1. Progress Analytics - Top Right */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="hidden lg:flex absolute -right-8 top-10 z-20 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_15px_40px_rgba(30,58,138,0.15)] border border-[#3498DB]/20 items-center gap-4 hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2ECC71] to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-[#2ECC71]/30">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0B1727]">98%</p>
              <p className="text-[11px] font-bold text-[#4B5563] uppercase tracking-widest">Fasilitas Optimal</p>
            </div>
          </motion.div>

          {/* 2. Team Activity - Bottom Left */}
          <motion.div 
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="hidden lg:flex absolute -left-8 bottom-20 z-20 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_15px_40px_rgba(30,58,138,0.15)] border border-[#3498DB]/20 items-center gap-4 hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3498DB] to-[#00D2FF] flex items-center justify-center text-white shadow-lg shadow-[#3498DB]/30">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0B1727]">5</p>
              <p className="text-[11px] font-bold text-[#4B5563] uppercase tracking-widest">Tugas Berjalan</p>
            </div>
          </motion.div>

          {/* 3. Maintenance Alert - Top Left */}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="hidden lg:flex absolute -left-4 top-24 z-20 bg-[#0B1727]/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_15px_40px_rgba(231,76,60,0.2)] border border-[#E74C3C]/30 items-center gap-4 ring-1 ring-[#E74C3C]/10 hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E74C3C] to-red-400 flex items-center justify-center text-white shadow-lg shadow-[#E74C3C]/30">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">2</p>
              <p className="text-[11px] font-bold text-red-200 uppercase tracking-widest">Maintenance Darurat</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Decorative Separator */}
      <div className="h-24 bg-gradient-to-b from-[#F4F7FB] to-white relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-[#3498DB]/30 to-transparent" />
      </div>

      {/* 1.5 Tentang Section */}
      <section id="tentang" className="py-24 bg-white border-y border-[#3498DB]/10 relative z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3498DB]/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-[#0B1727] mb-4">Dari Masalah hingga Selesai</h2>
            <p className="text-[#4B5563] max-w-2xl mx-auto font-medium">Alur kerja sistematis yang memastikan setiap tiket ditangani dengan sempurna.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-gradient-to-r from-slate-200 via-[#3498DB] to-slate-200 -z-10 shadow-[0_0_10px_#3498DB]" />

            {[
              { title: "Identifikasi", desc: "Laporan masuk atau jadwal tercatat.", icon: <Search size={24}/>, color: "text-[#1E3A8A]", bg: "bg-blue-50" },
              { title: "Masuk Kanban", desc: "Tugas dikategorikan & diprioritaskan.", icon: <Kanban size={24}/>, color: "text-[#3498DB]", bg: "bg-[#3498DB]/10" },
              { title: "Eksekusi", desc: "Tim menangani perbaikan/tugas.", icon: <Settings size={24}/>, color: "text-[#E74C3C]", bg: "bg-[#E74C3C]/10" },
              { title: "Selesai", desc: "Verifikasi dan dokumentasi otomatis.", icon: <CheckCircle2 size={24}/>, color: "text-[#2ECC71]", bg: "bg-[#2ECC71]/10" }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative group">
                <div className={cn("w-24 h-24 rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.05)] border-4 border-white mb-6 transition-transform group-hover:scale-110", step.bg, step.color)}>
                  {step.icon}
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-[0_10px_30px_rgba(30,58,138,0.05)] border border-[#3498DB]/10 w-full h-full group-hover:border-[#3498DB]/30 transition-colors">
                  <div className="text-xs font-black text-[#3498DB] mb-2 tracking-widest uppercase">LANGKAH {i+1}</div>
                  <h4 className="text-lg font-bold text-[#0B1727] mb-2">{step.title}</h4>
                  <p className="text-sm text-[#4B5563] font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Fitur Utama */}
      <section id="fitur" className="py-24 bg-[#F8FAFC] relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#0B1727] mb-4">The Core Powerhouse</h2>
            <p className="text-[#4B5563] max-w-2xl mx-auto font-medium">Dua pilar utama KroomSpace yang dirancang untuk mengendalikan kompleksitas operasional Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Kanban Feature */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2rem] p-10 border border-[#3498DB]/10 relative overflow-hidden group shadow-[0_20px_40px_rgba(30,58,138,0.05)] hover:shadow-[0_30px_60px_rgba(52,152,219,0.15)] transition-all"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#3498DB]/5 rounded-full blur-[80px] -z-0 transition-all group-hover:bg-[#3498DB]/15" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#3498DB] rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(52,152,219,0.3)] mb-6 text-white">
                  <Kanban size={28} />
                </div>
                <h3 className="text-2xl font-bold text-[#0B1727] mb-4">Manajemen Proyek Berbasis Kanban</h3>
                <ul className="space-y-4">
                  {[
                    "Drag and drop task card",
                    "Visual workflow board",
                    "Prioritas tugas otomatis",
                    "Due date & assignment instan",
                    "Tracking progres realtime"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#4B5563] font-medium">
                      <div className="mt-1 bg-[#3498DB]/10 p-1 rounded-full text-[#3498DB]"><CheckCircle2 size={12} /></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Maintenance Feature */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#0B1727] rounded-[2rem] p-10 relative overflow-hidden group text-white shadow-[0_20px_50px_rgba(11,23,39,0.3)] hover:shadow-[0_30px_60px_rgba(30,58,138,0.4)] transition-all border border-[#1E3A8A]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#3498DB]/20 rounded-full blur-[80px] -z-0 transition-all group-hover:bg-[#3498DB]/30" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-6 text-[#3498DB] backdrop-blur-md shadow-[0_0_15px_rgba(52,152,219,0.3)]">
                  <Wrench size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Sistem Maintenance Terpadu</h3>
                <ul className="space-y-4">
                  {[
                    "Tiket maintenance otomatis",
                    "Integrasi maintenance ke Kanban board",
                    "Tracking aset & biaya perbaikan",
                    "Monitoring perawatan berkala",
                    "Riwayat perbaikan komprehensif"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-blue-100 font-medium">
                      <div className="mt-1 bg-[#3498DB]/20 p-1 rounded-full text-[#3498DB] shadow-[0_0_8px_#3498DB]"><CheckCircle2 size={12} /></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Keunggulan Proposition */}
      <section id="keunggulan" className="py-24 bg-white relative border-t border-[#3498DB]/10 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-[#0B1727] tracking-tight leading-[1.1]">
                Mengapa memilih <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] to-[#3498DB]">KroomSpace?</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <Users size={20}/>, title: "Kolaborasi Tanpa Batas" },
                  { icon: <Zap size={20}/>, title: "Respons Lebih Cepat" },
                  { icon: <Wallet size={20}/>, title: "Efisiensi Anggaran" },
                  { icon: <Activity size={20}/>, title: "Monitoring Transparan" },
                  { icon: <ClipboardList size={20}/>, title: "Dokumentasi Terpusat" }
                ].map((val, i) => (
                  <div key={i} className="flex items-center gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#3498DB]/10 hover:border-[#3498DB]/30 hover:shadow-[0_5px_15px_rgba(52,152,219,0.1)] transition-all group cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#3498DB] shadow-sm group-hover:bg-[#3498DB] group-hover:text-white transition-colors">
                      {val.icon}
                    </div>
                    <span className="font-bold text-[#2C3E50] text-sm">{val.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2">
               <div className="bg-[#0B1727] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(11,23,39,0.3)] border border-[#1E3A8A]/50">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#3498DB]/20 rounded-full blur-[60px] -z-0" />
                 
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">Analytics Overview</h3>
                      <div className="p-2 bg-[#3498DB]/20 rounded-lg text-[#3498DB] shadow-[0_0_10px_#3498DB]">
                        <BarChart3 size={20} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                        <p className="text-[#3498DB] text-xs font-bold uppercase tracking-wider mb-1">Maintenance Cost</p>
                        <p className="text-2xl font-black text-white">-34%</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                        <p className="text-[#3498DB] text-xs font-bold uppercase tracking-wider mb-1">Task Completion</p>
                        <p className="text-2xl font-black text-white">+52%</p>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 h-32 flex items-end justify-between px-2 pb-2 group">
                       {[40, 70, 45, 90, 60, 100, 80].map((height, i) => (
                         <div key={i} className="w-[10%] bg-gradient-to-t from-[#1E3A8A] to-[#3498DB] rounded-t-md group-hover:from-[#3498DB] group-hover:to-[#00D2FF] transition-colors duration-500 shadow-[0_0_10px_rgba(52,152,219,0.2)]" style={{ height: `${height}%` }} />
                       ))}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-[#F8FAFC] border-t border-[#3498DB]/10 relative z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#0B1727] mb-4">Frequently Asked Questions</h2>
            <p className="text-[#4B5563] font-medium max-w-2xl mx-auto">Masih memiliki pertanyaan? Berikut adalah jawaban dari pertanyaan yang sering ditanyakan mengenai KroomSpace.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Apa itu KroomSpace?",
                a: "KroomSpace adalah platform SaaS manajemen operasional yang memadukan manajemen tugas berbasis Kanban dengan sistem pelacakan maintenance fasilitas secara terpadu."
              },
              {
                q: "Bagaimana sistem maintenance bekerja?",
                a: "Sistem maintenance KroomSpace mengotomatisasi pembuatan tiket, memberikan notifikasi realtime untuk tugas darurat, serta mendokumentasikan setiap riwayat perbaikan aset dalam satu dashboard."
              },
              {
                q: "Apakah mendukung Kanban board?",
                a: "Ya! Manajemen proyek di KroomSpace 100% menggunakan Kanban board yang intuitif, memungkinkan tim Anda melakukan drag-and-drop kartu tugas untuk visualisasi alur kerja yang mudah."
              },
              {
                q: "Apakah bisa digunakan banyak tim?",
                a: "Tentu. Platform kami didesain khusus untuk kolaborasi tanpa batas antar departemen, baik itu tim IT, teknisi lapangan, manajemen operasional, maupun tim eksekutif."
              },
              {
                q: "Bagaimana monitoring tugas dilakukan?",
                a: "KroomSpace menyediakan dashboard analitik real-time yang memantau performa, tenggat waktu, dan beban kerja tim, sehingga Anda selalu tahu progress pekerjaan secara detail."
              }
            ].map((faq, index) => (
              <div 
                key={index}
                className="bg-white border border-[#3498DB]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_10px_20px_rgba(52,152,219,0.05)] hover:border-[#3498DB]/30 transition-all cursor-pointer"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className="p-6 flex justify-between items-center bg-white">
                  <h4 className={cn("font-bold text-[15px] transition-colors", activeFaq === index ? "text-[#3498DB]" : "text-[#0B1727]")}>{faq.q}</h4>
                  <div className={cn("text-[#3498DB] transition-transform duration-300", activeFaq === index ? "rotate-180" : "")}>
                    <ChevronDown size={20} />
                  </div>
                </div>
                <motion.div 
                  initial={false}
                  animate={{ height: activeFaq === index ? "auto" : 0, opacity: activeFaq === index ? 1 : 0 }}
                  className="overflow-hidden bg-[#F8FAFC]"
                >
                  <div className="p-6 pt-0 text-[#4B5563] font-medium leading-relaxed border-t border-[#3498DB]/10">
                    {faq.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1727] text-white pt-24 pb-12 px-4 md:px-8 border-t border-[#1E3A8A] relative overflow-hidden z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#3498DB] to-transparent shadow-[0_0_10px_#3498DB]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center gap-3">
                <img src="https://i.ibb.co.com/Fk4YB1cM/logo-ks.png" alt="KroomSpace" className="h-[30px]" />
                <span className="text-xl font-black text-white tracking-tight uppercase">KROOMSPACE</span>
              </div>
              <p className="text-blue-100/60 text-sm font-medium leading-relaxed max-w-xs">
                Platform manajemen proyek berbasis Kanban yang memadukan pelacakan tugas dengan sistem pemeliharaan fasilitas.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#3498DB]">Tautan</h4>
              <ul className="space-y-3 text-sm font-bold text-blue-100/60">
                <li><a href="#" className="hover:text-white hover:text-[#3498DB] transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-white hover:text-[#3498DB] transition-colors">Syarat & Ketentuan</a></li>
                <li><a href="#" className="hover:text-white hover:text-[#3498DB] transition-colors">Bantuan</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#3498DB]">Kontak</h4>
              <ul className="space-y-3 text-sm font-bold text-blue-100/60">
                <li className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#3498DB] group-hover:bg-[#3498DB] group-hover:text-white transition-colors"><Globe size={14} /></div>
                  <span className="group-hover:text-white transition-colors">hello@kroomspace.com</span>
                </li>
                <li className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#3498DB] group-hover:bg-[#3498DB] group-hover:text-white transition-colors"><Users size={14} /></div>
                  <span className="group-hover:text-white transition-colors">+62 21 888 777</span>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#3498DB]">Sosial</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#3498DB] hover:text-white hover:border-[#3498DB] transition-all text-[#3498DB] shadow-lg hover:shadow-[0_0_15px_rgba(52,152,219,0.5)]">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#3498DB] hover:text-white hover:border-[#3498DB] transition-all text-[#3498DB] shadow-lg hover:shadow-[0_0_15px_rgba(52,152,219,0.5)]">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#3498DB] hover:text-white hover:border-[#3498DB] transition-all text-[#3498DB] shadow-lg hover:shadow-[0_0_15px_rgba(52,152,219,0.5)]">
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-[10px] font-black text-blue-100/40 uppercase tracking-widest">&copy; 2026 KroomSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
