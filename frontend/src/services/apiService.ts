import { Task, User, Notification, Project, TaskTemplate } from "../types";

// Mock Data — ID konsisten dengan idGenerator.ts dan prisma/seed.ts
// Pengguna: P001–P005 | Proyek: PR001–PR002 | Kolom: KB001–KB010
// Tugas: T001–T007 | Template: TM001–TM008 | Checklist: CL001–CL026

export const mockProjects: Project[] = [
  { 
    id: 'PR001', 
    name: 'Inti KroomSpace', 
    description: 'Pengembangan sistem utama KroomSpace - platform manajemen proyek berbasis AI.', 
    createdAt: '2026-01-01', 
    type: 'Development',
    mode: 'Project',
    columns: [
      { id: 'KB001', title: 'Backlog',     status: 'Backlog',     order: 0 },
      { id: 'KB002', title: 'To Do',       status: 'To Do',       order: 1 },
      { id: 'KB003', title: 'In Progress', status: 'In Progress', order: 2 },
      { id: 'KB004', title: 'Review',      status: 'Review',      order: 3 },
      { id: 'KB005', title: 'Done',        status: 'Done',        order: 4 },
    ]
  },
  { 
    id: 'PR002', 
    name: 'Pemeliharaan Q1', 
    description: 'Tugas pemeliharaan operasional triwulanan untuk infrastruktur Kroombox.', 
    createdAt: '2026-03-15', 
    type: 'Maintenance',
    mode: 'Operational',
    columns: [
      { id: 'KB006', title: 'Backlog',       status: 'Backlog',     order: 0 },
      { id: 'KB007', title: 'Input Masalah', status: 'To Do',       order: 1 },
      { id: 'KB008', title: 'Pengerjaan',    status: 'In Progress', order: 2 },
      { id: 'KB009', title: 'Verifikasi',    status: 'Review',      order: 3 },
      { id: 'KB010', title: 'Selesai',       status: 'Done',        order: 4 },
    ]
  },
];

