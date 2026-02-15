# P1-02: Field Definition CRUD

| Field                  | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **Task ID**            | P1-02                                                              |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                              |
| **Category**           | Dynamic Schema                                                     |
| **Suggested Assignee** | Senior Backend Engineer                                            |
| **Depends On**         | P1-00                                                              |
| **Blocks**             | P1-03 (Zod Builder)                                                |
| **Estimated Effort**   | 3 days                                                             |
| **Module References**  | [Module 02 §Field CRUD](../../modules/02-DYNAMIC-SCHEMA-ENGINE.md) |

---

## Schema Reconciliation (Implementation vs. Task Doc)

The task doc was written before the Prisma schema was finalized in P1-00. The following divergences were identified and resolved in favor of the actual schema:

| Task Doc                                                       | Actual Schema                                  | Resolution                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model name `FieldDefinition`                                   | `FieldDefinition`                              | Used `FieldDefinition` — matches the Prisma model                                                                                                                                                          |
| Field `targetModel`                                            | `entityType`                                   | Used `entityType` — matches the Prisma column name                                                                                                                                                         |
| Separate `uiConfig` JSON field                                 | Not in schema                                  | Omitted — UI config stored in the existing `config` JSON field if needed                                                                                                                                   |
| `COUNTRY`, `USER` in dataType enum                             | Not in `FieldDataType` enum                    | Used only the 16 values defined in the enum (`TEXT`, `LONG_TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `DATETIME`, `ENUM`, `MULTI_ENUM`, `EMAIL`, `URL`, `PHONE`, `FILE`, `IMAGE`, `REFERENCE`, `FORMULA`, `JSON`) |
| Soft delete implied                                            | No `deletedAt` column on `FieldDefinition`     | Used hard delete                                                                                                                                                                                           |
| `eventId` optional in create schema                            | `eventId` is required (non-nullable) in Prisma | Made `eventId` required in the Zod create schema                                                                                                                                                           |
| `maxLabelLength: 200`                                          | —                                              | Reduced to 128 to match common UI constraints                                                                                                                                                              |
| Structured validation array items (`{ rule, value, message }`) | `validation Json @default("[]")`               | Used flexible `z.array(z.record(z.string(), z.unknown()))` to allow any validation rule shape                                                                                                              |
| Update schema includes `id`                                    | —                                              | Omitted `id` from update schema; ID comes from the URL param                                                                                                                                               |

---

## Context

The FieldDefinition model (created in P1-00) stores metadata about each field. This task builds the server-side API routes for managing those definitions: listing, creating, updating, deleting, and reordering. These routes are consumed by the admin UI (P1-05) and are the foundation for the entire schema pipeline.

---

## Deliverables

### 1. Validation Schemas (`app/lib/schemas/field.ts`)

Zod schemas for validating field definition payloads:

```typescript
import { z } from "zod";

// Field name must be snake_case, start with letter, max 64 chars
const fieldNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/, "Must be snake_case starting with a letter");

export const createFieldSchema = z.object({
  targetModel: z.enum(["Participant", "Event"]).optional(),
  eventId: z.string().cuid().optional(),
  participantTypeId: z.string().cuid().optional(),
  name: fieldNameSchema,
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dataType: z.enum([
    "TEXT",
    "LONG_TEXT",
    "NUMBER",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "ENUM",
    "MULTI_ENUM",
    "EMAIL",
    "URL",
    "PHONE",
    "FILE",
    "IMAGE",
    "REFERENCE",
    "COUNTRY",
    "USER",
  ]),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isSearchable: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
  defaultValue: z.string().optional(),
  config: z.record(z.unknown()).default({}),
  uiConfig: z.record(z.unknown()).default({}),
  validation: z
    .array(
      z.object({
        rule: z.string(),
        value: z.unknown(),
        message: z.string(),
      }),
    )
    .default([]),
});

export const updateFieldSchema = createFieldSchema.partial().extend({
  id: z.string().cuid(),
});

export const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.string().cuid()).min(1),
});
```

### 2. Field Service (`app/services/fields.server.ts`)

Business logic layer that enforces constraints:

```typescript
export async function listFields(params: {
  tenantId: string;
  targetModel?: string;
  eventId?: string;
  participantTypeId?: string;
  dataType?: string;
}): Promise<FieldDefinition[]>;

