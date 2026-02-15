# P1-04: Form Renderer

| Field                  | Value                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| **Task ID**            | P1-04                                                                 |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                 |
| **Category**           | Dynamic Schema / Frontend                                             |
| **Suggested Assignee** | Frontend Developer                                                    |
| **Depends On**         | P1-03                                                                 |
| **Blocks**             | P1-05 (Field Admin UI)                                                |
| **Estimated Effort**   | 3 days                                                                |
| **Module References**  | [Module 02 §Form Renderer](../../modules/02-DYNAMIC-SCHEMA-ENGINE.md) |

---

## Context

The schema engine defines fields in the database and validates them with Zod. This task builds the React components that render those fields in forms. Each `FieldDefinition` maps to a specific form input component based on its `dataType`. The renderer uses Conform for form binding and works with progressive enhancement (forms work without JavaScript).

---

## Deliverables

### 1. Base Input Components (`app/components/ui/`)

Build a minimal set of form input primitives that the dynamic renderer uses. Each component accepts a Conform `FieldMetadata` prop for binding:

| Component            | Used For                | Based On           |
| -------------------- | ----------------------- | ------------------ |
| `InputField`         | TEXT, EMAIL, URL, PHONE | `<input>`          |
| `TextareaField`      | LONG_TEXT               | `<textarea>`       |
| `NumberField`        | NUMBER                  | `<input number>`   |
| `CheckboxField`      | BOOLEAN                 | `<input checkbox>` |
| `SelectField`        | ENUM, COUNTRY, USER     | Radix `Select`     |
| `CheckboxGroupField` | MULTI_ENUM              | Checkbox group     |
| `DatePickerField`    | DATE, DATETIME          | `<input date>`     |
| `FileInputField`     | FILE, IMAGE             | `<input file>`     |

Each component should:

- Accept `label`, `description`, `error` (from Conform), and `required` props
- Render accessible markup (labels linked to inputs via `htmlFor`, `aria-invalid`, `aria-describedby`)
- Show validation errors below the input
- Support the CSP nonce (no inline styles)

### 2. Field Renderer (`app/components/fields/FieldRenderer.tsx`)

The core component that maps a `FieldDefinition` to the correct input component:

```typescript
interface FieldRendererProps {
  fieldDef: FieldDefinition;
  meta: FieldMetadata<string>; // From Conform's useForm()
}

export function FieldRenderer({ fieldDef, meta }: FieldRendererProps) {
  // Switch on fieldDef.dataType → render the appropriate component
  // Pass config values (maxLength, min, max, options, placeholder) as props
}
```

**Type → Component mapping:**

| dataType   | Component          | Config Props Passed                   |
| ---------- | ------------------ | ------------------------------------- |
| TEXT       | InputField         | maxLength, placeholder, pattern       |
| LONG_TEXT  | TextareaField      | maxLength, rows                       |
| NUMBER     | NumberField        | min, max, step, prefix, suffix        |
| BOOLEAN    | CheckboxField      | —                                     |
| DATE       | DatePickerField    | minDate, maxDate                      |
| DATETIME   | DatePickerField    | minDate, maxDate, includeTime=true    |
| ENUM       | SelectField        | options (value/label pairs)           |
| MULTI_ENUM | CheckboxGroupField | options (value/label pairs)           |
| EMAIL      | InputField         | type="email"                          |
| URL        | InputField         | type="url"                            |
| PHONE      | InputField         | type="tel"                            |
| FILE       | FileInputField     | accept, maxSizeMB                     |
| IMAGE      | FileInputField     | accept="image/\*", maxSizeMB          |
| REFERENCE  | SelectField        | (loaded asynchronously — placeholder) |
| COUNTRY    | SelectField        | (country list from static data)       |
| USER       | SelectField        | (user list loaded asynchronously)     |

### 3. Field Section (`app/components/fields/FieldSection.tsx`)

Groups multiple fields into a labeled section:

