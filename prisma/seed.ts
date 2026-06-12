/**
 * ==========================================================
 * MASTER SEEDER - KroomSpace
 * ==========================================================
 * Konvensi ID:
 *   Pengguna     : P001, P002, ...
 *   Proyek       : PR001, PR002, ...
 *   KolomPapan   : KB001, KB002, ...
 *   Tugas        : T001, T002, ...
 *   DaftarPeriksa: CL001, CL002, ...
 *   Komentar     : KM001, KM002, ...
 *   Notifikasi   : AC001, AC002, ...
 *   DokumentasiTugas: DK001, DK002, ...
 *   TemplateProyek: TP001, TP002, ...
 * ==========================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────
// HELPER: Struktur kolom default
// ──────────────────────────────────────────────────────────
const kolomProyek = [
  { id: 'col-backlog',     title: 'Backlog',     status: 'Backlog',     order: 0 },
  { id: 'col-todo',        title: 'To Do',       status: 'To Do',       order: 1 },
  { id: 'col-inprogress',  title: 'In Progress', status: 'In Progress', order: 2 },
  { id: 'col-review',      title: 'Review',      status: 'Review',      order: 3 },
  { id: 'col-done',        title: 'Done',        status: 'Done',        order: 4 },
];

const kolomOperasional = [
  { id: 'col-backlog',    title: 'Backlog',        status: 'Backlog',     order: 0 },
  { id: 'col-input',     title: 'Input Masalah',   status: 'To Do',       order: 1 },
  { id: 'col-pengerjaan',title: 'Pengerjaan',       status: 'In Progress', order: 2 },
  { id: 'col-verifikasi',title: 'Verifikasi',       status: 'Review',      order: 3 },
  { id: 'col-selesai',   title: 'Selesai',          status: 'Done',        order: 4 },
];

// ──────────────────────────────────────────────────────────
// 6 TEMPLATE PROYEK — AI-Generated
// ──────────────────────────────────────────────────────────
const templateProyek = [

  // ═══════════════════════════════════════════════════════
  // TP001 — Pengembangan Sistem Informasi
  // ═══════════════════════════════════════════════════════
  {
    id_template: 'TP001',
    nama_template: 'Pengembangan Sistem Informasi',
    deskripsi: 'Template lengkap siklus hidup pengembangan sistem informasi: dari analisis kebutuhan, desain, implementasi, pengujian, hingga go-live. Cocok untuk proyek SI berbasis web maupun desktop.',
    kategori: 'Development',
    tipe_tugas: 'Development',
    mode_kanban: 'Project',
    kolom_papan: JSON.stringify(kolomProyek),
    tugas: JSON.stringify([
      {
        id: 'TP001-T1', title: 'Analisis Kebutuhan & Studi Kelayakan',
        description: 'Mengidentifikasi dan mendokumentasikan seluruh kebutuhan sistem dari stakeholder, serta mengevaluasi kelayakan teknis dan bisnis.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP001-T1-CL1', text: 'Identifikasi stakeholder dan pengguna sistem', completed: false },
          { id: 'TP001-T1-CL2', text: 'Wawancara dan pengumpulan kebutuhan fungsional', completed: false },
          { id: 'TP001-T1-CL3', text: 'Dokumentasi kebutuhan non-fungsional (performa, keamanan)', completed: false },
          { id: 'TP001-T1-CL4', text: 'Analisis kelayakan teknis dan anggaran', completed: false },
          { id: 'TP001-T1-CL5', text: 'Pembuatan dan validasi dokumen BRD/SRS', completed: false },
        ]
      },
      {
        id: 'TP001-T2', title: 'Desain Arsitektur & Database',
        description: 'Merancang arsitektur sistem, struktur database, dan alur data (ERD, DFD) berdasarkan dokumen kebutuhan.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP001-T2-CL1', text: 'Pembuatan Entity Relationship Diagram (ERD)', completed: false },
          { id: 'TP001-T2-CL2', text: 'Desain skema database dan normalisasi tabel', completed: false },
          { id: 'TP001-T2-CL3', text: 'Pembuatan arsitektur sistem (microservice/monolith)', completed: false },
          { id: 'TP001-T2-CL4', text: 'Dokumentasi Data Flow Diagram (DFD)', completed: false },
          { id: 'TP001-T2-CL5', text: 'Review arsitektur oleh tim teknis', completed: false },
        ]
      },
      {
        id: 'TP001-T3', title: 'Desain UI/UX & Prototyping',
        description: 'Merancang antarmuka pengguna yang intuitif, membuat wireframe dan prototipe interaktif untuk validasi sebelum development.',
        status: 'Backlog', priority: 'Medium', type: 'Development',
        checklist: [
          { id: 'TP001-T3-CL1', text: 'Pembuatan user flow dan sitemap', completed: false },
          { id: 'TP001-T3-CL2', text: 'Wireframe semua halaman utama (low-fidelity)', completed: false },
          { id: 'TP001-T3-CL3', text: 'Desain high-fidelity di Figma/Adobe XD', completed: false },
          { id: 'TP001-T3-CL4', text: 'Pembuatan prototipe interaktif', completed: false },
          { id: 'TP001-T3-CL5', text: 'Usability testing dengan pengguna target', completed: false },
        ]
      },
      {
        id: 'TP001-T4', title: 'Pengembangan Backend & API',
        description: 'Membangun logika bisnis di sisi server, membuat REST/GraphQL API, dan mengimplementasikan lapisan database.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP001-T4-CL1', text: 'Setup project backend (framework, dependensi)', completed: false },
          { id: 'TP001-T4-CL2', text: 'Implementasi skema database & migrasi awal', completed: false },
          { id: 'TP001-T4-CL3', text: 'Pengembangan endpoint API (CRUD semua modul)', completed: false },
          { id: 'TP001-T4-CL4', text: 'Implementasi autentikasi & otorisasi (JWT/OAuth)', completed: false },
          { id: 'TP001-T4-CL5', text: 'Unit testing setiap endpoint API', completed: false },
          { id: 'TP001-T4-CL6', text: 'Dokumentasi API (Swagger/Postman Collection)', completed: false },
        ]
      },
      {
        id: 'TP001-T5', title: 'Pengembangan Frontend',
        description: 'Implementasi desain UI ke kode frontend, integrasi dengan API backend, dan optimasi performa tampilan.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP001-T5-CL1', text: 'Setup project frontend (framework, routing, state management)', completed: false },
          { id: 'TP001-T5-CL2', text: 'Slicing UI semua halaman dari desain', completed: false },
          { id: 'TP001-T5-CL3', text: 'Integrasi seluruh endpoint API backend', completed: false },
          { id: 'TP001-T5-CL4', text: 'Implementasi validasi form dan penanganan error', completed: false },
          { id: 'TP001-T5-CL5', text: 'Optimasi performa (lazy loading, caching)', completed: false },
          { id: 'TP001-T5-CL6', text: 'Responsif design untuk mobile & tablet', completed: false },
        ]
      },
      {
        id: 'TP001-T6', title: 'Pengujian Sistem (SIT & UAT)',
        description: 'Melakukan pengujian menyeluruh: System Integration Testing dan User Acceptance Testing bersama stakeholder.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP001-T6-CL1', text: 'Pembuatan test case untuk semua skenario', completed: false },
          { id: 'TP001-T6-CL2', text: 'Eksekusi System Integration Testing (SIT)', completed: false },
          { id: 'TP001-T6-CL3', text: 'Perbaikan bug dari hasil SIT', completed: false },
          { id: 'TP001-T6-CL4', text: 'Pelaksanaan User Acceptance Testing (UAT)', completed: false },
          { id: 'TP001-T6-CL5', text: 'Sign-off UAT dari stakeholder', completed: false },
        ]
      },
      {
        id: 'TP001-T7', title: 'Pelatihan Pengguna & Dokumentasi',
        description: 'Menyusun panduan pengguna, melakukan pelatihan kepada end-user, dan mendokumentasikan sistem secara teknis.',
        status: 'Backlog', priority: 'Medium', type: 'Development',
        checklist: [
          { id: 'TP001-T7-CL1', text: 'Penyusunan buku panduan pengguna (user manual)', completed: false },
          { id: 'TP001-T7-CL2', text: 'Pembuatan video tutorial atau dokumentasi online', completed: false },
          { id: 'TP001-T7-CL3', text: 'Sesi pelatihan untuk end-user', completed: false },
          { id: 'TP001-T7-CL4', text: 'Dokumentasi teknis sistem (API, arsitektur)', completed: false },
        ]
      },
      {
        id: 'TP001-T8', title: 'Go-Live & Monitoring Pasca-Launch',
        description: 'Deployment sistem ke environment produksi dan pemantauan intensif di minggu pertama setelah go-live.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP001-T8-CL1', text: 'Persiapan environment produksi (server, domain, SSL)', completed: false },
          { id: 'TP001-T8-CL2', text: 'Backup dan migrasi data produksi', completed: false },
          { id: 'TP001-T8-CL3', text: 'Deployment aplikasi ke server produksi', completed: false },
          { id: 'TP001-T8-CL4', text: 'Smoke testing di lingkungan produksi', completed: false },
          { id: 'TP001-T8-CL5', text: 'Monitoring log error dan performa (7 hari pertama)', completed: false },
        ]
      },
    ])
  },

  // ═══════════════════════════════════════════════════════
  // TP002 — Audit Keamanan Sistem
  // ═══════════════════════════════════════════════════════
  {
    id_template: 'TP002',
    nama_template: 'Audit Keamanan Sistem',
    deskripsi: 'Template proyek audit keamanan komprehensif: penetration testing, vulnerability assessment, review konfigurasi, dan penyusunan laporan keamanan beserta rekomendasi perbaikan.',
    kategori: 'Security',
    tipe_tugas: 'Security',
    mode_kanban: 'Project',
    kolom_papan: JSON.stringify(kolomProyek),
    tugas: JSON.stringify([
      {
        id: 'TP002-T1', title: 'Perencanaan & Scoping Audit',
        description: 'Mendefinisikan ruang lingkup audit, aset yang akan diaudit, metodologi yang digunakan, dan jadwal pelaksanaan.',
        status: 'Backlog', priority: 'High', type: 'Security',
        checklist: [
          { id: 'TP002-T1-CL1', text: 'Identifikasi aset dan sistem yang masuk dalam scope', completed: false },
          { id: 'TP002-T1-CL2', text: 'Penentuan metodologi audit (OWASP, NIST, ISO 27001)', completed: false },
          { id: 'TP002-T1-CL3', text: 'Pembuatan Rules of Engagement (batasan dan izin)', completed: false },
          { id: 'TP002-T1-CL4', text: 'Penjadwalan audit dan koordinasi tim', completed: false },
        ]
      },
      {
        id: 'TP002-T2', title: 'Reconnaissance & Information Gathering',
        description: 'Pengumpulan informasi tentang sistem target secara pasif dan aktif untuk memetakan attack surface.',
        status: 'Backlog', priority: 'High', type: 'Security',
        checklist: [
          { id: 'TP002-T2-CL1', text: 'Passive reconnaissance (OSINT, DNS, WHOIS)', completed: false },
          { id: 'TP002-T2-CL2', text: 'Network scanning dan port enumeration (Nmap)', completed: false },
          { id: 'TP002-T2-CL3', text: 'Service & version fingerprinting', completed: false },
          { id: 'TP002-T2-CL4', text: 'Identifikasi teknologi yang digunakan (web stack, OS)', completed: false },
        ]
      },
      {
        id: 'TP002-T3', title: 'Vulnerability Assessment',
        description: 'Pemindaian dan identifikasi kerentanan menggunakan automated scanner dan manual review.',
        status: 'Backlog', priority: 'High', type: 'Security',
        checklist: [
          { id: 'TP002-T3-CL1', text: 'Vulnerability scanning dengan Nessus/OpenVAS', completed: false },
          { id: 'TP002-T3-CL2', text: 'Web application scanning (OWASP ZAP/Burp Suite)', completed: false },
          { id: 'TP002-T3-CL3', text: 'Review kerentanan OWASP Top 10 (SQLi, XSS, IDOR, dll)', completed: false },
          { id: 'TP002-T3-CL4', text: 'Pemeriksaan konfigurasi SSL/TLS dan header keamanan', completed: false },
          { id: 'TP002-T3-CL5', text: 'Review keamanan API endpoint', completed: false },
        ]
      },
      {
        id: 'TP002-T4', title: 'Penetration Testing',
        description: 'Eksploitasi kerentanan yang ditemukan secara terkontrol untuk membuktikan dampak nyata di sistem.',
        status: 'Backlog', priority: 'High', type: 'Security',
        checklist: [
          { id: 'TP002-T4-CL1', text: 'Eksploitasi kerentanan kritis (controlled environment)', completed: false },
          { id: 'TP002-T4-CL2', text: 'Privilege escalation testing', completed: false },
          { id: 'TP002-T4-CL3', text: 'Lateral movement assessment', completed: false },
          { id: 'TP002-T4-CL4', text: 'Social engineering / phishing simulation (jika dalam scope)', completed: false },
          { id: 'TP002-T4-CL5', text: 'Dokumentasi bukti (screenshot, log) setiap temuan', completed: false },
        ]
      },
      {
        id: 'TP002-T5', title: 'Review Konfigurasi & Hardening',
        description: 'Review konfigurasi server, database, dan jaringan untuk menemukan misconfiguration yang berpotensi membuka celah keamanan.',
        status: 'Backlog', priority: 'Medium', type: 'Security',
        checklist: [
          { id: 'TP002-T5-CL1', text: 'Review konfigurasi firewall dan aturan jaringan', completed: false },
          { id: 'TP002-T5-CL2', text: 'Review konfigurasi server web (Nginx/Apache)', completed: false },
          { id: 'TP002-T5-CL3', text: 'Review hak akses database dan enkripsi data', completed: false },
          { id: 'TP002-T5-CL4', text: 'Verifikasi patch level OS dan software', completed: false },
        ]
      },
      {
        id: 'TP002-T6', title: 'Laporan Audit & Rekomendasi',
        description: 'Penyusunan laporan audit lengkap dengan temuan, penilaian risiko, dan rekomendasi perbaikan yang actionable.',
        status: 'Backlog', priority: 'High', type: 'Security',
        checklist: [
          { id: 'TP002-T6-CL1', text: 'Kategorisasi temuan berdasarkan severity (Critical/High/Medium/Low)', completed: false },
          { id: 'TP002-T6-CL2', text: 'Penyusunan laporan eksekutif (executive summary)', completed: false },
          { id: 'TP002-T6-CL3', text: 'Penyusunan laporan teknis detail per temuan', completed: false },
          { id: 'TP002-T6-CL4', text: 'Rekomendasi perbaikan dengan prioritas dan estimasi waktu', completed: false },
          { id: 'TP002-T6-CL5', text: 'Presentasi temuan kepada manajemen dan tim teknis', completed: false },
        ]
      },
    ])
  },

  // ═══════════════════════════════════════════════════════
  // TP003 — Migrasi Database & Server
  // ═══════════════════════════════════════════════════════
  {
    id_template: 'TP003',
    nama_template: 'Migrasi Database & Server',
    deskripsi: 'Template proyek migrasi infrastruktur lengkap: pemindahan database, aplikasi, dan layanan dari server lama ke infrastruktur baru dengan zero downtime atau downtime minimal.',
    kategori: 'Infrastructure',
    tipe_tugas: 'Infrastructure',
    mode_kanban: 'Project',
    kolom_papan: JSON.stringify(kolomProyek),
    tugas: JSON.stringify([
      {
        id: 'TP003-T1', title: 'Inventarisasi & Penilaian Sistem Saat Ini',
        description: 'Mendokumentasikan seluruh komponen sistem yang akan dimigrasikan: database, aplikasi, konfigurasi, dan dependensi.',
        status: 'Backlog', priority: 'High', type: 'Infrastructure',
        checklist: [
          { id: 'TP003-T1-CL1', text: 'Inventarisasi semua database (nama, ukuran, versi)', completed: false },
          { id: 'TP003-T1-CL2', text: 'Dokumentasi dependensi aplikasi dan library', completed: false },
          { id: 'TP003-T1-CL3', text: 'Identifikasi konfigurasi server (environment variables, cron jobs)', completed: false },
          { id: 'TP003-T1-CL4', text: 'Pemetaan koneksi antar layanan dan integrasi eksternal', completed: false },
          { id: 'TP003-T1-CL5', text: 'Estimasi volume data dan kebutuhan bandwidth migrasi', completed: false },
        ]
      },
      {
        id: 'TP003-T2', title: 'Setup Server Tujuan & Environment',
        description: 'Menyiapkan server baru dengan konfigurasi yang optimal: OS, runtime, database engine, dan security hardening.',
        status: 'Backlog', priority: 'High', type: 'Infrastructure',
        checklist: [
          { id: 'TP003-T2-CL1', text: 'Provisioning server baru (cloud/on-premise)', completed: false },
          { id: 'TP003-T2-CL2', text: 'Instalasi dan konfigurasi OS, web server, runtime', completed: false },
          { id: 'TP003-T2-CL3', text: 'Instalasi dan konfigurasi database engine (versi sesuai)', completed: false },
          { id: 'TP003-T2-CL4', text: 'Konfigurasi firewall, SSL, dan security hardening', completed: false },
          { id: 'TP003-T2-CL5', text: 'Setup monitoring dan alerting di server baru', completed: false },
        ]
      },
      {
        id: 'TP003-T3', title: 'Backup Penuh Sistem Sumber',
        description: 'Melakukan backup komprehensif seluruh data dan konfigurasi sebelum proses migrasi dimulai.',
        status: 'Backlog', priority: 'High', type: 'Infrastructure',
        checklist: [
          { id: 'TP003-T3-CL1', text: 'Full dump semua database (SQL dump / binary backup)', completed: false },
          { id: 'TP003-T3-CL2', text: 'Backup file aplikasi dan konfigurasi', completed: false },
          { id: 'TP003-T3-CL3', text: 'Backup SSL certificates dan file kunci', completed: false },
          { id: 'TP003-T3-CL4', text: 'Verifikasi integritas backup (restore test)', completed: false },
          { id: 'TP003-T3-CL5', text: 'Upload backup ke penyimpanan offsite', completed: false },
        ]
      },
      {
        id: 'TP003-T4', title: 'Migrasi Database',
        description: 'Memindahkan data dari database server lama ke server baru, termasuk data, skema, stored procedure, dan trigger.',
        status: 'Backlog', priority: 'High', type: 'Infrastructure',
        checklist: [
          { id: 'TP003-T4-CL1', text: 'Export dan import skema database', completed: false },
          { id: 'TP003-T4-CL2', text: 'Migrasi data menggunakan dump/restore atau replication', completed: false },
          { id: 'TP003-T4-CL3', text: 'Migrasi stored procedures, trigger, dan views', completed: false },
          { id: 'TP003-T4-CL4', text: 'Verifikasi jumlah record dan integritas data', completed: false },
          { id: 'TP003-T4-CL5', text: 'Konfigurasi user dan hak akses database', completed: false },
        ]
      },
      {
        id: 'TP003-T5', title: 'Deploy & Konfigurasi Aplikasi',
        description: 'Mendeploy aplikasi ke server baru, menyesuaikan konfigurasi koneksi, dan environment variables.',
        status: 'Backlog', priority: 'High', type: 'Infrastructure',
        checklist: [
          { id: 'TP003-T5-CL1', text: 'Upload dan deploy kode aplikasi ke server baru', completed: false },
          { id: 'TP003-T5-CL2', text: 'Update connection string dan environment variables', completed: false },
          { id: 'TP003-T5-CL3', text: 'Konfigurasi web server (virtual host, proxy, rewrite)', completed: false },
          { id: 'TP003-T5-CL4', text: 'Setup cron jobs dan scheduled tasks', completed: false },
        ]
      },
      {
        id: 'TP003-T6', title: 'Pengujian Pasca-Migrasi',
        description: 'Verifikasi menyeluruh bahwa semua fungsi berjalan normal di server baru sebelum DNS dipindahkan.',
        status: 'Backlog', priority: 'High', type: 'Infrastructure',
        checklist: [
          { id: 'TP003-T6-CL1', text: 'Smoke testing semua fitur utama aplikasi', completed: false },
          { id: 'TP003-T6-CL2', text: 'Pengujian performa (load testing)', completed: false },
          { id: 'TP003-T6-CL3', text: 'Verifikasi koneksi ke layanan eksternal dan API', completed: false },
          { id: 'TP003-T6-CL4', text: 'Testing email, notifikasi, dan integrasi third-party', completed: false },
        ]
      },
      {
        id: 'TP003-T7', title: 'Cutover DNS & Go-Live',
        description: 'Pemindahan traffic produksi ke server baru, pemantauan intensif, dan finalisasi.',
        status: 'Backlog', priority: 'High', type: 'Infrastructure',
        checklist: [
          { id: 'TP003-T7-CL1', text: 'Penurunan TTL DNS sebelum cutover', completed: false },
          { id: 'TP003-T7-CL2', text: 'Sinkronisasi data delta terakhir sebelum cutover', completed: false },
          { id: 'TP003-T7-CL3', text: 'Update DNS records ke server baru', completed: false },
          { id: 'TP003-T7-CL4', text: 'Monitoring intensif 24 jam pasca-cutover', completed: false },
          { id: 'TP003-T7-CL5', text: 'Konfirmasi rollback plan aktif jika terjadi masalah', completed: false },
        ]
      },
    ])
  },

  // ═══════════════════════════════════════════════════════
  // TP004 — Pemeliharaan Infrastruktur Hosting
  // ═══════════════════════════════════════════════════════
  {
    id_template: 'TP004',
    nama_template: 'Pemeliharaan Infrastruktur Hosting',
    deskripsi: 'Template operasional rutin pemeliharaan server hosting: monitoring performa, patch management, backup, optimasi resource, dan penanganan insiden infrastruktur.',
    kategori: 'Maintenance',
    tipe_tugas: 'Maintenance',
    mode_kanban: 'Operational',
    kolom_papan: JSON.stringify(kolomOperasional),
    tugas: JSON.stringify([
      {
        id: 'TP004-T1', title: 'Patch & Update Server',
        description: 'Penerapan patch keamanan dan update OS, package, serta dependensi server secara berkala untuk menjaga keamanan dan stabilitas.',
        status: 'Backlog', priority: 'High', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T1-CL1', text: 'Audit patch yang tersedia (OS, framework, library)', completed: false },
          { id: 'TP004-T1-CL2', text: 'Jadwalkan maintenance window (koordinasi dengan tim)', completed: false },
          { id: 'TP004-T1-CL3', text: 'Backup penuh sebelum patch diterapkan', completed: false },
          { id: 'TP004-T1-CL4', text: 'Terapkan patch di staging environment dan verifikasi', completed: false },
          { id: 'TP004-T1-CL5', text: 'Terapkan patch di production dan monitoring', completed: false },
          { id: 'TP004-T1-CL6', text: 'Dokumentasi patch yang diterapkan di change log', completed: false },
        ]
      },
      {
        id: 'TP004-T2', title: 'Monitoring & Optimasi Performa Server',
        description: 'Analisis dan optimasi penggunaan sumber daya server (CPU, RAM, disk, network) untuk mencegah bottleneck.',
        status: 'Backlog', priority: 'High', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T2-CL1', text: 'Review dashboard monitoring (CPU, RAM, disk I/O, network)', completed: false },
          { id: 'TP004-T2-CL2', text: 'Analisis log aplikasi dan error log server', completed: false },
          { id: 'TP004-T2-CL3', text: 'Identifikasi proses dan query yang boros sumber daya', completed: false },
          { id: 'TP004-T2-CL4', text: 'Optimasi konfigurasi web server (worker, buffer, cache)', completed: false },
          { id: 'TP004-T2-CL5', text: 'Verifikasi alert threshold sudah dikonfigurasi', completed: false },
        ]
      },
      {
        id: 'TP004-T3', title: 'Backup Berkala & Verifikasi',
        description: 'Pelaksanaan dan verifikasi backup database serta file sistem secara berkala sesuai kebijakan retention.',
        status: 'Backlog', priority: 'High', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T3-CL1', text: 'Jalankan backup database (full + incremental)', completed: false },
          { id: 'TP004-T3-CL2', text: 'Backup file aplikasi dan konfigurasi server', completed: false },
          { id: 'TP004-T3-CL3', text: 'Test restore backup ke environment staging', completed: false },
          { id: 'TP004-T3-CL4', text: 'Upload backup ke penyimpanan offsite/cloud', completed: false },
          { id: 'TP004-T3-CL5', text: 'Hapus backup lama sesuai kebijakan retensi', completed: false },
        ]
      },
      {
        id: 'TP004-T4', title: 'Manajemen SSL & Domain',
        description: 'Pemantauan dan pembaruan sertifikat SSL, pengelolaan domain, dan konfigurasi DNS.',
        status: 'Backlog', priority: 'Medium', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T4-CL1', text: 'Cek masa berlaku semua sertifikat SSL', completed: false },
          { id: 'TP004-T4-CL2', text: 'Perbarui/renew sertifikat SSL yang akan kadaluarsa (≤30 hari)', completed: false },
          { id: 'TP004-T4-CL3', text: 'Verifikasi redirect HTTP → HTTPS berfungsi', completed: false },
          { id: 'TP004-T4-CL4', text: 'Cek dan perbarui DNS records jika diperlukan', completed: false },
        ]
      },
      {
        id: 'TP004-T5', title: 'Review & Pembersihan Disk',
        description: 'Pembersihan ruang disk dari file log lama, cache, file temporari, dan artefak build yang tidak diperlukan.',
        status: 'Backlog', priority: 'Medium', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T5-CL1', text: 'Analisis penggunaan disk per direktori (du -sh)', completed: false },
          { id: 'TP004-T5-CL2', text: 'Kompres dan arsipkan log file yang lebih dari 30 hari', completed: false },
          { id: 'TP004-T5-CL3', text: 'Hapus file temporari, cache, dan session lama', completed: false },
          { id: 'TP004-T5-CL4', text: 'Hapus Docker image / container yang tidak dipakai', completed: false },
          { id: 'TP004-T5-CL5', text: 'Verifikasi sisa disk space minimal 20% tersedia', completed: false },
        ]
      },
      {
        id: 'TP004-T6', title: 'Penanganan Insiden Server',
        description: 'Prosedur standar penanganan insiden server: identifikasi, isolasi, perbaikan, dan post-mortem.',
        status: 'Backlog', priority: 'High', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T6-CL1', text: 'Identifikasi dan dokumentasi insiden (jenis, waktu, dampak)', completed: false },
          { id: 'TP004-T6-CL2', text: 'Eskalasi ke tim terkait sesuai severity', completed: false },
          { id: 'TP004-T6-CL3', text: 'Isolasi komponen bermasalah untuk mencegah dampak lanjutan', completed: false },
          { id: 'TP004-T6-CL4', text: 'Eksekusi perbaikan dan verifikasi sistem kembali normal', completed: false },
          { id: 'TP004-T6-CL5', text: 'Buat laporan post-mortem dan root cause analysis', completed: false },
        ]
      },
      {
        id: 'TP004-T7', title: 'Audit Keamanan Infrastruktur Rutin',
        description: 'Pemeriksaan rutin konfigurasi keamanan, hak akses, dan aktivitas mencurigakan di infrastruktur hosting.',
        status: 'Backlog', priority: 'High', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T7-CL1', text: 'Review daftar user dan hak akses SSH', completed: false },
          { id: 'TP004-T7-CL2', text: 'Periksa log akses untuk aktivitas mencurigakan', completed: false },
          { id: 'TP004-T7-CL3', text: 'Verifikasi konfigurasi firewall masih sesuai policy', completed: false },
          { id: 'TP004-T7-CL4', text: 'Scan malware / rootkit di server', completed: false },
        ]
      },
      {
        id: 'TP004-T8', title: 'Laporan Kesehatan Infrastruktur',
        description: 'Penyusunan laporan bulanan tentang kondisi infrastruktur, uptime, insiden, dan rencana perbaikan.',
        status: 'Backlog', priority: 'Low', type: 'Maintenance',
        checklist: [
          { id: 'TP004-T8-CL1', text: 'Kumpulkan data uptime, insiden, dan performa bulan ini', completed: false },
          { id: 'TP004-T8-CL2', text: 'Susun ringkasan eksekutif kondisi infrastruktur', completed: false },
          { id: 'TP004-T8-CL3', text: 'Identifikasi tren dan risiko ke depan', completed: false },
          { id: 'TP004-T8-CL4', text: 'Distribusikan laporan ke stakeholder terkait', completed: false },
        ]
      },
    ])
  },

  // ═══════════════════════════════════════════════════════
  // TP005 — Manajemen API & Integrasi
  // ═══════════════════════════════════════════════════════
  {
    id_template: 'TP005',
    nama_template: 'Manajemen API & Integrasi',
    deskripsi: 'Template operasional untuk pengelolaan, pemeliharaan, dan monitoring API: health check rutin, pembaruan versi, penanganan error, dan manajemen integrasi dengan sistem pihak ketiga.',
    kategori: 'API Service',
    tipe_tugas: 'API Service',
    mode_kanban: 'Operational',
    kolom_papan: JSON.stringify(kolomOperasional),
    tugas: JSON.stringify([
      {
        id: 'TP005-T1', title: 'API Health Check & Monitoring',
        description: 'Pemantauan rutin ketersediaan, latensi, dan performa semua endpoint API yang berjalan di produksi.',
        status: 'Backlog', priority: 'High', type: 'API Service',
        checklist: [
          { id: 'TP005-T1-CL1', text: 'Verifikasi semua endpoint API merespons (status 200)', completed: false },
          { id: 'TP005-T1-CL2', text: 'Cek latensi rata-rata respons API (<500ms)', completed: false },
          { id: 'TP005-T1-CL3', text: 'Review error rate (target <1% error di produksi)', completed: false },
          { id: 'TP005-T1-CL4', text: 'Cek kapasitas request/minute dan throttling', completed: false },
          { id: 'TP005-T1-CL5', text: 'Verifikasi API gateway dan load balancer berfungsi', completed: false },
        ]
      },
      {
        id: 'TP005-T2', title: 'Pembaruan & Versioning API',
        description: 'Perencanaan dan pelaksanaan pembaruan versi API dengan memastikan backward compatibility.',
        status: 'Backlog', priority: 'High', type: 'API Service',
        checklist: [
          { id: 'TP005-T2-CL1', text: 'Identifikasi breaking changes vs non-breaking changes', completed: false },
          { id: 'TP005-T2-CL2', text: 'Pembuatan API version baru (v2, v3) jika diperlukan', completed: false },
          { id: 'TP005-T2-CL3', text: 'Update dokumentasi API (Swagger/OpenAPI spec)', completed: false },
          { id: 'TP005-T2-CL4', text: 'Notifikasi konsumen API terdampak tentang perubahan', completed: false },
          { id: 'TP005-T2-CL5', text: 'Pengujian regression semua endpoint setelah update', completed: false },
          { id: 'TP005-T2-CL6', text: 'Deprecate versi lama sesuai sunset policy', completed: false },
        ]
      },
      {
        id: 'TP005-T3', title: 'Manajemen API Key & Keamanan',
        description: 'Pengelolaan API key, token autentikasi, dan keamanan akses API termasuk rate limiting dan IP whitelisting.',
        status: 'Backlog', priority: 'High', type: 'API Service',
        checklist: [
          { id: 'TP005-T3-CL1', text: 'Audit daftar API key aktif dan pemiliknya', completed: false },
          { id: 'TP005-T3-CL2', text: 'Rotasi API key yang sudah lebih dari 90 hari', completed: false },
          { id: 'TP005-T3-CL3', text: 'Verifikasi konfigurasi rate limiting per API key', completed: false },
          { id: 'TP005-T3-CL4', text: 'Review log akses untuk deteksi penyalahgunaan', completed: false },
          { id: 'TP005-T3-CL5', text: 'Update whitelist IP jika ada perubahan dari partner', completed: false },
        ]
      },
      {
        id: 'TP005-T4', title: 'Penanganan Error & Incident API',
        description: 'Identifikasi, diagnosa, dan perbaikan error API produksi dengan standar penanganan insiden yang jelas.',
        status: 'Backlog', priority: 'High', type: 'API Service',
        checklist: [
          { id: 'TP005-T4-CL1', text: 'Analisis error log API (5xx, 4xx, timeout)', completed: false },
          { id: 'TP005-T4-CL2', text: 'Identifikasi root cause error yang sering muncul', completed: false },
          { id: 'TP005-T4-CL3', text: 'Perbaiki bug dan deploy hotfix ke produksi', completed: false },
          { id: 'TP005-T4-CL4', text: 'Notifikasi pengguna API yang terdampak', completed: false },
          { id: 'TP005-T4-CL5', text: 'Dokumentasikan insiden dan tindakan korektif', completed: false },
        ]
      },
      {
        id: 'TP005-T5', title: 'Integrasi & Sinkronisasi Data Pihak Ketiga',
        description: 'Pemeliharaan dan monitoring integrasi dengan sistem eksternal: webhook, data sync, dan API partner.',
        status: 'Backlog', priority: 'Medium', type: 'API Service',
        checklist: [
          { id: 'TP005-T5-CL1', text: 'Verifikasi webhook berjalan normal (delivery rate, retry)', completed: false },
          { id: 'TP005-T5-CL2', text: 'Cek sinkronisasi data dengan sistem eksternal', completed: false },
          { id: 'TP005-T5-CL3', text: 'Verifikasi credential API partner masih valid', completed: false },
          { id: 'TP005-T5-CL4', text: 'Update mapping data jika ada perubahan skema dari partner', completed: false },
        ]
      },
      {
        id: 'TP005-T6', title: 'Optimasi Performa & Caching API',
        description: 'Analisis dan optimasi kecepatan respons API dengan implementasi caching dan query optimization.',
        status: 'Backlog', priority: 'Medium', type: 'API Service',
        checklist: [
          { id: 'TP005-T6-CL1', text: 'Identifikasi endpoint API dengan latensi tinggi', completed: false },
          { id: 'TP005-T6-CL2', text: 'Implementasi atau optimasi caching (Redis, CDN)', completed: false },
          { id: 'TP005-T6-CL3', text: 'Optimasi query database yang dipanggil oleh API', completed: false },
          { id: 'TP005-T6-CL4', text: 'Load testing setelah optimasi untuk verifikasi peningkatan', completed: false },
        ]
      },
    ])
  },

  // ═══════════════════════════════════════════════════════
  // TP006 — Deployment & CI/CD Pipeline
  // ═══════════════════════════════════════════════════════
  {
    id_template: 'TP006',
    nama_template: 'Deployment & CI/CD Pipeline',
    deskripsi: 'Template proyek setup dan otomatisasi pipeline CI/CD: konfigurasi build automation, automated testing, staging/production deployment, dan monitoring pasca-deployment.',
    kategori: 'Development',
    tipe_tugas: 'Development',
    mode_kanban: 'Project',
    kolom_papan: JSON.stringify(kolomProyek),
    tugas: JSON.stringify([
      {
        id: 'TP006-T1', title: 'Perencanaan & Desain CI/CD Pipeline',
        description: 'Mendefinisikan strategi branching, deployment pipeline, environment, dan toolchain yang akan digunakan.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP006-T1-CL1', text: 'Pilih platform CI/CD (GitHub Actions, GitLab CI, Jenkins, dll)', completed: false },
          { id: 'TP006-T1-CL2', text: 'Definisikan branching strategy (GitFlow, trunk-based)', completed: false },
          { id: 'TP006-T1-CL3', text: 'Rancang pipeline stages: build → test → staging → prod', completed: false },
          { id: 'TP006-T1-CL4', text: 'Identifikasi environment: development, staging, production', completed: false },
          { id: 'TP006-T1-CL5', text: 'Dokumentasi pipeline design dan approval process', completed: false },
        ]
      },
      {
        id: 'TP006-T2', title: 'Setup Build Automation',
        description: 'Konfigurasi proses build otomatis: kompilasi, bundling, dependency installation, dan artifact creation.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP006-T2-CL1', text: 'Konfigurasi file pipeline CI (YAML workflow/Jenkinsfile)', completed: false },
          { id: 'TP006-T2-CL2', text: 'Setup dependency caching untuk percepat build', completed: false },
          { id: 'TP006-T2-CL3', text: 'Konfigurasi environment variables & secrets di CI platform', completed: false },
          { id: 'TP006-T2-CL4', text: 'Build Docker image (jika containerized)', completed: false },
          { id: 'TP006-T2-CL5', text: 'Push artifact ke registry (Docker Hub, ECR, Artifactory)', completed: false },
        ]
      },
      {
        id: 'TP006-T3', title: 'Integrasi Automated Testing',
        description: 'Integrasi unit test, integration test, dan end-to-end test ke dalam pipeline agar berjalan otomatis di setiap push.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP006-T3-CL1', text: 'Integrasi unit testing ke pipeline (pytest, Jest, JUnit)', completed: false },
          { id: 'TP006-T3-CL2', text: 'Integrasi integration testing (API test, database test)', completed: false },
          { id: 'TP006-T3-CL3', text: 'Setup code coverage reporting (target ≥70%)', completed: false },
          { id: 'TP006-T3-CL4', text: 'Integrasi static code analysis (SonarQube, ESLint)', completed: false },
          { id: 'TP006-T3-CL5', text: 'Konfigurasi pipeline agar gagal jika test tidak lulus', completed: false },
        ]
      },
      {
        id: 'TP006-T4', title: 'Setup Staging Environment & Deployment',
        description: 'Konfigurasi deployment otomatis ke staging environment untuk pengujian sebelum masuk produksi.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP006-T4-CL1', text: 'Provisioning server/container staging environment', completed: false },
          { id: 'TP006-T4-CL2', text: 'Konfigurasi deployment otomatis ke staging saat merge ke branch develop', completed: false },
          { id: 'TP006-T4-CL3', text: 'Setup database migration otomatis di staging', completed: false },
          { id: 'TP006-T4-CL4', text: 'Konfigurasi smoke test otomatis pasca-deploy staging', completed: false },
        ]
      },
      {
        id: 'TP006-T5', title: 'Setup Production Deployment & Rollback',
        description: 'Konfigurasi deployment ke produksi dengan approval gate, zero-downtime strategy, dan kemampuan rollback otomatis.',
        status: 'Backlog', priority: 'High', type: 'Development',
        checklist: [
          { id: 'TP006-T5-CL1', text: 'Konfigurasi approval gate sebelum deploy ke production', completed: false },
          { id: 'TP006-T5-CL2', text: 'Implementasi deployment strategy (blue-green/canary/rolling)', completed: false },
          { id: 'TP006-T5-CL3', text: 'Setup automated rollback jika smoke test gagal', completed: false },
          { id: 'TP006-T5-CL4', text: 'Konfigurasi database migration yang aman (backward-compatible)', completed: false },
          { id: 'TP006-T5-CL5', text: 'Test skenario rollback secara manual', completed: false },
        ]
      },
      {
        id: 'TP006-T6', title: 'Monitoring & Alerting Pipeline',
        description: 'Setup monitoring kesehatan pipeline CI/CD, alerting kegagalan build/deploy, dan dashboard visibilitas.',
        status: 'Backlog', priority: 'Medium', type: 'Development',
        checklist: [
          { id: 'TP006-T6-CL1', text: 'Konfigurasi notifikasi kegagalan pipeline (Slack, email)', completed: false },
          { id: 'TP006-T6-CL2', text: 'Setup dashboard deployment frequency dan lead time', completed: false },
          { id: 'TP006-T6-CL3', text: 'Monitoring aplikasi pasca-deploy (APM, error tracking)', completed: false },
          { id: 'TP006-T6-CL4', text: 'Dokumentasi prosedur penggunaan dan troubleshooting pipeline', completed: false },
        ]
      },
    ])
  },

];

async function main() {
  console.log('\n🧹 [1/8] Membersihkan seluruh database...\n');

  await prisma.dokumentasiTugas.deleteMany();
  await prisma.notifikasi.deleteMany();
  await prisma.lampiran.deleteMany();
  await prisma.daftarPeriksa.deleteMany();
  await prisma.komentar.deleteMany();
  await prisma.kontributorTugas.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.kolomPapan.deleteMany();
  await prisma.anggotaProyek.deleteMany();
  await prisma.proyek.deleteMany();
  await prisma.templateProyek.deleteMany();
  await prisma.pengguna.deleteMany();

  console.log('✅ Database bersih.\n');

  // ──────────────────────────────────────────────────────────
  // 1. PENGGUNA
  // ──────────────────────────────────────────────────────────
  console.log('👤 [2/8] Seeding Pengguna...');
  await prisma.pengguna.createMany({
    data: [
      { id_pengguna: 'P001', nama: 'Amelia Waruwu',  email: 'amelia@kroombox.com', whatsapp: '+6281234567890', kata_sandi: 'admin',   peran: 'Admin',  foto_profil: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia' },
      { id_pengguna: 'P002', nama: 'Budi Santoso',   email: 'budi@kroombox.com',   whatsapp: '+6282345678901', kata_sandi: 'user123', peran: 'Member', foto_profil: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi'   },
      { id_pengguna: 'P003', nama: 'Citra Dewi',     email: 'citra@kroombox.com',  whatsapp: '+6283456789012', kata_sandi: 'user',    peran: 'Member', foto_profil: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Citra'  },
      { id_pengguna: 'P004', nama: 'Deni Kurniawan', email: 'deni@kroombox.com',   whatsapp: '+6284567890123', kata_sandi: 'user',    peran: 'Member', foto_profil: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deni'   },
      { id_pengguna: 'P005', nama: 'Eva Susanti',    email: 'eva@kroombox.com',    whatsapp: '+6285678901234', kata_sandi: 'user',    peran: 'Member', foto_profil: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva'    },
    ]
  });
  console.log('   ✅ 5 pengguna dibuat.\n');

  // ──────────────────────────────────────────────────────────
  // 2. PROYEK + KOLOM PAPAN
  // ──────────────────────────────────────────────────────────
  console.log('📁 [3/8] Seeding Proyek & Kolom Papan...');
  await prisma.proyek.create({
    data: {
      id_proyek: 'PR001', nama_proyek: 'Inti KroomSpace',
      deskripsi: 'Pengembangan sistem utama KroomSpace - platform manajemen proyek berbasis AI.',
      tipe_tugas: 'Development', mode_kanban: 'Project',
      dibuat_pada: new Date('2026-01-01'), id_pengguna: 'P001',
      kolom_papan: { create: [
        { id_kolom: 'KB001', judul_kolom: 'Backlog',     status_tugas: 'Backlog',     urutan: 0 },
        { id_kolom: 'KB002', judul_kolom: 'To Do',       status_tugas: 'To Do',       urutan: 1 },
        { id_kolom: 'KB003', judul_kolom: 'In Progress', status_tugas: 'In Progress', urutan: 2 },
        { id_kolom: 'KB004', judul_kolom: 'Review',      status_tugas: 'Review',      urutan: 3 },
        { id_kolom: 'KB005', judul_kolom: 'Done',        status_tugas: 'Done',        urutan: 4 },
      ]},
    },
  });

  await prisma.proyek.create({
    data: {
      id_proyek: 'PR002', nama_proyek: 'Pemeliharaan Q1',
      deskripsi: 'Tugas pemeliharaan operasional triwulanan untuk infrastruktur Kroombox.',
      tipe_tugas: 'Maintenance', mode_kanban: 'Operational',
      dibuat_pada: new Date('2026-03-15'), id_pengguna: 'P001',
      kolom_papan: { create: [
        { id_kolom: 'KB006', judul_kolom: 'Backlog',       status_tugas: 'Backlog',     urutan: 0 },
        { id_kolom: 'KB007', judul_kolom: 'Input Masalah', status_tugas: 'To Do',       urutan: 1 },
        { id_kolom: 'KB008', judul_kolom: 'Pengerjaan',    status_tugas: 'In Progress', urutan: 2 },
        { id_kolom: 'KB009', judul_kolom: 'Verifikasi',    status_tugas: 'Review',      urutan: 3 },
        { id_kolom: 'KB010', judul_kolom: 'Selesai',       status_tugas: 'Done',        urutan: 4 },
      ]},
    },
  });

  await prisma.anggotaProyek.createMany({ data: [
    { id_proyek: 'PR001', id_pengguna: 'P002' },
    { id_proyek: 'PR001', id_pengguna: 'P003' },
    { id_proyek: 'PR002', id_pengguna: 'P002' },
    { id_proyek: 'PR002', id_pengguna: 'P003' },
    { id_proyek: 'PR002', id_pengguna: 'P004' },
  ]});
  console.log('   ✅ 2 proyek, 10 kolom, 5 anggota dibuat.\n');

  // ──────────────────────────────────────────────────────────
  // 3. TUGAS
  // ──────────────────────────────────────────────────────────
  console.log('✅ [4/8] Seeding Tugas...');
  await prisma.tugas.create({ data: {
    id_tugas: 'T001', id_proyek: 'PR001', id_penanggung_jawab: 'P002',
    judul_tugas: 'Perbaiki Bug Login', deskripsi: 'Pengguna tidak dapat login menggunakan akun Google SSO.',
    status: 'In Progress', prioritas: 'High', tipe: 'Bug Fix', batas_waktu: new Date('2026-04-06'), dibuat_pada: new Date('2026-04-01'),
    kontributor: { create: [{ id_pengguna: 'P001' }, { id_pengguna: 'P003' }] },
    komentar: { create: [{ id_komentar: 'KM001', id_pengguna: 'P001', isi_komentar: 'Saya juga melihat bug ini di perangkat seluler. Perlu ditangani segera.', dibuat_pada: new Date('2026-04-05') }] },
    daftar_periksa: { create: [
      { id_periksa: 'CL001', teks_periksa: 'Reproduksi bug di lingkungan lokal',       apakah_selesai: true  },
      { id_periksa: 'CL002', teks_periksa: 'Identifikasi akar masalah di auth module', apakah_selesai: true  },
      { id_periksa: 'CL003', teks_periksa: 'Perbaiki logika token refresh',            apakah_selesai: false },
      { id_periksa: 'CL004', teks_periksa: 'Testing di berbagai browser',              apakah_selesai: false },
    ]},
  }});

  await prisma.tugas.create({ data: {
    id_tugas: 'T002', id_proyek: 'PR001', id_penanggung_jawab: 'P003',
    judul_tugas: 'Error API pada Dasbor', deskripsi: 'Grafik statistik tidak memuat data dari server.',
    status: 'To Do', prioritas: 'High', tipe: 'Bug Fix', batas_waktu: new Date('2026-04-07'), dibuat_pada: new Date('2026-04-02'),
    kontributor: { create: [{ id_pengguna: 'P002' }] },
    daftar_periksa: { create: [
      { id_periksa: 'CL005', teks_periksa: 'Cek endpoint API statistik di server', apakah_selesai: false },
      { id_periksa: 'CL006', teks_periksa: 'Periksa format response JSON',         apakah_selesai: false },
      { id_periksa: 'CL007', teks_periksa: 'Perbaiki CORS policy jika perlu',      apakah_selesai: false },
    ]},
  }});

  await prisma.tugas.create({ data: {
    id_tugas: 'T003', id_proyek: 'PR001',
    judul_tugas: 'Peningkatan UI Sidebar', deskripsi: 'Sidebar belum responsif di layar tablet dan mobile.',
    status: 'Backlog', prioritas: 'Low', tipe: 'Development', dibuat_pada: new Date('2026-04-03'),
    daftar_periksa: { create: [
      { id_periksa: 'CL008', teks_periksa: 'Analisis breakpoint yang diperlukan', apakah_selesai: false },
      { id_periksa: 'CL009', teks_periksa: 'Implementasi responsive CSS',         apakah_selesai: false },
      { id_periksa: 'CL010', teks_periksa: 'Testing di berbagai ukuran layar',    apakah_selesai: false },
    ]},
  }});

  await prisma.tugas.create({ data: {
    id_tugas: 'T004', id_proyek: 'PR002', id_penanggung_jawab: 'P001',
    judul_tugas: 'Website Down (Pemeliharaan Darurat)', deskripsi: 'Halaman utama tidak dapat diakses.',
    status: 'To Do', prioritas: 'High', tipe: 'Maintenance', batas_waktu: new Date('2026-04-05'), dibuat_pada: new Date('2026-04-05'),
    kontributor: { create: [{ id_pengguna: 'P002' }, { id_pengguna: 'P003' }] },
    komentar: { create: [{ id_komentar: 'KM002', id_pengguna: 'P002', isi_komentar: 'Ada masalah di konfigurasi Nginx.', dibuat_pada: new Date('2026-04-05') }] },
    daftar_periksa: { create: [
      { id_periksa: 'CL011', teks_periksa: 'Cek status server di cPanel',       apakah_selesai: true  },
      { id_periksa: 'CL012', teks_periksa: 'Periksa log error Nginx/Apache',    apakah_selesai: false },
      { id_periksa: 'CL013', teks_periksa: 'Restart service web server',        apakah_selesai: false },
      { id_periksa: 'CL014', teks_periksa: 'Verifikasi website kembali online', apakah_selesai: false },
    ]},
  }});

  await prisma.tugas.create({ data: {
    id_tugas: 'T005', id_proyek: 'PR002', id_penanggung_jawab: 'P002',
    judul_tugas: 'Server Overload (CPU 95%)', deskripsi: 'CPU server mencapai 95% menyebabkan respons lambat.',
    status: 'Review', prioritas: 'High', tipe: 'Maintenance', batas_waktu: new Date('2026-04-05'), dibuat_pada: new Date('2026-04-05'),
    daftar_periksa: { create: [
      { id_periksa: 'CL015', teks_periksa: 'Identifikasi proses penyebab beban tinggi via htop', apakah_selesai: true  },
      { id_periksa: 'CL016', teks_periksa: 'Terminasi proses zombie',                             apakah_selesai: true  },
      { id_periksa: 'CL017', teks_periksa: 'Optimasi query database yang berat',                  apakah_selesai: true  },
      { id_periksa: 'CL018', teks_periksa: 'Monitor CPU setelah perbaikan (24 jam)',              apakah_selesai: false },
    ]},
  }});

  await prisma.tugas.create({ data: {
    id_tugas: 'T006', id_proyek: 'PR001',
    judul_tugas: 'Setup CI/CD Pipeline', deskripsi: 'Konfigurasi GitHub Actions untuk otomatisasi deployment.',
    status: 'Backlog', prioritas: 'Medium', tipe: 'Development', dibuat_pada: new Date('2026-04-10'),
    daftar_periksa: { create: [
      { id_periksa: 'CL019', teks_periksa: 'Setup repository GitHub Actions workflow',  apakah_selesai: false },
      { id_periksa: 'CL020', teks_periksa: 'Konfigurasi environment variables secrets', apakah_selesai: false },
      { id_periksa: 'CL021', teks_periksa: 'Test pipeline dengan push ke branch dev',   apakah_selesai: false },
      { id_periksa: 'CL022', teks_periksa: 'Dokumentasi proses CI/CD',                  apakah_selesai: false },
    ]},
  }});

  await prisma.tugas.create({ data: {
    id_tugas: 'T007', id_proyek: 'PR002', id_penanggung_jawab: 'P004',
    judul_tugas: 'Backup Database Bulanan', deskripsi: 'Eksekusi prosedur backup dan verifikasi integritas data.',
    status: 'Done', prioritas: 'Medium', tipe: 'Maintenance', batas_waktu: new Date('2026-04-01'), dibuat_pada: new Date('2026-04-01'),
    daftar_periksa: { create: [
      { id_periksa: 'CL023', teks_periksa: 'Jalankan skrip backup otomatis',       apakah_selesai: true },
      { id_periksa: 'CL024', teks_periksa: 'Verifikasi integritas file backup',     apakah_selesai: true },
      { id_periksa: 'CL025', teks_periksa: 'Upload ke penyimpanan cloud (offsite)', apakah_selesai: true },
      { id_periksa: 'CL026', teks_periksa: 'Catat di log maintenance bulanan',      apakah_selesai: true },
    ]},
  }});
  console.log('   ✅ 7 tugas, 26 checklist dibuat.\n');

  // ──────────────────────────────────────────────────────────
  // 4. NOTIFIKASI
  // ──────────────────────────────────────────────────────────
  console.log('🔔 [5/8] Seeding Notifikasi...');
  const now = new Date();
  await prisma.notifikasi.createMany({ data: [
    { id_notifikasi: 'AC001', id_pengguna: 'P001', id_tugas: 'T004', pesan: '🚨 Website kroombox.com tidak dapat diakses!', tipe: 'Alert', sudah_dibaca: false, badge: 'URGENT', aksi_diperlukan: 'start', waktu: now },
    { id_notifikasi: 'AC002', id_pengguna: 'P002', id_tugas: 'T001', pesan: '⚠️ Tugas "Perbaiki Bug Login" mendekati deadline.', tipe: 'Warning', sudah_dibaca: false, badge: 'OVERDUE', aksi_diperlukan: 'complete', waktu: new Date(now.getTime() - 3_600_000) },
    { id_notifikasi: 'AC003', id_pengguna: 'P001', id_tugas: 'T007', pesan: '✅ Backup Database Bulanan berhasil diselesaikan.', tipe: 'Task', sudah_dibaca: true, aksi_diperlukan: 'view', waktu: new Date(now.getTime() - 7_200_000) },
    { id_notifikasi: 'AC004', id_pengguna: 'P001', id_tugas: 'T005', pesan: '💬 Komentar baru di tugas "Server Overload".', tipe: 'CRM', sudah_dibaca: false, aksi_diperlukan: 'view', waktu: new Date(now.getTime() - 10_800_000) },
    { id_notifikasi: 'AC005', id_pengguna: 'P003', id_tugas: 'T002', pesan: '📝 Status tugas "Error API pada Dasbor" diperbarui.', tipe: 'Task', sudah_dibaca: false, aksi_diperlukan: 'view', waktu: new Date(now.getTime() - 14_400_000) },
  ]});
  console.log('   ✅ 5 notifikasi dibuat.\n');

  // ──────────────────────────────────────────────────────────
  // 5. DOKUMENTASI
  // ──────────────────────────────────────────────────────────
  console.log('📄 [6/8] Seeding Dokumentasi Tugas...');
  await prisma.dokumentasiTugas.create({ data: {
    id_dokumentasi: 'DK001', id_tugas: 'T007', id_pengguna: 'P004',
    catatan_selesai: 'Backup berhasil dilakukan, total 15.2 GB. File disimpan di Google Cloud Storage.',
    kendala: 'Proses backup sempat terhenti karena koneksi timeout.',
    solusi: 'Menambahkan parameter --resume pada skrip backup.',
    dibuat_pada: new Date('2026-04-01T10:30:00'),
  }});
  console.log('   ✅ 1 dokumentasi dibuat.\n');

  // ──────────────────────────────────────────────────────────
  // 6. TEMPLATE PROYEK (AI-Generated)
  // ──────────────────────────────────────────────────────────
  console.log('🧩 [7/8] Seeding Template Proyek (AI-Generated)...');
  let totalTugas = 0;
  let totalChecklist = 0;

  for (const tmpl of templateProyek) {
    const tugasData = JSON.parse(tmpl.tugas || '[]');
    totalTugas += tugasData.length;
    for (const t of tugasData) totalChecklist += (t.checklist || []).length;

    await prisma.templateProyek.create({ data: tmpl });
  }

  console.log(`   ✅ ${templateProyek.length} template proyek dibuat.`);
  console.log(`   📋 Total: ${totalTugas} tugas template, ${totalChecklist} item checklist.\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Seeding selesai! Ringkasan:');
  console.log('   - 5 Pengguna (P001–P005)');
  console.log('   - 2 Proyek (PR001–PR002) + 10 Kolom (KB001–KB010)');
  console.log('   - 7 Tugas (T001–T007) + 26 Checklist (CL001–CL026)');
  console.log('   - 5 Notifikasi (AC001–AC005)');
  console.log('   - 1 Dokumentasi (DK001)');
  console.log(`   - ${templateProyek.length} Template Proyek (TP001–TP006)`);
  console.log(`     → ${totalTugas} tugas template, ${totalChecklist} checklist`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error('❌ Seeding GAGAL:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
