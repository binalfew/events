# Phase 2: Dynamic UI & Real-Time — Completion Report

> **Started:** 2026-02-16
> **Tasks completed:** P2-00

---

## Table of Contents

1. [Overview](#1-overview)
2. [P2-00 — Settings & Feature Flags](#2-p2-00--settings--feature-flags)

---

## 1. Overview

Phase 2 builds the dynamic UI and real-time features on top of Phase 1's core CRUD infrastructure. It begins with a settings and feature flags foundation that gates all subsequent Phase 2 features (form designer, SSE, keyboard shortcuts, notifications, search) so they can be toggled per-tenant without redeployment.

---

## 2. P2-00 — Settings & Feature Flags

### What This Task Does

Establishes two foundational systems:

1. **Hierarchical settings** — key-value configuration with scope resolution (Default > Global > Tenant > Event > User), allowing tenant-specific or event-specific overrides without code changes.
2. **Feature flags** — boolean gates with tenant/role/user targeting, enabling incremental rollout of Phase 2 features.

Both systems include admin UI pages and full audit logging.

### Architecture

**Settings resolution order** (most specific wins):

```
User scope (scopeId = userId)
  ↓ fallback
Event scope (scopeId = eventId)
  ↓ fallback
Tenant scope (scopeId = tenantId)
  ↓ fallback
Global scope (scopeId = "")
  ↓ fallback
Hardcoded defaults (SETTING_DEFAULTS map)
```

The `SystemSetting` model uses a single `scopeId` field instead of three nullable foreign keys. This avoids PostgreSQL's NULL-in-unique-constraint issue where multiple `(key, "global", NULL, NULL, NULL)` rows would be allowed, since `@@unique([key, scope, scopeId])` with `scopeId = ""` is unambiguous.

**Feature flag evaluation:**

```
isFeatureEnabled("FF_SSE_UPDATES", { tenantId, roles, userId })
  → flag.enabled === true?  → return true (globally on)
  → tenantId in enabledForTenants?  → return true
  → any role in enabledForRoles?  → return true
  → userId in enabledForUsers?  → return true
  → return false
```

### Files Created

| File                                          | Purpose                                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/lib/schemas/settings.ts`                 | Zod validation schemas for `upsertSettingSchema` and `updateFlagSchema`                                                                                                       |
| `app/lib/settings.server.ts`                  | Settings SDK — `getSetting()`, `setSetting()`, `getAllSettings()`, `getSettingsByCategory()`, `deleteSetting()` with hierarchical scope resolution and `SETTING_DEFAULTS` map |
| `app/lib/feature-flags.server.ts`             | Feature flags SDK — `isFeatureEnabled()`, `getAllFlags()`, `setFlag()` with typed `FEATURE_FLAG_KEYS` constant                                                                |
| `app/routes/admin/settings/index.tsx`         | General settings admin page with categorized card layout, add/reset forms, permission-gated by `settings:manage`                                                              |
| `app/routes/admin/settings/feature-flags.tsx` | Feature flags page with `Switch` toggles, optimistic updates via `useFetcher`, permission-gated by `feature-flag:manage`                                                      |

### Files Modified

| File                       | Change                                                                                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`     | Added `SystemSetting` model (hierarchical key-value with `@@unique([key, scope, scopeId])`) and `FeatureFlag` model (with `String[]` array targeting fields for tenants, roles, users) |
| `prisma/seed.ts`           | Added `feature-flag:manage` permission to `permissionDefs`, added 5 default feature flags via `upsert` pattern                                                                         |
| `app/config/navigation.ts` | Added "Feature Flags" child to Settings nav group (between General and Security)                                                                                                       |

### Database Migration

Migration `20260216113726_add_settings_and_feature_flags` creates two tables:

```sql
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "scopeId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledForTenants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabledForRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabledForUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
```

Indexes on `SystemSetting`: `[key]`, `[category]`, `[scope, scopeId]`, unique on `[key, scope, scopeId]`.
Unique index on `FeatureFlag`: `[key]`.

### Seeded Data

**New permission:** `feature-flag:manage` (assigned to ADMIN role)

**5 default feature flags** (all disabled by default):

| Key                       | Description                     |
| ------------------------- | ------------------------------- |
| `FF_VISUAL_FORM_DESIGNER` | Enable visual form designer UI  |
| `FF_SSE_UPDATES`          | Real-time SSE updates to queues |
| `FF_KEYBOARD_SHORTCUTS`   | Keyboard shortcut support       |
| `FF_NOTIFICATIONS`        | Notification system             |
| `FF_GLOBAL_SEARCH`        | Cross-event participant search  |

### Settings SDK Details

**`SETTING_DEFAULTS`** — hardcoded fallback values when no database record exists:

| Key                             | Value                           | Type    | Category |
| ------------------------------- | ------------------------------- | ------- | -------- |
| `upload.max_file_size_mb`       | `10`                            | number  | upload   |
| `upload.allowed_extensions`     | `jpg,jpeg,png,gif,pdf,doc,docx` | string  | upload   |
| `auth.session_timeout_minutes`  | `480`                           | number  | auth     |
| `auth.max_failed_attempts`      | `5`                             | number  | auth     |
| `auth.lockout_duration_minutes` | `30`                            | number  | auth     |
| `email.from_address`            | `noreply@example.com`           | string  | email    |
| `email.from_name`               | `Events Platform`               | string  | email    |
| `general.app_name`              | `Events Platform`               | string  | general  |
| `general.default_timezone`      | `UTC`                           | string  | general  |
| `workflow.auto_assign`          | `false`                         | boolean | workflow |

### Admin UI

**Settings page** (`/admin/settings`):

- Grouped by category (General, Auth, Email, Upload, Workflow) in Card components
- Each setting row shows: key (code formatted), current value, scope badge
- "Reset" button deletes scope overrides (returns to default)
- "Add Setting" form at the bottom for creating/updating settings

**Feature Flags page** (`/admin/settings/feature-flags`):

- Card listing all flags with `Switch` toggle components
- Optimistic updates via `useFetcher` — toggle reflects immediately before server response
- Targeting info shown as Badge (e.g., "2 tenants", "ADMIN role")
- Header shows count of globally enabled flags

### Patterns Reused

- **ServiceContext + audit logging** from `app/services/fields.server.ts` — every mutation creates an `AuditLog` entry with `CONFIGURE` action
- **Permission gating** from `app/lib/require-auth.server.ts` — `requirePermission(request, "settings", "manage")` for settings pages, `requirePermission(request, "feature-flag", "manage")` for flag mutations
- **`useFetcher` optimistic pattern** from `app/routes/resources/theme-switch.tsx` — toggle submits via fetcher with optimistic UI state
- **Seed `upsert` pattern** from `prisma/seed.ts` — idempotent seeding by unique key

### Verification Results

| Check                    | Result                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| `npx prisma migrate dev` | Migration `20260216113726_add_settings_and_feature_flags` applied |
| `npx prisma db seed`     | 21 permissions + 5 feature flags seeded                           |
| `npm run typecheck`      | Zero errors                                                       |
| `npm run test`           | 332/332 tests passing                                             |

### Notable Decisions

1. **Single `scopeId` field** instead of nullable `tenantId`/`eventId`/`userId` foreign keys on `SystemSetting`. This design avoids PostgreSQL's behavior where `NULL != NULL` in unique constraints, which would allow duplicate global settings.

2. **`String[]` arrays** for feature flag targeting (`enabledForTenants`, `enabledForRoles`, `enabledForUsers`) instead of join tables. This keeps the model simple for the expected cardinality (tens of items, not millions) and allows single-query flag evaluation.

3. **No separate `FeatureFlagTarget` table** — targeting is denormalized into the flag record itself. This trades write normalization for read simplicity, which is the right tradeoff since flags are read on every request but rarely written.
