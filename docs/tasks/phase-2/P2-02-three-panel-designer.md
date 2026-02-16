# P2-02: Three-Panel Designer UI

| Field                  | Value                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Task ID**            | P2-02                                                                          |
| **Phase**              | 2 — Visual Form Designer + UX                                                  |
| **Category**           | Form Designer                                                                  |
| **Suggested Assignee** | Senior Frontend Developer                                                      |
| **Depends On**         | P2-01 (FormTemplate Model)                                                     |
| **Blocks**             | P2-03 (Sections & Pages), P2-04 (DnD Kit)                                      |
| **Estimated Effort**   | 8 days                                                                         |
| **Module References**  | [Module 03 §Designer UI](../../modules/03-VISUAL-FORM-DESIGNER.md#designer-ui) |

---

## Context

The form designer is the largest UI feature in Phase 2. It provides a visual, three-panel interface for building registration forms without code. This task creates the shell layout and core state management — DnD, sections, and conditions are layered on in subsequent tasks.

---

## Deliverables

### 1. Designer Route

Create `/admin/events/:eventId/forms/:formId` route:

- Load FormTemplate from database
- Initialize designer state from `definition` JSONB
- Auto-save on changes (debounced PUT)
- Toolbar: Save, Publish, Preview, Undo, Redo, Settings

### 2. Three-Panel Layout

```
┌──────────┬────────────────────────┬──────────┐
│  Field   │                        │ Property │
│ Palette  │    Design Canvas       │  Panel   │
│  (250px) │    (flexible)          │  (320px) │
│          │                        │          │
│ • Text   │  ┌──────────────────┐  │ General  │
│ • Select │  │ Section 1        │  │ ──────── │
│ • Date   │  │  [field] [field] │  │ Label    │
│ • File   │  │  [field]         │  │ Required │
│ • ...    │  └──────────────────┘  │ Unique   │
│          │                        │ ...      │
└──────────┴────────────────────────┴──────────┘
```

- **Left Panel (Field Palette):** List of available FieldDefinitions from the event, grouped by data type. Searchable. Each item is draggable.
- **Center Panel (Design Canvas):** Renders the form definition as sections with field cards. Page tabs at the top. Empty state with "drag fields here" prompt.
- **Right Panel (Properties):** Shows properties for the selected field/section/page. Tabs: General, Validation, Visibility, Layout.

### 3. Designer State Management

Create `app/lib/form-designer-state.ts`:

- `useFormDesigner(initialDefinition)` — React hook managing form definition state
- Undo/redo stack (max 50 entries)
- Actions: `addField`, `removeField`, `moveField`, `updateField`, `addSection`, `removeSection`, `addPage`, `removePage`, `reorderPages`
- `isDirty` flag for unsaved changes warning
- Auto-save with debounced API call

### 4. Form List Page

Create `/admin/events/:eventId/forms` route:

- Table of form templates with columns: Name, Status (Draft/Published), Version, Last Modified, Actions
- Create new form button
- Clone, edit, delete actions per row
- Filter by status (Draft, Published, All)

### 5. Toolbar Component

- Save button (with dirty indicator)
- Publish button (creates version snapshot)
- Preview toggle (editor / split / preview)
- Undo / Redo buttons with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- Settings dropdown (form-level settings)

### 6. Navigation Updates

Add "Forms" as a child item under "Events" in the sidebar navigation config:

```typescript
{ title: "Forms", url: "/admin/events/forms" }
```

---

## Acceptance Criteria

- [ ] Three-panel layout renders with correct proportions
- [ ] Field palette shows event's FieldDefinitions grouped by type
- [ ] Clicking a field in canvas selects it and shows properties panel
- [ ] Undo/redo works for all state mutations
- [ ] Auto-save debounces and PUTs to API
- [ ] Toolbar buttons functional (save, publish, view modes)
- [ ] Form list page with CRUD operations
- [ ] Unsaved changes warning on navigation away
- [ ] Responsive: panels stack vertically on narrow screens
- [ ] Feature flag `FF_VISUAL_FORM_DESIGNER` gates access
