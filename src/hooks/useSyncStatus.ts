import { useState, useEffect } from 'react';
import { getSyncQueue, triggerSync } from '@/services/offline';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    const handleQueueUpdate = () => {
      setPendingChanges(getSyncQueue().length);
    };

    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncComplete = () => {
      setIsSyncing(false);
      setPendingChanges(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync_queue_updated', handleQueueUpdate);
    window.addEventListener('sync_started', handleSyncStart);
    window.addEventListener('sync_completed', handleSyncComplete);

    // Initial check
    handleQueueUpdate();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync_queue_updated', handleQueueUpdate);
      window.removeEventListener('sync_started', handleSyncStart);
      window.removeEventListener('sync_completed', handleSyncComplete);
    };
  }, []);

  return { isOnline, pendingChanges, isSyncing };
}
