# P5-07: Bilateral Meeting Scheduler

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Task ID**            | P5-07                                                   |
| **Phase**              | 5 — Event Operations & Logistics                        |
| **Category**           | Protocol                                                |
| **Suggested Assignee** | Full-stack Developer                                    |
| **Depends On**         | P5-00 (Foundation Models), P5-05 (Venue & Floor Plans)  |
| **Blocks**             | —                                                       |
| **Estimated Effort**   | 5 days                                                  |
| **Module References**  | [Module 12](../../modules/12-PROTOCOL-AND-DIPLOMACY.md) |

---

## Context

Bilateral meetings between delegation heads require a request/confirm workflow, room availability checking, time-slot management, and conflict-free scheduling. Protocol officers need to manage requests, auto-book rooms from the venue system (P5-05), and generate daily meeting schedules. The `BilateralMeeting` and `MeetingSlot` models were created in P5-00.

---

## Deliverables

### 1. Bilateral Service

Create `app/services/bilateral.server.ts`:

- `requestMeeting(input, ctx)` — Create meeting request (requester, requestee, preferred slots, agenda)
- `confirmMeeting(meetingId, slotId, roomId, ctx)` — Confirm with specific slot + room
- `declineMeeting(meetingId, reason, ctx)` — Decline request
- `cancelMeeting(meetingId, reason, ctx)` — Cancel confirmed meeting, release room
- `completeMeeting(meetingId, notes, ctx)` — Mark meeting as completed with notes
- `getAvailableSlots(eventId, date, participantIds)` — Find free time slots for both parties
- `getMeetingSchedule(eventId, tenantId, date?)` — All meetings for a date with room/participant info
- `getParticipantMeetings(participantId, tenantId)` — All meetings for a participant
- `getDailyBriefing(eventId, tenantId, date)` — Formatted schedule for protocol briefing

### 2. Zod Schemas

Create `app/lib/schemas/bilateral.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/bilaterals.tsx`:

- Meeting request management, time-slot grid, room auto-booking, daily schedule view
- Feature flag: `FF_BILATERAL_SCHEDULER`

### 4. Tests

Create `app/services/__tests__/bilateral.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Meeting request/confirm/decline/cancel/complete lifecycle
- [ ] Available slot detection respects both parties' schedules
- [ ] Room auto-booking from venue system (conflict-free)
- [ ] Daily meeting schedule with room and participant details
- [ ] Protocol briefing export
- [ ] Feature flag `FF_BILATERAL_SCHEDULER` gates all functionality
- [ ] Event card shows "Bilaterals" link in Protocol section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
