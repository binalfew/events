# Module 17: Settings and Configuration

> **Requires:** [Module 00: Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md), [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)
> **Required By:** All modules (settings are cross-cutting)
> **Integrates With:** [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md), [Module 08: UI/UX](./08-UI-UX-AND-FRONTEND.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [API Specification](#4-api-specification)
5. [Business Logic](#5-business-logic)
6. [User Interface](#6-user-interface)
7. [Integration Points](#7-integration-points)
8. [Configuration](#8-configuration)
9. [Testing Strategy](#9-testing-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Performance Requirements](#11-performance-requirements)
12. [Open Questions & Decisions](#12-open-questions--decisions)
13. [Appendix](#appendix)

---

## 1. Overview

### 1.1 Purpose

The settings system is the control plane for the entire platform. Every module -- authentication, workflow, email, badge printing, catering, transport -- has configurable parameters that admins need to adjust without code changes. A poorly designed settings system forces developers to hardcode values or add environment variables for every tweak. A well-designed one provides a unified, auditable, tenant-aware configuration layer that can be changed at runtime, cached for performance, and overridden per tenant.

This module defines the complete architecture for hierarchical settings resolution, feature flag management, user preferences, typed SDK access, migration tooling, and drift detection. It serves as the single source of truth for how every configurable value flows through the platform.

### 1.2 Scope

This module covers:

- **Settings hierarchy**: Platform-level defaults, tenant-level overrides, event-level overrides, and user-level preferences with a deterministic resolution algorithm.
- **SystemSetting model**: The database-backed store for all runtime-configurable values.
- **Feature flags**: Boolean, percentage-rollout, user-targeted, and tenant-targeted flags controlling feature visibility and API availability.
- **User preferences**: Personal display and notification preferences stored per user.
- **Settings SDK**: A TypeScript-first typed access layer with Zod validation, in-memory caching, and event-driven invalidation.
- **Settings migration framework**: Version-controlled settings changes analogous to database migrations but for configuration.
- **Configuration drift detection**: Comparing expected settings from code defaults against actual database values, alerting on unexpected changes, and auto-remediating safe settings.
- **Master settings registry**: A comprehensive catalog of every settings key across every module.

### 1.3 Design Principles

**Convention over Configuration.** Every setting has a sensible default value hardcoded in the settings registry. A freshly provisioned tenant works out of the box with zero configuration. Admins only override what they need to change.

**Progressive Disclosure.** The settings UI groups values by category (Authentication, Email, Workflow, Badge, etc.) and only shows advanced settings when explicitly expanded. Common settings appear first; niche settings remain accessible but not overwhelming.

**Safe Defaults.** Default values are chosen for security and correctness rather than convenience. For example, `auth.requireTwoFactor` defaults to `false` (opt-in), but `workflow.requireRejectionReason` defaults to `true` (enforcing accountability). Secret settings like API keys are encrypted at rest and masked in the UI.

**Immutability of History.** Every settings change is recorded in `SettingAuditLog` with who, when, old value, new value, and reason. Settings can be rolled back but never silently changed.

**Type Safety End-to-End.** Settings keys, types, and validation rules are defined once in the master registry and enforced at the SDK layer via Zod schemas, at the API layer via request validation, and at the UI layer via form controls.

---

## 2. Architecture

### 2.1 Settings Hierarchy Diagram

```
+-------------------------------------------------------------------+
|                    SETTINGS HIERARCHY                              |
+-------------------------------------------------------------------+
|                                                                   |
|  +-----------------------------------------------------------+   |
|  |                    DEFAULT VALUES                          |   |
|  |  Hardcoded in code -- fallback when nothing is configured  |   |
|  +-----------------------------+-----------------------------+   |
|                                |                                  |
|                                v                                  |
|  +-----------------------------------------------------------+   |
|  |                  GLOBAL SETTINGS                           |   |
|  |  SystemSetting where tenantId = null                       |   |
|  |  Set by platform admin -- applies to all tenants           |   |
|  +-----------------------------+-----------------------------+   |
|                                |                                  |
|                                v                                  |
|  +-----------------------------------------------------------+   |
|  |                  TENANT SETTINGS                           |   |
|  |  SystemSetting where tenantId = :tenantId                  |   |
|  |  Set by tenant admin -- overrides global for this tenant   |   |
|  +-----------------------------+-----------------------------+   |
|                                |                                  |
|                                v                                  |
|  +-----------------------------------------------------------+   |
|  |                  EVENT SETTINGS                            |   |
|  |  EventSetting where eventId = :eventId                     |   |
|  |  Set per event -- overrides tenant for this event          |   |
|  +-----------------------------+-----------------------------+   |
|                                |                                  |
|                                v                                  |
|  +-----------------------------------------------------------+   |
|  |                  USER PREFERENCES                          |   |
|  |  UserPreference where userId = :userId                     |   |
|  |  Personal preferences -- language, theme, notifications    |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  Resolution order: User -> Event -> Tenant -> Global -> Default   |
|                                                                   |
+-------------------------------------------------------------------+
```

### 2.2 Resolution Algorithm

The resolution algorithm follows a most-specific-wins strategy with inheritance. When a module requests a setting value, the engine walks from the most specific scope to the least specific, returning the first match found.

```
resolve(key, { userId?, eventId?, tenantId? }):
  1. If userId provided AND key is a user-preference key:
     -> Check UserPreference WHERE userId AND key
     -> If found, return value
  2. If eventId provided:
     -> Check SystemSetting WHERE key AND tenantId AND eventId
     -> If found, return parsed value
  3. If tenantId provided:
     -> Check SystemSetting WHERE key AND tenantId AND eventId = null
     -> If found, return parsed value
  4. Check SystemSetting WHERE key AND tenantId = null AND eventId = null
     -> If found, return parsed value
  5. Return DefaultSettings[key].defaultValue from code registry
```

**Important rules:**

- User preferences only apply to UI/display keys (theme, language, timezone, page size). System-behavior keys (auth lockout, SLA thresholds) are never overridden at the user level.
- If a tenant overrides a global setting and an event does NOT override it, the event inherits the tenant value, not the global value.
- Secret-type settings are decrypted only at read time and never returned in bulk exports unless the caller has `PLATFORM_ADMIN` role.

### 2.3 Settings Storage Strategy

The platform uses three complementary storage mechanisms:

| Storage Layer             | Purpose                                                        | Examples                                             |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| **Environment Variables** | Infrastructure secrets, connection strings, deploy-time config | `DATABASE_URL`, `AZURE_STORAGE_KEY`, `SMTP_HOST`     |
| **SystemSetting (DB)**    | Runtime-configurable values with tenant/event hierarchy        | `auth.maxLoginAttempts`, `catering.bufferPercentage` |
| **FeatureFlag (DB)**      | Boolean/percentage gates for feature availability              | `feature.bilateralScheduler`, `feature.digitalBadge` |
| **UserPreference (DB)**   | Personal display/notification preferences                      | `ui.theme`, `notifications.digestMode`               |

**Decision rule:** If a value needs to change without redeployment, it belongs in the database. If it requires a restart or contains infrastructure secrets, it belongs in environment variables. Feature availability uses the dedicated FeatureFlag model for its richer semantics (rollout percentage, role targeting).

### 2.4 Settings SDK Architecture

The Settings SDK provides a typed, cached, validated access layer that all server-side modules use to read and write settings. It eliminates raw database queries for settings throughout the codebase.

```
+------------------------------------------------------------------+
|                     SETTINGS SDK                                  |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+    +------------------+   +--------------+  |
|  | SettingsRegistry |    | SettingsCache    |   | SettingsBus  |  |
|  | (Zod schemas,    |    | (in-memory Map,  |   | (EventEmitter|  |
|  |  defaults,       |--->|  TTL-based,      |<--|  invalidation|  |
|  |  metadata)       |    |  per-scope keys) |   |  events)     |  |
|  +--------+---------+    +--------+---------+   +------+-------+  |
|           |                       |                     |         |
|           v                       v                     v         |
|  +------------------+    +------------------+   +--------------+  |
|  | SettingsReader   |    | SettingsWriter   |   | SettingsWatch|  |
|  | .get(key, ctx)   |    | .set(key, val,   |   | .on(key, cb) |  |
|  | .getAll(category)|    |      ctx, reason)|   | .off(key,cb) |  |
|  | .resolve(key,ctx)|    | .bulkSet(...)    |   |              |  |
|  +------------------+    +------------------+   +--------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 3. Data Model

### 3.1 SystemSetting Model

```prisma
enum SettingType {
  STRING
  NUMBER
  BOOLEAN
  JSON
  ENUM
  SECRET    // Encrypted at rest, masked in UI
}

enum SettingScope {
  GLOBAL
  TENANT
  EVENT
  USER
}

model SystemSetting {
  id          String       @id @default(cuid())
  key         String       // Dot-notation: "auth.maxLoginAttempts", "email.senderAddress"
  value       String       // Stored as string, parsed based on type
  type        SettingType  @default(STRING)
  scope       SettingScope @default(GLOBAL)
  category    String       // "auth", "email", "upload", "workflow", "badge", "catering", etc.
  label       String       // Human-readable: "Maximum Login Attempts"
  description String?      // Help text: "Number of failed attempts before account lockout"
  tenantId    String?      // null = global, set = tenant-specific override
  eventId     String?      // null = tenant-wide, set = event-specific override
  isSecret    Boolean      @default(false) // Mask value in UI, encrypt in DB
  validationRule Json?     // { min: 1, max: 100 } or { enum: ["A", "B", "C"] } or { pattern: "^[a-z]+$" }
  dependsOn   String?      // Key of another setting this depends on
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([key, tenantId, eventId])
  @@index([category])
  @@index([tenantId])
  @@index([eventId])
  @@index([scope])
}
```

### 3.2 Feature Flag Schema

```prisma
model FeatureFlag {
  id                  String   @id @default(cuid())
  key                 String   // "feature.bilateralScheduler", "feature.digitalBadge"
  enabled             Boolean  @default(false)
  tenantId            String?  // null = global, set = tenant-specific
  description         String?
  rolloutPercentage   Int?     // For gradual rollout: 0-100
  enabledForRoles     String[] // Only enable for specific roles
  enabledForUsers     String[] // Specific user IDs for beta testing
  flagType            String   @default("boolean") // "boolean" | "percentage" | "user_targeted" | "tenant_targeted"
  dependsOnFlag       String?  // Key of another flag this depends on
  expiresAt           DateTime? // Auto-disable date for temporary flags
  metadata            Json?    // Arbitrary metadata: { jiraTicket, owner, description }
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([key, tenantId])
  @@index([tenantId])
  @@index([flagType])
  @@index([expiresAt])
}
```

### 3.3 User Preference Model

```prisma
model UserPreference {
  id          String   @id @default(cuid())
  userId      String
  key         String   // "language", "theme", "timezone", "notifications.email"
  value       String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, key])
  @@index([userId])
}
```

### 3.4 Settings Change History

Every settings change is logged for compliance and troubleshooting. The `SettingAuditLog` model captures the full lifecycle of every modification.

```prisma
model SettingAuditLog {
  id            String   @id @default(cuid())
  settingKey    String
  previousValue String?
  newValue      String
  settingType   SettingType?  // Capture the type at time of change
  tenantId      String?
  eventId       String?
  changedBy     String   // userId
  changedByName String?  // Denormalized for display without joins
  changedByRole String?  // Role at time of change
  changeReason  String?  // Optional reason for the change
  changeSource  String   @default("manual") // "manual" | "import" | "migration" | "auto_remediation" | "api"
  ipAddress     String?  // IP address of the requester
  changedAt     DateTime @default(now())

  @@index([settingKey, changedAt])
  @@index([changedBy, changedAt])
  @@index([tenantId, changedAt])
  @@index([eventId, changedAt])
  @@index([changeSource])
}
```

### 3.5 Settings Migration Model

Settings migrations are version-controlled changes applied sequentially, analogous to database migrations but for configuration values. They enable repeatable, testable settings deployments.

```prisma
model SettingsMigration {
  id          String   @id @default(cuid())
  version     String   @unique // Semver or sequential: "001", "002", "003"
  name        String   // Human-readable: "increase-default-sla-to-48h"
  description String?
  operations  Json     // Array of { action, key, value, scope, tenantId?, eventId? }
  appliedAt   DateTime?
  rolledBackAt DateTime?
  appliedBy   String?  // userId who ran the migration
  checksum    String   // SHA-256 of operations JSON for tamper detection
  status      String   @default("pending") // "pending" | "applied" | "rolled_back" | "failed"
  errorLog    String?  // Error details if migration failed
  createdAt   DateTime @default(now())

  @@index([status])
  @@index([version])
}
```

---

## 4. API Specification

### 4.1 Settings CRUD Endpoints

```
GET    /api/settings
       Query: ?category=auth&scope=GLOBAL&tenantId=...&eventId=...
       Response: { settings: SystemSetting[], total: number }
       Auth: PLATFORM_ADMIN | TENANT_ADMIN (scoped to own tenant)

GET    /api/settings/:key
       Query: ?tenantId=...&eventId=...
       Response: { setting: SystemSetting, resolvedValue: string, resolvedFrom: "event"|"tenant"|"global"|"default" }
       Auth: PLATFORM_ADMIN | TENANT_ADMIN

GET    /api/settings/:key/resolve
       Query: ?tenantId=...&eventId=...&userId=...
       Response: { key, value, type, resolvedFrom, inheritanceChain: [...] }
       Description: Returns the fully resolved value with the full inheritance chain for debugging.
       Auth: PLATFORM_ADMIN | TENANT_ADMIN

PUT    /api/settings/:key
       Body: { value: string, tenantId?: string, eventId?: string, reason?: string }
       Response: { setting: SystemSetting, audit: SettingAuditLog }
       Validation: Value is validated against the setting's validationRule and type.
       Auth: PLATFORM_ADMIN (global), TENANT_ADMIN (tenant), EVENT_MANAGER (event)

DELETE /api/settings/:key
       Query: ?tenantId=...&eventId=...
       Description: Removes a tenant/event override, reverting to the parent scope.
       Response: { reverted: true, newResolvedValue: string, resolvedFrom: string }
       Auth: PLATFORM_ADMIN | TENANT_ADMIN | EVENT_MANAGER

POST   /api/settings/bulk
       Body: { settings: Array<{ key, value, tenantId?, eventId? }>, reason?: string }
       Response: { updated: number, created: number, errors: Array<{ key, error }> }
       Auth: PLATFORM_ADMIN | TENANT_ADMIN
```

### 4.2 Feature Flag Endpoints

```
GET    /api/feature-flags
       Query: ?tenantId=...
       Response: { flags: FeatureFlag[] }
       Auth: PLATFORM_ADMIN | TENANT_ADMIN

GET    /api/feature-flags/:key/evaluate
       Query: ?tenantId=...&userId=...&role=...
       Response: { key, enabled: boolean, reason: string }
       Description: Evaluates the flag for the given context, considering rollout percentage,
                    role targeting, user targeting, and dependency flags.
       Auth: Any authenticated user

POST   /api/feature-flags
       Body: { key, enabled, tenantId?, description?, rolloutPercentage?,
               enabledForRoles?, flagType?, dependsOnFlag?, expiresAt?, metadata? }
       Response: { flag: FeatureFlag }
       Auth: PLATFORM_ADMIN

PUT    /api/feature-flags/:key
       Body: { enabled?, rolloutPercentage?, enabledForRoles?, enabledForUsers?, expiresAt? }
       Response: { flag: FeatureFlag }
       Auth: PLATFORM_ADMIN

DELETE /api/feature-flags/:key
       Query: ?tenantId=...
       Description: Removes a flag entirely. Requires flag to be disabled first.
       Auth: PLATFORM_ADMIN
```

### 4.3 User Preference Endpoints

```
GET    /api/users/me/preferences
       Response: { preferences: Record<string, string> }
       Auth: Any authenticated user

GET    /api/users/me/preferences/:key
       Response: { key, value, default: string }
       Auth: Any authenticated user

PUT    /api/users/me/preferences/:key
       Body: { value: string }
       Response: { preference: UserPreference }
       Auth: Any authenticated user

PUT    /api/users/me/preferences
       Body: { preferences: Record<string, string> }
       Description: Bulk update multiple preferences at once.
       Response: { updated: number }
       Auth: Any authenticated user

DELETE /api/users/me/preferences/:key
       Description: Resets preference to default.
       Response: { reverted: true, defaultValue: string }
       Auth: Any authenticated user
```

### 4.4 Settings Export/Import Endpoints

```
GET    /api/settings/export
       Query: ?scope=tenant&tenantId=...&category=...
       Response: JSON file download
       Format:
         {
           "exportedAt": "2026-02-10T14:30:00Z",
           "exportedBy": "user_admin1",
           "scope": "tenant",
           "tenantId": "tenant_au",
           "version": "1.0",
           "settings": [
             { "key": "auth.maxLoginAttempts", "value": "3", "type": "NUMBER", "category": "auth" },
             { "key": "email.senderAddress", "value": "accred@au.int", "type": "STRING", "category": "email" }
           ]
         }
       Auth: PLATFORM_ADMIN | TENANT_ADMIN

POST   /api/settings/import
       Body: Multipart form with JSON file
       Response: {
         preview: true,
         changes: Array<{ key, currentValue, newValue, action: "create"|"update"|"unchanged" }>,
         summary: { toCreate: number, toUpdate: number, unchanged: number }
       }
       Description: First call with ?preview=true returns a diff. Second call with ?confirm=true applies.
       Auth: PLATFORM_ADMIN | TENANT_ADMIN

POST   /api/settings/import?confirm=true
       Body: Multipart form with JSON file + reason
       Response: { imported: number, created: number, updated: number, auditIds: string[] }
       Auth: PLATFORM_ADMIN | TENANT_ADMIN
```

### 4.5 Settings Validation Endpoint

```
POST   /api/settings/validate
       Body: { key: string, value: string, type?: SettingType }
       Response: {
         valid: boolean,
         errors?: string[],
         parsedValue?: any,
         validationRule?: object
       }
       Description: Validates a value against the setting's registered schema without persisting it.
                    Useful for client-side validation before save.
       Auth: PLATFORM_ADMIN | TENANT_ADMIN
```

---

## 5. Business Logic

### 5.1 Settings Hierarchy

#### 5.1.1 Platform-Level Settings (System-Wide Defaults)

Platform-level settings are stored as `SystemSetting` rows where `tenantId = null` and `eventId = null`. They apply to every tenant and event unless overridden. Only `PLATFORM_ADMIN` users can modify them.

Examples: `auth.maxLoginAttempts = 5`, `upload.maxImageSizeMB = 3`, `pagination.defaultPageSize = 10`.

These values serve as the baseline configuration. When a new tenant is provisioned, it immediately inherits all platform-level settings without any manual setup.

#### 5.1.2 Tenant-Level Settings (Per-Organization Overrides)

Tenant-level settings are `SystemSetting` rows where `tenantId` is set and `eventId = null`. They override the platform default for all events within that tenant. `TENANT_ADMIN` users can modify settings within their own tenant scope.

Example: The African Union Commission tenant might set `auth.maxLoginAttempts = 3` (stricter than the global default of 5), and all AU Commission events inherit this tighter policy.

#### 5.1.3 Event-Level Settings (Per-Event Overrides)

Event-level settings are `SystemSetting` rows where both `tenantId` and `eventId` are set. They override the tenant default for a single event. `EVENT_MANAGER` users can modify event-scoped settings.

Example: The 38th AU Summit sets `catering.bufferPercentage = 15` (higher than the tenant default of 10) because this particular summit has greater dietary diversity.

#### 5.1.4 User-Level Preferences (Personal Preferences)

User preferences are stored in the `UserPreference` model and scoped to individual users. They control display and notification behavior only -- never system-level behavior. Any authenticated user can modify their own preferences.

Available preference keys: `ui.theme`, `ui.language`, `ui.timezone`, `ui.dateFormat`, `ui.defaultPageSize`, `ui.sidebarCollapsed`, `notifications.emailEnabled`, `notifications.smsEnabled`, `notifications.pushEnabled`, `notifications.digestMode`, `notifications.quietHoursStart`, `notifications.quietHoursEnd`, `workflow.autoRefresh`, `workflow.soundOnNew`.

#### 5.1.5 Resolution Algorithm (Detailed Merge Strategy with Examples)

```typescript
// Full resolution implementation
async function resolveSetting<T>(
  key: SettingKey,
  context: { tenantId?: string; eventId?: string; userId?: string },
): Promise<{
  value: T;
  resolvedFrom: string;
  chain: Array<{ scope: string; value: string | null }>;
}> {
  const chain: Array<{ scope: string; value: string | null }> = [];

  // Step 1: Check user preference (only for user-preference keys)
  if (context.userId && isUserPreferenceKey(key)) {
    const pref = await db.userPreference.findUnique({
      where: { userId_key: { userId: context.userId, key } },
    });
    chain.push({ scope: "user", value: pref?.value ?? null });
    if (pref) return { value: parseValue(pref.value, key) as T, resolvedFrom: "user", chain };
  }

  // Step 2: Check event-level override
  if (context.eventId && context.tenantId) {
    const eventSetting = await db.systemSetting.findUnique({
      where: {
        key_tenantId_eventId: { key, tenantId: context.tenantId, eventId: context.eventId },
      },
    });
    chain.push({ scope: "event", value: eventSetting?.value ?? null });
    if (eventSetting)
      return { value: parseValue(eventSetting.value, key) as T, resolvedFrom: "event", chain };
  }

  // Step 3: Check tenant-level override
  if (context.tenantId) {
    const tenantSetting = await db.systemSetting.findUnique({
      where: { key_tenantId_eventId: { key, tenantId: context.tenantId, eventId: null } },
    });
    chain.push({ scope: "tenant", value: tenantSetting?.value ?? null });
    if (tenantSetting)
      return { value: parseValue(tenantSetting.value, key) as T, resolvedFrom: "tenant", chain };
  }

  // Step 4: Check global setting
  const globalSetting = await db.systemSetting.findUnique({
    where: { key_tenantId_eventId: { key, tenantId: null, eventId: null } },
  });
  chain.push({ scope: "global", value: globalSetting?.value ?? null });
  if (globalSetting)
    return { value: parseValue(globalSetting.value, key) as T, resolvedFrom: "global", chain };

  // Step 5: Return hardcoded default
  const defaultVal = SettingsRegistry[key].defaultValue;
  chain.push({ scope: "default", value: String(defaultVal) });
  return { value: defaultVal as T, resolvedFrom: "default", chain };
}
```

**Example resolution trace:**

```
resolveSetting("catering.bufferPercentage", { tenantId: "tenant_au", eventId: "event_summit38" })

Chain:
  event  -> SystemSetting(key=catering.bufferPercentage, tenant=tenant_au, event=event_summit38) = "15"  <-- MATCH
  tenant -> (not checked, event matched)
  global -> (not checked)
  default -> (not checked)

Result: { value: 15, resolvedFrom: "event", chain: [{ scope: "event", value: "15" }] }
```

```
resolveSetting("auth.maxLoginAttempts", { tenantId: "tenant_ecowas", eventId: "event_meeting5" })

Chain:
  event  -> SystemSetting(key=auth.maxLoginAttempts, tenant=tenant_ecowas, event=event_meeting5) = null
  tenant -> SystemSetting(key=auth.maxLoginAttempts, tenant=tenant_ecowas, event=null) = null
  global -> SystemSetting(key=auth.maxLoginAttempts, tenant=null, event=null) = "5"  <-- MATCH
  default -> (not checked)

Result: { value: 5, resolvedFrom: "global", chain: [...] }
```

### 5.2 Feature Flag System

Feature flags control which platform capabilities are available. New features (bilateral scheduler, digital badges, carbon tracking) roll out behind flags, enabling gradual deployment and tenant-specific enabling.

#### 5.2.1 Flag Types

| Flag Type         | Description                                  | Use Case                                                      |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------- |
| `boolean`         | Simple on/off toggle                         | `feature.cateringModule` -- module is either available or not |
| `percentage`      | Enabled for N% of users (deterministic hash) | `feature.newDashboard` at 25% rollout for gradual migration   |
| `user_targeted`   | Enabled for specific user IDs                | `feature.betaReporting` for internal testers only             |
| `tenant_targeted` | Enabled for specific tenants                 | `feature.bilateralScheduler` for AU Commission only           |

**Percentage rollout implementation:**

```typescript
function isPercentageEnabled(flag: FeatureFlag, userId: string): boolean {
  if (!flag.rolloutPercentage) return false;
  // Deterministic: same user always gets same result for same flag
  const hash = createHash("sha256").update(`${flag.key}:${userId}`).digest();
  const bucket = hash.readUInt16BE(0) % 100;
  return bucket < flag.rolloutPercentage;
}
```

#### 5.2.2 Flag Lifecycle

```
CREATE            TEST              ROLLOUT           PERMANENT         CLEANUP
  |                 |                 |                 |                 |
  v                 v                 v                 v                 v
+----------+   +----------+   +-----------+   +-----------+   +----------+
| Draft    |-->| Beta     |-->| Rolling   |-->| GA        |-->| Removed  |
| enabled: |   | enabled: |   | out       |   | enabled:  |   | Flag     |
| false    |   | true for |   | 10%->50%  |   | true      |   | deleted, |
|          |   | specific |   | ->100%    |   | globally  |   | code     |
|          |   | users    |   |           |   |           |   | cleaned  |
+----------+   +----------+   +-----------+   +-----------+   +----------+
```

1. **Create**: Flag is created with `enabled: false`. Code references `isFeatureEnabled("feature.xyz")` throughout the codebase.
2. **Test**: Flag enabled for specific users (`enabledForUsers`) or roles (`enabledForRoles`) for internal testing.
3. **Rollout**: `rolloutPercentage` increased incrementally (10% -> 25% -> 50% -> 100%) while monitoring error rates and user feedback.
4. **Permanent**: Flag set to `enabled: true` globally. Feature is now standard.
5. **Cleanup**: Flag is deleted from the database. All `isFeatureEnabled` checks are removed from code. The `expiresAt` field triggers cleanup reminders.

#### 5.2.3 Flag Dependencies

Some flags depend on others. For example, `feature.digitalBadgeWallet` requires `feature.badgeModule` to be enabled.

```typescript
async function evaluateFlag(
  key: string,
  context: { tenantId?: string; userId?: string; role?: string },
): Promise<boolean> {
  const flag = await db.featureFlag.findFirst({
    where: { key, OR: [{ tenantId: context.tenantId }, { tenantId: null }] },
    orderBy: { tenantId: "desc" }, // Tenant-specific takes priority
  });

  if (!flag || !flag.enabled) return false;

  // Check dependency
  if (flag.dependsOnFlag) {
    const depEnabled = await evaluateFlag(flag.dependsOnFlag, context);
    if (!depEnabled) return false;
  }

  // Check expiry
  if (flag.expiresAt && new Date() > flag.expiresAt) return false;

  // Check flag type
  switch (flag.flagType) {
    case "boolean":
      return flag.enabled;
    case "percentage":
      return context.userId ? isPercentageEnabled(flag, context.userId) : false;
    case "user_targeted":
      return context.userId ? flag.enabledForUsers.includes(context.userId) : false;
    case "tenant_targeted":
      return flag.enabled; // Already scoped by tenant in query
    default:
      return flag.enabled;
  }
}
```

#### 5.2.4 Flag SDK Usage Pattern

```typescript
// In route middleware
app.use('/api/bilateral-meetings/*', featureGate('feature.bilateralScheduler'));

// In React component
function BilateralLink() {
  const { isEnabled } = useFeatureFlag('feature.bilateralScheduler');
  if (!isEnabled) return null;
  return <NavLink to="/bilateral-meetings">Bilateral Meetings</NavLink>;
}

// In sidebar navigation
const navItems = allNavItems.filter(item =>
  !item.featureFlag || isFeatureEnabled(item.featureFlag, { tenantId })
);
```

Feature flags control module visibility in the admin sidebar, API endpoint availability, and route access. Disabled features return 404 and are hidden from navigation.

```
Feature Flag Resolution:

Request to /admin/events/:eventId/bilateral-meetings
  -> Middleware checks: isFeatureEnabled("feature.bilateralScheduler", tenantId)
  -> Resolution:
    1. Check FeatureFlag WHERE key AND tenantId -> found, enabled: true -> ALLOW
    2. If not found for tenant -> check global (tenantId = null)
    3. If not found globally -> feature is OFF by default
  -> If disabled: return 404, route not rendered, sidebar link hidden
  -> If enabled: proceed to route handler

Sidebar navigation:
  -> For each nav item, check feature flag
  -> Only render links for enabled features
  -> Prevents confusion: users never see disabled features
```

### 5.3 Settings SDK

#### 5.3.1 Typed Settings Access (TypeScript-First with Zod Validation)

```typescript
import { z } from "zod";

// --- Settings Registry Definition ---

const SettingsSchemas = {
  "auth.maxLoginAttempts": z.number().int().min(1).max(100).default(5),
  "auth.lockoutDurationMinutes": z.number().int().min(1).max(1440).default(30),
  "auth.sessionExpirationDays": z.number().int().min(1).max(365).default(30),
  "auth.requireTwoFactor": z.boolean().default(false),
  "auth.passwordMinLength": z.number().int().min(6).max(128).default(8),
  "email.senderAddress": z.string().email().default("DoNotReply@accreditation.africanunion.org"),
  "email.dailySendLimit": z.number().int().min(0).max(100000).default(10000),
  "upload.maxImageSizeMB": z.number().min(0.1).max(50).default(3),
  "upload.maxDocumentSizeMB": z.number().min(0.1).max(100).default(10),
  "upload.allowedImageTypes": z.array(z.string()).default(["jpeg", "jpg", "png", "webp"]),
  "workflow.defaultSlaHours": z.number().int().min(1).max(720).default(24),
  "workflow.batchApprovalLimit": z.number().int().min(1).max(1000).default(100),
  "catering.bufferPercentage": z.number().int().min(0).max(100).default(10),
  "badge.maxReprintCount": z.number().int().min(0).max(100).default(3),
  "cache.ttlMinutes": z.number().int().min(1).max(60).default(5),
  "pagination.defaultPageSize": z.number().int().min(5).max(200).default(10),
  "maintenance.enabled": z.boolean().default(false),
  "maintenance.message": z.string().default("System temporarily unavailable for maintenance."),
} as const;

type SettingKey = keyof typeof SettingsSchemas;
type SettingValue<K extends SettingKey> = z.infer<(typeof SettingsSchemas)[K]>;

// --- Settings SDK Class ---

class SettingsSDK {
  private cache: Map<string, { value: unknown; expiresAt: number }> = new Map();
  private watchers: Map<string, Set<(newVal: unknown, oldVal: unknown) => void>> = new Map();

  async get<K extends SettingKey>(
    key: K,
    context?: { tenantId?: string; eventId?: string },
  ): Promise<SettingValue<K>> {
    const cacheKey = this.buildCacheKey(key, context);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as SettingValue<K>;
    }

    // Resolve from database
    const raw = await resolveSetting<string>(key, context ?? {});
    const schema = SettingsSchemas[key];
    const parsed = schema.parse(this.coerce(raw.value, key));

    // Cache result
    const ttl = this.getTTL(key);
    this.cache.set(cacheKey, { value: parsed, expiresAt: Date.now() + ttl });

    return parsed as SettingValue<K>;
  }

  async set<K extends SettingKey>(
    key: K,
    value: SettingValue<K>,
    context: { tenantId?: string; eventId?: string; userId: string; reason?: string },
  ): Promise<void> {
    // Validate
    const schema = SettingsSchemas[key];
    schema.parse(value);

    // Read old value for audit
    const oldValue = await this.get(key, context);

    // Persist
    await db.systemSetting.upsert({
      where: {
        key_tenantId_eventId: {
          key,
          tenantId: context.tenantId ?? null,
          eventId: context.eventId ?? null,
        },
      },
      create: {
        key,
        value: String(value),
        type: this.inferType(key),
        scope: this.inferScope(context),
        category: key.split(".")[0],
        label: SettingsRegistry[key].label,
        tenantId: context.tenantId ?? null,
        eventId: context.eventId ?? null,
      },
      update: { value: String(value), updatedAt: new Date() },
    });

    // Audit log
    await db.settingAuditLog.create({
      data: {
        settingKey: key,
        previousValue: String(oldValue),
        newValue: String(value),
        tenantId: context.tenantId ?? null,
        eventId: context.eventId ?? null,
        changedBy: context.userId,
        changeReason: context.reason,
        changeSource: "manual",
      },
    });

    // Invalidate cache
    this.invalidate(key, context);

    // Notify watchers
    this.notify(key, value, oldValue);
  }

  private buildCacheKey(key: string, context?: { tenantId?: string; eventId?: string }): string {
    return `settings:${key}:${context?.tenantId ?? "global"}:${context?.eventId ?? "none"}`;
  }

  private getTTL(key: SettingKey): number {
    // Time-sensitive settings get short TTL
    if (key === "maintenance.enabled" || key === "maintenance.message") return 10_000; // 10 seconds
    return 5 * 60 * 1000; // 5 minutes default
  }

  private invalidate(key: string, context?: { tenantId?: string; eventId?: string }): void {
    const cacheKey = this.buildCacheKey(key, context);
    this.cache.delete(cacheKey);
  }

  private notify(key: string, newVal: unknown, oldVal: unknown): void {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb(newVal, oldVal));
    }
  }

  private coerce(value: string, key: SettingKey): unknown {
    const schema = SettingsSchemas[key];
    const typeName = schema._def.typeName;
    if (typeName === "ZodNumber") return Number(value);
    if (typeName === "ZodBoolean") return value === "true";
    if (typeName === "ZodArray") return JSON.parse(value);
    return value;
  }

  private inferType(key: SettingKey): SettingType {
    const schema = SettingsSchemas[key];
    const typeName = schema._def.typeName;
    if (typeName === "ZodNumber") return "NUMBER";
    if (typeName === "ZodBoolean") return "BOOLEAN";
    if (typeName === "ZodArray" || typeName === "ZodObject") return "JSON";
    return "STRING";
  }

  private inferScope(context: { tenantId?: string; eventId?: string }): SettingScope {
    if (context.eventId) return "EVENT";
    if (context.tenantId) return "TENANT";
    return "GLOBAL";
  }
}

// --- Singleton export ---
export const settings = new SettingsSDK();
```

**Usage examples:**

```typescript
// Reading a setting with full type safety
const maxAttempts = await settings.get("auth.maxLoginAttempts", { tenantId });
// Type: number -- compile-time guaranteed

const senderEmail = await settings.get("email.senderAddress", { tenantId });
// Type: string

const allowedTypes = await settings.get("upload.allowedImageTypes", { tenantId });
// Type: string[]

// Writing a setting
await settings.set("auth.maxLoginAttempts", 3, {
  tenantId: "tenant_au",
  userId: currentUser.id,
  reason: "Tightening security after incident",
});
```

#### 5.3.2 Settings Cache (In-Memory with Event-Driven Invalidation)

**Caching strategy:**

- Default TTL: 5 minutes (configurable via `cache.ttlMinutes`).
- Short TTL (10 seconds): `maintenance.enabled`, `maintenance.message` -- time-sensitive.
- Cache invalidation: On every `set()` call, clear the affected cache key and emit an invalidation event.
- Cache key format: `settings:${key}:${tenantId}:${eventId}`.

```typescript
// In multi-process deployments, use Redis pub/sub for cross-process invalidation
import { EventEmitter } from "events";

class SettingsBus extends EventEmitter {
  emitInvalidation(key: string, context: { tenantId?: string; eventId?: string }): void {
    this.emit("invalidate", { key, ...context });
    // In production, also publish to Redis channel
    // redis.publish('settings:invalidate', JSON.stringify({ key, ...context }));
  }
}

const settingsBus = new SettingsBus();

// All SDK instances listen for invalidation
settingsBus.on("invalidate", ({ key, tenantId, eventId }) => {
  settings.invalidate(key, { tenantId, eventId });
});
```

#### 5.3.3 Settings Watcher (React to Settings Changes in Real-Time)

```typescript
// Server-side: watch for maintenance mode changes
settings.watch("maintenance.enabled", async (newVal: boolean, oldVal: boolean) => {
  if (newVal === true) {
    logger.warn("Maintenance mode ENABLED -- blocking non-admin access");
    // Broadcast SSE event to all connected clients
    sseManager.broadcast("system", {
      type: "maintenance_started",
      message: await settings.get("maintenance.message"),
    });
  } else {
    logger.info("Maintenance mode DISABLED");
    sseManager.broadcast("system", { type: "maintenance_ended" });
  }
});

// Client-side React hook
function useSettingValue<K extends SettingKey>(
  key: K,
  context?: { tenantId?: string; eventId?: string },
) {
  const [value, setValue] = useState<SettingValue<K> | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchSetting(key, context).then(setValue);

    // Listen for SSE updates
    const eventSource = new EventSource(`/api/settings/stream?keys=${key}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.key === key) setValue(data.value);
    };

    return () => eventSource.close();
  }, [key, context?.tenantId, context?.eventId]);

  return value;
}
```

#### 5.3.4 Default Value Registry

Every setting key is registered with metadata including its default value, type, label, description, category, allowed scopes, and validation rules.

```typescript
interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  category: string;
  type: SettingType;
  defaultValue: unknown;
  allowedScopes: SettingScope[];
  validationRule?: Record<string, unknown>;
  isSecret?: boolean;
  dependsOn?: string;
  uiComponent?: "text" | "number" | "toggle" | "select" | "json" | "secret";
}

const SettingsRegistry: Record<SettingKey, SettingDefinition> = {
  "auth.maxLoginAttempts": {
    key: "auth.maxLoginAttempts",
    label: "Maximum Login Attempts",
    description: "Number of failed attempts before account lockout",
    category: "auth",
    type: "NUMBER",
    defaultValue: 5,
    allowedScopes: ["GLOBAL", "TENANT"],
    validationRule: { min: 1, max: 100 },
    uiComponent: "number",
  },
  "email.senderAddress": {
    key: "email.senderAddress",
    label: "Sender Email Address",
    description: "From address for all outgoing emails",
    category: "email",
    type: "STRING",
    defaultValue: "DoNotReply@accreditation.africanunion.org",
    allowedScopes: ["GLOBAL", "TENANT"],
    validationRule: { pattern: "^[^@]+@[^@]+\\.[^@]+$" },
    uiComponent: "text",
  },
  // ... all other settings registered similarly
};
```

### 5.4 Settings Migration Framework

#### 5.4.1 Version-Controlled Settings Changes

Settings migrations are TypeScript files that define operations to apply and rollback, stored alongside database migrations.

```typescript
// migrations/settings/003-increase-default-sla.ts

import { SettingsMigration } from "@/lib/settings-migration";

export default new SettingsMigration({
  version: "003",
  name: "increase-default-sla-to-48h",
  description: "Increase default SLA from 24h to 48h based on operations feedback",

  async up(ctx) {
    await ctx.setSetting("workflow.defaultSlaHours", 48, {
      scope: "GLOBAL",
      reason: "Migration 003: Increase default SLA based on Q4 review",
    });
    await ctx.setSetting("workflow.slaWarningThresholdPercent", 80, {
      scope: "GLOBAL",
      reason: "Migration 003: Adjust warning threshold with new SLA",
    });
  },

  async down(ctx) {
    await ctx.setSetting("workflow.defaultSlaHours", 24, {
      scope: "GLOBAL",
      reason: "Rollback migration 003",
    });
    await ctx.setSetting("workflow.slaWarningThresholdPercent", 75, {
      scope: "GLOBAL",
      reason: "Rollback migration 003",
    });
  },
});
```

**Migration runner:**

```typescript
class SettingsMigrationRunner {
  async runPending(): Promise<{ applied: string[]; skipped: string[] }> {
    const allMigrations = await this.loadMigrations();
    const appliedVersions = await db.settingsMigration.findMany({
      where: { status: "applied" },
      select: { version: true },
    });
    const appliedSet = new Set(appliedVersions.map((m) => m.version));

    const pending = allMigrations.filter((m) => !appliedSet.has(m.version));
    const applied: string[] = [];

    for (const migration of pending) {
      try {
        await migration.up({ setSetting: this.setSetting.bind(this) });
        await db.settingsMigration.create({
          data: {
            version: migration.version,
            name: migration.name,
            description: migration.description,
            operations: migration.operations,
            checksum: this.computeChecksum(migration),
            status: "applied",
            appliedAt: new Date(),
            appliedBy: "system",
          },
        });
        applied.push(migration.version);
      } catch (error) {
        await db.settingsMigration.create({
          data: {
            version: migration.version,
            name: migration.name,
            operations: migration.operations,
            checksum: this.computeChecksum(migration),
            status: "failed",
            errorLog: error.message,
          },
        });
        throw error; // Stop on first failure
      }
    }

    return { applied, skipped: [] };
  }
}
```

#### 5.4.2 Safe Rollback

```typescript
async function rollbackMigration(version: string, userId: string): Promise<void> {
  const migration = await db.settingsMigration.findUnique({ where: { version } });
  if (!migration || migration.status !== "applied") {
    throw new Error(`Migration ${version} is not in applied state`);
  }

  const migrationModule = await loadMigration(version);
  await migrationModule.down({
    setSetting: settingsMigrationRunner.setSetting.bind(settingsMigrationRunner),
  });

  await db.settingsMigration.update({
    where: { version },
    data: { status: "rolled_back", rolledBackAt: new Date(), appliedBy: userId },
  });
}
```

#### 5.4.3 Migration Testing

Settings migrations are tested in CI before deployment:

```typescript
// __tests__/settings-migrations/003-increase-default-sla.test.ts

describe("Migration 003: increase-default-sla", () => {
  it("should set SLA to 48 hours on up()", async () => {
    const ops: Array<{ key: string; value: unknown }> = [];
    const ctx = { setSetting: (key: string, value: unknown) => ops.push({ key, value }) };

    await migration.up(ctx);

    expect(ops).toContainEqual({ key: "workflow.defaultSlaHours", value: 48 });
    expect(ops).toContainEqual({ key: "workflow.slaWarningThresholdPercent", value: 80 });
  });

  it("should restore SLA to 24 hours on down()", async () => {
    const ops: Array<{ key: string; value: unknown }> = [];
    const ctx = { setSetting: (key: string, value: unknown) => ops.push({ key, value }) };

    await migration.down(ctx);

    expect(ops).toContainEqual({ key: "workflow.defaultSlaHours", value: 24 });
  });

  it("should be idempotent", async () => {
    const ctx = createMockMigrationContext();
    await migration.up(ctx);
    await migration.up(ctx); // Second run should not error
  });
});
```

### 5.5 Configuration Drift Detection

#### 5.5.1 Expected vs Actual Settings Comparison

Drift detection compares the expected state (from the settings registry defaults and applied migrations) against the actual state in the database. This catches unauthorized manual edits, accidental changes, and migration failures.

```typescript
interface DriftReport {
  drifted: Array<{
    key: string;
    expectedValue: unknown;
    actualValue: unknown;
    scope: string;
    tenantId: string | null;
    severity: "info" | "warning" | "critical";
    autoRemediable: boolean;
  }>;
  missing: Array<{ key: string; expectedValue: unknown }>;
  unexpected: Array<{ key: string; actualValue: unknown; scope: string }>;
  checkedAt: Date;
}

async function detectDrift(tenantId?: string): Promise<DriftReport> {
  const report: DriftReport = { drifted: [], missing: [], unexpected: [], checkedAt: new Date() };

  // Load all expected settings from registry
  const expectedKeys = Object.keys(SettingsRegistry);

  // Load all actual settings from database
  const actualSettings = await db.systemSetting.findMany({
    where: tenantId ? { tenantId } : { tenantId: null, eventId: null },
  });
  const actualMap = new Map(actualSettings.map((s) => [s.key, s]));

  for (const key of expectedKeys) {
    const expected = SettingsRegistry[key as SettingKey];
    const actual = actualMap.get(key);

    if (!actual) {
      // Setting exists in registry but not in DB -- uses code default, which is fine
      continue;
    }

    const parsedActual = parseValue(actual.value, key as SettingKey);
    if (JSON.stringify(parsedActual) !== JSON.stringify(expected.defaultValue)) {
      // Value differs from default -- this may be intentional (admin override) or drift
      // Only flag as drift if no audit log entry exists for this change
      const hasAuditEntry = await db.settingAuditLog.findFirst({
        where: { settingKey: key, tenantId: tenantId ?? null },
        orderBy: { changedAt: "desc" },
      });

      if (!hasAuditEntry) {
        report.drifted.push({
          key,
          expectedValue: expected.defaultValue,
          actualValue: parsedActual,
          scope: actual.scope,
          tenantId: actual.tenantId,
          severity: classifyDriftSeverity(key),
          autoRemediable: isAutoRemediable(key),
        });
      }
    }
  }

  return report;
}
```

#### 5.5.2 Drift Alerting

```typescript
// Scheduled job: runs daily at 02:00 UTC
async function driftDetectionJob(): Promise<void> {
  const report = await detectDrift();

  if (report.drifted.length > 0) {
    const critical = report.drifted.filter((d) => d.severity === "critical");
    const warnings = report.drifted.filter((d) => d.severity === "warning");

    if (critical.length > 0) {
      await notifyPlatformAdmins({
        subject: `CRITICAL: ${critical.length} settings have drifted from expected values`,
        body: formatDriftReport(critical),
        channel: "email",
      });
      logger.error("Critical settings drift detected", {
        count: critical.length,
        keys: critical.map((d) => d.key),
      });
    }

    if (warnings.length > 0) {
      logger.warn("Settings drift detected", {
        count: warnings.length,
        keys: warnings.map((d) => d.key),
      });
    }
  }
}

function classifyDriftSeverity(key: string): "info" | "warning" | "critical" {
  if (key.startsWith("auth.") || key.startsWith("compliance.")) return "critical";
  if (key.startsWith("workflow.") || key.startsWith("email.")) return "warning";
  return "info";
}
```

#### 5.5.3 Auto-Remediation (For Safe Settings Only)

Only non-security, non-destructive settings are eligible for auto-remediation. Security settings always require manual review.

```typescript
const AUTO_REMEDIABLE_KEYS = new Set([
  "cache.ttlMinutes",
  "pagination.defaultPageSize",
  "badge.defaultDpi",
  "ui.defaultPageSize",
]);

function isAutoRemediable(key: string): boolean {
  return AUTO_REMEDIABLE_KEYS.has(key);
}

async function autoRemediate(driftedSettings: DriftReport["drifted"]): Promise<string[]> {
  const remediated: string[] = [];

  for (const drift of driftedSettings) {
    if (!drift.autoRemediable) continue;

    await settings.set(drift.key as SettingKey, drift.expectedValue as any, {
      userId: "system",
      reason: `Auto-remediation: value drifted from expected ${drift.expectedValue} to ${drift.actualValue}`,
    });

    remediated.push(drift.key);
  }

  return remediated;
}
```

### 5.6 Master Settings Registry

#### 5.6.1 Complete Catalog of All Settings Keys

See [Appendix A](#a-master-settings-registry) for the full table of all 60+ settings keys across all modules.

#### 5.6.2 Settings Key Naming Convention

All settings keys follow the pattern: `{module}.{subcategory?}.{key}`

Rules:

- **Module prefix**: Matches the logical module name (`auth`, `email`, `upload`, `workflow`, `badge`, `catering`, `transport`, `accommodation`, `waitlist`, `incident`, `compliance`, `cache`, `pagination`, `maintenance`, `backup`, `otp`, `sms`, `push`, `ui`, `notifications`).
- **Subcategory** (optional): Groups related keys within a module (`notifications.email`, `notifications.sms`).
- **Key**: camelCase descriptor of the specific value (`maxLoginAttempts`, `bufferPercentage`).
- **No abbreviations**: Use full words (`senderAddress` not `sndAddr`).
- **Boolean keys**: Use positive phrasing (`enabled`, `require`, `allow`) rather than negative (`disabled`, `disallow`).

Examples:

```
auth.maxLoginAttempts          -- module.key
auth.passwordMinLength         -- module.key
notifications.quietHoursStart  -- module.subcategory (implicit)
upload.maxImageSizeMB          -- module.key with unit suffix
workflow.autoEscalateOnSlaBreach -- module.descriptiveKey
```

#### 5.6.3 Settings Documentation Generation

The settings registry can auto-generate documentation:

```typescript
function generateSettingsDocs(): string {
  const categories = new Map<string, SettingDefinition[]>();

  for (const [, def] of Object.entries(SettingsRegistry)) {
    const list = categories.get(def.category) ?? [];
    list.push(def);
    categories.set(def.category, list);
  }

  let markdown = "# Settings Reference\n\n";
  for (const [category, settings] of categories) {
    markdown += `## ${category}\n\n`;
    markdown += "| Key | Label | Default | Type | Scopes |\n";
    markdown += "|-----|-------|---------|------|--------|\n";
    for (const s of settings) {
      markdown += `| \`${s.key}\` | ${s.label} | ${s.defaultValue} | ${s.type} | ${s.allowedScopes.join(", ")} |\n`;
    }
    markdown += "\n";
  }

  return markdown;
}
```

---

## 6. User Interface

### 6.1 Platform Settings Dashboard

Platform-level admin settings accessible at `/admin/settings`. Uses a tabbed interface with one tab per category.

```
+-------------------------------------------------------------------+
|  System Settings                                      [Audit Log]  |
+-------------------------------------------------------------------+
|                                                                    |
|  [Auth] [Email] [Upload] [Workflow] [Badge] [Catering] ...        |
|  -----                                                             |
|                                                                    |
|  Authentication & Security                                         |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |  Max Login Attempts              [5        ] NUMBER          | |
|  |  Number of failed attempts before account lockout            | |
|  |  [Save]  [Reset to Default: 5]                               | |
|  |                                                              | |
|  |  ----------------------------------------------------------  | |
|  |                                                              | |
|  |  Lockout Duration (minutes)      [30       ] NUMBER          | |
|  |  Minutes locked out after max attempts                       | |
|  |  [Save]  [Reset to Default: 30]                              | |
|  |                                                              | |
|  |  ----------------------------------------------------------  | |
|  |                                                              | |
|  |  Require Two-Factor Auth         [OFF    ] BOOLEAN           | |
|  |  Force 2FA for all users                                     | |
|  |  [Save]  [Reset to Default: OFF]                             | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+-------------------------------------------------------------------+
```

**React implementation pattern:**

```tsx
function PlatformSettingsPage() {
  const categories = useSettingsCategories();
  const [activeTab, setActiveTab] = useState(categories[0]?.key);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {categories.map((cat) => (
          <TabsTrigger key={cat.key} value={cat.key}>
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((cat) => (
        <TabsContent key={cat.key} value={cat.key}>
          <SettingsCategoryPanel category={cat.key} scope="GLOBAL" />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function SettingsCategoryPanel({ category, scope, tenantId, eventId }: Props) {
  const { data: settings } = useQuery(["settings", category, scope, tenantId, eventId], () =>
    api.get("/api/settings", { params: { category, scope, tenantId, eventId } }),
  );

  return (
    <div className="space-y-6">
      {settings?.map((setting) => (
        <SettingField key={setting.key} setting={setting} scope={scope} />
      ))}
    </div>
  );
}
```

### 6.2 Tenant Settings Panel

Tenant admins see settings for their tenant at `/admin/tenants/:tenantId/settings`. Shows global default alongside tenant override.

```
+-------------------------------------------------------------------+
|  Tenant Settings -- African Union Commission                       |
+-------------------------------------------------------------------+
|                                                                    |
|  Max Login Attempts                                                |
|  +--------------------------------------------------------------+ |
|  |  Global default:  5                                          | |
|  |  Tenant override: [3        ]  (overrides global)            | |
|  |  [Save Override]  [Use Global Default]                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Email Sender Address                                              |
|  +--------------------------------------------------------------+ |
|  |  Global default:  DoNotReply@accreditation.africanunion.org  | |
|  |  Tenant override: [accred@au.int      ]                     | |
|  |  [Save Override]  [Use Global Default]                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+-------------------------------------------------------------------+
```

### 6.3 Event Settings Panel

Event-specific overrides at `/admin/events/:eventId/settings`. Shows the resolution chain: event -> tenant -> global.

```
+-------------------------------------------------------------------+
|  Event Settings -- 38th AU Summit                                  |
+-------------------------------------------------------------------+
|                                                                    |
|  Catering Buffer %                                                 |
|  +--------------------------------------------------------------+ |
|  |  Global default:  10%                                        | |
|  |  Tenant setting:  10% (using global)                         | |
|  |  Event override:  [15       ]%  (this event has more         | |
|  |                                  dietary variety)             | |
|  |  [Save Override]  [Use Tenant Default]                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Waitlist Promotion Deadline (hours)                               |
|  +--------------------------------------------------------------+ |
|  |  Global default:  48                                         | |
|  |  Tenant setting:  48 (using global)                          | |
|  |  Event override:  [24       ]  (shorter deadline for         | |
|  |                                 this urgent event)            | |
|  |  [Save Override]  [Use Tenant Default]                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+-------------------------------------------------------------------+
```

### 6.4 User Preferences Panel

```
+-------------------------------------------------------------------+
|  Settings -- Preferences                                           |
+-------------------------------------------------------------------+
|                                                                    |
|  Appearance                                                        |
|  +--------------------------------------------------------------+ |
|  | Theme          (*) Light  ( ) Dark  ( ) System                | |
|  | Language        [English v]                                   | |
|  | Timezone        [Africa/Addis_Ababa v]                        | |
|  | Date Format     [YYYY-MM-DD v]                                | |
|  | Items per page  [25 v]                                        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Notifications                                                     |
|  +--------------------------------------------------------------+ |
|  | Email notifications     [x]  Receive email alerts             | |
|  | SMS notifications       [ ]  Receive SMS alerts               | |
|  | Push notifications      [x]  Browser push alerts              | |
|  | Delivery mode           (*) Immediate  ( ) Hourly digest      | |
|  | Quiet hours             [22:00] to [07:00]                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Workflow                                                          |
|  +--------------------------------------------------------------+ |
|  | Auto-refresh queue      [x]  Live updates via SSE             | |
|  | Sound on new request    [x]  Play chime for new items         | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Save Preferences]  [Reset to Defaults]                           |
|                                                                    |
+-------------------------------------------------------------------+
```

**Available user preferences:**

| Key                             | Label               | Default    | Options                            | Description                      |
| ------------------------------- | ------------------- | ---------- | ---------------------------------- | -------------------------------- |
| `ui.theme`                      | Theme               | system     | light, dark, system                | Color theme preference           |
| `ui.language`                   | Language            | en         | en, fr, ar, pt                     | UI language                      |
| `ui.timezone`                   | Timezone            | UTC        | IANA timezone                      | Display timezone                 |
| `ui.dateFormat`                 | Date Format         | YYYY-MM-DD | YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY | Date display format              |
| `ui.defaultPageSize`            | Page Size           | 10         | 10, 25, 50, 100                    | Preferred items per page         |
| `ui.sidebarCollapsed`           | Sidebar             | false      | true, false                        | Remember sidebar state           |
| `notifications.emailEnabled`    | Email Notifications | true       | true, false                        | Receive email notifications      |
| `notifications.smsEnabled`      | SMS Notifications   | false      | true, false                        | Receive SMS notifications        |
| `notifications.pushEnabled`     | Push Notifications  | true       | true, false                        | Receive push notifications       |
| `notifications.digestMode`      | Digest Mode         | immediate  | immediate, hourly, daily           | Notification batching            |
| `notifications.quietHoursStart` | Quiet Start         | --         | HH:MM                              | Suppress notifications after     |
| `notifications.quietHoursEnd`   | Quiet End           | --         | HH:MM                              | Resume notifications after       |
| `workflow.autoRefresh`          | Auto-Refresh Queue  | true       | true, false                        | SSE auto-refresh validator queue |
| `workflow.soundOnNew`           | Sound on New        | true       | true, false                        | Audio alert on new request       |

### 6.5 Feature Flag Management UI

```
+-------------------------------------------------------------------+
|  Feature Flags                                        [Add Flag]   |
+-------------------------------------------------------------------+
|                                                                    |
|  +------------------------+---------+----------+--------------+    |
|  | Feature                | Global  | AU Comm. | ECOWAS       |    |
|  +------------------------+---------+----------+--------------+    |
|  | Bilateral Scheduler    |  OFF    |   ON     |   OFF        |    |
|  | Digital Badge (Wallet) |  OFF    |   ON     |   OFF        |    |
|  | Carbon Tracking        |  OFF    |   OFF    |   OFF        |    |
|  | Catering Module        |  ON     |   ON     |   ON         |    |
|  | Transport Module       |  ON     |   ON     |   OFF        |    |
|  | Survey Module          |  OFF    |   ON     |   OFF        |    |
|  | Kiosk Mode             |  ON     |   ON     |   ON         |    |
|  | Companion Program      |  OFF    |   OFF    |   OFF        |    |
|  +------------------------+---------+----------+--------------+    |
|                                                                    |
|  Flag Details: Bilateral Scheduler                                 |
|  +--------------------------------------------------------------+ |
|  | Type:        tenant_targeted                                  | |
|  | Rollout:     100% (for enabled tenants)                       | |
|  | Depends On:  (none)                                           | |
|  | Expires:     (never)                                          | |
|  | Created:     2026-01-15                                       | |
|  | JIRA:        ACCR-1234                                        | |
|  | Description: Enable bilateral meeting scheduling for          | |
|  |              head-of-state events                             | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+-------------------------------------------------------------------+
```

### 6.6 Settings Change History Viewer

```
+-------------------------------------------------------------------+
|  Settings Audit Log                       [Filter v] [Export]      |
+-------------------------------------------------------------------+
|                                                                    |
|  Feb 10, 14:30  auth.maxLoginAttempts  5 -> 3                     |
|                 Changed by: Admin User | Tenant: AU Commission     |
|                 Reason: Tightening security after incident          |
|                 Source: manual                                      |
|                                                                    |
|  Feb 10, 11:15  catering.bufferPercentage  10 -> 15               |
|                 Changed by: Event Manager | Event: 38th Summit     |
|                 Reason: Higher dietary variety expected              |
|                 Source: manual                                      |
|                                                                    |
|  Feb 9, 16:00   maintenance.enabled  false -> true                 |
|                 Changed by: System Admin | Global                   |
|                 Reason: Scheduled maintenance window                 |
|                 Source: manual                                      |
|                                                                    |
|  Feb 8, 09:00   workflow.defaultSlaHours  24 -> 48                 |
|                 Changed by: system | Global                         |
|                 Reason: Migration 003: Increase default SLA         |
|                 Source: migration                                   |
|                                                                    |
|  [< Prev]  Page 1 of 12  [Next >]                                 |
|                                                                    |
+-------------------------------------------------------------------+
```

**Filter options:** by setting key, by category, by user, by date range, by scope, by change source.

---

## 7. Integration Points

### 7.1 How Each Module Registers Its Settings

Each module exports a settings registration function that the platform calls during startup. This ensures the master registry is populated and all settings have documented defaults.

```typescript
// modules/catering/settings.ts
import { registerSettings, SettingDefinition } from "@/lib/settings-registry";

const cateringSettings: SettingDefinition[] = [
  {
    key: "catering.bufferPercentage",
    label: "Buffer %",
    description: "Meal count buffer for over-ordering",
    category: "catering",
    type: "NUMBER",
    defaultValue: 10,
    allowedScopes: ["GLOBAL", "TENANT", "EVENT"],
    validationRule: { min: 0, max: 100 },
    uiComponent: "number",
  },
  {
    key: "catering.allowDoubleCollection",
    label: "Allow Double Collection",
    description: "Allow same meal voucher twice",
    category: "catering",
    type: "BOOLEAN",
    defaultValue: false,
    allowedScopes: ["GLOBAL", "TENANT", "EVENT"],
    uiComponent: "toggle",
  },
  // ... remaining catering settings
];

export function registerCateringSettings() {
  registerSettings(cateringSettings);
}

// app/startup.ts
import { registerCateringSettings } from "@/modules/catering/settings";
import { registerAuthSettings } from "@/modules/auth/settings";
// ... other modules

export function initializeSettingsRegistry() {
  registerAuthSettings();
  registerCateringSettings();
  registerEmailSettings();
  registerUploadSettings();
  registerWorkflowSettings();
  registerBadgeSettings();
  registerTransportSettings();
  registerAccommodationSettings();
  registerWaitlistSettings();
  registerIncidentSettings();
  registerComplianceSettings();
  registerSystemSettings();
}
```

### 7.2 How Modules Read Settings (SDK Usage)

```typescript
// In any module's service layer
import { settings } from "@/lib/settings-sdk";

// Catering module reading buffer percentage
async function calculateMealCounts(eventId: string, tenantId: string) {
  const buffer = await settings.get("catering.bufferPercentage", { tenantId, eventId });
  const headcount = await getEventHeadcount(eventId);
  return Math.ceil(headcount * (1 + buffer / 100));
}

// Auth module checking lockout settings
async function checkLoginAttempts(userId: string, tenantId: string) {
  const maxAttempts = await settings.get("auth.maxLoginAttempts", { tenantId });
  const lockoutMinutes = await settings.get("auth.lockoutDurationMinutes", { tenantId });
  // ...
}

// Workflow module reading SLA
async function checkSlaCompliance(stepId: string, tenantId: string, eventId: string) {
  const slaHours = await settings.get("workflow.defaultSlaHours", { tenantId, eventId });
  const warningPercent = await settings.get("workflow.slaWarningThresholdPercent", {
    tenantId,
    eventId,
  });
  // ...
}
```

### 7.3 How Feature Flags Gate Module Features

```typescript
// Express middleware for feature-gated routes
function featureGate(flagKey: string): RequestHandler {
  return async (req, res, next) => {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const role = req.user?.role;

    const enabled = await evaluateFlag(flagKey, { tenantId, userId, role });

    if (!enabled) {
      return res.status(404).json({ error: "Feature not available" });
    }

    next();
  };
}

// Route registration
router.use("/api/bilateral-meetings", featureGate("feature.bilateralScheduler"));
router.use("/api/digital-badges", featureGate("feature.digitalBadge"));
router.use("/api/carbon-tracking", featureGate("feature.carbonTracking"));
router.use("/api/catering", featureGate("feature.cateringModule"));
router.use("/api/transport", featureGate("feature.transportModule"));
router.use("/api/surveys", featureGate("feature.surveyModule"));
```

### 7.4 Settings Change Event Propagation

When a setting changes, the SDK emits events that other parts of the system can react to:

```typescript
// SettingsBus event types
interface SettingChangedEvent {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  scope: SettingScope;
  tenantId: string | null;
  eventId: string | null;
  changedBy: string;
  timestamp: Date;
}

// Modules subscribe to settings changes they care about
settingsBus.on("setting:changed", async (event: SettingChangedEvent) => {
  // Email module reacts to sender address changes
  if (event.key === "email.senderAddress") {
    await emailService.updateSenderConfig(event.tenantId);
  }

  // Maintenance mode broadcasts to all connected clients
  if (event.key === "maintenance.enabled") {
    sseManager.broadcast("system", {
      type: event.newValue ? "maintenance_started" : "maintenance_ended",
    });
  }

  // Cache module reacts to TTL changes
  if (event.key === "cache.ttlMinutes") {
    cacheManager.updateTTL(event.newValue as number);
  }
});
```

| System              | How Settings Are Used                                       |
| ------------------- | ----------------------------------------------------------- |
| Authentication      | Login attempts, lockout, session duration, 2FA requirements |
| Workflow Engine     | SLA thresholds, batch limits, escalation rules              |
| Badge Printing      | Reprint limits, DPI, digital badge toggle                   |
| Communication Hub   | Sender address, daily limits, retry policies                |
| Catering            | Buffer percentage, voucher expiry, vendor portal toggle     |
| Transport           | Pickup buffer, no-show alerts, GPS toggle                   |
| Accommodation       | Auto-assign toggle, no-show release timing                  |
| Waitlist            | Enable/disable, promotion deadline, expiry behavior         |
| Incident Management | Escalation timing, SMS alerts, resolution requirements      |
| Compliance          | Passport expiry check window, retention period, GDPR mode   |
| Check-In / Access   | Offline sync interval, capacity thresholds                  |
| Feature Flags       | Module visibility, sidebar navigation, API access           |
| All modules         | Pagination page size, cache TTL, file upload limits         |

---

## 8. Configuration

### 8.1 Settings Key Naming Convention

Pattern: `{module}.{category}.{key}` or `{module}.{key}` for simple cases.

| Module Prefix   | Examples                                                        |
| --------------- | --------------------------------------------------------------- |
| `auth`          | `auth.maxLoginAttempts`, `auth.requireTwoFactor`                |
| `email`         | `email.senderAddress`, `email.dailySendLimit`                   |
| `sms`           | `sms.enabled`, `sms.providerApiKey`                             |
| `push`          | `push.enabled`                                                  |
| `upload`        | `upload.maxImageSizeMB`, `upload.allowedImageTypes`             |
| `storage`       | `storage.containerName`                                         |
| `workflow`      | `workflow.defaultSlaHours`, `workflow.batchApprovalLimit`       |
| `badge`         | `badge.maxReprintCount`, `badge.enableDigitalBadge`             |
| `catering`      | `catering.bufferPercentage`, `catering.vendorPortalEnabled`     |
| `transport`     | `transport.pickupBufferMinutes`, `transport.gpsTrackingEnabled` |
| `accommodation` | `accommodation.autoAssignOnApproval`                            |
| `waitlist`      | `waitlist.enabled`, `waitlist.promotionDeadlineHours`           |
| `incident`      | `incident.autoEscalateMinutes`, `incident.criticalAlertSms`     |
| `compliance`    | `compliance.dataRetentionDays`, `compliance.gdprEnabled`        |
| `cache`         | `cache.ttlMinutes`                                              |
| `pagination`    | `pagination.defaultPageSize`                                    |
| `maintenance`   | `maintenance.enabled`, `maintenance.message`                    |
| `backup`        | `backup.retentionDays`, `backup.maxCount`                       |
| `otp`           | `otp.validityMinutes`                                           |
| `feature`       | `feature.bilateralScheduler`, `feature.digitalBadge`            |

### 8.2 Environment Variable Mapping

Environment variables are used for infrastructure-level configuration that should not be changed at runtime. They are loaded at process startup and are immutable during the application lifecycle.

| Environment Variable       | Purpose                              | Example                                  |
| -------------------------- | ------------------------------------ | ---------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string         | `postgresql://user:pass@host:5432/db`    |
| `REDIS_URL`                | Redis connection for caching/pub-sub | `redis://host:6379`                      |
| `AZURE_STORAGE_CONNECTION` | Azure Blob Storage connection        | (connection string)                      |
| `AZURE_STORAGE_CONTAINER`  | Default blob container name          | `accreditation`                          |
| `SMTP_HOST`                | SMTP server hostname                 | `smtp.sendgrid.net`                      |
| `SMTP_PORT`                | SMTP server port                     | `587`                                    |
| `SMTP_USER`                | SMTP authentication user             | `apikey`                                 |
| `SMTP_PASS`                | SMTP authentication password         | (secret)                                 |
| `JWT_SECRET`               | JWT signing secret                   | (secret)                                 |
| `JWT_REFRESH_SECRET`       | Refresh token signing secret         | (secret)                                 |
| `SESSION_SECRET`           | Express session secret               | (secret)                                 |
| `ENCRYPTION_KEY`           | AES-256 key for SECRET-type settings | (secret)                                 |
| `NODE_ENV`                 | Runtime environment                  | `production`                             |
| `PORT`                     | HTTP server port                     | `3000`                                   |
| `LOG_LEVEL`                | Pino log level                       | `info`                                   |
| `SENTRY_DSN`               | Sentry error tracking DSN            | (URL)                                    |
| `CORS_ORIGIN`              | Allowed CORS origins                 | `https://accreditation.africanunion.org` |

### 8.3 Default Values Catalog

See [Appendix A](#a-master-settings-registry) for the complete default values catalog organized by category.

---

## 9. Testing Strategy

### 9.1 Settings Resolution Tests

```typescript
describe("Settings Resolution", () => {
  describe("hierarchy resolution", () => {
    it("should return event override when all levels exist", async () => {
      await seedSetting("catering.bufferPercentage", "10", { scope: "GLOBAL" });
      await seedSetting("catering.bufferPercentage", "12", { scope: "TENANT", tenantId: "t1" });
      await seedSetting("catering.bufferPercentage", "15", {
        scope: "EVENT",
        tenantId: "t1",
        eventId: "e1",
      });

      const result = await settings.get("catering.bufferPercentage", {
        tenantId: "t1",
        eventId: "e1",
      });
      expect(result).toBe(15);
    });

    it("should fall back to tenant when no event override exists", async () => {
      await seedSetting("catering.bufferPercentage", "10", { scope: "GLOBAL" });
      await seedSetting("catering.bufferPercentage", "12", { scope: "TENANT", tenantId: "t1" });

      const result = await settings.get("catering.bufferPercentage", {
        tenantId: "t1",
        eventId: "e1",
      });
      expect(result).toBe(12);
    });

    it("should fall back to global when no tenant override exists", async () => {
      await seedSetting("catering.bufferPercentage", "10", { scope: "GLOBAL" });

      const result = await settings.get("catering.bufferPercentage", {
        tenantId: "t1",
        eventId: "e1",
      });
      expect(result).toBe(10);
    });

    it("should fall back to code default when no DB value exists", async () => {
      const result = await settings.get("catering.bufferPercentage", { tenantId: "t1" });
      expect(result).toBe(10); // Default from registry
    });
  });

  describe("type coercion", () => {
    it("should parse NUMBER types to numbers", async () => {
      await seedSetting("auth.maxLoginAttempts", "5", { scope: "GLOBAL" });
      const result = await settings.get("auth.maxLoginAttempts");
      expect(typeof result).toBe("number");
      expect(result).toBe(5);
    });

    it("should parse BOOLEAN types to booleans", async () => {
      await seedSetting("auth.requireTwoFactor", "true", { scope: "GLOBAL" });
      const result = await settings.get("auth.requireTwoFactor");
      expect(typeof result).toBe("boolean");
      expect(result).toBe(true);
    });

    it("should parse JSON types to objects/arrays", async () => {
      await seedSetting("upload.allowedImageTypes", '["jpeg","png"]', { scope: "GLOBAL" });
      const result = await settings.get("upload.allowedImageTypes");
      expect(result).toEqual(["jpeg", "png"]);
    });
  });

  describe("validation", () => {
    it("should reject values outside validation range", async () => {
      await expect(
        settings.set("auth.maxLoginAttempts", 0, { userId: "admin", reason: "test" }),
      ).rejects.toThrow();
    });

    it("should reject invalid email format for email settings", async () => {
      await expect(
        settings.set("email.senderAddress", "not-an-email", { userId: "admin" }),
      ).rejects.toThrow();
    });
  });
});
```

### 9.2 Feature Flag Tests

```typescript
describe("Feature Flags", () => {
  it("should return false for non-existent flags", async () => {
    const result = await evaluateFlag("feature.nonExistent", { tenantId: "t1" });
    expect(result).toBe(false);
  });

  it("should return tenant-specific flag over global", async () => {
    await seedFlag("feature.catering", { enabled: false, tenantId: null }); // Global: OFF
    await seedFlag("feature.catering", { enabled: true, tenantId: "t1" }); // Tenant: ON

    const result = await evaluateFlag("feature.catering", { tenantId: "t1" });
    expect(result).toBe(true);
  });

  it("should respect percentage rollout deterministically", async () => {
    await seedFlag("feature.newDashboard", {
      enabled: true,
      rolloutPercentage: 50,
      flagType: "percentage",
    });

    const user1Result = await evaluateFlag("feature.newDashboard", { userId: "user1" });
    const user1Again = await evaluateFlag("feature.newDashboard", { userId: "user1" });
    expect(user1Result).toBe(user1Again); // Deterministic
  });

  it("should check dependency flags", async () => {
    await seedFlag("feature.badgeModule", { enabled: false });
    await seedFlag("feature.digitalBadge", { enabled: true, dependsOnFlag: "feature.badgeModule" });

    const result = await evaluateFlag("feature.digitalBadge", { tenantId: "t1" });
    expect(result).toBe(false); // Dependency not met
  });

  it("should respect expiry date", async () => {
    await seedFlag("feature.tempPromo", { enabled: true, expiresAt: new Date("2025-01-01") });

    const result = await evaluateFlag("feature.tempPromo", { tenantId: "t1" });
    expect(result).toBe(false); // Expired
  });
});
```

### 9.3 Settings Migration Tests

```typescript
describe("Settings Migrations", () => {
  it("should apply pending migrations in order", async () => {
    const runner = new SettingsMigrationRunner();
    const result = await runner.runPending();

    expect(result.applied).toHaveLength(3);
    expect(result.applied).toEqual(["001", "002", "003"]);
  });

  it("should skip already-applied migrations", async () => {
    await db.settingsMigration.create({
      data: {
        version: "001",
        name: "initial",
        operations: [],
        checksum: "abc",
        status: "applied",
        appliedAt: new Date(),
      },
    });

    const runner = new SettingsMigrationRunner();
    const result = await runner.runPending();

    expect(result.applied).not.toContain("001");
  });

  it("should rollback a migration", async () => {
    await applyMigration("003");
    const slaAfterApply = await settings.get("workflow.defaultSlaHours");
    expect(slaAfterApply).toBe(48);

    await rollbackMigration("003", "admin");
    const slaAfterRollback = await settings.get("workflow.defaultSlaHours");
    expect(slaAfterRollback).toBe(24);
  });

  it("should detect checksum mismatch on tampered migrations", async () => {
    await db.settingsMigration.update({
      where: { version: "001" },
      data: { checksum: "tampered" },
    });

    await expect(runner.verifyIntegrity()).rejects.toThrow("Checksum mismatch");
  });
});
```

### 9.4 Drift Detection Tests

```typescript
describe("Configuration Drift Detection", () => {
  it("should detect settings with no audit trail", async () => {
    // Manually insert a setting without going through the SDK (simulating direct DB edit)
    await db.systemSetting.create({
      data: {
        key: "auth.maxLoginAttempts",
        value: "99",
        type: "NUMBER",
        scope: "GLOBAL",
        category: "auth",
        label: "Max Login Attempts",
      },
    });

    const report = await detectDrift();

    expect(report.drifted).toHaveLength(1);
    expect(report.drifted[0].key).toBe("auth.maxLoginAttempts");
    expect(report.drifted[0].actualValue).toBe(99);
    expect(report.drifted[0].expectedValue).toBe(5);
    expect(report.drifted[0].severity).toBe("critical"); // auth is critical
  });

  it("should not flag intentional overrides with audit entries", async () => {
    await settings.set("auth.maxLoginAttempts", 3, { userId: "admin", reason: "Intentional" });

    const report = await detectDrift();
    const authDrift = report.drifted.find((d) => d.key === "auth.maxLoginAttempts");
    expect(authDrift).toBeUndefined(); // Has audit entry, so not drift
  });

  it("should auto-remediate safe settings", async () => {
    await db.systemSetting.create({
      data: {
        key: "cache.ttlMinutes",
        value: "999",
        type: "NUMBER",
        scope: "GLOBAL",
        category: "cache",
        label: "Cache TTL",
      },
    });

    const report = await detectDrift();
    const remediated = await autoRemediate(report.drifted);

    expect(remediated).toContain("cache.ttlMinutes");
    const value = await settings.get("cache.ttlMinutes");
    expect(value).toBe(5); // Restored to default
  });

  it("should NOT auto-remediate security settings", async () => {
    await db.systemSetting.create({
      data: {
        key: "auth.maxLoginAttempts",
        value: "99",
        type: "NUMBER",
        scope: "GLOBAL",
        category: "auth",
        label: "Max Login Attempts",
      },
    });

    const report = await detectDrift();
    const remediated = await autoRemediate(report.drifted);

    expect(remediated).not.toContain("auth.maxLoginAttempts");
  });
});
```

---

## 10. Security Considerations

### 10.1 Settings Access Control (Who Can Change What Level)

| Scope         | Who Can Read                                              | Who Can Write                                           |
| ------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| GLOBAL        | PLATFORM_ADMIN, TENANT_ADMIN (read-only view of defaults) | PLATFORM_ADMIN only                                     |
| TENANT        | TENANT_ADMIN (own tenant), PLATFORM_ADMIN (any tenant)    | TENANT_ADMIN (own tenant), PLATFORM_ADMIN               |
| EVENT         | EVENT_MANAGER (own event), TENANT_ADMIN, PLATFORM_ADMIN   | EVENT_MANAGER (own event), TENANT_ADMIN, PLATFORM_ADMIN |
| USER          | User (own preferences only)                               | User (own preferences only)                             |
| Feature Flags | PLATFORM_ADMIN, TENANT_ADMIN (read-only)                  | PLATFORM_ADMIN only                                     |

**Enforcement:**

```typescript
function authorizeSettingWrite(
  user: User,
  scope: SettingScope,
  tenantId?: string,
  eventId?: string,
): boolean {
  if (user.role === "PLATFORM_ADMIN") return true;

  if (scope === "GLOBAL") return false; // Only platform admins

  if (scope === "TENANT" && user.role === "TENANT_ADMIN") {
    return user.tenantId === tenantId; // Own tenant only
  }

  if (scope === "EVENT" && (user.role === "EVENT_MANAGER" || user.role === "TENANT_ADMIN")) {
    return user.tenantId === tenantId; // Own tenant's events only
  }

  return false;
}
```

### 10.2 Sensitive Settings Encryption

Settings marked with `isSecret: true` or `type: SECRET` are encrypted at rest using AES-256-GCM. The encryption key is stored in the `ENCRYPTION_KEY` environment variable and never in the database.

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function encryptSettingValue(plaintext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

function decryptSettingValue(ciphertext: string): string {
  const [ivHex, tagHex, encrypted] = ciphertext.split(":");
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

Secret settings are:

- Encrypted before storage in the database.
- Decrypted only when read by the application.
- Masked in the UI (showing `********` with a "Reveal" button that requires re-authentication).
- Excluded from settings exports unless the caller has `PLATFORM_ADMIN` role.
- Never logged in audit entries (previous/new values show `[REDACTED]`).

### 10.3 Settings Audit Trail

Every settings change is logged with full context:

- **Who**: `changedBy` (user ID), `changedByName`, `changedByRole`.
- **When**: `changedAt` timestamp.
- **What**: `settingKey`, `previousValue`, `newValue`.
- **Where**: `tenantId`, `eventId`, `scope`.
- **Why**: `changeReason` (required for GLOBAL scope changes, optional for others).
- **How**: `changeSource` (manual, import, migration, auto_remediation, api).
- **From where**: `ipAddress` of the requester.

Audit logs are immutable -- they cannot be updated or deleted through the application. They are retained for the duration specified by `compliance.dataRetentionDays`.

### 10.4 Feature Flag Security

- Feature flags are only writable by `PLATFORM_ADMIN` users.
- Disabled features return HTTP 404 (not 403) to avoid information leakage about what features exist.
- The `featureGate` middleware is applied at the route level, so even direct API calls cannot bypass flag checks.
- Percentage rollout uses a deterministic hash, so users cannot game the system by retrying requests.
- Flag evaluation results are never cached on the client side to prevent stale access after flag changes.

---

## 11. Performance Requirements

### 11.1 Settings Read Latency

| Scenario                           | Target | Strategy                                                         |
| ---------------------------------- | ------ | ---------------------------------------------------------------- |
| Cached setting read                | < 1ms  | In-memory Map lookup                                             |
| Cache miss (DB read)               | < 10ms | Single indexed query on unique constraint                        |
| Full resolution chain (all levels) | < 15ms | Maximum 4 sequential queries (optimizable to 1 with batch query) |
| Feature flag evaluation            | < 5ms  | Single query with tenant priority ordering                       |

### 11.2 Cache Invalidation Latency

| Scenario                                   | Target  | Strategy                           |
| ------------------------------------------ | ------- | ---------------------------------- |
| Local cache invalidation                   | < 1ms   | Direct Map delete                  |
| Cross-process invalidation (Redis pub/sub) | < 50ms  | Redis PUBLISH + local subscriber   |
| Client-side invalidation (SSE)             | < 200ms | SSE broadcast to connected clients |

### 11.3 Settings API Response Times

| Endpoint                                 | Target  | Notes                                  |
| ---------------------------------------- | ------- | -------------------------------------- |
| `GET /api/settings` (list)               | < 100ms | Paginated, indexed by category         |
| `GET /api/settings/:key` (single)        | < 20ms  | Single row by unique key               |
| `PUT /api/settings/:key` (update)        | < 50ms  | Write + cache invalidation + audit log |
| `GET /api/settings/:key/resolve` (debug) | < 30ms  | Full chain resolution                  |
| `POST /api/settings/import` (bulk)       | < 2s    | Transaction with batch insert          |
| `GET /api/settings/export`               | < 500ms | JSON serialization of filtered rows    |

**Optimization strategies:**

- Batch settings reads: When a page needs 10+ settings, use `settings.getMany(keys, context)` to issue a single `WHERE key IN (...)` query instead of 10 individual queries.
- Warm cache on startup: Pre-load all global settings into the cache during application boot.
- Lazy tenant cache: Tenant/event settings are cached on first access and invalidated on change.

---

## 12. Open Questions & Decisions

| #   | Question                                                                                     | Options                                                                                  | Status                                    |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Should settings support JSON Schema validation in addition to simple rules?                  | A) Keep simple `validationRule` JSON. B) Full JSON Schema per setting.                   | Decided: A (simpler, covers 95% of cases) |
| 2   | Should we support tenant-scoped feature flags that tenants can toggle themselves?            | A) Platform admin only. B) Allow tenant admins for non-core flags.                       | Open                                      |
| 3   | Should settings migrations run automatically on deploy or require manual trigger?            | A) Auto-run in CI/CD. B) Manual `npx settings-migrate` command. C) Both with flag.       | Leaning: C                                |
| 4   | How aggressive should auto-remediation be?                                                   | A) Only cache/pagination settings. B) Any non-security setting. C) Never auto-remediate. | Decided: A (conservative)                 |
| 5   | Should we add a settings approval workflow for critical changes?                             | A) Direct save. B) Require second admin approval for auth/compliance changes.            | Open                                      |
| 6   | Should settings support A/B testing (returning different values for different user cohorts)? | A) Out of scope -- use feature flags. B) Build into settings SDK.                        | Decided: A                                |
| 7   | Should event-level settings be cloneable when cloning an event?                              | A) Yes, clone all overrides. B) Clone selectively. C) Start fresh.                       | Leaning: B                                |
| 8   | Should the audit log record IP address and user agent?                                       | A) IP only. B) Both. C) Neither for privacy.                                             | Decided: A                                |

