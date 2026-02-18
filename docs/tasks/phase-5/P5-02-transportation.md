# P5-02: Transportation & Logistics

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Task ID**            | P5-02                                                |
| **Phase**              | 5 — Event Operations & Logistics                     |
| **Category**           | Logistics                                            |
| **Suggested Assignee** | Backend Developer                                    |
| **Depends On**         | P5-00 (Foundation Models)                            |
| **Blocks**             | —                                                    |
| **Estimated Effort**   | 5 days                                               |
| **Module References**  | [Module 11](../../modules/11-LOGISTICS-AND-VENUE.md) |

---

## Context

Event transportation covers airport transfers (arrival/departure), inter-venue shuttles, and vehicle fleet management. Coordinators need to schedule transfers based on participant flight details, assign vehicles, track driver assignments, and handle no-shows. The `TransportRoute`, `Vehicle`, `Transfer`, and `TransferPassenger` models were created in P5-00.

---

## Deliverables

### 1. Transportation Service

Create `app/services/transportation.server.ts`:

- `createRoute(input, ctx)` — Define transport route (origin, destination, schedule, vehicle type)
- `listRoutes(eventId, tenantId)` — Routes with passenger counts
- `registerVehicle(input, ctx)` — Add vehicle to fleet (type, capacity, plate, driver)
- `listVehicles(eventId, tenantId)` — Fleet overview with current assignments
- `scheduleTransfer(input, ctx)` — Schedule individual transfer (participant, route, datetime, pickup)
- `bulkScheduleTransfers(eventId, participantIds, routeId, ctx)` — Batch scheduling from flight data
- `assignVehicle(transferId, vehicleId, ctx)` — Assign vehicle + driver to transfer
- `markEnRoute(transferId, ctx)` / `markCompleted(transferId, ctx)` / `markNoShow(transferId, ctx)`
- `getTransportDashboard(eventId, tenantId)` — Today's transfers, active vehicles, upcoming arrivals
- `getParticipantTransfers(participantId, tenantId)` — All transfers for a participant

### 2. Zod Schemas

Create `app/lib/schemas/transportation.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/transportation.tsx`:

- Route management, vehicle fleet, transfer scheduling table, daily manifest
- Filter by date, status, route, vehicle

### 4. Tests

Create `app/services/__tests__/transportation.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Routes configurable with origin, destination, schedule
- [ ] Vehicle fleet management with driver assignment
- [ ] Individual and bulk transfer scheduling
- [ ] Transfer lifecycle: SCHEDULED → EN_ROUTE → COMPLETED (or NO_SHOW)
- [ ] Daily transport manifest view
- [ ] Participant-centric transfer history
- [ ] Feature flag `FF_TRANSPORT` gates all functionality
- [ ] Event card shows "Transport" link in Logistics section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
