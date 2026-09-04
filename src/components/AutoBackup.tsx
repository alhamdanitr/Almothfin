import React, { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function AutoBackup() {
  const { companies, workers, records, advances } = useStore();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const checkAndBackup = () => {
      // Get current date string (e.g., '2023-10-25')
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastBackup = localStorage.getItem('lastBackupDate');

      // If we haven't backed up today yet
      if (lastBackup !== today) {
        // Prevent backing up if data hasn't loaded yet (safeguard)
        // If there's truly 0 data, it's safe to skip until they add something.
        if (companies.length === 0 && workers.length === 0 && records.length === 0) return;

        performBackup(today);
      }
    };

    const performBackup = (today: string) => {
      try {
        const backupData = {
          exportDate: new Date().toISOString(),
          version: '1.0',
          data: {
            companies,
            workers,
            records,
            advances
          }
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Almothfin_Backup_${today}.json`;
        document.body.appendChild(a);
        
        // Trigger download
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Mark as backed up for today
        localStorage.setItem('lastBackupDate', today);
        
        // Show success toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } catch (error) {
        console.error('Backup failed:', error);
      }
    };

    // Delay the first check slightly to ensure store is loaded from cache/network
    const initialCheck = setTimeout(checkAndBackup, 5000);

    // Then check every hour to see if we've crossed midnight while app is open
    const interval = setInterval(checkAndBackup, 60 * 60 * 1000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [companies, workers, records, advances]);

  if (!showToast) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 lg:left-6 lg:translate-x-0 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-surface border border-success/20 shadow-xl rounded-2xl p-4 flex items-center gap-3">
        <div className="bg-success/10 p-2 rounded-full text-success flex-shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-main">النسخ الاحتياطي التلقائي</h4>
          <p className="text-xs text-text-muted mt-0.5">تم حفظ نسخة احتياطية من بياناتك محلياً بنجاح.</p>
        </div>
      </div>
    </div>
  );
}
