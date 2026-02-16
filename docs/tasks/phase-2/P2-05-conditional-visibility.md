# P2-05: Conditional Visibility Rules

| Field                  | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Task ID**            | P2-05                                                                        |
| **Phase**              | 2 — Visual Form Designer + UX                                                |
| **Category**           | Form Designer                                                                |
| **Suggested Assignee** | Senior Frontend Developer + Backend Developer                                |
| **Depends On**         | P2-03 (Sections & Pages)                                                     |
| **Blocks**             | —                                                                            |
| **Estimated Effort**   | 6 days                                                                       |
| **Module References**  | [Module 03 §Conditions](../../modules/03-VISUAL-FORM-DESIGNER.md#conditions) |

---

## Context

Forms often need to show/hide fields based on other field values (e.g., show "Weapon Permit Number" only when "Carries Weapon" is true). This task adds a visual condition builder to the designer and a runtime evaluator for form rendering.

---

## Deliverables

### 1. Condition Data Model

Add to `FormFieldPlacement`, `FormSection`, and `FormPage` types:

```typescript
type VisibilityCondition = {
  id: string;
  fieldId: string; // the field to evaluate
  operator: ConditionOperator;
  value: unknown; // expected value
  logicalOperator?: "AND" | "OR"; // for compound conditions
};

type ConditionOperator =
  | "eq"
  | "neq" // equals, not equals
  | "gt"
  | "gte" // greater than, greater or equal
  | "lt"
  | "lte" // less than, less or equal
  | "contains" // string contains
  | "in"
  | "notIn" // value in array
  | "isEmpty"
  | "isNotEmpty";
```

### 2. Condition Builder Component

Create `app/components/form-designer/ConditionBuilder.tsx`:

- Field selector dropdown (available fields in the form)
- Operator selector (operators filtered by field type)
- Value input (type-appropriate: text, select, date, number, boolean)
- Add condition button (AND/OR)
- Remove condition button per row
- Visual preview: "Show when [Field] [is equal to] [Value]"

### 3. Condition Evaluator

Create `app/lib/condition-evaluator.ts`:

- `evaluateConditions(conditions, formValues)` → boolean
- Support all operators listed above
- Short-circuit AND/OR evaluation
- Handle missing field values gracefully (treat as not matching)
- Pure function — usable on both client and server

### 4. Designer Integration

- Condition icon on field/section/page cards when conditions are set
- "Visibility" tab in properties panel opens condition builder
- Conditions stored in the form definition JSONB

### 5. Form Renderer Integration

Update `FieldRenderer` and `FieldSection` components:

- Evaluate conditions on each render pass using current form values
- Hide fields/sections/pages that don't meet conditions
- Hidden fields excluded from validation (don't require hidden required fields)

---

## Acceptance Criteria

- [ ] Condition builder UI renders with field, operator, value selectors
- [ ] Operators filtered by field type (e.g., no "contains" for numbers)
- [ ] Compound AND/OR conditions work
- [ ] Condition evaluator passes all unit tests
- [ ] Form renderer hides fields when conditions not met
- [ ] Hidden required fields don't block form submission
- [ ] Conditions persist in form definition JSONB
- [ ] No circular condition dependencies (field A depends on field B which depends on A)
- [ ] Visual indicator on conditional fields/sections in designer
