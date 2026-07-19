import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { User, Calendar as CalendarIcon, Printer, Edit2, X, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DailyRecord, AttendanceStatus } from '../types';

export default function Statements() {
  const { workers, records, updateRecord } = useStore();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const printRef = useRef<HTMLDivElement>(null);

  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [formData, setFormData] = useState({
    attendance: 'full' as AttendanceStatus,
    allowance: '',
    advancePayment: '',
    discount: '',
    note: ''
  });

  const worker = workers.find(w => w.id === selectedWorkerId);

  const openEditModal = (record: DailyRecord) => {
    setEditingRecord(record);
    setFormData({
      attendance: record.attendance,
      allowance: String(record.allowance !== undefined ? record.allowance : ''),
      advancePayment: String(record.advancePayment || ''),
      discount: String(record.discount || ''),
      note: record.note || ''
    });
  };

  const closeEditModal = () => {
    setEditingRecord(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      updateRecord(editingRecord.id, {
        attendance: formData.attendance,
        allowance: Number(formData.allowance) || 0,
        advancePayment: Number(formData.advancePayment) || 0,
        discount: Number(formData.discount) || 0,
        note: formData.note
      });
      closeEditModal();
    }
  };

  const statementDataByMonth = useMemo(() => {
    if (!worker || !startDate || !endDate) return null;

    const filteredRecords = records.filter(r => 
      r.workerId === worker.id && 
      r.date >= startDate && 
      r.date <= endDate
    ).sort((a, b) => a.date.localeCompare(b.date));

    if (filteredRecords.length === 0) return null;

    const groupedByMonth: Record<string, DailyRecord[]> = {};
    filteredRecords.forEach(r => {
      const monthStr = r.date.substring(0, 7);
      if (!groupedByMonth[monthStr]) groupedByMonth[monthStr] = [];
      groupedByMonth[monthStr].push(r);
    });

    const months = Object.keys(groupedByMonth).sort();
    
    return months.map(month => {
      const monthRecords = groupedByMonth[month];
      let totalEarned = 0;
      let totalAdvances = 0;
      let totalAllowance = 0;
      let totalDiscounts = 0;
      let daysPresent = 0;
      let daysHalf = 0;
      let daysAbsent = 0;

      const dailyRate = (worker.monthlySalary || 0) / 30;

      monthRecords.forEach(r => {
        totalAdvances += Number(r.advancePayment || 0);
        totalAllowance += Number(r.allowance || 0);
        totalDiscounts += Number(r.discount || 0);
        
        if (r.attendance === 'full') {
          daysPresent++;
          totalEarned += dailyRate;
        } else if (r.attendance === 'half') {
          daysHalf++;
          totalEarned += (dailyRate / 2);
        } else if (r.attendance === 'absent') {
          daysAbsent++;
        }
      });

      const netSalary = totalEarned - totalAdvances - totalDiscounts - totalAllowance;

      return {
        month,
        records: monthRecords,
        summary: {
          totalEarned: Math.round(totalEarned),
          totalAdvances,
          totalAllowance,
          totalDiscounts,
          netSalary: Math.round(netSalary),
          daysPresent,
          daysHalf,
          daysAbsent,
          dailyRate: Math.round(dailyRate)
        }
      };
    });
  }, [worker, startDate, endDate, records]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">كشوفات الحساب</h2>
        
        {statementDataByMonth && statementDataByMonth.length > 0 && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <button 
              onClick={handlePrint}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none"
            >
              <Printer className="w-4 h-4 ml-2" />
              طباعة / حفظ كـ PDF
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-700 p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">اختيار العامل</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select 
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white appearance-none transition-colors"
              >
                <option value="">-- اختر العامل --</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.workerNumber})</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
            <div className="relative">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
            <div className="relative">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {statementDataByMonth && statementDataByMonth.length > 0 ? (
        <div ref={printRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:text-black print:bg-white" dir="rtl">
          {statementDataByMonth.map((statementData, index) => (
            <div key={statementData.month} className={`space-y-6 print:block print:p-8 ${index > 0 ? 'print:break-before-page mt-12 print:mt-0 border-t-4 border-dashed border-gray-200 print:border-none pt-12 print:pt-0' : ''}`}>
              {/* Print Header - Only visible when printing/exporting */}
              <div className="hidden print:flex flex-col items-center justify-center border-b-2 border-gray-800 pb-6 mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">معمل هاشم الاحمدي للتطريز الالكتروني</h1>
                <div className="w-24 h-1 bg-gray-800 my-4 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800 bg-gray-100 px-6 py-2 rounded-full border border-gray-200">
                  كشف حساب العامل: <span className="text-indigo-700">{worker?.name}</span>
                </h2>
                <div className="flex items-center gap-4 mt-4 text-gray-600 font-medium">
                  <span className="bg-gray-50 px-4 py-1 rounded-md border border-gray-200">عن شهر: <span className="font-bold text-gray-900">{statementData.month}</span></span>
                  <span className="bg-gray-50 px-4 py-1 rounded-md border border-gray-200">تاريخ الإصدار: <span className="font-bold text-gray-900">{new Date().toLocaleDateString('ar-IQ')}</span></span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5 print:gap-4 print:mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-5 border border-gray-100 dark:border-slate-700 shadow-sm print:shadow-none print:border-gray-200 print:bg-gray-50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600 print:font-semibold">الراتب المستحق</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 print:text-gray-900">{(statementData.summary.totalEarned || 0).toLocaleString()} د.ع</p>
                  <p className="text-xs text-gray-400 mt-2 print:text-gray-500">({statementData.summary.daysPresent + (statementData.summary.daysHalf * 0.5)} يوم)</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-5 border border-gray-100 dark:border-slate-700 shadow-sm print:shadow-none print:border-gray-200 print:bg-gray-50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600 print:font-semibold">إجمالي الصرفيات</p>
                  <p className="text-xl font-bold text-red-500 mt-1 print:text-red-700">{(statementData.summary.totalAllowance || 0).toLocaleString()} د.ع</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-5 border border-gray-100 dark:border-slate-700 shadow-sm print:shadow-none print:border-gray-200 print:bg-gray-50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600 print:font-semibold">إجمالي السحبيات</p>
                  <p className="text-xl font-bold text-red-500 mt-1 print:text-red-700">{(statementData.summary.totalAdvances || 0).toLocaleString()} د.ع</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-5 border border-gray-100 dark:border-slate-700 shadow-sm print:shadow-none print:border-gray-200 print:bg-gray-50">
                  <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600 print:font-semibold">إجمالي الخصومات</p>
                  <p className="text-xl font-bold text-red-500 mt-1 print:text-red-700">{(statementData.summary.totalDiscounts || 0).toLocaleString()} د.ع</p>
                </div>
                <div className="bg-indigo-600 rounded-2xl p-4 lg:p-5 shadow-sm text-white print:bg-gray-800 print:text-white print:border-none print:shadow-md col-span-2 lg:col-span-1 flex flex-col justify-center">
                  <p className="text-indigo-100 text-sm print:text-gray-200 font-medium">الصافي المتبقي</p>
                  <p className="text-2xl font-bold mt-1 print:text-white">{(statementData.summary.netSalary || 0).toLocaleString()} د.ع</p>
                </div>
              </div>

              {/* Details Table */}
              <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden print:shadow-none print:border-gray-300 print:rounded-lg">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20 print:bg-gray-100 print:border-gray-300 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white print:text-gray-900">تفاصيل الحركات اليومية ({statementData.month})</h3>
                </div>
                {statementData.records.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 print:text-gray-600">
                    لا توجد سجلات لهذا العامل في الشهر المحدد.
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block overflow-x-auto print:block">
                      <table className="min-w-full text-right divide-y divide-gray-200 dark:divide-slate-700 print:divide-gray-300">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 print:bg-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:text-gray-900">التاريخ</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:text-gray-900">اليوم</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:text-gray-900">الحضور</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:text-gray-900">الصرفة</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:text-gray-900">السحبيات</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:text-gray-900">الخصم</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:text-gray-900">ملاحظات</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-300 print:hidden">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700 print:divide-gray-200">
                          {statementData.records.map((r, i) => {
                            const dateObj = parseISO(r.date);
                            return (
                              <tr key={r.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent ${i % 2 === 0 ? 'print:bg-white' : 'print:bg-gray-50'}`}>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white print:text-gray-900">
                                  {r.date}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 print:text-gray-700">
                                  {format(dateObj, 'EEEE')}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                                    ${r.attendance === 'full' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 print:bg-emerald-100 print:text-emerald-800 border print:border-emerald-200' : 
                                      r.attendance === 'half' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 print:bg-amber-100 print:text-amber-800 border print:border-amber-200' : 
                                      'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 print:bg-red-100 print:text-red-800 border print:border-red-200'}`}>
                                    {r.attendance === 'full' ? 'حاضر' : r.attendance === 'half' ? 'نصف يوم' : 'غائب'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium print:text-gray-900">
                                  {r.allowance && r.allowance > 0 ? <span className="text-red-500 print:text-red-700">{(r.allowance || 0).toLocaleString()}</span> : <span className="text-gray-400 print:text-gray-300">-</span>}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium print:text-gray-900">
                                  {r.advancePayment > 0 ? <span className="text-red-500 print:text-red-700">{(r.advancePayment || 0).toLocaleString()}</span> : <span className="text-gray-400 print:text-gray-300">-</span>}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium print:text-gray-900">
                                  {r.discount > 0 ? <span className="text-red-500 print:text-red-700">{(r.discount || 0).toLocaleString()}</span> : <span className="text-gray-400 print:text-gray-300">-</span>}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 print:text-gray-600 print:max-w-[200px] print:truncate print:whitespace-normal">
                                  {r.note || <span className="text-gray-300 print:text-gray-200">-</span>}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm print:hidden">
                                  <button onClick={() => openEditModal(r)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-700 print:hidden">
                      {statementData.records.map((r) => {
                        const dateObj = parseISO(r.date);
                        return (
                          <div key={r.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white" dir="ltr">{r.date}</span>
                                <span className="text-xs text-gray-500">{format(dateObj, 'EEEE')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${r.attendance === 'full' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 
                                      r.attendance === 'half' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 
                                      'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>
                                    {r.attendance === 'full' ? 'حاضر' : r.attendance === 'half' ? 'نصف يوم' : 'غائب'}
                                </span>
                                <button onClick={() => openEditModal(r)} className="text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 p-1 rounded transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg text-center">
                                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الصرفة</span>
                                <span className={r.allowance && r.allowance > 0 ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-300"}>
                                  {r.allowance && r.allowance > 0 ? r.allowance.toLocaleString() : '-'}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg text-center">
                                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">السحبيات</span>
                                <span className={r.advancePayment > 0 ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-300"}>
                                  {r.advancePayment > 0 ? r.advancePayment.toLocaleString() : '-'}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg text-center">
                                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الخصم</span>
                                <span className={r.discount > 0 ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-300"}>
                                  {r.discount > 0 ? r.discount.toLocaleString() : '-'}
                                </span>
                              </div>
                            </div>
                            {r.note && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/30 p-2 rounded-lg">
                                <span className="font-medium mr-1">ملاحظة:</span> {r.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 print:hidden">
          {worker ? 'لا توجد سجلات لهذا العامل في الفترة المحددة' : 'يرجى تحديد العامل والفترة الزمنية لعرض كشف الحساب'}
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                تعديل سجل {worker?.name}
              </h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">حالة الحضور</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'full', label: 'حاضر', color: 'peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 dark:peer-checked:bg-emerald-900/30 dark:peer-checked:text-emerald-300 dark:peer-checked:border-emerald-500' },
                    { value: 'half', label: 'نصف يوم', color: 'peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-700 dark:peer-checked:bg-amber-900/30 dark:peer-checked:text-amber-300 dark:peer-checked:border-amber-500' },
                    { value: 'absent', label: 'غائب', color: 'peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 dark:peer-checked:bg-red-900/30 dark:peer-checked:text-red-300 dark:peer-checked:border-red-500' }
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="edit_attendance" 
                        value={opt.value}
                        checked={formData.attendance === opt.value}
                        onChange={(e) => setFormData({...formData, attendance: e.target.value as AttendanceStatus})}
                        className="hidden peer" 
                      />
                      <div className={`text-center py-2 border border-gray-200 dark:border-slate-700 rounded-xl transition-all ${opt.color} hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium`}>
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصرفة (د.ع)</label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.allowance}
                    onChange={(e) => setFormData({...formData, allowance: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">السحبيات (د.ع)</label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData({...formData, advancePayment: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الخصم (د.ع)</label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات</label>
                <textarea 
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <Check className="w-4 h-4 ml-2" />
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
