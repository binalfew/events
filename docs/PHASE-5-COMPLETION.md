# Phase 5 — Event Operations & Logistics: Completion Report

## P5-00: Foundation — Models, Migrations, Feature Flags

**Status:** Completed
**Date:** 2026-02-18

### Summary

Created all foundational database models, enums, feature flags, and permissions required by Phase 5 tasks P5-01 through P5-16.

### What Was Implemented

#### New Enums (21)

Added to `prisma/schema.prisma` after `QueueStatus`:

| Domain        | Enums                                              |
| ------------- | -------------------------------------------------- |
| Accommodation | `RoomBlockStatus`, `AccommodationAssignmentStatus` |
| Transport     | `TransferType`, `VehicleType`, `TransferStatus`    |
| Catering      | `MealType`, `DietaryCategory`                      |
| Parking       | `ParkingPermitStatus`                              |
| Venue         | `RoomBookingStatus`                                |
| Protocol      | `SeatingPriority`, `BilateralStatus`               |
| Companion     | `CompanionType`                                    |
| Gift          | `GiftDeliveryStatus`                               |
| Incident      | `IncidentSeverity`, `IncidentStatus`               |
| Staff         | `ShiftStatus`, `StaffRole`                         |
| Compliance    | `ComplianceStatus`, `DataRetentionAction`          |
| Survey        | `SurveyStatus`                                     |
| Certificate   | `CertificateStatus`                                |

#### New Models (38)

| Domain           | Models                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Accommodation    | `Hotel`, `RoomBlock`, `AccommodationAssignment`                     |
| Transportation   | `TransportRoute`, `Vehicle`, `Transfer`, `TransferPassenger`        |
| Catering         | `MealPlan`, `MealSession`, `MealVoucher`                            |
| Parking          | `ParkingZone`, `ParkingPermit`                                      |
| Venue            | `VenueMap`, `VenueRoom`, `RoomBooking`                              |
| Protocol-Seating | `SeatingPlan`, `SeatingAssignment`, `SeatingConflict`               |
| Bilateral        | `BilateralMeeting`, `MeetingSlot`                                   |
| Companion        | `Companion`, `CompanionActivity`                                    |
| Gift             | `GiftItem`, `WelcomePackage`, `GiftDelivery`                        |
| Incidents        | `Incident`, `IncidentUpdate`, `IncidentEscalation`                  |
| Command Center   | `CommandCenterWidget`, `AlertRule`                                  |
| Staff            | `StaffMember`, `StaffShift`, `ShiftAssignment`                      |
| Survey           | `Survey`, `SurveyResponse`                                          |
| Certificate      | `CertificateTemplate`, `Certificate`                                |
| Compliance       | `DocumentRequirement`, `ParticipantDocument`, `DataRetentionPolicy` |

#### Key Design Decisions

- `AccommodationAssignment.participantId` — `@unique` (one room per participant)
- `StaffMember` — `@@unique([userId, eventId])` (user can staff multiple events)
- `SeatingConflict.participantAId/BId` — plain Strings (avoids excessive named relations on Participant)
- `MealVoucher.eventId` — plain String (event reachable via MealPlan)
- `CertificateTemplate.eventId` — optional (supports tenant-level templates)
- All models include `tenantId` with Cascade delete, standard timestamps, and appropriate indexes

#### Reverse Relations

- **Tenant** — 30 new reverse relations for Phase 5 models
- **User** — 14 named relations (`RoomBookingBookedBy`, `SeatingAssignedBy`, `BilateralRequestedBy`, `IncidentReportedBy`, `IncidentAssignedTo`, `IncidentResolvedBy`, `IncidentUpdateBy`, `EscalatedTo`, `EscalatedBy`, `SeatingConflictResolvedBy`, `ShiftAssignedBy`, `GiftDeliveredBy`, `DocumentVerifiedBy`) + `staffMembers`
- **Event** — 27 new reverse relations
- **Participant** — 12 new relations (including named `BilateralRequester`/`BilateralRequestee`)
- **FormTemplate** — added `surveys Survey[]`

