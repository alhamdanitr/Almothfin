import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Save, Calendar, User } from 'lucide-react';
import { AttendanceStatus } from '../types';
import { addDays, format, parseISO, differenceInDays } from 'date-fns';

export default function BulkEntry() {
  const { workers, records, addBulkRecords } = useStore();
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Only show active workers in dropdown
  const activeWorkers = useMemo(() => workers.filter(w => w.status !== 'inactive'), [workers]);

  // State for the bulk form: key is date
  const [entries, setEntries] = useState<Record<string, {
    attendance: AttendanceStatus,
    allowance: string,
    advancePayment: string,
    discount: string,
    note: string
  }>>({});

  const datesInRange = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const diff = differenceInDays(end, start);
    
    if (diff < 0) return [];
    
    const dates = [];
    for (let i = 0; i <= diff; i++) {
      dates.push(format(addDays(start, i), 'yyyy-MM-dd'));
    }
    return dates;
  }, [startDate, endDate]);

  const hasExistingRecords = useMemo(() => {
    if (!selectedWorkerId || datesInRange.length === 0) return false;
    return records.some(r => r.workerId === selectedWorkerId && datesInRange.includes(r.date));
  }, [records, selectedWorkerId, datesInRange]);

  // Initialize entries when dates or worker change
  useEffect(() => {
    if (!selectedWorkerId) {
      setEntries({});
      return;
    }

    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker) return;

    const initialEntries: typeof entries = {};
    
    datesInRange.forEach(date => {
      const existingRecord = records.find(r => r.date === date && r.workerId === selectedWorkerId);
      
      if (existingRecord) {
        initialEntries[date] = {
          attendance: existingRecord.attendance,
          allowance: String(existingRecord.allowance !== undefined ? existingRecord.allowance : ''),
          advancePayment: String(existingRecord.advancePayment || ''),
          discount: String(existingRecord.discount || ''),
          note: existingRecord.note || ''
        };
      } else {
        initialEntries[date] = {
          attendance: 'full',
          allowance: worker.dailyAllowance > 0 ? String(worker.dailyAllowance) : '',
          advancePayment: '',
          discount: '',
          note: ''
        };
      }
    });
    
    setEntries(initialEntries);
  }, [datesInRange, selectedWorkerId, workers, records]);

  const handleEntryChange = (date: string, field: string, value: string) => {
    setEntries(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || { attendance: 'full', allowance: '', advancePayment: '', discount: '', note: '' }),
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    if (!selectedWorkerId) return;

    setIsSaving(true);
    const newRecords: any[] = [];
    
    datesInRange.forEach(date => {
      const entry = entries[date];
      if (entry) {
        newRecords.push({
          workerId: selectedWorkerId,
          date: date,
          attendance: entry.attendance,
          allowance: Number(entry.allowance) || 0,
          advancePayment: Number(entry.advancePayment) || 0,
          discount: Number(entry.discount) || 0,
          note: entry.note
        });
      }
    });

    addBulkRecords(newRecords).then(() => {
      setIsSaving(false);
      alert('تم حفظ البيانات بنجاح للأيام المحددة!');
    });
  };

  if (activeWorkers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        لا يوجد عمال فعالين مسجلين. يرجى إضافتهم أولاً.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الترحيل الجماعي الفردي</h2>
          <p className="text-sm text-gray-500 mt-1">تعبئة الحضور والصرفيات لعامل محدد عبر فترة زمنية</p>
          {hasExistingRecords && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-medium bg-amber-50 dark:bg-amber-900/30 inline-block px-3 py-1 rounded-md">
              تنبيه: يوجد بيانات مسجلة مسبقاً ضمن هذه الفترة، الحفظ سيقوم بتعديلها.
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-48">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white shadow-sm appearance-none"
            >
              <option value="" disabled>اختر العامل...</option>
              {activeWorkers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
            <div className="relative w-full">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white shadow-sm"
              />
            </div>
            <span className="text-gray-500">إلى</span>
            <div className="relative w-full">
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white shadow-sm"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving || datesInRange.length === 0 || !selectedWorkerId}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
            ) : (
              <Save className="w-5 h-5 ml-2" />
            )}
            ترحيل ({datesInRange.length} أيام)
          </button>
        </div>
      </div>

      {!selectedWorkerId ? (
        <div className="p-8 text-center text-gray-500 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
          يرجى اختيار العامل وتحديد الفترة الزمنية
        </div>
      ) : datesInRange.length === 0 ? (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          يرجى التأكد من أن تاريخ النهاية أكبر من أو يساوي تاريخ البداية.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
              <User className="w-4 h-4 ml-2 text-indigo-500" />
              {workers.find(w => w.id === selectedWorkerId)?.name}
            </h3>
            <span className="text-sm text-gray-500 font-mono">
              {startDate} <span className="mx-1">→</span> {endDate}
            </span>
          </div>
          
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full text-right divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">التاريخ</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">الحضور</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">الصرفة (د.ع)</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">السحبيات (د.ع)</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">الخصم (د.ع)</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[25%]">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {datesInRange.map((date) => {
                  const entry = entries[date] || { attendance: 'full', allowance: '', advancePayment: '', discount: '', note: '' };
                  
                  return (
                    <tr key={date} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                        {date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={entry.attendance}
                          onChange={(e) => handleEntryChange(date, 'attendance', e.target.value)}
                          className={`w-full py-2 px-3 border rounded-lg text-sm outline-none transition-colors
                            ${entry.attendance === 'full' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300' : ''}
                            ${entry.attendance === 'half' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300' : ''}
                            ${entry.attendance === 'absent' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300' : ''}
                          `}
                        >
                          <option value="full">حاضر</option>
                          <option value="half">نصف يوم</option>
                          <option value="absent">غائب</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={entry.allowance}
                          onChange={(e) => handleEntryChange(date, 'allowance', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={entry.advancePayment}
                          onChange={(e) => handleEntryChange(date, 'advancePayment', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={entry.discount}
                          onChange={(e) => handleEntryChange(date, 'discount', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          placeholder="ملاحظة..."
                          value={entry.note}
                          onChange={(e) => handleEntryChange(date, 'note', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-700/50">
            {datesInRange.map((date) => {
              const entry = entries[date] || { attendance: 'full', allowance: '', advancePayment: '', discount: '', note: '' };
              return (
                <div key={date} className="p-4 space-y-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2" dir="ltr">
                    {date}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الحضور</label>
                      <select
                        value={entry.attendance}
                        onChange={(e) => handleEntryChange(date, 'attendance', e.target.value)}
                        className={`w-full py-2 px-3 border rounded-lg text-sm outline-none transition-colors
                          ${entry.attendance === 'full' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300' : ''}
                          ${entry.attendance === 'half' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300' : ''}
                          ${entry.attendance === 'absent' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300' : ''}
                        `}
                      >
                        <option value="full">حاضر</option>
                        <option value="half">نصف يوم</option>
                        <option value="absent">غائب</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الصرفة (د.ع)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.allowance}
                        onChange={(e) => handleEntryChange(date, 'allowance', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">السحبيات (د.ع)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.advancePayment}
                        onChange={(e) => handleEntryChange(date, 'advancePayment', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الخصم (د.ع)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.discount}
                        onChange={(e) => handleEntryChange(date, 'discount', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ملاحظات</label>
                      <input
                        type="text"
                        placeholder="ملاحظة..."
                        value={entry.note}
                        onChange={(e) => handleEntryChange(date, 'note', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
