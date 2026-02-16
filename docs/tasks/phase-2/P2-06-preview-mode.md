# P2-06: Preview Mode

| Field                  | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| **Task ID**            | P2-06                                                                  |
| **Phase**              | 2 — Visual Form Designer + UX                                          |
| **Category**           | Form Designer                                                          |
| **Suggested Assignee** | Senior Frontend Developer                                              |
| **Depends On**         | P2-03 (Sections & Pages)                                               |
| **Blocks**             | —                                                                      |
| **Estimated Effort**   | 4 days                                                                 |
| **Module References**  | [Module 03 §Preview](../../modules/03-VISUAL-FORM-DESIGNER.md#preview) |

---

## Context

The form designer needs a WYSIWYG preview so admins can see exactly what participants will see. The preview reuses the same `FieldRenderer` and `FieldSection` components used in production registration, ensuring pixel-perfect accuracy.

---

## Deliverables

### 1. View Modes

Three view modes toggled via toolbar:

- **Editor:** Full three-panel designer (default)
- **Split:** Left half = canvas, right half = live preview
- **Preview:** Full-screen preview, no designer panels

### 2. Preview Renderer

Create `app/components/form-designer/FormPreview.tsx`:

- Renders the form definition using production `FieldSection` and `FieldRenderer`
- Multi-page forms render as wizard with next/previous navigation
- Conditional visibility evaluated in real time
- Section collapsing works as in production

### 3. Mock Data Generator

Create `app/lib/form-preview-data.ts`:

- `generateMockData(definition)` — generates random values for each field type
- Mock data persists during editing session (stored in state, not regenerated on each render)
- User can edit mock values to test conditional visibility

### 4. Responsive Preview

- Device size toggle: Desktop (100%), Tablet (768px), Phone (375px)
- Preview container constrained to selected width
- Shows responsive behavior of the form layout

### 5. Split View Sync

In split mode, changes in the editor immediately reflect in the preview:

- Field additions/removals update preview
- Property changes (label, required, etc.) update preview
- Section column changes reflow preview
- Page additions/removals update wizard tabs

---

## Acceptance Criteria

- [ ] Preview renders identically to production form
- [ ] Three view modes toggle correctly
- [ ] Split view syncs in real time
- [ ] Mock data generates appropriate values per field type
- [ ] Conditional visibility works in preview with mock data
- [ ] Responsive preview shows correct layouts at each breakpoint
- [ ] Multi-page wizard navigation works in preview
- [ ] Full-screen preview has close/back-to-editor button
