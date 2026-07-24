import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Search,
  Zap,
  Bug,
  Code,
  X,
  CheckCircle2,
  CheckSquare,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Server,
  Globe,
  Database,
  Cpu,
  ArrowRight,
  Sparkles,
  ListChecks,
  LayoutTemplate,
  AlertTriangle,
  CheckCheck,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Project, ProjectTemplate, TemplateTask, Priority, TaskType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProjectTemplatesProps {
  onAddProject: (project: Project, tasks: any[]) => void;
  darkMode: boolean;
  projects: Project[];
  user: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCategoryIcon = (kategori: string, size = 24) => {
  const props = { size, strokeWidth: 1.8 };
  switch (kategori) {
    case 'Infrastructure': return <Server {...props} />;
    case 'API Service': return <Globe {...props} />;
    case 'Security': return <Shield {...props} />;
    case 'Maintenance': return <Zap {...props} />;
    case 'Bug Fix': return <Bug {...props} />;
    default: return <Code {...props} />;  // Development
  }
};

const getCategoryGradient = (kategori: string) => {
  switch (kategori) {
    case 'Infrastructure': return 'from-emerald-400 to-emerald-600';
    case 'API Service': return 'from-indigo-400 to-indigo-600';
    case 'Security': return 'from-purple-400 to-purple-600';
    case 'Maintenance': return 'from-amber-400 to-amber-600';
    case 'Bug Fix': return 'from-rose-400 to-rose-600';
    default: return 'from-[#3FA9F5] to-[#2D7FEA]';  // Development / Blue
  }
};

const getCategoryBg = (kategori: string, dark: boolean) => {
  if (dark) {
    switch (kategori) {
      case 'Infrastructure': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'API Service': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Security': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Maintenance': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Bug Fix': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  }
  switch (kategori) {
    case 'Infrastructure': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'API Service': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    case 'Security': return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'Maintenance': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Bug Fix': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-blue-50 text-blue-600 border-blue-100';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
    case 'Medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
    default: return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
  }
};

interface TemplateMetadata {
  duration: string;
  teamSize: string;
  complexity: 'Mudah' | 'Sedang' | 'Tinggi';
  badge?: 'Paling Populer' | 'Direkomendasikan' | 'Baru';
}

const getTemplateMetadata = (id: string, kategori: string, taskCount: number): TemplateMetadata => {
  switch (id) {
    case 'TP001':
      return {
        duration: '14-21 Hari',
        teamSize: '3-5 Orang',
        complexity: 'Tinggi',
        badge: 'Direkomendasikan'
      };
    case 'TP002':
      return {
        duration: '7-14 Hari',
        teamSize: '2-3 Orang',
        complexity: 'Tinggi',
        badge: 'Baru'
      };
    case 'TP003':
      return {
        duration: '10-15 Hari',
        teamSize: '3-4 Orang',
        complexity: 'Tinggi',
        badge: 'Paling Populer'
      };
    case 'TP004':
      return {
        duration: '3-5 Hari',
        teamSize: '1-2 Orang',
        complexity: 'Sedang',
        badge: 'Direkomendasikan'
      };
    case 'TP005':
      return {
        duration: '5-7 Hari',
        teamSize: '2-3 Orang',
        complexity: 'Sedang',
        badge: 'Baru'
      };
  }

  // Fallback for user custom-created templates
  let duration = '5-7 Hari';
  let teamSize = '1-2 Orang';
  let complexity: 'Mudah' | 'Sedang' | 'Tinggi' = 'Sedang';
  let badge: 'Paling Populer' | 'Direkomendasikan' | 'Baru' | undefined;

  if (taskCount > 8) {
    duration = '14-30 Hari';
    teamSize = '4-6 Orang';
    complexity = 'Tinggi';
    badge = 'Direkomendasikan';
  } else if (taskCount >= 5) {
    duration = '7-14 Hari';
    teamSize = '2-4 Orang';
    complexity = 'Sedang';
    badge = 'Baru';
  } else {
    duration = '3-5 Hari';
    teamSize = '1-2 Orang';
    complexity = 'Mudah';
  }

  if (kategori === 'Security' || kategori === 'Infrastructure') {
    complexity = 'Tinggi';
  }

  return { duration, teamSize, complexity, badge };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const TaskTemplates: React.FC<ProjectTemplatesProps> = ({ onAddProject, darkMode, projects, user }) => {
  const { t } = useLanguage();

  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modal states
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Create Template States (Admin Only)
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateCat, setNewTemplateCat] = useState('Development');
  const [newTemplateType, setNewTemplateType] = useState('Development');
  const [newTemplateMode, setNewTemplateMode] = useState('Kanban');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<TemplateTask[]>([]);
  const [createStep, setCreateStep] = useState(1); // 1: Input details, 2: Review generated tasks
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const handleGenerateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/proyek-templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_template: newTemplateName,
          deskripsi: newTemplateDesc,
          kategori: newTemplateCat,
          tipe_tugas: newTemplateType,
          mode_kanban: newTemplateMode,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedTasks(data.tasks || []);
      setIsAiGenerated(true);
      setCreateStep(2);
    } catch (e: any) {
      console.error(e);
      alert(`Gagal merancang template dengan AI: ${e.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const defaultColumns = [
        { id: 'col-1', title: 'Backlog', status: 'Backlog', order: 0 },
        { id: 'col-2', title: 'In Progress', status: 'In Progress', order: 1 },
        { id: 'col-3', title: 'Testing', status: 'Testing', order: 2 },
        { id: 'col-4', title: 'Done', status: 'Done', order: 3 }
      ];

      const res = await fetch('/api/proyek-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_template: newTemplateName,
          deskripsi: newTemplateDesc,
          kategori: newTemplateCat,
          tipe_tugas: newTemplateType,
          mode_kanban: newTemplateMode,
          kolom_papan: defaultColumns,
          tugas: generatedTasks,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const mapped: ProjectTemplate = {
        id: data.id_template,
        name: data.nama_template,
        description: data.deskripsi || '',
        kategori: data.kategori || 'Development',
        type: data.tipe_tugas,
        mode: data.mode_kanban,
        columns: defaultColumns,
        tasks: generatedTasks,
        createdAt: data.dibuat_pada,
      };

      setTemplates(prev => [...prev, mapped]);
      setIsCreating(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setGeneratedTasks([]);
      setCreateStep(1);
      setSuccessMsg(`✅ Template "${mapped.name}" berhasil dibuat dengan Asisten AI!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error(e);
      alert(`Gagal menyimpan template: ${e.message}`);
    }
  };

  // ─── Fetch templates from API ─────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch('/api/proyek-templates')
      .then(res => res.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: ProjectTemplate[] = data.map(d => ({
          id: d.id_template,
          name: d.nama_template,
          description: d.deskripsi || '',
          kategori: d.kategori || 'Development',
          type: d.tipe_tugas,
          mode: d.mode_kanban,
          columns: Array.isArray(d.kolom_papan) ? d.kolom_papan : [],
          tasks: Array.isArray(d.tugas) ? d.tugas : [],
          createdAt: d.dibuat_pada,
        }));
        setTemplates(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Semua', ...Array.from(new Set(templates.map(t => t.kategori)))];

  const filtered = templates.filter(t => {
    const matchCat = selectedCategory === 'Semua' || t.kategori === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  // ─── Terapkan Template ────────────────────────────────────────────────────
  const handleApply = async () => {
    if (!applyTemplate || !projectName.trim()) return;
    setIsApplying(true);
    try {
      const res = await fetch(`/api/proyek-templates/${applyTemplate.id}/terapkan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_proyek: projectName, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Format project and tasks for state update
      const newProject: Project = {
        id: data.proyek.id_proyek,
        name: data.proyek.nama_proyek,
        description: data.proyek.deskripsi || '',
        createdAt: data.proyek.dibuat_pada?.split?.('T')?.[0] || new Date().toISOString().split('T')[0],
        type: data.proyek.tipe_tugas,
        mode: data.proyek.mode_kanban,
        columns: (data.proyek.kolom_papan || []).map((c: any) => ({
          id: c.id_kolom, title: c.judul_kolom, status: c.status_tugas, order: c.urutan
        }))
      };

      const newTasks = (data.tugas || []).map((t: any) => ({
        id: t.id_tugas,
        title: t.judul_tugas,
        description: t.deskripsi || '',
        status: t.status,
        priority: t.prioritas,
        type: t.tipe,
        projectId: data.proyek.id_proyek,
        createdAt: t.dibuat_pada || new Date().toISOString(),
        checklist: (t.daftar_periksa || []).map((cl: any) => ({
          id: cl.id_periksa, text: cl.teks_periksa, completed: cl.apakah_selesai
        }))
      }));

      onAddProject(newProject, newTasks);
      setApplyTemplate(null);
      setProjectName('');
      setSuccessMsg(`✅ Proyek "${newProject.name}" berhasil dibuat dengan ${newTasks.length} tugas!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error(e);
      setSuccessMsg(`❌ Gagal menerapkan template: ${e.message}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setIsApplying(false);
    }
  };

  // ─── Delete Template ──────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Hapus template ini? Tindakan ini tidak dapat dibatalkan.')) return;
    await fetch(`/api/proyek-templates/${id}`, { method: 'DELETE' }).catch(console.error);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const isAdmin = user?.role === 'Admin';
  const totalTugas = (t: ProjectTemplate) => t.tasks?.length ?? 0;
  const totalChecklist = (t: ProjectTemplate) =>
    (t.tasks ?? []).reduce((s, task) => s + (task.checklist?.length ?? 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-500 pb-24">

      {/* ── Header ── */}
      <header className={cn(
        "flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-8 py-6 sticky top-0 z-30 backdrop-blur-xl border-b transition-all",
        darkMode ? "bg-[#0D1B35]/90 border-[#1E3A5F]/40" : "bg-[#F4F8FC]/90 border-[#BFDFFF]/30"
      )}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3FA9F5] to-[#2D7FEA] flex items-center justify-center shadow-lg shadow-[#2D7FEA]/20">
              <LayoutTemplate size={20} className="text-white" />
            </div>
            <h1 className={cn("text-3xl font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>
              {t('templatePageTitle')}
            </h1>
          </div>
          <p className={cn("text-sm font-medium ml-14", darkMode ? "text-slate-400" : "text-slate-500")}>
            {t('templatePageDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 xl:w-auto">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchTemplate')}
              className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white text-sm font-medium shadow-sm transition-all"
            />
          </div>

          {isAdmin && (
            <button
              id="btn_tambah_template"
              onClick={() => {
                setCreateStep(1);
                setIsCreating(true);
              }}
              className={cn(
                "py-3.5 px-6 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all shrink-0",
                "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] shadow-lg shadow-[#2D7FEA]/20 hover:shadow-xl hover:shadow-[#2D7FEA]/30 hover:scale-[1.02] active:scale-100"
              )}
            >
              <Plus size={18} />
              {t('createNewTemplate')}
            </button>
          )}
        </div>
      </header>

      {/* ── Category Filters ── */}
      <div className="px-8 pt-6 pb-2">
        <div className={cn(
          "inline-flex p-1.5 rounded-2xl gap-1.5 border transition-all max-w-full overflow-x-auto scrollbar-none",
          darkMode
            ? "bg-slate-900/50 border-slate-800/80"
            : "bg-slate-100/80 border-slate-200/60"
        )}>
          {categories.map(cat => {
            const count = cat === 'Semua'
              ? templates.length
              : templates.filter(t => t.kategori === cat).length;

            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "relative px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 select-none shrink-0",
                  isActive
                    ? "bg-[#2D7FEA] text-white shadow-lg shadow-[#2D7FEA]/20"
                    : darkMode
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                )}
              >
                <span>{cat === 'Semua' ? t('all') : t(cat)}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-medium tracking-normal transition-all",
                  isActive
                    ? "bg-white/20 text-white"
                    : darkMode
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-200/70 text-slate-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Success Toast ── */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "mx-8 mt-4 px-6 py-4 rounded-2xl text-sm font-semibold",
              successMsg.startsWith('✅')
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
            )}
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid ── */}
      <div className="px-8 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className={cn(
              "rounded-2xl p-8 animate-pulse h-72",
              darkMode ? "bg-slate-800" : "bg-slate-100"
            )} />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <LayoutTemplate size={36} className="text-slate-400" />
            </div>
            <p className="text-slate-400 font-medium">{t('noTemplateFound')}</p>
          </div>
        ) : filtered.map((template, i) => {
          const meta = getTemplateMetadata(template.id, template.kategori, totalTugas(template));
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between cursor-pointer",
                darkMode
                  ? "bg-slate-800/80 border-slate-700/60 hover:border-[#2D7FEA]/30 hover:bg-slate-800/100"
                  : "bg-white border-slate-200/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-[#2D7FEA]/20",
                "hover:-translate-y-1.5"
              )}
              onClick={() => setPreviewTemplate(template)}
            >


              <div>
                <div className="p-6">
                  {/* Icon + Category + Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
                        getCategoryBg(template.kategori, darkMode)
                      )}>
                        {getCategoryIcon(template.kategori, 20)}
                      </div>
                      <div className="flex flex-col min-w-0 pr-8">
                        <span className={cn(
                          "inline-flex w-max text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border mb-1",
                          getCategoryBg(template.kategori, darkMode)
                        )}>
                          {t(template.kategori)}
                        </span>
                        <h3 className={cn(
                          "text-base font-black tracking-tight leading-tight line-clamp-2",
                          darkMode ? "text-white" : "text-slate-900"
                        )}>
                          {t(template.name)}
                        </h3>
                      </div>
                    </div>

                    {/* Admin controls */}
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(template.id); }}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-xl border border-slate-100 dark:border-slate-700 transition-all ml-2 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p className={cn(
                    "text-xs font-medium leading-relaxed line-clamp-2 mb-4 min-h-[2.25rem]",
                    darkMode ? "text-slate-400" : "text-slate-500"
                  )}>
                    {t(template.description) || t('noDescription')}
                  </p>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 pb-4 border-b border-dashed border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/5 text-blue-500 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <ListChecks size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium leading-none mb-0.5">{t('tugasLabel')}</span>
                        <span className={cn("font-bold text-[11px]", darkMode ? "text-slate-200" : "text-slate-700")}>{totalTugas(template)} {t('tugasLabel')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/5 text-emerald-500 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckSquare size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium leading-none mb-0.5">Checklist</span>
                        <span className={cn("font-bold text-[11px]", darkMode ? "text-slate-200" : "text-slate-700")}>{totalChecklist(template)} Item</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/5 text-amber-500 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Clock size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium leading-none mb-0.5">{t('estimasiLabel')}</span>
                        <span className={cn("font-bold text-[11px]", darkMode ? "text-slate-200" : "text-slate-700")}>{meta.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/5 text-purple-500 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Users size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium leading-none mb-0.5">{t('rekomendasiLabel')}</span>
                        <span className={cn("font-bold text-[11px]", darkMode ? "text-slate-200" : "text-slate-700")}>{meta.teamSize}</span>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center gap-2.5 text-xs pt-1">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/5 text-rose-500 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                        <Layers size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium leading-none mb-0.5">{t('complexityLabel')}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                            meta.complexity === 'Tinggi'
                              ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                              : meta.complexity === 'Sedang'
                                ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          )}>
                            {meta.complexity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview tasks (first 2) */}
                  <div className="space-y-2 mb-5">
                    {(template.tasks ?? []).slice(0, 2).map((task, idx) => (
                      <div key={idx} className={cn(
                        "flex items-center gap-2 text-xs font-medium py-2 px-3 rounded-xl border",
                        darkMode
                          ? "bg-slate-900/40 text-slate-400 border-slate-800/80"
                          : "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                        <CheckCircle2 size={12} className="text-[#2D7FEA] shrink-0" />
                        <span className="truncate">{t(task.title)}</span>
                      </div>
                    ))}
                    {(template.tasks ?? []).length > 2 && (
                      <p className={cn(
                        "text-[10px] font-bold pl-2.5 flex items-center gap-1.5",
                        darkMode ? "text-slate-500" : "text-slate-400"
                      )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D7FEA]" />
                        +{template.tasks.length - 2} {t('moreTasksBlueprint')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 mt-auto grid grid-cols-2 gap-3">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                  className={cn(
                    "py-3 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1.5",
                    darkMode
                      ? "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Search size={14} />
                  Preview
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setProjectName(template.name);
                    setApplyTemplate(template);
                  }}
                  className={cn(
                    "py-3 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all",
                    "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] shadow-md shadow-[#2D7FEA]/10 hover:shadow-lg hover:shadow-[#2D7FEA]/20 hover:scale-[1.02] active:scale-100"
                  )}
                >
                  <Sparkles size={14} />
                  {t('applyTemplate')}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ══ MODAL: Preview Template ══ */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col",
                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100",
                "shadow-2xl shadow-blue-900/10"
              )}
            >
              {/* Modal Header */}
              <div className={cn("p-8 border-b flex items-start justify-between gap-4 shrink-0", darkMode ? "border-slate-700" : "border-slate-100")}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0", getCategoryBg(previewTemplate.kategori, darkMode))}>
                    {getCategoryIcon(previewTemplate.kategori, 24)}
                  </div>
                  <div>
                    <h2 className={cn("text-2xl font-black", darkMode ? "text-white" : "text-slate-900")}>{t(previewTemplate.name)}</h2>
                    <p className={cn("text-sm mt-0.5", darkMode ? "text-slate-400" : "text-slate-500")}>{t(previewTemplate.description)}</p>
                  </div>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                  <X size={22} className="text-slate-400" />
                </button>
              </div>

              {/* Stats */}
              {(() => {
                const meta = getTemplateMetadata(previewTemplate.id, previewTemplate.kategori, totalTugas(previewTemplate));
                return (
                  <div className={cn("px-8 py-4 flex flex-wrap gap-x-6 gap-y-2 border-b shrink-0 text-xs font-bold", darkMode ? "border-slate-700 bg-slate-900/30" : "border-slate-100 bg-slate-50/80")}>
                    <div className="flex items-center gap-2">
                      <ListChecks size={15} className="text-blue-500" />
                      <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{totalTugas(previewTemplate)} {t('tugasLabel')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckSquare size={15} className="text-emerald-500" />
                      <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{totalChecklist(previewTemplate)} Checklist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-amber-500" />
                      <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{meta.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-purple-500" />
                      <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{meta.teamSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers size={15} className="text-indigo-500" />
                      <span className={darkMode ? "text-slate-300" : "text-slate-700"}>Mode {previewTemplate.mode}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:ml-auto">
                      <span className="text-[10px] text-slate-400 font-medium">{t('complexityLabel')}:</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        meta.complexity === 'Tinggi'
                          ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                          : meta.complexity === 'Sedang'
                            ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      )}>
                        {meta.complexity}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {(previewTemplate.tasks ?? []).map((task, idx) => (
                  <div key={idx} className={cn(
                    "rounded-2xl border p-5",
                    darkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                        darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-600"
                      )}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className={cn("font-bold text-sm", darkMode ? "text-white" : "text-slate-900")}>{t(task.title)}</h4>
                        <p className={cn("text-xs mt-0.5 line-clamp-1", darkMode ? "text-slate-500" : "text-slate-400")}>{t(task.description)}</p>
                      </div>
                      <span className={cn("ml-auto text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0", getPriorityColor(task.priority))}>
                        {t(task.priority.toLowerCase())}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-10">
                      {(task.checklist ?? []).map((cl, ci) => (
                        <span key={ci} className={cn(
                          "flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-xl",
                          darkMode ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500 border border-slate-100"
                        )}>
                          <CheckCircle2 size={9} className="text-blue-400" />
                          {t(cl.text)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className={cn("p-8 border-t shrink-0", darkMode ? "border-slate-700" : "border-slate-100")}>
                <button
                  onClick={() => {
                    setProjectName(previewTemplate.name);
                    setApplyTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#2D7FEA]/30 transition-all hover:scale-[1.01] active:scale-100"
                >
                  <Sparkles size={18} />
                  {t('applyTemplateTitle')}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL: Konfirmasi Terapkan ══ */}
      <AnimatePresence>
        {applyTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "w-full max-w-md rounded-2xl p-10 shadow-2xl shadow-blue-900/10",
                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
              )}
            >
              {/* Icon */}
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-6 bg-gradient-to-br", getCategoryGradient(applyTemplate.kategori), "shadow-xl")}>
                {getCategoryIcon(applyTemplate.kategori, 28)}
              </div>

              <h2 className={cn("text-2xl font-black mb-2", darkMode ? "text-white" : "text-slate-900")}>
                {t('applyTemplateConfirmTitle')}
              </h2>
              <p className={cn("text-sm mb-8 font-medium leading-relaxed", darkMode ? "text-slate-400" : "text-slate-500")}>
                Template <strong className={darkMode ? "text-white" : "text-slate-800"}>{applyTemplate.name}</strong> akan membuat proyek dengan <strong className="text-blue-500">{totalTugas(applyTemplate)} tugas</strong> dan <strong className="text-emerald-500">{totalChecklist(applyTemplate)} checklist</strong>.
              </p>

              {/* Name Input */}
              <div className="space-y-2 mb-8">
                <label className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
                  {t('projectNameLabel')}
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApply()}
                  onFocus={(e) => e.target.select()}
                  placeholder={t('projectNamePlaceholder')}
                  autoFocus
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl font-bold outline-none transition-all text-slate-900 dark:text-white border",
                    "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700",
                    "focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900",
                    "placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  )}
                />
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setApplyTemplate(null); setProjectName(''); }}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-sm border transition-all",
                    darkMode ? "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                  )}
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={handleApply}
                  disabled={!projectName.trim() || isApplying}
                  className={cn(
                    "py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all",
                    "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] shadow-lg shadow-[#2D7FEA]/20",
                    "hover:shadow-xl hover:shadow-[#2D7FEA]/30 hover:scale-[1.02] active:scale-100",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  )}
                >
                  {isApplying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('creating')}
                    </>
                  ) : (
                    <>
                      <CheckCheck size={18} />
                      {t('createProjectBtn')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL: Buat Template Baru (Admin Only) ══ */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-blue-900/10",
                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
              )}
            >
              {/* Modal Header */}
              <div className={cn("p-8 border-b flex items-center justify-between gap-4 shrink-0", darkMode ? "border-slate-700" : "border-slate-100")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3FA9F5] to-[#2D7FEA] flex items-center justify-center text-white">
                    <Sparkles size={18} />
                  </div>
                  <h2 className={cn("text-2xl font-black", darkMode ? "text-white" : "text-slate-900")}>
                    {createStep === 1 ? t('designNewTemplate') : t('reviewAITemplate')}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewTemplateName('');
                    setNewTemplateDesc('');
                    setGeneratedTasks([]);
                    setCreateStep(1);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                >
                  <X size={22} className="text-slate-400" />
                </button>
              </div>

              {createStep === 1 ? (
                /* Step 1: Info Input Form */
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {t('templateNameLabel')}
                    </label>
                    <input
                      id="input_template_name"
                      type="text"
                      value={newTemplateName}
                      onChange={e => setNewTemplateName(e.target.value)}
                      placeholder="Contoh: Audit Keamanan Sistem"
                      className={cn(
                        "w-full px-5 py-4 rounded-2xl font-bold outline-none border transition-all text-slate-900 dark:text-white",
                        darkMode ? "bg-slate-900/50 border-slate-700 focus:border-blue-500/50 focus:bg-slate-900" : "bg-slate-50 border-slate-200 focus:border-blue-500/50 focus:bg-white"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {t('templateDescLabel')}
                    </label>
                    <textarea
                      id="input_template_desc"
                      value={newTemplateDesc}
                      onChange={e => setNewTemplateDesc(e.target.value)}
                      placeholder="Jelaskan tujuan dan ruang lingkup template ini..."
                      rows={3}
                      className={cn(
                        "w-full px-5 py-4 rounded-2xl font-bold outline-none border transition-all text-slate-900 dark:text-white",
                        darkMode ? "bg-slate-900/50 border-slate-700 focus:border-blue-500/50 focus:bg-slate-900" : "bg-slate-50 border-slate-200 focus:border-blue-500/50 focus:bg-white"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {t('templateCategoryLabel')}
                    </label>
                    <select
                      id="select_template_category"
                      value={newTemplateCat}
                      onChange={e => {
                        setNewTemplateCat(e.target.value);
                        setNewTemplateType(e.target.value);
                      }}
                      className={cn(
                        "w-full px-5 py-4 rounded-2xl font-bold outline-none border transition-all text-slate-900 dark:text-white",
                        darkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <option value="Development">Development</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="API Service">API Service</option>
                      <option value="Security">Security</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Bug Fix">Bug Fix</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Step 2: Review/Edit tasks (AI generated or manually created) */
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  <p className={cn("text-xs font-semibold px-4 py-2.5 rounded-xl bg-sky-50/50 text-sky-600 dark:bg-sky-900/10 dark:text-sky-400")}>
                    ✍️ Rancang template Anda secara manual dengan menambahkan tugas di bawah.
                  </p>

                  <div className="space-y-6">
                    {generatedTasks.map((task, idx) => (
                      <div key={task.id || idx} className={cn(
                        "rounded-2xl border p-6 space-y-4 shadow-sm",
                        darkMode ? "bg-slate-900/30 border-slate-700" : "bg-slate-50/50 border-slate-100"
                      )}>
                        {/* Task Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-blue-500/15">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black tracking-wide text-slate-400 uppercase">{t('taskBlueprintLabel')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedTasks(generatedTasks.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Title input */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('taskTitleLabel')}</label>
                          <input
                            type="text"
                            value={task.title}
                            onChange={e => {
                              const updated = [...generatedTasks];
                              updated[idx].title = e.target.value;
                              setGeneratedTasks(updated);
                            }}
                            placeholder="Masukkan judul tugas..."
                            className={cn(
                              "w-full px-4 py-3 rounded-xl font-bold outline-none border transition-all text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5",
                              darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                            )}
                          />
                        </div>

                        {/* Description textarea */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('taskDescLabel')}</label>
                          <textarea
                            value={task.description}
                            onChange={e => {
                              const updated = [...generatedTasks];
                              updated[idx].description = e.target.value;
                              setGeneratedTasks(updated);
                            }}
                            placeholder="Deskripsi pekerjaan..."
                            rows={2}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl font-medium outline-none border transition-all text-xs text-slate-900 dark:text-white resize-none focus:border-blue-500/50",
                              darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                            )}
                          />
                        </div>

                        {/* Priority and Type Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('priorityLabel')}</label>
                            <select
                              value={task.priority}
                              onChange={e => {
                                const updated = [...generatedTasks];
                                updated[idx].priority = e.target.value as Priority;
                                setGeneratedTasks(updated);
                              }}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl font-bold outline-none border text-xs text-slate-900 dark:text-white",
                                darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                              )}
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('taskTypeLabel')}</label>
                            <select
                              value={task.type}
                              onChange={e => {
                                const updated = [...generatedTasks];
                                updated[idx].type = e.target.value as TaskType;
                                setGeneratedTasks(updated);
                              }}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl font-bold outline-none border text-xs text-slate-900 dark:text-white",
                                darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                              )}
                            >
                              <option value="Development">Development</option>
                              <option value="Bug Fix">Bug Fix</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Infrastructure">Infrastructure</option>
                              <option value="API Service">API Service</option>
                              <option value="Security">Security</option>
                            </select>
                          </div>
                        </div>

                        {/* Checklist Section */}
                        <div className="space-y-2 pt-3 border-t border-slate-150 dark:border-slate-800">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">{t('checklistStepLabel')}</label>
                          <div className="flex flex-wrap gap-2">
                            {(task.checklist ?? []).map((cl, ci) => (
                              <span
                                key={cl.id || ci}
                                className={cn(
                                  "flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border shadow-sm",
                                  darkMode
                                    ? "bg-slate-800 text-slate-300 border-slate-700"
                                    : "bg-white text-slate-600 border-slate-200"
                                )}
                              >
                                <CheckSquare size={12} className="text-blue-400 shrink-0" />
                                <span>{cl.text}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...generatedTasks];
                                    updated[idx].checklist = updated[idx].checklist.filter((_, i) => i !== ci);
                                    setGeneratedTasks(updated);
                                  }}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/15 p-0.5 rounded-full transition-colors font-black text-xs leading-none shrink-0"
                                  style={{ width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(task.checklist ?? []).length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">{t('noStepsYet')}</span>
                            )}
                          </div>
                          {/* Input to add checklist */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              id={`new-cl-${idx}`}
                              placeholder={t('stepPlaceholder')}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (val) {
                                    const updated = [...generatedTasks];
                                    updated[idx].checklist = [
                                      ...(updated[idx].checklist || []),
                                      { id: `c-${Date.now()}-${Math.random()}`, text: val, completed: false }
                                    ];
                                    setGeneratedTasks(updated);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                              className={cn(
                                "flex-1 px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-blue-500/50",
                                darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const inputEl = document.getElementById(`new-cl-${idx}`) as HTMLInputElement;
                                const val = inputEl?.value.trim();
                                if (val) {
                                  const updated = [...generatedTasks];
                                  updated[idx].checklist = [
                                    ...(updated[idx].checklist || []),
                                    { id: `c-${Date.now()}-${Math.random()}`, text: val, completed: false }
                                  ];
                                  setGeneratedTasks(updated);
                                  inputEl.value = '';
                                }
                              }}
                              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/10 transition-all active:scale-95"
                            >
                              {t('addBtn')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Task Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedTasks([
                        ...generatedTasks,
                        {
                          id: `task-${Date.now()}-${Math.random()}`,
                          title: '',
                          description: '',
                          priority: 'Medium',
                          type: (newTemplateCat as any) || 'Development',
                          checklist: []
                        }
                      ]);
                    }}
                    className={cn(
                      "w-full py-5 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-sm shadow-sm",
                      darkMode
                        ? "border-slate-700 bg-slate-900/20 text-slate-400 hover:border-blue-500/50 hover:bg-slate-900/40 hover:text-blue-400"
                        : "border-slate-200 bg-slate-50/50 text-slate-500 hover:border-blue-500/50 hover:bg-white hover:text-blue-600"
                    )}
                  >
                    <Plus size={18} />
                    {t('addNewTask')}
                  </button>
                </div>
              )}

              {/* Modal Footer */}
              <div className={cn("p-8 border-t shrink-0 flex gap-4 justify-between", darkMode ? "border-slate-700" : "border-slate-100")}>
                {createStep === 1 ? (
                  <>
                    <button
                      id="btn_batal_template"
                      onClick={() => {
                        setIsCreating(false);
                        setNewTemplateName('');
                        setNewTemplateDesc('');
                        setGeneratedTasks([]);
                        setCreateStep(1);
                      }}
                      className={cn(
                        "px-6 py-4 rounded-2xl font-bold text-sm border transition-all flex-1",
                        darkMode ? "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      {t('cancelTemplate')}
                    </button>
                    <button
                      id="btn_rancang_template"
                      onClick={() => {
                        setIsAiGenerated(false);
                        setGeneratedTasks([
                          {
                            id: `task-${Date.now()}-${Math.random()}`,
                            title: '',
                            description: '',
                            priority: 'Medium',
                            type: (newTemplateCat as any) || 'Development',
                            checklist: []
                          }
                        ]);
                        setCreateStep(2);
                      }}
                      disabled={!newTemplateName.trim()}
                      className={cn(
                        "px-6 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all flex-1",
                        "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] shadow-lg shadow-[#2D7FEA]/20",
                        "hover:shadow-xl hover:shadow-[#2D7FEA]/30 hover:scale-[1.02] active:scale-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {t('designTemplate')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      id="btn_kembali_template"
                      onClick={() => setCreateStep(1)}
                      className={cn(
                        "px-6 py-4 rounded-2xl font-bold text-sm border transition-all flex-1",
                        darkMode ? "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      {t('backBtn')}
                    </button>
                    <button
                      id="btn_simpan_template"
                      onClick={handleSaveTemplate}
                      disabled={generatedTasks.length === 0 || generatedTasks.some(t => !t.title.trim())}
                      className={cn(
                        "px-8 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all flex-1",
                        "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] shadow-lg shadow-[#2D7FEA]/20",
                        "hover:shadow-xl hover:shadow-[#2D7FEA]/30 hover:scale-[1.02] active:scale-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <CheckCheck size={16} />
                      {t('saveTemplate')}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
