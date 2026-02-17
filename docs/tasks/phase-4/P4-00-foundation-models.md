# P4-00: Foundation — Models, Migrations, Feature Flags

| Field                  | Value                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**            | P4-00                                                                                                                                                                                                                                                                                                                                                          |
| **Phase**              | 4 — Ecosystem & Integrations                                                                                                                                                                                                                                                                                                                                   |
| **Category**           | Database                                                                                                                                                                                                                                                                                                                                                       |
| **Suggested Assignee** | Backend Developer                                                                                                                                                                                                                                                                                                                                              |
| **Depends On**         | None (Phase 3 complete)                                                                                                                                                                                                                                                                                                                                        |
| **Blocks**             | P4-01 through P4-11                                                                                                                                                                                                                                                                                                                                            |
| **Estimated Effort**   | 3 days                                                                                                                                                                                                                                                                                                                                                         |
| **Module References**  | [Module 01](../../modules/01-DATA-MODEL-FOUNDATION.md), [Module 07](../../modules/07-API-AND-INTEGRATION-LAYER.md), [Module 09](../../modules/09-REGISTRATION-AND-ACCREDITATION.md), [Module 10](../../modules/10-EVENT-OPERATIONS-CENTER.md), [Module 14](../../modules/14-CONTENT-AND-DOCUMENTS.md), [Module 16](../../modules/16-PARTICIPANT-EXPERIENCE.md) |

---

## Context

Phase 4 introduces 20+ new Prisma models, 16 enums, and 7 feature flags. This foundation task creates the data layer all other Phase 4 tasks depend on. The models span 6 design modules covering API keys, webhooks, check-in, kiosk, bulk operations, duplicate detection, waitlist, communication, event cloning, and parallel workflows.

---

## Deliverables

### 1. New Enums

Add to `prisma/schema.prisma`:

```prisma
enum ApiKeyStatus {
  ACTIVE
  ROTATED
  REVOKED
  EXPIRED
}

enum RateLimitTier {
  STANDARD
  ELEVATED
  PREMIUM
  CUSTOM
}

enum WebhookStatus {
  ACTIVE
  PAUSED
  DISABLED
  SUSPENDED
}

enum DeliveryStatus {
  PENDING
  DELIVERED
  FAILED
  RETRYING
  DEAD_LETTER
}

enum ScanType {
  QR_SCAN
  NFC_TAP
  MANUAL_ENTRY
}

enum ScanResult {
  VALID
  INVALID
  EXPIRED
  REVOKED
  ALREADY_SCANNED
  MANUAL_OVERRIDE
}

enum BulkOperationType {
  IMPORT_PARTICIPANTS
  EXPORT_PARTICIPANTS
  STATUS_CHANGE
  BULK_APPROVE
  BULK_REJECT
  BULK_BYPASS
  FIELD_UPDATE
  DELETE
}

enum BulkOperationStatus {
  VALIDATING
  PREVIEW
  CONFIRMED
  PROCESSING
  COMPLETED
  FAILED
  ROLLED_BACK
}

enum DuplicateStatus {
  PENDING_REVIEW
  CONFIRMED_DUPLICATE
  NOT_DUPLICATE
  MERGED
}

enum WaitlistStatus {
  ACTIVE
  PROMOTED
  EXPIRED
  WITHDRAWN
  CANCELLED
}

enum WaitlistPriority {
  STANDARD
  HIGH
  VIP
}

enum MessageChannel {
  EMAIL
  SMS
  PUSH
  IN_APP
}

enum MessageStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  BOUNCED
  FAILED
}

enum BroadcastStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  CANCELLED
}

enum CloneStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  ROLLED_BACK
}

enum QueueStatus {
  WAITING
  CALLED
  SERVING
  COMPLETED
  CANCELLED
}
```

### 2. API & Webhook Models

**ApiKey** — tenant-scoped API key with permissions, rate limiting, and IP allowlist.

