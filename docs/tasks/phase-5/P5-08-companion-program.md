# P5-08: Companion & Spouse Program

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Task ID**            | P5-08                                                   |
| **Phase**              | 5 — Event Operations & Logistics                        |
| **Category**           | Protocol                                                |
| **Suggested Assignee** | Backend Developer                                       |
| **Depends On**         | P5-00 (Foundation Models)                               |
| **Blocks**             | —                                                       |
| **Estimated Effort**   | 3 days                                                  |
| **Module References**  | [Module 12](../../modules/12-PROTOCOL-AND-DIPLOMACY.md) |

---

## Context

High-level diplomatic events often accommodate companions (spouses, aides, interpreters, security detail) with their own activity programs. Companions need lightweight registration linked to the primary participant, activity sign-ups, and badge generation. The `Companion` and `CompanionActivity` models were created in P5-00.

---

## Deliverables

### 1. Companion Service

Create `app/services/companion.server.ts`:

- `registerCompanion(input, ctx)` — Link companion to primary participant (name, type, dietary, notes)
- `listCompanions(eventId, tenantId, filters?)` — All companions with primary participant info
- `updateCompanion(companionId, input, ctx)` — Update companion details
- `removeCompanion(companionId, ctx)` — Remove companion registration
- `createActivity(input, ctx)` — Define companion activity (name, date, time, venue, capacity)
- `listActivities(eventId, tenantId)` — Activities with sign-up counts
- `signUpForActivity(companionId, activityId, ctx)` — Register companion for activity
- `cancelActivitySignUp(companionId, activityId, ctx)` — Remove sign-up
- `getCompanionBadgeData(companionId)` — Badge info for companion badge generation

### 2. Zod Schemas

Create `app/lib/schemas/companion.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/companions.tsx`:

- Companion registration, activity program management, sign-up tracking

### 4. Tests

Create `app/services/__tests__/companion.server.test.ts` — ≥8 test cases

---

## Acceptance Criteria

- [ ] Companion registration linked to primary participant
- [ ] Companion types: SPOUSE, FAMILY, AIDE, SECURITY, INTERPRETER
- [ ] Activity program creation with capacity limits
- [ ] Activity sign-up with capacity enforcement
- [ ] Companion badge data generation
- [ ] Event card shows "Companions" link in Protocol section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥8 new test cases)
