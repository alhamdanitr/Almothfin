const fs = require('fs');
let code = fs.readFileSync('src/pages/Workers.tsx', 'utf8');

const advancesTab = `
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-main">سلف الموظفين</h2>
              <p className="text-sm text-text-muted mt-1">إدارة سحبيات الموظفين الكبيرة ومتابعة سدادها</p>
            </div>
            <button 
              onClick={() => {
                resetAdvanceForm();
                setIsAdvanceModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة سلفة
            </button>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm border border-border-main overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b bg-brand-bg/50 text-sm font-medium text-text-muted">
                    <th className="p-4">العامل</th>
                    <th className="p-4">تاريخ السلفة</th>
                    <th className="p-4">المبلغ الأساسي</th>
                    <th className="p-4">المبلغ المسدد</th>
                    <th className="p-4">المتبقي</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">طريقة الخصم</th>
                    <th className="p-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-text-muted">
                        لا توجد سلف مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    advances.map(advance => {
                      const worker = workers.find(w => w.id === advance.workerId);
                      const remaining = advance.amount - (advance.paidAmount || 0);
                      
                      return (
                        <tr key={advance.id} className="border-b last:border-0 hover:bg-brand-bg/50 transition-colors">
                          <td className="p-4 font-bold text-text-main">{worker?.name || 'عامل غير معروف'}</td>
                          <td className="p-4 text-text-muted">{advance.date}</td>
                          <td className="p-4 font-bold text-text-main">{advance.amount.toLocaleString()}</td>
                          <td className="p-4 font-medium text-success">{(advance.paidAmount || 0).toLocaleString()}</td>
                          <td className="p-4 font-bold text-danger">{remaining.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold \${
                              advance.status === 'completed' 
                                ? 'bg-success/10 text-success' 
                                : 'bg-warning/10 text-warning'
                            }\`}>
                              {advance.status === 'completed' ? 'مكتملة' : 'نشطة'}
                            </span>
                          </td>
                          <td className="p-4 text-text-muted text-xs font-medium">
                            {advance.deductionMethod === 'automatic' ? (
                              <span className="flex items-center"><CalendarDays className="w-3.5 h-3.5 ml-1" /> مع الراتب</span>
                            ) : (
                              <span className="flex items-center"><Banknote className="w-3.5 h-3.5 ml-1" /> دفع يدوي</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openEditAdvanceModal(advance)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteAdvance(e, advance.id)}
                                className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/          <\/>\n        \)}\n      <\/div>\n\n      {\/\* Modal for Add\/Edit Worker \*\//, `          </>\n        )}\n      </div>\n${advancesTab}\n      {/* Modal for Add/Edit Worker */`);

const advanceModal = `
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-text-main flex items-center">
                <Banknote className="w-5 h-5 ml-2 text-secondary" />
                {editingAdvance ? 'تعديل سلفة الموظف' : 'إضافة سلفة جديدة'}
              </h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="text-text-muted hover:text-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdvanceSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">العامل <span className="text-danger">*</span></label>
                <select required value={advanceData.workerId} onChange={e => setAdvanceData({...advanceData, workerId: e.target.value})} className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  {workers.length === 0 && <option value="">لا يوجد عمال</option>}
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">المبلغ الأساسي <span className="text-danger">*</span></label>
                  <input required type="number" min="0" value={advanceData.amount} onChange={e => setAdvanceData({...advanceData, amount: e.target.value})} className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">المبلغ المسدد</label>
                  <input type="number" min="0" value={advanceData.paidAmount} onChange={e => setAdvanceData({...advanceData, paidAmount: e.target.value})} className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">تاريخ السلفة</label>
                  <input required type="date" value={advanceData.date} onChange={e => setAdvanceData({...advanceData, date: e.target.value})} className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">حالة السلفة</label>
                  <select value={advanceData.status} onChange={e => setAdvanceData({...advanceData, status: e.target.value})} className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="active">نشطة</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">طريقة الخصم والاستقطاع</label>
                <div className="bg-brand-bg p-3 rounded-lg border border-border-main space-y-3">
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <input type="radio" name="deductionMethod" value="automatic" checked={advanceData.deductionMethod === 'automatic'} onChange={() => setAdvanceData({...advanceData, deductionMethod: 'automatic'})} className="w-4 h-4 text-primary focus:ring-primary border-border-main" />
                    <span className="text-sm text-text-main">خصم تلقائي مع كشف الراتب (يتم خصم المتبقي نهاية الشهر)</span>
                  </label>
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <input type="radio" name="deductionMethod" value="manual" checked={advanceData.deductionMethod === 'manual'} onChange={() => setAdvanceData({...advanceData, deductionMethod: 'manual'})} className="w-4 h-4 text-primary focus:ring-primary border-border-main" />
                    <span className="text-sm text-text-main">دفع يدوي (أنت من يقوم بتحديث المبلغ المسدد يدوياً)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">ملاحظات والتفاصيل</label>
                <input type="text" value={advanceData.note} onChange={e => setAdvanceData({...advanceData, note: e.target.value})} className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="سبب السلفة..." />
              </div>

              <div className="pt-4 flex justify-end space-x-3 space-x-reverse border-t mt-6">
                <button type="button" onClick={() => setIsAdvanceModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-main bg-surface border border-border-main rounded-lg hover:bg-brand-bg">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center">
                  <Check className="w-4 h-4 ml-2" /> {editingAdvance ? 'حفظ التعديلات' : 'إضافة السلفة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\n  \);\n}/, advanceModal + '\n    </div>\n  );\n}');

fs.writeFileSync('src/pages/Workers.tsx', code);
