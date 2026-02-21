# P6-02 — Tenant Resolution & useBasePrefix

| Field             | Value                 |
| ----------------- | --------------------- |
| Task ID           | P6-02                 |
| Phase             | 6                     |
| Category          | Backend + Hook        |
| Depends On        | P6-00                 |
| Blocks            | P6-03, P6-04          |
| Estimated Effort  | M                     |
| Module References | 05 Security, 08 UI/UX |

## Context

Tenant-scoped routes need server-side slug resolution and client-side URL prefix awareness.

## Deliverables

1. **`app/lib/tenant.server.ts`** — `resolveTenant(slug)` returns tenant or throws 404
2. **`app/hooks/use-base-prefix.ts`** — Hook that reads route params to return `/admin` or `/<slug>`
3. **Navigation parameterization** — Update `navigation.ts` to accept a base prefix and generate URLs dynamically

## Acceptance Criteria

- [ ] `resolveTenant("mofa")` returns MOFA tenant
- [ ] `resolveTenant("nonexistent")` throws 404
- [ ] `useBasePrefix()` returns correct prefix in both admin and tenant contexts
- [ ] Navigation URLs adapt to the current prefix
