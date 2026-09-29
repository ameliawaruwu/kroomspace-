import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";

export async function getGeminiApiKey(): Promise<string> {
  const settings = await getAiSettings();
  return settings.apiKey;
}

export async function getAiSettings() {
  try {
    const keyRecord = await (prisma as any).api_key.findFirst({
      orderBy: { id: 'desc' }
    });
    if (keyRecord && keyRecord.key_value && keyRecord.key_value.trim() !== '') {
      return {
        apiKey: keyRecord.key_value,
        provider: keyRecord.provider || "Gemini",
        modelName: keyRecord.model_name || null,
        endpointUrl: keyRecord.endpoint_url || null
      };
    }
  } catch (error) {
    console.error("Error retrieving AI configuration:", error);
  }
  return {
    apiKey: process.env.GEMINI_API_KEY || '',
    provider: 'Gemini',
    modelName: 'gemini-2.5-flash',
    endpointUrl: null
  };
}

// Helper to detect provider (Google Gemini vs OpenAI/OpenRouter/Claude/Custom/CommandCode) and call the corresponding model
export async function generateAIContent(ai: GoogleGenAI, contents: any, config?: any): Promise<any> {
  const { apiKey, provider, modelName, endpointUrl } = await getAiSettings();

  const promptText = typeof contents === "string" ? contents : JSON.stringify(contents);

  // 1. Google Gemini (Official SDK & REST Fallback)
  const isGoogleGemini = 
    provider === "Gemini" || 
    endpointUrl?.includes("generativelanguage.googleapis.com") || 
    endpointUrl?.includes("googleapis.com") || 
    apiKey?.startsWith("AQ.") || 
    apiKey?.startsWith("AIzaSy");

  if (isGoogleGemini) {
    const urlMatch = endpointUrl?.match(/models\/([a-zA-Z0-9_\-\.]+)(?::generateContent)?/);
    const extractedModel = urlMatch ? urlMatch[1] : null;
    const targetModel = modelName || extractedModel;

    const defaultModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-2.5-flash-lite",
      "gemini-3-flash-preview"
    ];
    const modelsToTry = targetModel ? [targetModel, ...defaultModels.filter(m => m !== targetModel)] : defaultModels;
    let lastError: any;
    for (const model of modelsToTry) {
      try {
        if (ai) {
          return await ai.models.generateContent({
            model,
            contents,
            config
          });
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
        if (status === 503 || status === 429 || status === 404 || err?.message?.includes("503") || err?.message?.includes("429") || err?.message?.includes("overloaded") || err?.message?.includes("high demand") || err?.message?.includes("NOT_FOUND") || err?.message?.includes("no longer available")) {
          console.warn(`[AI Fallback] Model ${model} unavailable (${status || 'overloaded'}), trying next model...`);
          continue;
        }
      }

      // Direct REST fallback for Google Gemini
      try {
        const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: config?.responseMimeType ? { responseMimeType: config.responseMimeType } : undefined
          })
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          const text = directData.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || "";
          if (text) {
            return { text };
          }
        } else {
          const errData = await directRes.json().catch(() => ({}));
          const errMsg = errData.error?.message || `Status ${directRes.status}`;
          if (directRes.status === 503 || directRes.status === 429 || directRes.status === 404) {
            continue;
          }
          throw new Error(`[Gemini] ${errMsg}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }
    throw lastError || new Error("Google Gemini tidak dapat memproses permintaan saat ini.");
  }

  // 2. Anthropic Claude (Direct REST API)
  if (provider === "Claude") {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: modelName || "claude-3-5-sonnet-20241022",
          max_tokens: 4000,
          messages: [{ role: "user", content: promptText }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const textOutput = data.content?.[0]?.text || "";
      return { text: textOutput };
    } catch (err) {
      console.error("[Claude API Error]", err);
      throw err;
    }
  }

  // 3. CommandCode (Direct Official Stream implementation - hanya jika TIDAK menggunakan custom endpointUrl)
  if ((provider === "CommandCode" || (provider === "Gemini" && !apiKey.startsWith("AIzaSy") && apiKey !== "")) && !endpointUrl) {
    const threadId = crypto.randomUUID();
    const ccBody = {
      config: {
        workingDir: ".",
        date: new Date().toISOString().split('T')[0],
        environment: "cli",
        structure: [],
        isGitRepo: false,
        currentBranch: "",
        mainBranch: "main",
        gitStatus: "",
        recentCommits: []
      },
      memory: "",
      taste: "",
      skills: "",
      params: {
        model: modelName || "deepseek/deepseek-v4-pro",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
              }
            ]
          }
        ],
        system: "You are a helpful technical maintenance assistant.",
        max_tokens: 32000,
        temperature: 0.3,
        stream: true
      },
      threadId: threadId
    };

    try {
      const response = await fetch("https://api.commandcode.ai/alpha/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "x-command-code-version": "1.0.8",
          "x-cli-environment": "production",
          "Accept": "text/event-stream"
        },
        body: JSON.stringify(ccBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        let parsedMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          parsedMsg = errJson.error?.message || errJson.message || errText;
        } catch (_) {}
        throw new Error(`CommandCode API error (${response.status}): ${parsedMsg}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("CommandCode response body is not readable.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let aggregatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const event = JSON.parse(trimmed);
            if (event.type === "text-delta" && event.text) {
              aggregatedText += event.text;
            } else if (event.type === "error") {
              console.error("[CommandCode Stream Error Event]", event.error);
            }
          } catch (err) {
            // Ignore parse errors on incomplete lines or non-JSON parts
          }
        }
      }

      return {
        text: aggregatedText
      };
    } catch (err: any) {
      console.error("[CommandCode API Error]", err);
      throw err;
    }
  }

  // 4. OpenAI / OpenRouter / Custom / Endpoint URL (OpenAI-compatible)
  let apiUrl = "https://api.openai.com/v1/chat/completions";
  if (provider === "OpenRouter") {
    apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  } else if (endpointUrl) {
    apiUrl = endpointUrl.trim();
    if (apiUrl.includes("http://localhost:")) {
      apiUrl = apiUrl.replace("http://localhost:", "http://127.0.0.1:");
    }
    if (apiUrl.endsWith("/v1")) {
      apiUrl = apiUrl + "/chat/completions";
    } else if (apiUrl.endsWith("/v1/")) {
      apiUrl = apiUrl + "chat/completions";
    } else if (!apiUrl.includes("/chat/completions")) {
      apiUrl = apiUrl.replace(/\/$/, "") + "/v1/chat/completions";
    }
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };

    if (provider === "OpenRouter") {
      headers["HTTP-Referer"] = "http://localhost:3000";
      headers["X-Title"] = "Kroomspace";
    }

    // Auto-detect model jika modelName tidak disetel di UI
    let effectiveModel = modelName;
    if (!effectiveModel && endpointUrl) {
      try {
        const modelsUrl = endpointUrl.replace(/\/chat\/completions$/, "").replace(/\/$/, "") + (endpointUrl.includes("/v1") ? "/models" : "/v1/models");
        const mRes = await fetch(modelsUrl, {
          headers: { "Authorization": `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(3000)
        });
        if (mRes.ok) {
          const mData = await mRes.json();
          if (Array.isArray(mData?.data) && mData.data.length > 0 && mData.data[0]?.id) {
            effectiveModel = mData.data[0].id;
          }
        }
      } catch (_) {}
    }

    if (!effectiveModel) {
      effectiveModel = provider === "OpenAI" ? "gpt-4o-mini" : "cmc/deepseek/deepseek-v4-pro";
    }

    const payload: any = {
      model: effectiveModel,
      messages: [{ role: "user", content: promptText }]
    };

    if (config?.responseMimeType === "application/json") {
      payload.response_format = { type: "json_object" };
    }
    if (config?.temperature !== undefined) {
      payload.temperature = config.temperature;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedMsg = errJson.error?.message || errJson.message || errText;
      } catch (_) {}
      throw new Error(`[${provider}] ${parsedMsg}`);
    }

    const data = await response.json();
    const textOutput = data.choices?.[0]?.message?.content || "";
    return { text: textOutput };
  } catch (err) {
    console.error(`[${provider} API Error]`, err);
    throw err;
  }
}
