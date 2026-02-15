# P1-00: Core Data Model Migration

| Field                  | Value                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**            | P1-00                                                                                                                                                                                        |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                                                                                                                                        |
| **Category**           | Data Model                                                                                                                                                                                   |
| **Suggested Assignee** | Senior Backend Engineer                                                                                                                                                                      |
| **Depends On**         | None (Phase 0 complete)                                                                                                                                                                      |
| **Blocks**             | All other Phase 1 tasks (P1-01 through P1-11)                                                                                                                                                |
| **Estimated Effort**   | 3 days                                                                                                                                                                                       |
| **Module References**  | [Module 01 §Data Model](../../modules/01-DATA-MODEL-FOUNDATION.md), [Module 02 §CustomFieldDef](../../modules/02-DYNAMIC-SCHEMA-ENGINE.md), [Module 04](../../modules/04-WORKFLOW-ENGINE.md) |

---

## Context

Phase 0 established the foundational models (Tenant, User, Password, Session, Event). Phase 1 requires several new models to support the dynamic schema engine, workflow hardening, and authentication features. This task adds all Prisma models needed before any Phase 1 feature work can begin.

The current schema has:

- **Tenant** — multi-tenant organization
- **User** — identity with soft delete, account lockout fields
- **Password** — credential storage
- **Session** — cookie-based session tracking
- **Event** — event management with `customData` JSONB column

Phase 1 adds the following models in a single, well-planned migration.

---

## Deliverables

### 1. New Prisma Enums

Add the following enums to `prisma/schema.prisma`:

```prisma
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
  COUNTRY
  USER
}

enum RequestStatus {
  PENDING
  INPROGRESS
  APPROVED
  REJECTED
  WITHDRAWN
  CANCELLED
}

enum WorkflowStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum StepType {
  APPROVAL
  REVIEW
  DATA_ENTRY
  NOTIFICATION
  COLLECTION
  PRINTING
  DISPATCH
}

enum StepAction {
  APPROVE
  REJECT
  BYPASS
  RETURN
  ESCALATE
}

enum SLAAction {
  NOTIFY
  ESCALATE
  AUTO_APPROVE
  AUTO_REJECT
  REASSIGN
}

enum ApprovalAction {
  APPROVE
  REJECT
  BYPASS
  RETURN
  ESCALATE
  REASSIGN
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  APPROVE
  REJECT
  BYPASS
  ESCALATE
  FILE_UPLOAD
  FILE_UPLOAD_BLOCKED
  RATE_LIMIT_EXCEEDED
  SETTINGS_CHANGE
}
```

### 2. ParticipantType Model

Defines categories of participants within an event (e.g., "Delegate", "Media", "Security"):

```prisma
model ParticipantType {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String
  code        String   // Short code: "DEL", "MED", "SEC"
  description String?
  color       String?  // Hex color for badge
  badgeTemplate Json?  // Badge layout config
  quota       Int?     // Max participants of this type
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  participants Participant[]
  customFields CustomFieldDef[]

  @@unique([tenantId, eventId, code])
  @@index([eventId])
}
```

### 3. Participant Model

The core entity that flows through workflows. Has both fixed columns for universal fields and a JSONB `customData` column for event-specific fields:

```prisma
model Participant {
  id                String         @id @default(cuid())
  tenantId          String
  eventId           String
  event             Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantTypeId String
  participantType   ParticipantType @relation(fields: [participantTypeId], references: [id])

  // Universal identity fields (fixed columns)
  registrationCode  String
  firstName         String
  familyName        String
  gender            String?
  dateOfBirth       DateTime?
  nationality       String?        // Country code
  country           String?        // Delegation/residing country
  organization      String?
  jobTitle          String?
  email             String?
  phone             String?

  // Dynamic fields (JSONB — defined by CustomFieldDef)
  customData        Json           @default("{}")

  // Workflow positioning
  status            RequestStatus  @default(PENDING)
  workflowId        String?
  workflow          Workflow?      @relation(fields: [workflowId], references: [id])
  stepId            String?
  step              Step?          @relation(fields: [stepId], references: [id])
  workflowVersionId String?
  workflowVersion   WorkflowVersion? @relation(fields: [workflowVersionId], references: [id])

  // Collection tracking (badge workflow)
  collectedBy       String?
  collectedAt       DateTime?
  reprintCount      Int            @default(0)

  // Audit
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?

  approvals         Approval[]

  @@unique([tenantId, eventId, registrationCode])
  @@index([eventId, stepId, status])
  @@index([tenantId, eventId, participantTypeId])
  @@index([status, createdAt])
  @@index([deletedAt])
  @@index([workflowVersionId])
}
```

### 4. Workflow & Step Models

```prisma
model Workflow {
  id          String         @id @default(cuid())
  tenantId    String
  eventId     String
  event       Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
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
  @@index([eventId, status])
  @@index([deletedAt])
}

model Step {
  id                  String     @id @default(cuid())
  workflowId          String
  workflow            Workflow    @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  stepType            StepType   @default(APPROVAL)
  sortOrder           Int        @default(0)
  isEntryPoint        Boolean    @default(false)
  isFinalStep         Boolean    @default(false)

  // Routing
  nextStepId          String?    // Default next step on approve
  rejectionTargetId   String?    // Step to go to on reject
  bypassTargetId      String?    // Step to go to on bypass
  conditions          Json?      // Conditional routing rules

  // SLA configuration
  slaDurationMinutes  Int?
  slaWarningMinutes   Int?
  slaAction           SLAAction?
  escalationTargetId  String?

  // Assignment
  assignedRoleId      String?

  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  participants        Participant[]
  approvals           Approval[]

  @@unique([workflowId, name])
  @@index([workflowId, sortOrder])
}
```

