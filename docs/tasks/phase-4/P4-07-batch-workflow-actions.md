# P4-07: Batch Workflow Actions

| Field                  | Value                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Task ID**            | P4-07                                                                                                             |
| **Phase**              | 4 — Ecosystem & Integrations                                                                                      |
| **Category**           | Core                                                                                                              |
| **Suggested Assignee** | Backend Developer                                                                                                 |
| **Depends On**         | P4-06 (Bulk Operations Framework)                                                                                 |
| **Blocks**             | —                                                                                                                 |
| **Estimated Effort**   | 4 days                                                                                                            |
| **Module References**  | [Module 04](../../modules/04-WORKFLOW-ENGINE.md), [Module 09](../../modules/09-REGISTRATION-AND-ACCREDITATION.md) |

---

## Context

Reviewers and admins frequently need to approve, reject, or bypass multiple participants at once (e.g., approve all VIP delegates, reject all incomplete applications). This task extends the bulk operations framework (P4-06) to support batch workflow actions. Each action goes through the existing workflow engine to ensure SLA tracking, audit logging, and webhook events are properly triggered. The workflow engine already supports `isBatchOperation` and `batchId` in its execution context.

---

## Deliverables

### 1. Batch Action Service

Create `app/services/batch-workflow-actions.server.ts`:

```typescript
interface BatchActionInput {
  eventId: string;
  tenantId: string;
  action: "APPROVE" | "REJECT" | "BYPASS" | "ARCHIVE" | "RETURN";
  participantIds: string[];
  remarks?: string;
  userId: string;
}

interface BatchActionResult {
  operationId: string;
  total: number;
  succeeded: number;
  failed: number;
  results: BatchItemResult[];
}

interface BatchItemResult {
  participantId: string;
  success: boolean;
  previousStatus?: string;
  newStatus?: string;
  error?: string;
}

// Execute batch action — processes through workflow engine
function executeBatchAction(input: BatchActionInput): Promise<BatchActionResult>;

// Dry run — simulate batch action without persisting
function dryRunBatchAction(input: BatchActionInput): Promise<BatchActionResult>;
```

Execution flow:

1. Create `BulkOperation` with type `BULK_APPROVE`, `BULK_REJECT`, or `BULK_BYPASS`
2. For each participant, call the workflow engine's `processAction()` with `isBatchOperation: true` and `batchId`
3. Each individual action triggers: status transition, audit log, SLA update, webhook events
4. Capture per-participant success/failure results
5. Update `BulkOperation` progress counters as each participant is processed
6. Process in batches of 20 to avoid overwhelming the database

Performance target: 100 participants processed in < 5 seconds.

### 2. Selection Service

Create `app/services/batch-selection.server.ts`:

```typescript
// Select participants by explicit IDs
function selectByIds(participantIds: string[], tenantId: string): Promise<string[]>;

// Select participants by filter criteria (same filters as participant list)
function selectByFilter(
  eventId: string,
  tenantId: string,
  filter: ParticipantFilter,
): Promise<string[]>;

// Validate that all selected participants are eligible for the action
function validateBatchEligibility(
  participantIds: string[],
  action: string,
): Promise<{ eligible: string[]; ineligible: { id: string; reason: string }[] }>;
```

Eligibility rules:

- APPROVE: participant must be at a step that allows APPROVE action
- REJECT: participant must be at a step that allows REJECT action
- BYPASS: participant must be at a step that allows BYPASS action
- ARCHIVE: participant must be in terminal state (APPROVED, REJECTED, etc.)
- RETURN: participant must be at a step with `returnTargetId` configured

### 3. Batch Action UI Components

Create components:

- `app/components/batch-actions/batch-action-bar.tsx`:
  - Sticky bar that appears when participants are selected (checkbox selection in participant list)
  - Shows selected count: "X participants selected"
  - Action buttons: Approve, Reject, Bypass (disabled if not all eligible)
  - "Select All" / "Select All Matching Filter" toggles
  - "Clear Selection" button

- `app/components/batch-actions/batch-confirmation-dialog.tsx`:
  - Shows action name and count
  - Remarks text area (optional, applies to all)
  - Eligibility summary: "X eligible, Y will be skipped (reason)"
  - Dry-run results preview (optional toggle)
  - "Confirm" and "Cancel" buttons

- `app/components/batch-actions/batch-progress-dialog.tsx`:
  - Progress bar with count (e.g., "45/100 processed")
  - Real-time success/failure counts
  - Per-participant result list (scrollable)
  - "Done" button when complete
  - Error summary with option to retry failed items

### 4. Participant List Integration

Extend existing participant list view:

- Add checkbox column to participant table
- Header checkbox for "select all on page" / "select all matching filter"
- Selection state persists across pagination
- Batch action bar appears when selection count > 0
- Filter-based selection: "Select all 523 participants matching current filter"

### 5. Keyboard Shortcuts

Add keyboard shortcuts for batch actions:

- `Ctrl+A` / `Cmd+A`: Select all on current page
- `Ctrl+Shift+A` / `Cmd+Shift+A`: Select all matching filter
- `Escape`: Clear selection

### 6. Audit Trail Integration

Each batch action creates:

- One `BulkOperation` record (parent)
- Individual `AuditLog` entries per participant (via workflow engine)
- `batchId` correlation across all individual audit entries
- Batch summary viewable in operation detail page

---

## Acceptance Criteria

- [ ] Batch approve/reject/bypass processes 100 participants in < 5 seconds
- [ ] Each individual action goes through the workflow engine (status transition, audit, SLA, webhooks)
- [ ] Dry-run mode simulates without persisting changes
- [ ] Eligibility check prevents invalid actions (e.g., approving already-approved)
- [ ] Ineligible participants skipped with clear reason displayed
- [ ] Checkbox selection in participant list with "select all" and filter-based selection
- [ ] Batch action bar shows selected count and available actions
- [ ] Confirmation dialog shows eligibility summary and optional remarks
- [ ] Progress dialog shows real-time processing with success/failure counts
- [ ] Batch operation recorded in bulk operations list with per-item results
- [ ] Audit trail links all individual actions to the batch via `batchId`
- [ ] Feature flag `FF_BULK_OPERATIONS` gates batch actions
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for batch execution, eligibility validation, selection service (≥8 test cases)
