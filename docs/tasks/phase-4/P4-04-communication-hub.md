# P4-04: Communication Hub

| Field                  | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| **Task ID**            | P4-04                                                  |
| **Phase**              | 4 — Ecosystem & Integrations                           |
| **Category**           | Feature                                                |
| **Suggested Assignee** | Backend Developer + Frontend Developer                 |
| **Depends On**         | P4-00 (Foundation Models)                              |
| **Blocks**             | —                                                      |
| **Estimated Effort**   | 5 days                                                 |
| **Module References**  | [Module 14](../../modules/14-CONTENT-AND-DOCUMENTS.md) |

---

## Context

Event organizers need to send broadcast messages to filtered groups of participants via email, SMS, push notifications, and in-app messages. This task builds the communication hub: message template management, audience filtering, broadcast composition, multi-channel delivery pipeline with per-recipient tracking, and an emergency broadcast mode. The `MessageTemplate`, `BroadcastMessage`, and `MessageDelivery` models were created in P4-00.

---

## Deliverables

### 1. Message Template Service

Create `app/services/message-templates.server.ts`:

```typescript
function createTemplate(input: CreateTemplateInput, ctx: TenantContext): Promise<MessageTemplate>;
function listTemplates(
  tenantId: string,
  filters?: TemplateFilters,
): Promise<PaginatedResult<MessageTemplate>>;
function getTemplate(id: string, tenantId: string): Promise<MessageTemplate | null>;
function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
  ctx: TenantContext,
): Promise<MessageTemplate>;
function deleteTemplate(id: string, ctx: TenantContext): Promise<void>;
function cloneTemplate(id: string, newName: string, ctx: TenantContext): Promise<MessageTemplate>;
function previewTemplate(templateId: string, sampleData: Record<string, string>): string;
```

Template variable substitution:

- Variables use `{{variableName}}` syntax
- Built-in variables: `{{name}}`, `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{eventName}}`, `{{eventDate}}`, `{{status}}`, `{{participantType}}`
- Custom variables from participant `extras` fields
- `variables` array on template stores declared variable names for validation
- Preview function renders template with sample data

### 2. Audience Filter Engine

Create `app/services/audience-filter.server.ts`:

```typescript
interface AudienceFilter {
  participantTypes?: string[];
  statuses?: string[];
  delegationIds?: string[];
  registeredAfter?: string;
  registeredBefore?: string;
  customFields?: Record<string, unknown>; // match against extras
}

// Count recipients matching filter (for preview)
function countAudience(eventId: string, tenantId: string, filter: AudienceFilter): Promise<number>;

// Get recipient list for broadcast delivery
function resolveAudience(
  eventId: string,
  tenantId: string,
  filter: AudienceFilter,
): AsyncGenerator<ParticipantContact>;
```

- Filters compose with AND logic
- `resolveAudience` returns a streaming cursor to handle large audiences without loading all into memory
- Each `ParticipantContact` includes: `participantId`, `email`, `phone`, `name`, preferred channel

### 3. Broadcast Service

Create `app/services/broadcasts.server.ts`:

```typescript
// Create a broadcast (draft)
function createBroadcast(
  input: CreateBroadcastInput,
  ctx: TenantContext,
): Promise<BroadcastMessage>;

// Schedule a broadcast for future delivery
function scheduleBroadcast(
  id: string,
  scheduledAt: Date,
  ctx: TenantContext,
): Promise<BroadcastMessage>;

// Send a broadcast immediately
function sendBroadcast(id: string, ctx: TenantContext): Promise<BroadcastMessage>;

// Cancel a scheduled or in-progress broadcast
function cancelBroadcast(id: string, reason: string, ctx: TenantContext): Promise<BroadcastMessage>;

// Get broadcast with delivery stats
function getBroadcast(id: string, tenantId: string): Promise<BroadcastWithStats | null>;

// List broadcasts for event
function listBroadcasts(
  eventId: string,
  tenantId: string,
  filters?: BroadcastFilters,
): Promise<PaginatedResult<BroadcastMessage>>;

// Send emergency broadcast (bypasses scheduling, high priority)
function sendEmergencyBroadcast(
  input: EmergencyBroadcastInput,
  ctx: TenantContext,
): Promise<BroadcastMessage>;
```

