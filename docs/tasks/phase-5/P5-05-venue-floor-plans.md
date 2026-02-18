# P5-05: Venue & Floor Plan Management

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Task ID**            | P5-05                                                |
| **Phase**              | 5 — Event Operations & Logistics                     |
| **Category**           | Logistics                                            |
| **Suggested Assignee** | Full-stack Developer                                 |
| **Depends On**         | P5-00 (Foundation Models)                            |
| **Blocks**             | P5-06 (Protocol Seating), P5-07 (Bilateral Meetings) |
| **Estimated Effort**   | 5 days                                               |
| **Module References**  | [Module 11](../../modules/11-LOGISTICS-AND-VENUE.md) |

---

## Context

Venue management includes defining rooms, configuring layouts, managing room bookings, and optionally displaying interactive floor plans. Rooms are referenced by seating management (P5-06) and bilateral meeting scheduler (P5-07). The `VenueMap`, `VenueRoom`, and `RoomBooking` models were created in P5-00.

---

## Deliverables

### 1. Venue Service

Create `app/services/venue.server.ts`:

- `createVenueMap(input, ctx)` — Define venue (name, address, floors)
- `createRoom(input, ctx)` — Define room (venue, floor, name, capacity, equipment, layout type)
- `listRooms(eventId, tenantId, filters?)` — Rooms with current booking status
- `bookRoom(input, ctx)` — Reserve room for time slot (title, organizer, attendees, setup)
- `cancelBooking(bookingId, ctx)` — Cancel with reason
- `getRoomAvailability(roomId, date)` — Time slots with availability for a specific day
- `getRoomSchedule(eventId, tenantId, date)` — All bookings for all rooms on a date
- `getVenueOverview(eventId, tenantId)` — Room counts, booking utilization, peak hours

### 2. Zod Schemas

Create `app/lib/schemas/venue.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/venue.tsx`:

- Room list with capacity and equipment, booking calendar/grid, availability checker
- Room detail page with daily schedule

### 4. Tests

Create `app/services/__tests__/venue.server.test.ts` — ≥8 test cases

---

## Acceptance Criteria

- [ ] Venue and room CRUD with capacity and equipment tracking
- [ ] Room booking with time slot conflict detection
- [ ] Availability checker shows free slots for a room on a date
- [ ] Daily schedule view across all rooms
- [ ] Booking cancellation with reason
- [ ] Venue overview with utilization statistics
- [ ] Event card shows "Venue" link in Logistics section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥8 new test cases)
