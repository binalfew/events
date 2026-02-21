# P6-04 — Tenant Layout & Routes

| Field             | Value        |
| ----------------- | ------------ |
| Task ID           | P6-04        |
| Phase             | 6            |
| Category          | Routing      |
| Depends On        | P6-02, P6-03 |
| Blocks            | P6-05        |
| Estimated Effort  | L            |
| Module References | 08 UI/UX     |

## Context

Create the `$tenant` dynamic segment routes that mirror critical admin routes but scoped to a specific tenant.

## Deliverables

1. **`app/routes/$tenant/_layout.tsx`** — Tenant layout with slug resolution, auth, branding
2. **Tenant route files** mirroring admin routes:
   - `$tenant/index.tsx` — Dashboard
   - `$tenant/events/index.tsx` — Events list (filtered to tenant)
   - `$tenant/events/$eventId/*.tsx` — Event sub-routes
   - `$tenant/users/index.tsx` — Users
   - `$tenant/roles/index.tsx` — Roles
   - `$tenant/settings/index.tsx` — Settings
3. **Route safety** — Static segments (`admin`, `auth`, `api`) take priority over `$tenant`

## Acceptance Criteria

- [ ] `/<slug>` renders tenant dashboard with branding
- [ ] `/<slug>/events` shows tenant's events
- [ ] `/admin` still works for super admins
- [ ] Invalid slugs return 404
