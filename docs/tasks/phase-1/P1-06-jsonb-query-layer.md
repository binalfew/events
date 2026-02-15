# P1-06: JSONB Query Layer & Expression Indexes

| Field                  | Value                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**            | P1-06                                                                                                                                  |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                                                                                  |
| **Category**           | Dynamic Schema / Performance                                                                                                           |
| **Suggested Assignee** | Senior Backend Engineer                                                                                                                |
| **Depends On**         | P1-00                                                                                                                                  |
| **Blocks**             | None                                                                                                                                   |
| **Estimated Effort**   | 3 days                                                                                                                                 |
| **Module References**  | [Module 02 §JSONB Queries](../../modules/02-DYNAMIC-SCHEMA-ENGINE.md), [Module 01 §Indexes](../../modules/01-DATA-MODEL-FOUNDATION.md) |

---

## Context

Custom field data is stored in JSONB `customData` columns on Participant and Event models. Querying JSONB is flexible but can be slow without indexes. This task builds the query layer for filtering by custom field values and the expression index management system that ensures searchable/filterable fields have database indexes.

The design uses **expression indexes** (also called functional indexes) which index a specific JSONB path, e.g., `CREATE INDEX ON "Participant" (("customData"->>'weapon_permit'))`.

---

## Deliverables

### 1. Query Condition Types (`app/services/custom-query.server.ts`)

```typescript
interface CustomFieldCondition {
  field: string; // The CustomFieldDef.name (key in customData)
  operator:
    | "eq"
    | "neq"
    | "contains"
    | "startsWith"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "notIn"
    | "isNull"
    | "isNotNull";
  value: unknown; // Type depends on operator
}

interface CustomFieldQueryParams {
  tenantId: string;
  eventId: string;
  targetModel: "Participant" | "Event";
  conditions: CustomFieldCondition[];
  // Standard query params
  limit?: number; // Default 50, max 200
  offset?: number; // Default 0
  orderBy?: string; // Field name or "createdAt"
  orderDir?: "asc" | "desc";
}
```

### 2. Query Builder (`app/services/custom-query.server.ts`)

Build Prisma queries that filter by JSONB custom data:

```typescript
/**
 * Filter records by custom field values stored in JSONB customData.
 * Uses Prisma's JSON filtering capabilities with expression index hints.
 */
export async function filterWithCustomFields(
  params: CustomFieldQueryParams,
): Promise<{ data: any[]; total: number }>;
```

**Operator → Prisma JSON filter mapping:**

| Operator   | Prisma Filter                                 | Example                         |
| ---------- | --------------------------------------------- | ------------------------------- |
| eq         | `customData: { path: [field], equals: val }`  | `weapon_permit == "WP-123"`     |
| neq        | `NOT: { customData: { path, equals } }`       | `weapon_permit != "WP-123"`     |
| contains   | `customData: { path, string_contains }`       | `name contains "John"`          |
| startsWith | `customData: { path, string_starts_with }`    | `name starts with "J"`          |
| gt / gte   | Cast to numeric, use raw SQL for comparison   | `age > 18`                      |
| lt / lte   | Cast to numeric, use raw SQL for comparison   | `age < 65`                      |
| in         | `customData: { path, array_contains }`        | `country in ["US", "UK", "FR"]` |
| isNull     | `customData: { path, equals: Prisma.DbNull }` | `visa_number is null`           |
| isNotNull  | `NOT: { customData: { path, equals: null } }` | `visa_number is not null`       |

**Implementation notes:**

- Validate that each condition's field exists in CustomFieldDef for the given scope
- Prevent SQL injection by parameterizing all raw queries
- For numeric comparisons, use `CAST(("customData"->>'field') AS NUMERIC)` in raw SQL
- Return both the data page and total count (for pagination)

### 3. Expression Index Manager (`app/services/custom-query.server.ts`)

Automatically create and drop PostgreSQL expression indexes when fields are marked as searchable/filterable:

