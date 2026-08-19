import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

type Worker = { id: string; name: string; workerNumber?: string | number };

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع أثناء تحليل النص.';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is required' });
  }

  const { text, workers, fallbackDate } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim() || !Array.isArray(workers)) {
    return res.status(400).json({ error: 'text and workers are required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'almothfin-vercel' } } });
    const workerList = (workers as Worker[]).map(({ id, name, workerNumber }) => ({ id, name, workerNumber }));
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are a highly precise Arabic data extraction AI for an attendance and payroll system. Extract only records belonging to the available workers.

Text:
${text}

Available workers:
${JSON.stringify(workerList)}

Fallback date (YYYY-MM-DD): ${fallbackDate || new Date().toISOString().split('T')[0]}

Rules:
1. Match names strictly to the available list and return the exact workerId. Never invent workers.
2. attendance: "absent" for غياب, "half" for نصف or داوم ساعتين/partial, otherwise "full".
3. advancePayment is a number next to a name unless صرفة is explicitly stated. allowance is only for an amount explicitly marked صرفة. Keep them separate.
4. Convert delays to minutes: ساعة=60, ساعتين=120, ساعة ونص=90, نصف ساعة=30.
5. Parse dates such as 18/7 or 18-7 using the current year; otherwise use the fallback date.
6. Return only valid JSON matching the schema, with no markdown.

Return an array of records.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              workerId: { type: Type.STRING },
              date: { type: Type.STRING },
              attendance: { type: Type.STRING },
              advancePayment: { type: Type.NUMBER },
              allowance: { type: Type.NUMBER },
              delayMinutes: { type: Type.NUMBER },
              note: { type: Type.STRING },
            },
            required: ['workerId', 'date', 'attendance'],
          },
        },
      },
    });

    const records = JSON.parse(response.text || '[]');
    if (!Array.isArray(records)) return res.status(502).json({ error: 'AI returned an invalid response' });
    return res.status(200).json({ records });
  } catch (error) {
    console.error('[v0] attendance parser failed', error);
    return res.status(500).json({ error: errorMessage(error) });
  }
}