---

## Appendix

### A. Master Settings Registry

The following table catalogs every settings key across all modules. This is the authoritative reference for the platform's configuration surface.

#### Authentication & Security

| Key                             | Type    | Default | Scopes         | Description                                            |
| ------------------------------- | ------- | ------- | -------------- | ------------------------------------------------------ |
| `auth.maxLoginAttempts`         | NUMBER  | 5       | GLOBAL, TENANT | Failed attempts before lockout                         |
| `auth.lockoutDurationMinutes`   | NUMBER  | 30      | GLOBAL, TENANT | Minutes locked out after max attempts                  |
| `auth.autoResetAfterMinutes`    | NUMBER  | 60      | GLOBAL, TENANT | Minutes until failed attempt counter resets            |
| `auth.maxLockCount`             | NUMBER  | 3       | GLOBAL, TENANT | Lockouts before permanent lock (admin unlock required) |
| `auth.sessionExpirationDays`    | NUMBER  | 30      | GLOBAL, TENANT | Days until session expires                             |
| `auth.inactivityTimeoutMinutes` | NUMBER  | 60      | GLOBAL, TENANT | Minutes of inactivity before forced logout             |
| `auth.bcryptSaltRounds`         | NUMBER  | 10      | GLOBAL         | Password hashing strength                              |
| `auth.requireTwoFactor`         | BOOLEAN | false   | GLOBAL, TENANT | Force 2FA for all users                                |
| `auth.passwordMinLength`        | NUMBER  | 8       | GLOBAL, TENANT | Minimum password characters                            |
| `auth.passwordRequireSpecial`   | BOOLEAN | true    | GLOBAL, TENANT | Require special characters in passwords                |

