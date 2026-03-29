import { useState, useEffect, useCallback } from 'react';

export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  body: unknown;
  timestamp: number;
  tag: string;
}

const QUEUE_KEY = 'offline-sync-queue';

function loadQueue(): OfflineQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: OfflineQueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

let replayInProgress = false;

export async function runReplay(): Promise<void> {
  if (replayInProgress) return;
  const queue = loadQueue();
  if (queue.length === 0) return;

  replayInProgress = true;
  try {
    const remaining: OfflineQueueItem[] = [];
    for (const item of queue) {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: item.body != null ? JSON.stringify(item.body) : undefined,
        });
        if (!res.ok) {
          console.warn(`[OfflineSync] Replay HTTP ${res.status} for ${item.url}`);
          remaining.push(item);
        }
      } catch (err) {
        console.warn(`[OfflineSync] Network error replaying ${item.url}:`, err);
        remaining.push(item);
      }
    }
    saveQueue(remaining);
  } finally {
    replayInProgress = false;
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(() => loadQueue().length);

  const replayQueue = useCallback(async () => {
    await runReplay();
    setQueueSize(loadQueue().length);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      replayQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [replayQueue]);

  const enqueue = useCallback((url: string, method: string, body: unknown, tag: string) => {
    const item: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method,
      body,
      timestamp: Date.now(),
      tag,
    };
    const queue = loadQueue();
    queue.push(item);
    saveQueue(queue);
    setQueueSize(queue.length);
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready
        .then(reg =>
          (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('api-sync-queue')
        )
        .catch(() => {});
    }
  }, []);

  const queueOrFetch = useCallback(
    async (url: string, method: string, body: unknown, tag: string): Promise<{ queued: boolean; data?: unknown }> => {
      if (!navigator.onLine) {
        enqueue(url, method, body, tag);
        return { queued: true };
      }
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: body != null ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { queued: false, data };
      } catch (err) {
        if (!navigator.onLine) {
          enqueue(url, method, body, tag);
          return { queued: true };
        }
        throw err;
      }
    },
    [enqueue],
  );

  return { isOnline, queueSize, queueOrFetch, replayQueue };
}
