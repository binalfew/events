# Integration Plan: Connecting the End-to-End Workflow

## Goal

Connect all existing building blocks (dynamic field definitions, form designer, field renderer, schema builder, workflow engine) into a working end-to-end flow so admins can create events, register participants with dynamic fields, and manage them through the workflow.

## Prerequisites

- Phase 0–5 completed
- Seed data available (tenant, admin user, permissions)

## Tasks

| ID     | Title                             | Depends On | Estimated Effort |
| ------ | --------------------------------- | ---------- | ---------------- |
| INT-01 | Event CRUD UI                     | —          | S                |
| INT-02 | Participant Registration Form     | INT-01     | M                |
| INT-03 | Participant Detail Page           | INT-02     | M                |
| INT-04 | Participant Edit Page             | INT-03     | M                |
| INT-05 | Custom Fields in Participant List | INT-03     | S                |
| INT-06 | Form Template to Registration     | INT-03     | M                |

## Dependency Graph

```
INT-01: Event CRUD
  └→ INT-02: Add Participant (connects FieldRenderer + schema builder)
       └→ INT-03: Participant Detail
            ├→ INT-04: Participant Edit
            ├→ INT-05: Custom Field Columns
            └→ INT-06: Form-based Registration
```

## Verification

After all 6 tasks:

1. Admin creates event → defines custom fields → designs form → publishes form
2. Admin adds participant (manual or via form) with dynamic fields validated by schema builder
3. Participant appears in list with custom field columns visible
4. Admin clicks participant → sees full detail → edits data → approves/rejects
5. Workflow progresses through steps