```prisma
model ApiKey {
  id              String        @id @default(cuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  keyHash         String        @unique
  keyPrefix       String
  permissions     String[]
  scopes          Json?
  rateLimitTier   RateLimitTier @default(STANDARD)
  rateLimitCustom Int?
  status          ApiKeyStatus  @default(ACTIVE)
  expiresAt       DateTime?
  lastUsedAt      DateTime?
  lastUsedIp      String?
  usageCount      Int           @default(0)
  allowedIps      String[]
  allowedOrigins  String[]
  rotatedFromId   String?       @unique
  rotatedFrom     ApiKey?       @relation("KeyRotation", fields: [rotatedFromId], references: [id])
  rotatedTo       ApiKey?       @relation("KeyRotation")
  rotationGraceEnd DateTime?
  createdBy       String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  revokedAt       DateTime?

  @@index([tenantId, status])
  @@index([keyHash])
  @@index([keyPrefix])
}
```

**WebhookSubscription** — endpoint registration with event types, HMAC secret, and circuit breaker.

```prisma
model WebhookSubscription {
  id                    String        @id @default(cuid())
  tenantId              String
  tenant                Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  url                   String
  description           String?
  events                String[]
  secret                String
  status                WebhookStatus @default(ACTIVE)
  version               String        @default("v1")
  maxRetries            Int           @default(5)
  retryBackoffMs        Int[]         @default([1000, 5000, 30000, 300000, 1800000])
  timeoutMs             Int           @default(10000)
  consecutiveFailures   Int           @default(0)
  circuitBreakerOpen    Boolean       @default(false)
  circuitBreakerResetAt DateTime?
  headers               Json?
  metadata              Json?
  createdBy             String
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  deliveries WebhookDelivery[]

  @@index([tenantId, status])
}
```

**WebhookDelivery** — delivery log with retry tracking and response details.

```prisma
model WebhookDelivery {
  id              String         @id @default(cuid())
  tenantId        String
  subscriptionId  String
  subscription    WebhookSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  eventType       String
  eventId         String
  payload         Json
  status          DeliveryStatus @default(PENDING)
  attempts        Int            @default(0)
  maxAttempts     Int            @default(5)
  nextRetryAt     DateTime?
  responseCode    Int?
  responseBody    String?
  responseHeaders Json?
  latencyMs       Int?
  errorMessage    String?
  errorType       String?
  deliveredAt     DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([subscriptionId, status])
  @@index([tenantId, eventType, createdAt])
  @@index([status, nextRetryAt])
  @@index([eventId])
}
```

### 3. Check-in & Access Control Models

**Checkpoint** — physical check-in location (gate, door, scanner station).

```prisma
model Checkpoint {
  id        String   @id @default(cuid())
  tenantId  String
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name      String
  location  String?
  type      String
  direction String
  isActive  Boolean  @default(true)
  capacity  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  accessLogs AccessLog[]

  @@unique([tenantId, eventId, name])
  @@index([eventId, isActive])
}
```

**AccessLog** — badge scan records with scan result and override reason.

```prisma
model AccessLog {
  id             String     @id @default(cuid())
  checkpointId   String
  checkpoint     Checkpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  participantId  String?
  participant    Participant? @relation(fields: [participantId], references: [id])
  scanType       ScanType
  scanResult     ScanResult
  qrPayload      String
  scannedBy      String
  deviceId       String?
  overrideReason String?
  scannedAt      DateTime   @default(now())

  @@index([checkpointId, scannedAt])
  @@index([participantId, scannedAt])
  @@index([scanResult, scannedAt])
}
```

**VenueOccupancy** — real-time occupancy tracking per zone.

```prisma
model VenueOccupancy {
  id           String   @id @default(cuid())
  eventId      String
  event        Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  zoneId       String?
  currentCount Int      @default(0)
  maxCapacity  Int
  lastUpdated  DateTime @default(now())

  @@unique([eventId, zoneId])
}
```

### 4. Kiosk Models

**KioskDevice** — self-service terminal registration and heartbeat.

```prisma
model KioskDevice {
  id            String   @id @default(cuid())
  tenantId      String
  eventId       String
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name          String
  location      String
  isOnline      Boolean  @default(true)
  lastHeartbeat DateTime @default(now())
  language      String   @default("en")
  mode          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions KioskSession[]

  @@unique([tenantId, eventId, name])
}
```

**KioskSession** — user interaction tracking per kiosk.

