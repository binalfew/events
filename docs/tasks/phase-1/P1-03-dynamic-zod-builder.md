# P1-03: Dynamic Zod Schema Builder

| Field                  | Value                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| **Task ID**            | P1-03                                                                       |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                       |
| **Category**           | Dynamic Schema                                                              |
| **Suggested Assignee** | Senior Backend Engineer                                                     |
| **Depends On**         | P1-02                                                                       |
| **Blocks**             | P1-04 (Dynamic Form Renderer)                                               |
| **Estimated Effort**   | 2 days                                                                      |
| **Module References**  | [Module 02 §Validation Pipeline](../../modules/02-DYNAMIC-SCHEMA-ENGINE.md) |

---

## Implementation Reconciliation Note

> **Implemented:** 2026-02-15 | **Tests:** 53 pass | **Files:** `app/lib/dynamic-fields.server.ts`, `app/lib/__tests__/dynamic-fields.server.test.ts`

The following divergences from this task doc were resolved during implementation:

| Task Doc                                  | Actual Codebase                                    | Decision                                                                             |
| ----------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `CustomFieldDef` type                     | `FieldDefinition` from `~/generated/prisma/client` | Used `FieldDefinition`                                                               |
| `import { z } from "zod"`                 | Codebase uses `import { z } from "zod/v4"`         | Used `zod/v4` (Zod v4 classic API)                                                   |
| `COUNTRY` data type                       | Not in `FieldDataType` enum                        | Omitted — only mapped the 16 existing types                                          |
| `USER` data type                          | Not in `FieldDataType` enum                        | Omitted — only mapped the 16 existing types                                          |
| `z.record(z.unknown())`                   | Zod v4 requires explicit key type                  | Used `z.record(z.string(), z.unknown())`                                             |
| `FORMULA` field                           | Computed at read-time                              | Returns `z.any()` — not validated on user input                                      |
| `.optional().nullable()` for non-required | Zod v4 `.optional()` suffices                      | Used `.optional()` only — nullable adds complexity without benefit for JSONB storage |

---

## Context

The dynamic schema engine stores field definitions as database records (CustomFieldDef). At runtime, these definitions must be converted into Zod validation schemas that work with Conform for server-side form validation. This task builds the `buildCustomDataSchema()` utility that bridges the gap between metadata and runtime validation.

This is the critical link in the pipeline:

```
CustomFieldDef (DB) → Zod Schema (runtime) → Conform (form binding) → Server Validation
```

---

## Deliverables

### 1. Zod Schema Builder (`app/lib/dynamic-fields.server.ts`)

```typescript
import { z } from "zod";
import type { CustomFieldDef } from "~/generated/prisma/client";

/**
 * Build a Zod schema from an array of CustomFieldDef records.
 * Each field definition maps to a Zod validator based on its dataType and config.
 */
export function buildCustomDataSchema(
  fieldDefs: CustomFieldDef[],
): z.ZodObject<Record<string, z.ZodTypeAny>>;
```

**Type mapping rules:**

| FieldDataType | Zod Type                                            | Config Applied                                                               |
| ------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| TEXT          | `z.string()`                                        | `.min(config.minLength)`, `.max(config.maxLength)`, `.regex(config.pattern)` |
| LONG_TEXT     | `z.string()`                                        | `.max(config.maxLength)`                                                     |
| NUMBER        | `z.number()`                                        | `.min(config.min)`, `.max(config.max)`                                       |
| BOOLEAN       | `z.boolean()`                                       | —                                                                            |
| DATE          | `z.string().date()`                                 | `.refine()` for min/max date                                                 |
| DATETIME      | `z.string().datetime()`                             | `.refine()` for min/max date                                                 |
| ENUM          | `z.enum(config.options.map(o => o.value))`          | —                                                                            |
| MULTI_ENUM    | `z.array(z.enum(config.options.map(o => o.value)))` | —                                                                            |
| EMAIL         | `z.string().email()`                                | —                                                                            |
| URL           | `z.string().url()`                                  | —                                                                            |
| PHONE         | `z.string().min(7).max(20)`                         | —                                                                            |
| FILE / IMAGE  | `z.string()`                                        | File validation handled separately                                           |
| REFERENCE     | `z.string()`                                        | Reference validation handled separately                                      |
| COUNTRY       | `z.string().length(2)`                              | ISO 3166-1 alpha-2                                                           |
| USER          | `z.string().cuid()`                                 | Valid user ID                                                                |

