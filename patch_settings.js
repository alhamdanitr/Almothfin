const fs = require('fs');

let settingsCode = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Find imports and add what's missing (if any)
if (!settingsCode.includes("Phone,")) {
  settingsCode = settingsCode.replace("Trash2,", "Trash2, Phone, MapPin, AlignRight,");
}

const identitySection = `
      {/* Active Company Identity Section */}
      {activeCompany && (
        <div className="bg-surface rounded-2xl shadow-sm border border-border-main overflow-hidden">
          <div className="p-6 border-b border-border-main flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-text-main flex items-center">
                <Building2 className="w-5 h-5 ml-2 text-primary" /> 
                هوية المؤسسة النشطة
              </h3>
              <p className="text-sm text-text-muted mt-1">
                إعداد شعار المؤسسة، العنوان، ورقم الهاتف (تظهر في ترويسة الكشوفات)
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCompany(activeCompany);
                setFormData({
                  name: activeCompany.name,
                  description: activeCompany.description || "",
                  phones: activeCompany.phones || "",
                  address: activeCompany.address || "",
                  logoBase64: activeCompany.logoBase64 || "",
                });
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors font-medium"
            >
              <Edit2 className="w-4 h-4 ml-2" />
              تعديل الهوية
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3 flex flex-col items-center justify-center border-l border-border-main">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border-main flex items-center justify-center bg-brand-bg relative overflow-hidden mb-2">
                {activeCompany.logoBase64 ? (
                  <img src={activeCompany.logoBase64} alt="شعار المؤسسة" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center text-text-muted">
                    <Building2 className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">لا يوجد شعار</span>
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-brand-bg p-4 rounded-xl border border-border-main/50">
                <span className="text-xs font-bold text-text-muted flex items-center mb-1">
                  <AlignRight className="w-3 h-3 ml-1" /> اسم المؤسسة
                </span>
                <p className="font-bold text-text-main">{activeCompany.name}</p>
              </div>
              <div className="bg-brand-bg p-4 rounded-xl border border-border-main/50">
                <span className="text-xs font-bold text-text-muted flex items-center mb-1">
                  <AlignRight className="w-3 h-3 ml-1" /> الوصف / التخصص
                </span>
                <p className="font-bold text-text-main">{activeCompany.description || "—"}</p>
              </div>
              <div className="bg-brand-bg p-4 rounded-xl border border-border-main/50">
                <span className="text-xs font-bold text-text-muted flex items-center mb-1">
                  <Phone className="w-3 h-3 ml-1" /> أرقام الهواتف
                </span>
                <p className="font-bold text-text-main" dir="ltr">{activeCompany.phones || "—"}</p>
              </div>
              <div className="bg-brand-bg p-4 rounded-xl border border-border-main/50">
                <span className="text-xs font-bold text-text-muted flex items-center mb-1">
                  <MapPin className="w-3 h-3 ml-1" /> العنوان
                </span>
                <p className="font-bold text-text-main">{activeCompany.address || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
`;

settingsCode = settingsCode.replace('{/* Data Backup & Restore Section */}', identitySection + '\n      {/* Data Backup & Restore Section */}');

fs.writeFileSync('src/pages/Settings.tsx', settingsCode);
