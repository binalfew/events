# Module 02: Dynamic Schema Engine

> **Module:** 02 - Dynamic Schema Engine
> **Version:** 1.0
> **Last Updated:** February 10, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)
> **Required By:** [Module 03: Form Designer](./03-FORM-DESIGNER.md), [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md), [Module 09: Registration](./09-REGISTRATION.md)
> **Integrates With:** [Module 07: API Gateway](./07-API-GATEWAY.md), [Module 08: UI/UX Framework](./08-UI-UX-FRAMEWORK.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Hybrid Approach](#12-hybrid-approach)
   - 1.3 [Scope](#13-scope)
   - 1.4 [Key Personas](#14-key-personas)
2. [Architecture](#2-architecture)
   - 2.1 [Five-Layer Architecture](#21-five-layer-architecture)
   - 2.2 [Field Definition Lifecycle](#22-field-definition-lifecycle)
   - 2.3 [Schema Compilation Pipeline](#23-schema-compilation-pipeline)
   - 2.4 [Caching Strategy](#24-caching-strategy)
   - 2.5 [Architecture Decision Records](#25-architecture-decision-records)
3. [Data Model](#3-data-model)
   - 3.1 [FieldDefinition](#31-fielddefinition)
   - 3.2 [FieldDataType Enum](#32-fielddatatype-enum)
   - 3.3 [CustomObjectDef](#33-customobjectdef)
   - 3.4 [ObjectScope Enum](#34-objectscope-enum)
   - 3.5 [CustomObjectRecord](#35-customobjectrecord)
   - 3.6 [FieldDefVersion](#36-fielddefversion)
   - 3.7 [Entity-Relationship Diagram](#37-entity-relationship-diagram)
   - 3.8 [Index Catalog](#38-index-catalog)
   - 3.9 [Migration Safety Considerations](#39-migration-safety-considerations)
4. [API Specification](#4-api-specification)
   - 4.1 [Field Endpoints](#41-field-endpoints)
   - 4.2 [Custom Object Endpoints](#42-custom-object-endpoints)
   - 4.3 [Custom Object Record Endpoints](#43-custom-object-record-endpoints)
   - 4.4 [Field Reordering Endpoint](#44-field-reordering-endpoint)
   - 4.5 [Field Migration Endpoint](#45-field-migration-endpoint)
   - 4.6 [Bulk Operations](#46-bulk-operations)
   - 4.7 [Field Export/Import](#47-field-exportimport)
5. [Business Logic](#5-business-logic)
   - 5.1 [Dynamic Zod Schema Builder](#51-dynamic-zod-schema-builder)
   - 5.2 [Dynamic Form Renderer](#52-dynamic-form-renderer)
   - 5.3 [Query Layer for Custom Fields](#53-query-layer-for-fields)
   - 5.4 [Dynamic Index Management](#54-dynamic-index-management)
   - 5.5 [Formula Field Evaluation Engine](#55-formula-field-evaluation-engine)
   - 5.6 [Field Dependency Graph Resolution](#56-field-dependency-graph-resolution)
   - 5.7 [Computed Field Cache Invalidation](#57-computed-field-cache-invalidation)
   - 5.8 [Bulk Field Operations](#58-bulk-field-operations)
   - 5.9 [Data Migration on Type Change](#59-data-migration-on-type-change)
   - 5.10 [JSONB Query Optimization Patterns](#510-jsonb-query-optimization-patterns)
   - 5.11 [Expression Index Lifecycle](#511-expression-index-lifecycle)
   - 5.12 [Field Validation Pipeline](#512-field-validation-pipeline)
   - 5.13 [Conditional Field Requirements](#513-conditional-field-requirements)
   - 5.14 [Field Inheritance](#514-field-inheritance)
6. [User Interface](#6-user-interface)
   - 6.1 [Field Definition Management](#61-field-definition-management)
   - 6.2 [Custom Object Builder](#62-custom-object-builder)
   - 6.3 [Field Type Selector](#63-field-type-selector)
   - 6.4 [Per-Type Configuration Panels](#64-per-type-configuration-panels)
   - 6.5 [Field Reorder Drag-and-Drop](#65-field-reorder-drag-and-drop)
   - 6.6 [Bulk Import/Export Interface](#66-bulk-importexport-interface)
   - 6.7 [Field Usage Analytics](#67-field-usage-analytics)
7. [Integration Points](#7-integration-points)
   - 7.1 [Form Designer Integration (Module 03)](#71-form-designer-integration-module-03)
   - 7.2 [Workflow Conditional Routing (Module 04)](#72-workflow-conditional-routing-module-04)
   - 7.3 [API Exposure (Module 07)](#73-api-exposure-module-07)
   - 7.4 [Search and Filter in UI (Module 08)](#74-search-and-filter-in-ui-module-08)
   - 7.5 [Registration Forms (Module 09)](#75-registration-forms-module-09)
8. [Configuration](#8-configuration)
   - 8.1 [Feature Flags](#81-feature-flags)
   - 8.2 [Limits and Quotas](#82-limits-and-quotas)
   - 8.3 [JSONB Storage Settings](#83-jsonb-storage-settings)
   - 8.4 [Index Creation Settings](#84-index-creation-settings)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Unit Tests: Zod Schema Builder](#91-unit-tests-zod-schema-builder)
   - 9.2 [Integration Tests: JSONB Queries](#92-integration-tests-jsonb-queries)
   - 9.3 [Performance Tests: Expression Indexes](#93-performance-tests-expression-indexes)
   - 9.4 [Field Migration Tests](#94-field-migration-tests)
10. [Security](#10-security)
    - 10.1 [SQL Injection Prevention](#101-sql-injection-prevention)
    - 10.2 [Field-Level Access Control](#102-field-level-access-control)
    - 10.3 [PII Field Marking and Encryption](#103-pii-field-marking-and-encryption)
    - 10.4 [Tenant Isolation for Field Definitions](#104-tenant-isolation-for-field-definitions)
11. [Performance](#11-performance)
    - 11.1 [JSONB Query Benchmarks](#111-jsonb-query-benchmarks)
    - 11.2 [Expression Index Impact Analysis](#112-expression-index-impact-analysis)
    - 11.3 [Field Definition Caching](#113-field-definition-caching)
    - 11.4 [Query Plan Analysis](#114-query-plan-analysis)
    - 11.5 [Pagination with Field Sorting](#115-pagination-with-field-sorting)
12. [Open Questions](#12-open-questions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)

---

## 1. Overview

### 1.1 Purpose

The Dynamic Schema Engine is the core extensibility mechanism of the accreditation platform. It enables tenant administrators to define custom data fields, custom entity types, and per-event data models -- all without database migrations or developer intervention.

The engine uses a **hybrid approach**: universal fields remain as typed Prisma columns with full type safety and standard indexing, while event-specific and participant-type-specific fields are stored in a `customData` JSONB column and defined through metadata records.

This hybrid strategy balances:

- **Type safety** for universal fields (names, emails, status) that every tenant shares
- **Flexibility** for domain-specific fields (weapon permits, visa requirements, t-shirt sizes) that vary per tenant and event
- **Performance** through selective expression indexes on frequently queried custom fields
- **Governance** through metadata-driven validation, rendering, and access control

### 1.2 Hybrid Approach

The platform distinguishes between two categories of data:

| Fixed Prisma Columns                           | Dynamic JSONB + Metadata                           |
| ---------------------------------------------- | -------------------------------------------------- |
| `id`, `tenantId`, `eventId`                    | All domain-specific participant fields             |
| `firstName`, `familyName`, `email`             | Event metadata beyond name/dates/status            |
| `gender`, `titleId`, `dateOfBirth`             | Type-specific fields (weapon, press card, vehicle) |
| `participantTypeId`, `status`, `stepId`        | Conditional fields (visa, car pass, sessions)      |
| `registrationCode`, `organization`, `jobTitle` | Entirely new entity types (custom objects)         |
| `createdAt`, `updatedAt`, `deletedAt`          | Per-event form configurations                      |
| Workflow system (Step, Approval)               | Layout/section groupings                           |
| RBAC (Role, Permission, UserEventAccess)       | Validation rules beyond basic type checks          |

**Design rationale:** Fields in the left column are queried, indexed, and joined across every tenant. Making them typed columns provides PostgreSQL with statistics for query planning, enables foreign key constraints, and keeps ORM ergonomics clean. Fields in the right column vary per tenant and event, making a JSONB approach far more practical than DDL migrations per deployment.

### 1.3 Scope

This module covers:

- **Custom field definitions** -- metadata records describing name, type, constraints, and rendering hints for each custom field
- **Custom object definitions** -- entirely new entity types defined by tenants (e.g., Vehicle Registry, Equipment Tracking)
- **Custom object records** -- actual data rows stored against custom object definitions
- **Schema compilation** -- runtime generation of Zod validation schemas from field metadata
- **Dynamic rendering** -- mapping field types to UI components
- **Query layer** -- filtering and sorting on JSONB custom fields with expression indexes
- **Index management** -- automatic creation and removal of expression indexes
- **Field versioning** -- tracking changes to field definitions over time

This module does NOT cover:

- Form layout and section grouping (Module 03: Form Designer)
- Approval workflow state machines (Module 04: Workflow Engine)
- Badge template field mapping (Module 10: Badge Generation)
- File storage backends (Module 06: Infrastructure)

### 1.4 Key Personas

| Persona            | Interaction with Dynamic Schema Engine                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Platform Admin** | Manages global field type availability; monitors index health; sets per-tenant field limits                   |
| **Tenant Admin**   | Creates custom fields and custom objects; defines per-event field configurations; manages field ordering      |
| **Event Manager**  | Configures event-specific fields; enables/disables fields per participant type; reviews field usage analytics |
| **Registrant**     | Fills out dynamic form fields during registration; sees only fields relevant to their participant type        |
| **API Consumer**   | Reads and writes custom field data through REST API; filters and sorts on custom fields                       |
| **Developer**      | Extends field type system; builds custom widgets; optimizes JSONB query patterns                              |

---

## 2. Architecture

### 2.1 Five-Layer Architecture

The Dynamic Schema Engine operates through five distinct layers, each with a clear responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│                    METADATA LAYER                           │
│  FieldDefinition records describe fields:                    │
│  "weapon_serial" → TEXT, required, max 20 chars             │
│  "needs_visa" → BOOLEAN, optional                           │
├─────────────────────────────────────────────────────────────┤
│                    STORAGE LAYER                            │
│  Participant.customData JSONB:                              │
│  {"weapon_serial": "AK-2024-001", "needs_visa": true}     │
├─────────────────────────────────────────────────────────────┤
│                    VALIDATION LAYER                          │
│  Zod schema auto-built from FieldDefinition metadata         │
├─────────────────────────────────────────────────────────────┤
│                    RENDERING LAYER                           │
│  Dynamic renderer maps dataType → Conform component         │
├─────────────────────────────────────────────────────────────┤
│                    QUERY LAYER                               │
│  Fixed: Prisma queries | Custom: JSONB + expression indexes │
└─────────────────────────────────────────────────────────────┘
```

**Layer responsibilities:**

| Layer          | Responsibility                                                    | Key Artifacts                                       |
| -------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| **Metadata**   | Stores field definitions, types, constraints, and rendering hints | `FieldDefinition`, `CustomObjectDef` Prisma models  |
| **Storage**    | Persists actual field values in JSONB columns on core models      | `Participant.customData`, `CustomObjectRecord.data` |
| **Validation** | Compiles metadata into runtime Zod schemas for input validation   | `buildCustomDataSchema()` function                  |
| **Rendering**  | Maps `dataType` values to React/Conform components                | `FieldRenderer` component                           |
| **Query**      | Enables filtering, sorting, and searching on JSONB fields         | `filterWithCustomFields()`, expression indexes      |

**Data flow for a registration submission:**

```
┌──────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│ Registrant│───▶│ Rendering    │───▶│ Validation     │───▶│ Storage      │
│ fills form│    │ Layer renders│    │ Layer validates │    │ Layer persists│
│           │    │ dynamic fields│   │ against Zod    │    │ to JSONB      │
└──────────┘    └──────────────┘    └────────────────┘    └──────────────┘
                       ▲                     ▲                     │
                       │                     │                     ▼
                ┌──────────────┐    ┌────────────────┐    ┌──────────────┐
                │ Metadata     │    │ Metadata       │    │ Query Layer  │
                │ Layer provides│   │ Layer provides │    │ indexes and  │
                │ field defs    │   │ constraints    │    │ filters data │
                └──────────────┘    └────────────────┘    └──────────────┘
```

### 2.2 Field Definition Lifecycle

A custom field moves through the following states during its lifetime:

```
                    ┌──────────┐
                    │  DRAFT   │  Admin creates field definition
                    └────┬─────┘
                         │ activate()
                         ▼
                    ┌──────────┐
                    │  ACTIVE  │  Field appears in forms, accepts data
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ MODIFIED │ │DISABLED│ │DEPRECATED│
        │ (versioned)│ │(hidden)│ │(read-only)│
        └────┬─────┘ └────┬───┘ └────┬─────┘
             │             │          │
             ▼             │          ▼
        ┌──────────┐       │    ┌──────────┐
        │  ACTIVE  │       │    │ ARCHIVED │  Field definition retained
        │(new ver) │       │    │          │  for historical data
        └──────────┘       │    └──────────┘
                           │
                           ▼
                    ┌──────────┐
                    │ DELETED  │  Only if no data references field
                    └──────────┘
```

**Lifecycle implementation:**

```typescript
// app/services/schema-engine/field-lifecycle.server.ts

import { prisma } from "~/utils/db.server";
import type { FieldDefinition } from "@prisma/client";

export type FieldStatus = "DRAFT" | "ACTIVE" | "DISABLED" | "DEPRECATED" | "ARCHIVED";

export async function activateField(fieldId: string, tenantId: string): Promise<FieldDefinition> {
  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId, tenantId },
  });

  if (!field) {
    throw new Error(`Field ${fieldId} not found for tenant ${tenantId}`);
  }

  // Create version snapshot before activation
  await createFieldVersion(field, "ACTIVATED");

  return prisma.fieldDefinition.update({
    where: { id: fieldId },
    data: { updatedAt: new Date() },
  });
}

export async function deprecateField(
  fieldId: string,
  tenantId: string,
  replacedByFieldId?: string,
): Promise<FieldDefinition> {
  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId, tenantId },
  });

  if (!field) {
    throw new Error(`Field ${fieldId} not found for tenant ${tenantId}`);
  }

  await createFieldVersion(field, "DEPRECATED");

  return prisma.fieldDefinition.update({
    where: { id: fieldId },
    data: {
      config: {
        ...(field.config as Record<string, unknown>),
        deprecated: true,
        deprecatedAt: new Date().toISOString(),
        replacedByFieldId,
      },
      updatedAt: new Date(),
    },
  });
}

export async function canDeleteField(
  fieldId: string,
  tenantId: string,
): Promise<{ canDelete: boolean; reason?: string; recordCount?: number }> {
  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId, tenantId },
  });

  if (!field) {
    return { canDelete: false, reason: "Field not found" };
  }

  // Check if any records reference this field
  if (field.targetModel === "Participant") {
    const count = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND "customData" ? ${field.name}
        AND "deletedAt" IS NULL
    `;
    const recordCount = Number(count[0].count);
    if (recordCount > 0) {
      return {
        canDelete: false,
        reason: `Field has ${recordCount} records with data`,
        recordCount,
      };
    }
  }

  return { canDelete: true };
}

async function createFieldVersion(field: FieldDefinition, action: string): Promise<void> {
  await prisma.fieldDefVersion.create({
    data: {
      fieldDefId: field.id,
      tenantId: field.tenantId,
      version: await getNextVersion(field.id),
      snapshot: JSON.parse(JSON.stringify(field)),
      action,
      changedBy: "system", // replaced by actual user in middleware
    },
  });
}

async function getNextVersion(fieldDefId: string): Promise<number> {
  const latest = await prisma.fieldDefVersion.findFirst({
    where: { fieldDefId },
    orderBy: { version: "desc" },
  });
  return (latest?.version ?? 0) + 1;
}
```

### 2.3 Schema Compilation Pipeline

The schema compilation pipeline transforms metadata into runtime validation:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ 1. FETCH         │     │ 2. RESOLVE       │     │ 3. COMPILE      │
│ Load field defs  │────▶│ Resolve deps,    │────▶│ Build Zod       │
│ from DB/cache    │     │ inheritance,     │     │ schema object   │
│                  │     │ conditionals     │     │                  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ 6. VALIDATE      │     │ 5. HYDRATE       │     │ 4. CACHE        │
│ Parse input data │◀────│ Attach UI hints  │◀────│ Store compiled  │
│ against schema   │     │ and defaults     │     │ schema in LRU   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Pipeline implementation:**

```typescript
// app/services/schema-engine/compilation-pipeline.server.ts

import { z } from "zod";
import { LRUCache } from "lru-cache";
import { prisma } from "~/utils/db.server";
import { buildCustomDataSchema } from "~/utils/fields.server";
import type { FieldDef } from "~/types/schema-engine";

interface CompiledSchema {
  zodSchema: z.ZodObject<any>;
  fieldDefs: FieldDef[];
  compiledAt: number;
  version: string;
}

// LRU cache for compiled schemas
const schemaCache = new LRUCache<string, CompiledSchema>({
  max: 500, // max 500 compiled schemas in memory
  ttl: 1000 * 60 * 5, // 5 minute TTL
  updateAgeOnGet: true,
});

export function buildCacheKey(params: {
  tenantId: string;
  targetModel?: string;
  customObjectDefId?: string;
  eventId?: string;
  participantTypeId?: string;
}): string {
  return [
    params.tenantId,
    params.targetModel ?? "_",
    params.customObjectDefId ?? "_",
    params.eventId ?? "_",
    params.participantTypeId ?? "_",
  ].join(":");
}

export async function compileSchema(params: {
  tenantId: string;
  targetModel?: string;
  customObjectDefId?: string;
  eventId?: string;
  participantTypeId?: string;
  skipCache?: boolean;
}): Promise<CompiledSchema> {
  const cacheKey = buildCacheKey(params);

  // Step 4 (check): Return from cache if available
  if (!params.skipCache) {
    const cached = schemaCache.get(cacheKey);
    if (cached) return cached;
  }

  // Step 1: FETCH - Load field definitions
  const fieldDefs = await fetchFieldDefs(params);

  // Step 2: RESOLVE - Resolve inheritance and dependencies
  const resolvedDefs = await resolveFieldDefs(fieldDefs, params);

  // Step 3: COMPILE - Build Zod schema
  const zodSchema = buildCustomDataSchema(resolvedDefs);

  // Step 5: HYDRATE - Attach UI configuration
  const hydratedDefs = resolvedDefs.map((f) => ({
    ...f,
    _computed: {
      widgetType: mapDataTypeToWidget(f.dataType, f.uiConfig),
      cssClass: computeFieldCssClass(f),
    },
  }));

  const compiled: CompiledSchema = {
    zodSchema,
    fieldDefs: hydratedDefs,
    compiledAt: Date.now(),
    version: computeSchemaVersion(hydratedDefs),
  };

  // Step 4 (store): Cache the compiled schema
  schemaCache.set(cacheKey, compiled);

  return compiled;
}

async function fetchFieldDefs(params: {
  tenantId: string;
  targetModel?: string;
  customObjectDefId?: string;
  eventId?: string;
  participantTypeId?: string;
}): Promise<FieldDef[]> {
  const where: any = { tenantId: params.tenantId };

  if (params.targetModel) {
    where.targetModel = params.targetModel;
  }
  if (params.customObjectDefId) {
    where.customObjectDefId = params.customObjectDefId;
  }

  // Fetch tenant-level fields + event-level fields + type-level fields
  const fields = await prisma.fieldDefinition.findMany({
    where: {
      tenantId: params.tenantId,
      targetModel: params.targetModel ?? undefined,
      customObjectDefId: params.customObjectDefId ?? undefined,
      OR: [
        { eventId: null, participantTypeId: null }, // tenant-level
        { eventId: params.eventId, participantTypeId: null }, // event-level
        { eventId: params.eventId, participantTypeId: params.participantTypeId }, // type-level
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  return fields.map((f) => ({
    ...f,
    config: f.config as Record<string, any>,
    uiConfig: f.uiConfig as Record<string, any>,
    validation: f.validation as Array<{ rule: string; value?: any; message: string }>,
  }));
}

async function resolveFieldDefs(
  fieldDefs: FieldDef[],
  params: { tenantId: string; eventId?: string; participantTypeId?: string },
): Promise<FieldDef[]> {
  // Merge inheritance: event-level overrides tenant-level, type-level overrides event-level
  const merged = new Map<string, FieldDef>();

  for (const field of fieldDefs) {
    const existing = merged.get(field.name);
    if (!existing) {
      merged.set(field.name, field);
      continue;
    }

    // More specific scope wins
    const existingSpecificity = getSpecificity(existing);
    const newSpecificity = getSpecificity(field);
    if (newSpecificity > existingSpecificity) {
      merged.set(field.name, {
        ...existing,
        ...field,
        config: { ...(existing.config || {}), ...(field.config || {}) },
        uiConfig: { ...(existing.uiConfig || {}), ...(field.uiConfig || {}) },
      });
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

function getSpecificity(field: FieldDef): number {
  if (field.participantTypeId) return 3; // most specific
  if (field.eventId) return 2;
  return 1; // tenant-level (least specific)
}

function mapDataTypeToWidget(dataType: string, uiConfig: Record<string, any>): string {
  if (uiConfig.widget) return uiConfig.widget;
  const defaults: Record<string, string> = {
    TEXT: "input",
    LONG_TEXT: "textarea",
    NUMBER: "number-input",
    BOOLEAN: "checkbox",
    DATE: "date-picker",
    DATETIME: "datetime-picker",
    ENUM: "select",
    MULTI_ENUM: "checkbox-group",
    EMAIL: "email-input",
    URL: "url-input",
    PHONE: "phone-input",
    FILE: "file-upload",
    IMAGE: "image-upload",
    REFERENCE: "reference-picker",
    FORMULA: "computed-display",
    AUTO_NUMBER: "auto-display",
    COUNTRY: "country-picker",
    USER: "user-picker",
  };
  return defaults[dataType] ?? "input";
}

function computeFieldCssClass(field: FieldDef): string {
  const width = (field.uiConfig as any)?.width ?? "full";
  return width === "half" ? "col-span-6" : "col-span-12";
}

function computeSchemaVersion(fieldDefs: FieldDef[]): string {
  const hash = fieldDefs
    .map((f) => `${f.name}:${f.dataType}:${f.isRequired}:${JSON.stringify(f.config)}`)
    .join("|");
  // Simple hash for cache invalidation
  let h = 0;
  for (let i = 0; i < hash.length; i++) {
    h = (Math.imul(31, h) + hash.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// Cache invalidation on field definition changes
export function invalidateSchemaCache(params: {
  tenantId: string;
  targetModel?: string;
  customObjectDefId?: string;
  eventId?: string;
}): void {
  // Invalidate all cache entries for this tenant+target combination
  for (const key of schemaCache.keys()) {
    if (key.startsWith(`${params.tenantId}:`)) {
      const parts = key.split(":");
      const matchesTarget = !params.targetModel || parts[1] === params.targetModel;
      const matchesObject = !params.customObjectDefId || parts[2] === params.customObjectDefId;
      const matchesEvent = !params.eventId || parts[3] === params.eventId;

      if (matchesTarget && matchesObject && matchesEvent) {
        schemaCache.delete(key);
      }
    }
  }
}
```

### 2.4 Caching Strategy

Field definitions are accessed on every form render and every API validation, making caching critical.

**Cache hierarchy:**

```
┌─────────────────────────────────────────────────────┐
│ L1: In-Memory LRU Cache (per worker)                │
│ - 500 entries, 5-minute TTL                         │
│ - Stores compiled Zod schemas + hydrated field defs │
│ - Cache key: tenantId:model:objectId:eventId:typeId │
│ - Miss rate target: < 5%                            │
├─────────────────────────────────────────────────────┤
│ L2: Redis (shared across workers)                   │
│ - Stores serialized field definitions               │
│ - 15-minute TTL                                     │
│ - Pub/sub for cache invalidation                    │
├─────────────────────────────────────────────────────┤
│ L3: PostgreSQL (source of truth)                    │
│ - FieldDefinition table                              │
│ - Always consistent                                 │
└─────────────────────────────────────────────────────┘
```

**Invalidation strategy:**

```typescript
// app/services/schema-engine/cache-invalidation.server.ts

import { invalidateSchemaCache } from "./compilation-pipeline.server";

export async function onFieldDefChanged(event: {
  type: "CREATED" | "UPDATED" | "DELETED";
  fieldDef: {
    tenantId: string;
    targetModel: string | null;
    customObjectDefId: string | null;
    eventId: string | null;
  };
}): Promise<void> {
  // Invalidate L1 in-memory cache
  invalidateSchemaCache({
    tenantId: event.fieldDef.tenantId,
    targetModel: event.fieldDef.targetModel ?? undefined,
    customObjectDefId: event.fieldDef.customObjectDefId ?? undefined,
    eventId: event.fieldDef.eventId ?? undefined,
  });

  // Invalidate L2 Redis cache (publish to all workers)
  await publishCacheInvalidation({
    channel: "schema-engine:invalidate",
    payload: {
      tenantId: event.fieldDef.tenantId,
      targetModel: event.fieldDef.targetModel,
      customObjectDefId: event.fieldDef.customObjectDefId,
      eventId: event.fieldDef.eventId,
    },
  });
}

async function publishCacheInvalidation(msg: {
  channel: string;
  payload: Record<string, any>;
}): Promise<void> {
  // Redis pub/sub implementation
  // In production, use ioredis or similar
  console.log(`[CacheInvalidation] Publishing to ${msg.channel}`, msg.payload);
}
```

### 2.5 Architecture Decision Records

| ADR     | Decision                                              | Rationale                                                                                                                                                                                |
| ------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-201 | Use JSONB over EAV (Entity-Attribute-Value)           | JSONB provides atomic reads/writes of all custom fields in a single column, avoids N+1 joins, supports GIN indexing. EAV requires joins per field and complicates queries significantly. |
| ADR-202 | Compile Zod schemas at runtime, not build time        | Field definitions change without deployments. Runtime compilation with LRU caching provides correct validation without build/deploy cycles.                                              |
| ADR-203 | Expression indexes over GIN indexes for typed queries | Expression indexes on `(customData->>'field_name')::TYPE` are more efficient for equality and range queries on specific fields than GIN indexes on the entire JSONB column.              |
| ADR-204 | Metadata-driven rendering over code-generated forms   | Component mapping from `dataType` to React components allows adding new field types without modifying form components.                                                                   |
| ADR-205 | Three-level field inheritance (tenant, event, type)   | Allows tenants to set global defaults while events and participant types can override. Reduces repetitive configuration.                                                                 |

---

## 3. Data Model

### 3.1 FieldDefinition

The central model for defining custom fields. Each record describes a single field's type, constraints, and rendering configuration.

```prisma
model FieldDefinition {
  id                String           @id @default(cuid())
  tenantId          String
  tenant            Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Target: built-in model or custom object
  targetModel       String?          // "Participant", "Event", null for custom objects
  customObjectDefId String?
  customObjectDef   CustomObjectDef? @relation(fields: [customObjectDefId], references: [id])

  // Scoping
  eventId           String?
  event             Event?           @relation(fields: [eventId], references: [id])
  participantTypeId String?
  participantType   ParticipantType? @relation(fields: [participantTypeId], references: [id])

  // Definition
  name        String           // Storage key: "weapon_permit_number"
  label       String           // Display: "Weapon Permit Number"
  description String?          // Help text
  dataType    FieldDataType
  sortOrder   Int    @default(0)

  // Constraints
  isRequired   Boolean @default(false)
  isUnique     Boolean @default(false)
  isSearchable Boolean @default(false)
  isFilterable Boolean @default(false)
  defaultValue String?

  // Type-specific configuration
  config     Json @default("{}")
  // TEXT:    {"maxLength": 100, "pattern": "^WP-\\d+$"}
  // NUMBER:  {"min": 0, "max": 999, "decimalPlaces": 2}
  // ENUM:    {"options": [{"value":"low","label":"Low","color":"#22c55e"}]}
  // DATE:    {"minDate": "2026-01-01", "maxDate": "2026-12-31"}
  // FILE:    {"allowedTypes": ["image/jpeg","application/pdf"], "maxSizeMB": 5}
  // REFERENCE: {"targetObjectSlug": "vehicle", "displayField": "plate_number"}

  // UI rendering hints
  uiConfig   Json @default("{}")
  // {"widget": "textarea", "rows": 3, "section": "Travel",
  //  "placeholder": "Enter permit number", "width": "half"}

  // Validation rules (beyond basic type validation)
  validation Json @default("[]")
  // [{"rule": "regex", "value": "^[A-Z]{2}\\d{7}$", "message": "Invalid format"}]
  // [{"rule": "requiredIf", "field": "needsVisa", "value": true}]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, targetModel, customObjectDefId, eventId, participantTypeId, name])
  @@index([tenantId, targetModel, eventId])
  @@index([eventId, participantTypeId, sortOrder])
}
```

**Config schemas by data type:**

```typescript
// app/types/field-configs.ts

export interface TextFieldConfig {
  maxLength?: number;
  minLength?: number;
  pattern?: string; // regex pattern
  patternMessage?: string; // custom error message for pattern
}

export interface NumberFieldConfig {
  min?: number;
  max?: number;
  decimalPlaces?: number;
  step?: number;
  prefix?: string; // e.g., "$"
  suffix?: string; // e.g., "kg"
}

export interface EnumFieldConfig {
  options: Array<{
    value: string;
    label: string;
    color?: string; // hex color for badges
    icon?: string; // icon identifier
    disabled?: boolean; // disable specific options
  }>;
  allowCustom?: boolean; // allow free-text entries
}

export interface DateFieldConfig {
  minDate?: string; // ISO date string
  maxDate?: string;
  includeTime?: boolean;
  timezone?: string;
}

export interface FileFieldConfig {
  allowedTypes: string[]; // MIME types
  maxSizeMB: number;
  maxFiles?: number; // for multi-file
  imageMaxWidth?: number; // auto-resize
  imageMaxHeight?: number;
}

export interface ReferenceFieldConfig {
  targetObjectSlug: string;
  displayField: string;
  filterField?: string;
  allowMultiple?: boolean;
  createInline?: boolean; // allow creating referenced records inline
}

export interface FormulaFieldConfig {
  expression: string; // e.g., "field_a + field_b"
  outputType: "TEXT" | "NUMBER" | "BOOLEAN" | "DATE";
  dependencies: string[]; // field names this formula depends on
}

export interface AutoNumberFieldConfig {
  prefix?: string; // e.g., "REG-"
  startFrom?: number;
  padLength?: number; // zero-pad, e.g., 5 → "00001"
  scope: "TENANT" | "EVENT" | "TYPE";
}

export interface CountryFieldConfig {
  allowedRegions?: string[]; // ISO region codes, e.g., ["EU", "AF"]
  excludeCountries?: string[];
}
```

### 3.2 FieldDataType Enum

```prisma
enum FieldDataType {
  TEXT
  LONG_TEXT
  NUMBER
  BOOLEAN
  DATE
  DATETIME
  ENUM
  MULTI_ENUM
  EMAIL
  URL
  PHONE
  FILE
  IMAGE
  REFERENCE
  FORMULA
  AUTO_NUMBER
  COUNTRY
  USER
}
```

**Type behavior matrix:**

| Type          | Storage Format   | Zod Type                 | PostgreSQL Cast | Indexable | Sortable |
| ------------- | ---------------- | ------------------------ | --------------- | --------- | -------- |
| `TEXT`        | `string`         | `z.string()`             | `::TEXT`        | Yes       | Yes      |
| `LONG_TEXT`   | `string`         | `z.string()`             | `::TEXT`        | Yes (FTS) | No       |
| `NUMBER`      | `number`         | `z.number()`             | `::NUMERIC`     | Yes       | Yes      |
| `BOOLEAN`     | `boolean`        | `z.boolean()`            | `::BOOLEAN`     | Yes       | Yes      |
| `DATE`        | `string` (ISO)   | `z.string().datetime()`  | `::DATE`        | Yes       | Yes      |
| `DATETIME`    | `string` (ISO)   | `z.string().datetime()`  | `::TIMESTAMPTZ` | Yes       | Yes      |
| `ENUM`        | `string`         | `z.enum([...])`          | `::TEXT`        | Yes       | Yes      |
| `MULTI_ENUM`  | `string[]`       | `z.array(z.enum([...]))` | N/A (GIN)       | Yes (GIN) | No       |
| `EMAIL`       | `string`         | `z.string().email()`     | `::TEXT`        | Yes       | Yes      |
| `URL`         | `string`         | `z.string().url()`       | `::TEXT`        | No        | No       |
| `PHONE`       | `string`         | `z.string()`             | `::TEXT`        | Yes       | Yes      |
| `FILE`        | `string` (URL)   | `z.string()`             | N/A             | No        | No       |
| `IMAGE`       | `string` (URL)   | `z.string()`             | N/A             | No        | No       |
| `REFERENCE`   | `string` (ID)    | `z.string()`             | `::TEXT`        | Yes       | No       |
| `FORMULA`     | `any` (computed) | `z.any()`                | Varies          | No        | Yes      |
| `AUTO_NUMBER` | `string`         | `z.string()`             | `::TEXT`        | Yes       | Yes      |
| `COUNTRY`     | `string` (ISO)   | `z.string()`             | `::TEXT`        | Yes       | Yes      |
| `USER`        | `string` (ID)    | `z.string()`             | `::TEXT`        | Yes       | No       |

### 3.3 CustomObjectDef

For tenants that need entirely new entity types (Vehicle Registry, Accommodation Assignments, Equipment Tracking):

```prisma
model CustomObjectDef {
  id          String      @id @default(cuid())
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  slug        String
  description String?
  icon        String?
  color       String?
  scope       ObjectScope @default(EVENT)

  permissions  Json @default("{}")
  listLayout   Json @default("{}")
  detailLayout Json @default("{}")
  formLayout   Json @default("{}")

  fields  FieldDefinition[]
  records CustomObjectRecord[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId])
}
```

**Layout configuration schemas:**

```typescript
// app/types/object-layouts.ts

export interface ListLayout {
  columns: Array<{
    fieldName: string;
    label?: string;
    width?: string; // "100px", "20%", "auto"
    sortable?: boolean;
    filterable?: boolean;
    renderAs?: "text" | "badge" | "link" | "date" | "avatar";
  }>;
  defaultSort?: { field: string; direction: "asc" | "desc" };
  pageSize?: number;
  enableSearch?: boolean;
  searchFields?: string[];
}

export interface DetailLayout {
  sections: Array<{
    title: string;
    columns: 1 | 2 | 3;
    fields: string[]; // field names in display order
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }>;
}

export interface FormLayout {
  sections: Array<{
    title: string;
    description?: string;
    columns: 1 | 2;
    fields: Array<{
      name: string;
      width?: "full" | "half" | "third";
      helpText?: string;
    }>;
    condition?: {
      // show section conditionally
      field: string;
      operator: "equals" | "notEquals" | "contains" | "isSet";
      value?: any;
    };
  }>;
}
```

### 3.4 ObjectScope Enum

```prisma
enum ObjectScope {
  TENANT
  EVENT
}
```

- `TENANT`: Custom object is available across all events for the tenant (e.g., Vehicle Registry)
- `EVENT`: Custom object is scoped to a specific event (e.g., Session Attendance)

### 3.5 CustomObjectRecord

```prisma
model CustomObjectRecord {
  id            String          @id @default(cuid())
  tenantId      String
  tenant        Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  objectDefId   String
  objectDef     CustomObjectDef @relation(fields: [objectDefId], references: [id], onDelete: Cascade)
  eventId       String?
  event         Event?          @relation(fields: [eventId], references: [id])
  participantId String?
  participant   Participant?    @relation(fields: [participantId], references: [id])
  data          Json            @default("{}")
  sortOrder     Float?
  createdBy     String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?

  @@index([tenantId, objectDefId, eventId])
  @@index([deletedAt])
}
```

### 3.6 FieldDefVersion

Tracks changes to field definitions over time for audit, rollback, and migration safety:

```prisma
model FieldDefVersion {
  id         String   @id @default(cuid())
  fieldDefId String
  fieldDef   FieldDefinition @relation(fields: [fieldDefId], references: [id], onDelete: Cascade)
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  version    Int
  snapshot   Json          // Full field definition at this version
  action     String        // "CREATED", "UPDATED", "ACTIVATED", "DEPRECATED", "TYPE_CHANGED"
  changes    Json?         // Diff from previous version
  changedBy  String        // User ID who made the change
  reason     String?       // Optional reason for the change

  createdAt  DateTime @default(now())

  @@unique([fieldDefId, version])
  @@index([fieldDefId, version])
  @@index([tenantId, createdAt])
}
```

**Version diff utility:**

```typescript
// app/services/schema-engine/field-versioning.server.ts

import type { FieldDefinition } from "@prisma/client";

export interface FieldChange {
  property: string;
  oldValue: unknown;
  newValue: unknown;
}

export function computeFieldDiff(
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  const trackedProperties = [
    "label",
    "description",
    "dataType",
    "isRequired",
    "isUnique",
    "isSearchable",
    "isFilterable",
    "defaultValue",
    "config",
    "uiConfig",
    "validation",
    "sortOrder",
  ];

  for (const prop of trackedProperties) {
    const oldVal = JSON.stringify(previous[prop]);
    const newVal = JSON.stringify(current[prop]);
    if (oldVal !== newVal) {
      changes.push({
        property: prop,
        oldValue: previous[prop],
        newValue: current[prop],
      });
    }
  }

  return changes;
}

export async function getFieldHistory(
  fieldDefId: string,
  tenantId: string,
): Promise<
  Array<{
    version: number;
    action: string;
    changes: FieldChange[];
    changedBy: string;
    createdAt: Date;
  }>
> {
  const versions = await prisma.fieldDefVersion.findMany({
    where: { fieldDefId, tenantId },
    orderBy: { version: "desc" },
  });

  return versions.map((v) => ({
    version: v.version,
    action: v.action,
    changes: (v.changes as FieldChange[]) ?? [],
    changedBy: v.changedBy,
    createdAt: v.createdAt,
  }));
}
```

### 3.7 Entity-Relationship Diagram

```
┌─────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│   Tenant    │──────<│   FieldDefinition      │>──────│   CustomObjectDef    │
│             │  1:N  │                       │  N:1  │                      │
│ id          │       │ id                    │       │ id                   │
│ name        │       │ tenantId (FK)         │       │ tenantId (FK)        │
│ slug        │       │ targetModel           │       │ name                 │
│             │       │ customObjectDefId (FK) │       │ slug                 │
│             │       │ eventId (FK)          │       │ description          │
│             │       │ participantTypeId (FK) │       │ scope                │
│             │       │ name                  │       │ permissions          │
│             │       │ label                 │       │ listLayout           │
│             │       │ dataType              │       │ detailLayout         │
│             │       │ config                │       │ formLayout           │
│             │       │ uiConfig              │       │                      │
│             │       │ validation            │       │                      │
└─────────────┘       └──────────┬───────────┘       └──────────┬───────────┘
      │                          │                              │
      │                          │ 1:N                          │ 1:N
      │                          ▼                              ▼
      │                ┌──────────────────────┐       ┌──────────────────────┐
      │                │  FieldDefVersion     │       │  CustomObjectRecord  │
      │                │                      │       │                      │
      │                │  id                  │       │  id                  │
      │                │  fieldDefId (FK)     │       │  tenantId (FK)       │
      │                │  tenantId (FK)       │       │  objectDefId (FK)    │
      │                │  version             │       │  eventId (FK)        │
      │                │  snapshot            │       │  participantId (FK)  │
      │                │  action              │       │  data (JSONB)        │
      │                │  changes             │       │  sortOrder           │
      │                │  changedBy           │       │  createdBy           │
      │                └──────────────────────┘       └──────────────────────┘
      │
      │         ┌──────────────────────┐       ┌──────────────────────┐
      └────────<│   Event              │       │  ParticipantType     │
         1:N    │                      │       │                      │
                │ id                   │       │ id                   │
                │ tenantId (FK)        │       │ tenantId (FK)        │
                │ name                 │       │ name                 │
                │                      │       │ slug                 │
                └──────────────────────┘       └──────────────────────┘
                         ▲                              ▲
                         │ N:1                          │ N:1
                         │                              │
                ┌────────┴───────────────────────────────┘
                │   FieldDefinition scoping
                │   (eventId, participantTypeId)
```

### 3.8 Index Catalog

| Index Name                                                                                  | Table                | Columns/Expression                                                             | Purpose                                              |
| ------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `FieldDefinition_tenantId_targetModel_customObjectDefId_eventId_participantTypeId_name_key` | `FieldDefinition`    | `(tenantId, targetModel, customObjectDefId, eventId, participantTypeId, name)` | Ensures unique field names within scope              |
| `FieldDefinition_tenantId_targetModel_eventId_idx`                                          | `FieldDefinition`    | `(tenantId, targetModel, eventId)`                                             | Fast lookup of fields for a specific model and event |
| `FieldDefinition_eventId_participantTypeId_sortOrder_idx`                                   | `FieldDefinition`    | `(eventId, participantTypeId, sortOrder)`                                      | Ordered field retrieval for form rendering           |
| `CustomObjectDef_tenantId_slug_key`                                                         | `CustomObjectDef`    | `(tenantId, slug)`                                                             | Unique slug per tenant                               |
| `CustomObjectDef_tenantId_idx`                                                              | `CustomObjectDef`    | `(tenantId)`                                                                   | Tenant-scoped object listing                         |
| `CustomObjectRecord_tenantId_objectDefId_eventId_idx`                                       | `CustomObjectRecord` | `(tenantId, objectDefId, eventId)`                                             | Record listing by object type and event              |
| `CustomObjectRecord_deletedAt_idx`                                                          | `CustomObjectRecord` | `(deletedAt)`                                                                  | Soft delete filter                                   |
| `FieldDefVersion_fieldDefId_version_key`                                                    | `FieldDefVersion`    | `(fieldDefId, version)`                                                        | Unique version per field                             |
| `FieldDefVersion_tenantId_createdAt_idx`                                                    | `FieldDefVersion`    | `(tenantId, createdAt)`                                                        | Audit trail chronological listing                    |
| `idx_participant_cf_*` (dynamic)                                                            | `Participant`        | `((customData->>'field_name')::TYPE)`                                          | Expression indexes on searchable custom fields       |

### 3.9 Migration Safety Considerations

Changing a field definition after data has been stored requires careful handling:

**Safe changes (no data migration needed):**

- Changing `label`, `description`, `uiConfig`, `sortOrder`
- Making a required field optional (`isRequired: true` to `false`)
- Adding new options to an `ENUM` field
- Increasing `maxLength` on a `TEXT` field
- Widening numeric range (`min`/`max`)

**Unsafe changes (require data migration):**

- Changing `dataType` (e.g., `TEXT` to `NUMBER`)
- Renaming `name` (storage key)
- Removing options from an `ENUM` field
- Making an optional field required (`isRequired: false` to `true`)
- Narrowing constraints (`maxLength`, `min`/`max`)

**Migration safety protocol:**

```typescript
// app/services/schema-engine/migration-safety.server.ts

export interface MigrationCheck {
  safe: boolean;
  warnings: string[];
  errors: string[];
  affectedRecords: number;
  migrationPlan?: MigrationPlan;
}

export interface MigrationPlan {
  type: "TYPE_CHANGE" | "RENAME" | "CONSTRAINT_NARROW" | "ENUM_REMOVE";
  steps: string[];
  estimatedDuration: string;
  requiresDowntime: boolean;
  rollbackPossible: boolean;
}

export async function checkMigrationSafety(
  fieldId: string,
  tenantId: string,
  proposedChanges: Partial<{
    name: string;
    dataType: string;
    isRequired: boolean;
    config: Record<string, any>;
  }>,
): Promise<MigrationCheck> {
  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId, tenantId },
  });

  if (!field) {
    return { safe: false, warnings: [], errors: ["Field not found"], affectedRecords: 0 };
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  // Count affected records
  const affectedRecords = await countRecordsWithField(field);

  // Check data type change
  if (proposedChanges.dataType && proposedChanges.dataType !== field.dataType) {
    const compatibility = checkTypeCompatibility(field.dataType, proposedChanges.dataType as any);
    if (!compatibility.compatible) {
      errors.push(
        `Cannot convert ${field.dataType} to ${proposedChanges.dataType}: ${compatibility.reason}`,
      );
    } else if (compatibility.lossy) {
      warnings.push(
        `Converting ${field.dataType} to ${proposedChanges.dataType} may lose data: ${compatibility.reason}`,
      );
    }
  }

  // Check required change with existing nulls
  if (proposedChanges.isRequired === true && !field.isRequired) {
    const nullCount = await countRecordsWithNullField(field);
    if (nullCount > 0) {
      errors.push(`Cannot make field required: ${nullCount} records have null/empty values`);
    }
  }

  // Check name change
  if (proposedChanges.name && proposedChanges.name !== field.name) {
    warnings.push(
      `Renaming field from "${field.name}" to "${proposedChanges.name}" requires data migration of ${affectedRecords} records`,
    );
  }

  return {
    safe: errors.length === 0,
    warnings,
    errors,
    affectedRecords,
    migrationPlan: errors.length === 0 ? buildMigrationPlan(field, proposedChanges) : undefined,
  };
}

function checkTypeCompatibility(
  from: string,
  to: string,
): { compatible: boolean; lossy: boolean; reason: string } {
  const compatibilityMap: Record<string, Record<string, { lossy: boolean; reason: string }>> = {
    TEXT: {
      LONG_TEXT: { lossy: false, reason: "Widening text type" },
      NUMBER: { lossy: true, reason: "Non-numeric values will fail conversion" },
      EMAIL: { lossy: true, reason: "Non-email values will fail validation" },
      ENUM: { lossy: true, reason: "Values not in enum options will be lost" },
    },
    NUMBER: {
      TEXT: { lossy: false, reason: "Numbers convert to text losslessly" },
      BOOLEAN: { lossy: true, reason: "Only 0/1 values map to boolean" },
    },
    BOOLEAN: {
      TEXT: { lossy: false, reason: 'Boolean to "true"/"false" text' },
      NUMBER: { lossy: false, reason: "Boolean to 0/1" },
      ENUM: { lossy: false, reason: "Boolean to enum with true/false options" },
    },
    ENUM: {
      TEXT: { lossy: false, reason: "Enum values are already text" },
      MULTI_ENUM: { lossy: false, reason: "Wrap single value in array" },
    },
    DATE: {
      DATETIME: { lossy: false, reason: "Add midnight time" },
      TEXT: { lossy: false, reason: "Date to ISO string" },
    },
  };

  const fromMap = compatibilityMap[from];
  if (!fromMap || !fromMap[to]) {
    return { compatible: false, lossy: false, reason: `No conversion path from ${from} to ${to}` };
  }

  return { compatible: true, ...fromMap[to] };
}

async function countRecordsWithField(field: any): Promise<number> {
  if (field.targetModel === "Participant") {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Participant"
      WHERE "tenantId" = ${field.tenantId}
        AND "customData" ? ${field.name}
        AND "deletedAt" IS NULL
    `;
    return Number(result[0].count);
  }
  return 0;
}

async function countRecordsWithNullField(field: any): Promise<number> {
  if (field.targetModel === "Participant") {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Participant"
      WHERE "tenantId" = ${field.tenantId}
        AND (NOT ("customData" ? ${field.name})
             OR "customData"->>${field.name} IS NULL
             OR "customData"->>${field.name} = '')
        AND "deletedAt" IS NULL
    `;
    return Number(result[0].count);
  }
  return 0;
}

function buildMigrationPlan(field: any, changes: Record<string, any>): MigrationPlan | undefined {
  if (changes.dataType && changes.dataType !== field.dataType) {
    return {
      type: "TYPE_CHANGE",
      steps: [
        `1. Create version snapshot of field "${field.name}"`,
        `2. Validate all existing data against new type "${changes.dataType}"`,
        `3. Transform data in batches of 1000 records`,
        `4. Update field definition dataType`,
        `5. Rebuild expression indexes if searchable`,
        `6. Invalidate schema cache`,
      ],
      estimatedDuration: "Depends on record count",
      requiresDowntime: false,
      rollbackPossible: true,
    };
  }
  return undefined;
}
```

---

## 4. API Specification

### 4.1 Field Endpoints

#### List Custom Fields

```
GET /api/v1/tenants/:tenantId/fields
```

**Query parameters:**

| Parameter           | Type            | Required | Description                                     |
| ------------------- | --------------- | -------- | ----------------------------------------------- |
| `targetModel`       | `string`        | No       | Filter by target model ("Participant", "Event") |
| `customObjectDefId` | `string`        | No       | Filter by custom object definition              |
| `eventId`           | `string`        | No       | Filter by event scope                           |
| `participantTypeId` | `string`        | No       | Filter by participant type scope                |
| `dataType`          | `FieldDataType` | No       | Filter by field data type                       |
| `isSearchable`      | `boolean`       | No       | Filter searchable fields only                   |
| `isFilterable`      | `boolean`       | No       | Filter filterable fields only                   |

**Response:**

```typescript
// 200 OK
{
  data: Array<{
    id: string;
    tenantId: string;
    targetModel: string | null;
    customObjectDefId: string | null;
    eventId: string | null;
    participantTypeId: string | null;
    name: string;
    label: string;
    description: string | null;
    dataType: FieldDataType;
    sortOrder: number;
    isRequired: boolean;
    isUnique: boolean;
    isSearchable: boolean;
    isFilterable: boolean;
    defaultValue: string | null;
    config: Record<string, any>;
    uiConfig: Record<string, any>;
    validation: Array<{ rule: string; value?: any; message: string }>;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    total: number;
  }
}
```

**Implementation:**

```typescript
// app/routes/api.v1.tenants.$tenantId.fields.ts

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireApiAuth } from "~/utils/api-auth.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { tenantId } = params;
  await requireApiAuth(request, tenantId!, "fields:read");

  const url = new URL(request.url);
  const targetModel = url.searchParams.get("targetModel");
  const customObjectDefId = url.searchParams.get("customObjectDefId");
  const eventId = url.searchParams.get("eventId");
  const participantTypeId = url.searchParams.get("participantTypeId");
  const dataType = url.searchParams.get("dataType");
  const isSearchable = url.searchParams.get("isSearchable");
  const isFilterable = url.searchParams.get("isFilterable");

  const where: any = { tenantId };
  if (targetModel) where.targetModel = targetModel;
  if (customObjectDefId) where.customObjectDefId = customObjectDefId;
  if (eventId) where.eventId = eventId;
  if (participantTypeId) where.participantTypeId = participantTypeId;
  if (dataType) where.dataType = dataType;
  if (isSearchable !== null) where.isSearchable = isSearchable === "true";
  if (isFilterable !== null) where.isFilterable = isFilterable === "true";

  const fields = await prisma.fieldDefinition.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });

  return json({
    data: fields,
    meta: { total: fields.length },
  });
}
```

#### Create Custom Field

```
POST /api/v1/tenants/:tenantId/fields
```

**Request body:**

```typescript
{
  targetModel?: string         // "Participant" | "Event"
  customObjectDefId?: string
  eventId?: string
  participantTypeId?: string
  name: string                 // storage key, snake_case
  label: string                // display label
  description?: string
  dataType: FieldDataType
  sortOrder?: number
  isRequired?: boolean
  isUnique?: boolean
  isSearchable?: boolean
  isFilterable?: boolean
  defaultValue?: string
  config?: Record<string, any>
  uiConfig?: Record<string, any>
  validation?: Array<{ rule: string; value?: any; message: string }>
}
```

**Implementation:**

```typescript
// app/routes/api.v1.tenants.$tenantId.fields.ts (continued)

import { z } from "zod";
import { ensureCustomFieldIndex } from "~/utils/custom-query.server";
import { onFieldDefChanged } from "~/services/schema-engine/cache-invalidation.server";

const CreateFieldSchema = z.object({
  targetModel: z.string().optional(),
  customObjectDefId: z.string().optional(),
  eventId: z.string().optional(),
  participantTypeId: z.string().optional(),
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "Must be snake_case starting with a letter"),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dataType: z.nativeEnum(FieldDataType),
  sortOrder: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isSearchable: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
  defaultValue: z.string().optional(),
  config: z.record(z.any()).default({}),
  uiConfig: z.record(z.any()).default({}),
  validation: z
    .array(
      z.object({
        rule: z.string(),
        value: z.any().optional(),
        message: z.string(),
      }),
    )
    .default([]),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const { tenantId } = params;
  await requireApiAuth(request, tenantId!, "fields:write");

  if (request.method === "POST") {
    const body = await request.json();
    const parsed = CreateFieldSchema.parse(body);

    // Check field limit per tenant
    const existingCount = await prisma.fieldDefinition.count({
      where: { tenantId },
    });
    const maxFields = await getTenantFieldLimit(tenantId!);
    if (existingCount >= maxFields) {
      throw new Error(`Field limit reached: ${maxFields} fields maximum`);
    }

    // Validate config against dataType
    validateFieldConfig(parsed.dataType, parsed.config);

    const field = await prisma.fieldDefinition.create({
      data: {
        tenantId: tenantId!,
        ...parsed,
      },
    });

    // Create initial version
    await prisma.fieldDefVersion.create({
      data: {
        fieldDefId: field.id,
        tenantId: tenantId!,
        version: 1,
        snapshot: JSON.parse(JSON.stringify(field)),
        action: "CREATED",
        changedBy: "api", // replaced by auth middleware
      },
    });

    // Create expression index if searchable
    if (field.isSearchable) {
      await ensureCustomFieldIndex(field as any);
    }

    // Invalidate schema cache
    await onFieldDefChanged({
      type: "CREATED",
      fieldDef: field,
    });

    return json({ data: field }, { status: 201 });
  }
}
```

#### Get Custom Field

```
GET /api/v1/tenants/:tenantId/fields/:fieldId
```

#### Update Custom Field

```
PUT /api/v1/tenants/:tenantId/fields/:fieldId
```

**Implementation with migration safety:**

```typescript
// app/routes/api.v1.tenants.$tenantId.fields.$fieldId.ts

import { checkMigrationSafety } from "~/services/schema-engine/migration-safety.server";
import { computeFieldDiff } from "~/services/schema-engine/field-versioning.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { tenantId, fieldId } = params;
  await requireApiAuth(request, tenantId!, "fields:write");

  if (request.method === "PUT") {
    const body = await request.json();
    const parsed = UpdateFieldSchema.parse(body);

    const existing = await prisma.fieldDefinition.findFirst({
      where: { id: fieldId, tenantId },
    });
    if (!existing) {
      throw new Response("Field not found", { status: 404 });
    }

    // Check migration safety for destructive changes
    if (parsed.dataType || parsed.name || parsed.isRequired !== undefined) {
      const safety = await checkMigrationSafety(fieldId!, tenantId!, {
        dataType: parsed.dataType,
        name: parsed.name,
        isRequired: parsed.isRequired,
        config: parsed.config,
      });

      if (!safety.safe) {
        return json(
          {
            error: "Migration safety check failed",
            details: safety.errors,
            warnings: safety.warnings,
            affectedRecords: safety.affectedRecords,
          },
          { status: 422 },
        );
      }

      // Return warnings for confirmation if present
      if (safety.warnings.length > 0 && !body._confirmMigration) {
        return json(
          {
            requiresConfirmation: true,
            warnings: safety.warnings,
            affectedRecords: safety.affectedRecords,
            migrationPlan: safety.migrationPlan,
          },
          { status: 409 },
        );
      }
    }

    // Compute diff for version tracking
    const changes = computeFieldDiff(existing as any, { ...existing, ...parsed } as any);

    const updated = await prisma.fieldDefinition.update({
      where: { id: fieldId },
      data: parsed,
    });

    // Record version
    if (changes.length > 0) {
      const latestVersion = await prisma.fieldDefVersion.findFirst({
        where: { fieldDefId: fieldId },
        orderBy: { version: "desc" },
      });

      await prisma.fieldDefVersion.create({
        data: {
          fieldDefId: fieldId!,
          tenantId: tenantId!,
          version: (latestVersion?.version ?? 0) + 1,
          snapshot: JSON.parse(JSON.stringify(updated)),
          action: "UPDATED",
          changes: changes as any,
          changedBy: "api",
        },
      });
    }

    // Handle index changes
    if (parsed.isSearchable !== undefined) {
      if (parsed.isSearchable) {
        await ensureCustomFieldIndex(updated as any);
      } else {
        await removeCustomFieldIndex(updated as any);
      }
    }

    await onFieldDefChanged({ type: "UPDATED", fieldDef: updated });

    return json({ data: updated });
  }

  if (request.method === "DELETE") {
    const field = await prisma.fieldDefinition.findFirst({
      where: { id: fieldId, tenantId },
    });
    if (!field) {
      throw new Response("Field not found", { status: 404 });
    }

    const { canDelete, reason, recordCount } = await canDeleteField(fieldId!, tenantId!);
    if (!canDelete) {
      return json({ error: "Cannot delete field", reason, recordCount }, { status: 422 });
    }

    // Remove index if searchable
    if (field.isSearchable) {
      await removeCustomFieldIndex(field as any);
    }

    await prisma.fieldDefinition.delete({ where: { id: fieldId } });
    await onFieldDefChanged({ type: "DELETED", fieldDef: field });

    return json({ success: true });
  }
}
```

### 4.2 Custom Object Endpoints

```
GET    /api/v1/tenants/:tenantId/custom-objects
POST   /api/v1/tenants/:tenantId/custom-objects
GET    /api/v1/tenants/:tenantId/custom-objects/:objectId
PUT    /api/v1/tenants/:tenantId/custom-objects/:objectId
DELETE /api/v1/tenants/:tenantId/custom-objects/:objectId
```

**Create Custom Object:**

```typescript
// app/routes/api.v1.tenants.$tenantId.custom-objects.ts

const CreateObjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9-]*$/, "Must be kebab-case starting with a letter"),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  scope: z.enum(["TENANT", "EVENT"]).default("EVENT"),
  permissions: z.record(z.any()).default({}),
  listLayout: z.record(z.any()).default({}),
  detailLayout: z.record(z.any()).default({}),
  formLayout: z.record(z.any()).default({}),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const { tenantId } = params;
  await requireApiAuth(request, tenantId!, "custom-objects:write");

  if (request.method === "POST") {
    const body = await request.json();
    const parsed = CreateObjectSchema.parse(body);

    // Check custom object limit
    const objectCount = await prisma.customObjectDef.count({
      where: { tenantId },
    });
    const maxObjects = 50; // configurable per plan
    if (objectCount >= maxObjects) {
      throw new Error(`Custom object limit reached: ${maxObjects} objects maximum`);
    }

    const object = await prisma.customObjectDef.create({
      data: {
        tenantId: tenantId!,
        ...parsed,
      },
    });

    return json({ data: object }, { status: 201 });
  }
}
```

### 4.3 Custom Object Record Endpoints

```
GET    /api/v1/tenants/:tenantId/custom-objects/:objectSlug/records
POST   /api/v1/tenants/:tenantId/custom-objects/:objectSlug/records
GET    /api/v1/tenants/:tenantId/custom-objects/:objectSlug/records/:recordId
PUT    /api/v1/tenants/:tenantId/custom-objects/:objectSlug/records/:recordId
DELETE /api/v1/tenants/:tenantId/custom-objects/:objectSlug/records/:recordId
```

**Create Record with dynamic validation:**

```typescript
// app/routes/api.v1.tenants.$tenantId.custom-objects.$objectSlug.records.ts

import { compileSchema } from "~/services/schema-engine/compilation-pipeline.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { tenantId, objectSlug } = params;
  await requireApiAuth(request, tenantId!, "custom-records:write");

  const objectDef = await prisma.customObjectDef.findFirst({
    where: { tenantId, slug: objectSlug },
  });
  if (!objectDef) {
    throw new Response("Custom object not found", { status: 404 });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const { eventId, participantId, data, sortOrder } = body;

    // Compile and validate against dynamic schema
    const { zodSchema } = await compileSchema({
      tenantId: tenantId!,
      customObjectDefId: objectDef.id,
      eventId,
    });

    const validationResult = zodSchema.safeParse(data);
    if (!validationResult.success) {
      return json(
        {
          error: "Validation failed",
          fieldErrors: validationResult.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const record = await prisma.customObjectRecord.create({
      data: {
        tenantId: tenantId!,
        objectDefId: objectDef.id,
        eventId,
        participantId,
        data: validationResult.data,
        sortOrder,
        createdBy: "api", // replaced by auth middleware
      },
    });

    return json({ data: record }, { status: 201 });
  }
}
```

### 4.4 Field Reordering Endpoint

```
PUT /api/v1/tenants/:tenantId/fields/reorder
```

**Request body:**

```typescript
{
  fieldOrders: Array<{
    fieldId: string;
    sortOrder: number;
  }>;
}
```

**Implementation:**

```typescript
// app/routes/api.v1.tenants.$tenantId.fields.reorder.ts

export async function action({ request, params }: ActionFunctionArgs) {
  const { tenantId } = params;
  await requireApiAuth(request, tenantId!, "fields:write");

  const body = await request.json();
  const { fieldOrders } = body;

  // Batch update in a transaction
  await prisma.$transaction(
    fieldOrders.map(({ fieldId, sortOrder }: { fieldId: string; sortOrder: number }) =>
      prisma.fieldDefinition.update({
        where: { id: fieldId },
        data: { sortOrder },
      }),
    ),
  );

  // Invalidate cache for all affected schemas
  await onFieldDefChanged({
    type: "UPDATED",
    fieldDef: { tenantId: tenantId!, targetModel: null, customObjectDefId: null, eventId: null },
  });

  return json({ success: true });
}
```

### 4.5 Field Migration Endpoint

```
POST /api/v1/tenants/:tenantId/fields/:fieldId/migrate
```

**Request body:**

```typescript
{
  newDataType: FieldDataType
  transformRule?: 'CAST' | 'TRUNCATE' | 'DEFAULT' | 'CUSTOM'
  defaultValue?: any          // used when CAST fails
  customTransform?: string    // expression for CUSTOM rule
  dryRun?: boolean            // preview without applying
}
```

**Response:**

```typescript
// 200 OK
{
  data: {
    fieldId: string;
    oldType: FieldDataType;
    newType: FieldDataType;
    totalRecords: number;
    successCount: number;
    failureCount: number;
    failures: Array<{
      recordId: string;
      oldValue: any;
      error: string;
    }>;
    applied: boolean; // false if dryRun
  }
}
```

### 4.6 Bulk Operations

#### Bulk Create Fields

```
POST /api/v1/tenants/:tenantId/fields/bulk
```

```typescript
{
  fields: Array<CreateFieldRequest>; // max 50 per request
}
```

#### Bulk Delete Fields

```
DELETE /api/v1/tenants/:tenantId/fields/bulk
```

```typescript
{
  fieldIds: string[]
  force?: boolean   // delete even if data exists (marks data as orphaned)
}
```

### 4.7 Field Export/Import

#### Export Field Definitions

```
GET /api/v1/tenants/:tenantId/fields/export
```

Returns a JSON file containing all field definitions for the tenant, suitable for import into another tenant or environment.

```typescript
// Response: 200 OK, Content-Type: application/json
{
  exportVersion: "1.0",
  exportedAt: "2026-02-10T12:00:00Z",
  tenantId: string,
  fields: Array<FieldDefinition>,
  objects: Array<CustomObjectDef & { fields: FieldDefinition[] }>
}
```

#### Import Field Definitions

```
POST /api/v1/tenants/:tenantId/fields/import
```

```typescript
// Request body
{
  importData: ExportPayload
  mode: 'CREATE_ONLY' | 'UPSERT' | 'REPLACE'
  dryRun?: boolean
}

// Response: 200 OK
{
  data: {
    created: number
    updated: number
    skipped: number
    errors: Array<{ field: string; error: string }>
    applied: boolean
  }
}
```

**Complete API summary:**

| Method   | Endpoint                            | Permission             | Description          |
| -------- | ----------------------------------- | ---------------------- | -------------------- |
| `GET`    | `/fields`                           | `fields:read`          | List custom fields   |
| `POST`   | `/fields`                           | `fields:write`         | Create custom field  |
| `GET`    | `/fields/:id`                       | `fields:read`          | Get field by ID      |
| `PUT`    | `/fields/:id`                       | `fields:write`         | Update field         |
| `DELETE` | `/fields/:id`                       | `fields:write`         | Delete field         |
| `PUT`    | `/fields/reorder`                   | `fields:write`         | Reorder fields       |
| `POST`   | `/fields/:id/migrate`               | `fields:admin`         | Migrate field type   |
| `POST`   | `/fields/bulk`                      | `fields:write`         | Bulk create fields   |
| `DELETE` | `/fields/bulk`                      | `fields:admin`         | Bulk delete fields   |
| `GET`    | `/fields/export`                    | `fields:read`          | Export definitions   |
| `POST`   | `/fields/import`                    | `fields:admin`         | Import definitions   |
| `GET`    | `/custom-objects`                   | `custom-objects:read`  | List custom objects  |
| `POST`   | `/custom-objects`                   | `custom-objects:write` | Create custom object |
| `GET`    | `/custom-objects/:id`               | `custom-objects:read`  | Get object by ID     |
| `PUT`    | `/custom-objects/:id`               | `custom-objects:write` | Update object        |
| `DELETE` | `/custom-objects/:id`               | `custom-objects:write` | Delete object        |
| `GET`    | `/custom-objects/:slug/records`     | `custom-records:read`  | List records         |
| `POST`   | `/custom-objects/:slug/records`     | `custom-records:write` | Create record        |
| `GET`    | `/custom-objects/:slug/records/:id` | `custom-records:read`  | Get record           |
| `PUT`    | `/custom-objects/:slug/records/:id` | `custom-records:write` | Update record        |
| `DELETE` | `/custom-objects/:slug/records/:id` | `custom-records:write` | Delete record        |

---

## 5. Business Logic

### 5.1 Dynamic Zod Schema Builder

The system generates Zod schemas at runtime from field definitions. This is the core validation mechanism that bridges metadata-defined fields with type-safe input processing.

```typescript
// app/utils/fields.server.ts

import { z } from "zod";
import type { FieldDataType } from "@prisma/client";

interface FieldDef {
  name: string;
  label: string;
  dataType: FieldDataType;
  isRequired: boolean;
  config: Record<string, any>;
  validation: Array<{ rule: string; value?: any; message: string }>;
}

export function buildCustomDataSchema(fieldDefs: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fieldDefs) {
    let schema: z.ZodTypeAny;

    switch (field.dataType) {
      case "TEXT":
      case "LONG_TEXT": {
        let s = z.string();
        if (field.config.maxLength) s = s.max(field.config.maxLength);
        if (field.config.pattern) s = s.regex(new RegExp(field.config.pattern));
        schema = s;
        break;
      }
      case "NUMBER": {
        let n = z.number();
        if (field.config.min !== undefined) n = n.min(field.config.min);
        if (field.config.max !== undefined) n = n.max(field.config.max);
        schema = n;
        break;
      }
      case "BOOLEAN":
        schema = z.boolean();
        break;
      case "DATE":
      case "DATETIME":
        schema = z.string().datetime();
        break;
      case "ENUM": {
        const values = field.config.options?.map((o: any) => o.value) ?? [];
        schema = z.enum(values as [string, ...string[]]);
        break;
      }
      case "MULTI_ENUM": {
        const multiValues = field.config.options?.map((o: any) => o.value) ?? [];
        schema = z.array(z.enum(multiValues as [string, ...string[]]));
        break;
      }
      case "EMAIL":
        schema = z.string().email();
        break;
      case "URL":
        schema = z.string().url();
        break;
      case "PHONE":
        schema = z.string().min(7).max(20);
        break;
      case "FILE":
      case "IMAGE":
      case "REFERENCE":
        schema = z.string();
        break;
      default:
        schema = z.any();
    }

    // Apply custom validation rules
    for (const rule of field.validation || []) {
      if (rule.rule === "regex" && typeof rule.value === "string") {
        schema = schema.refine((val: any) => new RegExp(rule.value).test(String(val)), {
          message: rule.message,
        });
      }
    }

    shape[field.name] = field.isRequired ? schema : schema.optional().nullable();
  }

  return z.object(shape);
}
```

**Extended schema builder with additional field types:**

```typescript
// app/utils/fields-extended.server.ts

import { z } from "zod";
import { buildCustomDataSchema } from "./fields.server";
import type { FieldDef } from "~/types/schema-engine";

/**
 * Extended schema builder that handles FORMULA, AUTO_NUMBER, COUNTRY, and USER types
 * plus advanced validation rules (requiredIf, minItems, etc.)
 */
export function buildExtendedCustomDataSchema(fieldDefs: FieldDef[]) {
  // Start with base schema
  const baseSchema = buildCustomDataSchema(
    fieldDefs.filter((f) => !["FORMULA", "AUTO_NUMBER"].includes(f.dataType)),
  );

  // Add COUNTRY fields
  const countryFields = fieldDefs.filter((f) => f.dataType === "COUNTRY");
  let schema = baseSchema;

  for (const field of countryFields) {
    const countryConfig = field.config as {
      allowedRegions?: string[];
      excludeCountries?: string[];
    };

    let countrySchema = z.string().length(2); // ISO 3166-1 alpha-2
    if (countryConfig.allowedRegions || countryConfig.excludeCountries) {
      countrySchema = countrySchema.refine((val) => isValidCountryForConfig(val, countryConfig), {
        message: `Country not allowed for this field`,
      });
    }

    schema = schema.extend({
      [field.name]: field.isRequired ? countrySchema : countrySchema.optional().nullable(),
    }) as any;
  }

  // Add USER fields (reference to User model)
  const userFields = fieldDefs.filter((f) => f.dataType === "USER");
  for (const field of userFields) {
    schema = schema.extend({
      [field.name]: field.isRequired ? z.string().cuid() : z.string().cuid().optional().nullable(),
    }) as any;
  }

  return schema;
}

function isValidCountryForConfig(
  countryCode: string,
  config: { allowedRegions?: string[]; excludeCountries?: string[] },
): boolean {
  if (config.excludeCountries?.includes(countryCode)) return false;
  if (config.allowedRegions && config.allowedRegions.length > 0) {
    return isCountryInRegions(countryCode, config.allowedRegions);
  }
  return true;
}

function isCountryInRegions(countryCode: string, regions: string[]): boolean {
  // Implementation uses a country-to-region mapping
  const regionMap: Record<string, string[]> = {
    EU: ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "FI", "IE", "GR"],
    AF: ["NG", "ZA", "KE", "ET", "GH", "TZ", "EG", "MA", "DZ", "TN"],
    // ... complete mapping in production
  };
  return regions.some((region) => regionMap[region]?.includes(countryCode) ?? false);
}
```

### 5.2 Dynamic Form Renderer

Maps `dataType` values to existing Conform components:

```typescript
// app/components/fields/FieldRenderer.tsx

export function FieldRenderer({ fieldDef, meta }: {
  fieldDef: FieldDef
  meta: FieldMetadata<string>
}) {
  switch (fieldDef.dataType) {
    case 'TEXT':
    case 'EMAIL':
    case 'URL':
    case 'PHONE':
      return <InputField meta={meta} type={mapInputType(fieldDef.dataType)}
                         placeholder={fieldDef.uiConfig.placeholder} />
    case 'LONG_TEXT':
      return <TextareaField meta={meta} rows={fieldDef.uiConfig.rows ?? 3} />
    case 'NUMBER':
      return <InputField meta={meta} type="number"
                         min={fieldDef.config.min} max={fieldDef.config.max} />
    case 'BOOLEAN':
      return <CheckboxField meta={meta} />
    case 'DATE':
    case 'DATETIME':
      return <DatePickerField meta={meta} />
    case 'ENUM':
      return <SelectField meta={meta}
                          items={fieldDef.config.options}
                          placeholder={`Select ${fieldDef.label}`} />
    case 'MULTI_ENUM':
      return <CheckboxGroupField meta={meta} options={fieldDef.config.options} />
    case 'FILE':
    case 'IMAGE':
      return <FileInputField meta={meta}
                             accept={fieldDef.config.allowedTypes?.join(',')} />
    default:
      return <InputField meta={meta} type="text" />
  }
}
```

**Component mapping:**

| `dataType`   | Component                    | Renders         |
| ------------ | ---------------------------- | --------------- |
| `TEXT`       | `<InputField type="text">`   | Text input      |
| `NUMBER`     | `<InputField type="number">` | Number input    |
| `BOOLEAN`    | `<CheckboxField>`            | Checkbox        |
| `DATE`       | `<DatePickerField>`          | Calendar picker |
| `ENUM`       | `<SelectField>`              | Dropdown        |
| `MULTI_ENUM` | `<CheckboxGroupField>`       | Checkbox group  |
| `LONG_TEXT`  | `<TextareaField>`            | Textarea        |
| `FILE`       | `<FileInputField>`           | File upload     |
| `EMAIL`      | `<InputField type="email">`  | Email input     |

**Extended renderer with additional types:**

```typescript
// app/components/fields/ExtendedFieldRenderer.tsx

import { FieldRenderer } from './FieldRenderer'
import { CountryPickerField } from '~/components/ui/country-picker'
import { UserPickerField } from '~/components/ui/user-picker'
import { FormulaDisplayField } from '~/components/ui/formula-display'
import { AutoNumberDisplayField } from '~/components/ui/auto-number-display'
import { ReferencePickerField } from '~/components/ui/reference-picker'
import type { FieldDef } from '~/types/schema-engine'
import type { FieldMetadata } from '@conform-to/react'

interface ExtendedFieldRendererProps {
  fieldDef: FieldDef
  meta: FieldMetadata<string>
  formData?: Record<string, any>  // current form values for formula evaluation
  tenantId: string
  eventId?: string
}

export function ExtendedFieldRenderer({
  fieldDef,
  meta,
  formData,
  tenantId,
  eventId,
}: ExtendedFieldRendererProps) {
  switch (fieldDef.dataType) {
    case 'COUNTRY':
      return (
        <CountryPickerField
          meta={meta}
          allowedRegions={(fieldDef.config as any).allowedRegions}
          excludeCountries={(fieldDef.config as any).excludeCountries}
          placeholder={`Select country`}
        />
      )

    case 'USER':
      return (
        <UserPickerField
          meta={meta}
          tenantId={tenantId}
          eventId={eventId}
          placeholder={`Select user`}
        />
      )

    case 'REFERENCE':
      return (
        <ReferencePickerField
          meta={meta}
          tenantId={tenantId}
          eventId={eventId}
          targetObjectSlug={(fieldDef.config as any).targetObjectSlug}
          displayField={(fieldDef.config as any).displayField}
          allowMultiple={(fieldDef.config as any).allowMultiple}
          createInline={(fieldDef.config as any).createInline}
        />
      )

    case 'FORMULA':
      return (
        <FormulaDisplayField
          fieldDef={fieldDef}
          formData={formData ?? {}}
        />
      )

    case 'AUTO_NUMBER':
      return (
        <AutoNumberDisplayField
          meta={meta}
          prefix={(fieldDef.config as any).prefix}
        />
      )

    default:
      return <FieldRenderer fieldDef={fieldDef} meta={meta} />
  }
}

function mapInputType(dataType: string): string {
  switch (dataType) {
    case 'EMAIL': return 'email'
    case 'URL': return 'url'
    case 'PHONE': return 'tel'
    default: return 'text'
  }
}
```

**Dynamic field section renderer:**

```typescript
// app/components/fields/FieldSection.tsx

import { ExtendedFieldRenderer } from './ExtendedFieldRenderer'
import type { FieldDef } from '~/types/schema-engine'
import type { FieldMetadata, FormMetadata } from '@conform-to/react'

interface FieldSectionProps {
  title?: string
  description?: string
  fieldDefs: FieldDef[]
  form: FormMetadata<Record<string, any>>
  formData?: Record<string, any>
  tenantId: string
  eventId?: string
  columns?: 1 | 2
}

export function FieldSection({
  title,
  description,
  fieldDefs,
  form,
  formData,
  tenantId,
  eventId,
  columns = 2,
}: FieldSectionProps) {
  // Group fields by section from uiConfig
  const sections = groupFieldsBySection(fieldDefs)

  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {sections.map((section) => (
        <fieldset key={section.name} className="space-y-4">
          {section.name !== '_default' && (
            <legend className="text-sm font-medium text-muted-foreground">
              {section.name}
            </legend>
          )}
          <div className={`grid grid-cols-12 gap-4`}>
            {section.fields.map((fieldDef) => {
              const fieldMeta = form.fields.customData.getFieldset()[fieldDef.name]
              const width = (fieldDef.uiConfig as any)?.width ?? 'full'
              const colSpan = width === 'half' ? 'col-span-6'
                : width === 'third' ? 'col-span-4'
                : 'col-span-12'

              return (
                <div key={fieldDef.name} className={colSpan}>
                  <label className="block text-sm font-medium mb-1">
                    {fieldDef.label}
                    {fieldDef.isRequired && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </label>
                  {fieldDef.description && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {fieldDef.description}
                    </p>
                  )}
                  <ExtendedFieldRenderer
                    fieldDef={fieldDef}
                    meta={fieldMeta as any}
                    formData={formData}
                    tenantId={tenantId}
                    eventId={eventId}
                  />
                </div>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

function groupFieldsBySection(
  fieldDefs: FieldDef[]
): Array<{ name: string; fields: FieldDef[] }> {
  const groups = new Map<string, FieldDef[]>()

  for (const field of fieldDefs) {
    const section = (field.uiConfig as any)?.section ?? '_default'
    if (!groups.has(section)) groups.set(section, [])
    groups.get(section)!.push(field)
  }

  return Array.from(groups.entries()).map(([name, fields]) => ({
    name,
    fields: fields.sort((a, b) => a.sortOrder - b.sortOrder),
  }))
}
```

### 5.3 Query Layer for Custom Fields

```typescript
// app/utils/custom-query.server.ts

export async function filterWithCustomFields({
  request,
  where,
  fieldDefinitions,
}: {
  request: Request;
  where: Prisma.ParticipantWhereInput;
  fieldDefinitions: FieldDef[];
}) {
  const url = new URL(request.url);
  const customFilters: Prisma.Sql[] = [];

  for (const field of fieldDefinitions.filter((f) => f.isFilterable)) {
    const value = url.searchParams.get(`cf_${field.name}`);
    if (!value) continue;

    switch (field.dataType) {
      case "TEXT":
      case "EMAIL":
        customFilters.push(Prisma.sql`"customData"->>${field.name} ILIKE ${"%" + value + "%"}`);
        break;
      case "NUMBER":
        customFilters.push(Prisma.sql`("customData"->>${field.name})::NUMERIC = ${Number(value)}`);
        break;
      case "BOOLEAN":
        customFilters.push(
          Prisma.sql`("customData"->>${field.name})::BOOLEAN = ${value === "true"}`,
        );
        break;
      case "ENUM":
        customFilters.push(Prisma.sql`"customData"->>${field.name} = ${value}`);
        break;
    }
  }

  if (customFilters.length === 0) {
    return prisma.participant.findMany({ where });
  }

  // Combine Prisma where with raw JSONB conditions
  const customWhere = Prisma.sql`AND ${Prisma.join(customFilters, " AND ")}`;
  // Build hybrid query using prisma.$queryRaw
}
```

**Extended query builder with range filters, multi-value, and sorting:**

```typescript
// app/utils/custom-query-extended.server.ts

import { Prisma } from "@prisma/client";
import { prisma } from "~/utils/db.server";
import type { FieldDef } from "~/types/schema-engine";

interface CustomQueryOptions {
  request: Request;
  baseWhere: Prisma.ParticipantWhereInput;
  fieldDefinitions: FieldDef[];
  tenantId: string;
  eventId?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

interface CustomQueryResult {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function queryWithCustomFields(
  options: CustomQueryOptions,
): Promise<CustomQueryResult> {
  const {
    request,
    baseWhere,
    fieldDefinitions,
    tenantId,
    page = 1,
    pageSize = 25,
    sortField,
    sortDirection = "asc",
  } = options;

  const url = new URL(request.url);
  const customFilters: Prisma.Sql[] = [];

  // Build custom field filters
  for (const field of fieldDefinitions.filter((f) => f.isFilterable)) {
    const value = url.searchParams.get(`cf_${field.name}`);
    const minValue = url.searchParams.get(`cf_${field.name}_min`);
    const maxValue = url.searchParams.get(`cf_${field.name}_max`);
    const multiValue = url.searchParams.get(`cf_${field.name}_in`);

    if (!value && !minValue && !maxValue && !multiValue) continue;

    switch (field.dataType) {
      case "TEXT":
      case "LONG_TEXT":
      case "EMAIL":
        if (value) {
          customFilters.push(
            Prisma.sql`"customData"->>${Prisma.raw(`'${field.name}'`)} ILIKE ${`%${value}%`}`,
          );
        }
        break;

      case "NUMBER":
        if (value) {
          customFilters.push(
            Prisma.sql`("customData"->>${Prisma.raw(`'${field.name}'`)})::NUMERIC = ${Number(value)}`,
          );
        }
        if (minValue) {
          customFilters.push(
            Prisma.sql`("customData"->>${Prisma.raw(`'${field.name}'`)})::NUMERIC >= ${Number(minValue)}`,
          );
        }
        if (maxValue) {
          customFilters.push(
            Prisma.sql`("customData"->>${Prisma.raw(`'${field.name}'`)})::NUMERIC <= ${Number(maxValue)}`,
          );
        }
        break;

      case "DATE":
      case "DATETIME":
        if (minValue) {
          customFilters.push(
            Prisma.sql`("customData"->>${Prisma.raw(`'${field.name}'`)})::DATE >= ${minValue}::DATE`,
          );
        }
        if (maxValue) {
          customFilters.push(
            Prisma.sql`("customData"->>${Prisma.raw(`'${field.name}'`)})::DATE <= ${maxValue}::DATE`,
          );
        }
        break;

      case "BOOLEAN":
        if (value) {
          customFilters.push(
            Prisma.sql`("customData"->>${Prisma.raw(`'${field.name}'`)})::BOOLEAN = ${value === "true"}`,
          );
        }
        break;

      case "ENUM":
        if (value) {
          customFilters.push(
            Prisma.sql`"customData"->>${Prisma.raw(`'${field.name}'`)} = ${value}`,
          );
        }
        if (multiValue) {
          const values = multiValue.split(",");
          customFilters.push(
            Prisma.sql`"customData"->>${Prisma.raw(`'${field.name}'`)} = ANY(${values})`,
          );
        }
        break;

      case "MULTI_ENUM":
        if (value) {
          // Check if JSONB array contains a value
          customFilters.push(
            Prisma.sql`"customData"->${Prisma.raw(`'${field.name}'`)} @> ${`["${value}"]`}::jsonb`,
          );
        }
        break;

      case "COUNTRY":
        if (value) {
          customFilters.push(
            Prisma.sql`"customData"->>${Prisma.raw(`'${field.name}'`)} = ${value}`,
          );
        }
        if (multiValue) {
          const countries = multiValue.split(",");
          customFilters.push(
            Prisma.sql`"customData"->>${Prisma.raw(`'${field.name}'`)} = ANY(${countries})`,
          );
        }
        break;
    }
  }

  // Build ORDER BY clause for custom field sorting
  let orderByClause = Prisma.sql`ORDER BY "createdAt" DESC`;
  if (sortField?.startsWith("cf_")) {
    const fieldName = sortField.replace("cf_", "");
    const fieldDef = fieldDefinitions.find((f) => f.name === fieldName);
    if (fieldDef) {
      const cast = getCastForType(fieldDef.dataType);
      const dir = sortDirection === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
      orderByClause = Prisma.sql`ORDER BY ("customData"->>${Prisma.raw(`'${fieldName}'`)})${Prisma.raw(cast)} ${dir} NULLS LAST`;
    }
  }

  const offset = (page - 1) * pageSize;

  if (customFilters.length === 0) {
    // No custom filters, use standard Prisma query
    const [data, total] = await Promise.all([
      prisma.participant.findMany({
        where: baseWhere,
        skip: offset,
        take: pageSize,
        orderBy:
          sortField && !sortField.startsWith("cf_")
            ? { [sortField]: sortDirection }
            : { createdAt: "desc" },
      }),
      prisma.participant.count({ where: baseWhere }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: offset + data.length < total,
    };
  }

  // Hybrid query: Prisma where + raw JSONB filters
  const customWhereSql = Prisma.sql`AND ${Prisma.join(customFilters, " AND ")}`;

  const [data, countResult] = await Promise.all([
    prisma.$queryRaw`
      SELECT * FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND "deletedAt" IS NULL
        ${customWhereSql}
      ${orderByClause}
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND "deletedAt" IS NULL
        ${customWhereSql}
    `,
  ]);

  const total = Number(countResult[0].count);

  return {
    data: data as any[],
    total,
    page,
    pageSize,
    hasMore: offset + (data as any[]).length < total,
  };
}

function getCastForType(dataType: string): string {
  switch (dataType) {
    case "NUMBER":
      return "::NUMERIC";
    case "BOOLEAN":
      return "::BOOLEAN";
    case "DATE":
      return "::DATE";
    case "DATETIME":
      return "::TIMESTAMPTZ";
    default:
      return "";
  }
}
```

### 5.4 Dynamic Index Management

When a field is marked `isSearchable`, auto-create expression indexes:

```typescript
export async function ensureCustomFieldIndex(field: FieldDef) {
  if (!field.isSearchable) return;

  const indexName = `idx_participant_cf_${field.name}`;
  const cast = getCastForType(field.dataType);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "${indexName}"
    ON "Participant" ((("customData"->>'${field.name}')${cast}))
    WHERE "deletedAt" IS NULL
  `);
}
```

**Extended index manager with full lifecycle:**

```typescript
// app/services/schema-engine/index-manager.server.ts

import { prisma } from "~/utils/db.server";
import type { FieldDef } from "~/types/schema-engine";

interface IndexInfo {
  indexName: string;
  tableName: string;
  expression: string;
  size: string;
  isValid: boolean;
  createdAt?: Date;
}

export async function ensureCustomFieldIndex(field: FieldDef): Promise<void> {
  if (!field.isSearchable && !field.isFilterable) return;

  const tableName = field.targetModel === "Participant" ? "Participant" : "CustomObjectRecord";
  const jsonColumn = field.targetModel === "Participant" ? "customData" : "data";
  const indexName = `idx_${tableName.toLowerCase()}_cf_${field.name}`;
  const cast = getCastForType(field.dataType);

  // Check if index already exists
  const existing = await prisma.$queryRaw<any[]>`
    SELECT indexname FROM pg_indexes
    WHERE tablename = ${tableName}
      AND indexname = ${indexName}
  `;

  if (existing.length > 0) return;

  // Create index concurrently to avoid table locks
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "${indexName}"
      ON "${tableName}" ((("${jsonColumn}"->>'${field.name}')${cast}))
      WHERE "deletedAt" IS NULL
    `);

    console.log(`[IndexManager] Created index ${indexName} on ${tableName}`);
  } catch (error) {
    console.error(`[IndexManager] Failed to create index ${indexName}:`, error);
    // Index creation failure is non-fatal; queries will work without it
  }
}

export async function removeCustomFieldIndex(field: FieldDef): Promise<void> {
  const tableName = field.targetModel === "Participant" ? "Participant" : "CustomObjectRecord";
  const indexName = `idx_${tableName.toLowerCase()}_cf_${field.name}`;

  try {
    await prisma.$executeRawUnsafe(`DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`);
    console.log(`[IndexManager] Dropped index ${indexName}`);
  } catch (error) {
    console.error(`[IndexManager] Failed to drop index ${indexName}:`, error);
  }
}

export async function rebuildCustomFieldIndex(field: FieldDef): Promise<void> {
  await removeCustomFieldIndex(field);
  await ensureCustomFieldIndex(field);
}

export async function listCustomFieldIndexes(tenantId: string): Promise<IndexInfo[]> {
  const indexes = await prisma.$queryRaw<any[]>`
    SELECT
      i.indexname as "indexName",
      i.tablename as "tableName",
      pg_get_indexdef(c.oid) as expression,
      pg_size_pretty(pg_relation_size(c.oid)) as size,
      i.indexname NOT IN (
        SELECT indexrelid::regclass::text
        FROM pg_index WHERE NOT indisvalid
      ) as "isValid"
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    WHERE i.indexname LIKE 'idx_%_cf_%'
      AND i.schemaname = 'public'
    ORDER BY i.indexname
  `;

  return indexes as IndexInfo[];
}

export async function getIndexHealth(): Promise<{
  totalIndexes: number;
  validIndexes: number;
  invalidIndexes: number;
  totalSize: string;
  indexes: IndexInfo[];
}> {
  const indexes = await listCustomFieldIndexes("");

  return {
    totalIndexes: indexes.length,
    validIndexes: indexes.filter((i) => i.isValid).length,
    invalidIndexes: indexes.filter((i) => !i.isValid).length,
    totalSize: "N/A", // computed from sum
    indexes,
  };
}
```

### 5.5 Formula Field Evaluation Engine

Formula fields compute values from other fields at read time. The engine supports arithmetic, string operations, conditionals, and date functions.

```typescript
// app/services/schema-engine/formula-engine.server.ts

type FormulaValue = string | number | boolean | Date | null;

interface FormulaContext {
  fields: Record<string, FormulaValue>;
  tenantId: string;
  eventId?: string;
}

// Supported formula operations
type FormulaNode =
  | { type: "literal"; value: FormulaValue }
  | { type: "field_ref"; name: string }
  | {
      type: "binary_op";
      op: "+" | "-" | "*" | "/" | "&&" | "||" | "==" | "!=" | ">" | "<" | ">=" | "<=";
      left: FormulaNode;
      right: FormulaNode;
    }
  | { type: "unary_op"; op: "!" | "-"; operand: FormulaNode }
  | { type: "function"; name: string; args: FormulaNode[] }
  | { type: "conditional"; condition: FormulaNode; then: FormulaNode; else: FormulaNode };

export class FormulaEngine {
  private maxDepth = 10; // prevent deeply nested formulas
  private maxOperations = 100; // prevent runaway computations

  evaluate(expression: string, context: FormulaContext): FormulaValue {
    const ast = this.parse(expression);
    return this.evalNode(ast, context, 0, { count: 0 });
  }

  private parse(expression: string): FormulaNode {
    // Tokenize and parse the expression into an AST
    const tokens = this.tokenize(expression);
    return this.parseExpression(tokens, 0).node;
  }

  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
      if (/\s/.test(expr[i])) {
        i++;
        continue;
      }

      // Numbers
      if (/\d/.test(expr[i]) || (expr[i] === "." && /\d/.test(expr[i + 1]))) {
        let num = "";
        while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
          num += expr[i++];
        }
        tokens.push(num);
        continue;
      }

      // Strings
      if (expr[i] === '"' || expr[i] === "'") {
        const quote = expr[i];
        let str = "";
        i++;
        while (i < expr.length && expr[i] !== quote) {
          str += expr[i++];
        }
        i++; // closing quote
        tokens.push(`"${str}"`);
        continue;
      }

      // Field references: {field_name}
      if (expr[i] === "{") {
        let ref = "";
        i++;
        while (i < expr.length && expr[i] !== "}") {
          ref += expr[i++];
        }
        i++; // closing brace
        tokens.push(`{${ref}}`);
        continue;
      }

      // Operators and identifiers
      if (/[a-zA-Z_]/.test(expr[i])) {
        let id = "";
        while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
          id += expr[i++];
        }
        tokens.push(id);
        continue;
      }

      // Two-character operators
      if (i + 1 < expr.length) {
        const two = expr[i] + expr[i + 1];
        if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
          tokens.push(two);
          i += 2;
          continue;
        }
      }

      // Single-character operators
      tokens.push(expr[i]);
      i++;
    }
    return tokens;
  }

  private parseExpression(tokens: string[], pos: number): { node: FormulaNode; pos: number } {
    // Simplified recursive descent parser
    // Production: production handles operator precedence
    return this.parseOr(tokens, pos);
  }

  private parseOr(tokens: string[], pos: number): { node: FormulaNode; pos: number } {
    let result = this.parseAnd(tokens, pos);
    while (result.pos < tokens.length && tokens[result.pos] === "||") {
      const right = this.parseAnd(tokens, result.pos + 1);
      result = {
        node: { type: "binary_op", op: "||", left: result.node, right: right.node },
        pos: right.pos,
      };
    }
    return result;
  }

  private parseAnd(tokens: string[], pos: number): { node: FormulaNode; pos: number } {
    let result = this.parseComparison(tokens, pos);
    while (result.pos < tokens.length && tokens[result.pos] === "&&") {
      const right = this.parseComparison(tokens, result.pos + 1);
      result = {
        node: { type: "binary_op", op: "&&", left: result.node, right: right.node },
        pos: right.pos,
      };
    }
    return result;
  }

  private parseComparison(tokens: string[], pos: number): { node: FormulaNode; pos: number } {
    let result = this.parseAddSub(tokens, pos);
    const compOps = ["==", "!=", ">", "<", ">=", "<="];
    while (result.pos < tokens.length && compOps.includes(tokens[result.pos])) {
      const op = tokens[result.pos] as any;
      const right = this.parseAddSub(tokens, result.pos + 1);
      result = {
        node: { type: "binary_op", op, left: result.node, right: right.node },
        pos: right.pos,
      };
    }
    return result;
  }

  private parseAddSub(tokens: string[], pos: number): { node: FormulaNode; pos: number } {
    let result = this.parseMulDiv(tokens, pos);
    while (result.pos < tokens.length && ["+", "-"].includes(tokens[result.pos])) {
      const op = tokens[result.pos] as "+" | "-";
      const right = this.parseMulDiv(tokens, result.pos + 1);
      result = {
        node: { type: "binary_op", op, left: result.node, right: right.node },
        pos: right.pos,
      };
    }
    return result;
  }

  private parseMulDiv(tokens: string[], pos: number): { node: FormulaNode; pos: number } {
    let result = this.parsePrimary(tokens, pos);
    while (result.pos < tokens.length && ["*", "/"].includes(tokens[result.pos])) {
      const op = tokens[result.pos] as "*" | "/";
      const right = this.parsePrimary(tokens, result.pos + 1);
      result = {
        node: { type: "binary_op", op, left: result.node, right: right.node },
        pos: right.pos,
      };
    }
    return result;
  }

  private parsePrimary(tokens: string[], pos: number): { node: FormulaNode; pos: number } {
    const token = tokens[pos];

    // Field reference
    if (token?.startsWith("{") && token.endsWith("}")) {
      return {
        node: { type: "field_ref", name: token.slice(1, -1) },
        pos: pos + 1,
      };
    }

    // Number literal
    if (/^\d/.test(token)) {
      return {
        node: { type: "literal", value: parseFloat(token) },
        pos: pos + 1,
      };
    }

    // String literal
    if (token?.startsWith('"')) {
      return {
        node: { type: "literal", value: token.slice(1, -1) },
        pos: pos + 1,
      };
    }

    // Boolean literals
    if (token === "true" || token === "false") {
      return {
        node: { type: "literal", value: token === "true" },
        pos: pos + 1,
      };
    }

    // null literal
    if (token === "null") {
      return {
        node: { type: "literal", value: null },
        pos: pos + 1,
      };
    }

    // Function call: FUNC_NAME(args)
    if (/^[A-Z_]+$/.test(token) && tokens[pos + 1] === "(") {
      const args: FormulaNode[] = [];
      let p = pos + 2; // skip name and '('
      while (tokens[p] !== ")") {
        if (tokens[p] === ",") {
          p++;
          continue;
        }
        const arg = this.parseExpression(tokens, p);
        args.push(arg.node);
        p = arg.pos;
      }
      return {
        node: { type: "function", name: token, args },
        pos: p + 1, // skip ')'
      };
    }

    // Parenthesized expression
    if (token === "(") {
      const inner = this.parseExpression(tokens, pos + 1);
      return { node: inner.node, pos: inner.pos + 1 }; // skip ')'
    }

    // Unary operators
    if (token === "!" || token === "-") {
      const operand = this.parsePrimary(tokens, pos + 1);
      return {
        node: { type: "unary_op", op: token as "!" | "-", operand: operand.node },
        pos: operand.pos,
      };
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  private evalNode(
    node: FormulaNode,
    context: FormulaContext,
    depth: number,
    ops: { count: number },
  ): FormulaValue {
    if (depth > this.maxDepth) throw new Error("Formula too deeply nested");
    if (ops.count++ > this.maxOperations) throw new Error("Formula too complex");

    switch (node.type) {
      case "literal":
        return node.value;

      case "field_ref":
        return context.fields[node.name] ?? null;

      case "binary_op": {
        const left = this.evalNode(node.left, context, depth + 1, ops);
        const right = this.evalNode(node.right, context, depth + 1, ops);
        return this.evalBinaryOp(node.op, left, right);
      }

      case "unary_op": {
        const operand = this.evalNode(node.operand, context, depth + 1, ops);
        if (node.op === "!") return !operand;
        if (node.op === "-") return -(operand as number);
        return null;
      }

      case "function":
        return this.evalFunction(
          node.name,
          node.args.map((a) => this.evalNode(a, context, depth + 1, ops)),
        );

      case "conditional": {
        const cond = this.evalNode(node.condition, context, depth + 1, ops);
        return cond
          ? this.evalNode(node.then, context, depth + 1, ops)
          : this.evalNode(node.else, context, depth + 1, ops);
      }

      default:
        return null;
    }
  }

  private evalBinaryOp(op: string, left: FormulaValue, right: FormulaValue): FormulaValue {
    switch (op) {
      case "+":
        if (typeof left === "string" || typeof right === "string") {
          return `${left ?? ""}${right ?? ""}`;
        }
        return (left as number) + (right as number);
      case "-":
        return (left as number) - (right as number);
      case "*":
        return (left as number) * (right as number);
      case "/":
        if (right === 0) throw new Error("Division by zero");
        return (left as number) / (right as number);
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case ">":
        return (left as number) > (right as number);
      case "<":
        return (left as number) < (right as number);
      case ">=":
        return (left as number) >= (right as number);
      case "<=":
        return (left as number) <= (right as number);
      case "&&":
        return !!(left && right);
      case "||":
        return !!(left || right);
      default:
        return null;
    }
  }

  private evalFunction(name: string, args: FormulaValue[]): FormulaValue {
    switch (name) {
      case "CONCAT":
        return args.map((a) => a ?? "").join("");
      case "UPPER":
        return String(args[0] ?? "").toUpperCase();
      case "LOWER":
        return String(args[0] ?? "").toLowerCase();
      case "TRIM":
        return String(args[0] ?? "").trim();
      case "LEN":
        return String(args[0] ?? "").length;
      case "ABS":
        return Math.abs(args[0] as number);
      case "ROUND":
        return Math.round(args[0] as number);
      case "FLOOR":
        return Math.floor(args[0] as number);
      case "CEIL":
        return Math.ceil(args[0] as number);
      case "MIN":
        return Math.min(...(args.filter((a) => typeof a === "number") as number[]));
      case "MAX":
        return Math.max(...(args.filter((a) => typeof a === "number") as number[]));
      case "IF":
        return args[0] ? args[1] : args[2];
      case "COALESCE":
        return args.find((a) => a !== null && a !== undefined) ?? null;
      case "NOW":
        return new Date().toISOString();
      case "TODAY":
        return new Date().toISOString().split("T")[0];
      case "YEAR":
        return new Date(args[0] as string).getFullYear();
      case "MONTH":
        return new Date(args[0] as string).getMonth() + 1;
      case "DAY":
        return new Date(args[0] as string).getDate();
      case "DATEDIFF": {
        const d1 = new Date(args[0] as string);
        const d2 = new Date(args[1] as string);
        return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      }
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }
}

// Singleton instance
export const formulaEngine = new FormulaEngine();

// Usage example:
// formulaEngine.evaluate(
//   '{price} * {quantity} * (1 - {discount_pct} / 100)',
//   { fields: { price: 100, quantity: 5, discount_pct: 10 }, tenantId: '...' }
// )
// Returns: 450
```

### 5.6 Field Dependency Graph Resolution

Formula fields and conditional requirements create dependencies between fields. The dependency graph ensures correct evaluation order and detects cycles.

```typescript
// app/services/schema-engine/dependency-graph.server.ts

interface DependencyNode {
  fieldName: string;
  dependsOn: Set<string>;
  dependedBy: Set<string>;
}

export class FieldDependencyGraph {
  private nodes = new Map<string, DependencyNode>();

  addField(fieldName: string, dependencies: string[]): void {
    if (!this.nodes.has(fieldName)) {
      this.nodes.set(fieldName, {
        fieldName,
        dependsOn: new Set(),
        dependedBy: new Set(),
      });
    }

    const node = this.nodes.get(fieldName)!;
    for (const dep of dependencies) {
      node.dependsOn.add(dep);

      if (!this.nodes.has(dep)) {
        this.nodes.set(dep, {
          fieldName: dep,
          dependsOn: new Set(),
          dependedBy: new Set(),
        });
      }
      this.nodes.get(dep)!.dependedBy.add(fieldName);
    }
  }

  /**
   * Returns fields in topological order (dependencies first)
   * Throws if circular dependency detected
   */
  getEvaluationOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>(); // for cycle detection
    const order: string[] = [];

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        const cycle = Array.from(visiting).join(" -> ") + " -> " + name;
        throw new Error(`Circular dependency detected: ${cycle}`);
      }

      visiting.add(name);
      const node = this.nodes.get(name);
      if (node) {
        for (const dep of node.dependsOn) {
          visit(dep);
        }
      }
      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of this.nodes.keys()) {
      visit(name);
    }

    return order;
  }

  /**
   * Returns all fields that transitively depend on the given field
   */
  getAffectedFields(fieldName: string): string[] {
    const affected = new Set<string>();
    const queue = [fieldName];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.nodes.get(current);
      if (!node) continue;

      for (const dep of node.dependedBy) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }

    return Array.from(affected);
  }

  /**
   * Validates that adding a dependency would not create a cycle
   */
  wouldCreateCycle(fieldName: string, newDependency: string): boolean {
    // Check if newDependency transitively depends on fieldName
    const visited = new Set<string>();
    const queue = [newDependency];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === fieldName) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.nodes.get(current);
      if (node) {
        for (const dep of node.dependsOn) {
          queue.push(dep);
        }
      }
    }

    return false;
  }
}

export function buildDependencyGraph(fieldDefs: FieldDef[]): FieldDependencyGraph {
  const graph = new FieldDependencyGraph();

  for (const field of fieldDefs) {
    const dependencies: string[] = [];

    // Formula fields depend on referenced fields
    if (field.dataType === "FORMULA") {
      const config = field.config as { dependencies?: string[] };
      if (config.dependencies) {
        dependencies.push(...config.dependencies);
      }
    }

    // Fields with requiredIf depend on the condition field
    for (const rule of field.validation || []) {
      if (rule.rule === "requiredIf" && typeof rule.value === "string") {
        dependencies.push(rule.value);
      }
      if (rule.rule === "requiredIf" && typeof (rule as any).field === "string") {
        dependencies.push((rule as any).field);
      }
    }

    graph.addField(field.name, dependencies);
  }

  return graph;
}
```

### 5.7 Computed Field Cache Invalidation

```typescript
// app/services/schema-engine/computed-cache.server.ts

import { LRUCache } from "lru-cache";
import { formulaEngine } from "./formula-engine.server";
import { buildDependencyGraph } from "./dependency-graph.server";
import type { FieldDef } from "~/types/schema-engine";

const computedCache = new LRUCache<string, Record<string, any>>({
  max: 10000,
  ttl: 1000 * 60 * 2, // 2 minute TTL
});

function buildComputedCacheKey(recordId: string, fieldName: string): string {
  return `${recordId}:${fieldName}`;
}

export async function evaluateComputedFields(
  recordId: string,
  recordData: Record<string, any>,
  fieldDefs: FieldDef[],
): Promise<Record<string, any>> {
  const formulaFields = fieldDefs.filter((f) => f.dataType === "FORMULA");
  if (formulaFields.length === 0) return recordData;

  const graph = buildDependencyGraph(fieldDefs);
  const evalOrder = graph.getEvaluationOrder();
  const result = { ...recordData };

  for (const fieldName of evalOrder) {
    const fieldDef = formulaFields.find((f) => f.name === fieldName);
    if (!fieldDef) continue;

    const cacheKey = buildComputedCacheKey(recordId, fieldName);
    const cached = computedCache.get(cacheKey);
    if (cached !== undefined) {
      result[fieldName] = cached;
      continue;
    }

    const config = fieldDef.config as { expression: string };
    try {
      const value = formulaEngine.evaluate(config.expression, {
        fields: result,
        tenantId: "", // populated from context
      });
      result[fieldName] = value;
      computedCache.set(cacheKey, value);
    } catch (error) {
      console.error(`Formula evaluation failed for ${fieldName}:`, error);
      result[fieldName] = null;
    }
  }

  return result;
}

export function invalidateComputedFields(
  recordId: string,
  changedFieldNames: string[],
  fieldDefs: FieldDef[],
): void {
  const graph = buildDependencyGraph(fieldDefs);

  for (const fieldName of changedFieldNames) {
    const affected = graph.getAffectedFields(fieldName);
    for (const affectedField of affected) {
      computedCache.delete(buildComputedCacheKey(recordId, affectedField));
    }
  }
}
```

### 5.8 Bulk Field Operations

```typescript
// app/services/schema-engine/bulk-operations.server.ts

import { prisma } from "~/utils/db.server";
import { onFieldDefChanged } from "./cache-invalidation.server";
import { ensureCustomFieldIndex, removeCustomFieldIndex } from "./index-manager.server";
import type { FieldDef } from "~/types/schema-engine";

interface BulkCreateResult {
  created: number;
  errors: Array<{ name: string; error: string }>;
}

export async function bulkCreateFields(
  tenantId: string,
  fields: Array<Omit<FieldDef, "id" | "tenantId" | "createdAt" | "updatedAt">>,
  maxBatchSize = 50,
): Promise<BulkCreateResult> {
  if (fields.length > maxBatchSize) {
    throw new Error(`Batch size exceeds maximum of ${maxBatchSize}`);
  }

  const errors: Array<{ name: string; error: string }> = [];
  const toCreate: any[] = [];

  // Validate all fields first
  for (const field of fields) {
    try {
      validateFieldName(field.name);
      validateFieldConfig(field.dataType as any, field.config);
      toCreate.push({ ...field, tenantId });
    } catch (error) {
      errors.push({ name: field.name, error: (error as Error).message });
    }
  }

  // Batch create in transaction
  if (toCreate.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const field of toCreate) {
        await tx.fieldDefinition.create({ data: field });
      }
    });

    // Create indexes for searchable fields
    for (const field of toCreate) {
      if (field.isSearchable) {
        await ensureCustomFieldIndex(field);
      }
    }

    // Invalidate cache once for the batch
    await onFieldDefChanged({
      type: "CREATED",
      fieldDef: {
        tenantId,
        targetModel: toCreate[0]?.targetModel ?? null,
        customObjectDefId: toCreate[0]?.customObjectDefId ?? null,
        eventId: toCreate[0]?.eventId ?? null,
      },
    });
  }

  return {
    created: toCreate.length,
    errors,
  };
}

export async function bulkDeleteFields(
  tenantId: string,
  fieldIds: string[],
  force = false,
): Promise<{
  deleted: number;
  skipped: Array<{ fieldId: string; reason: string }>;
}> {
  const skipped: Array<{ fieldId: string; reason: string }> = [];
  const toDelete: string[] = [];

  for (const fieldId of fieldIds) {
    if (!force) {
      const { canDelete, reason } = await canDeleteField(fieldId, tenantId);
      if (!canDelete) {
        skipped.push({ fieldId, reason: reason! });
        continue;
      }
    }
    toDelete.push(fieldId);
  }

  if (toDelete.length > 0) {
    // Remove indexes first
    const fields = await prisma.fieldDefinition.findMany({
      where: { id: { in: toDelete }, tenantId },
    });

    for (const field of fields) {
      if (field.isSearchable) {
        await removeCustomFieldIndex(field as any);
      }
    }

    // Batch delete
    await prisma.fieldDefinition.deleteMany({
      where: { id: { in: toDelete }, tenantId },
    });

    await onFieldDefChanged({
      type: "DELETED",
      fieldDef: {
        tenantId,
        targetModel: null,
        customObjectDefId: null,
        eventId: null,
      },
    });
  }

  return { deleted: toDelete.length, skipped };
}

function validateFieldName(name: string): void {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid field name: "${name}". Must be snake_case starting with a letter.`);
  }
  if (name.length > 64) {
    throw new Error(`Field name too long: max 64 characters`);
  }
  // Reserved names
  const reserved = ["id", "tenant_id", "created_at", "updated_at", "deleted_at", "custom_data"];
  if (reserved.includes(name)) {
    throw new Error(`Field name "${name}" is reserved`);
  }
}

function validateFieldConfig(dataType: string, config: Record<string, any>): void {
  switch (dataType) {
    case "ENUM":
    case "MULTI_ENUM":
      if (!config.options || !Array.isArray(config.options) || config.options.length === 0) {
        throw new Error(`${dataType} fields must have at least one option`);
      }
      for (const opt of config.options) {
        if (!opt.value || !opt.label) {
          throw new Error("Each option must have a value and label");
        }
      }
      break;
    case "NUMBER":
      if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
        throw new Error("min cannot be greater than max");
      }
      break;
    case "REFERENCE":
      if (!config.targetObjectSlug) {
        throw new Error("REFERENCE fields must specify targetObjectSlug");
      }
      break;
    case "FORMULA":
      if (!config.expression) {
        throw new Error("FORMULA fields must specify an expression");
      }
      break;
  }
}
```

### 5.9 Data Migration on Type Change

When a field's data type changes (e.g., TEXT to NUMBER), existing data must be transformed.

```typescript
// app/services/schema-engine/type-migration.server.ts

import { prisma } from "~/utils/db.server";
import { rebuildCustomFieldIndex } from "./index-manager.server";
import type { FieldDef } from "~/types/schema-engine";

interface MigrationResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  failures: Array<{
    recordId: string;
    oldValue: any;
    error: string;
  }>;
}

export async function migrateFieldType(params: {
  field: FieldDef;
  newDataType: string;
  transformRule: "CAST" | "TRUNCATE" | "DEFAULT" | "CUSTOM";
  defaultValue?: any;
  customTransform?: string;
  dryRun?: boolean;
  batchSize?: number;
}): Promise<MigrationResult> {
  const {
    field,
    newDataType,
    transformRule,
    defaultValue,
    dryRun = false,
    batchSize = 1000,
  } = params;

  const tableName = field.targetModel === "Participant" ? "Participant" : "CustomObjectRecord";
  const jsonColumn = field.targetModel === "Participant" ? "customData" : "data";

  // Fetch all records with this field
  const records = await prisma.$queryRaw<any[]>`
    SELECT id, "${Prisma.raw(jsonColumn)}" as data
    FROM "${Prisma.raw(tableName)}"
    WHERE "tenantId" = ${field.tenantId}
      AND "${Prisma.raw(jsonColumn)}" ? ${field.name}
      AND "deletedAt" IS NULL
  `;

  const failures: MigrationResult["failures"] = [];
  let successCount = 0;
  const updates: Array<{ id: string; newValue: any }> = [];

  for (const record of records) {
    const oldValue = record.data[field.name];

    try {
      const newValue = transformValue(
        oldValue,
        field.dataType,
        newDataType,
        transformRule,
        defaultValue,
      );
      updates.push({ id: record.id, newValue });
      successCount++;
    } catch (error) {
      failures.push({
        recordId: record.id,
        oldValue,
        error: (error as Error).message,
      });
    }
  }

  // Apply updates in batches (unless dry run)
  if (!dryRun && updates.length > 0) {
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map(
          ({ id, newValue }) =>
            prisma.$executeRaw`
            UPDATE "${Prisma.raw(tableName)}"
            SET "${Prisma.raw(jsonColumn)}" = jsonb_set(
              "${Prisma.raw(jsonColumn)}",
              ${`{${field.name}}`}::text[],
              ${JSON.stringify(newValue)}::jsonb
            )
            WHERE id = ${id}
          `,
        ),
      );
    }

    // Rebuild index with new type
    if (field.isSearchable) {
      await rebuildCustomFieldIndex({
        ...field,
        dataType: newDataType as any,
      });
    }
  }

  return {
    totalRecords: records.length,
    successCount,
    failureCount: failures.length,
    failures,
  };
}

function transformValue(
  value: any,
  fromType: string,
  toType: string,
  rule: string,
  defaultValue?: any,
): any {
  if (value === null || value === undefined) {
    return defaultValue ?? null;
  }

  try {
    switch (`${fromType}->${toType}`) {
      case "TEXT->NUMBER": {
        const num = Number(value);
        if (isNaN(num)) {
          if (rule === "DEFAULT") return defaultValue ?? 0;
          throw new Error(`Cannot convert "${value}" to number`);
        }
        return num;
      }
      case "TEXT->BOOLEAN":
        return ["true", "1", "yes"].includes(String(value).toLowerCase());
      case "TEXT->DATE":
      case "TEXT->DATETIME": {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          if (rule === "DEFAULT") return defaultValue;
          throw new Error(`Cannot convert "${value}" to date`);
        }
        return d.toISOString();
      }
      case "TEXT->ENUM": {
        if (rule === "TRUNCATE") return value;
        return value;
      }
      case "NUMBER->TEXT":
        return String(value);
      case "NUMBER->BOOLEAN":
        return value !== 0;
      case "BOOLEAN->TEXT":
        return String(value);
      case "BOOLEAN->NUMBER":
        return value ? 1 : 0;
      case "DATE->DATETIME":
        return new Date(value).toISOString();
      case "DATETIME->DATE":
        return new Date(value).toISOString().split("T")[0];
      case "ENUM->TEXT":
        return String(value);
      case "ENUM->MULTI_ENUM":
        return [value];
      case "MULTI_ENUM->ENUM":
        return Array.isArray(value) ? value[0] : value;
      case "TEXT->LONG_TEXT":
      case "LONG_TEXT->TEXT": {
        if (rule === "TRUNCATE" && typeof value === "string") {
          return value.substring(0, 255);
        }
        return value;
      }
      default:
        if (rule === "DEFAULT") return defaultValue;
        throw new Error(`No conversion path from ${fromType} to ${toType}`);
    }
  } catch (error) {
    if (rule === "DEFAULT") return defaultValue;
    throw error;
  }
}
```

### 5.10 JSONB Query Optimization Patterns

```typescript
// app/services/schema-engine/query-optimization.server.ts

/**
 * JSONB query optimization patterns for PostgreSQL.
 *
 * Pattern 1: Expression index for equality/range queries
 *   CREATE INDEX idx ON "Participant" ((("customData"->>'field')::TYPE))
 *   Best for: exact match, range queries on specific fields
 *
 * Pattern 2: GIN index for containment queries
 *   CREATE INDEX idx ON "Participant" USING GIN ("customData")
 *   Best for: key existence, multi-enum containment
 *
 * Pattern 3: GIN trigram index for text search
 *   CREATE INDEX idx ON "Participant" USING GIN ((("customData"->>'field') gin_trgm_ops))
 *   Best for: ILIKE text search patterns
 *
 * Pattern 4: Partial index for specific values
 *   CREATE INDEX idx ON "Participant" ((("customData"->>'status')))
 *   WHERE ("customData"->>'status') = 'active'
 *   Best for: fields with skewed distribution
 */

export function getOptimalIndexStrategy(
  field: FieldDef,
  queryPatterns: string[],
): { indexType: string; ddl: string; explanation: string } {
  const tableName = field.targetModel ?? "CustomObjectRecord";
  const jsonCol = field.targetModel === "Participant" ? "customData" : "data";
  const indexName = `idx_${tableName.toLowerCase()}_cf_${field.name}`;

  // MULTI_ENUM: use GIN containment index
  if (field.dataType === "MULTI_ENUM") {
    return {
      indexType: "GIN",
      ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${indexName}"
  ON "${tableName}" USING GIN (("${jsonCol}"->'${field.name}'))
  WHERE "deletedAt" IS NULL`,
      explanation: "GIN index on JSONB array for @> containment queries",
    };
  }

  // TEXT with ILIKE patterns: use GIN trigram
  if (
    (field.dataType === "TEXT" || field.dataType === "LONG_TEXT") &&
    queryPatterns.includes("ILIKE")
  ) {
    return {
      indexType: "GIN_TRGM",
      ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${indexName}"
  ON "${tableName}" USING GIN (("${jsonCol}"->>'${field.name}') gin_trgm_ops)
  WHERE "deletedAt" IS NULL`,
      explanation: "GIN trigram index for case-insensitive text search (ILIKE)",
    };
  }

  // Default: expression index with type cast
  const cast = getCastForType(field.dataType);
  return {
    indexType: "BTREE_EXPRESSION",
    ddl: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${indexName}"
  ON "${tableName}" ((("${jsonCol}"->>'${field.name}')${cast}))
  WHERE "deletedAt" IS NULL`,
    explanation: `B-tree expression index for equality and range queries with ${cast || "TEXT"} cast`,
  };
}

function getCastForType(dataType: string): string {
  switch (dataType) {
    case "NUMBER":
      return "::NUMERIC";
    case "BOOLEAN":
      return "::BOOLEAN";
    case "DATE":
      return "::DATE";
    case "DATETIME":
      return "::TIMESTAMPTZ";
    default:
      return "";
  }
}
```

### 5.11 Expression Index Lifecycle

```typescript
// app/services/schema-engine/index-lifecycle.server.ts

import { prisma } from "~/utils/db.server";
import { getOptimalIndexStrategy } from "./query-optimization.server";

interface IndexLifecycleEvent {
  type: "CREATED" | "REBUILT" | "DROPPED" | "VALIDATED" | "INVALID";
  indexName: string;
  fieldName: string;
  timestamp: Date;
  duration?: number;
  error?: string;
}

const indexEventLog: IndexLifecycleEvent[] = [];

export async function manageIndexLifecycle(
  field: FieldDef,
  action: "CREATE" | "DROP" | "REBUILD" | "VALIDATE",
): Promise<IndexLifecycleEvent> {
  const startTime = Date.now();
  const strategy = getOptimalIndexStrategy(field, []);
  const indexName = `idx_${(field.targetModel ?? "customobjectrecord").toLowerCase()}_cf_${field.name}`;

  let event: IndexLifecycleEvent;

  try {
    switch (action) {
      case "CREATE":
        await prisma.$executeRawUnsafe(strategy.ddl);
        event = {
          type: "CREATED",
          indexName,
          fieldName: field.name,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        break;

      case "DROP":
        await prisma.$executeRawUnsafe(`DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`);
        event = {
          type: "DROPPED",
          indexName,
          fieldName: field.name,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        break;

      case "REBUILD":
        await prisma.$executeRawUnsafe(`DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`);
        await prisma.$executeRawUnsafe(strategy.ddl);
        event = {
          type: "REBUILT",
          indexName,
          fieldName: field.name,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        break;

      case "VALIDATE": {
        const result = await prisma.$queryRaw<any[]>`
          SELECT indisvalid FROM pg_index
          JOIN pg_class ON pg_class.oid = pg_index.indexrelid
          WHERE pg_class.relname = ${indexName}
        `;
        const isValid = result.length > 0 && result[0].indisvalid;
        event = {
          type: isValid ? "VALIDATED" : "INVALID",
          indexName,
          fieldName: field.name,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        break;
      }
    }
  } catch (error) {
    event = {
      type: "INVALID",
      indexName,
      fieldName: field.name,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      error: (error as Error).message,
    };
  }

  indexEventLog.push(event);
  return event;
}
```

### 5.12 Field Validation Pipeline

```typescript
// app/services/schema-engine/validation-pipeline.server.ts

import { z } from "zod";
import { buildCustomDataSchema } from "~/utils/fields.server";
import { formulaEngine } from "./formula-engine.server";
import type { FieldDef } from "~/types/schema-engine";

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  transformedData: Record<string, any>;
}

export async function validateCustomData(
  data: Record<string, any>,
  fieldDefs: FieldDef[],
  context: {
    tenantId: string;
    eventId?: string;
    existingData?: Record<string, any>; // for conditional validation
  },
): Promise<ValidationResult> {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  let transformedData = { ...data };

  // Phase 1: Type validation via Zod schema
  const zodSchema = buildCustomDataSchema(fieldDefs);
  const zodResult = zodSchema.safeParse(data);
  if (!zodResult.success) {
    for (const [path, messages] of Object.entries(zodResult.error.flatten().fieldErrors)) {
      errors[path] = messages as string[];
    }
  } else {
    transformedData = zodResult.data;
  }

  // Phase 2: Cross-field validation (requiredIf, etc.)
  for (const field of fieldDefs) {
    const fieldErrors = await validateFieldRules(field, transformedData, context);
    if (fieldErrors.length > 0) {
      errors[field.name] = [...(errors[field.name] ?? []), ...fieldErrors];
    }
  }

  // Phase 3: Uniqueness validation
  for (const field of fieldDefs.filter((f) => f.isUnique)) {
    const isUnique = await checkFieldUniqueness(field, transformedData[field.name], context);
    if (!isUnique) {
      errors[field.name] = [
        ...(errors[field.name] ?? []),
        `${field.label} must be unique. This value already exists.`,
      ];
    }
  }

  // Phase 4: Apply defaults for missing optional fields
  for (const field of fieldDefs) {
    if (
      !field.isRequired &&
      field.defaultValue !== null &&
      field.defaultValue !== undefined &&
      (transformedData[field.name] === null || transformedData[field.name] === undefined)
    ) {
      transformedData[field.name] = parseDefaultValue(field);
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
    transformedData,
  };
}

async function validateFieldRules(
  field: FieldDef,
  allData: Record<string, any>,
  context: { tenantId: string; eventId?: string; existingData?: Record<string, any> },
): Promise<string[]> {
  const errors: string[] = [];

  for (const rule of field.validation || []) {
    switch (rule.rule) {
      case "requiredIf": {
        const conditionField = (rule as any).field as string;
        const conditionValue = (rule as any).value;
        const conditionFieldValue = allData[conditionField];

        const conditionMet =
          conditionValue !== undefined
            ? conditionFieldValue === conditionValue
            : !!conditionFieldValue;

        if (
          conditionMet &&
          (allData[field.name] === null ||
            allData[field.name] === undefined ||
            allData[field.name] === "")
        ) {
          errors.push(rule.message || `${field.label} is required`);
        }
        break;
      }

      case "requiredUnless": {
        const unlessField = (rule as any).field as string;
        const unlessValue = (rule as any).value;
        const unlessFieldValue = allData[unlessField];

        if (
          unlessFieldValue !== unlessValue &&
          (allData[field.name] === null ||
            allData[field.name] === undefined ||
            allData[field.name] === "")
        ) {
          errors.push(rule.message || `${field.label} is required`);
        }
        break;
      }

      case "minItems": {
        if (Array.isArray(allData[field.name])) {
          if (allData[field.name].length < (rule.value as number)) {
            errors.push(rule.message || `Select at least ${rule.value} items`);
          }
        }
        break;
      }

      case "maxItems": {
        if (Array.isArray(allData[field.name])) {
          if (allData[field.name].length > (rule.value as number)) {
            errors.push(rule.message || `Select at most ${rule.value} items`);
          }
        }
        break;
      }

      case "expression": {
        try {
          const result = formulaEngine.evaluate(rule.value as string, {
            fields: allData,
            tenantId: context.tenantId,
          });
          if (!result) {
            errors.push(rule.message || "Validation expression failed");
          }
        } catch (e) {
          // Expression evaluation error - skip this rule
        }
        break;
      }
    }
  }

  return errors;
}

async function checkFieldUniqueness(
  field: FieldDef,
  value: any,
  context: { tenantId: string; eventId?: string },
): Promise<boolean> {
  if (value === null || value === undefined || value === "") return true;

  const tableName = field.targetModel === "Participant" ? "Participant" : "CustomObjectRecord";
  const jsonCol = field.targetModel === "Participant" ? "customData" : "data";

  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "${Prisma.raw(tableName)}"
    WHERE "tenantId" = ${context.tenantId}
      AND "${Prisma.raw(jsonCol)}"->>${field.name} = ${String(value)}
      AND "deletedAt" IS NULL
  `;
  return Number(result[0].count) === 0;
}

function parseDefaultValue(field: FieldDef): any {
  if (field.defaultValue === null || field.defaultValue === undefined) return null;

  switch (field.dataType) {
    case "NUMBER":
      return Number(field.defaultValue);
    case "BOOLEAN":
      return field.defaultValue === "true";
    case "MULTI_ENUM":
      return JSON.parse(field.defaultValue);
    default:
      return field.defaultValue;
  }
}
```

### 5.13 Conditional Field Requirements

```typescript
// app/services/schema-engine/conditional-fields.server.ts

import type { FieldDef } from "~/types/schema-engine";

interface ConditionalRule {
  type: "requiredIf" | "visibleIf" | "disabledIf" | "optionsFilter";
  field: string; // the field this condition applies to
  conditionField: string; // the field whose value is evaluated
  operator: "equals" | "notEquals" | "contains" | "isSet" | "isNotSet" | "greaterThan" | "lessThan";
  value?: any; // the value to compare against
}

export function evaluateConditionalRules(
  fieldDefs: FieldDef[],
  currentData: Record<string, any>,
): Map<
  string,
  { visible: boolean; required: boolean; disabled: boolean; filteredOptions?: any[] }
> {
  const result = new Map<
    string,
    { visible: boolean; required: boolean; disabled: boolean; filteredOptions?: any[] }
  >();

  for (const field of fieldDefs) {
    let visible = true;
    let required = field.isRequired;
    let disabled = false;
    let filteredOptions: any[] | undefined;

    for (const rule of field.validation || []) {
      switch (rule.rule) {
        case "requiredIf": {
          const conditionField = (rule as any).field as string;
          const conditionValue = (rule as any).value;
          if (evaluateCondition(currentData[conditionField], "equals", conditionValue)) {
            required = true;
          }
          break;
        }
        case "visibleIf": {
          const condField = (rule as any).field as string;
          const condValue = (rule as any).value;
          const condOp = (rule as any).operator ?? "equals";
          visible = evaluateCondition(currentData[condField], condOp, condValue);
          break;
        }
        case "disabledIf": {
          const condField = (rule as any).field as string;
          const condValue = (rule as any).value;
          disabled = evaluateCondition(currentData[condField], "equals", condValue);
          break;
        }
      }
    }

    result.set(field.name, { visible, required, disabled, filteredOptions });
  }

  return result;
}

function evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === conditionValue;
    case "notEquals":
      return fieldValue !== conditionValue;
    case "contains":
      if (Array.isArray(fieldValue)) return fieldValue.includes(conditionValue);
      if (typeof fieldValue === "string") return fieldValue.includes(conditionValue);
      return false;
    case "isSet":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
    case "isNotSet":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";
    case "greaterThan":
      return Number(fieldValue) > Number(conditionValue);
    case "lessThan":
      return Number(fieldValue) < Number(conditionValue);
    default:
      return false;
  }
}
```

### 5.14 Field Inheritance

Tenant-level field defaults can be overridden at the event level or participant-type level:

```typescript
// app/services/schema-engine/field-inheritance.server.ts

import { prisma } from "~/utils/db.server";
import type { FieldDef } from "~/types/schema-engine";

/**
 * Field inheritance hierarchy:
 *
 * 1. Tenant-level (eventId=null, participantTypeId=null)
 *    Base definitions available across all events
 *
 * 2. Event-level (eventId=set, participantTypeId=null)
 *    Overrides for a specific event
 *
 * 3. Type-level (eventId=set, participantTypeId=set)
 *    Overrides for a specific participant type within an event
 *
 * More specific levels override less specific.
 * Properties are merged: event-level can override label but keep config.
 */

export async function resolveInheritedFields(params: {
  tenantId: string;
  targetModel: string;
  eventId?: string;
  participantTypeId?: string;
}): Promise<FieldDef[]> {
  const { tenantId, targetModel, eventId, participantTypeId } = params;

  // Fetch all applicable field definitions
  const allFields = await prisma.fieldDefinition.findMany({
    where: {
      tenantId,
      targetModel,
      OR: [
        { eventId: null, participantTypeId: null },
        ...(eventId ? [{ eventId, participantTypeId: null }] : []),
        ...(eventId && participantTypeId ? [{ eventId, participantTypeId }] : []),
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  // Group by field name and merge
  const fieldsByName = new Map<string, FieldDef[]>();
  for (const field of allFields) {
    const defs = fieldsByName.get(field.name) ?? [];
    defs.push(field as any);
    fieldsByName.set(field.name, defs);
  }

  const resolved: FieldDef[] = [];

  for (const [name, defs] of fieldsByName) {
    // Sort by specificity: tenant < event < type
    defs.sort((a, b) => getSpecificity(a) - getSpecificity(b));

    // Merge: more specific overrides less specific
    let merged = defs[0];
    for (let i = 1; i < defs.length; i++) {
      merged = mergeFieldDefs(merged, defs[i]);
    }

    resolved.push(merged);
  }

  return resolved.sort((a, b) => a.sortOrder - b.sortOrder);
}

function getSpecificity(field: FieldDef): number {
  if (field.participantTypeId) return 3;
  if (field.eventId) return 2;
  return 1;
}

function mergeFieldDefs(base: FieldDef, override: FieldDef): FieldDef {
  return {
    ...base,
    // Override ID to reference the most specific definition
    id: override.id,
    // Override display properties
    label: override.label ?? base.label,
    description: override.description ?? base.description,
    sortOrder: override.sortOrder ?? base.sortOrder,
    // Override constraints
    isRequired: override.isRequired ?? base.isRequired,
    isSearchable: override.isSearchable ?? base.isSearchable,
    isFilterable: override.isFilterable ?? base.isFilterable,
    defaultValue: override.defaultValue ?? base.defaultValue,
    // Deep merge config and uiConfig
    config: {
      ...(base.config as Record<string, any>),
      ...(override.config as Record<string, any>),
    },
    uiConfig: {
      ...(base.uiConfig as Record<string, any>),
      ...(override.uiConfig as Record<string, any>),
    },
    // Override validation rules entirely (no merge)
    validation: (override.validation as any[])?.length > 0 ? override.validation : base.validation,
    // Keep scoping from override
    eventId: override.eventId,
    participantTypeId: override.participantTypeId,
  } as FieldDef;
}

/**
 * Multi-Tenant Field Definitions in Practice:
 *
 * Tenant A (Diplomatic Summit) configures:
 *   passport fields, visa requirements, vehicle plates,
 *   closed session attendance, weapon permits for security,
 *   press cards for media.
 *
 * Tenant B (Tech Conference) configures:
 *   t-shirt size, workshop selections, dietary requirements,
 *   GitHub username.
 *
 * Tenant C (Music Festival) configures:
 *   wristband color, camping zone, emergency contact,
 *   medical conditions.
 *
 * All three use the same deployed application.
 * Each tenant only sees fields relevant to their events.
 */
```

---

## 6. User Interface

### 6.1 Field Definition Management

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Custom Fields                                          [+ Add Field]      │
├────────────────────────────────────────────────────────────────────────────┤
│ Scope: [All Events ▼]  Type: [All Types ▼]  Model: [Participant ▼]       │
│ Search: [________________________]                                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ ┌─ Travel & Documents ──────────────────────────────────────────────────┐ │
│ │  ≡  passport_number    │ TEXT     │ Required │ Searchable │ [Edit][x] │ │
│ │  ≡  passport_expiry    │ DATE     │ Required │            │ [Edit][x] │ │
│ │  ≡  needs_visa         │ BOOLEAN  │ Optional │ Filterable │ [Edit][x] │ │
│ │  ≡  visa_number        │ TEXT     │ Cond.    │ Searchable │ [Edit][x] │ │
│ │     └─ Required if needs_visa = true                                  │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌─ Security ────────────────────────────────────────────────────────────┐ │
│ │  ≡  weapon_permit      │ TEXT     │ Optional │ Searchable │ [Edit][x] │ │
│ │  ≡  weapon_serial      │ TEXT     │ Cond.    │ Searchable │ [Edit][x] │ │
│ │  ≡  security_clearance │ ENUM     │ Required │ Filterable │ [Edit][x] │ │
│ │     └─ Options: Level 1, Level 2, Level 3, VIP                       │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌─ Logistics ──────────────────────────────────────────────────────────┐  │
│ │  ≡  vehicle_plate      │ TEXT     │ Optional │ Searchable │ [Edit][x] │ │
│ │  ≡  parking_zone       │ ENUM     │ Optional │ Filterable │ [Edit][x] │ │
│ │  ≡  dietary_needs      │MULTI_ENUM│ Optional │            │ [Edit][x] │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ Total: 9 fields │ 3 searchable │ 3 filterable │ 2 indexed                 │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Custom Object Builder

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Custom Objects                                      [+ New Object]        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  🚗         │  │  🏨         │  │  📋         │  │  ➕         │     │
│  │  Vehicle    │  │  Lodging    │  │  Equipment  │  │  Create     │     │
│  │  Registry   │  │  Assignment │  │  Tracking   │  │  New...     │     │
│  │             │  │             │  │             │  │             │     │
│  │  12 fields  │  │  8 fields   │  │  15 fields  │  │             │     │
│  │  234 records│  │  89 records │  │  567 records│  │             │     │
│  │  Scope:EVENT│  │  Scope:EVENT│  │ Scope:TENANT│  │             │     │
│  │             │  │             │  │             │  │             │     │
│  │ [Configure] │  │ [Configure] │  │ [Configure] │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ Object Detail: Vehicle Registry                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  General                                                                   │
│  Name: [Vehicle Registry        ]   Slug: [vehicle-registry  ] (auto)     │
│  Icon: [🚗 ▼]  Color: [#3b82f6 ]   Scope: [EVENT ▼]                     │
│  Description: [Track vehicles assigned to event participants     ]        │
│                                                                            │
│  Fields (12)                                                [+ Add Field] │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ ≡  plate_number    │ TEXT     │ Required │ Unique  │ Searchable   │   │
│  │ ≡  make            │ TEXT     │ Required │         │              │   │
│  │ ≡  model           │ TEXT     │ Required │         │              │   │
│  │ ≡  color           │ ENUM     │ Required │         │ Filterable   │   │
│  │ ≡  pass_type       │ ENUM     │ Required │         │ Filterable   │   │
│  │ ≡  valid_from      │ DATE     │ Required │         │              │   │
│  │ ≡  valid_to        │ DATE     │ Required │         │              │   │
│  │ ≡  driver_name     │ TEXT     │ Optional │         │ Searchable   │   │
│  │ ≡  driver_phone    │ PHONE    │ Optional │         │              │   │
│  │ ≡  insurance_doc   │ FILE     │ Optional │         │              │   │
│  │ ≡  photo           │ IMAGE    │ Optional │         │              │   │
│  │ ≡  notes           │ LONG_TEXT│ Optional │         │              │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Layouts                                                                   │
│  [List View Config] [Detail View Config] [Form Config]                     │
│                                                                            │
│  Permissions                                                               │
│  [Configure Access Roles]                                                  │
│                                                                            │
│  [Save Changes]  [Delete Object]                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Field Type Selector

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Choose Field Type                                                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  TEXT TYPES                            CHOICE TYPES                        │
│  ┌──────────────────────────┐          ┌──────────────────────────┐       │
│  │ [Aa] Short Text          │          │ [▼] Single Select        │       │
│  │     Single line input    │          │    Dropdown selection     │       │
│  ├──────────────────────────┤          ├──────────────────────────┤       │
│  │ [¶]  Long Text           │          │ [☑] Multi Select         │       │
│  │     Multi-line textarea  │          │    Checkbox group        │       │
│  ├──────────────────────────┤          ├──────────────────────────┤       │
│  │ [@]  Email               │          │ [✓] Boolean              │       │
│  │     Validated email      │          │    Yes/No checkbox       │       │
│  ├──────────────────────────┤          └──────────────────────────┘       │
│  │ [🔗] URL                 │                                             │
│  │     Validated URL        │          DATE/TIME TYPES                    │
│  ├──────────────────────────┤          ┌──────────────────────────┐       │
│  │ [📞] Phone               │          │ [📅] Date                │       │
│  │     Phone number         │          │    Calendar picker       │       │
│  └──────────────────────────┘          ├──────────────────────────┤       │
│                                         │ [🕐] Date & Time        │       │
│  NUMBER TYPES                           │    Date + time picker   │       │
│  ┌──────────────────────────┐          └──────────────────────────┘       │
│  │ [#]  Number              │                                             │
│  │     Integer or decimal   │          SPECIAL TYPES                      │
│  └──────────────────────────┘          ┌──────────────────────────┐       │
│                                         │ [📎] File Upload         │       │
│  REFERENCE TYPES                        ├──────────────────────────┤       │
│  ┌──────────────────────────┐          │ [🖼] Image               │       │
│  │ [→]  Reference           │          ├──────────────────────────┤       │
│  │     Link to custom obj   │          │ [🌍] Country             │       │
│  ├──────────────────────────┤          ├──────────────────────────┤       │
│  │ [👤] User                │          │ [fx] Formula             │       │
│  │     Link to system user  │          ├──────────────────────────┤       │
│  └──────────────────────────┘          │ [#]  Auto Number         │       │
│                                         └──────────────────────────┘       │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Per-Type Configuration Panels

Each field type has a specific configuration panel:

```
┌─────────────── TEXT Field Configuration ───────────────────────────────────┐
│                                                                            │
│  Storage Key: [weapon_permit_number  ]  (snake_case, immutable after save) │
│  Display Label: [Weapon Permit Number]                                     │
│  Help Text: [Enter the permit number issued by local authority    ]        │
│                                                                            │
│  Constraints                                                               │
│  ☑ Required    ☐ Unique    ☑ Searchable    ☐ Filterable                   │
│  Max Length: [20     ]    Pattern: [^WP-\d+$           ]                   │
│  Default Value: [________________]                                         │
│                                                                            │
│  Display                                                                   │
│  Widget: [Input ▼]    Width: [Half ▼]    Section: [Security ▼]            │
│  Placeholder: [e.g., WP-12345                           ]                 │
│                                                                            │
│  Validation Rules                                               [+ Add]   │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ Regex: ^WP-\d{5}$  →  "Must be WP- followed by 5 digits"      │ [x] │
│  │ RequiredIf: weapon_type is set                                  │ [x] │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  Preview: ┌──────────────────────────────────┐                             │
│           │ Weapon Permit Number *           │                             │
│           │ ┌──────────────────────────────┐ │                             │
│           │ │ e.g., WP-12345              │ │                             │
│           │ └──────────────────────────────┘ │                             │
│           │ Enter the permit number issued   │                             │
│           │ by local authority               │                             │
│           └──────────────────────────────────┘                             │
│                                                                            │
│  [Cancel]                                    [Save Field]                  │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────── ENUM Field Configuration ──────────────────────────────────┐
│                                                                            │
│  Storage Key: [security_clearance    ]                                     │
│  Display Label: [Security Clearance  ]                                     │
│                                                                            │
│  Options                                                        [+ Add]   │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ ≡  Value: [level_1] Label: [Level 1  ] Color: [#22c55e] [x]    │     │
│  │ ≡  Value: [level_2] Label: [Level 2  ] Color: [#eab308] [x]    │     │
│  │ ≡  Value: [level_3] Label: [Level 3  ] Color: [#ef4444] [x]    │     │
│  │ ≡  Value: [vip    ] Label: [VIP      ] Color: [#8b5cf6] [x]    │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│  ☐ Allow custom values (free text)                                        │
│                                                                            │
│  Preview: ┌──────────────────────────────────┐                             │
│           │ Security Clearance *             │                             │
│           │ ┌──────────────────────────────┐ │                             │
│           │ │ Select Security Clearance  ▼ │ │                             │
│           │ └──────────────────────────────┘ │                             │
│           │ ● Level 1  ● Level 2             │                             │
│           │ ● Level 3  ● VIP                 │                             │
│           └──────────────────────────────────┘                             │
│                                                                            │
│  [Cancel]                                    [Save Field]                  │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────── NUMBER Field Configuration ────────────────────────────────┐
│                                                                            │
│  Storage Key: [delegation_size       ]                                     │
│  Display Label: [Delegation Size     ]                                     │
│                                                                            │
│  Constraints                                                               │
│  Min: [1         ]  Max: [500       ]  Decimal Places: [0  ]              │
│  Step: [1        ]                                                         │
│  Prefix: [________]  Suffix: [people  ]                                   │
│                                                                            │
│  Preview: ┌──────────────────────────────────┐                             │
│           │ Delegation Size                  │                             │
│           │ ┌──────────────────────────────┐ │                             │
│           │ │ 1                    people  │ │                             │
│           │ └──────────────────────────────┘ │                             │
│           │ Min: 1 | Max: 500                │                             │
│           └──────────────────────────────────┘                             │
│                                                                            │
│  [Cancel]                                    [Save Field]                  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Field Reorder Drag-and-Drop

```typescript
// app/components/fields/FieldReorderList.tsx

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFetcher } from '@remix-run/react'
import type { FieldDef } from '~/types/schema-engine'

interface FieldReorderListProps {
  fields: FieldDef[]
  tenantId: string
}

export function FieldReorderList({ fields, tenantId }: FieldReorderListProps) {
  const fetcher = useFetcher()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex(f => f.id === active.id)
    const newIndex = fields.findIndex(f => f.id === over.id)

    // Compute new sort orders
    const reordered = [...fields]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const fieldOrders = reordered.map((f, i) => ({
      fieldId: f.id,
      sortOrder: i * 10, // leave gaps for future insertions
    }))

    fetcher.submit(
      { fieldOrders: JSON.stringify(fieldOrders) },
      {
        method: 'PUT',
        action: `/api/v1/tenants/${tenantId}/fields/reorder`,
      }
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {fields.map(field => (
            <SortableFieldItem key={field.id} field={field} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableFieldItem({ field }: { field: FieldDef }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-md hover:border-primary"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground"
      >
        ≡
      </button>
      <div className="flex-1">
        <span className="font-medium">{field.label}</span>
        <span className="ml-2 text-xs text-muted-foreground">{field.name}</span>
      </div>
      <span className="text-xs px-2 py-1 bg-muted rounded">
        {field.dataType}
      </span>
      {field.isRequired && (
        <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
          Required
        </span>
      )}
    </div>
  )
}
```

### 6.6 Bulk Import/Export Interface

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Import / Export Field Definitions                                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  EXPORT                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │  Scope: ○ All fields  ○ Current event only  ○ Selected fields   │     │
│  │  Include: ☑ Field definitions  ☑ Custom objects  ☐ Sample data  │     │
│  │  Format: ○ JSON  ○ CSV (fields only)                            │     │
│  │                                                                  │     │
│  │  [Export to File]                                                │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  IMPORT                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │  ┌────────────────────────────────────────────────────────┐     │     │
│  │  │                                                        │     │     │
│  │  │        Drag & drop JSON file here                      │     │     │
│  │  │              or click to browse                        │     │     │
│  │  │                                                        │     │     │
│  │  └────────────────────────────────────────────────────────┘     │     │
│  │                                                                  │     │
│  │  Mode: ○ Create only (skip existing)                            │     │
│  │        ○ Upsert (update existing, create new)                   │     │
│  │        ○ Replace (delete all, re-create)                        │     │
│  │                                                                  │     │
│  │  Preview:                                                       │     │
│  │  ┌──────────────────────────────────────────────────────────┐   │     │
│  │  │ 12 fields found in file                                  │   │     │
│  │  │  • 8 new fields will be created                          │   │     │
│  │  │  • 3 existing fields will be updated                     │   │     │
│  │  │  • 1 field skipped (name conflict)                       │   │     │
│  │  └──────────────────────────────────────────────────────────┘   │     │
│  │                                                                  │     │
│  │  ☑ Dry run first (preview without applying)                     │     │
│  │                                                                  │     │
│  │  [Import Fields]                                                │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.7 Field Usage Analytics

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Field Usage Analytics                                Period: [Last 30d ▼]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Summary                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │    42     │  │    28     │  │    14     │  │     6     │                │
│  │  Total    │  │  In Use   │  │  Unused   │  │  Indexed  │               │
│  │  Fields   │  │  (>1 val) │  │  (no data)│  │  Fields   │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                  │
│                                                                            │
│  Top Fields by Fill Rate                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ passport_number    ████████████████████████████████████████  98%   │   │
│  │ nationality        ██████████████████████████████████████    95%   │   │
│  │ needs_visa         █████████████████████████████████         82%   │   │
│  │ organization       ████████████████████████████              71%   │   │
│  │ vehicle_plate      █████████████                             34%   │   │
│  │ weapon_permit      ████                                      12%   │   │
│  │ press_card         ███                                        8%   │   │
│  │ dietary_needs      ██                                         5%   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Index Performance                                                         │
│  ┌────────────────────────────┬──────────┬──────────┬──────────┐         │
│  │ Index                      │ Size     │ Scans    │ Hit Rate │         │
│  ├────────────────────────────┼──────────┼──────────┼──────────┤         │
│  │ idx_participant_cf_pass... │ 2.1 MB   │ 1,234    │ 99.2%    │         │
│  │ idx_participant_cf_visa... │ 0.8 MB   │ 567      │ 98.7%    │         │
│  │ idx_participant_cf_weap... │ 0.3 MB   │ 89       │ 97.1%    │         │
│  └────────────────────────────┴──────────┴──────────┴──────────┘         │
│                                                                            │
│  Recommendations                                                           │
│  ⚠ "dietary_needs" has 5% fill rate - consider making optional            │
│  ⚠ "press_card" is searchable but only 8% filled - index overhead        │
│  ✓ All indexed fields have >95% hit rate                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Form Designer Integration (Module 03)

The Dynamic Schema Engine provides field definitions that the Form Designer consumes to build visual form layouts.

```typescript
// Integration: Schema Engine → Form Designer

// Form Designer requests available fields for a form
export async function getFieldsForFormDesigner(params: {
  tenantId: string;
  targetModel: string;
  eventId?: string;
  participantTypeId?: string;
}): Promise<{
  fixedFields: FixedFieldDef[]; // from Prisma schema
  customFields: FieldDef[]; // from FieldDefinition
  customObjects: CustomObjectDef[]; // linkable custom objects
}> {
  const customFields = await resolveInheritedFields(params);

  const customObjects = await prisma.customObjectDef.findMany({
    where: {
      tenantId: params.tenantId,
      OR: [{ scope: "TENANT" }, { scope: "EVENT" }],
    },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });

  return {
    fixedFields: getFixedFieldDefs(params.targetModel),
    customFields,
    customObjects,
  };
}

// Form Designer saves layout referencing custom fields by name
interface FormSection {
  title: string;
  fields: Array<{
    source: "fixed" | "custom";
    name: string; // matches FieldDefinition.name
    widthOverride?: "full" | "half" | "third";
    labelOverride?: string;
  }>;
}
```

**Contract between modules:**

| Schema Engine Provides                         | Form Designer Consumes                      |
| ---------------------------------------------- | ------------------------------------------- |
| `FieldDef[]` with types, constraints, UI hints | Field palette for drag-and-drop             |
| `buildCustomDataSchema()` compiled Zod schema  | Server-side validation for form submissions |
| `FieldRenderer` component                      | Rendering of individual custom fields       |
| `evaluateConditionalRules()`                   | Client-side show/hide logic                 |
| `CustomObjectDef` with field definitions       | Sub-form sections for linked objects        |

### 7.2 Workflow Conditional Routing (Module 04)

Custom field values can drive workflow routing decisions.

```typescript
// Integration: Schema Engine → Workflow Engine

// Workflow step condition that evaluates custom field values
interface WorkflowCondition {
  type: "CUSTOM_FIELD";
  fieldName: string; // references FieldDefinition.name
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "isSet" | "isNotSet";
  value?: any;
}

// Workflow engine calls this to evaluate conditions
export function evaluateWorkflowCondition(
  condition: WorkflowCondition,
  participantCustomData: Record<string, any>,
): boolean {
  const fieldValue = participantCustomData[condition.fieldName];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "notEquals":
      return fieldValue !== condition.value;
    case "contains":
      if (Array.isArray(fieldValue)) return fieldValue.includes(condition.value);
      return String(fieldValue).includes(String(condition.value));
    case "greaterThan":
      return Number(fieldValue) > Number(condition.value);
    case "lessThan":
      return Number(fieldValue) < Number(condition.value);
    case "isSet":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
    case "isNotSet":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";
    default:
      return false;
  }
}

// Example: Route participants needing visa to "Visa Review" step
// condition: { type: 'CUSTOM_FIELD', fieldName: 'needs_visa', operator: 'equals', value: true }
```

### 7.3 API Exposure (Module 07)

The API Gateway exposes custom fields through the participant and custom object record endpoints.

```typescript
// Integration: Schema Engine → API Gateway

// API response includes custom fields with metadata
interface ParticipantApiResponse {
  id: string;
  firstName: string;
  familyName: string;
  email: string;
  // ... fixed fields ...
  customData: Record<string, any>; // actual custom field values
  _fieldDefinitions?: FieldDef[]; // optional: include field definitions
}

// API Gateway uses schema engine for request validation
export async function validateApiCustomData(
  tenantId: string,
  targetModel: string,
  eventId: string,
  participantTypeId: string | undefined,
  customData: Record<string, any>,
): Promise<{ valid: boolean; errors: Record<string, string[]>; data: Record<string, any> }> {
  const { zodSchema } = await compileSchema({
    tenantId,
    targetModel,
    eventId,
    participantTypeId,
  });

  const result = zodSchema.safeParse(customData);
  if (result.success) {
    return { valid: true, errors: {}, data: result.data };
  }

  return {
    valid: false,
    errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    data: customData,
  };
}

// API dynamically generates OpenAPI schema from field definitions
export function generateOpenApiSchemaForCustomFields(fieldDefs: FieldDef[]): Record<string, any> {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const field of fieldDefs) {
    properties[field.name] = fieldDefToOpenApiProperty(field);
    if (field.isRequired) required.push(field.name);
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function fieldDefToOpenApiProperty(field: FieldDef): Record<string, any> {
  const base: Record<string, any> = {
    description: field.description ?? field.label,
  };

  switch (field.dataType) {
    case "TEXT":
    case "LONG_TEXT":
    case "EMAIL":
    case "URL":
    case "PHONE":
      return { ...base, type: "string" };
    case "NUMBER":
      return {
        ...base,
        type: "number",
        minimum: (field.config as any).min,
        maximum: (field.config as any).max,
      };
    case "BOOLEAN":
      return { ...base, type: "boolean" };
    case "DATE":
    case "DATETIME":
      return { ...base, type: "string", format: "date-time" };
    case "ENUM":
      return {
        ...base,
        type: "string",
        enum: (field.config as any).options?.map((o: any) => o.value),
      };
    case "MULTI_ENUM":
      return {
        ...base,
        type: "array",
        items: {
          type: "string",
          enum: (field.config as any).options?.map((o: any) => o.value),
        },
      };
    default:
      return { ...base, type: "string" };
  }
}
```

### 7.4 Search and Filter in UI (Module 08)

```typescript
// Integration: Schema Engine → UI Framework

// Generate filter controls from field definitions
export function getFilterableFieldsForUI(fieldDefs: FieldDef[]): Array<{
  name: string;
  label: string;
  filterType: "text" | "number-range" | "date-range" | "select" | "multi-select" | "boolean";
  options?: Array<{ value: string; label: string }>;
}> {
  return fieldDefs
    .filter((f) => f.isFilterable)
    .map((field) => {
      switch (field.dataType) {
        case "TEXT":
        case "EMAIL":
        case "PHONE":
          return { name: `cf_${field.name}`, label: field.label, filterType: "text" as const };
        case "NUMBER":
          return {
            name: `cf_${field.name}`,
            label: field.label,
            filterType: "number-range" as const,
          };
        case "DATE":
        case "DATETIME":
          return {
            name: `cf_${field.name}`,
            label: field.label,
            filterType: "date-range" as const,
          };
        case "BOOLEAN":
          return { name: `cf_${field.name}`, label: field.label, filterType: "boolean" as const };
        case "ENUM":
        case "COUNTRY":
          return {
            name: `cf_${field.name}`,
            label: field.label,
            filterType: "select" as const,
            options: (field.config as any).options ?? [],
          };
        case "MULTI_ENUM":
          return {
            name: `cf_${field.name}`,
            label: field.label,
            filterType: "multi-select" as const,
            options: (field.config as any).options ?? [],
          };
        default:
          return { name: `cf_${field.name}`, label: field.label, filterType: "text" as const };
      }
    });
}

// Generate table columns from custom field definitions
export function getCustomFieldTableColumns(fieldDefs: FieldDef[]): Array<{
  key: string;
  header: string;
  sortable: boolean;
  accessor: (row: any) => any;
  renderCell: (value: any) => string;
}> {
  return fieldDefs
    .filter((f) => f.isSearchable || f.isFilterable)
    .map((field) => ({
      key: `customData.${field.name}`,
      header: field.label,
      sortable: ["TEXT", "NUMBER", "DATE", "DATETIME", "ENUM", "COUNTRY"].includes(field.dataType),
      accessor: (row: any) => row.customData?.[field.name],
      renderCell: (value: any) => formatFieldValue(field, value),
    }));
}

function formatFieldValue(field: FieldDef, value: any): string {
  if (value === null || value === undefined) return "-";

  switch (field.dataType) {
    case "BOOLEAN":
      return value ? "Yes" : "No";
    case "DATE":
      return new Date(value).toLocaleDateString();
    case "DATETIME":
      return new Date(value).toLocaleString();
    case "ENUM": {
      const opt = (field.config as any).options?.find((o: any) => o.value === value);
      return opt?.label ?? value;
    }
    case "MULTI_ENUM": {
      if (!Array.isArray(value)) return String(value);
      return value
        .map((v: string) => {
          const opt = (field.config as any).options?.find((o: any) => o.value === v);
          return opt?.label ?? v;
        })
        .join(", ");
    }
    case "COUNTRY":
      return getCountryName(value) ?? value;
    default:
      return String(value);
  }
}

function getCountryName(code: string): string | null {
  // Use Intl.DisplayNames if available
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? null;
  } catch {
    return null;
  }
}
```

### 7.5 Registration Forms (Module 09)

```typescript
// Integration: Schema Engine → Registration Module

// Registration module loads custom fields for the registration form
export async function loadRegistrationFields(params: {
  tenantId: string;
  eventId: string;
  participantTypeId: string;
}): Promise<{
  schema: z.ZodObject<any>;
  fieldDefs: FieldDef[];
  sections: Array<{ title: string; fields: FieldDef[] }>;
}> {
  const { zodSchema, fieldDefs } = await compileSchema({
    tenantId: params.tenantId,
    targetModel: "Participant",
    eventId: params.eventId,
    participantTypeId: params.participantTypeId,
  });

  // Group into sections for multi-step registration
  const sections = groupFieldsBySection(fieldDefs);

  return {
    schema: zodSchema,
    fieldDefs,
    sections: sections.map((s) => ({
      title: s.name === "_default" ? "Additional Information" : s.name,
      fields: s.fields,
    })),
  };
}

// Registration module validates and saves custom data
export async function saveRegistrationCustomData(params: {
  participantId: string;
  tenantId: string;
  eventId: string;
  participantTypeId: string;
  customData: Record<string, any>;
}): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
  const { zodSchema, fieldDefs } = await compileSchema({
    tenantId: params.tenantId,
    targetModel: "Participant",
    eventId: params.eventId,
    participantTypeId: params.participantTypeId,
  });

  // Validate
  const validationResult = await validateCustomData(params.customData, fieldDefs, {
    tenantId: params.tenantId,
    eventId: params.eventId,
  });

  if (!validationResult.valid) {
    return { success: false, errors: validationResult.errors };
  }

  // Save to participant
  await prisma.participant.update({
    where: { id: params.participantId },
    data: { customData: validationResult.transformedData },
  });

  // Invalidate computed field caches
  const changedFields = Object.keys(params.customData);
  invalidateComputedFields(params.participantId, changedFields, fieldDefs);

  return { success: true };
}
```

**Integration map summary:**

```
┌─────────────┐     provides field defs     ┌───────────────┐
│   Schema    │────────────────────────────▶│ Form Designer │
│   Engine    │     validates submissions   │   (Mod 03)    │
│  (Mod 02)   │◀────────────────────────────│               │
├─────────────┤                             └───────────────┘
│             │     evaluates conditions    ┌───────────────┐
│             │────────────────────────────▶│   Workflow    │
│             │                             │   (Mod 04)    │
│             │                             └───────────────┘
│             │     validates API input     ┌───────────────┐
│             │────────────────────────────▶│ API Gateway   │
│             │     generates OpenAPI       │   (Mod 07)    │
│             │                             └───────────────┘
│             │     provides filters/cols   ┌───────────────┐
│             │────────────────────────────▶│  UI Framework │
│             │                             │   (Mod 08)    │
│             │                             └───────────────┘
│             │     compiles form schema    ┌───────────────┐
│             │────────────────────────────▶│ Registration  │
│             │     validates + saves       │   (Mod 09)    │
└─────────────┘                             └───────────────┘
```

---

## 8. Configuration

### 8.1 Feature Flags

```typescript
// app/config/schema-engine-flags.ts

export const SCHEMA_ENGINE_FLAGS = {
  /**
   * Enable/disable specific field types.
   * Allows gradual rollout of new field types.
   */
  enabledFieldTypes: {
    key: "schema_engine.enabled_field_types",
    default: [
      "TEXT",
      "LONG_TEXT",
      "NUMBER",
      "BOOLEAN",
      "DATE",
      "DATETIME",
      "ENUM",
      "MULTI_ENUM",
      "EMAIL",
      "URL",
      "PHONE",
      "FILE",
      "IMAGE",
    ] as string[],
    description: "List of enabled field data types",
  },

  /**
   * Enable formula fields (computed fields).
   * Disabled by default until formula engine is battle-tested.
   */
  enableFormulaFields: {
    key: "schema_engine.enable_formula_fields",
    default: false,
    description: "Enable FORMULA field type for computed values",
  },

  /**
   * Enable auto-number fields.
   */
  enableAutoNumberFields: {
    key: "schema_engine.enable_auto_number_fields",
    default: true,
    description: "Enable AUTO_NUMBER field type for sequential numbering",
  },

  /**
   * Enable custom objects (entire custom entity types).
   */
  enableCustomObjects: {
    key: "schema_engine.enable_custom_objects",
    default: true,
    description: "Enable custom object definitions and records",
  },

  /**
   * Enable REFERENCE fields (cross-object links).
   */
  enableReferenceFields: {
    key: "schema_engine.enable_reference_fields",
    default: true,
    description: "Enable REFERENCE field type for linking to custom objects",
  },

  /**
   * Enable field versioning and history tracking.
   */
  enableFieldVersioning: {
    key: "schema_engine.enable_field_versioning",
    default: true,
    description: "Track field definition changes with version history",
  },

  /**
   * Enable automatic expression index creation.
   */
  enableAutoIndexing: {
    key: "schema_engine.enable_auto_indexing",
    default: true,
    description: "Automatically create expression indexes for searchable/filterable fields",
  },

  /**
   * Enable field export/import.
   */
  enableFieldExportImport: {
    key: "schema_engine.enable_field_export_import",
    default: true,
    description: "Allow exporting and importing field definitions between tenants",
  },

  /**
   * Enable field usage analytics.
   */
  enableFieldAnalytics: {
    key: "schema_engine.enable_field_analytics",
    default: false,
    description: "Track field fill rates and query patterns for analytics",
  },
} as const;
```

### 8.2 Limits and Quotas

```typescript
// app/config/schema-engine-limits.ts

export const SCHEMA_ENGINE_LIMITS = {
  /**
   * Maximum number of custom fields per tenant.
   * Prevents unbounded field proliferation.
   */
  maxFieldsPerTenant: {
    key: "schema_engine.max_fields_per_tenant",
    default: 500,
    min: 10,
    max: 5000,
    description: "Maximum custom field definitions per tenant",
  },

  /**
   * Maximum number of custom fields per entity (model + event + type combo).
   */
  maxFieldsPerEntity: {
    key: "schema_engine.max_fields_per_entity",
    default: 100,
    min: 5,
    max: 500,
    description: "Maximum custom fields per entity scope",
  },

  /**
   * Maximum number of custom objects per tenant.
   */
  maxCustomObjectsPerTenant: {
    key: "schema_engine.max_custom_objects_per_tenant",
    default: 50,
    min: 5,
    max: 200,
    description: "Maximum custom object definitions per tenant",
  },

  /**
   * Maximum number of fields per custom object.
   */
  maxFieldsPerCustomObject: {
    key: "schema_engine.max_fields_per_custom_object",
    default: 75,
    min: 5,
    max: 200,
    description: "Maximum fields per custom object definition",
  },

  /**
   * Maximum number of enum options per field.
   */
  maxEnumOptions: {
    key: "schema_engine.max_enum_options",
    default: 200,
    min: 2,
    max: 1000,
    description: "Maximum options for ENUM/MULTI_ENUM fields",
  },

  /**
   * Maximum expression indexes per tenant.
   * Expression indexes consume disk space and slow writes.
   */
  maxExpressionIndexesPerTenant: {
    key: "schema_engine.max_expression_indexes_per_tenant",
    default: 30,
    min: 5,
    max: 100,
    description: "Maximum expression indexes for custom fields per tenant",
  },

  /**
   * Maximum formula depth (nested formula field references).
   */
  maxFormulaDepth: {
    key: "schema_engine.max_formula_depth",
    default: 10,
    min: 3,
    max: 20,
    description: "Maximum nesting depth for formula field evaluation",
  },

  /**
   * Maximum bulk operation batch size.
   */
  maxBulkBatchSize: {
    key: "schema_engine.max_bulk_batch_size",
    default: 50,
    min: 1,
    max: 200,
    description: "Maximum number of fields in a bulk create/delete operation",
  },

  /**
   * Maximum validation rules per field.
   */
  maxValidationRulesPerField: {
    key: "schema_engine.max_validation_rules_per_field",
    default: 10,
    min: 1,
    max: 50,
    description: "Maximum validation rules per custom field",
  },
} as const;
```

### 8.3 JSONB Storage Settings

```typescript
// app/config/schema-engine-storage.ts

export const JSONB_STORAGE_SETTINGS = {
  /**
   * Maximum JSONB document size per record (in bytes).
   * PostgreSQL JSONB max is ~255MB, but practical limits are much lower.
   */
  maxDocumentSizeBytes: {
    key: "schema_engine.max_document_size_bytes",
    default: 1024 * 1024, // 1 MB
    description: "Maximum size of customData JSONB column per record",
  },

  /**
   * Maximum string value length within JSONB.
   */
  maxStringValueLength: {
    key: "schema_engine.max_string_value_length",
    default: 10000,
    description: "Maximum length of a single string value in customData",
  },

  /**
   * Maximum array length within JSONB (for MULTI_ENUM etc.).
   */
  maxArrayLength: {
    key: "schema_engine.max_array_length",
    default: 100,
    description: "Maximum number of items in a JSONB array value",
  },

  /**
   * Enable JSONB compression (TOAST).
   * PostgreSQL handles this automatically, but we can hint.
   */
  enableToastCompression: {
    key: "schema_engine.enable_toast_compression",
    default: true,
    description: "Let PostgreSQL compress large JSONB values via TOAST",
  },
} as const;
```

### 8.4 Index Creation Settings

```typescript
// app/config/schema-engine-indexes.ts

export const INDEX_SETTINGS = {
  /**
   * Create indexes concurrently (non-blocking).
   * Always true in production; can be false for tests.
   */
  createConcurrently: {
    key: "schema_engine.index_create_concurrently",
    default: true,
    description: "Use CREATE INDEX CONCURRENTLY to avoid table locks",
  },

  /**
   * Include partial index condition for soft deletes.
   */
  partialIndexOnDeletedAt: {
    key: "schema_engine.partial_index_deleted_at",
    default: true,
    description: "Add WHERE deletedAt IS NULL to expression indexes",
  },

  /**
   * Minimum record count before creating an index.
   * Avoids index overhead for small tables.
   */
  minRecordsForIndex: {
    key: "schema_engine.min_records_for_index",
    default: 100,
    description: "Only create expression index if table has this many records",
  },

  /**
   * Index health check interval (in minutes).
   */
  healthCheckIntervalMinutes: {
    key: "schema_engine.index_health_check_interval",
    default: 60,
    description: "Run index validation checks at this interval",
  },
} as const;
```

---

## 9. Testing Strategy

### 9.1 Unit Tests: Zod Schema Builder

```typescript
// tests/unit/schema-engine/build-custom-data-schema.test.ts

import { describe, it, expect } from "vitest";
import { buildCustomDataSchema } from "~/utils/fields.server";
import type { FieldDef } from "~/types/schema-engine";

describe("buildCustomDataSchema", () => {
  describe("TEXT fields", () => {
    it("should validate a required text field", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "passport", dataType: "TEXT", isRequired: true }),
      ]);
      expect(schema.safeParse({ passport: "AB1234567" }).success).toBe(true);
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({ passport: "" }).success).toBe(true); // empty string passes z.string()
    });

    it("should enforce maxLength constraint", () => {
      const schema = buildCustomDataSchema([
        makeField({
          name: "code",
          dataType: "TEXT",
          isRequired: true,
          config: { maxLength: 10 },
        }),
      ]);
      expect(schema.safeParse({ code: "ABCDEFGHIJ" }).success).toBe(true);
      expect(schema.safeParse({ code: "ABCDEFGHIJK" }).success).toBe(false);
    });

    it("should enforce regex pattern", () => {
      const schema = buildCustomDataSchema([
        makeField({
          name: "permit",
          dataType: "TEXT",
          isRequired: true,
          config: { pattern: "^WP-\\d{5}$" },
        }),
      ]);
      expect(schema.safeParse({ permit: "WP-12345" }).success).toBe(true);
      expect(schema.safeParse({ permit: "WP-1234" }).success).toBe(false);
      expect(schema.safeParse({ permit: "XX-12345" }).success).toBe(false);
    });

    it("should allow optional text fields to be null or undefined", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "notes", dataType: "TEXT", isRequired: false }),
      ]);
      expect(schema.safeParse({}).success).toBe(true);
      expect(schema.safeParse({ notes: null }).success).toBe(true);
      expect(schema.safeParse({ notes: "some text" }).success).toBe(true);
    });
  });

  describe("NUMBER fields", () => {
    it("should validate numbers with min/max", () => {
      const schema = buildCustomDataSchema([
        makeField({
          name: "age",
          dataType: "NUMBER",
          isRequired: true,
          config: { min: 0, max: 150 },
        }),
      ]);
      expect(schema.safeParse({ age: 25 }).success).toBe(true);
      expect(schema.safeParse({ age: -1 }).success).toBe(false);
      expect(schema.safeParse({ age: 200 }).success).toBe(false);
      expect(schema.safeParse({ age: "twenty" }).success).toBe(false);
    });

    it("should reject strings for number fields", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "count", dataType: "NUMBER", isRequired: true }),
      ]);
      expect(schema.safeParse({ count: "42" }).success).toBe(false);
      expect(schema.safeParse({ count: 42 }).success).toBe(true);
    });
  });

  describe("BOOLEAN fields", () => {
    it("should validate boolean values", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "needs_visa", dataType: "BOOLEAN", isRequired: true }),
      ]);
      expect(schema.safeParse({ needs_visa: true }).success).toBe(true);
      expect(schema.safeParse({ needs_visa: false }).success).toBe(true);
      expect(schema.safeParse({ needs_visa: "true" }).success).toBe(false);
      expect(schema.safeParse({ needs_visa: 1 }).success).toBe(false);
    });
  });

  describe("DATE and DATETIME fields", () => {
    it("should validate ISO datetime strings", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "arrival", dataType: "DATE", isRequired: true }),
      ]);
      expect(schema.safeParse({ arrival: "2026-06-15T00:00:00.000Z" }).success).toBe(true);
      expect(schema.safeParse({ arrival: "not-a-date" }).success).toBe(false);
    });
  });

  describe("ENUM fields", () => {
    it("should validate against defined options", () => {
      const schema = buildCustomDataSchema([
        makeField({
          name: "clearance",
          dataType: "ENUM",
          isRequired: true,
          config: {
            options: [
              { value: "level_1", label: "Level 1" },
              { value: "level_2", label: "Level 2" },
              { value: "vip", label: "VIP" },
            ],
          },
        }),
      ]);
      expect(schema.safeParse({ clearance: "level_1" }).success).toBe(true);
      expect(schema.safeParse({ clearance: "vip" }).success).toBe(true);
      expect(schema.safeParse({ clearance: "unknown" }).success).toBe(false);
    });
  });

  describe("MULTI_ENUM fields", () => {
    it("should validate arrays of enum values", () => {
      const schema = buildCustomDataSchema([
        makeField({
          name: "dietary",
          dataType: "MULTI_ENUM",
          isRequired: true,
          config: {
            options: [
              { value: "vegetarian", label: "Vegetarian" },
              { value: "vegan", label: "Vegan" },
              { value: "halal", label: "Halal" },
              { value: "kosher", label: "Kosher" },
            ],
          },
        }),
      ]);
      expect(schema.safeParse({ dietary: ["vegetarian", "halal"] }).success).toBe(true);
      expect(schema.safeParse({ dietary: [] }).success).toBe(true);
      expect(schema.safeParse({ dietary: ["unknown"] }).success).toBe(false);
      expect(schema.safeParse({ dietary: "vegetarian" }).success).toBe(false); // not array
    });
  });

  describe("EMAIL fields", () => {
    it("should validate email format", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "contact_email", dataType: "EMAIL", isRequired: true }),
      ]);
      expect(schema.safeParse({ contact_email: "user@example.com" }).success).toBe(true);
      expect(schema.safeParse({ contact_email: "not-an-email" }).success).toBe(false);
    });
  });

  describe("URL fields", () => {
    it("should validate URL format", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "website", dataType: "URL", isRequired: true }),
      ]);
      expect(schema.safeParse({ website: "https://example.com" }).success).toBe(true);
      expect(schema.safeParse({ website: "not-a-url" }).success).toBe(false);
    });
  });

  describe("PHONE fields", () => {
    it("should validate phone number length", () => {
      const schema = buildCustomDataSchema([
        makeField({ name: "phone", dataType: "PHONE", isRequired: true }),
      ]);
      expect(schema.safeParse({ phone: "+1234567890" }).success).toBe(true);
      expect(schema.safeParse({ phone: "123" }).success).toBe(false); // too short
    });
  });

  describe("Custom validation rules", () => {
    it("should apply regex custom validation", () => {
      const schema = buildCustomDataSchema([
        makeField({
          name: "id_number",
          dataType: "TEXT",
          isRequired: true,
          validation: [{ rule: "regex", value: "^[A-Z]{2}\\d{7}$", message: "Invalid ID format" }],
        }),
      ]);
      expect(schema.safeParse({ id_number: "AB1234567" }).success).toBe(true);
      expect(schema.safeParse({ id_number: "ab1234567" }).success).toBe(false);
    });
  });

  describe("Mixed field schemas", () => {
    it("should validate a complex form with multiple field types", () => {
      const schema = buildCustomDataSchema([
        makeField({
          name: "passport",
          dataType: "TEXT",
          isRequired: true,
          config: { maxLength: 20 },
        }),
        makeField({ name: "needs_visa", dataType: "BOOLEAN", isRequired: true }),
        makeField({
          name: "delegation_size",
          dataType: "NUMBER",
          isRequired: false,
          config: { min: 1, max: 100 },
        }),
        makeField({
          name: "clearance",
          dataType: "ENUM",
          isRequired: true,
          config: {
            options: [
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ],
          },
        }),
      ]);

      const valid = {
        passport: "AB1234567",
        needs_visa: true,
        delegation_size: 5,
        clearance: "a",
      };
      expect(schema.safeParse(valid).success).toBe(true);

      const invalid = {
        passport: "AB1234567",
        needs_visa: "yes", // should be boolean
        clearance: "c", // not in enum
      };
      expect(schema.safeParse(invalid).success).toBe(false);
    });
  });
});

// Test helper
function makeField(overrides: Partial<FieldDef> & { name: string; dataType: string }): FieldDef {
  return {
    id: `field_${overrides.name}`,
    tenantId: "tenant_1",
    targetModel: "Participant",
    customObjectDefId: null,
    eventId: null,
    participantTypeId: null,
    label: overrides.name.replace(/_/g, " "),
    description: null,
    sortOrder: 0,
    isRequired: false,
    isUnique: false,
    isSearchable: false,
    isFilterable: false,
    defaultValue: null,
    config: {},
    uiConfig: {},
    validation: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as FieldDef;
}
```

### 9.2 Integration Tests: JSONB Queries

```typescript
// tests/integration/schema-engine/jsonb-queries.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "~/utils/db.server";
import { queryWithCustomFields } from "~/utils/custom-query-extended.server";

describe("JSONB Query Integration", () => {
  const tenantId = "test-tenant-jsonb";
  const eventId = "test-event-jsonb";

  beforeAll(async () => {
    // Seed test data
    await prisma.tenant.create({ data: { id: tenantId, name: "JSONB Test", slug: "jsonb-test" } });
    await prisma.event.create({
      data: { id: eventId, tenantId, name: "Test Event", slug: "test" },
    });

    // Create participants with varied custom data
    const participants = [
      { firstName: "Alice", customData: { country: "US", clearance: "vip", score: 95 } },
      { firstName: "Bob", customData: { country: "UK", clearance: "level_1", score: 72 } },
      { firstName: "Charlie", customData: { country: "FR", clearance: "level_2", score: 88 } },
      { firstName: "Diana", customData: { country: "US", clearance: "level_1", score: 60 } },
      { firstName: "Eve", customData: { country: "DE", clearance: "vip", score: 91 } },
    ];

    for (const p of participants) {
      await prisma.participant.create({
        data: {
          tenantId,
          eventId,
          firstName: p.firstName,
          familyName: "Test",
          email: `${p.firstName.toLowerCase()}@test.com`,
          customData: p.customData,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.participant.deleteMany({ where: { tenantId } });
    await prisma.event.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
  });

  it("should filter by ENUM custom field", async () => {
    const request = new Request("http://test?cf_clearance=vip");
    const result = await queryWithCustomFields({
      request,
      baseWhere: { tenantId, eventId },
      fieldDefinitions: [makeFilterableField("clearance", "ENUM")],
      tenantId,
    });

    expect(result.total).toBe(2);
    expect(result.data.map((p: any) => p.firstName).sort()).toEqual(["Alice", "Eve"]);
  });

  it("should filter by NUMBER range", async () => {
    const request = new Request("http://test?cf_score_min=80&cf_score_max=95");
    const result = await queryWithCustomFields({
      request,
      baseWhere: { tenantId, eventId },
      fieldDefinitions: [makeFilterableField("score", "NUMBER")],
      tenantId,
    });

    expect(result.total).toBe(3); // Alice(95), Charlie(88), Eve(91)
  });

  it("should filter by TEXT with ILIKE", async () => {
    const request = new Request("http://test?cf_country=US");
    const result = await queryWithCustomFields({
      request,
      baseWhere: { tenantId, eventId },
      fieldDefinitions: [makeFilterableField("country", "COUNTRY")],
      tenantId,
    });

    expect(result.total).toBe(2); // Alice, Diana
  });

  it("should combine multiple custom field filters", async () => {
    const request = new Request("http://test?cf_clearance=level_1&cf_score_min=65");
    const result = await queryWithCustomFields({
      request,
      baseWhere: { tenantId, eventId },
      fieldDefinitions: [
        makeFilterableField("clearance", "ENUM"),
        makeFilterableField("score", "NUMBER"),
      ],
      tenantId,
    });

    expect(result.total).toBe(1); // Bob(72)
  });

  it("should paginate results", async () => {
    const request = new Request("http://test");
    const result = await queryWithCustomFields({
      request,
      baseWhere: { tenantId, eventId },
      fieldDefinitions: [],
      tenantId,
      page: 1,
      pageSize: 2,
    });

    expect(result.data.length).toBe(2);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  it("should sort by custom field", async () => {
    const request = new Request("http://test");
    const result = await queryWithCustomFields({
      request,
      baseWhere: { tenantId, eventId },
      fieldDefinitions: [makeFilterableField("score", "NUMBER")],
      tenantId,
      sortField: "cf_score",
      sortDirection: "desc",
    });

    const scores = result.data.map((p: any) => p.customData.score);
    expect(scores).toEqual([95, 91, 88, 72, 60]);
  });
});

function makeFilterableField(name: string, dataType: string): any {
  return {
    name,
    dataType,
    isFilterable: true,
    isSearchable: true,
    config: {},
    validation: [],
  };
}
```

### 9.3 Performance Tests: Expression Indexes

```typescript
// tests/performance/schema-engine/expression-indexes.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "~/utils/db.server";
import {
  ensureCustomFieldIndex,
  removeCustomFieldIndex,
} from "~/services/schema-engine/index-manager.server";

describe("Expression Index Performance", () => {
  const tenantId = "perf-test-tenant";
  const RECORD_COUNT = 10_000;

  beforeAll(async () => {
    // Seed large dataset
    await prisma.tenant.create({ data: { id: tenantId, name: "Perf Test", slug: "perf" } });

    const batches = [];
    for (let i = 0; i < RECORD_COUNT; i += 1000) {
      const batch = Array.from({ length: Math.min(1000, RECORD_COUNT - i) }, (_, j) => ({
        tenantId,
        firstName: `User${i + j}`,
        familyName: "Perf",
        email: `user${i + j}@perf.test`,
        customData: {
          badge_number: `BDG-${String(i + j).padStart(6, "0")}`,
          score: Math.floor(Math.random() * 100),
          country: ["US", "UK", "FR", "DE", "JP"][Math.floor(Math.random() * 5)],
        },
      }));
      batches.push(batch);
    }

    for (const batch of batches) {
      await prisma.participant.createMany({ data: batch });
    }
  }, 120_000); // 2 minute timeout for seeding

  afterAll(async () => {
    await removeCustomFieldIndex({
      name: "badge_number",
      dataType: "TEXT",
      targetModel: "Participant",
      isSearchable: true,
    } as any);
    await removeCustomFieldIndex({
      name: "score",
      dataType: "NUMBER",
      targetModel: "Participant",
      isSearchable: true,
    } as any);

    await prisma.participant.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
  });

  it("should measure query time WITHOUT expression index", async () => {
    const start = performance.now();
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND "customData"->>'badge_number' = 'BDG-005000'
        AND "deletedAt" IS NULL
    `;
    const elapsed = performance.now() - start;

    console.log(`Query WITHOUT index: ${elapsed.toFixed(2)}ms`);
    expect(Number(result[0].count)).toBe(1);
    // Store baseline time for comparison
  });

  it("should measure query time WITH expression index", async () => {
    // Create index
    await ensureCustomFieldIndex({
      name: "badge_number",
      dataType: "TEXT",
      targetModel: "Participant",
      isSearchable: true,
      tenantId,
    } as any);

    // Wait for index to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Analyze to update statistics
    await prisma.$executeRaw`ANALYZE "Participant"`;

    const start = performance.now();
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND "customData"->>'badge_number' = 'BDG-005000'
        AND "deletedAt" IS NULL
    `;
    const elapsed = performance.now() - start;

    console.log(`Query WITH index: ${elapsed.toFixed(2)}ms`);
    expect(Number(result[0].count)).toBe(1);
    // Should be significantly faster than without index
  });

  it("should measure range query performance with numeric index", async () => {
    await ensureCustomFieldIndex({
      name: "score",
      dataType: "NUMBER",
      targetModel: "Participant",
      isSearchable: true,
      tenantId,
    } as any);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await prisma.$executeRaw`ANALYZE "Participant"`;

    const start = performance.now();
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND ("customData"->>'score')::NUMERIC >= 80
        AND ("customData"->>'score')::NUMERIC <= 90
        AND "deletedAt" IS NULL
    `;
    const elapsed = performance.now() - start;

    console.log(`Range query WITH index: ${elapsed.toFixed(2)}ms, count: ${result[0].count}`);
    expect(Number(result[0].count)).toBeGreaterThan(0);
  });

  it("should verify query plan uses expression index", async () => {
    const plan = await prisma.$queryRaw<any[]>`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND "customData"->>'badge_number' = 'BDG-005000'
        AND "deletedAt" IS NULL
    `;

    const planText = JSON.stringify(plan);
    console.log("Query plan:", planText.substring(0, 500));

    // Verify index is being used (not sequential scan)
    expect(planText).toContain("Index");
  });
});
```

### 9.4 Field Migration Tests

```typescript
// tests/integration/schema-engine/field-migration.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "~/utils/db.server";
import { migrateFieldType } from "~/services/schema-engine/type-migration.server";
import { checkMigrationSafety } from "~/services/schema-engine/migration-safety.server";

describe("Field Type Migration", () => {
  const tenantId = "migration-test-tenant";

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: "Migration Test", slug: "mig" } });

    // Create participants with TEXT data that can be migrated to NUMBER
    for (let i = 0; i < 100; i++) {
      await prisma.participant.create({
        data: {
          tenantId,
          firstName: `User${i}`,
          familyName: "Migration",
          email: `user${i}@mig.test`,
          customData: {
            score: String(Math.floor(Math.random() * 100)),
            category: i % 2 === 0 ? "A" : "B",
            notes: `Note for user ${i}`,
          },
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.participant.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
  });

  it("should safely migrate TEXT to NUMBER", async () => {
    const field = {
      name: "score",
      dataType: "TEXT",
      targetModel: "Participant",
      tenantId,
      isSearchable: false,
    } as any;

    const result = await migrateFieldType({
      field,
      newDataType: "NUMBER",
      transformRule: "CAST",
      dryRun: true,
    });

    expect(result.totalRecords).toBe(100);
    expect(result.successCount).toBe(100);
    expect(result.failureCount).toBe(0);
  });

  it("should detect unsafe TEXT to NUMBER migration when non-numeric data exists", async () => {
    // Add a record with non-numeric score
    await prisma.participant.create({
      data: {
        tenantId,
        firstName: "BadData",
        familyName: "Migration",
        email: "bad@mig.test",
        customData: { score: "not-a-number", category: "A" },
      },
    });

    const field = {
      name: "score",
      dataType: "TEXT",
      targetModel: "Participant",
      tenantId,
      isSearchable: false,
    } as any;

    const result = await migrateFieldType({
      field,
      newDataType: "NUMBER",
      transformRule: "CAST",
      dryRun: true,
    });

    expect(result.failureCount).toBe(1);
    expect(result.failures[0].oldValue).toBe("not-a-number");
  });

  it("should handle migration with DEFAULT fallback", async () => {
    const field = {
      name: "score",
      dataType: "TEXT",
      targetModel: "Participant",
      tenantId,
      isSearchable: false,
    } as any;

    const result = await migrateFieldType({
      field,
      newDataType: "NUMBER",
      transformRule: "DEFAULT",
      defaultValue: 0,
      dryRun: true,
    });

    expect(result.failureCount).toBe(0);
    expect(result.successCount).toBe(101); // includes the bad data record
  });

  it("should check migration safety before applying", async () => {
    const field = await prisma.fieldDefinition.create({
      data: {
        tenantId,
        targetModel: "Participant",
        name: "category",
        label: "Category",
        dataType: "TEXT",
      },
    });

    const safety = await checkMigrationSafety(field.id, tenantId, {
      dataType: "NUMBER",
    });

    expect(safety.safe).toBe(false);
    expect(safety.errors.length).toBeGreaterThan(0);
    expect(safety.affectedRecords).toBeGreaterThan(0);
  });

  it("should allow safe migrations (TEXT to LONG_TEXT)", async () => {
    const field = await prisma.fieldDefinition.create({
      data: {
        tenantId,
        targetModel: "Participant",
        name: "notes",
        label: "Notes",
        dataType: "TEXT",
      },
    });

    const safety = await checkMigrationSafety(field.id, tenantId, {
      dataType: "LONG_TEXT",
    });

    // TEXT to LONG_TEXT is always safe (widening)
    expect(safety.safe).toBe(true);
    expect(safety.errors.length).toBe(0);
  });
});
```

---

## 10. Security

### 10.1 SQL Injection Prevention

All JSONB queries MUST use parameterized queries. Raw string interpolation into SQL is strictly prohibited.

```typescript
// CORRECT: Parameterized JSONB queries
// The field name comes from a validated FieldDefinition record (trusted metadata)
// The value comes from user input and MUST be parameterized

// Safe: value is parameterized via Prisma.sql tagged template
const safeQuery = Prisma.sql`
  "customData"->>${fieldDef.name} ILIKE ${"%" + userInput + "%"}
`;

// Safe: numeric cast with parameterized value
const safeNumeric = Prisma.sql`
  ("customData"->>${fieldDef.name})::NUMERIC = ${Number(userInput)}
`;

// DANGEROUS: Never do this
// const unsafeQuery = `"customData"->>'${fieldName}' = '${value}'`

// DANGEROUS: Never use $executeRawUnsafe with user input
// await prisma.$executeRawUnsafe(`... WHERE ... = '${userValue}'`)
```

**Field name validation:**

```typescript
// app/utils/field-name-sanitizer.server.ts

/**
 * Field names are stored in FieldDefinition and used in JSONB path expressions.
 * They must be strictly validated to prevent injection through field name manipulation.
 */

const VALID_FIELD_NAME = /^[a-z][a-z0-9_]{0,63}$/;

export function sanitizeFieldName(name: string): string {
  if (!VALID_FIELD_NAME.test(name)) {
    throw new Error(`Invalid field name: "${name}". Must match pattern: ^[a-z][a-z0-9_]{0,63}$`);
  }

  // Double-check: no SQL special characters
  if (/['"\\;(){}[\]]/.test(name)) {
    throw new Error(`Field name contains prohibited characters: "${name}"`);
  }

  return name;
}

/**
 * When building expression indexes, field names are used in DDL statements.
 * $executeRawUnsafe is required for DDL, so extra validation is critical.
 */
export function validateFieldNameForDDL(name: string): void {
  sanitizeFieldName(name); // basic validation

  // Additional DDL-specific checks
  const reserved = [
    "select",
    "insert",
    "update",
    "delete",
    "drop",
    "create",
    "alter",
    "table",
    "index",
    "where",
    "from",
    "join",
    "union",
    "grant",
    "revoke",
    "execute",
    "truncate",
  ];
  if (reserved.includes(name.toLowerCase())) {
    throw new Error(`Field name "${name}" is a reserved SQL keyword`);
  }
}
```

### 10.2 Field-Level Access Control

```typescript
// app/services/schema-engine/field-access-control.server.ts

interface FieldPermission {
  fieldId: string;
  roleId: string;
  canRead: boolean;
  canWrite: boolean;
}

/**
 * Filter field definitions based on the user's role permissions.
 * Used to hide sensitive fields from unauthorized roles.
 */
export async function filterFieldsByRole(
  fieldDefs: FieldDef[],
  userRoles: string[],
  action: "read" | "write",
): Promise<FieldDef[]> {
  const permissions = await prisma.fieldPermission.findMany({
    where: {
      fieldId: { in: fieldDefs.map((f) => f.id) },
      roleId: { in: userRoles },
    },
  });

  const permMap = new Map<string, FieldPermission[]>();
  for (const perm of permissions) {
    const perms = permMap.get(perm.fieldId) ?? [];
    perms.push(perm as any);
    permMap.set(perm.fieldId, perms);
  }

  return fieldDefs.filter((field) => {
    const fieldPerms = permMap.get(field.id);

    // If no permissions defined, field is accessible to all (default open)
    if (!fieldPerms || fieldPerms.length === 0) return true;

    // Check if any of the user's roles grant the required access
    return fieldPerms.some((p) => (action === "read" ? p.canRead : p.canWrite));
  });
}

/**
 * Redact field values from response data based on role permissions.
 */
export function redactFieldValues(
  data: Record<string, any>,
  allowedFieldNames: Set<string>,
  allFieldNames: string[],
): Record<string, any> {
  const redacted = { ...data };
  for (const fieldName of allFieldNames) {
    if (!allowedFieldNames.has(fieldName)) {
      redacted[fieldName] = "***REDACTED***";
    }
  }
  return redacted;
}
```

### 10.3 PII Field Marking and Encryption

```typescript
// app/services/schema-engine/pii-protection.server.ts

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Fields can be marked as PII in their config:
 * config: { pii: true, piiCategory: "PERSONAL_ID" }
 *
 * PII categories:
 * - PERSONAL_ID: passport number, national ID, SSN
 * - CONTACT: phone, email (beyond the fixed email field)
 * - FINANCIAL: bank details, tax ID
 * - HEALTH: medical conditions, disabilities
 * - BIOMETRIC: photo, fingerprint references
 */

export type PiiCategory = "PERSONAL_ID" | "CONTACT" | "FINANCIAL" | "HEALTH" | "BIOMETRIC";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

export function isPiiField(field: FieldDef): boolean {
  return (field.config as any)?.pii === true;
}

export function getPiiCategory(field: FieldDef): PiiCategory | null {
  if (!isPiiField(field)) return null;
  return (field.config as any)?.piiCategory ?? "PERSONAL_ID";
}

/**
 * Encrypt PII values before storing in JSONB.
 * Encryption key is tenant-specific, stored in a secure vault.
 */
export function encryptPiiValue(value: string, encryptionKey: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptPiiValue(encryptedValue: string, encryptionKey: Buffer): string {
  if (!encryptedValue.startsWith("enc:")) return encryptedValue;

  const parts = encryptedValue.split(":");
  const iv = Buffer.from(parts[1], "hex");
  const authTag = Buffer.from(parts[2], "hex");
  const encrypted = parts[3];

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Process custom data to encrypt/decrypt PII fields.
 */
export function processCustomDataPii(
  data: Record<string, any>,
  fieldDefs: FieldDef[],
  encryptionKey: Buffer,
  operation: "encrypt" | "decrypt",
): Record<string, any> {
  const result = { ...data };

  for (const field of fieldDefs) {
    if (!isPiiField(field)) continue;
    if (result[field.name] === null || result[field.name] === undefined) continue;

    const value = String(result[field.name]);
    result[field.name] =
      operation === "encrypt"
        ? encryptPiiValue(value, encryptionKey)
        : decryptPiiValue(value, encryptionKey);
  }

  return result;
}

/**
 * Generate PII audit log entry when PII fields are accessed.
 */
export async function logPiiAccess(params: {
  tenantId: string;
  userId: string;
  action: "READ" | "WRITE" | "EXPORT";
  fieldNames: string[];
  recordId: string;
  recordType: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: `PII_${params.action}`,
      entity: params.recordType,
      entityId: params.recordId,
      details: {
        piiFields: params.fieldNames,
        timestamp: new Date().toISOString(),
      },
    },
  });
}
```

### 10.4 Tenant Isolation for Field Definitions

```typescript
// app/middleware/schema-engine-tenant-isolation.server.ts

/**
 * All schema engine operations MUST be scoped to a tenant.
 * This middleware ensures no cross-tenant data access.
 */

export function enforceTenantIsolation(requestedTenantId: string, userTenantIds: string[]): void {
  if (!userTenantIds.includes(requestedTenantId)) {
    throw new Response("Forbidden: access denied to tenant", { status: 403 });
  }
}

/**
 * Verify that a field definition belongs to the expected tenant.
 * Prevents IDOR attacks on field IDs.
 */
export async function verifyFieldOwnership(fieldId: string, tenantId: string): Promise<void> {
  const field = await prisma.fieldDefinition.findFirst({
    where: { id: fieldId },
    select: { tenantId: true },
  });

  if (!field || field.tenantId !== tenantId) {
    throw new Response("Forbidden: field does not belong to tenant", { status: 403 });
  }
}

/**
 * Verify that a custom object belongs to the expected tenant.
 */
export async function verifyObjectOwnership(objectId: string, tenantId: string): Promise<void> {
  const object = await prisma.customObjectDef.findFirst({
    where: { id: objectId },
    select: { tenantId: true },
  });

  if (!object || object.tenantId !== tenantId) {
    throw new Response("Forbidden: object does not belong to tenant", { status: 403 });
  }
}

/**
 * Schema cache keys include tenantId to prevent cross-tenant cache poisoning.
 * The buildCacheKey function in compilation-pipeline.server.ts already enforces this.
 */
```

---

## 11. Performance

### 11.1 JSONB Query Benchmarks

Expected performance characteristics for JSONB queries on PostgreSQL 15+:

| Query Pattern                | Without Index | With Expression Index | With GIN Index   | Records |
| ---------------------------- | ------------- | --------------------- | ---------------- | ------- |
| Equality (`->>'field' = $1`) | 45-80ms       | 0.5-2ms               | N/A              | 100K    |
| Range (`::NUMERIC >= $1`)    | 60-120ms      | 1-5ms                 | N/A              | 100K    |
| ILIKE text search            | 80-200ms      | N/A                   | 5-15ms (trigram) | 100K    |
| Array containment (`@>`)     | 50-100ms      | N/A                   | 2-8ms            | 100K    |
| Key existence (`?`)          | 30-60ms       | N/A                   | 1-3ms            | 100K    |
| Combined (2 filters)         | 100-250ms     | 2-8ms                 | N/A              | 100K    |
| Combined (3+ filters)        | 150-400ms     | 5-15ms                | N/A              | 100K    |

**Benchmark methodology:**

```typescript
// tests/benchmarks/jsonb-query-benchmark.ts

export async function runJsonbBenchmark(config: {
  recordCount: number;
  iterations: number;
  warmupIterations: number;
}) {
  const results: Record<string, number[]> = {};

  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    await runQuerySet();
  }

  // Measure
  for (let i = 0; i < config.iterations; i++) {
    const timings = await runQuerySet();
    for (const [name, ms] of Object.entries(timings)) {
      results[name] = results[name] ?? [];
      results[name].push(ms);
    }
  }

  // Report
  for (const [name, times] of Object.entries(results)) {
    const sorted = times.sort((a, b) => a - b);
    console.log(`${name}:`);
    console.log(`  p50: ${sorted[Math.floor(sorted.length * 0.5)].toFixed(2)}ms`);
    console.log(`  p95: ${sorted[Math.floor(sorted.length * 0.95)].toFixed(2)}ms`);
    console.log(`  p99: ${sorted[Math.floor(sorted.length * 0.99)].toFixed(2)}ms`);
    console.log(`  avg: ${(sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2)}ms`);
  }
}

async function runQuerySet(): Promise<Record<string, number>> {
  const timings: Record<string, number> = {};

  // Equality query
  let start = performance.now();
  await prisma.$queryRaw`
    SELECT COUNT(*) FROM "Participant"
    WHERE "customData"->>'country' = 'US'
      AND "deletedAt" IS NULL
  `;
  timings["equality"] = performance.now() - start;

  // Range query
  start = performance.now();
  await prisma.$queryRaw`
    SELECT COUNT(*) FROM "Participant"
    WHERE ("customData"->>'score')::NUMERIC BETWEEN 70 AND 90
      AND "deletedAt" IS NULL
  `;
  timings["range"] = performance.now() - start;

  // ILIKE query
  start = performance.now();
  await prisma.$queryRaw`
    SELECT COUNT(*) FROM "Participant"
    WHERE "customData"->>'passport_number' ILIKE '%AB%'
      AND "deletedAt" IS NULL
  `;
  timings["ilike"] = performance.now() - start;

  return timings;
}
```

### 11.2 Expression Index Impact Analysis

```
Index Creation Impact:
┌──────────────────────────────────────────────────────────────────┐
│ Metric                    │ Without Index │ With Index │ Delta  │
├──────────────────────────────────────────────────────────────────┤
│ SELECT (equality)         │ 45ms          │ 1.2ms      │ -97%   │
│ SELECT (range)            │ 80ms          │ 3.5ms      │ -96%   │
│ INSERT (single row)       │ 0.8ms         │ 1.1ms      │ +38%   │
│ UPDATE (custom field)     │ 1.0ms         │ 1.4ms      │ +40%   │
│ Disk space (100K records) │ 0 MB          │ 2-5 MB     │ +2-5MB │
│ VACUUM time               │ baseline      │ +10-15%    │ +15%   │
└──────────────────────────────────────────────────────────────────┘

Recommendation: Create expression indexes only for fields where:
1. isSearchable=true AND record count > 100
2. Query frequency > 10 queries/hour on this field
3. Total expression indexes per tenant < 30
```

### 11.3 Field Definition Caching

```
Cache Performance Targets:
┌────────────────────────────────────────────────────────────────┐
│ Cache Layer  │ Hit Rate Target │ Latency  │ TTL      │ Max    │
├────────────────────────────────────────────────────────────────┤
│ L1 In-Memory │ > 95%          │ < 0.1ms  │ 5 min    │ 500    │
│ L2 Redis     │ > 98%          │ < 2ms    │ 15 min   │ 10K    │
│ L3 PostgreSQL│ 100% (source)  │ < 10ms   │ N/A      │ N/A    │
└────────────────────────────────────────────────────────────────┘

Cache Invalidation Patterns:
- Field CRUD operations → invalidate L1 + L2 for tenant
- Tenant configuration change → invalidate all L1 + L2 for tenant
- Deployment → L1 cleared automatically (new workers), L2 retained
- Manual flush → API endpoint to clear all caches for a tenant
```

**Cache monitoring:**

```typescript
// app/services/schema-engine/cache-monitor.server.ts

interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l1Size: number;
  l1HitRate: number;
  l2Hits: number;
  l2Misses: number;
  l2HitRate: number;
  compilationTimeP50: number;
  compilationTimeP99: number;
}

let stats = {
  l1Hits: 0,
  l1Misses: 0,
  l2Hits: 0,
  l2Misses: 0,
  compilationTimes: [] as number[],
};

export function recordCacheHit(layer: "l1" | "l2"): void {
  if (layer === "l1") stats.l1Hits++;
  else stats.l2Hits++;
}

export function recordCacheMiss(layer: "l1" | "l2"): void {
  if (layer === "l1") stats.l1Misses++;
  else stats.l2Misses++;
}

export function recordCompilationTime(ms: number): void {
  stats.compilationTimes.push(ms);
  // Keep last 1000 measurements
  if (stats.compilationTimes.length > 1000) {
    stats.compilationTimes = stats.compilationTimes.slice(-1000);
  }
}

export function getCacheStats(): CacheStats {
  const l1Total = stats.l1Hits + stats.l1Misses;
  const l2Total = stats.l2Hits + stats.l2Misses;
  const sorted = [...stats.compilationTimes].sort((a, b) => a - b);

  return {
    l1Hits: stats.l1Hits,
    l1Misses: stats.l1Misses,
    l1Size: 0, // read from LRU cache
    l1HitRate: l1Total > 0 ? stats.l1Hits / l1Total : 0,
    l2Hits: stats.l2Hits,
    l2Misses: stats.l2Misses,
    l2HitRate: l2Total > 0 ? stats.l2Hits / l2Total : 0,
    compilationTimeP50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
    compilationTimeP99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
  };
}
```

### 11.4 Query Plan Analysis

```typescript
// app/services/schema-engine/query-plan-analyzer.server.ts

interface QueryPlanAnalysis {
  query: string;
  planType: "SEQ_SCAN" | "INDEX_SCAN" | "BITMAP_SCAN" | "INDEX_ONLY_SCAN";
  estimatedCost: number;
  actualTimeMs: number;
  rowsReturned: number;
  rowsScanned: number;
  indexUsed?: string;
  recommendations: string[];
}

export async function analyzeCustomFieldQuery(
  tenantId: string,
  fieldName: string,
  filterValue: string,
): Promise<QueryPlanAnalysis> {
  const explainResult = await prisma.$queryRaw<any[]>`
    EXPLAIN (ANALYZE, FORMAT JSON)
    SELECT * FROM "Participant"
    WHERE "tenantId" = ${tenantId}
      AND "customData"->>${fieldName} = ${filterValue}
      AND "deletedAt" IS NULL
    LIMIT 100
  `;

  const plan = explainResult[0]["QUERY PLAN"][0];
  const planNode = plan.Plan;

  const analysis: QueryPlanAnalysis = {
    query: `customData->>'${fieldName}' = '${filterValue}'`,
    planType: detectPlanType(planNode),
    estimatedCost: planNode["Total Cost"],
    actualTimeMs: plan["Execution Time"],
    rowsReturned: planNode["Actual Rows"],
    rowsScanned: planNode["Actual Rows"] * (planNode["Actual Loops"] ?? 1),
    indexUsed: findIndexInPlan(planNode),
    recommendations: [],
  };

  // Generate recommendations
  if (analysis.planType === "SEQ_SCAN" && analysis.rowsScanned > 1000) {
    analysis.recommendations.push(
      `Sequential scan detected on ${analysis.rowsScanned} rows. Consider creating an expression index on "customData"->>'${fieldName}'.`,
    );
  }

  if (analysis.actualTimeMs > 50) {
    analysis.recommendations.push(
      `Query execution time ${analysis.actualTimeMs.toFixed(1)}ms exceeds 50ms target.`,
    );
  }

  return analysis;
}

function detectPlanType(node: any): QueryPlanAnalysis["planType"] {
  const nodeType = node["Node Type"];
  if (nodeType === "Seq Scan") return "SEQ_SCAN";
  if (nodeType === "Index Scan") return "INDEX_SCAN";
  if (nodeType === "Bitmap Heap Scan") return "BITMAP_SCAN";
  if (nodeType === "Index Only Scan") return "INDEX_ONLY_SCAN";

  // Check child nodes
  if (node.Plans) {
    for (const child of node.Plans) {
      const childType = detectPlanType(child);
      if (childType !== "SEQ_SCAN") return childType;
    }
  }

  return "SEQ_SCAN";
}

function findIndexInPlan(node: any): string | undefined {
  if (node["Index Name"]) return node["Index Name"];
  if (node.Plans) {
    for (const child of node.Plans) {
      const idx = findIndexInPlan(child);
      if (idx) return idx;
    }
  }
  return undefined;
}
```

### 11.5 Pagination with Field Sorting

```typescript
// app/services/schema-engine/pagination.server.ts

import { Prisma } from "@prisma/client";

interface PaginationOptions {
  page: number;
  pageSize: number;
  sortField?: string; // "firstName", "cf_score", "cf_country"
  sortDirection?: "asc" | "desc";
  cursor?: string; // for cursor-based pagination
}

/**
 * Offset-based pagination for custom field sorting.
 * Works well for < 100K records.
 */
export function buildOffsetPagination(
  options: PaginationOptions,
  fieldDefinitions: FieldDef[],
): {
  orderBy: Prisma.Sql;
  limit: Prisma.Sql;
  offset: Prisma.Sql;
} {
  const { page = 1, pageSize = 25, sortField, sortDirection = "asc" } = options;

  let orderBy: Prisma.Sql;
  if (sortField?.startsWith("cf_")) {
    const fieldName = sortField.replace("cf_", "");
    const fieldDef = fieldDefinitions.find((f) => f.name === fieldName);
    if (fieldDef) {
      const cast = getCastForSorting(fieldDef.dataType);
      const dir = sortDirection === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
      orderBy = Prisma.sql`ORDER BY ("customData"->>${Prisma.raw(`'${fieldName}'`)})${Prisma.raw(cast)} ${dir} NULLS LAST`;
    } else {
      orderBy = Prisma.sql`ORDER BY "createdAt" DESC`;
    }
  } else if (sortField) {
    const dir = sortDirection === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
    orderBy = Prisma.sql`ORDER BY "${Prisma.raw(sortField)}" ${dir} NULLS LAST`;
  } else {
    orderBy = Prisma.sql`ORDER BY "createdAt" DESC`;
  }

  return {
    orderBy,
    limit: Prisma.sql`LIMIT ${pageSize}`,
    offset: Prisma.sql`OFFSET ${(page - 1) * pageSize}`,
  };
}

/**
 * Keyset (cursor-based) pagination for large datasets.
 * More efficient than offset for deep pages.
 */
export function buildKeysetPagination(
  options: PaginationOptions & { cursor?: string },
  fieldDefinitions: FieldDef[],
): {
  whereClause: Prisma.Sql;
  orderBy: Prisma.Sql;
  limit: Prisma.Sql;
} {
  const { pageSize = 25, cursor, sortField, sortDirection = "asc" } = options;

  let whereClause = Prisma.sql`TRUE`;
  let orderBy: Prisma.Sql;

  if (cursor && sortField?.startsWith("cf_")) {
    const fieldName = sortField.replace("cf_", "");
    const fieldDef = fieldDefinitions.find((f) => f.name === fieldName);
    if (fieldDef) {
      const cast = getCastForSorting(fieldDef.dataType);
      const op = sortDirection === "asc" ? ">" : "<";
      const decodedCursor = decodeCursor(cursor);

      whereClause = Prisma.sql`
        (("customData"->>${Prisma.raw(`'${fieldName}'`)})${Prisma.raw(cast)} ${Prisma.raw(op)} ${decodedCursor.value}
         OR (("customData"->>${Prisma.raw(`'${fieldName}'`)})${Prisma.raw(cast)} = ${decodedCursor.value}
             AND "id" > ${decodedCursor.id}))
      `;
      const dir = sortDirection === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
      orderBy = Prisma.sql`ORDER BY ("customData"->>${Prisma.raw(`'${fieldName}'`)})${Prisma.raw(cast)} ${dir}, "id" ASC`;
    } else {
      orderBy = Prisma.sql`ORDER BY "createdAt" DESC, "id" ASC`;
    }
  } else {
    orderBy = Prisma.sql`ORDER BY "createdAt" DESC, "id" ASC`;
  }

  return {
    whereClause,
    orderBy,
    limit: Prisma.sql`LIMIT ${pageSize + 1}`, // fetch one extra to check hasMore
  };
}

function getCastForSorting(dataType: string): string {
  switch (dataType) {
    case "NUMBER":
      return "::NUMERIC";
    case "DATE":
      return "::DATE";
    case "DATETIME":
      return "::TIMESTAMPTZ";
    case "BOOLEAN":
      return "::BOOLEAN";
    default:
      return ""; // TEXT sorting (collation-aware)
  }
}

function decodeCursor(cursor: string): { id: string; value: string } {
  const decoded = Buffer.from(cursor, "base64").toString("utf8");
  const [id, value] = decoded.split("|");
  return { id, value };
}

export function encodeCursor(id: string, value: any): string {
  return Buffer.from(`${id}|${String(value)}`).toString("base64");
}
```

---

## 12. Open Questions

| #     | Question                                            | Context                                                                                                                                    | Proposed Approach                                                                                                                                                                                       | Status       |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| OQ-1  | **Formula field complexity limits**                 | Formula fields can reference other formula fields, creating chains. How deep should this be allowed?                                       | Limit to 10 levels of nesting. Validate at definition time by building the dependency graph. Reject formulas that create cycles.                                                                        | Under review |
| OQ-2  | **Cross-object references**                         | REFERENCE fields can link to custom objects. Should we allow cross-tenant references? Cross-event?                                         | References are always scoped to the same tenant. Cross-event references are allowed for TENANT-scoped objects. EVENT-scoped objects can only be referenced within the same event.                       | Under review |
| OQ-3  | **Field definition versioning strategy**            | How long should version history be retained? Should old versions be auto-pruned?                                                           | Retain last 50 versions per field. Auto-prune versions older than 1 year. Platform admin can export full history before pruning.                                                                        | Under review |
| OQ-4  | **Custom field search indexing approach**           | Full-text search on LONG_TEXT custom fields. Should we use PostgreSQL tsvector or an external search engine?                               | Start with PostgreSQL GIN/trgm indexes. If search requirements exceed PostgreSQL capabilities, evaluate Meilisearch or Elasticsearch as a secondary index.                                              | Under review |
| OQ-5  | **Maximum JSONB document size**                     | Large numbers of custom fields per participant could grow the JSONB column significantly. At what point does performance degrade?          | Benchmark with 100+ fields per record. Set initial limit at 1MB per JSONB column. Monitor average document size per tenant and alert at 500KB.                                                          | Under review |
| OQ-6  | **Custom field data export compliance**             | PII fields in JSONB need to be included in GDPR data export requests. How do we discover all PII-marked fields across all records?         | Maintain a PII field registry (fields with `config.pii=true`). GDPR export queries scan all records for the tenant and extract PII-marked fields. Consider a materialized view for large datasets.      | Under review |
| OQ-7  | **Formula field performance at scale**              | Evaluating formula fields on read time adds latency. Should formulas be pre-computed and stored?                                           | For simple formulas, evaluate at read time with caching. For complex formulas or high-traffic fields, pre-compute on write and store the result in a separate JSONB key (e.g., `_computed.field_name`). | Under review |
| OQ-8  | **Custom object relationship types**                | Currently custom objects can link to participants. Should we support object-to-object relationships (e.g., Vehicle belongs to Department)? | Phase 1: Only participant-to-object links. Phase 2: Object-to-object via REFERENCE fields pointing to other custom object slugs. Keep relationships flat (no deep nesting).                             | Under review |
| OQ-9  | **Concurrent field definition edits**               | Two admins editing the same field definition simultaneously. Optimistic locking? Last-write-wins?                                          | Use optimistic locking with `updatedAt` as the version token. Return 409 Conflict if the field was modified since the admin loaded it. Show a diff dialog for manual merge.                             | Under review |
| OQ-10 | **Field definition migration between environments** | Moving field definitions from staging to production. How to handle field ID differences?                                                   | Export/import uses field `name` (not `id`) as the matching key. Import mode UPSERT matches by `(tenantId, targetModel, name)` and updates existing definitions. IDs are regenerated on import.          | Under review |

---

## Appendix

### A. Glossary

| Term                     | Definition                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custom Field**         | A tenant-defined data field stored in a JSONB column rather than as a dedicated database column. Defined by a `FieldDefinition` metadata record.                           |
| **Custom Object**        | An entirely new entity type defined by a tenant (e.g., Vehicle Registry). Defined by a `CustomObjectDef` with associated `FieldDefinition` records.                        |
| **Custom Object Record** | An actual data row in a custom object. Stores field values in a `data` JSONB column.                                                                                       |
| **Expression Index**     | A PostgreSQL index on a computed expression, e.g., `CREATE INDEX ON "Participant" ((("customData"->>'score')::NUMERIC))`. Enables efficient queries on JSONB field values. |
| **Field Data Type**      | The type of data a custom field holds (TEXT, NUMBER, BOOLEAN, DATE, ENUM, etc.). Determines validation, rendering, and query casting.                                      |
| **Field Definition**     | A `FieldDefinition` record that describes a custom field's name, type, constraints, and rendering configuration.                                                           |
| **Field Inheritance**    | The mechanism by which field definitions at the tenant level can be overridden at the event or participant-type level.                                                     |
| **Formula Field**        | A computed field whose value is derived from other fields using an expression (e.g., `{price} * {quantity}`).                                                              |
| **GIN Index**            | Generalized Inverted Index in PostgreSQL. Used for JSONB containment queries (`@>`) and full-text search.                                                                  |
| **Hybrid Approach**      | The architecture pattern of using typed Prisma columns for universal fields and JSONB for dynamic per-tenant fields.                                                       |
| **JSONB**                | PostgreSQL binary JSON type. Supports indexing, querying with operators like `->>`, `->`, `@>`, and `?`.                                                                   |
| **LRU Cache**            | Least Recently Used cache. Evicts the least recently accessed entries when the cache is full. Used for compiled schema caching.                                            |
| **Object Scope**         | Whether a custom object is available across all events (TENANT) or scoped to a specific event (EVENT).                                                                     |
| **PII**                  | Personally Identifiable Information. Custom fields can be marked as PII for encryption and audit logging.                                                                  |
| **Schema Compilation**   | The process of transforming `FieldDefinition` metadata records into a runtime Zod validation schema.                                                                       |
| **Sort Order**           | An integer field on `FieldDefinition` that determines the display order of fields in forms and lists.                                                                      |
| **Target Model**         | The built-in Prisma model that a custom field applies to (e.g., "Participant", "Event"). Null for custom object fields.                                                    |
| **Tenant Isolation**     | The guarantee that one tenant's field definitions and data are never accessible to another tenant.                                                                         |
| **Zod**                  | A TypeScript-first schema validation library used to build runtime validation schemas from field metadata.                                                                 |

### B. References

| #   | Reference                                                                                                      | Description                                       |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | [SYSTEM_DESIGN.md Section 4](../SYSTEM_DESIGN.md)                                                              | Source architecture for the Dynamic Schema Engine |
| 2   | [Module 00: Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md)                                              | Platform architecture and design principles       |
| 3   | [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                                              | Core Prisma models referenced by custom fields    |
| 4   | [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)                   | JSONB storage, operators, and indexing            |
| 5   | [PostgreSQL Expression Index Documentation](https://www.postgresql.org/docs/current/indexes-expressional.html) | Creating indexes on expressions                   |
| 6   | [Zod Documentation](https://zod.dev/)                                                                          | Zod schema validation library                     |
| 7   | [Conform Documentation](https://conform.guide/)                                                                | Form validation library for Remix                 |
| 8   | [Prisma Raw Queries](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)         | Using raw SQL with Prisma                         |
| 9   | [dnd-kit Documentation](https://dndkit.com/)                                                                   | Drag-and-drop library for field reordering        |
| 10  | [LRU Cache (npm)](https://www.npmjs.com/package/lru-cache)                                                     | LRU cache implementation used for schema caching  |

---

_End of Module 02: Dynamic Schema Engine_
