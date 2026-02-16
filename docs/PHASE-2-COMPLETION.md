# Phase 2: Dynamic UI & Real-Time — Completion Report

> **Started:** 2026-02-16
> **Tasks completed:** P2-00, P2-01, P2-02, P2-03, P2-04, P2-05, P2-06, P2-07, P2-08, P2-09, P2-10, P2-11

---

## Table of Contents

1. [Overview](#1-overview)
2. [P2-00 — Settings & Feature Flags](#2-p2-00--settings--feature-flags)
3. [P2-01 — FormTemplate Model](#3-p2-01--formtemplate-model)
4. [P2-02 — Three-Panel Designer UI](#4-p2-02--three-panel-designer-ui)
5. [P2-03 — Sections & Pages](#5-p2-03--sections--pages)
6. [P2-04 — Drag-and-Drop (DnD Kit)](#6-p2-04--drag-and-drop-dnd-kit)
7. [P2-05 — Conditional Visibility Rules](#7-p2-05--conditional-visibility-rules)
8. [P2-06 — Preview Mode](#8-p2-06--preview-mode)
9. [P2-07 — Section Templates](#9-p2-07--section-templates)
10. [P2-08 — Skeleton Loading States](#10-p2-08--skeleton-loading-states)
11. [P2-09 — SSE Real-Time Updates](#11-p2-09--sse-real-time-updates)
12. [P2-10 — Notification System](#12-p2-10--notification-system)
13. [P2-11 — Global Search](#13-p2-11--global-search)

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

---

## 3. P2-01 — FormTemplate Model

### What This Task Does

Adds the persistence layer for the visual form designer: `FormTemplate` and `FormVersion` Prisma models, TypeScript types for the form definition JSON structure, Zod validation schemas, a CRUD service layer with publish/clone operations, and RESTful API routes gated by the `FF_VISUAL_FORM_DESIGNER` feature flag.

### Architecture

**FormTemplate** stores a reusable form design tied to a tenant/event/participantType combination. The `definition` JSONB column holds the full page/section/field layout as a `FormDefinition` structure. The `version` counter tracks how many times the template has been published.

**FormVersion** creates an immutable snapshot each time a template is published, including a SHA-256 `changeHash` of the definition JSON for change detection.

**Data flow:**

```
Designer UI → API route → Zod validation → Service layer → Prisma → PostgreSQL
                                                 ↓
                                          AuditLog entry
```

### Files Created

| File                                               | Purpose                                                                                                                                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/types/form-designer.ts`                       | TypeScript interfaces for `FormDefinition`, `FormSettings`, `FormPage`, `FormSection`, `FormFieldPlacement`, `VisibilityCondition`, `ConditionOperator`                                                                                         |
| `app/config/form-templates.ts`                     | Limits config: `maxPerEvent` (20), `maxNameLength` (100), `maxDescriptionLength` (500)                                                                                                                                                          |
| `app/lib/schemas/form-template.ts`                 | Zod schemas: `createFormTemplateSchema`, `updateFormTemplateSchema`, `cloneFormTemplateSchema`, `formDefinitionSchema` (recursive visibility conditions)                                                                                        |
| `app/services/form-templates.server.ts`            | Service layer: `listFormTemplates`, `getFormTemplate`, `createFormTemplate`, `updateFormTemplate`, `deleteFormTemplate` (soft), `publishFormTemplate` (version bump + SHA-256 hash), `cloneFormTemplate` (deep copy), `FormTemplateError` class |
| `app/routes/api/v1/form-templates/index.tsx`       | GET list + POST create, feature-flag gated                                                                                                                                                                                                      |
| `app/routes/api/v1/form-templates/$id.tsx`         | GET single + PUT update + DELETE (soft), feature-flag gated                                                                                                                                                                                     |
| `app/routes/api/v1/form-templates/$id.publish.tsx` | POST publish (bumps version, creates FormVersion snapshot)                                                                                                                                                                                      |
| `app/routes/api/v1/form-templates/$id.clone.tsx`   | POST clone (deep copy with new name)                                                                                                                                                                                                            |

### Files Modified

| File                            | Change                                                                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`          | Added `FormTemplate` and `FormVersion` models with indexes and unique constraints; added `formTemplates` relation arrays to `Tenant`, `Event`, `ParticipantType` |
| `app/utils/api-error.server.ts` | Added `FormTemplateError` case to `formatErrorResponse()`                                                                                                        |
| `prisma/seed.ts`                | Added 4 form permissions (`form:create`, `form:read`, `form:update`, `form:delete`); added `form:read` to VIEWER role                                            |

### Database Migration

Migration `20260216115839_add_form_template_and_version` creates two tables:

```sql
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantTypeId" TEXT,
    "createdBy" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FormVersion" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "changeHash" TEXT,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormVersion_pkey" PRIMARY KEY ("id")
);
```

Indexes: `FormTemplate(tenantId, eventId)`, `FormTemplate(tenantId, eventId, isActive)`, unique on `FormTemplate(tenantId, eventId, participantTypeId, name)`. `FormVersion(formTemplateId)`, unique on `FormVersion(formTemplateId, version)`.

### Seeded Data

**4 new permissions** (total now 25): `form:create`, `form:read`, `form:update`, `form:delete` — all assigned to ADMIN role automatically via the existing `permissionDefs` → ADMIN mapping. `form:read` also added to VIEWER role.

### Verification Results

| Check                    | Result                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| `npx prisma migrate dev` | Migration `20260216115839_add_form_template_and_version` applied |
| `npx prisma db seed`     | 25 permissions seeded                                            |
| `npm run typecheck`      | Zero errors                                                      |
| `npm run test`           | 332/332 tests passing                                            |

### Notable Decisions

1. **Soft delete via `isActive` flag** instead of `deletedAt` timestamp. The plan specified `isActive=false` for deletion, which is consistent with the form template lifecycle (templates can be deactivated and reactivated).

2. **SHA-256 changeHash on publish** — each `FormVersion` snapshot includes a hash of the definition JSON, enabling quick change detection without deep comparison.

3. **Feature flag gating on all routes** — every API route checks `FF_VISUAL_FORM_DESIGNER` before proceeding. This ensures the form designer can be rolled out incrementally per tenant/role/user.

4. **Recursive Zod schema for visibility conditions** — `visibilityConditionSchema` uses `z.lazy()` to support arbitrarily nested `CompoundCondition` trees within `SimpleCondition` leaves.

5. **FormFieldPlacement references `fieldDefinitionId`** (not embedded field config) — the form designer only arranges field references; actual field metadata lives in `FieldDefinition` (Module 02). This enforces the separation of "what to collect" vs "how the form looks".

---

## 4. P2-02 — Three-Panel Designer UI

### What This Task Does

Builds the visual form designer shell: a per-event form list page, a three-panel designer layout (field palette / design canvas / properties panel), core state management with undo/redo, debounced auto-save, toolbar with keyboard shortcuts, cross-event forms list, and navigation updates. Drag-and-drop is not included (deferred to P2-04).

### Architecture

**Designer state management:**

```
useFormDesigner(initialDefinition)
  → useReducer(designerReducer, ...) + undo/redo stacks (max 50)
  → Returns state + action helpers (addPage, addSection, addField, etc.)

useAutosave({ id, definition, isDirty })
  → Debounced PUT to /api/v1/form-templates/{id} (2s)
  → AbortController cancels inflight requests on new save
  → Status: saved | saving | unsaved | error
```

**Three-panel layout:**

```
┌──────────────────────────────────────────────────┐
│ DesignerToolbar (Back|Name|Save|Publish|Undo|...)│
├──────────┬────────────────────────┬──────────────┤
│ Field    │ Design Canvas          │ Properties   │
│ Palette  │ ┌──────────────────┐   │ Panel        │
│ (250px)  │ │ Page Tabs        │   │ (320px)      │
│ - Search │ │ Section Cards    │   │ - General    │
│ - Groups │ │ Field Cards      │   │ - Layout     │
│ - Click  │ └──────────────────┘   │ - Visibility │
│   to add │                        │              │
└──────────┴────────────────────────┴──────────────┘
```

On mobile (< 768px), palette and properties become Sheet drawers.

### Files Created (14)

| File                                                  | Purpose                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/components/ui/tabs.tsx`                          | Radix UI Tabs wrapper (Root, List, Trigger, Content)                                                                                        |
| `app/types/designer-state.ts`                         | `DesignerState`, `DesignerAction` discriminated union, `ViewMode`, `SelectedElementType`                                                    |
| `app/hooks/use-form-designer.ts`                      | Core reducer + undo/redo refs (max 50) + action helpers. Exports `designerReducer` for direct testing                                       |
| `app/hooks/use-autosave.ts`                           | Debounced PUT with AbortController, status tracking (saved/saving/unsaved/error)                                                            |
| `app/components/form-designer/field-type-icons.tsx`   | FieldDataType → lucide icon mapping + category grouping + labels                                                                            |
| `app/components/form-designer/autosave-indicator.tsx` | Colored dot + status text                                                                                                                   |
| `app/components/form-designer/designer-toolbar.tsx`   | Toolbar: Back, Save, Publish (useFetcher), Undo/Redo, ViewMode toggle, autosave indicator. Keyboard shortcuts: Ctrl+Z, Ctrl+Shift+Z, Ctrl+S |
| `app/components/form-designer/field-palette.tsx`      | Left panel (250px): search input, fields grouped by category with Collapsible, click-to-add                                                 |
| `app/components/form-designer/design-canvas.tsx`      | Center panel: page Tabs, section cards with column-based field grid, field cards with type icons, selection ring, empty states              |
| `app/components/form-designer/properties-panel.tsx`   | Right panel (320px): tabbed (General/Layout/Visibility), varies by selected element type (page/section/field)                               |
| `app/routes/admin/events/$eventId/forms/index.tsx`    | Per-event form list page: table with Name/Status/Version/ParticipantType/LastModified/Actions, Create/Clone/Delete via `_action`            |
| `app/routes/admin/events/$eventId/forms/$formId.tsx`  | Designer route: loads template + fieldDefinitions, orchestrates all panels + hooks, beforeunload warning, mobile Sheet drawers              |
| `app/routes/admin/events/forms.tsx`                   | Cross-event form list: all templates across events for tenant                                                                               |
| `app/hooks/__tests__/use-form-designer.test.ts`       | 22 unit tests for designerReducer covering all action types, immutability, edge cases                                                       |

### Files Modified (2)

| File                                | Change                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `app/config/navigation.ts`          | Added `{ title: "Forms", url: "/admin/events/forms" }` to Events children                                    |
| `app/routes/admin/events/index.tsx` | Added `formTemplates` to `_count` select, added form count display, added "Manage Forms" link to event cards |

### Key Patterns

- **Radix UI wrapping**: Tabs follows same `data-slot` + `cn()` pattern as Dialog, Collapsible, Sheet
- **Route loader/action**: `requirePermission` + `isFeatureEnabled(FF_VISUAL_FORM_DESIGNER)` + tenant isolation
- **useReducer + undo/redo**: Pure `designerReducer` function (exported for testing), undo/redo via ref stacks with max 50 cap, `structuredClone` for immutability
- **Auto-save**: `useAutosave` hook debounces with `setTimeout` (2s), cancels inflight with `AbortController`, tracks status
- **Mobile responsiveness**: `useIsMobile()` hook switches side panels to Sheet drawers
- **`useFetcher`**: Publish action uses non-navigating POST via fetcher
- **Click-to-add**: Field palette click adds field to first section of active page (DnD in P2-04)

### Verification Results

| Check               | Result                                    |
| ------------------- | ----------------------------------------- |
| `npm run typecheck` | Zero errors                               |
| `npm run test`      | 354/354 tests passing (22 new hook tests) |

---

## 5. P2-03 — Sections & Pages

### What This Task Does

Enhances the form designer canvas with polished section/page management: collapsible sections, delete confirmations, page context menus with inline rename, up/down section reordering, a proper 12-column CSS grid for field placement, visual column guidelines in empty sections, and page duplication.

### Features Implemented

| #   | Feature                        | Summary                                                                             |
| --- | ------------------------------ | ----------------------------------------------------------------------------------- |
| 1   | Collapsible sections on canvas | Chevron toggle in section header, respects `defaultCollapsed` setting               |
| 2   | Delete confirmation dialog     | Confirms before deleting section/page that contains fields                          |
| 3   | Page context menu              | `...` dropdown on active tab: Rename, Duplicate, Move Left/Right, Delete            |
| 4   | Inline page rename             | Double-click page tab to enter inline edit mode (Enter/blur saves, Escape cancels)  |
| 5   | Section header enhancements    | Column selector buttons (1-4), up/down reorder buttons                              |
| 6   | 12-column CSS grid             | `grid-cols-12` with `colSpan` mapping; new fields default to `12 / section.columns` |
| 7   | Visual column guidelines       | Faint dashed dividers in empty sections showing column layout                       |
| 8   | Reorder state actions          | `REORDER_PAGES` and `REORDER_SECTIONS` reducer actions with order re-indexing       |
| 9   | Page duplication               | Deep clone with new IDs for page, sections, and fields                              |

### Files Created (1)

| File                                              | Purpose                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `app/components/form-designer/confirm-dialog.tsx` | Reusable confirmation dialog (wraps Dialog, supports destructive variant) |

### Files Modified (5)

| File                                                 | Change                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/types/designer-state.ts`                        | Added `REORDER_PAGES` and `REORDER_SECTIONS` action types                                                                                                                                                                                                                                            |
| `app/hooks/use-form-designer.ts`                     | Reducer handlers for reorder actions (splice + re-index), added to `MUTATING_ACTIONS`, exported `reorderPages` and `reorderSections` helpers                                                                                                                                                         |
| `app/components/form-designer/design-canvas.tsx`     | Major rework: 12-col grid, collapsible sections via Radix Collapsible, page context menu via DropdownMenu, inline rename, section header controls (column selector + up/down buttons), empty grid column guidelines, delete confirmations                                                            |
| `app/components/form-designer/properties-panel.tsx`  | Added `defaultCollapsed` checkbox (visible when collapsible is checked), updated colSpan help text for 12-col grid                                                                                                                                                                                   |
| `app/routes/admin/events/$eventId/forms/$formId.tsx` | Destructured `reorderPages` and `reorderSections` from hook, added `handleDuplicatePage`, passed new props to DesignCanvas (`onUpdatePage`, `onDuplicatePage`, `onReorderPages`, `onUpdateSection`, `onReorderSections`), updated `handleAddField` to set default `colSpan` based on section columns |
| `app/hooks/__tests__/use-form-designer.test.ts`      | Added 7 tests: reorder pages (swap + re-index), invalid indices, same index no-op, reorder sections (swap + re-index), invalid section indices, non-existent page                                                                                                                                    |

### Key Patterns

- **Radix Collapsible** for section collapse/expand with controlled `open` state
- **Radix DropdownMenu** for page tab context menu
- **12-column grid**: `grid-cols-12` with `style={{ gridColumn: \`span ${span}\` }}`, default span = `12 / section.columns`
- **Delete confirmation**: Only shown when item contains fields; empty items delete immediately
- **Immutable reorder**: `structuredClone` + `splice` + re-index all `order` values

### Verification Results

| Check               | Result                                                     |
| ------------------- | ---------------------------------------------------------- |
| `npm run typecheck` | Zero errors                                                |
| `npm run test`      | 28/28 designer reducer tests passing (7 new reorder tests) |

---

## 6. P2-04 — Drag-and-Drop (DnD Kit)

### What This Task Does

Adds full drag-and-drop capability to the form designer using `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`. Fields can be dragged from the palette onto canvas sections, reordered within sections, moved between sections, and sections themselves can be reordered via drag. All operations integrate with the existing undo/redo system.

### Architecture

**DnD ID Scheme:**

```
palette:{fieldDefinitionId}  — Draggable palette items
field:{fieldPlacementId}     — Sortable field cards on canvas
section:{sectionId}          — Sortable section cards + droppable zones
```

**Sensor Configuration:**

- `PointerSensor` with 5px distance activation constraint
- `KeyboardSensor` with `sortableKeyboardCoordinates` for accessible keyboard drag
- `TouchSensor` with 200ms delay + 5px tolerance for mobile

**Collision Detection:**
Custom cascade: `pointerWithin` → `rectIntersection` → `closestCenter`. This ensures cross-container drops work reliably with nested sortable contexts.

**Nested SortableContexts:**

```
DndContext (root)
  └─ SortableContext (sections, verticalListSortingStrategy)
       ├─ SortableSection #1
       │    └─ SortableContext (fields, rectSortingStrategy)
       │         ├─ SortableField (field:abc)
       │         └─ SortableField (field:def)
       └─ SortableSection #2
            └─ SortableContext (fields, rectSortingStrategy)
                 └─ SortableField (field:ghi)
```

**Drag overlay:** A `DragOverlay` renders a ghost of the dragged item (section label or field card with icon), following the cursor with smooth 200ms ease animation.

### Files Created (3)

| File                                                    | Purpose                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/components/form-designer/dnd-designer-context.tsx` | Root `DndContext` wrapper with sensors, collision detection, drag event handlers (start/over/end/cancel), `DragOverlay`, ID parsing utilities (`makeSectionDndId`, `makeFieldDndId`, `makePaletteDndId`, `parseDndId`)                         |
| `app/components/form-designer/sortable-section.tsx`     | `SortableSection` — uses `useSortable` for section reorder + `useDroppable` as a field drop target, contains nested `SortableContext` for fields, drag handle with `GripVertical` icon, drop highlight, empty drop zone with column guidelines |
| `app/components/form-designer/sortable-field.tsx`       | `SortableField` — uses `useSortable` for field reorder/cross-section move, drag handle, CSS transform for smooth animations, 12-col grid spanning                                                                                              |

### Files Modified (3)

| File                                                 | Change                                                                                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/components/form-designer/design-canvas.tsx`     | Replaced static `SectionCard`/`FieldCard` with `SortableSection` + `SortableContext` for sections using `verticalListSortingStrategy`, removed inline section/field card components (now in separate files) |
| `app/components/form-designer/field-palette.tsx`     | Extracted `DraggablePaletteItem` sub-component using `useDraggable` hook, grip handle triggers drag while click still adds field                                                                            |
| `app/routes/admin/events/$eventId/forms/$formId.tsx` | Wrapped entire designer layout with `DndDesignerContext`, destructured `moveField` from hook, added `handleAddFieldFromPalette` callback for palette DnD drops with target section + order                  |

### Dependencies Added

| Package              | Version | Purpose                                                 |
| -------------------- | ------- | ------------------------------------------------------- |
| `@dnd-kit/core`      | ^6      | DnD context, sensors, collision detection, drag overlay |
| `@dnd-kit/sortable`  | ^10     | `useSortable`, `SortableContext`, sorting strategies    |
| `@dnd-kit/utilities` | ^3      | CSS transform utilities                                 |

### Key Patterns

- **Prefixed DnD IDs**: `section:`, `field:`, `palette:` prefixes disambiguate item types in shared DnD context
- **Dual role for sections**: Each `SortableSection` is both a sortable item (for section reorder) and a droppable zone (for receiving fields)
- **Drag handle isolation**: `{...listeners}` attached only to the grip handle element, not the entire card, so clicks/interactions on other buttons work normally
- **Palette → Canvas**: `useDraggable` on palette items (not `useSortable`), since palette items aren't sortable — they create new field placements when dropped
- **Touch support**: `TouchSensor` with 200ms delay prevents accidental drags on mobile scroll

### Verification Results

| Check               | Result                               |
| ------------------- | ------------------------------------ |
| `npm run typecheck` | Zero errors                          |
| `npm run test`      | 28/28 designer reducer tests passing |

---

## 7. P2-05 — Conditional Visibility Rules

### What This Task Does

Adds a visual condition builder to the form designer and a pure-function runtime evaluator for conditional visibility. Form pages, sections, and fields can have `visibleIf` conditions that show/hide elements based on other field values (e.g., show "Weapon Permit Number" only when "Carries Weapon" is true).

### Architecture

**Condition Data Model** (already defined in P2-01 types):

```
VisibilityCondition = SimpleCondition | CompoundCondition

SimpleCondition { type: "simple", field: string, operator: ConditionOperator, value: unknown }
CompoundCondition { type: "compound", operator: "and" | "or", conditions: VisibilityCondition[] }

ConditionOperator = "eq" | "neq" | "empty" | "notEmpty" | "gt" | "lt" | "gte" | "lte"
                  | "contains" | "in" | "notIn"
```

**Condition Evaluator** — Pure function usable on client and server:

```
evaluateCondition(condition, formValues) → boolean
  → undefined condition → true (always visible)
  → simple: evaluate operator against form value
  → compound AND: all children must be true
  → compound OR: at least one child must be true
```

**Operator filtering by field type:**

| Field Type                | Allowed Operators                             |
| ------------------------- | --------------------------------------------- |
| TEXT, EMAIL, URL, etc.    | eq, neq, empty, notEmpty, contains, in, notIn |
| NUMBER, DECIMAL, CURRENCY | eq, neq, empty, notEmpty, gt, lt, gte, lte    |
| BOOLEAN, TOGGLE           | eq, neq, empty, notEmpty                      |
| SELECT, RADIO, DROPDOWN   | eq, neq, empty, notEmpty, in, notIn           |
| DATE, DATETIME            | eq, neq, empty, notEmpty, gt, lt, gte, lte    |

**Condition Builder UI** — integrated into the Properties Panel's Visibility tab:

```
┌─────────────────────────────────┐
│ Show when: Name equals "Alice"  │  ← Preview
├─────────────────────────────────┤
│ When: [Name        ▾] [✕]      │  ← Field selector + remove
│ Is:   [equals      ▾]          │  ← Operator selector
│ Value:[Alice       ]            │  ← Type-appropriate input
├────── AND ──────────────────────┤  ← Toggle AND/OR
│ When: [Age         ▾] [✕]      │
│ Is:   [greater than▾]          │
│ Value:[18          ]            │
├─────────────────────────────────┤
│ [+ Add condition] [Clear all]   │
└─────────────────────────────────┘
```

### Files Created (2)

| File                                                 | Purpose                                                                                                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/lib/condition-evaluator.ts`                     | Pure function `evaluateCondition()` supporting all 11 operators, compound AND/OR with short-circuit, `getOperatorsForType()` for type-filtered operator lists, `OperatorInfo` metadata                      |
| `app/components/form-designer/condition-builder.tsx` | Visual rule builder: field selector dropdown, type-filtered operator selector, type-appropriate value inputs (text/number/date/boolean), compound AND/OR toggle, add/remove rules, natural-language preview |

### Files Modified (3)

| File                                                | Change                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/components/form-designer/properties-panel.tsx` | Replaced visibility tab placeholder with `ConditionBuilder` for all three element types (page, section, field). Added `PageVisibilityProperties`, `SectionVisibilityProperties`, `FieldVisibilityProperties` sub-components. Field visibility excludes self-reference via `excludeFieldId`. |
| `app/components/form-designer/sortable-field.tsx`   | Added amber `Eye` icon indicator when `field.visibleIf` is set                                                                                                                                                                                                                              |
| `app/components/form-designer/sortable-section.tsx` | Added amber `Eye` icon indicator next to section title when `section.visibleIf` is set                                                                                                                                                                                                      |

### Tests Created (1)

| File                                            | Tests                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/lib/__tests__/condition-evaluator.test.ts` | 33 tests covering: undefined conditions, eq/neq with string/number/null coercion, case-insensitive comparison, empty/notEmpty (null/undefined/string/array), all numeric operators (gt/lt/gte/lte) with coercion, contains (case-insensitive, null handling), in/notIn (array/non-array), compound AND/OR, empty compound, nested compound, unknown operator fallback, `getOperatorsForType()` for TEXT/NUMBER/BOOLEAN/SELECT/unknown types |

### Key Patterns

- **Pure evaluator function**: `evaluateCondition()` has no side effects and no dependencies — works identically on client and server for form rendering and server-side validation
- **Loose equality with coercion**: `"5" == 5`, `"true" == true`, case-insensitive strings — handles the reality that form values may be strings even for numeric/boolean fields
- **Type-filtered operators**: `getOperatorsForType()` maps field `dataType` to applicable operators (e.g., no "contains" for numbers, no "gt" for booleans)
- **Type-appropriate value inputs**: Boolean fields get a true/false dropdown, numbers get a number input, dates get a date picker, text gets a text input
- **Self-reference prevention**: Field visibility conditions exclude the field's own `fieldDefinitionId` from the field selector to prevent circular dependencies
- **Progressive compound building**: First condition is a `SimpleCondition`, adding a second wraps both in a `CompoundCondition`, removing back to one unwraps to `SimpleCondition`
- **Conditions stored in existing JSONB**: `visibleIf` is already part of `FormPage`, `FormSection`, and `FormFieldPlacement` types (defined in P2-01), and the Zod schema already validates recursive conditions via `z.lazy()`

### Verification Results

| Check               | Result                                                   |
| ------------------- | -------------------------------------------------------- |
| `npm run typecheck` | Zero errors                                              |
| `npm run test`      | 393/393 tests passing (33 new condition evaluator tests) |

---

## 8. P2-06 — Preview Mode

### What This Task Does

Adds a WYSIWYG preview mode to the form designer so admins can see exactly what participants will see. Three view modes are supported: Editor (full three-panel designer), Split (left canvas + right preview), and Preview (full-screen preview). The preview includes responsive device size simulation, multi-page wizard navigation, conditional visibility evaluation, section collapsing, and editable mock data for testing conditions.

### Architecture

**Three View Modes:**

```
┌─────────────────────────────────────────────────────────┐
│ Editor: [Palette] [Canvas] [Properties]                 │
│ Split:  [Canvas]           [Preview]                    │
│ Preview:         [Full-screen Preview]                  │
└─────────────────────────────────────────────────────────┘
```

**Device Size Simulation:**

| Device  | Width |
| ------- | ----- |
| Desktop | 100%  |
| Tablet  | 768px |
| Phone   | 375px |

**Preview Renderer — maps form definition to production-equivalent UI:**

```
FormPreview
  ├─ Toolbar (device toggle, close button)
  ├─ Preview Container (constrained to device width)
  │   ├─ Progress bar (wizard mode)
  │   ├─ PreviewPage
  │   │   └─ PreviewSection (collapsible, 12-col grid)
  │   │       └─ PreviewField (type-appropriate input)
  │   └─ Wizard navigation (Previous / Next / Submit)
  └─ Mock data state (editable values for testing conditions)
```

**Display Modes:**

- **Wizard** (default): One page at a time with progress bar and Previous/Next navigation
- **Single-page**: All pages stacked vertically
- **Accordion**: Collapsible pages, first page expanded by default

**Mock Data Generation:**

```
generateMockData(definition, fieldDefinitions) → Record<string, unknown>
  TEXT → "Sample text"
  NUMBER → 42
  BOOLEAN → true
  DATE → "2026-03-15"
  EMAIL → "example@email.com"
  ENUM → "" (empty, user selects)
  ...etc per field type
```

Mock data is generated once on mount and stored in component state. Users can edit values to test conditional visibility rules.

### Files Created (3)

| File                                            | Purpose                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/lib/form-preview-data.ts`                  | `generateMockData()` — generates type-appropriate mock values keyed by fieldDefinitionId, deduplicates across pages/sections                                                                                                                                                                                 |
| `app/components/form-designer/form-preview.tsx` | `FormPreview` component — full preview renderer with device size toggle, multi-page wizard navigation, conditional visibility via `evaluateCondition()`, collapsible sections, 12-col CSS grid, type-appropriate field inputs (mirrors production `FieldRenderer`/`ConformField` layout), editable mock data |
| `app/lib/__tests__/form-preview-data.test.ts`   | 5 tests for mock data generation: all types, type-appropriate values, unknown fields, deduplication, empty definition                                                                                                                                                                                        |

### Files Modified (1)

| File                                                 | Change                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/routes/admin/events/$eventId/forms/$formId.tsx` | Added `FormPreview` import. Restructured render to support three view modes: preview mode renders full-screen preview with toolbar, split mode replaces properties panel with live preview, editor mode unchanged. Preview receives live `state.definition` for real-time sync in split view. |

### Key Patterns

- **Real-time split sync**: The `FormPreview` receives `state.definition` directly from the `useFormDesigner` hook, so every editor change (field add/remove, property update, section reorder) immediately reflects in the split-view preview without any additional sync mechanism
- **Standalone preview renderer**: `PreviewField` mirrors the production `FieldRenderer` output (same field types, same visual layout) but without Conform bindings, using plain controlled inputs with mock data state
- **12-column grid in preview**: Matches the canvas grid — `grid-cols-12` with `colSpan` mapping, so the preview shows the exact same layout as the designer
- **Conditional visibility in preview**: Uses `evaluateCondition()` from P2-05 to show/hide pages, sections, and fields based on mock data values. Users can edit mock values to test different visibility scenarios
- **Device size simulation**: Preview container uses `maxWidth` constraint to simulate tablet (768px) and phone (375px) viewports. The form layout responds naturally since it uses grid and responsive utilities
- **Wizard navigation state**: Multi-page forms maintain `activePageIndex` state with Previous/Next buttons. Conditional page visibility recalculates visible pages, and navigation adjusts accordingly
- **Display mode support**: Reads `definition.settings.displayMode` to render as wizard (paginated), single-page (all stacked), or accordion (collapsible pages)

### Verification Results

| Check               | Result                                        |
| ------------------- | --------------------------------------------- |
| `npm run typecheck` | Zero errors                                   |
| `npm run test`      | 398/398 tests passing (5 new mock data tests) |

---

## 9. P2-07 — Section Templates

### What This Task Does

Adds reusable section templates that admins can save and reuse across form designs. Common sections (e.g., "Personal Information", "Travel Details") can be saved once and inserted into any form with a single click, creating independent deep copies.

### Architecture

**Data Layer:**

- `SectionTemplate` Prisma model with tenant isolation (`@@unique([tenantId, name])`)
- Stores section definition as JSON (title, columns, collapsible settings, field placements)
- Soft delete via `isActive` flag

**Service Layer (`app/services/section-templates.server.ts`):**

- CRUD operations: `list`, `get`, `create`, `update`, `delete` (soft)
- Follows `form-templates.server.ts` pattern: `ServiceContext`, audit logging, unique constraint error handling
- Tenant-scoped: all queries filter by `tenantId`

**API Routes:**

- `GET/POST /api/v1/section-templates` — list and create
- `GET/PUT/DELETE /api/v1/section-templates/:id` — get, update, soft delete
- Gated by `form:read/create/update/delete` permissions and `FF_VISUAL_FORM_DESIGNER` feature flag

**Designer Integration:**

- **Templates tab** in field palette (left panel) alongside Fields tab
- Template list with search, field count, column count, and missing field warnings
- Click-to-add: inserts a deep copy (new UUIDs for section and all fields)
- **Save as template** menu item in section dropdown menu (via `SortableSection`)
- `SaveTemplateDialog` component with name/description inputs, error handling
- Client-side state sync: newly saved templates appear immediately in the Templates tab

### Files Created

| File                                                     | Purpose                         |
| -------------------------------------------------------- | ------------------------------- |
| `prisma/migrations/20260216183536_add_section_template/` | Database migration              |
| `app/services/section-templates.server.ts`               | CRUD service with audit logging |
| `app/lib/schemas/section-template.ts`                    | Zod validation schemas          |
| `app/routes/api/v1/section-templates/index.tsx`          | List + create API route         |
| `app/routes/api/v1/section-templates/$id.tsx`            | Get + update + delete API route |
| `app/components/form-designer/save-template-dialog.tsx`  | Save-as-template dialog         |

### Files Modified

| File                                                 | Change                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `prisma/schema.prisma`                               | Added `SectionTemplate` model + Tenant relation                  |
| `app/components/form-designer/field-palette.tsx`     | Added Templates tab with search, missing field warnings          |
| `app/components/form-designer/sortable-section.tsx`  | Added "Save as template" dropdown menu item                      |
| `app/components/form-designer/design-canvas.tsx`     | Passed `onSaveAsTemplate` through PageContent to SortableSection |
| `app/routes/admin/events/$eventId/forms/$formId.tsx` | Loaded templates in loader, added save/add handlers              |
| `prisma/seed.ts`                                     | Added `section-template` CRUD permissions                        |
| `docs/PHASE-2-COMPLETION.md`                         | Added P2-07 entry                                                |

### Key Patterns

- **Deep copy semantics**: Templates are stored as JSON snapshots. When inserted, all IDs are regenerated with `crypto.randomUUID()`, making the copy fully independent
- **Missing field warnings**: Template tab checks each template's `fieldDefinitionId` references against the current event's field definitions and shows an amber warning icon for unresolvable references
- **Client-side optimistic update**: After saving a template via `fetch()`, the new template is prepended to the local `sectionTemplates` state array, appearing immediately in the Templates tab without requiring a page reload

### Verification Results

| Check               | Result                |
| ------------------- | --------------------- |
| `npm run typecheck` | Zero errors           |
| `npm run test`      | 398/398 tests passing |

---

## 10. P2-08 — Skeleton Loading States

### What This Task Does

Adds skeleton loading states, a status button component, an empty state component, and a navigation progress bar to give users immediate visual feedback during page transitions and data loading.

### Architecture

**UI Components:**

- `StatusButton` — extends Button with loading (spinner), success (check), and error (X) states. Auto-resets after 2s (success) or 3s (error)
- `EmptyState` — reusable icon + title + description + optional action for zero-result states
- `Skeleton` — already existed (shadcn pattern with `animate-pulse`)

**Page-Level Skeletons (`app/components/skeletons/`):**

- `TableSkeleton` — configurable columns/rows, matches table layout
- `CardGridSkeleton` — 3-column responsive grid matching event cards
- `FormSkeleton` — form sections with field/toggle placeholders matching field edit page
- `DesignerSkeleton` — three-panel layout matching form designer
- `DashboardSkeleton` — stat cards placeholder

**Navigation Progress Bar:**

- Thin animated bar at top of viewport during client-side route transitions
- Uses `useNavigation().state === "loading"` in admin layout
- CSS keyframe animation (`progress`) for smooth sliding effect

**Empty State Integration:**

- Events list: `CalendarDays` icon with contextual message
- Forms list: `FileText` icon with contextual message
- Cross-event forms: `FileText` icon with contextual message

### Files Created

| File                                              | Purpose                                  |
| ------------------------------------------------- | ---------------------------------------- |
| `app/components/ui/status-button.tsx`             | Button with loading/success/error states |
| `app/components/ui/empty-state.tsx`               | Reusable empty state component           |
| `app/components/skeletons/table-skeleton.tsx`     | Table skeleton with configurable columns |
| `app/components/skeletons/card-grid-skeleton.tsx` | Card grid skeleton                       |
| `app/components/skeletons/form-skeleton.tsx`      | Form field skeleton                      |
| `app/components/skeletons/designer-skeleton.tsx`  | Three-panel designer skeleton            |
| `app/components/skeletons/dashboard-skeleton.tsx` | Dashboard stat cards skeleton            |
| `app/components/skeletons/index.ts`               | Barrel export                            |

### Files Modified

| File                                               | Change                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| `app/routes/admin/_layout.tsx`                     | Added navigation progress bar with `useNavigation`      |
| `app/routes/admin/events/index.tsx`                | Replaced inline empty state with `EmptyState` component |
| `app/routes/admin/events/$eventId/forms/index.tsx` | Replaced inline empty state with `EmptyState` component |
| `app/routes/admin/events/forms.tsx`                | Replaced inline empty state with `EmptyState` component |
| `app/app.css`                                      | Added `@keyframes progress` animation                   |

### Verification Results

| Check               | Result                |
| ------------------- | --------------------- |
| `npm run typecheck` | Zero errors           |
| `npm run test`      | 398/398 tests passing |

---

## 11. P2-09 — SSE Real-Time Updates

### Summary

Added Server-Sent Events (SSE) infrastructure for real-time push notifications. Includes an in-memory event bus, Express SSE endpoint with tenant isolation, client-side reconnection with exponential backoff, and a Radix-based toast notification system. Workflow actions and SLA events now publish to connected dashboards in real time.

### Architecture

- **Event Bus** (`server/event-bus.ts`): Singleton `EventEmitter` wrapper with publish/subscribe, monotonic event IDs, and dev-mode global persistence
- **SSE Route** (`server/sse.ts`): Express router with dependency injection for auth, feature flags, and user lookup. Supports per-tenant filtering, connection limits (5/user, 1000 total), 30s heartbeat, and nginx buffering compatibility (`X-Accel-Buffering: no`)
- **Client Hook** (`app/hooks/use-sse.ts`): `EventSource`-based hook with exponential backoff reconnect (1s → 30s max), callback refs to prevent unnecessary reconnects, and proper cleanup
- **SSE Provider** (`app/components/sse-provider.tsx`): Maps SSE event types to toast variants (success, destructive, default)
- **Toast System**: Standard shadcn/Radix toast with module-level store (no React context needed), 3 variants (default, destructive, success), max 5 visible, 5s auto-dismiss
- **Feature Gated**: Controlled by `FF_SSE_UPDATES` feature flag + `ENABLE_SSE` env var

### Files Created

| File                              | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `app/types/sse-events.ts`         | Shared SSE event types, channels, and connection state   |
| `server/event-bus.ts`             | In-memory pub/sub singleton using Node EventEmitter      |
| `app/lib/event-bus.server.ts`     | Re-export bridge for `~/` alias in app services          |
| `server/sse.ts`                   | Express SSE route with auth, tenant isolation, heartbeat |
| `app/components/ui/toast.tsx`     | Radix Toast primitives with CVA variants                 |
| `app/hooks/use-toast.ts`          | Module-level toast store with reducer pattern            |
| `app/components/ui/toaster.tsx`   | Toast viewport/renderer                                  |
| `app/hooks/use-sse.ts`            | Client SSE hook with auto-reconnect                      |
| `app/components/sse-provider.tsx` | Maps SSE events to toast notifications                   |

### Files Modified

| File                                                       | Change                                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `server/app.ts`                                            | Registered SSE router between session extraction and rate limiter                |
| `app/routes/admin/_layout.tsx`                             | Added `sseEnabled` loader, SSEProvider wrapping Outlet, Toaster                  |
| `app/services/workflow-engine/navigation.server.ts`        | Publishes `participant:approved`/`participant:rejected` events (fire-and-forget) |
| `app/services/workflow-engine/sla-notifications.server.ts` | Publishes `sla:warning`/`sla:breached` events (fire-and-forget)                  |

### Key Design Decisions

1. **Express route, not React Router** — SSE requires long-lived `res.write()` connections
2. **Dependency injection** — SSE router receives getSession/isFeatureEnabled/getUser via params to avoid circular imports between server/ and app/ code
3. **Tenant isolation at listener level** — Event bus is tenant-agnostic; per-connection filter prevents cross-tenant data leaks
4. **Fire-and-forget publishing** — SSE failures never break core business logic (try/catch with empty catch)
5. **Module-level toast store** — `useToast()` works without React context, enabling `toast()` calls from outside components

### Verification Results

| Check               | Result                |
| ------------------- | --------------------- |
| `npm run typecheck` | Zero errors           |
| `npm run test`      | 398/398 tests passing |

---

## 12. P2-10 — Notification System

### Summary

Implemented a full notification system with persistent storage, bell icon with unread count badge, popover dropdown, notification center page, and SSE real-time push. The system is feature-gated behind the existing `FF_NOTIFICATIONS` flag.

### Files Created

| File                                   | Purpose                                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `app/services/notifications.server.ts` | CRUD service: create, list, count, markAsRead, markAllAsRead, delete |
| `app/components/notification-bell.tsx` | Bell icon with unread badge + popover dropdown                       |
| `app/routes/admin/notifications.tsx`   | Notification center page with filters + pagination                   |
| `app/routes/api/notifications.ts`      | Resource route for mark-read/delete actions via fetcher              |

### Files Modified

| File                                   | Change                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `prisma/schema.prisma`                 | Added `Notification` model + relations on User/Tenant                       |
| `app/components/layout/top-navbar.tsx` | Replaced bell placeholder with `NotificationBell` component                 |
| `app/routes/admin/_layout.tsx`         | Added `notificationsEnabled`, `unreadCount`, recent notifications to loader |
| `app/config/navigation.ts`             | Added Notifications nav item under Main group                               |
| `app/components/sse-provider.tsx`      | Enhanced `notification:new` to revalidate layout (updates bell)             |
| `app/types/sse-events.ts`              | Added `notificationId` to `NotificationNewEvent`                            |

### Key Design Decisions

1. **Feature-gated** — Entire system controlled by `FF_NOTIFICATIONS` flag; disabled state falls back to static bell icon
2. **Popover-based dropdown** — Uses Radix UI Popover for rich notification list without page navigation
3. **Fetcher-based actions** — Mark-read, mark-all-read, and delete via `useFetcher()` to `/api/notifications` (no page reloads)
4. **SSE revalidation** — `notification:new` events trigger `useRevalidator()` to refresh the admin layout loader, updating bell badge count in real time
5. **Date serialization** — Loader maps Prisma `Date` objects to ISO strings for type-safe client rendering
6. **Fire-and-forget SSE** — Notification creation publishes to event bus in try/catch; SSE failure never breaks DB persistence

### Verification Results

| Check                | Result                      |
| -------------------- | --------------------------- |
| `npx prisma db push` | Schema pushed without error |
| `npm run typecheck`  | Zero errors                 |
| `npm run test`       | 398/398 tests passing       |

---

## 13. P2-11 — Global Search

### Summary

Implemented a cross-entity global search system with a command palette UI. Users can search across Participants, Events, and Form Templates from anywhere in the admin interface via `⌘K` / `Ctrl+K`. The feature includes debounced search, keyboard navigation, recent searches (localStorage), quick actions, and grouped results. Gated behind the existing `FF_GLOBAL_SEARCH` feature flag.

### Architecture

**Search Pipeline:**

```
⌘K → CommandPalette dialog → debounced fetch (300ms) → GET /api/v1/search?q=
  → requireAuth (tenant-scoped) → globalSearch() → 3 parallel Prisma queries
  → grouped results { participants, events, forms }
```

**Search Strategy:**

- Prisma `contains` with `mode: "insensitive"` (case-insensitive substring match)
- No raw SQL needed — standard Prisma `findMany` with `OR` conditions
- Each entity type limited to 5 results, ordered by `updatedAt desc`

**Searched Fields by Entity:**

| Entity       | Fields Searched                                            |
| ------------ | ---------------------------------------------------------- |
| Participants | firstName, lastName, email, organization, registrationCode |
| Events       | name, description                                          |
| Forms        | name                                                       |

**Command Palette Features:**

- Dialog positioned near top of viewport with search input
- Debounced fetch (300ms) with AbortController for request cancellation
- Grouped results with entity type icons and headers
- Quick actions (Go to Events, Participants, Settings) when query is empty
- Recent searches stored in `localStorage` (max 5 entries)
- Full keyboard navigation: `↑`/`↓` to move, `Enter` to open, `Esc` to close
- Loading spinner and empty state

### Files Created

| File                                        | Purpose                                                        |
| ------------------------------------------- | -------------------------------------------------------------- |
| `app/services/search.server.ts`             | `globalSearch()` — 3 parallel Prisma queries with tenant scope |
| `app/routes/api/v1/search.tsx`              | GET loader-only route, auth-gated, rejects queries < 2 chars   |
| `app/components/layout/command-palette.tsx` | Dialog-based command palette with full keyboard navigation     |

### Files Modified

| File                                   | Change                                                              |
| -------------------------------------- | ------------------------------------------------------------------- |
| `app/components/layout/top-navbar.tsx` | Added `searchEnabled` prop, `⌘K` shortcut, clickable search trigger |
| `app/routes/admin/_layout.tsx`         | Added `searchEnabled` via `FF_GLOBAL_SEARCH` flag check             |
| `docs/PHASE-2-COMPLETION.md`           | Added P2-11 entry                                                   |

### Key Design Decisions

1. **Simple Prisma queries over raw SQL** — `contains` + `insensitive` mode is sufficient for substring search across fixed columns. The JSONB query layer (`field-query.server.ts`) is overkill for this use case.
2. **Loader-only API route** — Search is read-only, so only a `loader` function is needed (GET requests).
3. **Debounce + AbortController** — 300ms debounce prevents excessive requests; AbortController cancels inflight requests when a new query arrives, preventing stale results.
4. **localStorage for recent searches** — Simple persistence without server-side storage; graceful fallback if localStorage is unavailable.
5. **Feature flag gating** — `FF_GLOBAL_SEARCH` controls both the `⌘K` shortcut registration and the clickable trigger visibility. When disabled, the static placeholder remains.

### Verification Results

| Check               | Result                |
| ------------------- | --------------------- |
| `npm run typecheck` | Zero errors           |
| `npm run test`      | 398/398 tests passing |