#### Feature Flags (8 new + 1 missing from P4)

Added to `app/lib/feature-flags.server.ts` and seeded:

- `FF_ACCOMMODATION`, `FF_TRANSPORT`, `FF_CATERING`
- `FF_PROTOCOL_SEATING`, `FF_BILATERAL_SCHEDULER`
- `FF_INCIDENT_MANAGEMENT`, `FF_STAFF_MANAGEMENT`
- `FF_COMPLIANCE_DASHBOARD`
- `FF_PARALLEL_WORKFLOWS` (was in feature-flags.server.ts but missing from seed)

#### Permissions (14 new)

Added to `prisma/seed.ts`:

`accommodation:manage`, `transport:manage`, `catering:manage`, `parking:manage`, `venue:manage`, `protocol:manage`, `bilateral:manage`, `incident:manage`, `incident:report`, `staff:manage`, `compliance:manage`, `survey:manage`, `certificate:manage`, `command-center:view`

ADMIN role auto-receives all permissions via existing `permissionDefs.map(...)` pattern.

### Files Modified

1. `prisma/schema.prisma` — 21 enums, 38 models, reverse relations on 5 existing models
2. `app/lib/feature-flags.server.ts` — 8 new keys in `FEATURE_FLAG_KEYS`
3. `prisma/seed.ts` — 14 permissions, 9 feature flags (8 Phase 5 + 1 missing Phase 4)

### Files Created

1. `prisma/migrations/20260218090437_phase5_foundation/migration.sql`
2. `docs/PHASE-5-COMPLETION.md` (this file)

### Verification Results

| Check                                             | Result                          |
| ------------------------------------------------- | ------------------------------- |
| `npx prisma migrate dev --name phase5-foundation` | Succeeded                       |
| `npm run typecheck`                               | Passed                          |
| `npm run test`                                    | 805 tests passed (62 files)     |
| `npx prisma db seed`                              | 57 permissions, 31 flags seeded |

### Final Counts

| Metric        | Before | After |
| ------------- | ------ | ----- |
| Models        | 54     | 92    |
| Enums         | 30     | 51    |
| Feature flags | 22     | 31    |
| Permissions   | 43     | 57    |

---

## P5-01: Accommodation Management

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built the full accommodation management feature: service layer with 10 functions, Zod validation schemas, admin UI route with hotel/room block/assignment management, and comprehensive tests.

### Files Created

1. **`app/lib/schemas/accommodation.ts`** — Zod schemas for `createHotel`, `createRoomBlock`, `assignRoom`, `accommodationFilters` with exported types
2. **`app/services/accommodation.server.ts`** — Service layer with `AccommodationError`, `ServiceContext`, and 10 functions: `createHotel`, `listHotels`, `createRoomBlock`, `assignRoom`, `releaseRoom`, `checkIn`, `checkOut`, `getRoomingList`, `getAccommodationStats`, `autoAssignRooms`
3. **`app/routes/admin/events/$eventId/accommodation.tsx`** — Full admin route with loader (parallel data fetching), multi-intent action (7 actions), and UI with stats cards, hotel cards with expandable room blocks, add hotel/room block forms, assignment table with check-in/check-out/release actions, auto-assign with strategy selector, and status/hotel filters
4. **`app/services/__tests__/accommodation.server.test.ts`** — 18 test cases covering all service functions, error paths, and edge cases

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Accommodation" link in the Ops section of event cards

### Key Design Decisions

- Followed the waitlist service/route/test pattern for consistency
- `assignRoom` checks both room block capacity and participant uniqueness before creating assignment
- `checkIn` allows transition from PENDING or CONFIRMED; `checkOut` only from CHECKED_IN
- `autoAssignRooms` supports two strategies: `by_participant_type` (matches room block participantTypeId) and `first_available`
- All mutations create audit log entries
- Stats computation calculates occupancy rate excluding cancelled assignments

### Verification Results

