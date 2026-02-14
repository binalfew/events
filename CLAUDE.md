# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

This is a **design documentation repository** (no source code) for a multi-tenant accreditation platform. It contains the complete system design across 19 modular specification documents. There is no build system, test suite, or runnable code — the deliverables are Markdown documents.

## Repository Structure

- `SYSTEM_DESIGN.md` — Original monolithic design document (v1.0, serves as reference)
- `modules/` — Expanded modular specifications (the authoritative source):
  - **00** Architecture Overview (foundation — all modules depend on this)
  - **01** Data Model Foundation (Prisma schema, 32+ models, hybrid fixed+JSONB strategy)
  - **02** Dynamic Schema Engine (runtime field definitions → Zod → Conform pipeline)
  - **03** Visual Form Designer (@dnd-kit drag-and-drop form builder)
  - **04** Workflow Engine (state machine with conditional routing, @xyflow/react visual builder)
  - **05** Security & Access Control (RBAC, tenant isolation, session + 2FA)
  - **06** Infrastructure & DevOps (Docker, GitHub Actions CI/CD, observability)
  - **07** API & Integration Layer (REST + SSE real-time updates + webhooks)
  - **08** UI/UX & Frontend (React 18, Radix UI, Tailwind CSS, PWA/offline)
  - **09–16** Domain modules (Registration, Operations, Logistics, Protocol, People, Content, Compliance, Participant Experience)
  - **17** Settings & Configuration
  - **18** Implementation Roadmap (7 phases, Q1 2026–Q1 2027)

## Technology Stack Being Designed

| Layer          | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Runtime        | Node.js >= 20                                             |
| Framework      | React Router 7 + Vite + Express 4                         |
| Database       | PostgreSQL 16 + Prisma 5 (JSONB for dynamic fields)       |
| UI             | React 18, Radix UI, Tailwind CSS                          |
| Forms          | Conform + Zod (server-validated, progressive enhancement) |
| Visual Editors | @dnd-kit (forms), @xyflow/react (workflows)               |
| File Storage   | Azure Blob Storage                                        |
| Real-Time      | Server-Sent Events (SSE)                                  |
| Testing        | Vitest + MSW + Playwright                                 |

## Key Architectural Patterns

- **Multi-tenancy**: Every data record carries `tenantId`; composite unique constraints prevent cross-tenant collisions
- **Hybrid schema**: Fixed Prisma columns for universal fields (identity, workflow state) + JSONB `customData` columns for event-specific fields defined at runtime
- **Dynamic Schema Pipeline**: `CustomFieldDef` metadata → Zod schema generation → Conform form integration → GIN/expression indexes for query performance
- **Configuration over Code**: Tenant admins customize events through UI-based field definitions, form designers, and workflow builders — no migrations or deployments needed
- **Offline-first**: Badge printing, collection, and scanning work without continuous connectivity via Service Worker/PWA

## Module Dependencies

Modules declare explicit dependency chains in their headers (`Requires`, `Required By`, `Integrates With`). The critical path is:

```
00 Architecture → 01 Data Model → 02 Dynamic Schema → 03 Form Designer
                                                     → 04 Workflow Engine
05 Security + 06 Infrastructure are cross-cutting (required by all)
```

## Working with These Documents

- Each module follows a consistent structure: Overview → Architecture → Data Model → API Specification → Business Logic → User Interface → Integration Points → Configuration → Testing Strategy → Security → Performance → Open Questions
- When making changes, check the `Integrates With` headers to identify affected modules
- `SYSTEM_DESIGN.md` is the original monolith; the `modules/` directory is the expanded authoritative version — keep them conceptually aligned but the modules take precedence
- The "Open Questions & Decisions" section at the end of each module tracks unresolved design decisions
