const fs = require('fs');
let code = fs.readFileSync('src/pages/DailyEntry.tsx', 'utf8');

code = code.replace(
  "import { Save, Calendar } from 'lucide-react';",
  "import { Save, Calendar, Bot, Wand2, Loader2, AlertCircle } from 'lucide-react';"
);

code = code.replace(
  "  const [isSaving, setIsSaving] = useState(false);",
  "  const [isSaving, setIsSaving] = useState(false);\n  const [aiText, setAiText] = useState('');\n  const [isAiParsing, setIsAiParsing] = useState(false);\n  const [aiError, setAiError] = useState('');"
);

const func = `
  const parseWithAi = async () => {
    if (!aiText.trim()) return;
    setIsAiParsing(true);
    setAiError('');
    try {
      const response = await fetch('/api/parse-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText,
          workers: activeWorkers,
          fallbackDate: selectedDate
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل الاتصال بالمساعد الذكي');
      }
      const data = await response.json();
      
      const newEntries = { ...entries };
      let newDate = selectedDate;

      if (data.records && Array.isArray(data.records)) {
        data.records.forEach((record: any) => {
          if (record.date) {
              newDate = record.date;
          }
          if (record.workerId) {
            newEntries[record.workerId] = {
              attendance: record.attendance || 'full',
              allowance: record.allowance !== undefined ? String(record.allowance) : (newEntries[record.workerId]?.allowance || ''),
              advancePayment: record.advancePayment !== undefined ? String(record.advancePayment) : '',
              delayMinutes: record.delayMinutes !== undefined ? String(record.delayMinutes) : '',
              note: record.note || ''
            };
          }
        });
      }
      
      if (newDate !== selectedDate) {
          setSelectedDate(newDate);
      }
      setEntries(newEntries);
      setAiText(''); // clear on success
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleEntryChange`;

code = code.replace("  const handleEntryChange", func);

fs.writeFileSync('src/pages/DailyEntry.tsx', code);
