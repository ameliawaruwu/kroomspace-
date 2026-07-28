export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Backlog' | 'To Do' | 'In Progress' | 'Review' | 'Done' | string;
export type TaskType = 'Development' | 'Bug Fix' | 'Maintenance' | 'Infrastructure' | 'API Service' | 'Security';

export type KanbanMode = 'Project' | 'Operational';

export interface BoardColumn {
  id: string;
  title: string;
  status: TaskStatus;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  type: TaskType;
  mode: KanbanMode;
  columns?: BoardColumn[];
  anggota?: any[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'link';
  createdAt: string;
}



export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  assignee?: string;
  contributors?: string[];
  comments?: Comment[];
  attachments?: Attachment[];
  startDate?: string;
  deadline?: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  projectId?: string;
  checklist?: ChecklistItem[];
  customFields?: CustomField[];
  automationRules?: AutomationRule[];
  templateId?: string;
  isBlocked?: boolean;
  blockReason?: string;
  activityLog?: ActivityLog[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  password?: string;
  role: 'Admin' | 'Member';
  avatar?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'Info' | 'Warning' | 'Alert' | 'CRM' | 'Task';
  timestamp: string;
  read: boolean;
  whatsappSent?: boolean;
  userId?: string; // The user this notification is for
  taskId?: string; // Optional related task
  actionRequired?: 'start' | 'view' | 'complete'; // Optional quick action
  badge?: string; // e.g., 'URGENT', 'OVERDUE'
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  startDate?: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'image' | 'location' | 'date';
  required: boolean;
}

export interface AutomationRule {
  trigger: 'status_change' | 'checklist_complete';
  condition?: string;
  action: 'require_photo' | 'require_notes' | 'send_whatsapp' | 'notify_admin';
}


// Satu tugas di dalam template proyek (bukan tugas mandiri)
export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  checklist: ChecklistItem[];
}

// Template Proyek: blueprint proyek lengkap siap pakai
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  kategori: string;           // Development | Maintenance | Infrastructure | Security | API Service
  type: TaskType;             // tipe_tugas
  mode: KanbanMode;           // mode_kanban
  columns: BoardColumn[];
  tasks: TemplateTask[];      // tugas-tugas + checklist yang sudah di-generate AI
  createdAt?: string;
}

// Tetap ada untuk backward compat (tidak digunakan di UI baru)
export interface TaskTemplate {
  id: string;
  name: string;
  category: TaskType;
  description: string;
  checklist: ChecklistItem[];
  customFields: CustomField[];
  priority: Priority;
  estimatedHours: number;
  slaDays: number;
  assignmentType: 'manual' | 'ai';
  automationRules: AutomationRule[];
  whatsappTrigger: {
    onCreate: boolean;
    onAssign: boolean;
    onDone: boolean;
    onOverdue: boolean;
  };
}


export interface TeamKPI {
  name: string;
  value: number;
  target: number;
  unit: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface DocumentationAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
}

export interface Documentation {
  id: string;
  taskId: string;           // relasi ke task
  projectId?: string;
  completionNotes: string;  // catatan penyelesaian
  obstacles: string;        // kendala yang ditemukan
  solutions: string;        // solusi yang dilakukan
  attachments: DocumentationAttachment[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
}
