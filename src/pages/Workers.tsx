import React, { useState } from "react";
import { useStore } from "../hooks/useStore";
import {
  UserPlus,
  Edit2,
  Trash2,
  X,
  Check,
  Power,
  PowerOff,
  History,
  CalendarDays,
  Plus,
  Banknote,
  Building2,
} from "lucide-react";
import {
  SalaryChange,
  Worker,
  Advance,
  AdvanceDeductionMethod,
} from "../types";
import {
  getMonthlySalaryForDate,
  getSalaryHistory,
} from "../lib/salaryHistory";
export default function Workers() {
  const {
    workers,
    addWorker,
    updateWorker,
    deleteWorker,
    advances,
    addAdvance,
    updateAdvance,
    deleteAdvance,
  } = useStore();
  const [activeTab, setActiveTab] = useState<"workers" | "advances">("workers");
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [advanceData, setAdvanceData] = useState({
    workerId: "",
    amount: "",
    paidAmount: "0",
    date: new Date().toISOString().split("T")[0],
    note: "",
    deductionMethod: "automatic" as AdvanceDeductionMethod,
    status: "active" as "active" | "completed",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [salaryModalWorker, setSalaryModalWorker] = useState<Worker | null>(
    null,
  );
  const [salaryForm, setSalaryForm] = useState({
    effectiveDate: new Date().toISOString().split("T")[0],
    monthlySalary: "",
    note: "",
  });
  const [salaryError, setSalaryError] = useState("");
  const [formData, setFormData] = useState({
    workerNumber: "",
    name: "",
    monthlySalary: "",
    dailyAllowance: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive",
  });
  const openModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        workerNumber: worker.workerNumber || "",
        name: worker.name,
        monthlySalary: String(worker.monthlySalary || ""),
        dailyAllowance: String(worker.dailyAllowance || ""),
        joinDate: worker.joinDate || new Date().toISOString().split("T")[0],
        status: worker.status || "active",
      });
    } else {
      setEditingWorker(null);
      setFormData({
        workerNumber: "",
        name: "",
        monthlySalary: "",
        dailyAllowance: "",
        joinDate: new Date().toISOString().split("T")[0],
        status: "active",
      });
    }
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWorker(null);
  };
  const openSalaryHistory = (worker: Worker) => {
    setSalaryModalWorker(worker);
    setSalaryForm({
      effectiveDate: new Date().toISOString().split("T")[0],
      monthlySalary: "",
      note: "",
    });
    setSalaryError("");
  };
  const closeSalaryHistory = () => {
    setSalaryModalWorker(null);
    setSalaryError("");
  };
  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryModalWorker) return;
    const effectiveDate = salaryForm.effectiveDate.trim();
    const monthlySalary = Number(salaryForm.monthlySalary);
    if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      setSalaryError("يرجى تحديد تاريخ سريان صحيح.");
      return;
    }
    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
      setSalaryError("يرجى إدخال راتب شهري صحيح لا يقل عن صفر.");
      return;
    }
    const history = getSalaryHistory(salaryModalWorker);
    if (history.some((change) => change.effectiveDate === effectiveDate)) {
      setSalaryError("يوجد تغيير راتب مسجل بهذا التاريخ. استخدم تاريخًا آخر.");
      return;
    }
    const nextHistory: SalaryChange[] = [
      ...history,
      { effectiveDate, monthlySalary, note: salaryForm.note.trim() },
    ].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    const updatedWorker = { ...salaryModalWorker, salaryHistory: nextHistory };
    const currentSalary = getMonthlySalaryForDate(
      updatedWorker,
      new Date().toISOString().split("T")[0],
    );
    updateWorker(salaryModalWorker.id, {
      salaryHistory: nextHistory,
      monthlySalary: currentSalary,
    });
    setSalaryModalWorker({ ...updatedWorker, monthlySalary: currentSalary });
    setSalaryForm({
      effectiveDate: new Date().toISOString().split("T")[0],
      monthlySalary: "",
      note: "",
    });
    setSalaryError("");
  };
  const handleSalaryDelete = (change: SalaryChange) => {
    if (!salaryModalWorker) return;
    const history = getSalaryHistory(salaryModalWorker);
    if (history.length <= 1) {
      setSalaryError("لا يمكن حذف الراتب الأساسي الوحيد للعامل.");
      return;
    }
    if (
      !window.confirm(
        `هل تريد حذف تغيير الراتب بتاريخ ${change.effectiveDate}؟`,
      )
    )
      return;
    const nextHistory = history.filter(
      (item) =>
        !(
          item.effectiveDate === change.effectiveDate &&
          item.monthlySalary === change.monthlySalary
        ),
    );
    const updatedWorker = { ...salaryModalWorker, salaryHistory: nextHistory };
    const currentSalary = getMonthlySalaryForDate(
      updatedWorker,
      new Date().toISOString().split("T")[0],
    );
    updateWorker(salaryModalWorker.id, {
      salaryHistory: nextHistory,
      monthlySalary: currentSalary,
    });
    setSalaryModalWorker({ ...updatedWorker, monthlySalary: currentSalary });
    setSalaryError("");
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlySalary = Number(formData.monthlySalary) || 0;
    const workerData = {
      workerNumber: formData.workerNumber,
      name: formData.name,
      monthlySalary,
      dailyAllowance: Number(formData.dailyAllowance) || 0,
      joinDate: formData.joinDate,
      status: formData.status,
    };
    if (editingWorker) {
      const currentSalary = Number(editingWorker.monthlySalary) || 0;
      if (monthlySalary !== currentSalary) {
        const today = new Date().toISOString().split("T")[0];
        const history = getSalaryHistory(editingWorker);
        const nextHistory = history.some(
          (change) => change.effectiveDate === today,
        )
          ? history.map((change) =>
              change.effectiveDate === today
                ? {
                    ...change,
                    monthlySalary,
                    note: change.note || "تعديل الراتب من بيانات العامل",
                  }
                : change,
            )
          : [
              ...history,
              {
                effectiveDate: today,
                monthlySalary,
                note: "تعديل الراتب من بيانات العامل",
              },
            ].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
        updateWorker(editingWorker.id, {
          ...workerData,
          salaryHistory: nextHistory,
        });
      } else {
        /* Keep salaryHistory intact when editing ordinary worker details. */ updateWorker(
          editingWorker.id,
          workerData,
        );
      }
    } else {
      addWorker({
        ...workerData,
        salaryHistory: [
          {
            effectiveDate: formData.joinDate,
            monthlySalary,
            note: "الراتب الأساسي",
          },
        ],
      });
    }
    closeModal();
  };
  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "هل أنت متأكد من حذف هذا العامل بالكامل من النظام؟ لا يمكن التراجع عن هذا القرار",
      )
    ) {
      deleteWorker(id);
    }
  };
  const toggleStatus = (worker: Worker) => {
    const newStatus = worker.status === "inactive" ? "active" : "inactive";
    updateWorker(worker.id, { status: newStatus });
  };
  const resetAdvanceForm = () => {
    setAdvanceData({
      workerId: workers[0]?.id || "",
      amount: "",
      paidAmount: "0",
      date: new Date().toISOString().split("T")[0],
      note: "",
      deductionMethod: "automatic",
      status: "active",
    });
    setEditingAdvance(null);
  };
  const openEditAdvanceModal = (advance: Advance) => {
    setEditingAdvance(advance);
    setAdvanceData({
      workerId: advance.workerId,
      amount: String(advance.amount),
      paidAmount: String(advance.paidAmount || 0),
      date: advance.date,
      note: advance.note || "",
      deductionMethod: advance.deductionMethod,
      status: advance.status,
    });
    setIsAdvanceModalOpen(true);
  };
  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (editingAdvance) {
      await updateAdvance(editingAdvance.id, {
        workerId: advanceData.workerId,
        amount: Number(advanceData.amount),
        paidAmount: Number(advanceData.paidAmount),
        date: advanceData.date,
        note: advanceData.note,
        deductionMethod: advanceData.deductionMethod,
        status: advanceData.status,
      });
    } else {
      await addAdvance({
        workerId: advanceData.workerId,
        amount: Number(advanceData.amount),
        paidAmount: Number(advanceData.paidAmount),
        date: advanceData.date,
        note: advanceData.note,
        deductionMethod: advanceData.deductionMethod,
        status: advanceData.status,
      });
    }
    setIsAdvanceModalOpen(false);
    resetAdvanceForm();
  };
  const handleDeleteAdvance = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("هل أنت متأكد من حذف هذه السلفة؟")) {
      await deleteAdvance(id);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex bg-surface border border-border-main p-1 rounded-xl shadow-sm w-max mx-auto">
        <button
          onClick={() => setActiveTab("workers")}
          className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "workers" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main hover:bg-brand-bg"}`}
        >
          <Building2 className="w-4 h-4 ml-2" /> إدارة العمال
        </button>
        <button
          onClick={() => setActiveTab("advances")}
          className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "advances" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main hover:bg-brand-bg"}`}
        >
          <Banknote className="w-4 h-4 ml-2" /> سلف الموظفين
        </button>
      </div>
      {activeTab === "workers" ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-text-main">إدارة العمال</h2>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-xl shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
            >
              <UserPlus className="w-5 h-5 ml-2" /> إضافة عامل جديد
            </button>
          </div>
          <div className="bg-surface shadow-sm rounded-2xl border border-border-main overflow-hidden">
            {workers.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                لا يوجد عمال مسجلين حالياً. يرجى إضافة عمال للبدء.
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className=" min-w-full text-right divide-y divide-border-main">
                    <thead className="bg-brand-bg">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-4 text-sm font-semibold text-text-main"
                        >
                          رقم العامل
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-sm font-semibold text-text-main"
                        >
                          اسم العامل
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-sm font-semibold text-text-main"
                        >
                          الحالة
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-sm font-semibold text-text-main"
                        >
                          الراتب الشهري
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-sm font-semibold text-text-main"
                        >
                          الصرفة اليومية
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-sm font-semibold text-text-main"
                        >
                          تاريخ الدخول
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-sm font-semibold text-text-main"
                        >
                          إجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main bg-surface">
                      {workers.map((worker) => (
                        <tr
                          key={worker.id}
                          className={`hover:bg-brand-bg transition-colors ${worker.status === "inactive" ? "opacity-60" : ""}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
                            <span className="bg-brand-bg hover:bg-brand-bg/80 px-2 py-1 rounded-md text-xs font-mono">
                              {worker.workerNumber || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
                            {worker.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {worker.status === "inactive" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-danger/10 text-danger">
                                غير فعال
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success">
                                فعال
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {(worker.monthlySalary || 0).toLocaleString()}
                            ر.ي
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {(worker.dailyAllowance || 0).toLocaleString()}
                            ر.ي
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {worker.joinDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <button
                                onClick={() => openSalaryHistory(worker)}
                                title="سجل وتحديث الراتب"
                                className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10 transition-colors"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleStatus(worker)}
                                title={
                                  worker.status === "inactive"
                                    ? "تفعيل العامل"
                                    : "إلغاء تفعيل العامل"
                                }
                                className={`p-1 rounded transition-colors ${worker.status === "inactive" ? "text-success hover:text-success hover:bg-success/10 " : "text-warning hover:text-warning hover:bg-warning/10 "}`}
                              >
                                {worker.status === "inactive" ? (
                                  <Power className="w-4 h-4" />
                                ) : (
                                  <PowerOff className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => openModal(worker)}
                                className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(worker.id)}
                                className="text-danger hover:text-danger p-1 rounded hover:bg-danger/10 transition-colors"
                              >
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
                <div className="lg:hidden divide-y divide-border-main">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className={`p-4 space-y-3 ${worker.status === "inactive" ? "opacity-60 bg-brand-bg " : "bg-surface "}`}
                    >
                      <div className="flex justify-between items-start border-b border-border-main pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-brand-bg hover:bg-brand-bg/80 px-2 py-0.5 rounded text-xs font-mono text-text-main">
                              #{worker.workerNumber || "-"}
                            </span>
                            <h3 className="font-bold text-text-main">
                              {worker.name}
                            </h3>
                          </div>
                          {worker.status === "inactive" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-danger/10 text-danger">
                              غير فعال
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-success/10 text-success">
                              فعال
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openSalaryHistory(worker)}
                            title="سجل وتحديث الراتب"
                            className="text-primary bg-primary/10 p-1.5 rounded transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(worker)}
                            title={
                              worker.status === "inactive"
                                ? "تفعيل العامل"
                                : "إلغاء تفعيل العامل"
                            }
                            className={`p-1.5 rounded transition-colors ${worker.status === "inactive" ? "text-success bg-success/10 " : "text-warning bg-warning/10 "}`}
                          >
                            {worker.status === "inactive" ? (
                              <Power className="w-4 h-4" />
                            ) : (
                              <PowerOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openModal(worker)}
                            className="text-primary bg-primary/10 p-1.5 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(worker.id)}
                            className="text-danger bg-danger/10 p-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-text-muted">
                            الراتب الشهري
                          </p>
                          <p className="font-medium text-text-main">
                            {(worker.monthlySalary || 0).toLocaleString()} ر.ي
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">
                            الصرفة اليومية
                          </p>
                          <p className="font-medium text-text-main">
                            {(worker.dailyAllowance || 0).toLocaleString()} ر.ي
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-text-muted">
                            تاريخ الدخول
                          </p>
                          <p className="font-medium text-text-main">
                            {worker.joinDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-main">
                سلف الموظفين
              </h2>
              <p className="text-sm text-text-muted mt-1">
                إدارة سحبيات الموظفين الكبيرة ومتابعة سدادها
              </p>
            </div>
            <button
              onClick={() => {
                resetAdvanceForm();
                setIsAdvanceModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5 ml-2" /> إضافة سلفة
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
                      <td
                        colSpan={8}
                        className="p-8 text-center text-text-muted"
                      >
                        لا توجد سلف مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    advances.map((advance) => {
                      const worker = workers.find(
                        (w) => w.id === advance.workerId,
                      );
                      const remaining =
                        advance.amount - (advance.paidAmount || 0);
                      return (
                        <tr
                          key={advance.id}
                          className="border-b last:border-0 hover:bg-brand-bg/50 transition-colors"
                        >
                          <td className="p-4 font-bold text-text-main">
                            {worker?.name || "عامل غير معروف"}
                          </td>
                          <td className="p-4 text-text-muted">
                            {advance.date}
                          </td>
                          <td className="p-4 font-bold text-text-main">
                            {advance.amount.toLocaleString()}
                          </td>
                          <td className="p-4 font-medium text-success">
                            {(advance.paidAmount || 0).toLocaleString()}
                          </td>
                          <td className="p-4 font-bold text-danger">
                            {remaining.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${advance.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                            >
                              {advance.status === "completed"
                                ? "مكتملة"
                                : "نشطة"}
                            </span>
                          </td>
                          <td className="p-4 text-text-muted text-xs font-medium">
                            {advance.deductionMethod === "automatic" ? (
                              <span className="flex items-center">
                                <CalendarDays className="w-3.5 h-3.5 ml-1" /> مع
                                الراتب
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Banknote className="w-3.5 h-3.5 ml-1" /> دفع
                                يدوي
                              </span>
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
                                onClick={(e) =>
                                  handleDeleteAdvance(e, advance.id)
                                }
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
      {/* Modal for Add/Edit Worker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-text-main">
                {editingWorker ? "تعديل بيانات العامل" : "إضافة عامل جديد"}
              </h3>
              <button
                onClick={closeModal}
                className="text-text-muted hover:text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  رقم العامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.workerNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, workerNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                  placeholder="مثال: 001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  اسم العامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                  placeholder="الاسم الثلاثي"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  الراتب الشهري (ر.ي)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.monthlySalary}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlySalary: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                  placeholder="مثال: 600000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  الصرفة اليومية الثابتة (ر.ي)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.dailyAllowance}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyAllowance: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                  placeholder="مثال: 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  تاريخ الدخول
                </label>
                <input
                  type="date"
                  required
                  value={formData.joinDate}
                  onChange={(e) =>
                    setFormData({ ...formData, joinDate: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  حالة العامل
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                >
                  <option value="active">مستمر بالعمل (فعال)</option>
                  <option value="inactive">تارك للعمل (غير فعال)</option>
                </select>
              </div>
              <div className="pt-4 flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-text-main bg-surface border border-border-main rounded-lg hover:bg-brand-bg focus:outline-none"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none flex items-center"
                >
                  <Check className="w-4 h-4 ml-2" />
                  {editingWorker ? "حفظ التعديلات" : "إضافة العامل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Salary History Modal */}
      {salaryModalWorker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border-main bg-surface">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-main">
                    سجل الرواتب
                  </h3>
                  <p className="text-sm text-text-muted">
                    {salaryModalWorker.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeSalaryHistory}
                className="text-text-muted hover:text-text-muted"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/10/70 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 mt-0.5 text-primary" />
                  <div className="text-sm text-primary/80">
                    <p className="font-bold">
                      الراتب الحالي:
                      {getMonthlySalaryForDate(
                        salaryModalWorker,
                        new Date().toISOString().split("T")[0],
                      ).toLocaleString()}
                      ر.ي
                    </p>
                    <p className="mt-1 text-primary">
                      سيُطبّق كل تغيير من تاريخ سريانه، وتبقى كشوف الأيام
                      السابقة محسوبة بالراتب القديم.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-text-main">
                    التغييرات المسجلة
                  </h4>
                  <span className="text-xs text-text-muted">
                    {getSalaryHistory(salaryModalWorker).length} سجل
                  </span>
                </div>
                <div className="space-y-2">
                  {getSalaryHistory(salaryModalWorker).map((change, index) => (
                    <div
                      key={`${change.effectiveDate}-${change.monthlySalary}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border-main bg-brand-bg px-4 py-3"
                    >
                      <div className=" min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-text-main">
                            {change.monthlySalary.toLocaleString()} ر.ي
                          </span>
                          {index === 0 && (
                            <span className="rounded-md bg-border-main px-2 py-0.5 text-[11px] font-medium text-text-main">
                              الراتب الأساسي
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          يسري من: <span dir="ltr">{change.effectiveDate}</span>
                          {change.note ? ` — ${change.note}` : ""}
                        </p>
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSalaryDelete(change)}
                          className="shrink-0 rounded-lg p-2 text-danger hover:bg-danger/10"
                          title="حذف تغيير الراتب"
                          aria-label={`حذف تغيير الراتب بتاريخ ${change.effectiveDate}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <form
                onSubmit={handleSalarySubmit}
                className="rounded-xl border border-border-main p-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-text-main">
                    إضافة تحديث أو زيادة راتب
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-main">
                      الراتب الجديد (ر.ي)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={salaryForm.monthlySalary}
                      onChange={(e) =>
                        setSalaryForm({
                          ...salaryForm,
                          monthlySalary: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-border-main bg-brand-bg px-4 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary"
                      placeholder="مثال: 750000"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-main">
                      يبدأ من تاريخ
                    </label>
                    <input
                      type="date"
                      required
                      value={salaryForm.effectiveDate}
                      onChange={(e) =>
                        setSalaryForm({
                          ...salaryForm,
                          effectiveDate: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-border-main bg-brand-bg px-4 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-text-main">
                      ملاحظة اختيارية
                    </label>
                    <input
                      type="text"
                      value={salaryForm.note}
                      onChange={(e) =>
                        setSalaryForm({ ...salaryForm, note: e.target.value })
                      }
                      className="w-full rounded-lg border border-border-main bg-brand-bg px-4 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary"
                      placeholder="مثال: زيادة راتب"
                    />
                  </div>
                </div>
                {salaryError && (
                  <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                    {salaryError}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeSalaryHistory}
                    className="rounded-lg border border-border-main bg-surface px-4 py-2 text-sm font-medium text-text-main hover:bg-brand-bg"
                  >
                    إغلاق
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Check className="ml-2 h-4 w-4" /> حفظ التغيير
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-text-main flex items-center">
                <Banknote className="w-5 h-5 ml-2 text-secondary" />
                {editingAdvance ? "تعديل سلفة الموظف" : "إضافة سلفة جديدة"}
              </h3>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-text-muted hover:text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleAdvanceSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">
                  العامل <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={advanceData.workerId}
                  onChange={(e) =>
                    setAdvanceData({ ...advanceData, workerId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  {workers.length === 0 && (
                    <option value="">لا يوجد عمال</option>
                  )}
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">
                    المبلغ الأساسي <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={advanceData.amount}
                    onChange={(e) =>
                      setAdvanceData({ ...advanceData, amount: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">
                    المبلغ المسدد
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={advanceData.paidAmount}
                    onChange={(e) =>
                      setAdvanceData({
                        ...advanceData,
                        paidAmount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">
                    تاريخ السلفة
                  </label>
                  <input
                    required
                    type="date"
                    value={advanceData.date}
                    onChange={(e) =>
                      setAdvanceData({ ...advanceData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">
                    حالة السلفة
                  </label>
                  <select
                    value={advanceData.status}
                    onChange={(e) =>
                      setAdvanceData({ ...advanceData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="active">نشطة</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">
                  طريقة الخصم والاستقطاع
                </label>
                <div className="bg-brand-bg p-3 rounded-lg border border-border-main space-y-3">
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <input
                      type="radio"
                      name="deductionMethod"
                      value="automatic"
                      checked={advanceData.deductionMethod === "automatic"}
                      onChange={() =>
                        setAdvanceData({
                          ...advanceData,
                          deductionMethod: "automatic",
                        })
                      }
                      className="w-4 h-4 text-primary focus:ring-primary border-border-main"
                    />
                    <span className="text-sm text-text-main">
                      خصم تلقائي مع كشف الراتب (يتم خصم المتبقي نهاية الشهر)
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <input
                      type="radio"
                      name="deductionMethod"
                      value="manual"
                      checked={advanceData.deductionMethod === "manual"}
                      onChange={() =>
                        setAdvanceData({
                          ...advanceData,
                          deductionMethod: "manual",
                        })
                      }
                      className="w-4 h-4 text-primary focus:ring-primary border-border-main"
                    />
                    <span className="text-sm text-text-main">
                      دفع يدوي (أنت من يقوم بتحديث المبلغ المسدد يدوياً)
                    </span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">
                  ملاحظات والتفاصيل
                </label>
                <input
                  type="text"
                  value={advanceData.note}
                  onChange={(e) =>
                    setAdvanceData({ ...advanceData, note: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="سبب السلفة..."
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3 space-x-reverse border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-main bg-surface border border-border-main rounded-lg hover:bg-brand-bg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center"
                >
                  <Check className="w-4 h-4 ml-2" />
                  {editingAdvance ? "حفظ التعديلات" : "إضافة السلفة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
