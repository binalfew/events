# Phase 5: Event Operations & Logistics — Task Index

**Duration:** 12 weeks
**Goal:** Complete event operations: logistics (accommodation, transport, catering, parking, venue), protocol (seating, bilaterals, companions, gifts), incident management, command center, staff management, compliance, surveys, certificates, and event series
**Team:** 2 Senior Backend Engineers + 2 Backend Developers + 2 Senior Frontend Developers + 1 Frontend Developer + 1 UX Designer + 2 QA Engineers

## Prerequisites (from Phase 4)

- REST API documented with OpenAPI spec and accessible via API keys
- Webhooks deliver events to external endpoints with retry and logging
- QR check-in scan < 500ms; venue occupancy updates in real-time
- Communication hub sends broadcast emails/SMS to filtered participant groups
- Kiosk mode operates in fullscreen with touch-optimized UI
- CSV import handles 10,000 records with progress feedback and error reporting
- Batch approve/reject processes 100 participants in < 5 seconds
- Duplicate detection catches passport reuse across events
- Event clone completes for 1,000 elements in < 60 seconds
- Waitlist auto-promotes when quota freed, with deadline enforcement
- All features gated behind feature flags
- Unit and integration tests pass for all new features

## Quality Gate (Phase 5 → Phase 6)

All of the following must be true before Phase 6 begins:

- Accommodation assigns rooms automatically on participant approval
- Transport schedule integrates with participant personal agenda
- Catering dashboard shows dietary aggregation with vendor portal
- Protocol seating respects rank hierarchy and conflict rules
- Bilateral meetings auto-book available rooms with time-slot grid
- Incident management escalates unresolved incidents automatically
- Command center shows real-time zone occupancy, staff deployment, alerts
- Staff shifts schedulable via drag-and-drop calendar
- Compliance dashboard shows passport expiry alerts and GDPR status
- Post-event surveys reuse form designer components
- Certificates generate as PDF with QR verification codes
- Event series YoY comparison dashboard functional for 3+ editions
- All logistics modules integrated with settings and feature flags

## Task List

| Task ID | Title                            | Category   | Depends On   | Est. |
| ------- | -------------------------------- | ---------- | ------------ | ---- |
| P5-00   | Foundation Models & Migrations   | Database   | —            | 4d   |
| P5-01   | Accommodation Management         | Logistics  | P5-00        | 5d   |
| P5-02   | Transportation & Logistics       | Logistics  | P5-00        | 5d   |
| P5-03   | Catering & Meal Management       | Logistics  | P5-00        | 4d   |
| P5-04   | Parking & Zone Access            | Logistics  | P5-00        | 3d   |
| P5-05   | Venue & Floor Plan Management    | Logistics  | P5-00        | 5d   |
| P5-06   | Protocol & Seating Management    | Protocol   | P5-00, P5-05 | 5d   |
| P5-07   | Bilateral Meeting Scheduler      | Protocol   | P5-00, P5-05 | 5d   |
| P5-08   | Companion & Spouse Program       | Protocol   | P5-00        | 3d   |
| P5-09   | Gift Protocol & Welcome Packages | Protocol   | P5-00        | 3d   |
| P5-10   | Incident Management              | Safety     | P5-00        | 4d   |
| P5-11   | Live Event Command Center        | Operations | P5-00, P5-10 | 5d   |
| P5-12   | Staff & Volunteer Management     | Operations | P5-00        | 5d   |
| P5-13   | Document Expiry & Compliance     | Compliance | P5-00        | 4d   |
| P5-14   | Post-Event Surveys               | Feedback   | P5-00        | 4d   |
| P5-15   | Certificate Generation           | Feature    | P5-00        | 4d   |
| P5-16   | Event Series & YoY Analytics     | Core       | P5-00        | 4d   |

## Dependency Graph

```
P5-00 (Foundation Models)
 ├── P5-01 (Accommodation)
 ├── P5-02 (Transportation)
 ├── P5-03 (Catering)
 ├── P5-04 (Parking)
 ├── P5-05 (Venue/Floor Plans) ─┬── P5-06 (Protocol Seating)
 │                               └── P5-07 (Bilateral Meetings)
 ├── P5-08 (Companion Program)
 ├── P5-09 (Gift Protocol)
 ├── P5-10 (Incident Mgmt) ──── P5-11 (Command Center)
 ├── P5-12 (Staff Management)
 ├── P5-13 (Compliance)
 ├── P5-14 (Surveys)
 ├── P5-15 (Certificates)
 └── P5-16 (Event Series)
```

## Suggested Timeline (12 weeks)

**Week 1:** P5-00 (foundation — must be first)
**Week 2–3:** P5-01 (accommodation), P5-02 (transport), P5-12 (staff) fan out in parallel
**Week 3–4:** P5-03 (catering), P5-04 (parking), P5-08 (companion)
**Week 4–5:** P5-05 (venue/floor plans), P5-09 (gifts), P5-10 (incidents)
**Week 5–6:** P5-06 (seating, needs P5-05), P5-07 (bilaterals, needs P5-05)
**Week 7–8:** P5-11 (command center, needs P5-10), P5-13 (compliance)
**Week 9:** P5-14 (surveys), P5-15 (certificates)
**Week 10:** P5-16 (event series)
**Week 11–12:** Integration testing, performance testing, quality gate verification

## Module References

| Module                                                                      | Scope in Phase 5                                   |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| [10 Event Operations](../../modules/10-EVENT-OPERATIONS-CENTER.md)          | Incident management, live command center           |
| [11 Logistics & Venue](../../modules/11-LOGISTICS-AND-VENUE.md)             | Accommodation, transport, catering, parking, venue |
| [12 Protocol & Diplomacy](../../modules/12-PROTOCOL-AND-DIPLOMACY.md)       | Seating, bilaterals, companions, gifts             |
| [13 People & Workforce](../../modules/13-PEOPLE-AND-WORKFORCE.md)           | Staff & volunteer management (staff only)          |
| [14 Content & Documents](../../modules/14-CONTENT-AND-DOCUMENTS.md)         | Post-event surveys, certificate generation         |
| [15 Compliance & Governance](../../modules/15-COMPLIANCE-AND-GOVERNANCE.md) | Document expiry, data retention, GDPR, visa        |
| [16 Participant Experience](../../modules/16-PARTICIPANT-EXPERIENCE.md)     | Event series, YoY analytics                        |