```typescript
/**
 * Create an expression index on a JSONB path for fast queries.
 * Called when a CustomFieldDef is created/updated with isSearchable or isFilterable.
 */
export async function ensureCustomFieldIndex(fieldDef: CustomFieldDef): Promise<void>;

/**
 * Drop the expression index for a custom field.
 * Called when a field is deleted or isSearchable/isFilterable is turned off.
 */
export async function dropCustomFieldIndex(fieldDef: CustomFieldDef): Promise<void>;

/**
 * Reconcile all expression indexes for a tenant's custom fields.
 * Ensures indexes exist for searchable/filterable fields and don't exist for others.
 * Called on startup or as a maintenance task.
 */
export async function reconcileCustomFieldIndexes(
  tenantId: string,
): Promise<{ created: string[]; dropped: string[]; unchanged: string[] }>;
```

**Index naming convention:**

```
idx_{tableName}_cf_{fieldName}
```

Example: `idx_Participant_cf_weapon_permit`

**Index SQL template:**

```sql
-- For text fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Participant_cf_weapon_permit"
ON "Participant" (("customData"->>'weapon_permit'))
WHERE "deletedAt" IS NULL;

-- For numeric fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Participant_cf_age"
ON "Participant" (CAST("customData"->>'age' AS NUMERIC))
WHERE "deletedAt" IS NULL;

-- For boolean fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Participant_cf_needs_visa"
ON "Participant" (CAST("customData"->>'needs_visa' AS BOOLEAN))
WHERE "deletedAt" IS NULL;
```

**Safety:**

- Use `CREATE INDEX CONCURRENTLY` to avoid table locks in production
- Use `IF NOT EXISTS` to make operations idempotent
- Validate field names against SQL injection patterns before building SQL
- Log all index operations to AuditLog

### 4. Integration with Custom Field CRUD (P1-02)

Hook into the custom field service to auto-manage indexes:

- On create: if `isSearchable || isFilterable`, create index
- On update: if searchable/filterable changed, create or drop index
- On delete: drop index if it exists

### 5. Query API Route (`app/routes/api.v1.participants.search.tsx`)

Expose the query layer as an API endpoint:

```
POST /api/v1/participants/search
```

**Request body:**

```json
{
  "tenantId": "cuid_tenant",
  "eventId": "cuid_event",
  "conditions": [
    { "field": "country", "operator": "eq", "value": "US" },
    { "field": "needs_visa", "operator": "eq", "value": true }
  ],
  "limit": 50,
  "offset": 0,
  "orderBy": "createdAt",
  "orderDir": "desc"
}
```

**Response:**

```json
{
  "data": [
    /* participant records */
  ],
  "meta": {
    "total": 142,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 6. Tests

Write tests for:

- Basic equality filter on text field
- Numeric comparison operators (gt, lt, gte, lte)
- `contains` and `startsWith` on text fields
- `in` operator with array of values
- `isNull` and `isNotNull` operators
- Combining multiple conditions (AND logic)
- Pagination (limit + offset + total count)
- Expression index creation and deletion
- Index reconciliation (create missing, drop orphaned)
- SQL injection prevention (malicious field names rejected)
- Tenant isolation (cannot query across tenants)

---

## Acceptance Criteria

- [ ] `filterWithCustomFields()` returns correct results for all operators
- [ ] Numeric comparisons work correctly (cast to NUMERIC)
- [ ] Multiple conditions combine with AND logic
- [ ] Pagination returns correct total count and data page
- [ ] Expression indexes are created when fields are marked searchable/filterable
- [ ] Expression indexes are dropped when fields are deleted or unmarked
- [ ] `reconcileCustomFieldIndexes()` corrects index drift
- [ ] `CREATE INDEX CONCURRENTLY` is used to avoid table locks
- [ ] SQL injection is prevented (field names validated, queries parameterized)
- [ ] The search API route validates conditions against existing field definitions
- [ ] Tenant isolation: queries cannot leak data across tenants
- [ ] `npm run typecheck` passes with zero errors