| Check                 | Result                                                  |
| --------------------- | ------------------------------------------------------- |
| `npx prisma generate` | Succeeded                                               |
| `npm run typecheck`   | Passed                                                  |
| `npm run test`        | 823 tests passed (63 files), 18 new accommodation tests |

---

## P5-02: Transportation & Logistics

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built the full transportation management feature: service layer with 11 functions covering route management, vehicle fleet, transfer scheduling, status lifecycle, and dashboard stats. Includes Zod schemas, admin UI route with route/vehicle/transfer management, and 18 test cases.

### Files Created

1. **`app/lib/schemas/transportation.ts`** — Zod schemas for `createRoute`, `registerVehicle`, `scheduleTransfer`, `transportFilters`
2. **`app/services/transportation.server.ts`** — Service layer with `TransportError`, 11 functions: `createRoute`, `listRoutes`, `registerVehicle`, `listVehicles`, `scheduleTransfer`, `bulkScheduleTransfers`, `assignVehicle`, `markEnRoute`, `markCompleted`, `markNoShow`, `cancelTransfer`, `getTransportDashboard`, `getParticipantTransfers`
3. **`app/routes/admin/events/$eventId/transportation.tsx`** — Admin route with loader (parallel data fetching), multi-intent action (8 actions), and UI with stats cards, route/vehicle panels, transfer scheduling form with multi-select passengers, transfers table with status lifecycle actions, and date/status/type filters
4. **`app/services/__tests__/transportation.server.test.ts`** — 18 test cases covering all service functions and error paths

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Transport" link in Ops section of event cards

### Key Design Decisions

- Transfer lifecycle: SCHEDULED → EN_ROUTE → COMPLETED (or NO_SHOW/CANCELLED from valid states)
- `scheduleTransfer` creates transfer + passengers in a single Prisma nested create
- `bulkScheduleTransfers` derives origin/destination from route stops
- Vehicle assignment is optional (can schedule transfers without vehicles first)
- All mutations create audit log entries

### Verification Results

| Check               | Result                                                   |
| ------------------- | -------------------------------------------------------- |
| `npm run typecheck` | Passed                                                   |
| `npm run test`      | 841 tests passed (64 files), 18 new transportation tests |

---

## P5-03: Catering & Meal Management

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built catering management with meal plan scheduling, dietary requirement tracking with aggregation, QR-coded meal voucher issuance and redemption, dashboard stats, and caterer export functionality. 12 test cases.

### Files Created

1. **`app/lib/schemas/catering.ts`** — Zod schemas for `createMealPlan`, `createMealSession`, `issueMealVoucher`, `cateringFilters`
2. **`app/services/catering.server.ts`** — Service layer with 8 functions: `createMealPlan`, `listMealPlans`, `createMealSession`, `getDietaryAggregation`, `issueMealVoucher`, `redeemMealVoucher`, `getMealDashboard`, `exportCateringSheet`
3. **`app/routes/admin/events/$eventId/catering.tsx`** — Admin route with stats cards, dietary breakdown, meal plan editor with expandable sessions, voucher issuance form
4. **`app/services/__tests__/catering.server.test.ts`** — 12 test cases

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Catering" link in Ops section

### Verification Results

| Check               | Result                                             |
| ------------------- | -------------------------------------------------- |
| `npm run typecheck` | Passed                                             |
| `npm run test`      | 853 tests passed (65 files), 12 new catering tests |

---

## P5-04: Parking & Zone Access

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built parking zone management with capacity-tracked zones, permit generation with unique permit numbers, gate scanning with validity/status verification, permit revocation with reason logging, and zone occupancy dashboard with per-zone progress bars. 11 test cases.

### Files Created

