# Phase 4 — Ecosystem & Integrations: Completion Report

> **Started:** 2026-02-17
> **Status:** In Progress

---

## Table of Contents

1. [P4-00 — Foundation: Models, Migrations, Feature Flags](#p4-00-foundation--models-migrations-feature-flags)
2. [P4-01 — REST API Layer & API Key Authentication](#p4-01-rest-api-layer--api-key-authentication)
3. [P4-02 — Webhook System](#p4-02-webhook-system)
4. [P4-03 — Check-in & QR Code System](#p4-03-check-in--qr-code-system)
5. [P4-04 — Communication Hub](#p4-04-communication-hub)
6. [P4-07 — Batch Workflow Actions](#p4-07-batch-workflow-actions)
7. [P4-08 — Parallel Workflow Paths](#p4-08-parallel-workflow-paths)
8. [P4-09 — Duplicate Detection & Merge](#p4-09-duplicate-detection--merge)

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

---

## P4-03: Check-in & QR Code System

**Status**: Completed
**Date**: 2026-02-17

### Summary

Built the on-site check-in system with AES-256-GCM encrypted QR codes, a camera-based scanning engine, checkpoint management, real-time venue occupancy tracking, and access log viewer with CSV export. The system supports both QR scanning and manual registration code entry, with audio feedback and a full scan pipeline that validates participant status, event dates, and duplicate scans.

### Files Created

1. **`app/services/qr-code.server.ts`** — QR code encryption service. `generateQRPayload()` creates compact JSON `{pid,tid,eid,iat,v:1}`, encrypts with AES-256-GCM (random 12-byte IV), prepends 4-byte CRC32, and Base64url-encodes. `decodeQRPayload()` reverses the process with CRC verification. `generateQRCodeDataURL()` produces PNG data URLs via the `qrcode` package.

2. **`app/services/checkpoints.server.ts`** — Checkpoint CRUD service with `CheckpointError` class, create/list/get/update/delete/toggle functions. All mutations create audit log entries. Tenant-scoped with composite unique constraint on `[tenantId, eventId, name]`.

3. **`app/services/venue-occupancy.server.ts`** — Venue occupancy service with `getEventOccupancy()` and `updateOccupancy()` (atomic increment/decrement). Uses `findFirst` for nullable `zoneId` compound lookups.

4. **`app/services/check-in.server.ts`** — Main check-in service. `processScan()` implements a 10-step pipeline: decode QR → verify tenant → lookup participant → check status (REVOKED for CANCELLED) → check event date (EXPIRED) → verify checkpoint active → duplicate check (ALREADY_SCANNED with override option) → create AccessLog → update occupancy → return ScanResponse. Also includes `processManualEntry()`, `getAccessLogs()` (paginated + filtered), and `exportAccessLogsCsv()`.

5. **`app/lib/schemas/checkpoint.ts`** — Zod validation schemas for checkpoint create/update. Defines checkpoint types (gate, meeting-room, vip-area, registration-desk) and directions (entry, exit, bidirectional).

6. **`app/hooks/use-scan-audio.ts`** — Web Audio API hook for success (rising A5→C#6), error (low square wave buzz), and warning (double beep) tones. No audio file bundling needed.

7. **`app/components/check-in/qr-scanner.tsx`** — Client-only camera QR reader using `html5-qrcode`. Loaded via `React.lazy()` to prevent SSR import crash. Includes 3-second debounce for same-code scans.

8. **`app/components/check-in/scan-result-display.tsx`** — Color-coded result panel (green for VALID, red for INVALID/REVOKED, yellow for EXPIRED/ALREADY_SCANNED) with participant name and registration code.

9. **`app/components/check-in/manual-entry.tsx`** — Registration code fallback input form.

10. **`app/components/check-in/checkpoint-selector.tsx`** — NativeSelect dropdown filtered to active checkpoints only.

11. **`app/components/check-in/scan-history.tsx`** — Recent scans list with result badges and timestamps. Keeps last 50 entries.

12. **`app/components/check-in/access-log-table.tsx`** — Filterable log table with participant name, checkpoint, scan type, result, and override reason columns.

13. **`app/components/occupancy/occupancy-panel.tsx`** — Real-time zone occupancy progress bars. Color-coded: green (<75%), yellow (75-90%), red (>90%).

14. **`app/routes/admin/events/$eventId/check-in.tsx`** — Scanner page with QR camera (client-only via React.lazy), checkpoint selector, manual entry fallback, scan result display with audio feedback, and recent scan history. All scans via `useFetcher` to keep camera running.

15. **`app/routes/admin/events/$eventId/settings/checkpoints.tsx`** — Checkpoint management page with create/edit dialogs, enable/disable toggle, and delete confirmation. Full CRUD via loader/action pattern.

16. **`app/routes/admin/events/$eventId/access-logs.tsx`** — Access log viewer with checkpoint and result filters, pagination, occupancy panel, and CSV export button.

17. **`app/services/__tests__/qr-code.server.test.ts`** — 6 test cases: round-trip encrypt/decrypt, Base64url format, unique payloads for same input (random IV), CRC tamper detection, garbage input handling, PNG data URL generation.

18. **`app/services/__tests__/check-in.server.test.ts`** — 9 test cases: VALID scan, INVALID garbled data, tenant mismatch, REVOKED cancelled participant, EXPIRED past event, ALREADY_SCANNED duplicate, MANUAL_OVERRIDE with reason, valid manual entry, unknown registration code.

19. **`app/services/__tests__/checkpoints.server.test.ts`** — 2 test cases: checkpoint creation with audit log, toggle active state with audit log.

### Files Modified

1. **`app/lib/env.server.ts`** — Added `QR_ENCRYPTION_KEY` env var (optional, defaults to empty string). Added derivation logic: when empty, derives from `SESSION_SECRET` via SHA-256 hash, so no extra configuration is needed.

2. **`app/types/sse-events.ts`** — Added `"occupancy"` to `SSE_CHANNELS`. Added `OccupancyUpdatedEvent` interface with eventId, zoneId, currentCount, maxCapacity fields. Extended `SSEEvent` union type.

3. **`app/hooks/use-sse.ts`** — Added `"occupancy:updated"` to `SSE_EVENT_TYPES` array.

4. **`app/config/navigation.ts`** — Added `ScanLine` icon import. Added "Check-in" nav group under Operations with Scanner, Access Logs, and Checkpoints children.

5. **`docs/PHASE-4-COMPLETION.md`** — Added P4-03 entry.

### Dependencies Installed

- `qrcode` — QR code PNG generation
- `html5-qrcode` — Browser camera-based QR scanning
- `@types/qrcode` — TypeScript definitions (devDependency)

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 54 test files, 684 tests passed (17 new) |

### Notable Decisions

- **QR_ENCRYPTION_KEY** derives from SESSION_SECRET via SHA-256 when not explicitly set — zero-config for development
- **Client-only QR scanner** via `React.lazy()` + `typeof window !== "undefined"` guard prevents `html5-qrcode` SSR crash
- **Capacity is informational, not blocking** — the system never denies entry based on zone capacity to avoid dangerous gate jams; operators see warnings via color-coded occupancy bars
- **Web Audio API** for audio feedback — no audio file bundling needed; synthesized tones for success (rising), error (buzz), and warning (double beep)
- **useFetcher for scans** — camera stays running during scan processing, no full page navigation
- **3-second debounce** on QR scanner prevents duplicate submissions from continuous camera scanning
- **Used `findFirst` instead of `findUnique`** for VenueOccupancy lookup because Prisma's compound unique key doesn't accept nullable `zoneId` in the where clause

---

## P4-04: Communication Hub

**Status**: Completed
**Date**: 2026-02-17

### Summary

Built the communication hub with message template CRUD, audience filtering engine, broadcast composition with scheduling, multi-channel delivery pipeline (email, SMS, push, in-app), per-recipient tracking with background delivery job, and full management UI. The system enables event organizers to send targeted broadcasts to filtered groups of participants with `{{variable}}` template substitution.

### Files Created

1. **`app/lib/schemas/message-template.ts`** — Zod schemas (zod/v4) for create/update template with name, subject, body, channel, and variables fields.

2. **`app/lib/schemas/broadcast.ts`** — Zod schemas for audience filter (participantTypes, statuses, registeredAfter/Before, customFields) and broadcast creation (eventId, subject, body, channel, filters, scheduling, emergency flag).

3. **`app/services/message-templates.server.ts`** — Template CRUD service with `TemplateError` class, create/list/get/update/delete/clone functions. Includes `renderTemplate()` for `{{variable}}` substitution (unmatched vars left as-is) and `previewTemplate()` for live preview. System templates are read-only. All mutations create audit log entries.

4. **`app/services/audience-filter.server.ts`** — Composable AND filter engine with `countAudience()` and `resolveAudience()` (paginated in batches of 200). Supports filtering by participant type, status, registration date range, and JSONB custom fields.

5. **`app/services/broadcasts.server.ts`** — Broadcast service with `BroadcastError` class, feature flag gate (`FF_COMMUNICATION_HUB`). Functions: `createBroadcast` (DRAFT), `scheduleBroadcast`, `sendBroadcast` (resolves audience → creates MessageDelivery records in batches of 100), `cancelBroadcast` (marks QUEUED deliveries as FAILED), `sendEmergencyBroadcast` (creates + sends immediately with priority=1), `getBroadcast` (with delivery stats via groupBy), `getBroadcastDeliveries` (paginated), `listBroadcasts` (paginated).

6. **`app/services/channels/email.server.ts`** — Nodemailer SMTP adapter with `ChannelResult` interface. Creates transport from env SMTP vars. When `SMTP_HOST` is empty, logs only (dev mode — no crash). Exports `sendEmail(to, subject, htmlBody)`.

7. **`app/services/channels/in-app.server.ts`** — Reuses existing `createNotification()` + SSE push for in-app messages. Includes log-only stubs for SMS (`sendSMS`) and Push (`sendPush`) matching the same `ChannelResult` interface.

8. **`app/services/jobs/broadcast-delivery-job.server.ts`** — Background job processing QUEUED deliveries in batches of 50. For each: dispatches to appropriate channel adapter → updates status to SENT/FAILED. Retry logic: exponential backoff (1min, 5min, 15min), max 3 retries. Processes scheduled broadcasts when `scheduledAt <= now`. Updates broadcast aggregate counts and sets status to SENT when all deliveries complete. Emits SSE progress events via `eventBus.publish("communications", ...)`.

9. **`server/broadcast-delivery-job.js`** — Server-side entry following `webhook-retry-job.js` pattern. Runs every 10 seconds (configurable via `BROADCAST_DELIVERY_INTERVAL_MS`). Dynamic import loader for dev (Vite ssrLoadModule) and prod.

10. **`app/components/communications/template-list.tsx`** — Table component showing name, channel badge, variable count, system flag, with edit/delete/clone action buttons.

11. **`app/components/communications/template-editor.tsx`** — Form with name, subject, body (Textarea), channel selector (NativeSelect), common variable insertion buttons, custom variable input, and live preview panel.

12. **`app/components/communications/broadcast-list.tsx`** — Table showing subject, channel badge, status badge, recipient/sent/failed counts, view detail and cancel action buttons.

13. **`app/components/communications/broadcast-composer.tsx`** — Comprehensive composer with template picker, body editor with variable insertion, channel selector, audience filter panel (participant type checkboxes, status checkboxes), audience count preview (fetcher call), schedule toggle (send now / pick date), emergency checkbox, and send confirmation dialog.

14. **`app/components/communications/broadcast-detail.tsx`** — Delivery progress dashboard with progress bar, status breakdown cards (queued, sending, sent, bounced, failed), timestamps, cancel button, and paginated delivery log table.

15. **`app/routes/admin/events/$eventId/communications.tsx`** — Broadcast list + composer. Loader checks permission + feature flag, loads broadcasts, templates, participant types. Action handles countAudience, send, schedule, cancel.

16. **`app/routes/admin/events/$eventId/communications/$broadcastId.tsx`** — Broadcast detail with delivery log. Loader loads broadcast with stats + paginated deliveries. Action handles cancel.

17. **`app/routes/admin/events/$eventId/communications/templates.tsx`** — Template management page with create/edit/delete/clone via loader/action pattern. Toggles between list and editor views.

18. **`app/routes/admin/events/communications.tsx`** — Cross-event communications page. Lists all tenant events with broadcast count, links to event-specific broadcasts and templates.

19. **`app/services/__tests__/communications.server.test.ts`** — 18 test cases covering: template CRUD (create, list, get, update, system template rejection, delete), template rendering (variable substitution, unmatched variables, no variables), audience filter (count, resolve in batches), broadcast pipeline (create draft, send with deliveries, cancel, emergency), delivery job (process QUEUED, retry with backoff), feature flag gate.

### Files Modified

1. **`app/lib/env.server.ts`** — Added SMTP config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` with sensible defaults.

2. **`app/types/sse-events.ts`** — Added `"communications"` to `SSE_CHANNELS`. Added `BroadcastProgressEvent` interface with broadcastId, sentCount, failedCount, deliveredCount, total, status. Extended `SSEEvent` union.

3. **`app/hooks/use-sse.ts`** — Added `"broadcast:progress"` to `SSE_EVENT_TYPES`.

4. **`app/config/navigation.ts`** — Added `MessageSquare` icon import. Added "Communications" nav group under Operations with Broadcasts and Templates children.

5. **`server.js`** — Imported and registered `broadcastDeliveryJob`. Added `BROADCAST_DELIVERY_DEV`/`BROADCAST_DELIVERY_PROD` path constants, `broadcastLoader` for both dev and prod, startup call, and shutdown cleanup.

6. **`docs/PHASE-4-COMPLETION.md`** — Added P4-04 entry.

### Dependencies Installed

- `nodemailer` — SMTP email sending
- `@types/nodemailer` — TypeScript definitions (devDependency)

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 55 test files, 702 tests passed (18 new) |

### Notable Decisions

- **No rich text editor** — Used Textarea for body composition. Variable insertion via buttons is sufficient for the current scope.
- **Batch delivery via background job** — Broadcasts don't block the UI. Creating a broadcast enqueues MessageDelivery records; the background job processes them in batches of 50 every 10 seconds.
- **Email dev mode** — When `SMTP_HOST` is empty, the email adapter logs only (no crash in development).
- **SMS/Push are stubs** — Log-only adapters matching the `ChannelResult` interface, ready for Twilio/Web Push integration later.
- **In-app reuses notifications** — Leverages existing `createNotification()` + SSE `eventBus.publish()` for real-time delivery.
- **No async generators** — `resolveAudience` uses paginated `findMany` in batches of 200 instead of generators (simpler, better Prisma compatibility).
- **Feature flag gate** — All broadcast operations check `FF_COMMUNICATION_HUB`. Routes return 404 when disabled.
- **zod/v4 schema** — Used `z.record(z.string(), z.unknown())` for customFields (zod/v4 requires two args for `z.record`). All filter fields are optional to allow `{}` as valid empty filter.
- **Exponential backoff retry** — Failed deliveries retry at 1min, 5min, 15min intervals with max 3 retries before permanent failure.

---

## P4-05: Kiosk Mode

**Status**: Completed
**Date**: 2026-02-17

### Summary

Built the kiosk mode system with self-service status lookup, queue management, fullscreen touch-optimized interface with auto-reset, device registration and heartbeat monitoring, and staff queue management UI. Kiosk routes are public (device ID in URL, no user login required) while admin routes are permission-gated behind `FF_KIOSK_MODE` feature flag.

### Files Created

1. **`app/lib/schemas/kiosk-device.ts`** — Zod schemas for register/update device with mode (self-service, check-in, queue-display, info) and language (en, fr, am, ar).

2. **`app/lib/schemas/queue-ticket.ts`** — Zod schema for joining queue with eventId, participantId, serviceType, and priority.

3. **`app/services/kiosk-devices.server.ts`** — Device CRUD service with `KioskDeviceError` class. Functions: `registerDevice`, `listDevices`, `getDevice` (public, no tenant filter), `updateDevice`, `decommissionDevice`, `recordHeartbeat`, `markStaleDevicesOffline` (3-minute threshold). All mutations create audit log entries.

4. **`app/services/kiosk-sessions.server.ts`** — Session tracking service. Functions: `startSession`, `endSession` (with timedOut flag), `getActiveSession`, `getDeviceStats` (totalSessions, avgDurationSeconds, sessionsByType, timedOutCount).

5. **`app/services/queue-tickets.server.ts`** — Queue management service with `QueueError` class. Functions: `joinQueue` (assigns `A001`-style sequential ticket numbers per event per day), `callNextTicket` (priority-ordered FIFO), `startServing`, `completeService`, `cancelTicket`, `getQueueStatus` (nowServing per counter, nextUp 5, waitingCount, averageWaitMinutes), `estimateWaitTime`.

6. **`app/components/kiosk/kiosk-shell.tsx`** — Fullscreen wrapper with 120s inactivity auto-reset (countdown in last 30s), touch/click/keypress activity detection, language selector (en/fr/am/ar with 48px+ buttons), event branding header, and 30s heartbeat interval via fetcher.

7. **`app/components/kiosk/status-lookup.tsx`** — Two input modes: QR scan (lazy-loaded QRScanner) or email/registration code text input. Result display with large colored status badge (green=Approved, yellow=Pending, red=Rejected). "Join Queue" and "Done" action buttons.

8. **`app/components/kiosk/queue-join.tsx`** — Service type selection (Badge Pickup, Information, Credential Verification, General Assistance) with large touch buttons. Success: ticket number in 7xl font, estimated wait time, "Done" button.

9. **`app/components/kiosk/queue-display.tsx`** — Full-screen display board with "Now Serving" (per counter, 6xl ticket numbers), "Next Up" (next 5), and stats (waiting count, avg wait). Auto-refreshes via `useRevalidator()` with 5s polling. Web Audio API chime when new ticket called.

10. **`app/components/kiosk/queue-manager.tsx`** — Staff counter UI with counter number input, "Call Next" button, current ticket display (ticket number, participant name, status), "Start Serving"/"Complete"/"No Show" buttons, and queue overview (waiting, avg wait, served today).

11. **`app/components/kiosk/device-list.tsx`** — Table with Name, Location, Mode badge, Online/Offline (green/red dot), Last Heartbeat (relative time), and Actions (Edit, Copy URL, Decommission with confirmation dialog).

12. **`app/components/kiosk/register-device-dialog.tsx`** — Dialog form for create/edit device: Name, Location, Mode (NativeSelect), Language (NativeSelect). Reused for both register and edit modes.

13. **`app/routes/kiosk/$deviceId.tsx`** — Layout route: validates device (public, no auth), renders `<KioskShell>` wrapping `<Outlet>`. Action handles heartbeat and endSession.

14. **`app/routes/kiosk/$deviceId/index.tsx`** — Redirects to child route based on `device.mode` (self-service → self-service, queue-display → queue-display, etc.).

15. **`app/routes/kiosk/$deviceId/self-service.tsx`** — Status lookup + queue join page. Actions: lookup (email/code search), scan (QR via processScan), joinQueue, startSession, endSession.

16. **`app/routes/kiosk/$deviceId/queue-display.tsx`** — Queue display board (loader-only, polls via useRevalidator). Renders `<QueueDisplay>` component.

17. **`app/routes/admin/events/$eventId/settings/kiosks.tsx`** — Device management CRUD. Loader: `requirePermission("kiosk", "manage")` + `FF_KIOSK_MODE` check. Actions: register, update, decommission.

18. **`app/routes/admin/events/$eventId/queue.tsx`** — Staff queue management page. Loader: permission + feature flag check, queue status + completed today count. Actions: callNext, startServing, complete, cancel.

19. **`app/routes/admin/events/kiosks.tsx`** — Cross-event kiosk overview. Lists events with device count and queue ticket count, links to Devices and Queue pages.

20. **`app/services/__tests__/kiosk.server.test.ts`** — 16 test cases covering: device CRUD (register, list, get, get-not-found, decommission), heartbeat recording, stale device detection, session start/end, session timeout tracking, device stats calculation, queue join (sequential ticket A001/A006), call next (priority ordering), call next empty queue, complete/cancel, and queue status.

### Files Modified

1. **`app/config/navigation.ts`** — Added `Monitor` icon import. Added "Kiosks" nav group under Operations with Devices and Queue children.

2. **`docs/PHASE-4-COMPLETION.md`** — Added P4-05 entry.

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 56 test files, 718 tests passed (16 new) |

### Notable Decisions

- **Kiosk routes are public** — No user login required. Device ID in URL validates the kiosk and derives tenantId/eventId. This allows unattended kiosk operation.
- **Reuses check-in service** — `processScan()` from `check-in.server.ts` accepts `deviceId` in `ScanContext`, making it directly usable from kiosk routes without duplication.
- **No Participant.photoUrl** — The Prisma schema doesn't have a `photoUrl` field on Participant, so photo display was removed from the status lookup component.
- **Web Audio API chime** — Queue display uses a simple sine wave frequency sweep (880Hz → 1100Hz) for new ticket notifications, no audio file dependencies.
- **5-second polling for queue display** — Uses `useRevalidator()` with `setInterval` instead of SSE for queue display updates (simpler for display-only kiosk mode).
- **Sequential ticket numbering** — `A001`, `A002`, etc. resets daily per event using a count of tickets joined today.
- **Device heartbeat** — 30-second interval via fetcher in the kiosk shell. `markStaleDevicesOffline()` marks devices offline after 3 minutes without heartbeat.
- **Auto-reset** — 120-second inactivity timer with countdown display in the last 30 seconds. Resets on touch, click, or keypress events.

---

## P4-06: Bulk Operations Framework

**Status**: Completed
**Date**: 2026-02-17

### Summary

Built the bulk operations framework with CSV/XLSX file parsing (auto-delimiter detection), column mapping (exact match, aliases, Levenshtein), row-level validation with preview, batch processing in groups of 50 with progress reporting, error logging, 24-hour undo window with snapshot-based rollback, and CSV export with UTF-8 BOM for Excel compatibility.

### Files Created

1. **`app/lib/schemas/bulk-operation.ts`** — Zod schemas (zod/v4) for create operation (eventId, type, description), column mapping (sourceColumn, targetField, transform), and confirm operation (operationId, skipErrors).

2. **`app/services/bulk-import/parser.server.ts`** — CSV/XLSX file parsing service. CSV: auto-detects delimiter (comma, semicolon, tab) by counting occurrences in first line, handles quoted fields with escaped quotes (`""`), strips UTF-8 BOM. XLSX: uses `xlsx.read()` + `sheet_to_json()` on first sheet. Limits: 10,000 rows, 10MB file size.

3. **`app/services/bulk-import/column-mapper.server.ts`** — Column mapping service with three-step auto-suggestion: (1) exact match (case-insensitive), (2) common alias map (30+ aliases for 7 fixed fields), (3) Levenshtein distance ≤ 2. `applyMappings()` applies transforms (uppercase, lowercase, trim, date-parse).

4. **`app/services/bulk-import/validator.server.ts`** — Row validation with required field checks (firstName, lastName), email format validation, intra-file duplicate detection (email, registrationCode), and batch DB duplicate detection. Returns per-row status (valid/warning/error) with detailed error messages.

5. **`app/services/bulk-import/undo.server.ts`** — Snapshot capture stores participant state in `BulkOperationItem.previousState` and summary in `BulkOperation.snapshotData`. Restore handles IMPORT (delete participants) and STATUS_CHANGE/FIELD_UPDATE (restore previous values), batched in groups of 50.

6. **`app/services/bulk-operations.server.ts`** — Main orchestration service with `BulkOperationError` class and feature flag gate. Functions: `createBulkOperation` (VALIDATING + audit log), `validateOperation` (parse file → auto-map columns → validate rows → create items → PREVIEW), `confirmOperation` (PREVIEW → CONFIRMED → execute), `executeOperation` (batch-50 processing with progress updates, auto-generates registrationCode if missing, captures snapshot, sets 24h undo deadline), `undoOperation` (checks deadline, restores snapshot, ROLLED_BACK), `getOperation` (paginated items), `listOperations` (paginated list), `cancelOperation` (deletes items and operation).

7. **`app/services/bulk-export.server.ts`** — Participant CSV export following `exportAccessLogsCsv` pattern. Supports field selection (10 fixed + dynamic FieldDefinition fields), status/participantType/date filters, UTF-8 BOM prefix for Excel compatibility, proper CSV escaping. Max 10,000 rows.

8. **`app/components/bulk-operations/operation-list.tsx`** — Table component with type badge, description, color-coded status badge (VALIDATING=blue, PREVIEW=yellow, PROCESSING=blue-animated, COMPLETED=green, FAILED=red, ROLLED_BACK=gray), progress bar with counts, results summary, timestamps, and undo action button.

9. **`app/components/bulk-operations/import-wizard.tsx`** — 5-step wizard component: Upload (drag-and-drop + file input), Column Mapping (auto-suggested with NativeSelect override, unmapped highlighted yellow, required marked with \*), Validation Preview (summary cards + row table with color-coded status), Processing (progress bar with 2s polling via useRevalidator), Results (summary cards + undo button with deadline). Uses `useFetcher` for all step transitions.

10. **`app/components/bulk-operations/export-form.tsx`** — Export form with field selector checkboxes (select all/clear all), fixed + dynamic fields, status and participantType filter dropdowns, CSV export button.

11. **`app/routes/admin/events/$eventId/bulk-operations.tsx`** — Layout route with `<Outlet>` for nested routes.

12. **`app/routes/admin/events/$eventId/bulk-operations/index.tsx`** — Operations list page. Loader: permission + feature flag check, `listOperations()`. Action: undo. Component: page header with Import/Export buttons + OperationList.

13. **`app/routes/admin/events/$eventId/bulk-operations/import.tsx`** — Import wizard route. Actions: upload (parse + create + validate), updateMappings, confirm (execute), cancel, undo. Loader: loads target fields (fixed + dynamic FieldDefinition) and operation state if operationId in search params.

14. **`app/routes/admin/events/$eventId/bulk-operations/export.tsx`** — Export route. Loader: loads field definitions + participant types. Action: calls `exportParticipants()`, returns CSV Response with Content-Disposition header.

15. **`app/routes/admin/events/bulk-operations.tsx`** — Cross-event selector following kiosks.tsx pattern. Grid of event cards with participant count, operation count, and links to Operations/Import/Export pages.

16. **`app/services/__tests__/bulk-operations.server.test.ts`** — 16 test cases covering: CSV parsing (comma-delimited, semicolon auto-detection, quoted fields with escaped quotes, UTF-8 BOM stripping), XLSX parsing (basic sheet), column mapping (exact match, alias matching, transform application), row validation (missing required fields, intra-file duplicate emails, email format), bulk operation service (create with audit log, list with pagination), undo (snapshot capture, snapshot restore), export (CSV with BOM).

### Files Modified

1. **`app/config/navigation.ts`** — Added `Upload` icon import. Added "Bulk Operations" child to Management > Events children.

2. **`package.json`** — Added `xlsx` dependency for Excel file parsing.

3. **`docs/PHASE-4-COMPLETION.md`** — Added P4-06 entry.

### Dependencies Installed

- `xlsx` — Excel XLSX file parsing and generation

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 57 test files, 734 tests passed (16 new) |

### Notable Decisions

- **Hand-rolled CSV parser** — Matches the project's minimal-dependency pattern. Auto-detects delimiter by counting occurrences in the header line (comma > semicolon > tab).
- **XLSX first sheet only** — `xlsx.read()` processes only the first sheet, matching the typical bulk import use case.
- **Auto-generated registration codes** — When `registrationCode` is not mapped or empty, generates `BULK-{opId-suffix}-{paddedRowNumber}` format to satisfy the unique constraint.
- **Default participantType and workflow** — Import uses the first available participantType and workflow for the event. Future enhancement: allow selection in the wizard.
- **Feature flag gated** — All service functions check `FF_BULK_OPERATIONS`. Routes check both feature flag and `bulk-operations:execute` permission.
- **24-hour undo window** — `undoDeadline` set on completion. For IMPORT operations, undo deletes created participants. For STATUS_CHANGE/FIELD_UPDATE, undo restores from `previousState` snapshots.
- **Batch processing in groups of 50** — Matches the broadcast delivery job batch size pattern, with progress updates after each batch.
- **UTF-8 BOM in export** — Prepends `\uFEFF` for Excel auto-detection of UTF-8 encoding.

---

## P4-07: Batch Workflow Actions

**Status**: Completed
**Date**: 2026-02-18

### Summary

Built batch workflow actions enabling reviewers and admins to approve, reject, or bypass multiple participants at once. Each action flows through the existing `processWorkflowAction()` to ensure SLA tracking, audit logging, and webhook events fire correctly. Includes eligibility validation, dry-run mode, progress tracking, keyboard shortcuts for selection, and 24-hour undo window with `currentStepId` restoration.

### Files Created

1. **`app/lib/schemas/batch-action.ts`** — Zod schemas (zod/v4) for batch action input (eventId, action, participantIds, remarks, dryRun) and participant list filters (search, status, participantTypeId, page, pageSize).

2. **`app/services/batch-selection.server.ts`** — Selection and eligibility service. `selectByIds()` verifies participants exist, belong to tenant/event, not deleted. `selectByFilter()` delegates to `resolveAudience()`. `validateBatchEligibility()` checks workflow step configuration per action (APPROVE: nextStepId or isFinalStep, REJECT: rejectionTargetId, BYPASS: bypassTargetId).

3. **`app/services/batch-workflow-actions.server.ts`** — Batch action orchestration. `executeBatchAction()` creates a BulkOperation with CONFIRMED status (skips VALIDATING/PREVIEW), processes in batches of 20, calls `processWorkflowAction()` per participant, captures undo snapshot, sets 24h undo deadline. `dryRunBatchAction()` returns eligibility without persisting.

4. **`app/components/batch-actions/batch-action-bar.tsx`** — Sticky bottom bar showing selected count, Approve/Reject/Bypass buttons, "Select all matching" link, and Clear button.

5. **`app/components/batch-actions/batch-confirmation-dialog.tsx`** — Dialog with action name, eligibility summary (eligible/ineligible split), expandable ineligible list with reasons, remarks textarea, and confirm/cancel buttons.

6. **`app/components/batch-actions/batch-progress-dialog.tsx`** — Progress bar with success/failure counters, status badge, and undo button on completion.

7. **`app/routes/admin/events/$eventId/participants.tsx`** — Layout route with breadcrumb + Outlet.

8. **`app/routes/admin/events/$eventId/participants/index.tsx`** — Participant list with checkbox selection, search/status/type filters, pagination, batch action integration (validate-eligibility, batch-action, undo actions), and keyboard shortcuts (Ctrl+A select page, Ctrl+Shift+A select all filtered, Escape clear).

9. **`app/services/__tests__/batch-workflow-actions.server.test.ts`** — 10 test cases covering: full success, partial failures, undo snapshot capture, dry-run without persisting, eligibility rejection for APPROVE without nextStepId, eligibility rejection for REJECT without rejectionTargetId, selectByIds exclusion of soft-deleted/wrong-tenant, selectByFilter delegation to resolveAudience, batch-of-20 processing, and feature flag gate.

### Files Modified

1. **`app/services/bulk-operations.server.ts`** — Added `initialStatus` optional parameter to `createBulkOperation()` input, used as `input.initialStatus ?? "VALIDATING"` in the create call.

2. **`app/services/bulk-import/undo.server.ts`** — Added `currentStepId` to the participant fields selected in `captureSnapshot()` and to the restore data in `restoreFromSnapshot()`.

3. **`docs/PHASE-4-COMPLETION.md`** — Added P4-07 entry.

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 58 test files, 744 tests passed (10 new) |

### Notable Decisions

- **Batch size of 20** — Smaller than the import batch size (50) because each workflow action involves multiple DB writes + async events (SSE, webhooks). Keeps within the 100-in-5s performance target.
- **Skip VALIDATING/PREVIEW** — Batch workflow actions start with known participant IDs (no file upload), so the BulkOperation starts in CONFIRMED status and immediately moves to PROCESSING. Added `initialStatus` parameter to `createBulkOperation()` to support this.
- **Reuses `processWorkflowAction()` directly** — Each participant flows through the full workflow engine (status transition + Approval record + AuditLog + SSE + webhook). No shortcuts or batch-specific paths.
- **Dry-run mode** — Validates eligibility without creating a BulkOperation record. Returns eligible/ineligible split for the confirmation dialog.
- **Undo restores `currentStepId`** — Extended the undo service to also capture and restore `currentStepId`, ensuring workflow state rollback is complete.
- **Native checkbox instead of Radix Checkbox** — No Checkbox component exists in the UI library, so used native `<input type="checkbox">` with appropriate styling for the participant table.
- **Keyboard shortcuts** — Ctrl+A selects all on current page, Ctrl+Shift+A selects all matching the current filter, Escape clears selection. Uses the existing `useKeyboardShortcuts` hook.

---

## P4-08: Parallel Workflow Paths

**Status**: Completed
**Date**: 2026-02-18

### Summary

Built the fork/join execution logic for parallel workflow branches. A participant reaching a FORK step is split into independent `ParallelBranch` records that can be approved/rejected separately by different reviewers. When join conditions are met (ALL, ANY, or MAJORITY strategy), the participant converges at the JOIN step and continues through the standard workflow engine. Includes a background timeout job for overdue branches.

### Files Created

1. **`app/services/workflow-engine/parallel-types.ts`** — Type definitions: `ForkConfig`, `JoinConfig`, `JoinStrategy`, `JoinSummary`, `JoinEvaluationResult`, `BranchActionResult`.

2. **`app/services/workflow-engine/fork-executor.server.ts`** — `parseForkConfig()` validates FORK step config, `executeFork()` creates `ParallelBranch` records, updates participant to FORK step, creates audit log, emits SSE + webhook events.

3. **`app/services/workflow-engine/join-evaluator.server.ts`** — `parseJoinConfig()` validates JOIN step config, `evaluateStrategy()` pure function implements ALL/ANY/MAJORITY logic, `evaluateJoin()` queries branches and applies strategy.

4. **`app/services/workflow-engine/branch-action.server.ts`** — `processBranchAction()` handles APPROVE/REJECT on individual branches, creates Approval + AuditLog, evaluates join condition, and advances participant via dynamic `import("./navigation.server")` when satisfied.

5. **`app/services/workflow-engine/branch-timeout.server.ts`** — `processTimedOutBranches()` finds overdue PENDING branches and applies the configured timeout action (APPROVE/REJECT/ESCALATE).

6. **`server/branch-timeout-job.js`** — Background job shell following `sla-job.js` pattern. Runs every 5 minutes (configurable via `BRANCH_TIMEOUT_CHECK_INTERVAL_MS`).

7. **`app/components/workflow/parallel-branch-view.tsx`** — Reusable component showing all branches for a participant at a fork: labels, status badges, duration, completion info.

8. **`app/components/workflow/branch-action-panel.tsx`** — Reusable component for reviewers to APPROVE/REJECT a branch with optional remarks, showing other branches as read-only context.

9. **`app/services/workflow-engine/__tests__/parallel-workflow.server.test.ts`** — 14 test cases covering: parseForkConfig validation, executeFork branch creation, executeFork participant status, evaluateStrategy ALL/ANY/MAJORITY (7 scenarios), processBranchAction with approval, processBranchAction triggering join, and processTimedOutBranches.

### Files Modified

1. **`app/services/workflow-engine/serializer.server.ts`** — Added `forkConfig?` and `joinConfig?` optional fields to `StepSnapshot` interface. In `serializeWorkflow()`, extracts config when `stepType === "FORK"` or `"JOIN"`.

2. **`app/services/workflow-engine/navigation.server.ts`** — Added FORK guard (throws if `processWorkflowAction` called on FORK step), added FORK detection (when next step is FORK and `FF_PARALLEL_WORKFLOWS` enabled, creates pre-fork approval/audit and calls `executeFork`).

3. **`app/types/sse-events.ts`** — Added `ParallelForkedEvent` and `ParallelJoinedEvent` interfaces, added to `SSEEvent` union.

4. **`app/hooks/use-sse.ts`** — Added `"parallel:forked"` and `"parallel:joined"` to `SSE_EVENT_TYPES`.

5. **`app/lib/webhook-events.ts`** — Added `"parallel.forked"` and `"parallel.joined"` to `WEBHOOK_EVENTS` catalog.

6. **`app/lib/feature-flags.server.ts`** — Added `PARALLEL_WORKFLOWS: "FF_PARALLEL_WORKFLOWS"` to `FEATURE_FLAG_KEYS`.

7. **`server.js`** — Imported and registered `branchTimeoutJob`. Added `BRANCH_TIMEOUT_DEV`/`BRANCH_TIMEOUT_PROD` path constants, `branchTimeoutLoader` for both dev and prod, startup call, and shutdown cleanup.

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 59 test files, 758 tests passed (14 new) |

### Notable Decisions

- **Circular dependency via dynamic import** — `branch-action.server.ts` uses `await import("./navigation.server")` to call `processWorkflowAction()` after join evaluation, following the same pattern as `sla-checker.server.ts`.
- **FORK guard in navigation** — `processWorkflowAction()` throws a 400 error if called on a FORK step, ensuring only `processBranchAction()` is used for branch actions.
- **Feature flag gated** — Fork execution only triggers when `FF_PARALLEL_WORKFLOWS` is enabled. Without the flag, the workflow engine skips FORK steps (treating them as regular steps).
- **ESCALATE maps to REJECT** — Branch timeout with `timeoutAction: "ESCALATE"` applies REJECT with "Branch timed out (escalated)" remarks, since ESCALATE is not a valid branch action.
- **UI components are reusable** — `ParallelBranchView` and `BranchActionPanel` are standalone components ready for integration into participant detail routes when built.
- **No workflow designer UI** — Deferred entirely as no visual workflow designer exists yet in the codebase.

---

## P4-09: Duplicate Detection & Merge

**Status**: Completed
**Date**: 2026-02-18

### Summary

Built a multi-layered duplicate detection engine with 4-layer scoring (exact identifiers, fuzzy name matching via Levenshtein/Soundex, cross-field boosting, threshold classification), blacklist screening, atomic participant merge with relation migration, and three admin UI pages: duplicate review queue, blacklist management, and merge audit trail.

### Files Created

1. **`app/utils/levenshtein.ts`** — Shared utility functions: `levenshtein()` (extracted from column-mapper), `soundex()` (American Soundex algorithm), `normalizePhone()` (strips non-digits).

2. **`app/lib/schemas/duplicate-merge.ts`** — Zod schemas (zod/v4) for blacklist create/update (type, name, nameVariations, passport, email, reason, source, expiresAt) and merge participants (survivingId, mergedId, fieldResolution record, reviewNotes).

3. **`app/services/duplicate-detection.server.ts`** — 4-layer scoring engine. Pure functions: `scoreParticipantPair()` (L1: exact passport/email/phone, L2: Levenshtein/Soundex/name+DOB, L3: cross-field boost capped at +0.15, L4: threshold), `classifyScore()` (BLOCK ≥0.90, WARN ≥0.70, PASS). DB functions: `findCandidatesInScope()` (same event + concurrent events), `runDuplicateDetection()` (scores all candidates, upserts DuplicateCandidate for ≥0.70).

4. **`app/services/blacklist.server.ts`** — Blacklist service with `BlacklistError` class. `screenAgainstBlacklist()` loads active non-expired entries (tenant + global), checks exact passport, exact email, fuzzy name vs nameVariations. CRUD: create, list (paginated), get, update, deactivate, delete. All mutations create audit log entries.

5. **`app/services/pre-registration-checks.server.ts`** — Orchestration hook: `preRegistrationChecks()` calls `screenAgainstBlacklist()` then `runDuplicateDetection()`, returns `{ allowed, risk, blacklistMatches, duplicateCandidates }`. Standalone — not wired into bulk import (documented as integration point).

6. **`app/services/participant-merge.server.ts`** — Atomic merge via `prisma.$transaction()`: load both participants, apply fieldResolution (fixed + extras), migrate approvals/accessLogs/queueTickets/messageDeliveries, update DuplicateCandidate records to MERGED, soft-delete merged participant, create MergeHistory + audit log. Also includes `reviewDuplicateCandidate()`, `listDuplicateCandidates()` (paginated), `listMergeHistory()` (paginated).

7. **`app/routes/admin/events/$eventId/duplicates.tsx`** — Review queue with status filter (NativeSelect), confidence badge (red ≥0.90), participant comparison, inline review (confirm/dismiss), and merge dialog with side-by-side field resolution via radio groups.

8. **`app/routes/admin/events/$eventId/settings/blacklist.tsx`** — Blacklist CRUD page following checkpoints.tsx pattern. Table with name, type, passport, email, reason, status, expiry. Create/edit dialogs with NativeSelect for type, nameVariations as comma-separated input.

9. **`app/routes/admin/events/$eventId/merge-history.tsx`** — Read-only merge audit trail with expandable field resolution details, surviving/merged participant names, relation migration count, merged-by user.

10. **`app/services/__tests__/duplicate-detection.server.test.ts`** — 18 test cases covering: exact passport (1.0), exact email (0.95), normalized phone (0.90), name Levenshtein (0.85), name Soundex (0.80), name+DOB (0.90), cross-field boost cap (1.0), no match (0.0), classifyScore BLOCK/WARN/PASS, blacklist passport/name/expired, merge transaction, levenshtein/soundex/normalizePhone utilities.

### Files Modified

1. **`app/services/bulk-import/column-mapper.server.ts`** — Replaced inline `levenshtein()` with import from `~/utils/levenshtein`.

2. **`app/routes/admin/events/index.tsx`** — Added Duplicates and Merge History links to People group, Blacklist link to Settings group.

3. **`docs/PHASE-4-COMPLETION.md`** — Added P4-09 entry.

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | No type errors                           |
| `npm run test`      | 60 test files, 776 tests passed (18 new) |

### Notable Decisions

- **Extras JSONB access** — `passportNumber`, `dateOfBirth`, `phone` are read from `participant.extras` cast to `Record<string, unknown>`, not from fixed columns.
- **DuplicateCandidate ID ordering** — Always `participantAId = min(id1, id2)`, `participantBId = max(id1, id2)` to satisfy the `@@unique([participantAId, participantBId])` constraint.
- **Concurrent events scope** — `findCandidatesInScope()` queries participants from events where `startDate ≤ currentEvent.endDate AND endDate ≥ currentEvent.startDate`.
- **Soundex + Levenshtein in app code** — Fuzzy matching runs in JavaScript after loading candidates from the database, not in SQL.
- **Atomic merge** — The entire merge operation (field resolution, relation migration, DuplicateCandidate update, soft-delete, MergeHistory creation) runs inside `prisma.$transaction()`.
- **Extracted levenshtein utility** — Moved the Levenshtein function from `column-mapper.server.ts` to shared `utils/levenshtein.ts` and updated the import.
- **No auto-wiring** — `preRegistrationChecks()` is standalone and not auto-inserted into bulk import or registration flows (integration documented as future step).
