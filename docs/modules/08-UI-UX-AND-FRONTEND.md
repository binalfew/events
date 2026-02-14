# Module 08: UI/UX and Frontend Architecture

> **Module:** 08 - UI/UX and Frontend Architecture
> **Version:** 1.0
> **Last Updated:** February 12, 2026
> **Status:** Draft
> **Requires:** [Module 00: Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md), [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md)
> **Required By:** All feature modules (09-16)
> **Integrates With:** [Module 02: Dynamic Schema](./02-DYNAMIC-SCHEMA-ENGINE.md), [Module 03: Form Designer](./03-VISUAL-FORM-DESIGNER.md), [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md), [Module 07: API](./07-API-AND-INTEGRATION-LAYER.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Design Philosophy](#14-design-philosophy)
2. [Architecture](#2-architecture)
   - 2.1 [Frontend Architecture Diagram](#21-frontend-architecture-diagram)
   - 2.2 [Design System Architecture](#22-design-system-architecture)
   - 2.3 [Component Library Organization](#23-component-library-organization)
   - 2.4 [Route Structure](#24-route-structure)
   - 2.5 [State Management Patterns](#25-state-management-patterns)
3. [Data Model](#3-data-model)
   - 3.1 [SavedView Model](#31-savedview-model)
   - 3.2 [UserPreference Model](#32-userpreference-model)
   - 3.3 [ThemeConfig Model](#33-themeconfig-model)
   - 3.4 [SearchHistory Model](#34-searchhistory-model)
   - 3.5 [NotificationPreference Model](#35-notificationpreference-model)
   - 3.6 [Entity Relationship Diagram](#36-entity-relationship-diagram)
   - 3.7 [Database Indexes](#37-database-indexes)
4. [API Specification](#4-api-specification)
   - 4.1 [Loader Conventions](#41-loader-conventions)
   - 4.2 [Action Conventions](#42-action-conventions)
   - 4.3 [Fetcher Patterns](#43-fetcher-patterns)
   - 4.4 [Resource Routes](#44-resource-routes)
   - 4.5 [Route Organization Table](#45-route-organization-table)
5. [Business Logic](#5-business-logic)
   - 5.1 [Mobile-First Operations](#51-mobile-first-operations)
   - 5.2 [Keyboard Shortcuts](#52-keyboard-shortcuts)
   - 5.3 [Global Search](#53-global-search)
   - 5.4 [Loading States](#54-loading-states)
   - 5.5 [Internationalization](#55-internationalization)
   - 5.6 [Saved Views](#56-saved-views)
   - 5.7 [Design System Tokens](#57-design-system-tokens)
   - 5.8 [Component Library](#58-component-library)
   - 5.9 [Offline Strategy](#59-offline-strategy)
   - 5.10 [Theming and White-Labeling](#510-theming-and-white-labeling)
   - 5.11 [State Management Patterns](#511-state-management-patterns)
   - 5.12 [Responsive Breakpoints](#512-responsive-breakpoints)
6. [User Interface](#6-user-interface)
   - 6.1 [Main Navigation Shell](#61-main-navigation-shell)
   - 6.2 [Dashboard Layout](#62-dashboard-layout)
   - 6.3 [DataTable View](#63-datatable-view)
   - 6.4 [Kanban Board View](#64-kanban-board-view)
   - 6.5 [Calendar View](#65-calendar-view)
   - 6.6 [Gallery View](#66-gallery-view)
   - 6.7 [Notification Center](#67-notification-center)
   - 6.8 [User Profile and Preferences](#68-user-profile-and-preferences)
   - 6.9 [Tenant Switcher](#69-tenant-switcher)
   - 6.10 [Global Search Results](#610-global-search-results)
   - 6.11 [Mobile Responsive Layouts](#611-mobile-responsive-layouts)
7. [Integration Points](#7-integration-points)
   - 7.1 [Feature Module UI Mapping](#71-feature-module-ui-mapping)
   - 7.2 [Shared Layout Patterns](#72-shared-layout-patterns)
   - 7.3 [Route Organization by Module](#73-route-organization-by-module)
8. [Configuration](#8-configuration)
   - 8.1 [Theme Token Defaults](#81-theme-token-defaults)
   - 8.2 [i18n Configuration](#82-i18n-configuration)
   - 8.3 [PWA Manifest](#83-pwa-manifest)
   - 8.4 [Service Worker Cache Config](#84-service-worker-cache-config)
   - 8.5 [Responsive Breakpoint Overrides](#85-responsive-breakpoint-overrides)
   - 8.6 [Component Defaults](#86-component-defaults)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Component Testing](#91-component-testing)
   - 9.2 [Visual Regression Tests](#92-visual-regression-tests)
   - 9.3 [Accessibility Testing](#93-accessibility-testing)
   - 9.4 [Responsive Testing](#94-responsive-testing)
   - 9.5 [Keyboard Navigation Tests](#95-keyboard-navigation-tests)
   - 9.6 [Screen Reader Testing Plan](#96-screen-reader-testing-plan)
   - 9.7 [i18n Rendering Tests](#97-i18n-rendering-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [XSS Prevention](#101-xss-prevention)
    - 10.2 [Content Security Policy](#102-content-security-policy)
    - 10.3 [Secure Cookie Handling](#103-secure-cookie-handling)
    - 10.4 [CSRF Protection](#104-csrf-protection)
    - 10.5 [CSP Header Configuration](#105-csp-header-configuration)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Core Web Vitals Targets](#111-core-web-vitals-targets)
    - 11.2 [Code Splitting Strategy](#112-code-splitting-strategy)
    - 11.3 [Image Optimization](#113-image-optimization)
    - 11.4 [Font Loading](#114-font-loading)
    - 11.5 [Bundle Size Budgets](#115-bundle-size-budgets)
    - 11.6 [Lighthouse CI Integration](#116-lighthouse-ci-integration)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Complete Route Map](#c-complete-route-map)
  - D. [Keyboard Shortcut Master List](#d-keyboard-shortcut-master-list)
  - E. [WCAG 2.1 AA Compliance Checklist](#e-wcag-21-aa-compliance-checklist)

---

## 1. Overview

### 1.1 Purpose

This module defines the **unified frontend architecture** for the multi-tenant accreditation platform. It provides the design system, component library, state management patterns, offline strategy, theming engine, and accessibility foundations that all feature modules (09-16) build upon.

The frontend is built as a **Progressive Web App (PWA)** using React Router 7 with server-side rendering (SSR), delivering a fast, reliable, and installable experience across all devices. Every UI component, layout pattern, and interaction model described here serves as the canonical reference for feature module implementors.

### 1.2 Scope

This module covers:

- **Design System:** Token-based design language (colors, spacing, typography, shadows, motion)
- **Component Library:** Atomic design hierarchy (atoms, molecules, organisms) with full TypeScript interfaces
- **State Management:** Server state (loaders), client state (React hooks), URL state (searchParams), real-time state (SSE)
- **Offline Strategy:** Service Worker caching, IndexedDB mutation queue, conflict resolution
- **Theming & White-Labeling:** Per-tenant CSS custom properties, dark mode, admin theme preview
- **Internationalization:** react-i18next with English, French, Arabic, and Portuguese locales
- **Accessibility:** WCAG 2.1 AA compliance, keyboard navigation, screen reader support, RTL layouts
- **Performance:** Core Web Vitals targets, code splitting, bundle budgets, Lighthouse CI
- **Responsive Design:** Mobile-first approach with role-specific optimized views

This module does **not** cover:

- Backend API implementation (see [Module 07](./07-API-AND-INTEGRATION-LAYER.md))
- Business workflow logic (see [Module 04](./04-WORKFLOW-ENGINE.md))
- Infrastructure deployment (see [Module 06](./06-INFRASTRUCTURE-AND-DEVOPS.md))

### 1.3 Key Personas

| Persona            | Description                                           | Primary Device | Key UI Needs                                         |
| ------------------ | ----------------------------------------------------- | -------------- | ---------------------------------------------------- |
| **Platform Admin** | Manages tenants, system config, global settings       | Desktop        | Admin dashboards, tenant management, system health   |
| **Tenant Admin**   | Configures events, schemas, workflows for their org   | Desktop        | Form designer, workflow builder, analytics           |
| **Event Manager**  | Manages a specific event lifecycle                    | Desktop/Tablet | Dashboard, reports, participant overview             |
| **Focal Point**    | Represents a delegation, manages group registrations  | Desktop/Tablet | Delegation overview, quota tracking, calendar view   |
| **Validator**      | Reviews and approves/rejects participant applications | Desktop/Tablet | Review queue, keyboard shortcuts, quick actions      |
| **Printer**        | Produces physical badges for approved participants    | Desktop        | Print queue, batch operations, kanban board          |
| **Dispatcher**     | Distributes printed badges to participants            | Mobile/Tablet  | QR scanner, badge collection, offline support        |
| **Registrant**     | External user submitting accreditation applications   | Mobile/Desktop | Registration forms, status tracking, document upload |

### 1.4 Design Philosophy

1. **Mobile-First, Desktop-Enhanced:** All layouts start from mobile constraints and progressively enhance for larger viewports.
2. **Offline-Capable:** Critical workflows (badge collection, validation) function without network connectivity.
3. **Keyboard-Driven:** Power users in high-volume environments (validators, printers) have comprehensive keyboard shortcuts.
4. **Tenant-Branded:** Every visual surface adapts to the tenant's brand identity through CSS custom properties.
5. **Accessible by Default:** Components ship with ARIA attributes, focus management, and screen reader announcements built in.
6. **Performance-Budgeted:** Every route has explicit bundle size targets enforced by CI.

---

## 2. Architecture

### 2.1 Frontend Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser / PWA Shell                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   React Router 7 SSR Layer                    │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │  │
│  │  │ Loaders │  │ Actions │  │ Fetchers │  │ Error Bounds  │  │  │
│  │  │ (data)  │  │ (muts)  │  │ (async)  │  │  (recovery)   │  │  │
│  │  └────┬────┘  └────┬────┘  └────┬─────┘  └───────────────┘  │  │
│  └───────┼────────────┼────────────┼────────────────────────────┘  │
│          │            │            │                                 │
│  ┌───────▼────────────▼────────────▼────────────────────────────┐  │
│  │                    Component Hierarchy                        │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                   Page Components                       │  │  │
│  │  │  (Dashboard, ParticipantList, FormDesigner, etc.)       │  │  │
│  │  └────────────────────────┬────────────────────────────────┘  │  │
│  │                           │                                   │  │
│  │  ┌────────────────────────▼────────────────────────────────┐  │  │
│  │  │              Organism Components                        │  │  │
│  │  │  (DataTable, Sidebar, Header, FormRenderer, etc.)       │  │  │
│  │  └────────────────────────┬────────────────────────────────┘  │  │
│  │                           │                                   │  │
│  │  ┌────────────────────────▼────────────────────────────────┐  │  │
│  │  │             Molecule Components                         │  │  │
│  │  │  (SearchInput, StatusBadge, UserMenu, etc.)             │  │  │
│  │  └────────────────────────┬────────────────────────────────┘  │  │
│  │                           │                                   │  │
│  │  ┌────────────────────────▼────────────────────────────────┐  │  │
│  │  │              Atom Components                            │  │  │
│  │  │  (Button, Input, Badge, Avatar, Spinner, etc.)          │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    State Management Layer                     │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │  Server  │  │  Client   │  │   URL    │  │    SSE     │  │  │
│  │  │  State   │  │  State    │  │  State   │  │   State    │  │  │
│  │  │ (loaders)│  │ (hooks)   │  │ (params) │  │ (events)   │  │  │
│  │  └──────────┘  └───────────┘  └──────────┘  └────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Infrastructure Layer                       │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │ Service  │  │ IndexedDB │  │  Cache   │  │   i18n     │  │  │
│  │  │ Worker   │  │  (offline) │  │  API     │  │  (locales) │  │  │
│  │  └──────────┘  └───────────┘  └──────────┘  └────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Design System Architecture

The design system follows a layered token architecture that separates decisions from implementation:

```
┌─────────────────────────────────────────────────────────┐
│                      Pages                               │
│  (Dashboard, ParticipantList, EventSettings, etc.)       │
├─────────────────────────────────────────────────────────┤
│                     Patterns                             │
│  (FormLayout, ListPage, DetailPage, WizardFlow, etc.)   │
├─────────────────────────────────────────────────────────┤
│                    Composites                            │
│  (DataTable, FormRenderer, WorkflowEditor, etc.)        │
├─────────────────────────────────────────────────────────┤
│                    Primitives                            │
│  (Button, Input, Select, Badge, Avatar, Card, etc.)     │
├─────────────────────────────────────────────────────────┤
│                  Design Tokens                           │
│  (Colors, Spacing, Typography, Shadows, Motion, etc.)   │
└─────────────────────────────────────────────────────────┘
```

**Token Flow:**

```typescript
// tokens/colors.ts -- Semantic token definitions
export const colors = {
  // Primitive tokens (raw values)
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    900: "#1e3a8a",
  },
  // Semantic tokens (mapped to primitives)
  primary: "var(--color-primary)", // Overridden per tenant
  secondary: "var(--color-secondary)",
  background: "var(--color-background)",
  foreground: "var(--color-foreground)",
  muted: "var(--color-muted)",
  destructive: "var(--color-destructive)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
} as const;
```

### 2.3 Component Library Organization

The component library follows **Atomic Design** principles:

```
app/components/
├── atoms/                    # Basic building blocks
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Badge/
│   ├── Avatar/
│   ├── Spinner/
│   ├── Icon/
│   ├── Label/
│   ├── Separator/
│   └── Tooltip/
├── molecules/                # Composed atoms
│   ├── SearchInput/
│   ├── StatusBadge/
│   ├── UserMenu/
│   ├── FormField/
│   ├── ConfirmDialog/
│   ├── Toast/
│   ├── Breadcrumb/
│   ├── Tabs/
│   ├── Pagination/
│   └── EmptyState/
├── organisms/                # Complex components
│   ├── DataTable/
│   ├── Sidebar/
│   ├── Header/
│   ├── FormRenderer/
│   ├── KanbanBoard/
│   ├── CalendarView/
│   ├── GalleryView/
│   ├── NotificationCenter/
│   └── CommandPalette/
├── patterns/                 # Layout patterns
│   ├── ListPage/
│   ├── DetailPage/
│   ├── FormPage/
│   ├── WizardLayout/
│   └── SplitView/
└── providers/                # Context providers
    ├── ThemeProvider.tsx
    ├── I18nProvider.tsx
    ├── ToastProvider.tsx
    └── OfflineProvider.tsx
```

### 2.4 Route Structure

Nested route hierarchy with tenant and event scoping:

```
app/routes/
├── _index.tsx                              # / → Landing / redirect
├── auth/
│   ├── login.tsx                           # /auth/login
│   ├── callback.tsx                        # /auth/callback (OAuth)
│   └── logout.tsx                          # /auth/logout
├── $tenantSlug/                            # /:tenantSlug (tenant root)
│   ├── _layout.tsx                         # Tenant layout (sidebar + header)
│   ├── _index.tsx                          # Dashboard
│   ├── settings/
│   │   ├── general.tsx                     # Tenant general settings
│   │   ├── branding.tsx                    # Theme / white-label
│   │   ├── users.tsx                       # User management
│   │   └── integrations.tsx                # API keys, webhooks
│   ├── events/
│   │   ├── _index.tsx                      # Event listing
│   │   ├── new.tsx                         # Create event
│   │   └── $eventSlug/                     # /:tenantSlug/events/:eventSlug
│   │       ├── _layout.tsx                 # Event layout
│   │       ├── _index.tsx                  # Event dashboard
│   │       ├── participants/
│   │       │   ├── _index.tsx              # Participant list (DataTable)
│   │       │   ├── $participantId.tsx      # Participant detail
│   │       │   └── import.tsx              # Bulk import
│   │       ├── validation/
│   │       │   ├── _index.tsx              # Validation queue
│   │       │   └── $stepId.tsx             # Step-specific queue
│   │       ├── badges/
│   │       │   ├── _index.tsx              # Badge management
│   │       │   ├── designer.tsx            # Badge template designer
│   │       │   ├── print-queue.tsx         # Print queue (Kanban)
│   │       │   └── dispatch.tsx            # Badge dispatch
│   │       ├── forms/
│   │       │   ├── _index.tsx              # Form listing
│   │       │   └── $formId.tsx             # Form designer
│   │       ├── workflows/
│   │       │   ├── _index.tsx              # Workflow listing
│   │       │   └── $workflowId.tsx         # Workflow editor
│   │       ├── schema/
│   │       │   └── _index.tsx              # Schema editor
│   │       ├── delegations/
│   │       │   ├── _index.tsx              # Delegation listing
│   │       │   └── $delegationId.tsx       # Delegation detail
│   │       ├── reports/
│   │       │   └── _index.tsx              # Reports & analytics
│   │       └── settings.tsx                # Event settings
│   └── profile/
│       ├── _index.tsx                      # User profile
│       └── preferences.tsx                 # User preferences
├── admin/                                  # Platform admin
│   ├── _layout.tsx
│   ├── tenants.tsx                         # Tenant management
│   ├── system.tsx                          # System health
│   └── audit.tsx                           # Audit log viewer
└── api/                                    # Resource routes
    ├── search.tsx                           # Global search API
    ├── notifications.tsx                    # SSE notifications
    ├── export.$format.tsx                   # File export
    └── upload.tsx                           # File upload
```

### 2.5 State Management Patterns

```
┌──────────────────────────────────────────────────────────────────┐
│                    State Management Strategy                      │
├──────────────┬───────────────┬──────────────┬────────────────────┤
│  Server State │ Client State  │  URL State   │    SSE State       │
│              │               │              │                    │
│  loader()    │ useState()    │ searchParams │ EventSource        │
│  action()    │ useReducer()  │ useSearch    │ useFetcher()       │
│  defer()     │ useContext()  │ Params()     │ revalidation       │
│              │               │              │                    │
│  - User data │ - UI toggles  │ - Filters    │ - Notifications    │
│  - Lists     │ - Form state  │ - Pagination │ - Status updates   │
│  - Config    │ - Modals      │ - Sort order │ - Real-time counts │
│  - Perms     │ - Selections  │ - Active tab │ - Workflow events  │
└──────────────┴───────────────┴──────────────┴────────────────────┘
```

```typescript
// Example: Loader with defer for progressive rendering
import { defer } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAuth } from "~/services/auth.server";
import { requireTenantAccess } from "~/services/tenant.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const tenant = await requireTenantAccess(user, params.tenantSlug!);

  // Critical data: awaited (blocks render)
  const event = await getEvent(tenant.id, params.eventSlug!);

  // Non-critical data: deferred (streams in)
  const stats = getEventStats(event.id);
  const recentActivity = getRecentActivity(event.id);

  return defer({
    user,
    tenant,
    event,
    stats, // Promise -- renders with Suspense
    recentActivity, // Promise -- renders with Suspense
  });
}
```

---

## 3. Data Model

### 3.1 SavedView Model

```prisma
model SavedView {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String?
  name        String
  type        ViewType @default(TABLE)
  targetModel String
  config      Json
  isDefault   Boolean  @default(false)
  isPublic    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, targetModel])
}

enum ViewType {
  TABLE
  KANBAN
  CALENDAR
  GALLERY
}
```

**Config JSON Schema by ViewType:**

```typescript
// TABLE view config
interface TableViewConfig {
  columns: {
    fieldId: string;
    width: number;
    visible: boolean;
    order: number;
  }[];
  sort: { fieldId: string; direction: "asc" | "desc" }[];
  filters: FilterCondition[];
  groupBy?: string;
  rowHeight: "compact" | "normal" | "expanded";
  frozenColumns: number;
}

// KANBAN view config
interface KanbanViewConfig {
  groupByField: string;
  columns: { value: string; label: string; color: string }[];
  cardFields: string[];
  cardImageField?: string;
  swimlaneField?: string;
}

// CALENDAR view config
interface CalendarViewConfig {
  dateField: string;
  endDateField?: string;
  titleField: string;
  colorField?: string;
  defaultView: "month" | "week" | "day";
}

// GALLERY view config
interface GalleryViewConfig {
  imageField: string;
  titleField: string;
  subtitleField?: string;
  badgeField?: string;
  cardSize: "small" | "medium" | "large";
  columnsPerRow: number;
}
```

### 3.2 UserPreference Model

```prisma
model UserPreference {
  id                String   @id @default(cuid())
  userId            String   @unique
  theme             String   @default("system")   // "light" | "dark" | "system"
  locale            String   @default("en")       // "en" | "fr" | "ar" | "pt"
  density           String   @default("normal")   // "compact" | "normal" | "comfortable"
  sidebarCollapsed  Boolean  @default(false)
  defaultViews      Json     @default("{}")        // { [sectionKey]: viewId }
  timezone          String   @default("UTC")
  dateFormat        String   @default("YYYY-MM-DD")
  numberFormat      String   @default("en-US")
  keyboardShortcuts Boolean  @default(true)
  soundEffects      Boolean  @default(false)
  reducedMotion     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### 3.3 ThemeConfig Model

```prisma
model ThemeConfig {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  primaryColor    String   @default("#2563eb")
  secondaryColor  String   @default("#7c3aed")
  accentColor     String   @default("#06b6d4")
  neutralColor    String   @default("#6b7280")
  successColor    String   @default("#16a34a")
  warningColor    String   @default("#d97706")
  errorColor      String   @default("#dc2626")
  logoUrl         String?
  logomarkUrl     String?
  faviconUrl      String?
  fontFamily      String   @default("Inter")
  headingFont     String   @default("Inter")
  borderRadius    String   @default("md")          // "sm" | "md" | "lg" | "full"
  darkMode        Boolean  @default(true)          // Allow dark mode toggle
  customCss       String?                           // Tenant-specific CSS overrides
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}
```

### 3.4 SearchHistory Model

```prisma
model SearchHistory {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  query     String
  resultCount Int    @default(0)
  filters   Json?                                  // Applied filters at search time
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([userId, tenantId, createdAt])
  @@index([tenantId, query])
}
```

### 3.5 NotificationPreference Model

```prisma
model NotificationPreference {
  id               String   @id @default(cuid())
  userId           String
  tenantId         String
  notificationType String                          // e.g., "workflow.step_completed"
  emailEnabled     Boolean  @default(true)
  pushEnabled      Boolean  @default(true)
  inAppEnabled     Boolean  @default(true)
  smsEnabled       Boolean  @default(false)
  digest           String   @default("immediate")  // "immediate" | "hourly" | "daily"
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userId, tenantId, notificationType])
  @@index([userId, tenantId])
}
```

### 3.6 Entity Relationship Diagram

```
┌──────────────────┐       ┌───────────────────┐
│      User        │       │      Tenant       │
│──────────────────│       │───────────────────│
│ id               │───┐   │ id                │──┐
│ name             │   │   │ name              │  │
│ email            │   │   │ slug              │  │
└──────────────────┘   │   └───────────────────┘  │
        │              │            │              │
        │ 1:1          │            │ 1:1          │
        ▼              │            ▼              │
┌──────────────────┐   │   ┌───────────────────┐  │
│ UserPreference   │   │   │   ThemeConfig     │  │
│──────────────────│   │   │───────────────────│  │
│ userId (FK)      │   │   │ tenantId (FK)     │  │
│ theme            │   │   │ primaryColor      │  │
│ locale           │   │   │ logoUrl           │  │
│ density          │   │   │ fontFamily        │  │
│ sidebarCollapsed │   │   │ darkMode          │  │
│ defaultViews     │   │   └───────────────────┘  │
└──────────────────┘   │                           │
                       │   ┌───────────────────┐   │
                       ├──▶│   SearchHistory   │◀──┤
                       │   │───────────────────│   │
                       │   │ userId (FK)       │   │
                       │   │ tenantId (FK)     │   │
                       │   │ query             │   │
                       │   │ resultCount       │   │
                       │   └───────────────────┘   │
                       │                           │
                       │   ┌───────────────────┐   │
                       ├──▶│ NotificationPref  │◀──┤
                       │   │───────────────────│   │
                       │   │ userId (FK)       │   │
                       │   │ tenantId (FK)     │   │
                       │   │ notificationType  │   │
                       │   │ emailEnabled      │   │
                       │   │ pushEnabled       │   │
                       │   └───────────────────┘   │
                       │                           │
                       │   ┌───────────────────┐   │
                       └──▶│    SavedView      │◀──┘
                           │───────────────────│
                           │ tenantId (FK)     │
                           │ createdBy (FK)    │
                           │ type (ViewType)   │
                           │ config (Json)     │
                           │ isPublic          │
                           └───────────────────┘
```

### 3.7 Database Indexes

```sql
-- SavedView indexes
CREATE INDEX idx_saved_view_tenant_model ON "SavedView" ("tenantId", "targetModel");
CREATE INDEX idx_saved_view_created_by ON "SavedView" ("createdBy");
CREATE INDEX idx_saved_view_event ON "SavedView" ("eventId") WHERE "eventId" IS NOT NULL;

-- UserPreference indexes
CREATE UNIQUE INDEX idx_user_preference_user ON "UserPreference" ("userId");

-- ThemeConfig indexes
CREATE UNIQUE INDEX idx_theme_config_tenant ON "ThemeConfig" ("tenantId");

-- SearchHistory indexes
CREATE INDEX idx_search_history_user_tenant ON "SearchHistory" ("userId", "tenantId", "createdAt" DESC);
CREATE INDEX idx_search_history_query ON "SearchHistory" ("tenantId", "query");

-- NotificationPreference indexes
CREATE UNIQUE INDEX idx_notification_pref_unique
  ON "NotificationPreference" ("userId", "tenantId", "notificationType");
CREATE INDEX idx_notification_pref_user ON "NotificationPreference" ("userId", "tenantId");
```

---

## 4. API Specification

### 4.1 Loader Conventions

All route loaders follow a consistent pattern: authenticate, authorize tenant access, fetch scoped data, and return typed responses.

```typescript
// Convention: Every loader authenticates and scopes to tenant
import type { LoaderFunctionArgs } from "react-router";
import { json, redirect } from "react-router";
import { requireAuth } from "~/services/auth.server";
import { requireTenantAccess } from "~/services/tenant.server";
import { requirePermission } from "~/services/rbac.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Step 1: Authenticate
  const user = await requireAuth(request);
  if (!user) throw redirect("/auth/login");

  // Step 2: Authorize tenant access
  const tenant = await requireTenantAccess(user, params.tenantSlug!);
  if (!tenant) throw new Response("Forbidden", { status: 403 });

  // Step 3: Check feature permission
  await requirePermission(user, tenant.id, "participants:read");

  // Step 4: Parse URL state (filters, pagination, sort)
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") ?? "25");
  const sort = url.searchParams.get("sort") ?? "createdAt";
  const order = url.searchParams.get("order") ?? "desc";
  const search = url.searchParams.get("q") ?? "";
  const filters = parseFilters(url.searchParams);

  // Step 5: Fetch scoped data
  const { data, total } = await getParticipants({
    tenantId: tenant.id,
    eventId: params.eventSlug!,
    page,
    pageSize,
    sort,
    order,
    search,
    filters,
  });

  // Step 6: Return typed response with cache headers
  return json(
    { user, tenant, participants: data, total, page, pageSize },
    {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        Vary: "Cookie",
      },
    },
  );
}
```

**Loader Type Safety:**

```typescript
// types/loaders.ts
import type { SerializeFrom } from "react-router";
import type { loader } from "~/routes/$tenantSlug/events/$eventSlug/participants/_index";

export type ParticipantListLoaderData = SerializeFrom<typeof loader>;

// In component:
import { useLoaderData } from "react-router";
import type { ParticipantListLoaderData } from "~/types/loaders";

export default function ParticipantList() {
  const { participants, total, page, pageSize } = useLoaderData<ParticipantListLoaderData>();
  // ...
}
```

### 4.2 Action Conventions

Actions handle form submissions using Conform for validation and progressive enhancement.

```typescript
// Convention: Actions use Conform for validation
import type { ActionFunctionArgs } from "react-router";
import { json, redirect } from "react-router";
import { parseWithZod } from "@conform-to/zod";
import { requireAuth } from "~/services/auth.server";
import { requirePermission } from "~/services/rbac.server";
import { participantSchema } from "~/schemas/participant";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const tenant = await requireTenantAccess(user, params.tenantSlug!);

  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "approve": {
      await requirePermission(user, tenant.id, "validation:approve");
      const participantId = formData.get("participantId") as string;
      const remarks = formData.get("remarks") as string;

      await approveParticipant({
        tenantId: tenant.id,
        participantId,
        validatorId: user.id,
        remarks,
      });

      return json({ status: "success", message: "Participant approved" });
    }

    case "reject": {
      await requirePermission(user, tenant.id, "validation:reject");
      const submission = parseWithZod(formData, {
        schema: rejectSchema,
      });

      if (submission.status !== "success") {
        return json({ status: "error", errors: submission.reply() });
      }

      await rejectParticipant({
        tenantId: tenant.id,
        ...submission.value,
        validatorId: user.id,
      });

      return json({ status: "success", message: "Participant rejected" });
    }

    case "create": {
      await requirePermission(user, tenant.id, "participants:create");
      const submission = parseWithZod(formData, {
        schema: participantSchema,
      });

      if (submission.status !== "success") {
        return json({ status: "error", errors: submission.reply() }, { status: 400 });
      }

      const participant = await createParticipant({
        tenantId: tenant.id,
        eventId: params.eventSlug!,
        ...submission.value,
        createdBy: user.id,
      });

      return redirect(
        `/${params.tenantSlug}/events/${params.eventSlug}/participants/${participant.id}`,
      );
    }

    default:
      return json({ status: "error", message: "Unknown intent" }, { status: 400 });
  }
}
```

**Conform Form Integration:**

```typescript
// components/ParticipantForm.tsx
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Form, useActionData, useNavigation } from "react-router";
import { participantSchema } from "~/schemas/participant";
import { Button, Input, Label } from "~/components/atoms";
import { StatusButton } from "~/components/molecules";

export function ParticipantForm() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.errors,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: participantSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <input type="hidden" name="intent" value="create" />

      <div className="space-y-4">
        <div>
          <Label htmlFor={fields.firstName.id}>First Name</Label>
          <Input
            {...getInputProps(fields.firstName, { type: "text" })}
            aria-invalid={!fields.firstName.valid}
            aria-describedby={fields.firstName.errorId}
          />
          {fields.firstName.errors && (
            <p id={fields.firstName.errorId} className="text-sm text-destructive mt-1">
              {fields.firstName.errors[0]}
            </p>
          )}
        </div>

        <StatusButton
          type="submit"
          status={isSubmitting ? "loading" : actionData?.status ?? "idle"}
          disabled={isSubmitting}
        >
          Create Participant
        </StatusButton>
      </div>
    </Form>
  );
}
```

### 4.3 Fetcher Patterns

Fetchers enable non-navigating mutations and real-time data subscriptions.

**Optimistic UI Pattern:**

```typescript
// Optimistic approval in validation queue
import { useFetcher } from "react-router";

function ParticipantCard({ participant }: { participant: Participant }) {
  const fetcher = useFetcher();

  // Optimistic: treat submission as instant success
  const isApproving = fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "approve";
  const isRejecting = fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "reject";

  const displayStatus = isApproving
    ? "approved"
    : isRejecting
    ? "rejected"
    : participant.status;

  return (
    <div className={cn("card", statusStyles[displayStatus])}>
      <h3>{participant.name}</h3>
      <Badge variant={displayStatus}>{displayStatus}</Badge>

      <div className="flex gap-2 mt-4">
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="approve" />
          <input type="hidden" name="participantId" value={participant.id} />
          <Button variant="primary" disabled={isApproving || isRejecting}>
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        </fetcher.Form>

        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="reject" />
          <input type="hidden" name="participantId" value={participant.id} />
          <Button variant="danger" disabled={isApproving || isRejecting}>
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </fetcher.Form>
      </div>
    </div>
  );
}
```

**SSE Subscription Pattern:**

```typescript
// hooks/useSSE.ts - Server-Sent Events subscription
import { useEffect, useCallback, useRef } from "react";
import { useRevalidator } from "react-router";

interface UseSSEOptions {
  url: string;
  events: string[];
  onMessage?: (event: string, data: unknown) => void;
}

export function useSSE({ url, events, onMessage }: UseSSEOptions) {
  const revalidator = useRevalidator();
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const es = new EventSource(url);

    events.forEach((eventType) => {
      es.addEventListener(eventType, (event) => {
        const data = JSON.parse(event.data);
        onMessage?.(eventType, data);
        // Revalidate loader data on relevant events
        revalidator.revalidate();
      });
    });

    es.onerror = () => {
      es.close();
      // Reconnect with exponential backoff
      setTimeout(connect, 3000);
    };

    eventSourceRef.current = es;
  }, [url, events, onMessage, revalidator]);

  useEffect(() => {
    connect();
    return () => eventSourceRef.current?.close();
  }, [connect]);
}

// Usage in a component:
function ValidationQueue() {
  const { participants } = useLoaderData<typeof loader>();

  useSSE({
    url: "/api/notifications?channel=validation",
    events: ["participant.approved", "participant.rejected", "participant.created"],
    onMessage: (event, data) => {
      // Toast notification for real-time updates
      toast.info(`Participant ${event.split(".")[1]}`);
    },
  });

  return <DataTable data={participants} />;
}
```

### 4.4 Resource Routes

Resource routes serve non-HTML responses (file downloads, API endpoints, SSE streams).

```typescript
// routes/api/search.tsx - Global search resource route
import type { LoaderFunctionArgs } from "react-router";
import { json } from "react-router";
import { requireAuth } from "~/services/auth.server";
import { searchParticipants } from "~/services/search.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const tenantId = url.searchParams.get("tenantId");

  if (query.length < 2) {
    return json({ results: [], total: 0 });
  }

  const results = await searchParticipants({
    query,
    tenantId: tenantId ?? undefined,
    userId: user.id,
    limit: 20,
  });

  // Save search history
  await saveSearchHistory({
    userId: user.id,
    tenantId: tenantId!,
    query,
    resultCount: results.total,
  });

  return json(results);
}

// routes/api/export.$format.tsx - File export resource route
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const format = params.format as "csv" | "xlsx" | "pdf";
  const url = new URL(request.url);

  const data = await generateExport({
    format,
    tenantId: url.searchParams.get("tenantId")!,
    eventId: url.searchParams.get("eventId")!,
    viewConfig: JSON.parse(url.searchParams.get("config") ?? "{}"),
    userId: user.id,
  });

  const contentTypes = {
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pdf: "application/pdf",
  };

  return new Response(data, {
    headers: {
      "Content-Type": contentTypes[format],
      "Content-Disposition": `attachment; filename="export.${format}"`,
    },
  });
}

// routes/api/notifications.tsx - SSE stream resource route
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const url = new URL(request.url);
  const channel = url.searchParams.get("channel") ?? "general";

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        // Subscribe to Redis pub/sub or similar
        const unsubscribe = subscribeToChannel(`${user.tenantId}:${channel}`, (event, data) =>
          send(event, data),
        );

        // Heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          send("heartbeat", { timestamp: Date.now() });
        }, 30000);

        request.signal.addEventListener("abort", () => {
          unsubscribe();
          clearInterval(heartbeat);
          controller.close();
        });
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    },
  );
}
```

### 4.5 Route Organization Table

| URL Path                                            | Component           | Loader Data             | Required Permission |
| --------------------------------------------------- | ------------------- | ----------------------- | ------------------- |
| `/`                                                 | `LandingPage`       | Public content          | None                |
| `/auth/login`                                       | `LoginPage`         | OAuth providers         | None                |
| `/auth/callback`                                    | `AuthCallback`      | Token exchange          | None                |
| `/:tenantSlug`                                      | `TenantDashboard`   | Stats, activity, events | `tenant:read`       |
| `/:tenantSlug/settings/general`                     | `TenantSettings`    | Tenant config           | `tenant:admin`      |
| `/:tenantSlug/settings/branding`                    | `BrandingSettings`  | ThemeConfig             | `tenant:admin`      |
| `/:tenantSlug/settings/users`                       | `UserManagement`    | Users, roles            | `users:manage`      |
| `/:tenantSlug/events`                               | `EventList`         | Events list             | `events:read`       |
| `/:tenantSlug/events/new`                           | `CreateEvent`       | Templates               | `events:create`     |
| `/:tenantSlug/events/:eventSlug`                    | `EventDashboard`    | Event stats             | `events:read`       |
| `/:tenantSlug/events/:eventSlug/participants`       | `ParticipantList`   | Participants, views     | `participants:read` |
| `/:tenantSlug/events/:eventSlug/participants/:id`   | `ParticipantDetail` | Participant, history    | `participants:read` |
| `/:tenantSlug/events/:eventSlug/validation`         | `ValidationQueue`   | Queue items             | `validation:read`   |
| `/:tenantSlug/events/:eventSlug/validation/:stepId` | `StepValidation`    | Step queue              | `validation:read`   |
| `/:tenantSlug/events/:eventSlug/badges/designer`    | `BadgeDesigner`     | Templates               | `badges:design`     |
| `/:tenantSlug/events/:eventSlug/badges/print-queue` | `PrintQueue`        | Print jobs              | `badges:print`      |
| `/:tenantSlug/events/:eventSlug/badges/dispatch`    | `BadgeDispatch`     | Dispatch queue          | `badges:dispatch`   |
| `/:tenantSlug/events/:eventSlug/forms/:formId`      | `FormDesigner`      | Form schema             | `forms:edit`        |
| `/:tenantSlug/events/:eventSlug/workflows/:id`      | `WorkflowEditor`    | Workflow config         | `workflows:edit`    |
| `/:tenantSlug/events/:eventSlug/delegations`        | `DelegationList`    | Delegations             | `delegations:read`  |
| `/:tenantSlug/events/:eventSlug/reports`            | `Reports`           | Report data             | `reports:read`      |
| `/:tenantSlug/profile`                              | `UserProfile`       | User data               | Authenticated       |
| `/:tenantSlug/profile/preferences`                  | `UserPreferences`   | Preferences             | Authenticated       |
| `/admin/tenants`                                    | `TenantAdmin`       | All tenants             | `platform:admin`    |
| `/admin/system`                                     | `SystemHealth`      | Health metrics          | `platform:admin`    |
| `/api/search`                                       | Resource route      | Search results          | Authenticated       |
| `/api/notifications`                                | SSE stream          | Event stream            | Authenticated       |
| `/api/export/:format`                               | Resource route      | File download           | `export:read`       |

---

## 5. Business Logic

### 5.1 Mobile-First Operations

**Progressive Web App (PWA)** with responsive views for:

- **Validator:** Card-based review queue, swipe to approve/reject
- **Printer:** Print queue with batch selection
- **Dispatcher:** QR scanner for badge collection
- **Focal Point:** Delegation overview with quota usage

Service Worker for offline badge collection and printing.

### 5.2 Keyboard Shortcuts

Power user shortcuts for high-volume validator workflows:

| Shortcut | Action                        |
| -------- | ----------------------------- |
| `A`      | Approve selected participant  |
| `R`      | Reject (opens remarks dialog) |
| `B`      | Bypass                        |
| `N`      | Next participant              |
| `P`      | Previous participant          |
| `/`      | Focus search                  |
| `?`      | Show shortcut help            |

**Keyboard Shortcut Implementation:**

```typescript
// hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from "react";
import { useUserPreferences } from "~/hooks/useUserPreferences";

interface ShortcutMap {
  [key: string]: {
    action: () => void;
    description: string;
    category: string;
    when?: () => boolean; // Condition for shortcut to be active
  };
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const { keyboardShortcuts: enabled } = useUserPreferences();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Exception: Allow `/` to focus search from anywhere
        if (event.key !== "/") return;
      }

      const key = buildKeyString(event);
      const shortcut = shortcuts[key];

      if (shortcut && (!shortcut.when || shortcut.when())) {
        event.preventDefault();
        shortcut.action();
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

function buildKeyString(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("mod");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  parts.push(event.key.toLowerCase());
  return parts.join("+");
}

// Usage in ValidationQueue component:
function ValidationQueue() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const participants = useLoaderData<typeof loader>();
  const approveFetcher = useFetcher();
  const rejectFetcher = useFetcher();

  useKeyboardShortcuts({
    a: {
      action: () => approveSelected(),
      description: "Approve selected participant",
      category: "Validation",
      when: () => participants[selectedIndex]?.status === "pending",
    },
    r: {
      action: () => openRejectDialog(),
      description: "Reject (opens remarks dialog)",
      category: "Validation",
      when: () => participants[selectedIndex]?.status === "pending",
    },
    b: {
      action: () => bypassSelected(),
      description: "Bypass",
      category: "Validation",
    },
    n: {
      action: () => setSelectedIndex((i) => Math.min(i + 1, participants.length - 1)),
      description: "Next participant",
      category: "Navigation",
    },
    p: {
      action: () => setSelectedIndex((i) => Math.max(i - 1, 0)),
      description: "Previous participant",
      category: "Navigation",
    },
    "/": {
      action: () => document.querySelector<HTMLInputElement>("[data-search]")?.focus(),
      description: "Focus search",
      category: "Navigation",
    },
    "?": {
      action: () => setShowShortcutHelp(true),
      description: "Show shortcut help",
      category: "Help",
    },
  });
}
```

### 5.3 Global Search

Cross-event participant search bar in the header:

- Search by name, registration code, passport number, organization
- Results grouped by event
- Quick actions from search results (view, navigate to step)
- Custom field search for fields marked `isSearchable`

**Global Search Implementation:**

```typescript
// components/organisms/CommandPalette/CommandPalette.tsx
import { useFetcher, useNavigate } from "react-router";
import { useDebounce } from "~/hooks/useDebounce";
import { useKeyboardShortcuts } from "~/hooks/useKeyboardShortcuts";

interface SearchResult {
  id: string;
  name: string;
  type: "participant" | "event" | "delegation";
  eventName: string;
  eventSlug: string;
  status: string;
  matchField: string;
  matchValue: string;
}

interface GroupedResults {
  [eventName: string]: SearchResult[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const fetcher = useFetcher<{ results: SearchResult[]; total: number }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with keyboard shortcut
  useKeyboardShortcuts({
    "mod+k": {
      action: () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); },
      description: "Open command palette",
      category: "Navigation",
    },
  });

  // Fetch results on query change
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetcher.load(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
    }
  }, [debouncedQuery]);

  // Group results by event
  const grouped: GroupedResults = useMemo(() => {
    if (!fetcher.data?.results) return {};
    return fetcher.data.results.reduce((acc, result) => {
      const group = result.eventName || "Global";
      if (!acc[group]) acc[group] = [];
      acc[group].push(result);
      return acc;
    }, {} as GroupedResults);
  }, [fetcher.data]);

  // Quick actions
  const quickActions = [
    { label: "View Profile", icon: "eye", action: (r: SearchResult) =>
      navigate(`/events/${r.eventSlug}/participants/${r.id}`) },
    { label: "Go to Current Step", icon: "workflow", action: (r: SearchResult) =>
      navigate(`/events/${r.eventSlug}/validation?participantId=${r.id}`) },
    { label: "Print Badge", icon: "printer", action: (r: SearchResult) =>
      navigate(`/events/${r.eventSlug}/badges/print-queue?ids=${r.id}`) },
  ];

  if (!open) return null;

  return (
    <div className="command-palette-overlay" role="dialog" aria-label="Search">
      <div className="command-palette" role="combobox" aria-expanded={open}>
        <div className="command-palette-input-wrapper">
          <SearchIcon className="command-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search participants, events, delegations..."
            className="command-palette-input"
            role="searchbox"
            aria-autocomplete="list"
            data-search
          />
          <kbd className="command-palette-kbd">ESC</kbd>
        </div>

        <div className="command-palette-results" role="listbox">
          {fetcher.state === "loading" && <SearchSkeleton />}

          {Object.entries(grouped).map(([eventName, results]) => (
            <div key={eventName} role="group" aria-label={eventName}>
              <div className="command-palette-group-header">
                {eventName} ({results.length})
              </div>
              {results.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  quickActions={quickActions}
                  onSelect={() => {
                    navigate(`/events/${result.eventSlug}/participants/${result.id}`);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 5.4 Loading States

Skeleton screens for data-heavy pages. StatusButton with loading/success/error states for form submissions.

```typescript
// components/molecules/StatusButton/StatusButton.tsx
import { forwardRef } from "react";
import { cn } from "~/lib/utils";
import { Button, type ButtonProps } from "~/components/atoms/Button";
import { Spinner } from "~/components/atoms/Spinner";
import { CheckIcon, XIcon } from "~/components/atoms/Icon";

type Status = "idle" | "loading" | "success" | "error";

interface StatusButtonProps extends ButtonProps {
  status: Status;
  successMessage?: string;
  errorMessage?: string;
  autoResetMs?: number;
}

export const StatusButton = forwardRef<HTMLButtonElement, StatusButtonProps>(
  ({ status, successMessage, errorMessage, autoResetMs = 2000, children, ...props }, ref) => {
    const [displayStatus, setDisplayStatus] = useState<Status>(status);

    useEffect(() => {
      setDisplayStatus(status);
      if (status === "success" || status === "error") {
        const timer = setTimeout(() => setDisplayStatus("idle"), autoResetMs);
        return () => clearTimeout(timer);
      }
    }, [status, autoResetMs]);

    return (
      <Button
        ref={ref}
        disabled={displayStatus === "loading"}
        className={cn(
          "relative transition-all duration-200",
          displayStatus === "success" && "bg-success text-success-foreground",
          displayStatus === "error" && "bg-destructive text-destructive-foreground"
        )}
        {...props}
      >
        <span className={cn("flex items-center gap-2", displayStatus === "loading" && "opacity-0")}>
          {children}
        </span>

        {displayStatus === "loading" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size="sm" />
          </span>
        )}

        {displayStatus === "success" && (
          <span className="absolute inset-0 flex items-center justify-center gap-1">
            <CheckIcon className="h-4 w-4" />
            {successMessage ?? "Done"}
          </span>
        )}

        {displayStatus === "error" && (
          <span className="absolute inset-0 flex items-center justify-center gap-1">
            <XIcon className="h-4 w-4" />
            {errorMessage ?? "Error"}
          </span>
        )}
      </Button>
    );
  }
);
StatusButton.displayName = "StatusButton";

// components/molecules/Skeleton/TableSkeleton.tsx
export function TableSkeleton({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full" role="status" aria-label="Loading table data">
      <div className="border rounded-lg overflow-hidden">
        {/* Header skeleton */}
        <div className="flex bg-muted/50 px-4 py-3 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded animate-pulse flex-1" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex px-4 py-3 gap-4 border-t">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-4 bg-muted/60 rounded animate-pulse flex-1"
                style={{ animationDelay: `${(rowIdx * columns + colIdx) * 50}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

### 5.5 Internationalization

```
// react-i18next with 4 languages for AU context
public/locales/
  en/common.json
  fr/common.json
  ar/common.json
  pt/common.json
```

Internationalize: UI labels, email templates, badge text, error messages, workflow step names, report labels.

**i18n Configuration:**

```typescript
// i18n/config.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

export const supportedLocales = ["en", "fr", "ar", "pt"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const localeConfig: Record<
  SupportedLocale,
  { label: string; dir: "ltr" | "rtl"; flag: string }
> = {
  en: { label: "English", dir: "ltr", flag: "GB" },
  fr: { label: "Francais", dir: "ltr", flag: "FR" },
  ar: { label: "العربية", dir: "rtl", flag: "SA" },
  pt: { label: "Portugues", dir: "ltr", flag: "PT" },
};

export const i18nNamespaces = [
  "common", // Shared UI labels (buttons, status, navigation)
  "validation", // Validation workflow terms
  "badges", // Badge and print related
  "forms", // Form designer and renderer
  "workflows", // Workflow engine terms
  "reports", // Reports and analytics
  "errors", // Error messages
  "emails", // Email template strings
] as const;

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: supportedLocales,
    defaultNS: "common",
    ns: [...i18nNamespaces],

    interpolation: {
      escapeValue: false, // React handles XSS
    },

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    detection: {
      order: ["cookie", "localStorage", "navigator"],
      caches: ["cookie", "localStorage"],
      cookieSameSite: "strict",
    },

    react: {
      useSuspense: true,
      bindI18n: "languageChanged",
      transEmptyNodeValue: "",
    },
  });

export default i18n;
```

**RTL Support:**

```typescript
// providers/I18nProvider.tsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { localeConfig } from "~/i18n/config";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const locale = i18n.language as SupportedLocale;
    const config = localeConfig[locale];

    if (config) {
      document.documentElement.dir = config.dir;
      document.documentElement.lang = locale;
    }
  }, [i18n.language]);

  return <>{children}</>;
}
```

**Translation File Example:**

```json
// public/locales/en/common.json
{
  "nav": {
    "dashboard": "Dashboard",
    "events": "Events",
    "participants": "Participants",
    "validation": "Validation",
    "badges": "Badges",
    "reports": "Reports",
    "settings": "Settings"
  },
  "actions": {
    "approve": "Approve",
    "reject": "Reject",
    "bypass": "Bypass",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "export": "Export",
    "import": "Import",
    "print": "Print",
    "search": "Search..."
  },
  "status": {
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected",
    "draft": "Draft",
    "active": "Active",
    "completed": "Completed",
    "printed": "Printed",
    "collected": "Collected"
  },
  "pagination": {
    "showing": "Showing {{from}} to {{to}} of {{total}} results",
    "page": "Page {{current}} of {{total}}",
    "rowsPerPage": "Rows per page"
  }
}
```

### 5.6 Saved Views

Airtable-style saved views for different roles:

- **Validators:** Table view filtered to their step with relevant fields
- **Printers:** Kanban board grouped by print status
- **Admins:** Comprehensive table with all custom fields
- **Focal Points:** Calendar view of delegation arrival dates

**Saved View Manager:**

```typescript
// components/organisms/ViewManager/ViewManager.tsx
import { useFetcher, useSearchParams } from "react-router";
import type { SavedView, ViewType } from "@prisma/client";

interface ViewManagerProps {
  views: SavedView[];
  activeViewId: string | null;
  targetModel: string;
  onViewChange: (view: SavedView) => void;
}

export function ViewManager({ views, activeViewId, targetModel, onViewChange }: ViewManagerProps) {
  const fetcher = useFetcher();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const viewTypeIcons: Record<ViewType, string> = {
    TABLE: "table",
    KANBAN: "columns",
    CALENDAR: "calendar",
    GALLERY: "grid",
  };

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2">
      {/* View tabs */}
      <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
        {views.map((view) => (
          <button
            key={view.id}
            role="tab"
            aria-selected={view.id === activeViewId}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap",
              "hover:bg-muted/50 transition-colors",
              view.id === activeViewId && "bg-muted font-medium"
            )}
            onClick={() => onViewChange(view)}
          >
            <Icon name={viewTypeIcons[view.type]} size={14} />
            {view.name}
            {view.isDefault && <Badge variant="outline" size="xs">Default</Badge>}
          </button>
        ))}
      </div>

      {/* Add view button */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        aria-label="Create new view"
      >
        <PlusIcon className="h-4 w-4" />
        Add view
      </button>

      {showCreateDialog && (
        <CreateViewDialog
          targetModel={targetModel}
          onClose={() => setShowCreateDialog(false)}
          onCreate={(view) => {
            fetcher.submit(
              { intent: "createView", ...view },
              { method: "post" }
            );
            setShowCreateDialog(false);
          }}
        />
      )}
    </div>
  );
}
```

### 5.7 Design System Tokens

Complete token catalog for the design system:

**Color Tokens:**

```typescript
// tokens/colors.ts
export const colorTokens = {
  // Primary palette (overridden per tenant via CSS custom properties)
  primary: {
    50: "var(--color-primary-50)",
    100: "var(--color-primary-100)",
    200: "var(--color-primary-200)",
    300: "var(--color-primary-300)",
    400: "var(--color-primary-400)",
    500: "var(--color-primary-500)", // Default primary
    600: "var(--color-primary-600)",
    700: "var(--color-primary-700)",
    800: "var(--color-primary-800)",
    900: "var(--color-primary-900)",
    950: "var(--color-primary-950)",
  },

  // Secondary palette
  secondary: {
    50: "var(--color-secondary-50)",
    100: "var(--color-secondary-100)",
    200: "var(--color-secondary-200)",
    300: "var(--color-secondary-300)",
    400: "var(--color-secondary-400)",
    500: "var(--color-secondary-500)",
    600: "var(--color-secondary-600)",
    700: "var(--color-secondary-700)",
    800: "var(--color-secondary-800)",
    900: "var(--color-secondary-900)",
    950: "var(--color-secondary-950)",
  },

  // Neutral palette
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
  },

  // Semantic colors
  semantic: {
    success: {
      light: { bg: "#f0fdf4", fg: "#166534", border: "#86efac", icon: "#16a34a" },
      dark: { bg: "#052e16", fg: "#86efac", border: "#166534", icon: "#4ade80" },
    },
    warning: {
      light: { bg: "#fffbeb", fg: "#92400e", border: "#fcd34d", icon: "#d97706" },
      dark: { bg: "#451a03", fg: "#fcd34d", border: "#92400e", icon: "#fbbf24" },
    },
    error: {
      light: { bg: "#fef2f2", fg: "#991b1b", border: "#fca5a5", icon: "#dc2626" },
      dark: { bg: "#450a0a", fg: "#fca5a5", border: "#991b1b", icon: "#f87171" },
    },
    info: {
      light: { bg: "#eff6ff", fg: "#1e40af", border: "#93c5fd", icon: "#2563eb" },
      dark: { bg: "#172554", fg: "#93c5fd", border: "#1e40af", icon: "#60a5fa" },
    },
  },
} as const;
```

**Spacing Tokens (4px grid):**

```typescript
// tokens/spacing.ts
export const spacingTokens = {
  0: "0px", // 0
  0.5: "2px", // 0.5 * 4
  1: "4px", // 1 * 4
  1.5: "6px", // 1.5 * 4
  2: "8px", // 2 * 4
  2.5: "10px", // 2.5 * 4
  3: "12px", // 3 * 4
  4: "16px", // 4 * 4
  5: "20px", // 5 * 4
  6: "24px", // 6 * 4
  8: "32px", // 8 * 4
  10: "40px", // 10 * 4
  12: "48px", // 12 * 4
  16: "64px", // 16 * 4
  20: "80px", // 20 * 4
  24: "96px", // 24 * 4
} as const;
```

**Typography Tokens:**

```typescript
// tokens/typography.ts
export const typographyTokens = {
  fontFamily: {
    sans: "var(--font-family, 'Inter', system-ui, -apple-system, sans-serif)",
    heading: "var(--font-heading, 'Inter', system-ui, -apple-system, sans-serif)",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSize: {
    xs: { size: "0.75rem", lineHeight: "1rem" }, // 12px
    sm: { size: "0.875rem", lineHeight: "1.25rem" }, // 14px
    base: { size: "1rem", lineHeight: "1.5rem" }, // 16px
    lg: { size: "1.125rem", lineHeight: "1.75rem" }, // 18px
    xl: { size: "1.25rem", lineHeight: "1.75rem" }, // 20px
    "2xl": { size: "1.5rem", lineHeight: "2rem" }, // 24px
    "3xl": { size: "1.875rem", lineHeight: "2.25rem" }, // 30px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
  },
} as const;
```

**Shadow Tokens:**

```typescript
// tokens/shadows.ts
export const shadowTokens = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;
```

**Border Radius Tokens:**

```typescript
// tokens/radius.ts
export const radiusTokens = {
  sm: "var(--radius-sm, 0.25rem)", // 4px
  md: "var(--radius-md, 0.375rem)", // 6px
  lg: "var(--radius-lg, 0.5rem)", // 8px
  xl: "var(--radius-xl, 0.75rem)", // 12px
  "2xl": "var(--radius-2xl, 1rem)", // 16px
  full: "9999px",
} as const;
```

**Transition Tokens:**

```typescript
// tokens/transitions.ts
export const transitionTokens = {
  fast: { duration: "150ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
  normal: { duration: "200ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
  slow: { duration: "300ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },

  property: {
    colors: "color, background-color, border-color, fill, stroke",
    opacity: "opacity",
    shadow: "box-shadow",
    transform: "transform",
    all: "all",
  },
} as const;
```

**Z-Index Layers:**

```typescript
// tokens/zIndex.ts
export const zIndexTokens = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  banner: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
  spotlight: 90,
} as const;
```

### 5.8 Component Library

Complete specification for all core components:

#### Button

```typescript
// components/atoms/Button/Button.tsx
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium transition-colors focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        danger:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Spinner size="sm" className="animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Accessibility requirements:
// - All interactive buttons must have accessible names (text content or aria-label)
// - Icon-only buttons must have aria-label
// - Loading state sets aria-busy="true"
// - Disabled state removes from tab order via disabled attribute
// - Focus ring visible on keyboard navigation (focus-visible)
// - Minimum touch target: 44x44px on mobile (enforced by min-h-11 min-w-11)
```

#### Input

```typescript
// components/atoms/Input/Input.tsx
import { forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1",
            "text-sm shadow-sm transition-colors file:border-0 file:bg-transparent",
            "file:text-sm file:font-medium placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          aria-invalid={error || undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Accessibility requirements:
// - Must have associated <Label> with htmlFor matching id
// - aria-invalid set when error prop is true
// - aria-describedby linked to error message element
// - Placeholder text supplements but does not replace label
```

#### Select

```typescript
// components/atoms/Select/Select.tsx
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Select({
  options, value, onValueChange, placeholder, error, disabled, ...props
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input",
          "bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive"
        )}
        aria-invalid={error || undefined}
        {...props}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border",
            "bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center",
                  "rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// Accessibility requirements:
// - Uses Radix UI primitives with built-in ARIA roles
// - Keyboard navigation: Arrow keys, Enter, Space, Escape
// - Screen reader announces selected value and options count
```

#### Dialog

```typescript
// components/atoms/Dialog/Dialog.tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[90vw]",
};

export function Dialog({ open, onOpenChange, title, description, children, size = "md" }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-overlay bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-modal w-full translate-x-[-50%] translate-y-[-50%]",
            "rounded-lg border bg-background p-6 shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            sizeClasses[size]
          )}
          aria-describedby={description ? "dialog-description" : undefined}
        >
          <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </DialogPrimitive.Title>

          {description && (
            <DialogPrimitive.Description id="dialog-description" className="text-sm text-muted-foreground mt-2">
              {description}
            </DialogPrimitive.Description>
          )}

          <div className="mt-4">{children}</div>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background
              transition-opacity hover:opacity-100 focus:outline-none focus:ring-2
              focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Accessibility requirements:
// - Focus trapped within dialog when open
// - Escape key closes dialog
// - Focus returns to trigger element on close
// - aria-labelledby and aria-describedby properly linked
// - Background content inert when dialog is open
```

#### Toast / Notification

```typescript
// components/molecules/Toast/Toast.tsx
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon, AlertTriangleIcon } from "~/components/atoms/Icon";

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center justify-between",
    "space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-80",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success: "border-success/50 bg-success/10 text-success-foreground",
        warning: "border-warning/50 bg-warning/10 text-warning-foreground",
        error: "border-destructive/50 bg-destructive/10 text-destructive-foreground",
        info: "border-info/50 bg-info/10 text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const variantIcons = {
  default: null,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
  info: InfoIcon,
};

interface ToastProps extends VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

export function Toast({ variant = "default", title, description, action, duration = 5000 }: ToastProps) {
  const Icon = variantIcons[variant ?? "default"];

  return (
    <ToastPrimitive.Root
      className={cn(toastVariants({ variant }))}
      duration={duration}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5" />}
        <div className="grid gap-1">
          <ToastPrimitive.Title className="text-sm font-semibold">
            {title}
          </ToastPrimitive.Title>
          {description && (
            <ToastPrimitive.Description className="text-sm opacity-90">
              {description}
            </ToastPrimitive.Description>
          )}
        </div>
      </div>

      {action && (
        <ToastPrimitive.Action altText={action.label} asChild>
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </ToastPrimitive.Action>
      )}

      <ToastPrimitive.Close
        className="absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity
          group-hover:opacity-100 focus:opacity-100"
        aria-label="Dismiss notification"
      >
        <XIcon className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

// Accessibility requirements:
// - role="status" for informational, role="alert" for errors
// - Auto-dismiss with configurable duration
// - Swipe to dismiss on touch devices
// - Focus management: does not steal focus from current task
// - Screen readers announce toast content via aria-live region
```

#### DataTable

```typescript
// components/organisms/DataTable/DataTable.tsx
import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  total: number;
  pageSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnCustomization?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  enableExport?: boolean;
  onRowClick?: (row: TData) => void;
  onBulkAction?: (action: string, selectedRows: TData[]) => void;
  bulkActions?: { label: string; action: string; icon?: string; variant?: string }[];
  emptyState?: React.ReactNode;
  loading?: boolean;
}

export function DataTable<TData extends { id: string }>({
  data,
  columns,
  total,
  pageSize = 25,
  enableSorting = true,
  enableFiltering = true,
  enableColumnCustomization = true,
  enableRowSelection = false,
  enablePagination = true,
  enableExport = false,
  onRowClick,
  onBulkAction,
  bulkActions = [],
  emptyState,
  loading,
}: DataTableProps<TData>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  });

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {enableFiltering && (
            <Input
              placeholder="Filter..."
              className="max-w-sm"
              leftIcon={<SearchIcon className="h-4 w-4" />}
              onChange={(e) =>
                table.getColumn("name")?.setFilterValue(e.target.value)
              }
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && bulkActions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} selected
              </span>
              {bulkActions.map((ba) => (
                <Button
                  key={ba.action}
                  variant={(ba.variant as any) ?? "outline"}
                  size="sm"
                  onClick={() => onBulkAction?.(ba.action, selectedRows)}
                >
                  {ba.label}
                </Button>
              ))}
            </div>
          )}

          {enableExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("csv")}>CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("xlsx")}>Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {enableColumnCustomization && (
            <ColumnVisibilityDropdown table={table} />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border" role="grid" aria-label="Data table">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50">
                {enableRowSelection && (
                  <th className="h-10 w-10 px-2">
                    <Checkbox
                      checked={table.getIsAllPageRowsSelected()}
                      onCheckedChange={(checked) =>
                        table.toggleAllPageRowsSelected(!!checked)
                      }
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "h-10 px-4 text-left align-middle font-medium text-muted-foreground",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    aria-sort={
                      header.column.getIsSorted() === "asc" ? "ascending"
                      : header.column.getIsSorted() === "desc" ? "descending"
                      : "none"
                    }
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <SortIcon direction={header.column.getIsSorted() as string} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (enableRowSelection ? 1 : 0)} className="p-0">
                  <TableSkeleton rows={pageSize} columns={columns.length} />
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    row.getIsSelected() && "bg-muted",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {enableRowSelection && (
                    <td className="w-10 px-2">
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select row ${row.index + 1}`}
                      />
                    </td>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {emptyState ?? "No results."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">
            {t("pagination.showing", {
              from: (table.getState().pagination.pageIndex * pageSize) + 1,
              to: Math.min((table.getState().pagination.pageIndex + 1) * pageSize, total),
              total,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm">
              {t("pagination.page", {
                current: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount(),
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Accessibility requirements:
// - role="grid" on container with aria-label
// - aria-sort on sortable column headers
// - Checkbox labels for row selection
// - Keyboard navigation: Tab for interactive elements, Arrow keys for cells
// - Screen reader announces sort changes and selection state
// - Pagination controls labeled with aria-label
```

#### Card

```typescript
// components/atoms/Card/Card.tsx
import { cn } from "~/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ className, variant = "default", padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-card text-card-foreground",
        variant === "default" && "border",
        variant === "bordered" && "border-2",
        variant === "elevated" && "shadow-md",
        padding === "sm" && "p-3",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
        padding === "none" && "p-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center pt-4", className)} {...props} />;
}
```

#### Badge / Tag

```typescript
// components/atoms/Badge/Badge.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:    "border-transparent bg-primary text-primary-foreground shadow",
        secondary:  "border-transparent bg-secondary text-secondary-foreground",
        outline:    "text-foreground",
        success:    "border-transparent bg-success/10 text-success",
        warning:    "border-transparent bg-warning/10 text-warning",
        error:      "border-transparent bg-destructive/10 text-destructive",
        info:       "border-transparent bg-info/10 text-info",
      },
      size: {
        xs: "px-1.5 py-0 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean;
  onRemove?: () => void;
}

export function Badge({ className, variant, size, removable, onRemove, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {children}
      {removable && (
        <button
          className="ml-1 rounded-full outline-none ring-offset-background
            focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          aria-label={`Remove ${children}`}
        >
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

#### Avatar

```typescript
// components/atoms/Avatar/Avatar.tsx
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "~/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({ src, alt, fallback, size = "md" }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizeClasses[size])}>
      <AvatarPrimitive.Image
        src={src ?? undefined}
        alt={alt}
        className="aspect-square h-full w-full"
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium"
        delayMs={600}
      >
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
```

#### Tabs

```typescript
// components/molecules/Tabs/Tabs.tsx
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "~/lib/utils";

interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      <TabsPrimitive.List
        className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
        aria-label="View options"
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1",
              "text-sm font-medium ring-offset-background transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
            )}
          >
            {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="secondary" size="xs" className="ml-1.5">
                {tab.count}
              </Badge>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

// Accessibility: Radix Tabs provides full keyboard nav (Arrow keys, Home, End)
```

#### Breadcrumb

```typescript
// components/molecules/Breadcrumb/Breadcrumb.tsx
import { Link } from "react-router";
import { ChevronRightIcon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />}
            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(index === items.length - 1 && "text-foreground font-medium")}
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

#### Sidebar Navigation

```typescript
// components/organisms/Sidebar/Sidebar.tsx
import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useUserPreferences } from "~/hooks/useUserPreferences";
import { cn } from "~/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
  permission?: string;
}

interface SidebarProps {
  items: NavItem[];
  tenantSlug: string;
  eventSlug?: string;
}

export function Sidebar({ items, tenantSlug, eventSlug }: SidebarProps) {
  const { t } = useTranslation();
  const { sidebarCollapsed } = useUserPreferences();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar h-full transition-all duration-normal",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b">
        {sidebarCollapsed ? (
          <img src="var(--logomark-url)" alt="Logo" className="h-8 w-8" />
        ) : (
          <img src="var(--logo-url)" alt="Logo" className="h-8" />
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1" role="list">
          {items.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    "transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground",
                    sidebarCollapsed && "justify-center px-2"
                  )
                }
                title={sidebarCollapsed ? t(`nav.${item.label}`) : undefined}
              >
                <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{t(`nav.${item.label}`)}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="default" size="xs">
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full rounded-md p-2
            text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
}
```

### 5.9 Offline Strategy

Service Worker registration with Workbox for offline-capable workflows.

**Service Worker Registration:**

```typescript
// entry.client.tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available - notify user
              dispatchEvent(new CustomEvent("sw-update-available"));
            }
          });
        });
      })
      .catch((error) => console.error("SW registration failed:", error));
  });
}
```

**Service Worker with Workbox:**

```typescript
// public/sw.js
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// Precache build assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Strategy 1: CacheFirst for static assets (JS, CSS, fonts)
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 days
    ],
  }),
);

// Strategy 2: NetworkFirst for API requests
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 }), // 1 day
    ],
  }),
);

// Strategy 3: StaleWhileRevalidate for images
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }), // 7 days
    ],
  }),
);

// Strategy 4: NetworkFirst for HTML navigation
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 3,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);
```

**Offline Mutation Queue:**

```typescript
// services/offline-queue.ts
import { openDB, type IDBPDatabase } from "idb";

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
  conflictStrategy: "client-wins" | "server-wins" | "manual";
}

const DB_NAME = "accreditation-offline";
const STORE_NAME = "mutation-queue";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    },
  });
}

export async function queueMutation(
  mutation: Omit<QueuedMutation, "id" | "timestamp" | "retryCount">,
): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const entry: QueuedMutation = {
    ...mutation,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };
  await db.put(STORE_NAME, entry);
  return id;
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, "timestamp");
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function syncMutations(): Promise<{
  synced: number;
  failed: number;
  conflicts: QueuedMutation[];
}> {
  const mutations = await getPendingMutations();
  let synced = 0;
  let failed = 0;
  const conflicts: QueuedMutation[] = [];

  for (const mutation of mutations) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: {
          ...mutation.headers,
          "X-Offline-Mutation": "true",
          "X-Mutation-Timestamp": mutation.timestamp.toString(),
        },
        body: mutation.body,
      });

      if (response.ok) {
        await removeMutation(mutation.id);
        synced++;
      } else if (response.status === 409) {
        // Conflict detected
        if (mutation.conflictStrategy === "client-wins") {
          // Retry with force flag
          const retryResponse = await fetch(mutation.url, {
            method: mutation.method,
            headers: { ...mutation.headers, "X-Force-Overwrite": "true" },
            body: mutation.body,
          });
          if (retryResponse.ok) {
            await removeMutation(mutation.id);
            synced++;
          } else {
            conflicts.push(mutation);
          }
        } else if (mutation.conflictStrategy === "server-wins") {
          await removeMutation(mutation.id);
          synced++; // Discard local change
        } else {
          conflicts.push(mutation);
        }
      } else {
        failed++;
        // Increment retry count
        const db = await getDB();
        await db.put(STORE_NAME, { ...mutation, retryCount: mutation.retryCount + 1 });
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed, conflicts };
}
```

**Offline Indicator Component:**

```typescript
// components/molecules/OfflineIndicator/OfflineIndicator.tsx
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { getPendingMutations, syncMutations } from "~/services/offline-queue";
import { WifiOffIcon, CloudUploadIcon, CheckCircleIcon } from "~/components/atoms/Icon";
import { useTranslation } from "react-i18next";

export function OfflineIndicator() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-sync when back online
      setSyncing(true);
      const result = await syncMutations();
      setSyncing(false);
      setPendingCount(result.conflicts.length);

      if (result.synced > 0) {
        toast.success(t("offline.syncComplete", { count: result.synced }));
      }
      if (result.conflicts.length > 0) {
        toast.warning(t("offline.conflictsDetected", { count: result.conflicts.length }));
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check pending mutations periodically
    const interval = setInterval(async () => {
      const pending = await getPendingMutations();
      setPendingCount(pending.length);
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [t]);

  if (isOnline && pendingCount === 0 && !syncing) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-toast flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg",
        "text-sm font-medium transition-all animate-in slide-in-from-bottom-4",
        !isOnline && "bg-warning/90 text-warning-foreground",
        isOnline && syncing && "bg-info/90 text-info-foreground",
        isOnline && pendingCount > 0 && !syncing && "bg-muted text-muted-foreground"
      )}
      role="status"
      aria-live="polite"
    >
      {!isOnline && (
        <>
          <WifiOffIcon className="h-4 w-4" />
          <span>{t("offline.youAreOffline")}</span>
          {pendingCount > 0 && (
            <Badge variant="outline" size="xs">{pendingCount} pending</Badge>
          )}
        </>
      )}

      {isOnline && syncing && (
        <>
          <CloudUploadIcon className="h-4 w-4 animate-pulse" />
          <span>{t("offline.syncing")}</span>
        </>
      )}

      {isOnline && pendingCount > 0 && !syncing && (
        <>
          <CheckCircleIcon className="h-4 w-4" />
          <span>{t("offline.conflictsNeedReview", { count: pendingCount })}</span>
          <Button variant="outline" size="sm" onClick={() => navigate("/offline/conflicts")}>
            Review
          </Button>
        </>
      )}
    </div>
  );
}
```

### 5.10 Theming and White-Labeling

Per-tenant CSS custom properties enable full white-labeling without code changes.

**CSS Custom Properties Per Tenant:**

```css
/* styles/theme-defaults.css */
:root {
  /* Colors - overridden per tenant */
  --color-primary: #2563eb;
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  --color-secondary: #7c3aed;
  --color-secondary-50: #f5f3ff;
  --color-secondary-500: #8b5cf6;
  --color-secondary-600: #7c3aed;
  --color-secondary-700: #6d28d9;

  /* Typography */
  --font-family: "Inter", system-ui, -apple-system, sans-serif;
  --font-heading: "Inter", system-ui, -apple-system, sans-serif;

  /* Branding */
  --logo-url: url("/images/default-logo.svg");
  --logomark-url: url("/images/default-logomark.svg");

  /* Border radius (tenant-configurable) */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;

  /* Light mode */
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  --color-card: #ffffff;
  --color-card-foreground: #0a0a0a;
  --color-border: #e5e5e5;
}

/* Dark mode */
:root.dark {
  --color-background: #0a0a0a;
  --color-foreground: #fafafa;
  --color-muted: #262626;
  --color-muted-foreground: #a3a3a3;
  --color-card: #171717;
  --color-card-foreground: #fafafa;
  --color-border: #262626;
}
```

**Tenant Theme Loader:**

```typescript
// services/theme.server.ts
import type { ThemeConfig } from "@prisma/client";
import { generateColorScale } from "~/lib/color-utils";

export function generateTenantCSS(theme: ThemeConfig): string {
  const primaryScale = generateColorScale(theme.primaryColor);
  const secondaryScale = generateColorScale(theme.secondaryColor);

  return `
    :root {
      --color-primary: ${theme.primaryColor};
      ${Object.entries(primaryScale)
        .map(([shade, color]) => `--color-primary-${shade}: ${color};`)
        .join("\n      ")}

      --color-secondary: ${theme.secondaryColor};
      ${Object.entries(secondaryScale)
        .map(([shade, color]) => `--color-secondary-${shade}: ${color};`)
        .join("\n      ")}

      --color-success: ${theme.successColor};
      --color-warning: ${theme.warningColor};
      --color-destructive: ${theme.errorColor};

      --font-family: "${theme.fontFamily}", system-ui, -apple-system, sans-serif;
      --font-heading: "${theme.headingFont}", system-ui, -apple-system, sans-serif;

      ${theme.logoUrl ? `--logo-url: url("${theme.logoUrl}");` : ""}
      ${theme.logomarkUrl ? `--logomark-url: url("${theme.logomarkUrl}");` : ""}

      --radius-sm: ${radiusMap[theme.borderRadius].sm};
      --radius-md: ${radiusMap[theme.borderRadius].md};
      --radius-lg: ${radiusMap[theme.borderRadius].lg};
    }

    ${theme.customCss ?? ""}
  `;
}

const radiusMap: Record<string, { sm: string; md: string; lg: string }> = {
  sm:   { sm: "0.125rem", md: "0.25rem",  lg: "0.375rem" },
  md:   { sm: "0.25rem",  md: "0.375rem", lg: "0.5rem" },
  lg:   { sm: "0.375rem", md: "0.5rem",   lg: "0.75rem" },
  full: { sm: "0.5rem",   md: "0.75rem",  lg: "1rem" },
};

// Inject in root layout loader:
export async function loader({ params }: LoaderFunctionArgs) {
  const theme = await getThemeConfig(params.tenantSlug!);
  const tenantCSS = generateTenantCSS(theme);
  return json({ tenantCSS, theme });
}

// In root layout component:
export default function TenantLayout() {
  const { tenantCSS } = useLoaderData<typeof loader>();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tenantCSS }} />
      <Outlet />
    </>
  );
}
```

**Dark Mode Toggle:**

```typescript
// hooks/useTheme.ts
import { useFetcher } from "react-router";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const fetcher = useFetcher();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === "undefined") return "system";
    return (document.documentElement.dataset.theme as Theme) ?? "system";
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Apply immediately
    const resolved =
      newTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : newTheme;

    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.theme = newTheme;

    // Persist to server
    fetcher.submit({ theme: newTheme }, { method: "post", action: "/api/preferences" });
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  return { theme, setTheme };
}
```

**Theme Preview in Admin:**

```typescript
// components/organisms/ThemePreview/ThemePreview.tsx
interface ThemePreviewProps {
  config: Partial<ThemeConfig>;
}

export function ThemePreview({ config }: ThemePreviewProps) {
  const previewCSS = generateTenantCSS({
    ...defaultThemeConfig,
    ...config,
  } as ThemeConfig);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 bg-muted text-sm font-medium">Live Preview</div>
      <div className="theme-preview-container" style={{ isolation: "isolate" }}>
        <style scoped>{`.theme-preview-container { ${previewCSS} }`}</style>
        <div className="p-6 space-y-4 bg-[var(--color-background)]">
          {/* Mini dashboard preview */}
          <div className="flex gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="flex gap-3">
            <Badge variant="success">Approved</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="error">Rejected</Badge>
            <Badge variant="info">In Review</Badge>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Sample Card</CardTitle>
              <CardDescription>Preview of card component with tenant theme</CardDescription>
            </CardHeader>
            <CardContent>
              <Input placeholder="Sample input field" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### 5.11 State Management Patterns

**Server State (Loaders with defer/await):**

```typescript
// Pattern: Critical vs. non-critical data loading
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const tenant = await requireTenantAccess(user, params.tenantSlug!);

  // Critical: blocks render (awaited)
  const event = await getEvent(tenant.id, params.eventSlug!);
  const permissions = await getUserPermissions(user.id, tenant.id);

  // Non-critical: streams in (deferred)
  const statsPromise = getEventStats(event.id);
  const activityPromise = getRecentActivity(event.id);
  const chartsPromise = getChartData(event.id);

  return defer({
    event,
    permissions,
    stats: statsPromise,
    activity: activityPromise,
    charts: chartsPromise,
  });
}

// Component with Suspense boundaries
export default function EventDashboard() {
  const { event, permissions, stats, activity, charts } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <h1>{event.name}</h1>

      <Suspense fallback={<MetricCardsSkeleton />}>
        <Await resolve={stats}>
          {(resolvedStats) => <MetricCards stats={resolvedStats} />}
        </Await>
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <Await resolve={charts}>
            {(resolvedCharts) => <DashboardCharts data={resolvedCharts} />}
          </Await>
        </Suspense>

        <Suspense fallback={<ActivitySkeleton />}>
          <Await resolve={activity}>
            {(resolvedActivity) => <ActivityFeed items={resolvedActivity} />}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
```

**Client State (useState for UI, useReducer for complex forms):**

```typescript
// Pattern: useReducer for complex form state (e.g., multi-step wizard)
interface WizardState {
  currentStep: number;
  steps: { id: string; label: string; completed: boolean; data: Record<string, unknown> }[];
  errors: Record<string, string[]>;
  isDirty: boolean;
}

type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; step: number }
  | { type: "SET_STEP_DATA"; stepId: string; data: Record<string, unknown> }
  | { type: "SET_ERRORS"; errors: Record<string, string[]> }
  | { type: "MARK_COMPLETE"; stepId: string }
  | { type: "RESET" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT_STEP":
      return { ...state, currentStep: Math.min(state.currentStep + 1, state.steps.length - 1) };
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case "GO_TO_STEP":
      return { ...state, currentStep: action.step };
    case "SET_STEP_DATA":
      return {
        ...state,
        isDirty: true,
        steps: state.steps.map((s) =>
          s.id === action.stepId ? { ...s, data: { ...s.data, ...action.data } } : s,
        ),
      };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "MARK_COMPLETE":
      return {
        ...state,
        steps: state.steps.map((s) => (s.id === action.stepId ? { ...s, completed: true } : s)),
      };
    case "RESET":
      return initialWizardState;
    default:
      return state;
  }
}
```

**URL State (searchParams for filters/pagination/sort):**

```typescript
// hooks/useTableParams.ts
import { useSearchParams } from "react-router";

interface TableParams {
  page: number;
  pageSize: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
  filters: Record<string, string>;
}

export function useTableParams(defaults?: Partial<TableParams>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: TableParams = {
    page: parseInt(searchParams.get("page") ?? String(defaults?.page ?? 1)),
    pageSize: parseInt(searchParams.get("pageSize") ?? String(defaults?.pageSize ?? 25)),
    sort: searchParams.get("sort") ?? defaults?.sort ?? "createdAt",
    order: (searchParams.get("order") as "asc" | "desc") ?? defaults?.order ?? "desc",
    search: searchParams.get("q") ?? defaults?.search ?? "",
    filters: Object.fromEntries(
      Array.from(searchParams.entries()).filter(([key]) => key.startsWith("filter.")),
    ),
  };

  const setParam = (key: string, value: string | number | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      // Reset to page 1 when filters change
      if (key !== "page") next.set("page", "1");
      return next;
    });
  };

  return { params, setParam, setSearchParams };
}
```

**SSE State (EventSource with real-time updates):**

```typescript
// Pattern: Real-time notification count via SSE
function useNotificationCount() {
  const [count, setCount] = useState(0);
  const revalidator = useRevalidator();

  useSSE({
    url: "/api/notifications?channel=user",
    events: ["notification.created", "notification.read", "notification.cleared"],
    onMessage: (event, data: { unreadCount: number }) => {
      setCount(data.unreadCount);
      if (event === "notification.created") {
        revalidator.revalidate();
      }
    },
  });

  return count;
}
```

### 5.12 Responsive Breakpoints

| Breakpoint | Min Width | Typical Devices                    | Usage                             |
| ---------- | --------- | ---------------------------------- | --------------------------------- |
| `sm`       | 640px     | Large phones (landscape)           | Stack to horizontal layout        |
| `md`       | 768px     | Tablets (portrait)                 | Two-column layouts                |
| `lg`       | 1024px    | Tablets (landscape), small laptops | Sidebar visible                   |
| `xl`       | 1280px    | Desktop monitors                   | Full layout with side panels      |
| `2xl`      | 1536px    | Large monitors                     | Extended data tables, multi-panel |

**Mobile-First CSS Classes:**

```css
/* Base (mobile): single column, full width */
.page-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

/* sm: minimal adjustments */
@media (min-width: 640px) {
  .page-layout {
    padding: 0 1rem;
  }
}

/* md: two-column where needed */
@media (min-width: 768px) {
  .split-layout {
    grid-template-columns: 1fr 1fr;
  }
}

/* lg: sidebar appears, content area expands */
@media (min-width: 1024px) {
  .app-layout {
    grid-template-columns: 16rem 1fr;
  }
  .sidebar {
    display: flex;
  }
  .mobile-nav {
    display: none;
  }
}

/* xl: wider content, side panels */
@media (min-width: 1280px) {
  .app-layout {
    grid-template-columns: 16rem 1fr 20rem;
  }
}

/* 2xl: maximum content width */
@media (min-width: 1536px) {
  .content-area {
    max-width: 1400px;
    margin: 0 auto;
  }
}
```

**Touch-Friendly Targets:**

```typescript
// All interactive elements enforce minimum 44x44px touch targets
// components/atoms/TouchTarget.tsx
export function TouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative">
      {children}
      {/* Invisible touch target expansion */}
      <span
        className="absolute -inset-2 min-h-[44px] min-w-[44px]"
        aria-hidden="true"
      />
    </span>
  );
}
```

**Responsive Navigation Pattern:**

```typescript
// components/organisms/ResponsiveNav/ResponsiveNav.tsx
export function ResponsiveNav({ items }: { items: NavItem[] }) {
  return (
    <>
      {/* Desktop: Sidebar (lg+) */}
      <div className="hidden lg:flex">
        <Sidebar items={items} />
      </div>

      {/* Mobile: Bottom tab bar (< lg) */}
      <div className="fixed bottom-0 left-0 right-0 z-sticky border-t bg-background lg:hidden">
        <nav className="flex items-center justify-around h-16" role="navigation" aria-label="Mobile navigation">
          {items.slice(0, 5).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs min-w-[44px] min-h-[44px]",
                  "justify-center transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground
                  rounded-full text-[10px] min-w-[18px] h-[18px] flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile: Add bottom padding to content to account for bottom nav */}
      <div className="pb-16 lg:pb-0" />
    </>
  );
}
```

---

## 6. User Interface

### 6.1 Main Navigation Shell

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐  Global Search [Cmd+K]                    🔔 3  👤 Admin ▼ │
│ │  LOGO    │  ┌─────────────────────────────────────┐                    │
│ └──────────┘  │ Search participants, events...    / │                    │
│               └─────────────────────────────────────┘                    │
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                             │
│ Dashboard  │                                                             │
│ ─────────  │                     CONTENT AREA                           │
│ 📊 Overview│                                                             │
│            │   (Page-specific content rendered here)                     │
│ Events     │                                                             │
│ ─────────  │                                                             │
│ 📋 All     │                                                             │
│ ➕ Create   │                                                             │
│            │                                                             │
│ Management │                                                             │
│ ─────────  │                                                             │
│ 👥 Users   │                                                             │
│ ⚙️ Settings │                                                             │
│ 🎨 Branding│                                                             │
│            │                                                             │
│            │                                                             │
│ ─────────  │                                                             │
│ [◀ Collapse│                                                             │
│  sidebar]  │                                                             │
├────────────┴─────────────────────────────────────────────────────────────┤
│ Footer: Version 1.0  |  Tenant: AU Headquarters  |  Online ● Connected  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Event Dashboard: General Assembly 2026                                  │
│  Breadcrumb: AU HQ > Events > General Assembly 2026                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Total        │  │ Approved     │  │ Pending      │  │ Badges     │  │
│  │ Participants │  │              │  │ Validation   │  │ Printed    │  │
│  │              │  │              │  │              │  │            │  │
│  │    1,247     │  │     892      │  │     213      │  │    756     │  │
│  │  ↑ 12% week  │  │  ↑ 8% week   │  │  ↓ 15% week  │  │  ↑ 23%    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                         │
│  ┌──────────────────────────────┐  ┌────────────────────────────────┐  │
│  │  Registration Trend          │  │  Recent Activity               │  │
│  │  ┌─────────────────────────┐ │  │                                │  │
│  │  │         ___             │ │  │  ● John approved P-1042       │  │
│  │  │       _/   \            │ │  │    2 minutes ago              │  │
│  │  │      /      \___        │ │  │                                │  │
│  │  │    _/            \      │ │  │  ● Badge printed for P-0987   │  │
│  │  │   /               \     │ │  │    5 minutes ago              │  │
│  │  │  /                 \___ │ │  │                                │  │
│  │  │ /                      ││ │  │  ● New delegation: Kenya      │  │
│  │  └─────────────────────────┘ │  │    12 minutes ago             │  │
│  │  Jan  Feb  Mar  Apr  May     │  │                                │  │
│  └──────────────────────────────┘  │  ● Schema updated by Admin    │  │
│                                     │    1 hour ago                 │  │
│  ┌──────────────────────────────┐  │                                │  │
│  │  Status Distribution (Pie)   │  │  [View all activity →]        │  │
│  │                              │  └────────────────────────────────┘  │
│  │     ████ Approved  72%       │                                      │
│  │     ████ Pending   17%       │                                      │
│  │     ████ Rejected   8%       │                                      │
│  │     ████ Draft      3%       │                                      │
│  └──────────────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 DataTable View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Participants                                            [+ New] [↓ Export]│
│                                                                         │
│  ┌─ Views ──────────────────────────────────────────────┐              │
│  │ [📊 All Participants] [📊 My Queue] [📋 Kanban] [📅 Calendar] [+ Add]│
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─ Toolbar ────────────────────────────────────────────────────────┐  │
│  │ 🔍 [Filter participants...      ]   Status ▼   Category ▼       │  │
│  │                                     3 selected: [Approve] [Reject]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──┬────────────────┬────────────┬──────────┬────────┬─────────────┐  │
│  │☐ │ Name         ▲ │ Organization│ Status   │ Step   │ Updated     │  │
│  ├──┼────────────────┼────────────┼──────────┼────────┼─────────────┤  │
│  │☐ │ Alice Johnson  │ Kenya Del. │ ●Approved│ Badge  │ 2 min ago   │  │
│  │☑ │ Bob Smith      │ Nigeria D. │ ●Pending │ Review │ 5 min ago   │  │
│  │☑ │ Clara Diaz     │ Brazil Del.│ ●Pending │ Review │ 12 min ago  │  │
│  │☐ │ David Chen     │ China Del. │ ●Rejected│ Review │ 1 hour ago  │  │
│  │☐ │ Eva Mueller    │ Germany D. │ ●Approved│ Print  │ 1 hour ago  │  │
│  │☑ │ Frank Osei     │ Ghana Del. │ ●Pending │ Review │ 2 hours ago │  │
│  │☐ │ Grace Kim      │ S.Korea D. │ ●Draft   │ Submit │ 3 hours ago │  │
│  │☐ │ Hassan Ali     │ Egypt Del. │ ●Approved│ Collect│ 3 hours ago │  │
│  │☐ │ Ines Moreira   │ Portugal D.│ ●Approved│ Badge  │ 4 hours ago │  │
│  │☐ │ James Wilson   │ UK Del.    │ ●Pending │ Review │ 5 hours ago │  │
│  └──┴────────────────┴────────────┴──────────┴────────┴─────────────┘  │
│                                                                         │
│  Showing 1 to 10 of 1,247 results     Rows per page: [25 ▼]           │
│                                    [< Previous]  Page 1 of 50  [Next >] │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Kanban Board View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Print Queue - Kanban View                             [⚙ Configure]   │
│                                                                         │
│  ┌─ Views ──────────────────────────────────────────────────────────┐  │
│  │ [📊 Table] [📋 Kanban ●] [📅 Calendar] [+ Add view]             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ QUEUED (42) │  │PRINTING (5) │  │ PRINTED (89)│  │COLLECTED(156│  │
│  │─────────────│  │─────────────│  │─────────────│  │─────────────│  │
│  │┌───────────┐│  │┌───────────┐│  │┌───────────┐│  │┌───────────┐│  │
│  ││ P-1042    ││  ││ P-0987    ││  ││ P-0845    ││  ││ P-0721    ││  │
│  ││ A.Johnson ││  ││ B.Smith   ││  ││ C.Diaz    ││  ││ D.Chen    ││  │
│  ││ Kenya     ││  ││ Nigeria   ││  ││ Brazil    ││  ││ China     ││  │
│  ││ VIP ●     ││  ││ Staff ●   ││  ││ Delegate ●││  ││ Observer ●││  │
│  │└───────────┘│  │└───────────┘│  │└───────────┘│  │└───────────┘│  │
│  │┌───────────┐│  │┌───────────┐│  │┌───────────┐│  │┌───────────┐│  │
│  ││ P-1043    ││  ││ P-0988    ││  ││ P-0846    ││  ││ P-0722    ││  │
│  ││ E.Mueller ││  ││ F.Osei    ││  ││ G.Kim     ││  ││ H.Ali     ││  │
│  ││ Germany   ││  ││ Ghana     ││  ││ S.Korea   ││  ││ Egypt     ││  │
│  ││ Delegate ●││  ││ Media ●   ││  ││ VIP ●     ││  ││ Staff ●   ││  │
│  │└───────────┘│  │└───────────┘│  │└───────────┘│  │└───────────┘│  │
│  │┌───────────┐│  │┌───────────┐│  │             │  │             │  │
│  ││ P-1044    ││  ││ P-0989    ││  │             │  │             │  │
│  ││ I.Moreira ││  ││ J.Wilson  ││  │             │  │             │  │
│  ││ Portugal  ││  ││ UK        ││  │             │  │             │  │
│  ││ Delegate ●││  ││ Delegate ●││  │             │  │             │  │
│  │└───────────┘│  │└───────────┘│  │             │  │             │  │
│  │    ...      │  │    ...      │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
│  Drag cards between columns to update status                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Calendar View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Delegations - Calendar View                [Month ▼]  [< Jan 2026 >]  │
│                                                                         │
│  ┌─ Views ──────────────────────────────────────────────────────────┐  │
│  │ [📊 Table] [📋 Kanban] [📅 Calendar ●] [+ Add view]             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                          │
│  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │                          │
│  │     │     │     │Kenya│Kenya│     │     │                          │
│  │     │     │     │ (12)│ (12)│     │     │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │                          │
│  │     │Naija│Naija│Naija│     │     │     │                          │
│  │     │ (8) │ (8) │ (8) │     │     │     │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │ 15  │ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │                          │
│  │Egypt│Egypt│     │     │Germ.│Germ.│     │                          │
│  │ (15)│ (15)│     │     │ (10)│ (10)│     │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │ 22  │ 23  │ 24  │ 25  │ 26  │ 27  │ 28  │                          │
│  │     │Brazi│Brazi│Brazi│     │     │     │                          │
│  │     │ (20)│ (20)│ (20)│     │     │     │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │ 29  │ 30  │ 31  │     │     │     │     │                          │
│  │UK   │UK   │     │     │     │     │     │                          │
│  │ (6) │ (6) │     │     │     │     │     │                          │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                          │
│                                                                         │
│  Legend: Delegation name (participant count) -- color by category       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Gallery View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Participants - Gallery View                          [Grid: 4 cols ▼]  │
│                                                                         │
│  ┌─ Views ──────────────────────────────────────────────────────────┐  │
│  │ [📊 Table] [📋 Kanban] [📅 Calendar] [🖼 Gallery ●] [+ Add]     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌────────┐  │
│  │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌────┐ │  │
│  │ │   Photo   │ │  │ │   Photo   │ │  │ │   Photo   │ │  │ │Photo│ │  │
│  │ │  Avatar   │ │  │ │  Avatar   │ │  │ │  Avatar   │ │  │ │ Av. │ │  │
│  │ └───────────┘ │  │ └───────────┘ │  │ └───────────┘ │  │ └────┘ │  │
│  │ Alice Johnson │  │ Bob Smith     │  │ Clara Diaz    │  │ D.Chen │  │
│  │ Kenya Del.    │  │ Nigeria Del.  │  │ Brazil Del.   │  │ China  │  │
│  │ ● Approved    │  │ ● Pending     │  │ ● Pending     │  │● Rejec.│  │
│  │ VIP           │  │ Staff         │  │ Delegate      │  │Observe.│  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └────────┘  │
│                                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌────────┐  │
│  │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌────┐ │  │
│  │ │   Photo   │ │  │ │   Photo   │ │  │ │   Photo   │ │  │ │Photo│ │  │
│  │ │  Avatar   │ │  │ │  Avatar   │ │  │ │  Avatar   │ │  │ │ Av. │ │  │
│  │ └───────────┘ │  │ └───────────┘ │  │ └───────────┘ │  │ └────┘ │  │
│  │ Eva Mueller   │  │ Frank Osei    │  │ Grace Kim     │  │ H.Ali  │  │
│  │ Germany Del.  │  │ Ghana Del.    │  │ S.Korea Del.  │  │ Egypt  │  │
│  │ ● Approved    │  │ ● Pending     │  │ ● Draft       │  │● Appr. │  │
│  │ Delegate      │  │ Media         │  │ VIP           │  │ Staff  │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └────────┘  │
│                                                                         │
│  Showing 1-8 of 1,247                              [Load more ↓]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.7 Notification Center

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header:   ... [🔔 3] ...                                            │
│                  │                                                    │
│                  ▼                                                    │
│            ┌─────────────────────────────────┐                       │
│            │ Notifications              [⚙]  │                       │
│            │ ┌─────────────────────────────┐ │                       │
│            │ │ All  Unread (3)  Mentions   │ │                       │
│            │ └─────────────────────────────┘ │                       │
│            │                                 │                       │
│            │ TODAY                            │                       │
│            │ ┌─────────────────────────────┐ │                       │
│            │ │ ● Participant P-1042         │ │                       │
│            │ │   approved by John Doe       │ │                       │
│            │ │   2 minutes ago              │ │                       │
│            │ └─────────────────────────────┘ │                       │
│            │ ┌─────────────────────────────┐ │                       │
│            │ │ ● New delegation registered  │ │                       │
│            │ │   Kenya (12 participants)    │ │                       │
│            │ │   15 minutes ago             │ │                       │
│            │ └─────────────────────────────┘ │                       │
│            │ ┌─────────────────────────────┐ │                       │
│            │ │ ● Badge batch #45 completed  │ │                       │
│            │ │   89 badges printed          │ │                       │
│            │ │   1 hour ago                 │ │                       │
│            │ └─────────────────────────────┘ │                       │
│            │                                 │                       │
│            │ YESTERDAY                       │                       │
│            │ ┌─────────────────────────────┐ │                       │
│            │ │ ○ Workflow step "Security"   │ │                       │
│            │ │   added to pipeline          │ │                       │
│            │ │   Yesterday at 4:32 PM       │ │                       │
│            │ └─────────────────────────────┘ │                       │
│            │                                 │                       │
│            │ [Mark all as read]  [View all →]│                       │
│            └─────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.8 User Profile and Preferences

```
┌─────────────────────────────────────────────────────────────────────────┐
│  User Profile & Preferences                                            │
│  Breadcrumb: AU HQ > Profile > Preferences                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Profile ─────────────────────────────────────────────────────────┐ │
│  │  ┌──────┐  John Doe                                               │ │
│  │  │ [AV] │  john.doe@example.com                                   │ │
│  │  │      │  Role: Event Manager                                    │ │
│  │  └──────┘  Member since: Jan 2025                                 │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ Appearance ──────────────────────────────────────────────────────┐ │
│  │  Theme:        [Light ○]  [Dark ○]  [System ●]                    │ │
│  │  Density:      [Compact ○]  [Normal ●]  [Comfortable ○]          │ │
│  │  Sidebar:      [Expanded ●]  [Collapsed ○]                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ Language & Region ───────────────────────────────────────────────┐ │
│  │  Language:     [English          ▼]                                │ │
│  │  Timezone:     [Africa/Addis_Ababa    ▼]                          │ │
│  │  Date Format:  [YYYY-MM-DD       ▼]                               │ │
│  │  Number Format:[1,234.56 (en-US) ▼]                               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ Accessibility ───────────────────────────────────────────────────┐ │
│  │  Keyboard Shortcuts:  [✓ Enabled]                                 │ │
│  │  Sound Effects:       [  Disabled]                                │ │
│  │  Reduced Motion:      [  Disabled]                                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ Notifications ───────────────────────────────────────────────────┐ │
│  │  Type                    Email  Push  In-App  SMS   Digest        │ │
│  │  ─────────────────────   ─────  ────  ──────  ───   ──────        │ │
│  │  Workflow completed      [✓]    [✓]   [✓]     [ ]   Immediate    │ │
│  │  Participant approved    [✓]    [ ]   [✓]     [ ]   Hourly       │ │
│  │  Badge printed           [ ]    [ ]   [✓]     [ ]   Daily        │ │
│  │  Delegation registered   [✓]    [✓]   [✓]     [ ]   Immediate    │ │
│  │  System alerts           [✓]    [✓]   [✓]     [✓]   Immediate    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                    [Cancel]  [Save Preferences]        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.9 Tenant Switcher

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header:  [AU HQ ▼]  ...                                            │
│             │                                                        │
│             ▼                                                        │
│       ┌──────────────────────────────┐                               │
│       │ Switch Organization          │                               │
│       │ ┌──────────────────────────┐ │                               │
│       │ │ 🔍 Search tenants...     │ │                               │
│       │ └──────────────────────────┘ │                               │
│       │                              │                               │
│       │ CURRENT                      │                               │
│       │ ┌──────────────────────────┐ │                               │
│       │ │ ✓  AU Headquarters       │ │                               │
│       │ │    admin@au.org          │ │                               │
│       │ │    Role: Tenant Admin    │ │                               │
│       │ └──────────────────────────┘ │                               │
│       │                              │                               │
│       │ OTHER ORGANIZATIONS          │                               │
│       │ ┌──────────────────────────┐ │                               │
│       │ │    ECOWAS Commission     │ │                               │
│       │ │    manager@ecowas.org    │ │                               │
│       │ │    Role: Event Manager   │ │                               │
│       │ └──────────────────────────┘ │                               │
│       │ ┌──────────────────────────┐ │                               │
│       │ │    SADC Secretariat      │ │                               │
│       │ │    viewer@sadc.org       │ │                               │
│       │ │    Role: Validator       │ │                               │
│       │ └──────────────────────────┘ │                               │
│       │                              │                               │
│       └──────────────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.10 Global Search Results

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔍  john smith                                          [ESC]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ General Assembly 2026 (3 results) ───────────────────────────────┐ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 👤 John Smith  ·  P-1042  ·  UK Delegation               │   │ │
│  │  │ Status: ● Approved  ·  Step: Badge Printing               │   │ │
│  │  │ Match: Name                    [View] [Go to Step] [Print]│   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 👤 John Smithson  ·  P-1189  ·  Canada Delegation         │   │ │
│  │  │ Status: ● Pending  ·  Step: Security Review               │   │ │
│  │  │ Match: Name                    [View] [Go to Step]        │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 👤 Jane Smith-Johnson  ·  P-0456  ·  Australia Del.       │   │ │
│  │  │ Status: ● Approved  ·  Step: Collected                    │   │ │
│  │  │ Match: Name                    [View] [Go to Step]        │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ ECOWAS Summit 2026 (1 result) ──────────────────────────────────┐ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 👤 John Smith  ·  E-0089  ·  Ghana Delegation             │   │ │
│  │  │ Status: ● Draft  ·  Step: Registration                    │   │ │
│  │  │ Match: Name                    [View] [Go to Step]        │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  4 results across 2 events  ·  Search by: name, code, passport, org   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.11 Mobile Responsive Layouts

**Validator Queue on Phone (< 640px):**

```
┌──────────────────────────┐
│ Validation Queue    🔍 🔔│
│ Step: Security Review     │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Alice Johnson         │ │
│ │ Kenya Delegation      │ │
│ │ VIP · Passport: ✓    │ │
│ │                       │ │
│ │ ┌─────────┐┌────────┐│ │
│ │ │ Approve ││ Reject ││ │
│ │ └─────────┘└────────┘│ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ Bob Smith             │ │
│ │ Nigeria Delegation    │ │
│ │ Staff · Passport: ✓  │ │
│ │                       │ │
│ │ ┌─────────┐┌────────┐│ │
│ │ │ Approve ││ Reject ││ │
│ │ └─────────┘└────────┘│ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ Clara Diaz            │ │
│ │ Brazil Delegation     │ │
│ │ Delegate · Docs: ⚠   │ │
│ │                       │ │
│ │ ┌─────────┐┌────────┐│ │
│ │ │ Approve ││ Reject ││ │
│ │ └─────────┘└────────┘│ │
│ └──────────────────────┘ │
│                          │
│ ← Swipe cards to action │
│                          │
├──────────────────────────┤
│ 🏠  📋  ✓  🖨  👤       │
│Home List Val Print Prof  │
└──────────────────────────┘
```

**Dashboard on Tablet (768px - 1024px):**

```
┌────────────────────────────────────────────────┐
│ ☰  AU HQ  ·  General Assembly    🔍  🔔  👤  │
├────────────────────────────────────────────────┤
│                                                │
│ ┌─────────────────┐  ┌─────────────────┐      │
│ │ Total: 1,247    │  │ Approved: 892   │      │
│ │ ↑ 12% this week │  │ ↑ 8% this week  │      │
│ └─────────────────┘  └─────────────────┘      │
│ ┌─────────────────┐  ┌─────────────────┐      │
│ │ Pending: 213    │  │ Printed: 756    │      │
│ │ ↓ 15% this week │  │ ↑ 23% this week │      │
│ └─────────────────┘  └─────────────────┘      │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │  Registration Trend                       │  │
│ │  ┌────────────────────────────────────┐  │  │
│ │  │     ___                            │  │  │
│ │  │   _/   \___                        │  │  │
│ │  │  /         \___                    │  │  │
│ │  │ /              \                   │  │  │
│ │  └────────────────────────────────────┘  │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │  Recent Activity                          │  │
│ │  ● John approved P-1042 -- 2 min ago     │  │
│ │  ● Badge batch #45 completed -- 1 hr ago │  │
│ │  ● New delegation: Kenya -- 2 hrs ago    │  │
│ │  [View all →]                             │  │
│ └──────────────────────────────────────────┘  │
│                                                │
├────────────────────────────────────────────────┤
│  🏠    📋    ✓    🖨    ⚙                     │
│ Home  Events Valid Print Settings              │
└────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Feature Module UI Mapping

Every feature module relies on components and patterns from this UI module. The following table maps each module to its primary UI dependencies:

| Feature Module                  | Key UI Components Used                                                    | Shared Patterns                      |
| ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| **Module 01: Data Model**       | DataTable, Badge, Card                                                    | ListPage pattern for entity listing  |
| **Module 02: Dynamic Schema**   | FormRenderer, Input, Select, Dialog                                       | FormPage pattern, drag-and-drop      |
| **Module 03: Form Designer**    | Sidebar (toolbox), Card (field previews), Tabs, Dialog                    | SplitView pattern (toolbox + canvas) |
| **Module 04: Workflow Engine**  | KanbanBoard, StatusBadge, Timeline, Dialog                                | Custom workflow canvas (react-flow)  |
| **Module 05: Security**         | DataTable (user/role lists), Badge (permissions), Dialog (role editor)    | ListPage, DetailPage patterns        |
| **Module 09: Registration**     | FormRenderer, StatusButton, Stepper, FileUpload                           | WizardLayout for multi-step forms    |
| **Module 10: Validation**       | DataTable (queue), Card (review), KeyboardShortcuts, StatusButton         | ListPage with keyboard navigation    |
| **Module 11: Badge Design**     | Canvas (badge designer), Gallery (templates), Dialog (preview)            | SplitView pattern (tools + canvas)   |
| **Module 12: Print & Dispatch** | KanbanBoard (print queue), QRScanner (dispatch), OfflineIndicator         | Kanban pattern, offline workflows    |
| **Module 13: Delegation**       | DataTable, CalendarView, Card (quota), Badge (status)                     | ListPage, CalendarView pattern       |
| **Module 14: Notifications**    | NotificationCenter, Toast, Badge (counts), Tabs (channels)                | Dropdown panel pattern               |
| **Module 15: Reports**          | Charts (recharts), DataTable (data grids), Card (metric summary)          | Dashboard pattern with deferred data |
| **Module 16: Audit**            | DataTable (log entries), Timeline, Badge (action types), Dialog (details) | ListPage with advanced filtering     |
| **Module 17: Settings**         | Tabs (settings sections), Input/Select (config), ThemePreview             | FormPage, tabbed settings pattern    |

### 7.2 Shared Layout Patterns

```typescript
// patterns/ListPage/ListPage.tsx
interface ListPageProps<TData> {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  data: TData[];
  columns: ColumnDef<TData>[];
  total: number;
  views?: SavedView[];
  activeViewId?: string;
  actions?: React.ReactNode;         // Top-right action buttons
  bulkActions?: BulkAction[];
  emptyState?: React.ReactNode;
  loading?: boolean;
}

export function ListPage<TData extends { id: string }>({
  title, description, breadcrumbs, data, columns, total,
  views, activeViewId, actions, bulkActions, emptyState, loading,
}: ListPageProps<TData>) {
  const [activeView, setActiveView] = useState(activeViewId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-2xl font-bold mt-2">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {views && (
        <ViewManager
          views={views}
          activeViewId={activeView ?? null}
          targetModel={title.toLowerCase()}
          onViewChange={(v) => setActiveView(v.id)}
        />
      )}

      <DataTable
        data={data}
        columns={columns}
        total={total}
        enableRowSelection
        enableExport
        bulkActions={bulkActions}
        emptyState={emptyState}
        loading={loading}
      />
    </div>
  );
}

// patterns/DetailPage/DetailPage.tsx
interface DetailPageProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  badge?: { label: string; variant: string };
  actions?: React.ReactNode;
  tabs?: Tab[];
  children: React.ReactNode;
}

export function DetailPage({
  title, subtitle, breadcrumbs, badge, actions, tabs, children,
}: DetailPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={breadcrumbs} />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{title}</h1>
            {badge && <Badge variant={badge.variant as any}>{badge.label}</Badge>}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {tabs ? (
        <Tabs tabs={tabs}>
          {children}
        </Tabs>
      ) : (
        children
      )}
    </div>
  );
}
```

### 7.3 Route Organization by Module

```typescript
// Route file organization maps directly to feature modules:
app/routes/
├── $tenantSlug/events/$eventSlug/
│   ├── participants/          → Module 09: Registration
│   │   ├── _index.tsx         → Participant list (ListPage pattern)
│   │   ├── $participantId.tsx → Participant detail (DetailPage pattern)
│   │   └── import.tsx         → Bulk import (FormPage pattern)
│   ├── validation/            → Module 10: Validation
│   │   ├── _index.tsx         → Validation dashboard
│   │   └── $stepId.tsx        → Step queue (keyboard-driven ListPage)
│   ├── badges/                → Modules 11 & 12: Badge Design, Print & Dispatch
│   │   ├── designer.tsx       → Badge designer (SplitView pattern)
│   │   ├── print-queue.tsx    → Print queue (KanbanBoard pattern)
│   │   └── dispatch.tsx       → Dispatch (mobile-optimized, offline)
│   ├── forms/                 → Module 03: Form Designer
│   │   ├── _index.tsx         → Form listing (ListPage)
│   │   └── $formId.tsx        → Form editor (SplitView pattern)
│   ├── workflows/             → Module 04: Workflow Engine
│   │   ├── _index.tsx         → Workflow listing (ListPage)
│   │   └── $workflowId.tsx    → Workflow editor (canvas pattern)
│   ├── delegations/           → Module 13: Delegation Management
│   │   ├── _index.tsx         → Delegation list (ListPage + CalendarView)
│   │   └── $delegationId.tsx  → Delegation detail (DetailPage)
│   ├── reports/               → Module 15: Reports & Analytics
│   │   └── _index.tsx         → Reports dashboard (Dashboard pattern)
│   └── settings.tsx           → Module 17: Settings (tabbed FormPage)
```

---

## 8. Configuration

### 8.1 Theme Token Defaults

```typescript
// config/theme-defaults.ts
export const defaultThemeTokens = {
  colors: {
    primary: "#2563eb", // Blue 600
    secondary: "#7c3aed", // Violet 600
    accent: "#06b6d4", // Cyan 500
    neutral: "#6b7280", // Gray 500
    success: "#16a34a", // Green 600
    warning: "#d97706", // Amber 600
    error: "#dc2626", // Red 600
    info: "#2563eb", // Blue 600
  },
  typography: {
    fontFamily: "Inter",
    headingFont: "Inter",
    monoFont: "JetBrains Mono",
    baseSize: "16px",
  },
  spacing: {
    unit: 4, // Base unit in px
    scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
  },
  radius: {
    preset: "md", // "sm" | "md" | "lg" | "full"
  },
  shadows: {
    enabled: true,
  },
  motion: {
    reducedMotion: false,
    duration: { fast: 150, normal: 200, slow: 300 },
  },
} as const;
```

### 8.2 i18n Configuration

```typescript
// config/i18n.ts
export const i18nConfig = {
  supportedLocales: ["en", "fr", "ar", "pt"] as const,
  fallbackLocale: "en",
  defaultNamespace: "common",
  namespaces: [
    "common",
    "validation",
    "badges",
    "forms",
    "workflows",
    "reports",
    "errors",
    "emails",
  ],
  interpolation: {
    escapeValue: false, // React already escapes
    prefix: "{{",
    suffix: "}}",
  },
  detection: {
    order: ["cookie", "localStorage", "navigator"],
    cookieName: "i18n_locale",
    cookieSameSite: "strict" as const,
  },
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
    addPath: "/locales/add/{{lng}}/{{ns}}", // For missing key reporting
  },
  rtlLocales: ["ar"],
  pluralRules: {
    ar: { type: "cardinal", forms: ["zero", "one", "two", "few", "many", "other"] },
  },
};
```

### 8.3 PWA Manifest

```json
{
  "name": "Accreditation Platform",
  "short_name": "Accredit",
  "description": "Multi-tenant accreditation management platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "any",
  "scope": "/",
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "shortcuts": [
    {
      "name": "Validation Queue",
      "short_name": "Validate",
      "url": "/validation",
      "icons": [{ "src": "/icons/validate-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Print Queue",
      "short_name": "Print",
      "url": "/badges/print-queue",
      "icons": [{ "src": "/icons/print-96x96.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["business", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 8.4 Service Worker Cache Config

```typescript
// config/sw-cache.ts
export const cacheConfig = {
  staticAssets: {
    cacheName: "static-assets-v1",
    strategy: "CacheFirst",
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    match: ["script", "style", "font"],
  },
  apiResponses: {
    cacheName: "api-cache-v1",
    strategy: "NetworkFirst",
    networkTimeoutSeconds: 5,
    maxEntries: 200,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
    match: ["/api/*"],
  },
  images: {
    cacheName: "images-v1",
    strategy: "StaleWhileRevalidate",
    maxEntries: 200,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    match: ["image"],
  },
  pages: {
    cacheName: "pages-v1",
    strategy: "NetworkFirst",
    networkTimeoutSeconds: 3,
    match: ["navigate"],
  },
  offlineQueue: {
    dbName: "accreditation-offline",
    storeName: "mutation-queue",
    maxRetries: 5,
    retryBackoff: [1000, 3000, 10000, 30000, 60000], // ms
  },
};
```

### 8.5 Responsive Breakpoint Overrides

```typescript
// config/breakpoints.ts
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Tailwind CSS config extension
export const tailwindScreens = {
  sm: `${breakpoints.sm}px`,
  md: `${breakpoints.md}px`,
  lg: `${breakpoints.lg}px`,
  xl: `${breakpoints.xl}px`,
  "2xl": `${breakpoints["2xl"]}px`,
};

// Hook for programmatic breakpoint detection
// hooks/useBreakpoint.ts
import { useState, useEffect } from "react";

export function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isWide: width >= breakpoints.xl,
    isUltraWide: width >= breakpoints["2xl"],
    width,
  };
}
```

### 8.6 Component Defaults

```typescript
// config/component-defaults.ts
export const componentDefaults = {
  button: {
    variant: "primary" as const,
    size: "md" as const,
    loadingText: "Loading...",
  },
  input: {
    autoComplete: "off",
  },
  dataTable: {
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    enableSorting: true,
    enableFiltering: true,
    enableColumnCustomization: true,
    enableRowSelection: false,
    enablePagination: true,
    stickyHeader: true,
  },
  dialog: {
    size: "md" as const,
    closeOnOverlayClick: true,
    closeOnEscape: true,
  },
  toast: {
    duration: 5000,
    position: "top-right" as const,
    maxVisible: 5,
  },
  avatar: {
    size: "md" as const,
  },
  sidebar: {
    width: 256, // px when expanded
    collapsedWidth: 64, // px when collapsed
    mobileBreakpoint: 1024, // px (lg breakpoint)
  },
  pagination: {
    showFirstLast: true,
    showPageNumbers: true,
    maxPageButtons: 5,
  },
};
```

---

## 9. Testing Strategy

### 9.1 Component Testing

Component tests use **Vitest** + **Testing Library** for render, interaction, and accessibility validation.

```typescript
// components/atoms/Button/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "./Button";

expect.extend(toHaveNoViolations);

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies variant classes correctly", () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass("bg-destructive");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows loading state with spinner", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("passes axe accessibility checks", async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("icon-only button requires aria-label", () => {
    render(<Button size="icon" aria-label="Settings"><GearIcon /></Button>);
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });
});

// components/organisms/DataTable/DataTable.test.tsx
describe("DataTable", () => {
  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "status", header: "Status" },
  ];
  const data = [
    { id: "1", name: "Alice", status: "approved" },
    { id: "2", name: "Bob", status: "pending" },
  ];

  it("renders table with correct data", () => {
    render(<DataTable data={data} columns={columns} total={2} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("sorts columns on header click", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} total={2} enableSorting />);
    await user.click(screen.getByText("Name"));
    expect(screen.getByText("Name").closest("th")).toHaveAttribute("aria-sort", "ascending");
  });

  it("shows empty state when no data", () => {
    render(
      <DataTable data={[]} columns={columns} total={0}
        emptyState={<p>No participants found</p>} />
    );
    expect(screen.getByText("No participants found")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    render(<DataTable data={[]} columns={columns} total={0} loading />);
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  it("enables row selection with checkboxes", async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} total={2} enableRowSelection />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // 1 header + 2 rows
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });
});
```

### 9.2 Visual Regression Tests

```typescript
// tests/visual/components.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("Button variants match snapshots", async ({ page }) => {
    await page.goto("/storybook/button");
    await expect(page.locator(".button-gallery")).toHaveScreenshot("button-variants.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("DataTable renders correctly", async ({ page }) => {
    await page.goto("/test/datatable");
    await page.waitForSelector("[role=grid]");
    await expect(page.locator("[role=grid]")).toHaveScreenshot("datatable-default.png");
  });

  test("Dashboard layout in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/demo/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dashboard-dark.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Mobile navigation layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/demo/dashboard");
    await expect(page).toHaveScreenshot("dashboard-mobile.png", { fullPage: true });
  });

  test("RTL layout for Arabic", async ({ page }) => {
    await page.goto("/demo/dashboard?locale=ar");
    await expect(page).toHaveScreenshot("dashboard-rtl.png", { fullPage: true });
  });
});
```

### 9.3 Accessibility Testing

```typescript
// tests/a11y/automated.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pagesToTest = [
  { name: "Dashboard", path: "/demo/dashboard" },
  { name: "Participant List", path: "/demo/participants" },
  { name: "Validation Queue", path: "/demo/validation" },
  { name: "Badge Designer", path: "/demo/badge-designer" },
  { name: "Form Designer", path: "/demo/form-designer" },
  { name: "User Preferences", path: "/demo/preferences" },
  { name: "Login", path: "/auth/login" },
];

for (const page of pagesToTest) {
  test(`${page.name} has no accessibility violations`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);
    await browserPage.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page: browserPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("[data-testid=chart]") // Charts have known library issues
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("Color contrast meets AA standards in light mode", async ({ page }) => {
  await page.goto("/demo/dashboard");
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
});

test("Color contrast meets AA standards in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/demo/dashboard");
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
});
```

### 9.4 Responsive Testing

```typescript
// tests/responsive/layouts.spec.ts
import { test, expect } from "@playwright/test";

const viewports = [
  { name: "Mobile", width: 375, height: 812 },
  { name: "Tablet Portrait", width: 768, height: 1024 },
  { name: "Tablet Landscape", width: 1024, height: 768 },
  { name: "Desktop", width: 1280, height: 800 },
  { name: "Wide Desktop", width: 1536, height: 864 },
];

for (const viewport of viewports) {
  test(`Dashboard layout at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/demo/dashboard");
    await page.waitForLoadState("networkidle");

    if (viewport.width < 1024) {
      // Mobile/Tablet: sidebar hidden, bottom nav visible
      await expect(page.locator("[data-testid=sidebar]")).not.toBeVisible();
      await expect(page.locator("[data-testid=mobile-nav]")).toBeVisible();
    } else {
      // Desktop: sidebar visible, bottom nav hidden
      await expect(page.locator("[data-testid=sidebar]")).toBeVisible();
      await expect(page.locator("[data-testid=mobile-nav]")).not.toBeVisible();
    }

    await expect(page).toHaveScreenshot(
      `dashboard-${viewport.name.toLowerCase().replace(" ", "-")}.png`,
    );
  });
}

test("Touch targets are at least 44px on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/demo/validation");

  const buttons = await page.locator("button:visible").all();
  for (const button of buttons) {
    const box = await button.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});
```

### 9.5 Keyboard Navigation Tests

```typescript
// tests/keyboard/navigation.spec.ts
import { test, expect } from "@playwright/test";

test("Tab order follows logical sequence on Dashboard", async ({ page }) => {
  await page.goto("/demo/dashboard");
  await page.keyboard.press("Tab"); // Skip to main content link
  await page.keyboard.press("Tab"); // First interactive element in sidebar
  const firstFocused = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-testid"),
  );
  expect(firstFocused).toBe("nav-dashboard");
});

test("Keyboard shortcuts work in validation queue", async ({ page }) => {
  await page.goto("/demo/validation");
  await page.waitForSelector("[data-testid=participant-card]");

  // Press N for next
  await page.keyboard.press("n");
  const selected = await page.locator("[data-selected=true]").getAttribute("data-index");
  expect(selected).toBe("1");

  // Press P for previous
  await page.keyboard.press("p");
  const backSelected = await page.locator("[data-selected=true]").getAttribute("data-index");
  expect(backSelected).toBe("0");

  // Press / to focus search
  await page.keyboard.press("/");
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-search"));
  expect(focused).toBeDefined();

  // Press ? for help
  await page.keyboard.press("?");
  await expect(page.locator("[data-testid=shortcut-help]")).toBeVisible();
});

test("Dialog traps focus correctly", async ({ page }) => {
  await page.goto("/demo/dialog-test");
  await page.click("[data-testid=open-dialog]");

  // Tab should cycle within dialog
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  const focused = await page.evaluate(
    () => document.activeElement?.closest("[role=dialog]") !== null,
  );
  expect(focused).toBe(true);

  // Escape should close dialog
  await page.keyboard.press("Escape");
  await expect(page.locator("[role=dialog]")).not.toBeVisible();
});

test("DataTable keyboard navigation", async ({ page }) => {
  await page.goto("/demo/participants");

  // Tab to table
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  // Enter to sort column
  await page.keyboard.press("Enter");
  const sortIndicator = await page.locator("[aria-sort=ascending]").count();
  expect(sortIndicator).toBeGreaterThan(0);
});
```

### 9.6 Screen Reader Testing Plan

| Test Area      | Screen Reader     | Expected Behavior                                     |
| -------------- | ----------------- | ----------------------------------------------------- |
| Navigation     | VoiceOver (macOS) | Sidebar landmarks announced, active item indicated    |
| DataTable      | NVDA (Windows)    | Row/column count announced, sort state conveyed       |
| Forms          | JAWS (Windows)    | Labels associated, errors announced on submit         |
| Dialogs        | VoiceOver (iOS)   | Dialog role announced, focus trapped, close announced |
| Toasts         | NVDA              | Notifications announced via aria-live region          |
| Kanban         | VoiceOver         | Drag-and-drop alternatives available via keyboard     |
| Search         | All readers       | Results count announced, options navigable            |
| Status changes | All readers       | Status updates announced via aria-live="polite"       |

**Manual Screen Reader Test Checklist:**

1. Page title changes announced on navigation
2. Skip to main content link functional
3. Headings form logical hierarchy (h1 -> h2 -> h3)
4. Images have descriptive alt text
5. Form fields have associated labels
6. Error messages linked to fields via aria-describedby
7. Dynamic content changes announced via aria-live
8. Focus management correct after route changes
9. Custom widgets follow WAI-ARIA authoring practices

### 9.7 i18n Rendering Tests

```typescript
// tests/i18n/rendering.spec.ts
import { test, expect } from "@playwright/test";

const locales = ["en", "fr", "ar", "pt"];

for (const locale of locales) {
  test(`Dashboard renders correctly in ${locale}`, async ({ page }) => {
    await page.goto(`/demo/dashboard?locale=${locale}`);
    await page.waitForLoadState("networkidle");

    // Verify locale is applied
    const htmlLang = await page.getAttribute("html", "lang");
    expect(htmlLang).toBe(locale);

    // Verify direction for Arabic
    if (locale === "ar") {
      const htmlDir = await page.getAttribute("html", "dir");
      expect(htmlDir).toBe("rtl");
    }

    // No missing translation keys (keys shown as-is indicate missing translations)
    const textContent = await page.textContent("body");
    const missingKeys = textContent?.match(/\b[a-z]+\.[a-z]+\.[a-z]+\b/g) ?? [];
    expect(missingKeys.filter((k) => k.includes("."))).toEqual([]);

    await expect(page).toHaveScreenshot(`dashboard-${locale}.png`, { fullPage: true });
  });
}

test("RTL layout mirrors correctly for Arabic", async ({ page }) => {
  await page.goto("/demo/dashboard?locale=ar");
  await page.waitForLoadState("networkidle");

  // Sidebar should be on the right in RTL
  const sidebar = await page.locator("[data-testid=sidebar]").boundingBox();
  const content = await page.locator("[data-testid=main-content]").boundingBox();

  if (sidebar && content) {
    expect(sidebar.x).toBeGreaterThan(content.x); // Sidebar to the right of content in RTL
  }
});

test("Date formats respect locale", async ({ page }) => {
  await page.goto("/demo/participants?locale=fr");
  // French date format: DD/MM/YYYY
  const dateCell = await page.locator("[data-testid=date-cell]").first().textContent();
  expect(dateCell).toMatch(/\d{2}\/\d{2}\/\d{4}/);
});
```

---

## 10. Security Considerations

### 10.1 XSS Prevention

React escapes all rendered content by default. The use of `dangerouslySetInnerHTML` is **banned** across the entire codebase except for two controlled cases:

```typescript
// POLICY: dangerouslySetInnerHTML is banned except for:
// 1. Tenant CSS injection (via generateTenantCSS, server-side sanitized)
// 2. Sanitized markdown rendering (via DOMPurify)

// ESLint rule enforcement:
// .eslintrc.js
module.exports = {
  rules: {
    "react/no-danger": "error",    // Ban dangerouslySetInnerHTML globally
  },
  overrides: [
    {
      // Allow only in these specific files with sanitization
      files: [
        "app/routes/$tenantSlug/_layout.tsx",         // Tenant CSS
        "app/components/molecules/Markdown/Markdown.tsx", // Sanitized markdown
      ],
      rules: {
        "react/no-danger": "off",
      },
    },
  ],
};

// Sanitized markdown rendering:
import DOMPurify from "dompurify";
import { marked } from "marked";

export function Markdown({ content }: { content: string }) {
  const html = DOMPurify.sanitize(marked.parse(content), {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "code", "pre", "h1", "h2", "h3"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ADD_ATTR: ["target"],
  });

  // Force external links to open safely
  const safeHtml = html.replace(
    /<a /g,
    '<a rel="noopener noreferrer" target="_blank" '
  );

  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
```

### 10.2 Content Security Policy

CSP nonce integration for inline styles and scripts:

```typescript
// middleware/csp.server.ts
import crypto from "crypto";

export function generateCSPNonce(): string {
  return crypto.randomBytes(16).toString("base64");
}

export function getCSPHeaders(nonce: string): Record<string, string> {
  return {
    "Content-Security-Policy": [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,  // unsafe-inline for tenant CSS
      `img-src 'self' data: blob: https:`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' https://api.*.accredit.app wss:`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
      `upgrade-insecure-requests`,
    ].join("; "),
  };
}

// In entry.server.tsx:
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext
) {
  const nonce = generateCSPNonce();
  const cspHeaders = getCSPHeaders(nonce);

  Object.entries(cspHeaders).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });

  // Pass nonce to React for script/style tags
  const body = renderToReadableStream(
    <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />,
    { nonce }
  );

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
```

### 10.3 Secure Cookie Handling

```typescript
// services/session.server.ts
import { createCookieSessionStorage } from "react-router";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true, // Not accessible via JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // Protects against CSRF while allowing navigation
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
    secrets: [process.env.SESSION_SECRET!],
    domain: process.env.COOKIE_DOMAIN,
  },
});

// Theme preference cookie (non-sensitive, client-readable)
export const themeCookie = createCookie("theme", {
  httpOnly: false, // Client needs to read for instant theme application
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: "/",
});

// Locale preference cookie
export const localeCookie = createCookie("i18n_locale", {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
});
```

### 10.4 CSRF Protection

CSRF token injection in Conform forms:

```typescript
// services/csrf.server.ts
import { createCookie } from "react-router";
import crypto from "crypto";

const csrfCookie = createCookie("csrf", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
});

export async function generateCSRFToken(request: Request): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
}

export async function validateCSRFToken(request: Request): Promise<void> {
  const formData = await request.clone().formData();
  const formToken = formData.get("csrf") as string;
  const cookieHeader = request.headers.get("Cookie");
  const cookieToken = await csrfCookie.parse(cookieHeader);

  if (!formToken || !cookieToken || formToken !== cookieToken) {
    throw new Response("Invalid CSRF token", { status: 403 });
  }
}

// In root loader (inject token into all pages):
export async function loader({ request }: LoaderFunctionArgs) {
  const csrfToken = await generateCSRFToken(request);
  return json(
    { csrfToken },
    {
      headers: {
        "Set-Cookie": await csrfCookie.serialize(csrfToken),
      },
    }
  );
}

// In forms (automatically included via CSRFInput component):
export function CSRFInput() {
  const { csrfToken } = useRouteLoaderData<typeof rootLoader>("root")!;
  return <input type="hidden" name="csrf" value={csrfToken} />;
}
```

### 10.5 CSP Header Configuration

Complete Content Security Policy for production deployment:

```typescript
// config/security.ts
export const securityConfig = {
  csp: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'nonce-{NONCE}'"],
      "style-src": ["'self'", "'nonce-{NONCE}'", "'unsafe-inline'"],
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://*.amazonaws.com",
      ],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://api.*.accredit.app", "wss://*.accredit.app"],
      "media-src": ["'self'"],
      "object-src": ["'none'"],
      "frame-src": ["'none'"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "upgrade-insecure-requests": [],
    },
    reportUri: "/api/csp-report",
  },

  additionalHeaders: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0", // Disabled; CSP handles this
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  },
};
```

---

## 11. Performance Requirements

### 11.1 Core Web Vitals Targets

| Metric                              | Target  | Description                                  |
| ----------------------------------- | ------- | -------------------------------------------- |
| **LCP** (Largest Contentful Paint)  | < 2.5s  | Main content renders within 2.5 seconds      |
| **FID** (First Input Delay)         | < 100ms | First interaction responds within 100ms      |
| **CLS** (Cumulative Layout Shift)   | < 0.1   | Minimal unexpected layout shifts             |
| **TTFB** (Time to First Byte)       | < 600ms | Server responds within 600ms                 |
| **FCP** (First Contentful Paint)    | < 1.8s  | First meaningful content appears within 1.8s |
| **INP** (Interaction to Next Paint) | < 200ms | All interactions respond within 200ms        |

### 11.2 Code Splitting Strategy

```typescript
// Route-based lazy loading (automatic with React Router 7)
// Each route is its own chunk, loaded on demand

// Dynamic imports for heavy components
const FormDesigner = lazy(() =>
  import("~/components/organisms/FormDesigner/FormDesigner")
);

const WorkflowEditor = lazy(() =>
  import("~/components/organisms/WorkflowEditor/WorkflowEditor")
);

const BadgeDesigner = lazy(() =>
  import("~/components/organisms/BadgeDesigner/BadgeDesigner")
);

const ChartComponents = lazy(() =>
  import("~/components/organisms/Charts/Charts")
);

const QRScanner = lazy(() =>
  import("~/components/organisms/QRScanner/QRScanner")
);

// Usage with Suspense boundaries:
export default function FormDesignerPage() {
  return (
    <Suspense fallback={<FormDesignerSkeleton />}>
      <FormDesigner />
    </Suspense>
  );
}

// Preload on hover for instant navigation:
function NavLink({ to, children, preloadComponent }: NavLinkProps) {
  const handleMouseEnter = () => {
    if (preloadComponent) {
      preloadComponent();   // Triggers dynamic import
    }
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter} onFocus={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

### 11.3 Image Optimization

```typescript
// components/atoms/OptimizedImage/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;        // Above-the-fold images
  className?: string;
}

export function OptimizedImage({
  src, alt, width, height, priority = false, className,
}: OptimizedImageProps) {
  // Generate responsive srcset
  const widths = [320, 640, 768, 1024, 1280];
  const srcSet = widths
    .filter((w) => w <= width * 2)
    .map((w) => `${getOptimizedUrl(src, w)} ${w}w`)
    .join(", ");

  const sizes = [
    "(max-width: 640px) 100vw",
    "(max-width: 768px) 50vw",
    "(max-width: 1024px) 33vw",
    "25vw",
  ].join(", ");

  return (
    <picture>
      {/* WebP with fallback */}
      <source type="image/webp" srcSet={srcSet.replace(/\.(jpg|png)/g, ".webp")} sizes={sizes} />
      <source type="image/jpeg" srcSet={srcSet} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("object-cover", className)}
      />
    </picture>
  );
}

function getOptimizedUrl(src: string, width: number): string {
  // Cloudinary or similar image CDN transformation
  if (src.includes("cloudinary.com")) {
    return src.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
  }
  return `${src}?w=${width}&format=auto&quality=80`;
}
```

### 11.4 Font Loading

```html
<!-- In root.tsx <head> -->
<!-- Preload critical fonts -->
<link
  rel="preload"
  href="/fonts/inter-var-latin.woff2"
  as="font"
  type="font/woff2"
  crossorigin="anonymous"
/>

<style>
  @font-face {
    font-family: "Inter";
    font-style: normal;
    font-weight: 100 900;
    font-display: swap; /* Show fallback font immediately, swap when loaded */
    src: url("/fonts/inter-var-latin.woff2") format("woff2");
    unicode-range:
      U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
      U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  /* Arabic font for RTL support */
  @font-face {
    font-family: "Noto Sans Arabic";
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url("/fonts/noto-sans-arabic.woff2") format("woff2");
    unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FEFF;
  }
</style>
```

### 11.5 Bundle Size Budgets

| Budget Category                                       | Target (gzipped) | Enforcement          |
| ----------------------------------------------------- | ---------------- | -------------------- |
| **Initial JS**                                        | < 200 KB         | CI fails if exceeded |
| **Initial CSS**                                       | < 50 KB          | CI fails if exceeded |
| **Per-route chunk**                                   | < 50 KB          | CI warning at 40 KB  |
| **Heavy components** (form designer, workflow editor) | < 100 KB each    | CI warning at 80 KB  |
| **Total vendor chunk**                                | < 150 KB         | CI fails if exceeded |
| **Images per page**                                   | < 500 KB total   | Lighthouse audit     |
| **Fonts**                                             | < 100 KB total   | CI warning           |

```typescript
// vite.config.ts - Bundle size monitoring
import { defineConfig } from "vite";
import { bundleStats } from "rollup-plugin-bundle-stats";

export default defineConfig({
  plugins: [
    bundleStats({
      compare: true,
      baseline: true,
      outDir: "./bundle-stats",
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          "vendor-table": ["@tanstack/react-table"],
          "vendor-i18n": ["i18next", "react-i18next"],
          "vendor-forms": ["@conform-to/react", "@conform-to/zod", "zod"],
        },
      },
    },
  },
});
```

### 11.6 Lighthouse CI Integration

```yaml
# .lighthouserc.yml
ci:
  collect:
    url:
      - http://localhost:3000/
      - http://localhost:3000/demo/dashboard
      - http://localhost:3000/demo/participants
      - http://localhost:3000/demo/validation
      - http://localhost:3000/auth/login
    numberOfRuns: 3
    settings:
      preset: desktop
      throttling:
        cpuSlowdownMultiplier: 1

  assert:
    assertions:
      categories:performance:
        - error
        - minScore: 90
      categories:accessibility:
        - error
        - minScore: 95
      categories:best-practices:
        - error
        - minScore: 90
      categories:seo:
        - warn
        - minScore: 80

      # Core Web Vitals
      largest-contentful-paint:
        - error
        - maxNumericValue: 2500
      first-input-delay:
        - error
        - maxNumericValue: 100
      cumulative-layout-shift:
        - error
        - maxNumericValue: 0.1
      total-blocking-time:
        - error
        - maxNumericValue: 300

      # Bundle size
      total-byte-weight:
        - warn
        - maxNumericValue: 500000 # 500KB total

  upload:
    target: temporary-public-storage
```

---

## 12. Open Questions & Decisions

| #   | Question                                        | Options                                                                                                         | Status                | Impact                                           |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------ |
| 1   | **Component library extraction as npm package** | (a) Monorepo with shared package, (b) Copy-paste with conventions, (c) Published npm package                    | Under Discussion      | Affects reusability across tenants and teams     |
| 2   | **Storybook for component documentation**       | (a) Full Storybook deployment, (b) In-app component showcase, (c) Markdown docs only                            | Under Discussion      | Developer experience and design handoff          |
| 3   | **Design handoff process (Figma to code)**      | (a) Figma tokens plugin auto-sync, (b) Manual token extraction, (c) Figma Dev Mode integration                  | Under Discussion      | Design-development velocity                      |
| 4   | **Accessibility certification timeline**        | (a) Pre-launch VPAT certification, (b) Post-launch audit, (c) Ongoing automated + annual manual                 | Pending               | Compliance requirements for government clients   |
| 5   | **RTL layout completeness**                     | (a) Full RTL for all pages at launch, (b) RTL for core flows only, (c) RTL as post-launch enhancement           | Pending               | Arabic user experience quality                   |
| 6   | **Animation/motion design system**              | (a) Full Framer Motion integration, (b) CSS transitions only, (c) Minimal motion with reduced-motion preference | Under Discussion      | User experience polish vs. bundle size           |
| 7   | **Chart library selection**                     | (a) Recharts (React-native), (b) D3.js (full control), (c) Chart.js (lightweight)                               | Decided: Recharts     | Report module visual quality                     |
| 8   | **Form state management**                       | (a) Conform only, (b) React Hook Form, (c) Hybrid approach                                                      | Decided: Conform      | Aligns with React Router progressive enhancement |
| 9   | **CSS approach**                                | (a) Tailwind CSS only, (b) CSS Modules + Tailwind, (c) CSS-in-JS                                                | Decided: Tailwind CSS | Consistency and performance                      |
| 10  | **Icon library**                                | (a) Lucide React, (b) Heroicons, (c) Custom SVG sprites                                                         | Under Discussion      | Visual consistency and bundle size               |

---

## Appendix

### A. Glossary

| Term                      | Definition                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Atomic Design**         | Component architecture methodology organizing UI into atoms, molecules, organisms, templates, and pages |
| **CLS**                   | Cumulative Layout Shift - Core Web Vital measuring visual stability                                     |
| **Conform**               | Type-safe form library for React Router with progressive enhancement                                    |
| **CSP**                   | Content Security Policy - HTTP header controlling resource loading                                      |
| **CSRF**                  | Cross-Site Request Forgery - attack mitigated by token validation                                       |
| **CSS Custom Properties** | Native CSS variables (--property: value) used for theming                                               |
| **Design Token**          | Named entity storing visual design attributes (color, spacing, etc.)                                    |
| **FCP**                   | First Contentful Paint - time until first content renders                                               |
| **FID**                   | First Input Delay - Core Web Vital measuring interactivity                                              |
| **i18n**                  | Internationalization - adapting software for multiple languages/regions                                 |
| **IndexedDB**             | Browser-native database for offline storage                                                             |
| **INP**                   | Interaction to Next Paint - responsiveness metric                                                       |
| **LCP**                   | Largest Contentful Paint - Core Web Vital measuring load speed                                          |
| **Loader**                | React Router server function that fetches data for a route                                              |
| **PWA**                   | Progressive Web App - web application with native app capabilities                                      |
| **RTL**                   | Right-to-Left - text direction for Arabic, Hebrew, etc.                                                 |
| **SSE**                   | Server-Sent Events - one-way server-to-client streaming                                                 |
| **SSR**                   | Server-Side Rendering - generating HTML on the server                                                   |
| **Service Worker**        | Background script enabling offline functionality and caching                                            |
| **TTFB**                  | Time to First Byte - server response time                                                               |
| **ViewType**              | Enum defining display modes: TABLE, KANBAN, CALENDAR, GALLERY                                           |
| **WCAG**                  | Web Content Accessibility Guidelines - accessibility standard                                           |
| **Workbox**               | Google library for Service Worker caching strategies                                                    |
| **XSS**                   | Cross-Site Scripting - injection attack mitigated by React and CSP                                      |

### B. References

| Resource                     | URL                                           |
| ---------------------------- | --------------------------------------------- |
| React Router 7 Documentation | https://reactrouter.com                       |
| Tailwind CSS                 | https://tailwindcss.com                       |
| Radix UI Primitives          | https://www.radix-ui.com                      |
| TanStack Table               | https://tanstack.com/table                    |
| Conform (Form Library)       | https://conform.guide                         |
| react-i18next                | https://react.i18next.com                     |
| Workbox (Service Worker)     | https://developer.chrome.com/docs/workbox     |
| WCAG 2.1 AA Guidelines       | https://www.w3.org/WAI/WCAG21/quickref/       |
| Axe Accessibility Testing    | https://www.deque.com/axe/                    |
| DOMPurify (XSS Sanitization) | https://github.com/cure53/DOMPurify           |
| Lighthouse CI                | https://github.com/GoogleChrome/lighthouse-ci |
| Playwright Testing           | https://playwright.dev                        |
| Vitest                       | https://vitest.dev                            |
| class-variance-authority     | https://cva.style                             |

### C. Complete Route Map

| URL Path                                     | Component             | Loader                       | Action                     | Permissions           | Module |
| -------------------------------------------- | --------------------- | ---------------------------- | -------------------------- | --------------------- | ------ |
| `/`                                          | `LandingPage`         | `getPublicContent`           | --                         | Public                | --     |
| `/auth/login`                                | `LoginPage`           | `getOAuthProviders`          | `handleLogin`              | Public                | 05     |
| `/auth/callback`                             | `AuthCallback`        | `exchangeToken`              | --                         | Public                | 05     |
| `/auth/logout`                               | `LogoutPage`          | --                           | `handleLogout`             | Public                | 05     |
| `/:tenant`                                   | `TenantDashboard`     | `getDashboardData`           | --                         | `tenant:read`         | 00     |
| `/:tenant/settings/general`                  | `GeneralSettings`     | `getTenantConfig`            | `updateTenantConfig`       | `tenant:admin`        | 17     |
| `/:tenant/settings/branding`                 | `BrandingSettings`    | `getThemeConfig`             | `updateThemeConfig`        | `tenant:admin`        | 08     |
| `/:tenant/settings/users`                    | `UserManagement`      | `getUsers, getRoles`         | `createUser, updateRole`   | `users:manage`        | 05     |
| `/:tenant/settings/integrations`             | `Integrations`        | `getApiKeys, getWebhooks`    | `createApiKey`             | `tenant:admin`        | 07     |
| `/:tenant/events`                            | `EventList`           | `getEvents`                  | --                         | `events:read`         | 00     |
| `/:tenant/events/new`                        | `CreateEvent`         | `getTemplates`               | `createEvent`              | `events:create`       | 00     |
| `/:tenant/events/:event`                     | `EventDashboard`      | `getEventStats`              | --                         | `events:read`         | 00     |
| `/:tenant/events/:event/participants`        | `ParticipantList`     | `getParticipants, getViews`  | `bulkAction`               | `participants:read`   | 09     |
| `/:tenant/events/:event/participants/:id`    | `ParticipantDetail`   | `getParticipant, getHistory` | `updateParticipant`        | `participants:read`   | 09     |
| `/:tenant/events/:event/participants/import` | `BulkImport`          | `getImportConfig`            | `processImport`            | `participants:create` | 09     |
| `/:tenant/events/:event/validation`          | `ValidationDashboard` | `getValidationStats`         | --                         | `validation:read`     | 10     |
| `/:tenant/events/:event/validation/:step`    | `StepQueue`           | `getQueueItems`              | `approve, reject, bypass`  | `validation:read`     | 10     |
| `/:tenant/events/:event/badges/designer`     | `BadgeDesigner`       | `getTemplates`               | `saveTemplate`             | `badges:design`       | 11     |
| `/:tenant/events/:event/badges/print-queue`  | `PrintQueue`          | `getPrintJobs`               | `printBatch, updateStatus` | `badges:print`        | 12     |
| `/:tenant/events/:event/badges/dispatch`     | `Dispatch`            | `getDispatchQueue`           | `markCollected`            | `badges:dispatch`     | 12     |
| `/:tenant/events/:event/forms`               | `FormList`            | `getForms`                   | --                         | `forms:read`          | 03     |
| `/:tenant/events/:event/forms/:form`         | `FormDesigner`        | `getFormSchema`              | `saveForm`                 | `forms:edit`          | 03     |
| `/:tenant/events/:event/workflows`           | `WorkflowList`        | `getWorkflows`               | --                         | `workflows:read`      | 04     |
| `/:tenant/events/:event/workflows/:wf`       | `WorkflowEditor`      | `getWorkflowConfig`          | `saveWorkflow`             | `workflows:edit`      | 04     |
| `/:tenant/events/:event/schema`              | `SchemaEditor`        | `getSchema`                  | `updateSchema`             | `schema:edit`         | 02     |
| `/:tenant/events/:event/delegations`         | `DelegationList`      | `getDelegations`             | --                         | `delegations:read`    | 13     |
| `/:tenant/events/:event/delegations/:id`     | `DelegationDetail`    | `getDelegation, getQuota`    | `updateDelegation`         | `delegations:read`    | 13     |
| `/:tenant/events/:event/reports`             | `Reports`             | `getReportData`              | `generateReport`           | `reports:read`        | 15     |
| `/:tenant/events/:event/settings`            | `EventSettings`       | `getEventConfig`             | `updateEvent`              | `events:admin`        | 17     |
| `/:tenant/profile`                           | `UserProfile`         | `getUserProfile`             | `updateProfile`            | Authenticated         | 05     |
| `/:tenant/profile/preferences`               | `Preferences`         | `getUserPreferences`         | `updatePreferences`        | Authenticated         | 08     |
| `/admin/tenants`                             | `TenantAdmin`         | `getAllTenants`              | `createTenant`             | `platform:admin`      | 00     |
| `/admin/system`                              | `SystemHealth`        | `getHealthMetrics`           | --                         | `platform:admin`      | 06     |
| `/admin/audit`                               | `AuditLog`            | `getAuditEntries`            | --                         | `platform:admin`      | 16     |
| `/api/search`                                | Resource              | `searchParticipants`         | --                         | Authenticated         | 08     |
| `/api/notifications`                         | SSE Stream            | `subscribeNotifications`     | --                         | Authenticated         | 14     |
| `/api/export/:format`                        | Resource              | `generateExport`             | --                         | `export:read`         | 15     |
| `/api/upload`                                | Resource              | --                           | `handleUpload`             | Authenticated         | 09     |

### D. Keyboard Shortcut Master List

| Context             | Shortcut               | Action               | Description                          |
| ------------------- | ---------------------- | -------------------- | ------------------------------------ |
| **Global**          | `Cmd/Ctrl + K`         | Open command palette | Global search and navigation         |
| **Global**          | `/`                    | Focus search         | Quick search from any page           |
| **Global**          | `?`                    | Show shortcut help   | Display keyboard shortcut reference  |
| **Global**          | `Cmd/Ctrl + \`         | Toggle sidebar       | Expand/collapse navigation sidebar   |
| **Global**          | `Cmd/Ctrl + .`         | Toggle theme         | Switch between light/dark mode       |
| **Validation**      | `A`                    | Approve              | Approve selected participant         |
| **Validation**      | `R`                    | Reject               | Open rejection dialog with remarks   |
| **Validation**      | `B`                    | Bypass               | Bypass current validation step       |
| **Validation**      | `N`                    | Next                 | Select next participant in queue     |
| **Validation**      | `P`                    | Previous             | Select previous participant in queue |
| **Validation**      | `Enter`                | Open detail          | View full participant details        |
| **Validation**      | `Escape`               | Close detail         | Return to queue list                 |
| **DataTable**       | `Cmd/Ctrl + A`         | Select all           | Select all visible rows              |
| **DataTable**       | `Cmd/Ctrl + Shift + A` | Deselect all         | Clear all selections                 |
| **DataTable**       | `Arrow Up/Down`        | Navigate rows        | Move selection between rows          |
| **DataTable**       | `Space`                | Toggle selection     | Select/deselect current row          |
| **Form Designer**   | `Cmd/Ctrl + S`         | Save                 | Save form configuration              |
| **Form Designer**   | `Cmd/Ctrl + Z`         | Undo                 | Undo last change                     |
| **Form Designer**   | `Cmd/Ctrl + Shift + Z` | Redo                 | Redo undone change                   |
| **Form Designer**   | `Delete`               | Remove field         | Remove selected field                |
| **Workflow Editor** | `Cmd/Ctrl + S`         | Save                 | Save workflow configuration          |
| **Workflow Editor** | `Backspace`            | Delete node          | Remove selected node                 |
| **Workflow Editor** | `Cmd/Ctrl + D`         | Duplicate            | Duplicate selected node              |
| **Badge Designer**  | `Cmd/Ctrl + S`         | Save                 | Save badge template                  |
| **Badge Designer**  | `Cmd/Ctrl + P`         | Preview              | Preview badge output                 |
| **Navigation**      | `G then D`             | Go to dashboard      | Navigate to dashboard (chord)        |
| **Navigation**      | `G then E`             | Go to events         | Navigate to events list              |
| **Navigation**      | `G then V`             | Go to validation     | Navigate to validation queue         |
| **Navigation**      | `G then P`             | Go to print          | Navigate to print queue              |
| **Navigation**      | `G then S`             | Go to settings       | Navigate to settings                 |

### E. WCAG 2.1 AA Compliance Checklist

| #          | Criterion                 | Level | Status  | Notes                                                 |
| ---------- | ------------------------- | ----- | ------- | ----------------------------------------------------- |
| **1.1.1**  | Non-text Content          | A     | Planned | Alt text for all images, icons have aria-label        |
| **1.2.1**  | Audio-only and Video-only | A     | N/A     | No audio/video content                                |
| **1.3.1**  | Info and Relationships    | A     | Planned | Semantic HTML, ARIA landmarks, table headers          |
| **1.3.2**  | Meaningful Sequence       | A     | Planned | DOM order matches visual order                        |
| **1.3.3**  | Sensory Characteristics   | A     | Planned | No reliance on color alone for info                   |
| **1.3.4**  | Orientation               | AA    | Planned | Responsive, works in portrait and landscape           |
| **1.3.5**  | Identify Input Purpose    | AA    | Planned | autocomplete attributes on form fields                |
| **1.4.1**  | Use of Color              | A     | Planned | Status badges use icons + text + color                |
| **1.4.2**  | Audio Control             | A     | N/A     | No auto-playing audio                                 |
| **1.4.3**  | Contrast (Minimum)        | AA    | Planned | 4.5:1 text, 3:1 large text, automated testing         |
| **1.4.4**  | Resize Text               | AA    | Planned | Works at 200% zoom                                    |
| **1.4.5**  | Images of Text            | AA    | Planned | No images of text (except logos)                      |
| **1.4.10** | Reflow                    | AA    | Planned | No horizontal scroll at 320px width                   |
| **1.4.11** | Non-text Contrast         | AA    | Planned | 3:1 for UI components and graphics                    |
| **1.4.12** | Text Spacing              | AA    | Planned | Adapts to user text spacing overrides                 |
| **1.4.13** | Content on Hover or Focus | AA    | Planned | Tooltips dismissible, hoverable, persistent           |
| **2.1.1**  | Keyboard                  | A     | Planned | All functionality via keyboard                        |
| **2.1.2**  | No Keyboard Trap          | A     | Planned | Focus management in dialogs, can always escape        |
| **2.1.4**  | Character Key Shortcuts   | A     | Planned | Shortcuts only active outside text inputs             |
| **2.2.1**  | Timing Adjustable         | A     | Planned | No timed interactions except session timeout (warned) |
| **2.3.1**  | Three Flashes             | A     | Planned | No flashing content                                   |
| **2.4.1**  | Bypass Blocks             | A     | Planned | Skip to main content link                             |
| **2.4.2**  | Page Titled               | A     | Planned | Unique, descriptive title per route                   |
| **2.4.3**  | Focus Order               | A     | Planned | Logical tab order matching visual layout              |
| **2.4.4**  | Link Purpose              | A     | Planned | Descriptive link text (no "click here")               |
| **2.4.5**  | Multiple Ways             | AA    | Planned | Nav, search, breadcrumbs, sitemap                     |
| **2.4.6**  | Headings and Labels       | AA    | Planned | Descriptive headings, form labels                     |
| **2.4.7**  | Focus Visible             | AA    | Planned | Custom focus ring (ring-2 ring-ring)                  |
| **2.5.1**  | Pointer Gestures          | A     | Planned | Swipe actions have button alternatives                |
| **2.5.2**  | Pointer Cancellation      | A     | Planned | Actions on up-event, not down-event                   |
| **2.5.3**  | Label in Name             | A     | Planned | Visible label matches accessible name                 |
| **2.5.4**  | Motion Actuation          | A     | Planned | No motion-only inputs                                 |
| **3.1.1**  | Language of Page          | A     | Planned | html lang attribute set per locale                    |
| **3.1.2**  | Language of Parts         | AA    | Planned | lang attribute on mixed-language content              |
| **3.2.1**  | On Focus                  | A     | Planned | No context change on focus                            |
| **3.2.2**  | On Input                  | A     | Planned | No unexpected context change on input                 |
| **3.2.3**  | Consistent Navigation     | AA    | Planned | Same nav order across pages                           |
| **3.2.4**  | Consistent Identification | AA    | Planned | Same components have same labels                      |
| **3.3.1**  | Error Identification      | A     | Planned | Errors identified in text, linked to fields           |
| **3.3.2**  | Labels or Instructions    | A     | Planned | All fields have visible labels                        |
| **3.3.3**  | Error Suggestion          | AA    | Planned | Suggested corrections in error messages               |
| **3.3.4**  | Error Prevention (Legal)  | AA    | Planned | Confirmation for irreversible actions                 |
| **4.1.1**  | Parsing                   | A     | Planned | Valid HTML, no duplicate IDs                          |
| **4.1.2**  | Name, Role, Value         | A     | Planned | Custom widgets have ARIA roles/states                 |
| **4.1.3**  | Status Messages           | AA    | Planned | aria-live regions for dynamic updates                 |

---

_End of Module 08: UI/UX and Frontend Architecture_