**Required vs optional:**

- If `field.isRequired === true` → the field is required in the schema
- If `field.isRequired === false` → wrap with `.optional().nullable()`

**Custom validation rules:**
After building the base schema for each field, iterate over `field.validation[]` and apply `.refine()` for each rule:

```typescript
for (const rule of field.validation || []) {
  if (rule.rule === "regex" && typeof rule.value === "string") {
    schema = schema.refine((val) => new RegExp(rule.value as string).test(String(val)), {
      message: rule.message,
    });
  }
  // Add more rule types as needed (min, max, custom, etc.)
}
```

### 2. Form Data Parser (`app/lib/dynamic-fields.server.ts`)

Utility to parse and coerce form data into the correct types before Zod validation:

```typescript
/**
 * Parse raw form data into typed values based on field definitions.
 * HTML forms submit everything as strings — this coerces to the correct types.
 */
export function parseCustomFormData(
  formData: FormData,
  fieldDefs: CustomFieldDef[],
): Record<string, unknown>;
```

**Coercion rules:**

- NUMBER → `Number(value)` (return `undefined` if `NaN`)
- BOOLEAN → `value === "on" || value === "true"`
- MULTI_ENUM → `formData.getAll(field.name)` (multiple values)
- DATE/DATETIME → keep as string (ISO format)
- All others → `String(value)` or `undefined` if empty

### 3. Schema Cache (`app/lib/dynamic-fields.server.ts`)

Cache compiled Zod schemas to avoid rebuilding on every request:

```typescript
const schemaCache = new Map<string, { schema: z.ZodObject<any>; hash: string }>();

/**
 * Get or build a cached Zod schema for a set of field definitions.
 * Cache key is based on tenant + event + participant type.
 */
export function getCachedSchema(
  tenantId: string,
  eventId: string,
  participantTypeId: string | null,
  fieldDefs: CustomFieldDef[],
): z.ZodObject<Record<string, z.ZodTypeAny>>;
```

- Cache invalidates when field definitions change (compare hash of field IDs + updatedAt)
- Maximum cache size: 1000 entries (LRU eviction)

### 4. Conform Integration Helper (`app/lib/dynamic-fields.server.ts`)

Utility to create Conform-compatible form metadata from field definitions:

```typescript
/**
 * Build Conform field metadata for use with useForm().
 * Returns the constraint object that Conform uses for client-side hints.
 */
export function buildConformConstraints(fieldDefs: CustomFieldDef[]): Record<
  string,
  {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  }
>;
```

### 5. Tests

Write comprehensive tests for:

- Schema building for every data type (TEXT, NUMBER, BOOLEAN, DATE, ENUM, etc.)
- Required vs optional field handling
- Custom validation rules (regex, min/max)
- Form data coercion (string → number, string → boolean)
- ENUM validation with invalid values
- MULTI_ENUM parsing from FormData
- Schema cache hit and invalidation
- Edge cases: empty field defs, field with no config, unknown data type
- Error messages are descriptive and include field label

---

## Acceptance Criteria

- [ ] `buildCustomDataSchema([...fieldDefs])` produces a Zod schema that validates custom data
- [ ] All 16 field data types produce correct Zod validators
- [ ] Required fields cause validation errors when missing
- [ ] Optional fields accept `null` and `undefined`
- [ ] Config constraints (maxLength, min, max, pattern) are enforced
- [ ] ENUM fields reject values not in the options list
- [ ] Custom validation rules (regex) produce correct error messages
- [ ] `parseCustomFormData()` correctly coerces form data to typed values
- [ ] Schema cache prevents redundant rebuilds
- [ ] Conform constraint builder produces valid constraint objects
- [ ] All edge cases have test coverage
- [ ] `npm run typecheck` passes with zero errors
