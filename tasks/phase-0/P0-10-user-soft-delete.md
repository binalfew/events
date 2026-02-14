# P0-10: User Soft Delete

| Field                  | Value                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Task ID**            | P0-10                                                                                                              |
| **Phase**              | 0 — Foundation                                                                                                     |
| **Category**           | Data                                                                                                               |
| **Suggested Assignee** | Senior Backend Engineer                                                                                            |
| **Depends On**         | P0-09 (Missing Indexes), P0-05 (Testing Framework)                                                                 |
| **Blocks**             | None                                                                                                               |
| **Estimated Effort**   | 2 days                                                                                                             |
| **Module References**  | [Module 01 §3.2](../modules/01-DATA-MODEL-FOUNDATION.md), [Module 00 §3.2](../modules/00-ARCHITECTURE-OVERVIEW.md) |

---

## Context

Deleting users currently performs a hard delete, which breaks referential integrity with audit logs, approvals, and other records that reference the user. Soft delete allows users to be "removed" while preserving data integrity and supporting future reactivation or GDPR-compliant purge.

---

## Deliverables

### 1. Schema Changes

Add `deletedAt` column to the following Prisma models:

| Model              | Column      | Type        | Default |
| ------------------ | ----------- | ----------- | ------- |
| `User`             | `deletedAt` | `DateTime?` | `null`  |
| `Workflow`         | `deletedAt` | `DateTime?` | `null`  |
| `WorkflowTemplate` | `deletedAt` | `DateTime?` | `null`  |

Create a Prisma migration for these changes.

### 2. Prisma Middleware or Extension for Auto-Filtering

Implement a Prisma client extension (preferred over middleware for type safety) that:

- Automatically adds `WHERE deletedAt IS NULL` to all `findMany`, `findFirst`, `findUnique`, `count`, and `aggregate` queries on models with `deletedAt`
- Provides an escape hatch: `{ includeDeleted: true }` option to bypass the filter (for admin views)
- Does NOT affect `update` or `delete` operations (those should still target specific records)

### 3. Soft Delete Utility

Create `app/utils/soft-delete.server.ts`:

```typescript
// Soft-deletes a user by setting deletedAt = now()
async function softDeleteUser(userId: string): Promise<void>;

// Restores a soft-deleted user by setting deletedAt = null
async function restoreUser(userId: string): Promise<void>;

// Checks if a user is soft-deleted
function isDeleted(user: { deletedAt: Date | null }): boolean;
```

### 4. Session Invalidation on Soft Delete

When a user is soft-deleted:

- Invalidate all active sessions for that user (delete from `Session` table)
- The user cannot log in while soft-deleted (login query must filter `WHERE deletedAt IS NULL`)

### 5. Audit Logging

- Log a `USER_DELETED` audit event when a user is soft-deleted (include `deletedBy` user ID)
- Log a `USER_RESTORED` audit event when a user is restored

### 6. Update All Existing User Queries

Audit the codebase for all locations that query the `User` model. Ensure they all go through the Prisma extension that auto-filters deleted users. Key locations to check:

- Login / authentication flow
- User listing pages
- User assignment dropdowns (role assignment, event access)
- Approval attribution (approvals by deleted users should still display the user's name)
- Session validation

### 7. Admin View — Include Deleted Users

The admin user management page should have a toggle to show/hide deleted users. Deleted users should appear with a visual indicator (e.g., strikethrough or "Deleted" badge) and a "Restore" action.

### 8. Index on `deletedAt`

Add a partial index for efficient queries:

```sql
CREATE INDEX idx_user_active ON "User" (id) WHERE "deletedAt" IS NULL;
```

This optimizes the common case (querying active users) without indexing the rare case (deleted users).

### 9. Tests

Using the testing framework from P0-05, write tests for:

| Test                                    | Assertion                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| Soft delete sets `deletedAt`            | `user.deletedAt` is not null after soft delete                                  |
| Soft-deleted user excluded from queries | `findMany` returns only active users by default                                 |
| `includeDeleted` flag works             | `findMany({ includeDeleted: true })` returns deleted users                      |
| Login blocked for soft-deleted user     | Login with a soft-deleted user's credentials returns auth error                 |
| Sessions invalidated on soft delete     | Active sessions for the user are removed                                        |
| Restore clears `deletedAt`              | `user.deletedAt` is null after restore                                          |
| Restored user can log in                | Login succeeds after restore                                                    |
| Audit events logged                     | Soft delete creates `USER_DELETED` audit entry; restore creates `USER_RESTORED` |
| Historical references preserved         | Approvals by a soft-deleted user still display the user's name                  |

---

## Acceptance Criteria

- [ ] `User`, `Workflow`, and `WorkflowTemplate` models have a `deletedAt DateTime?` column
- [ ] A Prisma migration applies the schema change cleanly
- [ ] `prisma.user.findMany()` returns only users where `deletedAt IS NULL` by default
- [ ] `prisma.user.findMany({ includeDeleted: true })` returns all users including deleted ones
- [ ] Soft-deleting a user invalidates all their sessions immediately
- [ ] A soft-deleted user cannot log in (receives authentication error)
- [ ] Restoring a soft-deleted user allows them to log in again
- [ ] `USER_DELETED` and `USER_RESTORED` audit events are created with the correct metadata
- [ ] Approvals and audit logs referencing a soft-deleted user still resolve the user's name (no broken references)
- [ ] A partial index `idx_user_active` exists on the `User` table
- [ ] All tests listed above pass