export const mockUsers: User[] = [
  { id: 'P001', name: 'Amelia Waruwu',  email: 'amelia@kroombox.com', whatsapp: '+6281234567890', password: 'admin',   role: 'Admin',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia' },
  { id: 'P002', name: 'Budi Santoso',   email: 'budi@kroombox.com',   whatsapp: '+6282345678901', password: 'user123', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi'   },
  { id: 'P003', name: 'Citra Dewi',     email: 'citra@kroombox.com',  whatsapp: '+6283456789012', password: 'user',    role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Citra'  },
  { id: 'P004', name: 'Deni Kurniawan', email: 'deni@kroombox.com',   whatsapp: '+6284567890123', password: 'user',    role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deni'   },
  { id: 'P005', name: 'Eva Susanti',    email: 'eva@kroombox.com',    whatsapp: '+6285678901234', password: 'user',    role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva'    },
];

export const mockTemplates: TaskTemplate[] = [
  {
    id: 'TM001',
    name: 'Analisis Kebutuhan',
    category: 'Development',
    description: 'Tahap pengumpulan dan analisis requirement sistem.',
    priority: 'High',
    estimatedHours: 16,
    slaDays: 3,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM001-CL1', text: 'Wawancara stakeholder',           completed: false },
      { id: 'TM001-CL2', text: 'Dokumentasi BRD',                 completed: false },
      { id: 'TM001-CL3', text: 'Review Kebutuhan Sistem',         completed: false },
      { id: 'TM001-CL4', text: 'Validasi requirement bersama tim',completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TM002',
    name: 'Desain UI/UX',
    category: 'Development',
    description: 'Pembuatan wireframe dan prototipe UI/UX produk digital.',
    priority: 'Medium',
    estimatedHours: 24,
    slaDays: 4,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM002-CL1', text: 'Pembuatan Wireframe',       completed: false },
      { id: 'TM002-CL2', text: 'Desain High-Fidelity',     completed: false },
      { id: 'TM002-CL3', text: 'Prototyping interaktif',   completed: false },
      { id: 'TM002-CL4', text: 'User Testing & Feedback',  completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TM003',
    name: 'Pengembangan Backend',
    category: 'Development',
    description: 'Pembuatan API, database, dan logika sistem belakang.',
    priority: 'High',
    estimatedHours: 40,
    slaDays: 7,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM003-CL1', text: 'Setup Database & Schema',   completed: false },
      { id: 'TM003-CL2', text: 'Pembuatan endpoint API',   completed: false },
      { id: 'TM003-CL3', text: 'Autentikasi & Otorisasi',  completed: false },
      { id: 'TM003-CL4', text: 'Unit testing API',         completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TM004',
    name: 'Pengembangan Frontend',
    category: 'Development',
    description: 'Implementasi desain UI ke dalam kode frontend.',
    priority: 'High',
    estimatedHours: 40,
    slaDays: 7,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM004-CL1', text: 'Setup framework & dependensi',   completed: false },
      { id: 'TM004-CL2', text: 'Slicing UI dari desain',         completed: false },
      { id: 'TM004-CL3', text: 'Integrasi API',                  completed: false },
      { id: 'TM004-CL4', text: 'Cross-browser & responsif test', completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TM005',
    name: 'Testing & QA',
    category: 'Development',
    description: 'Pengujian kualitas perangkat lunak dan pencarian bug.',
    priority: 'High',
    estimatedHours: 16,
    slaDays: 3,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM005-CL1', text: 'SIT (System Integration Testing)',   completed: false },
      { id: 'TM005-CL2', text: 'UAT (User Acceptance Testing)',      completed: false },
      { id: 'TM005-CL3', text: 'Regression Testing',                 completed: false },
      { id: 'TM005-CL4', text: 'Pelaporan & dokumentasi Bug',        completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TM006',
    name: 'Deployment ke Produksi',
    category: 'Maintenance',
    description: 'Proses rilis aplikasi ke environment produksi secara aman.',
    priority: 'High',
    estimatedHours: 8,
    slaDays: 1,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM006-CL1', text: 'Backup Database Production',  completed: false },
      { id: 'TM006-CL2', text: 'Deploy Artifact ke Server',  completed: false },
      { id: 'TM006-CL3', text: 'Smoke Testing Production',   completed: false },
      { id: 'TM006-CL4', text: 'Monitor log pasca-deploy',   completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TM007',
    name: 'Audit Keamanan Sistem',
    category: 'Security',
    description: 'Langkah audit keamanan dari penetrasi hingga laporan kerentanan.',
    priority: 'High',
    estimatedHours: 40,
    slaDays: 5,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM007-CL1', text: 'Penetration Testing (Pentest)',       completed: false },
      { id: 'TM007-CL2', text: 'Vulnerability Scanning',             completed: false },
      { id: 'TM007-CL3', text: 'Review Konfigurasi Server',          completed: false },
      { id: 'TM007-CL4', text: 'Laporan Kerentanan & Rekomendasi',   completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
  {
    id: 'TM008',
    name: 'Migrasi Server & Database',
    category: 'Infrastructure',
    description: 'Panduan lengkap pemindahan data ke infrastruktur server baru tanpa downtime.',
    priority: 'High',
    estimatedHours: 80,
    slaDays: 14,
    assignmentType: 'manual',
    checklist: [
      { id: 'TM008-CL1', text: 'Inventarisasi data & dependensi', completed: false },
      { id: 'TM008-CL2', text: 'Backup penuh sebelum migrasi',    completed: false },
      { id: 'TM008-CL3', text: 'Eksekusi migrasi data',           completed: false },
      { id: 'TM008-CL4', text: 'Verifikasi & rollback plan',      completed: false },
    ],
    customFields: [], automationRules: [], whatsappTrigger: { onCreate: true, onAssign: true, onDone: true, onOverdue: true }
  },
];

export const mockTasks: Task[] = [
  { 
    id: 'T001', 
    title: 'Perbaiki Bug Login', 
    description: 'Pengguna tidak dapat login menggunakan akun Google SSO.',
    status: 'In Progress', 
    priority: 'High', 
    type: 'Bug Fix', 
    assignee: 'P002', 
    contributors: ['P001', 'P003'],
    checklist: [
      { id: 'CL001', text: 'Reproduksi bug di lingkungan lokal',       completed: true  },
      { id: 'CL002', text: 'Identifikasi akar masalah di auth module', completed: true  },
      { id: 'CL003', text: 'Perbaiki logika token refresh',            completed: false },
      { id: 'CL004', text: 'Testing di berbagai browser',              completed: false },
    ],
    comments: [
      { id: 'KM001', userId: 'P001', userName: 'Amelia Waruwu', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia', text: 'Saya juga melihat bug ini di perangkat seluler. Perlu ditangani segera.', createdAt: '2026-04-05' }
    ],
    deadline: '2026-04-06', 
    createdAt: '2026-04-01', 
    projectId: 'PR001' 
  },
  { 
    id: 'T002', 
    title: 'Error API pada Dasbor', 
    description: 'Grafik statistik di halaman dasbor tidak memuat data dari server.',
    status: 'To Do', 
    priority: 'High', 
    type: 'Bug Fix', 
    assignee: 'P003', 
    contributors: ['P002'], 
    checklist: [
      { id: 'CL005', text: 'Cek endpoint API statistik di server', completed: false },
      { id: 'CL006', text: 'Periksa format response JSON',         completed: false },
      { id: 'CL007', text: 'Perbaiki CORS policy jika perlu',      completed: false },
    ],
    deadline: '2026-04-07', 
    createdAt: '2026-04-02', 
    projectId: 'PR001' 
  },
  { 
    id: 'T003', 
    title: 'Peningkatan UI Sidebar', 
    description: 'Sidebar navigasi belum responsif di layar tablet dan mobile.',
    status: 'Backlog', 
    priority: 'Low', 
    type: 'Development', 
    checklist: [
      { id: 'CL008', text: 'Analisis breakpoint yang diperlukan', completed: false },
      { id: 'CL009', text: 'Implementasi responsive CSS',         completed: false },
      { id: 'CL010', text: 'Testing di berbagai ukuran layar',    completed: false },
    ],
    createdAt: '2026-04-03', 
    projectId: 'PR001' 
  },
  { 
    id: 'T004', 
    title: 'Website Down (Pemeliharaan Darurat)', 
    description: 'Halaman utama kroombox.com tidak dapat diakses sejak pukul 08.00 WIB.',
    status: 'To Do', 
    priority: 'High', 
    type: 'Maintenance', 
    assignee: 'P001', 
    contributors: ['P002', 'P003'], 
    checklist: [
      { id: 'CL011', text: 'Cek status server di cPanel',       completed: true  },
      { id: 'CL012', text: 'Periksa log error Nginx/Apache',    completed: false },
      { id: 'CL013', text: 'Restart service web server',        completed: false },
      { id: 'CL014', text: 'Verifikasi website kembali online', completed: false },
    ],
    comments: [
      { id: 'KM002', userId: 'P002', userName: 'Budi Santoso', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi', text: 'Sudah cek dari sisi DNS, sepertinya ada masalah di konfigurasi Nginx.', createdAt: '2026-04-05' }
    ],
    deadline: '2026-04-05', 
    createdAt: '2026-04-05', 
    projectId: 'PR002' 
  },
  { 
    id: 'T005', 
    title: 'Server Overload (CPU 95%)', 
    description: 'Penggunaan CPU server produksi mencapai 95%, menyebabkan respons lambat.',
    status: 'Review', 
    priority: 'High', 
    type: 'Maintenance', 
    assignee: 'P002', 
    checklist: [
      { id: 'CL015', text: 'Identifikasi proses penyebab beban tinggi via htop', completed: true  },
      { id: 'CL016', text: 'Terminasi proses zombie atau runaway process',        completed: true  },
      { id: 'CL017', text: 'Optimasi query database yang berat',                  completed: true  },
      { id: 'CL018', text: 'Monitor CPU setelah perbaikan (24 jam)',              completed: false },
    ],
    deadline: '2026-04-05', 
    createdAt: '2026-04-05', 
    projectId: 'PR002' 
  },
  { 
    id: 'T006', 
    title: 'Setup CI/CD Pipeline', 
    description: 'Konfigurasi pipeline CI/CD menggunakan GitHub Actions untuk otomatisasi deployment.',
    status: 'Backlog', 
    priority: 'Medium', 
    type: 'Development',
    checklist: [
      { id: 'CL019', text: 'Setup repository GitHub Actions workflow',  completed: false },
      { id: 'CL020', text: 'Konfigurasi environment variables secrets', completed: false },
      { id: 'CL021', text: 'Test pipeline dengan push ke branch dev',   completed: false },
      { id: 'CL022', text: 'Dokumentasi proses CI/CD',                  completed: false },
    ],
    createdAt: '2026-04-10', 
    projectId: 'PR001' 
  },
  { 
    id: 'T007', 
    title: 'Backup Database Bulanan', 
    description: 'Eksekusi prosedur backup database bulanan dan verifikasi integritas data.',
    status: 'Done', 
    priority: 'Medium', 
    type: 'Maintenance', 
    assignee: 'P004',
    checklist: [
      { id: 'CL023', text: 'Jalankan skrip backup otomatis',       completed: true },
      { id: 'CL024', text: 'Verifikasi integritas file backup',     completed: true },
      { id: 'CL025', text: 'Upload ke penyimpanan cloud (offsite)', completed: true },
      { id: 'CL026', text: 'Catat di log maintenance bulanan',      completed: true },
    ],
    deadline: '2026-04-01', 
    createdAt: '2026-04-01', 
    projectId: 'PR002' 
  },
];

export const mockNotifications: Notification[] = [
  { 
    id: 'AC001', 
    userId: 'P001',
    message: '🚨 Website kroombox.com tidak dapat diakses! Tindakan segera diperlukan.', 
    type: 'Alert', 
    timestamp: new Date().toISOString(), 
    read: false, 
    badge: 'URGENT',
    actionRequired: 'start',
    taskId: 'T004'
  },
  { 
    id: 'AC002', 
    userId: 'P002',
    message: '⚠️ Tugas "Perbaiki Bug Login" mendekati deadline dan belum selesai.', 
    type: 'Warning', 
    timestamp: new Date(Date.now() - 3600000).toISOString(), 
    read: false, 
    badge: 'OVERDUE',
    actionRequired: 'complete',
    taskId: 'T001'
  },
  { 
    id: 'AC003', 
    userId: 'P001',
    message: '✅ Backup Database Bulanan telah berhasil diselesaikan oleh Deni Kurniawan.', 
    type: 'Task', 
    timestamp: new Date(Date.now() - 7200000).toISOString(), 
    read: true,
    actionRequired: 'view',
    taskId: 'T007'
  },
  { 
    id: 'AC004', 
    userId: 'P001',
    message: '💬 Ada komentar baru di tugas "Server Overload" dari Budi Santoso.', 
    type: 'CRM', 
    timestamp: new Date(Date.now() - 10800000).toISOString(), 
    read: false,
    actionRequired: 'view',
    taskId: 'T005'
  },
  { 
    id: 'AC005', 
    userId: 'P003',
    message: '📝 Status tugas "Error API pada Dasbor" telah diperbarui oleh Admin.', 
    type: 'Task', 
    timestamp: new Date(Date.now() - 14400000).toISOString(), 
    read: false,
    actionRequired: 'view',
    taskId: 'T002'
  },
];

export const mockKPIs = [
  { name: 'Throughput Tugas',    value: 42, target: 45, unit: 'tugas' },
  { name: 'Resolusi Bug',        value: 88, target: 90, unit: '%'     },
  { name: 'Respon Maintenance',  value: 15, target: 10, unit: 'menit' },
  { name: 'Cakupan Kode',       value: 76, target: 80, unit: '%'     },
];
