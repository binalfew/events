# P4-11: Waitlist Management

| Field                  | Value                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **Task ID**            | P4-11                                                           |
| **Phase**              | 4 — Ecosystem & Integrations                                    |
| **Category**           | Feature                                                         |
| **Suggested Assignee** | Backend Developer + Frontend Developer                          |
| **Depends On**         | P4-00 (Foundation Models)                                       |
| **Blocks**             | —                                                               |
| **Estimated Effort**   | 4 days                                                          |
| **Module References**  | [Module 09](../../modules/09-REGISTRATION-AND-ACCREDITATION.md) |

---

## Context

When delegation quotas are full, new registrations should enter a managed waitlist rather than being outright rejected. When a spot opens (via cancellation, rejection, or quota increase), the next eligible person on the waitlist should be automatically promoted. Promotions have a confirmation deadline — if the promoted participant doesn't confirm in time, the offer expires and the next person is promoted. The `WaitlistEntry` and `WaitlistPromotion` models were created in P4-00.

---

## Deliverables

### 1. Waitlist Entry Service

Create `app/services/waitlist.server.ts`:

```typescript
// Add participant to waitlist (called when quota exhausted during registration)
function addToWaitlist(input: AddToWaitlistInput, ctx: TenantContext): Promise<WaitlistEntry>;

// Get waitlist for an event with filtering and pagination
function getWaitlist(
  eventId: string,
  tenantId: string,
  filters?: WaitlistFilters,
): Promise<PaginatedResult<WaitlistEntry>>;

// Get a specific waitlist entry
function getWaitlistEntry(id: string, tenantId: string): Promise<WaitlistEntryWithDetails | null>;

// Withdraw from waitlist (participant-initiated)
function withdrawFromWaitlist(entryId: string, ctx: TenantContext): Promise<WaitlistEntry>;

// Update priority (admin action)
function updatePriority(
  entryId: string,
  priority: WaitlistPriority,
  ctx: TenantContext,
): Promise<WaitlistEntry>;

// Get participant's waitlist position and estimated wait
function getWaitlistPosition(
  entryId: string,
): Promise<{ position: number; estimatedWait: string | null }>;
```

Position calculation:

- Position = count of entries with same `eventId` + `participantType` where `status = ACTIVE` and (priority is higher OR same priority with earlier `createdAt`)
- VIP priority served before HIGH, HIGH before STANDARD

### 2. Auto-Promotion Engine

Create `app/services/waitlist-promotion.server.ts`:

```typescript
// Trigger promotion check — called when a spot opens
function checkAndPromote(
  eventId: string,
  tenantId: string,
  participantType: string,
  slotsAvailable: number,
): Promise<WaitlistPromotion[]>;

// Process expired promotion offers
function expireStalePromotions(): Promise<number>;

// Confirm a promotion (participant accepts the offer)
function confirmPromotion(promotionId: string, ctx: TenantContext): Promise<WaitlistPromotion>;

// Decline a promotion (participant declines the offer)
function declinePromotion(promotionId: string, ctx: TenantContext): Promise<WaitlistPromotion>;
```

Promotion flow:

1. **Trigger**: Spot opens via cancellation, rejection, or quota increase
2. **Select**: Pick the next eligible entry by priority + FIFO position
3. **Create**: Create `WaitlistPromotion` record with `slotAvailableAt`
4. **Notify**: Send notification to participant (email + in-app) with confirmation link
5. **Deadline**: Set `promotionDeadline` on the `WaitlistEntry` (default: 48 hours, configurable)
6. **Confirm**: Participant clicks confirmation link → `confirmPromotion()`:
   - Create participant registration from stored `registrationData`
   - Enter participant into the workflow
   - Update entry status to `PROMOTED`
7. **Expire**: If deadline passes without confirmation → `expireStalePromotions()`:
   - Set entry status to `EXPIRED`
   - Trigger next promotion in queue
   - Record `expiredAt` timestamp

### 3. Quota Integration

Integrate waitlist into the registration and quota system:

