# P0-09: Missing Database Indexes

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Task ID**            | P0-09                                                    |
| **Phase**              | 0 — Foundation                                           |
| **Category**           | Performance                                              |
| **Suggested Assignee** | Senior Backend Engineer                                  |
| **Depends On**         | P0-00 (Project Scaffolding — Prisma schema must exist)   |
| **Blocks**             | P0-10 (Soft Delete)                                      |
| **Estimated Effort**   | 2 days                                                   |
| **Module References**  | [Module 01 §3.8](../modules/01-DATA-MODEL-FOUNDATION.md) |

---

## Context

Foreign key columns used in JOIN operations and WHERE clauses lack corresponding database indexes, causing full table scans on queries that filter by `tenantId`, `eventId`, `userId`, and other foreign keys. This task audits every table and adds missing indexes.

---

## Deliverables

### 1. Foreign Key Index Audit

Audit every model in the Prisma schema. For each foreign key column, verify a corresponding index exists. The following FK columns are likely candidates (non-exhaustive — audit the actual schema):

| Table                  | FK Column(s) Needing Index          |
| ---------------------- | ----------------------------------- |
| `Event`                | `tenantId`                          |
| `User`                 | `tenantId`                          |
| `Participant`          | `tenantId`, `eventId`, `userId`     |
| `ParticipantDocument`  | `participantId`                     |
| `Approval`             | `participantId`, `stepId`, `userId` |
| `Workflow`             | `tenantId`, `eventId`               |
| `WorkflowVersion`      | `workflowId`                        |
| `Step`                 | `workflowVersionId`                 |
| `Invitation`           | `tenantId`, `eventId`               |
| `InvitationConstraint` | `invitationId`                      |
| `Template`             | `tenantId`, `eventId`               |
| `Attachment`           | `templateId`                        |
| `FormTemplate`         | `tenantId`, `eventId`               |
| `FieldDefinition`      | `tenantId`, `eventId`               |
| `CustomObjectDef`      | `tenantId`                          |
| `CustomObjectRecord`   | `objectDefId`, `tenantId`           |
| `UserEventAccess`      | `userId`, `eventId`                 |
| `AuditLog`             | `tenantId`, `userId`                |
| `Notification`         | `tenantId`, `userId`                |
| `Session`              | `userId`                            |
| `SavedView`            | `tenantId`, `userId`                |
| `Meeting`              | `tenantId`, `eventId`               |
| `Restriction`          | `eventId`                           |
| `Constraint`           | `restrictionId`                     |

### 2. Composite Index Review

Beyond single-column FK indexes, add composite indexes for common query patterns:

| Table          | Composite Index                    | Query Pattern                                |
| -------------- | ---------------------------------- | -------------------------------------------- |
| `Participant`  | `[tenantId, eventId, status]`      | Filter participants by event and status      |
| `Approval`     | `[participantId, stepId]`          | Look up approval for a participant at a step |
| `AuditLog`     | `[tenantId, action]`               | Filter audit logs by action type             |
| `AuditLog`     | `[tenantId, entityType, entityId]` | Look up audit trail for a specific entity    |
| `AuditLog`     | `[createdAt]`                      | Time-range queries on audit logs             |
| `Notification` | `[userId, read]`                   | Unread notification count                    |
| `Session`      | `[userId, expiresAt]`              | Active session lookup                        |

### 3. Prisma Migration

- Create a Prisma migration that adds all missing indexes
- Use `CREATE INDEX CONCURRENTLY` where possible (for production safety on existing tables with data)
- Name indexes consistently: `idx_{table}_{column(s)}`

### 4. Verification Query

Write a verification script (`scripts/verify-indexes.ts`) that:

1. Queries `pg_indexes` to list all existing indexes
2. Compares against the expected index list
3. Reports any missing indexes
4. Can be run in CI as a regression check

---

## Acceptance Criteria

- [ ] Every foreign key column in the Prisma schema has a corresponding `@@index` directive
- [ ] Composite indexes are added for the common query patterns listed above
- [ ] A Prisma migration is created and applies cleanly: `npx prisma migrate deploy` succeeds
- [ ] `scripts/verify-indexes.ts` runs and reports zero missing indexes
- [ ] The migration does not lock tables for extended periods (uses `CONCURRENTLY` where applicable)
- [ ] Index names follow the `idx_{table}_{columns}` convention
- [ ] `EXPLAIN ANALYZE` on a `Participant` query filtered by `tenantId + eventId + status` shows an Index Scan (not Seq Scan)
