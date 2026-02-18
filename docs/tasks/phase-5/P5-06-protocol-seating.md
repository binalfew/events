# P5-06: Protocol & Seating Management

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Task ID**            | P5-06                                                   |
| **Phase**              | 5 — Event Operations & Logistics                        |
| **Category**           | Protocol                                                |
| **Suggested Assignee** | Senior Frontend Developer                               |
| **Depends On**         | P5-00 (Foundation Models), P5-05 (Venue & Floor Plans)  |
| **Blocks**             | —                                                       |
| **Estimated Effort**   | 5 days                                                  |
| **Module References**  | [Module 12](../../modules/12-PROTOCOL-AND-DIPLOMACY.md) |

---

## Context

Diplomatic events require rank-based seating: heads of state and ministers must be seated according to protocol hierarchy, bilateral relationship conflicts must be avoided, and seating plans must be visually designable. The `SeatingPlan`, `SeatingAssignment`, and `SeatingConflict` models were created in P5-00.

---

## Deliverables

### 1. Seating Service

Create `app/services/seating.server.ts`:

- `createSeatingPlan(input, ctx)` — Plan for specific session/room (name, room, layout type, seat count)
- `listSeatingPlans(eventId, tenantId)` — Plans with assignment progress
- `assignSeat(planId, seatNumber, participantId, ctx)` — Manual seat assignment
- `unassignSeat(planId, seatNumber, ctx)` — Remove assignment
- `autoAssignSeating(planId, strategy, ctx)` — Auto-assign by rank hierarchy (SeatingPriority enum)
- `addConflict(participantAId, participantBId, reason, ctx)` — Define conflict pair
- `validateSeating(planId)` — Check for rank violations and conflict adjacencies
- `getSeatingPlan(planId, tenantId)` — Full plan with all assignments and conflicts
- `exportSeatingChart(planId)` — Export as printable layout

### 2. Zod Schemas

Create `app/lib/schemas/seating.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/seating.tsx`:

- Seating plan list, visual seat grid/table layout, drag-and-drop assignment
- Conflict warnings, rank violation alerts, auto-assign button
- Feature flag: `FF_PROTOCOL_SEATING`

### 4. Tests

Create `app/services/__tests__/seating.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Seating plans with configurable layouts (table, theater, U-shape, classroom)
- [ ] Manual seat assignment and unassignment
- [ ] Auto-assign respects rank hierarchy (HEAD_OF_STATE > MINISTER > AMBASSADOR > ...)
- [ ] Conflict pairs prevent adjacent seating
- [ ] Validation reports rank violations and conflict adjacencies
- [ ] Visual seating grid with drag-and-drop
- [ ] Feature flag `FF_PROTOCOL_SEATING` gates all functionality
- [ ] Event card shows "Seating" link in Protocol section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