```prisma
model KioskSession {
  id            String      @id @default(cuid())
  kioskDeviceId String
  kioskDevice   KioskDevice @relation(fields: [kioskDeviceId], references: [id], onDelete: Cascade)
  participantId String?
  sessionType   String
  language      String      @default("en")
  startedAt     DateTime    @default(now())
  endedAt       DateTime?
  timedOut      Boolean     @default(false)
  metadata      Json?

  @@index([kioskDeviceId, startedAt])
  @@index([participantId])
}
```

**QueueTicket** — queue management with priority-based serving.

```prisma
model QueueTicket {
  id            String      @id @default(cuid())
  tenantId      String
  eventId       String
  event         Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id])
  ticketNumber  String
  counterNumber Int?
  status        QueueStatus @default(WAITING)
  priority      Int         @default(0)
  estimatedWait Int?
  joinedAt      DateTime    @default(now())
  calledAt      DateTime?
  servedAt      DateTime?
  completedAt   DateTime?

  @@unique([tenantId, eventId, ticketNumber])
  @@index([eventId, status, priority])
  @@index([participantId])
}
```

### 5. Bulk Operations Models

**BulkOperation** — async batch job with progress and undo.

```prisma
model BulkOperation {
  id             String              @id @default(cuid())
  tenantId       String
  eventId        String
  event          Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)
  type           BulkOperationType
  status         BulkOperationStatus @default(VALIDATING)
  description    String
  filters        Json?
  totalItems     Int                 @default(0)
  processedItems Int                 @default(0)
  successCount   Int                 @default(0)
  failureCount   Int                 @default(0)
  inputFileUrl   String?
  outputFileUrl  String?
  snapshotData   Json?
  undoDeadline   DateTime?
  errorLog       Json?
  startedAt      DateTime?
  completedAt    DateTime?
  rolledBackAt   DateTime?
  createdBy      String
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  items BulkOperationItem[]

  @@index([tenantId, eventId, status])
  @@index([tenantId, eventId, type, createdAt])
}
```

**BulkOperationItem** — per-row status for bulk imports.

```prisma
model BulkOperationItem {
  id            String        @id @default(cuid())
  operationId   String
  operation     BulkOperation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  participantId String?
  rowNumber     Int?
  status        String
  inputData     Json?
  previousState Json?
  errorMessage  String?
  processedAt   DateTime?

  @@index([operationId, status])
}
```

### 6. Duplicate Detection & Blacklist Models

**DuplicateCandidate** — potential duplicate pair with confidence score.

```prisma
model DuplicateCandidate {
  id              String          @id @default(cuid())
  tenantId        String
  eventId         String?
  participantAId  String
  participantBId  String
  confidenceScore Float
  matchFields     Json
  status          DuplicateStatus @default(PENDING_REVIEW)
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?
  createdAt       DateTime        @default(now())

  @@unique([participantAId, participantBId])
  @@index([tenantId, eventId, status])
  @@index([confidenceScore])
}
```

**MergeHistory** — audit trail for merged participant records.

```prisma
model MergeHistory {
  id                String   @id @default(cuid())
  tenantId          String
  survivingId       String
  mergedId          String
  fieldResolution   Json
  approvalsMigrated Int
  mergedBy          String
  mergedAt          DateTime @default(now())

  @@index([survivingId])
  @@index([mergedId])
}
```

**Blacklist** — sanctions and security screening entries.

```prisma
model Blacklist {
  id             String    @id @default(cuid())
  tenantId       String?
  type           String
  name           String?
  nameVariations String[]
  passportNumber String?
  email          String?
  dateOfBirth    DateTime?
  nationality    String?
  organization   String?
  reason         String
  source         String?
  addedBy        String
  expiresAt      DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([passportNumber])
  @@index([email])
  @@index([isActive])
  @@index([name])
}
```

### 7. Waitlist Models

**WaitlistEntry** — queue position with priority tier and promotion deadline.

```prisma
model WaitlistEntry {
  id                String           @id @default(cuid())
  tenantId          String
  eventId           String
  event             Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantId     String
  participant       Participant      @relation(fields: [participantId], references: [id], onDelete: Cascade)
  participantType   String
  priority          WaitlistPriority @default(STANDARD)
  position          Int
  status            WaitlistStatus   @default(ACTIVE)
  registrationData  Json
  promotedAt        DateTime?
  promotionDeadline DateTime?
  expiredAt         DateTime?
  withdrawnAt       DateTime?
  notificationsSent Int              @default(0)
  lastNotifiedAt    DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  promotions WaitlistPromotion[]

  @@unique([eventId, participantId])
  @@index([eventId, participantType, priority, position])
  @@index([eventId, status])
  @@index([status, promotionDeadline])
}
```

