# P6-00 — Schema & Migration

| Field             | Value                    |
| ----------------- | ------------------------ |
| Task ID           | P6-00                    |
| Phase             | 6                        |
| Category          | Data                     |
| Depends On        | —                        |
| Blocks            | P6-01, P6-02             |
| Estimated Effort  | S                        |
| Module References | 01 Data Model Foundation |

## Context

The Tenant model currently has no URL slug or branding fields. We need to add these to support path-based routing (`/<slug>/*`) and per-tenant visual identity.

## Deliverables

1. **Prisma schema update** — Add to `Tenant` model:
   - `slug String @unique` — URL-safe identifier (lowercase, alphanumeric + hyphens)
   - `logoUrl String?` — Tenant logo URL
   - `primaryColor String?` — Primary brand color (hex)
   - `secondaryColor String?` — Secondary brand color (hex)
   - `accentColor String?` — Accent brand color (hex)

2. **Migration** — `npx prisma migrate dev --name add-tenant-slug-branding`

3. **Seed update** — Add slugs and branding colors to seeded tenants

## Acceptance Criteria

- [ ] Migration runs cleanly
- [ ] `slug` column is unique and indexed
- [ ] Seed data includes slugs for both tenants
- [ ] `npm run typecheck` passes