export async function createField(
  tenantId: string,
  data: CreateFieldInput,
): Promise<FieldDefinition>;
// - Validate field name uniqueness within scope (tenant + target + event + type)
// - Enforce max fields per tenant (configurable limit, default 500)
// - Enforce max fields per event (configurable limit, default 100)
// - Auto-set sortOrder to max + 1 within the scope
// - Log creation to AuditLog

export async function updateField(
  tenantId: string,
  fieldId: string,
  data: UpdateFieldInput,
): Promise<FieldDefinition>;
// - Verify field belongs to tenant
// - Validate name uniqueness if name changed
// - If dataType changed, validate no existing data depends on old type
// - Log changes to AuditLog with before/after diff

export async function deleteField(tenantId: string, fieldId: string): Promise<void>;
// - Verify field belongs to tenant
// - Check if any Participant records have data for this field in extras
// - If data exists: soft-warn (return count) but allow deletion with force flag
// - Remove any expression indexes created for this field
// - Log deletion to AuditLog

export async function reorderFields(tenantId: string, fieldIds: string[]): Promise<void>;
// - Verify all fields belong to tenant
// - Update sortOrder for each field based on position in array
// - Use a transaction for atomicity
```

### 3. API Routes (`app/routes/api/v1/fields/`)

React Router resource routes for CRUD operations:

**Endpoints:**

| Method | Path                                   | Description                 |
| ------ | -------------------------------------- | --------------------------- |
| GET    | `/api/v1/fields?tenantId=&eventId=...` | List fields with filters    |
| POST   | `/api/v1/fields`                       | Create a new field          |
| PUT    | `/api/v1/fields/:id`                   | Update an existing field    |
| DELETE | `/api/v1/fields/:id`                   | Delete a field              |
| POST   | `/api/v1/fields/reorder`               | Reorder fields within scope |

**GET Response (200):**

```json
{
  "data": [
    {
      "id": "cuid_xxx",
      "tenantId": "cuid_tenant",
      "targetModel": "Participant",
      "eventId": "cuid_event",
      "participantTypeId": null,
      "name": "weapon_permit_number",
      "label": "Weapon Permit Number",
      "dataType": "TEXT",
      "sortOrder": 0,
      "isRequired": true,
      "isSearchable": true,
      "isFilterable": false,
      "config": { "maxLength": 20, "pattern": "^WP-\\d+$" },
      "uiConfig": { "widget": "text-input", "placeholder": "WP-0000000" },
      "validation": [{ "rule": "regex", "value": "^WP-\\d{7}$", "message": "Format: WP-0000000" }]
    }
  ],
  "meta": { "total": 1 }
}
```

**Error responses:**

- `400` — Validation error (invalid field name, missing required fields)
- `404` — Field not found
- `409` — Duplicate field name within scope
- `422` — Limit exceeded (max fields per tenant/event)

### 4. Config Constants (`app/config/fields.ts`)

```typescript
export const FIELD_LIMITS = {
  maxPerTenant: 500,
  maxPerEvent: 100,
  maxNameLength: 64,
  maxLabelLength: 200,
  maxValidationRules: 10,
  maxEnumOptions: 100,
};
```

### 5. Tests

Write tests for:

- Creating a field with all data types (TEXT, NUMBER, BOOLEAN, DATE, ENUM, etc.)
- Duplicate name detection within scope
- Field name validation (snake_case enforcement)
- Reordering updates sortOrder correctly
- Deleting a field logs to AuditLog
- Max field limit enforcement (per tenant and per event)
- Tenant isolation (cannot access another tenant's fields)

---

## Acceptance Criteria

- [ ] GET `/api/v1/fields` returns fields filtered by tenantId, eventId, participantTypeId
- [ ] POST `/api/v1/fields` creates a field with all supported data types
- [ ] Duplicate field names within the same scope return 409 Conflict
- [ ] PUT `/api/v1/fields/:id` updates field properties and logs changes
- [ ] DELETE `/api/v1/fields/:id` removes the field and its indexes
- [ ] POST `/api/v1/fields/reorder` updates sortOrder atomically
- [ ] Field name is validated as snake_case starting with a letter
- [ ] Max field limits (500 per tenant, 100 per event) are enforced
- [ ] All operations log to AuditLog with before/after diffs
- [ ] `npm run typecheck` passes with zero errors
- [ ] Unit tests cover all CRUD operations and edge cases
