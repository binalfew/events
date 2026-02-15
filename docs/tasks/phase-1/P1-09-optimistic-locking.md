# P1-09: Optimistic Locking

| Field                  | Value                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Task ID**            | P1-09                                                                          |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                          |
| **Category**           | Core / API                                                                     |
| **Suggested Assignee** | Senior Backend Engineer                                                        |
| **Depends On**         | P1-00                                                                          |
| **Blocks**             | None                                                                           |
| **Estimated Effort**   | 2 days                                                                         |
| **Module References**  | [Module 07 §Optimistic Locking](../../modules/07-API-AND-INTEGRATION-LAYER.md) |

---

## Context

In an accreditation workflow, multiple validators may be looking at the same participant simultaneously. Without conflict detection, two validators could approve and reject the same participant, with the last write silently winning. Optimistic locking detects these conflicts and returns a 409 Conflict response, forcing the second user to refresh before acting.

The approach uses the `updatedAt` timestamp as a version identifier. Clients send the expected version via an `If-Match` header (or form hidden field for HTML forms). If the resource was modified since that version, the server rejects the mutation.

---

## Deliverables

### 1. Conflict Detection Utility (`app/services/optimistic-lock.server.ts`)

```typescript
/**
 * Error thrown when a concurrent modification is detected.
 */
export class ConflictError extends Error {
  public readonly statusCode = 409;
  public readonly code = "CONFLICT";
  public readonly currentResource: Record<string, unknown>;

  constructor(message: string, currentResource: Record<string, unknown>) {
    super(message);
    this.name = "ConflictError";
    this.currentResource = currentResource;
  }
}

/**
 * Check if a resource has been modified since the expected version.
 * Throws ConflictError if the version doesn't match.
 * Throws 404 if the resource doesn't exist.
 * Throws 428 if no expected version is provided (Precondition Required).
 */
export function checkOptimisticLock<T extends { updatedAt: Date }>(
  resource: T | null,
  expectedVersion: string | null,
  resourceType: string,
): T;

/**
 * Extract the expected version from the request.
 * Checks If-Match header first, falls back to form field "_version".
 */
export function getExpectedVersion(request: Request): string | null;

/**
 * Build a Prisma WHERE clause that includes the version check.
 * This ensures the update only succeeds if the version matches.
 */
export function withVersionCheck(
  where: Record<string, unknown>,
  expectedVersion: Date,
): Record<string, unknown>;
```

### 2. Prisma-Level Version Check

Use Prisma's `update` with a compound where clause to achieve atomic version checking:

```typescript
// Instead of:
await prisma.participant.update({
  where: { id: participantId },
  data: { status: "APPROVED" },
});

// Use:
const updated = await prisma.participant.update({
  where: {
    id: participantId,
    updatedAt: expectedUpdatedAt, // Fails if someone else modified it
  },
  data: { status: "APPROVED" },
});
// If no rows matched (Prisma throws P2025), another user modified the record
```

### 3. Error Handler Integration (`app/utils/api-error.server.ts`)

```typescript
/**
 * Format error responses consistently.
 */
export function formatErrorResponse(error: unknown): Response;

// ConflictError → 409 with current resource for client resolution:
// {
//   "error": "CONFLICT",
//   "message": "Participant was modified by another user",
//   "currentVersion": "2026-02-14T12:05:30.000Z",
//   "current": { /* full current resource */ }
// }

// PrismaClientKnownRequestError P2025 → 409 (record not found = version mismatch):
// Re-fetch the resource and return it with the conflict response

// 404 → resource not found
// 428 → missing version header (Precondition Required)
```

### 4. HTML Form Integration

For progressive enhancement (forms without JavaScript), include the version as a hidden field:

```typescript
// In loader: return the resource with its version
export async function loader() {
  const participant = await prisma.participant.findUnique(...);
  return { participant, version: participant.updatedAt.toISOString() };
}

// In the form component:
<Form method="post">
  <input type="hidden" name="_version" value={version} />
  {/* ... other fields ... */}
</Form>

// In action: check the version
export async function action({ request }) {
  const formData = await request.formData();
  const expectedVersion = formData.get("_version") as string;
  // ... check and update with version
}
```

### 5. Apply to Workflow Actions

Integrate optimistic locking with the workflow navigation (P1-07):

- `processWorkflowAction()` should require an expected version
- When a validator approves/rejects, include the participant's version
- If another validator acted first, return 409 with the current state
- The UI should show a conflict resolution message: "This participant was already [action] by [user]"

### 6. Apply to Custom Field Updates

Integrate with custom field CRUD (P1-02):

- Field updates require the expected version
- Prevents two admins from simultaneously editing the same field definition

### 7. Tests

Write tests for:

- Successful update when version matches
- 409 Conflict when version doesn't match (resource was modified)
- 428 Precondition Required when no version is provided
- 404 when resource doesn't exist
- Conflict response includes the current resource state
- Version extraction from `If-Match` header
- Version extraction from form hidden field `_version`
- Concurrent approve/reject on same participant (simulate race condition)
- Prisma P2025 error is caught and converted to 409

---

## Acceptance Criteria

- [ ] Mutations require a version (via `If-Match` header or `_version` form field)
- [ ] Mismatched versions return 409 Conflict with the current resource state
- [ ] Missing version returns 428 Precondition Required
- [ ] Concurrent approve/reject on the same participant: first succeeds, second gets 409
- [ ] Conflict response includes enough data for the client to resolve
- [ ] HTML forms include a hidden `_version` field for progressive enhancement
- [ ] Workflow actions (approve, reject, bypass) use optimistic locking
- [ ] Custom field updates use optimistic locking
- [ ] Prisma P2025 errors are gracefully converted to 409 responses
- [ ] `npm run typecheck` passes with zero errors
- [ ] Unit tests cover all conflict scenarios
