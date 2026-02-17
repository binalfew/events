# P3-00: Foundation — Models, Migrations, Permissions, Feature Flags

| Field                  | Value                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Task ID**            | P3-00                                                                                                               |
| **Phase**              | 3 — Advanced Features                                                                                               |
| **Category**           | Configuration                                                                                                       |
| **Suggested Assignee** | Backend Developer                                                                                                   |
| **Depends On**         | None (Phase 2 complete)                                                                                             |
| **Blocks**             | P3-01 through P3-10                                                                                                 |
| **Estimated Effort**   | 3 days                                                                                                              |
| **Module References**  | [Module 01](../../modules/01-DATA-MODEL-FOUNDATION.md), [Module 17](../../modules/17-SETTINGS-AND-CONFIGURATION.md) |

---

## Context

Phase 3 introduces 8 new Prisma models, 10 feature flags, and 4 new permissions. This foundation task creates the data layer all other Phase 3 tasks depend on. Nothing can proceed until models are migrated and the seed script updated.

---

## Deliverables

### 1. New Enums

Add to `prisma/schema.prisma`:

```prisma
enum AssignmentStrategy {
  MANUAL
  ROUND_ROBIN
  LEAST_LOADED
}

enum AutoActionType {
  AUTO_APPROVE
  AUTO_REJECT
  AUTO_BYPASS
  AUTO_ESCALATE
}

enum DelegationInviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}

enum ViewType {
  TABLE
  KANBAN
  CALENDAR
  GALLERY
}
```

### 2. New Prisma Models

**StepAssignment** — assigns users to workflow steps with load-balancing strategies.

```prisma
model StepAssignment {
  id         String             @id @default(cuid())
  stepId     String
  step       Step               @relation(fields: [stepId], references: [id], onDelete: Cascade)
  userId     String
  user       User               @relation("StepAssignments", fields: [userId], references: [id], onDelete: Cascade)
  strategy   AssignmentStrategy @default(MANUAL)
  isActive   Boolean            @default(true)
  assignedBy String?
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt

  @@unique([stepId, userId])
  @@index([stepId, isActive])
  @@index([userId, isActive])
}
```

**AutoActionRule** — condition-driven automatic actions on workflow steps.

```prisma
model AutoActionRule {
  id                  String         @id @default(cuid())
  stepId              String
  step                Step           @relation(fields: [stepId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  conditionExpression Json
  actionType          AutoActionType
  priority            Int            @default(0)
  isActive            Boolean        @default(true)
  createdBy           String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  @@index([stepId, isActive, priority])
}
```

**DelegationQuota** — per-organization allocation for an event.

```prisma
model DelegationQuota {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  organizationId  String
  maxParticipants Int
  usedCount       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  event   Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  invites DelegationInvite[]

  @@unique([tenantId, eventId, organizationId])
  @@index([tenantId, eventId])
}
```

**DelegationInvite** — invitation tokens sent to delegates.

```prisma
model DelegationInvite {
  id         String                 @id @default(cuid())
  quotaId    String
  quota      DelegationQuota        @relation(fields: [quotaId], references: [id], onDelete: Cascade)
  email      String
  token      String                 @unique
  status     DelegationInviteStatus @default(PENDING)
  invitedBy  String
  acceptedAt DateTime?
  expiresAt  DateTime
  createdAt  DateTime               @default(now())
  updatedAt  DateTime               @updatedAt

  @@index([quotaId, status])
  @@index([token])
  @@index([email])
}
```

**SavedView** — user-saved list configurations (filters, sorts, columns, layout).

```prisma
model SavedView {
  id         String   @id @default(cuid())
  tenantId   String
  userId     String?
  name       String
  entityType String
  viewType   ViewType @default(TABLE)
  filters    Json     @default("[]")
  sorts      Json     @default("[]")
  columns    Json     @default("[]")
  config     Json     @default("{}")
  isShared   Boolean  @default(false)
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  owner User? @relation("SavedViews", fields: [userId], references: [id], onDelete: SetNull)

  @@unique([tenantId, userId, name, entityType])
  @@index([tenantId, entityType])
  @@index([userId])
}
```

**CustomObjectDefinition** — tenant-defined entity types with dynamic fields.

