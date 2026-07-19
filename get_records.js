import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD8Lw7MCmHzdeKSMlc7NkXRI_1Zzv9ewM0",
  projectId: "gen-lang-client-0212635979",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-84a3f375-2fe2-4722-9157-ddff28d3ced0");

async function run() {
  const querySnapshot = await getDocs(collection(db, "records"));
  const records = [];
  querySnapshot.forEach((doc) => {
    records.push(doc.data());
  });
  console.log(records.slice(0, 5));
}
run();