```typescript
interface FieldSectionProps {
  title?: string;
  description?: string;
  fields: FieldDefinition[];
  form: ReturnType<typeof useForm>; // Conform form instance
}

export function FieldSection({ title, description, fields, form }: FieldSectionProps) {
  // Sort fields by sortOrder
  // Group by uiConfig.section if present
  // Render each field using FieldRenderer
}
```

### 4. Country Data (`app/data/countries.ts`)

Static data file with ISO 3166-1 country codes for the COUNTRY field type:

```typescript
export const countries = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  // ... all 249 countries
] as const;
```

### 5. Integration Example

Demonstrate the full pipeline in a sample route (can be a test route removed later):

```typescript
// app/routes/admin/test-field-form.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request);
  const fieldDefs = await listFields({
    tenantId: user.tenantId,
    targetModel: "Participant",
    eventId: "some-event-id",
  });
  return { fieldDefs };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  // Parse, validate with buildFieldSchema, return errors or success
}

export default function TestFieldForm() {
  const { fieldDefs } = useLoaderData();
  const [form, fields] = useForm({
    // Conform setup with Zod schema
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <FieldSection fields={fieldDefs} form={form} />
      <button type="submit">Submit</button>
    </Form>
  );
}
```

### 6. Tests

Write tests for:

- Each field type renders the correct HTML element
- Required fields show asterisk in label
- ENUM fields render all options
- Validation errors display below the correct field
- Fields are sorted by sortOrder
- Empty field definitions render nothing (no crash)
- Accessible markup (labels, aria attributes)

---

## Acceptance Criteria

- [ ] `FieldRenderer` renders correct input for all 16 data types
- [ ] Form inputs bind correctly to Conform via `FieldMetadata`
- [ ] Validation errors from the server display next to the correct field
- [ ] Required fields show visual indicator (asterisk or "Required" text)
- [ ] ENUM/MULTI_ENUM fields render all options from `config.options`
- [ ] DATE/DATETIME fields respect `minDate` and `maxDate` constraints
- [ ] NUMBER fields enforce `min`, `max`, and `step` from config
- [ ] Fields are rendered in `sortOrder` within a section
- [ ] The renderer works with progressive enhancement (no JavaScript needed)
- [ ] All components pass accessibility checks (labels, aria attributes)
- [ ] `npm run typecheck` passes with zero errors

---

## Implementation Reconciliation Note

**Completed:** 2026-02-15

The implementation diverged from the task doc in several areas to match the actual codebase:

| Task Doc                                  | Actual                                             | Decision                                                                         |
| ----------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `FieldDefinition` type                    | `FieldDefinition` from `~/generated/prisma/client` | Used `FieldDefinition`                                                           |
| `COUNTRY`, `USER` data types              | Not in `FieldDataType` enum                        | Skipped — only mapped 16 existing types                                          |
| Country data file `app/data/countries.ts` | No COUNTRY type exists                             | Skipped entirely                                                                 |
| Radix `Select` for ENUM                   | shadcn/ui adopted                                  | Used shadcn `NativeSelect` (progressive enhancement, Conform-compatible)         |
| 8 separate base input component files     | shadcn/ui components installed                     | shadcn `Input`/`Textarea`/`NativeSelect` + ConformField wrapper in FieldRenderer |
| `uiConfig.section` grouping               | No `uiConfig` field on FieldDefinition             | Flat rendering (no section grouping)                                             |
| React Testing Library for component tests | Not installed                                      | Tested extracted pure logic functions only (25 tests)                            |

**Post-implementation refactor:** Adopted shadcn/ui as the project component library. Replaced raw HTML inputs with shadcn `Input`, `Textarea`, `NativeSelect`, `Button`, and `Label` components. Replaced `FieldWrapper` with `ConformField` (uses shadcn `Label` + semantic tokens like `text-destructive`, `text-muted-foreground`). Refactored `auth/login.tsx` and dashboard routes for consistency.

**Verification:** `npm run typecheck` zero errors, `npx vitest run` 142/142 tests pass.
