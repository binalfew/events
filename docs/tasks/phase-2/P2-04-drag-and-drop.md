# P2-04: Drag-and-Drop (DnD Kit)

| Field                  | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **Task ID**            | P2-04                                                          |
| **Phase**              | 2 — Visual Form Designer + UX                                  |
| **Category**           | Form Designer                                                  |
| **Suggested Assignee** | Senior Frontend Developer                                      |
| **Depends On**         | P2-02 (Three-Panel Designer UI)                                |
| **Blocks**             | —                                                              |
| **Estimated Effort**   | 5 days                                                         |
| **Module References**  | [Module 03 §DnD](../../modules/03-VISUAL-FORM-DESIGNER.md#dnd) |

---

## Context

The form designer relies on drag-and-drop for field placement, reordering, and section management. @dnd-kit is the chosen library — it supports nested sortable contexts, accessibility, and smooth animations.

---

## Deliverables

### 1. DnD Kit Setup

Install and configure `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`:

- Root `DndContext` wrapping the designer
- Collision detection strategy (closest center for fields, between for sections)
- Drag overlay for visual feedback during drag
- Keyboard sensor for accessibility

### 2. Nested Sortable Contexts

Three levels of drag contexts:

- **Palette → Canvas:** Drag field from palette to create a new placement in a section
- **Section fields:** Reorder fields within a section
- **Cross-section:** Drag fields between sections (same page or across pages)
- **Sections:** Reorder sections within a page

### 3. Visual Feedback

- Drag handle on each field card and section header
- Drop placeholder showing insertion point (blue line or highlighted zone)
- Drag overlay matches the dragged item's dimensions
- Smooth spring animations during reorder (`@dnd-kit/sortable` animateLayoutChanges)
- Invalid drop zones grayed out

### 4. Drop Validation

- Prevent dropping a field outside a section
- Prevent creating circular section nesting
- Validate field type compatibility if applicable

### 5. Touch Support

- Touch sensors enabled via `TouchSensor` from @dnd-kit
- Activation constraint: 5px distance to prevent accidental drags
- Long-press to initiate drag on mobile

---

## Acceptance Criteria

- [ ] Fields drag from palette into canvas sections
- [ ] Fields reorder within a section via drag
- [ ] Fields move between sections via drag
- [ ] Sections reorder within a page via drag
- [ ] Drop placeholders visible during drag
- [ ] Drag overlay follows cursor smoothly
- [ ] Keyboard drag works (Tab to focus, Space to pick up, Arrow keys to move)
- [ ] Touch drag works on mobile/tablet
- [ ] All drag operations integrate with undo/redo
- [ ] No jank or layout shifts during animations
