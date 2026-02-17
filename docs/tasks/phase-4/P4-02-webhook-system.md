# P4-02: Webhook System

| Field                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **Task ID**            | P4-02                                                      |
| **Phase**              | 4 — Ecosystem & Integrations                               |
| **Category**           | API                                                        |
| **Suggested Assignee** | Senior Backend Developer                                   |
| **Depends On**         | P4-00 (Foundation Models)                                  |
| **Blocks**             | —                                                          |
| **Estimated Effort**   | 5 days                                                     |
| **Module References**  | [Module 07](../../modules/07-API-AND-INTEGRATION-LAYER.md) |

---

## Context

External systems need real-time notifications when platform events occur (participant registered, approved, badge scanned, etc.). This task builds a webhook delivery system with HMAC signing, configurable retry with exponential backoff, a circuit breaker to protect unhealthy endpoints, and a delivery log for debugging. The `WebhookSubscription` and `WebhookDelivery` models were created in P4-00.

---

## Deliverables

### 1. Webhook Subscription Service

Create `app/services/webhooks.server.ts`:

```typescript
// CRUD for webhook subscriptions
function createWebhookSubscription(
  input: CreateWebhookInput,
  ctx: TenantContext,
): Promise<WebhookSubscription>;
function listWebhookSubscriptions(
  tenantId: string,
  filters?: WebhookFilters,
): Promise<PaginatedResult<WebhookSubscription>>;
function getWebhookSubscription(id: string, tenantId: string): Promise<WebhookSubscription | null>;
function updateWebhookSubscription(
  id: string,
  input: UpdateWebhookInput,
  ctx: TenantContext,
): Promise<WebhookSubscription>;
function deleteWebhookSubscription(id: string, ctx: TenantContext): Promise<void>;

// Pause/resume
function pauseWebhookSubscription(id: string, ctx: TenantContext): Promise<WebhookSubscription>;
function resumeWebhookSubscription(id: string, ctx: TenantContext): Promise<WebhookSubscription>;

// Test endpoint
function testWebhookEndpoint(id: string, ctx: TenantContext): Promise<WebhookDelivery>;
```

- Generate HMAC secret on creation (32-byte random hex)
- Allow custom HTTP headers per subscription (e.g., auth tokens for target)
- Validate URL is HTTPS (reject HTTP in production)

### 2. Webhook Event Catalog

Define supported event types in `app/lib/webhook-events.ts`:

```typescript
const WEBHOOK_EVENTS = {
  "participant.registered": "Fired when a new participant is registered",
  "participant.approved": "Fired when a participant is approved in workflow",
  "participant.rejected": "Fired when a participant is rejected in workflow",
  "participant.bypassed": "Fired when a participant bypasses workflow step",
  "participant.escalated": "Fired when SLA breach causes escalation",
  "participant.status_changed": "Fired on any participant status change",
  "scan.completed": "Fired when a badge scan occurs at a checkpoint",
  "occupancy.changed": "Fired when venue occupancy is updated",
  "alert.created": "Fired when an operational alert is triggered",
  "sla.warning": "Fired when an SLA warning threshold is reached",
  "sla.breached": "Fired when an SLA is breached",
  "workflow.published": "Fired when a workflow version is published",
  "bulk_operation.completed": "Fired when a bulk operation finishes",
} as const;
```

### 3. Webhook Dispatcher

Create `app/services/webhook-dispatcher.server.ts`:

```typescript
// Queue a webhook event for delivery to all matching subscriptions
function dispatchWebhookEvent(
  tenantId: string,
  eventType: string,
  eventId: string,
  payload: Record<string, unknown>,
): Promise<void>;
```

Dispatch flow:

1. Find all ACTIVE subscriptions for tenant where `events` array includes `eventType` (or `*` wildcard)
2. Skip subscriptions with open circuit breaker (unless `circuitBreakerResetAt` has passed)
3. Create `WebhookDelivery` record for each subscription with status `PENDING`
4. Execute delivery attempts asynchronously (non-blocking to caller)

### 4. Webhook Delivery Engine

Create `app/services/webhook-delivery.server.ts`:

```typescript
function deliverWebhook(deliveryId: string): Promise<void>;
function retryFailedDeliveries(): Promise<void>; // cron job
```

