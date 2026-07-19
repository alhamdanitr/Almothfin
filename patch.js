const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStore.tsx', 'utf8');
code = code.replace(
  "await updateDoc(doc(db, 'workers', id), updated);",
  "try { await updateDoc(doc(db, 'workers', id), updated); } catch (e) { console.error('updateWorker error:', e); }"
);
code = code.replace(
  "await updateDoc(doc(db, 'records', id), updated);",
  "try { await updateDoc(doc(db, 'records', id), updated); } catch (e) { console.error('updateRecord error:', e); }"
);
fs.writeFileSync('src/hooks/useStore.tsx', code);
