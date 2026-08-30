type Worker = { id: string; name: string; workerNumber?: string | number };
type ExistingRecord = { workerId: string; date: string };
type ParsedRecord = {
  workerId: string; date: string; attendance: 'present' | 'absent' | 'half';
  allowance: number; advancePayment: number; delayMinutes: number; note: string;
  confidence: number; warning: string; duplicate: boolean; unknownWorker: boolean;
};

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const toLatin = (value: string) => value.replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d))).replace(/[،٬]/g, ',');
const clean = (value: string) => toLatin(value).replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase();
const amountValue = (token: string) => Number(token.replace(/[,+،٬]/g, '')) || 0;

function dateFromText(line: string, fallbackDate?: string): string | null {
  const normalized = toLatin(line);
  const iso = normalized.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const short = normalized.match(/(?:^|\s)(\d{1,2})\s*[/\\-]\s*(\d{1,2})(?:\s|$)/);
  if (!short) return null;
  const year = (fallbackDate || '2026-01-01').slice(0, 4);
  return `${year}-${short[2].padStart(2, '0')}-${short[1].padStart(2, '0')}`;
}

function delayMinutes(line: string): number {
  const s = clean(line);
  if (!/(تاخير|تأخير)/.test(line)) return 0;
  if (/(نص|نصف)\s*(ساعه|ساعة)/.test(s)) return 30;
  if (/(ساعتين|ساعتان|2\s*ساع)/.test(s)) return 120;
  const hours = s.match(/(?:تاخير|تأخير)[^\d٠-٩]{0,8}(\d+)\s*ساع/);
  if (hours) return amountValue(hours[1]) * 60;
  if (/(4\s*ساع|اربع\s*ساع)/.test(s)) return 240;
  if (/(3\s*ساع|ثلاث\s*ساع)/.test(s)) return 180;
  if (/(ساعه|ساعة|1\s*ساع)/.test(s)) return 60;
  const direct = s.match(/(?:تاخير|تأخير)\D*(\d+)/);
  return direct ? amountValue(direct[1]) * 60 : 0;
}

