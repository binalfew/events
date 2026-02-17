# P3-05: Delegation Portal

| Field                  | Value                                         |
| ---------------------- | --------------------------------------------- |
| **Task ID**            | P3-05                                         |
| **Phase**              | 3 — Advanced Features                         |
| **Category**           | Feature                                       |
| **Suggested Assignee** | Full-Stack Engineer                           |
| **Depends On**         | P3-00                                         |
| **Blocks**             | None                                          |
| **Estimated Effort**   | 6 days                                        |
| **Module References**  | [Module 09](../../modules/09-REGISTRATION.md) |

---

## Context

In AU summit accreditation, member states and organizations are allocated a quota of participants per event. A focal point (delegation head) manages their organization's allocation: sending invitation links to delegates, tracking acceptance, and managing substitutions. Admins set per-organization quotas and monitor usage.

---

## Deliverables

### 1. Delegation Service

Create `app/services/delegation.server.ts`:

**Quota management (admin):**

```typescript
// Create or update quota for an organization at an event
upsertQuota(tenantId: string, eventId: string, organizationId: string, maxParticipants: number): Promise<DelegationQuota>

// List all quotas for an event
listQuotas(tenantId: string, eventId: string): Promise<DelegationQuota[]>

// Get quota with usage stats
getQuota(quotaId: string): Promise<DelegationQuota & { invites: DelegationInvite[] }>

// Delete quota (only if no accepted invites)
deleteQuota(quotaId: string): Promise<void>
```

**Invite management (focal point):**

```typescript
// Send invitation to a delegate
sendInvite(quotaId: string, email: string, invitedBy: string): Promise<DelegationInvite>

// Cancel a pending invitation
cancelInvite(inviteId: string): Promise<void>

// Accept invitation (delegate clicks link)
acceptInvite(token: string): Promise<{ invite: DelegationInvite; quota: DelegationQuota }>

// Resend invitation email
resendInvite(inviteId: string): Promise<void>

// List invites for a quota
listInvites(quotaId: string): Promise<DelegationInvite[]>
```

**Validation rules:**

- Cannot send invite if `usedCount >= maxParticipants`
- Cannot accept expired invite
- Accepting increments `usedCount` atomically (use Prisma transaction)
- Cancelling a pending invite does NOT decrement `usedCount`
- Cancelling an accepted invite decrements `usedCount`

### 2. Token Generation

- Generate cryptographically secure invite tokens: `crypto.randomBytes(32).toString('hex')`
- Token stored in `DelegationInvite.token` (unique index)
- Invite link format: `/delegation/accept?token={token}`
- Expiration: configurable, default 14 days from creation

### 3. Admin Quota Management UI

Create `app/routes/admin/events/$eventId/delegations.tsx`:

- Table of organizations with quota allocation and usage
- Add/edit quota: organization selector + max participants input
- Click into org to see invite list with status badges (Pending/Accepted/Expired/Cancelled)
- Bulk quota import from CSV (optional stretch goal)

### 4. Focal Point Portal

Create `app/routes/delegation/` routes:

- **`index.tsx`** — Dashboard for focal points:
  - Shows their organization's quota and remaining slots
  - List of sent invites with status
  - Button to send new invitation
- **`invite.tsx`** — Send invitation form:
  - Email input (validate format)
  - Optional: delegate name, title
  - Remaining slots indicator
- **`accept.tsx`** — Invite acceptance page:
  - Token validation
  - Show event info, organization, quota status
  - Accept button → marks invite as accepted, increments usedCount
  - If expired: show message with contact info
  - If already accepted: show confirmation

### 5. Self-Registration Flow

After accepting an invitation:

- Redirect delegate to a registration form (pre-filled with email)
- Create Participant record linked to the organization/event
- Associate with appropriate workflow

### 6. Notifications

- Focal point receives notification when delegate accepts
- Admin receives notification when quota reaches 80% and 100%
- Publish SSE events for real-time updates

### 7. Feature Flag Gate

All delegation features gated behind `FF_DELEGATION_PORTAL`:

- Admin delegation tab hidden when disabled
- Focal point portal returns 404 when disabled
- Invite acceptance page shows "feature not available"

---

## Acceptance Criteria

- [ ] Admin can create/edit/delete quotas per organization per event
- [ ] Focal point can send invitation emails (token-based links)
- [ ] Delegates can accept invitations via link
- [ ] Quota enforced: cannot invite beyond max participants
- [ ] `usedCount` incremented atomically on acceptance
- [ ] Expired invites cannot be accepted
- [ ] Focal point dashboard shows quota usage and invite statuses
- [ ] Notifications sent on acceptance and quota thresholds
- [ ] Feature flag `FF_DELEGATION_PORTAL` gates the feature
- [ ] Unit tests for quota enforcement and token validation (≥6 test cases)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