1. **`app/lib/schemas/parking.ts`** — Zod schemas for `createParkingZone`, `issuePermit`, `parkingFilters`
2. **`app/services/parking.server.ts`** — Service layer with 6 functions: `createParkingZone`, `listParkingZones`, `issuePermit`, `revokePermit`, `scanPermit`, `getParkingStats`
3. **`app/routes/admin/events/$eventId/parking.tsx`** — Admin route with zone occupancy dashboard, permit table with filters, zone/permit forms
4. **`app/services/__tests__/parking.server.test.ts`** — 11 test cases covering zones, permits, scanning, revocation, and stats

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Parking" link in Ops section

### Verification Results

| Check               | Result                                            |
| ------------------- | ------------------------------------------------- |
| `npm run typecheck` | Passed                                            |
| `npm run test`      | 864 tests passed (66 files), 11 new parking tests |

---

## P5-05: Venue & Room Management

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built venue and room management with room booking including time slot conflict detection, daily schedule view, availability tracking, booking confirmation/cancellation lifecycle, and venue overview statistics. 13 test cases.

### Files Created

1. **`app/lib/schemas/venue.ts`** — Zod schemas for `createVenueMap`, `createRoom`, `bookRoom`, `venueFilters`
2. **`app/services/venue.server.ts`** — Service layer with `VenueError`, 9 functions: `createVenueMap`, `listVenueMaps`, `createRoom`, `listRooms`, `bookRoom`, `confirmBooking`, `cancelBooking`, `getRoomAvailability`, `getRoomSchedule`, `getVenueOverview`
3. **`app/routes/admin/events/$eventId/venue.tsx`** — Admin route with stats cards, venue/room CRUD, room booking with ShadCN DateTimePicker, daily schedule table with confirm/cancel actions, date filter
4. **`app/services/__tests__/venue.server.test.ts`** — 13 test cases covering venue/room CRUD, booking with conflict detection, confirm/cancel lifecycle, availability, and stats

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Venue" link in Ops section

### Key Design Decisions

- Booking conflict detection: checks for overlapping non-cancelled bookings using `startTime < endTime AND endTime > startTime`
- Booking lifecycle: TENTATIVE → CONFIRMED (or CANCELLED from any non-cancelled state)
- Equipment stored as JSON array, input as comma-separated string
- Daily schedule defaults to today's date
- No feature flag gating (uses permission-based access: `venue:manage`)

### Verification Results

| Check               | Result                                          |
| ------------------- | ----------------------------------------------- |
| `npm run typecheck` | Passed                                          |
| `npm run test`      | 877 tests passed (67 files), 13 new venue tests |

---

## P5-06: Protocol & Seating Management

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built protocol seating management with rank-based seating plans, manual and auto-assignment, conflict pair tracking with resolution, seating validation (rank violations + conflict adjacencies), and plan finalization. 14 test cases.

### Files Created

1. **`app/lib/schemas/seating.ts`** — Zod schemas for `createSeatingPlan`, `assignSeat`, `addConflict`, `seatingFilters`
2. **`app/services/seating.server.ts`** — Service layer with `SeatingError`, 10 functions: `createSeatingPlan`, `listSeatingPlans`, `getSeatingPlan`, `assignSeat`, `unassignSeat`, `autoAssignSeating`, `addConflict`, `resolveConflict`, `validateSeating`, `getSeatingStats`
3. **`app/routes/admin/events/$eventId/seating.tsx`** — Admin route with stats cards, plan CRUD, seat assignment form, auto-assign, conflict management, validation warnings, plan finalization
4. **`app/services/__tests__/seating.server.test.ts`** — 14 test cases covering plan CRUD, assignment, unassignment, auto-assign, conflicts, validation, and stats

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Seating" link in new Protocol section

### Key Design Decisions

- Auto-assign uses sequential seat labels (S001, S002...) with default DELEGATE priority
- Conflict pairs normalized (alphabetical order) to prevent duplicates via unique constraint
- Validation checks rank violations among top-tier officials (HEAD_OF_STATE/MINISTER/AMBASSADOR) and conflict adjacencies
- Dynamic `import("~/lib/db.server")` used in loader/action to avoid server-module-in-client-bundle error
- Feature flag `FF_PROTOCOL_SEATING` gates all functionality

### Verification Results

