const fs = require('fs');
let code = fs.readFileSync('src/pages/Workers.tsx', 'utf8');
const functions = `
  const resetAdvanceForm = () => {
    setAdvanceData({
      workerId: workers[0]?.id || '',
      amount: '',
      paidAmount: '0',
      date: new Date().toISOString().split('T')[0],
      note: '',
      deductionMethod: 'automatic',
      status: 'active'
    });
    setEditingAdvance(null);
  };
  
  const openEditAdvanceModal = (advance: Advance) => {
    setEditingAdvance(advance);
    setAdvanceData({
      workerId: advance.workerId,
      amount: String(advance.amount),
      paidAmount: String(advance.paidAmount || 0),
      date: advance.date,
      note: advance.note || '',
      deductionMethod: advance.deductionMethod,
      status: advance.status
    });
    setIsAdvanceModalOpen(true);
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdvance) {
      await updateAdvance(editingAdvance.id, {
        workerId: advanceData.workerId,
        amount: Number(advanceData.amount),
        paidAmount: Number(advanceData.paidAmount),
        date: advanceData.date,
        note: advanceData.note,
        deductionMethod: advanceData.deductionMethod,
        status: advanceData.status
      });
    } else {
      await addAdvance({
        workerId: advanceData.workerId,
        amount: Number(advanceData.amount),
        paidAmount: Number(advanceData.paidAmount),
        date: advanceData.date,
        note: advanceData.note,
        deductionMethod: advanceData.deductionMethod,
        status: advanceData.status
      });
    }

    setIsAdvanceModalOpen(false);
    resetAdvanceForm();
  };

  const handleDeleteAdvance = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("هل أنت متأكد من حذف هذه السلفة؟")) {
      await deleteAdvance(id);
    }
  };

`;
code = code.replace('  return (', functions + '  return (');
fs.writeFileSync('src/pages/Workers.tsx', code);
