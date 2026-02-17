# Phase 4 — Ecosystem & Integrations: Completion Report

> **Started:** 2026-02-17
> **Status:** In Progress

---

## Table of Contents

1. [P4-00 — Foundation: Models, Migrations, Feature Flags](#p4-00-foundation--models-migrations-feature-flags)
2. [P4-01 — REST API Layer & API Key Authentication](#p4-01-rest-api-layer--api-key-authentication)
3. [P4-02 — Webhook System](#p4-02-webhook-system)

---

## P4-00: Foundation — Models, Migrations, Feature Flags

**Status**: Completed
**Date**: 2026-02-17

### Summary

Created the data foundation for all Phase 4 features: 16 new enums, 23 new Prisma models, reverse relations on 4 existing models, 7 feature flags, and 10 new permissions.

### Files Modified

1. **`prisma/schema.prisma`**
   - Added `JOIN` to existing `StepType` enum
   - Added 16 new enums: `ApiKeyStatus`, `RateLimitTier`, `WebhookStatus`, `DeliveryStatus`, `ScanType`, `ScanResult`, `BulkOperationType`, `BulkOperationStatus`, `DuplicateStatus`, `WaitlistStatus`, `WaitlistPriority`, `MessageChannel`, `MessageStatus`, `BroadcastStatus`, `CloneStatus`, `QueueStatus`
   - Added 23 new models across 8 domains:
     - **API & Webhooks**: `ApiKey`, `WebhookSubscription`, `WebhookDelivery`
     - **Check-in & Access**: `Checkpoint`, `AccessLog`, `VenueOccupancy`
     - **Kiosk**: `KioskDevice`, `KioskSession`, `QueueTicket`
     - **Bulk Operations**: `BulkOperation`, `BulkOperationItem`
     - **Duplicate Detection**: `DuplicateCandidate`, `MergeHistory`, `Blacklist`
     - **Waitlist**: `WaitlistEntry`, `WaitlistPromotion`
     - **Communication Hub**: `MessageTemplate`, `BroadcastMessage`, `MessageDelivery`
     - **Event Cloning**: `EventSeries`, `EventEdition`, `CloneOperation`
     - **Parallel Workflows**: `ParallelBranch`
   - Added reverse relations to `Tenant`, `Event`, `Participant`, `Step`

2. **`app/lib/feature-flags.server.ts`**
   - Added 7 new keys to `FEATURE_FLAG_KEYS`: `REST_API`, `WEBHOOKS`, `BULK_OPERATIONS`, `EVENT_CLONE`, `WAITLIST`, `COMMUNICATION_HUB`, `KIOSK_MODE`

3. **`prisma/seed.ts`**
   - Added 10 new permissions: `api-keys:manage`, `webhooks:manage`, `check-in:scan`, `kiosk:manage`, `bulk-operations:execute`, `duplicates:review`, `blacklist:manage`, `waitlist:manage`, `communication:broadcast`, `event-clone:execute`
   - Added 7 new feature flags: `FF_REST_API`, `FF_WEBHOOKS`, `FF_BULK_OPERATIONS`, `FF_EVENT_CLONE`, `FF_WAITLIST`, `FF_COMMUNICATION_HUB`, `FF_KIOSK_MODE`

### Migration

- Migration `20260217160946_phase4_foundation` created and applied successfully

### Verification Results

| Check                | Result                                  |
| -------------------- | --------------------------------------- |
| `prisma validate`    | Schema valid                            |
| `prisma migrate dev` | Migration applied successfully          |
| `prisma generate`    | Client generated (160ms)                |
| `npm run typecheck`  | No type errors                          |
| `npm run test`       | 49 test files, 635 tests passed         |
| `prisma db seed`     | 43 permissions, 22 feature flags seeded |

### Notable Decisions

- Added `@unique` to `WaitlistEntry.participantId` to satisfy Prisma's one-to-one relation requirement (since `Participant` already scopes to a single event, one waitlist entry per participant is correct)
- All new permissions are automatically included in the ADMIN role via the existing `permissionDefs.map()` pattern in seed.ts

---

## P4-01: REST API Layer & API Key Authentication

**Status**: Completed
**Date**: 2026-02-17

### Summary

Built a versioned REST API (`/api/v1/`) authenticated via API keys with tier-based rate limiting, permission checking, and a management UI. External systems can now programmatically access events, participants, and workflows.

### Files Created

1. **`app/services/api-keys.server.ts`** — API key service with create, list, get, update, revoke, rotate, and validate functions. Keys use `ak_<slug>_<hex>` format, stored as bcrypt hashes with prefix-based lookup for validation. Includes fire-and-forget usage tracking.

2. **`app/services/api-permission.server.ts`** — Permission checking for API keys. Supports exact match (`events:read`), wildcard (`events:*`), and full wildcard (`*`). Includes HTTP method-to-action mapping.

3. **`server/api-auth.ts`** — Express middleware for X-API-Key authentication. Checks FF_REST_API flag, validates key, checks IP allowlist, sets `res.locals.apiContext`, and tracks usage.

4. **`server/api-rate-limit.ts`** — Tier-based rate limiting middleware using in-memory sliding window. STANDARD=100/min, ELEVATED=500/min, PREMIUM=2000/min, CUSTOM=from DB. Sets standard rate limit headers.

5. **`server/api-router.ts`** — Express router mounted at `/api/v1` with endpoints for events (CRUD), participants (CRUD), and workflows (read). Supports pagination, field selection, sorting, relation expansion, optimistic locking (If-Match/ETag), and soft-delete.

6. **`app/routes/admin/settings/api-keys.tsx`** — API key management UI with loader/action pattern. Features: create dialog with permissions/tier/expiry/IP config, raw key one-time display alert, revoke/rotate confirmation dialogs, status badges, usage stats.

7. **`app/services/__tests__/api-keys.server.test.ts`** — 18 test cases covering key format, bcrypt hashing, validation (valid/invalid/expired/rotated/grace period), revocation, pagination, permission checking (exact/wildcard/full wildcard), and HTTP method mapping.

### Files Modified

1. **`server/app.ts`** — Mounted API router at `/api/v1` with `express.json()`, `apiKeyAuth`, `apiRateLimit`, and `apiRouter` middleware, before the general rate limiter.

2. **`app/config/navigation.ts`** — Added "API Keys" child to Settings nav group.

3. **`app/utils/api-error.server.ts`** — Added `ApiKeyError` import and handling (returns `API_KEY_ERROR` with status code).

4. **`app/utils/__tests__/api-error.server.test.ts`** — Added `env.server` mock to prevent env validation failure from new ApiKeyError import chain.

### API Endpoints

| Method | Path                                   | Permission            | Description                         |
| ------ | -------------------------------------- | --------------------- | ----------------------------------- |
| GET    | `/api/v1/events`                       | `events:read`         | List events (paginated, filterable) |
| GET    | `/api/v1/events/:id`                   | `events:read`         | Get event (expandable)              |
| POST   | `/api/v1/events`                       | `events:create`       | Create event                        |
| PUT    | `/api/v1/events/:id`                   | `events:update`       | Update event (If-Match)             |
| DELETE | `/api/v1/events/:id`                   | `events:delete`       | Soft-delete event                   |
| GET    | `/api/v1/events/:id/participants`      | `participants:read`   | List participants                   |
| GET    | `/api/v1/events/:id/participants/:pid` | `participants:read`   | Get participant                     |
| POST   | `/api/v1/events/:id/participants`      | `participants:create` | Register participant                |
| PUT    | `/api/v1/events/:id/participants/:pid` | `participants:update` | Update participant                  |
| GET    | `/api/v1/events/:id/workflows`         | `workflows:read`      | List workflows                      |
| GET    | `/api/v1/events/:id/workflows/:wid`    | `workflows:read`      | Get workflow with steps             |

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 50 test files, 653 tests passed (18 new) |

### Notable Decisions

- API key format uses first 4 chars of tenantId (not a slug field, which doesn't exist on Tenant) for the prefix: `ak_tena_<64-hex-chars>`
- Rate limiting uses in-memory sliding window (suitable for single-instance; document Redis upgrade path for multi-instance)
- Used Dialog component for confirmations since AlertDialog is not in the project's UI component library
- Router uses `as any` casts for Prisma calls that need `includeDeleted` (custom soft-delete extension property)
- Response envelope follows `{ data, meta? }` for success, `{ error: { code, message } }` for errors

---

## P4-02: Webhook System

**Status**: Completed
**Date**: 2026-02-17

### Summary

Built a webhook delivery system with HMAC-SHA256 signing, exponential backoff retry, circuit breaker protection, and a management UI. External systems receive real-time HTTP POST notifications when platform events occur (participant approved, SLA breached, etc.).

### Files Created

1. **`app/lib/webhook-events.ts`** — Event type catalog with 10 event types across 5 domains (participant, sla, workflow, scan, bulk_operation). Includes `validateEventTypes()` helper (supports `"*"` wildcard) and `getEventsByDomain()` for UI grouping.

2. **`app/services/webhooks.server.ts`** — Subscription CRUD service following `api-keys.server.ts` pattern. Functions: `createWebhookSubscription` (generates 64-char hex secret), `listWebhookSubscriptions` (paginated), `getWebhookSubscription`, `updateWebhookSubscription`, `deleteWebhookSubscription` (hard delete with cascade), `pauseWebhookSubscription`, `resumeWebhookSubscription` (resets circuit breaker), `testWebhookEndpoint` (synchronous test.ping delivery), `getDeliveryLog` (paginated history). All mutations create audit log entries.

3. **`app/services/webhook-delivery.server.ts`** — Core delivery engine with `signPayload()` (HMAC-SHA256), `deliverWebhook()` (fetch with timeout, circuit breaker, retry scheduling), and `retryFailedDeliveries()` (processes up to 50 RETRYING deliveries). Circuit breaker opens after 10 consecutive failures (1hr reset), suspends subscription after 3 breaker trips.

4. **`app/services/webhook-dispatcher.server.ts`** — Routes events to matching ACTIVE subscriptions (exact event type or `"*"` wildcard). Skips subscriptions with open circuit breaker. Creates delivery records and fires deliveries asynchronously.

5. **`app/lib/webhook-emitter.server.ts`** — Feature-flag-gated entry point. Checks `FF_WEBHOOKS` flag, generates UUID event ID, calls dispatcher. All errors are caught and logged — webhook failures never propagate to callers.

6. **`server/webhook-retry-job.js`** — Background retry job following `sla-job.js` pattern. Runs every 60 seconds (configurable via `WEBHOOK_RETRY_INTERVAL_MS`), calls `retryFailedDeliveries()`. Skips in test environment.

7. **`app/routes/admin/settings/webhooks.tsx`** — Management UI following `api-keys.tsx` pattern. Loader checks `FF_WEBHOOKS` + `webhooks:manage` permission. Action handles create/pause/resume/delete/test. UI includes: subscription list with URL, event count badge, status badge, circuit breaker indicator; CreateWebhookDialog with URL input and event checkboxes grouped by domain; SecretAlert for one-time HMAC secret display; DeliveryLogPanel with paginated table; Test/Pause/Resume/Delete buttons.

8. **`app/services/__tests__/webhooks.server.test.ts`** — 14 test cases covering: secret generation (64-char hex), event type validation (valid/invalid/wildcard), audit log creation, paginated listing, pause/resume with circuit breaker reset, HMAC-SHA256 signing, delivery success (DELIVERED on 2xx), retry scheduling with backoff, dead letter after max attempts, circuit breaker opening after 10 failures, and dispatcher skipping open circuit breaker subscriptions.

### Files Modified

1. **`app/services/workflow-engine/navigation.server.ts`** — Added fire-and-forget webhook emission after SSE block. Emits `participant.approved`/`participant.bypassed`/`participant.rejected` based on action, plus `participant.status_changed` for all actions. Uses dynamic import to avoid circular dependencies.

2. **`app/services/workflow-engine/sla-notifications.server.ts`** — Added fire-and-forget webhook emission after each SSE block: `sla.warning` in `sendSLAWarningNotification()` and `sla.breached` in `sendSLABreachNotification()`.

3. **`server.js`** — Imported and started `webhookRetryJob` alongside SLA job. Added `WEBHOOK_DELIVERY_DEV`/`WEBHOOK_DELIVERY_PROD` path constants, `webhookLoader` for both dev (Vite ssrLoadModule) and prod (dynamic import), and cleanup in shutdown handler.

4. **`app/config/navigation.ts`** — Added "Webhooks" child to Settings nav group after "API Keys".

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 51 test files, 667 tests passed (14 new) |

### Notable Decisions

- Used dynamic `import()` for webhook emitter in workflow/SLA files to avoid circular dependency issues and keep the emitter lazily loaded
- Circuit breaker uses 3-trip suspension: after 10 consecutive failures the breaker opens (1hr reset), and after 3 total trips the subscription is permanently SUSPENDED
- Test webhook endpoint uses `test.ping` event type (not in the catalog) to distinguish test deliveries from real events
- Webhook secret is shown once on creation (like API keys) — not retrievable afterward
- Delivery response body is truncated to 1KB to prevent storage issues
