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
    case 'API Service':    return <Globe {...props} />;
    case 'Security':       return <Shield {...props} />;
    case 'Maintenance':    return <Zap {...props} />;
    case 'Bug Fix':        return <Bug {...props} />;
    default:               return <Code {...props} />;  // Development
  }
};

const getCategoryGradient = (kategori: string) => {
  switch (kategori) {
    case 'Infrastructure': return 'from-[#3FA9F5] to-[#2D7FEA]';
    case 'API Service':    return 'from-[#2D7FEA] to-[#1E40AF]';
    case 'Security':       return 'from-[#67C6FF] to-[#3FA9F5]';
    case 'Maintenance':    return 'from-[#3FA9F5] to-[#1E3A8A]';
    default:               return 'from-[#3FA9F5] to-[#2D7FEA]';  // Development
  }
};

const getCategoryBg = (kategori: string, dark: boolean) => {
  if (dark) {
    switch (kategori) {
      case 'Infrastructure': return 'bg-[#3FA9F5]/10 text-[#3FA9F5] border-[#3FA9F5]/20';
      case 'API Service':    return 'bg-[#2D7FEA]/10 text-[#60A5FA] border-[#2D7FEA]/20';
      case 'Security':       return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Maintenance':    return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default:               return 'bg-[#3FA9F5]/10 text-[#3FA9F5] border-[#3FA9F5]/20';
    }
  }
  switch (kategori) {
    case 'Infrastructure': return 'bg-[#EBF5FF] text-[#2D7FEA] border-[#BFDFFF]/50';
    case 'API Service':    return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'Security':       return 'bg-sky-50 text-sky-600 border-sky-100';
    case 'Maintenance':    return 'bg-blue-50 text-[#2D7FEA] border-blue-100';
    default:               return 'bg-[#EBF5FF] text-[#2D7FEA] border-[#BFDFFF]/50';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':   return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
    case 'Medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
    default:       return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
  }
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
              Template Proyek
            </h1>
          </div>
          <p className={cn("text-sm font-medium ml-14", darkMode ? "text-slate-400" : "text-slate-500")}>
            Blueprint proyek lengkap — tugas & checklist siap pakai, di-generate AI
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 xl:w-auto">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari template..."
              className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white text-sm font-medium shadow-sm transition-all"
            />
          </div>

          {isAdmin && (
            <button
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
              Buat Template Baru
            </button>
          )}
        </div>
      </header>

      {/* ── Category Filters ── */}
      <div className="px-8 pt-6 pb-2 flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
              selectedCategory === cat
                ? "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] text-white border-none shadow-lg shadow-[#2D7FEA]/20"
                : darkMode
                  ? "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            {cat}
          </button>
        ))}
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
      <div className="px-8 pt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className={cn(
              "rounded-[2.5rem] p-8 animate-pulse h-72",
              darkMode ? "bg-slate-800" : "bg-slate-100"
            )} />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <LayoutTemplate size={36} className="text-slate-400" />
            </div>
            <p className="text-slate-400 font-medium">Tidak ada template ditemukan</p>
          </div>
        ) : filtered.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "group relative rounded-[2.5rem] overflow-hidden border transition-all cursor-pointer",
              "hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1",
              darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 shadow-sm"
            )}
            onClick={() => setPreviewTemplate(template)}
          >
            {/* Gradient header */}
            <div className={cn("h-2 w-full bg-gradient-to-r", getCategoryGradient(template.kategori))} />

            <div className="p-7">
              {/* Icon + Category */}
              <div className="flex items-start justify-between mb-5">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0",
                  getCategoryBg(template.kategori, darkMode)
                )}>
                  {getCategoryIcon(template.kategori, 24)}
                </div>

                {/* Admin controls */}
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(template.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-xl border border-slate-100 dark:border-slate-700 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Name */}
              <h3 className={cn(
                "text-lg font-black tracking-tight leading-[1.2] mb-2 group-hover:text-blue-600 transition-colors",
                darkMode ? "text-white" : "text-slate-900"
              )}>
                {template.name}
              </h3>

              {/* Category badge */}
              <span className={cn(
                "inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-3",
                getCategoryBg(template.kategori, darkMode)
              )}>
                {template.kategori}
              </span>

              {/* Description */}
              <p className={cn(
                "text-xs font-medium leading-relaxed line-clamp-2 mb-5",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}>
                {template.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-5">
                <div className={cn(
                  "flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-xl",
                  darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-50 text-slate-600"
                )}>
                  <ListChecks size={13} />
                  <span>{totalTugas(template)} Tugas</span>
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-xl",
                  darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-50 text-slate-600"
                )}>
                  <CheckSquare size={13} />
                  <span>{totalChecklist(template)} Checklist</span>
                </div>
              </div>

              {/* Preview tasks (first 3) */}
              <div className="space-y-1.5 mb-6">
                {(template.tasks ?? []).slice(0, 3).map((task, idx) => (
                  <div key={idx} className={cn(
                    "flex items-center gap-2 text-xs font-medium py-1.5 px-3 rounded-xl",
                    darkMode ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"
                  )}>
                    <CheckCircle2 size={11} className="text-blue-400 shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {(template.tasks ?? []).length > 3 && (
                  <p className={cn("text-[10px] font-bold pl-3", darkMode ? "text-slate-500" : "text-slate-400")}>
                    +{template.tasks.length - 3} tugas lainnya...
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setProjectName(template.name);
                  setApplyTemplate(template);
                }}
                className={cn(
                  "w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all",
                  "bg-gradient-to-r from-[#3FA9F5] to-[#2D7FEA] text-white shadow-lg shadow-[#2D7FEA]/20 hover:shadow-xl hover:shadow-[#2D7FEA]/30 hover:scale-[1.02] active:scale-100"
                )}
              >
                <Sparkles size={16} />
                Terapkan Template
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
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
                "w-full max-w-3xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col",
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
                    <h2 className={cn("text-2xl font-black", darkMode ? "text-white" : "text-slate-900")}>{previewTemplate.name}</h2>
                    <p className={cn("text-sm mt-0.5", darkMode ? "text-slate-400" : "text-slate-500")}>{previewTemplate.description}</p>
                  </div>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                  <X size={22} className="text-slate-400" />
                </button>
              </div>

              {/* Stats */}
              <div className={cn("px-8 py-4 flex gap-6 border-b shrink-0", darkMode ? "border-slate-700 bg-slate-900/30" : "border-slate-100 bg-slate-50/80")}>
                <div className="flex items-center gap-2">
                  <ListChecks size={16} className="text-blue-500" />
                  <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-slate-700")}>{totalTugas(previewTemplate)} Tugas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-emerald-500" />
                  <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-slate-700")}>{totalChecklist(previewTemplate)} Item Checklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-indigo-500" />
                  <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-slate-700")}>Mode {previewTemplate.mode}</span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {(previewTemplate.tasks ?? []).map((task, idx) => (
                  <div key={idx} className={cn(
                    "rounded-2xl border p-5",
                    darkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 bg-gradient-to-br",
                        getCategoryGradient(previewTemplate.kategori),
                        "text-white"
                      )}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className={cn("font-bold text-sm", darkMode ? "text-white" : "text-slate-900")}>{task.title}</h4>
                        <p className={cn("text-xs mt-0.5 line-clamp-1", darkMode ? "text-slate-500" : "text-slate-400")}>{task.description}</p>
                      </div>
                      <span className={cn("ml-auto text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0", getPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-10">
                      {(task.checklist ?? []).map((cl, ci) => (
                        <span key={ci} className={cn(
                          "flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-xl",
                          darkMode ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500 border border-slate-100"
                        )}>
                          <CheckCircle2 size={9} className="text-blue-400" />
                          {cl.text}
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
                  Terapkan Template Ini
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
                "w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/10",
                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
              )}
            >
              {/* Icon */}
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-6 bg-gradient-to-br", getCategoryGradient(applyTemplate.kategori), "shadow-xl")}>
                {getCategoryIcon(applyTemplate.kategori, 28)}
              </div>

              <h2 className={cn("text-2xl font-black mb-2", darkMode ? "text-white" : "text-slate-900")}>
                Buat Proyek Baru
              </h2>
              <p className={cn("text-sm mb-8 font-medium leading-relaxed", darkMode ? "text-slate-400" : "text-slate-500")}>
                Template <strong className={darkMode ? "text-white" : "text-slate-800"}>{applyTemplate.name}</strong> akan membuat proyek dengan <strong className="text-blue-500">{totalTugas(applyTemplate)} tugas</strong> dan <strong className="text-emerald-500">{totalChecklist(applyTemplate)} checklist</strong>.
              </p>

              {/* Name Input */}
              <div className="space-y-2 mb-8">
                <label className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
                  Nama Proyek
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApply()}
                  placeholder="Masukkan nama proyek..."
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
                  Batal
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
                      Membuat...
                    </>
                  ) : (
                    <>
                      <CheckCheck size={18} />
                      Buat Proyek
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
                "w-full max-w-2xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl shadow-blue-900/10",
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
                    {createStep === 1 ? 'Rancang Template Baru' : 'Tinjau Hasil Rancangan AI'}
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
                      Nama Template
                    </label>
                    <input
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
                      Deskripsi Template
                    </label>
                    <textarea
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
                      Kategori
                    </label>
                    <select
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
                        "rounded-[2rem] border p-6 space-y-4 shadow-sm",
                        darkMode ? "bg-slate-900/30 border-slate-750" : "bg-slate-50/50 border-slate-100"
                      )}>
                        {/* Task Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-blue-500/15">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black tracking-wide text-slate-400 uppercase">Tugas Blueprint</span>
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
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Judul Tugas</label>
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
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Deskripsi Tugas</label>
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Prioritas</label>
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tipe Tugas</label>
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
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">Checklist Langkah Kerja</label>
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
                              <span className="text-[10px] text-slate-400 italic">Belum ada langkah kerja. Tulis dan tambahkan di bawah.</span>
                            )}
                          </div>
                          {/* Input to add checklist */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              id={`new-cl-${idx}`}
                              placeholder="Tulis langkah kerja lalu tekan Enter..."
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
                              Tambah
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
                      "w-full py-5 border-2 border-dashed rounded-[2rem] flex items-center justify-center gap-3 transition-all font-bold text-sm shadow-sm",
                      darkMode 
                        ? "border-slate-700 bg-slate-900/20 text-slate-400 hover:border-blue-500/50 hover:bg-slate-900/40 hover:text-blue-400" 
                        : "border-slate-200 bg-slate-50/50 text-slate-500 hover:border-blue-500/50 hover:bg-white hover:text-blue-600"
                    )}
                  >
                    <Plus size={18} />
                    Tambah Tugas Baru
                  </button>
                </div>
              )}

              {/* Modal Footer */}
              <div className={cn("p-8 border-t shrink-0 flex gap-4 justify-between", darkMode ? "border-slate-700" : "border-slate-100")}>
                {createStep === 1 ? (
                  <>
                    <button
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
                      Batal
                    </button>
                    <button
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
                      Rancang Template
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCreateStep(1)}
                      className={cn(
                        "px-6 py-4 rounded-2xl font-bold text-sm border transition-all flex-1",
                        darkMode ? "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      Kembali
                    </button>
                    <button
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
                      Simpan Template
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