Delivery attempt:

1. Build payload envelope:
   ```json
   {
     "id": "delivery-id",
     "event": "participant.approved",
     "timestamp": "2026-02-17T12:00:00Z",
     "version": "v1",
     "data": { ... }
   }
   ```
2. Sign payload with HMAC-SHA256 using subscription secret
3. Set headers:
   - `Content-Type: application/json`
   - `X-Webhook-Signature: sha256=<hex-digest>`
   - `X-Webhook-Event: participant.approved`
   - `X-Webhook-Delivery: <delivery-id>`
   - Plus any custom headers from subscription
4. POST to subscription URL with configured `timeoutMs`
5. Record response: `responseCode`, `responseBody` (first 1KB), `latencyMs`
6. On success (2xx): set status `DELIVERED`, update `deliveredAt`
7. On failure: increment `attempts`, schedule retry per backoff schedule, set `nextRetryAt`
8. After max attempts exhausted: set status `DEAD_LETTER`

### 5. Circuit Breaker

Integrate into delivery engine:

- Track `consecutiveFailures` on subscription
- After 10 consecutive failures: set `circuitBreakerOpen = true`, `circuitBreakerResetAt = now + 1 hour`
- When circuit is open: skip deliveries, log as `FAILED` with error "circuit breaker open"
- After reset time: attempt one probe delivery; if success, reset breaker; if failure, extend by 2 hours
- Set subscription status to `SUSPENDED` after 3 consecutive breaker trips

### 6. Webhook Event Emitters

Integrate webhook dispatching into existing services:

- **Workflow engine** (`app/services/workflow-engine/`): dispatch on status transitions (approved, rejected, bypassed, escalated)
- **Registration service**: dispatch on `participant.registered`
- **Check-in service** (when P4-03 is done): dispatch on `scan.completed`

Use a simple event emitter pattern:

```typescript
// app/lib/webhook-emitter.server.ts
async function emitWebhookEvent(tenantId: string, event: string, data: unknown): Promise<void> {
  if (!(await isFeatureEnabled(tenantId, FEATURE_FLAG_KEYS.WEBHOOKS))) return;
  await dispatchWebhookEvent(tenantId, event, cuid(), data);
}
```

### 7. Retry Cron Job

Create `app/jobs/webhook-retry.server.ts`:

- Runs every 60 seconds (or on-demand trigger)
- Queries `WebhookDelivery` where `status = RETRYING` and `nextRetryAt <= now`
- Processes up to 50 deliveries per run
- Calls `deliverWebhook()` for each

### 8. Webhook Management UI

Create routes and components:

- `app/routes/events.$eventId.settings.webhooks.tsx` — webhook subscription list
- `app/components/webhooks/webhook-list.tsx` — table with URL, events, status, success rate
- `app/components/webhooks/create-webhook-dialog.tsx` — creation form (URL, event type checkboxes, custom headers)
- `app/components/webhooks/webhook-detail.tsx` — view subscription details, delivery log, circuit breaker status
- `app/components/webhooks/delivery-log.tsx` — paginated delivery history with status, response code, latency
- "Test" button to send a test payload and show result
- "Pause/Resume" toggle

### 9. Feature Flag Gate

All webhook features gated behind `FF_WEBHOOKS`:

- Event emitters short-circuit when disabled
- Webhook management UI hidden in settings
- Retry cron job skips when disabled

---

## Acceptance Criteria

- [ ] Webhook subscriptions can be created with event type selection and HTTPS URL
- [ ] HMAC-SHA256 signature sent in `X-Webhook-Signature` header
- [ ] Delivery attempts recorded with response code, body, and latency
- [ ] Exponential backoff retry schedule: 1s, 5s, 30s, 5min, 30min (configurable)
- [ ] Dead letter after max retries exhausted
- [ ] Circuit breaker opens after 10 consecutive failures, resets after 1 hour
- [ ] Subscription suspended after 3 consecutive breaker trips
- [ ] Test endpoint sends sample payload and returns delivery result
- [ ] Webhook events emitted from workflow engine on status transitions
- [ ] Delivery log shows full history per subscription with pagination
- [ ] Feature flag `FF_WEBHOOKS` gates all functionality
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for dispatcher, delivery, circuit breaker (≥10 test cases)
