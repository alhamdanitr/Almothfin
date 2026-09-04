const fs = require('fs');
let code = fs.readFileSync('src/pages/Statements.tsx', 'utf8');

// Replace statementDataByMonth logic
code = code.replace(/const statementDataByMonth = useMemo\(\(\) => \{[\s\S]*?\}, \[worker, startDate, endDate, records\]\);/m, `const statementsToRender = useMemo(() => {
    if (!selectedWorkerId || !startDate || !endDate) return [];
    
    const workersToProcess = selectedWorkerId === "all" 
      ? activeWorkers 
      : activeWorkers.filter(w => w.id === selectedWorkerId);

    if (workersToProcess.length === 0) return [];

    const allReports = [];

    workersToProcess.forEach(w => {
      const filteredRecords = records
        .filter((r) => r.workerId === w.id && r.date >= startDate && r.date <= endDate)
        .sort((a, b) => a.date.localeCompare(b.date));
      
      if (filteredRecords.length === 0) return;

      const groupedByMonth = {};
      filteredRecords.forEach((r) => {
        const monthStr = r.date.substring(0, 7);
        if (!groupedByMonth[monthStr]) groupedByMonth[monthStr] = [];
        groupedByMonth[monthStr].push(r);
      });

      const months = Object.keys(groupedByMonth).sort();
      months.forEach((month) => {
        const monthRecords = groupedByMonth[month];
        let totalEarned = 0;
        let totalAdvances = 0;
        let totalAllowance = 0;
        let totalDiscounts = 0;
        let daysPresent = 0;
        let daysHalf = 0;
        let daysAbsent = 0;
        let lastDailyRate = (w.monthlySalary || 0) / 30;

        monthRecords.forEach((r) => {
          totalAdvances += Number(r.advancePayment || 0);
          totalAllowance += Number(r.allowance || 0);
          const dailyRate = getMonthlySalaryForDate(w, r.date) / 30;
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

        const netSalary = totalEarned - totalAdvances - totalDiscounts - totalAllowance;
        allReports.push({
          worker: w,
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
        });
      });
    });

    return allReports;
  }, [selectedWorkerId, activeWorkers, startDate, endDate, records]);`);

// Change fileName for PDF
code = code.replace(/const workerName = worker\?\.name\?\.replace\(\/\\s\+\/g, "-"\) \|\| "العامل";\s*pdf\.save\(\`كشف-حساب-\$\{workerName\}\.pdf\`\);/m, 
`const fileName = selectedWorkerId === "all" ? "كشوفات-جميع-العمال.pdf" : \`كشف-حساب-\${worker?.name?.replace(/\\s+/g, "-") || "العامل"}.pdf\`;
      pdf.save(fileName);`);

// Update select dropdown
code = code.replace(/<option value="">-- اختر العامل --<\/option>/, `<option value="">-- اختر العامل --</option>
                <option value="all">جميع العمال (الكل)</option>`);

// Update the rendering logic
code = code.replace(/{statementDataByMonth && statementDataByMonth\.length > 0 \? \(/, `{statementsToRender && statementsToRender.length > 0 ? (`);
code = code.replace(/{statementDataByMonth && statementDataByMonth\.length > 0 && \(/, `{statementsToRender && statementsToRender.length > 0 && (`);

// IMPORTANT: update the mapping
// The old map was {statementDataByMonth.map((statementData, index) => (
// We must change it to map over statementsToRender. We also need to change the inner usage of worker to statementData.worker
code = code.replace(/\{statementDataByMonth\.map\(\(statementData, index\) => \(/, `{statementsToRender.map((statementData, index) => (`);

// There is a <ReportHeader ...> that uses worker?.name. We need to replace it with statementData.worker.name
code = code.replace(/value: worker\?\.name \|\| "غير معروف"/g, 'value: statementData.worker.name || "غير معروف"');

// And the worker parameter used in other places like:
// {worker ? "لا توجد سجلات لهذا العامل في الفترة المحددة" : "يرجى تحديد العامل والفترة الزمنية لعرض كشف الحساب"}
code = code.replace(/{worker\s*\?\s*"لا توجد سجلات لهذا العامل في الفترة المحددة"\s*:\s*"يرجى تحديد العامل والفترة الزمنية لعرض كشف الحساب"}/, 
`{selectedWorkerId ? "لا توجد سجلات في الفترة المحددة" : "يرجى تحديد العامل (أو الكل) والفترة الزمنية"}`);

// Also fix the edit modal which used worker?.name
code = code.replace(/تعديل سجل \{worker\?\.name\}/g, `تعديل سجل`);
// We can use activeWorkers to find the worker name in edit modal.
code = code.replace(/<h3 className="text-lg font-bold text-text-main">\s*تعديل سجل\s*<\/h3>/, 
`<h3 className="text-lg font-bold text-text-main">
                تعديل سجل {activeWorkers.find(w => w.id === editingRecord?.workerId)?.name}
              </h3>`);

// Add page-break-before-always for print-month-container EXCEPT the first one
code = code.replace(/className="print-month-container space-y-2"/g, `className={\`print-month-container space-y-2 \${index > 0 ? 'print:break-before-page' : ''}\`}`);

fs.writeFileSync('src/pages/Statements.tsx', code);
