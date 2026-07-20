const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPrompt = "You are an AI assistant parsing daily attendance and payment records.\\n        Text from user:\\n${text}\\n\\nAvailable workers list:\\n${JSON.stringify(workers.map((w: any) => ({id: w.id, name: w.name, workerNumber: w.workerNumber})))}\\n\\nFallback Date (YYYY-MM-DD): ${fallbackDate}\\n\\nParse the text to find attendance and payments. If someone is marked absent (غياب), set attendance to 'absent'.\\nIf someone is marked as half day (داوم ساعتين or نصف), set attendance to 'half'.\\nOtherwise, set attendance to 'full'.\\nAmounts next to names (e.g. 4000) are 'advancePayment' (السحبيات).\\nFor each parsed record, match with the correct worker ID based on the name.\\nThe text might contain a date (e.g. \"السبت 18/7\"). If so, parse it into YYYY-MM-DD format using the current year (2026). If no date is found, use the fallback Date.\\n\\nReturn JSON matching this schema exactly. Do not output markdown, just the JSON array.";

const newPrompt = `You are a highly precise and strict data extraction AI for an attendance and payroll system. Your task is to analyze Arabic text to extract attendance and payment records with 100% accuracy. You must NOT mix up worker data.

Text from user:
\${text}

Available workers list:
\${JSON.stringify(workers.map((w: any) => ({id: w.id, name: w.name, workerNumber: w.workerNumber})))}

Fallback Date (YYYY-MM-DD): \${fallbackDate}

Rules:
1. Strict Identity Matching: Match the names in the text EXACTLY to the names in the 'Available workers list'. If a name matches multiple workers slightly, pick the exact match. Do not guess wildly. Return the exact 'workerId'.
2. Attendance Status: 
   - If the text says "غياب" (absent) next to a name, set 'attendance' to 'absent'.
   - If the text says "نصف" or "داوم ساعتين" or implies a partial day, set 'attendance' to 'half'.
   - Otherwise, default to 'full' (حاضر).
3. Payments: 
   - Any number directly next to a worker's name (e.g. 4000) represents a financial amount (usually advance payment / سحبيات). Assign this number to 'advancePayment'.
   - If a specific allowance (صرفة) is mentioned, map it to 'allowance'.
   - Ensure the amount is mapped exactly to the person it appears next to.
4. Date parsing: If the text contains a date (e.g. "السبت 18/7" or "18-7"), parse it into YYYY-MM-DD format using the current year (2026). If there is absolutely no date, use the '\${fallbackDate}'.
5. Do not hallucinate workers that are not in the list.

Extract the data strictly.`;

code = code.replace(oldPrompt, newPrompt);
fs.writeFileSync('server.ts', code);