| Check               | Result                                            |
| ------------------- | ------------------------------------------------- |
| `npm run typecheck` | Passed                                            |
| `npm run test`      | 891 tests passed (68 files), 14 new seating tests |

---

## P5-07: Bilateral Meeting Scheduler

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built the bilateral meeting scheduler with request/confirm/decline/cancel/complete lifecycle, time-slot management, room assignment from venue system, daily briefing view, and availability detection. 14 test cases.

### Files Created

1. **`app/lib/schemas/bilateral.ts`** — Zod schemas for `requestMeeting`, `confirmMeeting`, `bilateralFilters`
2. **`app/services/bilateral.server.ts`** — Service layer with `BilateralError`, 11 functions: `requestMeeting`, `confirmMeeting`, `declineMeeting`, `cancelMeeting`, `completeMeeting`, `getAvailableSlots`, `createMeetingSlot`, `getMeetingSchedule`, `listMeetings`, `getParticipantMeetings`, `getDailyBriefing`, `getBilateralStats`
3. **`app/routes/admin/events/$eventId/bilaterals.tsx`** — Admin route with stats cards, meeting request form, time-slot creation, confirm meeting with room/time picker, daily briefing panel, meetings table with lifecycle actions, status/date filters
4. **`app/services/__tests__/bilateral.server.test.ts`** — 14 test cases covering request, confirm (with slot booking), decline, cancel (with slot release), complete, available slots filtering, stats, and daily briefing

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Bilaterals" link in Protocol section

### Key Design Decisions

- Meeting lifecycle: REQUESTED → CONFIRMED → COMPLETED (or DECLINED from REQUESTED, CANCELLED from REQUESTED/CONFIRMED)
- `confirmMeeting` accepts scheduledAt time and optional roomId + slotId; marks slot as booked
- `cancelMeeting` releases any booked meeting slots
- `getAvailableSlots` filters out slots that overlap with confirmed meetings for the specified participants
- `getDailyBriefing` provides a summary of confirmed meetings, pending requests, and available slots for a given date
- Feature flag `FF_BILATERAL_SCHEDULER` gates all functionality
- Room selection uses venue rooms from P5-05

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | Passed                                   |
| `npm run test`      | All tests passed, 14 new bilateral tests |

---

## P5-08: Companion & Spouse Program

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built companion registration with auto-generated registration codes, companion type tracking (Spouse/Family/Aide/Security/Interpreter), activity program management with capacity-tracked sign-ups, and companion stats dashboard. 12 test cases.

### Files Created

1. **`app/lib/schemas/companion.ts`** — Zod schemas for `registerCompanion`, `createActivity`, `companionFilters`
2. **`app/services/companion.server.ts`** — Service layer with `CompanionError`, 9 functions: `registerCompanion`, `listCompanions`, `updateCompanion`, `removeCompanion`, `createActivity`, `listActivities`, `signUpForActivity`, `cancelActivitySignUp`, `getCompanionBadgeData`, `getCompanionStats`
3. **`app/routes/admin/events/$eventId/companions.tsx`** — Admin route with stats cards (by type), registration form, activity creation form, companions table with type badges and reg codes, activity cards with capacity progress bars and inline sign-up
4. **`app/services/__tests__/companion.server.test.ts`** — 12 test cases covering registration, listing with type filter, update, removal, activity creation, sign-up with capacity check, duplicate sign-up prevention, cancel sign-up, and stats

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Companions" link in Protocol section

### Key Design Decisions

- Registration codes auto-generated as `CMP-XXXXXXXX` (alphanumeric, no ambiguous chars)
- Activity sign-ups use CompanionActivity records linked via `companionId`; master activities have `companionId = null`
- `currentSignups` counter maintained on master activity record
- Duplicate sign-up detection via name + date matching
- Uses `protocol:manage` permission (no separate companion permission needed)

### Verification Results

| Check               | Result                                   |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | Passed                                   |
| `npm run test`      | All tests passed, 12 new companion tests |

---