```prisma
model CustomObjectDefinition {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  description String?
  icon        String?
  fields      Json     @default("[]")
  isActive    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  records CustomObjectRecord[]

  @@unique([tenantId, slug])
  @@index([tenantId, isActive])
}
```

**CustomObjectRecord** — instances of custom object definitions.

```prisma
model CustomObjectRecord {
  id           String                 @id @default(cuid())
  definitionId String
  definition   CustomObjectDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  tenantId     String
  data         Json                   @default("{}")
  createdBy    String?
  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt

  @@index([definitionId, tenantId])
  @@index([tenantId])
}
```

**AnalyticsSnapshot** — periodic metric snapshots for dashboard charts.

```prisma
model AnalyticsSnapshot {
  id         String   @id @default(cuid())
  tenantId   String
  eventId    String?
  metric     String
  value      Float
  dimensions Json     @default("{}")
  period     String
  timestamp  DateTime
  createdAt  DateTime @default(now())

  @@index([tenantId, metric, period])
  @@index([tenantId, eventId, metric])
  @@index([timestamp])
}
```

### 3. Reverse Relations

Add reverse relations on existing models:

- `Step`: `assignments StepAssignment[]`, `autoActionRules AutoActionRule[]`
- `User`: `stepAssignments StepAssignment[] @relation("StepAssignments")`, `savedViews SavedView[] @relation("SavedViews")`
- `Event`: `delegationQuotas DelegationQuota[]`

### 4. Feature Flag Keys

Add to `FEATURE_FLAG_KEYS` in `app/lib/feature-flags.server.ts`:

```typescript
I18N: "FF_I18N",
CONDITIONAL_ROUTING: "FF_CONDITIONAL_ROUTING",
STEP_ASSIGNMENT: "FF_STEP_ASSIGNMENT",
AUTO_ACTIONS: "FF_AUTO_ACTIONS",
DELEGATION_PORTAL: "FF_DELEGATION_PORTAL",
SAVED_VIEWS: "FF_SAVED_VIEWS",
CUSTOM_OBJECTS: "FF_CUSTOM_OBJECTS",
ANALYTICS_DASHBOARD: "FF_ANALYTICS_DASHBOARD",
PWA: "FF_PWA",
OFFLINE_MODE: "FF_OFFLINE_MODE",
```

### 5. Permission Seeds

Add to `prisma/seed.ts` permission definitions:

```typescript
{ resource: "delegation", action: "manage" },
{ resource: "views", action: "create" },
{ resource: "custom-objects", action: "manage" },
{ resource: "analytics", action: "view" },
```

### 6. Feature Flag Seeds

Add 10 new flags to the `defaultFlags` array in `prisma/seed.ts`:

```typescript
{ key: "FF_I18N", description: "Internationalization and multi-language support" },
{ key: "FF_CONDITIONAL_ROUTING", description: "Conditional workflow routing based on participant data" },
{ key: "FF_STEP_ASSIGNMENT", description: "Step assignment and reassignment with strategies" },
{ key: "FF_AUTO_ACTIONS", description: "Automatic action rules engine for workflow steps" },
{ key: "FF_DELEGATION_PORTAL", description: "Delegation quota management and invite portal" },
{ key: "FF_SAVED_VIEWS", description: "Saved views with table, kanban, calendar, and gallery layouts" },
{ key: "FF_CUSTOM_OBJECTS", description: "Tenant-defined custom entity types" },
{ key: "FF_ANALYTICS_DASHBOARD", description: "Analytics dashboard with charts and metrics" },
{ key: "FF_PWA", description: "Progressive Web App shell and service worker" },
{ key: "FF_OFFLINE_MODE", description: "Offline mode with IndexedDB mutation queue and sync" },
```

---

## Acceptance Criteria

- [ ] All 8 new models created in Prisma schema
- [ ] All 4 new enums created
- [ ] Migration runs successfully (`prisma migrate dev`)
- [ ] Prisma client generates without errors
- [ ] Reverse relations added to Step, User, Event
- [ ] 10 new feature flag keys added to `FEATURE_FLAG_KEYS`
- [ ] 4 new permissions seeded
- [ ] 10 new feature flags seeded
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (all existing tests green)
- [ ] `npx prisma db seed` completes without errors
