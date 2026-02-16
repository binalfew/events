# P2-01: FormTemplate Model

| Field                  | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Task ID**            | P2-01                                                                        |
| **Phase**              | 2 — Visual Form Designer + UX                                                |
| **Category**           | Form Designer                                                                |
| **Suggested Assignee** | Backend Developer                                                            |
| **Depends On**         | P2-00 (Settings & Feature Flags)                                             |
| **Blocks**             | P2-02 (Three-Panel Designer UI)                                              |
| **Estimated Effort**   | 3 days                                                                       |
| **Module References**  | [Module 03 §Data Model](../../modules/03-VISUAL-FORM-DESIGNER.md#data-model) |

---

## Context

The form designer needs a persistence layer for form templates. A `FormTemplate` holds the JSONB `definition` that describes pages, sections, fields, layout, and conditional rules. This is the data backbone for all designer features.

---

## Deliverables

### 1. Prisma Models

**FormTemplate** — a reusable form design tied to an event and participant type.

```prisma
model FormTemplate {
  id                String    @id @default(cuid())
  tenantId          String
  eventId           String
  participantTypeId String?
  name              String
  description       String?
  version           Int       @default(1)
  definition        Json      @default("{}")
  isActive          Boolean   @default(true)
  publishedAt       DateTime?
  createdBy         String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  tenant           Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  event            Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantType  ParticipantType? @relation(fields: [participantTypeId], references: [id])

  @@unique([tenantId, eventId, participantTypeId, name])
  @@index([tenantId, eventId])
  @@index([tenantId, eventId, isActive])
}
```

**FormVersion** — snapshot of a form template at a point in time.

```prisma
model FormVersion {
  id             String   @id @default(cuid())
  formTemplateId String
  version        Int
  definition     Json
  changeHash     String?
  publishedBy    String?
  publishedAt    DateTime?
  createdAt      DateTime @default(now())

  @@unique([formTemplateId, version])
  @@index([formTemplateId])
}
```

### 2. Form Definition JSON Schema

Define TypeScript types for the `definition` JSONB structure:

```typescript
type FormDefinition = {
  pages: FormPage[];
  settings?: FormSettings;
};

type FormPage = {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  conditions?: VisibilityCondition[];
};

type FormSection = {
  id: string;
  title?: string;
  columns: 1 | 2 | 3 | 4;
  defaultCollapsed?: boolean;
  fields: FormFieldPlacement[];
  conditions?: VisibilityCondition[];
};

type FormFieldPlacement = {
  fieldDefinitionId: string;
  colSpan?: number;
  rowSpan?: number;
  conditions?: VisibilityCondition[];
};
```

Create `app/types/form-designer.ts` for shared types.

### 3. Service Layer

Create `app/services/form-templates.server.ts`:

- `listFormTemplates(tenantId, eventId, filters?)` — list with pagination
- `getFormTemplate(id, tenantId)` — get by ID with tenant isolation
- `createFormTemplate(input, ctx)` — create with audit log
- `updateFormTemplate(id, input, ctx)` — update with version bump
- `deleteFormTemplate(id, ctx)` — soft delete (set isActive = false)
- `publishFormTemplate(id, ctx)` — set publishedAt, create FormVersion snapshot
- `cloneFormTemplate(id, newName, ctx)` — deep copy

### 4. API Routes

- `GET /api/v1/form-templates?eventId=` — list templates
- `POST /api/v1/form-templates` — create
- `PUT /api/v1/form-templates/:id` — update
- `DELETE /api/v1/form-templates/:id` — soft delete
- `POST /api/v1/form-templates/:id/publish` — publish version
- `POST /api/v1/form-templates/:id/clone` — clone template

### 5. Zod Validation Schemas

Create `app/lib/schemas/form-template.ts`:

- `createFormTemplateSchema` — validates name, eventId, participantTypeId
- `updateFormTemplateSchema` — validates partial updates including definition
- `formDefinitionSchema` — validates the JSONB definition structure

---

## Acceptance Criteria

- [ ] FormTemplate and FormVersion models created with migration
- [ ] CRUD endpoints pass permission checks (require `form:create`, `form:update`, etc.)
- [ ] Tenant isolation enforced on all queries
- [ ] Publishing creates a FormVersion snapshot with hash dedup
- [ ] Cloning deep-copies the definition
- [ ] Form definition JSON validated with Zod on create/update
- [ ] Integration tests for service layer
