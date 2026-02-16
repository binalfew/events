# P2-07: Section Templates

| Field                  | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| **Task ID**            | P2-07                                                                      |
| **Phase**              | 2 — Visual Form Designer + UX                                              |
| **Category**           | Form Designer                                                              |
| **Suggested Assignee** | Frontend Developer + Backend Developer                                     |
| **Depends On**         | P2-03 (Sections & Pages)                                                   |
| **Blocks**             | —                                                                          |
| **Estimated Effort**   | 3 days                                                                     |
| **Module References**  | [Module 03 §Templates](../../modules/03-VISUAL-FORM-DESIGNER.md#templates) |

---

## Context

Common form sections (e.g., "Personal Information", "Travel Details", "Document Uploads") are reused across events. Section templates let admins save and reuse section layouts without rebuilding them each time.

---

## Deliverables

### 1. Prisma Model

```prisma
model SectionTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  definition  Json     // FormSection structure
  isActive    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, name])
  @@index([tenantId])
}
```

### 2. Service Layer

Create `app/services/section-templates.server.ts`:

- `listSectionTemplates(tenantId)` — list with search/filter
- `createSectionTemplate(input, ctx)` — save section as template
- `updateSectionTemplate(id, input, ctx)` — update
- `deleteSectionTemplate(id, ctx)` — soft delete

### 3. API Routes

- `GET /api/v1/section-templates` — list templates
- `POST /api/v1/section-templates` — create
- `PUT /api/v1/section-templates/:id` — update
- `DELETE /api/v1/section-templates/:id` — soft delete

### 4. Template Library in Designer

Add a "Templates" tab in the field palette (left panel):

- List of saved section templates
- Search by name
- Drag template into canvas to create a deep copy
- "Save as template" context menu on any section in the canvas

### 5. Deep Copy Semantics

- Adding a template to a form creates an independent copy (not a reference)
- Editing the template after insertion does not affect existing forms
- Field placements in the template reference FieldDefinition IDs — warn if a field doesn't exist in the target event

---

## Acceptance Criteria

- [ ] SectionTemplate model created with migration
- [ ] CRUD API endpoints with tenant isolation
- [ ] Template library shows in designer left panel
- [ ] Dragging template into canvas creates a deep copy
- [ ] "Save as template" context menu on sections
- [ ] Template search by name works
- [ ] Warning shown when template references missing fields
- [ ] Soft delete for templates
