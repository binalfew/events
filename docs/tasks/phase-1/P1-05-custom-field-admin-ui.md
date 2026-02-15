# P1-05: Field Admin UI

| Field                  | Value                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| **Task ID**            | P1-05                                                            |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                            |
| **Category**           | Dynamic Schema / Frontend                                        |
| **Suggested Assignee** | Frontend Developer                                               |
| **Depends On**         | P1-01 (Auth), P1-04 (Renderer)                                   |
| **Blocks**             | None                                                             |
| **Estimated Effort**   | 4 days                                                           |
| **Module References**  | [Module 02 §Admin UI](../../modules/02-DYNAMIC-SCHEMA-ENGINE.md) |

---

## Context

Tenant admins need a self-service interface to define, edit, reorder, and delete fields for their events. This is the UI counterpart to the CRUD API (P1-02). The admin can configure what fields each event collects without developer involvement — the core "configuration over code" principle.

---

## Deliverables

### 1. Fields List Page (`app/routes/admin/events/$eventId/fields/index.tsx`)

A table/list view showing all fields for an event:

**Columns:**
| Column | Source | Notes |
| ------------ | ------------------ | --------------------------- |
| Drag handle | — | For reordering via drag |
| Label | `field.label` | Primary display |
| Name | `field.name` | Code/storage key (muted) |
| Type | `field.dataType` | Badge with type icon |
| Required | `field.isRequired` | Checkmark or dash |
| Searchable | `field.isSearchable`| Checkmark or dash |
| Scope | Computed | "All Types" or type name |
| Actions | — | Edit, Delete buttons |

**Features:**

- Filter by participant type (dropdown)
- Filter by data type (dropdown)
- Drag-and-drop reordering (submit reorder on drop)
- "Add Field" button → opens create dialog/page
- Bulk delete (checkbox selection + "Delete Selected" button)
- Empty state with helpful onboarding message

### 2. Create/Edit Field Form (`app/components/fields/FieldForm.tsx`)

A form (modal dialog or full page) for creating/editing a field definition:

**Sections:**

**Basic Info:**

- Label (text input, required)
- Name (auto-generated from label on create, editable, snake_case validated)
- Description (optional textarea)
- Target scope: Event-wide or specific Participant Type (dropdown)

**Field Type:**

- Data type dropdown with icons (Text, Number, Date, Dropdown, etc.)
- On change → show type-specific configuration panel

**Type-Specific Config:**
| Type | Config Fields Shown |
| ---------- | ------------------------------------------------------- |
| TEXT | Max length, Min length, Regex pattern, Pattern message |
| LONG_TEXT | Max length, Rows (display height) |
| NUMBER | Min value, Max value, Decimal places, Step |
| DATE | Min date, Max date |
| DATETIME | Min date, Max date, Timezone |
| ENUM | Options list (add/remove/reorder value+label+color) |
| MULTI_ENUM | Same as ENUM |
| FILE | Allowed MIME types (checkboxes), Max size (MB) |
| IMAGE | Allowed types, Max size, Max dimensions |
| BOOLEAN | (No additional config) |
| EMAIL/URL/PHONE | (No additional config) |
| COUNTRY | (No additional config — uses built-in country list) |

**Constraints:**

- Required (toggle)
- Unique (toggle)
- Searchable (toggle — enables expression index)
- Filterable (toggle — enables expression index)
- Default value (input, type-appropriate)

**Validation Rules:**

- List of custom rules (add/remove)
- Each rule: Type dropdown (regex, custom) + Value + Error message

**UI Hints:**

- Widget override (optional — auto-detected from type)
- Placeholder text
- Section name (for grouping in forms)
- Column span (1-12 for grid layout)

### 3. Enum Options Editor (`app/components/fields/EnumOptionsEditor.tsx`)

A sub-component for managing ENUM/MULTI_ENUM options:

- Add option (value + label + optional color)
- Remove option
- Reorder options (drag-and-drop or up/down arrows)
- Auto-generate value from label (kebab-case)
- Color picker for category-style enums

### 4. Field Preview (`app/components/fields/FieldPreview.tsx`)

Live preview of the field as it will appear in a form:

- Renders using `FieldRenderer` from P1-04
- Updates in real-time as the admin edits config
- Shows placeholder, label, description, required indicator

### 5. Delete Confirmation Dialog

When deleting a field:

1. Check if any participant records have data for this field
2. If yes: show warning with count ("42 participants have data for this field. Deleting will remove their data.")
3. Require typing the field name to confirm (for fields with existing data)
4. If no data: simple "Are you sure?" confirmation

### 6. Routes

| Route                                       | Purpose                   |
| ------------------------------------------- | ------------------------- |
| `admin/events/$eventId/fields/index.tsx`    | List all fields for event |
| `admin/events/$eventId/fields/new.tsx`      | Create new field          |
| `admin/events/$eventId/fields/$fieldId.tsx` | Edit existing field       |

### 7. Tests

Write tests for:

- List page renders all fields with correct columns
- Create form validates required fields
- Name auto-generation from label (snake_case)
- Type-specific config panels show/hide based on data type
- ENUM options can be added, removed, reordered
- Delete confirmation shows data count warning
- Reorder persists to server
- Auth guard: non-admin users cannot access

---

## Acceptance Criteria

- [ ] Admin can view all fields for an event in a sortable table
- [ ] Admin can create a new field with all supported data types
- [ ] Field name auto-generates from label in snake_case
- [ ] Type-specific config panel changes when data type is selected
- [ ] ENUM options can be added, removed, and reordered
- [ ] Live preview shows the field as it will render in a form
- [ ] Admin can edit an existing field (label, config, constraints)
- [ ] Delete shows data impact warning when participants have data
- [ ] Drag-and-drop reordering persists the new sort order
- [ ] Non-admin users are blocked from accessing these pages (403)
- [ ] All interactions work with progressive enhancement
- [ ] `npm run typecheck` passes with zero errors