## P5-09: Gift Protocol & Welcome Packages

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built gift inventory management with stock tracking, welcome package templates with participant type eligibility, individual and bulk package assignment, delivery lifecycle (PENDING → ASSEMBLED → DELIVERED), and completion dashboard. 12 test cases.

### Files Created

1. **`app/lib/schemas/gift-protocol.ts`** — Zod schemas for `createGiftItem`, `createWelcomePackage`, `assignPackage`
2. **`app/services/gift-protocol.server.ts`** — Service layer with `GiftError`, 11 functions: `createGiftItem`, `listGiftItems`, `updateStock`, `createWelcomePackage`, `listWelcomePackages`, `assignPackage`, `bulkAssignPackages`, `markAssembled`, `markDelivered`, `getDeliveryDashboard`, `listDeliveries`
3. **`app/routes/admin/events/$eventId/gifts.tsx`** — Admin route with dashboard stats, gift inventory with inline stock adjustment, welcome package cards, individual/bulk assignment, delivery table with lifecycle actions, status filter
4. **`app/services/__tests__/gift-protocol.server.test.ts`** — 12 test cases covering item creation, stock adjustment (including below-zero guard), package creation with JSON contents, assignment with allocated increment, assembled/delivered lifecycle transitions with invalid status guards, dashboard stats, and bulk assignment

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Gifts" link in Protocol section

### Key Design Decisions

- Stock tracking via `quantity` (total) and `allocated` (assigned) fields; available = quantity - allocated
- `updateStock` accepts positive/negative adjustments, prevents going below zero
- `bulkAssignPackages` matches packages to participants by `forParticipantType`; falls back to packages with no type restriction
- Delivery lifecycle: PENDING → ASSEMBLED → DELIVERED (strict transitions)
- `markDelivered` records timestamp and delivering user
- Welcome package contents stored as JSON array
- Uses `protocol:manage` permission

### Verification Results

| Check               | Result                                       |
| ------------------- | -------------------------------------------- |
| `npm run typecheck` | Passed                                       |
| `npm run test`      | All tests passed, 12 new gift protocol tests |

---

## P5-10: Incident Management

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built a structured incident management system for logging security issues, medical emergencies, technical failures, and other event disruptions. Supports severity-based categorization (LOW/MEDIUM/HIGH/CRITICAL), responder assignment, escalation tracking, timeline updates, resolution with verification close, and SLA-based overdue detection. 15 test cases.

### Files Created

1. **`app/lib/schemas/incident.ts`** — Zod schemas for `reportIncident`, `addUpdate`, `escalate`, `incidentFilters`
2. **`app/services/incidents.server.ts`** — Service layer with `IncidentError`, 11 functions: `reportIncident`, `listIncidents`, `getIncident`, `assignIncident`, `addUpdate`, `escalateIncident`, `resolveIncident`, `closeIncident`, `reopenIncident`, `getIncidentStats`, `checkOverdueIncidents`
3. **`app/routes/admin/events/$eventId/incidents.tsx`** — Admin route with stats cards (total, open, reported, investigating, escalated, resolved, avg resolution time, overdue), severity breakdown badges, report incident form, severity/status filters, incident list with expandable action panels (assign, add update, escalate, resolve, close, reopen)
4. **`app/services/__tests__/incidents.server.test.ts`** — 15 test cases covering reporting, assignment (with auto status transition), updates (including closed incident guard), escalation (including resolved guard), resolve (with timestamp), close (only from resolved), reopen (only from resolved/closed), stats with avg resolution time, and SLA-based overdue detection

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Incidents" link in Ops section

### Key Design Decisions

