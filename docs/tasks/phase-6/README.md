# Phase 6 — Path-Based Multi-Tenant Routing with Per-Tenant Branding

## Phase Goal

Introduce tenant-scoped URL paths (`/<slug>/*`) so each tenant gets its own namespace with branding (logo, colors), while `/admin/*` remains the super-admin area.

| URL Pattern        | Audience                    |
| ------------------ | --------------------------- |
| `/admin/*`         | Super admins (GLOBAL scope) |
| `/<tenant-slug>/*` | Tenant users                |
| `/auth/*`          | Authentication (unchanged)  |

## Prerequisites

- Phases 0–5 complete
- PostgreSQL 16 + Prisma 7 running
- Seed data includes at least two tenants

## Quality Gate

- [ ] `npx prisma migrate dev` — clean migration
- [ ] `npm run typecheck` — zero errors
- [ ] `npm run test` — existing tests pass
- [ ] Login as tenant user redirects to `/<slug>`
- [ ] `/<slug>/events` renders events with tenant branding
- [ ] `/admin/tenants/:id/edit` allows setting slug + branding
- [ ] `/nonexistent-slug` returns 404

## Task List

| ID    | Title                             | Category       | Depends On   | Est. |
| ----- | --------------------------------- | -------------- | ------------ | ---- |
| P6-00 | Schema & Migration                | Data           | —            | S    |
| P6-01 | Tenant Service & Admin Forms      | Backend + UI   | P6-00        | M    |
| P6-02 | Tenant Resolution & useBasePrefix | Backend + Hook | P6-00        | M    |
| P6-03 | Shared DashboardLayout            | UI Refactor    | P6-02        | M    |
| P6-04 | Tenant Layout & Routes            | Routing        | P6-02, P6-03 | L    |
| P6-05 | Login Redirect & Branding CSS     | Auth + Theming | P6-01, P6-04 | M    |

## Dependency Graph

```
P6-00  ──→  P6-01 ─────────────────→ P6-05
  │                                     ↑
  └──→  P6-02 ──→ P6-03 ──→ P6-04 ───┘
```

## Module References

- **00** Architecture Overview
- **05** Security & Access Control
- **08** UI/UX & Frontend
- **17** Settings & Configuration
