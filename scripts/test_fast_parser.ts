import { parseAttendanceText } from '../src/lib/fastAttendanceParser';

const result = parseAttendanceText(`الأربعاء 1/7\nمصطفى 4000\nمصطفى 3000 سحبية\nمصطفى 1500 إضافي\nمصطفى -2000 سحبية\nعبدالرحمن 2000 غياب تأخير 5\nعادل 3000 نصف يوم تأخير ساعتين`, [
  { id: 'm', name: 'مصطفى', status: 'active' } as any,
  { id: 'a', name: 'عبدالرحمن', status: 'active' } as any,
  { id: 'd', name: 'عادل', status: 'active' } as any,
  { id: 'x', name: 'عامل غير فعال', status: 'inactive' } as any,
], [], '2026-07-01');
console.log(JSON.stringify(result, null, 2));
if (result.engine !== 'local-regex-v1') throw new Error('ليس محللًا محليًا');
if (result.records[0].allowance !== 4000 || result.records[0].advancePayment !== 1000 || result.records[0].note !== '1500 اضافي') throw new Error('خطأ في الصرفة/السحبية/الإضافي');
if (result.records[1].attendance !== 'absent' || result.records[1].delayMinutes !== 300) throw new Error('خطأ في الغياب/التأخير');
if (result.records[2].attendance !== 'half' || result.records[2].delayMinutes !== 120) throw new Error('خطأ في نصف اليوم/التأخير');