- Incident lifecycle: REPORTED → INVESTIGATING → ESCALATED → RESOLVED → CLOSED (with reopen back to INVESTIGATING)
- `assignIncident` auto-transitions REPORTED → INVESTIGATING when first responder is assigned
- SLA thresholds: CRITICAL 15min, HIGH 1hr, MEDIUM 4hr, LOW 24hr
- `checkOverdueIncidents` compares elapsed time against severity-based SLA thresholds
- Category stored in incident `metadata.category` JSON field
- Timeline entries (IncidentUpdate) auto-created for assignment, escalation, resolution, close, and reopen
- Escalation creates IncidentEscalation record + updates incident status and assignee
- Feature flag `FF_INCIDENT_MANAGEMENT` gates all functionality
- Uses `event:manage` permission (incidents are operational, not protocol)

### Verification Results

| Check               | Result                                  |
| ------------------- | --------------------------------------- |
| `npm run typecheck` | Passed                                  |
| `npm run test`      | All tests passed, 15 new incident tests |

---

## P5-11: Live Event Command Center

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built a real-time operational command center dashboard that aggregates data from all operational modules (registration, check-in, incidents, transport, queue, accommodation). Includes configurable dashboard widgets, threshold-based alert rules with cooldown periods, alert evaluation, and recent alert history. 10 test cases.

### Files Created

1. **`app/lib/schemas/command-center.ts`** — Zod schemas for `createWidget` (8 widget types), `createAlertRule` (7 metrics, 5 conditions)
2. **`app/services/command-center.server.ts`** — Service layer with `CommandCenterError`, 10 functions: `getCommandCenterData` (6-module aggregation), `createWidget`, `listWidgets`, `deleteWidget`, `createAlertRule`, `listAlertRules`, `toggleAlertRule`, `deleteAlertRule`, `evaluateAlerts`, `getRecentAlerts`
3. **`app/routes/admin/events/$eventId/command-center.tsx`** — Admin route with 6-panel stats grid (registration, check-in, incidents by severity, transport, queue with avg wait, accommodation), active alerts banner, widget management, alert rule table with toggle/delete, recent alert history
4. **`app/services/__tests__/command-center.server.test.ts`** — 10 test cases covering dashboard aggregation, widget CRUD, alert rule CRUD, toggle, alert evaluation with threshold matching, cooldown period respect, and recent alerts

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Command Center" link in Ops section

### Key Design Decisions

- Dashboard aggregates 6 operational modules in parallel via `Promise.all`
- Alert evaluation uses configurable metrics mapped to dashboard data values
- Cooldown period prevents repeated alert firing (configurable per rule, default 15 min)
- `evaluateAlerts` runs on each page load and updates `lastTriggered` timestamp
- Widget types: STAT_CARD, INCIDENT_LIST, CHECKIN_CHART, TRANSPORT_STATUS, OCCUPANCY, QUEUE_STATUS, ALERT_FEED, TIMELINE
- Uses `command-center:view` permission (already seeded)
- No feature flag gating (command center is always available to authorized users)

### Verification Results

| Check               | Result                                        |
| ------------------- | --------------------------------------------- |
| `npm run typecheck` | Passed                                        |
| `npm run test`      | All tests passed, 10 new command center tests |

---

## P5-12: Staff & Volunteer Management

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built staff and volunteer management with role-based registration (8 roles), shift scheduling with capacity tracking, shift assignment with role matching and capacity validation, check-in/check-out lifecycle, auto-assign engine that matches staff to shifts by role, and operational dashboard with role/status breakdowns. 13 test cases.

### Files Created

1. **`app/lib/schemas/staff.ts`** — Zod schemas for `registerStaff` (8 roles), `createShift`, `staffFilters`
2. **`app/services/staff.server.ts`** — Service layer with `StaffError`, 13 functions: `registerStaff`, `listStaff`, `updateStaff`, `deactivateStaff`, `createShift`, `listShifts`, `assignToShift` (capacity + role checks), `unassignFromShift`, `checkInStaff` (SCHEDULED → CHECKED_IN), `checkOutStaff` (CHECKED_IN → CHECKED_OUT), `autoAssignShifts`, `getStaffDashboard`, `getStaffSchedule`
3. **`app/routes/admin/events/$eventId/staff.tsx`** — Admin route with dashboard stats (total, active, checked in, no-shows), register staff form, create shift form, role filter, staff roster table with deactivate action, shifts with fill rate progress bars, inline assignment management with check-in/check-out/unassign actions, auto-assign button
4. **`app/services/__tests__/staff.server.test.ts`** — 13 test cases covering registration, deactivation (including not-found guard), shift creation, assignment (including full capacity and role mismatch guards), check-in/check-out lifecycle (including invalid status transitions), dashboard stats, and auto-assign with role matching

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Staff" link in Ops section

