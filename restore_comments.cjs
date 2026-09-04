const fs = require('fs');

const fixComment = (filePath, commentText, replaceWith) => {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(commentText, replaceWith);
  fs.writeFileSync(filePath, code);
};

// BulkEntry.tsx
fixComment('src/pages/BulkEntry.tsx', '// Only show active workers in dropdown ', '/* Only show active workers in dropdown */ ');
fixComment('src/pages/BulkEntry.tsx', "// State for the bulk form: key is date ", '/* State for the bulk form: key is date */ ');
fixComment('src/pages/BulkEntry.tsx', '// Initialize entries when dates or worker change ', '/* Initialize entries when dates or worker change */ ');

// DailyEntry.tsx
fixComment('src/pages/DailyEntry.tsx', '// Only show active workers ', '/* Only show active workers */ ');
fixComment('src/pages/DailyEntry.tsx', '// State for the form: key is workerId ', '/* State for the form: key is workerId */ ');

// Dashboard.tsx
fixComment('src/pages/Dashboard.tsx', '// YYYY-MM ', '/* YYYY-MM */ ');
fixComment('src/pages/Dashboard.tsx', '// Sum of wages based on attendance ', '/* Sum of wages based on attendance */ ');
fixComment('src/pages/Dashboard.tsx', '// Calculate total base salaries for all workers (just as an indicator) ', '/* Calculate total base salaries for all workers (just as an indicator) */ ');
fixComment('src/pages/Dashboard.tsx', "// Calculate this month's financials based on records ", "/* Calculate this month's financials based on records */ ");
fixComment('src/pages/Dashboard.tsx', "// Calculate the daily rate that was active on this record's date. ", "/* Calculate the daily rate that was active on this record's date. */ ");
fixComment('src/pages/Dashboard.tsx', '// Calculate financial discount based on delay minutes (12 hours = 720 mins) ', '/* Calculate financial discount based on delay minutes (12 hours = 720 mins) */ ');

// Statements.tsx
fixComment('src/pages/Statements.tsx', '// Chrome على Android يوفّر حفظًا موثوقًا عبر معاينة الطباعة، بينما html2canvas قد يفشل مع CSS الهاتف. ', '/* Chrome على Android يوفّر حفظًا موثوقًا عبر معاينة الطباعة، بينما html2canvas قد يفشل مع CSS الهاتف. */ ');
fixComment('src/pages/Statements.tsx', '// fallback موثوق بدل عرض رسالة فشل فقط. ', '/* fallback موثوق بدل عرض رسالة فشل فقط. */ ');

// Workers.tsx
fixComment('src/pages/Workers.tsx', '// Keep salaryHistory intact when editing ordinary worker details. ', '/* Keep salaryHistory intact when editing ordinary worker details. */ ');

