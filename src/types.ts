export type AttendanceStatus = 'full' | 'half' | 'absent';

export interface Company {
  id: string;
  name: string;
  description?: string;
  logoBase64?: string;
  phones?: string;
  address?: string;
  createdAt: number;
}

export interface SalaryChange {
  effectiveDate: string; // YYYY-MM-DD
  monthlySalary: number;
  note?: string;
}

export interface Worker {
  id: string;
  workerNumber: string; // رقم العامل
  name: string; // اسم العامل
  monthlySalary: number; // الراتب الشهري الحالي
  salaryHistory?: SalaryChange[]; // سجل الرواتب حسب تاريخ السريان
  dailyAllowance: number; // الصرفة اليومية المعتادة
  joinDate: string; // تاريخ الانضمام
  status?: 'active' | 'inactive'; // حالة العامل
}

export interface DailyRecord {
  id: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  attendance: AttendanceStatus;
  advancePayment: number; // السحبيات
  allowance?: number; // الصرفة
  delayMinutes?: number; // التأخير بالدقائق
  note: string;
}

export interface DashboardStats {
  totalWorkers: number;
  presentToday: number;
  totalAdvancesMonth: number;
  remainingSalariesMonth: number;
}
