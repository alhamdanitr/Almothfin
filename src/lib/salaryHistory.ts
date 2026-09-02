import { Worker, SalaryChange } from '../types';

const FALLBACK_EFFECTIVE_DATE = '1900-01-01';

function isValidSalaryChange(change: Partial<SalaryChange>): change is SalaryChange {
  return Boolean(
    change.effectiveDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(change.effectiveDate) &&
    Number.isFinite(Number(change.monthlySalary))
  );
}

/**
 * Returns a normalized, oldest-first salary history. Existing workers created
 * before salary history existed receive a non-persisted baseline entry from
 * their current salary so old records remain calculable.
 */
export function getSalaryHistory(worker: Worker): SalaryChange[] {
  const storedHistory = Array.isArray(worker.salaryHistory)
    ? worker.salaryHistory.filter(isValidSalaryChange).map(change => ({
        effectiveDate: change.effectiveDate,
        monthlySalary: Number(change.monthlySalary) || 0,
        note: change.note || ''
      }))
    : [];

  const history = storedHistory.length > 0
    ? storedHistory
    : [{
        effectiveDate: worker.joinDate || FALLBACK_EFFECTIVE_DATE,
        monthlySalary: Number(worker.monthlySalary) || 0,
        note: 'الراتب الأساسي'
      }];

  return [...history].sort((a, b) => {
    const byDate = a.effectiveDate.localeCompare(b.effectiveDate);
    return byDate !== 0 ? byDate : a.monthlySalary - b.monthlySalary;
  });
}

/** Returns the monthly salary that applies on a specific YYYY-MM-DD date. */
export function getMonthlySalaryForDate(worker: Worker, date: string): number {
  const history = getSalaryHistory(worker);
  const applicable = history.filter(change => change.effectiveDate <= date);

  if (applicable.length > 0) {
    return Number(applicable[applicable.length - 1].monthlySalary) || 0;
  }

  return Number(history[0]?.monthlySalary ?? worker.monthlySalary) || 0;
}

/** Returns the current salary without applying a future-dated salary change. */
export function getCurrentMonthlySalary(worker: Worker, referenceDate = new Date().toISOString().split('T')[0]): number {
  return getMonthlySalaryForDate(worker, referenceDate);
}
