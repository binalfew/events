# Phase 1: Dynamic Schema + Core Reliability — Task Index

**Duration:** 6 weeks
**Goal:** Extensible data model, hardened workflow engine, security completeness
**Team:** 2 Senior Backend Engineers + 1 Frontend Developer + 1 QA Engineer

## Prerequisites (from Phase 0)

- CI green on every PR (lint + typecheck + test + build)
- Docker Compose starts full stack locally
- Sentry capturing unhandled exceptions
- All foreign key columns have corresponding database indexes
- CSP nonces generated per request; no `unsafe-inline` in production scripts

## Quality Gate (Phase 1 → Phase 2)

All of the following must be true before Phase 2 begins:

- Admin can create, edit, reorder, and delete field definitions
- Fields render dynamically on registration forms
- JSONB queries support filtering by field values with expression indexes
- Workflow versioning snapshots active version when participant enters workflow
- SLA overdue detection runs as background job every 5 minutes
- Optimistic locking prevents concurrent approve/reject on same participant
- Rate limiting active on all authenticated API routes
- File uploads scanned for malware before acceptance
- Dynamic Zod schemas validate custom data on every form submission
- Unit test coverage ≥ 85% for new code

## Task List

| Task ID | Title                                  | Suggested Assignee | Depends On   | Est. |
| ------- | -------------------------------------- | ------------------ | ------------ | ---- |
| P1-00   | Core Data Model Migration              | Senior Backend     | —            | 3d   |
| P1-01   | Authentication & Session Management    | Senior Backend     | P1-00        | 4d   |
| P1-02   | Custom Field Definition CRUD           | Senior Backend     | P1-00        | 3d   |
| P1-03   | Dynamic Zod Schema Builder             | Senior Backend     | P1-02        | 2d   |
| P1-04   | Dynamic Form Renderer                  | Frontend           | P1-03        | 3d   |
| P1-05   | Field Admin UI                         | Frontend           | P1-01, P1-04 | 4d   |
| P1-06   | JSONB Query Layer & Expression Indexes | Senior Backend     | P1-00        | 3d   |
| P1-07   | Workflow Versioning                    | Senior Backend     | P1-00        | 3d   |
| P1-08   | SLA Enforcement                        | Senior Backend     | P1-07        | 3d   |
| P1-09   | Optimistic Locking                     | Senior Backend     | P1-00        | 2d   |
| P1-10   | Rate Limiting Enhancement              | Senior Backend     | P1-01        | 2d   |
| P1-11   | File Upload Scanning                   | Senior Backend     | P1-00        | 2d   |

## Dependency Graph

```
P1-00 (Data Models) ──┬──► P1-01 (Auth) ──┬──► P1-05 (Admin UI)
                      │                    └──► P1-10 (Rate Limiting)
                      │
                      ├──► P1-02 (Field CRUD) ──► P1-03 (Zod Builder) ──► P1-04 (Renderer) ──► P1-05 (Admin UI)
                      │
                      ├──► P1-06 (JSONB Query)
                      │
                      ├──► P1-07 (WF Versioning) ──► P1-08 (SLA)
                      │
                      ├──► P1-09 (Optimistic Lock)
                      │
                      └──► P1-11 (File Scanning)
```

## Suggested Timeline (6 weeks)

**Week 1:** P1-00 (both backends collaborate on migration), then P1-01, P1-02, P1-09, P1-11 (fan out)
**Week 2:** P1-03, P1-06, P1-07 (first wave of dependents)
**Week 3:** P1-04, P1-08, P1-10 (second wave)
**Week 4:** P1-05 (admin UI — needs auth + renderer complete)
**Week 5:** Integration testing, edge case coverage, cross-task integration
**Week 6:** Quality gate verification, documentation, performance benchmarks

## Module References

| Module                                                                          | Scope in Phase 1                                      |
| ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [01 Data Model Foundation](../../modules/01-DATA-MODEL-FOUNDATION.md)           | Participant model, customData JSONB, ParticipantType  |
| [02 Dynamic Schema Engine](../../modules/02-DYNAMIC-SCHEMA-ENGINE.md)           | Full: CustomFieldDef, Zod builder, renderer, admin UI |
| [04 Workflow Engine](../../modules/04-WORKFLOW-ENGINE.md)                       | Hardening: versioning, SLA enforcement                |
| [05 Security & Access Control](../../modules/05-SECURITY-AND-ACCESS-CONTROL.md) | Continuation: auth, rate limiting, file scanning      |
| [07 API & Integration Layer](../../modules/07-API-AND-INTEGRATION-LAYER.md)     | Partial: optimistic locking                           |
