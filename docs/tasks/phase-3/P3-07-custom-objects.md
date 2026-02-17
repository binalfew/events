# P3-07: Custom Objects

| Field                  | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| **Task ID**            | P3-07                                                  |
| **Phase**              | 3 — Advanced Features                                  |
| **Category**           | Feature                                                |
| **Suggested Assignee** | Full-Stack Engineer                                    |
| **Depends On**         | P3-00                                                  |
| **Blocks**             | None                                                   |
| **Estimated Effort**   | 5 days                                                 |
| **Module References**  | [Module 01](../../modules/01-DATA-MODEL-FOUNDATION.md) |

---

## Context

Tenants need to track domain-specific entities beyond participants — vehicles, equipment, press credentials, hotel rooms, etc. Rather than adding Prisma models for each, `CustomObjectDefinition` lets tenants define their own entity types with dynamic JSONB fields, reusing the same `FieldDefinition` pattern and field types used for participant extras.

---

## Deliverables

### 1. Custom Objects Service

Create `app/services/custom-objects.server.ts`:

**Definition management:**

```typescript
// Create a custom object definition
createDefinition(tenantId: string, data: CreateDefinitionInput): Promise<CustomObjectDefinition>

// Update definition (name, fields, icon)
updateDefinition(definitionId: string, data: UpdateDefinitionInput): Promise<CustomObjectDefinition>

// Deactivate definition (soft delete — preserve records)
deactivateDefinition(definitionId: string): Promise<void>

// List active definitions for a tenant
listDefinitions(tenantId: string): Promise<CustomObjectDefinition[]>

// Get definition with record count
getDefinition(definitionId: string): Promise<CustomObjectDefinition & { _count: { records: number } }>
```

**Record management:**

```typescript
// Create a record for a custom object
createRecord(definitionId: string, tenantId: string, data: Record<string, unknown>, createdBy: string): Promise<CustomObjectRecord>

// Update record data
updateRecord(recordId: string, data: Record<string, unknown>): Promise<CustomObjectRecord>

// Delete record
deleteRecord(recordId: string): Promise<void>

// List records with filtering, sorting, pagination
listRecords(definitionId: string, tenantId: string, options: ListOptions): Promise<{ records: CustomObjectRecord[]; total: number }>

// Get single record
getRecord(recordId: string): Promise<CustomObjectRecord>
```

**Input types:**

```typescript
interface CreateDefinitionInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string; // lucide icon name
  fields: CustomFieldDef[];
}

interface CustomFieldDef {
  name: string;
  label: string;
  dataType: FieldDataType;
  isRequired: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
}
```

### 2. Validation

Reuse the dynamic Zod schema generation from `app/lib/fields.server.ts`:

- Given a `CustomObjectDefinition.fields` array, generate a Zod schema
- Validate record data on create and update
- Return field-level errors using the same format as participant validation

### 3. Admin Routes — Definitions

Create `app/routes/admin/custom-objects/` routes:

- **`index.tsx`** — List of custom object definitions:
  - Card grid showing name, icon, record count, field count
  - Create new definition button
  - Click card → manage records
- **`new.tsx`** — Create definition:
  - Name, slug (auto-generated from name), description, icon picker
  - Field builder: reuse field type UI from field definitions
  - Add/remove/reorder fields
- **`$definitionId.tsx`** — Edit definition + manage records:
  - Tab 1: Definition settings (name, fields, icon)
  - Tab 2: Records table with CRUD

### 4. Admin Routes — Records

- **`$definitionId/records/index.tsx`** — Records list:
  - Table with columns derived from definition fields
  - Search, filter, sort
  - Pagination
  - Add record button
- **`$definitionId/records/new.tsx`** — Create record:
  - Dynamic form generated from definition fields
  - Validation using generated Zod schema
- **`$definitionId/records/$recordId.tsx`** — Edit record:
  - Pre-filled form with current data
  - Delete button with confirmation

### 5. Slug Generation

Auto-generate slug from name:

- Lowercase, replace spaces with hyphens, remove special characters
- Validate uniqueness within tenant
- Allow manual override

### 6. Feature Flag Gate

All custom objects features gated behind `FF_CUSTOM_OBJECTS`:

- Custom objects section hidden in sidebar when disabled
- API endpoints return 403 when disabled

---

## Acceptance Criteria

- [ ] Tenants can create custom object definitions with dynamic fields
- [ ] Fields support all `FieldDataType` values used by participant fields
- [ ] Records validated against definition fields using dynamic Zod schemas
- [ ] Records table renders columns from definition fields
- [ ] CRUD operations work for both definitions and records
- [ ] Slug auto-generated from name, unique per tenant
- [ ] Deactivating a definition preserves existing records
- [ ] Feature flag `FF_CUSTOM_OBJECTS` gates the feature
- [ ] Unit tests for definition CRUD and record validation (≥6 test cases)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
