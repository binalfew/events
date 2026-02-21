# P6-01 — Tenant Service & Admin Forms

| Field             | Value                       |
| ----------------- | --------------------------- |
| Task ID           | P6-01                       |
| Phase             | 6                           |
| Category          | Backend + UI                |
| Depends On        | P6-00                       |
| Blocks            | P6-05                       |
| Estimated Effort  | M                           |
| Module References | 17 Settings & Configuration |

## Context

With new schema fields, the tenant Zod schemas, service layer, and admin forms need updating to support slug and branding CRUD.

## Deliverables

1. **Zod schemas** — Add `slug` (required, regex-validated) + branding color fields to create/update schemas
2. **Tenant service** — Add `getTenantBySlug(slug)` function; update create/update to handle new fields
3. **Admin forms** — Add slug + color picker inputs to `new.tsx` and `$tenantId/edit.tsx`
4. **Reserved slug validation** — Block `admin`, `auth`, `api`, `kiosk`, `delegation`, `resources`, `up`

## Acceptance Criteria

- [ ] Creating a tenant requires a unique slug
- [ ] Reserved slugs are rejected at schema level
- [ ] Edit form shows and saves branding colors
- [ ] `npm run typecheck` passes
