import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    records: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          workerId: { type: Type.STRING },
          date: { type: Type.STRING, description: "YYYY-MM-DD" },
          attendance: { type: Type.STRING, description: "full, half, or absent" },
          allowance: { type: Type.NUMBER, description: "الصرفة اليومية" },
          advancePayment: { type: Type.NUMBER, description: "السحبية فقط" },
          delayMinutes: { type: Type.NUMBER },
          note: { type: Type.STRING },
          confidence: { type: Type.NUMBER, description: "0 to 1" },
          warning: { type: Type.STRING }
        },
        required: ["workerId", "date", "attendance", "allowance", "advancePayment", "delayMinutes", "note", "confidence", "warning"]
      }
    },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["records", "warnings"]
};

app.post("/api/parse-attendance", async (req, res) => {
  try {
    const { text, workers = [], fallbackDate, existingRecords = [] } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ error: "أرسل نص الترحيل أولاً." });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "لم يتم إعداد مفتاح المساعد في Vercel." });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { "User-Agent": "almothfin-assistant" } } });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
      contents: `أنت مساعد تدقيق وترحيل مالي لنظام إدارة عمال. استخرج البيانات العربية بدقة، ولا تخمّن عند وجود غموض.

قائمة العمال المسموح بها:
${JSON.stringify(workers.map((w: any) => ({ id: w.id, name: w.name, workerNumber: w.workerNumber })))}

السجلات الموجودة مسبقًا:
${JSON.stringify(existingRecords.map((r: any) => ({ workerId: r.workerId, date: r.date })))}

النص الوارد:
${text}

التاريخ الافتراضي: ${fallbackDate || "2026-01-01"}

القواعد الإلزامية:
1. طابق الاسم مع القائمة فقط. إذا لم تجد تطابقًا موثوقًا، لا تنشئ سجلًا؛ ضع تحذيرًا.
2. المبلغ بجانب الاسم بلا وصف هو الصرفة اليومية، أي allowance. لا تحوله إلى سحبية.
3. المبلغ الذي بجانبه «سحبية» أو «سحبيات» هو advancePayment مستقل، والصرفة تبقى منفصلة إن وُجدت.
4. إذا ذُكرت «غياب» فالحضور absent، وإذا ذُكر «نصف يوم» أو «داوم ساعتين» فالحضور half. لا تحذف الصرفة إلا إذا طلب النص ذلك صراحة.
5. حوّل التأخير إلى دقائق: ساعة=60، ساعتان=120، أربع ساعات=240، ونصف ساعة=30.
6. صحح اليوم والتاريخ فقط إذا كان النص واضحًا أو قدم المستخدم تصحيحًا صريحًا. إذا تعارض رقم التاريخ مع اسم اليوم، لا تخمّن؛ أضف تحذيرًا.
7. استخدم سنة 2026 عند غياب السنة.
8. إذا كان workerId والتاريخ موجودين في السجلات السابقة، ضع warning يذكر أنه مكرر. لا تُنشئ سجلًا بديلًا.
9. «+3000 إضافي» بدون كلمة سحبية أو صرفة يوضع في note ولا يضاف إلى أي مجموع.
10. المصروفات العامة، والتصفية، وأي مبلغ ليس مرتبطًا بموظف يجب أن يظهر في warnings ولا يتحول إلى سجل.
11. أعد JSON مطابقًا للمخطط فقط. confidence أقل من 0.85 عند أي غموض، واكتب سبب الغموض في warning.`,
      config: { responseMimeType: "application/json", responseSchema: extractionSchema }
    });
    const parsed = JSON.parse(response.text || '{"records":[],"warnings":[]}');
    const existingKeys = new Set(existingRecords.map((r: any) => `${r.workerId}:${r.date}`));
    const validWorkerIds = new Set(workers.map((w: any) => w.id));
    const records = (parsed.records || []).map((r: any) => ({ ...r, duplicate: existingKeys.has(`${r.workerId}:${r.date}`), unknownWorker: !validWorkerIds.has(r.workerId) }));
    const warnings = [...(parsed.warnings || [])];
    records.forEach((r: any) => {
      if (r.duplicate) warnings.push(`السجل مكرر وموجود مسبقًا: ${r.date}`);
      if (r.unknownWorker) warnings.push(`تعذر مطابقة عامل في ${r.date}`);
    });
    res.json({ records, warnings, requiresReview: warnings.length > 0 || records.some((r: any) => r.confidence < 0.85 || r.duplicate || r.unknownWorker) });
  } catch (e: any) {
    console.error("assistant parse error", e);
    res.status(500).json({ error: e?.message || "تعذر تحليل الرسالة." });
  }
});

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}
startServer();
export default app;

// Vercel uses the exported Express app through the project build configuration.
