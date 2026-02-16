# P2-08: Skeleton Loading States

| Field                  | Value                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Task ID**            | P2-08                                                                              |
| **Phase**              | 2 — Visual Form Designer + UX                                                      |
| **Category**           | UX                                                                                 |
| **Suggested Assignee** | Frontend Developer                                                                 |
| **Depends On**         | None (independent)                                                                 |
| **Blocks**             | —                                                                                  |
| **Estimated Effort**   | 2 days                                                                             |
| **Module References**  | [Module 08 §Loading States](../../modules/08-UI-UX-AND-FRONTEND.md#loading-states) |

---

## Context

Data-heavy pages (field list, event list, form designer) currently show nothing while loading. Skeleton loading states give users immediate visual feedback and reduce perceived wait times.

---

## Deliverables

### 1. Skeleton Components

Create `app/components/ui/skeleton.tsx` (shadcn pattern):

- `Skeleton` — base component with shimmer animation
- Composable: `<Skeleton className="h-4 w-[250px]" />`

### 2. Page-Level Skeletons

Create skeleton variants for existing pages:

- **Table skeleton:** Matches column layout of field list / event list
- **Card skeleton:** Matches card layouts
- **Form skeleton:** Matches form field layouts
- **Designer skeleton:** Three-panel placeholder

### 3. StatusButton Component

Create `app/components/ui/status-button.tsx`:

- Extends Button with loading/success/error states
- Loading: spinner icon + disabled
- Success: check icon + green flash (auto-resets after 2s)
- Error: x icon + red flash (auto-resets after 3s)
- Used for form submissions, save actions

### 4. Empty States

Create `app/components/ui/empty-state.tsx`:

- Icon + title + description + optional action button
- Used when lists/tables have zero results
- Contextual messages: "No fields defined yet", "No events found", etc.

### 5. Integration

Add loading states to existing pages:

- Event list page
- Field list page
- Field edit/new pages (form loading)
- Admin dashboard

---

## Acceptance Criteria

- [ ] Skeleton components match final layout dimensions
- [ ] Shimmer animation smooth and not jarring
- [ ] StatusButton shows correct states with transitions
- [ ] Empty states render with helpful prompts and actions
- [ ] Loading states appear on all data-heavy pages
- [ ] No layout shift when content replaces skeletons
