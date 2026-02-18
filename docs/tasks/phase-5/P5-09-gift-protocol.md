# P5-09: Gift Protocol & Welcome Packages

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Task ID**            | P5-09                                                   |
| **Phase**              | 5 — Event Operations & Logistics                        |
| **Category**           | Protocol                                                |
| **Suggested Assignee** | Backend Developer                                       |
| **Depends On**         | P5-00 (Foundation Models)                               |
| **Blocks**             | —                                                       |
| **Estimated Effort**   | 3 days                                                  |
| **Module References**  | [Module 12](../../modules/12-PROTOCOL-AND-DIPLOMACY.md) |

---

## Context

Diplomatic events provide welcome packages and protocol gifts differentiated by rank (heads of state receive different gifts than delegates). Protocol teams need to manage a gift registry, assemble packages by rank/type, track delivery, and handle special requests. The `GiftItem`, `WelcomePackage`, and `GiftDelivery` models were created in P5-00.

---

## Deliverables

### 1. Gift Protocol Service

Create `app/services/gift-protocol.server.ts`:

- `createGiftItem(input, ctx)` — Define gift item (name, description, unit cost, stock quantity, image)
- `listGiftItems(tenantId)` — Gift inventory with stock levels
- `updateStock(itemId, quantity, ctx)` — Adjust stock (add/remove)
- `createWelcomePackage(input, ctx)` — Define package template (name, rank/type eligibility, items list)
- `listWelcomePackages(eventId, tenantId)` — Package templates with item counts
- `assignPackage(participantId, packageId, ctx)` — Create delivery record
- `bulkAssignPackages(eventId, tenantId, ctx)` — Auto-assign packages by participant rank/type
- `markAssembled(deliveryId, ctx)` — Mark package as assembled
- `markDelivered(deliveryId, ctx)` — Mark as delivered with timestamp
- `getDeliveryDashboard(eventId, tenantId)` — Pending/assembled/delivered counts, completion rate

### 2. Zod Schemas

Create `app/lib/schemas/gift-protocol.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/gifts.tsx`:

- Gift inventory, package templates, delivery tracking dashboard, bulk assign

### 4. Tests

Create `app/services/__tests__/gift-protocol.server.test.ts` — ≥8 test cases

---

## Acceptance Criteria

- [ ] Gift item inventory with stock tracking
- [ ] Welcome package templates with rank/type eligibility
- [ ] Individual and bulk package assignment
- [ ] Delivery lifecycle: PENDING → ASSEMBLED → DELIVERED
- [ ] Stock decrements on package assignment
- [ ] Delivery dashboard with completion metrics
- [ ] Event card shows "Gifts" link in Protocol section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥8 new test cases)
