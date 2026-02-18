# P5-00: Foundation — Models, Migrations, Feature Flags

| Field                  | Value                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**            | P5-00                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Phase**              | 5 — Event Operations & Logistics                                                                                                                                                                                                                                                                                                                                                                            |
| **Category**           | Database                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Suggested Assignee** | Backend Developer                                                                                                                                                                                                                                                                                                                                                                                           |
| **Depends On**         | None (Phase 4 complete)                                                                                                                                                                                                                                                                                                                                                                                     |
| **Blocks**             | P5-01 through P5-16                                                                                                                                                                                                                                                                                                                                                                                         |
| **Estimated Effort**   | 4 days                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Module References**  | [Module 10](../../modules/10-EVENT-OPERATIONS-CENTER.md), [Module 11](../../modules/11-LOGISTICS-AND-VENUE.md), [Module 12](../../modules/12-PROTOCOL-AND-DIPLOMACY.md), [Module 13](../../modules/13-PEOPLE-AND-WORKFORCE.md), [Module 14](../../modules/14-CONTENT-AND-DOCUMENTS.md), [Module 15](../../modules/15-COMPLIANCE-AND-GOVERNANCE.md), [Module 16](../../modules/16-PARTICIPANT-EXPERIENCE.md) |

---

## Context

Phase 5 introduces the full event operations stack: logistics (accommodation, transport, catering, parking, venue), protocol (seating, bilaterals, companions, gifts), incident management, command center, staff management, compliance, surveys, certificates, and event series analytics. This foundation task creates all the Prisma models, enums, feature flags, and permissions that subsequent tasks depend on.

---

## Deliverables

### 1. New Enums

Add to `prisma/schema.prisma`:

- **Accommodation**: `RoomBlockStatus` (AVAILABLE, RESERVED, OCCUPIED, RELEASED), `AccommodationAssignmentStatus` (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)
- **Transport**: `TransferType` (AIRPORT_ARRIVAL, AIRPORT_DEPARTURE, INTER_VENUE, CUSTOM), `VehicleType` (SEDAN, SUV, VAN, BUS, MINIBUS), `TransferStatus` (SCHEDULED, EN_ROUTE, COMPLETED, CANCELLED, NO_SHOW)
- **Catering**: `MealType` (BREAKFAST, LUNCH, DINNER, RECEPTION, COFFEE_BREAK, SNACK), `DietaryCategory` (REGULAR, VEGETARIAN, VEGAN, HALAL, KOSHER, GLUTEN_FREE, CUSTOM)
- **Parking**: `ParkingPermitStatus` (ACTIVE, EXPIRED, REVOKED, SUSPENDED)
- **Venue**: `RoomBookingStatus` (TENTATIVE, CONFIRMED, CANCELLED)
- **Protocol**: `SeatingPriority` (HEAD_OF_STATE, MINISTER, AMBASSADOR, SENIOR_OFFICIAL, DELEGATE, OBSERVER, MEDIA), `BilateralStatus` (REQUESTED, CONFIRMED, DECLINED, CANCELLED, COMPLETED)
- **Companion**: `CompanionType` (SPOUSE, FAMILY, AIDE, SECURITY, INTERPRETER)
- **Gift**: `GiftDeliveryStatus` (PENDING, ASSEMBLED, DELIVERED, RETURNED)
- **Incident**: `IncidentSeverity` (LOW, MEDIUM, HIGH, CRITICAL), `IncidentStatus` (REPORTED, INVESTIGATING, ESCALATED, RESOLVED, CLOSED)
- **Staff**: `ShiftStatus` (SCHEDULED, CHECKED_IN, ACTIVE, CHECKED_OUT, NO_SHOW), `StaffRole` (COORDINATOR, USHER, SECURITY, PROTOCOL, TECHNICAL, MEDICAL, TRANSPORT, CATERING)
- **Compliance**: `ComplianceStatus` (VALID, EXPIRING_SOON, EXPIRED, NOT_PROVIDED), `DataRetentionAction` (RETAIN, ANONYMIZE, DELETE)
- **Survey**: `SurveyStatus` (DRAFT, PUBLISHED, CLOSED, ARCHIVED)
- **Certificate**: `CertificateStatus` (DRAFT, GENERATED, SENT, DOWNLOADED, REVOKED)

