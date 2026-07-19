import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, getDocs, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0212635979",
  appId: "1:714459673462:web:288e0159ff76d14f788057",
  apiKey: "AIzaSyD8Lw7MCmHzdeKSMlc7NkXRI_1Zzv9ewM0",
  authDomain: "gen-lang-client-0212635979.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-84a3f375-2fe2-4722-9157-ddff28d3ced0");

async function run() {
  console.log("Fetching from correct GAS URL...");
  const res = await fetch("https://script.google.com/macros/s/AKfycbwWkIwLCFG0cqNzOWzgmDb7qgpmURcoVyJNUbj1lXRR7LuLBTtf8hstrA0pA70XdlcC/exec?action=getInitialData");
  const data = await res.json();
  
  if (!data.records) {
    console.log("No records found", data);
    return;
  }
  
  console.log("Got records from GAS:", data.records.length);
  
  const workersSnap = await getDocs(collection(db, 'workers'));
  const workers = workersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const mappedRecords = data.records.map((rec) => {
    const worker = workers.find(w => w.name === rec.employeeName);
    const workerId = worker ? worker.id : crypto.randomUUID();
    
    let attendance = 'full';
    if (rec.attendance === 'نصف') attendance = 'half';
    if (rec.attendance === 'غياب') attendance = 'absent';
    
    const discount = rec.overtime < 0 ? Math.abs(rec.overtime) : 0;
    const advancePayment = Number(rec.advance) || 0;
    const allowance = Number(rec.departure) || 0;
    
    // Convert 25/10/2025 to 2025-10-25 if needed
    let date = rec.date;
    if (date && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
            // Check if it's DD/MM/YYYY or MM/DD/YYYY
            // Assuming DD/MM/YYYY from Arabic format
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    } else if (date && date.includes('-')) {
        // Assume already YYYY-MM-DD
    } else {
        date = new Date().toISOString().split('T')[0];
    }
    
    return {
      id: crypto.randomUUID(),
      workerId,
      date: date,
      attendance,
      allowance,
      advancePayment,
      discount,
      note: rec.note || ''
    };
  });
  
  console.log("Sample record date converted:", mappedRecords[0].date);
  console.log("Migrating", mappedRecords.length, "records to Firestore...");
  
  for (let i = 0; i < mappedRecords.length; i += 400) {
    const batch = writeBatch(db);
    const chunk = mappedRecords.slice(i, i + 400);
    for (const record of chunk) {
      batch.set(doc(collection(db, 'records'), record.id), record);
    }
    await batch.commit();
    console.log("Committed batch", Math.floor(i/400) + 1);
  }
  
  console.log("Migration complete!");
}
run();
