import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Worker, DailyRecord, Company, Advance } from "../types";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface StoreContextType {
  companies: Company[];
  activeCompanyId: string | null;
  activeCompany: Company | null;
  workers: Worker[];
  records: DailyRecord[];
  advances: Advance[];

  addCompany: (company: Omit<Company, "id" | "createdAt">) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  switchCompany: (id: string) => void;
  deleteCompany: (id: string) => Promise<void>;

  addWorker: (worker: Omit<Worker, "id">) => Promise<void>;
  updateWorker: (id: string, worker: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;

  addRecord: (record: Omit<DailyRecord, "id">) => Promise<void>;
  addBulkRecords: (records: Omit<DailyRecord, "id">[]) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  updateRecord: (id: string, record: Partial<DailyRecord>) => Promise<void>;

  addAdvance: (advance: Omit<Advance, "id">) => Promise<void>;
  updateAdvance: (id: string, advance: Partial<Advance>) => Promise<void>;
  deleteAdvance: (id: string) => Promise<void>;

  isSyncing: boolean;
  lastSyncTime: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(
    localStorage.getItem("activeCompanyId"),
  );
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || null;

  useEffect(() => {
    // Listen to companies collection
    const q = query(collection(db, "companies"), orderBy("createdAt", "asc"));
    const unsubscribeCompanies = onSnapshot(q, (snapshot) => {
      const compsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Company,
      );
      setCompanies(compsData);

      // If no active company, default to first or 'default'
      if (compsData.length > 0 && !localStorage.getItem("activeCompanyId")) {
        const defaultId =
          compsData.find((c) => c.id === "default")?.id || compsData[0].id;
        setActiveCompanyId(defaultId);
        localStorage.setItem("activeCompanyId", defaultId);
      }
    });

    return () => unsubscribeCompanies();
  }, []);

  useEffect(() => {
    if (!activeCompanyId) {
      setWorkers([]);
      setRecords([]);
      return;
    }

    setWorkers([]);
    setRecords([]);

    // Listen to workers and records for active company
    const workersRef = collection(db, "companies", activeCompanyId, "workers");
    const recordsRef = collection(db, "companies", activeCompanyId, "records");
    const advancesRef = collection(
      db,
      "companies",
      activeCompanyId,
      "advances",
    );

    const unsubscribeWorkers = onSnapshot(workersRef, (snapshot) => {
      const workersData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Worker,
      );
      setWorkers(workersData);
      setLastSyncTime(new Date().toLocaleTimeString("ar-IQ"));
    });

    const unsubscribeRecords = onSnapshot(recordsRef, (snapshot) => {
      const recordsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as DailyRecord,
      );
      setRecords(recordsData);
      setLastSyncTime(new Date().toLocaleTimeString("ar-IQ"));
    });

    const unsubscribeAdvances = onSnapshot(advancesRef, (snapshot) => {
      const advancesData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Advance,
      );
      setAdvances(advancesData);
      setLastSyncTime(new Date().toLocaleTimeString("ar-IQ"));
    });

    return () => {
      unsubscribeWorkers();
      unsubscribeRecords();
      unsubscribeAdvances();
    };
  }, [activeCompanyId]);

  const switchCompany = (id: string) => {
    setActiveCompanyId(id);
    localStorage.setItem("activeCompanyId", id);
  };

  const addCompany = async (company: Omit<Company, "id" | "createdAt">) => {
    const id = crypto.randomUUID();
    const newCompany: Company = { ...company, id, createdAt: Date.now() };
    await setDoc(doc(db, "companies", id), newCompany);
    switchCompany(id);
  };

  const updateCompany = async (id: string, updated: Partial<Company>) => {
    await updateDoc(doc(db, "companies", id), updated);
  };

  const deleteCompany = async (id: string) => {
    await deleteDoc(doc(db, "companies", id));
    if (activeCompanyId === id) {
      const newActive = companies.find((c) => c.id !== id)?.id || null;
      if (newActive) {
        switchCompany(newActive);
      } else {
        setActiveCompanyId(null);
        localStorage.removeItem("activeCompanyId");
      }
    }
  };

  const addWorker = async (worker: Omit<Worker, "id">) => {
    if (!activeCompanyId) return;
    const id = crypto.randomUUID();
    const newWorker = { ...worker, id };
    await setDoc(
      doc(db, "companies", activeCompanyId, "workers", id),
      newWorker,
    );
  };

  const updateWorker = async (id: string, updated: Partial<Worker>) => {
    if (!activeCompanyId) return;
    try {
      await updateDoc(
        doc(db, "companies", activeCompanyId, "workers", id),
        updated,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const deleteWorker = async (id: string) => {
    if (!activeCompanyId) return;
    await deleteDoc(doc(db, "companies", activeCompanyId, "workers", id));
  };

  const addRecord = async (record: Omit<DailyRecord, "id">) => {
    if (!activeCompanyId) return;
    const existing = records.find(
      (r) => r.workerId === record.workerId && r.date === record.date,
    );
    if (existing) {
      await updateRecord(existing.id, record);
      return;
    }
    const id = crypto.randomUUID();
    const newRecord = { ...record, id };
    await setDoc(
      doc(db, "companies", activeCompanyId, "records", id),
      newRecord,
    );
  };

  const addBulkRecords = async (newRecords: Omit<DailyRecord, "id">[]) => {
    if (!activeCompanyId) return;
    const batch = writeBatch(db);
    for (const record of newRecords) {
      const existing = records.find(
        (r) => r.workerId === record.workerId && r.date === record.date,
      );
      if (!existing) {
        const id = crypto.randomUUID();
        const newRecord = { ...record, id };
        const ref = doc(db, "companies", activeCompanyId, "records", id);
        batch.set(ref, newRecord);
      }
    }
    await batch.commit();
  };

  const deleteRecord = async (id: string) => {
    if (!activeCompanyId) return;
    await deleteDoc(doc(db, "companies", activeCompanyId, "records", id));
  };

  const updateRecord = async (id: string, updated: Partial<DailyRecord>) => {
    if (!activeCompanyId) return;
    try {
      await updateDoc(
        doc(db, "companies", activeCompanyId, "records", id),
        updated,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const addAdvance = async (advance: Omit<Advance, "id">) => {
    if (!activeCompanyId) return;
    try {
      await setDoc(
        doc(collection(db, "companies", activeCompanyId, "advances")),
        advance,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const updateAdvance = async (id: string, updated: Partial<Advance>) => {
    if (!activeCompanyId) return;
    try {
      await updateDoc(
        doc(db, "companies", activeCompanyId, "advances", id),
        updated,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const deleteAdvance = async (id: string) => {
    if (!activeCompanyId) return;
    try {
      await deleteDoc(doc(db, "companies", activeCompanyId, "advances", id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        companies,
        activeCompanyId,
        activeCompany,
        addCompany,
        updateCompany,
        switchCompany,
        deleteCompany,
        workers,
        records,
        advances,
        addWorker,
        updateWorker,
        deleteWorker,
        addRecord,
        addBulkRecords,
        deleteRecord,
        updateRecord,
        addAdvance,
        updateAdvance,
        deleteAdvance,
        isSyncing,
        lastSyncTime,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
