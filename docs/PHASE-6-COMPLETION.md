# Phase 6 Completion — Path-Based Multi-Tenant Routing

## P6-00 — Schema & Migration

**Status:** Complete

### Summary

Added `slug` (unique, required), `logoUrl`, `primaryColor`, `secondaryColor`, and `accentColor` fields to the `Tenant` model to support path-based routing and per-tenant branding.

### Files Modified

- `prisma/schema.prisma` — Added 5 new fields to `Tenant` model
- `prisma/migrations/20260221100000_add_tenant_slug_branding/migration.sql` — Migration with backfill for existing rows
- `prisma/seed.ts` — Added slugs (`default-org`, `test-org`) and branding colors to both seeded tenants
- `app/lib/schemas/tenant.ts` — Added `slug` (with reserved-slug validation), `logoUrl`, `primaryColor`, `secondaryColor`, `accentColor` to both create/update schemas
- `app/services/tenants.server.ts` — Updated `CreateTenantInput`/`UpdateTenantInput` interfaces, added `getTenantBySlug()`, updated CRUD to handle new fields
- `app/routes/admin/tenants/new.tsx` — Added slug + branding color form fields
- `app/routes/admin/tenants/$tenantId/edit.tsx` — Added slug + branding color form fields with default values

### Verification

- Migration: Applied cleanly via `prisma migrate deploy`
- Seed: Both tenants updated with slugs and colors
- Typecheck: No new errors (pre-existing errors in Phase 5 files unchanged)
- Tests: 78 files, 1021 tests passing

### Notable Decisions

- Reserved slugs (`admin`, `auth`, `api`, `kiosk`, `delegation`, `resources`, `up`) blocked at Zod schema level
- Migration uses 3-step approach: add nullable → backfill from name → set NOT NULL + UNIQUE
- Slug validation regex: `^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$` (allows single char)

---

## P6-02 — Tenant Resolution & useBasePrefix

**Status:** Complete

### Summary

Created server-side tenant resolution by slug, a client-side `useBasePrefix()` hook, and parameterized the navigation config so all sidebar URLs adapt to the current prefix (`/admin` or `/<slug>`).

### Files Created

- `app/lib/tenant.server.ts` — `resolveTenant(slug)` that returns a tenant or throws 404
- `app/hooks/use-base-prefix.ts` — `useBasePrefix()` hook reads `$tenant` param to return `/admin` or `/<slug>`

### Files Modified

- `app/config/navigation.ts` — Added `buildNavigationGroups(basePrefix)`, updated `getVisibleGroups()` to accept `basePrefix` param, "Tenants" nav item only shown in `/admin` context
- `app/components/layout/app-sidebar.tsx` — Accepts `basePrefix` and `tenant` props, passes them to `TenantSwitcher` and `getVisibleGroups`
- `app/components/layout/tenant-switcher.tsx` — Accepts real `tenant` data prop (name, slug, plan, logoUrl), shows contextual dropdown (Super Admin vs Tenant)

### Verification

- Typecheck: No new errors
- Tests: 78 files, 1021 tests passing

### Notable Decisions

- `resolveTenant` throws a React Router `data()` response (not an Error class) for proper 404 handling
- `buildNavigationGroups()` conditionally includes "Tenants" nav item only for `/admin` prefix (tenant users don't manage other tenants)
- `navigationGroups` kept as deprecated export for backward compatibility

---

## P6-03 — Shared DashboardLayout

**Status:** Complete

### Summary

Extracted the admin layout's presentation logic into a reusable `DashboardLayout` component. The admin layout now delegates rendering to this shared component, making it trivial for tenant routes to reuse the same sidebar/navbar/feature-flag shell.

### Files Created

- `app/components/layout/dashboard-layout.tsx` — Shared layout component accepting `basePrefix`, `tenant`, and all feature-flag/notification/theme props; renders `AppSidebar`, `TopNavbar`, `SSEProvider`, `Toaster`, PWA prompts, and `<Outlet />`

### Files Modified

- `app/routes/admin/_layout.tsx` — Refactored to use `DashboardLayout` with `basePrefix="/admin"` (loader unchanged)

### Verification

- Typecheck: No new errors
- Tests: 78 files, 1021 tests passing
- Admin area renders identically after refactor

---

## P6-04 — Tenant Layout & Routes

**Status:** Complete

### Summary

Created the `$tenant/_layout.tsx` that resolves the tenant by slug, authenticates the user, verifies tenant membership, and renders `DashboardLayout` with per-tenant branding CSS variables. Created 28 thin route re-export files mirroring critical admin routes. Updated admin route components (events, users, roles) to use `useBasePrefix()` instead of hardcoded `/admin` links.

### Files Created

- `app/routes/$tenant/_layout.tsx` — Full tenant layout with slug resolution, auth, membership check, branding CSS variable injection
- 28 tenant route files re-exporting from admin counterparts:
  - Dashboard, Events (list/new/edit/delete), Participants (list/new/view/edit), Fields (list/new), Forms, Participant Types
  - Users (list/new/edit/roles/delete), Roles (list/new/edit/permissions/delete)
  - Settings (general, fields, feature-flags), Permissions, Series

### Files Modified

- `app/routes/admin/events/index.tsx` — All links now use `useBasePrefix()` instead of hardcoded `/admin`
- `app/routes/admin/users/index.tsx` — All links now use `useBasePrefix()`
- `app/routes/admin/roles/index.tsx` — All links now use `useBasePrefix()`

### Verification

- Typecheck: No new errors
- Tests: 78 files, 1021 tests passing

### Notable Decisions

- Tenant route files use thin re-exports (`export { loader, default } from "~/routes/admin/..."`) to avoid code duplication — admin loaders use `requireAuth`/`requirePermission` which are request-based, so they work identically under both URL prefixes
- Tenant layout enforces `user.tenantId === tenant.id` — users can only access their own tenant's routes
- Branding CSS variables injected as `--tenant-primary`, `--tenant-secondary`, `--tenant-accent` via inline `<style>` tag
- "Tenants" nav item is excluded from tenant-scoped navigation (only visible in `/admin` context)

---

## P6-05 — Login Redirect & Branding CSS

**Status:** Complete

### Summary

Made login and registration redirects tenant-aware. After successful authentication, tenant users are redirected to `/<slug>` instead of `/admin`. Global admins (users without a tenant) continue to be redirected to `/admin`. Also updated `requireAnonymous` to redirect already-authenticated users to the correct tenant URL.

### Files Created

_(None — CSS variable injection was already completed in P6-04, TenantSwitcher was completed in P6-02)_

### Files Modified

- `app/lib/session.server.ts` — Added `getDefaultRedirect(userId)` helper that looks up user's tenant slug; updated `requireAnonymous` to use slug-aware redirect
- `app/routes/auth/login.tsx` — Loader uses `getDefaultRedirect` for already-authenticated redirect; action includes tenant relation in user query and uses `user.tenant.slug` for post-login redirect
- `app/routes/auth/onboarding.tsx` — Post-registration redirect uses `getDefaultRedirect` instead of hardcoded `/admin`

### Verification

- Typecheck: No new errors (pre-existing errors in Phase 5 files unchanged)
- Tests: 78 files, 1021 tests passing

### Notable Decisions

- `getDefaultRedirect` is a shared helper in `session.server.ts` since it's used by login loader, login action, onboarding action, and `requireAnonymous`
- Login action includes `tenant: { select: { slug: true } }` in the user query to avoid an extra DB round trip
- Onboarding redirect also updated for consistency, though newly registered users typically don't have a `tenantId` yet
