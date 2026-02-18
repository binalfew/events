# P5-03: Catering & Meal Management

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Task ID**            | P5-03                                                |
| **Phase**              | 5 — Event Operations & Logistics                     |
| **Category**           | Logistics                                            |
| **Suggested Assignee** | Backend Developer                                    |
| **Depends On**         | P5-00 (Foundation Models)                            |
| **Blocks**             | —                                                    |
| **Estimated Effort**   | 4 days                                               |
| **Module References**  | [Module 11](../../modules/11-LOGISTICS-AND-VENUE.md) |

---

## Context

Event catering involves meal planning across multiple days, tracking dietary requirements (halal, kosher, vegetarian, allergies), generating aggregated order sheets for caterers, and issuing meal vouchers for access control. The `MealPlan`, `MealSession`, and `MealVoucher` models were created in P5-00.

---

## Deliverables

### 1. Catering Service

Create `app/services/catering.server.ts`:

- `createMealPlan(input, ctx)` — Define meal plan for event (days, meal types, venues)
- `createMealSession(input, ctx)` — Individual meal session (date, type, venue, capacity, menu)
- `updateDietaryRequirements(participantId, requirements, ctx)` — Store dietary needs
- `getDietaryAggregation(eventId, tenantId, mealSessionId?)` — Count by dietary category
- `issueMealVoucher(participantId, mealSessionId, ctx)` — Generate voucher with QR code
- `redeemMealVoucher(voucherId, ctx)` — Mark voucher as used at meal point
- `getMealDashboard(eventId, tenantId)` — Meal counts, dietary breakdown, voucher redemption rates
- `exportCateringSheet(eventId, tenantId, date?)` — Export for caterer (headcount by meal + dietary)

### 2. Zod Schemas

Create `app/lib/schemas/catering.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/catering.tsx`:

- Meal plan editor, dietary aggregation dashboard, voucher management, caterer export

### 4. Tests

Create `app/services/__tests__/catering.server.test.ts` — ≥8 test cases

---

## Acceptance Criteria

- [ ] Meal plans with multi-day scheduling and venue assignment
- [ ] Dietary requirement tracking per participant with aggregation
- [ ] Meal voucher generation with QR code
- [ ] Voucher redemption tracking (prevent double-use)
- [ ] Catering sheet export for vendors
- [ ] Feature flag `FF_CATERING` gates all functionality
- [ ] Event card shows "Catering" link in Logistics section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥8 new test cases)
