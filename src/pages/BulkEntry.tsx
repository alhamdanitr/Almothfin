import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { Save, Calendar, User } from "lucide-react";
import { AttendanceStatus } from "../types";
import { addDays, format, parseISO, differenceInDays } from "date-fns";
export default function BulkEntry() {
  const { workers, records, addBulkRecords } = useStore();
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  /* Only show active workers in dropdown */ const activeWorkers = useMemo(
    () => workers.filter((w) => w.status !== "inactive"),
    [workers],
  );
  /* State for the bulk form: key is date */ const [entries, setEntries] =
    useState<
      Record<
        string,
        {
          attendance: AttendanceStatus;
          allowance: string;
          advancePayment: string;
          delayMinutes: string;
          note: string;
        }
      >
    >({});
  const datesInRange = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const diff = differenceInDays(end, start);
    if (diff < 0) return [];
    const dates = [];
    for (let i = 0; i <= diff; i++) {
      dates.push(format(addDays(start, i), "yyyy-MM-dd"));
    }
    return dates;
  }, [startDate, endDate]);
  const hasExistingRecords = useMemo(() => {
    if (!selectedWorkerId || datesInRange.length === 0) return false;
    return records.some(
      (r) => r.workerId === selectedWorkerId && datesInRange.includes(r.date),
    );
  }, [records, selectedWorkerId, datesInRange]);
  /* Initialize entries when dates or worker change */ useEffect(() => {
    if (!selectedWorkerId) {
      setEntries({});
      return;
    }
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return;
    const initialEntries: typeof entries = {};
    datesInRange.forEach((date) => {
      const existingRecord = records.find(
        (r) => r.date === date && r.workerId === selectedWorkerId,
      );
      if (existingRecord) {
        initialEntries[date] = {
          attendance: existingRecord.attendance,
          allowance: String(
            existingRecord.allowance !== undefined
              ? existingRecord.allowance
              : "",
          ),
          advancePayment: String(existingRecord.advancePayment || ""),
          delayMinutes: String(existingRecord.delayMinutes || ""),
          note: existingRecord.note || "",
        };
      } else {
        initialEntries[date] = {
          attendance: "full",
          allowance:
            worker.dailyAllowance > 0 ? String(worker.dailyAllowance) : "",
          advancePayment: "",
          delayMinutes: "",
          note: "",
        };
      }
    });
    setEntries(initialEntries);
  }, [datesInRange, selectedWorkerId, workers, records]);
  const handleEntryChange = (date: string, field: string, value: string) => {
    setEntries((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] || {
          attendance: "full",
          allowance: "",
          advancePayment: "",
          delayMinutes: "",
          note: "",
        }),
        [field]: value,
      },
    }));
  };
  const handleSave = () => {
    if (!selectedWorkerId) return;
    setIsSaving(true);
    const newRecords: any[] = [];
    datesInRange.forEach((date) => {
      const entry = entries[date];
      if (entry) {
        newRecords.push({
          workerId: selectedWorkerId,
          date: date,
          attendance: entry.attendance,
          allowance: Number(entry.allowance) || 0,
          advancePayment: Number(entry.advancePayment) || 0,
          delayMinutes: Number(entry.delayMinutes) || 0,
          note: entry.note,
        });
      }
    });
    addBulkRecords(newRecords).then(() => {
      setIsSaving(false);
      alert("تم حفظ البيانات بنجاح للأيام المحددة!");
    });
  };
  if (activeWorkers.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted bg-surface rounded-2xl shadow-sm border border-border-main">
        لا يوجد عمال فعالين مسجلين. يرجى إضافتهم أولاً.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">
            الترحيل الجماعي الفردي
          </h2>
          <p className="text-sm text-text-muted mt-1">
            تعبئة الحضور والصرفيات لعامل محدد عبر فترة زمنية
          </p>
          {hasExistingRecords && (
            <p className="text-sm text-warning mt-2 font-medium bg-warning/10 inline-block px-3 py-1 rounded-md">
              تنبيه: يوجد بيانات مسجلة مسبقاً ضمن هذه الفترة، الحفظ سيقوم
              بتعديلها.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-48">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-sm bg-surface border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none text-text-main shadow-sm appearance-none"
            >
              <option value="" disabled>
                اختر العامل...
              </option>
              {activeWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
            <div className="relative w-full">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none text-text-main shadow-sm"
              />
            </div>
            <span className="text-text-muted">إلى</span>
            <div className="relative w-full">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 text-sm bg-surface border border-border-main rounded-xl focus:ring-2 focus:ring-primary outline-none text-text-main shadow-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={
              isSaving || datesInRange.length === 0 || !selectedWorkerId
            }
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors"
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
        <div className="p-8 text-center text-text-muted bg-surface rounded-2xl border border-border-main">
          يرجى اختيار العامل وتحديد الفترة الزمنية
        </div>
      ) : datesInRange.length === 0 ? (
        <div className="p-8 text-center text-danger bg-danger/10 rounded-2xl">
          يرجى التأكد من أن تاريخ النهاية أكبر من أو يساوي تاريخ البداية.
        </div>
      ) : (
        <div className="bg-surface shadow-sm rounded-2xl border border-border-main overflow-hidden">
          <div className="bg-brand-bg px-6 py-4 border-b border-border-main flex justify-between items-center">
            <h3 className="font-bold text-text-main flex items-center">
              <User className="w-4 h-4 ml-2 text-secondary" />
              {workers.find((w) => w.id === selectedWorkerId)?.name}
            </h3>
            <span className="text-sm text-text-muted font-mono">
              {startDate} <span className="mx-1">→</span> {endDate}
            </span>
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className=" min-w-full text-right divide-y divide-border-main">
              <thead className="bg-brand-bg">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-sm font-semibold text-text-main w-[15%]"
                  >
                    التاريخ
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-sm font-semibold text-text-main w-[15%]"
                  >
                    الحضور
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-sm font-semibold text-text-main w-[15%]"
                  >
                    الصرفة (ر.ي)
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-sm font-semibold text-text-main w-[15%]"
                  >
                    السحبيات (ر.ي)
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-sm font-semibold text-text-main w-[15%]"
                  >
                    التأخير (دقيقة)
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-sm font-semibold text-text-main w-[25%]"
                  >
                    ملاحظات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {datesInRange.map((date) => {
                  const entry = entries[date] || {
                    attendance: "full",
                    allowance: "",
                    advancePayment: "",
                    delayMinutes: "",
                    note: "",
                  };
                  return (
                    <tr
                      key={date}
                      className="hover:bg-brand-bg transition-colors"
                    >
                      <td
                        className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-main"
                        dir="ltr"
                      >
                        {date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={entry.attendance}
                          onChange={(e) =>
                            handleEntryChange(
                              date,
                              "attendance",
                              e.target.value,
                            )
                          }
                          className={`w-full py-2 px-3 border rounded-lg text-sm outline-none transition-colors ${entry.attendance === "full" ? "bg-success/10 border-emerald-200 text-emerald-800 " : ""} ${entry.attendance === "half" ? "bg-warning/10 border-amber-200 text-amber-800 " : ""} ${entry.attendance === "absent" ? "bg-danger/10 border-red-200 text-red-800 " : ""} `}
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
                          onChange={(e) =>
                            handleEntryChange(date, "allowance", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={entry.advancePayment}
                          onChange={(e) =>
                            handleEntryChange(
                              date,
                              "advancePayment",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={entry.delayMinutes}
                          onChange={(e) =>
                            handleEntryChange(
                              date,
                              "delayMinutes",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          placeholder="ملاحظة..."
                          value={entry.note}
                          onChange={(e) =>
                            handleEntryChange(date, "note", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-border-main">
            {datesInRange.map((date) => {
              const entry = entries[date] || {
                attendance: "full",
                allowance: "",
                advancePayment: "",
                delayMinutes: "",
                note: "",
              };
              return (
                <div
                  key={date}
                  className="p-4 space-y-4 hover:bg-brand-bg transition-colors"
                >
                  <div
                    className="font-bold text-lg text-text-main border-b border-border-main pb-2"
                    dir="ltr"
                  >
                    {date}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">
                        الحضور
                      </label>
                      <select
                        value={entry.attendance}
                        onChange={(e) =>
                          handleEntryChange(date, "attendance", e.target.value)
                        }
                        className={`w-full py-2 px-3 border rounded-lg text-sm outline-none transition-colors ${entry.attendance === "full" ? "bg-success/10 border-emerald-200 text-emerald-800 " : ""} ${entry.attendance === "half" ? "bg-warning/10 border-amber-200 text-amber-800 " : ""} ${entry.attendance === "absent" ? "bg-danger/10 border-red-200 text-red-800 " : ""} `}
                      >
                        <option value="full">حاضر</option>
                        <option value="half">نصف يوم</option>
                        <option value="absent">غائب</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">
                        الصرفة (ر.ي)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.allowance}
                        onChange={(e) =>
                          handleEntryChange(date, "allowance", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">
                        السحبيات (ر.ي)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.advancePayment}
                        onChange={(e) =>
                          handleEntryChange(
                            date,
                            "advancePayment",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">
                        التأخير (دقيقة)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entry.delayMinutes}
                        onChange={(e) =>
                          handleEntryChange(
                            date,
                            "delayMinutes",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-text-muted mb-1">
                        ملاحظات
                      </label>
                      <input
                        type="text"
                        placeholder="ملاحظة..."
                        value={entry.note}
                        onChange={(e) =>
                          handleEntryChange(date, "note", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none text-text-main transition-colors text-sm"
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
