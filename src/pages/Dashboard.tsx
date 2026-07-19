import React, { useMemo, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Users, UserCheck, CreditCard, Wallet, TrendingUp, Edit2, X, Check } from 'lucide-react';
import { DailyRecord, AttendanceStatus } from '../types';

export default function Dashboard() {
  const { workers, records, updateRecord } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7); // YYYY-MM

  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [formData, setFormData] = useState({
    attendance: 'full' as AttendanceStatus,
    allowance: '',
    advancePayment: '',
    discount: '',
    note: ''
  });

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

  const stats = useMemo(() => {
    const presentToday = records.filter(r => r.date === today && (r.attendance === 'full' || r.attendance === 'half')).length;
    
    let totalAdvancesMonth = 0;
    let totalAllowanceMonth = 0;
    let totalSalaries = 0;
    let earnedSalaries = 0; // Sum of wages based on attendance
    let totalDiscounts = 0;
    
    const activeWorkers = workers.filter(w => w.status !== 'inactive');

    // Calculate total base salaries for all workers (just as an indicator)
    activeWorkers.forEach(w => totalSalaries += Number(w.monthlySalary || 0));

    // Calculate this month's financials based on records
    const thisMonthRecords = records.filter(r => r.date.startsWith(currentMonth));
    thisMonthRecords.forEach(r => {
      totalAdvancesMonth += Number(r.advancePayment || 0);
      totalAllowanceMonth += Number(r.allowance || 0);
      totalDiscounts += Number(r.discount || 0);
      
      const worker = workers.find(w => w.id === r.workerId);
      if (worker) {
        // Calculate daily rate
        const dailyRate = (worker.monthlySalary || 0) / 30; // Assuming 30 days
        if (r.attendance === 'full') earnedSalaries += dailyRate;
        else if (r.attendance === 'half') earnedSalaries += (dailyRate / 2);
      }
    });

    const remainingSalariesMonth = earnedSalaries - totalAdvancesMonth - totalAllowanceMonth - totalDiscounts;

    return {
      totalWorkers: activeWorkers.length,
      presentToday,
      totalAdvancesMonth,
      totalAllowanceMonth,
      remainingSalariesMonth: Math.max(0, remainingSalariesMonth),
    };
  }, [workers, records, today, currentMonth]);

  const statCards = [
    { title: 'إجمالي العمال', value: stats.totalWorkers, icon: Users, color: 'bg-blue-500' },
    { title: 'الحاضرين اليوم', value: stats.presentToday, icon: UserCheck, color: 'bg-emerald-500' },
    { title: 'سحبيات الشهر', value: `${(stats.totalAdvancesMonth || 0).toLocaleString()} د.ع`, icon: CreditCard, color: 'bg-amber-500' },
    { title: 'الرواتب المتبقية', value: `${Math.round(stats.remainingSalariesMonth || 0).toLocaleString()} د.ع`, icon: Wallet, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">نظرة عامة</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          تاريخ اليوم: {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="p-6 flex items-center">
              <div className={`p-4 rounded-xl ${stat.color} text-white shadow-inner`}>
                <stat.icon size={24} />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="ml-2 w-5 h-5 text-indigo-500" />
          نشاط اليوم
        </h3>
        {records.filter(r => r.date === today).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            لم يتم تسجيل أي نشاط لليوم حتى الآن.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b dark:border-slate-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <th className="pb-3 pr-4">اسم العامل</th>
                    <th className="pb-3 px-4">الحضور</th>
                    <th className="pb-3 px-4">الصرفة</th>
                    <th className="pb-3 px-4">السحبيات</th>
                    <th className="pb-3 pl-4">الخصم</th>
                    <th className="pb-3 pl-4">تعديل</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records.filter(r => r.date === today).map(record => {
                    const worker = workers.find(w => w.id === record.workerId);
                    if (!worker) return null;
                    
                    return (
                      <tr key={record.id} className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{worker.name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${record.attendance === 'full' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 
                              record.attendance === 'half' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 
                              'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>
                            {record.attendance === 'full' ? 'حاضر' : record.attendance === 'half' ? 'نصف يوم' : 'غائب'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {record.allowance && record.allowance > 0 ? (
                            <span className="text-red-500 font-medium">{(record.allowance || 0).toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {record.advancePayment > 0 ? (
                            <span className="text-red-500 font-medium">{(record.advancePayment || 0).toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 pl-4 text-gray-600 dark:text-gray-300">
                          {record.discount > 0 ? (
                            <span className="text-red-500 font-medium">{(record.discount || 0).toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 pl-4">
                          <button onClick={() => openEditModal(record)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
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
            <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {records.filter(r => r.date === today).map(record => {
                const worker = workers.find(w => w.id === record.workerId);
                if (!worker) return null;
                
                return (
                  <div key={record.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-2">
                      <span className="font-bold text-gray-900 dark:text-white">{worker.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${record.attendance === 'full' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 
                              record.attendance === 'half' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 
                              'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>
                            {record.attendance === 'full' ? 'حاضر' : record.attendance === 'half' ? 'نصف يوم' : 'غائب'}
                        </span>
                        <button onClick={() => openEditModal(record)} className="text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 p-1 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الصرفة</span>
                        <span className={record.allowance && record.allowance > 0 ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-300"}>
                          {record.allowance && record.allowance > 0 ? record.allowance.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">السحبيات</span>
                        <span className={record.advancePayment > 0 ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-300"}>
                          {record.advancePayment > 0 ? record.advancePayment.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الخصم</span>
                        <span className={record.discount > 0 ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-300"}>
                          {record.discount > 0 ? record.discount.toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                تعديل سجل {workers.find(w => w.id === editingRecord.workerId)?.name}
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
