import type { SelectedMenuItem, TelemetryEventPayload } from '@/types/database';
import { generateUUID } from '@/lib/utils';

const SESSION_ID_KEY = 'xplore_anon_session_id_v1';
const TELEMETRY_QUEUE_KEY = 'xplore_telemetry_pending_queue_v1';
const TELEMETRY_HISTORY_KEY = 'xplore_telemetry_local_history_v1';
const IDB_NAME = 'XploreMenuOfflineDB';
const IDB_STORE = 'kv_store';

/**
 * Low-level IndexedDB fallback for environments where LocalStorage is full or restricted
 */
function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Retrieves or creates an anonymous persistent session ID
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr-session-placeholder';
  try {
    const existing = window.localStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.length >= 8) {
      return existing;
    }
    const created = `sess_${generateUUID()}`;
    window.localStorage.setItem(SESSION_ID_KEY, created);
    void idbSet(SESSION_ID_KEY, created);
    return created;
  } catch {
    return `sess_${generateUUID()}`;
  }
}

/**
 * Persists the customer's "Favoritos / Pedido Rápido" selection per restaurant slug
 */
export function saveTenantSelection(
  tenantSlug: string,
  selection: SelectedMenuItem[],
  likedIds: string[]
): void {
  if (typeof window === 'undefined') return;
  const key = `xplore_bag_${tenantSlug}_v1`;
  const payload = { selection, likedIds, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Fallback to IndexedDB when quota is exceeded
  }
  void idbSet(key, payload);
}

/**
 * Loads the customer's saved selection & liked items from LocalStorage or IndexedDB
 */
export async function loadTenantSelection(tenantSlug: string): Promise<{
  selection: SelectedMenuItem[];
  likedIds: string[];
}> {
  if (typeof window === 'undefined') {
    return { selection: [], likedIds: [] };
  }
  const key = `xplore_bag_${tenantSlug}_v1`;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        selection?: SelectedMenuItem[];
        likedIds?: string[];
      };
      return {
        selection: Array.isArray(parsed.selection) ? parsed.selection : [],
        likedIds: Array.isArray(parsed.likedIds) ? parsed.likedIds : [],
      };
    }
  } catch {
    // Ignore JSON/SecurityError and try IndexedDB
  }

  const fallback = await idbGet<{
    selection?: SelectedMenuItem[];
    likedIds?: string[];
  }>(key);

  return {
    selection: Array.isArray(fallback?.selection) ? fallback.selection : [],
    likedIds: Array.isArray(fallback?.likedIds) ? fallback.likedIds : [],
  };
}

/**
 * Reads pending unsent telemetry events from LocalStorage
 */
export function getPendingTelemetryQueue(): TelemetryEventPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TELEMETRY_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TelemetryEventPayload[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves pending telemetry queue to LocalStorage + IndexedDB for 4G drop resilience
 */
export function setPendingTelemetryQueue(events: TelemetryEventPayload[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = events.slice(-250); // Cap queue to prevent overflow
  try {
    window.localStorage.setItem(TELEMETRY_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore quota errors
  }
  void idbSet(TELEMETRY_QUEUE_KEY, trimmed);
}

/**
 * Appends telemetry events to local analytical history (for real-time HUD & Dashboard inspection)
 */
export function appendToLocalTelemetryHistory(newEvents: TelemetryEventPayload[]): void {
  if (typeof window === 'undefined' || newEvents.length === 0) return;
  try {
    const raw = window.localStorage.getItem(TELEMETRY_HISTORY_KEY);
    const existing: TelemetryEventPayload[] = raw ? JSON.parse(raw) : [];
    const merged = [...existing, ...newEvents].slice(-400);
    window.localStorage.setItem(TELEMETRY_HISTORY_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalTelemetryHistory(): TelemetryEventPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TELEMETRY_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as TelemetryEventPayload[]) : [];
  } catch {
    return [];
  }
}
