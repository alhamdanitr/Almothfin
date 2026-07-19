import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Save, Calendar } from 'lucide-react';
import { AttendanceStatus } from '../types';

export default function DailyEntry() {
  const { workers, records, addBulkRecords } = useStore();
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Only show active workers
  const activeWorkers = useMemo(() => workers.filter(w => w.status !== 'inactive'), [workers]);

  // State for the form: key is workerId
  const [entries, setEntries] = useState<Record<string, {
    attendance: AttendanceStatus,
    allowance: string,
    advancePayment: string,
    discount: string,
    note: string
  }>>({});

  useEffect(() => {
    const initialEntries: typeof entries = {};
    const existingRecords = records.filter(r => r.date === selectedDate);
    
    activeWorkers.forEach(worker => {
      const existing = existingRecords.find(r => r.workerId === worker.id);
      if (existing) {
        initialEntries[worker.id] = {
          attendance: existing.attendance,
          allowance: String(existing.allowance !== undefined ? existing.allowance : ''),
          advancePayment: String(existing.advancePayment || ''),
          discount: String(existing.discount || ''),
          note: existing.note || ''
        };
      } else {
        initialEntries[worker.id] = {
          attendance: 'full',
          allowance: worker.dailyAllowance > 0 ? String(worker.dailyAllowance) : '',
          advancePayment: '',
          discount: '',
          note: ''
        };
      }
    });
    setEntries(initialEntries);
  }, [selectedDate, activeWorkers, records]);

  const hasExistingRecords = useMemo(() => {
    return records.some(r => r.date === selectedDate);
  }, [records, selectedDate]);

  const handleEntryChange = (workerId: string, field: string, value: string) => {
    setEntries(prev => ({
      ...prev,
      [workerId]: {
        ...(prev[workerId] || { attendance: 'full', allowance: '', advancePayment: '', discount: '', note: '' }),
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const newRecords: any[] = [];
    
    activeWorkers.forEach(worker => {
      const entry = entries[worker.id];
      if (entry) {
        newRecords.push({
          workerId: worker.id,
          date: selectedDate,
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
      alert('تم حفظ السجلات بنجاح!');
    });
  };

  if (activeWorkers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        لا يوجد عمال فعالين مسجلين لتعبئة اليومية.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الترحيل اليومي</h2>
          <p className="text-sm text-gray-500 mt-1">تسجيل الحضور والصرفيات لجميع العمال ليوم محدد</p>
          {hasExistingRecords && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-medium bg-amber-50 dark:bg-amber-900/30 inline-block px-3 py-1 rounded-md">
              تنبيه: أنت تقوم بتعديل بيانات مسجلة مسبقاً لهذا اليوم.
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white shadow-sm"
            />
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
            ) : (
              <Save className="w-5 h-5 ml-2" />
            )}
            حفظ يومية ({activeWorkers.length} عمال)
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-right divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">اسم العامل</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">الحضور</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">الصرفة (د.ع)</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">السحبيات (د.ع)</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[15%]">الخصم (د.ع)</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300 w-[25%]">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {activeWorkers.map((worker) => {
                const entry = entries[worker.id] || { attendance: 'full', allowance: '', advancePayment: '', discount: '', note: '' };
                return (
                  <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {worker.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={entry.attendance}
                        onChange={(e) => handleEntryChange(worker.id, 'attendance', e.target.value)}
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
                        onChange={(e) => handleEntryChange(worker.id, 'allowance', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.advancePayment}
                        onChange={(e) => handleEntryChange(worker.id, 'advancePayment', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.discount}
                        onChange={(e) => handleEntryChange(worker.id, 'discount', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        placeholder="ملاحظة..."
                        value={entry.note}
                        onChange={(e) => handleEntryChange(worker.id, 'note', e.target.value)}
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
          {activeWorkers.map((worker) => {
            const entry = entries[worker.id] || { attendance: 'full', allowance: '', advancePayment: '', discount: '', note: '' };
            return (
              <div key={worker.id} className="p-4 space-y-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
                  {worker.name}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الحضور</label>
                    <select
                      value={entry.attendance}
                      onChange={(e) => handleEntryChange(worker.id, 'attendance', e.target.value)}
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
                      onChange={(e) => handleEntryChange(worker.id, 'allowance', e.target.value)}
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
                      onChange={(e) => handleEntryChange(worker.id, 'advancePayment', e.target.value)}
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
                      onChange={(e) => handleEntryChange(worker.id, 'discount', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ملاحظات</label>
                    <input
                      type="text"
                      placeholder="ملاحظة..."
                      value={entry.note}
                      onChange={(e) => handleEntryChange(worker.id, 'note', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

