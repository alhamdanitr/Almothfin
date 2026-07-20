const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

if (!code.includes('SmartEntryModal')) {
  code = code.replace("import { DailyRecord, AttendanceStatus } from '../types';", "import { DailyRecord, AttendanceStatus } from '../types';\nimport { SmartEntryModal } from '../components/SmartEntryModal';\nimport { Bot } from 'lucide-react';");
}

if (!code.includes('smartModalOpen')) {
  code = code.replace("const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);", "const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);\n  const [smartModalOpen, setSmartModalOpen] = useState(false);");
}

const bannerCode = `
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
            <p className="text-indigo-100 max-w-md text-sm">
              قم بلصق نصوص الحضور والانصراف والصرفيات، وسيقوم الذكاء الاصطناعي بتحليلها وترحيلها تلقائياً.
            </p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            فتح المساعد
          </button>
        </div>
      </div>
      
      {smartModalOpen && <SmartEntryModal onClose={() => setSmartModalOpen(false)} />}
`;

if (!code.includes('Smart Entry Banner')) {
  code = code.replace('<div className="space-y-6">', '<div className="space-y-6">\n' + bannerCode);
}

fs.writeFileSync('src/pages/Dashboard.tsx', code);
