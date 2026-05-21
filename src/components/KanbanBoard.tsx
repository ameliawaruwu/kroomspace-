import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  MoreHorizontal, 
  Plus, 
  Calendar, 
  MessageSquare, 
  Paperclip,
  AlertCircle,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  Trello,
  Layers,
  Layout,
  X,
  CheckCircle2,
  FileText,
  User as UserIcon,
  Sparkles,
  BrainCircuit,
  MessageCircle,
  Send,
  Loader2,
  MapPin,
  Camera,
  Save,
  Edit,
  Flag,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskStatus, Priority, Project, TaskTemplate, ChecklistItem, KanbanMode } from '../types';
import { mockUsers, mockTemplates } from '../services/apiService';
import { analyzePriority, sortTasksByPriority, getMaintenanceConsultation } from '../services/aiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

const COLUMNS: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
const DraggableAny = Draggable as any;

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  isBoardOpen: boolean;
  setIsBoardOpen: (open: boolean) => void;
  onAddProject: (project: Project, tasks: Task[]) => void;
  onAddNotification: (message: string, type: any, sendWhatsApp?: boolean) => void;
  onSuccess: (message: string) => void;
  user: any;
  darkMode: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  setTasks, 
  projects, 
  currentProjectId, 
  setCurrentProjectId,
  isBoardOpen,
  setIsBoardOpen,
  onAddProject,
  onAddNotification,
  onSuccess,
  user,
  darkMode
}) => {
  const { language, t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSorting, setIsSorting] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [newProjectMode, setNewProjectMode] = useState<KanbanMode>('Project');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [commentText, setCommentText] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<'file' | 'link'>('link');
  const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentProject = projects.find(p => p.id === currentProjectId);
  const isOperational = currentProject?.mode === 'Operational';

  const isCriticalTask = (task: Task) => {
    const criticalKeywords = ['error', 'down', 'critical', 'urgent', 'bug', 'fail', 'mati', 'rusak', 'kendala'];
    const hasKeyword = criticalKeywords.some(key => 
      task.title.toLowerCase().includes(key) || 
      task.description?.toLowerCase().includes(key)
    );
    return task.priority === 'High' || task.isBlocked === true || hasKeyword;
  };

  const hasCriticalWarnings = tasks.some(t => t.projectId === currentProjectId && isCriticalTask(t));
  const boardColumns = currentProject?.columns?.length ? [...currentProject.columns].sort((a, b) => a.order - b.order) : COLUMNS.map((col, idx) => ({ id: `col-${idx}`, title: col, status: col, order: idx }));

  const isAdmin = user.role === 'Admin';

  const filteredTasks = tasks.filter(t => {
    const isProject = t.projectId === currentProjectId;
    if (filterMode === 'my') {
      return isProject && t.assignee === user.id;
    }
    return isProject;
  });

  const recommendedTask = [...filteredTasks]
    .filter(t => t.status !== 'Done')
    .sort((a, b) => {
      const pMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return pMap[b.priority] - pMap[a.priority];
    })[0];

  const handleAddTask = (status: TaskStatus = 'Backlog') => {
    if (isOperational) {
      setShowTemplateModal(true);
      return;
    }
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: '',
      description: '',
      status,
      priority: 'Medium',
      type: 'Development',
      createdAt: new Date().toISOString().split('T')[0],
      projectId: currentProjectId,
      contributors: [],
      comments: []
    };
    setSelectedTask(newTask);
    setIsEditing(true);
  };

  const createTaskFromTemplate = (template: TaskTemplate) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: template.name,
      description: template.description,
      status: 'Backlog',
      priority: template.priority,
      type: template.category,
      projectId: currentProjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist: template.checklist,
      automationRules: template.automationRules,
      templateId: template.id,
      customFields: template.customFields,
    };
    
    setTasks([...tasks, newTask]);
    setShowTemplateModal(false);
    onSuccess(`${t('taskCreated')}: ${template.name}`);
    
    onAddNotification(
      `${t('newTaskFromTemplateNotification')} ${template.name}`,
      'Info'
    );
  };

  const handleAISuggest = async () => {
    if (!selectedTask || !selectedTask.title) return;
    setIsAnalyzing(true);
    try {
      const suggestedPriority = await analyzePriority({
        title: selectedTask.title,
        description: selectedTask.description,
        type: selectedTask.type
      });
      setSelectedTask({ ...selectedTask, priority: suggestedPriority });
    } catch (error) {
      console.error("AI Priority Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAISort = async (column: TaskStatus) => {
    const columnTasks = tasks.filter(t => t.status === column && t.projectId === currentProjectId);
    if (columnTasks.length <= 1) return;

    setIsSorting(column);
    setActiveMenu(null);
    try {
      const sortedIds = await sortTasksByPriority(columnTasks);
      
      // Create a map for quick lookup of sorted index
      const idToIndex = new Map(sortedIds.map((id, index) => [id, index]));
      
      const otherTasks = tasks.filter(t => t.status !== column || t.projectId !== currentProjectId);
      const sortedColumnTasks = [...columnTasks].sort((a, b) => {
        const indexA = idToIndex.get(a.id) ?? 999;
        const indexB = idToIndex.get(b.id) ?? 999;
        return indexA - indexB;
      });

      setTasks([...otherTasks, ...sortedColumnTasks]);
    } catch (error) {
      console.error("AI Sort failed:", error);
    } finally {
      setIsSorting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAttachment = {
        id: `a${Date.now()}`,
        name: file.name,
        url: reader.result as string,
        type: 'file' as const,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      const updatedTask = {
        ...selectedTask,
        attachments: [...(selectedTask.attachments || []), newAttachment]
      };
      setSelectedTask(updatedTask);
      
      // Update tasks list immediately to persist
      const newTasks = tasks.map(t => t.id === selectedTask.id ? updatedTask : t);
      setTasks(newTasks);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const logActivity = (taskId: string, action: string) => {};

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Workflow Validation
    if (newStatus === 'In Progress' && !task.assignee) {
      onAddNotification(
        t('assigneeRequired'),
        'Alert'
      );
      return;
    }

    if (newStatus === 'Done') {
      const hasPhotoRule = task.automationRules?.some(r => r.action === 'require_photo');
      const hasNotesRule = task.automationRules?.some(r => r.action === 'require_notes');
      const hasPhoto = task.attachments?.some(a => a.type === 'file');
      const hasNotes = task.comments && task.comments.length > 0;

      if ((hasPhotoRule && !hasPhoto) || (hasNotesRule && !hasNotes)) {
        onAddNotification(
          t('requirementsMissing'),
          'Alert'
        );
        return;
      }
    }

    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    logActivity(taskId, `${t('statusChangedTo')} ${newStatus}`);
    
    if (newStatus === 'Done') {
      onSuccess(t('taskCompleted'));
    }
  };

  const handleSaveTask = () => {
    if (!selectedTask) return;
    if (!selectedTask.title.trim()) return;

    const taskExists = tasks.some(t => t.id === selectedTask.id);
    if (taskExists) {
      setTasks(tasks.map(t => t.id === selectedTask.id ? selectedTask : t));
      onSuccess(t('taskUpdated'));
    } else {
      setTasks([...tasks, selectedTask]);
      onAddNotification(
        `${t('newTaskCreated')} ${selectedTask.title}`,
        'Task',
        false
      );
      onSuccess(t('taskCreated'));
    }
    setSelectedTask(null);
    setIsEditing(false);
    setAttachmentName('');
    setAttachmentUrl('');
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim() || !selectedTask) return;
    const newItem = { id: `c${Date.now()}`, text: newChecklistItem.trim(), completed: false };
    const updatedTask = {
      ...selectedTask,
      checklist: [...(selectedTask.checklist || []), newItem]
    };
    setSelectedTask(updatedTask);
    setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
    setNewChecklistItem('');
  };

  const handleAIChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Find a task to provide context if one is selected, otherwise use project context
      const contextTask = selectedTask || filteredTasks.find(t => t.status === 'In Progress') || filteredTasks[0];
      const solution = await getMaintenanceConsultation(
        userMessage, 
        {
          projectTitle: currentProject?.name,
          taskTitle: contextTask?.title,
          description: contextTask?.description,
          checklist: contextTask?.checklist?.map(c => c.text)
        },
        language
      );
      setChatMessages(prev => [...prev, { role: 'ai', content: solution }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', content: t('aiAssistant.error') }]);
    } finally {
      setIsTyping(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    // Workflow Validation for "Done"
    if (destStatus === 'Done' && task.automationRules) {
      const hasPhotoRule = task.automationRules.some(r => r.action === 'require_photo');
      const hasNotesRule = task.automationRules.some(r => r.action === 'require_notes');
      const hasPhoto = task.attachments?.some(a => a.type === 'file');
      const hasNotes = task.comments && task.comments.length > 0;

      if ((hasPhotoRule && !hasPhoto) || (hasNotesRule && !hasNotes)) {
        onAddNotification(
          t('requirementsMissing'),
          'Alert'
        );
        return;
      }
    }

    // Additional Validation for "In Progress"
    if (destStatus === 'In Progress' && !task.assignee) {
      onAddNotification(
        t('assigneeRequired'),
        'Alert'
      );
      return;
    }

    // Reordering logic within the project
    const sourceColumnTasks = filteredTasks.filter(t => t.status === sourceStatus);
    const destColumnTasks = filteredTasks.filter(t => t.status === destStatus);

    let finalProjectTasks = [...tasks];

    if (sourceStatus === destStatus) {
      // Reorder within same column
      const newColumnTasks = [...sourceColumnTasks];
      const [moved] = newColumnTasks.splice(source.index, 1);
      newColumnTasks.splice(destination.index, 0, moved);

      // We need to keep other statuses in the project intact
      const otherStatusTasks = tasks.filter(t => t.status !== sourceStatus);
      finalProjectTasks = [...otherStatusTasks, ...newColumnTasks];
    } else {
      // Move between columns
      const updatedTask = { 
        ...task, 
        status: destStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name
      };

      const sourceItems = [...sourceColumnTasks];
      sourceItems.splice(source.index, 1);

      const destItems = [...destColumnTasks];
      destItems.splice(destination.index, 0, updatedTask);

      // Reconstruct this project's task list
      const otherStatusTasks = tasks.filter(t => t.status !== sourceStatus && t.status !== destStatus && t.id !== task.id);
      finalProjectTasks = [...otherStatusTasks, ...sourceItems, ...destItems];

      // Activities & Notifications
      logActivity(draggableId, `${t('statusChangedTo')} ${destStatus}`);
      if (destStatus === 'Done') {
        onSuccess(t('taskCompleted'));
      }
    }

    setTasks(finalProjectTasks);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className={cn("min-h-screen", isBoardOpen ? "h-screen overflow-hidden" : "overflow-y-auto transition-colors")}>
      {!isBoardOpen ? (
        <div className="p-8 space-y-8 relative max-w-7xl mx-auto">
          <header className="sticky top-0 z-20 py-4 -mt-4 mb-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">{t('boards')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">{t('select')}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const completedCount = projectTasks.filter(t => t.status === 'Done').length;
              const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

              return (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -8 }}
                  onClick={() => {
                    setCurrentProjectId(project.id);
                    setIsBoardOpen(true);
                  }}
                  className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 dark:hover:border-blue-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "p-3.5 rounded-2xl shadow-sm",
                      project.type === 'Maintenance' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400"
                    )}>
                      {project.type === 'Maintenance' ? <Zap size={24} /> : <Trello size={24} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {project.createdAt}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 font-medium leading-relaxed">{project.description}</p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-wider">
                      <span className="text-blue-600 dark:text-blue-400">{progress}% Complete</span>
                      <span className="text-slate-400 dark:text-slate-500">{completedCount} / {projectTasks.length} Tasks</span>
                    </div>
                    <div className="h-2 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-500 rounded-full shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      {mockUsers.slice(0, 3).map(user => (
                        <img key={user.id} src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 font-bold text-xs uppercase tracking-tight">
                      {t('openBoard')} <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <button 
              onClick={() => setShowCreateModal(true)}
              className="h-full min-h-[320px] bg-white/50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center group-hover:shadow-lg transition-all border border-slate-100 dark:border-slate-600">
                <Plus size={32} />
              </div>
              <span className="font-bold text-sm tracking-wide">{t('createProject')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-5rem)] flex flex-col pt-4 overflow-hidden relative">
          <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => setIsBoardOpen(false)}
                  className="mt-1 p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all shrink-0"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === 'project-switcher' ? null : 'project-switcher')}
                        className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white transition-colors hover:text-blue-600 group"
                      >
                        {currentProject?.name || 'Project Board'}
                        <ChevronRight size={20} className={cn("text-slate-300 transition-all group-hover:text-blue-500", activeMenu === 'project-switcher' ? "rotate-90" : "rotate-0")} />
                      </button>
                      <AnimatePresence>
                        {activeMenu === 'project-switcher' && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute left-0 mt-4 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 py-3 z-20 overflow-hidden"
                            >
                              <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('boards')}</span>
                                <button 
                                  onClick={() => {
                                    setShowCreateModal(true);
                                    setActiveMenu(null);
                                  }}
                                  className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {projects.map(p => (
                                  <button 
                                    key={p.id}
                                    onClick={() => {
                                      setCurrentProjectId(p.id);
                                      setActiveMenu(null);
                                    }}
                                    className={cn(
                                      "w-full px-5 py-3 text-left text-sm font-bold transition-all flex items-center justify-between group",
                                      p.id === currentProjectId ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 shadow-inner" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={cn("w-2 h-2 rounded-full", p.mode === 'Operational' ? "bg-rose-500" : "bg-blue-500")} />
                                      {p.name}
                                    </div>
                                    {p.id === currentProjectId && <CheckCircle2 size={14} className="text-blue-500" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-[9px] font-black text-blue-600 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-500/20 uppercase tracking-widest">
                        {t('aiEnhanced')}
                      </div>
                      <div className={cn(
                        "px-2 py-0.5 text-[9px] font-black rounded-md border uppercase tracking-widest",
                        isOperational 
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
                          : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                      )}>
                        {isOperational ? 'Operational' : 'Project'}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-medium max-w-md line-clamp-1 italic">
                    {currentProject?.description || 'Manage and track your team\'s progress.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center shadow-inner">
                  <button 
                    onClick={() => setFilterMode('my')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      filterMode === 'my' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <UserIcon size={14} />
                    {t('myTasks')}
                  </button>
                  <button 
                    onClick={() => setFilterMode('all')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      filterMode === 'all' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Layout size={14} />
                    {t('allTasks')}
                  </button>
                </div>

                <div className="flex -space-x-2 mr-2">
                  {mockUsers.map(user => (
                    <div key={user.id} className="w-9 h-9 rounded-xl border-2 border-white dark:border-slate-900 overflow-hidden shadow-sm group hover:translate-y-[-4px] transition-all cursor-pointer relative" title={user.name}>
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-all" />
                    </div>
                  ))}
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden lg:block" />

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleAddTask()}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2.5 shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={16} strokeWidth={3} />
                    {t('addTask')}
                  </button>

                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === 'more-actions' ? null : 'more-actions')}
                      className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    <AnimatePresence>
                      {activeMenu === 'more-actions' && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2.5 z-20 overflow-hidden"
                          >
                            {!isOperational && (
                              <button 
                                onClick={() => {
                                  const newColName = prompt(t('newColumnName'));
                                  if (newColName && currentProject) {
                                    const newCol = {
                                      id: `col-${Date.now()}`,
                                      title: newColName,
                                      status: newColName,
                                      order: boardColumns.length
                                    };
                                    const updatedProject = {
                                      ...currentProject,
                                      columns: [...(currentProject.columns || boardColumns), newCol]
                                    };
                                    onAddProject(updatedProject, tasks);
                                    onSuccess(t('columnAdded'));
                                  }
                                  setActiveMenu(null);
                                }}
                                className="w-full px-5 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 flex items-center gap-3 transition-all"
                              >
                                <Plus size={18} className="text-blue-500" />
                                {t('addColumn')}
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                boardColumns.forEach(col => handleAISort(col.status));
                                setActiveMenu(null);
                              }}
                              disabled={!!isSorting}
                              className="w-full px-5 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 flex items-center gap-3 transition-all disabled:opacity-50"
                            >
                              <Sparkles size={18} className="text-blue-500" />
                              {t('aiSort')}
                            </button>
                            <button 
                              onClick={() => {
                                setShowTemplateModal(true);
                                setActiveMenu(null);
                              }}
                              className="w-full px-5 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 flex items-center gap-3 transition-all"
                            >
                              <FileText size={18} className="text-blue-500" />
                              {t('useTemplate')}
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 flex gap-6 overflow-x-auto pb-6 px-8 scrollbar-hide">
              {boardColumns.map((column, index) => (
                <div key={column.id} className="flex flex-shrink-0">
                  <div className="min-w-[320px] max-w-[350px] flex flex-col pt-4 pb-2 px-3 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm select-none">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 dark:text-white tracking-tight transition-colors">{(t('status') as any)[column.status] || column.title}</h3>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black border border-slate-200 dark:border-slate-700">
                        {tasks.filter(t => t.status === column.status).length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isOperational && (
                        <button 
                          onClick={() => {
                            if (confirm(t('deleteColumn'))) {
                              const updatedProject = {
                                ...currentProject!,
                                columns: boardColumns.filter(c => c.id !== column.id)
                              };
                              onAddProject(updatedProject, tasks);
                            }
                          }}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === column.id ? null : column.id)}
                          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        <AnimatePresence>
                          {activeMenu === column.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenu(null)} 
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2.5 z-20"
                              >
                                <button
                                  onClick={() => handleAISort(column.status)}
                                  disabled={isSorting === column.id}
                                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-all disabled:opacity-50 group"
                                >
                                  {isSorting === column.id ? (
                                    <Loader2 size={18} className="animate-spin text-blue-500" />
                                  ) : (
                                    <Sparkles size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                  )}
                                  <span className="font-bold">{t('aiSortPriority')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const newTitle = prompt(t('newColumnName'), column.title);
                                    if (newTitle && currentProject) {
                                      const updatedProject = {
                                        ...currentProject,
                                        columns: boardColumns.map(c => c.id === column.id ? { ...c, title: newTitle, status: newTitle } : c)
                                      };
                                      onAddProject(updatedProject, tasks);
                                      onSuccess(t('success'));
                                    }
                                    setActiveMenu(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-all font-bold"
                                >
                                  <Edit size={18} />
                                  {t('edit')}
                                </button>
                                <button
                                  onClick={() => handleAddTask(column.status)}
                                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-all font-bold"
                                >
                                  <Plus size={18} />
                                  {t('createNewTask')}
                                </button>
                                <button
                                  onClick={() => setShowTemplateModal(true)}
                                  className="w-full px-4 py-2.5 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-all font-bold"
                                >
                                  <FileText size={18} className="text-blue-500" />
                                  {t('useTemplate')}
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 rounded-[1.5rem] transition-all duration-300 min-h-[500px]",
                          snapshot.isDraggingOver ? "bg-slate-50/50 dark:bg-slate-900/50" : ""
                        )}
                      >
                        {filteredTasks
                          .filter((t) => t.status === column.status)
                          .map((task: Task, index: number) => (
                            <DraggableAny key={task.id} draggableId={task.id} index={index}>
                              {(provided: any, snapshot: any) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedTask(task)}
                                  className={cn(
                                    "bg-white dark:bg-slate-800 p-0 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden mb-4 flex flex-col",
                                    snapshot.isDragging && "shadow-2xl ring-2 ring-blue-500/20 rotate-1 scale-[1.02]",
                                    recommendedTask?.id === task.id && "ring-2 ring-blue-500/40"
                                  )}
                                >
                                  {/* Folder Tab Area */}
                                  <div className="flex items-start justify-between">
                                    <div className={cn(
                                      "px-3 py-1.5 border-b border-r border-slate-200 dark:border-slate-700 rounded-br-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit",
                                      task.priority === 'High' ? "text-rose-500" :
                                      task.priority === 'Medium' ? "text-amber-500" :
                                      "text-emerald-500"
                                    )}>
                                      <Flag size={10} className="fill-current" />
                                      {task.priority} PRIORITY
                                    </div>
                                    <div className="p-2 text-slate-300 hover:text-slate-400">
                                      <MoreHorizontal size={16} />
                                    </div>
                                  </div>

                                  {/* Content Area */}
                                  <div className="p-4 pt-3 flex flex-col gap-3">
                                    <h4 className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                                      {task.title}
                                    </h4>
                                    
                                    {task.description && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Checklist progress badge */}
                                    {task.checklist && task.checklist.length > 0 && (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                          <span className="flex items-center gap-1">
                                            <CheckCircle2 size={10} className="text-blue-500" />
                                            Checklist
                                          </span>
                                          <span>
                                            {task.checklist.filter(c => c.completed).length}/{task.checklist.length}
                                          </span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500 rounded-full" 
                                            style={{ width: `${(task.checklist.filter(c => c.completed).length / task.checklist.length) * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Member Avatars Stack & Deadline */}
                                    <div className="flex items-center justify-between mt-1 pt-1">
                                      {/* Stacked avatars */}
                                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                                        {/* Assignee */}
                                        <img 
                                          src={mockUsers.find(u => u.id === task.assignee)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=unassigned`} 
                                          className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white dark:border-slate-800 shadow-sm"
                                          title={`Assignee: ${mockUsers.find(u => u.id === task.assignee)?.name || 'Belum ditugaskan'}`}
                                          alt="Assignee"
                                        />
                                        {/* Contributors */}
                                        {task.contributors?.map(cId => {
                                          const u = mockUsers.find(user => user.id === cId);
                                          if (!u) return null;
                                          return (
                                            <img 
                                              key={u.id}
                                              src={u.avatar} 
                                              className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white dark:border-slate-800 shadow-sm"
                                              title={`Contributor: ${u.name}`}
                                              alt={u.name}
                                            />
                                          );
                                        })}
                                      </div>

                                      {/* Deadline Badge */}
                                      {task.deadline && (
                                        <div className={cn(
                                          "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm",
                                          new Date(task.deadline) < new Date() 
                                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-950/20" 
                                            : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                                        )}>
                                          <Calendar size={10} />
                                          {task.deadline}
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer tags / files count */}
                                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/50 mt-1">
                                      <div className="flex items-center gap-1 text-slate-400">
                                        <Paperclip size={11} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">{task.attachments?.length || 0} Files</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-slate-400">
                                        <Tag size={11} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[90px]">{task.type}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              </DraggableAny>
                            ))}
                          {provided.placeholder}
                          <button 
                            onClick={() => handleAddTask(column.status)}
                            className="w-full mt-4 py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-300 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                          >
                            <Plus size={16} className="group-hover:scale-125 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('addTask')}</span>
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>


                </div>
              ))}
              {!isOperational && (
                <div className="flex-shrink-0 w-80 flex flex-col pt-2 pr-10">
                  <div className="flex items-center justify-between mb-5 px-3">
                    <h3 className="font-bold text-slate-400 dark:text-slate-600 tracking-tight uppercase text-[10px] tracking-[0.2em]">{t('newColumn')}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      const newColName = prompt(t('newColumnName'));
                      if (newColName && currentProject) {
                        const newCol = {
                          id: `col-${Date.now()}`,
                          title: newColName,
                          status: newColName,
                          order: boardColumns.length
                        };
                        const updatedProject = {
                          ...currentProject,
                          columns: [...(currentProject.columns || boardColumns), newCol]
                        };
                        onAddProject(updatedProject, tasks);
                        onSuccess(t('columnAdded'));
                      }
                    }}
                    className="w-full h-[500px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-all border border-slate-100 dark:border-slate-700">
                      <Plus size={24} />
                    </div>
                    <span className="font-bold text-[10px] uppercase tracking-widest">{t('addColumn')}</span>
                  </button>
                </div>
              )}
            </div>
          </DragDropContext>

          {/* Template selection modal */}
          <AnimatePresence>
            {showTemplateModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
                >
                  <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('selectTemplate')}</h2>
                      <p className="text-slate-400 text-xs mt-1 font-medium italic">Pilih template untuk kebutuhan maintenance infrastruktur dan layanan API.</p>
                    </div>
                    <button 
                      onClick={() => setShowTemplateModal(false)}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {mockTemplates.map((template) => (
                        <div 
                          key={template.id}
                          onClick={() => createTaskFromTemplate(template)}
                          className="group p-8 rounded-[2rem] border-2 border-transparent bg-white dark:bg-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 cursor-pointer transition-all duration-500 flex flex-col gap-6"
                        >
                          <div className="flex justify-between items-start">
                            <div className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-2",
                              template.category === 'Infrastructure' ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" :
                              template.category === 'API Service' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" :
                              template.category === 'Security' ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" :
                              template.category === 'Maintenance' ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                              "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            )}>
                              {template.category}
                            </div>
                            <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors uppercase">
                              {template.estimatedHours}h Est.
                            </div>
                          </div>
                          
                          <div className="flex gap-4">
                             <div className={cn(
                               "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                               template.category === 'Infrastructure' ? "bg-blue-50 text-blue-500 border-blue-100" :
                               template.category === 'API Service' ? "bg-indigo-50 text-indigo-500 border-indigo-100" :
                               template.category === 'Security' ? "bg-rose-50 text-rose-500 border-rose-100" :
                               template.category === 'Maintenance' ? "bg-amber-50 text-amber-500 border-amber-100" :
                               "bg-blue-50 text-blue-500 border-blue-100"
                             )}>
                                {/* Fallback to circle/dots if specific icons not available or just use Zap for all maintenance */}
                                <Layers size={20} />
                             </div>
                             <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors leading-tight">{template.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">{template.description}</p>
                             </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                             {template.checklist.slice(0, 3).map((item, idx) => (
                               <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                 <CheckCircle2 size={10} className="text-blue-500" />
                                 <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                   {item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text}
                                 </span>
                               </div>
                             ))}
                          </div>
                          
                          <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center group-hover:border-blue-500/20 transition-colors">
                            <div className="flex items-center gap-2">
                              <Sparkles size={12} className="text-blue-500" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{template.automationRules.length} Rules</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden p-10 border border-slate-100 dark:border-slate-700 transition-colors"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('createProject')}</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('name')}</label>
                  <input 
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Contoh: Redesign Website"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('desc')}</label>
                  <textarea 
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Apa tujuan dari proyek ini?"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all h-32 resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('boardMode')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setNewProjectMode('Project')}
                      className={cn(
                        "py-4 rounded-2xl font-bold transition-all border flex flex-col items-center gap-1",
                        newProjectMode === 'Project' 
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                          : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-700"
                      )}
                    >
                      <Trello size={18} />
                      <span className="text-xs">{t('projectMode')}</span>
                    </button>
                    <button 
                      onClick={() => setNewProjectMode('Operational')}
                      className={cn(
                        "py-4 rounded-2xl font-bold transition-all border flex flex-col items-center gap-1",
                        newProjectMode === 'Operational' 
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                          : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-700"
                      )}
                    >
                      <Zap size={18} />
                      <span className="text-xs">{t('operationalMode')}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={() => {
                    if (!newProjectName) return;

                    const projectId = `p${Date.now()}`;
                    const newProject: Project = {
                      id: projectId,
                      name: newProjectName,
                      description: newProjectDesc,
                      createdAt: new Date().toISOString().split('T')[0],
                      type: newProjectMode === 'Operational' ? 'Maintenance' : 'Development',
                      mode: newProjectMode,
                      columns: [
                        { id: 'col-1', title: 'Backlog', status: 'Backlog', order: 0 },
                        { id: 'col-2', title: 'To Do', status: 'To Do', order: 1 },
                        { id: 'col-3', title: 'In Progress', status: 'In Progress', order: 2 },
                        { id: 'col-4', title: 'Review', status: 'Review', order: 3 },
                        { id: 'col-5', title: 'Done', status: 'Done', order: 4 },
                      ]
                    };

                    onAddProject(newProject, []);
                    setShowCreateModal(false);
                    setNewProjectName('');
                    setNewProjectDesc('');
                    setNewProjectMode('Project');
                  }}
                  className="py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30"
                >
                  {t('create')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-[3rem] shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700 transition-colors"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm flex-shrink-0",
                    selectedTask.type === 'Maintenance' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400"
                  )}>
                    {selectedTask.type === 'Maintenance' ? <Zap size={20} /> : <Trello size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={selectedTask.title}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, title: e.target.value };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      placeholder="Judul Tugas..."
                      className="text-lg font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl px-2 py-1 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isCriticalTask(selectedTask) && (
                    <button
                      onClick={() => {
                        setShowAIChat(true);
                        if (chatMessages.length <= 1) {
                          const introMsg = t('aiAssistant.intro') as string;
                          const insightMsg = (t('aiAssistant.criticalTaskInsight') as string).replace('{title}', selectedTask.title);
                          setChatMessages([
                            { role: 'ai', content: introMsg },
                            { role: 'ai', content: insightMsg }
                          ]);
                        }
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all shadow-sm"
                    >
                      <BrainCircuit size={14} />
                      Solusi AI
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedTask(null);
                      setIsEditing(false);
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-900 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content - Two Columns */}
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 custom-scrollbar">
                
                {/* Left Column: Core task details (Title, desc, checklist, comments, attachments) */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Deskripsi */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" /> {t('desc')}
                    </h4>
                    <textarea
                      value={selectedTask.description || ''}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, description: e.target.value };
                        setSelectedTask(updatedTask);
                        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                      }}
                      placeholder="Tambahkan deskripsi lengkap tugas ini di sini..."
                      className="w-full text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all min-h-[120px] resize-none font-medium"
                    />
                  </div>

                  {/* Checklist Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-blue-500" /> {t('checklist')}
                      </h4>
                      {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          {selectedTask.checklist.filter(c => c.completed).length} / {selectedTask.checklist.length} Selesai
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(selectedTask.checklist.filter(c => c.completed).length / selectedTask.checklist.length) * 100}%` }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    )}

                    {/* Checklist Items list */}
                    <div className="space-y-2">
                      {selectedTask.checklist?.map((item, idx) => (
                        <div key={item.id} className="relative group flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 transition-all">
                          <button
                            onClick={() => {
                              const next = [...(selectedTask.checklist || [])];
                              next[idx].completed = !next[idx].completed;
                              const updatedTask = { ...selectedTask, checklist: next };
                              setSelectedTask(updatedTask);
                              setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                            }}
                            className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                              item.completed ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            )}
                          >
                            {item.completed && <CheckCircle2 size={12} />}
                          </button>
                          
                          <input 
                            value={item.text}
                            onChange={(e) => {
                              const next = [...(selectedTask.checklist || [])];
                              next[idx].text = e.target.value;
                              const updatedTask = { ...selectedTask, checklist: next };
                              setSelectedTask(updatedTask);
                              setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                            }}
                            className={cn(
                              "bg-transparent border-none outline-none text-xs font-semibold w-full text-slate-800 dark:text-slate-200",
                              item.completed && "line-through opacity-50"
                            )}
                          />

                          <button 
                            onClick={() => {
                              const next = (selectedTask.checklist || []).filter((_, i) => i !== idx);
                              const updatedTask = { ...selectedTask, checklist: next };
                              setSelectedTask(updatedTask);
                              setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {/* Add Checklist Item input */}
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          placeholder="Tambah langkah atau sub-tugas baru..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddChecklistItem();
                          }}
                          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500/50"
                        />
                        <button
                          onClick={handleAddChecklistItem}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Paperclip size={14} className="text-blue-500" /> {t('attachments')}
                    </h4>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit">
                      <button 
                        onClick={() => setAttachmentType('file')}
                        className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", attachmentType === 'file' ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-400")}
                      >File</button>
                      <button 
                        onClick={() => setAttachmentType('link')}
                        className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", attachmentType === 'link' ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-400")}
                      >Link</button>
                    </div>

                    {attachmentType === 'link' && (
                      <div className="flex flex-col md:flex-row gap-3">
                        <input 
                          type="text" 
                          placeholder={t('linkName')}
                          value={attachmentName}
                          onChange={(e) => setAttachmentName(e.target.value)}
                          className="flex-[1] px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                        />
                        <input 
                          type="text" 
                          placeholder="https://..." 
                          value={attachmentUrl}
                          onChange={(e) => setAttachmentUrl(e.target.value)}
                          className="flex-[2] px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                        />
                        <button 
                          onClick={() => {
                            if (!attachmentName || !attachmentUrl) return;
                            const newAttachment = {
                              id: `a${Date.now()}`,
                              name: attachmentName,
                              url: attachmentUrl,
                              type: 'link' as const,
                              createdAt: new Date().toISOString()
                            };
                            const updatedTask = {
                              ...selectedTask,
                              attachments: [...(selectedTask.attachments || []), newAttachment]
                            };
                            setSelectedTask(updatedTask);
                            setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                            setAttachmentName('');
                            setAttachmentUrl('');
                          }}
                          className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-700"
                        >
                          {t('addLink')}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedTask.attachments?.map((attachment) => (
                        <div key={attachment.id} className="group relative aspect-square bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all">
                          {attachment.type === 'file' && attachment.url.startsWith('data:image') ? (
                            <img src={attachment.url} className="w-full h-full object-cover" alt={attachment.name} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                              {attachment.type === 'file' ? <FileText size={32} className="text-slate-300" /> : <Zap size={32} className="text-blue-500/30" />}
                              <p className="text-[8px] font-bold text-slate-500 mt-2 text-center break-all line-clamp-2 px-2">{attachment.name}</p>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => {
                                const next = (selectedTask.attachments || []).filter(a => a.id !== attachment.id);
                                const updatedTask = { ...selectedTask, attachments: next };
                                setSelectedTask(updatedTask);
                                setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                              }}
                              className="p-1 bg-white/90 hover:bg-rose-500 hover:text-white rounded-md shadow-sm transition-colors text-slate-500"
                            >
                              <X size={10} />
                            </button>
                          </div>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                          >
                            <ChevronRight size={24} className="text-white hover:scale-125 transition-transform" />
                          </a>
                        </div>
                      ))}
                      {attachmentType === 'file' && (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all group"
                        >
                          <Plus size={24} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t('addAttachment')}</span>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Discussion Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <MessageSquare size={14} className="text-blue-500" /> {t('comments')}
                    </h4>
                    <div className="space-y-4">
                      {selectedTask.comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <img src={comment.userAvatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" alt={comment.userName} />
                          <div className="flex-1 bg-white dark:bg-slate-900/50 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <h5 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize">{comment.userName}</h5>
                              <span className="text-[8px] font-bold text-slate-400">{comment.createdAt}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-3 items-start pt-4 border-t border-slate-100 dark:border-slate-700">
                        <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" alt="Me" />
                        <div className="flex-1 space-y-2">
                          <textarea 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={t('addComment')}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[80px] resize-none font-medium text-slate-800 dark:text-slate-200"
                          />
                          <button 
                            onClick={() => {
                              if (!commentText.trim()) return;
                              const newComment = {
                                id: `c${Date.now()}`,
                                userId: user.id || 'me',
                                userName: user.name || 'User',
                                userAvatar: user.avatar,
                                text: commentText,
                                createdAt: new Date().toISOString().split('T')[0]
                              };
                              const updatedTask = {
                                ...selectedTask,
                                comments: [...(selectedTask.comments || []), newComment]
                              };
                              setSelectedTask(updatedTask);
                              setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                              setCommentText('');
                              logActivity(selectedTask.id, `${t('addedComment')} "${commentText.substring(0, 20)}..."`);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-blue-500/10"
                          >
                            Kirim Komentar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Sidebar metadata controls (Status, Priority, Due Date, Assignee, Contributors) */}
                <div className="space-y-6">
                  
                  {/* Metadata Card container */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 space-y-6">
                    
                    {/* Status Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Status Papan</label>
                      <select
                        value={selectedTask.status}
                        onChange={(e) => {
                          const updatedTask = { ...selectedTask, status: e.target.value as TaskStatus };
                          setSelectedTask(updatedTask);
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold focus:border-blue-500 outline-none transition-all shadow-sm"
                      >
                        {boardColumns.map(col => <option key={col.id} value={col.status}>{(t('status') as any)[col.status] || col.title}</option>)}
                      </select>
                    </div>

                    {/* AI Priority Badge - replaces manual priority selection */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Sparkles size={10} className="text-blue-500" /> Prioritas
                      </label>
                      <div className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            selectedTask.priority === 'High' ? "bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" :
                            selectedTask.priority === 'Medium' ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" :
                            "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                          )} />
                          <span className={cn(
                            "text-xs font-black",
                            selectedTask.priority === 'High' ? "text-rose-600 dark:text-rose-400" :
                            selectedTask.priority === 'Medium' ? "text-amber-600 dark:text-amber-400" :
                            "text-blue-600 dark:text-blue-400"
                          )}>
                            {selectedTask.priority} Priority
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
                          <Sparkles size={9} /> AI Priority
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium ml-1 flex items-center gap-1">
                        <BrainCircuit size={9} className="text-blue-400" /> Auto Ranked by AI berdasarkan deadline &amp; urgency
                      </p>
                    </div>

                    {/* Tipe Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tipe Tugas</label>
                      <select
                        value={selectedTask.type}
                        onChange={(e) => {
                          const updatedTask = { ...selectedTask, type: e.target.value };
                          setSelectedTask(updatedTask);
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold focus:border-blue-500 outline-none transition-all shadow-sm"
                      >
                        <option value="Development">Development</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="API Service">API Service</option>
                        <option value="Security">Security</option>
                      </select>
                    </div>

                    {/* Due Date picker */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tenggat Waktu</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedTask.deadline || ''}
                          onChange={(e) => {
                            const updatedTask = { ...selectedTask, deadline: e.target.value || undefined };
                            setSelectedTask(updatedTask);
                            setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Assignee Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Penanggung Jawab</label>
                      <select
                        value={selectedTask.assignee || ''}
                        onChange={(e) => {
                          const updatedTask = { ...selectedTask, assignee: e.target.value || undefined };
                          setSelectedTask(updatedTask);
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold focus:border-blue-500 outline-none transition-all shadow-sm"
                      >
                        <option value="">Belum Ditugaskan</option>
                        {mockUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Contributors selection (visual card grid) */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 space-y-4">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <UserIcon size={12} className="text-blue-500" /> Kontributor Tim
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {mockUsers.map(u => {
                        const isContributor = selectedTask.contributors?.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              const current = selectedTask.contributors || [];
                              const next = isContributor ? current.filter(id => id !== u.id) : [...current, u.id];
                              const updatedTask = { ...selectedTask, contributors: next };
                              setSelectedTask(updatedTask);
                              setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                              
                              if (!isContributor) {
                                onAddNotification(
                                  `${t('addedToTaskNotification')} ${selectedTask.title}`,
                                  'Task',
                                  !!u.whatsapp
                                );
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-xl border transition-all text-left group",
                              isContributor 
                                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm" 
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-200"
                            )}
                          >
                            <img src={u.avatar} className="w-6 h-6 rounded-full border border-white/20" alt={u.name} />
                            <span className="text-[10px] font-bold truncate">{u.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Blocked toggler */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-rose-50/30 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="text-rose-500" size={18} />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{t('isBlocked')}</p>
                          <p className="text-[8px] text-slate-500 font-medium">{t('clickToToggleStatus')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const updatedTask = { ...selectedTask, isBlocked: !selectedTask.isBlocked };
                          setSelectedTask(updatedTask);
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full transition-all relative",
                          selectedTask.isBlocked ? "bg-rose-500" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                          selectedTask.isBlocked ? "right-0.5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                    {selectedTask.isBlocked && (
                      <textarea 
                        value={selectedTask.blockReason || ''}
                        onChange={(e) => {
                          const updatedTask = { ...selectedTask, blockReason: e.target.value };
                          setSelectedTask(updatedTask);
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }}
                        placeholder={t('blockedReason')}
                        className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-800 dark:text-slate-200"
                      />
                    )}
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50/20 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors">
                <button 
                  onClick={() => {
                    setSelectedTask(null);
                    setIsEditing(false);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Selesai
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCompletionModal && selectedTask && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-700 transition-colors"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('completeTask')}</h3>
                <button onClick={() => setShowCompletionModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('completionNotes')}</label>
                  <textarea 
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    rows={4} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-medium resize-none shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Apa saja yang telah diselesaikan?" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('uploadProof')}</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProofFile(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-10 border-2 border-dashed border-blue-100 dark:border-slate-700 rounded-3xl flex flex-col items-center gap-3 hover:border-blue-500 transition-all cursor-pointer bg-blue-50/10 group"
                  >
                    {proofFile ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                        <img src={proofFile} className="w-full h-full object-cover" alt="Proof" />
                      </div>
                    ) : (
                      <>
                        <Camera size={38} className="text-blue-500 stroke-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded mr-1">Klik</span> atau seret untuk unggah
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setShowCompletionModal(false);
                      setProofFile(null);
                    }} 
                    className="py-4 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      const hasRequirePhoto = selectedTask.automationRules?.some(r => r.action === 'require_photo');
                      const hasRequireNotes = selectedTask.automationRules?.some(r => r.action === 'require_notes');

                      if (hasRequirePhoto && !proofFile) {
                        alert(t('photoRequiredAlert'));
                        return;
                      }
                      if (hasRequireNotes && !completionNotes.trim()) {
                        alert(t('notesRequiredAlert'));
                        return;
                      }

                      updateTaskStatus(selectedTask.id, 'Done');
                      setShowCompletionModal(false);
                      setCompletionNotes('');
                      setProofFile(null);
                      setSelectedTask(null);
                    }}
                    className="py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all text-sm uppercase tracking-widest"
                  >
                    Selesaikan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Maintenance Assistant Toggle Button */}
      {(hasCriticalWarnings) && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowAIChat(!showAIChat);
              if (chatMessages.length === 0) {
                setChatMessages([{ role: 'ai', content: (t('aiAssistant.intro') as any) }]);
              }
            }}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white dark:border-slate-800 hover:bg-blue-700 transition-all group"
          >
            {showAIChat ? <X size={28} /> : <BrainCircuit size={28} className="animate-pulse" />}
            {!showAIChat && (
               <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
              </span>
            )}
          </motion.button>

          {/* Chat Window */}
          <AnimatePresence>
            {showAIChat && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute bottom-20 right-0 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-10rem)] bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden transition-colors"
              >
                {/* Header */}
                <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{(t('aiAssistant.title') as any)}</h3>
                      <p className="text-[10px] text-blue-100 uppercase tracking-widest font-black">Online Expert</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAIChat(false)} className="text-white/60 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed",
                        msg.role === 'user' 
                          ? "ml-auto bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-300 rounded-tr-none" 
                          : "mr-auto bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-700"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="mr-auto bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                    </div>
                  )}
                </div>

                {/* Suggested Questions */}
                {chatMessages.length < 3 && (
                  <div className="px-6 py-2 flex flex-wrap gap-2">
                    {(Array.isArray(t('aiAssistant.suggestedQuestions', { returnObjects: true })) 
                      ? t('aiAssistant.suggestedQuestions', { returnObjects: true }) as string[] 
                      : [
                          "Bagaimana cara troubleshoot server down?",
                          "Tentukan prioritas checklist ini",
                          "Ringkas langkah maintenance efisien"
                        ]
                    ).map((q: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          setChatInput(q);
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <form onSubmit={handleAIChat} className="p-6 border-t border-slate-100 dark:border-slate-700">
                  <div className="relative">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={(t('aiAssistant.placeholder') as any)}
                      className="w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isTyping}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                    >
                      {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
