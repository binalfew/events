# P1-07: Workflow Versioning

| Field                  | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| **Task ID**            | P1-07                                                        |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                        |
| **Category**           | Core / Workflow Engine                                       |
| **Suggested Assignee** | Senior Backend Engineer                                      |
| **Depends On**         | P1-00                                                        |
| **Blocks**             | P1-08 (SLA Enforcement)                                      |
| **Estimated Effort**   | 3 days                                                       |
| **Module References**  | [Module 04 §Versioning](../../modules/04-WORKFLOW-ENGINE.md) |

---

## Context

When an admin edits a live workflow (adds/removes steps, changes routing), participants already in-flight could be disrupted — their current step might disappear or routing could change unexpectedly. Workflow versioning solves this by snapshotting the workflow structure when participants enter it. In-flight participants follow their entry-point version while new participants get the latest version.

---

## Deliverables

### 1. Workflow Serializer (`app/services/workflow-engine/serializer.server.ts`)

Functions to serialize and deserialize a workflow structure for snapshotting:

```typescript
interface WorkflowSnapshot {
  id: string;
  name: string;
  steps: StepSnapshot[];
}

interface StepSnapshot {
  id: string;
  name: string;
  stepType: StepType;
  sortOrder: number;
  isEntryPoint: boolean;
  isFinalStep: boolean;
  nextStepId: string | null;
  rejectionTargetId: string | null;
  bypassTargetId: string | null;
  conditions: unknown;
  slaDurationMinutes: number | null;
  slaWarningMinutes: number | null;
  slaAction: SLAAction | null;
  escalationTargetId: string | null;
  assignedRoleId: string | null;
}

/**
 * Serialize a workflow and its steps into a JSON snapshot.
 */
export function serializeWorkflow(workflow: Workflow & { steps: Step[] }): WorkflowSnapshot;

/**
 * Deserialize a workflow snapshot back into a usable structure.
 */
export function deserializeWorkflow(snapshot: unknown): WorkflowSnapshot;

/**
 * Compute a deterministic hash of a workflow's structure.
 * Used to detect whether a workflow has changed since the last version.
 */
export function computeWorkflowHash(workflow: Workflow & { steps: Step[] }): string;
```

### 2. Version Management (`app/services/workflow-engine/versioning.server.ts`)

```typescript
/**
 * Create a new version snapshot if the workflow has changed since the last one.
 * Returns the version (existing or newly created).
 */
export async function ensureCurrentVersion(workflowId: string): Promise<WorkflowVersion>;

/**
 * Get the version a participant should follow.
 * If the participant already has a version, return it.
 * Otherwise, assign the current version.
 */
export async function getParticipantVersion(participantId: string): Promise<WorkflowSnapshot>;

/**
 * Force-create a new version (used when admin explicitly publishes).
 */
export async function publishWorkflowVersion(workflowId: string): Promise<WorkflowVersion>;

/**
 * List all versions of a workflow with metadata.
 */
export async function listWorkflowVersions(workflowId: string): Promise<
  Array<{
    id: string;
    version: number;
    createdAt: Date;
    participantCount: number; // How many participants are on this version
  }>
>;
```

### 3. Workflow Entry (`app/services/workflow-engine/entry.server.ts`)

When a participant enters a workflow (e.g., on registration approval), snapshot the current version:

```typescript
/**
 * Enter a participant into a workflow.
 * 1. Ensure a current version exists (snapshot if needed)
 * 2. Find the entry-point step
 * 3. Assign the participant to the version and entry step
 * 4. Create an audit log entry
 */
export async function enterWorkflow(
  participantId: string,
  workflowId: string,
  userId: string, // Who initiated the entry
): Promise<{ versionId: string; stepId: string }>;
```

**Logic:**

1. Call `ensureCurrentVersion(workflowId)` to get/create the latest snapshot
2. Deserialize the snapshot to find the entry-point step (`isEntryPoint === true`)
3. Update the participant: `workflowVersionId`, `stepId`, `status = PENDING`
4. Create an Approval record: `action = "ENTER_WORKFLOW"`
5. Log to AuditLog

### 4. Step Navigation (`app/services/workflow-engine/navigation.server.ts`)

Navigate participants through the workflow using their versioned snapshot:

```typescript
/**
 * Process a workflow action on a participant.
 * Uses the participant's workflow version to determine routing.
 */
export async function processWorkflowAction(
  participantId: string,
  userId: string,
  action: ApprovalAction, // APPROVE, REJECT, BYPASS, RETURN, ESCALATE
  comment?: string,
): Promise<{
  previousStepId: string;
  nextStepId: string | null;
  isComplete: boolean;
}>;
```

**Logic:**

1. Load the participant with their `workflowVersion`
2. Deserialize the version snapshot
3. Find the participant's current step in the snapshot
4. Based on the action, determine the next step:
   - APPROVE → `nextStepId`
   - REJECT → `rejectionTargetId`
   - BYPASS → `bypassTargetId`
   - RETURN → previous step (from approval history)
   - ESCALATE → `escalationTargetId`
5. If next step is null and current step is `isFinalStep`, mark workflow as complete
6. Update participant: `stepId`, `status`
7. Create Approval record
8. Log to AuditLog

### 5. Version Comparison (`app/services/workflow-engine/versioning.server.ts`)

```typescript
/**
 * Compare two workflow versions and return the differences.
 * Used to show admins what changed between versions.
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string,
): Promise<{
  addedSteps: string[];
  removedSteps: string[];
  modifiedSteps: Array<{
    stepId: string;
    changes: Record<string, { before: unknown; after: unknown }>;
  }>;
}>;
```

### 6. Tests

Write tests for:

- Serializing and deserializing a workflow preserves all step data
- `computeWorkflowHash` produces different hashes for different workflows
- `computeWorkflowHash` produces the same hash for equivalent workflows (deterministic)
- `ensureCurrentVersion` creates a new version only when the workflow changed
- `ensureCurrentVersion` returns the existing version when nothing changed
- `enterWorkflow` assigns the correct version and entry step
- `processWorkflowAction` routes correctly for APPROVE, REJECT, BYPASS
- Participant follows their version even after workflow is edited
- Multiple participants can be on different versions simultaneously
- `compareVersions` correctly identifies added, removed, and modified steps
- Final step completion marks participant as complete

---

## Acceptance Criteria

- [ ] Publishing a workflow creates a version snapshot in WorkflowVersion
- [ ] Entering a participant into a workflow assigns the current version
- [ ] Editing a workflow after participants enter creates a new version for new entrants
- [ ] In-flight participants continue following their original version
- [ ] APPROVE/REJECT/BYPASS/RETURN/ESCALATE navigate to the correct next step
- [ ] Final step completion updates participant status appropriately
- [ ] Version history is queryable with participant counts per version
- [ ] Version comparison shows added/removed/modified steps
- [ ] All actions are recorded in Approval and AuditLog tables
- [ ] `npm run typecheck` passes with zero errors
- [ ] Unit tests cover all versioning and navigation scenarios
