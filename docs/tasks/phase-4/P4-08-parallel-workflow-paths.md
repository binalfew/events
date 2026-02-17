# P4-08: Parallel Workflow Paths

| Field                  | Value                                            |
| ---------------------- | ------------------------------------------------ |
| **Task ID**            | P4-08                                            |
| **Phase**              | 4 — Ecosystem & Integrations                     |
| **Category**           | Core                                             |
| **Suggested Assignee** | Senior Backend Developer                         |
| **Depends On**         | P4-00 (Foundation Models)                        |
| **Blocks**             | —                                                |
| **Estimated Effort**   | 5 days                                           |
| **Module References**  | [Module 04](../../modules/04-WORKFLOW-ENGINE.md) |

---

## Context

Some accreditation workflows require parallel reviews — e.g., a participant must be approved by both the Protocol Office and the Security Team simultaneously before proceeding. The workflow engine already supports `FORK` and `JOIN` step types and conditional routing. This task implements the fork/join execution logic: splitting a participant into parallel branches at a FORK step, tracking independent progress on each branch via the `ParallelBranch` model (created in P4-00), and converging at a JOIN step with configurable join strategies (ALL, ANY, MAJORITY).

---

## Deliverables

### 1. Fork Execution Service

Extend `app/services/workflow-engine/navigation.server.ts`:

```typescript
// Execute a FORK step — creates parallel branches
function executeFork(
  participantId: string,
  forkStep: Step,
  ctx: WorkflowContext,
): Promise<ParallelBranch[]>;
```

Fork behavior:

1. Read `forkStep.config.branches` — array of `{ branchStepId: string, label?: string }`
2. Create a `ParallelBranch` record for each branch with status `PENDING`
3. Set participant status to `INPROGRESS` (they're being processed in parallel)
4. Each branch operates independently — the participant effectively exists at multiple steps

```typescript
// Step config for FORK type:
interface ForkConfig {
  branches: {
    branchStepId: string; // first step of this branch
    label?: string; // e.g., "Protocol Review", "Security Check"
  }[];
  joinStepId: string; // the JOIN step where branches converge
}
```

### 2. Branch Processing

Extend the workflow engine to handle actions on parallel branches:

```typescript
// Process an action on a specific branch (not the participant's main currentStepId)
function processBranchAction(
  participantId: string,
  branchStepId: string,
  action: ApprovalAction,
  ctx: WorkflowContext,
): Promise<ParallelBranch>;
```

When an action is taken on a branch step:

1. Find the `ParallelBranch` record for this participant + forkStepId + branchStepId
2. Update branch status: `PENDING` → `COMPLETED` (for APPROVE) or `REJECTED` (for REJECT)
3. Record `completedAt`, `completedBy`, `action`, `remarks`
4. Create audit log entry with branch context
5. Check if JOIN conditions are met (see below)

### 3. Join Evaluation Service

Create `app/services/workflow-engine/join-evaluator.server.ts`:

```typescript
type JoinStrategy = "ALL" | "ANY" | "MAJORITY";

interface JoinConfig {
  strategy: JoinStrategy;
  timeoutMinutes?: number; // auto-advance after timeout
  timeoutAction?: "APPROVE" | "REJECT" | "ESCALATE";
}

// Check if join conditions are satisfied
function evaluateJoin(
  participantId: string,
  forkStepId: string,
  joinConfig: JoinConfig,
): Promise<{ satisfied: boolean; action: string; summary: JoinSummary }>;
```

Join strategies:

- **ALL**: Every branch must complete with APPROVE → participant advances
- **ANY**: At least one branch completes with APPROVE → participant advances
- **MAJORITY**: More than half of branches complete with APPROVE → participant advances

If the join is satisfied:

1. Set participant `currentStepId` to the step after the JOIN
2. Update participant status based on the aggregated result
3. Emit `parallel.joined` domain event

If any branch rejects (depending on strategy):

- ALL: one rejection → participant rejected (fail-fast)
- ANY: all rejections → participant rejected
- MAJORITY: majority rejections → participant rejected

### 4. Branch Timeout Handler

Create `app/services/workflow-engine/branch-timeout.server.ts`:

```typescript
// Check for timed-out branches and apply timeout action
function processTimedOutBranches(): Promise<void>;
```

- If `joinConfig.timeoutMinutes` is set and a branch has been `PENDING` beyond the timeout
- Apply `timeoutAction` (default: ESCALATE) to the timed-out branch
- Re-evaluate join condition after timeout processing

### 5. Parallel Branch UI

Create components:

- `app/components/workflow/parallel-branch-view.tsx`:
  - Shows all active branches for a participant at a fork
  - Each branch: step name, assignee, status, duration
  - Color coding: green (completed), yellow (in progress), gray (pending), red (rejected)
  - Timeline view showing parallel execution

- `app/components/workflow/branch-action-panel.tsx`:
  - When a reviewer opens a participant at a branch step
  - Shows which branch they're acting on (with label)
  - Standard action buttons (Approve/Reject) scoped to this branch
  - Other branch statuses visible as read-only context

### 6. Workflow Designer Integration

Extend the workflow visual designer:

- FORK step node: diamond shape with multiple outgoing edges
- JOIN step node: diamond shape with multiple incoming edges
- When adding a FORK step:
  - Branch configuration panel: add/remove branches with labels
  - Each branch points to its first step
  - Must specify JOIN step where branches converge
- When adding a JOIN step:
  - Strategy selector: ALL / ANY / MAJORITY
  - Timeout configuration: minutes + action
- Visual: parallel branches shown side-by-side between FORK and JOIN nodes

### 7. Navigation Service Updates

Update `app/services/workflow-engine/navigation.server.ts`:

- `getNextStep()`: When current step is FORK, return all branch first steps (not a single next step)
- `getCurrentStepInfo()`: When participant is in parallel, return all active branches
- `canAdvance()`: Check if participant is in a parallel fork and use join evaluator

### 8. Participant Detail Integration

Update participant detail view:

- When participant is at a FORK, show parallel branch progress panel
- Each branch shows current step, assignee, and status
- Join status indicator: "Waiting for X more branch(es) to complete"

---

## Acceptance Criteria

- [ ] FORK step creates parallel branches with individual tracking
- [ ] Each branch can be independently approved/rejected by different reviewers
- [ ] JOIN with ALL strategy requires all branches to approve
- [ ] JOIN with ANY strategy advances on first branch approval
- [ ] JOIN with MAJORITY strategy requires > 50% branch approvals
- [ ] Branch timeout auto-applies configured action after deadline
- [ ] Parallel branch view shows all branches with status and timeline
- [ ] Workflow designer supports adding FORK/JOIN steps with branch configuration
- [ ] Participant detail shows parallel progress when at a fork
- [ ] Audit trail records per-branch actions with fork context
- [ ] Domain events emitted: `parallel.forked`, `parallel.joined`
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for fork execution, join evaluation (ALL/ANY/MAJORITY), timeout (≥10 test cases)
