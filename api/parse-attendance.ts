import { GoogleGenAI, Type } from '@google/genai';

const schema = {
  type: Type.OBJECT,
  properties: {
    records: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
      workerId: { type: Type.STRING }, date: { type: Type.STRING }, attendance: { type: Type.STRING },
      allowance: { type: Type.NUMBER }, advancePayment: { type: Type.NUMBER }, delayMinutes: { type: Type.NUMBER },
      note: { type: Type.STRING }, confidence: { type: Type.NUMBER }, warning: { type: Type.STRING }
    }, required: ['workerId','date','attendance','allowance','advancePayment','delayMinutes','note','confidence','warning'] } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
  }, required: ['records','warnings']
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'الطريقة غير مسموحة.' });
  try {
    const { text, workers = [], fallbackDate, existingRecords = [] } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ error: 'أرسل نص الترحيل أولاً.' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'لم يتم إعداد GEMINI_API_KEY في بيئة Vercel.' });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `أنت مساعد تدقيق وترحيل مالي لنظام إدارة عمال. استخرج البيانات العربية بدقة، ولا تخمّن عند وجود غموض.
قائمة العمال المسموح بها: ${JSON.stringify(workers.map((w: any) => ({ id: w.id, name: w.name, workerNumber: w.workerNumber })))}
السجلات الموجودة مسبقًا: ${JSON.stringify(existingRecords.map((r: any) => ({ workerId: r.workerId, date: r.date })))}
النص الوارد: ${text}
التاريخ الافتراضي: ${fallbackDate || '2026-01-01'}
القواعد الإلزامية:
- طابق الاسم مع القائمة فقط، ولا تنشئ عاملًا غير موجود.
- المبلغ بجانب الاسم بلا وصف هو الصرفة اليومية allowance.
- المبلغ الذي بجانبه «سحبية» أو «سحبيات» هو advancePayment مستقل.
- «غياب» = absent، و«نصف يوم» أو «داوم ساعتين» = half.
- حوّل ساعة إلى 60 دقيقة، ساعتين إلى 120، أربع ساعات إلى 240، ونصف ساعة إلى 30.
- صحح التاريخ فقط إذا كان واضحًا أو صححه المستخدم صراحة، وإلا أضف تحذيرًا.
- إذا كان العامل والتاريخ موجودين مسبقًا، ضع warning بأنه مكرر ولا تعدله.
- «+3000 إضافي» بلا وصف يوضع في note ولا يضاف إلى المجموع.
- التصفية والمصروفات العامة والأسماء غير المطابقة تظهر في warnings ولا تتحول إلى سجلات.
- confidence أقل من 0.85 عند الغموض. أعد JSON مطابقًا للمخطط فقط.`;
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema } });
    const parsed = JSON.parse(response.text || '{"records":[],"warnings":[]}');
    const existingKeys = new Set(existingRecords.map((r: any) => `${r.workerId}:${r.date}`));
    const workerIds = new Set(workers.map((w: any) => w.id));
    const records = (parsed.records || []).map((r: any) => ({ ...r, duplicate: existingKeys.has(`${r.workerId}:${r.date}`), unknownWorker: !workerIds.has(r.workerId) }));
    const warnings = [...(parsed.warnings || [])];
    records.forEach((r: any) => { if (r.duplicate) warnings.push(`السجل مكرر وموجود مسبقًا: ${r.date}`); if (r.unknownWorker) warnings.push(`تعذر مطابقة عامل في ${r.date}`); });
    return res.status(200).json({ records, warnings, requiresReview: warnings.length > 0 || records.some((r: any) => r.confidence < 0.85 || r.duplicate || r.unknownWorker) });
  } catch (error: any) {
    console.error('parse-attendance error', error);
    return res.status(500).json({ error: error?.message || 'تعذر تحليل الرسالة.' });
  }
}
