import handler from '../api/parse-attendance';

const body = {
  text: `الأربعاء 1/7\nمصطفى 4000\nمصطفى 3000 سحبية\nمصطفى 1500 إضافي\nعبدالرحمن 2000 غياب تأخير 5\nعادل 3000 نصف يوم تأخير ساعتين`,
  workers: [
    { id: 'm', name: 'مصطفى' },
    { id: 'a', name: 'عبدالرحمن' },
    { id: 'd', name: 'عادل' },
  ],
  existingRecords: [],
  fallbackDate: '2026-07-01',
};

const req = { method: 'POST', body };
const result: any = {};
const res = {
  status(code: number) { result.status = code; return this; },
  json(payload: unknown) { result.payload = payload; return this; },
};
await handler(req, res);
console.log(JSON.stringify(result, null, 2));
