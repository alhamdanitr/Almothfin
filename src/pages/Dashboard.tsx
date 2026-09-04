import React, { useMemo, useState } from "react";
import { useStore } from "../hooks/useStore";
import {
  Users,
  UserCheck,
  CreditCard,
  Wallet,
  TrendingUp,
  Edit2,
  X,
  Check,
  Database,
  Phone,
  MapPin,
  Building2,
  UserPlus,
  Sparkles,
  Receipt,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { DailyRecord, AttendanceStatus } from "../types";
import { SmartEntryModal } from "../components/SmartEntryModal";
import { Bot } from "lucide-react";
import { getMonthlySalaryForDate } from "../lib/salaryHistory";
import { Link } from "react-router-dom";
export default function Dashboard() {
  const { workers, records, updateRecord, activeCompany } = useStore();
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.substring(0, 7);
  /* YYYY-MM */ const [editingRecord, setEditingRecord] =
    useState<DailyRecord | null>(null);
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    attendance: "full" as AttendanceStatus,
    allowance: "",
    advancePayment: "",
    delayMinutes: "",
    note: "",
  });
  const openEditModal = (record: DailyRecord) => {
    setEditingRecord(record);
    setFormData({
      attendance: record.attendance,
      allowance: String(record.allowance !== undefined ? record.allowance : ""),
      advancePayment: String(record.advancePayment || ""),
      delayMinutes: String(record.delayMinutes || ""),
      note: record.note || "",
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
        note: formData.note,
      });
      closeEditModal();
    }
  };
  const stats = useMemo(() => {
    const presentToday = records.filter(
      (r) =>
        r.date === today &&
        (r.attendance === "full" || r.attendance === "half"),
    ).length;
    let totalAdvancesMonth = 0;
    let totalAllowanceMonth = 0;
    let totalSalaries = 0;
    let earnedSalaries = 0;
    /* Sum of wages based on attendance */ let totalDiscounts = 0;
    const activeWorkers = workers.filter((w) => w.status !== "inactive");
    /* Calculate total base salaries for all workers (just as an indicator) */ activeWorkers.forEach(
      (w) => (totalSalaries += Number(w.monthlySalary || 0)),
    );
    /* Calculate this month's financials based on records */ const thisMonthRecords =
      records.filter((r) => r.date.startsWith(currentMonth));
    thisMonthRecords.forEach((r) => {
      totalAdvancesMonth += Number(r.advancePayment || 0);
      totalAllowanceMonth += Number(r.allowance || 0);
      const worker = workers.find((w) => w.id === r.workerId);
      if (worker) {
        /* Calculate the daily rate that was active on this record's date. */ const dailyRate =
          getMonthlySalaryForDate(worker, r.date) / 30;
        if (r.attendance === "full") earnedSalaries += dailyRate;
        else if (r.attendance === "half") earnedSalaries += dailyRate / 2;
        /* Calculate financial discount based on delay minutes (12 hours = 720 mins) */ const discountAmount =
          (Number(r.delayMinutes || 0) / 720) * dailyRate;
        totalDiscounts += discountAmount;
      }
    });
    const remainingSalariesMonth = Math.round(
      earnedSalaries -
        totalAdvancesMonth -
        totalAllowanceMonth -
        totalDiscounts,
    );
    return {
      totalWorkers: activeWorkers.length,
      presentToday,
      totalAdvancesMonth,
      totalAllowanceMonth,
      remainingSalariesMonth: Math.max(0, remainingSalariesMonth),
    };
  }, [workers, records, today, currentMonth]);
  const statCards = [
    {
      title: "إجمالي العمال",
      value: stats.totalWorkers,
      icon: Users,
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      title: "الحاضرين اليوم",
      value: stats.presentToday,
      icon: UserCheck,
      color: "bg-success/10 text-success border-success/20",
    },
    {
      title: "سحبيات الشهر",
      value: `${(stats.totalAdvancesMonth || 0).toLocaleString()} ر.ي`,
      icon: CreditCard,
      color: "bg-danger/10 text-danger border-danger/20",
    },
    {
      title: "الرواتب المتبقية",
      value: `${Math.round(stats.remainingSalariesMonth || 0).toLocaleString()} ر.ي`,
      icon: Wallet,
      color: "bg-secondary/10 text-secondary border-secondary/20",
    },
  ];
  const quickActions = [
    {
      title: "إضافة عامل",
      icon: UserPlus,
      link: "/workers",
      color: "bg-success/100 hover:bg-emerald-600",
    },
    {
      title: "سجل جديد",
      icon: FileText,
      link: "/daily-entry",
      color: "bg-primary/100 hover:bg-primary",
    },
    {
      title: "كشف حساب",
      icon: Receipt,
      link: "/statements",
      color: "bg-warning/100 hover:bg-amber-600",
    },
    {
      title: "التحليل الذكي",
      icon: Sparkles,
      action: () => setSmartModalOpen(true),
      color: "bg-primary hover:bg-primary/90",
    },
  ];
  return (
    <div className="space-y-8 pb-10">
      {/* Company Info Banner */}
      {activeCompany && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-border-main flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle Background Pattern/Glow */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="flex items-center gap-5 relative z-10">
            {activeCompany.logoBase64 ? (
              <img
                src={activeCompany.logoBase64}
                alt={activeCompany.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl border border-border-main bg-white shadow-sm p-1.5"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
              </div>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-text-main mb-1.5 tracking-tight">
                {activeCompany.name}
              </h2>
              {activeCompany.description && (
                <p className="text-sm sm:text-base text-text-muted font-medium">
                  {activeCompany.description}
                </p>
              )}
            </div>
          </div>
          {(activeCompany.phones || activeCompany.address) && (
            <div className="flex flex-col gap-3 text-sm font-medium text-text-muted sm:text-left relative z-10 sm:border-r sm:border-border-main sm:pr-8 sm:mr-2">
              {activeCompany.phones && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border-main text-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span dir="ltr" className="tracking-wide">
                    {activeCompany.phones}
                  </span>
                </div>
              )}
              {activeCompany.address && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border-main text-secondary flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{activeCompany.address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Hero Section: Smart Entry & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Entry Banner */}
        <div
          className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-primary/20 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]"
          onClick={() => setSmartModalOpen(true)}
        >
          {/* Abstract background blobs */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transform group-hover:rotate-12 transition-all duration-500 pointer-events-none text-primary">
            <Bot size={140} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold w-max mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ميزة جديدة (Beta)</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black mb-3 text-text-main">
              الترحيل الذكي بالذكاء الاصطناعي
            </h3>
            <p className="text-text-muted max-w-lg text-sm sm:text-base leading-relaxed mb-6 font-medium">
              وفر وقتك! قم بلصق رسائل الواتساب أو النصوص اليومية المكتوبة
              عشوائياً، وسيقوم المساعد الذكي بتحليلها وتحويلها إلى سجلات دقيقة
              بضغطة زر.
            </p>
            <button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-3 rounded-xl text-sm font-bold transition-colors w-max shadow-md shadow-primary/20">
              <Bot className="w-5 h-5" /> ابدأ الترحيل الآن
            </button>
          </div>
        </div>
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, idx) =>
            action.link ? (
              <Link
                key={idx}
                to={action.link}
                className={`relative overflow-hidden ${action.color} text-white rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-md transition-transform hover:scale-[1.03] hover:-translate-y-1`}
              >
                <div className="bg-white/20 p-3 rounded-2xl mb-3 backdrop-blur-sm">
                  <action.icon size={24} className="text-white" />
                </div>
                <span className="font-bold text-sm tracking-wide">
                  {action.title}
                </span>
              </Link>
            ) : (
              <button
                key={idx}
                onClick={action.action}
                className={`relative overflow-hidden ${action.color} text-white rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-md transition-transform hover:scale-[1.03] hover:-translate-y-1`}
              >
                <div className="bg-white/20 p-3 rounded-2xl mb-3 backdrop-blur-sm">
                  <action.icon size={24} className="text-white" />
                </div>
                <span className="font-bold text-sm tracking-wide">
                  {action.title}
                </span>
              </button>
            ),
          )}
        </div>
      </div>
      {smartModalOpen && (
        <SmartEntryModal onClose={() => setSmartModalOpen(false)} />
      )}
      {/* Stats Overview */}
      <div className="space-y-4">
        <div className="flex items-end justify-between px-2">
          <div>
            <h2 className="text-2xl font-black text-text-main tracking-tight">
              نظرة عامة
            </h2>
            <p className="text-sm text-text-muted mt-1 font-medium">
              مؤشرات الأداء للشهر الحالي
            </p>
          </div>
          <div className="hidden sm:flex items-center text-sm text-text-muted font-bold bg-white px-4 py-2 rounded-xl border border-border-main shadow-sm">
            {new Date().toLocaleDateString("ar-IQ", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-border-main hover:shadow-md transition-all group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stat.color}`}
                  >
                    <stat.icon size={22} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-text-main group-hover:scale-[1.02] transition-transform origin-right">
                    {stat.value}
                  </p>
                  <p className="text-sm font-bold text-text-muted mt-1.5">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Activity Overview */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-main overflow-hidden">
        <div className="p-6 border-b border-border-main flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" /> نشاط اليوم
          </h3>
          <Link
            to="/daily-entry"
            className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            عرض السجلات <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
        {records.filter((r) => r.date === today).length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center text-text-muted mb-4">
              <FileText className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-text-muted font-medium">
              لم يتم تسجيل أي نشاط لليوم حتى الآن.
            </p>
            <button
              onClick={() => setSmartModalOpen(true)}
              className="mt-4 text-primary font-bold hover:underline text-sm"
            >
              استخدم المساعد الذكي لإضافة سجلات
            </button>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b text-sm font-medium text-text-muted">
                    <th className="pb-3 pr-4">اسم العامل</th>
                    <th className="pb-3 px-4">الحضور</th>
                    <th className="pb-3 px-4">الصرفة</th>
                    <th className="pb-3 px-4">السحبيات</th>
                    <th className="pb-3 pl-4">التأخير (دقيقة)</th>
                    <th className="pb-3 pl-4">تعديل</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records
                    .filter((r) => r.date === today)
                    .map((record) => {
                      const worker = workers.find(
                        (w) => w.id === record.workerId,
                      );
                      if (!worker) return null;
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-brand-bg last:border-0 hover:bg-brand-bg transition-colors"
                        >
                          <td className="py-3 pr-4 font-medium text-text-main">
                            {worker.name}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.attendance === "full" ? "bg-success/20 text-emerald-800 " : record.attendance === "half" ? "bg-warning/20 text-amber-800 " : "bg-danger/20 text-red-800 "}`}
                            >
                              {record.attendance === "full"
                                ? "حاضر"
                                : record.attendance === "half"
                                  ? "نصف يوم"
                                  : "غائب"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-muted">
                            {record.allowance && record.allowance > 0 ? (
                              <span className="text-danger font-medium">
                                {(record.allowance || 0).toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3 px-4 text-text-muted">
                            {record.advancePayment > 0 ? (
                              <span className="text-danger font-medium">
                                {(record.advancePayment || 0).toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3 pl-4 text-text-muted">
                            {record.delayMinutes > 0 ? (
                              <span className="text-danger font-medium">
                                {(record.delayMinutes || 0).toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3 pl-4">
                            <button
                              onClick={() => openEditModal(record)}
                              className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10 transition-colors"
                            >
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
            <div className="lg:hidden divide-y divide-border-main">
              {records
                .filter((r) => r.date === today)
                .map((record) => {
                  const worker = workers.find((w) => w.id === record.workerId);
                  if (!worker) return null;
                  return (
                    <div key={record.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-border-main pb-2">
                        <span className="font-bold text-text-main">
                          {worker.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.attendance === "full" ? "bg-success/20 text-emerald-800 " : record.attendance === "half" ? "bg-warning/20 text-amber-800 " : "bg-danger/20 text-red-800 "}`}
                          >
                            {record.attendance === "full"
                              ? "حاضر"
                              : record.attendance === "half"
                                ? "نصف يوم"
                                : "غائب"}
                          </span>
                          <button
                            onClick={() => openEditModal(record)}
                            className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-brand-bg p-2 rounded-lg text-center">
                          <span className="block text-xs text-text-muted mb-1">
                            الصرفة
                          </span>
                          <span
                            className={
                              record.allowance && record.allowance > 0
                                ? "text-danger font-medium"
                                : "text-text-muted"
                            }
                          >
                            {record.allowance && record.allowance > 0
                              ? record.allowance.toLocaleString()
                              : "-"}
                          </span>
                        </div>
                        <div className="bg-brand-bg p-2 rounded-lg text-center">
                          <span className="block text-xs text-text-muted mb-1">
                            السحبيات
                          </span>
                          <span
                            className={
                              record.advancePayment > 0
                                ? "text-danger font-medium"
                                : "text-text-muted"
                            }
                          >
                            {record.advancePayment > 0
                              ? record.advancePayment.toLocaleString()
                              : "-"}
                          </span>
                        </div>
                        <div className="bg-brand-bg p-2 rounded-lg text-center">
                          <span className="block text-xs text-text-muted mb-1">
                            التأخير (دقيقة)
                          </span>
                          <span
                            className={
                              record.delayMinutes > 0
                                ? "text-danger font-medium"
                                : "text-text-muted"
                            }
                          >
                            {record.delayMinutes > 0
                              ? record.delayMinutes.toLocaleString()
                              : "-"}
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
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-text-main">
                تعديل سجل
                {workers.find((w) => w.id === editingRecord.workerId)?.name}
              </h3>
              <button
                onClick={closeEditModal}
                className="text-text-muted hover:text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">
                  حالة الحضور
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "full",
                      label: "حاضر",
                      color:
                        "peer-checked:bg-success/10 peer-checked:border-emerald-500 peer-checked:text-success ",
                    },
                    {
                      value: "half",
                      label: "نصف يوم",
                      color:
                        "peer-checked:bg-warning/10 peer-checked:border-amber-500 peer-checked:text-warning ",
                    },
                    {
                      value: "absent",
                      label: "غائب",
                      color:
                        "peer-checked:bg-danger/10 peer-checked:border-red-500 peer-checked:text-danger ",
                    },
                  ].map((opt) => (
                    <label key={opt.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="edit_attendance"
                        value={opt.value}
                        checked={formData.attendance === opt.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            attendance: e.target.value as AttendanceStatus,
                          })
                        }
                        className="hidden peer"
                      />
                      <div
                        className={`text-center py-2 border border-border-main rounded-xl transition-all ${opt.color} hover:bg-brand-bg text-text-muted text-sm font-medium`}
                      >
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">
                    الصرفة (ر.ي)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.allowance}
                    onChange={(e) =>
                      setFormData({ ...formData, allowance: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">
                    السحبيات (ر.ي)
                  </label>
                  <input
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advancePayment: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-main">
                    التأخير (دقيقة)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.delayMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, delayMinutes: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">
                  ملاحظات
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-brand-bg border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main resize-none"
                ></textarea>
              </div>
              <div className="pt-4 flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-text-main bg-surface border border-border-main rounded-lg hover:bg-brand-bg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center"
                >
                  <Check className="w-4 h-4 ml-2" /> حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