#### Email & Communication

| Key                          | Type    | Default                                   | Scopes         | Description                       |
| ---------------------------- | ------- | ----------------------------------------- | -------------- | --------------------------------- |
| `email.senderAddress`        | STRING  | DoNotReply@accreditation.africanunion.org | GLOBAL, TENANT | From address for all emails       |
| `email.senderName`           | STRING  | Accreditation System                      | GLOBAL, TENANT | From name displayed               |
| `email.sendTimeoutSeconds`   | NUMBER  | 180                                       | GLOBAL         | Timeout for email delivery        |
| `email.maxRetriesPerMessage` | NUMBER  | 3                                         | GLOBAL         | Retry count for failed deliveries |
| `email.dailySendLimit`       | NUMBER  | 10000                                     | GLOBAL, TENANT | Max emails per day (rate limit)   |
| `sms.enabled`                | BOOLEAN | false                                     | GLOBAL, TENANT | Enable SMS notifications          |
| `sms.providerApiKey`         | SECRET  | --                                        | GLOBAL         | SMS provider credentials          |
| `push.enabled`               | BOOLEAN | false                                     | GLOBAL, TENANT | Enable push notifications         |

#### File Uploads & Storage

| Key                           | Type   | Default                     | Scopes                | Description                      |
| ----------------------------- | ------ | --------------------------- | --------------------- | -------------------------------- |
| `upload.maxImageSizeMB`       | NUMBER | 3                           | GLOBAL, TENANT, EVENT | Maximum image file size in MB    |
| `upload.maxDocumentSizeMB`    | NUMBER | 10                          | GLOBAL, TENANT, EVENT | Maximum document file size in MB |
| `upload.maxCsvSizeMB`         | NUMBER | 5                           | GLOBAL, TENANT        | Maximum CSV import file size     |
| `upload.allowedImageTypes`    | JSON   | ["jpeg","jpg","png","webp"] | GLOBAL, TENANT        | Accepted image MIME types        |
| `upload.allowedDocumentTypes` | JSON   | ["pdf","doc","docx"]        | GLOBAL, TENANT        | Accepted document types          |
| `upload.photoMinWidth`        | NUMBER | 400                         | GLOBAL, TENANT        | Minimum photo width in pixels    |
| `upload.photoMinHeight`       | NUMBER | 500                         | GLOBAL, TENANT        | Minimum photo height in pixels   |
| `storage.containerName`       | STRING | accreditation               | GLOBAL                | Azure Blob container name        |

