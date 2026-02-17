# P3-03: Step Assignment & Reassignment

| Field                  | Value                                            |
| ---------------------- | ------------------------------------------------ |
| **Task ID**            | P3-03                                            |
| **Phase**              | 3 — Advanced Features                            |
| **Category**           | Workflow                                         |
| **Suggested Assignee** | Backend Developer                                |
| **Depends On**         | P3-00                                            |
| **Blocks**             | P3-04 (Auto-Action Rules)                        |
| **Estimated Effort**   | 5 days                                           |
| **Module References**  | [Module 04](../../modules/04-WORKFLOW-ENGINE.md) |

---

## Context

Currently any user with the right role can act on any participant at any workflow step. For high-volume events, administrators need to assign specific reviewers to specific steps, with automatic load balancing. The `StepAssignment` model (created in P3-00) links users to steps with assignment strategies.

---

## Deliverables

### 1. Assignment Service

Create `app/services/step-assignment.server.ts`:

**Core functions:**

```typescript
// Assign a user to a step
assignStep(stepId: string, userId: string, strategy: AssignmentStrategy, assignedBy: string): Promise<StepAssignment>

// Reassign: deactivate old, create new
reassignStep(assignmentId: string, newUserId: string, reassignedBy: string): Promise<StepAssignment>

// Remove assignment (soft: set isActive = false)
unassignStep(assignmentId: string): Promise<void>

// Get all active assignments for a step
getStepAssignments(stepId: string): Promise<StepAssignment[]>

// Get all active assignments for a user
getUserAssignments(userId: string): Promise<StepAssignment[]>

// Get next assignee using strategy
getNextAssignee(stepId: string): Promise<string | null>
```

**Assignment strategies:**

- `MANUAL`: admin explicitly assigns; `getNextAssignee` returns null (manual selection required)
- `ROUND_ROBIN`: cycles through active assignees for the step; track last-assigned index in step config
- `LEAST_LOADED`: query current workload (count of IN_PROGRESS participants at step per user), assign to user with fewest

### 2. Integration with Navigation Service

Extend `processWorkflowAction()` in `app/services/workflow-engine/navigation.server.ts`:

- After determining the next step, check if the step has assignments
- If assignments exist and feature is enabled:
  - Use `getNextAssignee()` to determine the assigned reviewer
  - Store `assignedUserId` in participant metadata or approval context
  - Create notification for the assigned user ("You have a new participant to review")

### 3. Assignment UI — Step Config Panel

Add assignment configuration to workflow step settings:

- Assignment strategy dropdown: Manual / Round-Robin / Least-Loaded
- User list with add/remove for step assignees
- Show current load per user (count of active participants)

### 4. "My Assignments" View

Create `app/routes/admin/assignments.tsx`:

- List of participants assigned to the current user across all events
- Grouped by event → workflow → step
- Quick actions: approve, reject, view details
- Filter by status (pending, in-progress)
- Sort by SLA deadline (most urgent first)

### 5. Notifications

When a participant is assigned to a user (either by auto-assignment or manual):

- Create notification via `app/services/notifications.server.ts`
- Publish SSE event via `eventBus` (channel: `notifications`)

### 6. Feature Flag Gate

All assignment features gated behind `FF_STEP_ASSIGNMENT`:

- Navigation service skips assignment logic when disabled
- Assignment UI hidden in workflow designer
- "My Assignments" page returns empty or shows "feature disabled" message

---

## Acceptance Criteria

- [ ] Manual assignment: admin can assign users to steps
- [ ] Round-robin: assigns to next user in rotation
- [ ] Least-loaded: assigns to user with fewest active participants
- [ ] Reassignment: deactivates old, creates new assignment
- [ ] "My Assignments" page shows user's assigned participants
- [ ] Notification sent when participant assigned to user
- [ ] Navigation service respects assignments when feature is enabled
- [ ] Feature flag `FF_STEP_ASSIGNMENT` gates the feature
- [ ] Unit tests for each assignment strategy (≥3 test cases each)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
