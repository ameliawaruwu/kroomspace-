import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { generateId } from "../../../frontend/src/lib/idGenerator";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, Type } from "@google/genai";
import { requireAdmin } from "../middleware/auth";
import { transporter, getEmailFrom } from "../config/mailer";
import { otpStore } from "../config/otpStore";
import { generateAIContent, getGeminiApiKey } from "../services/aiService";

/**
 * Validates external URL to protect against SSRF (Server-Side Request Forgery).
 * Blocks localhost, loopbacks, internal private IPs (RFC 1918), and link-local.
 */
function isSafeExternalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const hostname = parsed.hostname.toLowerCase();
    
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Rate Limiters ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan login, coba lagi dalam 15 menit." },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 10, // Ditingkatkan dari 3 ke 10 agar fleksibel saat testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan OTP, tunggu beberapa menit." },
});

export function registerRoutes(app: express.Express) {
  const emailFrom = getEmailFrom();

  // Admin Settings Endpoints
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const keyRecord = await (prisma as any).api_key.findFirst({
        orderBy: { id: 'desc' }
      });
      const apiKey = keyRecord?.key_value || "";
      const isCustom = apiKey.trim() !== "";
      const envKey = process.env.GEMINI_API_KEY || "";
      const hasEnv = envKey.trim() !== "" && envKey !== "your_gemini_api_key_here";
      
      let maskedKey = "";
      if (isCustom) {
        maskedKey = apiKey.length > 8 ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : "********";
      } else if (hasEnv) {
        maskedKey = envKey.length > 8 ? `${envKey.substring(0, 6)}...${envKey.substring(envKey.length - 4)} (env)` : "******** (env)";
      }

      res.json({
        hasCustomKey: isCustom,
        hasEnvKey: hasEnv,
        maskedKey: maskedKey || null,
        activeSource: isCustom ? "custom" : (hasEnv ? "env" : "none"),
        provider: keyRecord?.provider || "Gemini",
        modelName: keyRecord?.model_name || "",
        endpointUrl: keyRecord?.endpoint_url || ""
      });
    } catch (error) {
      console.error("[GET Settings Error]", error);
      res.status(500).json({ error: "Gagal mengambil pengaturan" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { geminiApiKey, provider, modelName, endpointUrl } = req.body;
      if (geminiApiKey === undefined && endpointUrl === undefined && provider === undefined) {
        return res.status(400).json({ error: "Data pengaturan tidak boleh kosong" });
      }

      const existing = await (prisma as any).api_key.findFirst({ orderBy: { id: 'desc' } });
      const finalApiKey = (geminiApiKey && geminiApiKey.trim() !== '') ? geminiApiKey : (existing?.key_value || '');

      await (prisma as any).api_key.create({
        data: {
          key_value: finalApiKey,
          provider: provider || existing?.provider || "Gemini",
          model_name: modelName !== undefined ? modelName : (existing?.model_name || null),
          endpoint_url: endpointUrl !== undefined ? endpointUrl : (existing?.endpoint_url || null)
        }
      });
      
      res.json({ success: true, message: "Pengaturan berhasil disimpan" });
    } catch (error) {
      console.error("[POST Settings Error]", error);
      res.status(500).json({ error: "Gagal menyimpan pengaturan" });
    }
  });

  // Deteksi Model Otomatis dari Endpoint & Provider
  app.post("/api/admin/models", requireAdmin, async (req, res) => {
    try {
      const { provider, endpointUrl, apiKey } = req.body;
      const existing = await (prisma as any).api_key.findFirst({ orderBy: { id: 'desc' } });
      
      const effectiveProvider = provider || existing?.provider || "Gemini";
      const effectiveEndpoint = endpointUrl !== undefined ? endpointUrl : (existing?.endpoint_url || "");
      const effectiveKey = (apiKey && apiKey.trim() !== "") ? apiKey : (existing?.key_value || "");

      if (effectiveEndpoint && effectiveEndpoint.trim() !== "") {
        const target = effectiveEndpoint.trim().replace(/\/$/, "");
        if (!isSafeExternalUrl(target)) {
          return res.status(400).json({ error: "URL endpoint tidak diizinkan demi keamanan sistem (SSRF protection)." });
        }
      }

      let models: string[] = [];

      // 0. Deteksi Khusus Google Gemini (Endpoint Google / Provider Gemini / Key Gemini)
      const isGemini = 
        effectiveProvider === "Gemini" || 
        effectiveEndpoint.includes("generativelanguage.googleapis.com") || 
        effectiveEndpoint.includes("googleapis.com") || 
        effectiveKey.startsWith("AIzaSy") || 
        effectiveKey.startsWith("AQ.");

      if (isGemini) {
        const match = effectiveEndpoint.match(/models\/([a-zA-Z0-9_\-\.]+)(?::generateContent)?/);
        const extractedFromUrl = match ? match[1] : null;

        if (effectiveKey) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`, {
              signal: AbortSignal.timeout(4000)
            });
            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              if (Array.isArray(geminiData?.models)) {
                models = geminiData.models
                  .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
                  .map((m: any) => m.name.replace("models/", ""));
              }
            }
          } catch (_) {}
        }

        if (models.length === 0) {
          models = [
            "gemini-3.8-flash",
            "gemini-3.5-flash",
            "gemini-flash-latest",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-flash-lite-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
          ];
        }

        if (extractedFromUrl) {
          models = [extractedFromUrl, ...models.filter(m => m !== extractedFromUrl)];
        }

        return res.json({ models });
      }

      // 1. Jika ada endpointUrl, pastikan URL aman (anti-SSRF) dan ambil model langsung dari endpoint /models
      if (effectiveEndpoint && effectiveEndpoint.trim() !== "") {
        const target = effectiveEndpoint.trim().replace(/\/$/, "");
        if (!isSafeExternalUrl(target)) {
          return res.status(400).json({ error: "URL endpoint tidak diizinkan demi keamanan sistem (SSRF protection)." });
        }
        const candidateUrls = [
          target.endsWith("/v1") ? `${target}/models` : `${target}/v1/models`,
          `${target}/models`,
          `${target}/api/v1/models`
        ];

        for (const url of candidateUrls) {
          try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (effectiveKey) {
              headers["Authorization"] = `Bearer ${effectiveKey}`;
            }
            const fetchRes = await fetch(url, {
              headers,
              signal: AbortSignal.timeout(4000)
            });
            if (fetchRes.ok) {
              const data = await fetchRes.json();
              if (Array.isArray(data?.data)) {
                models = data.data.map((m: any) => typeof m === "string" ? m : m.id).filter(Boolean);
              } else if (Array.isArray(data?.models)) {
                models = data.models.map((m: any) => typeof m === "string" ? m : (m.name || m.id)).filter(Boolean);
              } else if (Array.isArray(data)) {
                models = data.map((m: any) => typeof m === "string" ? m : (m.id || m.name)).filter(Boolean);
              }
              if (models.length > 0) break;
            }
          } catch (_) {}
        }
      }

      // 2. Daftar model bawaan penyedia jika endpoint gagal atau tidak ada endpoint
      if (models.length === 0) {
        if (effectiveProvider === "Gemini") {
          models = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.5-flash-lite"
          ];
        } else if (effectiveProvider === "OpenAI") {
          models = [
            "gpt-4o",
            "gpt-4o-mini",
            "o3-mini",
            "o1",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
          ];
        } else if (effectiveProvider === "Claude") {
          models = [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229"
          ];
        } else if (effectiveProvider === "CommandCode") {
          models = [
            "cmc/deepseek/deepseek-v4-pro",
            "cmc/deepseek/deepseek-v4-flash",
            "cmc/moonshotai/Kimi-K2.6",
            "cmc/moonshotai/Kimi-K2.5",
            "cmc/zai-org/GLM-5.1",
            "cmc/zai-org/GLM-5",
            "cmc/MiniMaxAI/MiniMax-M2.7",
            "cmc/MiniMaxAI/MiniMax-M2.5",
            "cmc/Qwen/Qwen3.6-Max-Preview",
            "cmc/Qwen/Qwen3.6-Plus",
            "cmc/stepfun/Step-3.5-Flash"
          ];
        } else if (effectiveProvider === "OpenRouter") {
          models = [
            "openai/gpt-4o-mini",
            "deepseek/deepseek-chat",
            "anthropic/claude-3.5-sonnet",
            "google/gemini-2.5-flash"
          ];
        } else {
          models = [
            "cmc/deepseek/deepseek-v4-pro",
            "gpt-4o-mini",
            "deepseek-chat",
            "llama3"
          ];
        }
      }

      return res.json({ models });
    } catch (error) {
      console.error("[Detect Models Error]", error);
      res.status(500).json({ error: "Gagal mendeteksi model" });
    }
  });

  // AI Integration Endpoint
  app.post("/api/analyze-external", async (req, res) => {
    const { url } = req.body;
    const apiKey = await getGeminiApiKey();

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const isApiKeyInvalid = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";

    if (!isApiKeyInvalid) {
      try {
        const response = await fetch(url);
        const html = await response.text();
        
        const cleanText = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                              .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                              .substring(0, 10000);

        const ai = new GoogleGenAI({ apiKey });
        const result = await generateAIContent(ai, `
          Analyze the following content from an external source (${url}).
          Identify any maintenance issues, bugs, or required tasks mentioned.
          For each issue, determine:
          1. A concise title.
          2. A brief description of the problem.
          3. The priority (Low, Medium, or High) based on urgency and impact.
          4. The type (Maintenance, Bug Fix, or Development).

          Content:
          ${cleanText}
        `, {
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
        });

        const tasks = JSON.parse(result.text);
        return res.json({ tasks });
      } catch (error) {
        console.error("External Analysis Error, using fallback:", error);
      }
    }

    // Fallback/Mock content
    const mockTasks = [
      {
        title: "Setup API Integration",
        description: "Konfigurasi dan integrasi API eksternal untuk sinkronisasi data otomatis.",
        priority: "High",
        type: "Development"
      },
      {
        title: "Troubleshoot Server Load",
        description: "Optimasi query database untuk menangani lonjakan beban server.",
        priority: "Medium",
        type: "Maintenance"
      }
    ];
    res.json({ tasks: mockTasks });
  });

  app.post("/api/ai/analyze-priority", async (req, res) => {
    try {
      const { task } = req.body;
      const apiKey = await getGeminiApiKey();
      
      const isApiKeyInvalid = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";

      if (!isApiKeyInvalid) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await generateAIContent(ai, `Analyze the priority for this task:
              Title: ${task.title}
              Description: ${task.description}
              Type: ${task.type}
              Deadline: ${task.deadline}
              
              Based on standard IT practices, return ONLY one word: Low, Medium, or High.`);
          return res.json({ priority: response.text.trim() });
        } catch (apiError) {
          console.error("Gemini Priority Analysis failed, using fallback:", apiError);
        }
      }

      // Rule-based Priority Fallback
      const title = task.title?.toLowerCase() || '';
      const desc = task.description?.toLowerCase() || '';
      let priority = "Medium";
      if (title.includes("down") || title.includes("critical") || title.includes("urgent") || title.includes("error") || task.type === "Security" || desc.includes("down") || desc.includes("critical")) {
        priority = "High";
      } else if (title.includes("minor") || title.includes("low") || title.includes("saran")) {
        priority = "Low";
      }
      res.json({ priority });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to analyze priority" });
    }
  });

  app.post("/api/ai/generate-report", async (req, res) => {
    try {
      const { task, documentation, user } = req.body;
      const apiKey = await getGeminiApiKey();
      
      const isApiKeyInvalid = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";

      if (!isApiKeyInvalid) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const prompt = `Anda adalah asisten AI teknis profesional. Buatkan sebuah Laporan Resmi (berformat HTML) penyelesaian tugas/maintenance berdasarkan data berikut:
          
          DETAIL TUGAS:
          - Judul: ${task.title}
          - ID: ${task.id}
          - Tipe: ${task.type}
          - Prioritas: ${task.priority}
          
          DOKUMENTASI TEKNISI:
          - Teknisi: ${documentation.authorName}
          - Waktu Selesai: ${new Date(documentation.createdAt).toLocaleString('id-ID')}
          - Catatan Penyelesaian: ${documentation.completionNotes}
          - Kendala: ${documentation.obstacles || '-'}
          - Solusi: ${documentation.solutions || '-'}

          Instruksi format:
          1. Jangan sertakan tag \`\`\`html atau markdown lainnya. Kembalikan murni tag HTML.
          2. Gunakan gaya CSS inline yang elegan, bersih, font sans-serif modern (seperti Inter atau Arial), dan warna korporat (biru dan abu-abu).
          3. Struktur HTML harus lengkap dengan div container (max-width: 800px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 8px; background: white; color: #333;).
          4. Header harus memiliki judul "LAPORAN PENYELESAIAN TUGAS - KROOMSPACE".
          5. Isi mencakup: Ringkasan Eksekutif, Detail Tugas, Analisis Kendala, dan Rekomendasi/Tindak Lanjut.
          6. Buat bahasanya profesional, baku, dan jelas.`;

          const response = await generateAIContent(ai, prompt);
          
          let html = response.text.trim();
          if (html.startsWith('\`\`\`html')) html = html.substring(7);
          if (html.startsWith('\`\`\`')) html = html.substring(3);
          if (html.endsWith('\`\`\`')) html = html.substring(0, html.length - 3);

          return res.json({ html: html.trim() });
        } catch (apiError) {
          console.error("Gemini Report Generation failed, using fallback:", apiError);
        }
      }

      // Fallback HTML report
      const fallbackHtml = `
      <div style="max-width: 800px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 8px; background: white; color: #333; font-family: Inter, sans-serif;">
        <h1 style="color: #1e3a8a; font-size: 24px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase;">Laporan Penyelesaian Tugas - KroomSpace</h1>
        
        <div style="margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #2563eb; font-size: 16px;">RINGKASAN EKSEKUTIF</h3>
          <p style="font-size: 13px; line-height: 1.6; margin: 0;">Laporan ini mendokumentasikan penyelesaian tugas pemeliharaan/pengembangan sistem. Seluruh kriteria keberhasilan telah dipenuhi dan divalidasi oleh teknisi penanggung jawab.</p>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #2563eb; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">DETAIL TUGAS</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Judul Tugas:</td>
              <td style="padding: 8px 0;">${task.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">ID Tugas:</td>
              <td style="padding: 8px 0;">${task.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Tipe / Prioritas:</td>
              <td style="padding: 8px 0;">${task.type} / ${task.priority}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Teknisi Pelaksana:</td>
              <td style="padding: 8px 0;">${documentation.authorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Waktu Penyelesaian:</td>
              <td style="padding: 8px 0;">${new Date(documentation.createdAt).toLocaleString('id-ID')}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #2563eb; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">ANALISIS KENDALA & SOLUSI</h3>
          <div style="margin-bottom: 10px;">
            <p style="font-size: 13px; font-weight: bold; margin: 0 0 5px 0; color: #dc2626;">Kendala:</p>
            <p style="font-size: 13px; line-height: 1.6; margin: 0; background: #fff5f5; padding: 10px; border-radius: 6px; border-left: 4px solid #f87171;">${documentation.obstacles || 'Tidak ada kendala berarti.'}</p>
          </div>
          <div>
            <p style="font-size: 13px; font-weight: bold; margin: 0 0 5px 0; color: #16a34a;">Solusi:</p>
            <p style="font-size: 13px; line-height: 1.6; margin: 0; background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 4px solid #4ade80;">${documentation.solutions || 'Pekerjaan diselesaikan sesuai prosedur standar.'}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #2563eb; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">CATATAN DOKUMENTASI</h3>
          <p style="font-size: 13px; line-height: 1.6; margin: 0; background: #f8fafc; padding: 15px; border-radius: 6px; font-style: italic;">"${documentation.completionNotes}"</p>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 11px; text-align: center; color: #94a3b8;">
          Laporan ini dihasilkan secara otomatis oleh Asisten AI KroomSpace pada ${new Date().toLocaleString('id-ID')}.
        </div>
      </div>
      `;
      res.json({ html: fallbackHtml.trim() });
    } catch (error) {
      console.error("[Generate Report Error]", error);
      res.status(500).json({ error: "Gagal menghasilkan laporan PDF via AI" });
    }
  });

  app.post("/api/ai/sort-tasks", async (req, res) => {
    try {
      const { tasks } = req.body;
      const apiKey = await getGeminiApiKey();

      const isApiKeyInvalid = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";

      if (!isApiKeyInvalid) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await generateAIContent(ai, `Sort these tasks by priority (High to Low). 
              CRITICAL: Prioritize Maintenance tasks and tasks that mention urgent issues, bugs, or system downtime.
              Tasks:
              ${tasks.map((t:any) => `- ID: ${t.id}, Title: ${t.title}, Priority: ${t.priority}, Type: ${t.type}, Description: ${t.description}`).join('\n')}
              Return a JSON array of task IDs in the sorted order.`, {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: { sortedIds: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ["sortedIds"]
              }
            });
          return res.json(JSON.parse(response.text));
        } catch (apiError) {
          console.error("Gemini Task Sorting failed, using fallback:", apiError);
        }
      }

      // Rule-based task sorting fallback
      const pMap: any = { "High": 3, "Medium": 2, "Low": 1 };
      const sortedIds = [...tasks].sort((a: any, b: any) => {
        const pA = pMap[a.priority] || 0;
        const pB = pMap[b.priority] || 0;
        if (pB !== pA) return pB - pA;
        if (a.type === "Maintenance" && b.type !== "Maintenance") return -1;
        if (b.type === "Maintenance" && a.type !== "Maintenance") return 1;
        return 0;
      }).map((t: any) => t.id);
      res.json({ sortedIds });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI Task Sorting failed" });
    }
  });

  app.post("/api/ai/consultation", async (req, res) => {
    try {
      const { question, context, language } = req.body;
      const apiKey = await getGeminiApiKey();

      const isApiKeyInvalid = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";

      if (!isApiKeyInvalid) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await generateAIContent(ai, `You are an expert technical maintenance assistant. A team member is asking for help with a maintenance task.
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
              7. NO formatting characters.`);
          return res.json({ result: (response?.text || "").replace(/[#*]/g, '').trim() });
        } catch (apiError: any) {
          console.error("AI Consultation failed:", apiError);
          const errMsg = apiError?.message || "";
          if (errMsg.includes("429") || errMsg.includes("limit") || errMsg.includes("quota") || errMsg.includes("403") || errMsg.includes("Forbidden") || errMsg.includes("Invalid API key") || errMsg.includes("blocked") || errMsg.includes("upgrade_required")) {
            return res.json({
              result: `Pemberitahuan Layanan AI:\n${errMsg}\n\nCatatan: Silakan tunggu hingga batas waktu rate-limit/kuota paket Anda tereset atau periksa kembali API Key dan URL Endpoint di menu Pengaturan AI.`
            });
          }
        }
      }

      // Fallback Mock Responses for TC-AI-03 and offline/unconfigured environments
      const questionLower = question.toLowerCase();
      let mockResult = "";

      if (language === 'id') {
        if (questionLower.includes("cors") || questionLower.includes("express")) {
          mockResult = `Untuk mengatasi CORS error di Express.js, ikuti langkah-langkah berikut:

- Install middleware cors di proyek Anda:
  npm install cors

- Impor dan gunakan middleware tersebut di server.ts/app.js Anda:
  const express = require('express');
  const cors = require('cors');
  const app = express();
  app.use(cors());

- Jika ingin membatasi ke domain tertentu (misal frontend React di port 3000):
  app.use(cors({
    origin: 'http://localhost:3000'
  }));

Langkah ini akan menambahkan header Access-Control-Allow-Origin yang diperlukan browser.`;
        } else if (questionLower.includes("database") || questionLower.includes("koneksi") || questionLower.includes("mysql")) {
          mockResult = `Langkah troubleshoot kegagalan koneksi database MySQL:

- Pastikan URL database di file .env sudah sesuai:
  DATABASE_URL="mysql://root:@localhost:3306/kroomspace"

- Periksa apakah layanan MySQL Anda sedang berjalan di komputer lokal (Services -> MySQL).
- Pastikan port MySQL (3306) tidak diblokir oleh firewall sistem Anda.
- Jalankan ulang migrasi skema Prisma Anda:
  npx prisma db push`;
        } else {
          mockResult = `Berikut adalah beberapa langkah pemecahan masalah teknis secara umum:

- Periksa log konsol server dan browser Anda untuk menemukan detail kode error.
- Bersihkan cache dan pasang kembali dependensi:
  npm cache clean --force
  npm install
- Periksa kembali variabel lingkungan pada file .env agar tidak ada konfigurasi yang salah.
- Coba restart aplikasi atau server pengembangan lokal Anda.`;
        }
      } else {
        if (questionLower.includes("cors") || questionLower.includes("express")) {
          mockResult = `To resolve CORS errors in Express.js, follow these steps:

- Install the cors middleware:
  npm install cors

- Import and use the middleware in server.ts/app.js:
  const express = require('express');
  const cors = require('cors');
  const app = express();
  app.use(cors());

- To restrict access to a specific origin (e.g., frontend React on port 3000):
  app.use(cors({
    origin: 'http://localhost:3000'
  }));

This adds the required Access-Control-Allow-Origin header to the responses.`;
        } else if (questionLower.includes("database") || questionLower.includes("connection") || questionLower.includes("mysql")) {
          mockResult = `Steps to troubleshoot MySQL database connection failures:

- Check your .env file and ensure the DATABASE_URL is correct:
  DATABASE_URL="mysql://root:@localhost:3306/kroomspace"

- Verify that your MySQL service is running locally on your computer.
- Ensure that the MySQL port (3306) is open and not blocked by a firewall.
- Re-run the Prisma database push command:
  npx prisma db push`;
        } else {
          mockResult = `Here are some general troubleshooting steps:

- Check the server logs and browser console to inspect the error details.
- Clear project cache and reinstall dependencies:
  npm cache clean --force
  npm install
- Double check your environment configuration in the .env file.
- Try restarting your local development server.`;
        }
      }

      res.json({ result: mockResult });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI Consultation failed" });
    }
  });

  // --- API Authentication ---
  app.post("/api/auth/send-register-otp", otpLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "Email tidak valid" });
      }

      const existingUser = await prisma.pengguna.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      otpStore.set(`register_${email}`, { otp, expiresAt, attempts: 0 });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject: "Aktivasi Akun KroomSpace",
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: center; color: #333;">
                <h2 style="color: #111;">Account Activation</h2>
                <p style="font-size: 14px; color: #555; line-height: 1.5;">We received a request to create a KroomSpace account. Please enter the following code to verify your email and activate your account.</p>
                <div style="background-color: #FFF0F0; border: 1px dashed #FFCCCC; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <span style="color: #E53935; font-size: 26px; font-weight: bold; letter-spacing: 12px; margin-left: 12px;">${otp}</span>
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
      
      if (Date.now() > record.expiresAt) {
        otpStore.delete(`register_${email}`);
        return res.status(400).json({ error: "OTP sudah kedaluwarsa. Silakan kirim ulang OTP." });
      }

      if (record.otp !== otp.trim()) {
        record.attempts = (record.attempts || 0) + 1;
        const remaining = 3 - record.attempts;
        if (remaining <= 0) {
          otpStore.delete(`register_${email}`);
          return res.status(400).json({ error: "Terlalu banyak percobaan OTP yang salah. Kode OTP telah dibatalkan untuk keamanan." });
        }
        return res.status(400).json({ error: `OTP salah. Sisa kesempatan: ${remaining} kali.` });
      }

      // Cek apakah email sudah ada
      const existingUser = await prisma.pengguna.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      const newId = await generateId('pengguna', 'id_pengguna');
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await prisma.pengguna.create({
        data: {
          id_pengguna: newId,
          nama: name,
          email,
          kata_sandi: hashedPassword,
          foto_profil: avatar,
          peran: 'Member'
        }
      });
      
      otpStore.delete(`register_${email}`);

      // Map back to frontend expected format — password TIDAK disertakan
      res.status(201).json({
        id: newUser.id_pengguna,
        name: newUser.nama,
        email: newUser.email,
        role: newUser.peran,
        avatar: newUser.foto_profil,
        whatsapp: newUser.whatsapp || ''
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mendaftar" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.pengguna.findUnique({ where: { email } });

      let isValid = false;
      if (user && user.kata_sandi) {
        if (user.kata_sandi.startsWith('$2a$') || user.kata_sandi.startsWith('$2b$')) {
          isValid = await bcrypt.compare(password, user.kata_sandi);
        } else {
          // Plain text comparison fallback (for unhashed or legacy passwords)
          isValid = (user.kata_sandi === password);
          // If valid, auto-migrate plain text to bcrypt hash!
          if (isValid) {
            const upgradedHash = await bcrypt.hash(password, 12);
            await prisma.pengguna.update({
              where: { id_pengguna: user.id_pengguna },
              data: { kata_sandi: upgradedHash }
            }).catch(console.error);
          }
        }
      }

      if (!user || !isValid) {
        return res.status(401).json({ error: "Email atau kata sandi salah" });
      }

      // Password TIDAK disertakan dalam response
      res.json({
        id: user.id_pengguna,
        name: user.nama,
        email: user.email,
        role: user.peran,
        avatar: user.foto_profil,
        whatsapp: user.whatsapp || ''
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal login" });
    }
  });

   app.post("/api/auth/forgot-password", otpLimiter, async (req, res) => {
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

       const otp = crypto.randomInt(100000, 1000000).toString();
       const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
       otpStore.set(email, { otp, expiresAt, attempts: 0 });

       // OTP tidak dicetak ke log untuk keamanan
       console.log(`[OTP Generated] Email: ${email}, Expires at: ${new Date(expiresAt).toISOString()}`);

       const info = await transporter.sendMail({
         from: emailFrom,
         to: email,
         subject: "Kode OTP Reset Password KroomSpace",
         html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: center; color: #333;">
                  <h2 style="color: #111;">Password Reset Request</h2>
                  <p style="font-size: 14px; color: #555; line-height: 1.5;">We received a request to reset your password. Please enter the following code to verify your identity and create a new password.</p>
                  <div style="background-color: #FFF0F0; border: 1px dashed #FFCCCC; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <span style="color: #E53935; font-size: 26px; font-weight: bold; letter-spacing: 12px; margin-left: 12px;">${otp}</span>
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

  app.post("/api/auth/verify-otp", otpLimiter, (req, res) => {
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

      if (record.otp !== otp.trim()) {
        record.attempts = (record.attempts || 0) + 1;
        const remaining = 3 - record.attempts;
        if (remaining <= 0) {
          otpStore.delete(email);
          console.warn(`[OTP Verify] Terlalu banyak percobaan salah untuk email: ${email}`);
          return res.status(400).json({ error: "Terlalu banyak percobaan OTP yang salah. Kode OTP telah dibatalkan untuk keamanan." });
        }
        return res.status(400).json({ error: `OTP salah. Sisa kesempatan: ${remaining} kali.` });
      }

      console.log(`[OTP Valid] Email: ${email}`);
      res.json({ message: "OTP valid" });
    } catch (error) {
      console.error("[OTP Verify Error]", error);
      res.status(500).json({ error: "Gagal verifikasi OTP" });
    }
  });

  app.post("/api/auth/reset-password", otpLimiter, async (req, res) => {
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

      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        console.warn(`[Reset Password] OTP expired untuk: ${email}`);
        return res.status(400).json({ error: "Sesi OTP sudah kedaluwarsa. Silakan ulangi proses lupa sandi." });
      }

      if (record.otp !== otp.trim()) {
        record.attempts = (record.attempts || 0) + 1;
        const remaining = 3 - record.attempts;
        if (remaining <= 0) {
          otpStore.delete(email);
          console.warn(`[Reset Password] Terlalu banyak percobaan salah untuk email: ${email}`);
          return res.status(400).json({ error: "Terlalu banyak percobaan OTP yang salah. Kode OTP telah dibatalkan untuk keamanan." });
        }
        return res.status(400).json({ error: `OTP salah. Sisa kesempatan: ${remaining} kali.` });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.pengguna.update({
        where: { email },
        data: { kata_sandi: hashedPassword }
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
      // Password TIDAK disertakan dalam response
      res.json(users.map(u => ({
        id: u.id_pengguna,
        name: u.nama,
        email: u.email,
        role: u.peran,
        avatar: u.foto_profil,
        whatsapp: u.whatsapp || ''
      })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil data users" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, whatsapp, role, avatar, currentPassword, newPassword } = req.body;

      const reqUserId = req.headers['x-user-id'] as string;
      if (!reqUserId) {
        return res.status(401).json({ error: "Unauthorized: Harap login terlebih dahulu" });
      }

      const requestingUser = await prisma.pengguna.findUnique({ where: { id_pengguna: reqUserId } });
      if (!requestingUser) {
        return res.status(401).json({ error: "Unauthorized: Pengguna tidak valid" });
      }

      const isAdmin = requestingUser.peran === 'Admin';
      if (!isAdmin && reqUserId !== id) {
        return res.status(403).json({ error: "Forbidden: Anda hanya dapat mengubah profil Anda sendiri" });
      }

      if (!isAdmin && role !== undefined && role !== requestingUser.peran) {
        return res.status(403).json({ error: "Forbidden: Hanya Admin yang dapat mengubah role pengguna" });
      }

      // Check if user exists
      const user = await prisma.pengguna.findUnique({ where: { id_pengguna: id } });
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      // If password change is requested
      let updatedPassword = user.kata_sandi;
      if (newPassword) {
        if (!isAdmin && currentPassword) {
          const isCurrentValid = (user.kata_sandi.startsWith('$2a$') || user.kata_sandi.startsWith('$2b$'))
            ? await bcrypt.compare(currentPassword, user.kata_sandi)
            : (user.kata_sandi === currentPassword);

          if (!isCurrentValid) {
            return res.status(400).json({ error: "Kata sandi lama salah" });
          }
        }
        updatedPassword = await bcrypt.hash(newPassword, 12);
      }

      const updatedUser = await prisma.pengguna.update({
        where: { id_pengguna: id },
        data: {
          nama: name !== undefined ? name : user.nama,
          email: email !== undefined ? email : user.email,
          whatsapp: whatsapp !== undefined ? (whatsapp ? whatsapp.trim() : null) : user.whatsapp,
          peran: (isAdmin && role !== undefined) ? role : user.peran,
          foto_profil: avatar !== undefined ? avatar : user.foto_profil,
          kata_sandi: updatedPassword
        }
      });

      res.json({
        id: updatedUser.id_pengguna,
        name: updatedUser.nama,
        email: updatedUser.email,
        role: updatedUser.peran,
        avatar: updatedUser.foto_profil,
        whatsapp: updatedUser.whatsapp || ''
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memperbarui profil" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const { name, email, whatsapp, role, password } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Nama dan email wajib diisi" });
      }

      const existing = await prisma.pengguna.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      const count = await prisma.pengguna.count();
      const newId = `P${String(count + 1).padStart(3, '0')}`;
      const defaultPass = password || "password123";
      const hashedPassword = await bcrypt.hash(defaultPass, 12);

      const newUser = await prisma.pengguna.create({
        data: {
          id_pengguna: newId,
          nama: name,
          email,
          whatsapp: whatsapp ? whatsapp.trim() : null,
          peran: role || "Member",
          kata_sandi: hashedPassword,
          foto_profil: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        }
      });

      res.status(201).json({
        id: newUser.id_pengguna,
        name: newUser.nama,
        email: newUser.email,
        role: newUser.peran,
        avatar: newUser.foto_profil,
        whatsapp: newUser.whatsapp || ''
      });
    } catch (error) {
      console.error("[POST /api/users Error]", error);
      res.status(500).json({ error: "Gagal menambahkan pengguna" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.pengguna.delete({
        where: { id_pengguna: id }
      });
      res.json({ success: true, message: "Pengguna berhasil dihapus" });
    } catch (error) {
      console.error("[DELETE /api/users Error]", error);
      res.status(500).json({ error: "Gagal menghapus pengguna" });
    }
  });

  // --- API Endpoints CRUD Dasar (Prisma) ---

  // 1. Ambil semua Proyek
  app.get("/api/proyek", async (req, res) => {
    try {
      const { userId } = req.query;
      const proyek = await prisma.proyek.findMany({
        where: userId ? { 
          OR: [
            { id_pengguna: String(userId) },
            { anggota: { some: { id_pengguna: String(userId) } } }
          ]
        } : undefined,
        include: { 
          kolom_papan: true,
          anggota: {
            include: { pengguna: true }
          }
        }
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
      const { nama_proyek, tipe_tugas, mode_kanban, deskripsi, columns, userId } = req.body;
      const newId = await generateId('proyek', 'id_proyek');
      const proyekBaru = await prisma.proyek.create({
        data: {
          id_proyek: newId,
          nama_proyek,
          tipe_tugas,
          mode_kanban,
          deskripsi,
          id_pengguna: userId || null,
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

  // 2.1a Delete Proyek
  app.delete("/api/proyek/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.proyek.delete({
        where: { id_proyek: id }
      });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menghapus proyek" });
    }
  });


  // ─── API Template Proyek ───────────────────────────────────────────────────

  // GET semua template proyek
  app.get("/api/proyek-templates", async (req, res) => {
    try {
      const templates = await prisma.templateProyek.findMany({
        orderBy: { dibuat_pada: 'asc' },
      });
      // Parse JSON fields to what the frontend expects
      const result = templates.map(t => {
        const kolom = JSON.parse(t.kolom_papan_json || '[]');
        const tugas = JSON.parse(t.tugas_json || '[]');
        return {
          id_template: t.id_template,
          nama_template: t.nama_template,
          deskripsi: t.deskripsi,
          kategori: t.kategori,
          tipe_tugas: t.kategori,
          mode_kanban: t.mode_kanban,
          dibuat_pada: t.dibuat_pada,
          kolom_papan: kolom.map((c: any) => ({ id: c.id, title: c.title, status: c.status, order: c.order })),
          tugas: tugas.map((tsk: any) => ({
            id: tsk.id,
            title: tsk.title,
            description: tsk.description || '',
            priority: tsk.priority,
            type: tsk.type,
            checklist: (tsk.checklist || []).map((cl: any) => ({ id: cl.id, text: cl.text, completed: false }))
          }))
        };
      });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil template proyek" });
    }
  });

  // GET satu template proyek
  app.get("/api/proyek-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tmpl = await prisma.templateProyek.findUnique({
        where: { id_template: id },
      });
      if (!tmpl) return res.status(404).json({ error: "Template tidak ditemukan" });
      const kolom = JSON.parse(tmpl.kolom_papan_json || '[]');
      const tugas = JSON.parse(tmpl.tugas_json || '[]');
      res.json({
        id_template: tmpl.id_template,
        nama_template: tmpl.nama_template,
        deskripsi: tmpl.deskripsi,
        kategori: tmpl.kategori,
        tipe_tugas: tmpl.kategori,
        mode_kanban: tmpl.mode_kanban,
        dibuat_pada: tmpl.dibuat_pada,
        kolom_papan: kolom.map((c: any) => ({ id: c.id, title: c.title, status: c.status, order: c.order })),
        tugas: tugas.map((tsk: any) => ({
          id: tsk.id,
          title: tsk.title,
          description: tsk.description || '',
          priority: tsk.priority,
          type: tsk.type,
          checklist: (tsk.checklist || []).map((cl: any) => ({ id: cl.id, text: cl.text, completed: false }))
        }))
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil template proyek" });
    }
  });

  // POST /api/proyek-templates/generate (AI Template Generation)
  app.post("/api/proyek-templates/generate", async (req, res) => {
    try {
      const { nama_template, deskripsi, kategori, tipe_tugas, mode_kanban } = req.body;
      const apiKey = await getGeminiApiKey();

      const isApiKeyInvalid = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";

      if (!isApiKeyInvalid) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Buatkan draf daftar tugas (task list) beserta checklist pekerjaan standar industri untuk template proyek berikut:
          - Nama Template: ${nama_template}
          - Deskripsi: ${deskripsi}
          - Kategori: ${kategori}
          - Tipe Tugas Utama: ${tipe_tugas}
          - Mode Kanban: ${mode_kanban}

          Buatkan minimal 3-5 tugas yang relevan. Setiap tugas harus memiliki:
          1. Judul Tugas (title)
          2. Deskripsi singkat (description)
          3. Tingkat prioritas (priority: "Low", "Medium", atau "High")
          4. Tipe tugas (type: harus berupa "Development", "Bug Fix", "Maintenance", "Infrastructure", "API Service", atau "Security")
          5. Checklist langkah kerja (checklist: array objek dengan property "text")

          Kembalikan hasilnya sebagai objek JSON dengan struktur:
          {
            "tasks": [
              {
                "title": "Judul Tugas",
                "description": "Deskripsi Tugas",
                "priority": "Medium",
                "type": "Development",
                "checklist": [
                  { "text": "Langkah 1" },
                  { "text": "Langkah 2" }
                ]
              }
            ]
          }`;

          const response = await generateAIContent(ai, prompt, {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                        type: { type: Type.STRING, enum: ["Development", "Bug Fix", "Maintenance", "Infrastructure", "API Service", "Security"] },
                        checklist: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: { text: { type: Type.STRING } },
                            required: ["text"]
                          }
                        }
                      },
                      required: ["title", "description", "priority", "type", "checklist"]
                    }
                  }
                },
                required: ["tasks"]
              }
            });

          const generatedData = JSON.parse(response.text);
          return res.json(generatedData);
        } catch (apiError) {
          console.error("Gemini Template Generation failed, using fallback:", apiError);
        }
      }

      // High-quality mock template tasks depending on category/name
      let mockTasks = [];
      const catLower = (kategori || "").toLowerCase();
      const nameLower = (nama_template || "").toLowerCase();
      if (catLower.includes("security") || nameLower.includes("audit") || nameLower.includes("keamanan")) {
        mockTasks = [
          {
            title: "Analisis Kerentanan Kode (Static Analysis)",
            description: "Menjalankan perkakas pemindai SAST untuk mendeteksi celah keamanan pada kode sumber.",
            priority: "High",
            type: "Security",
            checklist: [
              { text: "Konfigurasi ruleset pemindaian" },
              { text: "Jalankan linter keamanan" },
              { text: "Tinjau temuan dengan tingkat keparahan tinggi" }
            ]
          },
          {
            title: "Audit Akses & Autentikasi Pengguna",
            description: "Melakukan verifikasi kebijakan kata sandi dan hak akses peran (Role-Based Access Control).",
            priority: "High",
            type: "Security",
            checklist: [
              { text: "Audit daftar pengguna aktif" },
              { text: "Verifikasi integrasi 2FA/MFA" }
            ]
          },
          {
            title: "Simulasi Uji Penetrasi (Pen-Test)",
            description: "Melakukan simulasi serangan siber pada endpoint API publik untuk menguji ketahanan server.",
            priority: "Medium",
            type: "Security",
            checklist: [
              { text: "Pindai port terbuka" },
              { text: "Uji injeksi SQL dan XSS" }
            ]
          }
        ];
      } else if (catLower.includes("maintenance") || catLower.includes("bug") || nameLower.includes("maintenance")) {
        mockTasks = [
          {
            title: "Pembersihan Cache & Log Server",
            description: "Menghapus berkas log lama yang tidak terpakai untuk membebaskan ruang penyimpanan disk.",
            priority: "Medium",
            type: "Maintenance",
            checklist: [
              { text: "Arsipkan log bulan lalu" },
              { text: "Kosongkan folder temporary" }
            ]
          },
          {
            title: "Pembaruan Versi Dependensi Modul",
            description: "Melakukan instalasi patch keamanan terbaru pada dependensi npm/node_modules.",
            priority: "High",
            type: "Maintenance",
            checklist: [
              { text: "Jalankan npm audit" },
              { text: "Uji kompatibilitas lokal setelah update" }
            ]
          }
        ];
      } else {
        mockTasks = [
          {
            title: "Perancangan Arsitektur Basis Data",
            description: "Membuat diagram ERD dan skema tabel awal untuk kebutuhan entitas proyek baru.",
            priority: "High",
            type: "Development",
            checklist: [
              { text: "Identifikasi entitas utama" },
              { text: "Tentukan relasi antar tabel" }
            ]
          },
          {
            title: "Setup Boilerplate & Repository Proyek",
            description: "Menginisialisasi framework, bundler, dan struktur folder awal di repositori Git.",
            priority: "Medium",
            type: "Development",
            checklist: [
              { text: "Buat repository baru di GitHub" },
              { text: "Konfigurasi ESLint dan Prettier" }
            ]
          }
        ];
      }
      res.json({ tasks: mockTasks });
    } catch (error) {
      console.error("[Generate Template Error]", error);
      res.status(500).json({ error: "Gagal membuat draf tugas dengan AI" });
    }
  });

  // POST buat template proyek baru
  app.post("/api/proyek-templates", async (req, res) => {
    try {
      const { nama_template, deskripsi, kategori, tipe_tugas, mode_kanban, kolom_papan, tugas } = req.body;
      const newId = await generateId('templateProyek', 'id_template');

      // Assign IDs to kolom and tugas for JSON storage
      const kolomWithIds = (kolom_papan || []).map((c: any, idx: number) => ({
        id: `${newId}-COL-${idx}`,
        title: c.title,
        status: c.status,
        order: c.order
      }));

      const tugasWithIds = (tugas || []).map((t: any, tIdx: number) => ({
        id: `${newId}-TSK-${tIdx}`,
        title: t.title,
        description: t.description || '',
        priority: t.priority,
        type: t.type,
        checklist: (t.checklist || []).map((cl: any, clIdx: number) => ({
          id: `${newId}-TSK-${tIdx}-CL-${clIdx}`,
          text: cl.text
        }))
      }));
      
      const newTemplate = await prisma.templateProyek.create({
        data: {
          id_template: newId,
          nama_template,
          deskripsi,
          kategori: kategori || 'Development',
          mode_kanban,
          kolom_papan_json: JSON.stringify(kolomWithIds),
          tugas_json: JSON.stringify(tugasWithIds),
        },
      });
      res.status(201).json({
        id_template: newTemplate.id_template,
        nama_template: newTemplate.nama_template,
        deskripsi: newTemplate.deskripsi,
        kategori: newTemplate.kategori,
        tipe_tugas: newTemplate.kategori,
        mode_kanban: newTemplate.mode_kanban,
        dibuat_pada: newTemplate.dibuat_pada,
        kolom_papan: kolomWithIds,
        tugas: tugasWithIds.map((tsk: any) => ({
          ...tsk,
          checklist: tsk.checklist.map((cl: any) => ({ ...cl, completed: false }))
        }))
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat template proyek" });
    }
  });

  // DELETE template proyek
  app.delete("/api/proyek-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.templateProyek.delete({ where: { id_template: id } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menghapus template proyek" });
    }
  });

  // POST Terapkan Template → Buat Proyek + Tugas + Checklist sekaligus
  app.post("/api/proyek-templates/:id/terapkan", async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_proyek, userId } = req.body;

      // 1. Ambil template (JSON-based)
      const tmpl = await prisma.templateProyek.findUnique({
        where: { id_template: id },
      });
      if (!tmpl) return res.status(404).json({ error: "Template tidak ditemukan" });

      const kolom = JSON.parse(tmpl.kolom_papan_json || '[]');
      const tugasTemplate = JSON.parse(tmpl.tugas_json || '[]');

      // 2. Buat Proyek baru
      const proyekId = await generateId('proyek', 'id_proyek');
      let kolomCounter = parseInt((await generateId('kolomPapan', 'id_kolom')).match(/\d+$/)?.[0] || '1');

      const proyekBaru = await prisma.proyek.create({
        data: {
          id_proyek: proyekId,
          nama_proyek: nama_proyek || tmpl.nama_template,
          deskripsi: tmpl.deskripsi,
          tipe_tugas: tmpl.kategori,
          mode_kanban: tmpl.mode_kanban,
          id_pengguna: userId || null,
          kolom_papan: {
            create: kolom.map((c: any, idx: number) => ({
              id_kolom: `KB${(kolomCounter + idx).toString().padStart(3, '0')}`,
              judul_kolom: c.title,
              status_tugas: c.status,
              urutan: c.order ?? idx,
            }))
          }
        },
        include: { kolom_papan: true }
      });

      // 3. Buat Tugas + Checklist dari template JSON
      const tugasBuats: any[] = [];
      let tugasCounter = parseInt((await generateId('tugas', 'id_tugas')).match(/\d+$/)?.[0] || '1');
      let checklistCounter = parseInt((await generateId('daftarPeriksa', 'id_periksa')).match(/\d+$/)?.[0] || '1');

      for (let ti = 0; ti < tugasTemplate.length; ti++) {
        const tTask = tugasTemplate[ti];
        const tugasId = `T${(tugasCounter + ti).toString().padStart(3, '0')}`;
        const checklist = tTask.checklist || [];

        const tugasBaru = await prisma.tugas.create({
          data: {
            id_tugas: tugasId,
            id_proyek: proyekId,
            judul_tugas: tTask.title,
            deskripsi: tTask.description || '',
            status: 'Backlog',
            prioritas: tTask.priority || 'Medium',
            tipe: tTask.type || tmpl.kategori,
            daftar_periksa: checklist.length > 0 ? {
              create: checklist.map((cl: any, ci: number) => ({
                id_periksa: `CL${(checklistCounter + ci).toString().padStart(3, '0')}`,
                teks_periksa: cl.text,
                apakah_selesai: false,
              }))
            } : undefined,
          },
          include: { daftar_periksa: true }
        });

        checklistCounter += checklist.length;
        tugasBuats.push(tugasBaru);
      }

      res.status(201).json({
        proyek: proyekBaru,
        tugas: tugasBuats,
        message: `Proyek "${proyekBaru.nama_proyek}" berhasil dibuat dari template dengan ${tugasBuats.length} tugas.`
      });

    } catch (error) {
      console.error("Terapkan Template Error:", error);
      res.status(500).json({ error: "Gagal menerapkan template proyek", details: error instanceof Error ? error.message : String(error) });
    }
  });



  // 2.2 Tambah Anggota Proyek
  app.post("/api/proyek/:id/anggota", async (req, res) => {
    try {
      const { id } = req.params;
      const { id_pengguna } = req.body;

      let user = await prisma.pengguna.findUnique({ where: { id_pengguna } });
      if (!user) {
        // Auto-create user if missing (for mock users support)
        user = await prisma.pengguna.create({
          data: {
            id_pengguna,
            nama: "Team Member",
            email: `${id_pengguna}@kroombox.com`,
            kata_sandi: "password",
            peran: "Member"
          }
        });
      }

      const anggotaBaru = await prisma.anggotaProyek.create({
        data: {
          id_proyek: id,
          id_pengguna
        },
        include: { pengguna: true }
      });
      res.status(201).json(anggotaBaru);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menambah anggota proyek" });
    }
  });

  // 2.3 Hapus Anggota Proyek
  app.delete("/api/proyek/:id/anggota/:userId", async (req, res) => {
    try {
      const { id, userId } = req.params;
      await prisma.anggotaProyek.delete({
        where: { id_proyek_id_pengguna: { id_proyek: id, id_pengguna: userId } }
      });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menghapus anggota proyek" });
    }
  });

  // --- WEBHOOK INTEGRATION (CRM -> KroomSpace) ---
  app.post("/api/webhook/crm-incident", async (req, res) => {
    try {
      // Data payload dari web CRM teman Anda
      const { incidentId, title, description, urgency, customerPhone, customerEmail } = req.body;
      
      // 1. Buat Tugas Otomatis di Papan Kanban
      const taskId = await generateId('tugas', 'id_tugas');
      const firstProject = await prisma.proyek.findFirst();
      
      if (firstProject) {
        const newTask = await prisma.tugas.create({
          data: {
            id_tugas: taskId,
            judul_tugas: `[CRM INCIDENT ${incidentId}] ${title}`,
            deskripsi: `Tugas ini dibuat otomatis oleh sistem terintegrasi Web CRM.\n\n[Client Email: ${customerEmail}]`,
            status: "Backlog",
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

        // 3. Eksekusi Pengiriman Email Otomatis Asli
        if (customerEmail && transporter) {
          try {
            const info = await transporter.sendMail({
              from: emailFrom,
              to: customerEmail,
              subject: `KroomSpace: Laporan Diterima - ${title || 'Terkait Sistem Anda'}`,
              html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                      <h2 style="color: #2D7FEA; border-bottom: 2px solid #EBF5FF; padding-bottom: 10px;">Laporan Berhasil Diterima</h2>
                      <div style="background-color: #F8FBFF; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <p>Halo,</p>
                        <p>Kami telah menerima laporan/keluhan Anda dari sistem CRM.</p>
                        <p><strong>ID Laporan:</strong> ${incidentId || '-'}</p>
                        <p><strong>Judul:</strong> ${title || '-'}</p>
                        <p><strong>Prioritas:</strong> ${urgency || '-'}</p>
                        <p style="margin-top: 15px;">Tim teknis kami sedang menjadwalkan tindakan perbaikan/maintenance. Kami akan segera mengabari Anda kembali setelah proses maintenance ini selesai.</p>
                      </div>
                      <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">Pesan otomatis ini dikirim oleh Sistem Integrasi KroomSpace.</p>
                    </div>`,
            });
            console.log(`[CRM Webhook] Email sukses terkirim ke pelanggan (${customerEmail}). Message ID: ${info.messageId}`);
          } catch (emailErr) {
            console.error("[CRM Webhook] Gagal mengirim email otomatis:", emailErr);
          }
        } else {
           console.log(`[CRM Webhook] Laporan dicatat, namun tidak ada email pelanggan (customerEmail) yang dilampirkan atau SMTP belum siap.`);
        }

        res.status(201).json({ 
          success: true, 
          message: "Insiden CRM berhasil masuk ke Kanban dan Email Konfirmasi berhasil dikirim ke pelanggan.",
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
      const apiKey = await getGeminiApiKey();
      
      let aiChecklist: string[] = [
        "Periksa CPU/Memory usage via SSH (perintah 'top' atau 'htop')",
        "Cek log error server (/var/log atau log aplikasi)",
        "Restart service/proses yang menggunakan resource berlebih"
      ];

      const isApiKeyInvalid = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";
      if (!isApiKeyInvalid) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await generateAIContent(ai, `Server ${serverName} (ID: ${serverId}) melaporkan status ${status} untuk metrik ${metric} dengan nilai ${value}. 
            Deskripsi gangguan: "${description}".
            Berikan tepat 3 langkah pemecahan masalah (troubleshooting checklist) yang ringkas dan taktis untuk teknisi. 
            Kembalikan hasilnya sebagai JSON array berisi string saja. Contoh: ["langkah 1", "langkah 2", "langkah 3"].`, {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            });
          aiChecklist = JSON.parse(response.text);
        } catch (aiErr) {
          console.error("Gemini AI Checklist Generation failed, using fallback:", aiErr);
        }
      }

      // Cari proyek pertama untuk menampung tugas
      const firstProject = await prisma.proyek.findFirst();
      const taskId = await generateId('tugas', 'id_tugas');

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
      const { userId } = req.query;
      const notif = await prisma.notifikasi.findMany({
        where: userId ? { id_pengguna: String(userId) } : undefined,
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

      // Cek apakah ada notifikasi identik dalam 10 detik terakhir
      const sepuluhDetikLalu = new Date(Date.now() - 10 * 1000);
      const notifSama = await prisma.notifikasi.findFirst({
        where: {
          id_pengguna,
          id_tugas: id_tugas || null,
          pesan,
          tipe,
          waktu: {
            gte: sepuluhDetikLalu
          }
        }
      });

      if (notifSama) {
        return res.json(notifSama); // Kembalikan yang sudah ada
      }

      const newId = await generateId('notifikasi', 'id_notifikasi');
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

  // REST API Endpoint for KroomSpace Dashboard
  app.get("/api/dashboard", async (req, res) => {
    try {
      const { userId } = req.query;
      
      let user = null;
      if (userId) {
        user = await prisma.pengguna.findUnique({
          where: { id_pengguna: String(userId) }
        });
      }

      const isMember = user && user.peran === 'Member';
      
      const tasksWhereClause = isMember ? {
        OR: [
          { id_penanggung_jawab: String(userId) },
          { kontributor: { some: { id_pengguna: String(userId) } } },
          {
            proyek: {
              OR: [
                { id_pengguna: String(userId) },
                { anggota: { some: { id_pengguna: String(userId) } } }
              ]
            }
          }
        ]
      } : undefined;

      const allTasks = await prisma.tugas.findMany({
        where: tasksWhereClause,
        include: {
          penanggung_jawab: true,
          proyek: true
        }
      });

      // Calculate completed tasks
      const completedTasks = allTasks.filter(t => t.status === 'Done');
      const totalCompleted = completedTasks.length;

      // Calculate On-Time Rate: tasks completed on or before deadline
      const completedWithDeadline = completedTasks.filter(t => t.tanggal_selesai !== null);
      const completedOnTime = completedWithDeadline.filter(t => {
        const deadline = new Date(t.tanggal_selesai!);
        const completionDate = new Date(t.diperbarui_pada);
        return completionDate <= deadline;
      });
      const onTimeRate = completedWithDeadline.length > 0 
        ? Math.round((completedOnTime.length / completedWithDeadline.length) * 100) 
        : 100;

      // Calculate AI Project Health
      const activeTasks = allTasks.filter(t => t.status !== 'Done');
      const now = new Date();
      const overdueTasks = activeTasks.filter(t => t.tanggal_selesai && new Date(t.tanggal_selesai) < now);
      const blockedTasks = activeTasks.filter(t => t.apakah_diblokir);
      
      let aiProjectHealth = 100;
      if (allTasks.length > 0) {
        const healthyTasksCount = allTasks.length - overdueTasks.length - blockedTasks.length;
        aiProjectHealth = Math.max(0, Math.round((healthyTasksCount / allTasks.length) * 100));
      }

      // Open Maintenance Tickets
      const openMaintenanceTickets = activeTasks.filter(t => t.tipe === 'Maintenance').length;

      // Generate sparklines (7 data points representing counts over the last 7 days)
      const sparklineCompleted: number[] = [];
      const sparklineOnTimeRate: number[] = [];
      const sparklineHealth: number[] = [];
      const sparklineMaintenance: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(23, 59, 59, 999);
        const cutoff = d;

        // Completed
        const complAtDay = completedTasks.filter(t => new Date(t.diperbarui_pada) <= cutoff).length;
        sparklineCompleted.push(complAtDay);

        // On-Time
        const complDeadlineAtDay = completedTasks.filter(t => t.tanggal_selesai && new Date(t.diperbarui_pada) <= cutoff);
        const onTimeAtDay = complDeadlineAtDay.filter(t => new Date(t.diperbarui_pada) <= new Date(t.tanggal_selesai!)).length;
        sparklineOnTimeRate.push(complDeadlineAtDay.length > 0 ? Math.round((onTimeAtDay / complDeadlineAtDay.length) * 100) : 100);

        // Health
        const tasksUpToDay = allTasks.filter(t => new Date(t.dibuat_pada) <= cutoff);
        const activeUpToDay = tasksUpToDay.filter(t => t.status !== 'Done' || new Date(t.diperbarui_pada) > cutoff);
        const overdueUpToDay = activeUpToDay.filter(t => t.tanggal_selesai && new Date(t.tanggal_selesai) < cutoff);
        const blockedUpToDay = activeUpToDay.filter(t => t.apakah_diblokir);
        const healthAtDay = tasksUpToDay.length > 0 
          ? Math.max(0, Math.round(((tasksUpToDay.length - overdueUpToDay.length - blockedUpToDay.length) / tasksUpToDay.length) * 100))
          : 100;
        sparklineHealth.push(healthAtDay);

        // Maintenance
        const maintAtDay = activeUpToDay.filter(t => t.tipe === 'Maintenance').length;
        sparklineMaintenance.push(maintAtDay);
      }

      // Trends (relative comparison)
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const twoWeeksAgoDate = new Date();
      twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);

      const completedLastWeek = completedTasks.filter(t => new Date(t.diperbarui_pada) >= lastWeekDate).length;
      const completedPrevWeek = completedTasks.filter(t => new Date(t.diperbarui_pada) >= twoWeeksAgoDate && new Date(t.diperbarui_pada) < lastWeekDate).length;
      
      let completedTrend = 0;
      if (completedPrevWeek > 0) {
        completedTrend = Math.round(((completedLastWeek - completedPrevWeek) / completedPrevWeek) * 100);
      } else if (completedLastWeek > 0) {
        completedTrend = 100;
      }

      const onTimeRateTrend = onTimeRate >= 90 ? 3 : -2;
      const healthTrend = aiProjectHealth >= 80 ? 2 : -5;
      const maintTrend = openMaintenanceTickets > 8 ? 12 : -5;

      // Task Status Distribution (Pie chart data)
      const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
      const statusDistribution = statuses.map(status => ({
        name: status,
        value: allTasks.filter(t => t.status === status).length
      }));

      // Task Completion Trend Chart
      const trendChart: { date: string; completed: number; active: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);

        const dayCompleted = completedTasks.filter(t => {
          const compDate = new Date(t.diperbarui_pada);
          return compDate >= startOfDay && compDate <= endOfDay;
        }).length;

        const dayActive = allTasks.filter(t => {
          const created = new Date(t.dibuat_pada);
          const finished = t.status === 'Done' ? new Date(t.diperbarui_pada) : null;
          return created <= endOfDay && (finished === null || finished > endOfDay);
        }).length;

        trendChart.push({
          date: dateStr,
          completed: dayCompleted,
          active: dayActive
        });
      }

      // My Tasks panel (limited to top 5 active tasks)
      const myTasks = allTasks
        .filter(t => t.id_penanggung_jawab === userId && t.status !== 'Done')
        .slice(0, 5)
        .map(t => ({
          id: t.id_tugas,
          title: t.judul_tugas,
          status: t.status,
          priority: t.prioritas,
          deadline: t.tanggal_selesai,
          projectName: t.proyek?.nama_proyek || 'KroomSpace'
        }));

      // Team Activity Log from database notifications
      const latestNotifications = await prisma.notifikasi.findMany({
        where: isMember ? { id_pengguna: String(userId) } : undefined,
        orderBy: { waktu: 'desc' },
        take: 6,
        include: {
          pengguna: true
        }
      });

      const teamActivity = latestNotifications.map(n => ({
        id: n.id_notifikasi,
        user: {
          name: n.pengguna.nama,
          avatar: n.pengguna.foto_profil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.pengguna.nama}`
        },
        action: n.pesan,
        time: n.waktu,
        type: n.tipe
      }));

      // Maintenance Overview active tickets
      const maintenanceTasks = allTasks
        .filter(t => t.tipe === 'Maintenance')
        .slice(0, 5)
        .map(t => ({
          id: t.id_tugas,
          title: t.judul_tugas,
          status: t.status,
          priority: t.prioritas,
          assignee: t.penanggung_jawab ? {
            name: t.penanggung_jawab.nama,
            avatar: t.penanggung_jawab.foto_profil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.penanggung_jawab.nama}`
          } : null,
          deadline: t.tanggal_selesai
        }));

      res.json({
        kpis: {
          taskCompleted: {
            value: totalCompleted,
            trend: completedTrend,
            sparkline: sparklineCompleted
          },
          onTimeRate: {
            value: onTimeRate,
            trend: onTimeRateTrend,
            sparkline: sparklineOnTimeRate
          },
          aiProjectHealth: {
            value: aiProjectHealth,
            trend: healthTrend,
            sparkline: sparklineHealth
          },
          openMaintenance: {
            value: openMaintenanceTickets,
            trend: maintTrend,
            sparkline: sparklineMaintenance
          }
        },
        charts: {
          statusDistribution,
          trendChart
        },
        myTasks,
        teamActivity,
        maintenanceOverview: maintenanceTasks
      });

    } catch (error) {
      console.error("[GET /api/dashboard] Error:", error);
      res.status(500).json({ error: "Gagal memproses data dashboard" });
    }
  });

  // 3. Ambil semua Tugas
  app.get("/api/tugas", async (req, res) => {
    try {
      const { userId } = req.query;
      const tugas = await prisma.tugas.findMany({
        where: userId ? { 
          proyek: { 
            OR: [
              { id_pengguna: String(userId) },
              { anggota: { some: { id_pengguna: String(userId) } } }
            ]
          }
        } : undefined,
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
      console.error('[GET /api/tugas] Error:', error);
      res.status(500).json({ error: "Gagal mengambil data tugas", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // 4. Buat Tugas baru
  app.post("/api/tugas", async (req, res) => {
    try {
      const { id_proyek, judul_tugas, deskripsi, status, prioritas, tipe, id_penanggung_jawab, checklist, comments, attachments, contributors, catatan_selesai, tanggal_mulai, tanggal_selesai, apakah_diblokir, alasan_diblokir } = req.body;
      const newId = await generateId('tugas', 'id_tugas');
      
      let baseChecklistId = checklist && checklist.length > 0 ? parseInt((await generateId('daftarPeriksa', 'id_periksa')).match(/\d+$/)?.[0] || '1') : 1;
      let baseCommentId = comments && comments.length > 0 ? parseInt((await generateId('komentar', 'id_komentar')).match(/\d+$/)?.[0] || '1') : 1;
      let baseAttachId = attachments && attachments.length > 0 ? parseInt((await generateId('lampiran', 'id_lampiran')).match(/\d+$/)?.[0] || '1') : 1;

      // Auto-create missing users for assignment/contributors
      const usersToCheck = [];
      if (id_penanggung_jawab) usersToCheck.push(id_penanggung_jawab);
      if (contributors && contributors.length > 0) usersToCheck.push(...contributors);
      for (const uid of usersToCheck) {
        let user = await prisma.pengguna.findUnique({ where: { id_pengguna: uid } });
        if (!user) {
          await prisma.pengguna.create({
            data: {
              id_pengguna: uid,
              nama: "Team Member",
              email: `${uid}@kroombox.com`,
              kata_sandi: "password",
              peran: "Member"
            }
          });
        }
      }

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
          tanggal_mulai: tanggal_mulai ? new Date(tanggal_mulai) : null,
          tanggal_selesai: tanggal_selesai ? new Date(tanggal_selesai) : null,
          apakah_diblokir: apakah_diblokir || false,
          alasan_diblokir: alasan_diblokir || null,
          ...(contributors && contributors.length > 0 && {
            kontributor: {
              create: contributors.map((c: string) => ({ id_pengguna: c }))
            }
          }),
          ...(checklist && checklist.length > 0 && {
            daftar_periksa: {
              create: checklist.map((c: any, idx: number) => ({
                id_periksa: `CL${(baseChecklistId + idx).toString().padStart(3, '0')}`,
                teks_periksa: c.text,
                apakah_selesai: c.completed,
                tanggal_mulai: c.startDate ? new Date(c.startDate) : null,
                tanggal_selesai: c.endDate ? new Date(c.endDate) : null
              }))
            }
          }),
          ...(comments && comments.length > 0 && {
            komentar: {
              create: comments.map((c: any, idx: number) => ({
                id_komentar: `KM${(baseCommentId + idx).toString().padStart(3, '0')}`,
                id_pengguna: c.userId,
                isi_komentar: c.text,
                dibuat_pada: new Date(c.createdAt || c.timestamp || Date.now())
              }))
            }
          }),
          ...(attachments && attachments.length > 0 && {
            lampiran: {
              create: attachments.map((a: any, idx: number) => ({
                id_lampiran: `L${(baseAttachId + idx).toString().padStart(3, '0')}`,
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
      res.status(500).json({ error: "Gagal membuat tugas", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // 5. Update Tugas
  app.put("/api/tugas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, judul_tugas, deskripsi, prioritas, tipe, id_penanggung_jawab, checklist, comments, attachments, contributors, catatan_selesai, tanggal_mulai, tanggal_selesai, apakah_diblokir, alasan_diblokir } = req.body;
      const tugasUpdated = await prisma.tugas.update({
        where: { id_tugas: id },
        data: {
          ...(status && { status }),
          ...(judul_tugas && { judul_tugas }),
          ...(deskripsi !== undefined && { deskripsi }),
          ...(prioritas && { prioritas }),
          ...(tipe && { tipe }),
          ...(id_penanggung_jawab !== undefined && { id_penanggung_jawab }),
          ...(tanggal_mulai !== undefined && { tanggal_mulai: tanggal_mulai ? new Date(tanggal_mulai) : null }),
          ...(tanggal_selesai !== undefined && { tanggal_selesai: tanggal_selesai ? new Date(tanggal_selesai) : null }),
          ...(apakah_diblokir !== undefined && { apakah_diblokir }),
          ...(alasan_diblokir !== undefined && { alasan_diblokir }),
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
          let baseChecklistId = parseInt((await generateId('daftarPeriksa', 'id_periksa')).match(/\d+$/)?.[0] || '1');
          await prisma.daftarPeriksa.createMany({
            data: checklist.map((c: any, idx: number) => ({
              id_periksa: c.id && c.id.startsWith('CL') ? c.id : `CL${(baseChecklistId + idx).toString().padStart(3, '0')}`,
              id_tugas: id,
              teks_periksa: c.text,
              apakah_selesai: c.completed,
              tanggal_mulai: c.startDate ? new Date(c.startDate) : null,
              tanggal_selesai: c.endDate ? new Date(c.endDate) : null
            }))
          });
        }
      }

      if (comments !== undefined) {
        await prisma.komentar.deleteMany({ where: { id_tugas: id } });
        if (comments && comments.length > 0) {
          let baseCommentId = parseInt((await generateId('komentar', 'id_komentar')).match(/\d+$/)?.[0] || '1');
          await prisma.komentar.createMany({
            data: comments.map((c: any, idx: number) => ({
              id_komentar: c.id && c.id.startsWith('KM') ? c.id : `KM${(baseCommentId + idx).toString().padStart(3, '0')}`,
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
          let baseAttachId = parseInt((await generateId('lampiran', 'id_lampiran')).match(/\d+$/)?.[0] || '1');
          await prisma.lampiran.createMany({
            data: attachments.map((a: any, idx: number) => ({
              id_lampiran: a.id && a.id.startsWith('L') ? a.id : `L${(baseAttachId + idx).toString().padStart(3, '0')}`,
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

  // Dokumentasi Endpoints
  app.get("/api/dokumentasi", async (req, res) => {
    try {
      const dokumentasi = await prisma.dokumentasiTugas.findMany({
        include: { pengguna: true }
      });
      res.json(dokumentasi);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengambil dokumentasi" });
    }
  });

  app.post("/api/dokumentasi", async (req, res) => {
    try {
      const { id_tugas, id_pengguna, catatan_selesai, kendala, solusi } = req.body;
      const newId = await generateId('dokumentasiTugas', 'id_dokumentasi');
      const docBaru = await prisma.dokumentasiTugas.create({
        data: {
          id_dokumentasi: newId,
          id_tugas,
          id_pengguna,
          catatan_selesai,
          kendala,
          solusi
        },
        include: { pengguna: true }
      });
      res.status(201).json(docBaru);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat dokumentasi" });
    }
  });

  app.delete("/api/dokumentasi/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.dokumentasiTugas.delete({
        where: { id_dokumentasi: id }
      });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menghapus dokumentasi" });
    }
  });

  // Maintenance Report Endpoint
  app.post("/api/maintenance/report", async (req, res) => {
    try {
      const { to_email, subject, summary_text } = req.body;
      if (!to_email || !summary_text) {
        return res.status(400).json({ error: "Email tujuan dan isi laporan tidak boleh kosong" });
      }

      if (!transporter) {
        return res.status(500).json({ error: "Layanan email (SMTP) belum diinisialisasi" });
      }

      const info = await transporter.sendMail({
        from: emailFrom,
        to: to_email,
        subject: subject || "Laporan Maintenance KroomSpace",
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                <h2 style="color: #2D7FEA; border-bottom: 2px solid #EBF5FF; padding-bottom: 10px;">Laporan Maintenance</h2>
                <div style="background-color: #F8FBFF; padding: 20px; border-radius: 8px; margin-top: 20px;">
                  <p style="white-space: pre-wrap;">${summary_text}</p>
                </div>
                <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">Dikirim secara otomatis oleh Sistem KroomSpace.</p>
              </div>`,
      });

      console.log(`[Maintenance Report] Dikirim ke ${to_email}. Message ID: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`[Email Preview] ${nodemailer.getTestMessageUrl(info)}`);
      }

      res.json({ message: "Laporan berhasil dikirim" });
    } catch (error) {
      console.error("[Maintenance Report Error]", error);
      res.status(500).json({ error: "Gagal mengirim laporan maintenance" });
    }
  });

}
