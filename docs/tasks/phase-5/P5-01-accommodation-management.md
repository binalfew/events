# P5-01: Accommodation Management

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Task ID**            | P5-01                                                |
| **Phase**              | 5 — Event Operations & Logistics                     |
| **Category**           | Logistics                                            |
| **Suggested Assignee** | Backend Developer                                    |
| **Depends On**         | P5-00 (Foundation Models)                            |
| **Blocks**             | —                                                    |
| **Estimated Effort**   | 5 days                                               |
| **Module References**  | [Module 11](../../modules/11-LOGISTICS-AND-VENUE.md) |

---

## Context

Large-scale events require managing hotel room blocks, assigning participants to rooms based on rank/delegation, tracking check-in/check-out, and generating rooming lists for hotel partners. The `Hotel`, `RoomBlock`, and `AccommodationAssignment` models were created in P5-00.

---

## Deliverables

### 1. Accommodation Service

Create `app/services/accommodation.server.ts`:

- `createHotel(input, ctx)` — Register hotel with name, address, star rating, total rooms, contact info
- `listHotels(eventId, tenantId)` — Hotels with room block summary counts
- `createRoomBlock(input, ctx)` — Block of rooms at a hotel (room type, count, rate, dates)
- `assignRoom(participantId, roomBlockId, ctx)` — Assign participant to room, decrement availability
- `releaseRoom(assignmentId, ctx)` — Release room back to pool
- `checkIn(assignmentId, ctx)` — Mark room as occupied
- `checkOut(assignmentId, ctx)` — Mark room as checked out
- `getRoomingList(eventId, tenantId, hotelId?)` — Generate rooming list grouped by hotel
- `getAccommodationStats(eventId, tenantId)` — Occupancy rates, unassigned participants, availability by hotel
- `autoAssignRooms(eventId, tenantId, strategy, ctx)` — Bulk assignment by delegation/rank/participant type

### 2. Zod Schemas

Create `app/lib/schemas/accommodation.ts`:

- `createHotelSchema`, `createRoomBlockSchema`, `assignRoomSchema`
- `accommodationFiltersSchema` (hotel, status, dateRange)

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/accommodation.tsx`:

- **Loader**: `requirePermission("accommodation", "manage")` + `isFeatureEnabled(FF_ACCOMMODATION)`
- **Actions**: `create_hotel`, `create_room_block`, `assign_room`, `release_room`, `check_in`, `check_out`, `auto_assign`
- **UI**: Hotel cards with room block details, assignment table, stats dashboard, rooming list export

### 4. Tests

Create `app/services/__tests__/accommodation.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Hotels and room blocks CRUD with availability tracking
- [ ] Room assignment decrements availability, release increments it
- [ ] Check-in/check-out state transitions with timestamps
- [ ] Rooming list exportable grouped by hotel
- [ ] Auto-assign distributes participants by configurable strategy
- [ ] Stats show occupancy rates and availability
- [ ] Feature flag `FF_ACCOMMODATION` gates all functionality
- [ ] Event card shows "Accommodation" link in Logistics section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
