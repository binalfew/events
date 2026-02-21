# P6-03 — Shared DashboardLayout

| Field             | Value       |
| ----------------- | ----------- |
| Task ID           | P6-03       |
| Phase             | 6           |
| Category          | UI Refactor |
| Depends On        | P6-02       |
| Blocks            | P6-04       |
| Estimated Effort  | M           |
| Module References | 08 UI/UX    |

## Context

The admin layout contains ~140 lines of sidebar/navbar/feature-flag logic. Tenant routes need the same layout. Extract into a shared component to avoid duplication.

## Deliverables

1. **`app/components/layout/dashboard-layout.tsx`** — Shared layout accepting `basePrefix`, `tenant` (optional), and all existing props
2. **Refactor `app/routes/admin/_layout.tsx`** — Use `DashboardLayout` with `basePrefix="/admin"`
3. **AppSidebar + TenantSwitcher updates** — Accept `basePrefix` prop, pass real tenant data

## Acceptance Criteria

- [ ] Admin layout works identically after refactor
- [ ] `DashboardLayout` is reusable for tenant routes
- [ ] No visual regressions in admin area