### Key Design Decisions

- 8 staff roles: COORDINATOR, USHER, SECURITY, PROTOCOL, TECHNICAL, MEDICAL, TRANSPORT, CATERING
- `assignToShift` validates: staff exists, staff is active, shift has capacity, role matches (if required)
- Check-in only from SCHEDULED, check-out only from CHECKED_IN
- `autoAssignShifts` matches eligible staff by role, skips already-assigned staff, respects shift capacity
- `deactivateStaff` soft-deactivates (sets `isActive: false`) rather than deleting
- Feature flag `FF_STAFF_MANAGEMENT` gates all functionality
- Uses `staff:manage` permission

### Verification Results

| Check               | Result                               |
| ------------------- | ------------------------------------ |
| `npm run typecheck` | Passed                               |
| `npm run test`      | All tests passed, 13 new staff tests |

---

## P5-13: Document Expiry & Compliance

**Status:** Completed
**Date:** 2026-02-18

### Summary

Built document compliance management with configurable requirements per participant type, document submission and admin verification workflow (approve/reject), expiry date tracking with 30-day warning alerts, compliance rate dashboard, and GDPR-ready data retention policies with anonymize/delete execution. 14 test cases.

### Files Created

1. **`app/lib/schemas/compliance.ts`** — Zod schemas for `createDocumentRequirement`, `submitDocument`, `verifyDocument`, `createRetentionPolicy`, `complianceFilters`
2. **`app/services/compliance.server.ts`** — Service layer with `ComplianceError`, 11 functions: `createDocumentRequirement`, `listDocumentRequirements`, `submitDocument`, `verifyDocument`, `getParticipantCompliance`, `getComplianceDashboard`, `getExpiringDocuments`, `createRetentionPolicy`, `listRetentionPolicies`, `executeRetentionPolicy`, `getRetentionReport`
3. **`app/routes/admin/events/$eventId/compliance.tsx`** — Admin route with compliance rate dashboard (6 stat cards), expiring documents alert banner, requirements table with submission/validity counts, submit document form, verification actions, retention policy management with execute button, retention report
4. **`app/services/__tests__/compliance.server.test.ts`** — 14 test cases covering requirement creation, document submission (including duplicate guard and not-found guard), verification (with verifiedAt/verifiedBy), participant compliance filtering by type, dashboard stats with compliance rate calculation, expiring documents query, retention policy creation, policy execution (delete with count), inactive policy guard, not-found guard, and retention report

### Files Modified

1. **`app/routes/admin/events/index.tsx`** — Added "Compliance" link in Settings section

### Key Design Decisions

- Document requirements target specific participant types via `participantTypes` string array; empty array means all types
- `submitDocument` stores metadata (document number, notes) in JSON field; enforces unique constraint per requirement+participant
- `verifyDocument` sets status to VALID or EXPIRED with timestamp and verifier
- Compliance rate = valid documents / (total participants x required requirements)
- `getExpiringDocuments` finds VALID documents with expiry within N days
- `executeRetentionPolicy` supports DELETE (deleteMany) and ANONYMIZE (redact fileName/storageUrl per record)
- Retention policies have `@@unique([tenantId, entityType])` to prevent duplicates
- Feature flag `FF_COMPLIANCE_DASHBOARD` gates all functionality
- Uses `compliance:manage` permission

### Verification Results

| Check               | Result                                    |
| ------------------- | ----------------------------------------- |
| `npm run typecheck` | Passed                                    |
| `npm run test`      | All tests passed, 14 new compliance tests |
