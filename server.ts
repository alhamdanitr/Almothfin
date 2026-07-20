import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API routes
  app.post("/api/parse-attendance", async (req, res) => {
    try {
      const { text, workers, fallbackDate } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are a highly precise and strict data extraction AI for an attendance and payroll system. Your task is to analyze Arabic text to extract attendance and payment records with 100% accuracy. You must NOT mix up worker data.

Text from user:
${text}

Available workers list:
${JSON.stringify(workers.map((w: any) => ({id: w.id, name: w.name, workerNumber: w.workerNumber})))}

Fallback Date (YYYY-MM-DD): ${fallbackDate}

Rules:
1. Strict Identity Matching: Match the names in the text EXACTLY to the names in the 'Available workers list'. If a name matches multiple workers slightly, pick the exact match. Do not guess wildly. Return the exact 'workerId'.
2. Attendance Status: 
   - If the text says "غياب" (absent) next to a name, set 'attendance' to 'absent'.
   - If the text says "نصف" or "داوم ساعتين" or implies a partial day, set 'attendance' to 'half'.
   - Otherwise, default to 'full' (حاضر).
3. Payments: 
   - There are two distinct types of payments: "سحبيات" (Advance Payment) and "صرفة" (Allowance).
   - 'advancePayment' (سحبيات): A general financial amount taken by the worker. If a number appears next to a name without the word "صرفة", treat it as 'advancePayment' (e.g., "محمد 4000" means advancePayment: 4000).
   - 'allowance' (صرفة): An allowance is ONLY recorded if the word "صرفة" is explicitly mentioned with an amount (e.g., "محمد صرفة 2000" means allowance: 2000).
   - Do NOT combine them. If both exist, parse both.
4. Delays:
   - If the text mentions a delay (تأخير / تاخير) in hours or minutes (e.g., "تأخير ساعتين", "تاخير ساعة ونص", "تأخير نصف ساعة"), convert it to minutes and set 'delayMinutes' (e.g., "ساعتين" = 120, "ساعة" = 60, "ساعة ونص" = 90).
5. Date parsing: If the text contains a date (e.g. "السبت 18/7" or "18-7"), parse it into YYYY-MM-DD format using the current year (2026). If there is absolutely no date, use the '${fallbackDate}'.
6. Do not hallucinate workers that are not in the list.

Return JSON matching this schema exactly. Do not output markdown, just the JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                workerId: { type: Type.STRING },
                date: { type: Type.STRING, description: "YYYY-MM-DD" },
                attendance: { type: Type.STRING, description: "'full' or 'half' or 'absent'" },
                advancePayment: { type: Type.NUMBER, description: "General advance payment (سحبيات)" },
                allowance: { type: Type.NUMBER, description: "Specific allowance (صرفة)" },
                delayMinutes: { type: Type.NUMBER },
                note: { type: Type.STRING }
              },
              required: ["workerId", "date", "attendance"]
            }
          }
        }
      });

      res.json({ records: JSON.parse(response.text || "[]") });
    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message;
      try {
        const parsed = JSON.parse(e.message);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        } else if (parsed.message) {
          errorMessage = parsed.message;
        }
      } catch (parseErr) {
        // Not JSON
      }
      res.status(500).json({ error: errorMessage });
    }
  });

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
