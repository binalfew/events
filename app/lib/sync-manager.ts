/**
 * SyncManager — replays queued offline mutations when connectivity returns.
 *
 * Listens for online/offline events, processes the IndexedDB queue,
 * and notifies subscribers of status changes.
 */

import {
  getPending,
  markSyncing,
  markSynced,
  markFailed,
  cleanup,
  type QueuedMutation,
} from "~/lib/offline-store";

// ─── Types ────────────────────────────────────────────────

export type SyncStatus = "idle" | "syncing" | "online" | "offline" | "error";

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  mutationId: string;
  entityType: string;
  entityId: string;
  message: string;
}

type StatusCallback = (status: SyncStatus) => void;
type SyncResultCallback = (result: SyncResult) => void;

// ─── Constants ────────────────────────────────────────────

const MAX_RETRIES = 3;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const SYNC_API_BASE = "/api/offline-sync";

// ─── Class ────────────────────────────────────────────────

export class SyncManager {
  private statusListeners = new Set<StatusCallback>();
  private resultListeners = new Set<SyncResultCallback>();
  private currentStatus: SyncStatus = "idle";
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;

  /**
   * Start watching for online/offline events and periodic cleanup.
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // Set initial status
    this.setStatus(navigator.onLine ? "online" : "offline");

    // Periodic cleanup of old synced mutations
    this.cleanupTimer = setInterval(() => {
      cleanup(CLEANUP_AGE_MS);
    }, CLEANUP_INTERVAL_MS);

    // If we're online at startup, try syncing any pending mutations
    if (navigator.onLine) {
      this.sync();
    }
  }

  /**
   * Stop watching events and cleanup.
   */
  stop(): void {
    if (!this.started) return;
    this.started = false;

    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get the current sync status.
   */
  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * Subscribe to status changes. Returns an unsubscribe function.
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Subscribe to sync results. Returns an unsubscribe function.
   */
  onSyncResult(callback: SyncResultCallback): () => void {
    this.resultListeners.add(callback);
    return () => this.resultListeners.delete(callback);
  }

  /**
   * Manually trigger a sync of all pending mutations.
   */
  async sync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return { synced: 0, failed: 0, remaining: 0, conflicts: [] };
    }

    this.setStatus("syncing");

    const pending = await getPending();
    let synced = 0;
    let failed = 0;
    const conflicts: ConflictInfo[] = [];

    for (const mutation of pending) {
      try {
        await markSyncing(mutation.id);
        await this.sendMutation(mutation);
        await markSynced(mutation.id);
        synced++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        if (this.isConflict(error)) {
          // Server wins — mark as synced (discard) but record conflict
          await markSynced(mutation.id);
          conflicts.push({
            mutationId: mutation.id,
            entityType: mutation.entityType,
            entityId: mutation.entityId,
            message,
          });
          synced++;
        } else if (mutation.retryCount + 1 >= MAX_RETRIES) {
          await markFailed(mutation.id, message);
          failed++;
        } else {
          await markFailed(mutation.id, message);
          failed++;
        }
      }
    }

    const remainingPending = await getPending();
    const result: SyncResult = {
      synced,
      failed,
      remaining: remainingPending.length,
      conflicts,
    };

    this.setStatus(navigator.onLine ? "online" : "offline");
    this.notifyResult(result);

    return result;
  }

  // ─── Private ──────────────────────────────────────────

  private handleOnline = (): void => {
    this.setStatus("online");
    this.sync();
  };

  private handleOffline = (): void => {
    this.setStatus("offline");
  };

  private setStatus(status: SyncStatus): void {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private notifyResult(result: SyncResult): void {
    for (const listener of this.resultListeners) {
      listener(result);
    }
  }

  private async sendMutation(mutation: QueuedMutation): Promise<void> {
    const response = await fetch(SYNC_API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: mutation.id,
        type: mutation.type,
        entityType: mutation.entityType,
        entityId: mutation.entityId,
        payload: mutation.payload,
        timestamp: mutation.timestamp,
      }),
    });

    if (response.status === 409) {
      const body = await response.json().catch(() => ({}));
      throw new ConflictError(body.message || "Conflict: server version is newer");
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Sync failed (${response.status}): ${body}`);
    }
  }

  private isConflict(error: unknown): boolean {
    return error instanceof ConflictError;
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

// ─── Singleton ────────────────────────────────────────────

let instance: SyncManager | null = null;

export function getSyncManager(): SyncManager {
  if (!instance) {
    instance = new SyncManager();
  }
  return instance;
}