### 5. WorkflowVersion Model

Snapshots the workflow structure when participants enter, so in-flight participants are unaffected by workflow edits:

```prisma
model WorkflowVersion {
  id          String   @id @default(cuid())
  workflowId  String
  workflow    Workflow  @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  version     Int
  snapshot    Json     // Serialized workflow structure (steps, routing, SLAs)
  createdAt   DateTime @default(now())

  participants Participant[]

  @@unique([workflowId, version])
  @@index([workflowId])
}
```

### 6. Approval Model

Records every action taken on a participant at a workflow step:

```prisma
model Approval {
  id            String         @id @default(cuid())
  participantId String
  participant   Participant    @relation(fields: [participantId], references: [id], onDelete: Cascade)
  stepId        String
  step          Step           @relation(fields: [stepId], references: [id])
  userId        String
  action        ApprovalAction
  comment       String?
  metadata      Json?          // Additional context (e.g., SLA override reason)
  createdAt     DateTime       @default(now())

  @@index([participantId, createdAt])
  @@index([stepId, userId])
  @@index([userId, createdAt])
}
```

### 7. CustomFieldDef Model

Metadata defining each custom field. This is the heart of the dynamic schema engine:

```prisma
model CustomFieldDef {
  id                String        @id @default(cuid())
  tenantId          String
  targetModel       String?       // "Participant", "Event", null for custom objects
  eventId           String?
  event             Event?        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantTypeId String?
  participantType   ParticipantType? @relation(fields: [participantTypeId], references: [id])

  // Field definition
  name              String        // snake_case storage key in customData
  label             String        // Human-readable display label
  description       String?
  dataType          FieldDataType
  sortOrder         Int           @default(0)

  // Constraints
  isRequired        Boolean       @default(false)
  isUnique          Boolean       @default(false)
  isSearchable      Boolean       @default(false)
  isFilterable      Boolean       @default(false)
  defaultValue      String?

  // Type-specific configuration (maxLength, min/max, options[], etc.)
  config            Json          @default("{}")

  // UI hints (widget type, placeholder, section, column span)
  uiConfig          Json          @default("{}")

  // Custom validation rules (regex patterns, cross-field rules)
  validation        Json          @default("[]")

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([tenantId, targetModel, eventId, participantTypeId, name])
  @@index([tenantId, targetModel, eventId])
  @@index([eventId, participantTypeId, sortOrder])
}
```

### 8. AuditLog Model

Records significant actions for compliance and debugging:

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  tenantId    String
  userId      String?
  action      AuditAction
  entityType  String      // "Participant", "Workflow", "CustomFieldDef", etc.
  entityId    String
  changes     Json?       // { before: {...}, after: {...} }
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime    @default(now())

  @@index([tenantId, entityType, entityId])
  @@index([tenantId, action, createdAt])
  @@index([userId, createdAt])
}
```

### 9. Role & Permission Models

Basic RBAC for Phase 1 (full RBAC deferred to later phases):

```prisma
model Role {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   // "ADMIN", "VALIDATOR", "PRINTER", "DISPATCHER", "VIEWER"
  description String?
  isSystem    Boolean  @default(false) // System roles cannot be deleted
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  permissions RolePermission[]
  userRoles   UserRole[]

  @@unique([tenantId, name])
}

model Permission {
  id          String   @id @default(cuid())
  resource    String   // "participant", "workflow", "custom-field", "event", "settings"
  action      String   // "create", "read", "update", "delete", "approve", "reject"
  description String?

  rolePermissions RolePermission[]

  @@unique([resource, action])
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}

model UserRole {
  id       String  @id @default(cuid())
  userId   String
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId   String
  role     Role    @relation(fields: [roleId], references: [id], onDelete: Cascade)
  eventId  String? // Event-scoped role assignment (optional)

  @@unique([userId, roleId, eventId])
  @@index([userId])
  @@index([roleId])
}
```

### 10. Update Existing Models

#### User — add `userRoles` relation:

```prisma
model User {
  // ... existing fields ...
  userRoles   UserRole[]
}
```

#### Event — add relations for new models:

```prisma
model Event {
  // ... existing fields ...
  participantTypes ParticipantType[]
  participants     Participant[]
  workflows        Workflow[]
  customFields     CustomFieldDef[]
}
```

### 11. Create & Run Migration

```bash
npx prisma migrate dev --name phase1-core-models
```

### 12. Update Seed File

Update `prisma/seed.ts` to seed:

- Default system roles (ADMIN, VALIDATOR, PRINTER, DISPATCHER, VIEWER)
- Default permissions for each role
- Assign ADMIN role to the default admin user
- Create a sample ParticipantType for the default event
- Create a sample Workflow with 3 steps (Review → Approval → Badge Printing)

### 13. Generate & Verify

```bash
npx prisma generate
npx tsc --noEmit
npx vitest run
```

---

## Acceptance Criteria

- [ ] `npx prisma migrate dev` runs successfully, creating all new tables
- [ ] All new models are visible in `npx prisma studio`
- [ ] `npx prisma db seed` creates roles, permissions, sample workflow, and participant type
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All existing tests still pass
- [ ] The migration is backward-compatible (no data loss for existing Tenant/User/Event records)
- [ ] Every foreign key column has a corresponding index
- [ ] Composite unique constraints prevent cross-tenant data collisions
- [ ] The `customData` JSONB column on Participant defaults to `{}`