#### Workflow & Approval

| Key                                   | Type    | Default | Scopes                | Description                               |
| ------------------------------------- | ------- | ------- | --------------------- | ----------------------------------------- |
| `workflow.defaultSlaHours`            | NUMBER  | 24      | GLOBAL, TENANT, EVENT | Default hours for step completion         |
| `workflow.slaWarningThresholdPercent` | NUMBER  | 75      | GLOBAL, TENANT, EVENT | % of SLA before warning indicator         |
| `workflow.autoEscalateOnSlaBreach`    | BOOLEAN | false   | GLOBAL, TENANT, EVENT | Auto-escalate when SLA breached           |
| `workflow.batchApprovalLimit`         | NUMBER  | 100     | GLOBAL, TENANT        | Max participants in one batch action      |
| `workflow.requireRejectionReason`     | BOOLEAN | true    | GLOBAL, TENANT        | Force validators to give rejection reason |
| `workflow.allowBypassWithoutTarget`   | BOOLEAN | false   | GLOBAL, TENANT        | Allow bypass even if no target step       |

#### Badge & Printing

| Key                             | Type    | Default | Scopes                | Description                            |
| ------------------------------- | ------- | ------- | --------------------- | -------------------------------------- |
| `badge.maxReprintCount`         | NUMBER  | 3       | GLOBAL, TENANT, EVENT | Maximum badge reprints per participant |
| `badge.reprintWarningThreshold` | NUMBER  | 2       | GLOBAL, TENANT        | Reprint count that triggers warning    |
| `badge.defaultDpi`              | NUMBER  | 150     | GLOBAL, TENANT        | Badge rendering resolution             |
| `badge.enableDigitalBadge`      | BOOLEAN | false   | GLOBAL, TENANT        | Enable Apple/Google Wallet badges      |
| `badge.printQueueBatchSize`     | NUMBER  | 20      | GLOBAL, TENANT, EVENT | Badges per print batch                 |

