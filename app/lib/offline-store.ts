/**
 * Offline mutation queue backed by IndexedDB via idb-keyval.
 *
 * Stores queued mutations when the user is offline.
 * The SyncManager replays them when connectivity returns.
 */

import { get, set, del, keys, createStore } from "idb-keyval";

// ─── Types ────────────────────────────────────────────────

export interface QueuedMutation {
  id: string;
  type: string; // "approve" | "reject" | "bypass" | "print" | "collect" | "scan"
  entityType: string; // "participant"
  entityId: string;
  payload: Record<string, unknown>;
  timestamp: number; // Date.now()
  retryCount: number;
  status: "pending" | "syncing" | "synced" | "failed";
  error?: string;
}

export interface QueueStats {
  pending: number;
  syncing: number;
  failed: number;
}

// ─── Store ────────────────────────────────────────────────

const STORE_NAME = "offline-mutations";
const DB_NAME = "accredit-offline";

let store: ReturnType<typeof createStore> | undefined;

function getStore() {
  if (!store) {
    store = createStore(DB_NAME, STORE_NAME);
  }
  return store;
}

// ─── Helpers ──────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

// ─── Public API ───────────────────────────────────────────

/**
 * Add a mutation to the offline queue.
 * Returns the generated mutation ID.
 */
export async function enqueue(
  mutation: Omit<QueuedMutation, "id" | "retryCount" | "status">,
): Promise<string> {
  const id = generateId();
  const queued: QueuedMutation = {
    ...mutation,
    id,
    retryCount: 0,
    status: "pending",
  };
  await set(id, queued, getStore());
  return id;
}

/**
 * Get all mutations with a given status (default: "pending").
 * Results are ordered by timestamp ascending.
 */
export async function getByStatus(
  status: QueuedMutation["status"] = "pending",
): Promise<QueuedMutation[]> {
  const allKeys = await keys<string>(getStore());
  const mutations: QueuedMutation[] = [];

  for (const key of allKeys) {
    const m = await get<QueuedMutation>(key, getStore());
    if (m && m.status === status) {
      mutations.push(m);
    }
  }

  return mutations.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get all pending mutations ordered by timestamp.
 */
export async function getPending(): Promise<QueuedMutation[]> {
  return getByStatus("pending");
}

/**
 * Get a single mutation by ID.
 */
export async function getMutation(id: string): Promise<QueuedMutation | undefined> {
  return get<QueuedMutation>(id, getStore());
}

/**
 * Update a mutation's status to "syncing".
 */
export async function markSyncing(id: string): Promise<void> {
  const m = await get<QueuedMutation>(id, getStore());
  if (!m) return;
  m.status = "syncing";
  await set(id, m, getStore());
}

/**
 * Mark a mutation as successfully synced.
 */
export async function markSynced(id: string): Promise<void> {
  const m = await get<QueuedMutation>(id, getStore());
  if (!m) return;
  m.status = "synced";
  m.error = undefined;
  await set(id, m, getStore());
}

/**
 * Mark a mutation as failed, incrementing the retry count.
 */
export async function markFailed(id: string, error: string): Promise<void> {
  const m = await get<QueuedMutation>(id, getStore());
  if (!m) return;
  m.status = "failed";
  m.retryCount += 1;
  m.error = error;
  await set(id, m, getStore());
}

/**
 * Reset a failed mutation back to pending for retry.
 */
export async function resetToPending(id: string): Promise<void> {
  const m = await get<QueuedMutation>(id, getStore());
  if (!m) return;
  m.status = "pending";
  m.error = undefined;
  await set(id, m, getStore());
}

/**
 * Delete a mutation from the queue.
 */
export async function remove(id: string): Promise<void> {
  await del(id, getStore());
}

/**
 * Get queue statistics.
 */
export async function getStats(): Promise<QueueStats> {
  const allKeys = await keys<string>(getStore());
  const stats: QueueStats = { pending: 0, syncing: 0, failed: 0 };

  for (const key of allKeys) {
    const m = await get<QueuedMutation>(key, getStore());
    if (!m) continue;
    if (m.status === "pending") stats.pending++;
    else if (m.status === "syncing") stats.syncing++;
    else if (m.status === "failed") stats.failed++;
  }

  return stats;
}

/**
 * Remove synced mutations older than the given duration (ms).
 * Returns the number of cleaned-up entries.
 */
export async function cleanup(olderThanMs: number): Promise<number> {
  const allKeys = await keys<string>(getStore());
  const cutoff = Date.now() - olderThanMs;
  let cleaned = 0;

  for (const key of allKeys) {
    const m = await get<QueuedMutation>(key, getStore());
    if (m && m.status === "synced" && m.timestamp < cutoff) {
      await del(key, getStore());
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Clear all mutations from the store.
 */
export async function clearAll(): Promise<void> {
  const allKeys = await keys<string>(getStore());
  for (const key of allKeys) {
    await del(key, getStore());
  }
}
