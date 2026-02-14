# Phase 0: Foundation — Task Index

**Duration:** 4 weeks
**Goal:** Scaffold the application, production-ready infrastructure, security hardening, testing framework, CI/CD pipeline
**Team:** 1 Senior Backend Engineer + 1 DevOps Engineer

## Quality Gate (Phase 0 → Phase 1)

All of the following must be true before Phase 1 begins:

- CI green on every PR (lint + typecheck + test + build)
- Docker Compose starts full stack locally in under 60 seconds
- Sentry capturing unhandled exceptions in staging
- All foreign key columns have corresponding database indexes
- No `unsafe-inline` in production CSP headers

## Task List

| Task ID | Title                                               | Suggested Assignee | Depends On          | Est. |
| ------- | --------------------------------------------------- | ------------------ | ------------------- | ---- |
| P0-00   | Project Scaffolding (React Router 7 + Express)      | Senior Backend     | —                   | 2d   |
| P0-01   | Secret Rotation & `.env.example`                    | Senior Backend     | P0-00               | 2d   |
| P0-02   | Pre-Commit Hooks (Husky + lint-staged + commitlint) | DevOps             | P0-00               | 1d   |
| P0-03   | Structured Logging (Pino)                           | Senior Backend     | P0-01               | 3d   |
| P0-04   | Nonce-Based CSP & Security Middleware               | DevOps             | P0-01               | 3d   |
| P0-05   | Testing Framework (Vitest + MSW)                    | Senior Backend     | P0-02               | 4d   |
| P0-06   | Containerization (Dockerfile + Docker Compose)      | DevOps             | P0-01               | 3d   |
| P0-07   | CI/CD Pipeline (GitHub Actions)                     | DevOps             | P0-02, P0-05, P0-06 | 4d   |
| P0-08   | Error Tracking (Sentry)                             | DevOps             | P0-03               | 2d   |
| P0-09   | Missing Database Indexes                            | Senior Backend     | P0-00               | 2d   |
| P0-10   | User Soft Delete                                    | Senior Backend     | P0-09, P0-05        | 2d   |

## Dependency Graph

```
P0-00 (Scaffold) ──┬──► P0-01 (Secrets) ──┬──► P0-03 (Logging) ──► P0-08 (Sentry)
                   │                       ├──► P0-04 (CSP)
                   │                       └──► P0-06 (Docker) ──┐
                   ├──► P0-02 (Hooks) ──┬──► P0-05 (Testing) ──┼──► P0-07 (CI/CD)
                   │                    └────────────────────────┘
                   └──► P0-09 (Indexes) ──► P0-10 (Soft Delete)
                        P0-05 (Testing) ──► P0-10 (Soft Delete)
```

## Suggested Timeline (4 weeks)

**Week 1:** P0-00 (both devs collaborate), then P0-01, P0-02, P0-09 (fan out immediately after scaffold)
**Week 2:** P0-03, P0-04, P0-05, P0-06 (first wave of dependents)
**Week 3:** P0-07, P0-08, P0-10 (second wave)
**Week 4:** Integration testing, quality gate verification, documentation