#### Catering

| Key                              | Type    | Default | Scopes                | Description                            |
| -------------------------------- | ------- | ------- | --------------------- | -------------------------------------- |
| `catering.bufferPercentage`      | NUMBER  | 10      | GLOBAL, TENANT, EVENT | Meal count buffer for over-ordering    |
| `catering.allowDoubleCollection` | BOOLEAN | false   | GLOBAL, TENANT, EVENT | Allow same meal voucher twice          |
| `catering.voucherExpiryMinutes`  | NUMBER  | 30      | GLOBAL, TENANT, EVENT | Minutes after meal end voucher expires |
| `catering.vendorPortalEnabled`   | BOOLEAN | true    | GLOBAL, TENANT        | Enable vendor read-only dashboard      |
| `catering.vendorLinkExpiryHours` | NUMBER  | 168     | GLOBAL, TENANT        | Hours until vendor portal link expires |

#### Transport

| Key                             | Type    | Default | Scopes                | Description                             |
| ------------------------------- | ------- | ------- | --------------------- | --------------------------------------- |
| `transport.pickupBufferMinutes` | NUMBER  | 45      | GLOBAL, TENANT, EVENT | Minutes after flight arrival for pickup |
| `transport.noShowAlertMinutes`  | NUMBER  | 60      | GLOBAL, TENANT, EVENT | Minutes without pickup before alert     |
| `transport.gpsTrackingEnabled`  | BOOLEAN | false   | GLOBAL, TENANT        | Enable real-time vehicle tracking       |
| `transport.shuttleMinFrequency` | NUMBER  | 15      | GLOBAL, TENANT, EVENT | Minimum minutes between shuttle runs    |

