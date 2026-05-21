import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { prisma } from "./src/lib/prisma";
import { generateId } from "./src/lib/idGenerator";
import nodemailer from "nodemailer";

dotenv.config();

// In-memory OTP Store
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

let transporter: nodemailer.Transporter;
const emailFrom = `"KroomSpace System" <${process.env.EMAIL_USER}>`;



// Cleanup expired OTP setiap 5 menit
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  otpStore.forEach((value, key) => {
    if (now > value.expiresAt) {
      otpStore.delete(key);
      cleanedCount++;
    }
  });
  if (cleanedCount > 0) {
    console.log(`[OTP Cleanup] Hapus ${cleanedCount} OTP expired`);
  }
}, 1 * 60 * 1000);

async function initMail() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("[Nodemailer] Ethereal email test account created.");
  }
}
initMail().catch(console.error);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Integration Endpoint
  app.post("/api/analyze-external", async (req, res) => {
    const { url } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // 1. Fetch the external content (Proxying to avoid CORS)
      const response = await fetch(url);
      const html = await response.text();
      
      // Clean up HTML to save tokens (very basic)
      const cleanText = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                            .substring(0, 10000); // Limit to first 10k chars

      // 2. Use Gemini to analyze and extract tasks
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
        Analyze the following content from an external source (${url}).
        Identify any maintenance issues, bugs, or required tasks mentioned.
        For each issue, determine:
        1. A concise title.
        2. A brief description of the problem.
        3. The priority (Low, Medium, or High) based on urgency and impact.
        4. The type (Maintenance, Bug Fix, or Development).

        Content:
        ${cleanText}

        Return the result as a JSON array of objects.
      `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                type: { type: Type.STRING, enum: ["Maintenance", "Bug Fix", "Development"] }
              },
              required: ["title", "description", "priority", "type"]
            }
          }
        }
      });

      const tasks = JSON.parse(result.text);
      res.json({ tasks });
    } catch (error) {
      console.error("External Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze external source" });
    }
  });

  app.post("/api/ai/analyze-priority", async (req, res) => {
    try {
      const { task } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(400).json({ error: "Missing API Key" });
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the priority for this task:
          Title: ${task.title}
          Description: ${task.description}
          Type: ${task.type}
          Deadline: ${task.deadline}
          Return only one word: Low, Medium, or High.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] } },
            required: ["priority"]
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI Priority Analysis failed" });
    }
  });

  app.post("/api/ai/sort-tasks", async (req, res) => {
    try {
      const { tasks } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(400).json({ error: "Missing API Key" });

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sort these tasks by priority (High to Low). 
          CRITICAL: Prioritize Maintenance tasks and tasks that mention urgent issues, bugs, or system downtime.
          Tasks:
          ${tasks.map((t:any) => `- ID: ${t.id}, Title: ${t.title}, Priority: ${t.priority}, Type: ${t.type}, Description: ${t.description}`).join('\n')}
          Return a JSON array of task IDs in the sorted order.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { sortedIds: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ["sortedIds"]
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI Task Sorting failed" });
    }
  });

  app.post("/api/ai/consultation", async (req, res) => {
    try {
      const { question, context, language } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(400).json({ error: "Missing API Key" });

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert technical maintenance assistant. A team member is asking for help with a maintenance task.
          Language Requirement: Respond strictly in ${language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English'}.
          Context:
          Project: ${context.projectTitle}
          Task: ${context.taskTitle}
          Description: ${context.description}
          Existing Checklist: ${context.checklist?.join(', ')}
          
          Question: ${question}
          
          Provide a concise, professional, and highly actionable technical solution.
          STRICT FORMATTING RULE: 
          1. NO markdown headers (NEVER use # or ## symbols).
          2. NO markdown bolding or italics (NEVER use ** or * symbols).
          3. NO hash symbols (#) even for labels.
          4. Use simple plain text.
          5. Use simple hyphens (-) for bullet points if needed.
          6. NO special icons or emojis.
          7. NO formatting characters.`,
      });
      res.json({ result: response.text.replace(/[#*]/g, '') });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI Consultation failed" });
    }
  });

  // --- API Authentication ---
  app.post("/api/auth/send-register-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "Email tidak valid" });
      }

      const existingUser = await prisma.pengguna.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      otpStore.set(`register_${email}`, { otp, expiresAt });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject: "Aktivasi Akun KroomSpace",
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: center; color: #333;">
                <h2 style="color: #111;">Account Activation</h2>
                <p style="font-size: 14px; color: #555; line-height: 1.5;">We received a request to create a KroomSpace account. Please enter the following code to verify your email and activate your account.</p>
                <div style="background-color: #FFF0F0; border: 1px dashed #FFCCCC; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <span style="color: #E53935; font-size: 24px; font-weight: bold; letter-spacing: 12px; margin-left: 12px;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #777;">For your security, this code expires in <b>5 minutes</b>.</p>
                <p style="font-size: 13px; color: #999; margin-top: 5px;">If you didn't request this, you can safely ignore this email.</p>
              </div>`,
      });
      
      console.log(`[Register Email Sent] OTP dikirim ke ${email}. Message ID: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`[Email Preview] ${nodemailer.getTestMessageUrl(info)}`);
      }

      res.json({ message: "OTP telah dikirim ke email" });
    } catch (error) {
      console.error("[Register OTP Error]", error);
      res.status(500).json({ error: "Gagal mengirim OTP. Coba lagi nanti." });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, avatar, otp } = req.body;
      
      if (!otp) {
        return res.status(400).json({ error: "OTP wajib diisi" });
      }

      const record = otpStore.get(`register_${email}`);
      if (!record) {
        return res.status(400).json({ error: "OTP tidak ditemukan atau sudah kedaluwarsa. Silakan kirim ulang OTP." });
      }
      
      if (record.otp !== otp.trim()) {
        return res.status(400).json({ error: "OTP salah. Silakan periksa kembali kode Anda." });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(`register_${email}`);
        return res.status(400).json({ error: "OTP sudah kedaluwarsa. Silakan kirim ulang OTP." });
      }

      // Cek apakah email sudah ada
      const existingUser = await prisma.pengguna.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      const newId = await generateId('pengguna', 'P', 'id_pengguna');
      const newUser = await prisma.pengguna.create({
        data: {
          id_pengguna: newId,
          nama: name,
          email,
          kata_sandi: password, // In production, hash this password!
          foto_profil: avatar,
          peran: 'Member'
        }
      });
      
      otpStore.delete(`register_${email}`);

      // Map back to frontend expected format
      res.status(201).json({
        id: newUser.id_pengguna,
        name: newUser.nama,
        email: newUser.email,
        password: newUser.kata_sandi,
        role: newUser.peran,
        avatar: newUser.foto_profil
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mendaftar" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.pengguna.findUnique({ where: { email } });
      
      if (!user || user.kata_sandi !== password) {
        return res.status(401).json({ error: "Email atau kata sandi salah" });
      }

      res.json({
        id: user.id_pengguna,
        name: user.nama,
        email: user.email,
        password: user.kata_sandi,
        role: user.peran,
        avatar: user.foto_profil
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal login" });
    }
  });

   app.post("/api/auth/forgot-password", async (req, res) => {
     try {
       const { email } = req.body;
       
       // Validasi email
       if (!email || typeof email !== 'string' || !email.includes('@')) {
         return res.status(400).json({ error: "Email tidak valid" });
       }

       const user = await prisma.pengguna.findUnique({ where: { email } });
       if (!user) {
         console.warn(`[Forgot Password] Email tidak ditemukan: ${email}`);
         return res.status(404).json({ error: "Email tidak ditemukan" });
       }

       const otp = Math.floor(1000 + Math.random() * 9000).toString();
       const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
       otpStore.set(email, { otp, expiresAt });

       console.log(`[OTP Generated] Email: ${email}, OTP: ${otp}, Expires at: ${new Date(expiresAt).toISOString()}`);

       const info = await transporter.sendMail({
         from: emailFrom,
         to: email,
         subject: "Kode OTP Reset Password KroomSpace",
         html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: center; color: #333;">
                  <h2 style="color: #111;">Password Reset Request</h2>
                  <p style="font-size: 14px; color: #555; line-height: 1.5;">We received a request to reset your password. Please enter the following code to verify your identity and create a new password.</p>
                  <div style="background-color: #FFF0F0; border: 1px dashed #FFCCCC; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <span style="color: #E53935; font-size: 24px; font-weight: bold; letter-spacing: 12px; margin-left: 12px;">${otp}</span>
                  </div>
                  <p style="font-size: 14px; color: #777;">For your security, this code expires in <b>5 minutes</b>.</p>
                  <p style="font-size: 13px; color: #999; margin-top: 5px;">If you didn't request a password reset, you can safely ignore this email.</p>
                </div>`,
       });

       console.log(`[Email Sent] OTP dikirim ke ${email}. Message ID: ${info.messageId}`);
       if (nodemailer.getTestMessageUrl(info)) {
         console.log(`[Email Preview] ${nodemailer.getTestMessageUrl(info)}`);
       }

       res.json({ message: "OTP telah dikirim ke email" });
     } catch (error) {
       console.error("[Forgot Password Error]", error);
       res.status(500).json({ error: "Gagal mengirim OTP. Coba lagi nanti." });
     }
   });

  app.post("/api/auth/verify-otp", (req, res) => {
    try {
      const { email, otp } = req.body;
      
      // Validasi input
      if (!email || !otp) {
        return res.status(400).json({ error: "Email dan OTP harus diisi" });
      }

      const record = otpStore.get(email);
      if (!record) {
        console.warn(`[OTP Verify] OTP tidak ditemukan untuk email: ${email}`);
        return res.status(400).json({ error: "OTP tidak valid atau sudah kedaluwarsa" });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        console.warn(`[OTP Verify] OTP sudah expired untuk email: ${email}`);
        return res.status(400).json({ error: "OTP sudah kedaluwarsa" });
      }

      if (record.otp !== otp) {
        console.warn(`[OTP Verify] OTP salah untuk email: ${email}. Expected: ${record.otp}, Got: ${otp}`);
        return res.status(400).json({ error: "OTP salah" });
      }

      console.log(`[OTP Valid] Email: ${email}`);
      res.json({ message: "OTP valid" });
    } catch (error) {
      console.error("[OTP Verify Error]", error);
      res.status(500).json({ error: "Gagal verifikasi OTP" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, password, otp } = req.body;
      
      // Validasi input
      if (!email || !password || !otp) {
        return res.status(400).json({ error: "Email, password, dan OTP harus diisi" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password minimal 6 karakter" });
      }

      const record = otpStore.get(email);
      if (!record) {
        console.warn(`[Reset Password] OTP tidak ditemukan untuk: ${email}`);
        return res.status(400).json({ error: "Sesi OTP tidak valid. Silakan ulangi proses lupa sandi." });
      }

      if (record.otp !== otp) {
        console.warn(`[Reset Password] OTP salah untuk: ${email}`);
        return res.status(400).json({ error: "OTP tidak cocok. Silakan ulangi." });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        console.warn(`[Reset Password] OTP expired untuk: ${email}`);
        return res.status(400).json({ error: "Sesi OTP sudah kedaluwarsa. Silakan ulangi proses lupa sandi." });
      }

      await prisma.pengguna.update({
        where: { email },
        data: { kata_sandi: password }
      });
      
      otpStore.delete(email);
      console.log(`[Password Reset] Berhasil untuk email: ${email}`);
      res.json({ message: "Password berhasil diubah" });
    } catch (error) {
      console.error("[Reset Password Error]", error);
      res.status(500).json({ error: "Gagal mereset password" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await prisma.pengguna.findMany();
      res.json(users.map(u => ({
        id: u.id_pengguna,
        name: u.nama,
        email: u.email,
        password: u.kata_sandi,
        role: u.peran,
        avatar: u.foto_profil
      })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil data users" });
    }
  });

  // --- API Endpoints CRUD Dasar (Prisma) ---

  // 1. Ambil semua Proyek
  app.get("/api/proyek", async (req, res) => {
    try {
      const proyek = await prisma.proyek.findMany({
        include: { kolom_papan: true }
      });
      res.json(proyek);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil data proyek" });
    }
  });

  // 2. Buat Proyek baru
  app.post("/api/proyek", async (req, res) => {
    try {
      const { nama_proyek, tipe_tugas, mode_kanban, deskripsi, columns } = req.body;
      const newId = await generateId('proyek', 'PRJ', 'id_proyek');
      const proyekBaru = await prisma.proyek.create({
        data: {
          id_proyek: newId,
          nama_proyek,
          tipe_tugas,
          mode_kanban,
          deskripsi,
          ...(columns && columns.length > 0 && {
            kolom_papan: {
              create: columns.map((c: any) => ({
                id_kolom: c.id ? (c.id.startsWith(newId) ? c.id : `${newId}-${c.id}`) : `col-${Date.now()}-${Math.random()}`,
                judul_kolom: c.title,
                status_tugas: c.status,
                urutan: c.order
              }))
            }
          })
        },
        include: { kolom_papan: true }
      });
      res.status(201).json(proyekBaru);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat proyek" });
    }
  });

  // 2.1 Update Proyek
  app.put("/api/proyek/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_proyek, tipe_tugas, mode_kanban, deskripsi, columns } = req.body;
      
      const proyekUpdated = await prisma.proyek.update({
        where: { id_proyek: id },
        data: {
          ...(nama_proyek && { nama_proyek }),
          ...(tipe_tugas && { tipe_tugas }),
          ...(mode_kanban && { mode_kanban }),
          ...(deskripsi !== undefined && { deskripsi }),
        }
      });

      if (columns !== undefined) {
        await prisma.kolomPapan.deleteMany({ where: { id_proyek: id } });
        if (columns && columns.length > 0) {
          await prisma.kolomPapan.createMany({
            data: columns.map((c: any) => ({
              id_kolom: c.id ? (c.id.startsWith(id) ? c.id : `${id}-${c.id}`) : `col-${Date.now()}-${Math.random()}`,
              id_proyek: id,
              judul_kolom: c.title,
              status_tugas: c.status,
              urutan: c.order
            }))
          });
        }
      }

      res.json(proyekUpdated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memperbarui proyek" });
    }
  });

  // --- WEBHOOK INTEGRATION (CRM -> KroomSpace) ---
  app.post("/api/webhook/crm-incident", async (req, res) => {
    try {
      // Data payload dari web CRM teman Anda
      const { incidentId, title, description, urgency, customerPhone } = req.body;
      
      // 1. Buat Tugas Otomatis di Papan Kanban
      const taskId = await generateId('tugas', 'TSK', 'id_tugas');
      const firstProject = await prisma.proyek.findFirst();
      
      if (firstProject) {
        const newTask = await prisma.tugas.create({
          data: {
            id_tugas: taskId,
            judul_tugas: `[CRM INCIDENT ${incidentId || 'NEW'}] ${title || 'Laporan Pengguna Baru'}`,
            deskripsi: description || 'Tugas ini dibuat otomatis oleh sistem terintegrasi Web CRM.',
            status: 'Backlog',
            prioritas: urgency || 'High',
            tipe: 'CRM Incident',
            id_proyek: firstProject.id_proyek,
          }
        });

        // 2. Buat Notifikasi Internal di Aplikasi
        await prisma.notifikasi.create({
          data: {
            id_notifikasi: `notif-${Date.now()}`,
            id_pengguna: 'P001', // Asumsi Admin/PIC pertama
            tipe: 'CRM',
            pesan: `Insiden CRM Baru: ${title}`,
            waktu: new Date(),
            sudah_dibaca: false,
            aksi_diperlukan: 'view',
            badge: 'URGENT'
          }
        });

        // 3. Simulasi Eksekusi Bot WhatsApp
        const waMessage = `🚨 *INSIDEN CRM BARU (KroomSpace)* 🚨\n\n*ID:* ${incidentId}\n*Judul:* ${title}\n*Prioritas:* ${urgency}\n\nMohon segera dicek di Papan Kanban!`;
        console.log("\n========================================================");
        console.log("🟢 [WHATSAPP BOT API] MENGIRIM PESAN KE GRUP TIM TEKNIS...");
        console.log(`Isi Pesan:\n${waMessage}`);
        if (customerPhone) {
           console.log(`\n🟢 [WHATSAPP BOT API] Mengirim konfirmasi penerimaan tiket ke pelanggan (${customerPhone})...`);
        }
        console.log("========================================================\n");

        res.status(201).json({ 
          success: true, 
          message: "Insiden CRM berhasil masuk ke Kanban dan Bot WA berhasil ditrigger (Simulasi).",
          task: newTask
        });
      } else {
        res.status(400).json({ error: "Belum ada proyek di sistem untuk menampung tiket ini." });
      }
    } catch (error) {
      console.error("Webhook CRM Error:", error);
      res.status(500).json({ error: "Gagal memproses Webhook CRM" });
    }
  });

  // --- WEBHOOK INTEGRATION (CPanel Kroombox -> KroomSpace) ---
  app.post("/api/webhook/kroombox-server-status", async (req, res) => {
    try {
      const { serverId, serverName, status, metric, value, description } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      let aiChecklist: string[] = [
        "Periksa CPU/Memory usage via SSH (perintah 'top' atau 'htop')",
        "Cek log error server (/var/log atau log aplikasi)",
        "Restart service/proses yang menggunakan resource berlebih"
      ];

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Server ${serverName} (ID: ${serverId}) melaporkan status ${status} untuk metrik ${metric} dengan nilai ${value}. 
            Deskripsi gangguan: "${description}".
            Berikan tepat 3 langkah pemecahan masalah (troubleshooting checklist) yang ringkas dan taktis untuk teknisi. 
            Kembalikan hasilnya sebagai JSON array berisi string saja. Contoh: ["langkah 1", "langkah 2", "langkah 3"].`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          });
          aiChecklist = JSON.parse(response.text);
        } catch (aiErr) {
          console.error("Gemini AI Checklist Generation failed, using fallback:", aiErr);
        }
      }

      // Cari proyek pertama untuk menampung tugas
      const firstProject = await prisma.proyek.findFirst();
      const taskId = await generateId('tugas', 'TSK', 'id_tugas');

      if (firstProject) {
        const newTask = await prisma.tugas.create({
          data: {
            id_tugas: taskId,
            id_proyek: firstProject.id_proyek,
            judul_tugas: `[ALARM SERVER ${status || 'ALERT'}] ${metric || 'Gangguan'} di ${serverName || 'Server'}`,
            deskripsi: description || `Peringatan otomatis dari Kroombox monitoring server. Nilai saat ini: ${value}`,
            status: 'To Do',
            prioritas: 'High',
            tipe: 'Bug Fix',
            daftar_periksa: {
              create: aiChecklist.map((step, idx) => ({
                id_periksa: `CHK-KB-${Date.now()}-${idx}`,
                teks_periksa: step,
                apakah_selesai: false
              }))
            }
          }
        });

        // 2. Buat Notifikasi Internal di Aplikasi
        await prisma.notifikasi.create({
          data: {
            id_notifikasi: `notif-kb-${Date.now()}`,
            id_pengguna: 'P001', // Diarahkan ke Admin default
            tipe: 'Alert',
            pesan: `🚨 Gangguan Server ${serverName}: ${metric} bernilai ${value}! (${status})`,
            waktu: new Date(),
            sudah_dibaca: false,
            aksi_diperlukan: 'view',
            badge: 'URGENT'
          }
        });

        // 3. Simulasi Eksekusi Bot WhatsApp
        const waMessage = `🚨 *GANGGUAN SERVER CPANEL KROOMBOX* 🚨\n\n*Server:* ${serverName}\n*Metrik:* ${metric}\n*Nilai:* ${value}\n*Status:* ${status}\n\nRekomendasi Tindakan AI:\n${aiChecklist.map((step, i) => `${i+1}. ${step}`).join('\n')}`;
        console.log("\n========================================================");
        console.log("🟢 [WHATSAPP BOT API] MENGIRIM ALERT SERVER KE TIM TEKNIS...");
        console.log(`Isi Pesan:\n${waMessage}`);
        console.log("========================================================\n");

        res.status(201).json({
          success: true,
          message: "Status Kroombox berhasil diproses dan tugas perbaikan AI telah dibuat.",
          task: newTask
        });
      } else {
        res.status(400).json({ error: "Belum ada proyek di sistem untuk menampung tiket ini." });
      }
    } catch (error) {
      console.error("Webhook Kroombox Error:", error);
      res.status(500).json({ error: "Gagal memproses Webhook Kroombox" });
    }
  });

  // Notifikasi Endpoints
  app.get("/api/notifikasi", async (req, res) => {
    try {
      const notif = await prisma.notifikasi.findMany({
        orderBy: { waktu: 'desc' }
      });
      res.json(notif);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil notifikasi" });
    }
  });

  app.post("/api/notifikasi", async (req, res) => {
    try {
      const { id_pengguna, id_tugas, pesan, tipe, sudah_dibaca } = req.body;
      const newId = await generateId('notifikasi', 'NOT', 'id_notifikasi');
      const notifBaru = await prisma.notifikasi.create({
        data: {
          id_notifikasi: newId,
          id_pengguna,
          id_tugas,
          pesan,
          tipe,
          sudah_dibaca: sudah_dibaca || false
        }
      });
      res.status(201).json(notifBaru);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat notifikasi" });
    }
  });

  app.put("/api/notifikasi/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { sudah_dibaca } = req.body;
      const notifUpdated = await prisma.notifikasi.update({
        where: { id_notifikasi: id },
        data: { sudah_dibaca }
      });
      res.json(notifUpdated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal update notifikasi" });
    }
  });

  app.delete("/api/notifikasi/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.notifikasi.delete({
        where: { id_notifikasi: id }
      });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menghapus notifikasi" });
    }
  });

  // Template Tugas Endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await prisma.templateTugas.findMany();
      res.json(templates);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const { nama_template, kategori, deskripsi, prioritas, estimasi_jam } = req.body;
      const newId = await generateId('templateTugas', 'TPL', 'id_template');
      const templateBaru = await prisma.templateTugas.create({
        data: {
          id_template: newId,
          nama_template,
          kategori,
          deskripsi,
          prioritas,
          estimasi_jam: parseInt(estimasi_jam) || 1
        }
      });
      res.status(201).json(templateBaru);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat template" });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_template, kategori, deskripsi, prioritas, estimasi_jam } = req.body;
      const templateUpdated = await prisma.templateTugas.update({
        where: { id_template: id },
        data: {
          ...(nama_template && { nama_template }),
          ...(kategori && { kategori }),
          ...(deskripsi !== undefined && { deskripsi }),
          ...(prioritas && { prioritas }),
          ...(estimasi_jam !== undefined && { estimasi_jam: parseInt(estimasi_jam) }),
        }
      });
      res.json(templateUpdated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.templateTugas.delete({
        where: { id_template: id }
      });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menghapus template" });
    }
  });

  // 3. Ambil semua Tugas
  app.get("/api/tugas", async (req, res) => {
    try {
      const tugas = await prisma.tugas.findMany({
        include: {
          proyek: true,
          penanggung_jawab: true,
          komentar: true,
          lampiran: true,
          daftar_periksa: true,

          kontributor: true,
        }
      });
      res.json(tugas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil data tugas" });
    }
  });

  // 4. Buat Tugas baru
  app.post("/api/tugas", async (req, res) => {
    try {
      const { id_proyek, judul_tugas, deskripsi, status, prioritas, tipe, id_penanggung_jawab, checklist, comments, attachments, contributors, catatan_selesai, batas_waktu } = req.body;
      const newId = await generateId('tugas', 'TSK', 'id_tugas');
      
      let baseChecklistId = checklist && checklist.length > 0 ? parseInt((await generateId('daftarPeriksa', 'CHK', 'id_periksa')).replace('CHK', '')) || 1 : 1;
      let baseCommentId = comments && comments.length > 0 ? parseInt((await generateId('komentar', 'CMT', 'id_komentar')).replace('CMT', '')) || 1 : 1;
      let baseAttachId = attachments && attachments.length > 0 ? parseInt((await generateId('lampiran', 'LMP', 'id_lampiran')).replace('LMP', '')) || 1 : 1;


      const tugasBaru = await prisma.tugas.create({
        data: {
          id_tugas: newId,
          id_proyek,
          id_penanggung_jawab: id_penanggung_jawab || null,
          judul_tugas,
          deskripsi,
          status,
          prioritas,
          tipe,
          catatan_selesai: catatan_selesai || null,
          batas_waktu: batas_waktu ? new Date(batas_waktu) : null,
          ...(contributors && contributors.length > 0 && {
            kontributor: {
              create: contributors.map((c: string) => ({ id_pengguna: c }))
            }
          }),
          ...(checklist && checklist.length > 0 && {
            daftar_periksa: {
              create: checklist.map((c: any, idx: number) => ({
                id_periksa: `CHK${(baseChecklistId + idx).toString().padStart(3, '0')}`,
                teks_periksa: c.text,
                apakah_selesai: c.completed
              }))
            }
          }),
          ...(comments && comments.length > 0 && {
            komentar: {
              create: comments.map((c: any, idx: number) => ({
                id_komentar: `CMT${(baseCommentId + idx).toString().padStart(3, '0')}`,
                id_pengguna: c.userId,
                isi_komentar: c.text,
                dibuat_pada: new Date(c.createdAt || c.timestamp || Date.now())
              }))
            }
          }),
          ...(attachments && attachments.length > 0 && {
            lampiran: {
              create: attachments.map((a: any, idx: number) => ({
                id_lampiran: `LMP${(baseAttachId + idx).toString().padStart(3, '0')}`,
                nama_file: a.name,
                tautan_url: a.url,
                tipe_lampiran: a.type,
                dibuat_pada: new Date(a.createdAt || Date.now())
              }))
            }
          }),

        }
      });
      res.status(201).json(tugasBaru);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat tugas" });
    }
  });

  // 5. Update Tugas
  app.put("/api/tugas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, judul_tugas, deskripsi, prioritas, tipe, id_penanggung_jawab, checklist, comments, attachments, contributors, catatan_selesai, batas_waktu } = req.body;
      const tugasUpdated = await prisma.tugas.update({
        where: { id_tugas: id },
        data: {
          ...(status && { status }),
          ...(judul_tugas && { judul_tugas }),
          ...(deskripsi !== undefined && { deskripsi }),
          ...(prioritas && { prioritas }),
          ...(tipe && { tipe }),
          ...(id_penanggung_jawab !== undefined && { id_penanggung_jawab }),
          ...(catatan_selesai !== undefined && { catatan_selesai }),
          ...(batas_waktu !== undefined && { batas_waktu: batas_waktu ? new Date(batas_waktu) : null }),
        }
      });

      if (contributors !== undefined) {
        await prisma.kontributorTugas.deleteMany({ where: { id_tugas: id } });
        if (contributors && contributors.length > 0) {
          await prisma.kontributorTugas.createMany({
            data: contributors.map((c: string) => ({
              id_tugas: id,
              id_pengguna: c
            }))
          });
        }
      }

      if (checklist !== undefined) {
        await prisma.daftarPeriksa.deleteMany({ where: { id_tugas: id } });
        if (checklist && checklist.length > 0) {
          let baseChecklistId = parseInt((await generateId('daftarPeriksa', 'CHK', 'id_periksa')).replace('CHK', '')) || 1;
          await prisma.daftarPeriksa.createMany({
            data: checklist.map((c: any, idx: number) => ({
              id_periksa: c.id && c.id.startsWith('CHK') ? c.id : `CHK${(baseChecklistId + idx).toString().padStart(3, '0')}`,
              id_tugas: id,
              teks_periksa: c.text,
              apakah_selesai: c.completed
            }))
          });
        }
      }

      if (comments !== undefined) {
        await prisma.komentar.deleteMany({ where: { id_tugas: id } });
        if (comments && comments.length > 0) {
          let baseCommentId = parseInt((await generateId('komentar', 'CMT', 'id_komentar')).replace('CMT', '')) || 1;
          await prisma.komentar.createMany({
            data: comments.map((c: any, idx: number) => ({
              id_komentar: c.id && c.id.startsWith('CMT') ? c.id : `CMT${(baseCommentId + idx).toString().padStart(3, '0')}`,
              id_tugas: id,
              id_pengguna: c.userId,
              isi_komentar: c.text,
              dibuat_pada: new Date(c.createdAt || c.timestamp || Date.now())
            }))
          });
        }
      }

      if (attachments !== undefined) {
        await prisma.lampiran.deleteMany({ where: { id_tugas: id } });
        if (attachments && attachments.length > 0) {
          let baseAttachId = parseInt((await generateId('lampiran', 'LMP', 'id_lampiran')).replace('LMP', '')) || 1;
          await prisma.lampiran.createMany({
            data: attachments.map((a: any, idx: number) => ({
              id_lampiran: a.id && a.id.startsWith('LMP') ? a.id : `LMP${(baseAttachId + idx).toString().padStart(3, '0')}`,
              id_tugas: id,
              nama_file: a.name,
              tautan_url: a.url,
              tipe_lampiran: a.type,
              dibuat_pada: new Date(a.createdAt || Date.now())
            }))
          });
        }
      }


      res.json(tugasUpdated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memperbarui tugas" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
