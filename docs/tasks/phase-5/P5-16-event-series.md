# P5-16: Event Series & YoY Analytics

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Task ID**            | P5-16                                                   |
| **Phase**              | 5 — Event Operations & Logistics                        |
| **Category**           | Core                                                    |
| **Suggested Assignee** | Backend Developer                                       |
| **Depends On**         | P5-00 (Foundation Models)                               |
| **Blocks**             | —                                                       |
| **Estimated Effort**   | 4 days                                                  |
| **Module References**  | [Module 16](../../modules/16-PARTICIPANT-EXPERIENCE.md) |

---

## Context

Recurring events (e.g., annual AU Summit) benefit from series-level management: linking editions, comparing metrics year-over-year, and carrying forward configurations and participant data. The `EventSeries` and `EventEdition` models already exist from P4-00/P4-10 (event cloning). This task adds YoY analytics, cross-edition comparison dashboards, and the carry-forward pipeline for returning participants.

---

## Deliverables

### 1. Event Series Service

Create `app/services/event-series.server.ts`:

- `createSeries(input, ctx)` — Create event series (name, description)
- `listSeries(tenantId)` — All series with edition counts
- `getSeries(id, tenantId)` — Series with all editions and summary metrics
- `addEdition(seriesId, eventId, editionNumber, year, ctx)` — Link event to series as edition
- `removeEdition(editionId, ctx)` — Unlink event from series
- `getYoYComparison(seriesId, tenantId, metrics?)` — Year-over-year comparison:
  - Registration counts by status (approved, rejected, pending)
  - Delegation participation (countries, organizations)
  - Processing times (average time to approval)
  - Check-in rates
  - Accommodation utilization
  - Survey satisfaction scores
- `getEditionTrends(seriesId, tenantId)` — Trend lines across editions for key metrics
- `identifyReturningParticipants(sourceEditionId, targetEditionId)` — Match participants by email across editions
- `generateCarryForwardData(sourceParticipantId)` — Extract participant data for pre-fill (name, passport, org, dietary, etc.)

### 2. Zod Schemas

Create `app/lib/schemas/event-series.ts`

### 3. Admin UI Routes

Create `app/routes/admin/series/index.tsx` — Series list page
Create `app/routes/admin/series/$seriesId.tsx` — Series detail with:

- Edition timeline
- YoY comparison charts (registration, delegation, processing time)
- Trend lines across editions
- Returning participant identification
- Link to clone wizard for creating next edition

### 4. Navigation

Add "Event Series" link to the Management section in `app/config/navigation.ts`

### 5. Tests

Create `app/services/__tests__/event-series.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Series CRUD with edition linking
- [ ] YoY comparison for registration, delegation, processing, check-in metrics
- [ ] Trend lines across 3+ editions
- [ ] Returning participant identification by email matching
- [ ] Carry-forward data extraction for pre-fill
- [ ] Series list accessible from Management sidebar
- [ ] Edition timeline visualization
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
