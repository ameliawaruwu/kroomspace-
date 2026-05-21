import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Copy, 
  Trash2, 
  Search,
  Zap,
  Bug,
  Code,
  X,
  CheckCircle2,
  AlertCircle,
  Settings,
  Target,
  MessageSquare,
  Clock,
  Shield,
  MapPin,
  Camera,
  Layers,
  ChevronRight,
  GripVertical,
  Server,
  Activity,
  Database,
  Globe,
  Lock,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Task, TaskType, Priority, Project, TaskTemplate, ChecklistItem, CustomField, AutomationRule } from '../types';
import { mockTemplates } from '../services/apiService';

import { useLanguage } from '../context/LanguageContext';

interface TaskTemplatesProps {
  onAddTask: (task: Partial<Task>) => void;
  onAddProject: (project: Project, tasks: Task[]) => void;
  darkMode: boolean;
  projects: Project[];
  user: any;
}

export const TaskTemplates: React.FC<TaskTemplatesProps> = ({ onAddTask, onAddProject, darkMode, projects, user }) => {
  const { language, t } = useLanguage();
  const [activeView, setActiveView] = useState<'list' | 'builder' | 'use'>('list');
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [useData, setUseData] = useState<Partial<Task>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isAdmin = user.role === 'Admin';
  
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((t: any) => ({
            id: t.id_template,
            name: t.nama_template,
            category: t.kategori,
            description: t.deskripsi || '',
            priority: t.prioritas,
            estimatedHours: t.estimasi_jam,
            slaDays: 7, // default since it's not in db
            assignmentType: 'manual',
            checklist: [],
            customFields: [],
            automationRules: [],
            whatsappTrigger: { onCreate: true, onAssign: false, onDone: true, onOverdue: false }
          }));
          setTemplates(mapped as TaskTemplate[]);
        }
      })
      .catch(console.error);
  }, []);

  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false);
  const [templateToUse, setTemplateToUse] = useState<TaskTemplate | null>(null);

  const getCategoryIcon = (category: TaskType) => {
    switch (category) {
      case 'Infrastructure': return <Server size={28} />;
      case 'API Service': return <Globe size={28} />;
      case 'Security': return <Shield size={28} />;
      case 'Maintenance': return <Zap size={28} />;
      case 'Bug Fix': return <Bug size={28} />;
      case 'Development': return <Code size={28} />;
      default: return <Layers size={28} />;
    }
  };

  const getCategoryColor = (category: TaskType) => {
    switch (category) {
      case 'Infrastructure': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20';
      case 'API Service': return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20';
      case 'Security': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20';
      case 'Maintenance': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20';
      case 'Bug Fix': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20';
      case 'Development': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:border-slate-500/20';
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate({
      id: Date.now().toString(),
      name: '',
      category: 'Development',
      description: '',
      priority: 'Medium',
      estimatedHours: 1,
      slaDays: 7,
      assignmentType: 'manual',
      checklist: [],
      customFields: [],
      automationRules: [],
      whatsappTrigger: { onCreate: true, onAssign: false, onDone: true, onOverdue: false }
    });
    setActiveView('builder');
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const exists = templates.find(t => t.id === editingTemplate.id);
      // Wait, if it exists but it has a timestamp ID, we might need to check if it's really in DB.
      // If it starts with 'TPL', it's from DB. Otherwise it's new.
      const isNew = !editingTemplate.id.startsWith('TPL');
      
      const res = await fetch(isNew ? '/api/templates' : `/api/templates/${editingTemplate.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_template: editingTemplate.name,
          kategori: editingTemplate.category,
          deskripsi: editingTemplate.description,
          prioritas: editingTemplate.priority,
          estimasi_jam: editingTemplate.estimatedHours
        })
      });
      const dbTemp = await res.json();
      
      const formatted = {
        ...editingTemplate,
        id: dbTemp.id_template || editingTemplate.id
      };

      if (!isNew) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? formatted : t));
      } else {
        setTemplates([...templates, formatted]);
      }
      setActiveView('list');
      setSuccessMessage(t('templateSavedSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) { console.error(e); }
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    setTemplateToUse(template);
    setUseData({
      title: template.name,
      description: template.description,
      priority: template.priority,
      type: template.category,
      checklist: template.checklist.map(i => ({ ...i, id: `c-${Math.random()}` })),
      customFields: template.customFields.map(f => ({ ...f, id: `f-${Math.random()}` })),
      status: 'To Do',
      projectId: projects[0]?.id || ''
    });
    setActiveView('use');
  };

  const confirmUseTemplate = (projectId?: string) => {
    const targetProjectId = projectId || useData.projectId;
    if (!templateToUse || !targetProjectId) return;
    
    const newTask: Task = {
      ...useData,
      projectId: targetProjectId,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      deadline: useData.deadline || new Date(Date.now() + templateToUse.slaDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      automationRules: templateToUse.automationRules,
      templateId: templateToUse.id,
      assignee: user.id
    } as Task;

    onAddTask(newTask);
    setActiveView('list');
    setTemplateToUse(null);
    setSuccessMessage(t('taskAdded'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      {activeView === 'list' ? (
        <div className="space-y-8 relative max-w-7xl mx-auto px-4 sm:px-0">
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-8 py-8 sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/20 transition-all">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{t('templates')}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{t('templatesSubHeader')}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
              <div className="relative flex-1 xl:w-96 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchTemplates')}
                  className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm text-slate-900 dark:text-white text-sm font-medium"
                />
              </div>
              <button 
                onClick={handleCreateNew}
                className="px-10 py-4 bg-blue-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} strokeWidth={3} />
                {t('createTemplate')}
              </button>
            </div>
          </header>

          <div className="px-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTemplates.map((template, i) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 flex gap-2 translate-x-10 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => { setEditingTemplate(template); setActiveView('builder'); }}
                    className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all"
                  >
                    <Settings size={18} />
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm('Are you sure?')) {
                        setTemplates(templates.filter(tm => tm.id !== template.id));
                        await fetch(`/api/templates/${template.id}`, { method: 'DELETE' }).catch(console.error);
                      }
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-600 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className={cn(
                    "w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center border-2",
                    getCategoryColor(template.category)
                  )}>
                    {getCategoryIcon(template.category)}
                  </div>
                  <div className="pt-1 flex-1 min-w-0">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.2] truncate group-hover:text-blue-600 transition-colors">{template.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mt-1">{t(template.category.toLowerCase().replace(' ', '')) || template.category}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed line-clamp-2 h-10">
                  {template.description || "No description provided for this template."}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('priority')}</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{t(template.priority.toLowerCase())}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('checklist')}</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{template.checklist.length} {t('item')}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleUseTemplate(template)}
                  className="w-full py-5 bg-slate-900 dark:bg-slate-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-[10px] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 group/btn active:scale-[0.98]"
                >
                  {t('useTemplate')}
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ) : activeView === 'builder' ? (
        <div className="max-w-5xl mx-auto p-10 space-y-10">
          <header className="flex items-center justify-between">
            <button 
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-all"
            >
              <X size={20} />
              {t('backToList')}
            </button>
            <button 
              onClick={saveTemplate}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all"
            >
              {t('saveTemplate')}
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Core Info */}
            <div className="lg:col-span-2 space-y-10">
              <section className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
                <div className="flex items-center gap-4 text-blue-600 mb-2">
                  <FileText size={24} />
                  <h2 className="text-2xl font-bold tracking-tight">{t('templateName')} & {t('desc')}</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('templateName')}</label>
                    <input 
                      type="text"
                      value={editingTemplate?.name}
                      onChange={(e) => setEditingTemplate({...editingTemplate!, name: e.target.value})}
                      placeholder="e.g. Daily Review"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('desc')}</label>
                    <textarea 
                      value={editingTemplate?.description}
                      onChange={(e) => setEditingTemplate({...editingTemplate!, description: e.target.value})}
                      rows={3}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-medium text-slate-600 dark:text-slate-300 resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Checklist Builder */}
              <section className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-blue-600">
                    <CheckCircle2 size={24} />
                    <h2 className="text-2xl font-bold tracking-tight">{t('checklistItems')}</h2>
                  </div>
                  <button 
                    onClick={() => setEditingTemplate({...editingTemplate!, checklist: [...editingTemplate!.checklist, { id: Date.now().toString(), text: '', completed: false }]})}
                    className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={18} />
                    {t('addItem')}
                  </button>
                </div>

                <div className="space-y-4">
                  {editingTemplate?.checklist.map((item, idx) => (
                    <motion.div 
                      layout
                      key={item.id} 
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 group"
                    >
                      <GripVertical size={20} className="text-slate-300 cursor-grab" />
                      <input 
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const newChecklist = [...editingTemplate.checklist];
                          newChecklist[idx].text = e.target.value;
                          setEditingTemplate({...editingTemplate, checklist: newChecklist});
                        }}
                        className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200"
                        placeholder="..."
                      />
                      <button 
                        onClick={() => setEditingTemplate({...editingTemplate, checklist: editingTemplate.checklist.filter((_, i) => i !== idx)})}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                  {editingTemplate?.checklist.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[2rem]">
                      <p className="text-slate-400 font-bold">{t('templateItemEmpty')}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Custom Fields Builder */}
              <section className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-blue-600">
                    <Layers size={24} />
                    <h2 className="text-2xl font-bold tracking-tight">{t('additionalFields')}</h2>
                  </div>
                  <button 
                    onClick={() => setEditingTemplate({...editingTemplate!, customFields: [...editingTemplate!.customFields, { id: Date.now().toString(), label: '', type: 'text', required: true }]})}
                    className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={18} />
                    {t('addField')}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editingTemplate?.customFields.map((field, idx) => (
                    <div key={field.id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-700 space-y-4 relative group">
                      <button 
                        onClick={() => setEditingTemplate({...editingTemplate, customFields: editingTemplate.customFields.filter((_, i) => i !== idx)})}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('fieldLabel')}</label>
                        <input 
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const newFields = [...editingTemplate!.customFields];
                            newFields[idx].label = e.target.value;
                            setEditingTemplate({...editingTemplate!, customFields: newFields});
                          }}
                          className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500/30"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('fieldType')}</label>
                          <select 
                            value={field.type}
                            onChange={(e) => {
                              const newFields = [...editingTemplate!.customFields];
                              newFields[idx].type = e.target.value as any;
                              setEditingTemplate({...editingTemplate!, customFields: newFields});
                            }}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-700"
                          >
                            <option value="text">{t('textType')}</option>
                            <option value="number">{t('numberType')}</option>
                            <option value="image">{t('imageType')}</option>
                            <option value="location">{t('locationType')}</option>
                            <option value="date">{t('dateType')}</option>
                          </select>
                        </div>
                        <div className="mt-8">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={field.required}
                                onChange={(e) => {
                                  const newFields = [...editingTemplate!.customFields];
                                  newFields[idx].required = e.target.checked;
                                  setEditingTemplate({...editingTemplate!, customFields: newFields});
                                }}
                                className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs font-bold text-slate-500">{t('fieldRequired')}</span>
                           </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Config & Meta */}
            <div className="space-y-10">
              <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 text-slate-900 dark:text-white">
                <div className="flex items-center gap-3 text-blue-600">
                  <Clock size={20} />
                  <h3 className="font-bold">{t('defaultPriority')} & SLA</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('category')}</label>
                    <select 
                      value={editingTemplate?.category}
                      onChange={(e) => setEditingTemplate({...editingTemplate!, category: e.target.value as TaskType})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold"
                    >
                      <option value="Maintenance">{t('maintenance')}</option>
                      <option value="Bug Fix">{t('bugFix')}</option>
                      <option value="Development">{t('development')}</option>
                      <option value="Infrastructure">{t('infrastructure')}</option>
                      <option value="API Service">{t('apiService')}</option>
                      <option value="Security">{t('security')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('defaultPriority')}</label>
                    <div className="flex gap-2">
                      {(['Low', 'Medium', 'High'] as Priority[]).map(p => (
                        <button 
                          key={p}
                          onClick={() => setEditingTemplate({...editingTemplate!, priority: p})}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-bold text-xs border transition-all",
                            editingTemplate?.priority === p 
                              ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600" 
                              : "bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100"
                          )}
                        >
                          {t(p.toLowerCase())}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('estHoursLabel')}</label>
                      <input 
                        type="number"
                        value={editingTemplate?.estimatedHours}
                        onChange={(e) => setEditingTemplate({...editingTemplate!, estimatedHours: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('slaDaysLabel')}</label>
                      <input 
                        type="number"
                        value={editingTemplate?.slaDays}
                        onChange={(e) => setEditingTemplate({...editingTemplate!, slaDays: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 text-slate-900 dark:text-white">
                <div className="flex items-center gap-3 text-blue-600">
                  <Shield size={20} />
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('automation')}</h3>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox"
                            checked={editingTemplate?.automationRules.some(r => r.action === 'require_photo')}
                            onChange={(e) => {
                              let newRules = [...editingTemplate!.automationRules];
                              if (e.target.checked) {
                                newRules.push({ trigger: 'status_change', action: 'require_photo' });
                              } else {
                                newRules = newRules.filter(r => r.action !== 'require_photo');
                              }
                              setEditingTemplate({...editingTemplate!, automationRules: newRules});
                            }}
                            className="w-6 h-6 rounded-lg text-blue-600 border-slate-200"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('requirePhoto')}</span>
                          <span className="text-[10px] text-slate-400">{t('whenTaskCompleted')}</span>
                        </div>
                        <Camera size={14} className="ml-auto text-blue-600" />
                      </label>
                   </div>
                   <div className="p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={editingTemplate?.automationRules.some(r => r.action === 'require_notes')}
                          onChange={(e) => {
                            let newRules = [...editingTemplate!.automationRules];
                            if (e.target.checked) {
                              newRules.push({ trigger: 'status_change', action: 'require_notes' });
                            } else {
                              newRules = newRules.filter(r => r.action !== 'require_notes');
                            }
                            setEditingTemplate({...editingTemplate!, automationRules: newRules});
                          }}
                          className="w-6 h-6 rounded-lg text-blue-600 border-slate-200"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('requireNotes')}</span>
                          <span className="text-[10px] text-slate-400">{t('forEveryVerification')}</span>
                        </div>
                        <FileText size={14} className="ml-auto text-blue-600" />
                      </label>
                   </div>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 text-slate-900 dark:text-white">
                <div className="flex items-center gap-3 text-blue-600">
                  <MessageSquare size={20} />
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('whatsappNotification')}</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                   {[
                     { key: 'onCreate', label: t('onTaskCreated') },
                     { key: 'onAssign', label: t('onAssigned') },
                     { key: 'onDone', label: t('onCompleted') },
                     { key: 'onOverdue', label: t('onOverdue') },
                   ].map(trigger => (
                     <label key={trigger.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-transparent">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{trigger.label}</span>
                        <div className="relative inline-flex items-center">
                          <input 
                            type="checkbox"
                            checked={(editingTemplate?.whatsappTrigger as any)[trigger.key]}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate!, 
                              whatsappTrigger: { ...editingTemplate!.whatsappTrigger, [trigger.key]: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-slate-200 rounded-full dark:bg-slate-700 peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                        </div>
                     </label>
                   ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto p-10 space-y-10 pb-40">
          <header className="flex items-center justify-between mb-10">
            <button 
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-all"
            >
              <X size={20} />
              {t('backToList')}
            </button>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">{templateToUse?.name}</h2>
          </header>

          <form onSubmit={(e) => { e.preventDefault(); confirmUseTemplate(); }} className="space-y-8">
            <section className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 dark:border-slate-700 pb-4">
                <Target size={16} className="text-blue-500" /> {t('completeInfo')}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('selectProject')}</label>
                  <select 
                    required
                    value={useData.projectId}
                    onChange={(e) => setUseData({...useData, projectId: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">{t('selectProject')}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('name')}</label>
                  <input 
                    type="text"
                    required
                    value={useData.title}
                    onChange={(e) => setUseData({...useData, title: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('desc')}</label>
                  <textarea 
                    rows={3}
                    value={useData.description}
                    onChange={(e) => setUseData({...useData, description: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-blue-500/10 resize-none text-sm"
                  />
                </div>
              </div>
            </section>

            {useData.checklist && useData.checklist.length > 0 && (
              <section className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 dark:border-slate-700 pb-4">
                  <CheckCircle2 size={16} className="text-blue-500" /> Checklist
                </h3>
                <div className="space-y-3">
                  {useData.checklist.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                       <CheckCircle2 size={16} className="text-slate-300" />
                       <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {useData.customFields && useData.customFields.length > 0 && (
              <section className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 dark:border-slate-700 pb-4">
                  <Layers size={16} className="text-blue-500" /> {t('operationalData')}
                </h3>
                <div className="space-y-6">
                  {useData.customFields.map((field, idx) => (
                    <div key={field.id} className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         {field.label} {field.required && <span className="text-rose-500">*</span>}
                       </label>
                       {field.type === 'text' && <input type="text" required={field.required} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl font-bold" />}
                       {field.type === 'location' && <div className="p-4 bg-slate-900 rounded-xl flex items-center justify-between text-white"><span className="text-xs font-bold">{t('autoDetectLocation')}</span><MapPin size={16} /></div>}
                       {field.type === 'image' && <div className="p-4 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center gap-2 text-slate-300"><Camera size={24} /><span className="text-[8px] font-black uppercase">{t('clickToCaptureProof')}</span></div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3">
              <Plus size={20} strokeWidth={3} />
              {t('confirmUse')}
            </button>
          </form>
        </div>
      )}

      {/* Modal for Selecting Project when using Template */}
      <AnimatePresence>
        {showUseTemplateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUseTemplateModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-10"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
                {t('useThisTemplate')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                {t('selectProjectToAddTask')}
              </p>
              
              <div className="space-y-3 mb-10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {projects.map(project => (
                  <button 
                    key={project.id}
                    onClick={() => confirmUseTemplate(project.id)}
                    className="w-full text-left p-5 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all font-bold text-slate-700 dark:text-slate-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span>{project.name}</span>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-all" />
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowUseTemplateModal(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                {t('cancel')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success SuccessMessage */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[110] bg-slate-900 dark:bg-blue-600 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-800 dark:border-blue-500"
          >
            <div className="w-10 h-10 bg-blue-500 dark:bg-white rounded-full flex items-center justify-center">
              <CheckCircle2 size={24} className="dark:text-blue-600" />
            </div>
            <span className="font-bold text-lg">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

