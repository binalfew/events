# Phase 1: Dynamic Schema + Core Reliability — Completion Report

> **Started:** 2026-02-15
> **Last updated:** 2026-02-15
> **Tasks completed:** P1-00, P1-01, P1-02, P1-03, P1-04 (of P1-00 through P1-11)
> **Status:** In progress

---

## Table of Contents

1. [Overview](#1-overview)
2. [P1-00 — Core Data Model Migration](#2-p1-00--core-data-model-migration)
3. [P1-01 — Authentication & Session Management](#3-p1-01--authentication--session-management)
4. [P1-02 — Field Definition CRUD](#4-p1-02--field-definition-crud)
5. [P1-03 — Zod Schema Builder](#5-p1-03--zod-schema-builder)
6. [P1-04 — Form Renderer](#6-p1-04--form-renderer)
7. [P1-05 — Field Admin UI](#7-p1-05--field-admin-ui)
8. [P1-06 — JSONB Query Layer & Expression Indexes](#8-p1-06--jsonb-query-layer--expression-indexes)
9. [P1-07 — Workflow Versioning](#9-p1-07--workflow-versioning)
10. [P1-08 — SLA Enforcement](#10-p1-08--sla-enforcement)
11. [P1-09 — Optimistic Locking](#11-p1-09--optimistic-locking)
12. [P1-10 — Rate Limiting Enhancement](#12-p1-10--rate-limiting-enhancement)
13. [P1-11 — File Upload Scanning](#13-p1-11--file-upload-scanning)
14. [Commit History](#14-commit-history)
15. [Complete File Inventory](#15-complete-file-inventory)
16. [Bugs & Gotchas Encountered](#16-bugs--gotchas-encountered)
17. [Architecture Decisions](#17-architecture-decisions)
18. [Quality Gate Progress](#18-quality-gate-progress)

---

## 1. Overview

Phase 1 builds on the Phase 0 foundation to deliver the extensible data model, hardened workflow engine, RBAC, and security features needed before domain-specific modules can be implemented. The core challenge of this phase is the **hybrid schema**: every participant has fixed identity columns (firstName, lastName, etc.) plus a JSONB `extras` column whose shape is defined at runtime by tenant administrators — no migrations, no deployments.

### Phase 1 Scope

| Category        | Tasks                      | Key Deliverables                                                    |
| --------------- | -------------------------- | ------------------------------------------------------------------- |
| Data Model      | P1-00                      | 8 enums, 10 models, RBAC tables, audit log, partial indexes         |
| Security        | P1-01, P1-10, P1-11        | Auth flows, session management, rate limiting, file upload scanning |
| Dynamic Schema  | P1-02, P1-03, P1-04, P1-05 | FieldDefinition CRUD, Zod builder, form renderer, field admin UI    |
| Query Layer     | P1-06                      | JSONB filtering, expression indexes, type-safe query builders       |
| Workflow Engine | P1-07, P1-08               | Workflow versioning with snapshots, SLA enforcement background job  |
| API Hardening   | P1-09                      | Optimistic locking for concurrent operations                        |

### Dependency Graph

```
P1-00 (Data Models) ──┬──► P1-01 (Auth) ──┬──► P1-05 (Admin UI)
                      │                    └──► P1-10 (Rate Limiting)
                      │
                      ├──► P1-02 (Field CRUD) ──► P1-03 (Zod Builder) ──► P1-04 (Renderer) ──► P1-05
                      │
                      ├──► P1-06 (JSONB Query)
                      │
                      ├──► P1-07 (WF Versioning) ──► P1-08 (SLA)
                      │
                      ├──► P1-09 (Optimistic Lock)
                      │
                      └──► P1-11 (File Scanning)
```

### Technology Additions (Phase 1)

| Addition                       | Version | Purpose                                    |
| ------------------------------ | ------- | ------------------------------------------ |
| 8 new Prisma enums             | —       | Type-safe workflow states and field types  |
| 10 new Prisma models           | —       | RBAC, participants, workflows, audit       |
| 4 partial indexes              | —       | Soft-delete query optimization             |
| Soft delete middleware (2 new) | —       | Participant and Workflow filter extensions |

---

## 2. P1-00 — Core Data Model Migration

### What This Task Does

Adds all Prisma models required for Phase 1 features: RBAC (roles, permissions, user-role assignments), participant management (types, registrations, workflow state), the workflow engine (steps with soft-reference routing, versioning), field definitions (the dynamic schema metadata), approval records, and an audit log. This is the **critical path blocker** — every other P1 task depends on these models existing.

### Why It's Designed This Way

The accreditation platform manages participants across different event types (summits, conferences, sports events), each with different data requirements. Rather than adding columns per event, the design uses a **hybrid schema**: fixed Prisma columns for universally-needed identity fields (firstName, lastName, registrationCode) and a JSONB `extras` column whose shape is controlled by `FieldDefinition` records that tenant admins define at runtime.

For workflows, Step routing uses **soft references** (plain `String?` fields storing step IDs) instead of Prisma self-relations. This eliminates circular dependency issues in migrations, simplifies step deletion/reordering, and allows the workflow engine to validate routing at the application layer where it can produce meaningful error messages.

The AuditLog model deliberately has **no Prisma relations** — tenantId and userId are stored as plain strings. When a user is deleted, their audit trail survives. This is essential for compliance and forensics.

### Files Created/Modified

| File                                                                | Action   | Purpose                                                                |
| ------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `prisma/schema.prisma`                                              | Modified | Added 8 enums, 10 models, updated User/Event/Tenant relations          |
| `prisma/migrations/20260215054649_phase1_core_models/migration.sql` | Created  | Migration SQL with 4 partial indexes appended                          |
| `app/lib/db.server.ts`                                              | Modified | Added participant and workflow soft-delete middleware                  |
| `prisma/seed.ts`                                                    | Modified | Added permissions, roles, event, participant type, workflow with steps |
| `tests/setup/integration-setup.ts`                                  | Modified | Updated truncation order for 17 tables                                 |
| `tests/factories/index.ts`                                          | Modified | Added 5 new factory functions, expanded seedFullScenario               |
| `scripts/verify-indexes.ts`                                         | Modified | Added expected indexes for all 10 new models                           |

### New Enums (8)

```prisma
enum FieldDataType {
  TEXT          // Single-line text input
  LONG_TEXT     // Multi-line textarea
  NUMBER        // Integer or decimal
  BOOLEAN       // Checkbox / toggle
  DATE          // Date picker (no time)
  DATETIME      // Date + time picker
  ENUM          // Single-select dropdown
  MULTI_ENUM    // Multi-select checkboxes/tags
  EMAIL         // Email with format validation
  URL           // URL with format validation
  PHONE         // Phone with format validation
  FILE          // File upload reference
  IMAGE         // Image upload reference
  REFERENCE     // FK to another record
  FORMULA       // Computed field expression
  JSON          // Raw JSON (advanced use)
}

enum RequestStatus {    // 6 values — covers the Phase 1 workflow steps
  PENDING               // Awaiting review
  IN_PROGRESS           // Currently being processed
  APPROVED              // Passed approval
  REJECTED              // Failed approval
  CANCELLED             // Withdrawn by requester or admin
  PRINTED               // Badge printed (terminal state for Phase 1)
}

enum WorkflowStatus {   // Lifecycle of a workflow definition
  DRAFT                 // Being designed, not yet usable
  PUBLISHED             // Available for participant assignment
  ARCHIVED              // No longer active, kept for history
}

enum StepType {         // What kind of processing happens at this step
  REVIEW                // Manual document/data review
  APPROVAL              // Accept/reject decision
  PRINT                 // Badge printing
  COLLECT               // Badge collection/handoff
  NOTIFICATION          // Send notification (email, SMS)
  CUSTOM                // Extensible step with custom logic
  FORK                  // Parallel path split point
}

enum StepAction {       // Actions available at workflow steps
  APPROVE    REJECT    BYPASS    RETURN    ESCALATE
}

enum SLAAction {        // What to do when an SLA deadline is breached
  NOTIFY          // Alert the assigned role
  ESCALATE        // Move to escalation role
  AUTO_APPROVE    // Automatically approve
  AUTO_REJECT     // Automatically reject
  REASSIGN        // Assign to different user
}

enum ApprovalAction {   // Recorded in the Approval audit trail
  APPROVE    REJECT    BYPASS    RETURN    ESCALATE    PRINT
}

enum AuditAction {      // 13 categories of auditable operations
  CREATE    UPDATE    DELETE
  LOGIN     LOGOUT
  APPROVE   REJECT    PRINT    COLLECT
  EXPORT    IMPORT    CONFIGURE    ASSIGN
}
```

**Design note on `RequestStatus`:** The plan calls for 6 values covering Phase 1's 3-step workflow (Review → Approval → Badge Printing). Additional statuses like `COLLECTED`, `NOTIFIED`, `ARCHIVED`, and `BYPASSED` are deferred to Phase 2+ when those workflow step types are implemented. PostgreSQL allows adding enum values without a full migration (`ALTER TYPE ... ADD VALUE`), so this is safely extensible.

### New Models (10)

#### RBAC Domain

**Role** — Tenant-scoped role definitions. Each tenant can define their own roles independently. The `@@unique([tenantId, name])` constraint prevents duplicate role names within a tenant while allowing "ADMIN" to exist in multiple tenants.

```prisma
model Role {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rolePermissions RolePermission[]
  userRoles       UserRole[]

  @@unique([tenantId, name])
  @@index([tenantId])
}
```

**Permission** — Global resource:action pairs. Unlike roles, permissions are system-wide (not per-tenant). A single permission like `participant:approve` means the same thing in every tenant. The `@@unique([resource, action])` constraint ensures no duplicates.

```prisma
model Permission {
  id          String   @id @default(cuid())
  resource    String       // "participant", "workflow", "event", etc.
  action      String       // "create", "read", "update", "delete", "approve", etc.
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rolePermissions RolePermission[]

  @@unique([resource, action])
}
```

**RolePermission** — Explicit join table (not Prisma implicit many-to-many). Using an explicit model gives us `createdAt` timestamps and the ability to add metadata later (e.g., conditions, scopes). Both FK columns are indexed for efficient lookups in either direction.

```prisma
model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  createdAt    DateTime   @default(now())

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
}
```

**UserRole** — Assigns a user to a role, optionally scoped to a specific event. When `eventId` is `NULL`, the assignment is global (applies to all events). This enables patterns like "admin everywhere" vs. "printer only for AU Summit 2026".

```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  eventId   String?      // NULL = global assignment
  createdAt DateTime @default(now())

  @@unique([userId, roleId, eventId])
  @@index([userId])
  @@index([roleId])
  @@index([eventId])
}
```

**Note on NULL in unique constraints:** PostgreSQL treats NULLs as distinct in unique indexes, so `(user1, admin, NULL)` can be inserted multiple times. The seed uses `createMany({ skipDuplicates: true })` to handle this at the application layer. A future migration could add a partial unique index for the `eventId IS NULL` case if needed.

#### Participant & Workflow Domain

**ParticipantType** — Event-scoped categories like "Delegate", "Media", "Security", "VIP". Each type gets a short `code` (e.g., "DEL", "MED") used in registration codes and badge templates. The 3-column unique constraint `(tenantId, eventId, code)` ensures codes are unique per event.

```prisma
model ParticipantType {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  name        String
  code        String       // Short code for registration/badge use
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  participants Participant[]
  fieldDefinitions FieldDefinition[]

  @@unique([tenantId, eventId, code])
  @@index([tenantId, eventId])
}
```

**Workflow** — A named sequence of steps that participants move through. Supports soft delete (workflows with active participants can't be hard-deleted). The `@@unique([tenantId, eventId, name])` constraint prevents duplicate workflow names within an event.

```prisma
model Workflow {
  id          String         @id @default(cuid())
  tenantId    String
  eventId     String
  name        String
  description String?
  status      WorkflowStatus @default(DRAFT)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?

  steps        Step[]
  versions     WorkflowVersion[]
  participants Participant[]

  @@unique([tenantId, eventId, name])
  @@index([tenantId])
  @@index([eventId])
  @@index([deletedAt])
}
```

**Step** — Individual workflow steps with soft-reference routing. The `nextStepId`, `rejectionTargetId`, `bypassTargetId`, and `escalationTargetId` fields are plain `String?` — not Prisma relations. This was a deliberate choice to avoid self-referential relation complexity and circular dependency issues. Routing validation happens at the application layer.

```prisma
model Step {
  id                 String    @id @default(cuid())
  workflowId         String
  name               String
  description        String?
  order              Int           // Display/execution order
  stepType           StepType  @default(REVIEW)
  isEntryPoint       Boolean   @default(false)
  isTerminal         Boolean   @default(false)
  nextStepId         String?       // → Step.id (soft reference)
  rejectionTargetId  String?       // → Step.id (soft reference)
  bypassTargetId     String?       // → Step.id (soft reference)
  escalationTargetId String?       // → Step.id (soft reference)
  slaDurationMinutes Int?
  slaAction          SLAAction?
  config             Json      @default("{}")
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  approvals Approval[]

  @@unique([workflowId, order])
  @@index([workflowId])
}
```

**WorkflowVersion** — Immutable snapshots of a workflow's steps and configuration. When a participant enters a workflow, their record is locked to a specific version so that subsequent edits to the workflow don't affect in-flight participants. The `snapshot` JSON column stores the complete serialized workflow + steps at the time of publication.

```prisma
model WorkflowVersion {
  id                String   @id @default(cuid())
  workflowId        String
  version           Int
  snapshot          Json         // Full workflow + steps serialized
  changeDescription String?
  createdBy         String
  createdAt         DateTime @default(now())

  @@unique([workflowId, version])
  @@index([workflowId])
}
```

**Participant** — The core entity of the platform. Combines fixed identity fields with a JSONB `extras` column for event-specific fields. Each participant belongs to a workflow and tracks their current position (`currentStepId`, soft reference). Supports soft delete. Six indexes cover all common query patterns:

```prisma
model Participant {
  id                String        @id @default(cuid())
  tenantId          String
  eventId           String
  participantTypeId String
  workflowId        String
  currentStepId     String?           // Soft reference to current Step.id
  registrationCode  String            // Unique per event (e.g., "DEL-000042")
  firstName         String
  lastName          String
  email             String?
  organization      String?
  jobTitle          String?
  nationality       String?
  status            RequestStatus @default(PENDING)
  extras        Json          @default("{}")  // Dynamic fields from FieldDefinition
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  deletedAt         DateTime?

  approvals Approval[]

  @@unique([tenantId, eventId, registrationCode])
  @@index([tenantId, eventId])       // Tenant+event scoped queries
  @@index([eventId, status])         // Status filtering within an event
  @@index([participantTypeId])       // Filter by type (Delegate, Media, etc.)
  @@index([workflowId])              // FK coverage for workflow queries
  @@index([currentStepId])           // Find all participants at a given step
  @@index([deletedAt])               // Soft delete filter
}
```

**Approval** — Immutable action records. Every approve, reject, bypass, return, escalate, or print action creates an Approval row. This is an append-only audit trail that can never be modified. Three composite indexes cover the most common query patterns:

```prisma
model Approval {
  id            String         @id @default(cuid())
  participantId String
  stepId        String
  userId        String             // Who performed the action
  action        ApprovalAction
  remarks       String?
  metadata      Json?
  createdAt     DateTime       @default(now())

  @@index([participantId, stepId])  // History for a participant at a step
  @@index([stepId, userId])         // Activity by user at a step
  @@index([userId, createdAt])      // User's action timeline
}
```

**FieldDefinition** — Metadata records that define fields. Each definition specifies the field's storage key (`name`), display label, data type, validation rules, and UI configuration. The 5-column unique constraint ensures no duplicate field names within a given scope:

```prisma
model FieldDefinition {
  id                String           @id @default(cuid())
  tenantId          String
  eventId           String
  participantTypeId String?              // NULL = applies to all types in event
  entityType        String  @default("Participant")  // Extensible target
  name              String               // Storage key in extras JSON
  label             String               // Display label
  description       String?
  dataType          FieldDataType
  sortOrder         Int     @default(0)
  isRequired        Boolean @default(false)
  isUnique          Boolean @default(false)
  isSearchable      Boolean @default(false)
  isFilterable      Boolean @default(false)
  defaultValue      String?
  config            Json    @default("{}")   // Type-specific (enum options, regex, etc.)
  validation        Json    @default("[]")   // Extra validation rules
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([tenantId, eventId, participantTypeId, entityType, name])
  @@index([tenantId, eventId])
  @@index([eventId, participantTypeId, sortOrder])
}
```

#### Audit Domain

**AuditLog** — No Prisma relations (soft FKs). The `tenantId` and `userId` fields are plain strings so that audit records survive entity deletion. The `entityType` + `entityId` pattern allows logging actions against any model without a foreign key.

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  tenantId    String?
  userId      String?
  action      AuditAction
  entityType  String          // "Participant", "Workflow", "User", etc.
  entityId    String?
  description String?
  metadata    Json?           // Flexible: { oldValue, newValue, batchSize, ... }
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime    @default(now())

  @@index([tenantId, action])
  @@index([tenantId, entityType, entityId])
  @@index([createdAt])
}
```

### Existing Model Updates

**Tenant** — Added 5 reverse relation fields:

```prisma
roles            Role[]
participantTypes ParticipantType[]
workflows        Workflow[]
participants     Participant[]
fieldDefinitions     FieldDefinition[]
```

**User** — Added 2 relation fields:

```prisma
userRoles UserRole[]
approvals Approval[]
```

**Event** — Added 5 relation fields:

```prisma
participantTypes ParticipantType[]
participants     Participant[]
workflows        Workflow[]
fieldDefinitions     FieldDefinition[]
userRoles        UserRole[]
```

These are Prisma-level only — no new database columns are created; they just enable relation queries like `prisma.tenant.findFirst({ include: { roles: true } })`.

### Migration Details

The migration `20260215054649_phase1_core_models` was generated with `--create-only`, reviewed, and augmented with 4 partial indexes before applying:

```sql
-- Restore partial indexes dropped during migration
CREATE INDEX "idx_user_active" ON "User" ("id") WHERE "deletedAt" IS NULL;
CREATE INDEX "idx_event_active" ON "Event" ("id") WHERE "deletedAt" IS NULL;

-- New partial indexes for soft-deleted models
CREATE INDEX "idx_participant_active" ON "Participant" ("id") WHERE "deletedAt" IS NULL;
CREATE INDEX "idx_workflow_active" ON "Workflow" ("id") WHERE "deletedAt" IS NULL;
```

**Why partial indexes?** The `WHERE "deletedAt" IS NULL` filter means the index only contains active (non-deleted) records. For a table with 100K participants where 5K are soft-deleted, the index is 5% smaller and lookups are faster. PostgreSQL's query planner automatically uses partial indexes when the query's WHERE clause matches the index predicate.

**Why were existing partial indexes dropped?** Prisma doesn't natively manage partial indexes (they can't be expressed in the schema DSL). When Prisma generates a migration, it compares the schema state before and after. The raw SQL partial indexes created in the Phase 0 migration existed in the database but not in Prisma's schema tracking. The Phase 1 migration's diff detected them as "extras" and dropped them. We re-add them in the same migration file to keep them in sync.

### Soft Delete Middleware Extension

Added `participant` and `workflow` blocks to the `withSoftDelete` client extension in `app/lib/db.server.ts`, following the exact same pattern as the existing `user` and `event` blocks:

```typescript
participant: {
  async findMany({ args, query }) {
    const includeDeleted = (args as any).includeDeleted === true;
    delete (args as any).includeDeleted;
    addSoftDeleteFilter(args, includeDeleted);
    return query(args);
  },
  async findFirst({ args, query }) { /* same pattern */ },
  async count({ args, query }) { /* same pattern */ },
},
workflow: {
  async findMany({ args, query }) { /* same pattern */ },
  async findFirst({ args, query }) { /* same pattern */ },
  async count({ args, query }) { /* same pattern */ },
},
```

This means `prisma.participant.findMany()` automatically excludes soft-deleted records unless you pass `{ includeDeleted: true }`.

### Seed Data

The seed script (`prisma/seed.ts`) was expanded from 2 entities (tenant + admin user) to a complete Phase 1 scenario. All upserts are idempotent — running the seed multiple times produces the same result.

**20 Permissions** (resource:action pairs):

| Resource    | Actions                                                       |
| ----------- | ------------------------------------------------------------- |
| participant | create, read, update, delete, approve, reject, print, collect |
| workflow    | create, read, update, delete                                  |
| field       | create, read, update, delete                                  |
| event       | create, read, update                                          |
| settings    | manage                                                        |

**5 Roles** with permission assignments:

| Role       | Description                  | Permissions                                             |
| ---------- | ---------------------------- | ------------------------------------------------------- |
| ADMIN      | Full access to all resources | All 20 permissions                                      |
| VALIDATOR  | Review and approve           | participant:read, update, approve, reject               |
| PRINTER    | Print badges                 | participant:read, print                                 |
| DISPATCHER | Collect and dispatch badges  | participant:read, collect                               |
| VIEWER     | Read-only access             | participant:read, workflow:read, field:read, event:read |

**UserRole:** Admin user gets the ADMIN role with `eventId: null` (global scope).

**Event:** "AU Summit 2026" (July 1–5, 2026) with DRAFT status.

**ParticipantType:** "Delegate" with code "DEL".

**Workflow:** "Standard Accreditation" with 3 steps and routing:

```
┌──────────┐    nextStepId    ┌──────────┐    nextStepId    ┌───────────────┐
│  Review   │ ──────────────► │ Approval │ ──────────────► │ Badge Printing │
│ (entry)   │ ◄────────────── │          │                 │   (terminal)   │
└──────────┘  rejectionTargetId └──────────┘                └───────────────┘
```

- **Review** (order 1): `isEntryPoint: true`, `stepType: REVIEW`
- **Approval** (order 2): `stepType: APPROVAL`, routes forward to Printing, rejection loops back to Review
- **Badge Printing** (order 3): `isTerminal: true`, `stepType: PRINT`

### Test Infrastructure Updates

**Integration setup** (`tests/setup/integration-setup.ts`): Truncation order expanded from 5 to 17 tables, respecting FK constraints:

```
approval → auditLog → rolePermission → userRole → participant → workflowVersion →
step → fieldDefinition → workflow → participantType → permission → role →
session → password → event → user → tenant
```

**New factory functions** (`tests/factories/index.ts`):

| Function                           | Returns                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `buildRole(overrides?)`            | `{ name, description }`                                    |
| `buildParticipantType(overrides?)` | `{ name, code, description }`                              |
| `buildWorkflow(overrides?)`        | `{ name, description, status }`                            |
| `buildStep(overrides?)`            | `{ name, description, order, stepType }`                   |
| `buildParticipant(overrides?)`     | `{ registrationCode, firstName, lastName, email, status }` |

**`seedFullScenario`** now returns `{ tenant, user, event, participantType, workflow, step }` — a complete test scenario with a workflow and entry step, ready for participant creation in tests.

### Index Verification

The `scripts/verify-indexes.ts` script was updated to check 33 indexes across 16 tables. All pass:

```
✓ Tenant: index on (name, email)
✓ User: index on (deletedAt)
✓ User: index on (tenantId)
✓ Session: index on (userId, expirationDate)
✓ Event: index on (tenantId, status)
✓ Event: index on (deletedAt)
✓ Role: index on (tenantId)
✓ Permission: index on (resource, action)
✓ RolePermission: index on (roleId)
✓ RolePermission: index on (permissionId)
✓ UserRole: index on (userId)
✓ UserRole: index on (roleId)
✓ UserRole: index on (eventId)
✓ ParticipantType: index on (tenantId, eventId)
✓ Workflow: index on (tenantId)
✓ Workflow: index on (eventId)
✓ Workflow: index on (deletedAt)
✓ Step: index on (workflowId)
✓ WorkflowVersion: index on (workflowId)
✓ Participant: index on (tenantId, eventId)
✓ Participant: index on (eventId, status)
✓ Participant: index on (participantTypeId)
✓ Participant: index on (workflowId)
✓ Participant: index on (currentStepId)
✓ Participant: index on (deletedAt)
✓ Approval: index on (participantId, stepId)
✓ Approval: index on (stepId, userId)
✓ Approval: index on (userId, createdAt)
✓ FieldDefinition: index on (tenantId, eventId)
✓ FieldDefinition: index on (eventId, participantTypeId, sortOrder)
✓ AuditLog: index on (tenantId, action)
✓ AuditLog: index on (tenantId, entityType, entityId)
✓ AuditLog: index on (createdAt)

All indexes present!
```

### Verification Results

| Check                | Result                       |
| -------------------- | ---------------------------- |
| `prisma validate`    | Schema valid                 |
| `prisma generate`    | Client regenerated (7.4.0)   |
| `prisma migrate dev` | Migration applied cleanly    |
| `npm run typecheck`  | Zero errors                  |
| `npx vitest run`     | 6/6 tests pass               |
| `prisma db seed`     | All data seeded (idempotent) |
| `verify-indexes.ts`  | 33/33 indexes present        |

---

## 3. P1-01 — Authentication & Session Management

> **Status:** Complete
> **Depends on:** P1-00

### What This Task Does

Implements cookie-based session authentication with login/logout flows, RBAC permission checking, progressive lockout on failed login attempts, and a protected dashboard route.

### Why It's Designed This Way

The platform uses server-side session cookies (not JWTs) because the architecture is SSR-first with React Router. Cookie sessions avoid token storage complexity on the client and integrate naturally with React Router's loader/action model. The lockout system uses configurable thresholds (`MAX_LOGIN_ATTEMPTS`, `LOCKOUT_DURATION_MINUTES`) with auto-unlock to balance security and usability.

Permission checking is decoupled from role checking — `hasPermission(userId, resource, action)` queries through the RBAC join tables (`UserRole → Role → RolePermission → Permission`) so that adding new permissions never requires code changes, only database seed updates.

### Files Created

| File                                            | Purpose                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `app/lib/auth.server.ts`                        | Password hashing/verification using bcryptjs                                                       |
| `app/lib/session.server.ts`                     | Cookie session storage, `getUserId`, `requireUserId`, `requireUser`, `createUserSession`, `logout` |
| `app/lib/require-auth.server.ts`                | `requireAuth`, `requireRole`, `requireAnyRole`, `hasPermission` helpers                            |
| `app/routes/auth/login.tsx`                     | Login page with Conform + Zod validation, progressive lockout, audit logging                       |
| `app/routes/auth/logout.tsx`                    | Logout action with session destruction and audit logging                                           |
| `app/routes/admin/_layout.tsx`                  | Protected layout route (requires auth)                                                             |
| `app/routes/admin/index.tsx`                    | Dashboard index page                                                                               |
| `app/lib/__tests__/auth.server.test.ts`         | 5 tests for password hashing/verification                                                          |
| `app/lib/__tests__/session.server.test.ts`      | 3 tests for session management                                                                     |
| `app/lib/__tests__/require-auth.server.test.ts` | 3 tests for RBAC permission checking                                                               |

### Files Modified

| File            | Change                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| `app/routes.ts` | Migrated to `autoRoutes()` from `react-router-auto-routes` (file-system routing) |

### Key Behaviors

- **Progressive lockout:** After `MAX_LOGIN_ATTEMPTS` failed attempts, account is locked with auto-unlock after `LOCKOUT_DURATION_MINUTES`
- **Account status checking:** Inactive and suspended accounts cannot log in
- **Audit trail:** Every login attempt (success or failure) creates an `AuditLog` entry with IP and user agent
- **RBAC:** Permission checks query through `UserRole → Role → RolePermission → Permission` with fail-safe (returns false on DB errors)

### Verification Results

| Check               | Result           |
| ------------------- | ---------------- |
| `npm run typecheck` | Zero errors      |
| `npx vitest run`    | 11/11 tests pass |

---

## 4. P1-02 — Field Definition CRUD

> **Status:** Complete
> **Depends on:** P1-00, P1-01

### What This Task Does

Builds server-side API routes for managing `FieldDefinition` records: listing with filters, creating with limit enforcement, updating with conflict detection, deleting with data-existence checking, and atomic reordering. These routes are the foundation for the dynamic schema pipeline (blocks P1-03).

### Schema Reconciliation

The task doc diverged from the actual Prisma schema in several places. All decisions align to the real schema:

| Task Doc                    | Actual Schema                       | Decision                                    |
| --------------------------- | ----------------------------------- | ------------------------------------------- |
| `FieldDefinition`           | `FieldDefinition`                   | Used `FieldDefinition`                      |
| `targetModel`               | `entityType`                        | Used `entityType`                           |
| `uiConfig` (separate field) | Not in schema                       | Omitted — stored in `config` JSON if needed |
| `COUNTRY`, `USER` dataTypes | Not in `FieldDataType` enum         | Used only the 16 existing enum values       |
| Soft delete                 | No `deletedAt` on `FieldDefinition` | Hard delete                                 |
| `eventId` optional          | `eventId` non-nullable in Prisma    | Made `eventId` required in create schema    |

### Why It's Designed This Way

The service layer (`fields.server.ts`) is separated from the route layer to keep business logic testable with mocked Prisma. Each mutation verifies tenant ownership before proceeding, enforcing multi-tenant isolation at the service layer rather than relying solely on route-level auth.

Delete operations check whether any `Participant` or `Event` records contain data for the field via a raw SQL query (`extras ? $fieldName`) using PostgreSQL's JSONB `?` operator. This prevents accidental data loss while supporting a `force` flag for intentional cleanup.

The `requirePermission` helper was added to combine authentication + permission checking in a single call, reducing boilerplate in route files.

### Files Created

| File                                           | Purpose                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `app/config/fields.ts`                         | Limit constants: 500/tenant, 100/event, name/label max lengths                                           |
| `app/lib/schemas/field.ts`                     | Zod v4 schemas: `createFieldSchema`, `updateFieldSchema`, `reorderFieldsSchema` + inferred types         |
| `app/services/fields.server.ts`                | Business logic: `listFields`, `createField`, `updateField`, `deleteField`, `reorderFields`, `FieldError` |
| `app/routes/api/v1/fields/index.tsx`           | GET (list with filters) + POST (create)                                                                  |
| `app/routes/api/v1/fields/$id.tsx`             | PUT (update) + DELETE (with force flag)                                                                  |
| `app/routes/api/v1/fields/reorder.tsx`         | POST (atomic reorder)                                                                                    |
| `app/lib/schemas/__tests__/field.test.ts`      | 28 schema validation tests                                                                               |
| `app/services/__tests__/fields.server.test.ts` | 19 service layer tests (mocked Prisma)                                                                   |

### Files Modified

| File                             | Change                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `app/routes.ts`                  | Added 3 API routes (`fields`, `fields/reorder`, `fields/:id`) — reorder registered before `:id` to avoid param capture |
| `app/lib/require-auth.server.ts` | Added `requirePermission(request, resource, action)` combining auth + permission check + 403 throw                     |
| `tests/factories/index.ts`       | Added `buildFieldDefinition()` factory                                                                                 |

### API Endpoints

| Method | Path                     | Description                                                                                            | Auth           |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------ | -------------- |
| GET    | `/api/v1/fields`         | List fields with optional filters (`eventId`, `participantTypeId`, `entityType`, `dataType`, `search`) | `field:read`   |
| POST   | `/api/v1/fields`         | Create a field definition                                                                              | `field:create` |
| PUT    | `/api/v1/fields/:id`     | Update a field definition                                                                              | `field:update` |
| DELETE | `/api/v1/fields/:id`     | Delete a field (supports `?force=true`)                                                                | `field:delete` |
| POST   | `/api/v1/fields/reorder` | Reorder fields atomically                                                                              | `field:update` |

### Key Behaviors

- **Tenant isolation:** All queries scoped by `tenantId`; event/field ownership verified before mutations
- **Limit enforcement:** 500 fields per tenant, 100 per event — returns 422 when exceeded
- **Unique constraint handling:** Catches Prisma P2002 errors → 409 Conflict with descriptive message
- **Delete safety:** Checks `extras` JSONB for existing data via raw SQL; blocks unless `force=true`
- **Auto sort order:** New fields get `max(sortOrder) + 1` within the event scope
- **Atomic reorder:** Uses `$transaction` to update all `sortOrder` values in one batch
- **Audit logging:** Every mutation creates an `AuditLog` entry with before/after diff metadata

### Zod v4 Note

Zod v4 changed the `z.record()` API to require explicit key and value types: `z.record(z.string(), z.unknown())` instead of `z.record(z.unknown())`. The `.omit()` and `.partial()` methods retain the v3-style object mask API.

### Verification Results

| Check               | Result                                                  |
| ------------------- | ------------------------------------------------------- |
| `npm run typecheck` | Zero errors                                             |
| `npx vitest run`    | 64/64 tests pass (28 schema + 19 service + 17 existing) |

---

## 5. P1-03 — Zod Schema Builder

> **Status:** Complete
> **Depends on:** P1-02

### What This Task Does

Builds the runtime bridge between `FieldDefinition` database records and Zod validation schemas. Four functions convert tenant-defined field metadata into executable validators, form data parsers, cached schemas, and Conform constraint objects. This is the critical link in the schema pipeline: `FieldDefinition (DB) → Zod Schema (runtime) → Conform (form binding) → Server Validation`.

### Why It's Designed This Way

The schema engine must handle 16 different data types, each with type-specific configuration (min/max for numbers, options for enums, patterns for text), without requiring code changes or deployments. By mapping each `FieldDataType` to a specific Zod validator with config-driven constraints, tenant admins can define arbitrarily complex validation rules through the UI.

Form data coercion is separated from schema validation because HTML forms submit all values as strings. The `parseFieldFormData` function handles type coercion (string → number, checkbox → boolean, multi-select → array) before the Zod schema validates the typed values.

Schema caching with LRU eviction prevents rebuilding schemas on every request. The cache key combines tenant + event + participant type, and a hash of field IDs + updatedAt timestamps ensures stale schemas are rebuilt when field definitions change.

### Schema Reconciliation

| Task Doc                     | Actual                                             | Decision                                              |
| ---------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `FieldDefinition` type       | `FieldDefinition` from `~/generated/prisma/client` | Used `FieldDefinition`                                |
| `COUNTRY`, `USER` data types | Not in `FieldDataType` enum                        | Mapped only the 16 existing types                     |
| `import { z } from "zod"`    | Codebase uses `import { z } from "zod/v4"`         | Used `zod/v4`                                         |
| `z.record(z.unknown())`      | Zod v4 requires 2 args                             | Used `z.record(z.string(), z.unknown())` where needed |
| `FORMULA` handling           | Computed at read-time                              | Returns `z.any()` (not validated on input)            |

### Files Created

| File                                      | Purpose                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `app/lib/fields.server.ts`                | `buildFieldSchema`, `parseFieldFormData`, `getCachedSchema`, `buildConformConstraints` |
| `app/lib/__tests__/fields.server.test.ts` | 53 comprehensive tests for all 4 functions                                             |

### Functions

#### `buildFieldSchema(fieldDefs: FieldDefinition[]): z.ZodObject`

Maps each field definition to a Zod validator based on `dataType` and `config`:

| FieldDataType | Zod Type                          | Config Applied                                                               |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| TEXT          | `z.string()`                      | `.min(config.minLength)`, `.max(config.maxLength)`, `.regex(config.pattern)` |
| LONG_TEXT     | `z.string()`                      | `.max(config.maxLength)`                                                     |
| NUMBER        | `z.number()`                      | `.min(config.min)`, `.max(config.max)`                                       |
| BOOLEAN       | `z.boolean()`                     | —                                                                            |
| DATE          | `z.string().date()`               | —                                                                            |
| DATETIME      | `z.string().datetime()`           | —                                                                            |
| ENUM          | `z.enum(config.options)`          | Validates against option values                                              |
| MULTI_ENUM    | `z.array(z.enum(config.options))` | Validates array of option values                                             |
| EMAIL         | `z.string().email()`              | —                                                                            |
| URL           | `z.string().url()`                | —                                                                            |
| PHONE         | `z.string().min(7).max(20)`       | —                                                                            |
| FILE/IMAGE    | `z.string()`                      | File validation handled separately                                           |
| REFERENCE     | `z.string()`                      | Reference validation handled separately                                      |
| FORMULA       | `z.any()`                         | Computed field, not user-input                                               |
| JSON          | `z.unknown()`                     | —                                                                            |

After building the base type, iterates `field.validation[]` to apply `.refine()` for custom rules (`regex`, `min`, `max`). Required fields remain required; optional fields are wrapped with `.optional()`.

#### `parseFieldFormData(formData: FormData, fieldDefs: FieldDefinition[]): Record<string, unknown>`

Coerces HTML form string values to correct JS types:

- **NUMBER** → `Number(value)`, `undefined` if NaN or empty
- **BOOLEAN** → `value === "on" || "true" || "1"`, `false` if missing
- **MULTI_ENUM** → `formData.getAll()` (array), filters empty strings
- **JSON** → `JSON.parse()` with fallback to raw string
- **FORMULA** → skipped entirely
- **All others** → string or `undefined` if empty

#### `getCachedSchema(tenantId, eventId, participantTypeId, fieldDefs): z.ZodObject`

- Cache key: `${tenantId}:${eventId}:${participantTypeId ?? "null"}`
- Hash: sorted `fieldDefs.map(f => f.id + f.updatedAt.toISOString())`
- On hit with matching hash → return cached schema (same reference)
- On miss or hash mismatch → rebuild, evict oldest if at 1000 capacity, store and return

#### `buildConformConstraints(fieldDefs: FieldDefinition[]): Record<string, ConformConstraint>`

Maps each field to a Conform constraint object with `required`, `minLength`, `maxLength`, `min`, `max`, `pattern` — only includes properties that have values.

### Verification Results

| Check               | Result                                    |
| ------------------- | ----------------------------------------- |
| `npm run typecheck` | Zero errors                               |
| `npx vitest run`    | 117/117 tests pass (53 new + 64 existing) |

---

## 6. P1-04 — Form Renderer

> **Status:** Complete
> **Depends on:** P1-03

### What This Task Does

Builds the React components that render fields in forms. Each `FieldDefinition` maps to a specific form input component based on its `dataType`. The renderer uses Conform for form binding and works with progressive enhancement (forms work without JavaScript). Also provides a test route at `/admin/test-field-form` that demonstrates the full pipeline: load field definitions → render form → validate with Zod → display results.

### Why It's Designed This Way

Rather than creating 8 separate base input component files (as the task doc suggested), all rendering is handled inline within `FieldRenderer` using a single switch statement. This keeps the component tree flat and avoids premature abstraction — each data type maps to shadcn/ui components (`Input`, `Textarea`, `NativeSelect`) with Conform helpers (`getInputProps`, `getSelectProps`, `getTextareaProps`, `getCollectionProps`). A shared `ConformField` wrapper component (using shadcn `Label`) handles the consistent label + description + error display pattern with semantic design tokens (`text-destructive`, `text-muted-foreground`).

**shadcn/ui adoption:** The project adopted shadcn/ui as the component library. All form inputs use shadcn's native wrappers (`Input`, `Textarea`, `NativeSelect`) which are directly compatible with Conform's `getInputProps`/`getTextareaProps`/`getSelectProps` helpers. For checkboxes (BOOLEAN, MULTI_ENUM), native `<input type="checkbox">` elements are used with shadcn design tokens, since Conform's `getInputProps` and `getCollectionProps` work directly with native checkboxes. The `auth/login.tsx` and dashboard routes also use shadcn `Button`, `Input`, and `Label` components for visual consistency.

### Schema Reconciliation

| Task Doc                                  | Actual                                             | Decision                                                                         |
| ----------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `FieldDefinition` type                    | `FieldDefinition` from `~/generated/prisma/client` | Used `FieldDefinition`                                                           |
| `COUNTRY`, `USER` data types              | Not in `FieldDataType` enum                        | Skipped — only mapped 16 existing types                                          |
| Country data file `app/data/countries.ts` | No COUNTRY type exists                             | Skipped entirely                                                                 |
| Radix `Select` for ENUM                   | shadcn/ui adopted                                  | Used shadcn `NativeSelect` (progressive enhancement, Conform-compatible)         |
| 8 separate base input component files     | shadcn/ui components installed                     | shadcn `Input`/`Textarea`/`NativeSelect` + ConformField wrapper in FieldRenderer |
| `uiConfig.section` grouping               | No `uiConfig` field on FieldDefinition             | Flat rendering (no section grouping)                                             |
| React Testing Library for component tests | Not installed                                      | Tested extracted pure logic functions only                                       |

### Files Created

| File                                             | Purpose                                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `app/components/fields/types.ts`                 | Shared types (`FieldConfig`, `FieldElementDescriptor`), helpers (`getFieldConfig`, `sortFieldDefs`, `getFieldElementType`) |
| `app/components/ui/conform-field.tsx`            | Conform-aware label + description + error wrapper using shadcn Label (standard and inline/checkbox layouts)                |
| `app/components/fields/FieldRenderer.tsx`        | Core component: maps `dataType` → shadcn Input/Textarea/NativeSelect with Conform binding                                  |
| `app/components/fields/FieldSection.tsx`         | Groups/sorts/renders array of field definitions in a responsive grid                                                       |
| `app/components/fields/index.ts`                 | Barrel exports                                                                                                             |
| `app/components/fields/__tests__/fields.test.ts` | 25 pure logic tests for helpers (no DOM rendering)                                                                         |
| `app/routes/admin/test-field-form.tsx`           | Integration example route showing full pipeline (loader → form → action → validation)                                      |

### Files Modified

| File                                                | Change                                              |
| --------------------------------------------------- | --------------------------------------------------- |
| `app/routes.ts`                                     | Added `test-field-form` as child of dashboard route |
| `docs/PHASE-1-COMPLETION.md`                        | Added P1-04 section                                 |
| `docs/tasks/phase-1/P1-04-dynamic-form-renderer.md` | Added reconciliation note                           |

### Component Architecture

**FieldRenderer** — Single switch on `fieldDef.dataType`, renders ConformField + shadcn component:

| dataType   | Component                       | Conform Helper       | Special Behavior                                        |
| ---------- | ------------------------------- | -------------------- | ------------------------------------------------------- |
| TEXT       | `<Input>`                       | `getInputProps`      | placeholder, maxLength, pattern                         |
| LONG_TEXT  | `<Textarea>`                    | `getTextareaProps`   | rows (default 3), maxLength                             |
| NUMBER     | `<Input type="number">`         | `getInputProps`      | min, max, step; optional prefix/suffix addons           |
| BOOLEAN    | `<input type="checkbox">`       | `getInputProps`      | Native checkbox with shadcn tokens, inline ConformField |
| DATE       | `<Input type="date">`           | `getInputProps`      | min=minDate, max=maxDate                                |
| DATETIME   | `<Input type="datetime-local">` | `getInputProps`      | min, max                                                |
| ENUM       | `<NativeSelect>`                | `getSelectProps`     | Placeholder option + config.options                     |
| MULTI_ENUM | native checkbox group           | `getCollectionProps` | Native checkboxes with shadcn tokens                    |
| EMAIL      | `<Input type="email">`          | `getInputProps`      | placeholder                                             |
| URL        | `<Input type="url">`            | `getInputProps`      | placeholder                                             |
| PHONE      | `<Input type="tel">`            | `getInputProps`      | placeholder                                             |
| FILE       | `<Input type="file">`           | `getInputProps`      | accept from config                                      |
| IMAGE      | `<Input type="file">`           | `getInputProps`      | accept defaults to "image/\*"                           |
| REFERENCE  | `<Input type="text">`           | `getInputProps`      | placeholder="Enter ID"                                  |
| FORMULA    | `<span>`                        | none                 | Read-only "(Computed field)"                            |
| JSON       | `<Textarea>`                    | `getTextareaProps`   | rows=5, monospace font                                  |

**FieldSection** — Sorts fields, renders in responsive grid:

- 1 or 2 column grid layout
- Full-width types (LONG_TEXT, BOOLEAN, JSON, MULTI_ENUM) span both columns
- Missing fieldset keys silently skipped (schema mismatch guard)
- Empty fieldDefs returns null

### Verification Results

| Check               | Result                                     |
| ------------------- | ------------------------------------------ |
| `npm run typecheck` | Zero errors                                |
| `npx vitest run`    | 142/142 tests pass (25 new + 117 existing) |

---

## 7. P1-05 — Field Admin UI

> **Status:** Not started
> **Depends on:** P1-01, P1-04

_To be completed._

---

## 8. P1-06 — JSONB Query Layer & Expression Indexes

> **Status:** Not started
> **Depends on:** P1-00

_To be completed._

---

## 9. P1-07 — Workflow Versioning

> **Status:** Not started
> **Depends on:** P1-00

_To be completed._

---

## 10. P1-08 — SLA Enforcement

> **Status:** Not started
> **Depends on:** P1-07

_To be completed._

---

## 11. P1-09 — Optimistic Locking

> **Status:** Not started
> **Depends on:** P1-00

_To be completed._

---

## 12. P1-10 — Rate Limiting Enhancement

> **Status:** Not started
> **Depends on:** P1-01

_To be completed._

---

## 13. P1-11 — File Upload Scanning

> **Status:** Not started
> **Depends on:** P1-00

_To be completed._

---

## 14. Commit History

```
(Phase 0 final commits for reference)
0ed240f docs: add Phase 1 task definitions (12 tasks)
0cb709a docs: update CLAUDE.md to reflect current project state
63999d5 chore: move modules and tasks into docs folder
4428e61 fix: propagate CSP nonce to React SSR pipeline
37c665f chore: upgrade to Prisma 7 with driver adapters and Node 22 LTS

d80455e feat: implement P1-01 authentication & session management
28de3ab feat: implement P1-00 core data model migration

61dbf8b feat: implement P1-02 custom field definition CRUD

feat: implement P1-03 dynamic Zod schema builder
feat: implement P1-04 dynamic form renderer

a332ff2 feat: migrate to react-router-auto-routes for file-system routing

(Phase 1 commits — to be updated as tasks are completed)
```

---

## 15. Complete File Inventory

### Files Created

| File                                                                                     | Task  | Purpose                                                                                  |
| ---------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| `prisma/migrations/20260215054649_phase1_core_models/migration.sql`                      | P1-00 | Phase 1 database migration (enums, tables, indexes, FKs, partial indexes)                |
| `prisma/migrations/20260215060000_rename_custom_field_def_and_custom_data/migration.sql` | P1-00 | Rename `CustomFieldDef` → `FieldDefinition`, `customData` → `extras` (data-preserving)   |
| `docs/PHASE-1-COMPLETION.md`                                                             | P1-00 | This completion report                                                                   |
| `app/lib/auth.server.ts`                                                                 | P1-01 | Password hashing/verification using bcryptjs                                             |
| `app/lib/session.server.ts`                                                              | P1-01 | Cookie session storage, user session management                                          |
| `app/lib/require-auth.server.ts`                                                         | P1-01 | Auth guards: `requireAuth`, `requireRole`, `requireAnyRole`, `hasPermission`             |
| `app/routes/auth/login.tsx`                                                              | P1-01 | Login page with Conform + Zod, progressive lockout, audit logging                        |
| `app/routes/auth/logout.tsx`                                                             | P1-01 | Logout action with session destruction                                                   |
| `app/routes/admin/_layout.tsx`                                                           | P1-01 | Protected dashboard layout route                                                         |
| `app/routes/admin/index.tsx`                                                             | P1-01 | Dashboard index page                                                                     |
| `app/lib/__tests__/auth.server.test.ts`                                                  | P1-01 | 5 tests for password hashing/verification                                                |
| `app/lib/__tests__/session.server.test.ts`                                               | P1-01 | 3 tests for session management                                                           |
| `app/lib/__tests__/require-auth.server.test.ts`                                          | P1-01 | 3 tests for RBAC permission checking                                                     |
| `app/config/fields.ts`                                                                   | P1-02 | Limit constants (500/tenant, 100/event)                                                  |
| `app/lib/schemas/field.ts`                                                               | P1-02 | Zod v4 schemas for create, update, reorder                                               |
| `app/services/fields.server.ts`                                                          | P1-02 | Service layer: list, create, update, delete, reorder                                     |
| `app/routes/api/v1/fields/index.tsx`                                                     | P1-02 | GET (list) + POST (create) route                                                         |
| `app/routes/api/v1/fields/$id.tsx`                                                       | P1-02 | PUT (update) + DELETE route                                                              |
| `app/routes/api/v1/fields/reorder.tsx`                                                   | P1-02 | POST (reorder) route                                                                     |
| `app/lib/schemas/__tests__/field.test.ts`                                                | P1-02 | 28 schema validation tests                                                               |
| `app/services/__tests__/fields.server.test.ts`                                           | P1-02 | 19 service layer tests                                                                   |
| `app/lib/fields.server.ts`                                                               | P1-03 | Zod schema builder, form parser, cache, Conform constraints                              |
| `app/lib/__tests__/fields.server.test.ts`                                                | P1-03 | 53 tests for all 4 functions                                                             |
| `app/components/fields/types.ts`                                                         | P1-04 | Shared types (FieldConfig), helpers (getFieldConfig, sortFieldDefs, getFieldElementType) |
| `app/components/ui/conform-field.tsx`                                                    | P1-04 | Conform-aware label + description + error wrapper using shadcn Label                     |
| `app/components/fields/FieldRenderer.tsx`                                                | P1-04 | Core component: maps dataType → shadcn Input/Textarea/NativeSelect with Conform binding  |
| `app/components/fields/FieldSection.tsx`                                                 | P1-04 | Groups/sorts/renders field definitions in responsive grid                                |
| `app/components/fields/index.ts`                                                         | P1-04 | Barrel exports                                                                           |
| `app/components/fields/__tests__/fields.test.ts`                                         | P1-04 | 25 pure logic tests for helper functions                                                 |
| `app/routes/admin/test-field-form.tsx`                                                   | P1-04 | Integration test route: full field form pipeline                                         |

### Files Modified

| File                               | Task(s)      | Changes                                                                          |
| ---------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| `prisma/schema.prisma`             | P1-00        | +8 enums, +10 models, updated Tenant/User/Event relations (~350 new lines)       |
| `app/lib/db.server.ts`             | P1-00        | +2 soft-delete middleware blocks (participant, workflow)                         |
| `prisma/seed.ts`                   | P1-00        | Expanded from 2 entities to full RBAC + event + workflow scenario                |
| `tests/setup/integration-setup.ts` | P1-00        | Truncation order: 5 tables → 17 tables                                           |
| `tests/factories/index.ts`         | P1-00, P1-02 | +5 factory functions, expanded seedFullScenario, +`buildFieldDefinition`         |
| `scripts/verify-indexes.ts`        | P1-00        | Expected indexes: 4 models → 16 models (33 total index checks)                   |
| `app/routes.ts`                    | Infra        | Migrated to `autoRoutes()` from `react-router-auto-routes` (file-system routing) |
| `app/lib/require-auth.server.ts`   | P1-02        | Added `requirePermission(request, resource, action)` helper                      |

---

## 16. Bugs & Gotchas Encountered

### 1. Partial indexes dropped by Prisma migration

**Problem:** The Phase 1 migration auto-generated `DROP INDEX "idx_user_active"` and `DROP INDEX "idx_event_active"` statements. These partial indexes were created with raw SQL in a Phase 0 migration and aren't tracked in the Prisma schema DSL.

**Cause:** Prisma's migration diffing detects database objects that exist in the DB but not in the schema as "drift" and removes them to bring the database in line with the schema.

**Fix:** Appended `CREATE INDEX` statements to the generated migration SQL to restore the dropped indexes and add the new ones (`idx_participant_active`, `idx_workflow_active`). This is a known pattern when using Prisma with custom SQL — you must manually maintain partial indexes in migration files.

**Prevention:** Always use `--create-only` when generating migrations and review the SQL before applying. Search for `DROP INDEX` statements that affect custom indexes.

### 2. NULL values in composite unique constraints

**Problem:** The `UserRole.@@unique([userId, roleId, eventId])` constraint doesn't prevent duplicate rows when `eventId` is `NULL`, because PostgreSQL treats `NULL != NULL` in unique indexes.

**Impact:** A user could theoretically be assigned the same global role twice.

**Mitigation:** The seed uses `createMany({ skipDuplicates: true })` for global role assignments. A future enhancement could add a partial unique index: `CREATE UNIQUE INDEX ... ON "UserRole" (userId, roleId) WHERE eventId IS NULL`.

### 3. `prisma migrate dev` interactive prompt after applying

**Problem:** After applying the migration, `prisma migrate dev` detected schema drift (from the partial indexes added via raw SQL) and prompted interactively for a new migration name.

**Fix:** Cancelled the interactive prompt, confirmed the migration was applied with `prisma migrate status`, and regenerated the client with `prisma generate`. The drift is expected and harmless — Prisma doesn't need to "own" the partial indexes.

### 4. Zod v4 `z.record()` requires explicit key type

**Problem:** `z.record(z.unknown())` compiles in Zod v3 but fails in Zod v4 with "Expected 2-3 arguments, but got 1".

**Cause:** Zod v4 changed the `z.record()` signature to require both key and value types: `z.record(keyType, valueType)`.

**Fix:** Use `z.record(z.string(), z.unknown())` instead of `z.record(z.unknown())`.

**Prevention:** When using Zod v4 (`import { z } from "zod/v4"`), always provide both key and value types to `z.record()`.

---

## 17. Architecture Decisions

### AD-01: Soft references for Step routing

**Decision:** Step routing fields (`nextStepId`, `rejectionTargetId`, `bypassTargetId`, `escalationTargetId`) are plain `String?` fields, not Prisma relations.

**Rationale:**

1. Self-referential relations in Prisma create circular dependencies that complicate migration ordering
2. When a step is deleted, soft references simply become "dangling" — easy to detect and handle vs. cascading deletes that could break active workflows
3. Routing validation belongs in the application layer where we can produce domain-specific error messages ("Step 'Review' references non-existent step ID 'xyz'")
4. The workflow engine can validate the entire step graph on publish, catching invalid routes before they affect participants

**Trade-off:** No database-level referential integrity for step routing. We accept this because workflows are validated as a whole before publishing, and the routing graph is application-domain logic.

### AD-02: Explicit join tables for RBAC

**Decision:** `RolePermission` and `UserRole` are explicit Prisma models, not implicit many-to-many relations.

**Rationale:**

1. Explicit models support `createdAt` timestamps (who granted this permission and when?)
2. `UserRole` has an additional `eventId` field for event-scoped assignments — impossible with implicit relations
3. Future extensibility: can add `grantedBy`, `expiresAt`, `conditions` without migration headaches
4. Direct access to the join table in queries (no `connect`/`disconnect` API needed)

### AD-03: AuditLog with no Prisma relations

**Decision:** `AuditLog.tenantId` and `AuditLog.userId` are plain strings, not foreign keys.

**Rationale:**

1. Audit records must survive entity deletion — if a user is deleted, their audit trail must remain intact for compliance
2. No cascade deletes can accidentally wipe audit history
3. The `entityType` + `entityId` pattern is polymorphic — one table logs actions against any model
4. Query performance is handled by composite indexes, not join lookups

### AD-04: RequestStatus scoped to Phase 1

**Decision:** Only 6 status values instead of the full 10+ from the design docs.

**Rationale:**

1. Phase 1 implements a 3-step workflow (Review → Approval → Badge Printing), which only needs PENDING, IN_PROGRESS, APPROVED, REJECTED, CANCELLED, PRINTED
2. PostgreSQL's `ALTER TYPE ... ADD VALUE` allows adding new enum values without a full migration
3. Unused enum values create confusion and dead code paths
4. Each new status will be added in the phase that implements the feature requiring it

### AD-05: Hybrid schema with JSONB extras

**Decision:** Participant has fixed columns (firstName, lastName, etc.) + a JSONB `extras` column for tenant-defined fields.

**Rationale:**

1. Fixed columns get native PostgreSQL types, constraints, and indexes — optimal for universally-needed fields
2. JSONB provides schema-on-read flexibility — tenant admins add fields without migrations
3. Expression indexes on JSONB paths (`CREATE INDEX ON "Participant" ((extras->>'weapon_permit'))`) provide query performance for searchable fields
4. The `FieldDefinition` model serves as the "schema registry" — it defines what's allowed in `extras`, driving Zod validation, form rendering, and index creation

---

## 18. Quality Gate Progress

Progress toward the Phase 1 → Phase 2 quality gate:

| Criterion                                                     | Status      | Notes                                  |
| ------------------------------------------------------------- | ----------- | -------------------------------------- |
| Admin can create, edit, reorder, and delete field definitions | In progress | P1-02 API complete, P1-05 UI pending   |
| Fields render on registration forms                           | Complete    | P1-04 — 25 tests, test route available |
| JSONB queries support filtering with expression indexes       | Not started | P1-06                                  |
| Workflow versioning snapshots active version on entry         | Not started | P1-07                                  |
| SLA overdue detection runs as background job (5 min)          | Not started | P1-08                                  |
| Optimistic locking prevents concurrent approve/reject         | Not started | P1-09                                  |
| Rate limiting active on all authenticated API routes          | Not started | P1-10                                  |
| File uploads scanned for malware before acceptance            | Not started | P1-11                                  |
| Zod schemas validate field data on submission                 | Complete    | P1-03 — 53 tests                       |
| Unit test coverage ≥ 85% for new code                         | In progress | 142/142 tests pass across 9 test files |
