# KroomSpace

**KroomSpace** adalah platform manajemen proyek berbasis AI (*AI-powered Project Management*) yang dirancang khusus untuk memonitor, mengelola, serta memelihara alur kerja operasional infrastruktur **Kroombox**.

Aplikasi ini menggunakan arsitektur **Unified React (Vite) + Express (Node.js)** dengan pemisahan struktur folder frontend dan backend yang terorganisir namun tetap dijalankan dalam satu kesatuan.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (TypeScript), Vite, Tailwind CSS, Lucide Icons, Motion/Framer Motion.
- **Backend**: Node.js (Express), TypeScript, TSX Watch.
- **Database / ORM**: Prisma Client (SQLite / PostgreSQL).
- **AI Integration**: Google Gemini API (`@google/genai` sdk).
- **Lainnya**: Nodemailer (untuk pengiriman OTP email).

---

## 📁 Struktur Proyek

Proyek ini telah dipisahkan secara struktural untuk memudahkan pengembangan:

```
Kroomspace/
├── frontend/             # 🎨 Client-side (React + Vite)
│   ├── index.html
│   └── src/
│       ├── components/   # Komponen UI (Landing, Kanban, Admin, dll.)
│       ├── context/      # Language & App states
│       ├── services/     # API Integration & Mock data
│       └── ...
├── backend/              # ⚙️ Server-side (Express.js)
│   ├── server.ts         # Main Entrypoint API Server
│   └── lib/
│       └── prisma.ts     # Inisialisasi Prisma Client (Aman)
├── prisma/               # 🗄️ Skema Database & Seeder
│   ├── schema.prisma
│   └── seed.ts           # Seeder database utama
├── package.json          # Script & Dependensi Node.js
├── vite.config.ts        # Konfigurasi bundling Vite
└── tsconfig.json         # Konfigurasi TypeScript paths
```

---

## 🚀 Cara Menjalankan Secara Lokal

### **Prasyarat:**
- Node.js (versi LTS direkomendasikan)
- NPM atau Yarn

### **Langkah-langkah:**

1. **Instal Dependensi**
   Jalankan perintah ini di root folder untuk mengunduh modul Node:
   ```bash
   npm install
   ```

2. **Pengaturan Environment (.env)**
   Salin file `.env.example` menjadi `.env` di root direktori Anda:
   ```bash
   cp .env.example .env
   ```
   Lalu buka file `.env` dan masukkan API Key Anda:
   - `GEMINI_API_KEY`: API Key dari Google AI Studio untuk menyalakan fitur asisten AI.
   - `EMAIL_USER` & `EMAIL_PASS`: Konfigurasi SMTP Gmail Anda untuk mengirimkan kode OTP Register/Reset password.

3. **Migrasi & Seed Database**
   Buat database lokal dan lakukan pengisian data awal (*seeding*):
   ```bash
   npm run db:reset
   ```

4. **Jalankan Aplikasi**
   Jalankan server pengembangan (Frontend dan Backend akan menyala bersama di port `3000`):
   ```bash
   npm run dev
   ```
   Buka browser Anda dan akses: [http://localhost:3000](http://localhost:3000)

---

## 🛡️ Keamanan Sistem

Aplikasi ini telah dilengkapi dengan beberapa lapisan keamanan standar produksi:
- **Password Hashing**: Menggunakan `bcryptjs` untuk mengamankan data pengguna di database.
- **Admin Protection**: Endpoint sensitif `/api/admin/*` diproteksi menggunakan middleware autentikasi dan pengecekan otorisasi role Admin.
- **Rate Limiting**: Membatasi serangan brute-force pada endpoint autentikasi (Login & OTP) menggunakan `express-rate-limit`.
- **Request Body Sanitizer**: Batas muatan JSON dikurangi dari `50MB` ke `5MB` guna mencegah serangan DoS (*Denial of Service*).
