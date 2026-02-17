# P3-02: Conditional Workflow Routing

| Field                  | Value                                            |
| ---------------------- | ------------------------------------------------ |
| **Task ID**            | P3-02                                            |
| **Phase**              | 3 — Advanced Features                            |
| **Category**           | Workflow                                         |
| **Suggested Assignee** | Backend Developer                                |
| **Depends On**         | P3-00                                            |
| **Blocks**             | P3-04 (Auto-Action Rules)                        |
| **Estimated Effort**   | 5 days                                           |
| **Module References**  | [Module 04](../../modules/04-WORKFLOW-ENGINE.md) |

---

## Context

The workflow engine currently supports fixed routing: each step has a single `nextStepId`, `rejectionTargetId`, etc. Step model already has a `config` Json field that can store `conditionExpression`. The `evaluateCondition()` function from `app/lib/condition-evaluator.ts` already supports eq/neq/gt/lt/gte/lte/contains/in/notIn with compound AND/OR logic. This task extends the navigation service to evaluate conditions on transitions, enabling branching workflows (e.g., VIP participants skip review, rejected participants loop back differently).

---

## Deliverables

### 1. Conditional Route Evaluation

Extend `app/services/workflow-engine/navigation.server.ts`:

- Before using `currentStep.nextStepId`, check for conditional routes in `step.config.conditionalRoutes`
- Each conditional route: `{ condition: VisibilityCondition, targetStepId: string, priority: number }`
- Evaluate conditions against participant data (fixed fields + extras) using existing `evaluateCondition()`
- First matching condition (by priority) determines the target step
- If no condition matches, fall back to the default `nextStepId`

```typescript
interface ConditionalRoute {
  id: string;
  condition: VisibilityCondition;
  targetStepId: string;
  priority: number;
  label?: string;
}

// In step.config:
{
  conditionalRoutes?: ConditionalRoute[];
}
```

### 2. Route Resolution Helper

Create helper function `resolveNextStep()` in navigation service:

```typescript
function resolveNextStep(
  step: StepSnapshot,
  action: ApprovalAction,
  participantData: Record<string, unknown>,
): string | null;
```

- For APPROVE/PRINT: check `conditionalRoutes` first, fall back to `nextStepId`
- For REJECT: check `rejectionConditionalRoutes` first, fall back to `rejectionTargetId`
- For BYPASS: use `bypassTargetId` (no conditions — bypass is explicit)
- For ESCALATE: use `escalationTargetId` (no conditions — escalation is explicit)
- For RETURN: keep existing behavior (last approval step)

### 3. Condition Editor Component

Create `app/components/workflow-designer/condition-editor.tsx`:

- Reusable component for building conditions on workflow edges
- Field selector: lists all participant fields (fixed + dynamic via FieldDefinition)
- Operator selector: uses `getOperatorsForType()` from condition-evaluator
- Value input: appropriate control based on field type (text, number, select, etc.)
- Compound conditions: add/remove conditions with AND/OR toggle
- Preview: human-readable description of the condition

### 4. Workflow Designer Integration

Integrate condition editor into the workflow step configuration panel:

- "Conditional Routes" section in step config
- Add/remove conditional routes per step
- Each route: condition builder + target step selector + priority input
- Visual indicator on edges: diamond icon for conditional, different color
- Tooltip on conditional edges showing condition summary

### 5. Serializer Update

Update `app/services/workflow-engine/serializer.server.ts`:

- Include `conditionalRoutes` in step snapshot when serializing workflow version
- Deserialize back when loading snapshot for navigation

### 6. Feature Flag Gate

All conditional routing features gated behind `FF_CONDITIONAL_ROUTING`:

- Navigation service skips condition evaluation when disabled (uses default routing)
- Condition editor hidden in workflow designer

---

## Acceptance Criteria

- [ ] Conditional routes evaluate against participant data on step transition
- [ ] First matching condition (by priority) determines target step
- [ ] Default route used when no condition matches
- [ ] Condition editor allows building compound conditions with AND/OR
- [ ] Conditional edges visually distinct in workflow designer
- [ ] Workflow version snapshot includes conditional routes
- [ ] Feature flag `FF_CONDITIONAL_ROUTING` gates the feature
- [ ] Existing navigation tests still pass (backward compatible)
- [ ] New unit tests for condition-based routing (≥5 test cases)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