Send flow:

1. Set broadcast status to `SENDING`
2. Resolve audience using filter
3. For each recipient, create `MessageDelivery` record with status `QUEUED`
4. Process deliveries in batches of 50
5. Update `sentCount`, `failedCount`, `deliveredCount` on broadcast
6. Set status to `SENT` when all deliveries processed, `completedAt` timestamp

### 4. Channel Adapters

Create `app/services/channels/` with a unified interface:

```typescript
interface ChannelAdapter {
  send(recipient: string, content: RenderedMessage): Promise<ChannelDeliveryResult>;
  getStatus?(externalId: string): Promise<MessageStatus>;
}
```

**Email adapter** (`app/services/channels/email.server.ts`):

- Use `nodemailer` with configurable SMTP transport
- HTML + plain text rendering
- Configurable sender address per tenant

**SMS adapter** (`app/services/channels/sms.server.ts`):

- Stub adapter with interface for Twilio/Vonage integration
- Log-only mode for development
- Character limit validation (160 chars for SMS)

**In-App adapter** (`app/services/channels/in-app.server.ts`):

- Create notification record in DB
- Push via existing SSE infrastructure

**Push adapter** (`app/services/channels/push.server.ts`):

- Stub for Web Push API integration
- Requires service worker push subscription (from Phase 3 PWA)

### 5. Broadcast Composer UI

Create routes and components:

- `app/routes/events.$eventId.communications.tsx` — communications hub page
- `app/routes/events.$eventId.communications.new.tsx` — broadcast composer
- `app/components/communications/broadcast-list.tsx` — table with subject, channel, status, recipients, sent/delivered counts
- `app/components/communications/broadcast-composer.tsx`:
  - Template selector (or compose from scratch)
  - Rich text editor for message body with variable insertion toolbar
  - Channel selector (email, SMS, push, in-app)
  - Audience filter panel (participant type, status, delegation, date range, custom fields)
  - Audience preview: count of matching recipients
  - Schedule option: send now or schedule for later (date/time picker)
  - Send confirmation dialog showing recipient count and channel
- `app/components/communications/broadcast-detail.tsx` — delivery progress dashboard:
  - Circular progress: sent / total
  - Status breakdown: queued, sending, delivered, bounced, failed
  - Per-recipient delivery log (paginated)

### 6. Message Template Management UI

- `app/routes/events.$eventId.communications.templates.tsx` — template list
- `app/components/communications/template-list.tsx` — table with name, channel, variables, system flag
- `app/components/communications/template-editor.tsx`:
  - Name, subject, body fields
  - Channel selector
  - Variable insertion buttons (click to insert `{{variable}}`)
  - Live preview with sample data
  - System templates marked as read-only

### 7. Delivery Tracking Job

Create `app/jobs/broadcast-delivery.server.ts`:

- Processes queued `MessageDelivery` records in batches
- Calls appropriate channel adapter based on `channel`
- Updates delivery status, externalId, sentAt, errorMessage
- Retry failed deliveries up to 3 times with backoff
- Updates broadcast aggregate counts after each batch

### 8. Feature Flag Gate

All communication hub features gated behind `FF_COMMUNICATION_HUB`:

- Communication routes return 404 when disabled
- Broadcast service short-circuits when disabled
- Navigation link hidden in sidebar

---

## Acceptance Criteria

- [ ] Message templates support `{{variable}}` substitution with live preview
- [ ] Audience filter composes participant type, status, delegation, date, and custom field criteria
- [ ] Audience count preview shown before sending
- [ ] Broadcast delivery creates per-recipient `MessageDelivery` records
- [ ] Email channel sends via configurable SMTP transport
- [ ] SMS and push channels have stub adapters with logging
- [ ] In-app channel creates notifications visible via SSE
- [ ] Broadcast progress dashboard shows real-time delivery counts
- [ ] Emergency broadcast bypasses scheduling with high priority
- [ ] Scheduled broadcasts send at configured time
- [ ] Cancel stops in-progress broadcast and marks remaining as cancelled
- [ ] Per-recipient delivery log shows status, channel, and error details
- [ ] Feature flag `FF_COMMUNICATION_HUB` gates all functionality
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for template rendering, audience filtering, delivery pipeline (≥10 test cases)
