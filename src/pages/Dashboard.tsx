import React, { useMemo, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Users, UserCheck, CreditCard, Wallet, TrendingUp, Edit2, X, Check, Database } from 'lucide-react';
import { DailyRecord, AttendanceStatus } from '../types';
import { SmartEntryModal } from '../components/SmartEntryModal';
import { Bot } from 'lucide-react';
import { getMonthlySalaryForDate } from '../lib/salaryHistory';

export default function Dashboard() {
  const { workers, records, updateRecord, activeCompany } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7); // YYYY-MM

  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    attendance: 'full' as AttendanceStatus,
    allowance: '',
    advancePayment: '',
    delayMinutes: '',
    note: ''
  });

  const openEditModal = (record: DailyRecord) => {
    setEditingRecord(record);
    setFormData({
      attendance: record.attendance,
      allowance: String(record.allowance !== undefined ? record.allowance : ''),
      advancePayment: String(record.advancePayment || ''),
      delayMinutes: String(record.delayMinutes || ''),
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
        delayMinutes: Number(formData.delayMinutes) || 0,
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
      
      const worker = workers.find(w => w.id === r.workerId);
      if (worker) {
        // Calculate the daily rate that was active on this record's date.
        const dailyRate = getMonthlySalaryForDate(worker, r.date) / 30;
        if (r.attendance === 'full') earnedSalaries += dailyRate;
        else if (r.attendance === 'half') earnedSalaries += (dailyRate / 2);
        
        // Calculate financial discount based on delay minutes (12 hours = 720 mins)
        const discountAmount = ((Number(r.delayMinutes || 0)) / 720) * dailyRate;
        totalDiscounts += discountAmount;
      }
    });

    const remainingSalariesMonth = Math.round(earnedSalaries - totalAdvancesMonth - totalAllowanceMonth - totalDiscounts);

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
    { title: 'الحاضرين اليوم', value: stats.presentToday, icon: UserCheck, color: 'bg-success' },
    { title: 'سحبيات الشهر', value: `${(stats.totalAdvancesMonth || 0).toLocaleString()} ر.ي`, icon: CreditCard, color: 'bg-amber-500' },
    { title: 'الرواتب المتبقية', value: `${Math.round(stats.remainingSalariesMonth || 0).toLocaleString()} ر.ي`, icon: Wallet, color: 'bg-secondary' },
  ];

  return (
    <div className="space-y-6">

      {/* Company Info Banner */}
      {activeCompany && (
        <div className="bg-surface dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-border-main dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-1">
              {activeCompany.name}
            </h2>
            {activeCompany.description && (
              <p className="text-sm text-text-muted dark:text-gray-400">
                {activeCompany.description}
              </p>
            )}
          </div>
          {(activeCompany.phones || activeCompany.address) && (
            <div className="flex flex-col gap-1 text-sm text-text-muted dark:text-gray-400 text-right sm:text-left">
              {activeCompany.phones && <p>📞 {activeCompany.phones}</p>}
              {activeCompany.address && <p>📍 {activeCompany.address}</p>}
            </div>
          )}
        </div>
      )}

      {/* Smart Entry Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group cursor-pointer" onClick={() => setSmartModalOpen(true)}>
        <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
          <Bot size={120} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center">
              <Bot className="ml-2 w-6 h-6" />
              المساعد الذكي (AI)
            </h3>
            <p className="text-brand-bg max-w-md text-sm">
              قم بلصق نصوص الحضور والانصراف والصرفيات، وسيقوم الذكاء الاصطناعي بتحليلها وترحيلها تلقائياً.
            </p>
          </div>
          <button className="bg-surface/20 hover:bg-surface/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            فتح المساعد
          </button>
        </div>
      </div>
      
      {smartModalOpen && <SmartEntryModal onClose={() => setSmartModalOpen(false)} />}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">نظرة عامة</h2>
        <div className="text-sm text-text-muted dark:text-text-muted font-medium">
          تاريخ اليوم: {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="overflow-hidden bg-surface dark:bg-slate-800 rounded-2xl shadow-sm border border-border-main dark:border-slate-700">
            <div className="p-6 flex items-center">
              <div className={`p-4 rounded-xl ${stat.color} text-white shadow-inner`}>
                <stat.icon size={24} />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-text-muted dark:text-text-muted">{stat.title}</p>
                <p className="text-2xl font-semibold text-text-main dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Overview */}
      <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-sm border border-border-main dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center">
          <TrendingUp className="ml-2 w-5 h-5 text-secondary" />
          نشاط اليوم
        </h3>
        {records.filter(r => r.date === today).length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-muted">
            لم يتم تسجيل أي نشاط لليوم حتى الآن.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b dark:border-slate-700 text-sm font-medium text-text-muted dark:text-text-muted">
                    <th className="pb-3 pr-4">اسم العامل</th>
                    <th className="pb-3 px-4">الحضور</th>
                    <th className="pb-3 px-4">الصرفة</th>
                    <th className="pb-3 px-4">السحبيات</th>
                    <th className="pb-3 pl-4">التأخير (دقيقة)</th>
                    <th className="pb-3 pl-4">تعديل</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records.filter(r => r.date === today).map(record => {
                    const worker = workers.find(w => w.id === record.workerId);
                    if (!worker) return null;
                    
                    return (
                      <tr key={record.id} className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-brand-bg dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-text-main dark:text-white">{worker.name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${record.attendance === 'full' ? 'bg-emerald-100 text-emerald-800 dark:bg-success/20 dark:text-emerald-300' : 
                              record.attendance === 'half' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 
                              'bg-red-100 text-red-800 dark:bg-danger/20 dark:text-red-300'}`}>
                            {record.attendance === 'full' ? 'حاضر' : record.attendance === 'half' ? 'نصف يوم' : 'غائب'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-muted dark:text-gray-300">
                          {record.allowance && record.allowance > 0 ? (
                            <span className="text-danger font-medium">{(record.allowance || 0).toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-text-muted dark:text-gray-300">
                          {record.advancePayment > 0 ? (
                            <span className="text-danger font-medium">{(record.advancePayment || 0).toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 pl-4 text-text-muted dark:text-gray-300">
                          {record.delayMinutes > 0 ? (
                            <span className="text-danger font-medium">{(record.delayMinutes || 0).toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 pl-4">
                          <button onClick={() => openEditModal(record)} className="text-primary hover:text-primary/80 dark:text-secondary dark:hover:text-primary/40 p-1 rounded hover:bg-primary/10 dark:hover:bg-primary/80/30 transition-colors">
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
                    <div className="flex justify-between items-center border-b border-border-main dark:border-slate-700 pb-2">
                      <span className="font-bold text-text-main dark:text-white">{worker.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${record.attendance === 'full' ? 'bg-emerald-100 text-emerald-800 dark:bg-success/20 dark:text-emerald-300' : 
                              record.attendance === 'half' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 
                              'bg-red-100 text-red-800 dark:bg-danger/20 dark:text-red-300'}`}>
                            {record.attendance === 'full' ? 'حاضر' : record.attendance === 'half' ? 'نصف يوم' : 'غائب'}
                        </span>
                        <button onClick={() => openEditModal(record)} className="text-primary hover:bg-primary/10 dark:text-secondary dark:hover:bg-primary/80/30 p-1 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-brand-bg dark:bg-slate-900/50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-text-muted dark:text-text-muted mb-1">الصرفة</span>
                        <span className={record.allowance && record.allowance > 0 ? "text-danger font-medium" : "text-text-muted dark:text-gray-300"}>
                          {record.allowance && record.allowance > 0 ? record.allowance.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div className="bg-brand-bg dark:bg-slate-900/50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-text-muted dark:text-text-muted mb-1">السحبيات</span>
                        <span className={record.advancePayment > 0 ? "text-danger font-medium" : "text-text-muted dark:text-gray-300"}>
                          {record.advancePayment > 0 ? record.advancePayment.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div className="bg-brand-bg dark:bg-slate-900/50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-text-muted dark:text-text-muted mb-1">التأخير (دقيقة)</span>
                        <span className={record.delayMinutes > 0 ? "text-danger font-medium" : "text-text-muted dark:text-gray-300"}>
                          {record.delayMinutes > 0 ? record.delayMinutes.toLocaleString() : '-'}
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
          <div className="w-full max-w-md bg-surface dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-bold text-text-main dark:text-white">
                تعديل سجل {workers.find(w => w.id === editingRecord.workerId)?.name}
              </h3>
              <button onClick={closeEditModal} className="text-text-muted hover:text-text-muted dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main dark:text-gray-300">حالة الحضور</label>
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
                      <div className={`text-center py-2 border border-border-main dark:border-slate-700 rounded-xl transition-all ${opt.color} hover:bg-brand-bg dark:hover:bg-slate-700 text-text-muted dark:text-text-muted text-sm font-medium`}>
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main dark:text-gray-300">الصرفة (ر.ي)</label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.allowance}
                    onChange={(e) => setFormData({...formData, allowance: e.target.value})}
                    className="w-full px-4 py-2 bg-brand-bg dark:bg-slate-900 border border-border-main dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main dark:text-gray-300">السحبيات (ر.ي)</label>
                  <input 
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData({...formData, advancePayment: e.target.value})}
                    className="w-full px-4 py-2 bg-brand-bg dark:bg-slate-900 border border-border-main dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main dark:text-gray-300">التأخير (دقيقة)</label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.delayMinutes}
                    onChange={(e) => setFormData({...formData, delayMinutes: e.target.value})}
                    className="w-full px-4 py-2 bg-brand-bg dark:bg-slate-900 border border-border-main dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main dark:text-gray-300">ملاحظات</label>
                <textarea 
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full px-4 py-2 bg-brand-bg dark:bg-slate-900 border border-border-main dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main dark:text-white resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-text-main dark:text-gray-300 bg-surface dark:bg-slate-800 border border-border-main dark:border-slate-600 rounded-lg hover:bg-brand-bg dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center"
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
