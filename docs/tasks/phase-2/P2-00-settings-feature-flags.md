# P2-00: Settings & Feature Flags

| Field                  | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **Task ID**            | P2-00                                                       |
| **Phase**              | 2 — Visual Form Designer + UX                               |
| **Category**           | Configuration                                               |
| **Suggested Assignee** | Backend Developer                                           |
| **Depends On**         | None (Phase 1 complete)                                     |
| **Blocks**             | P2-01 (FormTemplate needs feature flags)                    |
| **Estimated Effort**   | 5 days                                                      |
| **Module References**  | [Module 17](../../modules/17-SETTINGS-AND-CONFIGURATION.md) |

---

## Context

Phase 2 introduces feature flags to control rollout of new capabilities (form designer, SSE, keyboard shortcuts). A settings management system is needed before any Phase 2 feature work begins so that features can be toggled per tenant without deployments.

---

## Deliverables

### 1. Prisma Models

Add to `prisma/schema.prisma`:

**SystemSetting** — hierarchical key-value settings with scope resolution.

```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  key       String
  value     String
  type      String   @default("string")  // string, number, boolean, json
  category  String                        // auth, email, upload, workflow, etc.
  scope     String   @default("global")   // global, tenant, event, user
  tenantId  String?
  eventId   String?
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([key, scope, tenantId, eventId, userId])
  @@index([key])
  @@index([tenantId])
  @@index([category])
}
```

**FeatureFlag** — controls feature visibility and rollout.

```prisma
model FeatureFlag {
  id                String   @id @default(cuid())
  key               String   @unique
  description       String?
  enabled           Boolean  @default(false)
  enabledForTenants String[] @default([])
  enabledForRoles   String[] @default([])
  enabledForUsers   String[] @default([])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 2. Settings SDK

Create `app/lib/settings.server.ts`:

- `getSetting(key, context?)` — resolves setting from hierarchy: Default → Global → Tenant → Event → User
- `setSetting(key, value, scope, context)` — writes setting at given scope
- `getSettingsByCategory(category, context?)` — all settings for a category
- `deleteSetting(key, scope, context)` — removes a scope override

### 3. Feature Flags SDK

Create `app/lib/feature-flags.server.ts`:

- `isFeatureEnabled(key, context)` — checks flag status for given user/tenant
- `getAllFlags(context?)` — returns all flags with resolved status
- `setFlag(key, updates)` — update flag (admin only)

### 4. Seed Default Flags

Add to `prisma/seed.ts`:

```typescript
const defaultFlags = [
  { key: "FF_VISUAL_FORM_DESIGNER", description: "Enable visual form designer UI", enabled: false },
  { key: "FF_SSE_UPDATES", description: "Real-time SSE updates to queues", enabled: false },
  { key: "FF_KEYBOARD_SHORTCUTS", description: "Keyboard shortcut support", enabled: false },
  { key: "FF_NOTIFICATIONS", description: "Notification system", enabled: false },
  { key: "FF_GLOBAL_SEARCH", description: "Cross-event participant search", enabled: false },
];
```

### 5. Settings Admin UI

Create settings page at `/admin/settings`:

- Categorized panels (Auth, Email, Upload, Workflow, Feature Flags)
- Feature flags panel with toggle switches
- Scope indicator showing where settings are overridden
- Audit trail for setting changes

### 6. API Routes

- `GET /api/v1/settings` — list settings by category
- `PUT /api/v1/settings/:key` — update setting
- `GET /api/v1/feature-flags` — list all flags
- `PUT /api/v1/feature-flags/:key` — toggle flag

---

## Acceptance Criteria

- [ ] Settings resolve from correct scope in hierarchy (Default → Global → Tenant → Event → User)
- [ ] Feature flags toggle feature visibility
- [ ] Default flags seeded on migration
- [ ] Settings UI shows hierarchy with override indicators
- [ ] Settings changes audited in AuditLog
- [ ] API endpoints authenticated and role-restricted (ADMIN only)
- [ ] Unit tests for settings SDK resolution logic
