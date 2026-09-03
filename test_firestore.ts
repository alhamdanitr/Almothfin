import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };
const app = initializeApp(config);
try {
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  }, config.firestoreDatabaseId);
  console.log("Success");
} catch(e) {
  console.error(e);
}
