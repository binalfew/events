# Module 01: Data Model Foundation

> **Requires:** [Module 00: Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md)
> **Required By:** All modules
> **Integrates With:** [Module 02: Dynamic Schema Engine](./02-DYNAMIC-SCHEMA-ENGINE.md), [Module 05: Security and Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [API Specification](#4-api-specification)
5. [Business Logic](#5-business-logic)
6. [User Interface](#6-user-interface)
7. [Integration Points](#7-integration-points)
8. [Configuration](#8-configuration)
9. [Testing Strategy](#9-testing-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Performance Requirements](#11-performance-requirements)
12. [Open Questions & Decisions](#12-open-questions--decisions)
13. [Appendix](#appendix)

---

## 1. Overview

### 1.1 Purpose

This module defines the complete relational data model that underpins the multi-tenant accreditation platform. It serves as the single source of truth for every database table, column, index, enum, and relationship used across the system. All other modules -- workflow engine, dynamic schema, security, notifications, reporting -- depend on the structures defined here.

The data model must satisfy three competing demands simultaneously:

1. **Strict multi-tenancy isolation** -- every row of tenant-owned data carries a `tenantId` foreign key, and composite unique constraints prevent cross-tenant collisions.
2. **Type-safe universal fields** -- identity, workflow position, and audit columns are fixed Prisma columns with full ORM type safety, migration support, and standard B-tree indexing.
3. **Schema-less extensibility** -- event-specific and participant-type-specific fields live in JSONB `customData` columns, defined at runtime through metadata records (`FieldDefinition`), validated by dynamically generated Zod schemas, and queryable via GIN and expression indexes.

### 1.2 Scope

This module covers:

- All Prisma model definitions (32+ core models across 10 domains)
- All enum types (16+ enums with their complete value sets)
- Complete relationship map and ER diagram
- Index strategy including composite, partial, GIN, and expression indexes
- Table partitioning strategy for high-volume tables
- Connection pooling, query timeout, and read-replica routing configuration
- Data lifecycle management: soft deletes, archival, GDPR purge
- Migration safety patterns: expand-and-contract, backfill, feature-flag-gated changes
- Seed data requirements for bootstrap
- Database health, migration status, and schema introspection APIs

This module does NOT cover:

- Dynamic field definition logic (see [Module 02: Dynamic Schema Engine](./02-DYNAMIC-SCHEMA-ENGINE.md))
- Row-level security policy implementation details (see [Module 05: Security and Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md))
- Application-level business rules for workflow transitions (see Module 03)

### 1.3 Design Philosophy

**Hybrid Fixed + Dynamic Schema Approach**

The platform rejects the false dichotomy between a rigid relational schema and a fully schema-less document store. Instead, it employs a hybrid strategy:

| Layer                   | Strategy                                    | Rationale                                                                                                                          |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Identity & Access**   | Fixed Prisma columns                        | Authentication, authorization, and tenant isolation demand compile-time type safety and referential integrity                      |
| **Event & Workflow**    | Fixed Prisma columns                        | Workflow state machines require guaranteed column presence for step routing, approval chains, and SLA enforcement                  |
| **Participant Core**    | Fixed Prisma columns                        | Universal fields (name, nationality, organization, registration code) appear in every event and benefit from standard indexes      |
| **Event-Specific Data** | JSONB `customData` column                   | Each event defines different fields (weapon permits for summits, t-shirt sizes for conferences); JSONB avoids per-event migrations |
| **Custom Entities**     | JSONB `data` column on `CustomObjectRecord` | Tenants that need entirely new entity types (vehicle registry, accommodation) define them through metadata without schema changes  |

This approach yields the best of both worlds:

- **Fixed columns** give Prisma type safety, foreign key constraints, standard query planning, and compile-time error detection.
- **JSONB columns** give runtime flexibility, zero-downtime field additions, tenant-specific customization, and no deployment for new fields.
- **Expression indexes** on frequently queried JSONB paths restore query performance to near-fixed-column levels.

---

## 2. Architecture

### 2.1 Database Technology

**PostgreSQL 16** serves as the sole persistent data store. The platform leverages the following PostgreSQL 16 features:

| Feature                          | Usage                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **JSONB**                        | Storage for `customData`, `config`, `metadata`, `definition`, `elements` columns across 15+ models                                   |
| **GIN Indexes**                  | Full-document indexing on JSONB columns for containment queries (`@>`)                                                               |
| **Expression Indexes**           | Path-specific indexes on JSONB fields marked `isSearchable` (e.g., `CREATE INDEX ON "Participant" (("customData"->>'visa_status'))`) |
| **Partial Indexes**              | Filtered indexes excluding soft-deleted rows (`WHERE "deletedAt" IS NULL`)                                                           |
| **CUID Primary Keys**            | Globally unique, sortable, URL-safe identifiers via `@default(cuid())`                                                               |
| **Composite Unique Constraints** | Multi-tenancy isolation (e.g., `@@unique([tenantId, name])`)                                                                         |
| **Cascade Deletes**              | Referential integrity with `onDelete: Cascade` for tenant-scoped data                                                                |
| **LISTEN/NOTIFY**                | Real-time change propagation for SSE-backed live queues                                                                              |
| **Table Partitioning**           | Range partitioning on `AuditLog` (by month) and `Notification` (by month) for query performance at scale                             |
| **Row-Level Security**           | Tenant isolation enforced at the database layer as defense-in-depth                                                                  |

### 2.2 ORM Strategy

**Prisma 5** is the primary ORM with raw SQL escape hatches for JSONB operations.

```
Prisma ORM (95% of queries)
  - Type-safe CRUD on fixed columns
  - Relation loading (include/select)
  - Transaction support (interactive + batch)
  - Migration generation and management
  |
  v
Raw SQL via prisma.$queryRaw / prisma.$executeRaw (5% of queries)
  - JSONB containment queries: WHERE "customData" @> '{"visa_status":"approved"}'
  - Expression index creation: CREATE INDEX CONCURRENTLY ...
  - Aggregations on JSONB paths
  - Partition management DDL
  - Full-text search across custom fields
```

**Escape hatch policy:** Raw SQL is permitted only for operations Prisma cannot express -- primarily JSONB operators (`@>`, `->>`, `#>>`), DDL for expression indexes, and partition management. All raw SQL is parameterized to prevent injection. Raw queries are encapsulated in dedicated server-side utility functions (e.g., `custom-query.server.ts`) and never appear in loader/action code directly.

### 2.3 Schema Organization

Models are organized into logical domains. Each domain maps to a bounded context in the application:

```
prisma/schema.prisma
  |
  |-- Identity & Access Domain
  |     Tenant, User, Role, Permission, Session, UserImage, Password
  |
  |-- Event Management Domain
  |     Event, ParticipantType, Venue, MeetingType, Meeting
  |
  |-- Registration Domain
  |     Participant, ParticipantDocument, Invitation, InvitationConstraint
  |     Restriction, Constraint
  |
  |-- Workflow Domain
  |     Workflow, WorkflowVersion, Step, StepAssignment, Approval
  |     WorkflowTemplate, StepTemplate
  |
  |-- Content Domain
  |     Template, Attachment, BadgeTemplate, FormTemplate, SectionTemplate
  |
  |-- Notification Domain
  |     Notification, NotificationPreference
  |
  |-- Audit & System Domain
  |     AuditLog, SystemSetting, CustomReport, SavedView, DatabaseBackup
  |
  |-- Custom Objects Domain
  |     CustomObjectDef, FieldDefinition, CustomObjectRecord
  |
  |-- Reference Data Domain
  |     Country, Title, Menu, MenuItem
  |
  |-- Access Control Domain
  |     UserEventAccess
```

### 2.4 ER Diagram

```mermaid
erDiagram
    Tenant ||--o{ Event : "hosts"
    Tenant ||--o{ User : "belongs to"
    Tenant ||--o{ Venue : "owns"
    Tenant ||--o{ MeetingType : "defines"
    Tenant ||--o{ ParticipantType : "defines"
    Tenant ||--o{ BadgeTemplate : "designs"
    Tenant ||--o{ WorkflowTemplate : "creates"
    Tenant ||--o{ CustomObjectDef : "defines"
    Tenant ||--o{ SavedView : "stores"
    Tenant ||--o{ SectionTemplate : "stores"
    Tenant ||--o{ AuditLog : "generates"
    Tenant ||--o{ Notification : "sends"
    Tenant ||--o{ CustomReport : "creates"
    Tenant ||--o{ SystemSetting : "configures"
    Tenant ||--o{ Restriction : "defines"
    Tenant ||--o{ Constraint : "defines"
    Tenant ||--o{ Workflow : "owns"
    Tenant ||--o{ Step : "owns"
    Tenant ||--o{ Invitation : "issues"
    Tenant ||--o{ Participant : "registers"
    Tenant ||--o{ Template : "designs"
    Tenant ||--o{ FormTemplate : "designs"
    Tenant ||--o{ FieldDefinition : "defines"
    Tenant ||--o{ CustomObjectRecord : "stores"

    User ||--o| Password : "authenticates with"
    User ||--o| UserImage : "has"
    User ||--o{ Session : "maintains"
    User }o--o{ Role : "assigned"
    User ||--o{ Approval : "performs"
    User ||--o{ Participant : "registers as"
    User ||--o{ AuditLog : "generates"
    User ||--o{ UserEventAccess : "granted"
    User ||--o{ DatabaseBackup : "initiates"
    User ||--o{ CustomReport : "creates"
    User ||--o{ Notification : "receives"
    User ||--o{ NotificationPreference : "configures"

    Role }o--o{ Permission : "grants"
    Role ||--o{ Menu : "accesses"
    Role ||--o{ MenuItem : "accesses"
    Role ||--o{ Step : "assigned to"
    Role ||--o{ StepTemplate : "assigned to"
    Role ||--o{ UserEventAccess : "scoped by"

    Event ||--o{ Meeting : "schedules"
    Event ||--o{ Restriction : "enforces"
    Event ||--o{ Workflow : "uses"
    Event ||--o{ Invitation : "issues"
    Event ||--o{ Participant : "registers"
    Event ||--o{ Template : "uses"
    Event ||--o{ FormTemplate : "uses"
    Event ||--o{ FieldDefinition : "scopes"
    Event ||--o{ CustomObjectRecord : "contains"
    Event ||--o{ UserEventAccess : "grants"

    ParticipantType ||--o{ Constraint : "limits"
    ParticipantType ||--o{ Workflow : "routes"
    ParticipantType ||--o{ Invitation : "categorizes"
    ParticipantType ||--o{ Participant : "classifies"
    ParticipantType ||--o{ Template : "applies"
    ParticipantType ||--o{ FormTemplate : "applies"
    ParticipantType ||--o{ FieldDefinition : "scopes"
    ParticipantType ||--o{ InvitationConstraint : "limits"

    Participant ||--o{ Approval : "receives"
    Participant ||--o{ ParticipantDocument : "uploads"
    Participant ||--o{ CustomObjectRecord : "owns"
    Participant }o--|| Step : "at"
    Participant }o--o| WorkflowVersion : "tracked by"
    Participant }o--o| Invitation : "invited via"
    Participant }o--|| Country : "nationality"
    Participant }o--|| Country : "country"
    Participant }o--|| Title : "titled"

    Workflow ||--o{ Step : "contains"
    Workflow ||--o{ WorkflowVersion : "versioned"
    WorkflowTemplate ||--o{ StepTemplate : "contains"

    Step ||--o{ Approval : "processes"
    Step ||--o{ Participant : "holds"
    Step ||--o{ StepAssignment : "assigns"
    Step ||--o{ UserEventAccess : "grants"

    Restriction ||--o{ Constraint : "defines"
    Restriction ||--o{ Invitation : "applies"
    Restriction ||--o{ InvitationConstraint : "sources"

    Invitation ||--o{ Participant : "registers"
    Invitation ||--o{ InvitationConstraint : "limits"

    BadgeTemplate ||--o{ Template : "used by"
    Template ||--o{ Attachment : "includes"

    CustomObjectDef ||--o{ FieldDefinition : "defines"
    CustomObjectDef ||--o{ CustomObjectRecord : "stores"
```

---

## 3. Data Model

### 3.1 Master Model Index

The following table lists every core model in the platform, grouped by domain. The "Owner Module" column indicates which module document contains the primary business logic for that model. The "Est. Volume" column provides order-of-magnitude row counts for a mature tenant running a large event (~5,000 participants).

| #   | Model                    | Domain            | Description                                                                     | Est. Volume | Owner Module |
| --- | ------------------------ | ----------------- | ------------------------------------------------------------------------------- | ----------- | ------------ |
| 1   | `Tenant`                 | Identity & Access | Organization account; top-level isolation boundary                              | ~50         | Module 01    |
| 2   | `User`                   | Identity & Access | Platform user account with authentication state                                 | ~5,000      | Module 05    |
| 3   | `Role`                   | Identity & Access | Named permission group scoped to global, tenant, or event                       | ~30         | Module 05    |
| 4   | `Permission`             | Identity & Access | Granular action-entity-access triple                                            | ~200        | Module 05    |
| 5   | `Session`                | Identity & Access | Active login session with expiry                                                | ~2,000      | Module 05    |
| 6   | `UserImage`              | Identity & Access | Profile photo for a user                                                        | ~3,000      | Module 05    |
| 7   | `Password`               | Identity & Access | Hashed password record (one-to-one with User)                                   | ~5,000      | Module 05    |
| 8   | `Event`                  | Event Management  | Conference, summit, or festival managed by a tenant                             | ~20         | Module 01    |
| 9   | `ParticipantType`        | Event Management  | Category of participant (Delegate, Media, Security, VIP)                        | ~15         | Module 01    |
| 10  | `Venue`                  | Event Management  | Physical location where events are held                                         | ~10         | Module 01    |
| 11  | `MeetingType`            | Event Management  | Classification of meetings/sessions (Plenary, Bilateral, Workshop)              | ~10         | Module 01    |
| 12  | `Meeting`                | Event Management  | Scheduled session within an event                                               | ~100        | Module 01    |
| 13  | `Participant`            | Registration      | Registered individual linked to user, event, and workflow                       | ~5,000      | Module 03    |
| 14  | `ParticipantDocument`    | Registration      | Uploaded document (passport, visa, photo) for a participant                     | ~15,000     | Module 03    |
| 15  | `Invitation`             | Registration      | Quota-bearing invitation issued to an organization                              | ~500        | Module 03    |
| 16  | `InvitationConstraint`   | Registration      | Per-type quota limit within an invitation                                       | ~1,500      | Module 03    |
| 17  | `Restriction`            | Registration      | Named access restriction group for an event                                     | ~20         | Module 03    |
| 18  | `Constraint`             | Registration      | Quota rule linking restriction + participant type + access level                | ~60         | Module 03    |
| 19  | `Workflow`               | Workflow          | Approval pipeline for a participant type within an event                        | ~15         | Module 04    |
| 20  | `WorkflowVersion`        | Workflow          | Immutable snapshot of a workflow at a point in time                             | ~30         | Module 04    |
| 21  | `Step`                   | Workflow          | Single stage in a workflow (approve, reject, print, collect)                    | ~75         | Module 04    |
| 22  | `StepAssignment`         | Workflow          | Assignment of a specific participant-step to a user                             | ~10,000     | Module 04    |
| 23  | `Approval`               | Workflow          | Record of an approval/rejection decision                                        | ~12,000     | Module 04    |
| 24  | `WorkflowTemplate`       | Workflow          | Reusable workflow blueprint at tenant level                                     | ~10         | Module 04    |
| 25  | `StepTemplate`           | Workflow          | Step definition within a workflow template                                      | ~50         | Module 04    |
| 26  | `Template`               | Content           | Event-specific template linking badge design to participant type                | ~30         | Module 06    |
| 27  | `Attachment`             | Content           | File attached to a template                                                     | ~60         | Module 06    |
| 28  | `BadgeTemplate`          | Content           | Visual badge layout with positioned elements                                    | ~10         | Module 06    |
| 29  | `FormTemplate`           | Content           | Visual form layout definition for registration                                  | ~15         | Module 02    |
| 30  | `SectionTemplate`        | Content           | Reusable form section snippet                                                   | ~20         | Module 02    |
| 31  | `Notification`           | Notification      | In-app notification delivered to a user                                         | ~50,000     | Module 07    |
| 32  | `NotificationPreference` | Notification      | Per-user channel preferences (email, in-app, SMS)                               | ~5,000      | Module 07    |
| 33  | `AuditLog`               | Audit & System    | Immutable record of every state change                                          | ~500,000    | Module 08    |
| 34  | `SystemSetting`          | Audit & System    | Key-value configuration scoped to tenant or global                              | ~200        | Module 01    |
| 35  | `CustomReport`           | Audit & System    | Saved report definition with filters and columns                                | ~50         | Module 08    |
| 36  | `SavedView`              | Audit & System    | Airtable-style saved view configuration                                         | ~100        | Module 01    |
| 37  | `DatabaseBackup`         | Audit & System    | Record of database backup operations                                            | ~100        | Module 08    |
| 38  | `CustomObjectDef`        | Custom Objects    | Tenant-defined entity type (Vehicle, Accommodation)                             | ~10         | Module 02    |
| 39  | `FieldDefinition`        | Custom Objects    | Field definition for custom data on any model                                   | ~200        | Module 02    |
| 40  | `CustomObjectRecord`     | Custom Objects    | Instance of a custom object with JSONB data                                     | ~5,000      | Module 02    |
| 41  | `Country`                | Reference Data    | ISO country reference table                                                     | ~250        | Module 01    |
| 42  | `Title`                  | Reference Data    | Honorific titles (Mr., Mrs., H.E., Dr.)                                         | ~20         | Module 01    |
| 43  | `Menu`                   | Reference Data    | Navigation menu definition scoped to roles                                      | ~10         | Module 01    |
| 44  | `MenuItem`               | Reference Data    | Individual navigation item within a menu                                        | ~80         | Module 01    |
| 45  | `UserEventAccess`        | Access Control    | Junction table granting a user access to a specific event with a role at a step | ~5,000      | Module 05    |

### 3.2 Identity & Access Domain

#### Tenant

The root isolation boundary. Every data record in the system ultimately traces back to a Tenant. Billing, feature flags, and usage metrics are stored as JSONB for flexibility.

```prisma
model Tenant {
  id               String   @id @default(cuid())
  name             String   @unique
  email            String   @unique
  phone            String
  website          String?
  address          String?
  city             String?
  state            String?
  zip              String?
  country          String?
  billingInfo      Json?
  subscriptionPlan String
  featureFlags     Json?
  usageMetrics     Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  events            Event[]
  users             User[]
  venues            Venue[]
  meetingTypes      MeetingType[]
  participantTypes  ParticipantType[]
  meetings          Meeting[]
  restrictions      Restriction[]
  constraints       Constraint[]
  workflows         Workflow[]
  workflowTemplates WorkflowTemplate[]
  steps             Step[]
  invitations       Invitation[]
  participants      Participant[]
  templates         Template[]
  badgeTemplates    BadgeTemplate[]
  formTemplates     FormTemplate[]
  customObjectDefs  CustomObjectDef[]
  fieldDefinitions   FieldDefinition[]
  customObjectRecords CustomObjectRecord[]
  savedViews        SavedView[]
  sectionTemplates  SectionTemplate[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  customReports     CustomReport[]
  systemSettings    SystemSetting[]

  @@index([name, email])
}
```

**Design notes:**

- `billingInfo` (JSONB) stores payment method, billing address, and invoice history. Using JSONB avoids coupling the schema to a specific payment provider.
- `featureFlags` (JSONB) enables per-tenant feature toggling (e.g., `{"customObjects": true, "advancedWorkflow": false}`).
- `usageMetrics` (JSONB) tracks aggregate usage for billing purposes (e.g., `{"participantCount": 4200, "storageGB": 12.5}`).
- The composite index on `[name, email]` supports admin search across tenants.

#### User

```prisma
model User {
  id                  String     @id @default(cuid())
  email               String     @unique
  username            String     @unique
  name                String?
  status              UserStatus @default(ACTIVE)
  failedLoginAttempts Int        @default(0)
  lastFailedLoginAt   DateTime?
  lockedAt            DateTime?
  lockReason          String?
  lockCount           Int        @default(0)
  autoUnlockAt        DateTime?
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
  deletedAt           DateTime?

  image                  UserImage?
  password               Password?
  tenantId               String?
  tenant                 Tenant?    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  roles                  Role[]
  sessions               Session[]
  approvals              Approval[]
  participants           Participant[]
  auditLogs              AuditLog[]
  eventAccess            UserEventAccess[]
  backups                DatabaseBackup[]
  customReports          CustomReport[]
  notifications          Notification[]
  notificationPreferences NotificationPreference[]

  @@index([deletedAt])
}
```

**Design notes:**

- `deletedAt` implements soft delete. The partial index `@@index([deletedAt])` enables efficient filtering of active users (`WHERE "deletedAt" IS NULL`).
- `failedLoginAttempts`, `lockedAt`, and `autoUnlockAt` implement progressive lockout: 5 failures trigger a 15-minute lock, subsequent locks escalate exponentially.
- `tenantId` is nullable to support platform-level admins who operate across tenants.
- The `status` enum governs account lifecycle (ACTIVE, INACTIVE, LOCKED, SUSPENDED).

#### Role

```prisma
model Role {
  id          String    @id @default(cuid())
  name        String
  scope       RoleScope @default(EVENT)
  description String?
  tenantId    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  permissions   Permission[]
  users         User[]
  menus         Menu[]
  menuItems     MenuItem[]
  steps         Step[]
  stepTemplates StepTemplate[]
  eventAccess   UserEventAccess[]

  @@unique([tenantId, name])
  @@index([scope])
}
```

**Design notes:**

- `scope` determines the visibility boundary: GLOBAL roles (platform admin) have no `tenantId`; TENANT roles apply across all events; EVENT roles are scoped to specific events via `UserEventAccess`.
- The composite unique `[tenantId, name]` allows different tenants to define roles with the same name independently.

#### Permission

```prisma
model Permission {
  id          String   @id @default(cuid())
  action      String
  entity      String
  access      String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  roles       Role[]

  @@unique([action, entity, access])
}
```

**Design notes:**

- The triple `(action, entity, access)` encodes permissions like `("read", "participant", "own")` or `("approve", "participant", "any")`.
- `action` values: `create`, `read`, `update`, `delete`, `approve`, `reject`, `print`, `collect`, `export`, `manage`.
- `entity` values: `participant`, `event`, `workflow`, `template`, `report`, `setting`, `user`, `role`.
- `access` values: `own` (only records the user created), `any` (all records in scope), `assigned` (only assigned records).

#### Session

```prisma
model Session {
  id             String   @id @default(cuid())
  expirationDate DateTime
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId])
}
```

**Design notes:**

- `metadata` (JSONB) stores session context: IP address, user agent, device fingerprint, and geolocation for security audit.
- Sessions are server-side; the client holds only a session cookie. Cascade delete ensures user deletion invalidates all sessions.

#### UserImage

```prisma
model UserImage {
  id          String   @id @default(cuid())
  altText     String?
  contentType String
  blob        Bytes
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Design notes:**

- Profile images are stored as binary (`Bytes`) directly in the database for simplicity with small images. For larger file storage (participant documents, badge assets), Azure Blob Storage is used instead.
- The `@unique` constraint on `userId` enforces a one-to-one relationship.

#### Password

```prisma
model Password {
  hash   String
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Design notes:**

- Passwords are stored as bcrypt hashes with a cost factor of 12.
- The separate model (rather than a column on User) supports future authentication methods (OAuth, SAML) where a password record may not exist.
- No `createdAt`/`updatedAt` to minimize the stored surface area for this sensitive data.

### 3.3 Event Management Domain

#### Event

```prisma
model Event {
  id          String      @id @default(cuid())
  name        String
  description String
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  status      EventStatus
  startDate   DateTime
  endDate     DateTime
  customData  Json        @default("{}")  // Event-level custom metadata
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?

  meetings          Meeting[]
  restrictions      Restriction[]
  workflows         Workflow[]
  invitations       Invitation[]
  participants      Participant[]
  templates         Template[]
  formTemplates     FormTemplate[]
  fieldDefinitions   FieldDefinition[]
  customObjectRecords CustomObjectRecord[]
  userAccess        UserEventAccess[]

  @@unique([tenantId, name])
  @@index([tenantId, status])
  @@index([deletedAt])
}
```

**Design notes:**

- `customData` (JSONB) stores event-level metadata that varies by tenant: venue address, event logo URL, timezone, theme colors, registration deadline.
- The composite unique `[tenantId, name]` prevents duplicate event names within a tenant.
- `status` transitions follow a state machine: DRAFT -> PUBLISHED -> COMPLETED (or CANCELED/POSTPONED/RESCHEDULED).

#### ParticipantType

```prisma
model ParticipantType {
  id                               String   @id @default(cuid())
  tenantId                         String
  tenant                           Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name                             String
  description                      String
  priority                         Priority
  isExemptedFromFullQuota          Boolean
  isExemptedFromOpenSessionQuota   Boolean
  isExemptedFromClosedSessionQuota Boolean
  createdAt                        DateTime @default(now())
  updatedAt                        DateTime @updatedAt

  constraints           Constraint[]
  workflows             Workflow[]
  invitations           Invitation[]
  participants          Participant[]
  templates             Template[]
  formTemplates         FormTemplate[]
  fieldDefinitions       FieldDefinition[]
  invitationConstraints InvitationConstraint[]

  @@unique([tenantId, name])
}
```

**Design notes:**

- `priority` determines precedence when quotas conflict or queues are prioritized (e.g., VIP participants are served before general attendees).
- Quota exemption flags allow heads of state, security personnel, or press to bypass capacity limits at specific access levels.

#### Venue

```prisma
model Venue {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  address     String?
  city        String?
  country     String?
  capacity    Int?
  description String?
  metadata    Json?    // Floor plans, GPS coordinates, accessibility info
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  meetings    Meeting[]

  @@unique([tenantId, name])
}
```

#### MeetingType

```prisma
model MeetingType {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  color       String?  // Calendar display color
  icon        String?  // Icon identifier for UI
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  meetings    Meeting[]

  @@unique([tenantId, name])
}
```

#### Meeting

```prisma
model Meeting {
  id            String      @id @default(cuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId       String
  event         Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  meetingTypeId String?
  meetingType   MeetingType? @relation(fields: [meetingTypeId], references: [id], onDelete: SetNull)
  venueId       String?
  venue         Venue?      @relation(fields: [venueId], references: [id], onDelete: SetNull)
  name          String
  description   String?
  startTime     DateTime
  endTime       DateTime
  accessLevel   AccessLevel @default(OPEN)
  capacity      Int?
  metadata      Json?       // Agenda, speaker list, special requirements
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([tenantId, eventId, name, startTime])
  @@index([eventId, startTime])
  @@index([venueId])
}
```

### 3.4 Registration Domain

#### Participant

The central record of a registered individual. Combines fixed identity columns with a JSONB `customData` column for event-specific fields.

```prisma
model Participant {
  id                String        @id @default(cuid())
  userId            String
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId           String
  event             Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  invitationId      String?
  invitation        Invitation?   @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  participantTypeId String
  participantType   ParticipantType @relation(fields: [participantTypeId], references: [id], onDelete: Cascade)

  // Universal fields (every event needs these)
  registrationCode  String        @unique
  gender            String
  titleId           String
  title             Title         @relation(fields: [titleId], references: [id], onDelete: Cascade)
  firstName         String
  familyName        String
  dateOfBirth       DateTime
  nationalityId     String
  nationality       Country       @relation("Nationality", fields: [nationalityId], references: [id], onDelete: Cascade)
  organization      String
  jobTitle          String
  countryId         String
  country           Country       @relation("Country", fields: [countryId], references: [id], onDelete: Cascade)
  email             String?

  // Dynamic fields (event/type-specific, defined by FieldDefinition)
  customData        Json          @default("{}")

  // Workflow state
  status            RequestStatus
  stepId            String
  step              Step          @relation(fields: [stepId], references: [id], onDelete: Cascade)
  workflowVersionId String?
  workflowVersion   WorkflowVersion? @relation(fields: [workflowVersionId], references: [id])

  // Collection tracking
  collectedBy       String?
  collectedByPhone  String?
  collectionNotes   String?
  collectedAt       DateTime?
  reprintCount      Int           @default(0)

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  deletedAt         DateTime?

  approvals           Approval[]
  documents           ParticipantDocument[]
  customObjectRecords CustomObjectRecord[]

  @@unique([tenantId, eventId, registrationCode])
  @@index([deletedAt])
  @@index([eventId, stepId, status])
  @@index([tenantId, eventId, participantTypeId])
  @@index([status, createdAt])
  @@index([userId])
  @@index([invitationId])
  @@index([titleId])
}
```

**Design notes:**

- **Fixed vs. Dynamic split**: `firstName`, `familyName`, `gender`, `nationality`, `organization`, `jobTitle` are universal across every event type. Fields like `weaponPermitNumber`, `tShirtSize`, or `dietaryRequirements` vary by event and live in `customData`.
- **Workflow position**: `stepId` and `status` together define where the participant is in the approval pipeline. The `@@index([eventId, stepId, status])` composite index is critical for queue views (e.g., "show me all PENDING participants at the Validation step for this event").
- **Collection tracking**: `collectedBy`, `collectedAt`, and `reprintCount` support the physical badge collection workflow including proxy collection and reprint auditing.
- **Dual country references**: `nationalityId` and `countryId` use named relations to the same `Country` table -- nationality is citizenship; country is current residence/delegation.

#### ParticipantDocument

```prisma
model ParticipantDocument {
  id            String      @id @default(cuid())
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  documentType  String      // "passport", "visa", "photo", "invitation_letter", "press_card"
  fileName      String
  fileSize      Int
  mimeType      String
  storageUrl    String      // Azure Blob Storage URL
  thumbnailUrl  String?
  metadata      Json?       // Extracted data: passport number, expiry, MRZ data
  uploadedBy    String
  verifiedAt    DateTime?
  verifiedBy    String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([participantId, documentType])
}
```

**Design notes:**

- Files are stored in Azure Blob Storage; only the URL is persisted in the database.
- `metadata` (JSONB) stores extracted data from document processing (OCR on passports, barcode scanning).
- `verifiedAt`/`verifiedBy` track manual document verification by validators.

#### Invitation

```prisma
model Invitation {
  id                String        @id @default(cuid())
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  organization      String
  name              String?
  email             String
  eventId           String
  event             Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantTypeId String?
  participantType   ParticipantType? @relation(fields: [participantTypeId], references: [id], onDelete: Cascade)
  restrictionId     String?
  restriction       Restriction?  @relation(fields: [restrictionId], references: [id], onDelete: Cascade)
  maximumQuota      Int?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  participants          Participant[]
  invitationConstraints InvitationConstraint[]

  @@unique([tenantId, eventId, organization, email])
  @@index([tenantId, eventId, email])
}
```

**Design notes:**

- An Invitation represents a quota allocation sent to an organization (e.g., "Republic of Kenya may register up to 25 delegates for the AU Summit").
- `maximumQuota` is the total cap. Fine-grained per-type quotas are in `InvitationConstraint`.
- The composite unique constraint prevents duplicate invitations to the same organization email for the same event.

#### Restriction

```prisma
model Restriction {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  constraints           Constraint[]
  invitations           Invitation[]
  invitationConstraints InvitationConstraint[]

  @@unique([tenantId, eventId, name])
  @@index([eventId, name])
}
```

#### Constraint

```prisma
model Constraint {
  id                String          @id @default(cuid())
  tenantId          String
  tenant            Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name              String
  restrictionId     String
  restriction       Restriction     @relation(fields: [restrictionId], references: [id], onDelete: Cascade)
  participantTypeId String
  participantType   ParticipantType @relation(fields: [participantTypeId], references: [id], onDelete: Cascade)
  accessLevel       AccessLevel
  quota             Int
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([tenantId, restrictionId, participantTypeId, accessLevel])
  @@index([restrictionId, participantTypeId])
}
```

#### InvitationConstraint

```prisma
model InvitationConstraint {
  id                  String          @id @default(cuid())
  invitationId        String
  invitation          Invitation      @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  participantTypeId   String
  participantType     ParticipantType @relation(fields: [participantTypeId], references: [id], onDelete: Cascade)
  accessLevel         AccessLevel
  quota               Int?
  sourceRestrictionId String?
  sourceRestriction   Restriction?    @relation(fields: [sourceRestrictionId], references: [id], onDelete: SetNull)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@unique([invitationId, participantTypeId, accessLevel])
  @@index([invitationId])
  @@index([sourceRestrictionId])
}
```

### 3.5 Workflow Domain

#### Workflow

```prisma
model Workflow {
  id                String          @id @default(cuid())
  name              String
  tenantId          String
  tenant            Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId           String
  event             Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantTypeId String
  participantType   ParticipantType @relation(fields: [participantTypeId], references: [id], onDelete: Cascade)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  deletedAt         DateTime?

  steps    Step[]
  versions WorkflowVersion[]

  @@unique([tenantId, eventId, participantTypeId, name])
  @@index([eventId, participantTypeId])
  @@index([deletedAt])
}
```

**Design notes:**

- Each workflow is scoped to a specific event + participant type combination. A diplomatic summit might have different approval pipelines for Delegates (3-step) vs. Media (5-step with press card verification).
- Soft delete via `deletedAt` preserves workflow history for audit while allowing logical removal.

#### WorkflowVersion

```prisma
model WorkflowVersion {
  id         String   @id @default(cuid())
  workflowId String
  workflow   Workflow  @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  version    Int
  snapshot   Json     // Full serialized workflow + steps at time of version
  createdAt  DateTime @default(now())

  participants Participant[]

  @@unique([workflowId, version])
  @@index([workflowId])
}
```

**Design notes:**

- Every time a workflow is modified, a new version is created with a complete JSON snapshot. Participants in-flight continue to reference their original version, ensuring mid-process workflow changes do not break existing registrations.

#### Step

```prisma
model Step {
  id         String   @id @default(cuid())
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  order      Int
  name       String
  action     Action
  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  roleId     String
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  // Routing
  nextStepId         String?
  isRejectionTarget  Boolean  @default(false)
  isBypassTarget     Boolean  @default(false)

  // Conditional routing (advanced)
  conditions         Json     @default("[]")
  // [{"field": "participantType.name", "op": "eq", "value": "VIP", "nextStepId": "..."}]

  // Configuration
  requiresAssignment Boolean  @default(true)
  slaDurationMinutes Int?
  autoAction         Json?    // Auto-action rules: {"rule": "autoApprove", "conditions": [...]}

  // Visual builder position
  positionX          Float?
  positionY          Float?

  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  participants Participant[]
  approvals    Approval[]
  userAccess   UserEventAccess[]
  assignments  StepAssignment[]

  @@unique([tenantId, workflowId, roleId, action, name])
  @@index([workflowId, action])
  @@index([workflowId, isBypassTarget])
  @@index([workflowId, isRejectionTarget])
  @@index([roleId])
}
```

**Design notes:**

- `conditions` (JSONB) enables conditional routing: VIP participants skip the document verification step; security personnel route to a weapon permit check step.
- `slaDurationMinutes` triggers escalation notifications when a participant has been at a step beyond the allowed duration.
- `autoAction` (JSONB) enables rules like auto-approve if all documents are verified, or auto-reject after 72 hours of inactivity.
- `positionX`/`positionY` store node positions for the visual workflow builder (@xyflow/react).

#### StepAssignment

```prisma
model StepAssignment {
  id            String    @id @default(cuid())
  participantId String
  stepId        String
  assignedTo    String
  assignedBy    String
  assignedAt    DateTime  @default(now())
  completedAt   DateTime?

  @@index([assignedTo, completedAt])
  @@index([participantId])
}
```

#### Approval

```prisma
model Approval {
  id            String         @id @default(cuid())
  participantId String
  participant   Participant    @relation(fields: [participantId], references: [id], onDelete: Cascade)
  stepId        String
  step          Step           @relation(fields: [stepId], references: [id], onDelete: Cascade)
  action        Action         @default(APPROVE)
  result        ApprovalResult
  remarks       String?
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([participantId, stepId, userId, createdAt])
  @@index([participantId, createdAt])
  @@index([userId, createdAt])
  @@index([stepId])
}
```

**Design notes:**

- The composite unique on `[participantId, stepId, userId, createdAt]` allows the same user to re-approve after a rejection-resubmit cycle (different `createdAt`).
- `result` captures the outcome (APPROVED, REJECTED, RETURNED, ESCALATED); `action` captures the step type where the decision was made.

#### WorkflowTemplate

```prisma
model WorkflowTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  steps       StepTemplate[]

  @@unique([tenantId, name])
}
```

#### StepTemplate

```prisma
model StepTemplate {
  id                 String           @id @default(cuid())
  workflowTemplateId String
  workflowTemplate   WorkflowTemplate @relation(fields: [workflowTemplateId], references: [id], onDelete: Cascade)
  order              Int
  name               String
  action             Action
  roleId             String
  role               Role             @relation(fields: [roleId], references: [id], onDelete: Cascade)
  conditions         Json             @default("[]")
  slaDurationMinutes Int?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  @@index([workflowTemplateId, order])
}
```

### 3.6 Content Domain

#### BadgeTemplate

```prisma
model BadgeTemplate {
  id          String  @id @default(cuid())
  tenantId    String
  tenant      Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  width       Float   @default(153)
  height      Float   @default(243)
  borderWidth  Float  @default(0)
  borderColor  String @default("#000000")
  borderRadius Float  @default(0)
  elements    Json    @default("[]")
  badgeIdPrefix String @default("BADGE")
  isDefault   Boolean @default(false)
  templates   Template[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, name])
  @@index([tenantId])
}
```

**Design notes:**

- `elements` (JSONB) stores the visual layout: positioned text fields, images, QR codes, barcodes, and colored regions. Each element has `type`, `x`, `y`, `width`, `height`, `style`, and `dataBinding` (maps to participant fields).
- Default dimensions (153 x 243 mm) correspond to standard ISO/IEC 7810 ID-1 badge size.

#### Template

```prisma
model Template {
  id                String          @id @default(cuid())
  name              String
  description       String?
  templateType      TemplateType
  tenantId          String
  tenant            Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId           String
  event             Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantTypeId String
  participantType   ParticipantType @relation(fields: [participantTypeId], references: [id], onDelete: Cascade)
  badgeTemplateId   String?
  badgeTemplate     BadgeTemplate?  @relation(fields: [badgeTemplateId], references: [id], onDelete: SetNull)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  attachments       Attachment[]

  @@unique([tenantId, eventId, templateType, name])
}
```

#### Attachment

```prisma
model Attachment {
  id          String   @id @default(cuid())
  templateId  String
  template    Template @relation(fields: [templateId], references: [id], onDelete: Cascade)
  fileName    String
  fileSize    Int
  mimeType    String
  storageUrl  String
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([templateId, sortOrder])
}
```

#### FormTemplate

```prisma
model FormTemplate {
  id                String           @id @default(cuid())
  tenantId          String
  tenant            Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId           String?
  event             Event?           @relation(fields: [eventId], references: [id])
  name              String
  description       String?
  version           Int              @default(1)
  definition        Json             // The full form layout JSON
  participantTypeId String?
  participantType   ParticipantType? @relation(fields: [participantTypeId], references: [id])
  isActive          Boolean          @default(true)
  publishedAt       DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@unique([tenantId, eventId, participantTypeId, name])
  @@index([tenantId, eventId])
}
```

**Design notes:**

- `definition` (JSONB) contains the full form layout hierarchy: pages > sections > fields, with conditional visibility rules, column spans, and validation overrides. See Module 02 for the complete JSON schema.
- `version` is incremented on each publish. Previous versions are preserved for participants who started registration on an older layout.

#### SectionTemplate

```prisma
model SectionTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  definition  Json     // Section JSON with fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, name])
}
```

### 3.7 Notification Domain

#### Notification

```prisma
model Notification {
  id        String           @id @default(cuid())
  tenantId  String
  tenant    Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  readAt    DateTime?
  metadata  Json?
  createdAt DateTime         @default(now())

  @@index([userId, readAt, createdAt])
  @@index([tenantId])
}
```

**Design notes:**

- `readAt` is null for unread notifications. The index on `[userId, readAt, createdAt]` efficiently supports "unread count" queries (`WHERE userId = ? AND readAt IS NULL`) and "recent notifications" queries (ordered by `createdAt DESC`).
- `metadata` (JSONB) stores contextual links: `{"participantId": "...", "eventId": "...", "stepId": "..."}` enabling deep-linking from the notification to the relevant record.

#### NotificationPreference

```prisma
model NotificationPreference {
  id      String              @id @default(cuid())
  userId  String
  user    User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel NotificationChannel
  enabled Boolean             @default(true)

  @@unique([userId, channel])
}
```

### 3.8 Audit & System Domain

#### AuditLog

```prisma
model AuditLog {
  id          String          @id @default(cuid())
  tenantId    String?
  tenant      Tenant?         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  action      AuditAction
  entityType  AuditEntityType
  entityId    String?
  description String
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime        @default(now())

  @@index([tenantId, action])
  @@index([tenantId, entityType, entityId])
  @@index([tenantId, userId])
  @@index([createdAt])
}
```

**Design notes:**

- AuditLog is append-only -- no `updatedAt`, no `deletedAt`. Records are immutable once written.
- `tenantId` and `userId` are nullable to capture system-level events (cron jobs, migrations) and pre-authentication events (failed login attempts).
- `metadata` (JSONB) stores before/after snapshots for change tracking: `{"before": {"status": "PENDING"}, "after": {"status": "APPROVED"}}`.
- This table is the primary candidate for range partitioning by `createdAt` (see Section 5.3).

#### SystemSetting

```prisma
model SystemSetting {
  id          String      @id @default(cuid())
  key         String
  value       String
  type        SettingType @default(STRING)
  category    String
  label       String
  description String?
  tenantId    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([key, tenantId])
  @@index([category])
  @@index([tenantId])
}
```

**Design notes:**

- Settings are scoped: `tenantId = NULL` means global default; a tenant-specific row overrides the global value.
- `type` determines how `value` (always stored as string) is parsed: STRING, NUMBER, BOOLEAN, JSON, ENUM, SECRET.
- SECRET type values are encrypted at rest and masked in UI responses.

#### CustomReport

```prisma
model CustomReport {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  definition  Json     // Query definition: filters, columns, groupBy, sortBy, chartType
  schedule    String?  // Cron expression for automated generation
  lastRunAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, userId, name])
  @@index([tenantId])
}
```

#### SavedView

```prisma
model SavedView {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String?
  name        String
  type        ViewType @default(TABLE)
  targetModel String
  config      Json
  isDefault   Boolean  @default(false)
  isPublic    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, targetModel])
}
```

#### DatabaseBackup

```prisma
model DatabaseBackup {
  id          String   @id @default(cuid())
  tenantId    String?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fileName    String
  fileSize    BigInt?
  storageUrl  String?
  status      String   // PENDING, IN_PROGRESS, COMPLETED, FAILED
  startedAt   DateTime @default(now())
  completedAt DateTime?
  errorMessage String?
  metadata    Json?    // Tables included, row counts, compression ratio

  @@index([userId, startedAt])
}
```

### 3.9 Custom Objects Domain

#### CustomObjectDef

```prisma
model CustomObjectDef {
  id          String      @id @default(cuid())
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  slug        String
  description String?
  icon        String?
  color       String?
  scope       ObjectScope @default(EVENT)

  permissions  Json @default("{}")
  listLayout   Json @default("{}")
  detailLayout Json @default("{}")
  formLayout   Json @default("{}")

  fields  FieldDefinition[]
  records CustomObjectRecord[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId])
}
```

#### FieldDefinition

```prisma
model FieldDefinition {
  id                String           @id @default(cuid())
  tenantId          String
  tenant            Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Target: built-in model or custom object
  targetModel       String?          // "Participant", "Event", null for custom objects
  customObjectDefId String?
  customObjectDef   CustomObjectDef? @relation(fields: [customObjectDefId], references: [id])

  // Scoping
  eventId           String?
  event             Event?           @relation(fields: [eventId], references: [id])
  participantTypeId String?
  participantType   ParticipantType? @relation(fields: [participantTypeId], references: [id])

  // Definition
  name        String           // Storage key: "weapon_permit_number"
  label       String           // Display: "Weapon Permit Number"
  description String?          // Help text
  dataType    FieldDataType
  sortOrder   Int    @default(0)

  // Constraints
  isRequired   Boolean @default(false)
  isUnique     Boolean @default(false)
  isSearchable Boolean @default(false)
  isFilterable Boolean @default(false)
  defaultValue String?

  // Type-specific configuration
  config     Json @default("{}")
  // TEXT:    {"maxLength": 100, "pattern": "^WP-\\d+$"}
  // NUMBER:  {"min": 0, "max": 999, "decimalPlaces": 2}
  // ENUM:    {"options": [{"value":"low","label":"Low","color":"#22c55e"}]}
  // DATE:    {"minDate": "2026-01-01", "maxDate": "2026-12-31"}
  // FILE:    {"allowedTypes": ["image/jpeg","application/pdf"], "maxSizeMB": 5}
  // REFERENCE: {"targetObjectSlug": "vehicle", "displayField": "plate_number"}

  // UI rendering hints
  uiConfig   Json @default("{}")
  // {"widget": "textarea", "rows": 3, "section": "Travel",
  //  "placeholder": "Enter permit number", "width": "half"}

  // Validation rules (beyond basic type validation)
  validation Json @default("[]")
  // [{"rule": "regex", "value": "^[A-Z]{2}\\d{7}$", "message": "Invalid format"}]
  // [{"rule": "requiredIf", "field": "needsVisa", "value": true}]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, targetModel, customObjectDefId, eventId, participantTypeId, name])
  @@index([tenantId, targetModel, eventId])
  @@index([eventId, participantTypeId, sortOrder])
}
```

#### CustomObjectRecord

```prisma
model CustomObjectRecord {
  id            String          @id @default(cuid())
  tenantId      String
  tenant        Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  objectDefId   String
  objectDef     CustomObjectDef @relation(fields: [objectDefId], references: [id], onDelete: Cascade)
  eventId       String?
  event         Event?          @relation(fields: [eventId], references: [id])
  participantId String?
  participant   Participant?    @relation(fields: [participantId], references: [id])
  data          Json            @default("{}")
  sortOrder     Float?
  createdBy     String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?

  @@index([tenantId, objectDefId, eventId])
  @@index([deletedAt])
}
```

### 3.10 Reference Data

#### Country

```prisma
model Country {
  id        String   @id @default(cuid())
  name      String   @unique
  code      String   @unique  // ISO 3166-1 alpha-2
  code3     String?  @unique  // ISO 3166-1 alpha-3
  numeric   String?           // ISO 3166-1 numeric
  region    String?           // Africa, Asia, Europe, etc.
  subRegion String?           // Eastern Africa, Western Europe, etc.
  flagEmoji String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  nationalityParticipants Participant[] @relation("Nationality")
  countryParticipants     Participant[] @relation("Country")

  @@index([code])
  @@index([isActive])
}
```

#### Title

```prisma
model Title {
  id           String   @id @default(cuid())
  name         String   @unique  // "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "H.E.", "Hon."
  abbreviation String?
  sortOrder    Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  participants Participant[]

  @@index([isActive, sortOrder])
}
```

#### Menu

```prisma
model Menu {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  roles       Role[]
  items       MenuItem[]

  @@index([isActive])
}
```

#### MenuItem

```prisma
model MenuItem {
  id          String    @id @default(cuid())
  menuId      String
  menu        Menu      @relation(fields: [menuId], references: [id], onDelete: Cascade)
  label       String
  url         String?
  icon        String?
  parentId    String?   // Self-referencing for nested menus
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  roles       Role[]

  @@index([menuId, parentId, sortOrder])
}
```

#### UserEventAccess

```prisma
model UserEventAccess {
  id      String @id @default(cuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId String
  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  roleId  String
  role    Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  stepId  String?
  step    Step?  @relation(fields: [stepId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, eventId, roleId])
  @@index([userId, eventId])
  @@index([eventId, roleId])
}
```

**Design notes:**

- This junction table grants a user a specific role within a specific event, optionally scoped to a specific workflow step. A validator might have the "Validator" role for "AU Summit" at the "Document Verification" step.

### 3.11 All Enums

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
  LOCKED
  SUSPENDED
}

enum RoleScope {
  GLOBAL
  TENANT
  EVENT
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELED
  COMPLETED
  POSTPONED
  RESCHEDULED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum RequestStatus {
  PENDING
  INPROGRESS
  APPROVED
  REJECTED
  CANCELLED
  PRINTED
  COLLECTED
  NOTIFIED
  ARCHIVED
  BYPASSED
}

enum Action {
  APPROVE
  REJECT
  NOTIFY
  PRINT
  COLLECT
  ARCHIVE
  CANCEL
  BYPASS
  REPRINT
}

enum ApprovalResult {
  APPROVED
  REJECTED
  RETURNED
  ESCALATED
}

enum AccessLevel {
  OPEN
  CLOSED
}

enum TemplateType {
  BADGE
  CERTIFICATE
  INVITATION_LETTER
  CONFIRMATION
  REJECTION
}

enum NotificationType {
  APPROVAL
  REJECTION
  SLA_WARNING
  ASSIGNMENT
  SYSTEM
  BROADCAST
}

enum NotificationChannel {
  EMAIL
  IN_APP
  SMS
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  APPROVE
  REJECT
  PRINT
  COLLECT
  EXPORT
  IMPORT
  CONFIGURE
}

enum AuditEntityType {
  USER
  PARTICIPANT
  EVENT
  WORKFLOW
  STEP
  INVITATION
  TEMPLATE
  BADGE
  SETTING
  ROLE
  REPORT
  BACKUP
}

enum SettingType {
  STRING
  NUMBER
  BOOLEAN
  JSON
  ENUM
  SECRET    // Encrypted at rest, masked in UI
}

enum FieldDataType {
  TEXT
  LONG_TEXT
  NUMBER
  BOOLEAN
  DATE
  DATETIME
  ENUM
  MULTI_ENUM
  EMAIL
  URL
  PHONE
  FILE
  IMAGE
  REFERENCE
  FORMULA
  AUTO_NUMBER
  COUNTRY
  USER
}

enum ObjectScope {
  TENANT
  EVENT
}

enum ViewType {
  TABLE
  KANBAN
  CALENDAR
  GALLERY
}
```

---

## 4. API Specification

### 4.1 Database Health API

```
GET /api/health/db
```

Returns database connectivity and performance metrics. Called by load balancers, monitoring, and the platform admin dashboard.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "latencyMs": 3,
  "connections": {
    "active": 12,
    "idle": 8,
    "max": 20
  },
  "replication": {
    "lagBytes": 0,
    "lagSeconds": 0,
    "replicaStatus": "streaming"
  },
  "diskUsage": {
    "totalGB": 100,
    "usedGB": 34.2,
    "percentUsed": 34.2
  }
}
```

**Implementation:**

```typescript
// app/routes/api.health.db.ts
export async function loader() {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);

    const [poolStats] = await prisma.$queryRaw<any[]>`
      SELECT count(*) FILTER (WHERE state = 'active') as active,
             count(*) FILTER (WHERE state = 'idle') as idle,
             (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    return json({
      status: latencyMs < 100 ? "healthy" : "degraded",
      latencyMs,
      connections: poolStats,
    });
  } catch (error) {
    return json({ status: "unhealthy", error: error.message }, { status: 503 });
  }
}
```

### 4.2 Migration Status API

```
GET /api/admin/migrations
```

Returns the current migration state, pending migrations, and migration history. Restricted to platform admin role.

**Response (200 OK):**

```json
{
  "currentVersion": "20260205_add_custom_objects",
  "pendingMigrations": [],
  "appliedCount": 47,
  "lastAppliedAt": "2026-02-05T14:30:00Z",
  "databaseVersion": "PostgreSQL 16.2"
}
```

### 4.3 Schema Introspection API

```
GET /api/admin/schema
```

Returns model metadata for admin tooling: table names, column counts, row counts, index counts, and estimated table sizes.

**Response (200 OK):**

```json
{
  "tables": [
    {
      "name": "Participant",
      "columns": 28,
      "rowEstimate": 4850,
      "indexCount": 7,
      "sizeBytes": 15728640,
      "toastSizeBytes": 2097152
    }
  ],
  "totalSizeBytes": 524288000,
  "enumTypes": ["UserStatus", "EventStatus", "RequestStatus", "..."]
}
```

---

## 5. Business Logic

### 5.1 Data Lifecycle Management

#### Record Creation Patterns

All records follow a consistent creation pattern:

1. **Generate CUID** -- Prisma's `@default(cuid())` generates a globally unique, time-sortable identifier. No sequence contention across nodes.
2. **Set timestamps** -- `createdAt` is set via `@default(now())`; `updatedAt` is managed by Prisma's `@updatedAt`.
3. **Validate tenant scope** -- Every mutation verifies that `tenantId` matches the authenticated user's tenant. This is enforced in the data access layer, not in individual routes.
4. **Emit audit log** -- After successful creation, an AuditLog record is written with `action: CREATE`, `entityType`, `entityId`, and the full record as `metadata`.

#### Soft Delete Strategy

Models with `deletedAt` columns use soft delete. The following models support soft delete:

- `User` -- preserves audit trail and allows account reactivation
- `Event` -- preserves participant data and workflow history
- `Participant` -- preserves approval history and badge collection records
- `Workflow` -- preserves version history for in-flight participants
- `CustomObjectRecord` -- preserves data lineage

**Implementation pattern:**

```typescript
// Soft delete
await prisma.participant.update({
  where: { id: participantId },
  data: { deletedAt: new Date() },
});

// Query active records (default scope)
const participants = await prisma.participant.findMany({
  where: {
    eventId,
    deletedAt: null, // Always filter soft-deleted records
  },
});
```

**Partial index optimization:**

```sql
-- Partial index excludes soft-deleted rows, reducing index size
CREATE INDEX idx_participant_active
ON "Participant" ("eventId", "stepId", "status")
WHERE "deletedAt" IS NULL;
```

#### Archival Policies

| Data Type                      | Hot Storage           | Warm Storage            | Cold/Archive            | Purge          |
| ------------------------------ | --------------------- | ----------------------- | ----------------------- | -------------- |
| Active Participant             | PostgreSQL primary    | --                      | --                      | Never (active) |
| Completed Event (< 1 year)     | PostgreSQL primary    | --                      | --                      | --             |
| Completed Event (1-3 years)    | --                    | PostgreSQL read replica | --                      | --             |
| Completed Event (> 3 years)    | --                    | --                      | Azure Blob (pg_dump)    | 7 years        |
| AuditLog (< 6 months)          | PostgreSQL primary    | --                      | --                      | --             |
| AuditLog (6-24 months)         | Partitioned (primary) | --                      | --                      | --             |
| AuditLog (> 24 months)         | --                    | --                      | Azure Blob (CSV export) | 7 years        |
| Session (expired)              | --                    | --                      | --                      | 30 days        |
| Notification (read, > 90 days) | --                    | --                      | --                      | Purge          |

#### GDPR Purge

When a user requests data deletion under GDPR Article 17:

1. Anonymize `Participant` records: replace `firstName`, `familyName`, `email`, `dateOfBirth` with `"[REDACTED]"`, clear `customData` of PII fields.
2. Delete `ParticipantDocument` records and their Azure Blob Storage files.
3. Delete `UserImage` record.
4. Anonymize `AuditLog` entries: replace `description` with `"[REDACTED BY GDPR REQUEST]"`, clear `metadata`.
5. Retain the `User` shell record with `deletedAt` set and `email`/`username` replaced with `deleted_<cuid>@redacted.invalid`.
6. Log the purge action itself as an AuditLog entry for compliance.

### 5.2 Index Strategy

#### Composite Indexes Explained

Every composite index is designed for specific query patterns:

| Index                                               | Target Query                                                       | Used By                                   |
| --------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| `Participant(eventId, stepId, status)`              | Queue view: "all pending participants at this step for this event" | Validator, Printer, Dispatcher dashboards |
| `Participant(tenantId, eventId, participantTypeId)` | Filter by type: "all Media participants for this event"            | Admin participant list                    |
| `Participant(status, createdAt)`                    | Time-series: "approved registrations this week"                    | Analytics dashboard                       |
| `AuditLog(tenantId, entityType, entityId)`          | Entity history: "all changes to this participant"                  | Audit trail viewer                        |
| `AuditLog(tenantId, userId)`                        | User activity: "all actions by this user"                          | Security audit                            |
| `Approval(participantId, createdAt)`                | Approval timeline: "all decisions for this participant"            | Participant detail view                   |
| `Notification(userId, readAt, createdAt)`           | Unread count and recent notifications                              | Notification bell                         |

#### GIN Indexes for JSONB

GIN (Generalized Inverted Index) indexes support containment queries on entire JSONB documents:

```sql
-- GIN index on Participant.customData for @> containment queries
CREATE INDEX idx_participant_custom_data_gin
ON "Participant" USING GIN ("customData");

-- Query: find participants where customData contains visa_status = "approved"
SELECT * FROM "Participant"
WHERE "customData" @> '{"visa_status": "approved"}'
AND "deletedAt" IS NULL;

-- GIN index on Event.customData
CREATE INDEX idx_event_custom_data_gin
ON "Event" USING GIN ("customData");
```

**When to use GIN vs. expression indexes:**

- **GIN**: best for ad-hoc queries across many JSONB keys, or containment checks on nested structures.
- **Expression index**: best for frequently filtered specific keys where you know the path and type.

#### Expression Indexes for Custom Fields

When a `FieldDefinition` is marked `isSearchable: true`, the system auto-creates an expression index:

```sql
-- Auto-created when admin marks "visa_status" as searchable
CREATE INDEX CONCURRENTLY idx_participant_cf_visa_status
ON "Participant" (("customData"->>'visa_status'))
WHERE "deletedAt" IS NULL;

-- Auto-created when admin marks "weapon_permit_number" as searchable
CREATE INDEX CONCURRENTLY idx_participant_cf_weapon_permit_number
ON "Participant" (("customData"->>'weapon_permit_number'))
WHERE "deletedAt" IS NULL;

-- Numeric cast for number fields
CREATE INDEX CONCURRENTLY idx_participant_cf_delegation_size
ON "Participant" ((("customData"->>'delegation_size')::INTEGER))
WHERE "deletedAt" IS NULL;
```

**Query plan analysis for expression index:**

```sql
EXPLAIN ANALYZE
SELECT * FROM "Participant"
WHERE "customData"->>'visa_status' = 'approved'
AND "eventId" = 'clx...'
AND "deletedAt" IS NULL;

-- Expected plan with expression index:
-- Index Scan using idx_participant_cf_visa_status
--   Index Cond: (("customData"->>'visa_status') = 'approved')
--   Filter: (("eventId" = 'clx...') AND ("deletedAt" IS NULL))
--   Rows Removed by Filter: 12
--   Actual Rows: 847
--   Execution Time: 2.3ms
```

### 5.3 Partitioning Strategy

#### AuditLog Partitioning (by month)

AuditLog is the highest-volume table (estimated 500K+ rows per large event). Range partitioning by `createdAt` month ensures:

- Queries for recent audit entries scan only the current partition.
- Old partitions can be detached and archived without affecting live queries.
- Index sizes remain manageable per partition.

```sql
-- Convert AuditLog to partitioned table
CREATE TABLE "AuditLog_partitioned" (
  LIKE "AuditLog" INCLUDING ALL
) PARTITION BY RANGE ("createdAt");

-- Create monthly partitions
CREATE TABLE "AuditLog_2026_01" PARTITION OF "AuditLog_partitioned"
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE "AuditLog_2026_02" PARTITION OF "AuditLog_partitioned"
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE "AuditLog_2026_03" PARTITION OF "AuditLog_partitioned"
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
-- ... continue for each month

-- Default partition for out-of-range data
CREATE TABLE "AuditLog_default" PARTITION OF "AuditLog_partitioned" DEFAULT;
```

#### Notification Partitioning (by month)

```sql
CREATE TABLE "Notification_partitioned" (
  LIKE "Notification" INCLUDING ALL
) PARTITION BY RANGE ("createdAt");

CREATE TABLE "Notification_2026_01" PARTITION OF "Notification_partitioned"
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- ... monthly partitions
```

#### Participant Partitioning (by event)

For tenants with many events, list partitioning by `eventId` isolates each event's participants:

```sql
CREATE TABLE "Participant_partitioned" (
  LIKE "Participant" INCLUDING ALL
) PARTITION BY LIST ("eventId");

CREATE TABLE "Participant_event_clx123" PARTITION OF "Participant_partitioned"
  FOR VALUES IN ('clx123...');
CREATE TABLE "Participant_event_clx456" PARTITION OF "Participant_partitioned"
  FOR VALUES IN ('clx456...');
CREATE TABLE "Participant_default" PARTITION OF "Participant_partitioned" DEFAULT;
```

#### Partition Management Automation

```typescript
// app/jobs/partition-manager.server.ts

export async function ensureMonthlyPartitions(tableName: string, monthsAhead: number = 3) {
  const now = new Date();

  for (let i = 0; i <= monthsAhead; i++) {
    const partitionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const partitionName = `${tableName}_${formatYYYYMM(partitionDate)}`;

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${partitionName}"
      PARTITION OF "${tableName}_partitioned"
      FOR VALUES FROM ('${partitionDate.toISOString()}')
      TO ('${nextMonth.toISOString()}')
    `);
  }
}

export async function archiveOldPartitions(tableName: string, retainMonths: number = 24) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retainMonths);
  const partitionName = `${tableName}_${formatYYYYMM(cutoff)}`;

  // Detach partition (instant, no data movement)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "${tableName}_partitioned"
    DETACH PARTITION "${partitionName}"
  `);

  // Export to Azure Blob Storage as compressed CSV
  // await exportPartitionToBlob(partitionName)

  // Drop after confirmed export
  // await prisma.$executeRawUnsafe(`DROP TABLE "${partitionName}"`)
}
```

### 5.4 Seed Data Requirements

The following data must be seeded on initial deployment:

**System Roles:**

| Role Name        | Scope  | Description                             |
| ---------------- | ------ | --------------------------------------- |
| `Platform Admin` | GLOBAL | Full system access, tenant management   |
| `Tenant Admin`   | TENANT | Full tenant access, event management    |
| `Event Manager`  | EVENT  | Event configuration, workflow setup     |
| `Validator`      | EVENT  | Review and approve/reject registrations |
| `Printer`        | EVENT  | Print badges                            |
| `Dispatcher`     | EVENT  | Badge collection and distribution       |
| `Focal Point`    | EVENT  | Manage delegation registrations         |
| `Viewer`         | EVENT  | Read-only access to event data          |

**Default Permissions (subset):**

| Action    | Entity        | Access     | Assigned To    |
| --------- | ------------- | ---------- | -------------- |
| `manage`  | `*`           | `any`      | Platform Admin |
| `manage`  | `event`       | `any`      | Tenant Admin   |
| `read`    | `participant` | `assigned` | Validator      |
| `approve` | `participant` | `assigned` | Validator      |
| `reject`  | `participant` | `assigned` | Validator      |
| `print`   | `participant` | `any`      | Printer        |
| `collect` | `participant` | `any`      | Dispatcher     |
| `create`  | `participant` | `own`      | Focal Point    |
| `read`    | `participant` | `own`      | Focal Point    |

**Countries:** Seeded from ISO 3166-1 standard (250 entries with alpha-2, alpha-3, region, sub-region).

**Titles:** Mr., Mrs., Ms., Dr., Prof., H.E. (His/Her Excellency), Hon. (Honourable), Rev., Amb. (Ambassador).

### 5.5 Migration Safety

#### Expand-and-Contract Pattern

All schema changes follow the expand-and-contract pattern for zero-downtime deployments:

```
Phase 1: EXPAND (deploy code that writes to both old and new)
  - Add new column with NULL default or new table
  - Deploy application code that writes to both old and new locations
  - Both old and new application versions work correctly

Phase 2: MIGRATE (backfill existing data)
  - Run background job to populate new column/table from old data
  - Verify data consistency with checksums

Phase 3: CONTRACT (deploy code that reads from new only)
  - Deploy application code that reads from new location
  - Remove reads from old location
  - After verification period, drop old column/table
```

**Example: Adding `deletedAt` to a model that previously used hard delete:**

```sql
-- Phase 1: Add column (backwards compatible, no data change)
ALTER TABLE "Template" ADD COLUMN "deletedAt" TIMESTAMPTZ;

-- Phase 2: No backfill needed (all existing records have NULL deletedAt = active)

-- Phase 3: Update queries to filter by deletedAt IS NULL
-- Deploy code change, then add index:
CREATE INDEX CONCURRENTLY idx_template_deleted_at ON "Template" ("deletedAt");
```

#### Backwards-Compatible Changes

These changes are safe to apply without coordinated deployment:

- Adding a nullable column
- Adding a new table
- Adding an index (use `CONCURRENTLY`)
- Adding a new enum value (append only)
- Widening a column type (e.g., `VARCHAR(100)` to `VARCHAR(255)`)

These changes require expand-and-contract:

- Renaming a column or table
- Removing a column
- Changing a column type
- Adding a NOT NULL constraint to an existing column
- Removing an enum value

#### Feature-Flag-Gated Schema Changes

For large schema changes, feature flags gate the new schema:

```typescript
// Check feature flag before using new table
const tenant = await getTenant(request);
if (tenant.featureFlags?.customObjects) {
  // Use CustomObjectDef, FieldDefinition, CustomObjectRecord
} else {
  // Fall back to legacy behavior
}
```

### 5.6 Connection Management

#### Pool Sizing Formula

Connection pool size follows the PostgreSQL best practice formula:

```
connections = (physical_cores * 2) + effective_spindle_count
```

For a typical deployment (4-core VM with SSD):

```
connections = (4 * 2) + 1 = 9
```

Rounded up to **10 connections** per application instance. With 3 application instances behind a load balancer, total connections = 30, well within PostgreSQL's default `max_connections = 100`.

#### Prisma Pool Configuration

```
DATABASE_URL="postgresql://user:pass@host:5432/accreditation?connection_limit=10&pool_timeout=10&connect_timeout=5"
```

| Parameter          | Value | Rationale                                    |
| ------------------ | ----- | -------------------------------------------- |
| `connection_limit` | 10    | Per-instance pool size per formula above     |
| `pool_timeout`     | 10s   | Max wait time for a connection from the pool |
| `connect_timeout`  | 5s    | Max time to establish a new connection       |

#### Query Timeouts

```sql
-- Set statement timeout for all queries (30 seconds max)
ALTER DATABASE accreditation SET statement_timeout = '30s';

-- Override for specific long-running operations
SET LOCAL statement_timeout = '120s';  -- For report generation
SET LOCAL statement_timeout = '300s';  -- For bulk imports
```

#### Slow Query Logging

```sql
-- Log queries taking longer than 500ms
ALTER DATABASE accreditation SET log_min_duration_statement = 500;
ALTER DATABASE accreditation SET log_statement = 'none';  -- Don't log all statements
ALTER DATABASE accreditation SET log_line_prefix = '%t [%p]: user=%u,db=%d,app=%a ';
```

Application-level slow query detection:

```typescript
// app/utils/db.server.ts
prisma.$use(async (params, next) => {
  const start = performance.now();
  const result = await next(params);
  const duration = performance.now() - start;

  if (duration > 500) {
    logger.warn({
      msg: "Slow query detected",
      model: params.model,
      action: params.action,
      duration: Math.round(duration),
      args: JSON.stringify(params.args).substring(0, 500),
    });
  }

  return result;
});
```

#### Read Replica Routing

Analytics and reporting queries route to a read replica to avoid impacting transactional workloads:

```typescript
// app/utils/db.server.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export const prismaReadOnly = new PrismaClient({
  datasourceUrl: process.env.DATABASE_REPLICA_URL,
});

// Usage in analytics loader
export async function loader({ request }: LoaderFunctionArgs) {
  const stats = await prismaReadOnly.participant.groupBy({
    by: ["status"],
    _count: true,
    where: { eventId, deletedAt: null },
  });
  return json({ stats });
}
```

---

## 6. User Interface

### 6.1 Database Admin Views

The platform admin dashboard provides database visibility:

**Table Overview:**

- Row counts per table (estimated via `pg_stat_user_tables`)
- Table size on disk (data + indexes + TOAST)
- Index usage statistics (scans, rows read, rows fetched)
- Dead tuple counts (indicating VACUUM needs)

**Slow Query Log:**

- Queries exceeding threshold with duration, plan, and frequency
- Sortable by duration, frequency, or total time

**Connection Monitor:**

- Active/idle/waiting connections
- Long-running transactions
- Lock contention

**Migration History:**

- Applied migrations with timestamps
- Pending migrations with preview
- Rollback capability (with confirmation)

### 6.2 Data Export Interfaces

**CSV Export:**

- All list views include a "Download CSV" button
- Exports respect current filters, sort, and column selection
- JSONB `customData` fields are flattened into individual columns
- Large exports (>10,000 rows) are processed as background jobs with download notification

**JSON Export:**

- Full record export including nested relations
- Used for event cloning and cross-tenant data transfer

**Database Backup:**

- Platform admin can trigger full `pg_dump` via UI
- Backup file stored in Azure Blob Storage
- Tracked in `DatabaseBackup` table with status and download link

---

## 7. Integration Points

### 7.1 Per-Module Data Ownership Matrix

| Model             | Owner Module        | Reads                          | Writes                    |
| ----------------- | ------------------- | ------------------------------ | ------------------------- |
| `Tenant`          | 01 - Data Model     | All modules                    | Module 01, Module 05      |
| `User`            | 05 - Security       | All modules                    | Module 05                 |
| `Event`           | 01 - Data Model     | All modules                    | Module 01                 |
| `Participant`     | 03 - Registration   | Modules 01, 04, 05, 06, 07, 08 | Module 03, Module 04      |
| `Workflow`        | 04 - Workflow       | Modules 01, 03                 | Module 04                 |
| `Step`            | 04 - Workflow       | Modules 01, 03, 05             | Module 04                 |
| `Approval`        | 04 - Workflow       | Modules 01, 03, 08             | Module 04                 |
| `FieldDefinition` | 02 - Dynamic Schema | Modules 01, 03                 | Module 02                 |
| `AuditLog`        | 08 - Audit          | Modules 01, 05                 | All modules (append-only) |
| `Notification`    | 07 - Notification   | Module 01                      | Module 07                 |
| `BadgeTemplate`   | 06 - Badge          | Modules 01, 03                 | Module 06                 |
| `FormTemplate`    | 02 - Dynamic Schema | Modules 01, 03                 | Module 02                 |
| `SystemSetting`   | 01 - Data Model     | All modules                    | Module 01, Module 05      |

### 7.2 Cross-Domain Query Patterns

**Participant Queue View (Workflow + Registration + Identity):**

```typescript
const queue = await prisma.participant.findMany({
  where: {
    eventId,
    stepId: currentStep.id,
    status: "PENDING",
    deletedAt: null,
  },
  include: {
    user: { select: { name: true, email: true } },
    participantType: { select: { name: true, priority: true } },
    title: { select: { name: true } },
    nationality: { select: { name: true, code: true } },
    documents: { select: { documentType: true, verifiedAt: true } },
    approvals: {
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  },
  orderBy: [{ participantType: { priority: "desc" } }, { createdAt: "asc" }],
});
```

**Event Dashboard (Event + Registration + Workflow + Notification):**

```typescript
const [participantStats, workflowStats, notificationCount] = await Promise.all([
  prisma.participant.groupBy({
    by: ["status"],
    _count: true,
    where: { eventId, deletedAt: null },
  }),
  prisma.approval.count({
    where: {
      participant: { eventId },
      createdAt: { gte: startOfDay },
    },
  }),
  prisma.notification.count({
    where: { tenantId, readAt: null },
  }),
]);
```

### 7.3 JSONB Query Patterns

**Containment query (GIN index):**

```sql
-- Find participants with visa_status = "approved" using @> operator
SELECT p.id, p."firstName", p."familyName"
FROM "Participant" p
WHERE p."customData" @> '{"visa_status": "approved"}'
  AND p."eventId" = $1
  AND p."deletedAt" IS NULL;
```

**Path extraction query (expression index):**

```sql
-- Find participants with specific weapon permit prefix
SELECT p.id, p."firstName", p."customData"->>'weapon_permit_number' as permit
FROM "Participant" p
WHERE p."customData"->>'weapon_permit_number' LIKE 'WP-2026-%'
  AND p."eventId" = $1
  AND p."deletedAt" IS NULL;
```

**JSONB aggregation:**

```sql
-- Count participants by visa status for an event
SELECT p."customData"->>'visa_status' as visa_status, COUNT(*)
FROM "Participant" p
WHERE p."eventId" = $1
  AND p."customData" ? 'visa_status'
  AND p."deletedAt" IS NULL
GROUP BY p."customData"->>'visa_status';
```

**Nested JSONB query:**

```sql
-- Find events with specific feature flag enabled
SELECT e.id, e.name
FROM "Event" e
JOIN "Tenant" t ON e."tenantId" = t.id
WHERE t."featureFlags" @> '{"customObjects": true}'
  AND e.status = 'PUBLISHED';
```

**Prisma raw SQL wrapper:**

```typescript
// app/utils/custom-query.server.ts
export async function findParticipantsByCustomField(
  eventId: string,
  fieldName: string,
  value: string,
): Promise<Participant[]> {
  return prisma.$queryRaw`
    SELECT p.*
    FROM "Participant" p
    WHERE p."eventId" = ${eventId}
      AND p."customData"->>  ${fieldName} = ${value}
      AND p."deletedAt" IS NULL
    ORDER BY p."createdAt" DESC
  `;
}
```

---

## 8. Configuration

### 8.1 Database Connection Settings

```env
# Primary database (read-write)
DATABASE_URL="postgresql://accredit_app:${DB_PASSWORD}@db-primary.internal:5432/accreditation?schema=public&connection_limit=10&pool_timeout=10&connect_timeout=5&sslmode=require"

# Read replica (analytics/reporting)
DATABASE_REPLICA_URL="postgresql://accredit_readonly:${DB_REPLICA_PASSWORD}@db-replica.internal:5432/accreditation?schema=public&connection_limit=5&pool_timeout=10&connect_timeout=5&sslmode=require"
```

### 8.2 Pool Configuration

| Setting                     | Development | Staging | Production |
| --------------------------- | ----------- | ------- | ---------- |
| `connection_limit`          | 5           | 10      | 10         |
| `pool_timeout` (seconds)    | 30          | 10      | 10         |
| `connect_timeout` (seconds) | 10          | 5       | 5          |
| `idle_timeout` (seconds)    | 300         | 60      | 60         |
| Max instances               | 1           | 2       | 3          |
| Total connections           | 5           | 20      | 30         |

### 8.3 Prisma Configuration

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "metrics"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Prisma Client initialization (singleton pattern):**

```typescript
// app/utils/db.server.ts
import { PrismaClient } from "@prisma/client";
import { singleton } from "./singleton.server";

export const prisma = singleton("prisma", () => {
  const client = new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "stdout" },
      { level: "warn", emit: "stdout" },
    ],
  });

  client.$on("query", (e) => {
    if (e.duration > 500) {
      console.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });

  return client;
});
```

---

## 9. Testing Strategy

### 9.1 Schema Validation Tests

```typescript
// tests/schema/schema-validation.test.ts
import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";

describe("Schema Validation", () => {
  it("should have all expected tables", async () => {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const tableNames = tables.map((t) => t.tablename);

    expect(tableNames).toContain("Tenant");
    expect(tableNames).toContain("User");
    expect(tableNames).toContain("Event");
    expect(tableNames).toContain("Participant");
    expect(tableNames).toContain("Workflow");
    expect(tableNames).toContain("AuditLog");
  });

  it("should have all expected indexes on Participant", async () => {
    const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'Participant'
    `;
    const indexNames = indexes.map((i) => i.indexname);

    expect(indexNames).toContain("Participant_pkey");
    expect(indexNames).toContain("Participant_registrationCode_key");
  });
});
```

### 9.2 Data Integrity Tests

```typescript
describe("Data Integrity", () => {
  it("should enforce tenant isolation on Event", async () => {
    const tenantA = await createTenant({ name: "Tenant A" });
    const tenantB = await createTenant({ name: "Tenant B" });

    await createEvent({ tenantId: tenantA.id, name: "Summit" });

    // Same name, different tenant: should succeed
    await expect(createEvent({ tenantId: tenantB.id, name: "Summit" })).resolves.toBeDefined();

    // Same name, same tenant: should fail
    await expect(createEvent({ tenantId: tenantA.id, name: "Summit" })).rejects.toThrow(
      /Unique constraint/,
    );
  });

  it("should cascade delete from Tenant to Event to Participant", async () => {
    const tenant = await createTenant({ name: "Cascade Test" });
    const event = await createEvent({ tenantId: tenant.id });
    await createParticipant({ tenantId: tenant.id, eventId: event.id });

    await prisma.tenant.delete({ where: { id: tenant.id } });

    const events = await prisma.event.findMany({ where: { tenantId: tenant.id } });
    const participants = await prisma.participant.findMany({ where: { tenantId: tenant.id } });

    expect(events).toHaveLength(0);
    expect(participants).toHaveLength(0);
  });
});
```

### 9.3 Performance Tests

```typescript
describe("Performance", () => {
  it("should use index for participant queue query", async () => {
    const plan = await prisma.$queryRaw`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM "Participant"
      WHERE "eventId" = 'test-event'
        AND "stepId" = 'test-step'
        AND "status" = 'PENDING'
        AND "deletedAt" IS NULL
    `;
    const planText = JSON.stringify(plan);
    expect(planText).toContain("Index");
    expect(planText).not.toContain("Seq Scan");
  });

  it("should complete participant list query under 100ms for 5000 records", async () => {
    const start = performance.now();
    await prisma.participant.findMany({
      where: { eventId: largeEventId, deletedAt: null },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

### 9.4 Migration Tests

```typescript
describe("Migration Safety", () => {
  it("should apply all migrations without error", async () => {
    // Run against a fresh database
    const result = await execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: testDbUrl },
    });
    expect(result).not.toContain("error");
  });

  it("should be idempotent (re-running migrations is safe)", async () => {
    await execSync("npx prisma migrate deploy", { env: testEnv });
    await execSync("npx prisma migrate deploy", { env: testEnv });
    // No error means idempotent
  });
});
```

---

## 10. Security Considerations

### 10.1 Row-Level Security Patterns

PostgreSQL RLS provides defense-in-depth tenant isolation:

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see rows from their tenant
CREATE POLICY tenant_isolation ON "Event"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id')::TEXT);

CREATE POLICY tenant_isolation ON "Participant"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id')::TEXT);

-- Set tenant context at the start of each request
SET LOCAL app.tenant_id = 'clx_tenant_123';
```

**Note:** RLS is a secondary defense layer. The primary enforcement is in the application data access layer via Prisma `where` clauses. RLS catches any accidental omission of tenant filtering.

### 10.2 Encryption at Rest

| Data                                | Encryption Method                                         |
| ----------------------------------- | --------------------------------------------------------- |
| Database files                      | Azure Disk Encryption (AES-256)                           |
| Backup files                        | Azure Blob Storage encryption (AES-256)                   |
| `SystemSetting` with `type: SECRET` | Application-level AES-256-GCM encryption before storage   |
| `Password.hash`                     | bcrypt with cost factor 12 (one-way hash, not encryption) |
| `Session.metadata`                  | Stored as-is (no PII beyond IP/user-agent)                |

### 10.3 PII Handling

**PII fields in the system:**

| Model                    | PII Fields                                                  | Handling                                                  |
| ------------------------ | ----------------------------------------------------------- | --------------------------------------------------------- |
| `User`                   | `email`, `name`                                             | Indexed, used for authentication                          |
| `Participant`            | `firstName`, `familyName`, `email`, `dateOfBirth`, `gender` | Displayed in UI, exported in reports                      |
| `Participant.customData` | May contain passport numbers, visa data, phone numbers      | Defined by tenant; flagged via `FieldDefinition.dataType` |
| `ParticipantDocument`    | Document images (passport scans, photos)                    | Stored in Azure Blob Storage with SAS token access        |
| `AuditLog.metadata`      | May contain before/after PII snapshots                      | Retained for compliance; anonymized on GDPR purge         |

**PII access logging:** All reads of participant PII are logged in AuditLog with `action: READ` when triggered from export or detail views.

### 10.4 Data Masking for Non-Production

```sql
-- Script to mask PII in staging/development databases
UPDATE "User" SET
  email = 'user_' || id || '@example.com',
  username = 'user_' || id,
  name = 'Test User ' || LEFT(id, 4);

UPDATE "Participant" SET
  "firstName" = 'First_' || LEFT(id, 4),
  "familyName" = 'Last_' || LEFT(id, 4),
  email = 'participant_' || id || '@example.com',
  "dateOfBirth" = '1990-01-01',
  "customData" = '{}';

DELETE FROM "ParticipantDocument";
DELETE FROM "UserImage";
DELETE FROM "Password";
```

---

## 11. Performance Requirements

### 11.1 Query Performance Targets

| Query Pattern                                | Target Latency (p95) | Index Support                                |
| -------------------------------------------- | -------------------- | -------------------------------------------- |
| Participant queue (by event + step + status) | < 50ms               | `(eventId, stepId, status)` composite        |
| Participant search by registration code      | < 10ms               | `registrationCode` unique                    |
| Participant search by custom field           | < 100ms              | Expression index on JSONB path               |
| Audit log for entity                         | < 100ms              | `(tenantId, entityType, entityId)` composite |
| Unread notification count                    | < 20ms               | `(userId, readAt, createdAt)` composite      |
| Event list for tenant                        | < 30ms               | `(tenantId, status)` composite               |
| Approval history for participant             | < 50ms               | `(participantId, createdAt)` composite       |
| Dashboard aggregations                       | < 500ms              | Read replica + materialized views            |

### 11.2 Index Coverage Requirements

Every query executed from a loader or action must be covered by an index. "Covered" means the query planner uses an Index Scan or Index Only Scan, never a Sequential Scan on tables with more than 1,000 rows.

**Verification process:**

1. All queries are logged in development with `EXPLAIN ANALYZE`.
2. CI pipeline runs `pg_stat_user_tables` checks to identify tables with high sequential scan counts relative to index scan counts.
3. Load tests simulate 5,000 concurrent participants with assertions on p95 latency.

### 11.3 JSONB Query Optimization

**Optimization hierarchy for JSONB queries:**

1. **Expression index** (best for known, frequently queried paths): `CREATE INDEX ON "Participant" (("customData"->>'visa_status')) WHERE "deletedAt" IS NULL`
2. **GIN index** (good for ad-hoc queries across many keys): `CREATE INDEX ON "Participant" USING GIN ("customData")`
3. **Computed column** (for extremely hot paths, consider materializing): `ALTER TABLE "Participant" ADD COLUMN visa_status TEXT GENERATED ALWAYS AS ("customData"->>'visa_status') STORED`

**Guidelines:**

- Fields marked `isSearchable` in `FieldDefinition` get expression indexes automatically.
- Fields marked `isFilterable` but not `isSearchable` rely on the GIN index.
- If a JSONB path appears in more than 80% of queries for a table, consider promoting it to a stored generated column.

---

## 12. Open Questions & Decisions

| #   | Question                                                                                | Status      | Decision                                                                                                            |
| --- | --------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Should AuditLog use table partitioning from day one, or defer until volume warrants it? | **Decided** | Implement from day one. The overhead is minimal, and retrofitting partitioning on a large table requires downtime.  |
| 2   | Should `Password` model include `createdAt`/`updatedAt` for tracking password rotation? | Open        | Leaning toward adding `changedAt` to enforce password rotation policies.                                            |
| 3   | Should `CustomObjectRecord` support versioning (tracking changes over time)?            | Open        | Deferred to v2. Current approach relies on AuditLog for change history.                                             |
| 4   | Should we use Prisma's multi-schema preview feature to physically separate domains?     | **Decided** | No. Single schema is simpler for Prisma migrations and cross-domain joins. Logical domain separation is sufficient. |
| 5   | Should read replicas be managed via Prisma or an external connection proxy (PgBouncer)? | Open        | Evaluating PgBouncer for connection multiplexing at the infrastructure level.                                       |
| 6   | Should CUID be replaced with UUIDv7 for better database locality?                       | Open        | UUIDv7 provides time-ordered UUIDs with better B-tree insertion performance. Evaluating Prisma support.             |

---

## Appendix

### A. Complete Enum Reference

| Enum                  | Values                                                                                                                                             | Used By                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `UserStatus`          | ACTIVE, INACTIVE, LOCKED, SUSPENDED                                                                                                                | `User.status`                                                                       |
| `RoleScope`           | GLOBAL, TENANT, EVENT                                                                                                                              | `Role.scope`                                                                        |
| `EventStatus`         | DRAFT, PUBLISHED, CANCELED, COMPLETED, POSTPONED, RESCHEDULED                                                                                      | `Event.status`                                                                      |
| `Priority`            | LOW, MEDIUM, HIGH, CRITICAL                                                                                                                        | `ParticipantType.priority`                                                          |
| `RequestStatus`       | PENDING, INPROGRESS, APPROVED, REJECTED, CANCELLED, PRINTED, COLLECTED, NOTIFIED, ARCHIVED, BYPASSED                                               | `Participant.status`                                                                |
| `Action`              | APPROVE, REJECT, NOTIFY, PRINT, COLLECT, ARCHIVE, CANCEL, BYPASS, REPRINT                                                                          | `Step.action`, `Approval.action`                                                    |
| `ApprovalResult`      | APPROVED, REJECTED, RETURNED, ESCALATED                                                                                                            | `Approval.result`                                                                   |
| `AccessLevel`         | OPEN, CLOSED                                                                                                                                       | `Constraint.accessLevel`, `InvitationConstraint.accessLevel`, `Meeting.accessLevel` |
| `TemplateType`        | BADGE, CERTIFICATE, INVITATION_LETTER, CONFIRMATION, REJECTION                                                                                     | `Template.templateType`                                                             |
| `NotificationType`    | APPROVAL, REJECTION, SLA_WARNING, ASSIGNMENT, SYSTEM, BROADCAST                                                                                    | `Notification.type`                                                                 |
| `NotificationChannel` | EMAIL, IN_APP, SMS                                                                                                                                 | `NotificationPreference.channel`                                                    |
| `AuditAction`         | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, PRINT, COLLECT, EXPORT, IMPORT, CONFIGURE                                                  | `AuditLog.action`                                                                   |
| `AuditEntityType`     | USER, PARTICIPANT, EVENT, WORKFLOW, STEP, INVITATION, TEMPLATE, BADGE, SETTING, ROLE, REPORT, BACKUP                                               | `AuditLog.entityType`                                                               |
| `SettingType`         | STRING, NUMBER, BOOLEAN, JSON, ENUM, SECRET                                                                                                        | `SystemSetting.type`                                                                |
| `FieldDataType`       | TEXT, LONG_TEXT, NUMBER, BOOLEAN, DATE, DATETIME, ENUM, MULTI_ENUM, EMAIL, URL, PHONE, FILE, IMAGE, REFERENCE, FORMULA, AUTO_NUMBER, COUNTRY, USER | `FieldDefinition.dataType`                                                          |
| `ObjectScope`         | TENANT, EVENT                                                                                                                                      | `CustomObjectDef.scope`                                                             |
| `ViewType`            | TABLE, KANBAN, CALENDAR, GALLERY                                                                                                                   | `SavedView.type`                                                                    |

### B. Index Catalog

| Table                  | Index Name                                                | Columns / Expression                      | Type   | Partial                   |
| ---------------------- | --------------------------------------------------------- | ----------------------------------------- | ------ | ------------------------- |
| `Tenant`               | `Tenant_name_email_idx`                                   | `(name, email)`                           | B-tree | No                        |
| `User`                 | `User_deletedAt_idx`                                      | `(deletedAt)`                             | B-tree | No                        |
| `Role`                 | `Role_scope_idx`                                          | `(scope)`                                 | B-tree | No                        |
| `Session`              | `Session_userId_idx`                                      | `(userId)`                                | B-tree | No                        |
| `Event`                | `Event_tenantId_status_idx`                               | `(tenantId, status)`                      | B-tree | No                        |
| `Event`                | `Event_deletedAt_idx`                                     | `(deletedAt)`                             | B-tree | No                        |
| `Participant`          | `Participant_deletedAt_idx`                               | `(deletedAt)`                             | B-tree | No                        |
| `Participant`          | `Participant_eventId_stepId_status_idx`                   | `(eventId, stepId, status)`               | B-tree | No                        |
| `Participant`          | `Participant_tenantId_eventId_participantTypeId_idx`      | `(tenantId, eventId, participantTypeId)`  | B-tree | No                        |
| `Participant`          | `Participant_status_createdAt_idx`                        | `(status, createdAt)`                     | B-tree | No                        |
| `Participant`          | `Participant_userId_idx`                                  | `(userId)`                                | B-tree | No                        |
| `Participant`          | `Participant_invitationId_idx`                            | `(invitationId)`                          | B-tree | No                        |
| `Participant`          | `Participant_titleId_idx`                                 | `(titleId)`                               | B-tree | No                        |
| `Participant`          | `idx_participant_custom_data_gin`                         | `(customData)`                            | GIN    | No                        |
| `Participant`          | `idx_participant_cf_*`                                    | `(customData->>'fieldName')`              | B-tree | Yes (`deletedAt IS NULL`) |
| `Workflow`             | `Workflow_eventId_participantTypeId_idx`                  | `(eventId, participantTypeId)`            | B-tree | No                        |
| `Workflow`             | `Workflow_deletedAt_idx`                                  | `(deletedAt)`                             | B-tree | No                        |
| `WorkflowVersion`      | `WorkflowVersion_workflowId_idx`                          | `(workflowId)`                            | B-tree | No                        |
| `Step`                 | `Step_workflowId_action_idx`                              | `(workflowId, action)`                    | B-tree | No                        |
| `Step`                 | `Step_workflowId_isBypassTarget_idx`                      | `(workflowId, isBypassTarget)`            | B-tree | No                        |
| `Step`                 | `Step_workflowId_isRejectionTarget_idx`                   | `(workflowId, isRejectionTarget)`         | B-tree | No                        |
| `Step`                 | `Step_roleId_idx`                                         | `(roleId)`                                | B-tree | No                        |
| `StepAssignment`       | `StepAssignment_assignedTo_completedAt_idx`               | `(assignedTo, completedAt)`               | B-tree | No                        |
| `StepAssignment`       | `StepAssignment_participantId_idx`                        | `(participantId)`                         | B-tree | No                        |
| `Approval`             | `Approval_participantId_createdAt_idx`                    | `(participantId, createdAt)`              | B-tree | No                        |
| `Approval`             | `Approval_userId_createdAt_idx`                           | `(userId, createdAt)`                     | B-tree | No                        |
| `Approval`             | `Approval_stepId_idx`                                     | `(stepId)`                                | B-tree | No                        |
| `Invitation`           | `Invitation_tenantId_eventId_email_idx`                   | `(tenantId, eventId, email)`              | B-tree | No                        |
| `InvitationConstraint` | `InvitationConstraint_invitationId_idx`                   | `(invitationId)`                          | B-tree | No                        |
| `InvitationConstraint` | `InvitationConstraint_sourceRestrictionId_idx`            | `(sourceRestrictionId)`                   | B-tree | No                        |
| `Restriction`          | `Restriction_eventId_name_idx`                            | `(eventId, name)`                         | B-tree | No                        |
| `Constraint`           | `Constraint_restrictionId_participantTypeId_idx`          | `(restrictionId, participantTypeId)`      | B-tree | No                        |
| `BadgeTemplate`        | `BadgeTemplate_tenantId_idx`                              | `(tenantId)`                              | B-tree | No                        |
| `Notification`         | `Notification_userId_readAt_createdAt_idx`                | `(userId, readAt, createdAt)`             | B-tree | No                        |
| `Notification`         | `Notification_tenantId_idx`                               | `(tenantId)`                              | B-tree | No                        |
| `AuditLog`             | `AuditLog_tenantId_action_idx`                            | `(tenantId, action)`                      | B-tree | No                        |
| `AuditLog`             | `AuditLog_tenantId_entityType_entityId_idx`               | `(tenantId, entityType, entityId)`        | B-tree | No                        |
| `AuditLog`             | `AuditLog_tenantId_userId_idx`                            | `(tenantId, userId)`                      | B-tree | No                        |
| `AuditLog`             | `AuditLog_createdAt_idx`                                  | `(createdAt)`                             | B-tree | No                        |
| `SystemSetting`        | `SystemSetting_category_idx`                              | `(category)`                              | B-tree | No                        |
| `SystemSetting`        | `SystemSetting_tenantId_idx`                              | `(tenantId)`                              | B-tree | No                        |
| `FieldDefinition`      | `FieldDefinition_tenantId_targetModel_eventId_idx`        | `(tenantId, targetModel, eventId)`        | B-tree | No                        |
| `FieldDefinition`      | `FieldDefinition_eventId_participantTypeId_sortOrder_idx` | `(eventId, participantTypeId, sortOrder)` | B-tree | No                        |
| `CustomObjectDef`      | `CustomObjectDef_tenantId_idx`                            | `(tenantId)`                              | B-tree | No                        |
| `CustomObjectRecord`   | `CustomObjectRecord_tenantId_objectDefId_eventId_idx`     | `(tenantId, objectDefId, eventId)`        | B-tree | No                        |
| `CustomObjectRecord`   | `CustomObjectRecord_deletedAt_idx`                        | `(deletedAt)`                             | B-tree | No                        |
| `SavedView`            | `SavedView_tenantId_targetModel_idx`                      | `(tenantId, targetModel)`                 | B-tree | No                        |
| `FormTemplate`         | `FormTemplate_tenantId_eventId_idx`                       | `(tenantId, eventId)`                     | B-tree | No                        |

### C. Migration Runbook

**Pre-migration checklist:**

1. Verify backup is current (< 1 hour old)
2. Check active connection count (`SELECT count(*) FROM pg_stat_activity`)
3. Review migration SQL with `npx prisma migrate diff`
4. Test migration against staging database clone
5. Notify team of planned maintenance window (if any)

**Migration execution:**

```bash
# 1. Generate migration from schema changes
npx prisma migrate dev --name descriptive_migration_name

# 2. Review generated SQL
cat prisma/migrations/YYYYMMDDHHMMSS_descriptive_migration_name/migration.sql

# 3. Apply to staging
DATABASE_URL=$STAGING_DB npx prisma migrate deploy

# 4. Verify staging
DATABASE_URL=$STAGING_DB npx prisma db pull --force  # Compare with schema

# 5. Apply to production
DATABASE_URL=$PRODUCTION_DB npx prisma migrate deploy

# 6. Verify production
DATABASE_URL=$PRODUCTION_DB npx prisma migrate status
```

**Rollback procedure:**

Prisma does not support automatic rollback. For each migration, maintain a corresponding `down.sql`:

```sql
-- prisma/migrations/YYYYMMDDHHMMSS_add_custom_objects/down.sql
DROP TABLE IF EXISTS "CustomObjectRecord";
DROP TABLE IF EXISTS "FieldDefinition";
DROP TABLE IF EXISTS "CustomObjectDef";
DROP TYPE IF EXISTS "ObjectScope";
DROP TYPE IF EXISTS "FieldDataType";
```

**Emergency rollback:**

```bash
# 1. Mark migration as rolled back
npx prisma migrate resolve --rolled-back YYYYMMDDHHMMSS_migration_name

# 2. Execute down.sql
psql $DATABASE_URL -f prisma/migrations/YYYYMMDDHHMMSS_migration_name/down.sql

# 3. Verify state
npx prisma migrate status
```
