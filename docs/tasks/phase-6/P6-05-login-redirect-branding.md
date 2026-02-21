# P6-05 — Login Redirect & Branding CSS

| Field             | Value                 |
| ----------------- | --------------------- |
| Task ID           | P6-05                 |
| Phase             | 6                     |
| Category          | Auth + Theming        |
| Depends On        | P6-01, P6-04          |
| Blocks            | —                     |
| Estimated Effort  | M                     |
| Module References | 05 Security, 08 UI/UX |

## Context

After login, tenant users should be redirected to `/<slug>` instead of `/admin`. Tenant branding colors should be injected as CSS variables.

## Deliverables

1. **Login redirect** — After successful auth, if user has a tenant with a slug, redirect to `/<slug>` instead of `/admin`
2. **CSS variable injection** — In tenant layout, inject `--tenant-primary`, `--tenant-secondary`, `--tenant-accent` via `<style nonce={nonce}>` tag
3. **TenantSwitcher** — Show real tenant data, link to tenant URL

## Acceptance Criteria

- [ ] Login as tenant user → redirect to `/<slug>`
- [ ] Login as global admin → redirect to `/admin`
- [ ] Tenant colors override theme defaults
- [ ] TenantSwitcher shows real tenant info
