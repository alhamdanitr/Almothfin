const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Add imports
if (!code.includes('SmartEntryModal')) {
  code = code.replace("import { useStore } from '../hooks/useStore';", "import { useStore } from '../hooks/useStore';\nimport { SmartEntryModal } from './SmartEntryModal';\nimport { Bot } from 'lucide-react';");
}

// Add state
if (!code.includes('smartModalOpen')) {
  code = code.replace("const [cloudModalOpen, setCloudModalOpen] = useState(false);", "const [cloudModalOpen, setCloudModalOpen] = useState(false);\n  const [smartModalOpen, setSmartModalOpen] = useState(false);");
}

// Add FAB and Modal
const fabCode = `
      {/* Smart Entry FAB */}
      <button 
        onClick={() => setSmartModalOpen(true)}
        className="fixed bottom-24 lg:bottom-8 left-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all hover:-translate-y-1 print:hidden group"
        title="الترحيل الذكي"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden lg:block">
          الترحيل الذكي (الذكاء الاصطناعي)
        </span>
      </button>

      {smartModalOpen && <SmartEntryModal onClose={() => setSmartModalOpen(false)} />}
`;

if (!code.includes('SmartEntryModal onClose')) {
  code = code.replace("{cloudModalOpen && (", fabCode + "\n      {cloudModalOpen && (");
}

fs.writeFileSync('src/components/Layout.tsx', code);
