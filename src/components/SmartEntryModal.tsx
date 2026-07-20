import React, { useState } from 'react';
import { Bot, X, Loader2, AlertCircle, Check } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { AttendanceStatus, DailyRecord } from '../types';

interface SmartEntryModalProps {
  onClose: () => void;
}

export function SmartEntryModal({ onClose }: SmartEntryModalProps) {
  const { workers, addBulkRecords } = useStore();
  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [parsedRecords, setParsedRecords] = useState<any[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const activeWorkers = workers.filter(w => w.status !== 'inactive');

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsParsing(true);
    setError('');
    try {
      const response = await fetch('/api/parse-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          workers: activeWorkers,
          fallbackDate: new Date().toISOString().split('T')[0]
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'فشل الاتصال بالمساعد الذكي');
      }
      
      const data = await response.json();
      if (data.records && data.records.length > 0) {
        // Map records with worker names for preview
        const preview = data.records.map((r: any) => {
          const worker = activeWorkers.find(w => w.id === r.workerId);
          return {
            ...r,
            workerName: worker ? worker.name : 'غير معروف'
          };
        });
        setParsedRecords(preview);
      } else {
        throw new Error('لم يتم التعرف على أي بيانات صحيحة.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsedRecords) return;
    setIsSaving(true);
    
    const recordsToSave: Omit<DailyRecord, 'id'>[] = parsedRecords.map(r => ({
      workerId: r.workerId,
      date: r.date,
      attendance: r.attendance as AttendanceStatus,
      allowance: r.allowance || 0,
      advancePayment: r.advancePayment || 0,
      delayMinutes: r.delayMinutes || 0,
      note: r.note || ''
    }));
    
    await addBulkRecords(recordsToSave);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">الترحيل الذكي</h3>
              <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 mt-0.5">ألصق رسالة الترحيل لتحليلها تلقائياً</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white/50 dark:bg-slate-800/50 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">تمت العملية بنجاح!</h4>
                <p className="text-gray-500 dark:text-gray-400 mt-2">تم تحليل الرسالة وترحيل البيانات بدون أخطاء.</p>
              </div>
            </div>
          ) : !parsedRecords ? (
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="مثال:\nالسبت 18/7\nمصطفى 4000\nحسام 3000 غياب\nعبدالرحمن 2000 داوم ساعتين\nعادل 1500"
                className="w-full h-48 p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-sm resize-none transition-colors"
              />
              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">البيانات المستخرجة</h4>
                <button 
                  onClick={() => setParsedRecords(null)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  تعديل النص
                </button>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {parsedRecords.map((r, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between text-sm">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{r.workerName}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{r.date}</div>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex gap-2 justify-end">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium 
                          ${r.attendance === 'full' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                          ${r.attendance === 'half' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                          ${r.attendance === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                        `}>
                          {r.attendance === 'full' ? 'حاضر' : r.attendance === 'half' ? 'نصف يوم' : 'غائب'}
                        </span>
                      </div>
                      {r.advancePayment > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">سحبيات: {r.advancePayment}</div>
                      )}
                      {r.allowance > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">صرفة: {r.allowance}</div>
                      )}
                      {r.delayMinutes > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">تأخير: {r.delayMinutes} دقيقة</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {!showSuccess && (
          <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
            {!parsedRecords ? (
              <button
                onClick={handleParse}
                disabled={isParsing || !text.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 rounded-xl transition-colors font-medium"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  'تحليل النص'
                )}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3 rounded-xl transition-colors font-medium"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                اعتماد وحفظ السجلات
              </button>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
