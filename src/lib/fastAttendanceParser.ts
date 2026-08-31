import { DailyRecord, Worker } from '../types';

export type LocalParsedRecord = Omit<DailyRecord, 'id'> & {
  confidence: number; warning: string; duplicate: boolean; unknownWorker: boolean; workerName: string;
};
export type LocalParseResult = { records: LocalParsedRecord[]; warnings: string[]; requiresReview: boolean; engine: 'local-regex-v1' };

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const latin = (s: string) => s.replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d))).replace(/[،٬]/g, ',');
const norm = (s: string) => latin(s).replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase();
const value = (s: string) => Number(s.replace(/[,+،٬]/g, '')) || 0;
const dateOf = (line: string, fallback: string) => {
  const s = latin(line), iso = s.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/), short = s.match(/(?:^|\s)(\d{1,2})\s*[/\\-]\s*(\d{1,2})(?:\s|$)/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  return short ? `${fallback.slice(0, 4)}-${short[2].padStart(2, '0')}-${short[1].padStart(2, '0')}` : null;
};
const delayOf = (line: string) => {
  const s = norm(line); if (!/(تاخير|تأخير)/.test(line)) return 0;
  if (/(نص|نصف)\s*(ساعه|ساعة)/.test(s)) return 30;
  if (/(ساعتين|ساعتان|2\s*ساع)/.test(s)) return 120;
  const direct = s.match(/(?:تاخير|تأخير)\D*(\d+)/); if (direct) return value(direct[1]) * 60;
  if (/(4\s*ساع|اربع\s*ساع)/.test(s)) return 240;
  if (/(3\s*ساع|ثلاث\s*ساع)/.test(s)) return 180;
  return /(ساعه|ساعة|1\s*ساع)/.test(s) ? 60 : 0;
};

export function parseAttendanceText(text: string, workers: Worker[], existingRecords: DailyRecord[], fallbackDate: string): LocalParseResult {
  const workerCache = workers.filter(w => w.status !== 'inactive').slice().sort((a, b) => b.name.length - a.name.length);
  const existing = new Set(existingRecords.map(r => `${r.workerId}:${r.date}`));
  const records: LocalParsedRecord[] = [], warnings: string[] = [];
  let currentDate: string | null = null;
  for (const raw of text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
    const foundDate = dateOf(raw, fallbackDate);
    if (foundDate) { currentDate = foundDate; if (!workerCache.some(w => norm(raw).includes(norm(w.name)))) continue; }
    if (!currentDate) { if (/\d/.test(latin(raw))) warnings.push(`تاريخ غير واضح للسطر: ${raw}`); continue; }
    const n = norm(raw), worker = workerCache.find(w => n.includes(norm(w.name)));
    if (!worker) { if (/\d/.test(latin(raw))) warnings.push(`اسم غير مطابق أو عامل غير مفعّل: ${raw}`); continue; }
    const nums = [...latin(raw).matchAll(/[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)/g)].map(m => ({ start: m.index || 0, value: value(m[0]) })).filter(x => Math.abs(x.value) >= 100);
    const extraIndex = n.search(/اضافي|إضافي/);
    const extra = extraIndex >= 0 ? nums.find(x => Math.abs(x.start - extraIndex) <= 18) : undefined;
    const usable = extra ? nums.filter(x => x !== extra) : nums;
    const advanceIndex = n.search(/سحبي|سحبيه|سحبية|سحب|سلف|سلفة|سلفه/);
    const advance = advanceIndex >= 0 ? usable.find(x => Math.abs(x.start - advanceIndex) <= 24) : undefined;
    const attendance = /(غياب|غائب|ما\s*داوم)/.test(n) ? 'absent' : /(نص\s*يوم|نصف\s*يوم|داوم\s*ساعتين|داوم\s*ساعتان)/.test(n) ? 'half' : 'full';
    const key = `${worker.id}:${currentDate}`, duplicate = existing.has(key);
    const warning = duplicate ? 'السجل موجود مسبقًا ولن يتم تعديله' : '';
    const record: LocalParsedRecord = { workerId: worker.id, workerName: worker.name, date: currentDate, attendance, allowance: usable.find(x => x !== advance)?.value || 0, advancePayment: advance?.value || (advanceIndex >= 0 && usable.length === 1 ? usable[0].value : 0), delayMinutes: delayOf(raw), note: extra ? `${extra.value} اضافي` : '', confidence: warning ? 0.7 : 1, warning, duplicate, unknownWorker: false };
    const previous = records.find(r => r.workerId === record.workerId && r.date === record.date);
    if (previous) { previous.advancePayment += record.advancePayment; previous.allowance ||= record.allowance; previous.delayMinutes = Math.max(previous.delayMinutes, record.delayMinutes); previous.note = [previous.note, record.note].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join('، '); previous.attendance = previous.attendance === 'absent' || record.attendance === 'absent' ? 'absent' : previous.attendance === 'half' || record.attendance === 'half' ? 'half' : 'full'; }
    else records.push(record);
    if (warning) warnings.push(`${currentDate}: ${worker.name} — ${warning}`);
  }
  return { records, warnings, requiresReview: warnings.length > 0 || records.some(r => r.duplicate || r.confidence < 0.85), engine: 'local-regex-v1' };
}
