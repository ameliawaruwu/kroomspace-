import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? "Configured (length: " + apiKey.length + ")" : "Not Configured");
  if (!apiKey) return;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Buatkan draf daftar tugas (task list) beserta checklist pekerjaan standar industri untuk template proyek berikut:
  - Nama Template: Audit Sistem
  - Deskripsi: id
  - Kategori: Development
  - Tipe Tugas Utama: Development
  - Mode Kanban: Kanban

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

  try {
    console.log("Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
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
      }
    });

    console.log("Response Text:", response.text);
    const parsed = JSON.parse(response.text);
    console.log("Successfully parsed JSON!", parsed);
  } catch (err) {
    console.error("Gemini call failed with error:", err);
  }
}

test();
