import { Task, User, Notification, Project, TaskTemplate } from "../types";

// Mock Data
export const mockProjects: Project[] = [
  { 
    id: 'PRJ001', 
    name: 'Inti KroomSpace', 
    description: 'Pengembangan sistem utama', 
    createdAt: '2026-01-01', 
    type: 'Development',
    mode: 'Project',
    columns: [
      { id: 'COL001', title: 'Backlog', status: 'Backlog', order: 0 },
      { id: 'COL002', title: 'To Do', status: 'To Do', order: 1 },
      { id: 'COL003', title: 'In Progress', status: 'In Progress', order: 2 },
      { id: 'COL004', title: 'Review', status: 'Review', order: 3 },
      { id: 'COL005', title: 'Done', status: 'Done', order: 4 },
    ]
  },
  { 
    id: 'PRJ002', 
    name: 'Pemeliharaan Q1', 
    description: 'Tugas pemeliharaan triwulanan', 
    createdAt: '2026-03-15', 
    type: 'Maintenance',
    mode: 'Operational',
    columns: [
      { id: 'COL006', title: 'Backlog', status: 'Backlog', order: 0 },
      { id: 'COL007', title: 'Input Masalah', status: 'To Do', order: 1 },
      { id: 'COL008', title: 'Pengerjaan', status: 'In Progress', order: 2 },
      { id: 'COL009', title: 'Verifikasi', status: 'Review', order: 3 },
      { id: 'COL010', title: 'Selesai', status: 'Done', order: 4 },
    ]
  },
];

