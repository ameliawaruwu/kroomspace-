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

