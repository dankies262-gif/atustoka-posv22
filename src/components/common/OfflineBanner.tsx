import { useEffect, useState } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import { getSyncQueue } from '@/services/offline';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingItems, setPendingItems] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    const checkQueue = () => setPendingItems(getSyncQueue().length);
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncComplete = () => {
      setIsSyncing(false);
      checkQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync_queue_updated', checkQueue);
    window.addEventListener('sync_started', handleSyncStart);
    window.addEventListener('sync_completed', handleSyncComplete);

    // Initial check
    checkQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync_queue_updated', checkQueue);
      window.removeEventListener('sync_started', handleSyncStart);
      window.removeEventListener('sync_completed', handleSyncComplete);
    };
  }, []);

  if (!isOffline && pendingItems === 0 && !isSyncing) return null;

  return (
    <div className={`w-full py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
      isOffline 
        ? 'bg-amber-500 text-amber-950' 
        : isSyncing 
          ? 'bg-blue-500 text-white' 
          : 'bg-green-500 text-white'
    }`}>
      {isOffline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          You are working offline. Data will sync when reconnected. ({pendingItems} pending)
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Syncing {pendingItems} offline changes to server...
        </>
      ) : pendingItems > 0 ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Preparing to sync {pendingItems} items...
        </>
      ) : null}
    </div>
  );
}
