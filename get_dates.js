import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0212635979",
  appId: "1:714459673462:web:288e0159ff76d14f788057",
  apiKey: "AIzaSyD8Lw7MCmHzdeKSMlc7NkXRI_1Zzv9ewM0",
  authDomain: "gen-lang-client-0212635979.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-84a3f375-2fe2-4722-9157-ddff28d3ced0");

async function run() {
  const querySnapshot = await getDocs(collection(db, "records"));
  const dates = new Set();
  let count = 0;
  const sampleRecords = [];
  querySnapshot.forEach((doc) => {
    dates.add(doc.data().date);
    if(count < 5) sampleRecords.push(doc.data());
    count++;
  });
  console.log("Total records:", count);
  console.log("Sample dates:", Array.from(dates).slice(0, 15));
  console.log("Sample records:", sampleRecords);
}
run();
