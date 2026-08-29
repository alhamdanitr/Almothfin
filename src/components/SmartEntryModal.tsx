import { useMemo, useState } from 'react';
import { Bot, X, Loader2, AlertCircle, Check, MessageSquare, ShieldAlert, RotateCcw } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { AttendanceStatus, DailyRecord } from '../types';

interface SmartEntryModalProps { onClose: () => void; }
type ChatMessage = { role: 'user' | 'assistant'; text: string };
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://almothfin.vercel.app').replace(/\/$/, '');

export function SmartEntryModal({ onClose }: SmartEntryModalProps) {
  const { workers, records, addBulkRecords } = useStore();
  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [parsedRecords, setParsedRecords] = useState<any[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem('almothfin_ai_chat') || '[]'); } catch { return []; }
  });

  const activeWorkers = useMemo(() => workers.filter(w => w.status !== 'inactive'), [workers]);
  const saveChat = (next: ChatMessage[]) => {
    setChat(next);
    localStorage.setItem('almothfin_ai_chat', JSON.stringify(next.slice(-30)));
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsParsing(true); setError(''); setParsedRecords(null);
    const nextChat = [...chat, { role: 'user' as const, text: text.trim() }];
    saveChat(nextChat);
    try {
      const response = await fetch(`${API_BASE_URL}/api/parse-attendance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, workers: activeWorkers, existingRecords: records, fallbackDate: new Date().toISOString().slice(0, 10) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'فشل الاتصال بالمساعد الذكي');
      const preview = (data.records || []).map((r: any) => ({ ...r, workerName: activeWorkers.find(w => w.id === r.workerId)?.name || 'غير معروف' }));
      if (!preview.length) throw new Error('لم يتم التعرف على أي سجل قابل للمراجعة.');
      setParsedRecords(preview);
      setWarnings(data.warnings || []);
      const summary = `تم تحليل ${preview.length} سجلًا. ${data.warnings?.length ? `يوجد ${data.warnings.length} تحذيرًا؛ لن تُحفظ السجلات المكررة أو غير الموثوقة.` : 'لا توجد تحذيرات.'}`;
      saveChat([...nextChat, { role: 'assistant', text: summary }]);
      setText('');
    } catch (e: any) { setError(e.message || 'تعذر تحليل الرسالة.'); }
    finally { setIsParsing(false); }
  };

  const safeRecords = (parsedRecords || []).filter(r => !r.duplicate && !r.unknownWorker && Number(r.confidence ?? 1) >= 0.85);
  const heldRecords = (parsedRecords || []).filter(r => !safeRecords.includes(r));

  const handleSave = async () => {
    if (!safeRecords.length) return;
    setIsSaving(true);
    const unique = new Map<string, any>();
    safeRecords.forEach(r => unique.set(`${r.workerId}:${r.date}`, r));
    const recordsToSave: Omit<DailyRecord, 'id'>[] = [...unique.values()].map(r => ({
      workerId: r.workerId, date: r.date, attendance: r.attendance as AttendanceStatus,
      allowance: Number(r.allowance) || 0, advancePayment: Number(r.advancePayment) || 0,
      delayMinutes: Number(r.delayMinutes) || 0, note: r.note || ''
    }));
    try {
      await addBulkRecords(recordsToSave);
      saveChat([...chat, { role: 'assistant', text: `تم حفظ ${recordsToSave.length} سجلًا واضحًا. تم تعليق ${heldRecords.length} سجلًا للمراجعة.` }]);
      setParsedRecords(null); setWarnings([]);
      alert(`تم حفظ ${recordsToSave.length} سجلًا. تم تعليق ${heldRecords.length} سجلًا مشتبهًا أو مكررًا.`);
    } catch { setError('فشل حفظ السجلات؛ لم تكتمل العملية.'); }
    finally { setIsSaving(false); }
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
    <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20">
        <div className="flex items-center gap-3"><div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-lg text-indigo-600"><Bot className="w-6 h-6" /></div><div><h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">المساعد الذكي للترحيل</h3><p className="text-xs text-indigo-700/70 dark:text-indigo-400/70">تحليل، مراجعة، ثم حفظ بموافقتك فقط</p></div></div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6 overflow-y-auto flex-1 space-y-5">
        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-900/10 p-4"><div className="flex gap-2 items-center text-sm font-bold text-indigo-800 dark:text-indigo-300"><ShieldAlert className="w-4 h-4" />قواعد الترحيل الفعالة</div><p className="mt-2 text-xs leading-6 text-gray-600 dark:text-gray-300">المبلغ بلا وصف = صرفة يومية، و«سحبية» = سحبية مستقلة، والتأخير يحوّل إلى دقائق. لا تعديل للسجلات السابقة، ولا حفظ لاسم غير مطابق أو سجل مكرر أو حالة غامضة.</p></div>
        {chat.length > 0 && <div className="space-y-2 max-h-32 overflow-y-auto rounded-xl bg-gray-50 dark:bg-slate-900 p-3">{chat.slice(-8).map((m, i) => <div key={i} className={`text-xs p-2 rounded-lg ${m.role === 'user' ? 'bg-white dark:bg-slate-800' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300'}`}><b>{m.role === 'user' ? 'أنت' : 'المساعد'}:</b> {m.text}</div>)}</div>}
        {!parsedRecords ? <div className="space-y-3"><div className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="w-4 h-4 text-indigo-500" />أرسل رسالة الترحيل</div><textarea value={text} onChange={e => setText(e.target.value)} placeholder="مثال:\nالأربعاء 1/7\nمعتصم 4000\nمصطفى 3000 سحبية\nحسام 3000 و5000 سحبية غياب\nعبدالرحمن 2000 داوم ساعتين وتأخير 4 ساعات" className="w-full h-44 p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-sm resize-none" />{error && <div className="flex gap-2 items-center text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm"><AlertCircle className="w-5 h-5" />{error}</div>}</div> : <div className="space-y-4"><div className="flex items-center justify-between"><h4 className="font-semibold">معاينة قبل الحفظ</h4><button onClick={() => setParsedRecords(null)} className="text-sm text-indigo-600 hover:underline flex items-center gap-1"><RotateCcw className="w-4 h-4" />تعديل الرسالة</button></div>{warnings.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300"><div className="font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />تحذيرات تحتاج مراجعة</div><ul className="mt-2 space-y-1 list-disc pr-5">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}<div className="overflow-x-auto rounded-xl border dark:border-slate-700"><table className="min-w-full text-right text-xs"><thead className="bg-gray-50 dark:bg-slate-900"><tr><th className="p-3">العامل</th><th className="p-3">التاريخ</th><th className="p-3">الحضور</th><th className="p-3">الصرفة</th><th className="p-3">السحبية</th><th className="p-3">التأخير</th><th className="p-3">الحالة</th></tr></thead><tbody>{parsedRecords.map((r, i) => <tr key={i} className="border-t dark:border-slate-700"><td className="p-3 font-semibold">{r.workerName}</td><td className="p-3">{r.date}</td><td className="p-3">{r.attendance === 'half' ? 'نصف يوم' : r.attendance === 'absent' ? 'غائب' : 'حاضر'}</td><td className="p-3">{Number(r.allowance || 0).toLocaleString()}</td><td className="p-3">{Number(r.advancePayment || 0).toLocaleString()}</td><td className="p-3">{r.delayMinutes || 0} د</td><td className={`p-3 font-bold ${safeRecords.includes(r) ? 'text-emerald-600' : 'text-amber-600'}`}>{safeRecords.includes(r) ? 'جاهز للحفظ' : 'معلّق للمراجعة'}</td></tr>)}</tbody></table></div><p className="text-xs text-gray-500">سيتم حفظ {safeRecords.length} سجلًا واضحًا، وتعليق {heldRecords.length} سجلًا مشتبهًا أو مكررًا دون تعديل السابق.</p></div>}
      </div>
      <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex gap-3">{!parsedRecords ? <button onClick={handleParse} disabled={isParsing || !text.trim()} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 rounded-xl font-medium">{isParsing ? <><Loader2 className="w-5 h-5 animate-spin" />جاري التحليل...</> : 'تحليل ومراجعة الرسالة'}</button> : <><button onClick={() => setParsedRecords(null)} className="flex-1 px-5 py-3 rounded-xl border border-gray-300 dark:border-slate-600">إلغاء</button><button onClick={handleSave} disabled={isSaving || !safeRecords.length} className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3 rounded-xl font-medium">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}اعتماد السجلات الواضحة فقط</button></>}</div>
    </div>
  </div>;
}