**WaitlistPromotion** — tracks how a promotion was triggered.

```prisma
model WaitlistPromotion {
  id              String        @id @default(cuid())
  waitlistEntryId String
  waitlistEntry   WaitlistEntry @relation(fields: [waitlistEntryId], references: [id], onDelete: Cascade)
  triggeredBy     String
  triggerEntityId String?
  promotedBy      String?
  slotAvailableAt DateTime
  promotedAt      DateTime      @default(now())
  confirmedAt     DateTime?
  declinedAt      DateTime?

  @@index([waitlistEntryId])
}
```

### 8. Communication Hub Models

**MessageTemplate** — reusable message template with variable placeholders.

```prisma
model MessageTemplate {
  id        String         @id @default(cuid())
  tenantId  String
  tenant    Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name      String
  subject   String?
  body      String
  channel   MessageChannel
  isSystem  Boolean        @default(false)
  variables String[]
  createdBy String?
  updatedBy String?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  broadcasts BroadcastMessage[]

  @@unique([tenantId, name, channel])
  @@index([tenantId])
  @@index([channel])
}
```

**BroadcastMessage** — multi-channel broadcast with audience filters.

```prisma
model BroadcastMessage {
  id             String          @id @default(cuid())
  tenantId       String
  tenant         Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId        String?
  event          Event?          @relation(fields: [eventId], references: [id])
  templateId     String?
  template       MessageTemplate? @relation(fields: [templateId], references: [id])
  subject        String?
  body           String
  channel        MessageChannel
  status         BroadcastStatus @default(DRAFT)
  filters        Json
  recipientCount Int             @default(0)
  sentCount      Int             @default(0)
  failedCount    Int             @default(0)
  deliveredCount Int             @default(0)
  bouncedCount   Int             @default(0)
  isEmergency    Boolean         @default(false)
  priority       Int             @default(5)
  scheduledAt    DateTime?
  sentAt         DateTime?
  completedAt    DateTime?
  createdBy      String?
  cancelledBy    String?
  cancelledAt    DateTime?
  cancelReason   String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  deliveries MessageDelivery[]

  @@index([tenantId])
  @@index([eventId])
  @@index([status])
  @@index([scheduledAt])
}
```

**MessageDelivery** — per-recipient delivery tracking.

```prisma
model MessageDelivery {
  id            String           @id @default(cuid())
  broadcastId   String
  broadcast     BroadcastMessage @relation(fields: [broadcastId], references: [id], onDelete: Cascade)
  participantId String
  participant   Participant      @relation(fields: [participantId], references: [id])
  channel       MessageChannel
  recipient     String
  status        MessageStatus    @default(QUEUED)
  externalId    String?
  sentAt        DateTime?
  deliveredAt   DateTime?
  bouncedAt     DateTime?
  errorMessage  String?
  errorCode     String?
  retryCount    Int              @default(0)
  nextRetryAt   DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@unique([broadcastId, participantId, channel])
  @@index([broadcastId])
  @@index([participantId])
  @@index([status])
}
```

### 9. Event Cloning Models

**EventSeries** — recurring event grouping.

```prisma
model EventSeries {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  editions EventEdition[]

  @@unique([tenantId, name])
}
```

**EventEdition** — edition numbering within a series.

```prisma
model EventEdition {
  id            String      @id @default(cuid())
  seriesId      String
  series        EventSeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  eventId       String      @unique
  event         Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  editionNumber Int
  year          Int
  hostCountry   String?
  hostCity      String?
  notes         String?
  createdAt     DateTime    @default(now())

  @@unique([seriesId, editionNumber])
  @@index([seriesId, year])
}
```

**CloneOperation** — event cloning job with selective options.

