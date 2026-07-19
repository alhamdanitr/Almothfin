import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD8Lw7MCmHzdeKSMlc7NkXRI_1Zzv9ewM0",
  authDomain: "gen-lang-client-0212635979.firebaseapp.com",
  projectId: "gen-lang-client-0212635979",
  storageBucket: "gen-lang-client-0212635979.firebasestorage.app",
  messagingSenderId: "714459673462",
  appId: "1:714459673462:web:288e0159ff76d14f788057"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-84a3f375-2fe2-4722-9157-ddff28d3ced0");