### 2. Prisma Models

Create models for each domain (approximately 30+ new models):

**Logistics (Module 11):**

- `Hotel`, `RoomBlock`, `AccommodationAssignment` — hotel inventory + room assignments
- `TransportRoute`, `Vehicle`, `Transfer`, `TransferPassenger` — shuttle scheduling + assignments
- `MealPlan`, `MealSession`, `MealVoucher` — catering planning + voucher tracking
- `ParkingZone`, `ParkingPermit` — parking zones + permit generation
- `VenueMap`, `VenueRoom`, `RoomBooking` — interactive floor plans + room booking

**Protocol (Module 12):**

- `SeatingPlan`, `SeatingAssignment`, `SeatingConflict` — visual seating designer
- `BilateralMeeting`, `MeetingSlot` — request/confirm flow with availability
- `Companion`, `CompanionActivity` — companion registration + activity program
- `GiftItem`, `WelcomePackage`, `GiftDelivery` — gift registry + delivery tracking

**Operations (Module 10):**

- `Incident`, `IncidentUpdate`, `IncidentEscalation` — incident logging + escalation
- `CommandCenterWidget`, `AlertRule` — configurable dashboard + alerts

**People (Module 13):**

- `StaffMember`, `StaffShift`, `ShiftAssignment` — roster + scheduling

**Content (Module 14):**

- `Survey`, `SurveyResponse` — survey builder (reuse form designer)
- `CertificateTemplate`, `Certificate` — certificate designer + generation

**Compliance (Module 15):**

- `DocumentRequirement`, `ParticipantDocument`, `DataRetentionPolicy` — document tracking + GDPR

### 3. Reverse Relations

Add reverse relations to `Tenant`, `Event`, `Participant`, and `User` models.

### 4. Feature Flag Keys

Add to `FEATURE_FLAG_KEYS` in `app/lib/feature-flags.server.ts`:

```typescript
ACCOMMODATION: "FF_ACCOMMODATION",
TRANSPORT: "FF_TRANSPORT",
CATERING: "FF_CATERING",
PROTOCOL_SEATING: "FF_PROTOCOL_SEATING",
BILATERAL_SCHEDULER: "FF_BILATERAL_SCHEDULER",
INCIDENT_MANAGEMENT: "FF_INCIDENT_MANAGEMENT",
STAFF_MANAGEMENT: "FF_STAFF_MANAGEMENT",
COMPLIANCE_DASHBOARD: "FF_COMPLIANCE_DASHBOARD",
```

### 5. Feature Flag Seeds

Add 8 new flags to the seed file.

### 6. Permission Seeds

Add permissions:

```typescript
{ resource: "accommodation", action: "manage" },
{ resource: "transport", action: "manage" },
{ resource: "catering", action: "manage" },
{ resource: "parking", action: "manage" },
{ resource: "venue", action: "manage" },
{ resource: "protocol", action: "manage" },
{ resource: "bilateral", action: "manage" },
{ resource: "incident", action: "manage" },
{ resource: "incident", action: "report" },
{ resource: "staff", action: "manage" },
{ resource: "compliance", action: "manage" },
{ resource: "survey", action: "manage" },
{ resource: "certificate", action: "manage" },
{ resource: "command-center", action: "view" },
```

---

## Acceptance Criteria

- [ ] All new enums created in Prisma schema
- [ ] All 30+ new models created with proper relations and indexes
- [ ] Migration runs successfully (`prisma migrate dev`)
- [ ] Prisma client generates without errors
- [ ] Reverse relations added to existing models
- [ ] 8 new feature flag keys added to `FEATURE_FLAG_KEYS`
- [ ] 14 new permissions seeded
- [ ] 8 new feature flags seeded
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (all existing tests green)
- [ ] `npx prisma db seed` completes without errors
