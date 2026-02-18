# P5-12: Staff & Volunteer Management

| Field                  | Value                                                 |
| ---------------------- | ----------------------------------------------------- |
| **Task ID**            | P5-12                                                 |
| **Phase**              | 5 — Event Operations & Logistics                      |
| **Category**           | Operations                                            |
| **Suggested Assignee** | Full-stack Developer                                  |
| **Depends On**         | P5-00 (Foundation Models)                             |
| **Blocks**             | —                                                     |
| **Estimated Effort**   | 5 days                                                |
| **Module References**  | [Module 13](../../modules/13-PEOPLE-AND-WORKFORCE.md) |

---

## Context

Events require managing staff and volunteers: creating a roster, defining roles (coordinator, usher, security, protocol, technical, medical, transport, catering), scheduling shifts, tracking check-in/check-out, and monitoring deployment across zones. The `StaffMember`, `StaffShift`, and `ShiftAssignment` models were created in P5-00.

---

## Deliverables

### 1. Staff Management Service

Create `app/services/staff.server.ts`:

- `registerStaff(input, ctx)` — Add staff/volunteer (name, role, phone, email, skills, availability)
- `listStaff(eventId, tenantId, filters?)` — Staff roster with current shift status
- `updateStaff(staffId, input, ctx)` — Update staff details
- `deactivateStaff(staffId, ctx)` — Mark staff as inactive
- `createShift(input, ctx)` — Define shift (date, start/end time, zone/location, role, capacity)
- `listShifts(eventId, tenantId, filters?)` — Shifts with fill rates
- `assignToShift(staffId, shiftId, ctx)` — Assign staff to shift
- `unassignFromShift(staffId, shiftId, ctx)` — Remove assignment
- `autoAssignShifts(eventId, tenantId, strategy, ctx)` — Bulk assignment by role + availability
- `checkInStaff(staffId, shiftId, ctx)` — Record shift check-in
- `checkOutStaff(staffId, shiftId, ctx)` — Record shift check-out
- `getStaffDashboard(eventId, tenantId)` — On-duty count, zone coverage, no-shows, upcoming shifts
- `getStaffSchedule(staffId, tenantId)` — Individual staff member schedule

### 2. Zod Schemas

Create `app/lib/schemas/staff.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/staff.tsx`:

- Staff roster table, shift schedule grid/calendar, assignment management
- Dashboard with deployment metrics
- Feature flag: `FF_STAFF_MANAGEMENT`

### 4. Tests

Create `app/services/__tests__/staff.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Staff roster with role, skills, and availability
- [ ] Shift creation with date, time, zone, role, and capacity
- [ ] Manual and auto-assign to shifts
- [ ] Shift check-in/check-out with timestamps
- [ ] No-show detection for missed check-ins
- [ ] Staff dashboard with deployment metrics
- [ ] Individual staff schedule view
- [ ] Feature flag `FF_STAFF_MANAGEMENT` gates all functionality
- [ ] Event card shows "Staff" link in Ops section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