#### Accommodation

| Key                                  | Type    | Default | Scopes                | Description                                |
| ------------------------------------ | ------- | ------- | --------------------- | ------------------------------------------ |
| `accommodation.autoAssignOnApproval` | BOOLEAN | true    | GLOBAL, TENANT, EVENT | Auto-assign room when participant approved |
| `accommodation.noShowReleaseHours`   | NUMBER  | 24      | GLOBAL, TENANT, EVENT | Hours after check-in date to release room  |
| `accommodation.roomingListFormat`    | ENUM    | PDF     | GLOBAL, TENANT        | PDF or EXCEL for rooming list export       |

#### Waitlist

| Key                                 | Type    | Default | Scopes                | Description                                   |
| ----------------------------------- | ------- | ------- | --------------------- | --------------------------------------------- |
| `waitlist.enabled`                  | BOOLEAN | true    | GLOBAL, TENANT, EVENT | Waitlist instead of reject when quota full    |
| `waitlist.promotionDeadlineHours`   | NUMBER  | 48      | GLOBAL, TENANT, EVENT | Hours to confirm after promotion              |
| `waitlist.maxPositionNotifications` | NUMBER  | 5       | GLOBAL, TENANT        | Max position-change notifications per entry   |
| `waitlist.autoExpireOnEventStart`   | BOOLEAN | true    | GLOBAL, TENANT, EVENT | Expire all waitlist entries when event starts |

