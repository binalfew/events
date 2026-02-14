# Module 03: Visual Form Designer

> **Module:** 03 - Visual Form Designer
> **Version:** 1.0
> **Last Updated:** February 11, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md), [Module 02: Dynamic Schema Engine](./02-DYNAMIC-SCHEMA-ENGINE.md)
> **Required By:** [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md), [Module 16: Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)
> **Integrates With:** [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md), [Module 08: UI/UX & Frontend](./08-UI-UX-AND-FRONTEND.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Separation of Concerns](#12-separation-of-concerns)
   - 1.3 [Scope](#13-scope)
   - 1.4 [Key Personas](#14-key-personas)
   - 1.5 [Design Philosophy](#15-design-philosophy)
2. [Architecture](#2-architecture)
   - 2.1 [Component Architecture](#21-component-architecture)
   - 2.2 [Data Flow Pipeline](#22-data-flow-pipeline)
   - 2.3 [Real-Time Preview Pipeline](#23-real-time-preview-pipeline)
   - 2.4 [Design Canvas Rendering Engine](#24-design-canvas-rendering-engine)
   - 2.5 [Technology Choices](#25-technology-choices)
3. [Data Model](#3-data-model)
   - 3.1 [FormTemplate Model](#31-formtemplate-model)
   - 3.2 [SectionTemplate Model](#32-sectiontemplate-model)
   - 3.3 [FormVersion Model](#33-formversion-model)
   - 3.4 [FormAnalytics Model](#34-formanalytics-model)
   - 3.5 [Entity Relationship Diagram](#35-entity-relationship-diagram)
   - 3.6 [Form Definition JSON Hierarchy](#36-form-definition-json-hierarchy)
   - 3.7 [Index Strategy](#37-index-strategy)
4. [API Specification](#4-api-specification)
   - 4.1 [Form Template CRUD](#41-form-template-crud)
   - 4.2 [Section Template CRUD](#42-section-template-crud)
   - 4.3 [Form Preview](#43-form-preview)
   - 4.4 [Publish / Unpublish](#44-publish--unpublish)
   - 4.5 [Clone Form](#45-clone-form)
   - 4.6 [Import / Export](#46-import--export)
   - 4.7 [Form Version Management](#47-form-version-management)
   - 4.8 [Form Analytics](#48-form-analytics)
5. [Business Logic](#5-business-logic)
   - 5.1 [Conditional Visibility Rules](#51-conditional-visibility-rules)
   - 5.2 [Condition Evaluation Engine](#52-condition-evaluation-engine)
   - 5.3 [Section Management with Drag-and-Drop](#53-section-management-with-drag-and-drop)
   - 5.4 [Concrete Example: AU Summit Registration](#54-concrete-example-au-summit-registration)
   - 5.5 [Undo/Redo System (Command Pattern)](#55-undoredo-system-command-pattern)
   - 5.6 [Form Versioning with Diff Tracking](#56-form-versioning-with-diff-tracking)
   - 5.7 [Autosave with Debounce](#57-autosave-with-debounce)
   - 5.8 [Form Validation Engine](#58-form-validation-engine)
   - 5.9 [Form Analytics Engine](#59-form-analytics-engine)
   - 5.10 [Prefill Engine](#510-prefill-engine)
   - 5.11 [Responsive Rendering Engine](#511-responsive-rendering-engine)
   - 5.12 [Embeddable Form Widget](#512-embeddable-form-widget)
6. [User Interface](#6-user-interface)
   - 6.1 [Three-Panel Interface](#61-three-panel-interface)
   - 6.2 [12-Column Grid System](#62-12-column-grid-system)
   - 6.3 [Enhanced Toolbar](#63-enhanced-toolbar)
   - 6.4 [Field Search and Filter](#64-field-search-and-filter)
   - 6.5 [Section Template Library Browser](#65-section-template-library-browser)
   - 6.6 [Responsive Preview Toggle](#66-responsive-preview-toggle)
   - 6.7 [Form Settings Panel](#67-form-settings-panel)
   - 6.8 [Form Sharing / Embedding Dialog](#68-form-sharing--embedding-dialog)
   - 6.9 [Keyboard Shortcuts](#69-keyboard-shortcuts)
   - 6.10 [Accessibility Audit Panel](#610-accessibility-audit-panel)
   - 6.11 [View Modes](#611-view-modes)
   - 6.12 [Page Management (Wizard Steps)](#612-page-management-wizard-steps)
7. [Integration Points](#7-integration-points)
   - 7.1 [Dynamic Schema Engine (Module 02)](#71-dynamic-schema-engine-module-02)
   - 7.2 [Workflow Engine (Module 04)](#72-workflow-engine-module-04)
   - 7.3 [Registration & Accreditation (Module 09)](#73-registration--accreditation-module-09)
   - 7.4 [Communication Module (Module 14)](#74-communication-module-module-14)
   - 7.5 [Participant Experience (Module 16)](#75-participant-experience-module-16)
8. [Configuration](#8-configuration)
   - 8.1 [Feature Flags](#81-feature-flags)
   - 8.2 [Limits and Thresholds](#82-limits-and-thresholds)
   - 8.3 [Runtime Configuration](#83-runtime-configuration)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Visual Regression Tests](#91-visual-regression-tests)
   - 9.2 [Accessibility Tests](#92-accessibility-tests)
   - 9.3 [Drag-and-Drop Interaction Tests](#93-drag-and-drop-interaction-tests)
   - 9.4 [Form Validation Engine Tests](#94-form-validation-engine-tests)
   - 9.5 [Undo/Redo Stack Tests](#95-undoredo-stack-tests)
   - 9.6 [Responsive Rendering Tests](#96-responsive-rendering-tests)
   - 9.7 [End-to-End Tests](#97-end-to-end-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [XSS Prevention in Form Definitions](#101-xss-prevention-in-form-definitions)
    - 10.2 [CSRF Protection](#102-csrf-protection)
    - 10.3 [Rate Limiting](#103-rate-limiting)
    - 10.4 [Form Definition Size Limits](#104-form-definition-size-limits)
    - 10.5 [Content Security Policy](#105-content-security-policy)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Performance Targets](#111-performance-targets)
    - 11.2 [Form Definition Size Management](#112-form-definition-size-management)
    - 11.3 [Canvas Rendering Optimization](#113-canvas-rendering-optimization)
    - 11.4 [Preview Generation Latency](#114-preview-generation-latency)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [File Structure](#c-file-structure)

---

## 1. Overview

### 1.1 Purpose

The Visual Form Designer is a drag-and-drop admin interface where non-technical users design registration forms. It answers the question: "I have defined 15 custom fields for this event -- now how should the form look?"

The form designer bridges the gap between raw field definitions (what data to collect) and the participant-facing registration experience (how the form looks and flows). It empowers tenant administrators and form designer power users to create multi-page wizard layouts, organize fields into logical sections, apply conditional visibility rules, and control column arrangements -- all without writing a single line of code.

### 1.2 Separation of Concerns

The platform cleanly separates two distinct responsibilities:

- **Field definitions** (Module 02: Dynamic Schema Engine) = "what data to collect" (the ingredients)
- **Form designer** (this module) = "how the form looks and flows" (the recipe)

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│   Module 02: Dynamic Schema     │     │   Module 03: Form Designer      │
│                                 │     │                                 │
│   "What to collect"             │     │   "How the form looks"          │
│                                 │     │                                 │
│   - Field name: passport_number │────>│   - Page: Travel Information    │
│   - Type: text                  │     │   - Section: Passport Details   │
│   - Required: true              │     │   - Column span: 6 (half width)│
│   - Pattern: ^[A-Z0-9]{5,15}$  │     │   - Order: 2nd in section      │
│   - Description: "Official..."  │     │   - Visible if: needs_visa=true│
│                                 │     │                                 │
│   The INGREDIENTS               │     │   The RECIPE                    │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

Field definitions can be used **without** the form designer -- fields render in a flat list sorted by `sortOrder`. The form designer is an upgrade that gives admins control over multi-page wizard layout, sections, conditional visibility, and column arrangement.

### 1.3 Scope

**In Scope:**

- Three-panel drag-and-drop form designer interface
- Multi-page wizard form layout with page-level conditional visibility
- Section management with reusable section templates
- 12-column grid system for field layout control
- Conditional visibility rules at page, section, and field levels
- Form definition JSON storage and versioning
- Real-time preview with WYSIWYG rendering
- Form template CRUD operations with publish/unpublish lifecycle
- Undo/redo support with command pattern history
- Autosave with debounce
- Form analytics (completion rates, drop-off tracking)
- Prefill engine for URL params, API data, and previous submissions
- Responsive rendering for mobile, tablet, and desktop
- Embeddable form widget for external sites

**Out of Scope:**

- Field type definitions (handled by Module 02: Dynamic Schema Engine)
- Validation schema generation (handled by Module 02: Dynamic Schema Engine)
- Workflow step configuration (handled by Module 04: Workflow Engine)
- Badge design (handled by Module 10: Badge Design & Printing)
- Email template design (handled by Module 14: Communication)

### 1.4 Key Personas

| Persona                      | Description                                                  | Key Actions                                                                                                             |
| ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Tenant Admin**             | Organization administrator who configures event registration | Creates form templates, arranges fields into pages/sections, sets conditional visibility, publishes forms               |
| **Form Designer Power User** | Advanced user with deep knowledge of form UX                 | Designs complex multi-page wizards, creates reusable section templates, configures A/B testing, analyzes form analytics |
| **Platform Admin**           | System-wide administrator                                    | Manages global form template library, monitors form definition sizes across tenants, sets platform-wide limits          |

### 1.5 Design Philosophy

1. **Progressive Enhancement:** Forms work with flat field lists by default. The designer adds pages, sections, and layout as an optional upgrade layer.
2. **WYSIWYG Guarantee:** The preview renderer is the exact same component used for the participant-facing registration form. What you see in preview is what participants see.
3. **Non-Destructive Editing:** Field definitions in Module 02 are never modified by the form designer. The designer only references field keys.
4. **Accessible by Default:** All designed forms must meet WCAG 2.1 AA standards. The designer includes an accessibility audit panel to catch violations before publishing.
5. **Mobile-First Rendering:** Forms automatically adapt column layouts for smaller screens, collapsing multi-column sections into single-column stacks.

---

## 2. Architecture

### 2.1 Component Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Form Designer Shell                           │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     Enhanced Toolbar                             │ │
│  │  [Save] [Publish] [Preview] [Undo] [Redo] [Settings] [Share]   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌──────────┬────────────────────────────┬────────────────────────┐ │
│  │  Field   │      Design Canvas         │   Properties Panel     │ │
│  │  Palette │                            │                        │ │
│  │          │  ┌──────────────────────┐  │  ┌──────────────────┐  │ │
│  │ Search   │  │  PageTabBar          │  │  │ Tab: General     │  │ │
│  │ [______] │  │  [Page1][Page2][+]   │  │  │ Tab: Validation  │  │ │
│  │          │  └──────────────────────┘  │  │ Tab: Visibility  │  │ │
│  │ Category │  ┌──────────────────────┐  │  │ Tab: Layout      │  │ │
│  │ > Input  │  │  SortableSection     │  │  └──────────────────┘  │ │
│  │ > Select │  │  ┌────────────────┐  │  │                        │ │
│  │ > Date   │  │  │ SortableField  │  │  │  Label: [__________]  │ │
│  │ > File   │  │  │ SortableField  │  │  │  Width: [Half v]      │ │
│  │ > Layout │  │  └────────────────┘  │  │  Required: [x]        │ │
│  │          │  │  [+ Add Section]     │  │  Placeholder: [____]  │ │
│  │ Section  │  └──────────────────────┘  │  │                        │ │
│  │Templates │                            │  Show if:              │ │
│  │ > Saved  │  [Editor] [Split] [Preview]│  [field v] [op v]     │ │
│  └──────────┴────────────────────────────┴────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   Status Bar                                    │ │
│  │  Draft | Last saved: 2 min ago | 3 pages, 12 fields | v1.2     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Component Hierarchy:**

```
FormDesignerShell
├── EnhancedToolbar
│   ├── SaveButton (with autosave indicator)
│   ├── PublishButton (with confirmation dialog)
│   ├── PreviewButton (opens preview mode)
│   ├── UndoButton / RedoButton
│   ├── SettingsButton (opens form settings panel)
│   └── ShareButton (opens sharing/embedding dialog)
├── FieldPalette
│   ├── SearchInput (filter fields by name/type)
│   ├── FieldCategoryAccordion
│   │   ├── DraggableFieldType (text, textarea, number, email...)
│   │   └── DraggableFieldType (select, radio, checkbox, toggle...)
│   └── SectionTemplateLibrary
│       └── SectionTemplateCard (reusable section presets)
├── DesignCanvas
│   ├── PageTabBar
│   │   ├── PageTab (one per page, with drag-to-reorder)
│   │   └── AddPageButton
│   ├── DndContext (root drag-and-drop context)
│   │   └── SortableContext (section level)
│   │       └── SortableSection
│   │           ├── SectionHeader (title, collapse toggle, drag handle)
│   │           └── SortableContext (field level)
│   │               ├── SortableField (field card with preview)
│   │               └── FieldDropPlaceholder
│   └── ViewModeToggle ([Editor] [Split] [Preview])
├── PropertiesPanel
│   ├── GeneralTab (label, placeholder, description, help text)
│   ├── ValidationTab (required, min, max, pattern, custom rules)
│   ├── VisibilityTab (condition builder)
│   └── LayoutTab (colSpan, row, order)
├── FormRenderer (preview / live rendering)
│   └── FieldRenderer (maps to Conform components)
├── AccessibilityAuditPanel
│   └── ViolationList (WCAG checks with fix suggestions)
└── StatusBar
    └── FormMetadata (status, last saved, stats, version)
```

### 2.2 Data Flow Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Designer   │    │  JSON Form   │    │   Database    │    │   Form       │
│   Actions    │───>│  Definition  │───>│   Storage     │───>│   Renderer   │
│              │    │              │    │              │    │              │
│ - Add field  │    │ {            │    │ FormTemplate │    │ Reads JSON   │
│ - Move field │    │   pages: [   │    │ .definition  │    │ Builds Zod   │
│ - Set layout │    │     sections │    │ (JSONB col)  │    │ Renders UI   │
│ - Add rules  │    │       fields │    │              │    │              │
│              │    │   ]          │    │              │    │              │
│              │    │ }            │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                    │
       │            ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐
       │            │  Validated  │     │  Versioned  │     │ Dynamic Zod │
       │            │  via Zod    │     │  with diff  │     │ Schema from │
       │            │  schema     │     │  tracking   │     │ Module 02   │
       │            └─────────────┘     └─────────────┘     └─────────────┘
       │
  ┌────┴────────────────────┐
  │  Command Pattern        │
  │  (Undo/Redo History)    │
  │                         │
  │  [InsertField]          │
  │  [MoveField]            │
  │  [UpdateField]          │
  │  [RemoveField]          │
  │  [InsertSection]        │
  │  [RemoveSection]        │
  └─────────────────────────┘
```

### 2.3 Real-Time Preview Pipeline

The preview pipeline ensures that every change in the designer is immediately reflected in the preview pane without a full re-render cycle.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Action     │     │  State Update    │     │  Preview Render  │
│                 │     │                 │     │                 │
│  Drag field     │────>│  Update JSON    │────>│  Diff detection │
│  Edit property  │     │  definition     │     │  Selective re-  │
│  Set condition  │     │  in React state │     │  render only    │
│                 │     │                 │     │  changed nodes  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               │                        v
                        ┌──────┴──────┐     ┌─────────────────┐
                        │  Debounced  │     │  Same component │
                        │  autosave   │     │  as production  │
                        │  (3 sec)    │     │  form renderer  │
                        └─────────────┘     └─────────────────┘
```

```typescript
// Real-time preview state synchronization
interface PreviewPipeline {
  // Debounced state updates for performance
  schedulePreviewUpdate: (definition: FormDefinition) => void;
  // Immediate update for critical changes (page switch, view mode)
  immediatePreviewUpdate: (definition: FormDefinition) => void;
  // Preview data context (mock data for preview rendering)
  previewData: Record<string, unknown>;
}

function usePreviewPipeline(definition: FormDefinition): PreviewPipeline {
  const [previewDefinition, setPreviewDefinition] = useState(definition);

  const schedulePreviewUpdate = useMemo(
    () =>
      debounce((def: FormDefinition) => {
        setPreviewDefinition(structuredClone(def));
      }, 150), // 150ms debounce for smooth typing
    [],
  );

  const immediatePreviewUpdate = useCallback((def: FormDefinition) => {
    setPreviewDefinition(structuredClone(def));
  }, []);

  return {
    schedulePreviewUpdate,
    immediatePreviewUpdate,
    previewData: generateMockData(previewDefinition),
  };
}
```

### 2.4 Design Canvas Rendering Engine

The canvas renders the form layout using a virtualized grid system that efficiently handles large forms with many fields.

```typescript
// Canvas rendering engine with virtualization support
interface CanvasRenderConfig {
  viewMode: "editor" | "split" | "preview";
  showGridLines: boolean;
  showFieldBorders: boolean;
  showDragHandles: boolean;
  snapToGrid: boolean;
  gridColumns: 12;
  responsiveBreakpoint: "desktop" | "tablet" | "phone";
}

function useCanvasRenderer(config: CanvasRenderConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  // Virtualization for forms with 100+ fields
  const { startIndex, endIndex, totalHeight } = useVirtualization({
    itemCount: totalFieldCount,
    itemHeight: estimateFieldHeight,
    containerRef,
    overscan: 5,
  });

  // Grid snapping for precise layout control
  const snapToGridPosition = useCallback((x: number, containerWidth: number): number => {
    const columnWidth = containerWidth / 12;
    const snappedColumn = Math.round(x / columnWidth);
    return Math.max(1, Math.min(12, snappedColumn));
  }, []);

  return { containerRef, startIndex, endIndex, totalHeight, snapToGridPosition };
}
```

### 2.5 Technology Choices

| Concern            | Choice                                 | Rationale                                                         |
| ------------------ | -------------------------------------- | ----------------------------------------------------------------- |
| **Drag-and-drop**  | `@dnd-kit`                             | Accessible, supports sortable lists + nested droppable containers |
| **Form rendering** | Existing Conform + Radix UI            | Reuses InputField, SelectField, CheckboxField, DatePickerField    |
| **Validation**     | Dynamic Zod (Section 4.4)              | Schema built at runtime from field definitions                    |
| **Layout**         | Tailwind `grid-cols-12` + `col-span-*` | Maps directly to `colSpan` in JSON                                |
| **State**          | `useState` + `useCallback`             | Same pattern as existing badge designer                           |
| **Undo/Redo**      | Command pattern with history stack     | Enables granular undo of each designer action                     |
| **Autosave**       | Debounced mutation (3s inactivity)     | Prevents data loss without overwhelming the server                |
| **Virtualization** | `@tanstack/react-virtual`              | Handles 100+ field forms without rendering lag                    |
| **JSON Diff**      | `deep-diff`                            | Tracks changes between form versions for audit trail              |
| **Analytics**      | Custom event tracking                  | Lightweight field-level telemetry without third-party deps        |

---

## 3. Data Model

### 3.1 FormTemplate Model

```prisma
model FormTemplate {
  id                String           @id @default(cuid())
  tenantId          String
  tenant            Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId           String?
  event             Event?           @relation(fields: [eventId], references: [id])
  name              String
  description       String?
  version           Int              @default(1)
  definition        Json             // The full form layout JSON
  participantTypeId String?
  participantType   ParticipantType? @relation(fields: [participantTypeId], references: [id])
  isActive          Boolean          @default(true)
  publishedAt       DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@unique([tenantId, eventId, participantTypeId, name])
  @@index([tenantId, eventId])
}
```

**Field Explanations:**

| Field               | Purpose                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| `tenantId`          | Tenant isolation -- every form belongs to exactly one tenant                      |
| `eventId`           | Optional event scoping -- `null` means a global template reusable across events   |
| `name`              | Human-readable form name (e.g., "Delegate Registration Form")                     |
| `description`       | Optional description for admin reference                                          |
| `version`           | Auto-incrementing version number, bumped on each publish                          |
| `definition`        | The complete form layout as a JSON document (pages, sections, fields, conditions) |
| `participantTypeId` | Optional association with a specific participant type for type-specific forms     |
| `isActive`          | Soft delete flag -- inactive forms are hidden from the form selector              |
| `publishedAt`       | Timestamp when the form was last published; `null` means draft only               |

### 3.2 SectionTemplate Model

```prisma
model SectionTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  definition  Json     // Section JSON with fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, name])
}
```

**Field Explanations:**

| Field        | Purpose                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| `tenantId`   | Tenant isolation for section templates                                                   |
| `name`       | Human-readable name (e.g., "Personal Info", "Passport & Identity", "Travel & Logistics") |
| `definition` | JSON document containing the section structure with field placeholders                   |

Section templates enable reuse of common field groupings across multiple forms. When a template is inserted into a form, the section definition is deep-copied so subsequent template edits do not affect existing forms.

### 3.3 FormVersion Model

```prisma
model FormVersion {
  id              String       @id @default(cuid())
  formTemplateId  String
  formTemplate    FormTemplate @relation(fields: [formTemplateId], references: [id], onDelete: Cascade)
  version         Int
  definition      Json         // Snapshot of the form definition at this version
  diff            Json?        // JSON diff from previous version (null for v1)
  status          FormVersionStatus @default(DRAFT)
  publishedAt     DateTime?
  publishedBy     String?      // userId who published this version
  changeNotes     String?      // Optional description of changes
  createdAt       DateTime     @default(now())

  @@unique([formTemplateId, version])
  @@index([formTemplateId, status])
}

enum FormVersionStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

**Version Lifecycle:**

```
┌─────────┐     publish()     ┌───────────┐     new version     ┌──────────┐
│  DRAFT  │──────────────────>│ PUBLISHED │─────────────────────>│ ARCHIVED │
│         │                   │           │                      │          │
│ Editable│                   │ Immutable │                      │ Read-only│
│ Auto-   │                   │ Served to │                      │ Audit    │
│ saved   │                   │ registr.  │                      │ trail    │
└─────────┘                   └───────────┘                      └──────────┘
     ^                                                                │
     │                         restore()                              │
     └────────────────────────────────────────────────────────────────┘
```

### 3.4 FormAnalytics Model

```prisma
model FormAnalytics {
  id              String   @id @default(cuid())
  formTemplateId  String
  formTemplate    FormTemplate @relation(fields: [formTemplateId], references: [id], onDelete: Cascade)
  sessionId       String   // Anonymous session identifier
  pageId          String?  // Which page the user was on
  fieldId         String?  // Which field was interacted with
  eventType       FormAnalyticsEventType
  metadata        Json?    // Additional event data (time spent, error message, etc.)
  createdAt       DateTime @default(now())

  @@index([formTemplateId, eventType])
  @@index([formTemplateId, pageId])
  @@index([formTemplateId, createdAt])
  @@index([sessionId])
}

enum FormAnalyticsEventType {
  FORM_STARTED       // User opened the form
  PAGE_VIEWED        // User navigated to a page
  PAGE_COMPLETED     // User completed a page and moved to next
  FIELD_FOCUSED      // User focused on a field
  FIELD_COMPLETED    // User filled in a field
  FIELD_ERROR        // Validation error on a field
  FORM_SUBMITTED     // User submitted the form
  FORM_ABANDONED     // User left without submitting
  PAGE_DROPPED_OFF   // User abandoned on this page
}
```

### 3.5 Entity Relationship Diagram

```
┌──────────────────┐
│      Tenant      │
│                  │
│  id              │
│  name            │
│  slug            │
└────────┬─────────┘
         │ 1
         │
         │ *
┌────────┴─────────┐         ┌──────────────────┐
│  FormTemplate    │────────>│  Event           │
│                  │  0..1   │                  │
│  id              │         │  id              │
│  tenantId (FK)   │         │  name            │
│  eventId (FK)    │         └──────────────────┘
│  name            │
│  description     │         ┌──────────────────┐
│  version         │────────>│ ParticipantType  │
│  definition (J)  │  0..1   │                  │
│  participantType │         │  id              │
│  isActive        │         │  name            │
│  publishedAt     │         └──────────────────┘
│  createdAt       │
│  updatedAt       │
└───┬──────────┬───┘
    │ 1        │ 1
    │          │
    │ *        │ *
┌───┴────────┐ ┌┴─────────────┐
│FormVersion │ │FormAnalytics │
│            │ │              │
│ id         │ │ id           │
│ formTempl. │ │ formTempl.   │
│ version    │ │ sessionId    │
│ definition │ │ pageId       │
│ diff       │ │ fieldId      │
│ status     │ │ eventType    │
│ publishedAt│ │ metadata     │
│ publishedBy│ │ createdAt    │
│ changeNotes│ │              │
│ createdAt  │ └──────────────┘
└────────────┘

┌──────────────────┐
│ SectionTemplate  │
│                  │
│  id              │
│  tenantId (FK)   │───> Tenant
│  name            │
│  definition (J)  │
│  createdAt       │
│  updatedAt       │
└──────────────────┘

(J) = JSON column storing structured document
```

### 3.6 Form Definition JSON Hierarchy

```
FormDefinition
  ├── settings (displayMode, progressBar, submitButtonText)
  └── pages[]
       ├── title, description, order
       ├── visibleIf (conditional)
       └── sections[]
            ├── title, columns (1-4), collapsible, order
            ├── visibleIf (conditional)
            └── fields[]
                 ├── key (maps to customData key)
                 ├── type (text, select, date, file, etc.)
                 ├── label, placeholder, description
                 ├── layout: { colSpan, row, order }
                 ├── validation: { required, min, max, pattern }
                 ├── visibleIf (conditional)
                 └── properties (type-specific config)
```

**TypeScript Interfaces:**

```typescript
interface FormDefinition {
  settings: FormSettings;
  pages: FormPage[];
}

interface FormSettings {
  displayMode: "wizard" | "single-page" | "accordion";
  showProgressBar: boolean;
  submitButtonText: string;
  successMessage?: string;
  redirectUrl?: string;
  enableAnalytics?: boolean;
  enablePrefill?: boolean;
  abTestVariant?: string;
}

interface FormPage {
  id: string;
  title: string;
  description?: string;
  order: number;
  visibleIf?: VisibilityCondition;
  sections: FormSection[];
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  columns: 1 | 2 | 3 | 4;
  collapsible: boolean;
  defaultCollapsed?: boolean;
  order: number;
  visibleIf?: VisibilityCondition;
  fields: FormField[];
}

interface FormField {
  id: string;
  key: string; // Maps to customData key from Module 02
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  helpText?: string;
  layout: FieldLayout;
  validation: FieldValidation;
  visibleIf?: VisibilityCondition;
  properties?: Record<string, unknown>; // Type-specific configuration
}

interface FieldLayout {
  colSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  row?: number;
  order: number;
}

interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: string; // Custom validation function name
}

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "switch"
  | "file"
  | "image"
  | "heading"
  | "divider"
  | "richtext";

type VisibilityCondition = SimpleCondition | CompoundCondition;

interface SimpleCondition {
  type: "simple";
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

interface CompoundCondition {
  type: "compound";
  operator: "and" | "or";
  conditions: VisibilityCondition[];
}

type ConditionOperator =
  | "eq"
  | "neq"
  | "empty"
  | "notEmpty"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "contains"
  | "in"
  | "notIn";
```

### 3.7 Index Strategy

| Index                                    | Columns                                        | Purpose                                                   |
| ---------------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `FormTemplate_tenantId_eventId`          | `(tenantId, eventId)`                          | Fast lookup of forms for a specific event within a tenant |
| `FormTemplate_unique`                    | `(tenantId, eventId, participantTypeId, name)` | Prevents duplicate form names within the same scope       |
| `SectionTemplate_unique`                 | `(tenantId, name)`                             | Prevents duplicate section template names per tenant      |
| `FormVersion_formTemplateId_status`      | `(formTemplateId, status)`                     | Quick lookup of published vs. draft versions              |
| `FormVersion_unique`                     | `(formTemplateId, version)`                    | Ensures version numbers are unique per form               |
| `FormAnalytics_formTemplateId_eventType` | `(formTemplateId, eventType)`                  | Aggregation queries for analytics dashboard               |
| `FormAnalytics_formTemplateId_pageId`    | `(formTemplateId, pageId)`                     | Page-level drop-off analysis                              |
| `FormAnalytics_formTemplateId_createdAt` | `(formTemplateId, createdAt)`                  | Time-series analytics queries                             |
| `FormAnalytics_sessionId`                | `(sessionId)`                                  | Reconstruct individual user journeys                      |

---

## 4. API Specification

All endpoints require authentication and enforce tenant isolation. The `tenantId` is extracted from the authenticated session and automatically applied to all queries.

### 4.1 Form Template CRUD

#### List Form Templates

```
GET /api/v1/form-templates
```

**Query Parameters:**

| Parameter           | Type      | Required | Description                               |
| ------------------- | --------- | -------- | ----------------------------------------- |
| `eventId`           | `string`  | No       | Filter by event                           |
| `participantTypeId` | `string`  | No       | Filter by participant type                |
| `isActive`          | `boolean` | No       | Filter by active status (default: `true`) |
| `search`            | `string`  | No       | Full-text search on name and description  |
| `page`              | `number`  | No       | Page number (default: 1)                  |
| `limit`             | `number`  | No       | Items per page (default: 20, max: 100)    |

**Response: `200 OK`**

```typescript
interface ListFormTemplatesResponse {
  data: FormTemplateSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface FormTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  publishedAt: string | null;
  eventId: string | null;
  eventName: string | null;
  participantTypeId: string | null;
  participantTypeName: string | null;
  fieldCount: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

**Server Implementation:**

```typescript
// app/routes/api.v1.form-templates.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireTenantUser } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { tenantId } = await requireTenantUser(request, ["form:read"]);
  const url = new URL(request.url);

  const eventId = url.searchParams.get("eventId");
  const participantTypeId = url.searchParams.get("participantTypeId");
  const isActive = url.searchParams.get("isActive") !== "false";
  const search = url.searchParams.get("search");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));

  const where = {
    tenantId,
    isActive,
    ...(eventId && { eventId }),
    ...(participantTypeId && { participantTypeId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [templates, total] = await Promise.all([
    prisma.formTemplate.findMany({
      where,
      include: {
        event: { select: { name: true } },
        participantType: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.formTemplate.count({ where }),
  ]);

  const data = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    version: t.version,
    isActive: t.isActive,
    publishedAt: t.publishedAt?.toISOString() ?? null,
    eventId: t.eventId,
    eventName: t.event?.name ?? null,
    participantTypeId: t.participantTypeId,
    participantTypeName: t.participantType?.name ?? null,
    fieldCount: countFields(t.definition as FormDefinition),
    pageCount: (t.definition as FormDefinition).pages?.length ?? 0,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

function countFields(definition: FormDefinition): number {
  return (
    definition.pages?.reduce(
      (sum, page) =>
        sum + page.sections.reduce((sectionSum, section) => sectionSum + section.fields.length, 0),
      0,
    ) ?? 0
  );
}
```

#### Get Form Template

```
GET /api/v1/form-templates/:id
```

**Response: `200 OK`**

```typescript
interface GetFormTemplateResponse {
  id: string;
  name: string;
  description: string | null;
  version: number;
  definition: FormDefinition;
  isActive: boolean;
  publishedAt: string | null;
  eventId: string | null;
  participantTypeId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### Create Form Template

```
POST /api/v1/form-templates
```

**Request Body:**

```typescript
interface CreateFormTemplateRequest {
  name: string;
  description?: string;
  eventId?: string;
  participantTypeId?: string;
  definition?: FormDefinition; // Optional; defaults to empty single-page form
}
```

**Response: `201 Created`**

```typescript
// Returns the full GetFormTemplateResponse
```

**Server Implementation:**

```typescript
// app/routes/api.v1.form-templates.tsx (action)
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireTenantUser } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { validateFormDefinition } from "~/utils/form-definition.server";

const CreateFormSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  eventId: z.string().cuid().optional(),
  participantTypeId: z.string().cuid().optional(),
  definition: z.any().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const { tenantId, userId } = await requireTenantUser(request, ["form:write"]);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const parsed = CreateFormSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, eventId, participantTypeId, definition } = parsed.data;

  // Default empty form definition
  const formDefinition: FormDefinition = definition ?? {
    settings: {
      displayMode: "wizard",
      showProgressBar: true,
      submitButtonText: "Submit",
    },
    pages: [
      {
        id: generateId("page"),
        title: "Page 1",
        order: 1,
        sections: [
          {
            id: generateId("sec"),
            title: "Section 1",
            columns: 2,
            collapsible: false,
            order: 1,
            fields: [],
          },
        ],
      },
    ],
  };

  // Validate the form definition structure
  const validationErrors = validateFormDefinition(formDefinition);
  if (validationErrors.length > 0) {
    return json({ error: "Invalid form definition", details: validationErrors }, { status: 400 });
  }

  const template = await prisma.formTemplate.create({
    data: {
      tenantId,
      name,
      description,
      eventId,
      participantTypeId,
      definition: formDefinition as any,
      version: 1,
    },
  });

  // Create initial version record
  await prisma.formVersion.create({
    data: {
      formTemplateId: template.id,
      version: 1,
      definition: formDefinition as any,
      status: "DRAFT",
    },
  });

  return json(template, { status: 201 });
}
```

#### Update Form Template

```
PUT /api/v1/form-templates/:id
```

**Request Body:**

```typescript
interface UpdateFormTemplateRequest {
  name?: string;
  description?: string;
  definition?: FormDefinition;
}
```

**Response: `200 OK`**

**Error Responses:**

| Status | Condition                                              |
| ------ | ------------------------------------------------------ |
| `400`  | Invalid form definition structure                      |
| `403`  | User lacks `form:write` permission                     |
| `404`  | Form template not found or belongs to different tenant |
| `409`  | Concurrent edit conflict (version mismatch)            |
| `413`  | Form definition exceeds maximum size (512 KB)          |

#### Delete Form Template (Soft Delete)

```
DELETE /api/v1/form-templates/:id
```

Sets `isActive = false`. Does not delete the record.

**Response: `204 No Content`**

### 4.2 Section Template CRUD

#### List Section Templates

```
GET /api/v1/section-templates
```

**Query Parameters:**

| Parameter | Type     | Required | Description                  |
| --------- | -------- | -------- | ---------------------------- |
| `search`  | `string` | No       | Search by name               |
| `page`    | `number` | No       | Page number (default: 1)     |
| `limit`   | `number` | No       | Items per page (default: 50) |

**Response: `200 OK`**

```typescript
interface ListSectionTemplatesResponse {
  data: SectionTemplateSummary[];
  pagination: PaginationMeta;
}

interface SectionTemplateSummary {
  id: string;
  name: string;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Create Section Template

```
POST /api/v1/section-templates
```

**Request Body:**

```typescript
interface CreateSectionTemplateRequest {
  name: string;
  definition: FormSection; // Section JSON with fields
}
```

**Response: `201 Created`**

#### Update Section Template

```
PUT /api/v1/section-templates/:id
```

#### Delete Section Template

```
DELETE /api/v1/section-templates/:id
```

Hard delete -- section templates are not versioned.

### 4.3 Form Preview

#### Generate Form Preview

```
POST /api/v1/form-templates/:id/preview
```

Returns the rendered form HTML/component data for preview purposes. Accepts optional mock data for conditional visibility testing.

**Request Body:**

```typescript
interface FormPreviewRequest {
  mockData?: Record<string, unknown>; // Mock form data for condition evaluation
  responsiveMode?: "desktop" | "tablet" | "phone";
  pageIndex?: number; // Specific page to preview (wizard mode)
}
```

**Response: `200 OK`**

```typescript
interface FormPreviewResponse {
  definition: FormDefinition;
  resolvedPages: FormPage[]; // Pages after visibility evaluation
  validationSchema: Record<string, unknown>; // Zod schema as JSON
  mockData: Record<string, unknown>;
}
```

### 4.4 Publish / Unpublish

#### Publish Form

```
POST /api/v1/form-templates/:id/publish
```

Publishing a form:

1. Validates the form definition (no orphaned references, no circular conditions)
2. Creates a new `FormVersion` record with status `PUBLISHED`
3. Archives the previously published version
4. Increments the `version` counter on `FormTemplate`
5. Sets `publishedAt` to the current timestamp

**Request Body:**

```typescript
interface PublishFormRequest {
  changeNotes?: string; // Optional description of changes
}
```

**Response: `200 OK`**

```typescript
interface PublishFormResponse {
  id: string;
  version: number;
  publishedAt: string;
  changeNotes: string | null;
}
```

**Server Implementation:**

```typescript
// app/routes/api.v1.form-templates.$id.publish.tsx
export async function action({ request, params }: ActionFunctionArgs) {
  const { tenantId, userId } = await requireTenantUser(request, ["form:publish"]);
  const { id } = params;

  const template = await prisma.formTemplate.findFirst({
    where: { id, tenantId },
  });

  if (!template) {
    return json({ error: "Form template not found" }, { status: 404 });
  }

  const definition = template.definition as FormDefinition;

  // Validate before publishing
  const errors = validateFormDefinition(definition);
  if (errors.length > 0) {
    return json({ error: "Form has validation errors", details: errors }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const changeNotes = (body as any).changeNotes ?? null;

  const result = await prisma.$transaction(async (tx) => {
    // Archive previously published version
    await tx.formVersion.updateMany({
      where: { formTemplateId: id, status: "PUBLISHED" },
      data: { status: "ARCHIVED" },
    });

    const newVersion = template.version + 1;

    // Get previous definition for diff
    const previousVersion = await tx.formVersion.findFirst({
      where: { formTemplateId: id },
      orderBy: { version: "desc" },
    });

    const diff = previousVersion
      ? computeDefinitionDiff(previousVersion.definition as FormDefinition, definition)
      : null;

    // Create new published version
    const version = await tx.formVersion.create({
      data: {
        formTemplateId: id,
        version: newVersion,
        definition: definition as any,
        diff: diff as any,
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedBy: userId,
        changeNotes,
      },
    });

    // Update form template
    await tx.formTemplate.update({
      where: { id },
      data: {
        version: newVersion,
        publishedAt: new Date(),
      },
    });

    return version;
  });

  return json({
    id: result.id,
    version: result.version,
    publishedAt: result.publishedAt!.toISOString(),
    changeNotes: result.changeNotes,
  });
}
```

#### Unpublish Form

```
POST /api/v1/form-templates/:id/unpublish
```

Reverts the form to draft state. The published version is archived but not deleted.

**Response: `200 OK`**

### 4.5 Clone Form

```
POST /api/v1/form-templates/:id/clone
```

Creates a deep copy of the form template with a new ID and name.

**Request Body:**

```typescript
interface CloneFormRequest {
  name: string; // Name for the cloned form
  eventId?: string; // Optionally assign to a different event
  participantTypeId?: string;
}
```

**Response: `201 Created`**

```typescript
// Returns the full GetFormTemplateResponse for the cloned form
```

**Server Implementation:**

```typescript
export async function action({ request, params }: ActionFunctionArgs) {
  const { tenantId } = await requireTenantUser(request, ["form:write"]);
  const { id } = params;

  const source = await prisma.formTemplate.findFirst({
    where: { id, tenantId },
  });

  if (!source) {
    return json({ error: "Source form not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, eventId, participantTypeId } = body as CloneFormRequest;

  // Deep-clone the definition, regenerating all IDs
  const clonedDefinition = regenerateIds(structuredClone(source.definition as FormDefinition));

  const clone = await prisma.formTemplate.create({
    data: {
      tenantId,
      name,
      description: `Cloned from "${source.name}"`,
      eventId: eventId ?? source.eventId,
      participantTypeId: participantTypeId ?? source.participantTypeId,
      definition: clonedDefinition as any,
      version: 1,
    },
  });

  await prisma.formVersion.create({
    data: {
      formTemplateId: clone.id,
      version: 1,
      definition: clonedDefinition as any,
      status: "DRAFT",
    },
  });

  return json(clone, { status: 201 });
}

function regenerateIds(definition: FormDefinition): FormDefinition {
  const idMap = new Map<string, string>();

  for (const page of definition.pages) {
    const newPageId = generateId("page");
    idMap.set(page.id, newPageId);
    page.id = newPageId;

    for (const section of page.sections) {
      const newSectionId = generateId("sec");
      idMap.set(section.id, newSectionId);
      section.id = newSectionId;

      for (const field of section.fields) {
        const newFieldId = generateId("f");
        idMap.set(field.id, newFieldId);
        field.id = newFieldId;
        // Note: field.key is NOT regenerated -- it maps to the schema key
      }
    }
  }

  return definition;
}
```

### 4.6 Import / Export

#### Export Form Definition

```
GET /api/v1/form-templates/:id/export
```

Returns the form definition as a downloadable JSON file, including metadata for re-import.

**Response: `200 OK` (Content-Type: application/json)**

```typescript
interface FormExport {
  exportVersion: "1.0";
  exportedAt: string;
  formTemplate: {
    name: string;
    description: string | null;
    definition: FormDefinition;
  };
  sectionTemplates: {
    name: string;
    definition: FormSection;
  }[];
}
```

#### Import Form Definition

```
POST /api/v1/form-templates/import
```

Imports a previously exported form definition.

**Request Body:**

```typescript
interface ImportFormRequest {
  exportData: FormExport;
  name?: string; // Override form name
  eventId?: string; // Assign to event
  participantTypeId?: string;
}
```

**Response: `201 Created`**

Validation during import:

- Schema version compatibility check
- Field key existence validation against tenant's field definitions
- Duplicate name detection with suggested alternatives
- Maximum definition size enforcement

### 4.7 Form Version Management

#### List Versions

```
GET /api/v1/form-templates/:id/versions
```

**Response: `200 OK`**

```typescript
interface ListVersionsResponse {
  data: {
    id: string;
    version: number;
    status: FormVersionStatus;
    publishedAt: string | null;
    publishedBy: string | null;
    changeNotes: string | null;
    fieldCount: number;
    pageCount: number;
    createdAt: string;
  }[];
}
```

#### Get Version Detail

```
GET /api/v1/form-templates/:id/versions/:version
```

Returns the full form definition snapshot for a specific version, including the diff from the previous version.

**Response: `200 OK`**

```typescript
interface GetVersionResponse {
  id: string;
  version: number;
  definition: FormDefinition;
  diff: FormDefinitionDiff | null;
  status: FormVersionStatus;
  publishedAt: string | null;
  publishedBy: string | null;
  changeNotes: string | null;
  createdAt: string;
}

interface FormDefinitionDiff {
  added: DiffEntry[];
  removed: DiffEntry[];
  modified: DiffEntry[];
}

interface DiffEntry {
  path: string; // e.g., "pages[0].sections[1].fields[2].label"
  type: "page" | "section" | "field" | "setting";
  oldValue?: unknown;
  newValue?: unknown;
}
```

#### Restore Version

```
POST /api/v1/form-templates/:id/versions/:version/restore
```

Restores a previous version as a new draft. Does not overwrite -- creates a new version based on the restored snapshot.

**Response: `200 OK`**

### 4.8 Form Analytics

#### Get Form Analytics Summary

```
GET /api/v1/form-templates/:id/analytics
```

**Query Parameters:**

| Parameter   | Type           | Required | Description         |
| ----------- | -------------- | -------- | ------------------- |
| `startDate` | `string` (ISO) | No       | Start of date range |
| `endDate`   | `string` (ISO) | No       | End of date range   |

**Response: `200 OK`**

```typescript
interface FormAnalyticsSummary {
  totalStarts: number;
  totalCompletions: number;
  completionRate: number; // percentage
  averageTimeToComplete: number; // seconds
  pageDropOff: {
    pageId: string;
    pageTitle: string;
    views: number;
    completions: number;
    dropOffRate: number;
  }[];
  fieldCompletion: {
    fieldId: string;
    fieldKey: string;
    fieldLabel: string;
    completionRate: number;
    averageTimeSpent: number; // seconds
    errorRate: number;
  }[];
}
```

#### Get Field-Level Analytics

```
GET /api/v1/form-templates/:id/analytics/fields
```

Returns detailed per-field analytics for optimization insights.

#### Get A/B Test Results

```
GET /api/v1/form-templates/:id/analytics/ab-test
```

Returns comparison metrics between form variants when A/B testing is enabled.

**Response: `200 OK`**

```typescript
interface ABTestResults {
  variants: {
    variantId: string;
    variantName: string;
    totalStarts: number;
    totalCompletions: number;
    completionRate: number;
    averageTimeToComplete: number;
    confidenceLevel: number; // Statistical significance percentage
  }[];
  winner: string | null; // variantId with highest completion rate, or null if not yet significant
}
```

---

## 5. Business Logic

### 5.1 Conditional Visibility Rules

Rules can be applied at the **page**, **section**, or **field** level:

**Simple condition:**

```json
{ "type": "simple", "field": "needs_visa", "operator": "eq", "value": true }
```

**Compound condition:**

```json
{
  "type": "compound",
  "operator": "or",
  "conditions": [
    { "type": "simple", "field": "participantType", "operator": "eq", "value": "Armed Security" },
    {
      "type": "simple",
      "field": "participantType",
      "operator": "eq",
      "value": "Special Armed Security"
    }
  ]
}
```

**Operators:** `eq`, `neq`, `empty`, `notEmpty`, `gt`, `lt`, `gte`, `lte`, `contains`, `in`, `notIn`

**UI for Building Conditions:**

The Properties Panel includes a Visibility tab with an intuitive condition builder:

```
┌─────────────────────────────────────────────────────────┐
│  Visibility Rules                                        │
│                                                         │
│  Show this field when:                                  │
│                                                         │
│  ┌─── Rule 1 ───────────────────────────────────────┐  │
│  │  [needs_visa     ▾]  [equals       ▾]  [true  ]  │  │
│  │                                          [x Del]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [AND ▾]                                                │
│                                                         │
│  ┌─── Rule 2 ───────────────────────────────────────┐  │
│  │  [country        ▾]  [not empty    ▾]  [      ]  │  │
│  │                                          [x Del]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [+ Add Rule]                                           │
│                                                         │
│  Preview: Visible when needs_visa = true AND            │
│           country is not empty                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Condition Evaluation Engine

```typescript
function evaluateCondition(condition, formData) {
  if (!condition) return true;

  if (condition.type === "simple") {
    const value = formData[condition.field];
    switch (condition.operator) {
      case "eq":
        return value === condition.value;
      case "neq":
        return value !== condition.value;
      case "empty":
        return !value;
      case "notEmpty":
        return !!value;
      case "gt":
        return Number(value) > Number(condition.value);
      case "contains":
        return String(value).includes(condition.value);
      case "in":
        return condition.value.includes(value);
    }
  }

  if (condition.type === "compound") {
    const results = condition.conditions.map((c) => evaluateCondition(c, formData));
    return condition.operator === "and" ? results.every(Boolean) : results.some(Boolean);
  }
}
```

**Extended evaluation engine with full operator support and type safety:**

```typescript
// app/utils/condition-evaluator.ts

import type { VisibilityCondition, SimpleCondition, CompoundCondition } from "./types";

export function evaluateCondition(
  condition: VisibilityCondition | undefined | null,
  formData: Record<string, unknown>,
): boolean {
  if (!condition) return true;

  if (condition.type === "simple") {
    return evaluateSimpleCondition(condition, formData);
  }

  if (condition.type === "compound") {
    return evaluateCompoundCondition(condition, formData);
  }

  // Unknown condition type -- default to visible
  console.warn(`Unknown condition type: ${(condition as any).type}`);
  return true;
}

function evaluateSimpleCondition(
  condition: SimpleCondition,
  formData: Record<string, unknown>,
): boolean {
  const value = formData[condition.field];

  switch (condition.operator) {
    case "eq":
      return value === condition.value;
    case "neq":
      return value !== condition.value;
    case "empty":
      return (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    case "notEmpty":
      return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
      );
    case "gt":
      return Number(value) > Number(condition.value);
    case "lt":
      return Number(value) < Number(condition.value);
    case "gte":
      return Number(value) >= Number(condition.value);
    case "lte":
      return Number(value) <= Number(condition.value);
    case "contains":
      return String(value ?? "")
        .toLowerCase()
        .includes(String(condition.value).toLowerCase());
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(value);
    case "notIn":
      return Array.isArray(condition.value) && !condition.value.includes(value);
    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return true;
  }
}

function evaluateCompoundCondition(
  condition: CompoundCondition,
  formData: Record<string, unknown>,
): boolean {
  const results = condition.conditions.map((c) => evaluateCondition(c, formData));

  return condition.operator === "and" ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Collect all field keys referenced in visibility conditions.
 * Used to set up reactive watchers so that changing a referenced
 * field triggers re-evaluation of dependent conditions.
 */
export function collectDependentFields(
  condition: VisibilityCondition | undefined | null,
): string[] {
  if (!condition) return [];

  if (condition.type === "simple") {
    return [condition.field];
  }

  if (condition.type === "compound") {
    return condition.conditions.flatMap((c) => collectDependentFields(c));
  }

  return [];
}

/**
 * Detect circular visibility dependencies.
 * Returns the cycle path if found, or null if no cycle exists.
 */
export function detectCircularDependencies(
  fields: Array<{ id: string; key: string; visibleIf?: VisibilityCondition }>,
): string[] | null {
  const graph = new Map<string, string[]>();

  for (const field of fields) {
    const deps = collectDependentFields(field.visibleIf);
    graph.set(field.key, deps);
  }

  // DFS cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      return true;
    }
    if (visited.has(node)) return false;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    for (const dep of graph.get(node) ?? []) {
      if (dfs(dep)) return true;
    }

    inStack.delete(node);
    path.pop();
    return false;
  }

  for (const key of graph.keys()) {
    path.length = 0;
    visited.clear();
    inStack.clear();
    if (dfs(key)) {
      return [...path, key];
    }
  }

  return null;
}
```

### 5.3 Section Management with Drag-and-Drop

Sections are titled cards containing fields in a grid layout.

**Adding:** [+ Add Section] dialog with title, description, column count (1-4), collapsible toggle.

**Reordering:** Drag sections via handle using `@dnd-kit` SortableContext at section level.

**Nesting:** Nested SortableContexts -- sections reorder among themselves, fields reorder within sections or drag between sections.

```tsx
<SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
  {page.sections.map((section) => (
    <SortableSection key={section.id} section={section}>
      <SortableContext items={fieldIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-12 gap-3">
          {section.fields.map((field) => (
            <SortableField key={field.id} field={field} />
          ))}
        </div>
      </SortableContext>
    </SortableSection>
  ))}
</SortableContext>
```

**Section Templates:** Save common groupings (Personal Info, Passport & Identity, Travel & Logistics) as reusable templates. When adding a section, choose "From Template" to start from a saved layout.

**Full SortableSection Component:**

```tsx
// app/components/form-designer/sortable-section.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronRight, Trash2, Copy, Settings } from "lucide-react";
import { cn } from "~/utils/cn";
import type { FormSection } from "~/utils/types";

interface SortableSectionProps {
  section: FormSection;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onDuplicate: (sectionId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
}

export function SortableSection({
  section,
  children,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleCollapse,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-white shadow-sm",
        isSelected && "ring-2 ring-blue-500",
        isDragging && "shadow-lg",
      )}
      onClick={() => onSelect(section.id)}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 border-b px-4 py-2 bg-gray-50 rounded-t-lg">
        <button
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button onClick={() => onToggleCollapse(section.id)}>
          {section.defaultCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <h3 className="text-sm font-medium text-gray-700 flex-1">{section.title}</h3>

        <span className="text-xs text-gray-400">
          {section.fields.length} field{section.fields.length !== 1 ? "s" : ""} |{section.columns}{" "}
          col{section.columns !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(section.id);
            }}
            className="p-1 text-gray-400 hover:text-blue-500"
            title="Duplicate section"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(section.id);
            }}
            className="p-1 text-gray-400 hover:text-red-500"
            title="Delete section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Section Body */}
      {!section.defaultCollapsed && (
        <div className="p-4">
          {children}
          {section.fields.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">
              Drag fields here
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Full SortableField Component:**

```tsx
// app/components/form-designer/sortable-field.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "~/utils/cn";
import type { FormField } from "~/utils/types";

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: (fieldId: string) => void;
}

const fieldTypeIcons: Record<string, string> = {
  text: "Aa",
  textarea: "=",
  number: "#",
  email: "@",
  phone: "Ph",
  date: "Cal",
  select: "v",
  multiselect: "vv",
  radio: "O",
  checkbox: "X",
  switch: "IO",
  file: "F",
  image: "Img",
  heading: "H",
  divider: "--",
};

export function SortableField({ field, isSelected, onSelect }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${field.layout.colSpan}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded border bg-white p-2 cursor-pointer",
        "hover:border-blue-300 transition-colors",
        isSelected && "border-blue-500 bg-blue-50",
        isDragging && "opacity-50 shadow-lg",
      )}
      onClick={() => onSelect(field.id)}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="text-xs font-mono bg-gray-100 rounded px-1 py-0.5 text-gray-500 flex-shrink-0">
        {fieldTypeIcons[field.type] ?? "?"}
      </span>

      <span className="text-sm text-gray-700 truncate flex-1">{field.label}</span>

      {field.validation?.required && <span className="text-red-400 text-xs flex-shrink-0">*</span>}

      {field.visibleIf && (
        <span className="text-amber-400 text-xs flex-shrink-0" title="Has visibility condition">
          if
        </span>
      )}

      <span className="text-xs text-gray-300 flex-shrink-0">{field.layout.colSpan}/12</span>
    </div>
  );
}
```

### 5.4 Concrete Example: AU Summit Registration

```json
{
  "settings": {
    "displayMode": "wizard",
    "showProgressBar": true,
    "submitButtonText": "Submit Application"
  },
  "pages": [
    {
      "id": "page_personal",
      "title": "Personal Information",
      "description": "Please provide your personal details",
      "order": 1,
      "sections": [
        {
          "id": "sec_name",
          "title": "Full Name",
          "columns": 3,
          "order": 1,
          "fields": [
            {
              "id": "f1",
              "key": "titleId",
              "type": "select",
              "label": "Title",
              "layout": { "colSpan": 3, "order": 1 },
              "validation": { "required": true },
              "properties": { "optionsSource": "titles" }
            },
            {
              "id": "f2",
              "key": "firstName",
              "type": "text",
              "label": "First Name",
              "layout": { "colSpan": 4, "order": 2 },
              "validation": { "required": true, "minLength": 2 }
            },
            {
              "id": "f3",
              "key": "familyName",
              "type": "text",
              "label": "Family Name",
              "layout": { "colSpan": 5, "order": 3 },
              "validation": { "required": true }
            }
          ]
        },
        {
          "id": "sec_identity",
          "title": "Passport Details",
          "columns": 2,
          "order": 2,
          "fields": [
            {
              "id": "f6",
              "key": "passport_number",
              "type": "text",
              "label": "Passport Number",
              "layout": { "colSpan": 6, "order": 1 },
              "validation": { "required": true, "pattern": "^[A-Z0-9]{5,15}$" }
            },
            {
              "id": "f7",
              "key": "passport_expiry",
              "type": "date",
              "label": "Passport Expiry",
              "layout": { "colSpan": 6, "order": 2 },
              "validation": { "required": true }
            }
          ]
        }
      ]
    },
    {
      "id": "page_travel",
      "title": "Travel Information",
      "order": 2,
      "sections": [
        {
          "id": "sec_travel",
          "title": "Visa & Flight",
          "columns": 2,
          "order": 1,
          "fields": [
            {
              "id": "f8",
              "key": "needs_visa",
              "type": "switch",
              "label": "Do you need visa assistance?",
              "layout": { "colSpan": 6, "order": 1 }
            },
            {
              "id": "f9",
              "key": "flight_number",
              "type": "text",
              "label": "Flight Number",
              "layout": { "colSpan": 6, "order": 2 },
              "visibleIf": {
                "type": "simple",
                "field": "needs_visa",
                "operator": "eq",
                "value": true
              }
            }
          ]
        }
      ]
    },
    {
      "id": "page_security",
      "title": "Security Details",
      "order": 3,
      "visibleIf": {
        "type": "simple",
        "field": "participantType",
        "operator": "in",
        "value": ["Armed Security", "Special Armed Security"]
      },
      "sections": [
        {
          "id": "sec_weapon",
          "title": "Weapon Registration",
          "columns": 2,
          "order": 1,
          "fields": [
            {
              "id": "f11",
              "key": "weapon_type",
              "type": "select",
              "label": "Weapon Type",
              "layout": { "colSpan": 6, "order": 1 },
              "validation": { "required": true },
              "properties": {
                "options": [
                  { "label": "Pistol", "value": "pistol" },
                  { "label": "Rifle", "value": "rifle" },
                  { "label": "Other", "value": "other" }
                ]
              }
            },
            {
              "id": "f12",
              "key": "weapon_serial",
              "type": "text",
              "label": "Weapon Serial Number",
              "layout": { "colSpan": 6, "order": 2 },
              "validation": { "required": true, "maxLength": 20 }
            },
            {
              "id": "f13",
              "key": "weapon_permit",
              "type": "file",
              "label": "Weapon Permit",
              "layout": { "colSpan": 12, "order": 3 },
              "validation": { "required": true },
              "properties": { "accept": ".pdf,.jpg,.jpeg,.png", "maxFileSize": 5242880 }
            }
          ]
        }
      ]
    }
  ]
}
```

**Page-level visibility** enables participant-type-specific pages:

- Minister sees: Personal Info -> Organization -> Travel -> Documents (4 pages)
- Armed Security sees: Personal Info -> Organization -> Travel -> **Security Details** -> Documents (5 pages)
- Press sees: Personal Info -> Organization -> Travel -> **Press Credentials** -> Documents (5 pages)

All from the **same form template**, with the wizard automatically adjusting.

### 5.5 Undo/Redo System (Command Pattern)

The undo/redo system uses the Command Pattern with a history stack. Every designer action is encapsulated as a command object that knows how to execute itself and how to undo itself.

```typescript
// app/components/form-designer/commands.ts

/**
 * Base command interface for the undo/redo system.
 * Each command encapsulates a designer action with both
 * execute (do) and undo capabilities.
 */
interface DesignerCommand {
  type: string;
  description: string;
  execute(state: FormDefinition): FormDefinition;
  undo(state: FormDefinition): FormDefinition;
}

/**
 * Insert a new field into a section.
 */
class InsertFieldCommand implements DesignerCommand {
  type = "INSERT_FIELD" as const;
  description: string;

  constructor(
    private pageId: string,
    private sectionId: string,
    private field: FormField,
    private index: number,
  ) {
    this.description = `Add field "${field.label}"`;
  }

  execute(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const section = findSection(next, this.pageId, this.sectionId);
    if (section) {
      section.fields.splice(this.index, 0, this.field);
    }
    return next;
  }

  undo(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const section = findSection(next, this.pageId, this.sectionId);
    if (section) {
      section.fields.splice(this.index, 1);
    }
    return next;
  }
}

/**
 * Remove a field from a section.
 */
class RemoveFieldCommand implements DesignerCommand {
  type = "REMOVE_FIELD" as const;
  description: string;
  private removedField: FormField | null = null;
  private removedIndex: number = -1;

  constructor(
    private pageId: string,
    private sectionId: string,
    private fieldId: string,
  ) {
    this.description = `Remove field`;
  }

  execute(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const section = findSection(next, this.pageId, this.sectionId);
    if (section) {
      this.removedIndex = section.fields.findIndex((f) => f.id === this.fieldId);
      if (this.removedIndex >= 0) {
        this.removedField = section.fields[this.removedIndex];
        this.description = `Remove field "${this.removedField.label}"`;
        section.fields.splice(this.removedIndex, 1);
      }
    }
    return next;
  }

  undo(state: FormDefinition): FormDefinition {
    if (!this.removedField || this.removedIndex < 0) return state;
    const next = structuredClone(state);
    const section = findSection(next, this.pageId, this.sectionId);
    if (section) {
      section.fields.splice(this.removedIndex, 0, this.removedField);
    }
    return next;
  }
}

/**
 * Move a field within or between sections.
 */
class MoveFieldCommand implements DesignerCommand {
  type = "MOVE_FIELD" as const;
  description: string;

  constructor(
    private fromPageId: string,
    private fromSectionId: string,
    private fromIndex: number,
    private toPageId: string,
    private toSectionId: string,
    private toIndex: number,
    private fieldLabel: string,
  ) {
    this.description = `Move field "${fieldLabel}"`;
  }

  execute(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const fromSection = findSection(next, this.fromPageId, this.fromSectionId);
    const toSection = findSection(next, this.toPageId, this.toSectionId);
    if (fromSection && toSection) {
      const [field] = fromSection.fields.splice(this.fromIndex, 1);
      toSection.fields.splice(this.toIndex, 0, field);
    }
    return next;
  }

  undo(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const fromSection = findSection(next, this.toPageId, this.toSectionId);
    const toSection = findSection(next, this.fromPageId, this.fromSectionId);
    if (fromSection && toSection) {
      const [field] = fromSection.fields.splice(this.toIndex, 1);
      toSection.fields.splice(this.fromIndex, 0, field);
    }
    return next;
  }
}

/**
 * Update field properties (label, validation, layout, visibility, etc.).
 */
class UpdateFieldCommand implements DesignerCommand {
  type = "UPDATE_FIELD" as const;
  description: string;
  private previousValue: Partial<FormField> | null = null;

  constructor(
    private pageId: string,
    private sectionId: string,
    private fieldId: string,
    private updates: Partial<FormField>,
  ) {
    this.description = `Update field properties`;
  }

  execute(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const section = findSection(next, this.pageId, this.sectionId);
    if (section) {
      const field = section.fields.find((f) => f.id === this.fieldId);
      if (field) {
        // Store previous values for undo
        this.previousValue = {};
        for (const key of Object.keys(this.updates) as (keyof FormField)[]) {
          (this.previousValue as any)[key] = structuredClone((field as any)[key]);
          (field as any)[key] = structuredClone((this.updates as any)[key]);
        }
        this.description = `Update field "${field.label}"`;
      }
    }
    return next;
  }

  undo(state: FormDefinition): FormDefinition {
    if (!this.previousValue) return state;
    const next = structuredClone(state);
    const section = findSection(next, this.pageId, this.sectionId);
    if (section) {
      const field = section.fields.find((f) => f.id === this.fieldId);
      if (field) {
        for (const key of Object.keys(this.previousValue) as (keyof FormField)[]) {
          (field as any)[key] = structuredClone((this.previousValue as any)[key]);
        }
      }
    }
    return next;
  }
}

/**
 * Insert a new section into a page.
 */
class InsertSectionCommand implements DesignerCommand {
  type = "INSERT_SECTION" as const;
  description: string;

  constructor(
    private pageId: string,
    private section: FormSection,
    private index: number,
  ) {
    this.description = `Add section "${section.title}"`;
  }

  execute(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const page = next.pages.find((p) => p.id === this.pageId);
    if (page) {
      page.sections.splice(this.index, 0, this.section);
    }
    return next;
  }

  undo(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const page = next.pages.find((p) => p.id === this.pageId);
    if (page) {
      page.sections.splice(this.index, 1);
    }
    return next;
  }
}

/**
 * Remove a section from a page.
 */
class RemoveSectionCommand implements DesignerCommand {
  type = "REMOVE_SECTION" as const;
  description: string;
  private removedSection: FormSection | null = null;
  private removedIndex: number = -1;

  constructor(
    private pageId: string,
    private sectionId: string,
  ) {
    this.description = `Remove section`;
  }

  execute(state: FormDefinition): FormDefinition {
    const next = structuredClone(state);
    const page = next.pages.find((p) => p.id === this.pageId);
    if (page) {
      this.removedIndex = page.sections.findIndex((s) => s.id === this.sectionId);
      if (this.removedIndex >= 0) {
        this.removedSection = page.sections[this.removedIndex];
        this.description = `Remove section "${this.removedSection.title}"`;
        page.sections.splice(this.removedIndex, 1);
      }
    }
    return next;
  }

  undo(state: FormDefinition): FormDefinition {
    if (!this.removedSection || this.removedIndex < 0) return state;
    const next = structuredClone(state);
    const page = next.pages.find((p) => p.id === this.pageId);
    if (page) {
      page.sections.splice(this.removedIndex, 0, this.removedSection);
    }
    return next;
  }
}

// ─── Helper ─────────────────────────────────────────────────

function findSection(
  definition: FormDefinition,
  pageId: string,
  sectionId: string,
): FormSection | undefined {
  const page = definition.pages.find((p) => p.id === pageId);
  return page?.sections.find((s) => s.id === sectionId);
}
```

**History Stack Manager:**

```typescript
// app/components/form-designer/use-undo-redo.ts

import { useState, useCallback, useRef } from "react";

interface UndoRedoState {
  past: DesignerCommand[];
  future: DesignerCommand[];
}

const MAX_HISTORY_SIZE = 100;

export function useUndoRedo(initialDefinition: FormDefinition) {
  const [definition, setDefinition] = useState<FormDefinition>(initialDefinition);
  const historyRef = useRef<UndoRedoState>({ past: [], future: [] });

  const executeCommand = useCallback((command: DesignerCommand) => {
    setDefinition((prev) => {
      const next = command.execute(prev);
      const history = historyRef.current;

      // Add to past, clear future (new branch)
      history.past.push(command);
      history.future = [];

      // Trim history if too large
      if (history.past.length > MAX_HISTORY_SIZE) {
        history.past = history.past.slice(-MAX_HISTORY_SIZE);
      }

      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setDefinition((prev) => {
      const history = historyRef.current;
      const command = history.past.pop();
      if (!command) return prev;

      history.future.push(command);
      return command.undo(prev);
    });
  }, []);

  const redo = useCallback(() => {
    setDefinition((prev) => {
      const history = historyRef.current;
      const command = history.future.pop();
      if (!command) return prev;

      history.past.push(command);
      return command.execute(prev);
    });
  }, []);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  const lastAction = historyRef.current.past[historyRef.current.past.length - 1]?.description;

  return {
    definition,
    setDefinition,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
    historySize: historyRef.current.past.length,
  };
}
```

### 5.6 Form Versioning with Diff Tracking

Every publish creates an immutable snapshot. The diff engine computes granular changes between consecutive versions.

```typescript
// app/utils/form-definition-diff.server.ts

import type { FormDefinition, FormPage, FormSection, FormField } from "./types";

interface DiffEntry {
  path: string;
  type: "page" | "section" | "field" | "setting";
  action: "added" | "removed" | "modified";
  oldValue?: unknown;
  newValue?: unknown;
}

export function computeDefinitionDiff(
  previous: FormDefinition,
  current: FormDefinition,
): { added: DiffEntry[]; removed: DiffEntry[]; modified: DiffEntry[] } {
  const added: DiffEntry[] = [];
  const removed: DiffEntry[] = [];
  const modified: DiffEntry[] = [];

  // Compare settings
  for (const key of Object.keys({ ...previous.settings, ...current.settings })) {
    const oldVal = (previous.settings as any)[key];
    const newVal = (current.settings as any)[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      modified.push({
        path: `settings.${key}`,
        type: "setting",
        action: "modified",
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  // Compare pages
  const prevPageIds = new Set(previous.pages.map((p) => p.id));
  const currPageIds = new Set(current.pages.map((p) => p.id));

  for (const page of current.pages) {
    if (!prevPageIds.has(page.id)) {
      added.push({
        path: `pages[${page.id}]`,
        type: "page",
        action: "added",
        newValue: page.title,
      });
    }
  }

  for (const page of previous.pages) {
    if (!currPageIds.has(page.id)) {
      removed.push({
        path: `pages[${page.id}]`,
        type: "page",
        action: "removed",
        oldValue: page.title,
      });
    }
  }

  // Compare sections and fields within matching pages
  for (const currPage of current.pages) {
    const prevPage = previous.pages.find((p) => p.id === currPage.id);
    if (!prevPage) continue;

    // Page-level property changes
    if (currPage.title !== prevPage.title) {
      modified.push({
        path: `pages[${currPage.id}].title`,
        type: "page",
        action: "modified",
        oldValue: prevPage.title,
        newValue: currPage.title,
      });
    }

    const prevSectionIds = new Set(prevPage.sections.map((s) => s.id));
    const currSectionIds = new Set(currPage.sections.map((s) => s.id));

    for (const section of currPage.sections) {
      if (!prevSectionIds.has(section.id)) {
        added.push({
          path: `pages[${currPage.id}].sections[${section.id}]`,
          type: "section",
          action: "added",
          newValue: section.title,
        });
        continue;
      }

      const prevSection = prevPage.sections.find((s) => s.id === section.id)!;

      // Compare fields within sections
      const prevFieldIds = new Set(prevSection.fields.map((f) => f.id));
      const currFieldIds = new Set(section.fields.map((f) => f.id));

      for (const field of section.fields) {
        if (!prevFieldIds.has(field.id)) {
          added.push({
            path: `pages[${currPage.id}].sections[${section.id}].fields[${field.id}]`,
            type: "field",
            action: "added",
            newValue: field.label,
          });
        } else {
          const prevField = prevSection.fields.find((f) => f.id === field.id)!;
          if (JSON.stringify(prevField) !== JSON.stringify(field)) {
            modified.push({
              path: `pages[${currPage.id}].sections[${section.id}].fields[${field.id}]`,
              type: "field",
              action: "modified",
              oldValue: summarizeFieldChanges(prevField, field),
              newValue: field.label,
            });
          }
        }
      }

      for (const field of prevSection.fields) {
        if (!currFieldIds.has(field.id)) {
          removed.push({
            path: `pages[${currPage.id}].sections[${section.id}].fields[${field.id}]`,
            type: "field",
            action: "removed",
            oldValue: field.label,
          });
        }
      }
    }

    for (const section of prevPage.sections) {
      if (!currSectionIds.has(section.id)) {
        removed.push({
          path: `pages[${currPage.id}].sections[${section.id}]`,
          type: "section",
          action: "removed",
          oldValue: section.title,
        });
      }
    }
  }

  return { added, removed, modified };
}

function summarizeFieldChanges(prev: FormField, curr: FormField): string {
  const changes: string[] = [];
  if (prev.label !== curr.label) changes.push("label");
  if (prev.type !== curr.type) changes.push("type");
  if (JSON.stringify(prev.layout) !== JSON.stringify(curr.layout)) changes.push("layout");
  if (JSON.stringify(prev.validation) !== JSON.stringify(curr.validation))
    changes.push("validation");
  if (JSON.stringify(prev.visibleIf) !== JSON.stringify(curr.visibleIf)) changes.push("visibility");
  return changes.join(", ");
}
```

### 5.7 Autosave with Debounce

The designer autosaves draft changes after 3 seconds of inactivity to prevent data loss. A visual indicator shows the save status.

```typescript
// app/components/form-designer/use-autosave.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "@remix-run/react";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface AutosaveOptions {
  formTemplateId: string;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutosave(definition: FormDefinition, options: AutosaveOptions) {
  const { formTemplateId, debounceMs = 3000, enabled = true } = options;
  const fetcher = useFetcher();
  const [status, setStatus] = useState<SaveStatus>("saved");
  const lastSavedRef = useRef<string>(JSON.stringify(definition));
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedAtRef = useRef<Date>(new Date());

  const save = useCallback(
    (def: FormDefinition) => {
      if (!enabled) return;

      const serialized = JSON.stringify(def);
      if (serialized === lastSavedRef.current) {
        setStatus("saved");
        return;
      }

      setStatus("saving");
      fetcher.submit(
        { definition: serialized },
        {
          method: "PUT",
          action: `/api/v1/form-templates/${formTemplateId}`,
          encType: "application/json",
        },
      );

      lastSavedRef.current = serialized;
      lastSavedAtRef.current = new Date();
    },
    [enabled, fetcher, formTemplateId],
  );

  // Debounced autosave on definition change
  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(definition);
    if (serialized === lastSavedRef.current) return;

    setStatus("unsaved");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save(definition);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [definition, debounceMs, enabled, save]);

  // Update status based on fetcher state
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setStatus("saved");
    } else if (fetcher.state === "idle" && fetcher.data === undefined) {
      // No response yet -- initial state
    } else if (fetcher.state === "submitting" || fetcher.state === "loading") {
      setStatus("saving");
    }
  }, [fetcher.state, fetcher.data]);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "unsaved") {
        e.preventDefault();
        save(definition);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status, definition, save]);

  return {
    status,
    lastSavedAt: lastSavedAtRef.current,
    saveNow: () => save(definition),
  };
}
```

**Autosave Status Indicator Component:**

```tsx
// app/components/form-designer/autosave-indicator.tsx

import { Cloud, CloudOff, Loader2, Check } from "lucide-react";
import { cn } from "~/utils/cn";

interface AutosaveIndicatorProps {
  status: "saved" | "saving" | "unsaved" | "error";
  lastSavedAt: Date;
}

export function AutosaveIndicator({ status, lastSavedAt }: AutosaveIndicatorProps) {
  const statusConfig = {
    saved: {
      icon: Check,
      text: `Saved ${formatTimeAgo(lastSavedAt)}`,
      className: "text-green-600",
    },
    saving: {
      icon: Loader2,
      text: "Saving...",
      className: "text-blue-600 animate-spin",
    },
    unsaved: {
      icon: Cloud,
      text: "Unsaved changes",
      className: "text-amber-500",
    },
    error: {
      icon: CloudOff,
      text: "Save failed",
      className: "text-red-500",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={cn("h-3.5 w-3.5", config.className)} />
      <span className="text-gray-500">{config.text}</span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString();
}
```

### 5.8 Form Validation Engine

Before a form can be published, it must pass structural validation to ensure a consistent participant experience.

```typescript
// app/utils/form-definition.server.ts

import type { FormDefinition, FormField, VisibilityCondition } from "./types";
import { detectCircularDependencies, collectDependentFields } from "./condition-evaluator";

interface ValidationError {
  path: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export function validateFormDefinition(definition: FormDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Basic structure validation
  if (!definition.pages || definition.pages.length === 0) {
    errors.push({
      path: "pages",
      code: "EMPTY_FORM",
      message: "Form must have at least one page",
      severity: "error",
    });
    return errors; // Cannot proceed without pages
  }

  // 2. Validate settings
  if (!definition.settings?.submitButtonText) {
    errors.push({
      path: "settings.submitButtonText",
      code: "MISSING_SUBMIT_TEXT",
      message: "Submit button text is required",
      severity: "warning",
    });
  }

  // 3. Collect all field keys for reference validation
  const allFields: FormField[] = [];
  const fieldKeySet = new Set<string>();
  const fieldIdSet = new Set<string>();
  const pageIdSet = new Set<string>();
  const sectionIdSet = new Set<string>();

  for (const page of definition.pages) {
    // Duplicate page ID check
    if (pageIdSet.has(page.id)) {
      errors.push({
        path: `pages[${page.id}]`,
        code: "DUPLICATE_PAGE_ID",
        message: `Duplicate page ID: ${page.id}`,
        severity: "error",
      });
    }
    pageIdSet.add(page.id);

    if (page.sections.length === 0) {
      errors.push({
        path: `pages[${page.id}]`,
        code: "EMPTY_PAGE",
        message: `Page "${page.title}" has no sections`,
        severity: "warning",
      });
    }

    for (const section of page.sections) {
      // Duplicate section ID check
      if (sectionIdSet.has(section.id)) {
        errors.push({
          path: `pages[${page.id}].sections[${section.id}]`,
          code: "DUPLICATE_SECTION_ID",
          message: `Duplicate section ID: ${section.id}`,
          severity: "error",
        });
      }
      sectionIdSet.add(section.id);

      for (const field of section.fields) {
        // Duplicate field ID check
        if (fieldIdSet.has(field.id)) {
          errors.push({
            path: `pages[${page.id}].sections[${section.id}].fields[${field.id}]`,
            code: "DUPLICATE_FIELD_ID",
            message: `Duplicate field ID: ${field.id}`,
            severity: "error",
          });
        }
        fieldIdSet.add(field.id);

        // Duplicate field key check
        if (fieldKeySet.has(field.key)) {
          errors.push({
            path: `pages[${page.id}].sections[${section.id}].fields[${field.id}]`,
            code: "DUPLICATE_FIELD_KEY",
            message: `Duplicate field key: ${field.key}. Each field key must be unique.`,
            severity: "error",
          });
        }
        fieldKeySet.add(field.key);

        allFields.push(field);

        // Validate colSpan
        if (field.layout.colSpan < 1 || field.layout.colSpan > 12) {
          errors.push({
            path: `fields[${field.id}].layout.colSpan`,
            code: "INVALID_COL_SPAN",
            message: `Column span must be between 1 and 12, got ${field.layout.colSpan}`,
            severity: "error",
          });
        }
      }
    }
  }

  // 4. Validate visibility condition references (no orphaned field refs)
  const allConditions = collectAllConditions(definition);
  for (const { condition, path } of allConditions) {
    const referencedFields = collectDependentFields(condition);
    for (const refKey of referencedFields) {
      // Allow "participantType" as a special system field
      if (refKey === "participantType") continue;
      if (!fieldKeySet.has(refKey)) {
        errors.push({
          path,
          code: "ORPHANED_FIELD_REFERENCE",
          message: `Visibility condition references field "${refKey}" which does not exist in the form`,
          severity: "error",
        });
      }
    }
  }

  // 5. Check for circular visibility conditions
  const cycle = detectCircularDependencies(allFields);
  if (cycle) {
    errors.push({
      path: "visibility",
      code: "CIRCULAR_VISIBILITY",
      message: `Circular visibility dependency detected: ${cycle.join(" -> ")}`,
      severity: "error",
    });
  }

  // 6. Check for unreachable pages (all pages conditional with no unconditional path)
  const unconditionalPages = definition.pages.filter((p) => !p.visibleIf);
  if (unconditionalPages.length === 0) {
    errors.push({
      path: "pages",
      code: "ALL_PAGES_CONDITIONAL",
      message: "All pages have visibility conditions. At least one page must be always visible.",
      severity: "error",
    });
  }

  // 7. Validate page ordering is sequential
  const orders = definition.pages.map((p) => p.order);
  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    errors.push({
      path: "pages",
      code: "DUPLICATE_PAGE_ORDER",
      message: "Multiple pages have the same order number",
      severity: "error",
    });
  }

  return errors;
}

function collectAllConditions(
  definition: FormDefinition,
): { condition: VisibilityCondition; path: string }[] {
  const result: { condition: VisibilityCondition; path: string }[] = [];

  for (const page of definition.pages) {
    if (page.visibleIf) {
      result.push({ condition: page.visibleIf, path: `pages[${page.id}].visibleIf` });
    }
    for (const section of page.sections) {
      if (section.visibleIf) {
        result.push({
          condition: section.visibleIf,
          path: `pages[${page.id}].sections[${section.id}].visibleIf`,
        });
      }
      for (const field of section.fields) {
        if (field.visibleIf) {
          result.push({
            condition: field.visibleIf,
            path: `pages[${page.id}].sections[${section.id}].fields[${field.id}].visibleIf`,
          });
        }
      }
    }
  }

  return result;
}
```

### 5.9 Form Analytics Engine

The analytics engine tracks user interactions with published forms to identify optimization opportunities.

```typescript
// app/utils/form-analytics.server.ts

import { prisma } from "~/utils/db.server";
import type { FormAnalyticsEventType } from "@prisma/client";

interface TrackEventInput {
  formTemplateId: string;
  sessionId: string;
  eventType: FormAnalyticsEventType;
  pageId?: string;
  fieldId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackFormEvent(input: TrackEventInput): Promise<void> {
  await prisma.formAnalytics.create({
    data: {
      formTemplateId: input.formTemplateId,
      sessionId: input.sessionId,
      eventType: input.eventType,
      pageId: input.pageId,
      fieldId: input.fieldId,
      metadata: input.metadata as any,
    },
  });
}

export async function getFormAnalyticsSummary(
  formTemplateId: string,
  startDate?: Date,
  endDate?: Date,
) {
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  const where = {
    formTemplateId,
    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
  };

  const [totalStarts, totalCompletions, allEvents] = await Promise.all([
    prisma.formAnalytics.count({
      where: { ...where, eventType: "FORM_STARTED" },
    }),
    prisma.formAnalytics.count({
      where: { ...where, eventType: "FORM_SUBMITTED" },
    }),
    prisma.formAnalytics.findMany({
      where,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Calculate page-level drop-off
  const pageViews = new Map<string, number>();
  const pageCompletions = new Map<string, number>();

  for (const event of allEvents) {
    if (event.eventType === "PAGE_VIEWED" && event.pageId) {
      pageViews.set(event.pageId, (pageViews.get(event.pageId) ?? 0) + 1);
    }
    if (event.eventType === "PAGE_COMPLETED" && event.pageId) {
      pageCompletions.set(event.pageId, (pageCompletions.get(event.pageId) ?? 0) + 1);
    }
  }

  // Calculate field-level metrics
  const fieldFocusCount = new Map<string, number>();
  const fieldCompletionCount = new Map<string, number>();
  const fieldErrorCount = new Map<string, number>();
  const fieldTimeSpent = new Map<string, number[]>();

  for (const event of allEvents) {
    if (!event.fieldId) continue;

    switch (event.eventType) {
      case "FIELD_FOCUSED":
        fieldFocusCount.set(event.fieldId, (fieldFocusCount.get(event.fieldId) ?? 0) + 1);
        break;
      case "FIELD_COMPLETED":
        fieldCompletionCount.set(event.fieldId, (fieldCompletionCount.get(event.fieldId) ?? 0) + 1);
        if ((event.metadata as any)?.timeSpentMs) {
          const times = fieldTimeSpent.get(event.fieldId) ?? [];
          times.push((event.metadata as any).timeSpentMs);
          fieldTimeSpent.set(event.fieldId, times);
        }
        break;
      case "FIELD_ERROR":
        fieldErrorCount.set(event.fieldId, (fieldErrorCount.get(event.fieldId) ?? 0) + 1);
        break;
    }
  }

  // Calculate average time to complete
  const sessionTimes = new Map<string, { start?: Date; end?: Date }>();
  for (const event of allEvents) {
    if (!sessionTimes.has(event.sessionId)) {
      sessionTimes.set(event.sessionId, {});
    }
    const session = sessionTimes.get(event.sessionId)!;
    if (event.eventType === "FORM_STARTED") session.start = event.createdAt;
    if (event.eventType === "FORM_SUBMITTED") session.end = event.createdAt;
  }

  const completionTimes: number[] = [];
  for (const session of sessionTimes.values()) {
    if (session.start && session.end) {
      completionTimes.push((session.end.getTime() - session.start.getTime()) / 1000);
    }
  }

  const averageTimeToComplete =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

  return {
    totalStarts,
    totalCompletions,
    completionRate: totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0,
    averageTimeToComplete,
    pageDropOff: Array.from(pageViews.entries()).map(([pageId, views]) => ({
      pageId,
      views,
      completions: pageCompletions.get(pageId) ?? 0,
      dropOffRate: views > 0 ? ((views - (pageCompletions.get(pageId) ?? 0)) / views) * 100 : 0,
    })),
    fieldCompletion: Array.from(fieldFocusCount.entries()).map(([fieldId, focused]) => {
      const completed = fieldCompletionCount.get(fieldId) ?? 0;
      const errors = fieldErrorCount.get(fieldId) ?? 0;
      const times = fieldTimeSpent.get(fieldId) ?? [];
      return {
        fieldId,
        completionRate: focused > 0 ? (completed / focused) * 100 : 0,
        errorRate: focused > 0 ? (errors / focused) * 100 : 0,
        averageTimeSpent:
          times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0,
      };
    }),
  };
}
```

### 5.10 Prefill Engine

The prefill engine populates form fields from various data sources before the participant begins filling out the form.

```typescript
// app/utils/form-prefill.ts

import type { FormDefinition } from "./types";

type PrefillSource = "url" | "api" | "previousSubmission" | "delegation";

interface PrefillConfig {
  sources: PrefillSource[];
  urlParams?: URLSearchParams;
  apiData?: Record<string, unknown>;
  previousSubmission?: Record<string, unknown>;
  delegationDefaults?: Record<string, unknown>;
}

/**
 * Resolve prefill values from multiple sources.
 * Priority order (highest to lowest):
 * 1. URL parameters (explicit user intent)
 * 2. Delegation defaults (set by head of delegation)
 * 3. Previous submission (returning user)
 * 4. API data (external system integration)
 */
export function resolvePrefillData(
  definition: FormDefinition,
  config: PrefillConfig,
): Record<string, unknown> {
  const prefillData: Record<string, unknown> = {};

  // Collect all field keys from the form
  const fieldKeys = new Set<string>();
  for (const page of definition.pages) {
    for (const section of page.sections) {
      for (const field of section.fields) {
        fieldKeys.add(field.key);
      }
    }
  }

  // Layer 4: API data (lowest priority)
  if (config.sources.includes("api") && config.apiData) {
    for (const [key, value] of Object.entries(config.apiData)) {
      if (fieldKeys.has(key)) {
        prefillData[key] = value;
      }
    }
  }

  // Layer 3: Previous submission
  if (config.sources.includes("previousSubmission") && config.previousSubmission) {
    for (const [key, value] of Object.entries(config.previousSubmission)) {
      if (fieldKeys.has(key) && value !== null && value !== undefined) {
        prefillData[key] = value;
      }
    }
  }

  // Layer 2: Delegation defaults
  if (config.sources.includes("delegation") && config.delegationDefaults) {
    for (const [key, value] of Object.entries(config.delegationDefaults)) {
      if (fieldKeys.has(key)) {
        prefillData[key] = value;
      }
    }
  }

  // Layer 1: URL parameters (highest priority)
  if (config.sources.includes("url") && config.urlParams) {
    for (const key of fieldKeys) {
      const urlValue = config.urlParams.get(key);
      if (urlValue !== null) {
        prefillData[key] = urlValue;
      }
    }
  }

  return prefillData;
}

/**
 * Generate prefill URL with form data encoded as query parameters.
 * Used for sharing pre-filled form links.
 */
export function generatePrefillUrl(
  baseUrl: string,
  formTemplateId: string,
  data: Record<string, unknown>,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("formId", formTemplateId);

  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
```

### 5.11 Responsive Rendering Engine

Forms designed with the 12-column grid automatically adapt to different screen sizes. The responsive engine collapses columns according to configurable breakpoints.

```typescript
// app/utils/responsive-renderer.ts

interface ResponsiveBreakpoints {
  desktop: number; // >= 1024px: full 12-column grid
  tablet: number; // >= 640px: max 6-column grid
  phone: number; // < 640px: single column (12/12)
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  desktop: 1024,
  tablet: 640,
  phone: 0,
};

/**
 * Calculate the effective colSpan for a field at a given viewport width.
 * On smaller screens, columns are expanded to fill available space.
 */
export function getResponsiveColSpan(
  originalColSpan: number,
  viewportWidth: number,
  breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS,
): number {
  if (viewportWidth >= breakpoints.desktop) {
    // Desktop: use original colSpan as-is
    return originalColSpan;
  }

  if (viewportWidth >= breakpoints.tablet) {
    // Tablet: collapse to max 6-column effective grid
    // Anything <= 6 stays the same; > 6 becomes 12 (full width)
    if (originalColSpan <= 6) {
      return Math.max(6, originalColSpan * 2);
    }
    return 12;
  }

  // Phone: everything is full width
  return 12;
}

/**
 * React hook that tracks viewport width and provides responsive colSpan values.
 */
export function useResponsiveGrid(breakpoints?: ResponsiveBreakpoints) {
  const bp = breakpoints ?? DEFAULT_BREAKPOINTS;
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : bp.desktop,
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getColSpan = useCallback(
    (original: number) => getResponsiveColSpan(original, viewportWidth, bp),
    [viewportWidth, bp],
  );

  const currentBreakpoint: "desktop" | "tablet" | "phone" =
    viewportWidth >= bp.desktop ? "desktop" : viewportWidth >= bp.tablet ? "tablet" : "phone";

  return { viewportWidth, getColSpan, currentBreakpoint };
}
```

**Responsive Grid Rendering:**

```tsx
// app/components/form-designer/responsive-field-grid.tsx

import { useResponsiveGrid } from "~/utils/responsive-renderer";
import type { FormField, FormSection } from "~/utils/types";

interface ResponsiveFieldGridProps {
  section: FormSection;
  renderField: (field: FormField, colSpan: number) => React.ReactNode;
  previewMode?: "desktop" | "tablet" | "phone";
}

export function ResponsiveFieldGrid({
  section,
  renderField,
  previewMode,
}: ResponsiveFieldGridProps) {
  const { getColSpan, currentBreakpoint } = useResponsiveGrid();

  // In preview mode, override the breakpoint for responsive preview
  const effectiveBreakpoint = previewMode ?? currentBreakpoint;

  const overrideWidth =
    effectiveBreakpoint === "desktop" ? 1280 : effectiveBreakpoint === "tablet" ? 768 : 375;

  return (
    <div className="grid grid-cols-12 gap-3">
      {section.fields
        .sort((a, b) => a.layout.order - b.layout.order)
        .map((field) => {
          const colSpan =
            previewMode !== undefined
              ? getResponsiveColSpan(field.layout.colSpan, overrideWidth)
              : getColSpan(field.layout.colSpan);

          return (
            <div key={field.id} className={`col-span-${colSpan}`}>
              {renderField(field, colSpan)}
            </div>
          );
        })}
    </div>
  );
}
```

### 5.12 Embeddable Form Widget

Forms can be embedded on external websites using an iframe-based widget with a postMessage API for cross-origin communication.

```typescript
// app/utils/form-embed.ts

/**
 * Generate embeddable HTML snippet for a published form.
 */
export function generateEmbedCode(
  formTemplateId: string,
  options: {
    baseUrl: string;
    width?: string;
    height?: string;
    theme?: "light" | "dark" | "auto";
  },
): string {
  const { baseUrl, width = "100%", height = "800px", theme = "light" } = options;

  const embedUrl = `${baseUrl}/embed/form/${formTemplateId}?theme=${theme}`;

  return `<!-- Accreditation Platform Form Widget -->
<div id="ap-form-${formTemplateId}" style="width:${width};max-width:100%;">
  <iframe
    src="${embedUrl}"
    width="100%"
    height="${height}"
    frameborder="0"
    style="border:none;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.12);"
    allow="camera;microphone"
    loading="lazy"
    title="Registration Form"
  ></iframe>
</div>
<script>
  (function() {
    window.addEventListener('message', function(event) {
      if (event.origin !== '${baseUrl}') return;
      var data = event.data;
      if (data.type === 'ap-form-resize') {
        var iframe = document.querySelector('#ap-form-${formTemplateId} iframe');
        if (iframe) iframe.style.height = data.height + 'px';
      }
      if (data.type === 'ap-form-submitted') {
        // Dispatch custom event for host page to handle
        var customEvent = new CustomEvent('apFormSubmitted', { detail: data.payload });
        document.dispatchEvent(customEvent);
      }
    });
  })();
</script>`;
}
```

**Embed Route Handler:**

```tsx
// app/routes/embed.form.$id.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
import { FormRenderer } from "~/components/form-designer/form-renderer";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;
  const url = new URL(request.url);
  const theme = url.searchParams.get("theme") ?? "light";

  const template = await prisma.formTemplate.findFirst({
    where: { id, isActive: true, publishedAt: { not: null } },
  });

  if (!template) {
    throw new Response("Form not found", { status: 404 });
  }

  return json({
    definition: template.definition as FormDefinition,
    formTemplateId: template.id,
    theme,
  });
}

export default function EmbedForm() {
  const { definition, formTemplateId, theme } = useLoaderData<typeof loader>();

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <FormRenderer
        definition={definition}
        formTemplateId={formTemplateId}
        mode="embedded"
        onSubmit={(data) => {
          // Post message to parent window
          window.parent.postMessage(
            { type: "ap-form-submitted", payload: { formTemplateId, data } },
            "*",
          );
        }}
        onResize={(height) => {
          window.parent.postMessage({ type: "ap-form-resize", height }, "*");
        }}
      />
    </div>
  );
}
```

---

## 6. User Interface

### 6.1 Three-Panel Interface

```
┌──────────────┬──────────────────────────────────┬──────────────┐
│              │                                    │              │
│   FIELD      │        DESIGN CANVAS               │  PROPERTIES  │
│   PALETTE    │                                    │  PANEL       │
│              │  ┌──────────────────────────────┐  │              │
│  ─ Input     │  │  Page 1: Personal Info       │  │  Selected:   │
│  ─ Textarea  │  │  ┌────────────┬─────────────┐│  │  "First Name"│
│  ─ Number    │  │  │ Title [▾]  │ First Name  ││  │              │
│  ─ Email     │  │  ├────────────┼─────────────┤│  │  Label: ___  │
│  ─ Phone     │  │  │ Family Name│ Gender (*)  ││  │  Width: [half]│
│  ─ Date      │  │  └────────────┴─────────────┘│  │  Required: Y │
│  ─ Dropdown  │  │                                │  │  Placeholder:│
│  ─ Radio     │  │  ┌────────────────────────────┐│  │    _________ │
│  ─ Checkbox  │  │  │ Passport Number            ││  │  Validation: │
│  ─ Toggle    │  │  │ Passport Expiry            ││  │    Min: ___  │
│  ─ File      │  │  └────────────────────────────┘│  │    Max: ___  │
│  ─ Image     │  │                                │  │              │
│  ─ Heading   │  │  [+ Add Section]               │  │  Show if:    │
│  ─ Divider   │  │                                │  │  [field v]   │
│              │  │  Page 2: Travel Info  >         │  │  [equals v]  │
│              │  │                                │  │  [value  ___] │
│              │  └──────────────────────────────┘  │              │
│              │                                    │              │
│              │   [Editor]  [Split]  [Preview]     │              │
└──────────────┴──────────────────────────────────┴──────────────┘
```

**Left panel (Field Palette):** Draggable field types organized by category.

**Center panel (Design Canvas):** Form layout with pages, sections, and fields in a 12-column grid. Fields are draggable within and between sections.

**Right panel (Properties):** Edit selected field's label, width, validation, conditional visibility rules.

### 6.2 12-Column Grid System

```
colSpan: 12 (full width)
┌────────────────────────────────────────────────────────┐
│  Full Name                                              │
└────────────────────────────────────────────────────────┘

colSpan: 6 + 6 (two halves)
┌──────────────────────────┬─────────────────────────────┐
│  First Name              │  Family Name                │
└──────────────────────────┴─────────────────────────────┘

colSpan: 3 + 4 + 5 (custom split)
┌──────────┬──────────────┬──────────────────────────────┐
│  Title   │  First Name  │  Family Name                 │
└──────────┴──────────────┴──────────────────────────────┘
```

Admin controls width via Properties panel:

```
Width:  [Quarter 1/4]  [Third 1/3]  [Half 1/2]  [Full --]
```

**Detailed Column Spans:**

```
┌─ 1 ─┬─ 2 ─┬─ 3 ─┬─ 4 ─┬─ 5 ─┬─ 6 ─┬─ 7 ─┬─ 8 ─┬─ 9 ─┬ 10 ─┬ 11 ─┬ 12 ─┐
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Quick Presets:
  Quarter (3 cols):  ████░░░░░░░░
  Third   (4 cols):  ████████░░░░░░░░
  Half    (6 cols):  ████████████████████████░░░░░░░░░░░░░░░░░░░░░░
  Full    (12 cols): ████████████████████████████████████████████████

Section with columns=3 maps to grid-cols-12:
  Column 1 → colSpan: 4
  Column 2 → colSpan: 4
  Column 3 → colSpan: 4

Section with columns=2 maps to grid-cols-12:
  Column 1 → colSpan: 6
  Column 2 → colSpan: 6
```

### 6.3 Enhanced Toolbar

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [< Back to Forms]                                                      │
│                                                                         │
│  ┌──────┐ ┌─────────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌────────┐       │
│  │ Save │ │ Publish │ │ Preview │ │ Undo │ │ Redo │ │Settings│ [Share]│
│  │  ^S  │ │   ^P    │ │         │ │  ^Z  │ │  ^Y  │ │   ^,   │       │
│  └──────┘ └─────────┘ └─────────┘ └──────┘ └──────┘ └────────┘       │
│                                                                         │
│  Status: Draft | Autosaved 2s ago | v1.2 | 3 pages, 15 fields         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Toolbar Component:**

```tsx
// app/components/form-designer/enhanced-toolbar.tsx

import { Save, Upload, Eye, Undo2, Redo2, Settings, Share2, MoreVertical } from "lucide-react";
import { AutosaveIndicator } from "./autosave-indicator";

interface EnhancedToolbarProps {
  formName: string;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSettings: () => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPublished: boolean;
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  lastSavedAt: Date;
  version: number;
  pageCount: number;
  fieldCount: number;
}

export function EnhancedToolbar(props: EnhancedToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-2">
      {/* Left: Form name and back button */}
      <div className="flex items-center gap-3">
        <a href="/admin/forms" className="text-gray-400 hover:text-gray-600">
          &larr;
        </a>
        <h1 className="text-lg font-semibold text-gray-800">{props.formName}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            props.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {props.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      {/* Center: Action buttons */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          shortcut="Ctrl+Z"
          onClick={props.onUndo}
          disabled={!props.canUndo}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          shortcut="Ctrl+Y"
          onClick={props.onRedo}
          disabled={!props.canRedo}
        />
        <ToolbarDivider />
        <ToolbarButton icon={Save} label="Save" shortcut="Ctrl+S" onClick={props.onSave} />
        <ToolbarButton icon={Eye} label="Preview" onClick={props.onPreview} />
        <ToolbarDivider />
        <ToolbarButton icon={Upload} label="Publish" onClick={props.onPublish} variant="primary" />
      </div>

      {/* Right: Status and settings */}
      <div className="flex items-center gap-3">
        <AutosaveIndicator status={props.saveStatus} lastSavedAt={props.lastSavedAt} />
        <span className="text-xs text-gray-400">
          v{props.version} | {props.pageCount} pages, {props.fieldCount} fields
        </span>
        <ToolbarButton icon={Settings} label="Settings" onClick={props.onSettings} />
        <ToolbarButton icon={Share2} label="Share" onClick={props.onShare} />
      </div>
    </div>
  );
}
```

### 6.4 Field Search and Filter

The field palette includes a search input that filters available field types by name, category, or description.

```
┌─────────────────────┐
│  Search fields...   │
│  [________________] │
│                     │
│  v INPUT FIELDS     │
│    ─ Text Input     │
│    ─ Textarea       │
│    ─ Number         │
│    ─ Email          │
│    ─ Phone          │
│                     │
│  v SELECTION        │
│    ─ Dropdown       │
│    ─ Multi-Select   │
│    ─ Radio Group    │
│    ─ Checkbox       │
│    ─ Toggle Switch  │
│                     │
│  v DATE & TIME      │
│    ─ Date Picker    │
│    ─ Date & Time    │
│                     │
│  v FILE UPLOAD      │
│    ─ File Upload    │
│    ─ Image Upload   │
│                     │
│  v LAYOUT           │
│    ─ Heading        │
│    ─ Divider        │
│    ─ Rich Text      │
│                     │
│  ─────────────────  │
│  SECTION TEMPLATES  │
│    ─ Personal Info  │
│    ─ Passport &     │
│      Identity       │
│    ─ Travel &       │
│      Logistics      │
│    [Browse All...]  │
└─────────────────────┘
```

```tsx
// app/components/form-designer/field-palette.tsx

import { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Search } from "lucide-react";

interface FieldTypeConfig {
  type: string;
  label: string;
  icon: string;
  category: string;
  description: string;
}

const FIELD_TYPES: FieldTypeConfig[] = [
  {
    type: "text",
    label: "Text Input",
    icon: "Aa",
    category: "Input Fields",
    description: "Single line text input",
  },
  {
    type: "textarea",
    label: "Textarea",
    icon: "=",
    category: "Input Fields",
    description: "Multi-line text area",
  },
  {
    type: "number",
    label: "Number",
    icon: "#",
    category: "Input Fields",
    description: "Numeric input with validation",
  },
  {
    type: "email",
    label: "Email",
    icon: "@",
    category: "Input Fields",
    description: "Email address with format validation",
  },
  {
    type: "phone",
    label: "Phone",
    icon: "Ph",
    category: "Input Fields",
    description: "Phone number with country code",
  },
  {
    type: "select",
    label: "Dropdown",
    icon: "v",
    category: "Selection",
    description: "Single selection dropdown",
  },
  {
    type: "multiselect",
    label: "Multi-Select",
    icon: "vv",
    category: "Selection",
    description: "Multiple selection dropdown",
  },
  {
    type: "radio",
    label: "Radio Group",
    icon: "O",
    category: "Selection",
    description: "Single choice from options",
  },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: "X",
    category: "Selection",
    description: "Multiple choice checkboxes",
  },
  {
    type: "switch",
    label: "Toggle Switch",
    icon: "IO",
    category: "Selection",
    description: "On/off toggle switch",
  },
  {
    type: "date",
    label: "Date Picker",
    icon: "Cal",
    category: "Date & Time",
    description: "Date selection with calendar",
  },
  {
    type: "datetime",
    label: "Date & Time",
    icon: "DT",
    category: "Date & Time",
    description: "Date and time selection",
  },
  {
    type: "file",
    label: "File Upload",
    icon: "F",
    category: "File Upload",
    description: "Single or multiple file upload",
  },
  {
    type: "image",
    label: "Image Upload",
    icon: "Img",
    category: "File Upload",
    description: "Image upload with preview",
  },
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    category: "Layout",
    description: "Section heading text",
  },
  {
    type: "divider",
    label: "Divider",
    icon: "--",
    category: "Layout",
    description: "Horizontal divider line",
  },
  {
    type: "richtext",
    label: "Rich Text",
    icon: "RT",
    category: "Layout",
    description: "Formatted help text block",
  },
];

export function FieldPalette() {
  const [search, setSearch] = useState("");

  const filteredTypes = useMemo(() => {
    if (!search.trim()) return FIELD_TYPES;
    const query = search.toLowerCase();
    return FIELD_TYPES.filter(
      (ft) =>
        ft.label.toLowerCase().includes(query) ||
        ft.type.toLowerCase().includes(query) ||
        ft.category.toLowerCase().includes(query) ||
        ft.description.toLowerCase().includes(query),
    );
  }, [search]);

  const categories = useMemo(() => {
    const cats = new Map<string, FieldTypeConfig[]>();
    for (const ft of filteredTypes) {
      if (!cats.has(ft.category)) cats.set(ft.category, []);
      cats.get(ft.category)!.push(ft);
    }
    return cats;
  }, [filteredTypes]);

  return (
    <div className="flex h-full flex-col border-r bg-gray-50 w-56">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-white pl-8 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Field type categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Array.from(categories.entries()).map(([category, types]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {category}
            </h3>
            <div className="space-y-1">
              {types.map((ft) => (
                <DraggableFieldType key={ft.type} fieldType={ft} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableFieldType({ fieldType }: { fieldType: FieldTypeConfig }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${fieldType.type}`,
    data: { type: "new-field", fieldType: fieldType.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm cursor-grab
        hover:bg-white hover:shadow-sm transition-all
        ${isDragging ? "opacity-50" : ""}`}
      title={fieldType.description}
    >
      <span className="text-xs font-mono bg-gray-200 rounded px-1 py-0.5 text-gray-500 w-6 text-center">
        {fieldType.icon}
      </span>
      <span className="text-gray-700">{fieldType.label}</span>
    </div>
  );
}
```

### 6.5 Section Template Library Browser

```
┌───────────────────────────────────────────────────────────┐
│  Section Template Library                          [x]    │
│                                                           │
│  Search: [________________________]                       │
│                                                           │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  Personal Info      │  │  Passport & Identity │       │
│  │                     │  │                      │       │
│  │  ┌───────┬────────┐ │  │  ┌────────┬────────┐│       │
│  │  │ Title │ First  │ │  │  │ Number │ Expiry ││       │
│  │  ├───────┼────────┤ │  │  ├────────┼────────┤│       │
│  │  │ Last  │ Gender │ │  │  │ Country│ Photo  ││       │
│  │  └───────┴────────┘ │  │  └────────┴────────┘│       │
│  │                     │  │                      │       │
│  │  4 fields, 2 cols   │  │  4 fields, 2 cols    │       │
│  │  [Insert]           │  │  [Insert]            │       │
│  └─────────────────────┘  └──────────────────────┘       │
│                                                           │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  Travel & Logistics │  │  Organization Info   │       │
│  │                     │  │                      │       │
│  │  ┌────────────────┐ │  │  ┌───────┬────────┐ │       │
│  │  │ Visa Required  │ │  │  │ Org   │ Role   │ │       │
│  │  │ Arrival Date   │ │  │  ├───────┼────────┤ │       │
│  │  │ Flight Info    │ │  │  │ Dept  │ Title  │ │       │
│  │  └────────────────┘ │  │  └───────┴────────┘ │       │
│  │                     │  │                      │       │
│  │  3 fields, 1 col    │  │  4 fields, 2 cols    │       │
│  │  [Insert]           │  │  [Insert]            │       │
│  └─────────────────────┘  └──────────────────────┘       │
│                                                           │
│  [Create New Template]                                    │
└───────────────────────────────────────────────────────────┘
```

### 6.6 Responsive Preview Toggle

```
┌─────────────────────────────────────────────┐
│           Preview Mode                       │
│                                             │
│   [ Desktop ]  [ Tablet ]  [ Phone ]        │
│   [ 1280px  ]  [ 768px  ]  [ 375px ]       │
│                                             │
│  ┌─── Desktop (1280px) ────────────────┐    │
│  │                                      │    │
│  │  ┌──────┬──────────┬───────────────┐ │    │
│  │  │Title │First Name│Family Name    │ │    │
│  │  └──────┴──────────┴───────────────┘ │    │
│  │  ┌─────────────┬──────────────────┐  │    │
│  │  │Passport No. │Passport Expiry   │  │    │
│  │  └─────────────┴──────────────────┘  │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                             │
│  ┌─── Tablet (768px) ──────────┐            │
│  │                              │            │
│  │  ┌────────────┬────────────┐ │            │
│  │  │ Title      │ First Name │ │            │
│  │  ├────────────┼────────────┤ │            │
│  │  │Family Name │ Gender     │ │            │
│  │  └────────────┴────────────┘ │            │
│  │                              │            │
│  └──────────────────────────────┘            │
│                                             │
│  ┌─── Phone (375px) ──┐                    │
│  │                      │                    │
│  │  ┌────────────────┐  │                    │
│  │  │ Title          │  │                    │
│  │  ├────────────────┤  │                    │
│  │  │ First Name     │  │                    │
│  │  ├────────────────┤  │                    │
│  │  │ Family Name    │  │                    │
│  │  └────────────────┘  │                    │
│  │                      │                    │
│  └──────────────────────┘                    │
└─────────────────────────────────────────────┘
```

### 6.7 Form Settings Panel

```
┌──────────────────────────────────────────────────────┐
│  Form Settings                                  [x]  │
│                                                      │
│  ── General ──────────────────────────────────────── │
│                                                      │
│  Display Mode:                                       │
│  ( ) Single Page    (x) Wizard     ( ) Accordion     │
│                                                      │
│  Show Progress Bar: [x]                              │
│                                                      │
│  Submit Button Text:                                 │
│  [Submit Application_______]                         │
│                                                      │
│  ── Completion ───────────────────────────────────── │
│                                                      │
│  Success Message:                                    │
│  [Your application has been submitted successfully.] │
│  [You will receive a confirmation email shortly.__]  │
│                                                      │
│  Redirect URL (optional):                            │
│  [https://example.org/thank-you________________]     │
│                                                      │
│  ── Features ────────────────────────────────────── │
│                                                      │
│  Enable Analytics: [x]                               │
│  Enable Prefill:   [x]                               │
│  A/B Test Variant: [________________]                │
│                                                      │
│  ── Advanced ────────────────────────────────────── │
│                                                      │
│  Custom CSS Class: [________________]                │
│  Form Width:       [Maximum ▾]                       │
│                                                      │
│  [Save Settings]                                     │
└──────────────────────────────────────────────────────┘
```

### 6.8 Form Sharing / Embedding Dialog

```
┌──────────────────────────────────────────────────────┐
│  Share & Embed Form                             [x]  │
│                                                      │
│  ── Direct Link ─────────────────────────────────── │
│                                                      │
│  https://app.example.org/register/evt_abc123         │
│  [Copy Link]                                         │
│                                                      │
│  ── Embed Code ──────────────────────────────────── │
│                                                      │
│  Theme: [Light ▾]  Width: [100% __]  Height: [800px] │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ <div id="ap-form-xyz">                        │  │
│  │   <iframe                                     │  │
│  │     src="https://app.example.org/embed/..."   │  │
│  │     width="100%"                              │  │
│  │     height="800px"                            │  │
│  │     frameborder="0"                           │  │
│  │   ></iframe>                                  │  │
│  │ </div>                                        │  │
│  │ <script>...</script>                          │  │
│  └────────────────────────────────────────────────┘  │
│  [Copy Embed Code]                                   │
│                                                      │
│  ── QR Code ─────────────────────────────────────── │
│                                                      │
│  ┌──────────────┐                                    │
│  │  [QR Code]   │  Scan to open the registration    │
│  │  [Image]     │  form on a mobile device.         │
│  └──────────────┘                                    │
│  [Download QR Code]                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 6.9 Keyboard Shortcuts

| Shortcut                 | Action                                   | Context            |
| ------------------------ | ---------------------------------------- | ------------------ |
| `Ctrl+Z` / `Cmd+Z`       | Undo last action                         | Global             |
| `Ctrl+Y` / `Cmd+Shift+Z` | Redo last undone action                  | Global             |
| `Ctrl+S` / `Cmd+S`       | Save form (manual save)                  | Global             |
| `Ctrl+P` / `Cmd+P`       | Toggle preview mode                      | Global             |
| `Delete` / `Backspace`   | Remove selected field or section         | When item selected |
| `Ctrl+D` / `Cmd+D`       | Duplicate selected field or section      | When item selected |
| `Ctrl+,` / `Cmd+,`       | Open form settings                       | Global             |
| `Escape`                 | Deselect current item / close dialog     | Global             |
| `Tab`                    | Select next field in current section     | Canvas focused     |
| `Shift+Tab`              | Select previous field in current section | Canvas focused     |
| `Arrow Up`               | Move selected field up in order          | When item selected |
| `Arrow Down`             | Move selected field down in order        | When item selected |
| `Ctrl+Enter`             | Publish form (with confirmation)         | Global             |

**Keyboard Shortcut Hook:**

```typescript
// app/components/form-designer/use-keyboard-shortcuts.ts

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSettings: () => void;
  onDeselect: () => void;
  onPublish: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Skip if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Ctrl+S and Ctrl+Z even in inputs
        if (!(isCtrlOrCmd && (e.key === "s" || e.key === "z" || e.key === "y"))) {
          return;
        }
      }

      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handlers.onUndo();
      } else if ((isCtrlOrCmd && e.key === "y") || (isCtrlOrCmd && e.shiftKey && e.key === "z")) {
        e.preventDefault();
        handlers.onRedo();
      } else if (isCtrlOrCmd && e.key === "s") {
        e.preventDefault();
        handlers.onSave();
      } else if (isCtrlOrCmd && e.key === "p") {
        e.preventDefault();
        handlers.onPreview();
      } else if (isCtrlOrCmd && e.key === "d") {
        e.preventDefault();
        handlers.onDuplicate();
      } else if (isCtrlOrCmd && e.key === ",") {
        e.preventDefault();
        handlers.onSettings();
      } else if (isCtrlOrCmd && e.key === "Enter") {
        e.preventDefault();
        handlers.onPublish();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        // Only when not in an input
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          handlers.onDelete();
        }
      } else if (e.key === "Escape") {
        handlers.onDeselect();
      }
    },
    [handlers],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

### 6.10 Accessibility Audit Panel

The accessibility audit panel runs WCAG checks against the designed form and reports violations with fix suggestions.

```
┌──────────────────────────────────────────────────────┐
│  Accessibility Audit                            [x]  │
│                                                      │
│  Last audit: just now                                │
│                                                      │
│  ┌── ERRORS (2) ──────────────────────────────────┐  │
│  │                                                 │  │
│  │  [!] Field "phone" has no associated label      │  │
│  │      Page: Personal Info > Contact Section      │  │
│  │      Fix: Add a label property to this field    │  │
│  │      [Select Field]                             │  │
│  │                                                 │  │
│  │  [!] Color contrast ratio 2.1:1 on field       │  │
│  │      description text (minimum 4.5:1 required)  │  │
│  │      Fix: Use darker text color for             │  │
│  │      descriptions                               │  │
│  │      [View Details]                             │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  ┌── WARNINGS (3) ────────────────────────────────┐  │
│  │                                                 │  │
│  │  [*] Form has no skip-to-content link           │  │
│  │  [*] Tab order may not match visual order in    │  │
│  │      "Passport Details" section                 │  │
│  │  [*] File upload field has no accepted formats  │  │
│  │      description for screen readers             │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  ┌── PASSES (12) ─────────────────────────────────┐  │
│  │  [v] All form fields have unique IDs            │  │
│  │  [v] Required fields are marked with aria-req.  │  │
│  │  [v] Form has a submit button with clear label  │  │
│  │  [v] Error messages are associated with fields  │  │
│  │  ... +8 more                                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  Score: 85/100                                       │
│  [Run Audit Again]  [Export Report]                  │
└──────────────────────────────────────────────────────┘
```

```typescript
// app/utils/form-accessibility-audit.ts

interface AuditResult {
  id: string;
  severity: "error" | "warning" | "pass";
  rule: string;
  message: string;
  element?: { pageId: string; sectionId?: string; fieldId?: string };
  fixSuggestion?: string;
}

export function auditFormAccessibility(definition: FormDefinition): AuditResult[] {
  const results: AuditResult[] = [];

  for (const page of definition.pages) {
    for (const section of page.sections) {
      for (const field of section.fields) {
        // Check: field has a label
        if (!field.label || field.label.trim() === "") {
          results.push({
            id: `label-${field.id}`,
            severity: "error",
            rule: "label-required",
            message: `Field "${field.key}" has no label`,
            element: { pageId: page.id, sectionId: section.id, fieldId: field.id },
            fixSuggestion: "Add a descriptive label to this field",
          });
        } else {
          results.push({
            id: `label-${field.id}`,
            severity: "pass",
            rule: "label-required",
            message: `Field "${field.label}" has a label`,
          });
        }

        // Check: file upload has accepted formats description
        if (field.type === "file" && !field.properties?.accept) {
          results.push({
            id: `file-accept-${field.id}`,
            severity: "warning",
            rule: "file-format-description",
            message: `File upload "${field.label}" has no accepted formats description`,
            element: { pageId: page.id, sectionId: section.id, fieldId: field.id },
            fixSuggestion: "Add accepted file formats to help screen reader users",
          });
        }

        // Check: required fields should have aria-required
        if (field.validation?.required) {
          results.push({
            id: `required-${field.id}`,
            severity: "pass",
            rule: "required-indicator",
            message: `Required field "${field.label}" will have aria-required`,
          });
        }

        // Check: placeholder is not used as sole label replacement
        if (field.placeholder && (!field.label || field.label.trim() === "")) {
          results.push({
            id: `placeholder-label-${field.id}`,
            severity: "error",
            rule: "no-placeholder-as-label",
            message: `Field uses placeholder "${field.placeholder}" as sole identifier`,
            element: { pageId: page.id, sectionId: section.id, fieldId: field.id },
            fixSuggestion: "Add a visible label; placeholders disappear on input",
          });
        }
      }
    }
  }

  // Check: form has a submit button
  if (definition.settings?.submitButtonText) {
    results.push({
      id: "submit-button",
      severity: "pass",
      rule: "submit-button-label",
      message: "Form has a submit button with clear label",
    });
  } else {
    results.push({
      id: "submit-button",
      severity: "error",
      rule: "submit-button-label",
      message: "Form has no submit button text configured",
      fixSuggestion: "Set a clear submit button text in form settings",
    });
  }

  // Check: all field IDs are unique
  const fieldIds = new Set<string>();
  let hasDuplicateIds = false;
  for (const page of definition.pages) {
    for (const section of page.sections) {
      for (const field of section.fields) {
        if (fieldIds.has(field.id)) {
          hasDuplicateIds = true;
        }
        fieldIds.add(field.id);
      }
    }
  }

  results.push({
    id: "unique-ids",
    severity: hasDuplicateIds ? "error" : "pass",
    rule: "unique-field-ids",
    message: hasDuplicateIds
      ? "Some form fields have duplicate IDs"
      : "All form fields have unique IDs",
  });

  return results;
}
```

### 6.11 View Modes

**Editor Mode:** Full design interface with drag handles, grid lines, property panel.

**Split Mode:** Side-by-side editor and live preview.

**Preview Mode:** Full-width preview showing exactly what the participant sees. Uses the **same renderer component** as the actual registration form -- WYSIWYG guaranteed.

```
┌─ Editor Mode ───────────────────────────────────────────┐
│                                                          │
│  ┌──────────┬──────────────────────┬──────────────────┐ │
│  │  Palette │  Canvas (editable)   │  Properties      │ │
│  │          │  - drag handles      │  - field config   │ │
│  │          │  - grid lines        │  - validation     │ │
│  │          │  - drop zones        │  - visibility     │ │
│  └──────────┴──────────────────────┴──────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌─ Split Mode ────────────────────────────────────────────┐
│                                                          │
│  ┌─────────────────────────┬───────────────────────────┐ │
│  │  Canvas (editable)      │  Live Preview             │ │
│  │  - compact layout       │  - actual form renderer   │ │
│  │  - drag handles         │  - real-time updates      │ │
│  │  - no palette           │  - responsive             │ │
│  └─────────────────────────┴───────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌─ Preview Mode ──────────────────────────────────────────┐
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │              Full-Width Form Preview                  ││
│  │                                                      ││
│  │  Uses FormRenderer component (same as registration)  ││
│  │  WYSIWYG guaranteed                                  ││
│  │                                                      ││
│  │  [Responsive: Desktop | Tablet | Phone]              ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 6.12 Page Management (Wizard Steps)

Each page becomes one step in the registration wizard. Tab bar at the top of the canvas shows all pages.

```
┌──────────────────────────────────────────────────────────┐
│  Pages:                                                   │
│  ┌───────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ 1. Personal   │ │ 2. Travel    │ │ 3. Security *  │  │
│  │    Info       │ │    Info      │ │    Details     │  │
│  │  [active]     │ │              │ │  [conditional]  │  │
│  └───────────────┘ └──────────────┘ └────────────────┘  │
│                                              [+ Add Page] │
│                                                          │
│  * = Has visibility condition                            │
│  Drag tabs to reorder pages                              │
└──────────────────────────────────────────────────────────┘
```

**Page-level visibility** enables participant-type-specific pages:

- Minister sees: Personal Info -> Organization -> Travel -> Documents (4 pages)
- Armed Security sees: Personal Info -> Organization -> Travel -> **Security Details** -> Documents (5 pages)
- Press sees: Personal Info -> Organization -> Travel -> **Press Credentials** -> Documents (5 pages)

All from the **same form template**, with the wizard automatically adjusting.

---

## 7. Integration Points

### 7.1 Dynamic Schema Engine (Module 02)

The form designer depends on Module 02 for field type definitions. The designer references fields by their `key` property, which maps to keys defined in the Dynamic Schema Engine.

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   Module 02: Schema      │        │   Module 03: Designer    │
│                          │        │                          │
│   FieldDefinition {      │        │   FormField {            │
│     key: "passport_no"   │<──ref──│     key: "passport_no"   │
│     type: "text"         │        │     label: "Passport No."│
│     required: true       │        │     layout: { colSpan: 6 }│
│     pattern: "..."       │        │     validation: { ... }  │
│   }                      │        │   }                      │
│                          │        │                          │
│   buildZodSchema() ──────┼───────>│   Used by FormRenderer   │
│   for runtime validation │        │   for preview and live   │
└──────────────────────────┘        └──────────────────────────┘
```

**Integration Contract:**

```typescript
// Used by the form designer to load available fields for a tenant/event
async function getAvailableFields(tenantId: string, eventId?: string): Promise<FieldDefinition[]>;

// Used by the form renderer to build Zod validation schema from form definition
function buildZodSchemaFromForm(
  definition: FormDefinition,
  fieldDefinitions: FieldDefinition[],
  formData: Record<string, unknown>, // For conditional required evaluation
): z.ZodObject<any>;
```

### 7.2 Workflow Engine (Module 04)

The Workflow Engine can assign different forms to different workflow steps. For example, an approval workflow might have:

1. Step 1: Applicant fills out registration form (Form A)
2. Step 2: Reviewer sees a review form with approval/rejection fields (Form B)
3. Step 3: Security clearance form (Form C -- only for certain participant types)

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   Module 04: Workflow    │        │   Module 03: Designer    │
│                          │        │                          │
│   WorkflowStep {         │        │   FormTemplate {         │
│     name: "Application"  │        │     id: "form_abc"       │
│     formTemplateId:  ────┼───ref──│     name: "Registration" │
│       "form_abc"         │        │     definition: { ... }  │
│     assigneeRole: ...    │        │   }                      │
│   }                      │        │                          │
│                          │        │                          │
│   WorkflowStep {         │        │   FormTemplate {         │
│     name: "Review"       │        │     id: "form_def"       │
│     formTemplateId:  ────┼───ref──│     name: "Review Form"  │
│       "form_def"         │        │     definition: { ... }  │
│   }                      │        │   }                      │
└──────────────────────────┘        └──────────────────────────┘
```

**Integration Contract:**

```typescript
// Workflow Engine queries available form templates for step configuration
async function getFormTemplatesForWorkflow(
  tenantId: string,
  eventId: string,
): Promise<FormTemplateSummary[]>;

// Workflow Engine retrieves published form definition for step rendering
async function getPublishedFormDefinition(formTemplateId: string): Promise<FormDefinition | null>;
```

### 7.3 Registration & Accreditation (Module 09)

The registration module is the primary consumer of form definitions. When a participant begins registration:

1. The registration route loads the published form template for the event + participant type
2. The `FormRenderer` component renders the form using the JSON definition
3. The Dynamic Schema Engine builds a Zod validation schema on-the-fly
4. Submitted data is validated and stored in the participant record's `customData` JSON field

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   Module 09: Registration│        │   Module 03: Designer    │
│                          │        │                          │
│   Registration Route     │        │   FormRenderer           │
│   1. Load FormTemplate   │───────>│   - Reads JSON definition│
│   2. Load FieldDefinitions│       │   - Renders form UI      │
│   3. Render FormRenderer │        │   - Evaluates conditions │
│   4. Submit → validate   │        │   - Handles page nav     │
│   5. Store customData    │        │                          │
│                          │        │   FormAnalytics          │
│   RegistrationSubmission │        │   - Tracks field focus   │
│   { customData: {...} }  │        │   - Tracks page views    │
│                          │        │   - Tracks completion    │
└──────────────────────────┘        └──────────────────────────┘
```

**Integration Contract:**

```typescript
// Registration module loads the active form for rendering
async function getActiveFormForRegistration(
  tenantId: string,
  eventId: string,
  participantTypeId: string,
): Promise<{ definition: FormDefinition; formTemplateId: string } | null>;

// Registration module submits form data for validation
function validateFormSubmission(
  definition: FormDefinition,
  fieldDefinitions: FieldDefinition[],
  submittedData: Record<string, unknown>,
):
  | { success: true; data: Record<string, unknown> }
  | { success: false; errors: Record<string, string[]> };
```

### 7.4 Communication Module (Module 14)

The Communication module can include form links in email templates and notifications.

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   Module 14: Comms       │        │   Module 03: Designer    │
│                          │        │                          │
│   EmailTemplate {        │        │   generatePrefillUrl()   │
│     body: "...           │        │   - Encodes prefill data │
│     Please fill out your │───────>│   - Returns full URL     │
│     registration form:   │        │                          │
│     {{formUrl}}          │        │   FormTemplate {         │
│     ..."                 │        │     publicUrl: computed  │
│   }                      │        │   }                      │
└──────────────────────────┘        └──────────────────────────┘
```

**Integration Contract:**

```typescript
// Communication module generates form URLs for email templates
function getFormUrl(
  formTemplateId: string,
  eventId: string,
  options?: {
    prefillData?: Record<string, unknown>;
    participantId?: string;
  },
): string;
```

### 7.5 Participant Experience (Module 16)

The Participant Experience module renders published forms on the public-facing portal. It uses the same `FormRenderer` component that powers the designer's preview mode, ensuring WYSIWYG accuracy.

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   Module 16: Participant │        │   Module 03: Designer    │
│                          │        │                          │
│   Public Portal          │        │   FormRenderer (shared)  │
│   - Registration page    │───uses──>  - Same component       │
│   - Self-service edit    │        │   - Same rendering logic │
│   - Status tracking      │        │   - Same condition eval  │
│                          │        │   - Same validation      │
│   Responsive Layout      │        │                          │
│   - Desktop / Tablet /   │───uses──> ResponsiveRenderEngine  │
│     Mobile               │        │   - Breakpoint detection │
│                          │        │   - Column collapsing    │
│   Embedded Forms         │        │                          │
│   - iframe widget        │───uses──> EmbedRoute              │
│                          │        │   - postMessage API      │
└──────────────────────────┘        └──────────────────────────┘
```

---

## 8. Configuration

### 8.1 Feature Flags

| Flag                                  | Default | Description                                                    |
| ------------------------------------- | ------- | -------------------------------------------------------------- |
| `form.designer.enabled`               | `true`  | Enable the visual form designer (false = flat field list only) |
| `form.designer.wizardMode`            | `true`  | Enable multi-page wizard mode                                  |
| `form.designer.multiPage`             | `true`  | Allow multiple pages in form definitions                       |
| `form.designer.conditionalVisibility` | `true`  | Enable conditional visibility rules                            |
| `form.designer.analytics`             | `false` | Enable form analytics tracking                                 |
| `form.designer.embedding`             | `false` | Enable embeddable form widget generation                       |
| `form.designer.abTesting`             | `false` | Enable A/B testing for form variants                           |
| `form.designer.sectionTemplates`      | `true`  | Enable reusable section template library                       |
| `form.designer.prefill`               | `true`  | Enable form prefill from URL/API/previous                      |
| `form.designer.accessibilityAudit`    | `true`  | Enable accessibility audit panel                               |
| `form.designer.responsivePreview`     | `true`  | Enable responsive preview toggle                               |
| `form.designer.undoRedo`              | `true`  | Enable undo/redo support                                       |
| `form.designer.autosave`              | `true`  | Enable autosave functionality                                  |
| `form.designer.versionHistory`        | `true`  | Enable version history and diff tracking                       |

### 8.2 Limits and Thresholds

| Setting                       | Default | Description                                |
| ----------------------------- | ------- | ------------------------------------------ |
| `form.maxPagesPerForm`        | `20`    | Maximum number of pages in a single form   |
| `form.maxSectionsPerPage`     | `15`    | Maximum sections per page                  |
| `form.maxFieldsPerSection`    | `50`    | Maximum fields per section                 |
| `form.maxFieldsPerForm`       | `200`   | Maximum total fields across all pages      |
| `form.maxDefinitionSizeKb`    | `512`   | Maximum form definition JSON size in KB    |
| `form.maxVersionsPerForm`     | `50`    | Maximum version history entries per form   |
| `form.maxSectionTemplates`    | `100`   | Maximum section templates per tenant       |
| `form.autosaveIntervalMs`     | `3000`  | Autosave debounce interval in milliseconds |
| `form.undoHistorySize`        | `100`   | Maximum undo/redo history stack size       |
| `form.analyticsRetentionDays` | `90`    | Days to retain form analytics data         |

### 8.3 Runtime Configuration

```typescript
// app/config/form-designer.ts

export interface FormDesignerConfig {
  // Feature toggles
  features: {
    wizardMode: boolean;
    multiPage: boolean;
    conditionalVisibility: boolean;
    analytics: boolean;
    embedding: boolean;
    abTesting: boolean;
    sectionTemplates: boolean;
    prefill: boolean;
    accessibilityAudit: boolean;
    responsivePreview: boolean;
    undoRedo: boolean;
    autosave: boolean;
    versionHistory: boolean;
  };

  // Limits
  limits: {
    maxPagesPerForm: number;
    maxSectionsPerPage: number;
    maxFieldsPerSection: number;
    maxFieldsPerForm: number;
    maxDefinitionSizeKb: number;
    maxVersionsPerForm: number;
    maxSectionTemplates: number;
  };

  // Behavior
  behavior: {
    autosaveIntervalMs: number;
    undoHistorySize: number;
    analyticsRetentionDays: number;
    previewDebounceMs: number;
  };

  // Responsive breakpoints
  breakpoints: {
    desktop: number;
    tablet: number;
    phone: number;
  };
}

export const defaultFormDesignerConfig: FormDesignerConfig = {
  features: {
    wizardMode: true,
    multiPage: true,
    conditionalVisibility: true,
    analytics: false,
    embedding: false,
    abTesting: false,
    sectionTemplates: true,
    prefill: true,
    accessibilityAudit: true,
    responsivePreview: true,
    undoRedo: true,
    autosave: true,
    versionHistory: true,
  },
  limits: {
    maxPagesPerForm: 20,
    maxSectionsPerPage: 15,
    maxFieldsPerSection: 50,
    maxFieldsPerForm: 200,
    maxDefinitionSizeKb: 512,
    maxVersionsPerForm: 50,
    maxSectionTemplates: 100,
  },
  behavior: {
    autosaveIntervalMs: 3000,
    undoHistorySize: 100,
    analyticsRetentionDays: 90,
    previewDebounceMs: 150,
  },
  breakpoints: {
    desktop: 1024,
    tablet: 640,
    phone: 0,
  },
};
```

---

## 9. Testing Strategy

### 9.1 Visual Regression Tests

Visual regression tests ensure the form renderer produces consistent output across code changes.

```typescript
// tests/visual/form-renderer.visual.test.ts

import { test, expect } from "@playwright/test";

test.describe("Form Renderer Visual Regression", () => {
  test("renders single-page form correctly", async ({ page }) => {
    await page.goto("/test/form-preview/single-page");
    await expect(page).toHaveScreenshot("single-page-form.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("renders wizard form with progress bar", async ({ page }) => {
    await page.goto("/test/form-preview/wizard");
    await expect(page).toHaveScreenshot("wizard-form-page1.png");

    // Navigate to page 2
    await page.click('button:has-text("Next")');
    await expect(page).toHaveScreenshot("wizard-form-page2.png");
  });

  test("renders 12-column grid layouts correctly", async ({ page }) => {
    await page.goto("/test/form-preview/grid-layouts");

    // Full width field
    await expect(page.locator('[data-field="full_width"]')).toHaveScreenshot(
      "field-full-width.png",
    );

    // Half width fields side by side
    await expect(page.locator('[data-section="two-halves"]')).toHaveScreenshot(
      "section-two-halves.png",
    );

    // Custom 3+4+5 split
    await expect(page.locator('[data-section="custom-split"]')).toHaveScreenshot(
      "section-custom-split.png",
    );
  });

  test("renders responsive layouts at different breakpoints", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/test/form-preview/responsive");
    await expect(page).toHaveScreenshot("form-desktop.png");

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot("form-tablet.png");

    // Phone
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot("form-phone.png");
  });

  test("renders conditional fields correctly", async ({ page }) => {
    await page.goto("/test/form-preview/conditional");

    // Initially hidden field
    await expect(page.locator('[data-field="flight_number"]')).not.toBeVisible();

    // Toggle condition
    await page.click('[data-field="needs_visa"] input');
    await expect(page.locator('[data-field="flight_number"]')).toBeVisible();
    await expect(page).toHaveScreenshot("form-conditional-visible.png");
  });
});
```

### 9.2 Accessibility Tests

```typescript
// tests/a11y/form-renderer.a11y.test.ts

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Form Renderer Accessibility", () => {
  test("form meets WCAG 2.1 AA standards", async ({ page }) => {
    await page.goto("/test/form-preview/full-example");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("all form fields have accessible labels", async ({ page }) => {
    await page.goto("/test/form-preview/full-example");

    const results = await new AxeBuilder({ page })
      .withRules(["label", "label-title-only"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("form is navigable via keyboard only", async ({ page }) => {
    await page.goto("/test/form-preview/full-example");

    // Tab through all fields
    const fields = await page.locator('input, select, textarea, [role="switch"]').all();

    for (const field of fields) {
      await page.keyboard.press("Tab");
      await expect(field).toBeFocused();
    }
  });

  test("error messages are associated with fields via aria-describedby", async ({ page }) => {
    await page.goto("/test/form-preview/validation-errors");

    // Submit empty required form
    await page.click('button[type="submit"]');

    // Check that error messages are properly associated
    const errorFields = await page.locator('[aria-invalid="true"]').all();
    for (const field of errorFields) {
      const describedBy = await field.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      const errorMessage = page.locator(`#${describedBy}`);
      await expect(errorMessage).toBeVisible();
    }
  });

  test("required fields have aria-required attribute", async ({ page }) => {
    await page.goto("/test/form-preview/full-example");

    const requiredFields = await page.locator('[aria-required="true"]').all();
    expect(requiredFields.length).toBeGreaterThan(0);
  });

  test("progress bar in wizard mode is accessible", async ({ page }) => {
    await page.goto("/test/form-preview/wizard");

    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    await expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    await expect(progressBar).toHaveAttribute("aria-valuenow", /\d+/);
  });
});
```

### 9.3 Drag-and-Drop Interaction Tests

```typescript
// tests/integration/form-designer-dnd.test.ts

import { test, expect } from "@playwright/test";

test.describe("Form Designer Drag and Drop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/forms/test-form/edit");
    await page.waitForSelector('[data-testid="design-canvas"]');
  });

  test("drag field from palette to section", async ({ page }) => {
    const textField = page.locator('[data-testid="palette-text"]');
    const dropZone = page.locator('[data-testid="section-drop-zone-sec_name"]');

    await textField.dragTo(dropZone);

    // Verify field was added
    const fields = page.locator('[data-testid^="sortable-field-"]');
    const initialCount = await fields.count();
    expect(initialCount).toBeGreaterThan(0);
  });

  test("reorder fields within a section", async ({ page }) => {
    const firstField = page.locator('[data-testid="sortable-field-f1"]');
    const secondField = page.locator('[data-testid="sortable-field-f2"]');

    // Get initial positions
    const initialFirstBox = await firstField.boundingBox();
    const initialSecondBox = await secondField.boundingBox();

    // Drag first field below second
    await firstField.dragTo(secondField);

    // Verify order changed
    const newFirstBox = await firstField.boundingBox();
    expect(newFirstBox!.y).toBeGreaterThan(initialFirstBox!.y);
  });

  test("drag field between sections", async ({ page }) => {
    const field = page.locator('[data-testid="sortable-field-f6"]');
    const targetSection = page.locator('[data-testid="section-drop-zone-sec_name"]');

    const sourceSection = page.locator('[data-testid="section-sec_identity"]');
    const sourceBefore = await sourceSection.locator('[data-testid^="sortable-field-"]').count();

    await field.dragTo(targetSection);

    const sourceAfter = await sourceSection.locator('[data-testid^="sortable-field-"]').count();
    expect(sourceAfter).toBe(sourceBefore - 1);
  });

  test("reorder sections via drag handle", async ({ page }) => {
    const firstSection = page.locator(
      '[data-testid="section-sec_name"] [data-testid="drag-handle"]',
    );
    const secondSection = page.locator('[data-testid="section-sec_identity"]');

    await firstSection.dragTo(secondSection);

    // Verify sections were reordered
    const sections = page.locator('[data-testid^="section-sec_"]');
    const sectionIds = await sections.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-testid")),
    );
    expect(sectionIds[0]).toBe("section-sec_identity");
    expect(sectionIds[1]).toBe("section-sec_name");
  });
});
```

### 9.4 Form Validation Engine Tests

```typescript
// tests/unit/form-validation.test.ts

import { describe, test, expect } from "vitest";
import { validateFormDefinition } from "~/utils/form-definition.server";
import type { FormDefinition } from "~/utils/types";

describe("Form Validation Engine", () => {
  const validDefinition: FormDefinition = {
    settings: {
      displayMode: "wizard",
      showProgressBar: true,
      submitButtonText: "Submit",
    },
    pages: [
      {
        id: "page_1",
        title: "Page 1",
        order: 1,
        sections: [
          {
            id: "sec_1",
            title: "Section 1",
            columns: 2,
            collapsible: false,
            order: 1,
            fields: [
              {
                id: "f1",
                key: "first_name",
                type: "text",
                label: "First Name",
                layout: { colSpan: 6, order: 1 },
                validation: { required: true },
              },
            ],
          },
        ],
      },
    ],
  };

  test("accepts valid form definition", () => {
    const errors = validateFormDefinition(validDefinition);
    const errorSeverity = errors.filter((e) => e.severity === "error");
    expect(errorSeverity).toHaveLength(0);
  });

  test("rejects empty pages", () => {
    const def = { ...validDefinition, pages: [] };
    const errors = validateFormDefinition(def);
    expect(errors).toContainEqual(expect.objectContaining({ code: "EMPTY_FORM" }));
  });

  test("detects duplicate field keys", () => {
    const def = structuredClone(validDefinition);
    def.pages[0].sections[0].fields.push({
      id: "f2",
      key: "first_name", // duplicate key
      type: "text",
      label: "First Name Duplicate",
      layout: { colSpan: 6, order: 2 },
      validation: {},
    });

    const errors = validateFormDefinition(def);
    expect(errors).toContainEqual(expect.objectContaining({ code: "DUPLICATE_FIELD_KEY" }));
  });

  test("detects orphaned field references in visibility conditions", () => {
    const def = structuredClone(validDefinition);
    def.pages[0].sections[0].fields[0].visibleIf = {
      type: "simple",
      field: "nonexistent_field",
      operator: "eq",
      value: true,
    };

    const errors = validateFormDefinition(def);
    expect(errors).toContainEqual(expect.objectContaining({ code: "ORPHANED_FIELD_REFERENCE" }));
  });

  test("allows participantType as a special system field in conditions", () => {
    const def = structuredClone(validDefinition);
    def.pages[0].visibleIf = {
      type: "simple",
      field: "participantType",
      operator: "eq",
      value: "Minister",
    };

    const errors = validateFormDefinition(def);
    const orphanErrors = errors.filter((e) => e.code === "ORPHANED_FIELD_REFERENCE");
    expect(orphanErrors).toHaveLength(0);
  });

  test("detects all pages having conditional visibility", () => {
    const def = structuredClone(validDefinition);
    def.pages[0].visibleIf = {
      type: "simple",
      field: "participantType",
      operator: "eq",
      value: "Minister",
    };

    const errors = validateFormDefinition(def);
    expect(errors).toContainEqual(expect.objectContaining({ code: "ALL_PAGES_CONDITIONAL" }));
  });

  test("detects invalid colSpan values", () => {
    const def = structuredClone(validDefinition);
    def.pages[0].sections[0].fields[0].layout.colSpan = 15 as any;

    const errors = validateFormDefinition(def);
    expect(errors).toContainEqual(expect.objectContaining({ code: "INVALID_COL_SPAN" }));
  });

  test("detects duplicate page order numbers", () => {
    const def = structuredClone(validDefinition);
    def.pages.push({
      id: "page_2",
      title: "Page 2",
      order: 1, // same order as page_1
      sections: [
        {
          id: "sec_2",
          title: "Section 2",
          columns: 1,
          collapsible: false,
          order: 1,
          fields: [],
        },
      ],
    });

    const errors = validateFormDefinition(def);
    expect(errors).toContainEqual(expect.objectContaining({ code: "DUPLICATE_PAGE_ORDER" }));
  });
});
```

### 9.5 Undo/Redo Stack Tests

```typescript
// tests/unit/undo-redo.test.ts

import { describe, test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react-hooks";
import { useUndoRedo } from "~/components/form-designer/use-undo-redo";

describe("Undo/Redo System", () => {
  const initialDefinition: FormDefinition = {
    settings: { displayMode: "wizard", showProgressBar: true, submitButtonText: "Submit" },
    pages: [
      {
        id: "p1",
        title: "Page 1",
        order: 1,
        sections: [
          { id: "s1", title: "Section 1", columns: 2, collapsible: false, order: 1, fields: [] },
        ],
      },
    ],
  };

  test("initial state has no undo/redo available", () => {
    const { result } = renderHook(() => useUndoRedo(initialDefinition));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  test("executing a command enables undo", () => {
    const { result } = renderHook(() => useUndoRedo(initialDefinition));

    act(() => {
      result.current.executeCommand(
        new InsertFieldCommand(
          "p1",
          "s1",
          {
            id: "f1",
            key: "test",
            type: "text",
            label: "Test",
            layout: { colSpan: 12, order: 1 },
            validation: {},
          },
          0,
        ),
      );
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.definition.pages[0].sections[0].fields).toHaveLength(1);
  });

  test("undo reverses the last command", () => {
    const { result } = renderHook(() => useUndoRedo(initialDefinition));

    act(() => {
      result.current.executeCommand(
        new InsertFieldCommand(
          "p1",
          "s1",
          {
            id: "f1",
            key: "test",
            type: "text",
            label: "Test",
            layout: { colSpan: 12, order: 1 },
            validation: {},
          },
          0,
        ),
      );
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
    expect(result.current.definition.pages[0].sections[0].fields).toHaveLength(0);
  });

  test("redo re-applies the undone command", () => {
    const { result } = renderHook(() => useUndoRedo(initialDefinition));

    act(() => {
      result.current.executeCommand(
        new InsertFieldCommand(
          "p1",
          "s1",
          {
            id: "f1",
            key: "test",
            type: "text",
            label: "Test",
            layout: { colSpan: 12, order: 1 },
            validation: {},
          },
          0,
        ),
      );
    });

    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });

    expect(result.current.definition.pages[0].sections[0].fields).toHaveLength(1);
    expect(result.current.canRedo).toBe(false);
  });

  test("new command clears redo stack", () => {
    const { result } = renderHook(() => useUndoRedo(initialDefinition));

    act(() => {
      result.current.executeCommand(
        new InsertFieldCommand(
          "p1",
          "s1",
          {
            id: "f1",
            key: "test1",
            type: "text",
            label: "Test 1",
            layout: { colSpan: 12, order: 1 },
            validation: {},
          },
          0,
        ),
      );
    });

    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    // Execute new command - should clear redo
    act(() => {
      result.current.executeCommand(
        new InsertFieldCommand(
          "p1",
          "s1",
          {
            id: "f2",
            key: "test2",
            type: "text",
            label: "Test 2",
            layout: { colSpan: 12, order: 1 },
            validation: {},
          },
          0,
        ),
      );
    });

    expect(result.current.canRedo).toBe(false);
  });
});
```

### 9.6 Responsive Rendering Tests

```typescript
// tests/unit/responsive-renderer.test.ts

import { describe, test, expect } from "vitest";
import { getResponsiveColSpan } from "~/utils/responsive-renderer";

describe("Responsive Rendering", () => {
  test("desktop: preserves original colSpan", () => {
    expect(getResponsiveColSpan(3, 1280)).toBe(3);
    expect(getResponsiveColSpan(6, 1280)).toBe(6);
    expect(getResponsiveColSpan(12, 1280)).toBe(12);
  });

  test("tablet: expands small colSpans", () => {
    expect(getResponsiveColSpan(3, 768)).toBe(6);
    expect(getResponsiveColSpan(4, 768)).toBe(8);
    expect(getResponsiveColSpan(6, 768)).toBe(12);
  });

  test("tablet: full-width for large colSpans", () => {
    expect(getResponsiveColSpan(8, 768)).toBe(12);
    expect(getResponsiveColSpan(12, 768)).toBe(12);
  });

  test("phone: everything is full width", () => {
    expect(getResponsiveColSpan(3, 375)).toBe(12);
    expect(getResponsiveColSpan(6, 375)).toBe(12);
    expect(getResponsiveColSpan(12, 375)).toBe(12);
  });

  test("custom breakpoints are respected", () => {
    const customBp = { desktop: 1200, tablet: 800, phone: 0 };
    // At 900px, this is between tablet and desktop with custom breakpoints
    // Should behave as tablet
    expect(getResponsiveColSpan(6, 900, customBp)).toBe(12);
    // At 1200px, should behave as desktop
    expect(getResponsiveColSpan(6, 1200, customBp)).toBe(6);
  });
});
```

### 9.7 End-to-End Tests

```typescript
// tests/e2e/form-designer.e2e.test.ts

import { test, expect } from "@playwright/test";

test.describe("Form Designer End-to-End", () => {
  test("complete form design workflow", async ({ page }) => {
    // 1. Create a new form
    await page.goto("/admin/forms");
    await page.click('button:has-text("New Form")');
    await page.fill('[name="name"]', "E2E Test Registration Form");
    await page.selectOption('[name="displayMode"]', "wizard");
    await page.click('button:has-text("Create")');

    // 2. Add fields by dragging from palette
    await page.waitForSelector('[data-testid="design-canvas"]');

    // Drag text field to section
    const textField = page.locator('[data-testid="palette-text"]');
    const dropZone = page.locator('[data-testid="section-drop-zone"]').first();
    await textField.dragTo(dropZone);

    // 3. Configure field properties
    await page.click('[data-testid^="sortable-field-"]');
    await page.fill('[name="label"]', "Full Name");
    await page.selectOption('[name="colSpan"]', "12");
    await page.check('[name="required"]');

    // 4. Add a second field
    const emailField = page.locator('[data-testid="palette-email"]');
    await emailField.dragTo(dropZone);
    await page.click('[data-testid^="sortable-field-"]:last-child');
    await page.fill('[name="label"]', "Email Address");

    // 5. Reorder fields
    const firstField = page.locator('[data-testid^="sortable-field-"]').first();
    const secondField = page.locator('[data-testid^="sortable-field-"]').last();
    await secondField.dragTo(firstField);

    // 6. Set conditional visibility
    await page.click('[data-testid="tab-visibility"]');
    await page.selectOption('[name="conditionField"]', "participantType");
    await page.selectOption('[name="conditionOperator"]', "eq");
    await page.fill('[name="conditionValue"]', "Delegate");

    // 7. Preview the form
    await page.click('button:has-text("Preview")');
    await page.waitForSelector('[data-testid="form-preview"]');
    await expect(page.locator('[data-testid="form-preview"]')).toBeVisible();

    // 8. Save the form
    await page.click('button:has-text("Editor")');
    await page.click('button:has-text("Save")');
    await page.waitForSelector("text=Saved");

    // 9. Publish the form
    await page.click('button:has-text("Publish")');
    await page.click('button:has-text("Confirm Publish")');
    await page.waitForSelector("text=Published");

    // 10. Verify the form renders correctly as a participant
    const formUrl = await page.locator('[data-testid="form-url"]').textContent();
    await page.goto(formUrl!);

    // Verify rendered form matches design
    await expect(page.locator('label:has-text("Full Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible();

    // 11. Submit the form
    await page.fill('[name="full_name"]', "Test User");
    await page.fill('[name="email_address"]', "test@example.com");
    await page.click('button:has-text("Submit")');
    await page.waitForSelector("text=submitted successfully");
  });
});
```

---

## 10. Security Considerations

### 10.1 XSS Prevention in Form Definitions

Form definitions contain user-provided strings (labels, descriptions, placeholders, help text) that are rendered in HTML. All such content must be sanitized.

```typescript
// app/utils/form-sanitizer.server.ts

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize all string values in a form definition to prevent XSS.
 * Allows basic formatting tags but strips scripts, event handlers, etc.
 */
export function sanitizeFormDefinition(definition: FormDefinition): FormDefinition {
  const sanitized = structuredClone(definition);

  // Sanitize settings
  if (sanitized.settings.submitButtonText) {
    sanitized.settings.submitButtonText = sanitizeString(sanitized.settings.submitButtonText);
  }
  if (sanitized.settings.successMessage) {
    sanitized.settings.successMessage = sanitizeRichText(sanitized.settings.successMessage);
  }

  // Sanitize pages, sections, and fields
  for (const page of sanitized.pages) {
    page.title = sanitizeString(page.title);
    if (page.description) page.description = sanitizeRichText(page.description);

    for (const section of page.sections) {
      section.title = sanitizeString(section.title);
      if (section.description) section.description = sanitizeRichText(section.description);

      for (const field of section.fields) {
        field.label = sanitizeString(field.label);
        if (field.placeholder) field.placeholder = sanitizeString(field.placeholder);
        if (field.description) field.description = sanitizeRichText(field.description);
        if (field.helpText) field.helpText = sanitizeRichText(field.helpText);
      }
    }
  }

  return sanitized;
}

function sanitizeString(value: string): string {
  // Strip all HTML for plain text fields
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
}

function sanitizeRichText(value: string): string {
  // Allow basic formatting for rich text fields
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br", "p", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}
```

**Sanitization is applied:**

- On form definition save (server-side)
- On form definition import (server-side)
- On form rendering (client-side, defense-in-depth)

### 10.2 CSRF Protection

All form save/publish/delete operations use Remix's built-in CSRF protection via form actions. API endpoints require a valid session token.

```typescript
// Remix action handlers automatically include CSRF protection
// For API routes, validate the session token
export async function requireCsrfToken(request: Request): Promise<void> {
  const token = request.headers.get("X-CSRF-Token");
  const session = await getSession(request.headers.get("Cookie"));
  const expectedToken = session.get("csrfToken");

  if (!token || token !== expectedToken) {
    throw new Response("Invalid CSRF token", { status: 403 });
  }
}
```

### 10.3 Rate Limiting

| Endpoint                                    | Rate Limit              | Window    |
| ------------------------------------------- | ----------------------- | --------- |
| `PUT /api/v1/form-templates/:id` (autosave) | 20 requests             | 1 minute  |
| `POST /api/v1/form-templates/:id/publish`   | 5 requests              | 5 minutes |
| `POST /api/v1/form-templates/:id/clone`     | 10 requests             | 5 minutes |
| `POST /api/v1/form-templates/import`        | 5 requests              | 5 minutes |
| `GET /api/v1/form-templates/:id/analytics`  | 30 requests             | 1 minute  |
| `POST /embed/form/:id` (submissions)        | 10 requests per session | 1 minute  |

```typescript
// app/utils/rate-limit.server.ts

import { RateLimiterMemory } from "rate-limiter-flexible";

const formSaveRateLimiter = new RateLimiterMemory({
  points: 20, // 20 saves
  duration: 60, // per minute
  keyPrefix: "form-save",
});

const formPublishRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 300, // per 5 minutes
  keyPrefix: "form-publish",
});

export async function checkFormSaveRateLimit(
  userId: string,
  formTemplateId: string,
): Promise<void> {
  try {
    await formSaveRateLimiter.consume(`${userId}:${formTemplateId}`);
  } catch {
    throw new Response("Too many save requests. Please wait before saving again.", {
      status: 429,
    });
  }
}
```

### 10.4 Form Definition Size Limits

Form definitions are validated for size before storage to prevent abuse and ensure performance.

```typescript
// Maximum form definition size (512 KB)
const MAX_DEFINITION_SIZE_BYTES = 512 * 1024;

export function validateDefinitionSize(definition: FormDefinition): void {
  const serialized = JSON.stringify(definition);
  const sizeBytes = new TextEncoder().encode(serialized).length;

  if (sizeBytes > MAX_DEFINITION_SIZE_BYTES) {
    throw new Response(
      `Form definition exceeds maximum size of ${MAX_DEFINITION_SIZE_BYTES / 1024} KB. ` +
        `Current size: ${Math.round(sizeBytes / 1024)} KB. ` +
        `Consider splitting into multiple forms or reducing field descriptions.`,
      { status: 413 },
    );
  }
}
```

### 10.5 Content Security Policy

For embedded forms, a strict Content Security Policy is enforced:

```typescript
// app/routes/embed.form.$id.tsx

export function headers() {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'", // Required for Tailwind
      "img-src 'self' data: blob:",
      "frame-ancestors *", // Allow embedding on any domain
      "form-action 'self'",
    ].join("; "),
    "X-Frame-Options": "ALLOWALL",
    "X-Content-Type-Options": "nosniff",
  };
}
```

---

## 11. Performance Requirements

### 11.1 Performance Targets

| Metric                          | Target  | Measurement                               |
| ------------------------------- | ------- | ----------------------------------------- |
| Initial designer load           | < 500ms | Time to interactive from navigation       |
| Form definition save            | < 200ms | Server round-trip for autosave            |
| Form preview render             | < 200ms | Time to first meaningful paint in preview |
| Drag operation latency          | < 16ms  | Frame time during drag (60fps)            |
| Field property update           | < 50ms  | Time from edit to preview update          |
| Undo/redo operation             | < 10ms  | State transformation time                 |
| Form publish                    | < 1s    | Including validation and version creation |
| Analytics query                 | < 2s    | Summary dashboard load                    |
| Large form render (100+ fields) | < 500ms | With virtualization enabled               |

### 11.2 Form Definition Size Management

```typescript
// app/utils/form-definition-optimizer.ts

/**
 * Estimate the rendering cost of a form definition.
 * Used to decide whether to enable virtualization and lazy loading.
 */
export function estimateFormComplexity(definition: FormDefinition): {
  totalFields: number;
  totalPages: number;
  totalSections: number;
  totalConditions: number;
  estimatedRenderTimeMs: number;
  requiresVirtualization: boolean;
  requiresLazyLoading: boolean;
} {
  let totalFields = 0;
  let totalSections = 0;
  let totalConditions = 0;

  for (const page of definition.pages) {
    if (page.visibleIf) totalConditions++;
    for (const section of page.sections) {
      totalSections++;
      if (section.visibleIf) totalConditions++;
      for (const field of section.fields) {
        totalFields++;
        if (field.visibleIf) totalConditions++;
      }
    }
  }

  // Rough estimate: 2ms per field, 5ms per condition evaluation, 10ms base
  const estimatedRenderTimeMs = 10 + totalFields * 2 + totalConditions * 5;

  return {
    totalFields,
    totalPages: definition.pages.length,
    totalSections,
    totalConditions,
    estimatedRenderTimeMs,
    requiresVirtualization: totalFields > 100,
    requiresLazyLoading: definition.pages.length > 10,
  };
}
```

### 11.3 Canvas Rendering Optimization

For large forms, the design canvas uses virtualization to only render visible fields.

```typescript
// Virtualization strategy for the design canvas
interface VirtualizationConfig {
  enabled: boolean;
  threshold: number; // Enable when total fields exceed this
  overscan: number; // Extra items to render above/below viewport
  estimateHeight: number; // Estimated height per field in pixels
}

const CANVAS_VIRTUALIZATION: VirtualizationConfig = {
  enabled: true,
  threshold: 100,
  overscan: 5,
  estimateHeight: 48, // Average field card height
};
```

**Performance Monitoring:**

```typescript
// app/utils/form-performance-monitor.ts

export function measureFormRenderPerformance(formTemplateId: string) {
  const startMark = `form-render-start-${formTemplateId}`;
  const endMark = `form-render-end-${formTemplateId}`;

  performance.mark(startMark);

  return {
    complete() {
      performance.mark(endMark);
      const measure = performance.measure(`form-render-${formTemplateId}`, startMark, endMark);

      if (measure.duration > 200) {
        console.warn(
          `Form ${formTemplateId} render took ${measure.duration.toFixed(1)}ms ` +
            `(target: <200ms). Consider enabling virtualization.`,
        );
      }

      return measure.duration;
    },
  };
}
```

### 11.4 Preview Generation Latency

The preview pipeline uses incremental updates to minimize latency:

```
Change Type          | Update Strategy        | Target Latency
─────────────────────┼────────────────────────┼───────────────
Field label edit     | Selective re-render     | < 50ms
Field layout change  | Section re-render       | < 100ms
Field add/remove     | Section re-render       | < 100ms
Page switch          | Full page render        | < 200ms
Condition change     | Full condition re-eval  | < 100ms
View mode switch     | Full re-render          | < 200ms
```

---

## 12. Open Questions & Decisions

| #   | Question                                       | Status | Options                                                                                                                           | Decision                            |
| --- | ---------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | Maximum form complexity limits                 | Open   | (a) Hard limit at 200 fields, (b) Soft warning at 100 fields with hard limit at 500, (c) No limit but performance warnings        | Leaning toward (b)                  |
| 2   | Collaborative editing                          | Open   | (a) Lock-based (one editor at a time), (b) Operational Transform (Google Docs style), (c) Last-write-wins with conflict detection | (a) for v1.0, research (b) for v2.0 |
| 3   | Form definition migration between environments | Open   | (a) Export/import JSON manually, (b) API-based sync with environment mapping, (c) Git-based version control for definitions       | (a) for v1.0, (b) for v2.0          |
| 4   | Accessibility certification process            | Open   | (a) Built-in audit only (axe-core), (b) Third-party accessibility audit service, (c) Manual VPAT certification per form           | (a) with option for (b) later       |
| 5   | Form analytics data retention                  | Open   | (a) 30 days, (b) 90 days, (c) Configurable per tenant                                                                             | (c) with 90-day default             |
| 6   | A/B testing statistical significance           | Open   | (a) Simple percentage comparison, (b) Chi-squared test, (c) Bayesian approach                                                     | Research needed                     |
| 7   | Section template sharing across tenants        | Open   | (a) Tenant-isolated only, (b) Platform-wide template marketplace, (c) Opt-in cross-tenant sharing                                 | (a) for v1.0                        |
| 8   | Rich text field support in form definitions    | Open   | (a) Plain text only for labels/descriptions, (b) Markdown support, (c) Limited HTML via sanitizer                                 | (c) with strict sanitization        |
| 9   | Form definition backward compatibility         | Open   | (a) Always migrate on load, (b) Versioned definition schemas, (c) Compatibility layer that handles multiple versions              | (b) recommended                     |
| 10  | Embeddable form widget CSP restrictions        | Open   | (a) Allow any domain, (b) Whitelist-based domain control, (c) Token-based access                                                  | (b) with fallback to (a)            |

---

## Appendix

### A. Glossary

| Term                       | Definition                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Form Definition**        | The JSON document stored in `FormTemplate.definition` that describes the complete layout, structure, and behavior of a form. Contains pages, sections, fields, and conditional visibility rules. |
| **Form Template**          | A reusable form design that can be associated with an event and participant type. Contains the form definition plus metadata.                                                                    |
| **Section Template**       | A reusable section configuration (title, columns, fields) that can be inserted into any form. Deep-copied on insertion.                                                                          |
| **Page**                   | A single step in a wizard-style form. Each page contains one or more sections. Pages can have visibility conditions.                                                                             |
| **Section**                | A titled group of fields within a page, rendered as a card with optional collapse behavior. Supports 1-4 column layouts.                                                                         |
| **colSpan**                | The number of grid columns (out of 12) that a field occupies. Controls field width in the layout.                                                                                                |
| **Conditional Visibility** | Rules that show/hide pages, sections, or fields based on the values of other fields. Supports simple and compound (AND/OR) conditions.                                                           |
| **WYSIWYG**                | "What You See Is What You Get." The preview mode uses the exact same renderer as the live registration form.                                                                                     |
| **Command Pattern**        | A design pattern where each action is encapsulated as an object with execute() and undo() methods. Used for the undo/redo system.                                                                |
| **Autosave**               | Automatic saving of draft changes after a configurable period of inactivity (default: 3 seconds).                                                                                                |
| **Form Version**           | An immutable snapshot of a form definition at a point in time. Created on each publish action.                                                                                                   |
| **Prefill**                | Pre-populating form fields with data from URL parameters, previous submissions, delegation defaults, or API sources.                                                                             |
| **Drop-off**               | When a user abandons a form without completing it. Tracked per page for analytics.                                                                                                               |
| **A/B Testing**            | Running multiple variants of a form simultaneously to compare completion rates and identify the more effective design.                                                                           |
| **Design Canvas**          | The center panel of the form designer where pages, sections, and fields are visually arranged.                                                                                                   |
| **Field Palette**          | The left panel of the form designer containing draggable field types organized by category.                                                                                                      |
| **Properties Panel**       | The right panel of the form designer for configuring the selected field's label, validation, layout, and visibility rules.                                                                       |

### B. References

| Reference                                                                         | Description                                                            |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                 | Core data model including Tenant, Event, and ParticipantType entities  |
| [Module 02: Dynamic Schema Engine](./02-DYNAMIC-SCHEMA-ENGINE.md)                 | Field definitions, Zod schema generation, and customData architecture  |
| [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md)                             | Workflow step configuration and form-per-step assignment               |
| [Module 05: Security & Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       | Permission model for `form:read`, `form:write`, `form:publish`         |
| [Module 08: UI/UX & Frontend](./08-UI-UX-AND-FRONTEND.md)                         | Shared UI components (InputField, SelectField, etc.) and design system |
| [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | Registration flow that consumes form templates                         |
| [Module 14: Communication](./14-COMMUNICATION.md)                                 | Email templates with form link placeholders                            |
| [Module 16: Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)               | Public-facing form rendering and participant portal                    |
| [@dnd-kit Documentation](https://dndkit.com)                                      | Drag-and-drop library documentation                                    |
| [Conform Documentation](https://conform.guide)                                    | Progressive form enhancement library                                   |
| [Zod Documentation](https://zod.dev)                                              | TypeScript-first schema validation                                     |
| [WCAG 2.1 AA Guidelines](https://www.w3.org/TR/WCAG21/)                           | Web Content Accessibility Guidelines                                   |
| [axe-core](https://github.com/dequelabs/axe-core)                                 | Accessibility testing engine                                           |

### C. File Structure

```
app/components/form-designer/
  form-designer.tsx            # Three-panel layout + view mode toggle
  field-palette.tsx            # Left: draggable field types by category
  design-canvas.tsx            # Center: DndContext with pages/sections/fields
  section-drop-zone.tsx        # Droppable section with sortable fields
  sortable-field.tsx           # Individual field card on canvas
  sortable-section.tsx         # Sortable section with header and body
  field-properties-panel.tsx   # Right: tabs (General | Validation | Visibility)
  condition-builder.tsx        # Visibility rule editor
  form-renderer.tsx            # Live preview + actual registration form
  field-renderer.tsx           # Renders one field → existing Conform component
  enhanced-toolbar.tsx         # Top toolbar with save/publish/undo/redo
  autosave-indicator.tsx       # Save status indicator component
  page-tab-bar.tsx             # Page navigation tabs in design canvas
  section-template-library.tsx # Section template browser dialog
  form-settings-panel.tsx      # Form settings dialog
  form-sharing-dialog.tsx      # Share/embed dialog with code snippets
  responsive-field-grid.tsx    # Responsive grid rendering component
  accessibility-audit-panel.tsx# WCAG audit panel
  view-mode-toggle.tsx         # Editor/Split/Preview toggle
  status-bar.tsx               # Bottom status bar
  types.ts                     # TypeScript interfaces
  index.ts                     # Barrel export

app/components/form-designer/commands/
  index.ts                     # Barrel export for all commands
  insert-field.ts              # InsertFieldCommand
  remove-field.ts              # RemoveFieldCommand
  move-field.ts                # MoveFieldCommand
  update-field.ts              # UpdateFieldCommand
  insert-section.ts            # InsertSectionCommand
  remove-section.ts            # RemoveSectionCommand

app/components/form-designer/hooks/
  use-undo-redo.ts             # Undo/redo hook with command history
  use-autosave.ts              # Autosave hook with debounce
  use-keyboard-shortcuts.ts    # Keyboard shortcut handler
  use-preview-pipeline.ts      # Real-time preview synchronization

app/routes/
  admin.forms._index.tsx       # Form template list page
  admin.forms.new.tsx          # Create new form template
  admin.forms.$id.edit.tsx     # Form designer page
  api.v1.form-templates.tsx    # CRUD API for form templates
  api.v1.form-templates.$id.tsx           # Single form template API
  api.v1.form-templates.$id.publish.tsx   # Publish endpoint
  api.v1.form-templates.$id.unpublish.tsx # Unpublish endpoint
  api.v1.form-templates.$id.clone.tsx     # Clone endpoint
  api.v1.form-templates.$id.export.tsx    # Export endpoint
  api.v1.form-templates.import.tsx        # Import endpoint
  api.v1.form-templates.$id.versions.tsx  # Version management
  api.v1.form-templates.$id.preview.tsx   # Preview generation
  api.v1.form-templates.$id.analytics.tsx # Analytics endpoint
  api.v1.section-templates.tsx            # Section template CRUD
  embed.form.$id.tsx                      # Embeddable form route

app/utils/
  form-schema-builder.server.ts    # Build Zod from FormDefinition JSON
  condition-evaluator.ts           # Evaluate visibleIf/requiredIf
  form-definition.server.ts        # CRUD + validation for FormTemplate records
  form-definition-diff.server.ts   # Version diff computation
  form-sanitizer.server.ts         # XSS prevention via DOMPurify
  form-analytics.server.ts         # Analytics tracking and aggregation
  form-prefill.ts                  # Prefill data resolution engine
  form-embed.ts                    # Embed code generation
  responsive-renderer.ts           # Responsive colSpan calculation
  form-accessibility-audit.ts      # WCAG audit engine
  form-performance-monitor.ts      # Render performance measurement
  form-definition-optimizer.ts     # Complexity estimation

tests/
  visual/
    form-renderer.visual.test.ts   # Visual regression tests
  a11y/
    form-renderer.a11y.test.ts     # Accessibility tests
  integration/
    form-designer-dnd.test.ts      # Drag-and-drop interaction tests
  unit/
    form-validation.test.ts        # Form validation engine tests
    undo-redo.test.ts              # Undo/redo stack tests
    responsive-renderer.test.ts    # Responsive rendering tests
    condition-evaluator.test.ts    # Condition evaluation tests
    form-definition-diff.test.ts   # Version diff tests
  e2e/
    form-designer.e2e.test.ts      # End-to-end workflow tests
```

---

_End of Module 03: Visual Form Designer_
