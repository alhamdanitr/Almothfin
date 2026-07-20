export type AttendanceStatus = 'full' | 'half' | 'absent';

export interface Worker {
  id: string;
  workerNumber: string; // رقم العامل
  name: string; // اسم العامل
  monthlySalary: number; // الراتب الشهري
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
