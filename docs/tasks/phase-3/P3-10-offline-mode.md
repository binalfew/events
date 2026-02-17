# P3-10: Offline Mode & Sync

| Field                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **Task ID**            | P3-10                                                      |
| **Phase**              | 3 — Advanced Features                                      |
| **Category**           | Infrastructure                                             |
| **Suggested Assignee** | Senior Frontend Engineer                                   |
| **Depends On**         | P3-09 (PWA Shell)                                          |
| **Blocks**             | None                                                       |
| **Estimated Effort**   | 5 days                                                     |
| **Module References**  | [Module 06](../../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

Badge printing, collection, and scanning happen at venue entry points where network connectivity may drop. Staff must be able to approve, reject, and scan badges while offline. Mutations queue locally and sync when connectivity returns. The PWA shell (P3-09) provides the service worker infrastructure; this task adds the IndexedDB queue, sync logic, and conflict resolution.

---

## Deliverables

### 1. Offline Store

Create `app/lib/offline-store.ts`:

Using `idb-keyval` or Dexie for IndexedDB:

```typescript
interface QueuedMutation {
  id: string;           // UUID
  type: string;         // "approve" | "reject" | "bypass" | "print" | "collect" | "scan"
  entityType: string;   // "participant"
  entityId: string;     // participantId
  payload: Record<string, unknown>;
  timestamp: number;    // Date.now()
  retryCount: number;
  status: "pending" | "syncing" | "synced" | "failed";
  error?: string;
}

// Add mutation to queue
enqueue(mutation: Omit<QueuedMutation, "id" | "retryCount" | "status">): Promise<string>

// Get all pending mutations
getPending(): Promise<QueuedMutation[]>

// Mark mutation as synced
markSynced(id: string): Promise<void>

// Mark mutation as failed
markFailed(id: string, error: string): Promise<void>

// Get queue stats
getStats(): Promise<{ pending: number; syncing: number; failed: number }>

// Clear synced mutations older than N hours
cleanup(olderThanMs: number): Promise<number>
```

### 2. Sync Manager

Create `app/lib/sync-manager.ts`:

```typescript
class SyncManager {
  // Start watching for online/offline events
  start(): void;

  // Stop watching
  stop(): void;

  // Manually trigger sync
  sync(): Promise<SyncResult>;

  // Subscribe to sync events
  onStatusChange(callback: (status: SyncStatus) => void): () => void;
}

interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

type SyncStatus = "idle" | "syncing" | "online" | "offline" | "error";
```

**Sync logic:**

1. Listen for `online` event on `window`
2. When online, get all pending mutations ordered by timestamp
3. For each mutation:
   - Set status to "syncing"
   - Send to server API
   - If success: mark as "synced"
   - If conflict (409): apply conflict resolution, retry
   - If error: increment retryCount, mark as "failed" if retryCount > 3
4. After sync, publish result via callback

### 3. Conflict Resolution

**Strategy: Last-write-wins with server timestamps.**

- Each mutation carries a `timestamp` (client-side)
- Server compares with `participant.updatedAt`
- If server version is newer: server wins (discard mutation, notify user)
- If client version is newer: client wins (apply mutation)
- In case of tie: server wins (safer default)

**Conflict notification:**

- Show toast: "Your offline action on {participant} was superseded by a more recent update"
- Failed mutations visible in a "Sync Issues" panel

### 4. Offline-Aware API Calls

Create `app/lib/offline-fetch.ts`:

```typescript
// Wrapper around fetch that queues mutations when offline
async function offlineFetch(
  url: string,
  options: RequestInit & { offlineConfig?: OfflineConfig },
): Promise<Response>;

interface OfflineConfig {
  type: string; // mutation type
  entityType: string;
  entityId: string;
  optimisticUpdate?: (data: Record<string, unknown>) => void;
}
```

- If online: make normal fetch, return response
- If offline: enqueue mutation, return synthetic 202 response
- Optionally apply optimistic update to local state

### 5. Offline Indicator Component

Create `app/components/offline-indicator.tsx`:

- Appears in top navbar when offline
- Shows connection status: Online (green), Offline (red), Syncing (yellow)
- Click to expand: show queued mutation count, sync button, last sync time
- Badge on indicator showing pending count

### 6. Integration with Existing Actions

Wrap existing workflow actions (approve, reject, bypass, print, collect) with offline support:

- In route actions: check navigator.onLine before fetch
- If offline: use `offlineFetch` to queue
- Show optimistic UI update (status badge changes immediately)
- When sync completes, reconcile with server state

### 7. Feature Flag Gate

All offline features gated behind `FF_OFFLINE_MODE`:

- Offline store not initialized when disabled
- Sync manager not started
- Offline indicator hidden
- All mutations require online connection (current behavior)

---

## Acceptance Criteria

- [ ] Mutations queued in IndexedDB when offline
- [ ] Sync replays queued mutations when connectivity returns
- [ ] Conflict resolution handles server-wins and client-wins scenarios
- [ ] Max 3 retries per mutation before marking as failed
- [ ] Offline indicator shows connection status in navbar
- [ ] Pending mutation count displayed on indicator
- [ ] Synced mutations cleaned up after 24 hours
- [ ] Optimistic UI updates shown immediately when offline
- [ ] Toast notifications for sync conflicts
- [ ] Feature flag `FF_OFFLINE_MODE` gates the feature
- [ ] Unit tests for enqueue, sync, and conflict resolution (≥8 test cases)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
