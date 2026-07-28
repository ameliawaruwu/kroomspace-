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
  ChevronDown,
  Sun,
  Moon,
  Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface LandingPageProps {
  onStart: () => void;
  language: 'en' | 'id';
  setLanguage: (lang: 'en' | 'id') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

const d = {
  id: {
    nav: {
      beranda: 'Beranda',
      tentang: 'Tentang',
      fitur: 'Fitur',
      keunggulan: 'Keunggulan',
      faq: 'FAQ',
      login: 'Login',
      cta: 'Mulai Sekarang'
    },
    hero: {
      badge: 'Aplikasi Internal Kroombox',
      title: 'Visualisasikan Proyek & Kelola Maintenance Internal Kroombox.',
      subtitle: 'Platform manajemen proyek berbasis Kanban internal Kroombox yang memadukan pelacakan tugas dengan pemeliharaan fasilitas dalam satu ekosistem terpadu.',
      cta: 'Buka Dashboard',
      task1Tag: 'PERENCANAAN',
      task1Title: 'Analisis Kelayakan Aset',
      task2Tag: 'MAINTENANCE',
      task2Title: 'Servis AC Lantai 3',
      task3Tag: 'DEVELOPMENT',
      task3Title: 'Integrasi API Auth',
      task4Tag: 'URGENT',
      task4Title: 'Perbaikan Pipa Bocor',
      statusWaiting: 'Menunggu Teknisi',
      twoDaysAgo: '2 hari yang lalu',
      facilityOptimal: 'Fasilitas Optimal',
      activeTasks: 'Tugas Berjalan',
      emergencyMaint: 'Maintenance Darurat'
    },
    tentang: {
      title: 'Alur Kerja Operasional Kroombox',
      subtitle: 'Dari masalah hingga selesai. Alur kerja sistematis yang memastikan setiap proyek dan tiket maintenance internal ditangani dengan sempurna.',
      steps: [
        { title: "Identifikasi", desc: "Laporan masuk atau jadwal tercatat." },
        { title: "Masuk Kanban", desc: "Tugas dikategorikan & diprioritaskan." },
        { title: "Eksekusi", desc: "Tim menangani perbaikan/tugas." },
        { title: "Selesai", desc: "Verifikasi dan dokumentasi otomatis." }
      ],
      stepLabel: 'LANGKAH'
    },
    fitur: {
      title: 'Pilar Utama KroomSpace',
      subtitle: 'Dua modul utama KroomSpace yang dirancang untuk mengendalikan kompleksitas operasional internal Kroombox.',
      kanban: {
        title: 'Manajemen Proyek Berbasis Kanban',
        items: [
          "Drag and drop task card",
          "Visual workflow board",
          "Prioritas tugas otomatis",
          "Due date & assignment instan",
          "Tracking progres realtime"
        ]
      },
      maintenance: {
        title: 'Sistem Maintenance Terpadu',
        items: [
          "Tiket maintenance otomatis",
          "Integrasi maintenance ke Kanban board",
          "Tracking aset & biaya perbaikan",
          "Monitoring perawatan berkala",
          "Riwayat perbaikan komprehensif"
        ]
      }
    },
    keunggulan: {
      title: 'Mengapa Kroombox Menggunakan KroomSpace?',
      items: [
        "Kolaborasi Tanpa Batas",
        "Respons Lebih Cepat",
        "Efisiensi Anggaran",
        "Monitoring Transparan",
        "Dokumentasi Terpusat"
      ]
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Pertanyaan umum mengenai KroomSpace sebagai sistem manajemen internal Kroombox.',
      items: [
        {
          q: "Apa itu KroomSpace?",
          a: "KroomSpace adalah platform internal Kroombox yang memadukan manajemen tugas berbasis Kanban dengan sistem pelacakan maintenance fasilitas secara terpadu."
        },
        {
          q: "Bagaimana sistem maintenance bekerja?",
          a: "Setiap kebutuhan perbaikan fasilitas Kroombox otomatis dibuatkan tiket di Kanban board, dipantau secara real-time, dan didokumentasikan riwayatnya."
        },
        {
          q: "Apakah mendukung Kanban board?",
          a: "Ya! Seluruh tugas internal Kroombox dilacak menggunakan Kanban board visual yang intuitif dengan fitur drag-and-drop."
        },
        {
          q: "Apakah bisa digunakan banyak tim?",
          a: "Tentu. KroomSpace dirancang untuk kolaborasi antar tim Kroombox, mulai dari teknisi lapangan, manajemen operasional, hingga tim admin."
        },
        {
          q: "Bagaimana monitoring tugas dilakukan?",
          a: "Melalui dasbor analitik real-time yang memantau performa, tenggat waktu (SLA), dan beban kerja tim secara transparan."
        }
      ]
    },
    footer: {
      desc: 'Aplikasi internal Kroombox untuk manajemen proyek berbasis Kanban dan sistem pemeliharaan fasilitas.',
      tautan: 'Tautan',
      kebijakan: 'Kebijakan Privasi',
      syarat: 'Syarat & Ketentuan',
      bantuan: 'Bantuan',
      kontak: 'Kontak',
      sosial: 'Sosial'
    }
  },
  en: {
    nav: {
      beranda: 'Home',
      tentang: 'About',
      fitur: 'Features',
      keunggulan: 'Advantages',
      faq: 'FAQ',
      login: 'Login',
      cta: 'Get Started'
    },
    hero: {
      badge: 'Kroombox Internal Application',
      title: 'Visualize Projects & Manage Kroombox Internal Maintenance.',
      subtitle: 'Kroombox\'s internal Kanban-based project management platform integrating task tracking with facility maintenance in a unified ecosystem.',
      cta: 'Open Dashboard',
      task1Tag: 'PLANNING',
      task1Title: 'Asset Feasibility Analysis',
      task2Tag: 'MAINTENANCE',
      task2Title: 'AC Servicing Floor 3',
      task3Tag: 'DEVELOPMENT',
      task3Title: 'API Auth Integration',
      task4Tag: 'URGENT',
      task4Title: 'Leak Pipe Repair',
      statusWaiting: 'Awaiting Tech',
      twoDaysAgo: '2 days ago',
      facilityOptimal: 'Optimal Facility',
      activeTasks: 'Active Tasks',
      emergencyMaint: 'Emergency Maint'
    },
    tentang: {
      title: 'Kroombox Operational Workflow',
      subtitle: 'From issue to done. Systematic workflow ensuring every internal project and maintenance ticket is handled perfectly.',
      steps: [
        { title: "Identify", desc: "Incoming reports or scheduled logs." },
        { title: "Kanban Queue", desc: "Tasks are categorized & prioritized." },
        { title: "Execute", desc: "Team handles repairs/tasks." },
        { title: "Verify & Complete", desc: "Automated verification and documentation." }
      ],
      stepLabel: 'STEP'
    },
    fitur: {
      title: 'Core Pillars of KroomSpace',
      subtitle: 'Two core modules of KroomSpace designed to control Kroombox\'s internal operational complexities.',
      kanban: {
        title: 'Kanban-Based Project Management',
        items: [
          "Drag and drop task cards",
          "Visual workflow boards",
          "Automated task prioritization",
          "Instant due dates & assignments",
          "Real-time progress tracking"
        ]
      },
      maintenance: {
        title: 'Integrated Maintenance System',
        items: [
          "Automated maintenance ticketing",
          "Kanban board task integration",
          "Asset & repair cost tracking",
          "Periodic care monitoring",
          "Comprehensive repair logs"
        ]
      }
    },
    keunggulan: {
      title: 'Why Kroombox Uses KroomSpace?',
      items: [
        "Seamless Collaboration",
        "Faster Response Times",
        "Budget Efficiency",
        "Transparent Monitoring",
        "Centralized Documentation"
      ]
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about KroomSpace as Kroombox\'s internal management system.',
      items: [
        {
          q: "What is KroomSpace?",
          a: "KroomSpace is Kroombox\'s internal platform integrating Kanban-based task management with a facility maintenance tracking system."
        },
        {
          q: "How does the maintenance system work?",
          a: "Every Kroombox facility repair request automatically creates a ticket on the Kanban board, monitored in real-time, and logged in histories."
        },
        {
          q: "Does it support a Kanban board?",
          a: "Yes! All Kroombox internal tasks are tracked using an intuitive visual Kanban board with drag-and-drop features."
        },
        {
          q: "Can multiple teams use it?",
          a: "Absolutely. KroomSpace is designed for collaboration among Kroombox teams, including field crews, operations management, and admin teams."
        },
        {
          q: "How is task monitoring done?",
          a: "Through the real-time analytics dashboard monitoring performance, deadlines (SLAs), and team workload transparently."
        }
      ]
    },
    footer: {
      desc: 'Kroombox\'s internal application for Kanban-based project management and facility maintenance.',
      tautan: 'Links',
      kebijakan: 'Privacy Policy',
      syarat: 'Terms & Conditions',
      bantuan: 'Help',
      kontak: 'Contact',
      sosial: 'Social'
    }
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, language, setLanguage, darkMode, setDarkMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Beranda');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const langKey = (language && language.toLowerCase().startsWith('id')) ? 'id' : 'en';
  const dict = d[langKey];

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

  const navItems = [
    { name: dict.nav.beranda, id: 'beranda', originalKey: 'Beranda' },
    { name: dict.nav.tentang, id: 'tentang', originalKey: 'Tentang' },
    { name: dict.nav.keunggulan, id: 'keunggulan', originalKey: 'Keunggulan' },
    { name: dict.nav.faq, id: 'faq', originalKey: 'FAQ' }
  ];

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-[#3498DB]/20 overflow-x-hidden relative transition-colors duration-500",
      darkMode ? "bg-[#0B1727] text-slate-100" : "bg-[#F4F7FB] text-[#2C3E50]"
    )}>
      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn(
          "absolute top-0 left-0 w-full h-[800px] transition-all duration-500",
          darkMode ? "bg-gradient-to-b from-blue-900/10 to-transparent" : "bg-gradient-to-b from-[#1E3A8A]/5 to-transparent"
        )} />
        <div className="absolute top-1/4 right-0 w-[50vw] h-[50vw] bg-[#3498DB]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[#1E3A8A]/5 rounded-full blur-[150px]" />
      </div>

      {/* Modern SaaS Navigation - Floating style */}
      <nav
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-7xl rounded-2xl border shadow-[0_10px_30px_rgba(0,0,0,0.1)]",
          darkMode ? "border-white/10" : "border-[#3498DB]/15",
          isScrolled
            ? (darkMode ? "bg-[#0B1727]/95 backdrop-blur-xl py-2.5" : "bg-[#F0F6FF]/95 backdrop-blur-xl py-2.5")
            : (darkMode ? "bg-[#0B1727]/85 backdrop-blur-md py-3.5" : "bg-[#F0F6FF]/85 backdrop-blur-md py-3.5")
        )}
      >
        <div className="w-full px-6 flex items-center">
          {/* Logo - kiri */}
          <div className="flex items-center gap-2 group cursor-pointer mr-auto" onClick={() => setActiveMenu('Beranda')}>
            <div className="relative">
              <img src="https://i.ibb.co.com/Fk4YB1cM/logo-ks.png" alt="KroomSpace Logo" style={{ height: '36px', width: 'auto' }} className="relative object-contain transition-all duration-300" />
            </div>
            <span className={cn("text-base font-black tracking-tight uppercase transition-colors", darkMode ? "text-white" : "text-[#1E3A8A]")}>KROOMSPACE</span>
          </div>

          {/* Desktop Menu - tengah */}
          <div className="hidden lg:flex items-center gap-5 mx-auto">
            {navItems.map((item) => (
              <a
                key={item.originalKey}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id, item.originalKey)}
                className={cn(
                  "relative text-[13px] font-semibold transition-colors group py-1.5",
                  activeMenu === item.originalKey
                    ? (darkMode ? "text-white" : "text-[#1E3A8A]")
                    : (darkMode ? "text-blue-100/70 hover:text-white" : "text-[#4B5563] hover:text-[#1E3A8A]")
                )}
              >
                {item.name}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#3498DB] to-[#00D2FF] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(52,152,219,0.8)]",
                    activeMenu === item.originalKey ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                  )}
                />
              </a>
            ))}
          </div>

          {/* Desktop Controls & CTA - kanan */}
          <div className="hidden lg:flex items-center gap-4 ml-auto">
            {/* Language Switch Icon */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-1",
                darkMode 
                  ? "text-blue-100/70 hover:text-white hover:bg-white/10" 
                  : "text-[#4B5563] hover:text-[#1E3A8A] hover:bg-[#3498DB]/10"
              )}
              title={language === 'en' ? "Ubah ke Bahasa Indonesia" : "Switch to English"}
            >
              <Globe size={16} />
              <span className="text-xs font-black uppercase">{language}</span>
            </button>

            {/* Light/Dark Toggle Icon */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "p-2 rounded-xl transition-all",
                darkMode 
                  ? "text-blue-100/70 hover:text-white hover:bg-white/10" 
                  : "text-[#4B5563] hover:text-[#1E3A8A] hover:bg-[#3498DB]/10"
              )}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Highlighted Login Button only (replaces Get Started & text Login) */}
            <button
              onClick={onStart}
              className="relative overflow-hidden group bg-gradient-to-r from-[#1E3A8A] to-[#3498DB] text-white px-6 py-2 rounded-full text-[13px] font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(52,152,219,0.4)] hover:shadow-[0_0_25px_rgba(52,152,219,0.6)] active:scale-95 border border-blue-400/20 ml-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-1.5">{dict.nav.login} <ArrowRight size={14} /></span>
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className={cn(
              "lg:hidden p-2 transition-colors duration-500",
              darkMode ? "text-blue-100 hover:text-white" : "text-[#1E3A8A] hover:text-[#2563EB]"
            )}
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
          {navItems.map((item) => (
            <a
              key={item.originalKey}
              href={`#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id, item.originalKey)}
              className={cn(
                "border-b border-[#1E3A8A]/30 pb-4 transition-colors",
                activeMenu === item.originalKey ? "text-[#3498DB]" : "text-blue-100/70 hover:text-[#3498DB]"
              )}
            >
              {item.name}
            </a>
          ))}
        </div>
        <div className="mt-auto mb-10 flex flex-col gap-4">
          <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/10 mb-1">
            <span className="text-sm font-bold text-blue-100/70 flex items-center gap-2"><Globe size={15} /> Language</span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#3498DB]/20 border border-[#3498DB]/40 rounded-lg text-white text-xs font-bold uppercase"
            >
              {language}
            </button>
          </div>

          <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/10 mb-3">
            <span className="text-sm font-bold text-blue-100/70 flex items-center gap-2">
              {darkMode ? <Sun size={15} /> : <Moon size={15} />} Theme
            </span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#3498DB]/20 border border-[#3498DB]/40 rounded-lg text-white text-xs font-bold"
            >
              {darkMode ? "Light" : "Dark"}
            </button>
          </div>

          <button
            onClick={() => { setIsMobileMenuOpen(false); onStart(); }}
            className="w-full py-4 text-center text-[16px] font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3498DB] rounded-xl shadow-lg shadow-blue-500/25 border border-blue-400/20"
          >
            {dict.nav.login}
          </button>
        </div>
      </div>

      {/* 1. Hero Section */}
      <section id="beranda" className="pt-40 pb-16 px-4 md:px-8 max-w-7xl mx-auto relative overflow-visible z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E3A8A0A_1px,transparent_1px),linear-gradient(to_bottom,#1E3A8A0A_1px,transparent_1px)] -z-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

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

        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10 text-left">
          {/* Left Column: Text & CTA */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-[1.15]",
                darkMode ? "text-white" : "text-[#0B1727]"
              )}
            >
              {language === 'en' ? (
                <>Visualize Projects & Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] via-[#3498DB] to-[#00D2FF] drop-shadow-sm">Kroombox Internal Maintenance</span></>
              ) : (
                <>Visualisasikan Proyek & Kelola <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] via-[#3498DB] to-[#00D2FF] drop-shadow-sm">Maintenance Internal Kroombox</span></>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "text-base md:text-lg text-left leading-relaxed font-medium",
                darkMode ? "text-slate-300" : "text-[#4B5563]"
              )}
            >
              {dict.hero.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4 w-full"
            >
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-10 py-4 relative group overflow-hidden bg-gradient-to-r from-[#1E3A8A] to-[#3498DB] text-white rounded-2xl text-[16px] font-bold transition-all shadow-[0_10px_30px_rgba(52,152,219,0.3)] hover:shadow-[0_15px_40px_rgba(52,152,219,0.5)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {dict.hero.cta} <ArrowRight size={20} className="text-[#3498DB] group-hover:text-white transition-colors" />
                </span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Hero Dashboard Mockup & Floating Elements */}
          <div className="w-full lg:w-1/2 relative mt-16 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, type: "spring", stiffness: 50 }}
              className="relative w-full perspective-1000 transform md:scale-[0.82] lg:scale-[0.88] origin-top"
            >
              {/* Main Dashboard Mockup */}
              <div className="relative z-10 bg-[#0B1727] border border-white/10 rounded-[2rem] p-3 shadow-[0_30px_80px_rgba(11,23,39,0.4)] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_rgba(52,152,219,0.3)] ring-1 ring-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#3498DB]/30 blur-[80px] pointer-events-none" />

                <div className="bg-[#131B2F] rounded-t-[1.5rem] border border-white/5 flex flex-col overflow-hidden h-[420px] relative">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E3A8A]/20 via-transparent to-transparent pointer-events-none" />

                  {/* Dashboard Header */}
                  <div className="bg-[#0B1727]/80 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E74C3C]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F1C40F]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]" />
                      </div>
                      <div className="hidden md:flex gap-4 text-[10px] font-bold text-blue-100/50">
                        <span className="text-[#3498DB] flex items-center gap-1.5 bg-[#3498DB]/10 px-2 py-1 rounded-md"><Kanban size={12} /> Kanban Board</span>
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"><Layout size={12} /> Timeline</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-6 bg-[#0B1727] rounded-full border border-white/10 flex items-center px-2.5 shadow-inner">
                        <Search size={10} className="text-blue-100/40" />
                        <span className="text-[10px] text-blue-100/40 ml-1.5">Search...</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-[#3498DB] p-0.5">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" className="w-full h-full rounded-full bg-[#0B1727]" alt="Avatar" />
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content Layout */}
                  <div className="flex-1 flex overflow-hidden z-10">
                    {/* Sidebar Mini */}
                    <div className="hidden md:flex w-12 border-r border-white/5 bg-[#0B1727]/50 flex-col items-center py-4 gap-4">
                      <div className="p-1.5 bg-[#3498DB]/10 rounded-lg text-[#3498DB]"><LayoutDashboard size={16} /></div>
                      <div className="p-1.5 text-blue-100/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Kanban size={16} /></div>
                      <div className="p-1.5 text-blue-100/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Wrench size={16} /></div>
                    </div>

                    {/* Kanban Main Area */}
                    <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#131B2F] relative overflow-hidden">

                      {/* To-Do */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> To Do
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-[#0B1727] px-1.5 py-0.2 rounded-full border border-white/5">3</span>
                        </div>
                        <div className="bg-[#0B1727]/80 backdrop-blur-md p-2.5 rounded-lg border border-white/5 shadow-lg group hover:border-slate-500/50 transition-colors cursor-pointer">
                          <div className="text-[8px] font-bold text-slate-300 bg-slate-700/50 px-1.5 py-0.2 rounded w-max mb-1.5 border border-slate-600/30">{dict.hero.task1Tag}</div>
                          <p className="text-[11px] font-bold text-white mb-2 line-clamp-1">{dict.hero.task1Title}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                              <CheckCircle2 size={10} /> 0/4
                            </div>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=A" className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600" alt="" />
                          </div>
                        </div>
                      </div>

                      {/* In Progress */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3498DB] shadow-[0_0_6px_#3498DB]" /> In Progress
                          </span>
                          <span className="text-[10px] font-bold text-[#3498DB] bg-[#3498DB]/10 px-1.5 py-0.2 rounded-full border border-[#3498DB]/20">2</span>
                        </div>
                        <div className="bg-[#1E3A8A]/20 backdrop-blur-md p-2.5 rounded-lg border border-[#3498DB]/30 shadow-[0_6px_20px_rgba(52,152,219,0.1)] group hover:border-[#3498DB] transition-all cursor-pointer relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-0.5 h-full bg-[#3498DB] shadow-[0_0_8px_#3498DB]" />
                          <div className="text-[8px] font-bold text-[#3498DB] bg-[#3498DB]/10 px-1.5 py-0.2 rounded w-max mb-1.5 border border-[#3498DB]/20">{dict.hero.task3Tag}</div>
                          <p className="text-[11px] font-bold text-white mb-1.5 line-clamp-1">{dict.hero.task3Title}</p>
                          <div className="w-full bg-[#0B1727] rounded-full h-0.5 mb-2 border border-white/5 overflow-hidden">
                            <div className="bg-[#3498DB] h-full rounded-full w-[65%] shadow-[0_0_8px_#3498DB]" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[9px] text-[#3498DB] font-medium">
                              <CheckCircle2 size={10} /> 3/5
                            </div>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=D" className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600" alt="" />
                          </div>
                        </div>
                      </div>

                      {/* Maintenance Alert */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E74C3C] shadow-[0_0_6px_#E74C3C]" /> Maint
                          </span>
                          <span className="text-[10px] font-bold text-[#E74C3C] bg-[#E74C3C]/10 px-1.5 py-0.2 rounded-full border border-[#E74C3C]/20">1</span>
                        </div>
                        <div className="bg-[#E74C3C]/10 backdrop-blur-md p-2.5 rounded-lg border border-[#E74C3C]/30 shadow-[0_6px_20px_rgba(231,76,60,0.1)] group hover:border-[#E74C3C] transition-all cursor-pointer relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-[#E74C3C]/10 rounded-bl-full blur-lg" />
                          <div className="text-[8px] font-bold text-[#E74C3C] bg-[#E74C3C]/20 px-1.5 py-0.2 rounded w-max mb-1.5 border border-[#E74C3C]/30 flex items-center gap-0.5">
                            <Wrench size={8} /> URGENT
                          </div>
                          <p className="text-[11px] font-bold text-white mb-2 line-clamp-1">{dict.hero.task4Title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-[#E74C3C] bg-[#E74C3C]/10 px-1.5 py-0.2 rounded-md">{dict.hero.statusWaiting}</span>
                            <div className="w-1 h-1 rounded-full bg-[#E74C3C] animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Done */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] shadow-[0_0_6px_#2ECC71]" /> Done
                          </span>
                          <span className="text-[10px] font-bold text-[#2ECC71] bg-[#2ECC71]/10 px-1.5 py-0.2 rounded-full border border-[#2ECC71]/20">12</span>
                        </div>
                        <div className="bg-[#2ECC71]/5 backdrop-blur-md p-2.5 rounded-lg border border-[#2ECC71]/20 opacity-80 group hover:opacity-100 transition-opacity cursor-pointer">
                          <div className="text-[8px] font-bold text-[#2ECC71] bg-[#2ECC71]/10 px-1.5 py-0.2 rounded w-max mb-1.5 border border-[#2ECC71]/20">COMPLETED</div>
                          <p className="text-[11px] font-bold text-slate-350 line-through mb-2 line-clamp-1">{dict.hero.task2Title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-slate-500">{dict.hero.twoDaysAgo}</span>
                            <CheckCircle2 size={10} className="text-[#2ECC71]" />
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
                className={cn(
                  "hidden lg:flex absolute -right-4 top-8 z-20 p-2.5 rounded-xl shadow-lg border items-center gap-2 hover:scale-105 transition-all duration-300",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-[#3498DB]/20"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2ECC71] to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-[#2ECC71]/30">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className={cn("text-base font-black", darkMode ? "text-white" : "text-[#0B1727]")}>98%</p>
                  <p className={cn("text-[8px] font-bold uppercase tracking-widest", darkMode ? "text-slate-400" : "text-[#4B5563]")}>{dict.hero.facilityOptimal}</p>
                </div>
              </motion.div>

              {/* 2. Team Activity - Bottom Left */}
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className={cn(
                  "hidden lg:flex absolute -left-4 bottom-16 z-20 p-2.5 rounded-xl shadow-lg border items-center gap-2 hover:scale-105 transition-all duration-300",
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-[#3498DB]/20"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3498DB] to-[#00D2FF] flex items-center justify-center text-white shadow-lg shadow-[#3498DB]/30">
                  <Activity size={16} />
                </div>
                <div>
                  <p className={cn("text-base font-black", darkMode ? "text-white" : "text-[#0B1727]")}>5</p>
                  <p className={cn("text-[8px] font-bold uppercase tracking-widest", darkMode ? "text-slate-400" : "text-[#4B5563]")}>{dict.hero.activeTasks}</p>
                </div>
              </motion.div>

              {/* 3. Maintenance Alert - Top Left */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className={cn(
                  "hidden lg:flex absolute -left-2 top-20 z-20 p-2.5 rounded-xl shadow-lg border items-center gap-2 hover:scale-105 transition-all duration-300",
                  darkMode ? "bg-slate-900 border-[#E74C3C]/30 text-white" : "bg-[#0B1727]/95 border-[#E74C3C]/30 text-white"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E74C3C] to-red-400 flex items-center justify-center text-white shadow-lg shadow-[#E74C3C]/30">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-base font-black text-white">2</p>
                  <p className="text-[8px] font-bold text-red-200 uppercase tracking-widest">{dict.hero.emergencyMaint}</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Tentang Section */}
      <section id="tentang" className={cn(
        "pt-12 pb-20 border-y relative z-10 transition-colors duration-500",
        darkMode ? "bg-[#131B2F] border-slate-800/50" : "bg-white border-[#3498DB]/10"
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3498DB]/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className={cn("text-xl md:text-2xl lg:text-3xl font-black mb-4", darkMode ? "text-white" : "text-[#0B1727]")}>{dict.tentang.title}</h2>
            <p className={cn("max-w-2xl mx-auto font-medium", darkMode ? "text-slate-400" : "text-[#4B5563]")}>{dict.tentang.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { title: dict.tentang.steps[0].title, desc: dict.tentang.steps[0].desc, icon: <Search size={20} />, color: "text-[#3498DB]", bg: "bg-[#3498DB]/10", glowColor: "bg-[#3498DB]" },
              { title: dict.tentang.steps[1].title, desc: dict.tentang.steps[1].desc, icon: <Kanban size={20} />, color: "text-[#9B59B6]", bg: "bg-[#9B59B6]/10", glowColor: "bg-[#9B59B6]" },
              { title: dict.tentang.steps[2].title, desc: dict.tentang.steps[2].desc, icon: <Settings size={20} />, color: "text-[#E74C3C]", bg: "bg-[#E74C3C]/10", glowColor: "bg-[#E74C3C]" },
              { title: dict.tentang.steps[3].title, desc: dict.tentang.steps[3].desc, icon: <CheckCircle2 size={20} />, color: "text-[#2ECC71]", bg: "bg-[#2ECC71]/10", glowColor: "bg-[#2ECC71]" }
            ].map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6, scale: 1.02 }}
                className={cn(
                  "relative rounded-[2rem] p-6 border overflow-hidden transition-all duration-300 flex flex-col h-full group text-left",
                  darkMode
                    ? "bg-[#152844]/65 border-slate-800 hover:border-[#3498DB]/50 hover:shadow-[0_15px_30px_rgba(52,152,219,0.08)]"
                    : "bg-white border-[#3498DB]/10 hover:border-[#3498DB]/40 hover:shadow-[0_20px_40px_rgba(52,152,219,0.1)]"
                )}
              >
                {/* Background glowing orb */}
                <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-5 transition-all duration-500 group-hover:opacity-15", step.glowColor)} />

                {/* Top row with Icon and Step Number */}
                <div className="flex justify-between items-center mb-6">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:rotate-6", step.bg, step.color)}>
                    {step.icon}
                  </div>
                  <span className={cn("text-4xl font-black opacity-10 font-mono tracking-tighter select-none transition-all duration-300 group-hover:opacity-25", step.color)}>
                    0{i + 1}
                  </span>
                </div>

                {/* Text Content */}
                <div className="space-y-2 mt-auto">
                  <div className="text-[10px] font-black text-[#3498DB] tracking-widest uppercase">{dict.tentang.stepLabel} {i + 1}</div>
                  <h4 className={cn("text-lg font-bold transition-colors group-hover:text-[#3498DB]", darkMode ? "text-white" : "text-[#0B1727]")}>
                    {step.title}
                  </h4>
                  <p className={cn("text-sm font-medium leading-relaxed", darkMode ? "text-slate-300" : "text-[#4B5563]")}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* 4. Keunggulan Proposition */}
      <section id="keunggulan" className={cn(
        "py-24 relative border-t z-10 transition-colors duration-500",
        darkMode ? "bg-[#0B1727] border-slate-800/50" : "bg-[#F4F7FB] border-[#3498DB]/10"
      )}>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 space-y-8">
              <h2 className={cn("text-xl md:text-2xl lg:text-3xl font-black tracking-tight leading-[1.15]", darkMode ? "text-white" : "text-[#0B1727]")}>
                {dict.keunggulan.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <Users size={18} />, title: dict.keunggulan.items[0] },
                  { icon: <Zap size={18} />, title: dict.keunggulan.items[1] },
                  { icon: <Wallet size={18} />, title: dict.keunggulan.items[2] },
                  { icon: <Activity size={18} />, title: dict.keunggulan.items[3] },
                  { icon: <ClipboardList size={18} />, title: dict.keunggulan.items[4] }
                ].map((val, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer",
                    darkMode
                      ? "bg-[#152844]/45 border-slate-850 hover:border-blue-500/40 hover:shadow-md"
                      : "bg-[#F8FAFC] border-[#3498DB]/10 hover:border-[#3498DB]/30 hover:shadow-[0_5px_15px_rgba(52,152,219,0.1)]"
                  )}>
                    <div className="w-8 h-8 bg-[#3498DB]/10 rounded-lg flex items-center justify-center text-[#3498DB] shadow-sm group-hover:bg-[#3498DB] group-hover:text-white transition-colors">
                      {val.icon}
                    </div>
                    <span className={cn("font-bold text-sm", darkMode ? "text-slate-200" : "text-[#2C3E50]")}>{val.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <div className="bg-[#0B1727] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(11,23,39,0.3)] border border-[#1E3A8A]/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3498DB]/20 rounded-full blur-[60px] -z-0" />

                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">Analytics Overview</h3>
                    <div className="p-1.5 bg-[#3498DB]/20 rounded-lg text-[#3498DB] shadow-[0_0_10px_#3498DB]">
                      <BarChart3 size={18} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                      <p className="text-[#3498DB] text-[10px] font-bold uppercase tracking-wider mb-1">Maintenance Cost</p>
                      <p className="text-xl font-black text-white">-34%</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                      <p className="text-[#3498DB] text-[10px] font-bold uppercase tracking-wider mb-1">Task Completion</p>
                      <p className="text-xl font-black text-white">+52%</p>
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
      <section id="faq" className={cn(
        "py-24 border-t relative z-10 transition-colors duration-500",
        darkMode ? "bg-[#131B2F] border-slate-800/50" : "bg-white border-[#3498DB]/10"
      )}>
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className={cn("text-xl md:text-2xl lg:text-3xl font-black mb-3", darkMode ? "text-white" : "text-[#0B1727]")}>{dict.faq.title}</h2>
            <p className={cn("text-sm font-medium max-w-2xl mx-auto", darkMode ? "text-slate-400" : "text-[#4B5563]")}>{dict.faq.subtitle}</p>
          </div>

          <div className="space-y-4">
            {dict.faq.items.map((faq, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer",
                  darkMode
                    ? "bg-[#152844] border-slate-800 hover:border-blue-500/35"
                    : "bg-white border-[#3498DB]/10 hover:border-[#3498DB]/30"
                )}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className={cn("p-5 flex justify-between items-center transition-colors", darkMode ? "bg-[#152844]" : "bg-white")}>
                  <h4 className={cn("font-bold text-sm transition-colors", activeFaq === index ? "text-[#3498DB]" : (darkMode ? "text-white" : "text-[#0B1727]"))}>{faq.q}</h4>
                  <div className={cn("text-[#3498DB] transition-transform duration-300", activeFaq === index ? "rotate-180" : "")}>
                    <ChevronDown size={18} />
                  </div>
                </div>
                <motion.div
                  initial={false}
                  animate={{ height: activeFaq === index ? "auto" : 0, opacity: activeFaq === index ? 1 : 0 }}
                  className={cn("overflow-hidden", darkMode ? "bg-[#0F1C30]/50" : "bg-[#F8FAFC]")}
                >
                  <div className={cn(
                    "p-5 pt-0 text-sm font-medium leading-relaxed border-t",
                    darkMode ? "text-slate-300 border-slate-800" : "text-[#4B5563] border-[#3498DB]/10"
                  )}>
                    {faq.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn(
        "pt-16 pb-12 px-4 md:px-8 border-t transition-colors duration-500 relative overflow-hidden z-10",
        darkMode ? "bg-[#0B1727] border-slate-800" : "bg-[#F0F6FF] border-[#3498DB]/10"
      )}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#3498DB]/20 to-transparent shadow-[0_0_10px_rgba(52,152,219,0.1)]" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-left">
            {/* Column 1: Brand & Socials */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <img
                  src="https://i.ibb.co.com/Fk4YB1cM/logo-ks.png"
                  alt="KroomSpace"
                  style={{ height: '50px', width: 'auto' }}
                  className="object-contain"
                />
                <span className={cn("text-lg font-black tracking-tight uppercase", darkMode ? "text-white" : "text-[#1E3A8A]")}>KROOMSPACE</span>
              </div>
              <p className={cn("text-xs font-semibold leading-relaxed", darkMode ? "text-blue-100/50" : "text-[#4B5563]/80")}>
                {dict.footer.desc}
              </p>
              {/* Circular Icon Badges */}
              <div className="flex gap-3">
                <a href="mailto:kroomspace@gmail.com" title="Email Us" className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border", darkMode ? "bg-slate-900 border-slate-800 text-[#3498DB] hover:bg-[#3498DB] hover:text-white" : "bg-white border-blue-100 text-[#2563EB] hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB]")}>
                  <Mail size={16} />
                </a>
                <a href="#" className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border", darkMode ? "bg-slate-900 border-slate-800 text-[#3498DB] hover:bg-[#3498DB] hover:text-white" : "bg-white border-blue-100 text-[#2563EB] hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB]")}>
                  <Facebook size={16} />
                </a>
                <a href="#" className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border", darkMode ? "bg-slate-900 border-slate-800 text-[#3498DB] hover:bg-[#3498DB] hover:text-white" : "bg-white border-blue-100 text-[#2563EB] hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB]")}>
                  <Twitter size={16} />
                </a>
                <a href="#" className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border", darkMode ? "bg-slate-900 border-slate-800 text-[#3498DB] hover:bg-[#3498DB] hover:text-white" : "bg-white border-blue-100 text-[#2563EB] hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB]")}>
                  <Instagram size={16} />
                </a>
              </div>
            </div>

            {/* Column 2: Tautan */}
            <div className="space-y-4">
              <h4 className={cn("text-xs font-black uppercase tracking-[0.2em]", darkMode ? "text-[#3498DB]" : "text-[#2563EB]")}>
                {dict.footer.tautan}
              </h4>
              <ul className={cn("space-y-2.5 text-xs font-bold", darkMode ? "text-blue-100/50" : "text-[#4B5563]/80")}>
                <li><a href="#" className={cn("transition-colors", darkMode ? "hover:text-white" : "hover:text-[#2563EB]")}>{dict.footer.kebijakan}</a></li>
                <li><a href="#" className={cn("transition-colors", darkMode ? "hover:text-white" : "hover:text-[#2563EB]")}>{dict.footer.syarat}</a></li>
                <li><a href="#" className={cn("transition-colors", darkMode ? "hover:text-white" : "hover:text-[#2563EB]")}>{dict.footer.bantuan}</a></li>
              </ul>
            </div>

            {/* Column 3: Operasional */}
            <div className="space-y-4">
              <h4 className={cn("text-xs font-black uppercase tracking-[0.2em]", darkMode ? "text-[#3498DB]" : "text-[#2563EB]")}>
                OPERASIONAL
              </h4>
              <ul className={cn("space-y-2.5 text-xs font-bold", darkMode ? "text-blue-100/50" : "text-[#4B5563]/80")}>
                <li><a href="#beranda" className={cn("transition-colors", darkMode ? "hover:text-white" : "hover:text-[#2563EB]")}>Dashboard Utama</a></li>
                <li><a href="#tentang" className={cn("transition-colors", darkMode ? "hover:text-white" : "hover:text-[#2563EB]")}>Alur Kerja Internal</a></li>
                <li><a href="#keunggulan" className={cn("transition-colors", darkMode ? "hover:text-white" : "hover:text-[#2563EB]")}>Keunggulan Sistem</a></li>
              </ul>
            </div>

            {/* Column 4: Kontak */}
            <div className="space-y-4">
              <h4 className={cn("text-xs font-black uppercase tracking-[0.2em]", darkMode ? "text-[#3498DB]" : "text-[#2563EB]")}>
                KONTAK
              </h4>
              <ul className={cn("space-y-2.5 text-xs font-bold", darkMode ? "text-blue-100/50" : "text-[#4B5563]/80")}>
                <li>
                  <a href="mailto:kroomspace@gmail.com" className={cn("transition-colors", darkMode ? "hover:text-white" : "hover:text-[#2563EB]")}>
                    kroomspace@gmail.com
                  </a>
                </li>
                <li className={cn("font-medium text-xs", darkMode ? "text-blue-100/40" : "text-[#4B5563]/60")}>
                  Aplikasi Internal Kroombox
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className={cn("pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4", darkMode ? "border-slate-800" : "border-blue-100/50")}>
            <p className={cn("text-[9px] font-black uppercase tracking-widest text-center sm:text-left", darkMode ? "text-blue-100/30" : "text-[#4B5563]/50")}>
              &copy; 2026 KroomSpace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