#### Incident & Safety

| Key                               | Type    | Default | Scopes                | Description                         |
| --------------------------------- | ------- | ------- | --------------------- | ----------------------------------- |
| `incident.autoEscalateMinutes`    | NUMBER  | 15      | GLOBAL, TENANT, EVENT | Minutes before auto-escalation      |
| `incident.criticalAlertSms`       | BOOLEAN | true    | GLOBAL, TENANT        | Send SMS for CRITICAL incidents     |
| `incident.requireResolutionNotes` | BOOLEAN | true    | GLOBAL, TENANT        | Force resolution notes when closing |

#### Data & Compliance

| Key                               | Type    | Default | Scopes         | Description                                |
| --------------------------------- | ------- | ------- | -------------- | ------------------------------------------ |
| `compliance.passportExpiryMonths` | NUMBER  | 6       | GLOBAL, TENANT | Months before event passport must be valid |
| `compliance.dataRetentionDays`    | NUMBER  | 365     | GLOBAL, TENANT | Default days to retain participant data    |
| `compliance.gdprEnabled`          | BOOLEAN | true    | GLOBAL, TENANT | Enable GDPR consent tracking and erasure   |
| `compliance.autoComplianceCheck`  | BOOLEAN | true    | GLOBAL, TENANT | Run compliance check daily                 |

