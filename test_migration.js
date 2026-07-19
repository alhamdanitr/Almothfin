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
  const recSnap = await getDocs(collection(db, "records"));
  const records = [];
  recSnap.forEach((doc) => {
    records.push(doc.data().date);
  });
  console.log("Total Records:", records.length);
  if (records.length > 0) {
    console.log("First 5 records dates:", records.slice(0, 5));
  }
}
run();
