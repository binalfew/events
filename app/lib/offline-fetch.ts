/**
 * Offline-aware fetch wrapper.
 *
 * When online: makes a normal fetch and returns the response.
 * When offline: enqueues the mutation in IndexedDB and returns a synthetic 202 response.
 */

import { enqueue } from "~/lib/offline-store";

// ─── Types ────────────────────────────────────────────────

export interface OfflineConfig {
  /** Mutation type: "approve" | "reject" | "bypass" | "print" | "collect" | "scan" */
  type: string;
  /** Entity type being mutated, e.g. "participant" */
  entityType: string;
  /** ID of the entity being mutated */
  entityId: string;
  /** Optional optimistic update callback invoked immediately when offline */
  optimisticUpdate?: (data: Record<string, unknown>) => void;
}

export interface OfflineFetchOptions extends RequestInit {
  offlineConfig?: OfflineConfig;
}

// ─── Main Function ────────────────────────────────────────

/**
 * Fetch wrapper that queues mutations when the browser is offline.
 *
 * - GET requests are never queued (they rely on SW cache strategies).
 * - Mutating requests (POST, PUT, PATCH, DELETE) are queued if offline
 *   and an `offlineConfig` is provided.
 */
export async function offlineFetch(
  url: string,
  options: OfflineFetchOptions = {},
): Promise<Response> {
  const { offlineConfig, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();

  // Always try online first for GET, or if no offline config
  if (method === "GET" || !offlineConfig) {
    return fetch(url, fetchOptions);
  }

  // For mutations: try online, fall back to queue
  if (navigator.onLine) {
    return fetch(url, fetchOptions);
  }

  // ─── Offline path ─────────────────────────────────────
  const payload = await extractPayload(fetchOptions);

  const mutationId = await enqueue({
    type: offlineConfig.type,
    entityType: offlineConfig.entityType,
    entityId: offlineConfig.entityId,
    payload: { url, method, ...payload },
    timestamp: Date.now(),
  });

  // Fire optimistic update if provided
  if (offlineConfig.optimisticUpdate) {
    offlineConfig.optimisticUpdate(payload);
  }

  // Return a synthetic 202 Accepted response
  return new Response(
    JSON.stringify({
      queued: true,
      mutationId,
      message: "Action queued for sync when online",
    }),
    {
      status: 202,
      statusText: "Accepted",
      headers: { "Content-Type": "application/json" },
    },
  );
}

// ─── Helpers ──────────────────────────────────────────────

async function extractPayload(options: RequestInit): Promise<Record<string, unknown>> {
  if (!options.body) return {};

  if (typeof options.body === "string") {
    try {
      return JSON.parse(options.body);
    } catch {
      return { body: options.body };
    }
  }

  if (options.body instanceof FormData) {
    const obj: Record<string, unknown> = {};
    (options.body as FormData).forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  return {};
}
