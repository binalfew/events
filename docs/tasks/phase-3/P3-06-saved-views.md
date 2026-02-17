# P3-06: Saved Views (Airtable-style)

| Field                  | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Task ID**            | P3-06                                               |
| **Phase**              | 3 — Advanced Features                               |
| **Category**           | UX                                                  |
| **Suggested Assignee** | Senior Frontend Engineer                            |
| **Depends On**         | P3-00                                               |
| **Blocks**             | None                                                |
| **Estimated Effort**   | 6 days                                              |
| **Module References**  | [Module 08](../../modules/08-UI-UX-AND-FRONTEND.md) |

---

## Context

List pages (participants, events, workflows) currently show a single table view with no saved configurations. Power users need to save different views of their data — specific column selections, filters, sort orders — and switch between them quickly. Kanban boards provide a visual alternative for status-based workflows.

---

## Deliverables

### 1. Saved Views Service

Create `app/services/saved-views.server.ts`:

```typescript
// Create a new saved view
createView(data: CreateViewInput): Promise<SavedView>

// Update an existing view
updateView(viewId: string, data: UpdateViewInput): Promise<SavedView>

// Delete a view
deleteView(viewId: string): Promise<void>

// List views for an entity type (personal + shared)
listViews(tenantId: string, userId: string, entityType: string): Promise<SavedView[]>

// Get a single view
getView(viewId: string): Promise<SavedView>

// Set default view for user + entity type
setDefaultView(tenantId: string, userId: string, entityType: string, viewId: string): Promise<void>

// Duplicate a view (useful for "save as")
duplicateView(viewId: string, newName: string, userId: string): Promise<SavedView>
```

**Input types:**

```typescript
interface CreateViewInput {
  tenantId: string;
  userId: string;
  name: string;
  entityType: string; // "participant", "event", "workflow", etc.
  viewType: ViewType; // TABLE, KANBAN, CALENDAR, GALLERY
  filters: FilterConfig[];
  sorts: SortConfig[];
  columns: ColumnConfig[];
  config?: Record<string, unknown>;
  isShared: boolean;
}

interface FilterConfig {
  field: string;
  operator: string;
  value: unknown;
}

interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

interface ColumnConfig {
  field: string;
  label: string;
  width?: number;
  visible: boolean;
}
```

### 2. View Switcher Component

Create `app/components/views/view-switcher.tsx`:

- Horizontal tab bar showing saved views as tabs
- Active view highlighted
- "+" button to create new view
- Right-click / overflow menu per view: rename, duplicate, share, set as default, delete
- Personal views show user icon, shared views show globe icon
- View type icon (table, kanban, calendar, gallery) beside name

### 3. Table View

Enhance existing table components to support saved configuration:

- Persisted column selection (show/hide via column picker)
- Persisted column order (drag to reorder headers)
- Persisted sort (click column header to toggle)
- Persisted filters (filter bar above table)
- When a saved view is active, changes auto-save (debounced 2s) or prompt to save

### 4. Kanban View

Create `app/components/views/kanban-view.tsx`:

- Cards arranged in columns grouped by a status field
- Configurable group-by field (default: `status`)
- Card shows: name, key fields, status badge, assignee avatar
- Drag-and-drop cards between columns to change status (uses @dnd-kit)
- Column headers show count
- Card click navigates to detail page

### 5. View Application

When a view is loaded, apply its configuration to the data query:

- Filters → translate to Prisma `where` clauses
- Sorts → translate to Prisma `orderBy`
- Columns → control which fields are selected/displayed
- Entity-specific adapters for Participant, Event, Workflow

### 6. Feature Flag Gate

All saved views features gated behind `FF_SAVED_VIEWS`:

- View switcher hidden when disabled
- Default table view shown (no persistence)
- API endpoints return 403 when disabled

---

## Acceptance Criteria

- [ ] Users can create, rename, duplicate, and delete saved views
- [ ] View switcher shows personal + shared views as tabs
- [ ] Table view persists columns, sorts, and filters per saved view
- [ ] Kanban view groups items by configurable status field
- [ ] Kanban drag-and-drop updates status
- [ ] Shared views visible to all tenant users
- [ ] Personal views visible only to the owner
- [ ] Default view loads automatically on page visit
- [ ] Feature flag `FF_SAVED_VIEWS` gates the feature
- [ ] Unit tests for view service CRUD (≥5 test cases)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