function parseLine(line: string, currentDate: string | null, workers: Worker[], existingKeys: Set<string>): { record?: ParsedRecord; warning?: string } {
  const normalized = clean(line);
  if (!currentDate) return { warning: `تعذر تحديد تاريخ السطر: ${line}` };
  const worker = [...workers].sort((a, b) => b.name.length - a.name.length).find(w => normalized.includes(clean(w.name)));
  if (!worker) return { warning: `تعذر مطابقة موظف في السطر: ${line}` };

  const attendance: 'present' | 'absent' | 'half' = /(غياب|غائب|ما\s*داوم)/.test(normalized)
    ? 'absent' : /(نص\s*يوم|نصف\s*يوم|داوم\s*ساعتين|داوم\s*ساعتان)/.test(normalized) ? 'half' : 'present';
  const warningParts: string[] = [];
  if (attendance === 'absent' && /(نص\s*يوم|نصف\s*يوم)/.test(normalized)) warningParts.push('السطر يحتوي غيابًا ونصف يوم معًا');

  const rawNumbers = [...toLatin(line).matchAll(/[+]?(?:\d{1,3}(?:,\d{3})+|\d+)/g)].map(m => ({ token: m[0], start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, value: amountValue(m[0]) }));
  const delayWord = line.search(/تاخير|تأخير/);
  const extraWord = normalized.search(/اضافي|إضافي/);
  const numbers = rawNumbers.filter(n => n.value >= 100 && !(delayWord >= 0 && n.start >= delayWord && n.start <= delayWord + 14));
  const extra = extraWord >= 0 ? numbers.find(n => Math.abs(n.start - extraWord) <= 18) : undefined;
  const operational = extra ? numbers.filter(n => n !== extra) : numbers;
  const advanceWords = /(سحبي|سحبيه|سحبية|سحب|سلف|سلفة|سلفه)/;
  const advance = operational.find(n => advanceWords.test(normalized) && Math.abs(normalized.indexOf('سحب') >= 0 ? n.start - normalized.indexOf('سحب') : n.start - normalized.indexOf('سلف')) <= 24);
  const advancePayment = advance ? advance.value : (advanceWords.test(normalized) && operational.length === 1 ? operational[0].value : 0);
  const remaining = operational.filter(n => n !== advance);
  const allowance = remaining.length ? remaining[0].value : 0;
  if (operational.length > 2) warningParts.push('يوجد أكثر من مبلغ تشغيلي في السطر');
  if (extra && extra.value < 100) warningParts.push('مبلغ الإضافي أقل من 3 خانات');
  const note = extra ? `${extra.value} اضافي` : '';
  const key = `${worker.id}:${currentDate}`;
  const duplicate = existingKeys.has(key);
  if (duplicate) warningParts.push('السجل موجود مسبقًا ولن يتم تعديله');
  const warning = warningParts.join('، ');
  return { record: {
    workerId: worker.id, date: currentDate, attendance,
    allowance, advancePayment, delayMinutes: delayMinutes(line), note,
    confidence: warning ? 0.7 : 1, warning, duplicate, unknownWorker: false
  }};
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'الطريقة غير مسموحة.' });
  try {
    const { text, workers = [], fallbackDate, existingRecords = [] } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ error: 'أرسل نص الترحيل أولاً.' });
    const existingKeys = new Set((existingRecords as ExistingRecord[]).map(r => `${r.workerId}:${r.date}`));
    const records: ParsedRecord[] = [];
    const warnings: string[] = [];
    let currentDate: string | null = null;
    for (const line of String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
      const foundDate = dateFromText(line, fallbackDate);
      if (foundDate) { currentDate = foundDate; if (!workers.some((w: Worker) => clean(line).includes(clean(w.name)))) continue; }
      const result = parseLine(line, currentDate, workers as Worker[], existingKeys);
      if (result.record) { records.push(result.record); if (result.record.warning) warnings.push(`${result.record.date}: ${result.record.warning}`); }
      else if (result.warning && /\d/.test(toLatin(line))) warnings.push(result.warning);
    }
    const merged = new Map<string, ParsedRecord>();
    for (const record of records) {
      const key = `${record.workerId}:${record.date}`;
      const previous = merged.get(key);
      if (!previous) { merged.set(key, record); continue; }
      const conflictingAllowance = previous.allowance > 0 && record.allowance > 0 && previous.allowance !== record.allowance;
      if (conflictingAllowance) warnings.push(`${record.date}: أكثر من صرفة مختلفة للموظف نفسه؛ يرجى المراجعة`);
      const attendance = previous.attendance === 'absent' || record.attendance === 'absent' ? 'absent' : previous.attendance === 'half' || record.attendance === 'half' ? 'half' : 'present';
      const notes = [previous.note, record.note].filter(Boolean).filter((n, i, a) => a.indexOf(n) === i).join('، ');
      merged.set(key, {
        ...previous,
        attendance,
        allowance: previous.allowance || record.allowance,
        advancePayment: previous.advancePayment + record.advancePayment,
        delayMinutes: Math.max(previous.delayMinutes, record.delayMinutes),
        note: notes,
        confidence: Math.min(previous.confidence, record.confidence),
        warning: [previous.warning, record.warning].filter(Boolean).join('، '),
        duplicate: previous.duplicate || record.duplicate,
      });
    }
    const uniqueRecords = [...merged.values()];
    return res.status(200).json({ records: uniqueRecords, warnings, requiresReview: warnings.length > 0 || uniqueRecords.some(r => r.duplicate || r.confidence < 0.85), engine: 'fast-rules-v2' });
  } catch (error: any) {
    console.error('parse-attendance error', error);
    return res.status(500).json({ error: error?.message || 'تعذر تحليل الرسالة.' });
  }
}