#### System & Infrastructure

| Key                          | Type    | Default                           | Scopes         | Description                       |
| ---------------------------- | ------- | --------------------------------- | -------------- | --------------------------------- |
| `cache.ttlMinutes`           | NUMBER  | 5                                 | GLOBAL         | Default cache duration in minutes |
| `pagination.defaultPageSize` | NUMBER  | 10                                | GLOBAL, TENANT | Default items per page            |
| `maintenance.enabled`        | BOOLEAN | false                             | GLOBAL         | Block non-admin access            |
| `maintenance.message`        | STRING  | System temporarily unavailable... | GLOBAL         | Message shown during maintenance  |
| `backup.retentionDays`       | NUMBER  | 30                                | GLOBAL         | Days to keep backups              |
| `backup.maxCount`            | NUMBER  | 10                                | GLOBAL         | Maximum backup files              |
| `otp.validityMinutes`        | NUMBER  | 10                                | GLOBAL         | Minutes OTP code is valid         |

### B. Feature Flag Catalog

| Flag Key                        | Description                                           | Default | Type            |
| ------------------------------- | ----------------------------------------------------- | ------- | --------------- |
| `feature.bilateralScheduler`    | Bilateral meeting scheduling for head-of-state events | OFF     | tenant_targeted |
| `feature.digitalBadge`          | Apple/Google Wallet digital badge passes              | OFF     | tenant_targeted |
| `feature.carbonTracking`        | Carbon footprint tracking for events                  | OFF     | tenant_targeted |
| `feature.cateringModule`        | Meal planning, dietary aggregation, meal vouchers     | ON      | boolean         |
| `feature.transportModule`       | Airport transfers, shuttle scheduling, vehicle fleet  | ON      | boolean         |
| `feature.surveyModule`          | Post-event survey builder and sentiment analysis      | OFF     | tenant_targeted |
| `feature.kioskMode`             | Self-service participant terminal                     | ON      | boolean         |
| `feature.companionProgram`      | Companion/spouse registration and activity program    | OFF     | tenant_targeted |
| `feature.newDashboard`          | Redesigned analytics dashboard (gradual rollout)      | OFF     | percentage      |
| `feature.bulkOperations`        | CSV import/export and batch actions center            | ON      | boolean         |
| `feature.offlineMode`           | Service Worker + IndexedDB for offline badge scanning | OFF     | percentage      |
| `feature.webhooks`              | Event-driven webhook subscriptions for integrations   | OFF     | tenant_targeted |
| `feature.customObjects`         | Custom object definitions and records                 | OFF     | tenant_targeted |
| `feature.parkingZones`          | Parking zone management and permit generation         | OFF     | tenant_targeted |
| `feature.staffManagement`       | Staff and volunteer roster/scheduling                 | OFF     | tenant_targeted |
| `feature.certificateGeneration` | Certificate designer and bulk generation              | OFF     | tenant_targeted |

### C. Settings Migration Runbook

**Running pending migrations:**

```bash
# In development
npx ts-node scripts/settings-migrate.ts --direction up

# In CI/CD (as part of deploy pipeline, after database migrations)
npm run settings:migrate

# Preview without applying
npm run settings:migrate -- --dry-run
```

**Rolling back a migration:**

```bash
# Rollback the latest applied migration
npm run settings:migrate -- --direction down --version 003

# Rollback to a specific version
npm run settings:migrate -- --direction down --target 001
```

**Creating a new migration:**

```bash
# Generate migration file from template
npm run settings:migrate:create -- --name "increase-batch-limit"
# Creates: migrations/settings/004-increase-batch-limit.ts
```

**Verifying migration integrity:**

```bash
# Check that all applied migrations match their stored checksums
npm run settings:migrate -- --verify
```

**Migration best practices:**

1. Always write both `up()` and `down()` functions.
2. Never delete a migration file after it has been applied to production.
3. Test migrations in CI before deployment (see Section 9.3).
4. Include a `changeReason` that references the migration version for audit trail clarity.
5. Keep migrations small and focused -- one logical change per migration.
6. Never modify settings that a tenant admin might have intentionally overridden at the tenant level from a global migration. Use scope-aware logic.

---

_This module document is the authoritative specification for the settings and configuration subsystem. All modules depend on the patterns and APIs defined here for reading, writing, and gating configurable behavior across the multi-tenant accreditation platform._
