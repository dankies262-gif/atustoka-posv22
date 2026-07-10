import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export interface SyncAction {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  matchField?: string;
  matchValue?: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'atustoka_sync_queue';
const CACHE_PREFIX = 'atustoka_cache_';

export function getSyncQueue(): SyncAction[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncAction[]) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event('sync_queue_updated'));
}

export function queueAction(action: Omit<SyncAction, 'id' | 'timestamp'>) {
  const queue = getSyncQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  saveSyncQueue(queue);
  triggerSync();
}

export function getLocalCache<T>(table: string, storeId?: string): T[] {
  try {
    const key = `${CACHE_PREFIX}${table}${storeId ? '_' + storeId : ''}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalCache<T>(table: string, data: T[], storeId?: string) {
  const key = `${CACHE_PREFIX}${table}${storeId ? '_' + storeId : ''}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function updateLocalCacheItem(table: string, id: string, item: any, storeId?: string) {
  const cache = getLocalCache<any>(table, storeId);
  const index = cache.findIndex(i => i.id === id);
  if (index >= 0) {
    cache[index] = { ...cache[index], ...item };
  } else {
    cache.push(item);
  }
  setLocalCache(table, cache, storeId);
}

let isSyncing = false;

export async function triggerSync() {
  if (!navigator.onLine || isSyncing) return;
  
  const queue = getSyncQueue();
  if (queue.length === 0) {
    window.dispatchEvent(new Event('sync_completed'));
    return;
  }

  isSyncing = true;
  window.dispatchEvent(new Event('sync_started'));

  try {
    const remainingQueue = [...queue];
    
    // Process sequentially to maintain order (e.g. sale then sale_items)
    for (const action of queue) {
      let success = false;
      
      try {
        if (action.operation === 'INSERT') {
          const { error } = await supabase.from(action.table).insert(action.payload);
          if (!error) success = true;
          else console.error('Sync INSERT error:', error);
        } else if (action.operation === 'UPDATE') {
          const { error } = await supabase
            .from(action.table)
            .update(action.payload)
            .eq(action.matchField || 'id', action.matchValue);
          if (!error) success = true;
          else console.error('Sync UPDATE error:', error);
        } else if (action.operation === 'DELETE') {
          const { error } = await supabase
            .from(action.table)
            .delete()
            .eq(action.matchField || 'id', action.matchValue);
          if (!error) success = true;
          else {
            console.error('Sync DELETE error:', error);
            // TODO: If there is a discrepancy, trigger email notification to owner
          }
        }
      } catch (err) {
        console.error('Sync execution error:', err);
      }
      
      if (success) {
        // Remove from queue
        const idx = remainingQueue.findIndex(a => a.id === action.id);
        if (idx >= 0) remainingQueue.splice(idx, 1);
        saveSyncQueue(remainingQueue);
      } else {
        // Stop processing on first error to preserve order
        // Log discrepancy to a notifications table or send email
        toast.error('Sync discrepancy detected! Sync paused.');
        break;
      }
    }
  } finally {
    isSyncing = false;
    if (getSyncQueue().length === 0) {
      window.dispatchEvent(new Event('sync_completed'));
    }
  }
}

// Setup listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', triggerSync);
  // Initial sync attempt
  setTimeout(triggerSync, 2000);
}