```prisma
model CloneOperation {
  id            String      @id @default(cuid())
  tenantId      String
  sourceEventId String
  targetEventId String?
  status        CloneStatus @default(PENDING)
  options       Json
  elementsCopied Json?
  errorLog      String?
  startedAt     DateTime    @default(now())
  completedAt   DateTime?
  createdBy     String

  @@index([tenantId, status])
}
```

### 10. Parallel Workflow Path Model

**ParallelBranch** — tracks individual parallel execution paths.

```prisma
model ParallelBranch {
  id            String      @id @default(cuid())
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  forkStepId    String
  branchStepId  String
  branchStep    Step        @relation(fields: [branchStepId], references: [id])
  status        String      @default("PENDING")
  completedAt   DateTime?
  completedBy   String?
  action        String?
  remarks       String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([participantId, forkStepId, branchStepId])
  @@index([participantId, forkStepId])
  @@index([status])
}
```

### 11. Reverse Relations on Existing Models

Add reverse relations:

- **Tenant**: `apiKeys ApiKey[]`, `webhookSubscriptions WebhookSubscription[]`, `messageTemplates MessageTemplate[]`, `broadcastMessages BroadcastMessage[]`, `eventSeries EventSeries[]`
- **Event**: `checkpoints Checkpoint[]`, `venueOccupancies VenueOccupancy[]`, `kioskDevices KioskDevice[]`, `queueTickets QueueTicket[]`, `bulkOperations BulkOperation[]`, `waitlistEntries WaitlistEntry[]`, `broadcastMessages BroadcastMessage[]`, `eventEdition EventEdition?`
- **Participant**: `accessLogs AccessLog[]`, `queueTickets QueueTicket[]`, `waitlistEntry WaitlistEntry?`, `messageDeliveries MessageDelivery[]`, `parallelBranches ParallelBranch[]`
- **Step**: `parallelBranches ParallelBranch[]`

### 12. Feature Flag Keys

Add to `FEATURE_FLAG_KEYS` in `app/lib/feature-flags.server.ts`:

```typescript
REST_API: "FF_REST_API",
WEBHOOKS: "FF_WEBHOOKS",
BULK_OPERATIONS: "FF_BULK_OPERATIONS",
EVENT_CLONE: "FF_EVENT_CLONE",
WAITLIST: "FF_WAITLIST",
COMMUNICATION_HUB: "FF_COMMUNICATION_HUB",
KIOSK_MODE: "FF_KIOSK_MODE",
```

### 13. Feature Flag Seeds

Add 7 new flags to the `defaultFlags` array in `prisma/seed.ts`:

```typescript
{ key: "FF_REST_API", description: "REST API with API key authentication" },
{ key: "FF_WEBHOOKS", description: "Webhook subscriptions and event delivery" },
{ key: "FF_BULK_OPERATIONS", description: "Bulk import/export and batch status changes" },
{ key: "FF_EVENT_CLONE", description: "Event cloning with selective element copy" },
{ key: "FF_WAITLIST", description: "Waitlist management with auto-promotion" },
{ key: "FF_COMMUNICATION_HUB", description: "Broadcast messaging via email/SMS/push" },
{ key: "FF_KIOSK_MODE", description: "Self-service kiosk terminals for events" },
```

### 14. Permission Seeds

Add to `prisma/seed.ts` permission definitions:

```typescript
{ resource: "api-keys", action: "manage" },
{ resource: "webhooks", action: "manage" },
{ resource: "check-in", action: "scan" },
{ resource: "kiosk", action: "manage" },
{ resource: "bulk-operations", action: "execute" },
{ resource: "duplicates", action: "review" },
{ resource: "blacklist", action: "manage" },
{ resource: "waitlist", action: "manage" },
{ resource: "communication", action: "broadcast" },
{ resource: "event-clone", action: "execute" },
```

---

## Acceptance Criteria

- [ ] All 16+ new enums created in Prisma schema
- [ ] All 20+ new models created with proper relations
- [ ] Migration runs successfully (`prisma migrate dev`)
- [ ] Prisma client generates without errors
- [ ] Reverse relations added to Tenant, Event, Participant, Step, User
- [ ] 7 new feature flag keys added to `FEATURE_FLAG_KEYS`
- [ ] 10 new permissions seeded
- [ ] 7 new feature flags seeded
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (all existing tests green)
- [ ] `npx prisma db seed` completes without errors
