import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0212635979",
  appId: "1:714459673462:web:288e0159ff76d14f788057",
  apiKey: "AIzaSyD8Lw7MCmHzdeKSMlc7NkXRI_1Zzv9ewM0",
  authDomain: "gen-lang-client-0212635979.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-84a3f375-2fe2-4722-9157-ddff28d3ced0");

async function run() {
  console.log("Checking DB records dates...");
  const recSnap = await getDocs(collection(db, 'records'));
  console.log("Total Records:", recSnap.size);
  if (recSnap.size > 0) {
    let count = 0;
    const batch = writeBatch(db);
    for (const d of recSnap.docs) {
        let date = d.data().date;
        let needsUpdate = false;
        if (date && date.includes('/')) {
             const parts = date.split('/');
             if (parts.length === 3) {
                 date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                 needsUpdate = true;
             }
        }
        if (needsUpdate) {
            batch.update(d.ref, { date });
            count++;
        }
    }
    if (count > 0) {
        await batch.commit();
        console.log(`Updated ${count} records with malformed dates`);
    } else {
        console.log("No malformed dates found");
    }
  }
}
run();
