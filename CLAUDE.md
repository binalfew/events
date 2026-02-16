# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

A multi-tenant accreditation platform built with React Router 7, Express 5, Prisma 7, and PostgreSQL. The project includes both implementation code and design documentation.

## Repository Structure

```
app/                    # React Router application code
  lib/                  # Server/client utilities (db, env, logger, sentry, nonce)
  routes/               # Route modules
  utils/                # Shared utilities (soft-delete, etc.)
  entry.server.tsx      # SSR entry with CSP nonce propagation
  entry.client.tsx      # Client hydration entry
  root.tsx              # Root layout with nonce, Sentry integration
server/                 # Express server (plain .js/.ts for Node.js entry)
  app.ts                # Express app with security middleware + React Router handler
  index.ts              # Server entry point
  security.ts           # Helmet CSP, CORS, rate limiting, nonce generation
prisma/                 # Prisma schema and seed
tests/                  # Test suites
  e2e/                  # Playwright end-to-end tests
  integration/          # Integration tests
  factories/            # Test data factories
  mocks/                # MSW handlers
  setup/                # Test setup files
docs/                   # Documentation
  modules/              # 19 modular design specifications (00–18)
  tasks/                # Implementation task definitions by phase
  PHASE-0-COMPLETION.md # Detailed Phase 0 completion report
```

## Technology Stack

| Layer          | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Runtime        | Node.js 22 LTS                                            |
| Framework      | React Router 7 + Vite + Express 5                         |
| Database       | PostgreSQL 16 + Prisma 7 (driver adapters, JSONB)         |
| UI             | React 18, Radix UI, Tailwind CSS                          |
| Forms          | Conform + Zod (server-validated, progressive enhancement) |
| Visual Editors | @dnd-kit (forms), @xyflow/react (workflows)               |
| File Storage   | Azure Blob Storage                                        |
| Real-Time      | Server-Sent Events (SSE)                                  |
| Testing        | Vitest 4 + MSW + Playwright                               |
| Error Tracking | Sentry (graceful no-op when DSN not configured)           |

## Key Architectural Patterns

- **Multi-tenancy**: Every data record carries `tenantId`; composite unique constraints prevent cross-tenant collisions
- **Hybrid schema**: Fixed Prisma columns for universal fields (identity, workflow state) + JSONB `extras` columns for event-specific fields defined at runtime
- **Dynamic Schema Pipeline**: `FieldDefinition` metadata → Zod schema generation → Conform form integration → GIN/expression indexes for query performance
- **Configuration over Code**: Tenant admins customize events through UI-based field definitions, form designers, and workflow builders — no migrations or deployments needed
- **Offline-first**: Badge printing, collection, and scanning work without continuous connectivity via Service Worker/PWA
- **CSP Nonce Pipeline**: Nonce generated in Express middleware → passed via `AppLoadContext` → `NonceProvider` React context → `renderToPipeableStream` options
- **Prisma 7 Driver Adapters**: `@prisma/adapter-pg` + `pg` package; no `DATABASE_URL` in schema.prisma

## Development

```bash
fnm use          # Switch to Node 22 (reads .node-version)
npm install
npm run dev      # Start dev server
npm run typecheck
npm run test     # Vitest unit tests
npm run test:e2e # Playwright e2e tests
```

## Design Documents

The `docs/modules/` directory contains 19 modular specifications (the authoritative design source):

- **00** Architecture Overview (foundation — all modules depend on this)
- **01** Data Model Foundation (Prisma schema, 32+ models, hybrid fixed+JSONB strategy)
- **02–04** Dynamic Schema Engine, Visual Form Designer, Workflow Engine
- **05–06** Security & Access Control, Infrastructure & DevOps (cross-cutting)
- **07–08** API & Integration Layer, UI/UX & Frontend
- **09–16** Domain modules (Registration, Operations, Logistics, Protocol, People, Content, Compliance, Participant Experience)
- **17** Settings & Configuration
- **18** Implementation Roadmap (7 phases)

Modules declare dependency chains in their headers (`Requires`, `Required By`, `Integrates With`).

## Task Completion Workflow

After completing each implementation task (e.g., P2-00, P2-01), update the phase completion document at `docs/PHASE-{N}-COMPLETION.md`. If the file does not yet exist, create it. Each entry should include:

- Task ID and title
- Summary of what was implemented (files created/modified)
- Verification results (typecheck, tests, seed, migration)
- Any notable decisions or deviations from the plan