export const mockUsers: User[] = [
  { id: 'P001', name: 'Amelia Waruwu', email: 'amelia@kroombox.com', whatsapp: '+6281234567890', password: 'admin', role: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia' },
  { id: 'P002', name: 'Budi Santoso', email: 'budi@kroombox.com', whatsapp: '+6282345678901', password: 'user123', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi' },
  { id: 'P003', name: 'Citra Dewi', email: 'citra@kroombox.com', whatsapp: '+6283456789012', password: 'user', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Citra' },
];

export const mockTemplates: TaskTemplate[] = [
  {
    id: 'TPL001',
    name: 'Preventive Maintenance',
    category: 'Maintenance',
    description: 'Pengecekan rutin infrastruktur server dan database untuk mencegah kegagalan sistem.',
    priority: 'Medium',
    estimatedHours: 4,
    slaDays: 1,
    assignmentType: 'manual',
    checklist: [
      { id: 'CHK001', text: 'Cek disk usage server utama', completed: false },
      { id: 'CHK002', text: 'Backup database offline harian', completed: false },
      { id: 'CHK003', text: 'Update security patch OS', completed: false },
      { id: 'CHK004', text: 'Verifikasi sistem redundansi', completed: false }
    ],
    customFields: [
      { id: 'f1', label: 'Lokasi Server', type: 'location', required: true },
      { id: 'f2', label: 'Catatan Kondisi Fisik', type: 'text', required: false }
    ],
    automationRules: [
      { trigger: 'status_change', action: 'require_photo' }
    ],
    whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TPL002',
    name: 'Incident/Troubleshooting',
    category: 'Maintenance',
    description: 'Penanganan masalah mendadak atau incident pada sistem yang sedang berjalan.',
    priority: 'High',
    estimatedHours: 2,
    slaDays: 0,
    assignmentType: 'ai',
    checklist: [
      { id: 'CHK005', text: 'Identifikasi gejala dan root cause', completed: false },
      { id: 'CHK006', text: 'Isolasi layanan terdampak', completed: false },
      { id: 'CHK007', text: 'Restore layanan (Hotfix)', completed: false },
      { id: 'CHK008', text: 'Verifikasi stabilitas sistem', completed: false }
    ],
    customFields: [
      { id: 'f3', label: 'Deskripsi Masalah', type: 'text', required: true },
      { id: 'f4', label: 'Log Error / Traceback', type: 'text', required: true }
    ],
    automationRules: [
      { trigger: 'status_change', action: 'notify_admin' }
    ],
    whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TPL003',
    name: 'Corrective Maintenance',
    category: 'Maintenance',
    description: 'Tindakan perbaikan setelah ditemukannya kegagalan fungsi pada sistem.',
    priority: 'High',
    estimatedHours: 6,
    slaDays: 2,
    assignmentType: 'manual',
    checklist: [
      { id: 'CHK009', text: 'Analisis kegagalan komponen', completed: false },
      { id: 'CHK010', text: 'Penggantian/Perbaikan modul rusak', completed: false },
      { id: 'CHK011', text: 'Verifikasi fungsi normal', completed: false }
    ],
    customFields: [
      { id: 'f5', label: 'Komponen Terdampak', type: 'text', required: true },
      { id: 'f6', label: 'Penyebab Kegagalan', type: 'text', required: true },
      { id: 'f7', label: 'Bukti Perbaikan', type: 'image', required: true }
    ],
    automationRules: [
      { trigger: 'status_change', action: 'require_photo' }
    ],
    whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TPL004',
    name: 'Deployment/Update Sistem',
    category: 'Infrastructure',
    description: 'Proses rilis aplikasi baru, API, atau pembaruan pada environment produksi.',
    priority: 'Medium',
    estimatedHours: 4,
    slaDays: 1,
    assignmentType: 'manual',
    checklist: [
      { id: 'CHK012', text: 'Build artifact aplikasi', completed: false },
      { id: 'CHK013', text: 'Run database migration', completed: false },
      { id: 'CHK014', text: 'Deploy to load balancer', completed: false },
      { id: 'CHK015', text: 'Warm up cache & health check', completed: false }
    ],
    customFields: [
      { id: 'f8', label: 'Versi Rilis', type: 'text', required: true },
      { id: 'f9', label: 'Changelog URL', type: 'text', required: false },
      { id: 'f10', label: 'Catatan Teknis Rilis', type: 'text', required: true }
    ],
    automationRules: [
      { trigger: 'status_change', action: 'notify_admin' }
    ],
    whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TPL005',
    name: 'Monitoring & Health Check',
    category: 'Maintenance',
    description: 'Pemantauan performa, ketersediaan layanan, dan kesehatan sistem secara menyeluruh.',
    priority: 'Low',
    estimatedHours: 2,
    slaDays: 0,
    assignmentType: 'ai',
    checklist: [
      { id: 'CHK016', text: 'Cek latency API Gateway', completed: false },
      { id: 'CHK017', text: 'Validasi SSL certificates', completed: false },
      { id: 'CHK018', text: 'Review error rate dashboard (Grafana)', completed: false },
      { id: 'CHK019', text: 'Cek penggunaan memori & CPU', completed: false }
    ],
    customFields: [
      { id: 'f11', label: 'Uptime Percentage', type: 'number', required: false },
      { id: 'f12', label: 'Lokasi Node Cek', type: 'location', required: false }
    ],
    automationRules: [],
    whatsappTrigger: { onCreate: false, onAssign: false, onDone: true, onOverdue: true }
  },
  {
    id: 'TPL006',
    name: 'API Issue Handling',
    category: 'API Service',
    description: 'Perbaikan error atau bug pada endpoint API tertentu.',
    priority: 'High',
    estimatedHours: 3,
    slaDays: 1,
    assignmentType: 'manual',
    checklist: [
      { id: 'CHK020', text: 'Cek trace error di Sentry/Logging', completed: false },
      { id: 'CHK021', text: 'Reproduski error di staging', completed: false },
      { id: 'CHK022', text: 'Fixing & Deployment Patch', completed: false }
    ],
    customFields: [
      { id: 'f13', label: 'Endpoint URL', type: 'text', required: true },
      { id: 'f14', label: 'Response Error Code', type: 'text', required: true }
    ],
    automationRules: [
      { trigger: 'status_change', action: 'require_notes' }
    ],
    whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TPL007',
    name: 'API Maintenance/Improvement',
    category: 'API Service',
    description: 'Optimasi performa, refactoring, dan pemeliharaan struktur endpoint API.',
    priority: 'Medium',
    estimatedHours: 5,
    slaDays: 2,
    assignmentType: 'manual',
    checklist: [
      { id: 'CHK023', text: 'Refactor query database lambat', completed: false },
      { id: 'CHK024', text: 'Update dokumentasi API (Swagger)', completed: false },
      { id: 'CHK025', text: 'Benchmarking latency baru', completed: false }
    ],
    customFields: [
      { id: 'f15', label: 'Endpoint ID', type: 'text', required: true },
      { id: 'f16', label: 'Metrik Sebelum', type: 'text', required: false }
    ],
    automationRules: [
      { trigger: 'status_change', action: 'require_notes' }
    ],
    whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TPL008',
    name: 'Security Check / Audit',
    category: 'Security',
    description: 'Audit keamanan berkala dan pengujian penetrasi untuk memastikan sistem aman.',
    priority: 'High',
    estimatedHours: 8,
    slaDays: 3,
    assignmentType: 'manual',
    checklist: [
      { id: 'CHK026', text: 'Scan vulnerability sistem', completed: false },
      { id: 'CHK027', text: 'Review log akses admin', completed: false },
      { id: 'CHK028', text: 'Pengetesan brute force protection', completed: false },
      { id: 'CHK029', text: 'Update firewall rules', completed: false }
    ],
    customFields: [
      { id: 'f17', label: 'Laporan Vulnerability', type: 'image', required: true },
      { id: 'f18', label: 'Catatan Audit Security', type: 'text', required: true }
    ],
    automationRules: [
      { trigger: 'status_change', action: 'notify_admin' }
    ],
    whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  }
];

export const mockTasks: Task[] = [
  { 
    id: 'TSK001', 
    title: 'Perbaiki Bug Login', 
    description: 'Pengguna tidak dapat login dengan Google', 
    status: 'In Progress', 
    priority: 'High', 
    type: 'Bug Fix', 
    assignee: 'P002', 
    contributors: ['P001', 'P003'],
    comments: [
      { id: 'CMT001', userId: 'P001', userName: 'Amelia Waruwu', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia', text: 'Saya juga melihat ini di perangkat seluler.', createdAt: '2026-04-05' }
    ],
    deadline: '2026-04-06', 
    createdAt: '2026-04-01', 
    projectId: 'PRJ001' 
  },
  { id: 'TSK002', title: 'Error API pada Dasbor', description: 'Grafik dasbor tidak memuat data', status: 'To Do', priority: 'High', type: 'Bug Fix', assignee: 'P003', contributors: ['P002'], deadline: '2026-04-07', createdAt: '2026-04-02', projectId: 'PRJ001' },
  { id: 'TSK003', title: 'Peningkatan UI', description: 'Membuat sidebar menjadi responsif', status: 'Backlog', priority: 'Low', type: 'Development', createdAt: '2026-04-03', projectId: 'PRJ001' },
  { id: 'TSK004', title: 'Website Down (Pemeliharaan)', description: 'Halaman utama tidak dapat diakses', status: 'To Do', priority: 'High', type: 'Maintenance', assignee: 'P001', contributors: ['P002', 'P003'], deadline: '2026-04-05', createdAt: '2026-04-05', projectId: 'PRJ002' },
  { id: 'TSK005', title: 'Server Overload', description: 'Penggunaan CPU sebesar 95%', status: 'Review', priority: 'High', type: 'Maintenance', assignee: 'P002', deadline: '2026-04-05', createdAt: '2026-04-05', projectId: 'PRJ002' },
];

export const mockNotifications: Notification[] = [
  { 
    id: 'NOT001', 
    userId: 'P001',
    message: 'Tugas baru di-assign: "Website Down (Pemeliharaan)"', 
    type: 'Alert', 
    timestamp: new Date().toISOString(), 
    read: false, 
    badge: 'URGENT',
    actionRequired: 'start',
    taskId: 'TSK004'
  },
  { 
    id: 'NOT002', 
    userId: 'P002',
    message: 'Tugas "Perbaiki Bug Login" belum selesai dan mendekati deadline.', 
    type: 'Warning', 
    timestamp: new Date(Date.now() - 3600000).toISOString(), 
    read: false, 
    badge: 'OVERDUE',
    actionRequired: 'complete',
    taskId: 'TSK001'
  },
  { 
    id: 'NOT003', 
    userId: 'P001',
    message: 'Budi Santoso menandai "Peningkatan UI" sebagai Selesai.', 
    type: 'Task', 
    timestamp: new Date(Date.now() - 7200000).toISOString(), 
    read: true,
    actionRequired: 'view',
    taskId: 'TSK003'
  },
  { 
    id: 'NOT004', 
    userId: 'P001',
    message: 'Ada komentar baru di tugas "Server Overload" dari Budi.', 
    type: 'CRM', 
    timestamp: new Date(Date.now() - 10800000).toISOString(), 
    read: false,
    actionRequired: 'view',
    taskId: 'TSK005'
  },
  { 
    id: 'NOT005', 
    userId: 'P003',
    message: 'Tugas "Error API pada Dasbor" telah di-update statusnya oleh Admin.', 
    type: 'Task', 
    timestamp: new Date(Date.now() - 14400000).toISOString(), 
    read: false,
    actionRequired: 'view',
    taskId: 'TSK002'
  },
];

export const mockKPIs = [
  { name: 'Throughput Tugas', value: 42, target: 45, unit: 'tugas' },
  { name: 'Resolusi Bug', value: 88, target: 90, unit: '%' },
  { name: 'Respon Pemeliharaan', value: 15, target: 10, unit: 'menit' },
  { name: 'Cakupan Kode', value: 76, target: 80, unit: '%' },
];
