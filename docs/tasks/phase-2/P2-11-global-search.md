# P2-11: Global Search

| Field                  | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **Task ID**            | P2-11                                                              |
| **Phase**              | 2 — Visual Form Designer + UX                                      |
| **Category**           | UX                                                                 |
| **Suggested Assignee** | Senior Frontend Developer + Backend Developer                      |
| **Depends On**         | None (independent)                                                 |
| **Blocks**             | —                                                                  |
| **Estimated Effort**   | 5 days                                                             |
| **Module References**  | [Module 08 §Search](../../modules/08-UI-UX-AND-FRONTEND.md#search) |

---

## Context

The top navbar has a search placeholder (⌘K). This task wires it to a real cross-entity search with a command palette UI for quick navigation and participant lookup.

---

## Deliverables

### 1. Search API

Create `app/services/search.server.ts`:

- `globalSearch(query, tenantId, options?)` — searches across entities
- Search targets:
  - **Participants:** name, registrationCode, passport number, organization, searchable custom fields
  - **Events:** name, description
  - **Forms:** template name
- Results grouped by entity type
- Limit: 5 results per type, 20 total
- Debounce-friendly: fast response even on partial queries

Create `GET /api/v1/search?q=` route.

### 2. Command Palette Component

Create `app/components/layout/command-palette.tsx`:

- Modal dialog triggered by ⌘K (or Ctrl+K)
- Search input with auto-focus
- Results grouped by type with icons
- Keyboard navigation: ↑↓ to select, Enter to navigate, Esc to close
- Recent searches section (stored in localStorage)
- Quick actions: "Go to Events", "Go to Settings", "Create Event"

### 3. Search Result Actions

Each result type has contextual actions:

- **Participant:** View details, Go to workflow step, Print badge
- **Event:** View event, Manage fields, Manage forms
- **Form:** Open in designer

### 4. Integration

- Replace the search placeholder in `top-navbar.tsx` with functional ⌘K trigger
- Click or keyboard shortcut opens command palette
- Close on outside click, Esc, or navigation

### 5. Custom Field Search

- Leverage the existing JSONB query layer (P1-06) for searching `extras` fields
- Only search fields marked `isSearchable` in FieldDefinition
- Expression indexes ensure performance

---

## Acceptance Criteria

- [ ] ⌘K / Ctrl+K opens command palette
- [ ] Search returns relevant results across entities
- [ ] Results grouped by type with icons
- [ ] Keyboard navigation works (↑↓ Enter Esc)
- [ ] Quick actions navigate correctly
- [ ] Recent searches persisted in localStorage
- [ ] Searchable custom fields included in results
- [ ] Debounced API calls (300ms)
- [ ] Feature flag `FF_GLOBAL_SEARCH` gates the feature
- [ ] Empty state when no results found
