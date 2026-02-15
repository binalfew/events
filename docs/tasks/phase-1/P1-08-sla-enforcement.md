# P1-08: SLA Enforcement

| Field                  | Value                                                 |
| ---------------------- | ----------------------------------------------------- |
| **Task ID**            | P1-08                                                 |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                 |
| **Category**           | Core / Workflow Engine                                |
| **Suggested Assignee** | Senior Backend Engineer                               |
| **Depends On**         | P1-07                                                 |
| **Blocks**             | None                                                  |
| **Estimated Effort**   | 3 days                                                |
| **Module References**  | [Module 04 §SLA](../../modules/04-WORKFLOW-ENGINE.md) |

---

## Context

Workflow steps can define SLA (Service Level Agreement) deadlines — the maximum time a participant should remain at a step before action is taken. When an SLA is breached, the system should automatically take a configured action: notify, escalate, auto-approve, auto-reject, or reassign. SLA enforcement requires a background job that periodically checks for overdue participants.

---

## Deliverables

### 1. SLA Checker Service (`app/services/workflow-engine/sla-checker.server.ts`)

The core background job logic that checks for SLA violations:

```typescript
interface SLACheckResult {
  checked: number; // Total participants checked
  warnings: number; // Approaching SLA deadline
  breached: number; // Past SLA deadline
  actions: SLAActionResult[];
}

interface SLAActionResult {
  participantId: string;
  stepId: string;
  action: SLAAction;
  success: boolean;
  error?: string;
}

/**
 * Check all active participants for SLA warnings and breaches.
 * This is the main function called by the background job.
 */
export async function checkOverdueSLAs(): Promise<SLACheckResult>;
```

**Logic:**

1. Query all participants with `status IN ('PENDING', 'INPROGRESS')` at steps that have `slaDurationMinutes` set
2. Include the participant's most recent Approval record (to determine when they arrived at the step)
3. For each participant:
   a. Calculate SLA deadline: `lastActionTime + slaDurationMinutes`
   b. Check warning threshold: if `slaWarningMinutes` is set and we're past the warning point but before breach
   c. Check breach: if current time is past the SLA deadline
4. For warnings: send notification (but don't take action)
5. For breaches: execute the configured `slaAction`

### 2. SLA Action Executor (`app/services/workflow-engine/sla-checker.server.ts`)

```typescript
/**
 * Execute the configured SLA action for a breached participant.
 */
async function executeSLAAction(
  participant: ParticipantWithStepAndApprovals,
  overdueMinutes: number,
): Promise<SLAActionResult>;
```

**Action types:**

| SLAAction    | Behavior                                                             |
| ------------ | -------------------------------------------------------------------- |
| NOTIFY       | Send notification to step's assigned role. No state change.          |
| ESCALATE     | Move participant to `escalationTargetId` step. Log as SYSTEM action. |
| AUTO_APPROVE | Approve participant automatically. Move to next step.                |
| AUTO_REJECT  | Reject participant automatically. Move to rejection target.          |
| REASSIGN     | Reassign to the least-loaded validator at the current step.          |

All actions:

- Create an Approval record with `userId = "SYSTEM"` and a comment explaining the SLA breach
- Log to AuditLog with `action = "SLA_BREACH"`
- Use the workflow versioning system (P1-07) for step navigation

### 3. Background Job Scheduler (`app/services/jobs/sla-job.server.ts`)

A simple interval-based job runner (not using pg-boss initially — use `setInterval` or a cron-like scheduler):

```typescript
/**
 * Start the SLA check background job.
 * Runs every 5 minutes (configurable via SLA_CHECK_INTERVAL_MS env var).
 */
export function startSLACheckJob(): void;

/**
 * Stop the SLA check background job.
 * Called on server shutdown for graceful cleanup.
 */
export function stopSLACheckJob(): void;
```

**Integration with server startup:**

- Start the job in `server/index.ts` after the Express server starts
- Stop the job on `SIGTERM`/`SIGINT` for graceful shutdown
- Guard against running in test environments
- Log each run's results with the structured logger (Pino)

### 4. SLA Notification Service (`app/services/workflow-engine/sla-notifications.server.ts`)

```typescript
/**
 * Send SLA warning notification.
 * For Phase 1: log the notification (email integration deferred).
 */
export async function sendSLAWarningNotification(
  participant: Participant,
  step: Step,
  remainingMinutes: number,
): Promise<void>;

/**
 * Send SLA breach notification.
 */
export async function sendSLABreachNotification(
  participant: Participant,
  step: Step,
  overdueMinutes: number,
): Promise<void>;
```

Phase 1 implementation: log notifications to the structured logger and AuditLog. Email/SSE notifications will be added in Phase 2.

### 5. SLA Dashboard Data (`app/services/workflow-engine/sla-stats.server.ts`)

Query functions for displaying SLA metrics:

```typescript
/**
 * Get SLA statistics for a workflow.
 */
export async function getSLAStats(workflowId: string): Promise<{
  totalWithSLA: number;
  withinSLA: number;
  warningZone: number;
  breached: number;
  averageTimeAtStep: Record<string, number>; // stepId → avg minutes
}>;

/**
 * Get participants that are approaching or past their SLA deadline.
 */
export async function getOverdueParticipants(
  workflowId: string,
  options?: { stepId?: string; onlyBreached?: boolean },
): Promise<
  Array<{
    participant: Participant;
    step: Step;
    enteredAt: Date;
    deadline: Date;
    overdueMinutes: number;
    status: "warning" | "breached";
  }>
>;
```

### 6. Tests

Write tests for:

- Participants within SLA are not flagged
- Participants in warning zone (past warning threshold, before breach) trigger warnings
- Participants past SLA deadline trigger breach actions
- NOTIFY action sends notification but doesn't change participant state
- ESCALATE action moves participant to escalation target step
- AUTO_APPROVE action approves and moves to next step
- AUTO_REJECT action rejects and moves to rejection target
- REASSIGN action changes the assigned validator
- All actions create Approval records with SYSTEM user
- Job doesn't run in test environment
- Job handles errors gracefully (one participant failure doesn't block others)
- SLA stats return correct counts
- Overdue participants query returns correctly sorted results

---

## Acceptance Criteria

- [ ] Background job runs every 5 minutes (configurable)
- [ ] Participants past SLA deadline have the configured action executed
- [ ] SLA warnings are logged before the breach deadline
- [ ] NOTIFY, ESCALATE, AUTO_APPROVE, AUTO_REJECT, REASSIGN all work correctly
- [ ] All SLA actions create Approval records with `userId = "SYSTEM"`
- [ ] All SLA breaches are logged to AuditLog
- [ ] The job handles individual participant errors without crashing
- [ ] The job is skipped in test environments
- [ ] Graceful shutdown stops the job cleanly
- [ ] `getSLAStats()` returns accurate counts for dashboard display
- [ ] `getOverdueParticipants()` returns participants sorted by urgency
- [ ] `npm run typecheck` passes with zero errors
- [ ] Unit tests cover all SLA actions and edge cases
