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
  Camera,
  Save,
  Edit,
  Settings,
  Trash2,
  Flag,
  Tag,
  BookOpen,
  FilePlus,
  FolderKanban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskStatus, Priority, Project, TaskTemplate, ChecklistItem, KanbanMode, Documentation } from '../types';
import { mockUsers, mockTemplates } from '../services/apiService';
import { analyzePriority, sortTasksByPriority, getMaintenanceConsultation } from '../services/aiService';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { DocumentationDrawer } from './DocumentationDrawer';

const COLUMNS: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
const DraggableAny = Draggable as any;

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  projects: Project[];
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
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
  setProjects,
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
  const [isNewTask, setIsNewTask] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSorting, setIsSorting] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectMode, setNewProjectMode] = useState<KanbanMode>('Project');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [commentText, setCommentText] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<'file' | 'link'>('link');
  const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');
  
  // Custom Modal States
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [documentations, setDocumentations] = useState<Documentation[]>([]);
  const [docDrawerTask, setDocDrawerTask] = useState<Task | null>(null);
  const [docDrawerMode, setDocDrawerMode] = useState<'view' | 'add'>('view');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);
  const draggedRecentlyRef = useRef(false);
  const currentProject = projects.find(p => p.id === currentProjectId);
  const isOperational = currentProject?.mode === 'Operational';

  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const projectOwner = dbUsers.find(u => u.id === (currentProject as any)?.id_pengguna) || user;
  const projectMembers = currentProject?.anggota?.map(a => dbUsers.find(u => u.id === a.id_pengguna)).filter(Boolean) || [];
  const allProjectUsers = [projectOwner, ...projectMembers].filter((v, i, a) => v && a.findIndex(t => (t?.id === v?.id)) === i);

  React.useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setDbUsers(data))
      .catch(console.error);

    fetch('/api/dokumentasi')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mappedDocs: Documentation[] = data.map((d: any) => ({
            id: d.id_dokumentasi,
            taskId: d.id_tugas,
            completionNotes: d.catatan_selesai,
            obstacles: d.kendala || '',
            solutions: d.solusi || '',
            attachments: [],
            authorId: d.id_pengguna,
            authorName: d.pengguna?.nama || 'Unknown',
            authorAvatar: d.pengguna?.foto_profil,
            createdAt: d.dibuat_pada,
          }));
          setDocumentations(mappedDocs);
        }
      })
      .catch(console.error);
  }, []);

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

  const handleAddTask = (status?: string) => {
    const defaultStatus = typeof status === 'string' ? status : (boardColumns[0]?.status || 'To Do');
    if (isOperational) {
      setShowTemplateModal(true);
      return;
    }
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'Medium',
      type: 'Development',
      createdAt: new Date().toISOString().split('T')[0],
      projectId: currentProjectId,
      contributors: [],
      comments: []
    };
    setSelectedTask(newTask);
    setIsNewTask(true);  // Mark as new task - NOT yet in tasks array
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
      const updatedTask = { ...selectedTask, priority: suggestedPriority };
      setSelectedTask(updatedTask);
      setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
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
    if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
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

    const updatedTask = { ...task, status: newStatus };
    const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
    setTasks(updatedTasks);
    logActivity(taskId, `${t('statusChangedTo')} ${newStatus}`);
    
    if (newStatus === 'Done') {
      setDocDrawerTask(updatedTask);
      setDocDrawerMode('add');
      onSuccess(t('taskCompleted'));
    }
  };

  const handleSaveTask = () => {
    if (!selectedTask) return;
    if (!selectedTask.title.trim()) return;

    const originalTask = tasks.find(t => t.id === selectedTask.id);
    const wasAlreadyDone = originalTask ? originalTask.status === 'Done' : false;
    const isNowDone = selectedTask.status === 'Done';
    const statusChangedToDone = isNowDone && !wasAlreadyDone;

    // Use isNewTask flag (not tasks.some) because inline editing may have
    // already inserted the task into the array with a temporary ID,
    // which would cause PUT to be called with a non-existent DB ID.
    if (isNewTask) {
      // Remove any partial/inline-inserted version first, then add the final version
      const withoutTemp = tasks.filter(t => t.id !== selectedTask.id);
      setTasks([...withoutTemp, selectedTask]);

      onSuccess(t('taskCreated'));
    } else {
      setTasks(tasks.map(t => t.id === selectedTask.id ? selectedTask : t));
      onSuccess(t('taskUpdated'));
    }

    const taskToDoc = { ...selectedTask };

    setSelectedTask(null);
    setIsEditing(false);
    setIsNewTask(false);
    setAttachmentName('');
    setAttachmentUrl('');

    if (statusChangedToDone) {
      setDocDrawerTask(taskToDoc);
      setDocDrawerMode('add');
    }
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

  const onDragStart = () => {
    draggedRecentlyRef.current = true;
  };

  const onDragEnd = (result: DropResult) => {
    draggedRecentlyRef.current = true;
    setTimeout(() => {
      draggedRecentlyRef.current = false;
    }, 1000);
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
        setDocDrawerTask(updatedTask);
        setDocDrawerMode('add');
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
    <div className={cn("min-h-screen", isBoardOpen ? "h-screen overflow-hidden" : "space-y-8 animate-in fade-in duration-700 overflow-y-auto transition-colors pb-20")}>
      {!isBoardOpen ? (
        <>
          <header className={cn(
            "flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-30 px-8 py-6 backdrop-blur-xl border-b transition-all gap-4",
            darkMode 
              ? "bg-[#0D1B35]/90 border-[#1E3A5F]/40" 
              : "bg-[#F4F8FC]/90 border-[#BFDFFF]/30"
          )}>
            <div>
              <h1 className={cn("text-3xl font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>{t('boards')}</h1>
              <p className={cn("mt-1 font-medium text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>{t('select')}</p>
            </div>
          </header>

          <div className="px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const completedCount = projectTasks.filter(t => t.status === 'Done').length;
              const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

              return (
                <motion.div
                  key={project.id}
                  id={`project-card-${project.name.toLowerCase().replace(/\s+/g, '-')}`}
                  whileHover={{ y: -8 }}
                  onClick={() => {
                    setCurrentProjectId(project.id);
                    setIsBoardOpen(true);
                  }}
                  className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 dark:hover:border-blue-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "p-3.5 rounded-2xl shadow-sm",
                      project.type === 'Maintenance' ? "bg-sky-50 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400"
                    )}>
                      {project.type === 'Maintenance' ? <Zap size={24} /> : <Trello size={24} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {project.createdAt}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {t(project.name)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 font-medium leading-relaxed">{t(project.description)}</p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-wider">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {progress}% {t('taskPercentComplete')}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">{completedCount} / {projectTasks.length} {t('tasksLabel')}</span>
                    </div>
                    <div className="h-2 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-500 rounded-full shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center relative">
                    <div className="flex -space-x-2">
                      {mockUsers.slice(0, 3).map(user => (
                        <img key={user.id} src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 font-bold text-xs uppercase tracking-tight">
                      {t('openBoard')} <ChevronRight size={14} />
                    </div>
                    
                    <div className="absolute -top-12 right-0 flex gap-2 transition-all opacity-80 hover:opacity-100">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                           setNewProjectName(project.name);
                           setNewProjectDesc(project.description);
                           setNewProjectMode(project.mode);
                           setEditingProjectId(project.id); // Set the editing ID correctly!
                           setShowCreateModal(true); 
                        }}
                        className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all"
                        id="btn_edit_proyek"
                      >
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setProjectToDelete(project);
                        }}
                        className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all"
                        id="btn-hapus-proyek"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <button 
              onClick={() => {
                setEditingProjectId(null);
                setNewProjectName('');
                setNewProjectDesc('');
                setNewProjectMode('Project');
                setShowCreateModal(true);
              }}
              className="h-full min-h-[320px] bg-white/50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
              id="btn_create_project"
            >
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center group-hover:shadow-lg transition-all border border-slate-100 dark:border-slate-600">
                <Plus size={32} />
              </div>
              <span className="font-bold text-sm tracking-wide">{t('createProject')}</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 5rem)' }}>
          <header className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                 <button 
                   onClick={() => setIsBoardOpen(false)}
                   className="mt-1 p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all shrink-0"
                   id="btn_back_to_project_list"
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
                                      <div className={cn("w-2 h-2 rounded-full", p.mode === 'Operational' ? "bg-[#3FA9F5]" : "bg-[#2D7FEA]")} />
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
                          ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-500/20"
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

              <div className="flex items-center gap-3 xl:gap-4 shrink-0">
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
                  {allProjectUsers.map((u: any) => (
                    <div key={u.id} className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden shadow-sm group hover:translate-y-[-4px] transition-all cursor-pointer relative" title={u.name}>
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover transition-all" />
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-all" />
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowAddMemberModal(true)}
                    className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer z-10"
                    title={t('addMember') || "Add Member"}
                  >
                    <Plus size={16} />
                  </button>
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
                                  setShowAddColumnModal(true);
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
                            {currentProject && (
                              <>
                                <button 
                                  onClick={() => {
                                    setNewProjectName(currentProject.name);
                                    setNewProjectDesc(currentProject.description);
                                    setNewProjectMode(currentProject.mode);
                                    setEditingProjectId(currentProject.id);
                                    setShowCreateModal(true);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full px-5 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 flex items-center gap-3 transition-all"
                                  id="btn_edit_proyek_board"
                                >
                                  <Settings size={18} className="text-blue-500" />
                                  {t('editProject')}
                                </button>
                                <button 
                                  onClick={() => {
                                    setProjectToDelete(currentProject);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full px-5 py-3 text-left text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-3 transition-all"
                                  id="btn_delete_proyek_board"
                                >
                                  <Trash2 size={18} className="text-rose-500" />
                                  {t('deleteProject')}
                                </button>
                              </>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {!currentProject ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-24 h-24 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-slate-900 shadow-sm">
                <FolderKanban className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t('emptyBoard')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                {t('emptyBoardDesc')}
              </p>
            </div>
          ) : (
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <div className="flex-1 flex gap-4 md:gap-5 overflow-x-auto pb-8 px-4 md:px-6 pt-6 scrollbar-hide items-start" style={{ background: 'transparent' }}>
                {boardColumns.map((column, index) => (
                  <div key={column.id} className="flex flex-shrink-0">
                    <div className={cn(
                      "w-[280px] md:w-[300px] flex-shrink-0 flex flex-col pt-4 pb-4 px-3 rounded-2xl select-none",
                      darkMode 
                        ? "bg-[#0D1E3A]" 
                        : "bg-[#EBF5FF]"
                    )}>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          column.status === 'To Do' ? 'bg-amber-400' :
                          column.status === 'In Progress' ? 'bg-[#3FA9F5]' :
                          column.status === 'Review' ? 'bg-violet-500' :
                          column.status === 'Done' ? 'bg-rose-500' :
                          'bg-slate-400'
                        )} />
                        <h3 className={cn("font-bold text-sm tracking-tight", darkMode ? "text-white" : "text-slate-800")}>
                          {(t('status') as any)[column.status] || column.title}
                        </h3>
                        <span className={cn(
                          "min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-black",
                          column.status === 'To Do' ? 'bg-amber-400 text-white' :
                          column.status === 'In Progress' ? 'bg-[#3FA9F5] text-white' :
                          column.status === 'Review' ? 'bg-violet-500 text-white' :
                          column.status === 'Done' ? 'bg-rose-500 text-white' :
                          darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-300 text-slate-600'
                        )}>
                          {filteredTasks.filter(t => t.status === column.status).length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isOperational && (
                          <button 
                            onClick={() => {
                              setColumnToDelete(column.id);
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
                            "rounded-xl transition-all duration-300 px-1 py-1 min-h-[100px]",
                            snapshot.isDraggingOver 
                              ? darkMode ? "bg-[#3FA9F5]/8" : "bg-[#3FA9F5]/8" 
                              : ""
                          )}
                        >
                          {filteredTasks
                            .filter((t) => t.status === column.status)
                            .map((task: Task, index: number) => {
                              const assigneeUser = mockUsers.find(u => u.id === task.assignee);
                              const contributors = (task.contributors || []).map(cId => mockUsers.find(u => u.id === cId)).filter(Boolean);
                              const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                              const checkDone = task.checklist?.filter(c => c.completed).length || 0;
                              const checkTotal = task.checklist?.length || 0;

                              // Status badge config
                              const statusBadge = (() => {
                                if (task.status === 'Done') return { label: t('statusComplete'), color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' };
                                if (task.status === 'In Progress') return { label: t('statusOnTrack'), color: 'text-[#3FA9F5] bg-blue-50 border-blue-200', dot: 'bg-[#3FA9F5]' };
                                if (task.status === 'Review') return { label: t('statusInReview'), color: 'text-violet-600 bg-violet-50 border-violet-200', dot: 'bg-violet-500' };
                                return { label: t('statusNotStarted'), color: 'text-slate-500 bg-slate-100 border-slate-200', dot: 'bg-slate-400' };
                              })();

                              const priorityBadge = task.priority === 'High'
                                ? 'text-rose-500 bg-rose-50 border-rose-200'
                                : task.priority === 'Medium'
                                  ? 'text-amber-500 bg-amber-50 border-amber-100'
                                  : 'text-blue-500 bg-blue-50 border-blue-100';

                              return (
                                <DraggableAny key={task.id} draggableId={task.id} index={index}>
                                  {(provided: any, snapshot: any) => (
                                    <div
                                      id={`task-card-${task.id}`}
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => {
                                        if (!draggedRecentlyRef.current) {
                                          setSelectedTask(task);
                                        }
                                      }}
                                      className={cn(
                                        "rounded-xl border cursor-pointer mb-3 transition-all duration-200 overflow-hidden",
                                        darkMode
                                          ? "bg-[#1C2B45] border-[#1E3A5F]/60 hover:border-[#3FA9F5]/50 hover:shadow-lg hover:shadow-[#3FA9F5]/10"
                                          : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/60",
                                        snapshot.isDragging && "shadow-2xl scale-[1.02] rotate-1 opacity-95",
                                        recommendedTask?.id === task.id && (darkMode ? "ring-1 ring-[#3FA9F5]/50" : "ring-1 ring-[#3FA9F5]/30")
                                      )}
                                    >
                                      <div className="p-4 space-y-3">
                                        {/* Row 1: Status badge + more menu */}
                                        <div className="flex items-center justify-between">
                                          <span id={`task-status-badge-${task.id}`} className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                                            darkMode
                                              ? task.status === 'Done' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                                                task.status === 'In Progress' ? 'text-[#3FA9F5] bg-[#3FA9F5]/10 border-[#3FA9F5]/30' :
                                                task.status === 'Review' ? 'text-violet-400 bg-violet-500/10 border-violet-500/30' :
                                                'text-slate-400 bg-slate-700/50 border-slate-600/30'
                                              : statusBadge.color
                                          )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", darkMode ? statusBadge.dot : statusBadge.dot)} />
                                            {statusBadge.label}
                                          </span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === task.id ? null : task.id); }}
                                            className={cn("p-1 rounded-lg transition-colors", darkMode ? "text-slate-500 hover:text-slate-300 hover:bg-white/5" : "text-slate-300 hover:text-slate-500 hover:bg-slate-100")}
                                          >
                                            <MoreHorizontal size={15} />
                                          </button>
                                        </div>

                                        {/* Row 2: Title */}
                                        <h4 id={`task-title-${task.id}`} className={cn("font-bold text-[14px] leading-snug line-clamp-2", darkMode ? "text-white" : "text-slate-800")}>
                                          {t(task.title)}
                                        </h4>

                                        {/* Row 3: Description */}
                                        {task.description && (
                                          <p className={cn("text-[11px] line-clamp-2 leading-relaxed", darkMode ? "text-slate-400" : "text-slate-500")}>
                                            {t(task.description)}
                                          </p>
                                        )}

                                        {/* Row 4: Assignees label + avatars */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className={cn("text-[11px] font-medium", darkMode ? "text-slate-500" : "text-slate-400")}>{t('assignees')} :</span>
                                            <div className="flex -space-x-1.5">
                                              {assigneeUser && (
                                                <img
                                                  src={assigneeUser.avatar}
                                                  title={assigneeUser.name}
                                                  alt={assigneeUser.name}
                                                  className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1C2B45] shadow-sm object-cover"
                                                />
                                              )}
                                              {contributors.slice(0, 2).map((u: any) => (
                                                <img
                                                  key={u.id}
                                                  src={u.avatar}
                                                  title={u.name}
                                                  alt={u.name}
                                                  className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1C2B45] shadow-sm object-cover"
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Row 5: Date + Priority */}
                                        <div className="flex items-center justify-between">
                                          <div className={cn("flex items-center gap-1.5 text-[11px] font-medium", darkMode ? "text-slate-400" : "text-slate-500")}>
                                            <Flag size={11} className={isOverdue ? "text-rose-400" : darkMode ? "text-slate-500" : "text-slate-400"} />
                                            <span className={isOverdue ? "text-rose-400 font-bold" : ""}>
                                              {task.deadline || '—'}
                                            </span>
                                          </div>
                                          <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                            darkMode
                                              ? task.priority === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                                                task.priority === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                                                'text-blue-400 bg-blue-500/10 border-blue-500/30'
                                              : priorityBadge
                                          )}>
                                            {task.priority}
                                          </span>
                                        </div>

                                        {/* Row 6: Footer counts */}
                                        <div className={cn("flex items-center gap-4 pt-2 border-t text-[11px]", darkMode ? "border-[#1E3A5F]/50" : "border-slate-100")}>
                                          <div className={cn("flex items-center gap-1", darkMode ? "text-slate-500" : "text-slate-400")}>
                                            <MessageSquare size={11} />
                                            <span>{task.comments?.length || 0} {t('comments')}</span>
                                          </div>
                                          <div className={cn("flex items-center gap-1", darkMode ? "text-slate-500" : "text-slate-400")}>
                                            <Paperclip size={11} />
                                            <span>{task.attachments?.filter(a => a.type === 'link').length || 0} {t('links')}</span>
                                          </div>
                                          {checkTotal > 0 && (
                                            <div className={cn("flex items-center gap-1", darkMode ? "text-slate-500" : "text-slate-400")}>
                                              <CheckCircle2 size={11} />
                                              <span>{checkDone}/{checkTotal}</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Row 7: Documentation buttons */}
                                        <div className={cn(
                                          "flex items-center gap-2 pt-2 border-t",
                                          darkMode ? "border-[#1E3A5F]/50" : "border-slate-100"
                                        )}>
                                          <button
                                            id={`btn-lihat-dok-${task.id}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDocDrawerTask(task);
                                              setDocDrawerMode('view');
                                            }}
                                            className={cn(
                                              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border transition-all hover:scale-[1.02]",
                                              darkMode
                                                ? "border-[#1E3A5F]/60 text-slate-400 hover:text-[#3FA9F5] hover:border-[#3FA9F5]/40 hover:bg-[#3FA9F5]/5"
                                                : "border-slate-200 text-slate-500 hover:text-[#2D7FEA] hover:border-[#3FA9F5]/40 hover:bg-[#EBF5FF]"
                                            )}
                                          >
                                            <BookOpen size={11} />
                                            {t('docView')}
                                            {documentations.filter(d => d.taskId === task.id).length > 0 && (
                                              <span className="ml-0.5 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{ background: '#3FA9F5' }}>
                                                {documentations.filter(d => d.taskId === task.id).length}
                                              </span>
                                            )}
                                          </button>
                                          <button
                                            id={`btn-tambah-dok-${task.id}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDocDrawerTask(task);
                                              setDocDrawerMode('add');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold text-white transition-all hover:scale-[1.02] shadow-sm btn-tambah-dok"
                                            style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)', boxShadow: '0 2px 10px rgba(63,169,245,0.25)' }}
                                          >
                                            <FilePlus size={11} />
                                            {t('docAdd')}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DraggableAny>
                              );
                            })}
                            {provided.placeholder}
                            <button 
                              onClick={() => handleAddTask(column.status)}
                              className={cn(
                                "w-full mt-2 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group border-2 border-dashed",
                                darkMode
                                  ? "border-[#1E3A5F] text-slate-600 hover:text-[#3FA9F5] hover:border-[#3FA9F5]/50 hover:bg-[#3FA9F5]/5"
                                  : "border-slate-200 text-slate-400 hover:text-[#2D7FEA] hover:border-[#3FA9F5]/40 hover:bg-[#3FA9F5]/5"
                              )}
                            >
                              <Plus size={15} className="group-hover:scale-110 transition-transform" />
                              <span className="text-[11px] font-bold">{t('addTask')}</span>
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
                      className="w-full h-[500px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
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
          )}

          {/* Template selection modal */}
          <AnimatePresence>
            {showTemplateModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
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
                          className="group p-8 rounded-2xl border-2 border-transparent bg-white dark:bg-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 cursor-pointer transition-all duration-500 flex flex-col gap-6"
                        >
                          <div className="flex justify-between items-start">
                            <div className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-2",
                              template.category === 'Infrastructure' ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" :
                              template.category === 'API Service' ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" :
                              template.category === 'Security' ? "bg-[#EBF5FF] text-[#2D7FEA] dark:bg-[#3FA9F5]/10 dark:text-[#3FA9F5]" :
                              template.category === 'Maintenance' ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" :
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
                               template.category === 'API Service' ? "bg-sky-50 text-sky-500 border-sky-100" :
                               template.category === 'Security' ? "bg-[#EBF5FF] text-[#2D7FEA] border-[#BFDFFF]/50" :
                               template.category === 'Maintenance' ? "bg-blue-50 text-blue-500 border-blue-100" :
                               "bg-blue-50 text-blue-500 border-blue-100"
                             )}>
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
              className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl shadow-blue-900/10 overflow-hidden p-10 border border-slate-100 dark:border-slate-700 transition-colors"
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
                    onFocus={(e) => e.target.select()}
                    placeholder="Contoh: Redesign Website"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-bold"
                    id="input_project_name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('desc')}</label>
                  <textarea 
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="Apa tujuan dari proyek ini?"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all h-32 resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium"
                    id="textarea_project_desc"
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

                    const projectId = editingProjectId || `p${Date.now()}`;
                    const existingProject = projects.find(p => p.id === projectId);
                    const newProject: Project = {
                      id: projectId,
                      name: newProjectName,
                      description: newProjectDesc,
                      createdAt: existingProject ? existingProject.createdAt : new Date().toISOString().split('T')[0],
                      type: newProjectMode === 'Operational' ? 'Maintenance' : 'Development',
                      mode: newProjectMode,
                      columns: existingProject ? existingProject.columns : [
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
                    setEditingProjectId(null);
                  }}
                  className="py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30"
                  id="btn_submit_project"
                >
                  {editingProjectId ? t('edit') : t('create')}
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
              className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700 transition-colors"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm flex-shrink-0",
                    selectedTask.type === 'Maintenance' ? "bg-sky-50 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400"
                  )}>
                    {selectedTask.type === 'Maintenance' ? <Zap size={20} /> : <Trello size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      id="input_task_title"
                      value={t(selectedTask.title)}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, title: e.target.value };
                        setSelectedTask(updatedTask);
                        // Only update array if task already exists in DB (not a new task being created)
                        if (!isNewTask) {
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
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
                          const insightMsg = (t('aiAssistant.criticalTaskInsight') as string).replace('{title}', t(selectedTask.title));
                          setChatMessages([
                            { role: 'ai', content: introMsg },
                            { role: 'ai', content: insightMsg }
                          ]);
                        }
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all shadow-sm"
                    >
                      <BrainCircuit size={14} />
                      {t('aiSolution')}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      // If cancelling a new task, remove any temp entry from tasks array
                      if (isNewTask && selectedTask) {
                        setTasks(tasks.filter(t => t.id !== selectedTask.id));
                      }
                      setSelectedTask(null);
                      setIsEditing(false);
                      setIsNewTask(false);
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
                      id="textarea_task_desc"
                      value={t(selectedTask.description || '')}
                      onChange={(e) => {
                        const updatedTask = { ...selectedTask, description: e.target.value };
                        setSelectedTask(updatedTask);
                        // Only update array if task already exists in DB (not a new task being created)
                        if (!isNewTask) {
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
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
                          {selectedTask.checklist.filter(c => c.completed).length} / {selectedTask.checklist.length} {t('taskPercentComplete')}
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
                            value={t(item.text)}
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

                          <div className="w-28 flex-shrink-0">
                            <input 
                              type="date"
                              value={item.startDate || ''}
                              onChange={(e) => {
                                const next = [...(selectedTask.checklist || [])];
                                next[idx].startDate = e.target.value;
                                const updatedTask = { ...selectedTask, checklist: next };
                                setSelectedTask(updatedTask);
                                setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-500 outline-none"
                              title="Tanggal Mulai (Start Date)"
                            />
                          </div>
                          
                          <div className="w-28 flex-shrink-0">
                            <input 
                              type="date"
                              value={item.endDate || ''}
                              onChange={(e) => {
                                const next = [...(selectedTask.checklist || [])];
                                next[idx].endDate = e.target.value;
                                const updatedTask = { ...selectedTask, checklist: next };
                                setSelectedTask(updatedTask);
                                setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-500 outline-none"
                              title="Tanggal Selesai (End Date)"
                            />
                          </div>

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
                          {t('addChecklistItem')}
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

                    <div className="flex flex-col gap-3">
                      {selectedTask.attachments?.map((attachment) => (
                        <div key={attachment.id} className="group relative flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                          {attachment.type === 'file' && attachment.url.startsWith('data:image') ? (
                            <img src={attachment.url} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800" alt={attachment.name} />
                          ) : (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
                              {attachment.type === 'file' ? <FileText size={20} className="text-slate-400" /> : <Zap size={20} className="text-blue-500" />}
                            </div>
                          )}
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 min-w-0 flex flex-col justify-center py-1"
                          >
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{attachment.name}</p>
                            <p className="text-[11px] font-medium text-slate-400 truncate">{attachment.type === 'link' ? attachment.url : t('taskFileLampiran')}</p>
                          </a>
                          <div className="opacity-0 group-hover:opacity-100 transition-all px-2">
                            <button
                              onClick={() => {
                                const next = (selectedTask.attachments || []).filter(a => a.id !== attachment.id);
                                const updatedTask = { ...selectedTask, attachments: next };
                                setSelectedTask(updatedTask);
                                setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                              }}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {attachmentType === 'file' && (
                        <button 
                          type="button"
                          onClick={() => attachmentFileInputRef.current?.click()}
                          className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                            <Plus size={20} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-xs font-bold tracking-wide">{t('addAttachment')}</span>
                        </button>
                      )}
                      <input 
                        id="input_file_upload"
                        name="input_file_upload"
                        type="file" 
                        ref={attachmentFileInputRef} 
                        onChange={handleFileChange} 
                        style={{ opacity: 0, width: 0, height: 0, position: 'absolute', zIndex: -1 }}
                      />
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
                            {t('sendComment')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Sidebar metadata controls (Status, Priority, Due Date, Assignee, Contributors) */}
                <div className="space-y-6">
                  
                  {/* Metadata Card container */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-6">
                    
                    {/* Status Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('boardStatus')}</label>
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

                    {/* Priority Selector with AI assistant button */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Sparkles size={10} className="text-blue-500" /> {t('priority')}
                      </label>
                      <div className="flex gap-2">
                        <select
                          id="select_priority"
                          value={selectedTask.priority}
                          disabled
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold outline-none transition-all shadow-sm cursor-not-allowed appearance-none"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                        <button
                          type="button"
                          id="btn_ai_priority"
                          onClick={handleAISuggest}
                          disabled={isAnalyzing}
                          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 whitespace-nowrap"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>{t('analyzing')}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              <span>{t('aiSolution')}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium ml-1 flex items-center gap-1">
                        <BrainCircuit size={9} className="text-blue-400" /> {t('aiPriorityHint')}
                      </p>
                    </div>

                    {/* Tipe Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('taskType')}</label>
                      <select
                        value={selectedTask.type}
                        onChange={(e) => {
                          const updatedTask = { ...selectedTask, type: e.target.value as any };
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

                    {/* Start Date picker */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('startDate')}</label>
                      <input 
                        type="date"
                        id="input_task_start_date"
                        value={selectedTask.startDate || ''}
                        onChange={(e) => {
                          const updatedTask = { ...selectedTask, startDate: e.target.value };
                          setSelectedTask(updatedTask);
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 outline-none"
                      />
                    </div>
                  
                    {/* Due Date picker */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('deadline')}</label>
                      <div className="relative">
                        <input
                          type="date"
                          id="input_task_due_date"
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
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('assignee')}</label>
                      <select
                        id="select_task_assignee"
                        value={selectedTask.assignee || ''}
                        onChange={(e) => {
                          const updatedTask = { ...selectedTask, assignee: e.target.value || undefined };
                          setSelectedTask(updatedTask);
                          setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold focus:border-blue-500 outline-none transition-all shadow-sm"
                      >
                        <option value="">{t('unassigned')}</option>
                        {allProjectUsers.map(u => (
                          <option key={u?.id || u?.id_pengguna} value={u?.id || u?.id_pengguna}>
                            {u?.nama || u?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Contributors selection (visual card grid) */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <UserIcon size={12} className="text-blue-500" /> {t('teamContributors')}
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {allProjectUsers.map(u => {
                        if (!u) return null;
                        const uid = u.id || u.id_pengguna;
                        const isSelected = selectedTask?.contributors?.includes(uid);
                        return (
                          <label key={uid} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                const curr = selectedTask?.contributors || [];
                                const newCont = e.target.checked 
                                  ? [...curr, uid]
                                  : curr.filter(id => id !== uid);
                                
                                const updatedTask = selectedTask ? { ...selectedTask, contributors: newCont } : null;
                                setSelectedTask(updatedTask);
                                
                                if (updatedTask) {
                                  setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
                                }
                                
                                if (e.target.checked) {
                                  onAddNotification(
                                    `Anda ditambahkan ke tugas: ${selectedTask?.title}`,
                                    'Task',
                                    false
                                  );
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold text-[10px] overflow-hidden">
                                {u.avatar || u.foto_profil ? (
                                  <img src={u.avatar || u.foto_profil} alt={u.nama || u.name} className="w-full h-full object-cover" />
                                ) : (
                                  (u.nama || u.name || 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="text-sm font-medium dark:text-slate-300">{u.nama || u.name}</span>
                            </div>
                          </label>
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
                  onClick={handleSaveTask}
                  id="btn_submit_task"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  {t('done')}
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
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-10 border border-slate-100 dark:border-slate-700 transition-colors"
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
                    ref={proofFileInputRef}
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
                    onClick={() => proofFileInputRef.current?.click()}
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
                          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded mr-1">Klik</span> {t('clickOrDrag')}
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
                    {t('cancelLabel')}
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
                    {t('finishLabel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Maintenance Assistant Toggle Button */}
      {(hasCriticalWarnings) && (
        <div className="fixed bottom-8 right-8 z-40">
          <motion.button
            id="btn_toggle_ai_chat"
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
                className="absolute bottom-20 right-0 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-10rem)] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden transition-colors"
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
                      id="input_ai_chat"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={(t('aiAssistant.placeholder') as any)}
                      className="w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    />
                    <button
                      type="submit"
                      id="btn_send_ai_chat"
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

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMemberModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-10"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
                {t('addMemberTitle')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                {t('addMemberDesc')}
              </p>
              
              <div className="mb-6 relative">
                <input 
                  type="text" 
                  placeholder={t('memberSearchPlaceholder')}
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium dark:text-white"
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="space-y-3 mb-10 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {/* Current Members Section */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('currentMembers')}</h3>
                  <div className="space-y-2">
                    {allProjectUsers.map((member: any) => (
                      <div key={member.id || member.id_pengguna} className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                            {member.avatar || member.foto_profil ? (
                              <img src={member.avatar || member.foto_profil} alt={member.nama || member.name} className="w-full h-full object-cover" />
                            ) : (
                              (member.nama || member.name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{member.nama || member.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{member.email}</div>
                          </div>
                        </div>
                        {member.id !== user?.id && member.id !== (currentProject as any)?.id_pengguna && (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/proyek/${currentProject?.id}/anggota/${member.id || member.id_pengguna}`, {
                                  method: 'DELETE'
                                });
                                if (res.ok) {
                                  onSuccess(`${member.nama || member.name} dihapus dari proyek`);
                                  if (setProjects && currentProject) {
                                    setProjects(projects.map(p => p.id === currentProject.id ? { ...p, anggota: (p.anggota || []).filter((a: any) => a.id_pengguna !== (member.id || member.id_pengguna)) } : p));
                                  }
                                } else {
                                  onAddNotification('Gagal menghapus anggota', 'Error');
                                }
                              } catch (err) {
                                onAddNotification('Terjadi kesalahan koneksi', 'Error');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Hapus anggota"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Members Section */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('addNewMembers')}</h3>
                  <div className="space-y-2">
                    {dbUsers
                      .filter(u => !allProjectUsers.find(member => member.id === u.id || member.id_pengguna === u.id))
                      .filter(u => (u.nama || u.name || '').toLowerCase().includes(memberSearchQuery.toLowerCase()))
                      .map((u: any) => (
                      <button 
                        key={u.id || u.id_pengguna}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/proyek/${currentProject?.id}/anggota`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id_pengguna: u.id || u.id_pengguna })
                            });
                            if (res.ok) {
                              onSuccess(`${u.nama || u.name} ditambahkan ke proyek!`);
                              if (setProjects && currentProject) {
                                setProjects(projects.map(p => p.id === currentProject.id ? { ...p, anggota: [...(p.anggota || []), { id_pengguna: u.id || u.id_pengguna, id_proyek: currentProject.id }] } : p));
                              }
                            } else {
                              const data = await res.json().catch(() => ({}));
                              onAddNotification(data.error || 'Gagal menambahkan anggota', 'Error');
                            }
                          } catch (err) {
                            console.error(err);
                            onAddNotification('Terjadi kesalahan koneksi', 'Error');
                          }
                        }}
                        className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all font-bold text-slate-700 dark:text-slate-200 group flex items-center gap-4"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                          {u.avatar || u.foto_profil ? (
                            <img src={u.avatar || u.foto_profil} alt={u.nama || u.name} className="w-full h-full object-cover" />
                          ) : (
                            (u.nama || u.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-sm">{u.nama || u.name}</div>
                          <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                        </div>
                      </button>
                    ))}
                    {dbUsers.filter(u => !allProjectUsers.find(member => member.id === u.id || member.id_pengguna === u.id)).length === 0 && (
                      <div className="text-center p-4 text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                        {t('allMembersJoined')}
                      </div>
                    )}
                    {dbUsers.filter(u => !allProjectUsers.find(member => member.id === u.id || member.id_pengguna === u.id)).length > 0 && 
                     dbUsers.filter(u => !allProjectUsers.find(member => member.id === u.id || member.id_pengguna === u.id))
                            .filter(u => (u.nama || u.name || '').toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                      <div className="text-center p-4 text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                        {t('noMemberFound')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                {t('cancel')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Documentation Drawer ── */}
      <AnimatePresence>
        {docDrawerTask && (
          <DocumentationDrawer
            key={docDrawerTask.id}
            task={docDrawerTask}
            user={user}
            darkMode={darkMode}
            documentations={documentations}
            defaultMode={docDrawerMode}
            onSave={(newDoc) => {
              fetch('/api/dokumentasi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_tugas: newDoc.taskId,
                  id_pengguna: newDoc.authorId,
                  catatan_selesai: newDoc.completionNotes,
                  kendala: newDoc.obstacles,
                  solusi: newDoc.solutions,
                })
              }).then(res => res.json())
                .then(dbDoc => {
                  const savedDoc = { ...newDoc, id: dbDoc.id_dokumentasi, createdAt: dbDoc.dibuat_pada };
                  setDocumentations(prev => [savedDoc, ...prev]);
                  updateTaskStatus(newDoc.taskId, 'Done');
                  onSuccess('Dokumentasi berhasil disimpan ke database!');
                })
                .catch(err => {
                  console.error(err);
                  onSuccess('Gagal menyimpan dokumentasi ke database.');
                });
            }}
            onDelete={(docId) => {
              fetch(`/api/dokumentasi/${docId}`, { method: 'DELETE' })
                .then(() => {
                  setDocumentations(prev => prev.filter(d => d.id !== docId));
                  onSuccess('Dokumentasi berhasil dihapus.');
                })
                .catch(err => {
                   console.error(err);
                   onSuccess('Gagal menghapus dokumentasi.');
                });
            }}
            onClose={() => setDocDrawerTask(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Column Modal */}
      <AnimatePresence>
        {showAddColumnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('addNewColumn')}</h3>
              <input 
                type="text"
                placeholder={t('columnPlaceholder')}
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 outline-none mb-6"
              />
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setShowAddColumnModal(false); setNewColName(''); }}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={() => {
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
                    setShowAddColumnModal(false);
                    setNewColName('');
                  }}
                  className="px-4 py-2 font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                >
                  {t('addChecklistItem')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Column Modal */}
      <AnimatePresence>
        {columnToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('deleteColumn')}</h3>
              <p className="text-slate-500 text-sm mb-6">{t('confirmDeleteColumnDesc')}</p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setColumnToDelete(null)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={() => {
                    const updatedProject = {
                      ...currentProject!,
                      columns: boardColumns.filter(c => c.id !== columnToDelete)
                    };
                    onAddProject(updatedProject, tasks);
                    setColumnToDelete(null);
                  }}
                  className="px-4 py-2 font-bold bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('deleteProject')}</h3>
              <p className="text-slate-500 text-sm mb-6">{t('confirmDeleteProject').replace('{name}', projectToDelete.name)}</p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  id="btn-cancel-delete-project"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/proyek/${projectToDelete.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        const remainingProjects = projects.filter(p => p.id !== projectToDelete.id);
                        if (setProjects) setProjects(remainingProjects);
                        
                        // Redirect if deleted project was currently selected
                        if (currentProjectId === projectToDelete.id) {
                          if (remainingProjects.length > 0) {
                            setCurrentProjectId(remainingProjects[0].id);
                          } else {
                            setCurrentProjectId('');
                          }
                        }
                        
                        onSuccess('Proyek berhasil dihapus');
                      } else {
                        alert('Gagal menghapus proyek');
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setProjectToDelete(null);
                    }
                  }}
                  className="px-4 py-2 font-bold bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                  id="btn-confirm-delete"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default KanbanBoard;
