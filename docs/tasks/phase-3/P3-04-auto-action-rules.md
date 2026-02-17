# P3-04: Auto-Action Rules Engine

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Task ID**            | P3-04                                                |
| **Phase**              | 3 — Advanced Features                                |
| **Category**           | Workflow                                             |
| **Suggested Assignee** | Backend Developer                                    |
| **Depends On**         | P3-02 (Conditional Routing), P3-03 (Step Assignment) |
| **Blocks**             | None                                                 |
| **Estimated Effort**   | 5 days                                               |
| **Module References**  | [Module 04](../../modules/04-WORKFLOW-ENGINE.md)     |

---

## Context

Certain workflow steps can be automated: VIP participants auto-approved, incomplete applications auto-rejected, specific nationalities routed to specialized review. The `AutoActionRule` model (created in P3-00) stores conditions and actions per step. Rules are evaluated after assignment (P3-03) and use the same condition evaluator as conditional routing (P3-02).

---

## Deliverables

### 1. Auto-Action Service

Create `app/services/auto-action.server.ts`:

```typescript
// Evaluate all active rules for a step against participant data.
// Returns the first matching rule (by priority), or null if no match.
evaluateAutoActions(
  stepId: string,
  participantData: Record<string, unknown>,
): Promise<AutoActionRule | null>

// Execute the auto-action: call processWorkflowAction with system user
executeAutoAction(
  rule: AutoActionRule,
  participantId: string,
): Promise<{ previousStepId: string; nextStepId: string | null; isComplete: boolean }>

// CRUD operations
createRule(stepId: string, data: CreateRuleInput): Promise<AutoActionRule>
updateRule(ruleId: string, data: UpdateRuleInput): Promise<AutoActionRule>
deleteRule(ruleId: string): Promise<void>
listRules(stepId: string): Promise<AutoActionRule[]>
reorderRules(stepId: string, ruleIds: string[]): Promise<void>
```

**Rule evaluation logic:**

1. Load all active rules for the step, ordered by priority (ascending — lower number = higher priority)
2. For each rule, evaluate `conditionExpression` against participant data using `evaluateCondition()`
3. First matching rule wins (short-circuit)
4. If no rule matches, proceed to manual review (normal workflow)

**Auto-action mapping:**

| AutoActionType | ApprovalAction | Description                     |
| -------------- | -------------- | ------------------------------- |
| AUTO_APPROVE   | APPROVE        | Auto-approve and move to next   |
| AUTO_REJECT    | REJECT         | Auto-reject to rejection target |
| AUTO_BYPASS    | BYPASS         | Skip step to bypass target      |
| AUTO_ESCALATE  | ESCALATE       | Route to escalation target      |

### 2. Integration with Navigation Service

Extend `processWorkflowAction()` or create a pre-processing hook:

- When a participant arrives at a step (after transition), check for auto-action rules
- If a rule matches, execute the action immediately (recursive call or queued)
- Record the auto-action in the Approval table with `userId` set to a system user ID
- Auto-actions should chain: if auto-approve moves to next step, evaluate that step's rules too
- Add safety: max 10 chained auto-actions to prevent infinite loops

### 3. Audit Trail

For every auto-action execution:

- Create `Approval` record with remarks: `"Auto-action: {rule.name}"`
- Create `AuditLog` entry with metadata: `{ ruleId, ruleName, conditionExpression, actionType }`
- Publish SSE event for real-time dashboard visibility

### 4. Rules Management UI

Create `app/routes/admin/events/$eventId/workflows/$workflowId/rules.tsx`:

- List all auto-action rules for a workflow, grouped by step
- Add/edit rule form:
  - Name and description
  - Step selector
  - Condition builder (reuse from P3-02)
  - Action type selector (auto-approve, auto-reject, auto-bypass, auto-escalate)
  - Priority number (drag to reorder)
  - Active/inactive toggle
- Delete confirmation dialog
- Test rule: simulate evaluation against sample participant data

### 5. Feature Flag Gate

All auto-action features gated behind `FF_AUTO_ACTIONS`:

- Rule evaluation skipped when disabled
- Rules management UI hidden
- Existing rules preserved but not executed

---

## Acceptance Criteria

- [ ] Auto-action rules evaluate conditions against participant data
- [ ] First matching rule by priority determines the action
- [ ] Auto-actions execute the correct workflow transition (approve/reject/bypass/escalate)
- [ ] Chained auto-actions work (step A auto-approves → step B auto-approves → done)
- [ ] Max chain depth of 10 prevents infinite loops
- [ ] Approval record created for each auto-action with system user
- [ ] Audit log records auto-action execution with rule metadata
- [ ] Rules management UI supports CRUD and reordering
- [ ] Feature flag `FF_AUTO_ACTIONS` gates the feature
- [ ] Unit tests for rule evaluation, chaining, and loop prevention (≥8 test cases)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
