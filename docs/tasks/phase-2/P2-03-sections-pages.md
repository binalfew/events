# P2-03: Sections & Pages

| Field                  | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| **Task ID**            | P2-03                                                                      |
| **Phase**              | 2 — Visual Form Designer + UX                                              |
| **Category**           | Form Designer                                                              |
| **Suggested Assignee** | Senior Frontend Developer                                                  |
| **Depends On**         | P2-02 (Three-Panel Designer UI)                                            |
| **Blocks**             | P2-05 (Conditional Visibility), P2-06 (Preview), P2-07 (Section Templates) |
| **Estimated Effort**   | 5 days                                                                     |
| **Module References**  | [Module 03 §Sections](../../modules/03-VISUAL-FORM-DESIGNER.md#sections)   |

---

## Context

Registration forms for large events often need multiple pages (wizard steps) with organized sections. This task adds the multi-page and section structure to the form designer canvas.

---

## Deliverables

### 1. Page Management

- Page tab bar above the canvas with drag-to-reorder
- Add/rename/delete page via context menu or buttons
- Page navigation: click tab to switch, drag tab to reorder
- Page-level properties in right panel (title, description)
- First page created automatically for new forms

### 2. Section Management

- Add section button within each page
- Section header with title (optional), column count selector (1–4 columns)
- Collapsible sections with `defaultCollapsed` toggle
- Delete section (with confirmation if fields present)
- Reorder sections within a page via drag handle

### 3. Field Placement in Grid

- 12-column CSS grid within each section
- Fields occupy `colSpan` columns (default: full width of section column count)
- Visual column guidelines on canvas
- Resize field width by dragging column handles

### 4. Canvas Rendering

Update the design canvas to render:

```
Page 1 | Page 2 | Page 3 | +
─────────────────────────────
┌─ Section: Personal Info (2 cols) ─────┐
│ [First Name    ] [Last Name     ]     │
│ [Email                          ]     │
└───────────────────────────────────────┘
┌─ Section: Documents (1 col) ──────────┐
│ [Passport Upload                ]     │
│ [Photo Upload                   ]     │
└───────────────────────────────────────┘
```

### 5. State Actions

Add to `useFormDesigner`:

- `addPage(title?)` — append new page
- `removePage(pageId)` — remove page and its sections
- `reorderPages(fromIndex, toIndex)` — reorder pages
- `updatePage(pageId, updates)` — update page title/description
- `addSection(pageId, config?)` — add section to page
- `removeSection(pageId, sectionId)` — remove section
- `updateSection(pageId, sectionId, updates)` — update section properties
- `reorderSections(pageId, fromIndex, toIndex)` — reorder sections

---

## Acceptance Criteria

- [ ] Pages render as wizard tabs with add/rename/delete
- [ ] Drag-to-reorder pages works
- [ ] Sections render with configurable column count (1–4)
- [ ] Collapsible sections collapse/expand on click in both designer and preview
- [ ] Fields placed in correct grid positions
- [ ] Empty sections show "drag fields here" placeholder
- [ ] All state mutations integrate with undo/redo
- [ ] Definition JSONB correctly serialized on save
