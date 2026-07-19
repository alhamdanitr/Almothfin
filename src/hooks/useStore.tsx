import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Worker, DailyRecord } from '../types';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StoreContextType {
  workers: Worker[];
  records: DailyRecord[];
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (id: string, worker: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  addRecord: (record: Omit<DailyRecord, 'id'>) => void;
  addBulkRecords: (records: Omit<DailyRecord, 'id'>[]) => void;
  deleteRecord: (id: string) => void;
  updateRecord: (id: string, record: Partial<DailyRecord>) => void;
  isSyncing: boolean;
  lastSyncTime: string | null;
  forceSync: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SYNC_URL = "https://script.google.com/macros/s/AKfycbwWkIwLCFG0cqNzOWzgmDb7qgpmURcoVyJNUbj1lXRR7LuLBTtf8hstrA0pA70XdlcC/exec";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Listen to workers collection
    const unsubscribeWorkers = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersData);
      setLastSyncTime(new Date().toLocaleTimeString('ar-IQ'));
    });

    // Listen to records collection
    const unsubscribeRecords = onSnapshot(collection(db, 'records'), (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyRecord));
      setRecords(recordsData);
      setLastSyncTime(new Date().toLocaleTimeString('ar-IQ'));
    });

    return () => {
      unsubscribeWorkers();
      unsubscribeRecords();
    };
  }, []);

  const forceSync = async () => {
    setIsSyncing(true);
    // If the database records are empty, we will try to migrate data from old Google Sheet
    try {
      const recordsSnap = await getDocs(collection(db, 'records'));
      if (recordsSnap.empty) {
        console.log("Firestore records empty, migrating from old Google Script...");
        const response = await fetch(`${DEFAULT_SYNC_URL}?action=getInitialData&startDate=2024-01-01&endDate=2030-12-31`);
        if (response.ok) {
          const data = await response.json();
          
          let mappedWorkers: Worker[] = [];

          if (data.employees && Array.isArray(data.employees)) {
            // First check existing workers to avoid duplicates if some exist
            const workersSnap = await getDocs(collection(db, 'workers'));
            const existingWorkers = workersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Worker));
            
            mappedWorkers = data.employees.map((emp: any) => {
              const existing = existingWorkers.find(w => w.name === emp.name);
              if (existing) return existing;
              
              return {
                id: emp.id || crypto.randomUUID(),
                workerNumber: emp.id ? String(emp.id) : '',
                name: emp.name || '',
                monthlySalary: Number(emp.salary) || 0,
                dailyAllowance: Number(emp.fixedDeparture) || 0,
                joinDate: emp.hireDate || new Date().toISOString().split('T')[0],
                status: 'active'
              };
            });
            
            // Chunk workers write (though usually small enough)
            for (let i = 0; i < mappedWorkers.length; i += 400) {
              const batch = writeBatch(db);
              const chunk = mappedWorkers.slice(i, i + 400);
              for (const worker of chunk) {
                if (!existingWorkers.find(w => w.id === worker.id)) {
                  const workerRef = doc(collection(db, 'workers'), worker.id);
                  batch.set(workerRef, worker);
                }
              }
              await batch.commit();
            }
          }

          if (data.allEntries && Array.isArray(data.allEntries)) {
            const mappedRecords: DailyRecord[] = data.allEntries.map((rec: any) => {
              const worker = mappedWorkers.find(w => w.name === rec.employeeName);
              const workerId = worker ? worker.id : crypto.randomUUID();
              
              let attendance: 'full' | 'half' | 'absent' = 'full';
              if (rec.attendance === 'نصف') attendance = 'half';
              if (rec.attendance === 'غياب') attendance = 'absent';
              
              const discount = rec.overtime < 0 ? Math.abs(rec.overtime) : 0;
              const advancePayment = Number(rec.advance) || 0;
              const allowance = Number(rec.departure) || 0;
              
              let date = rec.date;
              if (date && date.includes('/')) {
                  const parts = date.split('/');
                  if (parts.length === 3) {
                      date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                  }
              } else if (!date || !date.includes('-')) {
                  date = new Date().toISOString().split('T')[0];
              }
              
              const recordId = crypto.randomUUID();
              return {
                id: recordId,
                workerId,
                date: date,
                attendance,
                allowance,
                advancePayment,
                discount,
                note: rec.note || ''
              };
            });
            
            // Chunk records into batches of 400
            for (let i = 0; i < mappedRecords.length; i += 400) {
              const batch = writeBatch(db);
              const chunk = mappedRecords.slice(i, i + 400);
              for (const record of chunk) {
                const recordRef = doc(collection(db, 'records'), record.id);
                batch.set(recordRef, record);
              }
              await batch.commit();
            }
          }
          console.log("Migration successful");
        }
      }
    } catch (e) {
      console.warn("Migration failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Only run forceSync on mount
    forceSync();
  }, []);

  const addWorker = async (worker: Omit<Worker, 'id'>) => {
    const id = crypto.randomUUID();
    const newWorker = { ...worker, id };
    // Optimistic update
    setWorkers(prev => [...prev, newWorker]);
    await setDoc(doc(db, 'workers', id), newWorker);
  };

  const updateWorker = async (id: string, updated: Partial<Worker>) => {
    // Optimistic update
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updated } : w));
    try { await updateDoc(doc(db, 'workers', id), updated); } catch(e) { console.error('Worker Update Error:', e, updated); }
  };

  const deleteWorker = async (id: string) => {
    // Optimistic update
    setWorkers(prev => prev.filter(w => w.id !== id));
    await deleteDoc(doc(db, 'workers', id));
  };

  const addRecord = async (record: Omit<DailyRecord, 'id'>) => {
    // Check if record for same worker and date exists
    const existing = records.find(r => r.workerId === record.workerId && r.date === record.date);
    if (existing) {
      await updateRecord(existing.id, record);
      return;
    }
    
    const id = crypto.randomUUID();
    const newRecord = { ...record, id };
    // Optimistic update
    setRecords(prev => [...prev, newRecord]);
    await setDoc(doc(db, 'records', id), newRecord);
  };

  const addBulkRecords = async (newRecords: Omit<DailyRecord, 'id'>[]) => {
    const batch = writeBatch(db);
    const addedRecords = [];
    
    for (const record of newRecords) {
      const existing = records.find(r => r.workerId === record.workerId && r.date === record.date);
      if (existing) {
        const ref = doc(db, 'records', existing.id);
        batch.update(ref, record);
      } else {
        const id = crypto.randomUUID();
        const newRecord = { ...record, id };
        addedRecords.push(newRecord);
        const ref = doc(db, 'records', id);
        batch.set(ref, newRecord);
      }
    }
    
    // Optimistic update
    if (addedRecords.length > 0) {
      setRecords(prev => [...prev, ...addedRecords]);
    }
    
    await batch.commit();
  };

  const deleteRecord = async (id: string) => {
    // Optimistic update
    setRecords(prev => prev.filter(r => r.id !== id));
    await deleteDoc(doc(db, 'records', id));
  };

  const updateRecord = async (id: string, updated: Partial<DailyRecord>) => {
    // Optimistic update
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    try { await updateDoc(doc(db, 'records', id), updated); } catch(e) { console.error('Record Update Error:', e, updated); }
  };

  return (
    <StoreContext.Provider value={{
      workers, records, addWorker, updateWorker, deleteWorker, addRecord, addBulkRecords, deleteRecord, updateRecord,
      isSyncing, lastSyncTime, forceSync
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
