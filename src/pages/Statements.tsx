import React, { useState, useMemo, useRef } from "react";
import { useStore } from "../hooks/useStore";
import {
  User,
  Calendar as CalendarIcon,
  Printer,
  FileDown,
  Edit2,
  X,
  Check,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { DailyRecord, AttendanceStatus } from "../types";
import { ReportHeader } from "../components/ReportHeader";
import { getMonthlySalaryForDate } from "../lib/salaryHistory";
export default function Statements() {
  const { workers, records, advances, updateRecord } = useStore();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), "yyyy-MM-01"),
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const printRef = useRef<HTMLDivElement>(null);
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [formData, setFormData] = useState({
    attendance: "full" as AttendanceStatus,
    allowance: "",
    advancePayment: "",
    delayMinutes: "",
    note: "",
  });
  const activeWorkers = useMemo(
    () => workers.filter((w) => w.status !== "inactive"),
    [workers],
  );
  const worker = activeWorkers.find((w) => w.id === selectedWorkerId);
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
  const statementDataByMonth = useMemo(() => {
    if (!worker || !startDate || !endDate) return null;
    const filteredRecords = records
      .filter(
        (r) =>
          r.workerId === worker.id && r.date >= startDate && r.date <= endDate,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    if (filteredRecords.length === 0) return null;
    const groupedByMonth: Record<string, DailyRecord[]> = {};
    filteredRecords.forEach((r) => {
      const monthStr = r.date.substring(0, 7);
      if (!groupedByMonth[monthStr]) groupedByMonth[monthStr] = [];
      groupedByMonth[monthStr].push(r);
    });
    const months = Object.keys(groupedByMonth).sort();
    return months.map((month) => {
      const monthRecords = groupedByMonth[month];
      let totalEarned = 0;
      let totalAdvances = 0;
      let totalAllowance = 0;
      let totalDiscounts = 0;
      let daysPresent = 0;
      let daysHalf = 0;
      let daysAbsent = 0;
      let lastDailyRate = (worker.monthlySalary || 0) / 30;
      monthRecords.forEach((r) => {
        totalAdvances += Number(r.advancePayment || 0);
        totalAllowance += Number(r.allowance || 0);
        const dailyRate = getMonthlySalaryForDate(worker, r.date) / 30;
        lastDailyRate = dailyRate;
        const delayMins = Number(r.delayMinutes || 0);
        const discountAmount = (delayMins / 720) * dailyRate;
        totalDiscounts += discountAmount;
        if (r.attendance === "full") {
          daysPresent++;
          totalEarned += dailyRate;
        } else if (r.attendance === "half") {
          daysHalf++;
          totalEarned += dailyRate / 2;
        } else if (r.attendance === "absent") {
          daysAbsent++;
        }
      });
      const netSalary =
        totalEarned - totalAdvances - totalDiscounts - totalAllowance;
      return {
        month,
        records: monthRecords,
        summary: {
          totalEarned: Math.round(totalEarned),
          totalAdvances,
          totalAllowance,
          totalDiscounts: Math.round(totalDiscounts),
          netSalary: Math.round(netSalary),
          daysPresent,
          daysHalf,
          daysAbsent,
          dailyRate: Math.round(lastDailyRate),
        },
      };
    });
  }, [worker, startDate, endDate, records]);
  const handlePrint = () => {
    window.print();
  };
  const handleExportPdf = async () => {
    if (!printRef.current) return;
    /* Chrome على Android يوفّر حفظًا موثوقًا عبر معاينة الطباعة، بينما html2canvas قد يفشل مع CSS الهاتف. */ const isAndroid =
      /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.print();
      return;
    }
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const imageData = canvas.toDataURL("image/jpeg", 0.92);
      for (let offset = 0; offset < imageHeight; offset += pageHeight) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(
          imageData,
          "JPEG",
          0,
          -offset,
          imageWidth,
          imageHeight,
          undefined,
          "FAST",
        );
      }
      const workerName = worker?.name?.replace(/\s+/g, "-") || "العامل";
      pdf.save(`كشف-حساب-${workerName}.pdf`);
    } catch (error) {
      console.error("PDF export error:", error);
      /* fallback موثوق بدل عرض رسالة فشل فقط. */ window.print();
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <h2 className="text-2xl font-bold text-text-main">كشوفات الحساب</h2>
        {statementDataByMonth && statementDataByMonth.length > 0 && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl shadow-sm hover:bg-primary/90 focus:outline-none"
            >
              <Printer className="w-4 h-4 ml-2" /> طباعة
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-success rounded-xl shadow-sm hover:bg-emerald-700 focus:outline-none"
            >
              <FileDown className="w-4 h-4 ml-2" /> تصدير PDF
            </button>
          </div>
        )}
      </div>
      <div className="bg-surface shadow-sm rounded-2xl border border-border-main p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-main">
              اختيار العامل
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-brand-bg border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none text-text-main appearance-none transition-colors"
              >
                <option value="">-- اختر العامل --</option>
                {activeWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.workerNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-main">
              من تاريخ
            </label>
            <div className="relative">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-brand-bg border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-main">
              إلى تاريخ
            </label>
            <div className="relative">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-brand-bg border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
      {statementDataByMonth && statementDataByMonth.length > 0 ? (
        <div
          ref={printRef}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:text-black print:bg-surface"
          dir="rtl"
        >
          {statementDataByMonth.map((statementData, index) => (
            <div
              key={statementData.month}
              className="print-month-container space-y-2"
            >
              {/* Print Header - Unified Report Header */}
              <ReportHeader
                title="كشف حساب العامل"
                dynamicData={[
                  { label: "اسم العامل", value: worker?.name || "غير معروف" },
                  { label: "عن شهر", value: statementData.month },
                  {
                    label: "تاريخ الإصدار",
                    value: new Date().toLocaleDateString("ar-IQ"),
                  },
                ]}
              />
              {/* Details Table */}
              <div className="bg-surface shadow-sm rounded-2xl border border-border-main overflow-hidden print:shadow-none print:border-border-main print:rounded-lg print:mb-1 print:border-none">
                <div className="px-4 py-3 print:hidden border-b border-border-main bg-brand-bg/50 flex justify-between items-center">
                  <h3 className="font-semibold text-text-main">
                    تفاصيل الحركات اليومية ({statementData.month})
                  </h3>
                </div>
                {statementData.records.length === 0 ? (
                  <div className="p-8 text-center text-text-muted print:text-text-muted print:text-sm">
                    لا توجد سجلات لهذا العامل في الشهر المحدد.
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block overflow-x-auto print:block">
                      <table className=" min-w-full text-right divide-y divide-border-main print:divide-border-main">
                        <thead className="bg-brand-bg print:bg-brand-bg hover:bg-brand-bg/80">
                          <tr>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:text-text-main">
                              التاريخ
                            </th>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:text-text-main">
                              اليوم
                            </th>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:text-text-main">
                              الحضور
                            </th>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:text-text-main">
                              الصرفة
                            </th>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:text-text-main">
                              السحبيات
                            </th>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:text-text-main">
                              التأخير
                            </th>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:text-text-main">
                              ملاحظات
                            </th>
                            <th className="px-4 py-3 print:px-0.5 print:py-0.5 text-sm print:text-[9px] font-bold text-text-main print:hidden">
                              إجراءات
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-main print:divide-border-main">
                          {statementData.records.map((r, i) => {
                            const dateObj = parseISO(r.date);
                            const advancePayment = Number(
                              r.advancePayment || 0,
                            );
                            return (
                              <tr
                                key={r.id}
                                className={`hover:bg-brand-bg print:hover:bg-transparent ${i % 2 === 0 ? "print:bg-surface" : "print:bg-brand-bg/50"}`}
                              >
                                <td className="px-4 py-3 print:px-1 print:py-2 whitespace-nowrap text-sm print:text-[10.5px] font-bold text-text-main print:text-text-main">
                                  {r.date}
                                </td>
                                <td className="px-4 py-3 print:px-1 print:py-2 whitespace-nowrap text-sm print:text-[10.5px] text-text-muted print:text-text-main">
                                  {format(dateObj, "EEEE", { locale: ar })}
                                </td>
                                <td className="px-4 py-3 print:px-1 print:py-2 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs print:text-[9.5px] print:px-1.5 print:py-0 font-black ${r.attendance === "full" ? "bg-success/20 text-emerald-800 print:bg-transparent print:text-emerald-800" : r.attendance === "half" ? "bg-warning/20 text-amber-800 print:bg-transparent print:text-amber-800" : "bg-danger/20 text-red-800 print:bg-transparent print:text-red-800"}`}
                                  >
                                    {r.attendance === "full"
                                      ? "حاضر"
                                      : r.attendance === "half"
                                        ? "نصف يوم"
                                        : "غائب"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 print:px-1 print:py-2 whitespace-nowrap text-sm print:text-[10.5px] font-black print:text-text-main">
                                  {r.allowance && r.allowance > 0 ? (
                                    <span
                                      className={
                                        r.attendance === "absent"
                                          ? "text-danger print:text-red-800"
                                          : "text-black print:text-black"
                                      }
                                    >
                                      {(r.allowance || 0).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-text-muted print:text-text-muted">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 print:px-1 print:py-2 whitespace-nowrap text-sm print:text-[10.5px] font-black print:text-text-main">
                                  {advancePayment !== 0 ? (
                                    <span
                                      className={
                                        advancePayment < 0
                                          ? "text-success print:text-emerald-800"
                                          : "text-danger print:text-red-800"
                                      }
                                    >
                                      {advancePayment.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-text-muted print:text-text-muted">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 print:px-1 print:py-2 whitespace-nowrap text-sm print:text-[10.5px] font-black print:text-text-main">
                                  {r.delayMinutes > 0 ? (
                                    <span className="text-danger print:text-red-800">
                                      {(r.delayMinutes || 0).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-text-muted print:text-text-muted">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 print:px-1 print:py-2 whitespace-nowrap text-sm print:text-[10px] text-text-muted print:text-text-main print:whitespace-normal break-words max-w-[120px] truncate print:max-w-none print:truncate-none">
                                  {r.note || (
                                    <span className="text-text-muted print:text-border-main">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 print:px-0.5 print:py-0 whitespace-nowrap text-sm print:hidden">
                                  <button
                                    onClick={() => openEditModal(r)}
                                    className="text-primary hover:text-primary/80 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
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
                    <div className="lg:hidden divide-y divide-border-main print:hidden">
                      {statementData.records.map((r) => {
                        const dateObj = parseISO(r.date);
                        const advancePayment = Number(r.advancePayment || 0);
                        return (
                          <div key={r.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-border-main pb-2">
                              <div className="flex flex-col">
                                <span
                                  className="font-bold text-text-main"
                                  dir="ltr"
                                >
                                  {r.date}
                                </span>
                                <span className="text-xs text-text-muted">
                                  {format(dateObj, "EEEE", { locale: ar })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.attendance === "full" ? "bg-success/20 text-emerald-800 " : r.attendance === "half" ? "bg-warning/20 text-amber-800 " : "bg-danger/20 text-red-800 "}`}
                                >
                                  {r.attendance === "full"
                                    ? "حاضر"
                                    : r.attendance === "half"
                                      ? "نصف يوم"
                                      : "غائب"}
                                </span>
                                <button
                                  onClick={() => openEditModal(r)}
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
                                    r.allowance && r.allowance > 0
                                      ? "text-danger font-medium"
                                      : "text-text-muted"
                                  }
                                >
                                  {r.allowance && r.allowance > 0
                                    ? r.allowance.toLocaleString()
                                    : "-"}
                                </span>
                              </div>
                              <div className="bg-brand-bg p-2 rounded-lg text-center">
                                <span className="block text-xs text-text-muted mb-1">
                                  السحبيات
                                </span>
                                <span
                                  className={
                                    advancePayment < 0
                                      ? "text-success font-medium"
                                      : advancePayment > 0
                                        ? "text-danger font-medium"
                                        : "text-text-muted"
                                  }
                                >
                                  {advancePayment !== 0
                                    ? advancePayment.toLocaleString()
                                    : "-"}
                                </span>
                              </div>
                              <div className="bg-brand-bg p-2 rounded-lg text-center">
                                <span className="block text-xs text-text-muted mb-1">
                                  التأخير (دقيقة)
                                </span>
                                <span
                                  className={
                                    r.delayMinutes > 0
                                      ? "text-danger font-medium"
                                      : "text-text-muted"
                                  }
                                >
                                  {r.delayMinutes > 0
                                    ? r.delayMinutes.toLocaleString()
                                    : "-"}
                                </span>
                              </div>
                            </div>
                            {r.note && (
                              <div className="text-sm text-text-muted bg-brand-bg p-2 rounded-lg">
                                <span className="font-medium mr-1">
                                  ملاحظة:
                                </span>
                                {r.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print-summary-grid mt-6 print:mt-1">
                <div className="bg-surface rounded-2xl p-4 lg:p-5 border border-border-main shadow-sm print-summary-card">
                  <p className="text-sm text-text-muted print:text-text-main">
                    الراتب المستحق
                  </p>
                  <p className="text-xl font-bold text-text-main mt-1 value">
                    {(statementData.summary.totalEarned || 0).toLocaleString()}
                    ر.ي
                  </p>
                  <p className="text-xs text-text-muted mt-1 print:block print:text-[8px] print:font-bold">
                    (
                    {statementData.summary.daysPresent +
                      statementData.summary.daysHalf * 0.5}
                    يوم)
                  </p>
                </div>
                <div className="bg-surface rounded-2xl p-4 lg:p-5 border border-border-main shadow-sm print-summary-card">
                  <p className="text-sm text-text-muted print:text-text-main">
                    إجمالي الصرفيات
                  </p>
                  <p className="text-xl font-bold text-danger mt-1 value print:text-danger">
                    {(
                      statementData.summary.totalAllowance || 0
                    ).toLocaleString()}
                    ر.ي
                  </p>
                </div>
                <div className="bg-surface rounded-2xl p-4 lg:p-5 border border-border-main shadow-sm print-summary-card">
                  <p className="text-sm text-text-muted print:text-text-main">
                    إجمالي السحبيات
                  </p>
                  <p className="text-xl font-bold text-danger mt-1 value print:text-danger">
                    {(
                      statementData.summary.totalAdvances || 0
                    ).toLocaleString()}
                    ر.ي
                  </p>
                </div>
                <div className="bg-surface rounded-2xl p-4 lg:p-5 border border-border-main shadow-sm print-summary-card">
                  <p className="text-sm text-text-muted print:text-text-main">
                    إجمالي الخصومات
                  </p>
                  <p className="text-xl font-bold text-danger mt-1 value print:text-danger">
                    {(
                      statementData.summary.totalDiscounts || 0
                    ).toLocaleString()}
                    ر.ي
                  </p>
                </div>
                <div className="bg-primary rounded-2xl p-4 lg:p-5 shadow-sm text-white print-summary-card print:bg-surface print:text-black print:border-2 print:border-black">
                  <p className="text-brand-bg text-sm print:text-black print:font-extrabold">
                    الصافي المتبقي
                  </p>
                  <p className="text-2xl font-bold mt-1 value print:text-black print:font-black">
                    {(statementData.summary.netSalary || 0).toLocaleString()}
                    ر.ي
                  </p>
                </div>
              </div>
              <div
                className="mt-2 text-center text-[10px] text-text-muted print:text-text-muted select-none"
                dir="ltr"
              >
                برمجة كيان سوفت — www.kayan-soft.online
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted print:hidden">
          {worker
            ? "لا توجد سجلات لهذا العامل في الفترة المحددة"
            : "يرجى تحديد العامل والفترة الزمنية لعرض كشف الحساب"}
        </div>
      )}
      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 print:px-2 print:py-2 border-b">
              <h3 className="text-lg font-bold text-text-main">
                تعديل سجل {worker?.name}
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
