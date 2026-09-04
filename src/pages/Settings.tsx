import React, { useState, useRef } from "react";
import { useStore } from "../hooks/useStore";
import {
  Building2,
  Plus,
  Edit2,
  Upload,
  Trash2,
  Check,
  X,
  Download,
  Database,
  Banknote,
  Calendar,
} from "lucide-react";
import { Company, Advance, AdvanceDeductionMethod } from "../types";
export default function Settings() {
  const {
    companies,
    activeCompanyId,
    switchCompany,
    addCompany,
    updateCompany,
    deleteCompany,
    workers,
    records,
    addWorker,
    addBulkRecords,
  } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phones: "",
    address: "",
    logoBase64: "",
  });
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      phones: "",
      address: "",
      logoBase64: "",
    });
    setEditingCompany(null);
  };
  const handleExport = () => {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      activeCompanyId,
      workers,
      records,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${activeCompanyId}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !confirm(
        "تنبيه: استيراد البيانات سيقوم بإضافة السجلات والعمال إلى المؤسسة النشطة حالياً. هل أنت متأكد من المتابعة؟",
      )
    ) {
      if (importInputRef.current) importInputRef.current.value = "";
      return;
    }
    setIsImporting(true);
    setImportStatus("جاري تحليل الملف...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (!data.version || (!data.workers && !data.records)) {
          throw new Error("ملف النسخة الاحتياطية غير صالح");
        }
        if (data.workers && Array.isArray(data.workers)) {
          for (const worker of data.workers) {
            const exists = workers.some(
              (w) =>
                w.workerNumber === worker.workerNumber &&
                w.name === worker.name,
            );
            if (!exists) {
              const { id, ...workerData } = worker;
              await addWorker(workerData);
            }
          }
        }
        setImportStatus("جاري استيراد السجلات...");
        if (data.records && Array.isArray(data.records)) {
          await addBulkRecords(
            data.records.map((r: any) => {
              const { id, ...recordData } = r;
              return recordData;
            }),
          );
        }
        setImportStatus("تم الاستيراد بنجاح!");
        setTimeout(() => setImportStatus(null), 3000);
      } catch (error) {
        console.error("Import error:", error);
        setImportStatus("حدث خطأ أثناء الاستيراد. يرجى التحقق من الملف.");
        setTimeout(() => setImportStatus(null), 4000);
      } finally {
        setIsImporting(false);
        if (importInputRef.current) importInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  const openEditModal = (c: Company) => {
    setEditingCompany(c);
    setFormData({
      name: c.name,
      description: c.description || "",
      phones: c.phones || "",
      address: c.address || "",
      logoBase64: c.logoBase64 || "",
    });
    setIsModalOpen(true);
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logoBase64: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      await updateCompany(editingCompany.id, formData);
    } else {
      await addCompany(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      window.confirm(
        "هل أنت متأكد من حذف هذه المؤسسة؟ سيتم مسح جميع العمال والسجلات الخاصة بها نهائياً!",
      )
    ) {
      await deleteCompany(id);
    }
  };
  return (
    <div className="space-y-6">
      {" "}
      {/* Data Backup & Restore Section */}{" "}
      <div className="bg-surface rounded-2xl shadow-sm border border-border-main overflow-hidden">
        {" "}
        <div className="p-6 border-b border-border-main flex items-center justify-between">
          {" "}
          <div>
            {" "}
            <h3 className="text-xl font-bold text-text-main flex items-center">
              {" "}
              <Database className="w-5 h-5 ml-2 text-primary" /> النسخ الاحتياطي
              والبيانات{" "}
            </h3>{" "}
            <p className="text-sm text-text-muted mt-1">
              {" "}
              تصدير بيانات المؤسسة الحالية (عمال وسجلات) إلى ملف JSON أو
              استيرادها{" "}
            </p>{" "}
          </div>{" "}
          <div className="flex gap-3">
            {" "}
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
            >
              {" "}
              <Download className="w-5 h-5 ml-2" /> تصدير البيانات{" "}
            </button>{" "}
            <input
              type="file"
              ref={importInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />{" "}
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center px-4 py-2 bg-surface border border-border-main text-text-main rounded-lg hover:bg-brand-bg transition-colors font-medium disabled:opacity-50"
            >
              {" "}
              <Upload className="w-5 h-5 ml-2 text-text-muted" />{" "}
              {isImporting ? "جاري..." : "استيراد البيانات"}{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {importStatus && (
          <div className="bg-primary/5 px-6 py-3 text-sm text-primary font-medium flex items-center">
            {" "}
            <Check className="w-4 h-4 ml-2" /> {importStatus}{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div className="flex items-center justify-between">
        {" "}
        <h2 className="text-2xl font-bold text-text-main">
          إدارة المؤسسات
        </h2>{" "}
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          {" "}
          <Plus className="w-5 h-5 ml-2" /> إضافة مؤسسة{" "}
        </button>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {" "}
        {companies.map((company) => (
          <div
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className={`cursor-pointer overflow-hidden rounded-2xl shadow-sm border-2 transition-all ${activeCompanyId === company.id ? "border-secondary bg-primary/10/30" : "border-border-main bg-surface hover:border-secondary/30 hover:shadow-md"}`}
          >
            {" "}
            <div className="p-6 h-full flex flex-col">
              {" "}
              <div className="flex justify-between items-start mb-4">
                {" "}
                <div className="flex items-center">
                  {" "}
                  {company.logoBase64 ? (
                    <img
                      src={company.logoBase64}
                      alt={company.name}
                      className="w-12 h-12 object-contain rounded-lg border border-border-main bg-surface"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-secondary">
                      {" "}
                      <Building2 className="w-6 h-6" />{" "}
                    </div>
                  )}{" "}
                  <div className="mr-3">
                    {" "}
                    <h3 className="font-bold text-text-main text-lg">
                      {company.name}
                    </h3>{" "}
                    {activeCompanyId === company.id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary mt-1">
                        {" "}
                        النشطة حالياً{" "}
                      </span>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flex space-x-2 space-x-reverse">
                  {" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(company);
                    }}
                    className="text-text-muted hover:text-primary transition-colors p-1"
                  >
                    {" "}
                    <Edit2 className="w-4 h-4" />{" "}
                  </button>{" "}
                  {companies.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(e, company.id)}
                      className="text-text-muted hover:text-danger transition-colors p-1"
                    >
                      {" "}
                      <Trash2 className="w-4 h-4" />{" "}
                    </button>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <div className="mt-auto space-y-2 text-sm text-text-muted">
                {" "}
                {company.phones && (
                  <p>
                    <span className="font-medium text-text-main">هاتف:</span>{" "}
                    <span dir="ltr">{company.phones}</span>
                  </p>
                )}{" "}
                {company.address && (
                  <p>
                    <span className="font-medium text-text-main">العنوان:</span>{" "}
                    {company.address}
                  </p>
                )}{" "}
                {company.description && (
                  <p className="line-clamp-2 mt-2 pt-2 border-t border-border-main">
                    {company.description}
                  </p>
                )}{" "}
              </div>{" "}
            </div>{" "}
          </div>
        ))}{" "}
      </div>{" "}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          {" "}
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {" "}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              {" "}
              <h3 className="text-lg font-bold text-text-main flex items-center">
                {" "}
                <Building2 className="w-5 h-5 ml-2 text-secondary" />{" "}
                {editingCompany
                  ? "تعديل بيانات المؤسسة"
                  : "إضافة مؤسسة جديدة"}{" "}
              </h3>{" "}
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-muted"
              >
                {" "}
                <X className="w-5 h-5" />{" "}
              </button>{" "}
            </div>{" "}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              {" "}
              <div className="flex flex-col items-center justify-center mb-6">
                {" "}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-border-main hover:border-secondary flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-brand-bg transition-colors relative group"
                >
                  {" "}
                  {formData.logoBase64 ? (
                    <>
                      {" "}
                      <img
                        src={formData.logoBase64}
                        alt="الشعار"
                        className="w-full h-full object-contain bg-surface"
                      />{" "}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {" "}
                        <Upload className="text-white w-6 h-6" />{" "}
                      </div>{" "}
                    </>
                  ) : (
                    <>
                      {" "}
                      <Upload className="w-6 h-6 text-text-muted mb-2 group-hover:text-secondary transition-colors" />{" "}
                      <span className="text-xs font-medium text-text-muted group-hover:text-primary transition-colors">
                        رفع شعار
                      </span>{" "}
                    </>
                  )}{" "}
                </div>{" "}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <label className="block text-sm font-medium text-text-main">
                  اسم المؤسسة <span className="text-danger">*</span>
                </label>{" "}
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <label className="block text-sm font-medium text-text-main">
                  التخصص أو الوصف
                </label>{" "}
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="مثال: نظام إدارة العمال"
                />{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div className="space-y-2">
                  {" "}
                  <label className="block text-sm font-medium text-text-main">
                    أرقام الهواتف
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.phones}
                    onChange={(e) =>
                      setFormData({ ...formData, phones: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    dir="ltr"
                    placeholder="05x-xxx-xxxx"
                  />{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <label className="block text-sm font-medium text-text-main">
                    العنوان
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border-main rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="المدينة، الشارع"
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="pt-4 flex justify-end space-x-3 space-x-reverse border-t mt-6">
                {" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-main bg-surface border border-border-main rounded-lg hover:bg-brand-bg"
                >
                  إلغاء
                </button>{" "}
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center"
                >
                  {" "}
                  <Check className="w-4 h-4 ml-2" />{" "}
                  {editingCompany ? "حفظ التعديلات" : "إضافة المؤسسة"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
