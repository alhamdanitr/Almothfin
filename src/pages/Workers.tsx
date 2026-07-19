import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { UserPlus, Edit2, Trash2, X, Check, Power, PowerOff } from 'lucide-react';
import { Worker } from '../types';

export default function Workers() {
  const { workers, addWorker, updateWorker, deleteWorker } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const [formData, setFormData] = useState({
    workerNumber: '',
    name: '',
    monthlySalary: '',
    dailyAllowance: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'inactive'
  });

  const openModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        workerNumber: worker.workerNumber || '',
        name: worker.name,
        monthlySalary: String(worker.monthlySalary || ''),
        dailyAllowance: String(worker.dailyAllowance || ''),
        joinDate: worker.joinDate || new Date().toISOString().split('T')[0],
        status: worker.status || 'active'
      });
    } else {
      setEditingWorker(null);
      setFormData({
        workerNumber: '',
        name: '',
        monthlySalary: '',
        dailyAllowance: '',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWorker(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const workerData = {
      workerNumber: formData.workerNumber,
      name: formData.name,
      monthlySalary: Number(formData.monthlySalary) || 0,
      dailyAllowance: Number(formData.dailyAllowance) || 0,
      joinDate: formData.joinDate,
      status: formData.status
    };

    if (editingWorker) {
      updateWorker(editingWorker.id, workerData);
    } else {
      addWorker(workerData);
    }
    
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العامل بالكامل من النظام؟ لا يمكن التراجع عن هذا القرار')) {
      deleteWorker(id);
    }
  };

  const toggleStatus = (worker: Worker) => {
    const newStatus = worker.status === 'inactive' ? 'active' : 'inactive';
    updateWorker(worker.id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة العمال</h2>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          <UserPlus className="w-5 h-5 ml-2" />
          إضافة عامل جديد
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {workers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            لا يوجد عمال مسجلين حالياً. يرجى إضافة عمال للبدء.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-right divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">رقم العامل</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">اسم العامل</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">الحالة</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">الراتب الشهري</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">الصرفة اليومية</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">تاريخ الدخول</th>
                    <th scope="col" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {workers.map((worker) => (
                    <tr key={worker.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${worker.status === 'inactive' ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md text-xs font-mono">{worker.workerNumber || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {worker.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {worker.status === 'inactive' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            غير فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            فعال
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {(worker.monthlySalary || 0).toLocaleString()} د.ع
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {(worker.dailyAllowance || 0).toLocaleString()} د.ع
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {worker.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <button 
                            onClick={() => toggleStatus(worker)} 
                            title={worker.status === 'inactive' ? 'تفعيل العامل' : 'إلغاء تفعيل العامل'}
                            className={`p-1 rounded transition-colors ${worker.status === 'inactive' ? 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30' : 'text-amber-600 hover:text-amber-900 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30'}`}
                          >
                            {worker.status === 'inactive' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openModal(worker)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(worker.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {workers.map((worker) => (
                <div key={worker.id} className={`p-4 space-y-3 ${worker.status === 'inactive' ? 'opacity-60 bg-gray-50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-800'}`}>
                  <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-700 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono text-gray-700 dark:text-gray-300">#{worker.workerNumber || '-'}</span>
                        <h3 className="font-bold text-gray-900 dark:text-white">{worker.name}</h3>
                      </div>
                      {worker.status === 'inactive' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          غير فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          فعال
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleStatus(worker)} 
                        title={worker.status === 'inactive' ? 'تفعيل العامل' : 'إلغاء تفعيل العامل'}
                        className={`p-1.5 rounded transition-colors ${worker.status === 'inactive' ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30'}`}
                      >
                        {worker.status === 'inactive' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openModal(worker)} className="text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30 p-1.5 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(worker.id)} className="text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 p-1.5 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">الراتب الشهري</p>
                      <p className="font-medium text-gray-900 dark:text-white">{(worker.monthlySalary || 0).toLocaleString()} د.ع</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">الصرفة اليومية</p>
                      <p className="font-medium text-gray-900 dark:text-white">{(worker.dailyAllowance || 0).toLocaleString()} د.ع</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ الدخول</p>
                      <p className="font-medium text-gray-900 dark:text-white">{worker.joinDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal for Add/Edit Worker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingWorker ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم العامل</label>
                <input
                  type="text"
                  required
                  value={formData.workerNumber}
                  onChange={(e) => setFormData({...formData, workerNumber: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  placeholder="مثال: 001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم العامل</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  placeholder="الاسم الثلاثي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الراتب الشهري (د.ع)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.monthlySalary}
                  onChange={(e) => setFormData({...formData, monthlySalary: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  placeholder="مثال: 600000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصرفة اليومية الثابتة (د.ع)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.dailyAllowance}
                  onChange={(e) => setFormData({...formData, dailyAllowance: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                  placeholder="مثال: 5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الدخول</label>
                <input
                  type="date"
                  required
                  value={formData.joinDate}
                  onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">حالة العامل</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="active">مستمر بالعمل (فعال)</option>
                  <option value="inactive">تارك للعمل (غير فعال)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none flex items-center"
                >
                  <Check className="w-4 h-4 ml-2" />
                  {editingWorker ? 'حفظ التعديلات' : 'إضافة العامل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
