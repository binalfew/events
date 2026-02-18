# P5-04: Parking & Zone Access

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Task ID**            | P5-04                                                |
| **Phase**              | 5 — Event Operations & Logistics                     |
| **Category**           | Logistics                                            |
| **Suggested Assignee** | Backend Developer                                    |
| **Depends On**         | P5-00 (Foundation Models)                            |
| **Blocks**             | —                                                    |
| **Estimated Effort**   | 3 days                                               |
| **Module References**  | [Module 11](../../modules/11-LOGISTICS-AND-VENUE.md) |

---

## Context

Events with restricted venue access need parking zone management with permit generation, vehicle registration, and gate scanning. Different participant types (heads of state, delegates, media) get different zone access levels. The `ParkingZone` and `ParkingPermit` models were created in P5-00.

---

## Deliverables

### 1. Parking Service

Create `app/services/parking.server.ts`:

- `createParkingZone(input, ctx)` — Define zone (name, capacity, access level, location)
- `listParkingZones(eventId, tenantId)` — Zones with occupancy stats
- `issuePermit(input, ctx)` — Generate parking permit (participant, zone, vehicle plate, validity)
- `revokePermit(permitId, ctx)` — Revoke with reason
- `scanPermit(permitId, ctx)` — Validate at gate (check active + correct zone + not expired)
- `getParkingStats(eventId, tenantId)` — Occupancy per zone, permits issued/active/revoked

### 2. Zod Schemas

Create `app/lib/schemas/parking.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/parking.tsx`:

- Zone management, permit issuance table, gate scan log, occupancy dashboard

### 4. Tests

Create `app/services/__tests__/parking.server.test.ts` — ≥6 test cases

---

## Acceptance Criteria

- [ ] Parking zones with capacity tracking
- [ ] Permit generation with vehicle plate and validity period
- [ ] Permit scanning validates zone access and expiry
- [ ] Occupancy tracking per zone
- [ ] Permit revocation with reason logging
- [ ] Event card shows "Parking" link in Logistics section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥6 new test cases)