```typescript
// In registration service — when quota check fails:
async function handleQuotaExhausted(
  registrationData: Record<string, unknown>,
  eventId: string,
  tenantId: string,
  participantType: string,
): Promise<WaitlistEntry> {
  // Store registration data in waitlist entry for later promotion
  return addToWaitlist({
    eventId,
    tenantId,
    participantType,
    registrationData,
    priority: "STANDARD", // admin can upgrade later
  });
}

// In participant status change handler — when participant cancelled/rejected:
async function handleSlotFreed(eventId: string, tenantId: string, participantType: string) {
  const quota = await getAvailableQuota(eventId, participantType);
  if (quota > 0) {
    await checkAndPromote(eventId, tenantId, participantType, quota);
  }
}
```

### 4. Promotion Deadline Job

Create `app/jobs/waitlist-expiry.server.ts`:

- Runs every 5 minutes
- Queries `WaitlistEntry` where `status = ACTIVE` and `promotionDeadline <= now` and `promotionDeadline IS NOT NULL`
- For each expired entry:
  1. Set status to `EXPIRED`, record `expiredAt`
  2. Send expiry notification to participant
  3. Trigger next promotion in the queue

### 5. Waitlist Management UI (Admin)

Create routes and components:

- `app/routes/events.$eventId.waitlist.tsx` — waitlist management page
- `app/components/waitlist/waitlist-table.tsx`:
  - Table: position, participant name, participant type, priority, status, joined date, promotion deadline
  - Filters: status (ACTIVE, PROMOTED, EXPIRED, WITHDRAWN), participant type, priority
  - Sort by position (default), joined date, priority

- `app/components/waitlist/waitlist-entry-detail.tsx`:
  - Participant info summary
  - Registration data preview (stored from original submission)
  - Priority selector (STANDARD / HIGH / VIP) — admin can upgrade
  - Promotion history (if any promotions attempted)
  - Action buttons: "Promote Now" (manual override), "Remove from Waitlist"

- `app/components/waitlist/waitlist-stats.tsx`:
  - Total entries by status (active/promoted/expired/withdrawn)
  - Average wait time for promoted entries
  - Promotion success rate (confirmed vs expired)
  - Entries by priority breakdown

### 6. Waitlist Status for Participants

Create `app/components/waitlist/waitlist-status-card.tsx`:

- For the participant-facing portal / focal point view
- Shows: queue position, estimated wait, priority tier
- "Withdraw" button with confirmation
- When promoted: prominent notification with confirm/decline buttons and deadline countdown

### 7. Notification Integration

Integrate with the notification system (or communication hub if P4-04 is done):

- **Waitlisted notification**: "You have been added to the waitlist (position X)"
- **Promotion notification**: "A spot has opened! Confirm your registration by [deadline]"
- **Confirmation notification**: "Your registration has been confirmed"
- **Expiry warning**: "Your promotion offer expires in 12 hours" (sent at 50% of deadline)
- **Expiry notification**: "Your promotion offer has expired"

If P4-04 is not yet complete, use the existing notification/SSE infrastructure.

### 8. Feature Flag Gate

All waitlist features gated behind `FF_WAITLIST`:

- Waitlist routes return 404 when disabled
- Quota exhaustion returns standard rejection when disabled (no waitlist fallback)
- Waitlist navigation hidden
- Requires `waitlist:manage` permission for admin actions

---

## Acceptance Criteria

- [ ] Registration enters waitlist when delegation quota exhausted
- [ ] Queue position calculated by priority tier + FIFO within tier
- [ ] Auto-promotion triggers when spot freed (cancellation, rejection, quota increase)
- [ ] Promotion creates confirmation offer with configurable deadline (default 48h)
- [ ] Confirmed promotion creates participant registration from stored data and enters workflow
- [ ] Expired promotion automatically promotes next eligible person in queue
- [ ] Admin can manually promote, change priority, or remove entries
- [ ] Participant can withdraw from waitlist
- [ ] Waitlist stats show active/promoted/expired counts and average wait time
- [ ] Notifications sent at: waitlisted, promoted, confirmed, expiry warning, expired
- [ ] Promotion deadline job runs every 5 minutes to expire stale offers
- [ ] Feature flag `FF_WAITLIST` gates all functionality
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for position calculation, promotion logic, expiry handling (≥10 test cases)
