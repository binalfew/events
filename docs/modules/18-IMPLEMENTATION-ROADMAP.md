# Module 18: Implementation Roadmap

> **Accreditation Platform — Phased Delivery Plan, Team Sizing, and Cross-Module Dependencies**

| Metadata       | Value                             |
| -------------- | --------------------------------- |
| Module ID      | 18                                |
| Title          | Implementation Roadmap            |
| Version        | 1.0                               |
| Last Updated   | 2025-07-15                        |
| Author         | Architecture Team                 |
| Status         | Draft                             |
| Classification | Internal — Architecture Reference |

---

## Dependencies

| Relationship | Module                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| **Requires** | All 17 preceding modules (00-17) — this document cross-references every module |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Phase 0: Foundation](#3-phase-0-foundation)
4. [Phase 1: Dynamic Schema + Core Reliability](#4-phase-1-dynamic-schema--core-reliability)
5. [Phase 2: Visual Form Designer + UX](#5-phase-2-visual-form-designer--ux)
6. [Phase 3: Mobile + Intelligence](#6-phase-3-mobile--intelligence)
7. [Phase 4: Ecosystem & Integrations](#7-phase-4-ecosystem--integrations)
8. [Phase 5: Event Operations & Logistics](#8-phase-5-event-operations--logistics)
9. [Phase 6: Platform Intelligence & Experience](#9-phase-6-platform-intelligence--experience)
10. [Team Structure & Sizing](#10-team-structure--sizing)
11. [Risk Management](#11-risk-management)
12. [Definition of Done & Quality Gates](#12-definition-of-done--quality-gates)

- [Appendix](#appendix)

---

## 1. Overview

### 1.1 Purpose

Module 18 defines the **phased implementation roadmap** for the Accreditation Platform. It maps every deliverable from Modules 00–17 to a specific phase, identifies cross-module dependencies, establishes team structures, defines quality gates per phase, and provides risk mitigation strategies. This document serves as the master delivery plan — the single source of truth for "what gets built when."

The platform evolves through seven phases:

| Phase | Name                               | Focus                               | Value Delivered                                |
| ----- | ---------------------------------- | ----------------------------------- | ---------------------------------------------- |
| **0** | Foundation                         | DevOps, security, testing           | Production-ready infrastructure                |
| **1** | Dynamic Schema + Core Reliability  | Schema engine, workflow hardening   | Configurable data model without code changes   |
| **2** | Visual Form Designer + UX          | Form builder, real-time updates     | Self-service registration form creation        |
| **3** | Mobile + Intelligence              | PWA, analytics, i18n                | Mobile workflow access, operational dashboards |
| **4** | Ecosystem & Integrations           | API, webhooks, bulk ops             | External system integration, event cloning     |
| **5** | Event Operations & Logistics       | Logistics, protocol, safety         | Complete event operations management           |
| **6** | Platform Intelligence & Experience | Mobile experience, advanced modules | Full participant digital experience            |

Each phase delivers **independently valuable functionality** — the platform evolves from an accreditation tool (Phases 0-2) to an event management platform (Phases 3-4) to a complete event operations system (Phases 5-6).

### 1.2 Module-to-Phase Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MODULE-TO-PHASE MAPPING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 0: Foundation                                                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 00 Architecture  │ │ 05 Security      │ │ 06 Infrastructure│            │
│  │ (Partial)        │ │ (Partial)        │ │ (Full)           │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                              │
│  Phase 1: Dynamic Schema + Core Reliability                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 01 Data Model    │ │ 02 Dynamic Schema│ │ 04 Workflow      │            │
│  │ (Partial)        │ │ (Full)           │ │ (Hardening)      │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│  ┌──────────────────┐                                                        │
│  │ 05 Security      │                                                        │
│  │ (Continuation)   │                                                        │
│  └──────────────────┘                                                        │
│                                                                              │
│  Phase 2: Visual Form Designer + UX                                          │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 03 Form Designer │ │ 07 API Layer     │ │ 08 UI/UX         │            │
│  │ (Full)           │ │ (SSE)            │ │ (Full)           │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│  ┌──────────────────┐                                                        │
│  │ 17 Settings      │                                                        │
│  │ (Full)           │                                                        │
│  └──────────────────┘                                                        │
│                                                                              │
│  Phase 3: Mobile + Intelligence                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 08 UI/UX         │ │ 09 Registration  │ │ 10 Operations    │            │
│  │ (PWA + Offline)  │ │ (Delegation)     │ │ (Analytics)      │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                              │
│  Phase 4: Ecosystem & Integrations                                           │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 07 API Layer     │ │ 09 Registration  │ │ 10 Operations    │            │
│  │ (REST + Webhooks)│ │ (Bulk + Waitlist)│ │ (Check-in)       │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│  ┌──────────────────┐ ┌──────────────────┐                                  │
│  │ 14 Content       │ │ 16 Participant   │                                  │
│  │ (Comm Hub)       │ │ (Event Clone)    │                                  │
│  └──────────────────┘ └──────────────────┘                                  │
│                                                                              │
│  Phase 5: Event Operations & Logistics                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 11 Logistics     │ │ 12 Protocol      │ │ 13 People        │            │
│  │ (Full)           │ │ (Full)           │ │ (Staff only)     │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│  ┌──────────────────┐ ┌──────────────────┐                                  │
│  │ 14 Content       │ │ 15 Compliance    │                                  │
│  │ (Surveys + Certs)│ │ (Full)           │                                  │
│  └──────────────────┘ └──────────────────┘                                  │
│                                                                              │
│  Phase 6: Platform Intelligence & Experience                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 13 People        │ │ 16 Participant   │ │ 10 Operations    │            │
│  │ (Interpretation  │ │ (Mobile App +    │ │ (Multi-venue     │            │
│  │  + Media)        │ │  Networking)     │ │  Coordination)   │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Timeline Overview

```
     Q1 2026        Q2 2026        Q3 2026        Q4 2026        Q1 2027
  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
  │  Phase 0   │ │            │ │            │ │            │ │            │
  │ Foundation │ │            │ │            │ │            │ │            │
  │  (4 wks)   │ │            │ │            │ │            │ │            │
  ├────────────┤ │            │ │            │ │            │ │            │
  │  Phase 1   │ │            │ │            │ │            │ │            │
  │ Dyn Schema │ │            │ │            │ │            │ │            │
  │  (6 wks)   │ │            │ │            │ │            │ │            │
  ├────────────┼─┤            │ │            │ │            │ │            │
  │  Phase 2   │ │            │ │            │ │            │ │            │
  │ Form Des.  │ │            │ │            │ │            │ │            │
  │  (8 wks)   │ │            │ │            │ │            │ │            │
  └────────────┼─┼────────────┤ │            │ │            │ │            │
               │ │  Phase 3   │ │            │ │            │ │            │
               │ │ Mobile+Int │ │            │ │            │ │            │
               │ │  (8 wks)   │ │            │ │            │ │            │
               │ ├────────────┼─┤            │ │            │ │            │
               │ │  Phase 4   │ │            │ │            │ │            │
               │ │ Ecosystem  │ │            │ │            │ │            │
               │ │  (10 wks)  │ │            │ │            │ │            │
               │ └────────────┼─┼────────────┤ │            │ │            │
               │              │ │  Phase 5   │ │            │ │            │
               │              │ │ Operations │ │            │ │            │
               │              │ │  (12 wks)  │ │            │ │            │
               │              │ └────────────┼─┼────────────┤ │            │
               │              │              │ │  Phase 6   │ │            │
               │              │              │ │ Experience │ │            │
               │              │              │ │  (10 wks)  │ │            │
               │              │              │ └────────────┼─┘            │
               │              │              │              │              │
```

---

## 2. Architecture

### 2.1 Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE DEPENDENCY GRAPH                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 0 ──┬──► Phase 1 ──┬──► Phase 2 ──┬──► Phase 3                      │
│            │              │              │      │                            │
│            │              │              │      ▼                            │
│            │              │              └──► Phase 4                       │
│            │              │                     │                            │
│            │              │                     ▼                            │
│            │              │              Phase 5 ──► Phase 6                │
│            │              │                                                  │
│  Critical Path: Phase 0 → 1 → 2 → 3 → 4 → 5 → 6                          │
│                                                                              │
│  Module Dependencies Within Phases:                                          │
│                                                                              │
│  Phase 0:  06-Infrastructure → 05-Security (partial)                        │
│  Phase 1:  01-Data Model → 02-Dynamic Schema → 04-Workflow                  │
│  Phase 2:  03-Form Designer → 08-UI/UX → 07-API (SSE)                      │
│  Phase 3:  08-UI/UX (PWA) ← 09-Registration ← 10-Operations               │
│  Phase 4:  07-API → 14-Content → 16-Participant (Clone)                    │
│  Phase 5:  11-Logistics ← 12-Protocol → 13-People → 15-Compliance          │
│  Phase 6:  16-Participant (Mobile) ← 13-People (Interp) → 10-Ops (MV)     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Feature Flag Alignment

Every new capability ships behind a feature flag. Feature flags align with the phase delivery schedule and are progressively enabled as phases complete.

```
┌──────────────────────────────────────────────────────────────────────┐
│  FEATURE FLAG ROLLOUT SCHEDULE                                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Phase 0:  (No feature flags — infrastructure only)                  │
│                                                                       │
│  Phase 1:  FF_DYNAMIC_SCHEMA          = ON for all tenants           │
│            FF_CUSTOM_FIELDS           = ON for all tenants           │
│            FF_WORKFLOW_VERSIONING     = ON for all tenants           │
│                                                                       │
│  Phase 2:  FF_VISUAL_FORM_DESIGNER    = ON for pilot tenant          │
│            FF_SSE_UPDATES             = ON for all tenants           │
│            FF_KEYBOARD_SHORTCUTS      = ON for all tenants           │
│                                                                       │
│  Phase 3:  FF_PWA_MOBILE              = ON for pilot tenant          │
│            FF_OFFLINE_MODE            = ON for pilot tenant          │
│            FF_DELEGATION_PORTAL       = ON for pilot tenant          │
│            FF_ANALYTICS_DASHBOARD     = ON for all tenants           │
│            FF_I18N                    = ON for all tenants           │
│                                                                       │
│  Phase 4:  FF_REST_API                = ON for all tenants           │
│            FF_WEBHOOKS                = ON for all tenants           │
│            FF_BULK_OPERATIONS         = ON for all tenants           │
│            FF_EVENT_CLONE             = ON for all tenants           │
│            FF_WAITLIST                = ON for all tenants           │
│            FF_COMMUNICATION_HUB       = ON for all tenants           │
│            FF_KIOSK_MODE             = ON for pilot tenant          │
│                                                                       │
│  Phase 5:  FF_ACCOMMODATION           = ON per tenant request        │
│            FF_TRANSPORT               = ON per tenant request        │
│            FF_CATERING                = ON per tenant request        │
│            FF_PROTOCOL_SEATING        = ON per tenant request        │
│            FF_BILATERAL_SCHEDULER     = ON per tenant request        │
│            FF_INCIDENT_MANAGEMENT     = ON for all tenants           │
│            FF_STAFF_MANAGEMENT        = ON for all tenants           │
│            FF_COMPLIANCE_DASHBOARD    = ON for all tenants           │
│                                                                       │
│  Phase 6:  FF_PARTICIPANT_PWA         = ON for pilot event           │
│            FF_DIGITAL_BADGE           = ON per tenant request        │
│            FF_NETWORKING              = ON per tenant request        │
│            FF_INTERPRETATION          = ON per tenant request        │
│            FF_MEDIA_CENTER            = ON per tenant request        │
│            FF_MULTI_VENUE             = ON per tenant request        │
│            FF_CARBON_TRACKING         = ON per tenant request        │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 0: Foundation

**Duration:** 4 weeks
**Goal:** Production-ready infrastructure, security hardening, testing framework, CI/CD pipeline

### 3.1 Deliverables

| #    | Item               | Category      | Module Reference                                             | Deliverable                                                                   |
| ---- | ------------------ | ------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 0.1  | Secret rotation    | Security      | [Module 05](./05-SECURITY-AND-ACCESS-CONTROL.md)             | Remove `.env` from repo, `.env.example` with placeholders, rotate all secrets |
| 0.2  | Testing framework  | Quality       | [Module 06](./06-INFRASTRUCTURE-AND-DEVOPS.md#testing)       | Vitest setup, workflow engine unit tests, MSW mocks                           |
| 0.3  | CI/CD pipeline     | DevOps        | [Module 06](./06-INFRASTRUCTURE-AND-DEVOPS.md#ci-cd)         | GitHub Actions: lint → typecheck → test → build                               |
| 0.4  | Containerization   | DevOps        | [Module 06](./06-INFRASTRUCTURE-AND-DEVOPS.md#docker)        | Dockerfile + docker-compose for reproducible environments                     |
| 0.5  | Error tracking     | Observability | [Module 06](./06-INFRASTRUCTURE-AND-DEVOPS.md#observability) | Sentry integration                                                            |
| 0.6  | Structured logging | Observability | [Module 06](./06-INFRASTRUCTURE-AND-DEVOPS.md#logging)       | Pino replacing console.log/Morgan                                             |
| 0.7  | Missing indexes    | Performance   | [Module 01](./01-DATA-MODEL-FOUNDATION.md#indexes)           | Standalone indexes on all FKs identified in analysis                          |
| 0.8  | Pre-commit hooks   | Quality       | [Module 06](./06-INFRASTRUCTURE-AND-DEVOPS.md#quality)       | Husky + lint-staged                                                           |
| 0.9  | User soft delete   | Data          | [Module 01](./01-DATA-MODEL-FOUNDATION.md#soft-delete)       | Add `deletedAt` to User, Workflow, WorkflowTemplate                           |
| 0.10 | Nonce-based CSP    | Security      | [Module 05](./05-SECURITY-AND-ACCESS-CONTROL.md#csp)         | Replace `unsafe-inline` with per-request nonces                               |

### 3.2 Definition of Done — Phase 0

- [ ] All secrets rotated; `.env.example` committed with placeholders only
- [ ] Vitest running with ≥ 80% coverage on existing workflow engine code
- [ ] CI pipeline passes on every PR (lint + typecheck + test + build)
- [ ] Docker Compose starts full stack locally in under 60 seconds
- [ ] Sentry capturing unhandled exceptions in staging
- [ ] Pino JSON logging with request ID correlation
- [ ] All foreign key columns have corresponding database indexes
- [ ] Pre-commit hooks block commits with lint errors or type failures
- [ ] Soft delete working for User model with `deletedAt` filter in all queries
- [ ] CSP nonces generated per request; no `unsafe-inline` in production

### 3.3 Team Required

| Role            | Count | Focus                                  |
| --------------- | ----- | -------------------------------------- |
| Senior Backend  | 1     | Indexes, soft delete, logging, secrets |
| DevOps Engineer | 1     | CI/CD, Docker, Sentry, CSP             |

---

## 4. Phase 1: Dynamic Schema + Core Reliability

**Duration:** 6 weeks
**Goal:** Extensible data model, hardened workflow engine, security completeness

### 4.1 Deliverables

| #    | Item                       | Category       | Module Reference                                               | Deliverable                                              |
| ---- | -------------------------- | -------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| 1.1  | FieldDefinition model      | Dynamic Schema | [Module 02](./02-DYNAMIC-SCHEMA-ENGINE.md#field-definition)    | Prisma migration + CRUD routes                           |
| 1.2  | `customData` JSONB column  | Dynamic Schema | [Module 02](./02-DYNAMIC-SCHEMA-ENGINE.md#jsonb)               | Add to Participant and Event models                      |
| 1.3  | Dynamic Zod validation     | Dynamic Schema | [Module 02](./02-DYNAMIC-SCHEMA-ENGINE.md#validation)          | `buildCustomDataSchema()` server utility                 |
| 1.4  | Dynamic form renderer      | Dynamic Schema | [Module 02](./02-DYNAMIC-SCHEMA-ENGINE.md#renderer)            | `FieldRenderer` + `FieldSection` components              |
| 1.5  | Custom field admin UI      | Dynamic Schema | [Module 02](./02-DYNAMIC-SCHEMA-ENGINE.md#admin-ui)            | List, create, edit, reorder, delete field definitions    |
| 1.6  | JSONB query layer          | Dynamic Schema | [Module 02](./02-DYNAMIC-SCHEMA-ENGINE.md#queries)             | `filterWithCustomFields()` + expression index management |
| 1.7  | Workflow versioning        | Core           | [Module 04](./04-WORKFLOW-ENGINE.md#versioning)                | WorkflowVersion model, snapshot on participant entry     |
| 1.8  | SLA enforcement            | Core           | [Module 04](./04-WORKFLOW-ENGINE.md#sla)                       | Background job for overdue detection + email alerts      |
| 1.9  | Optimistic locking         | Core           | [Module 07](./07-API-AND-INTEGRATION-LAYER.md#locking)         | Prevent concurrent actions on same participant           |
| 1.10 | Rate limiting completeness | Security       | [Module 05](./05-SECURITY-AND-ACCESS-CONTROL.md#rate-limiting) | Add limits to authenticated routes                       |
| 1.11 | File upload scanning       | Security       | [Module 05](./05-SECURITY-AND-ACCESS-CONTROL.md#file-scanning) | ClamAV or Azure Defender integration                     |

### 4.2 Definition of Done — Phase 1

- [ ] Admin can create, edit, reorder, and delete custom field definitions
- [ ] Custom fields render dynamically on registration forms
- [ ] JSONB queries support filtering by custom field values with expression indexes
- [ ] Workflow versioning snapshots active version when participant enters workflow
- [ ] SLA overdue detection runs as background job every 5 minutes
- [ ] Optimistic locking prevents concurrent approve/reject on same participant
- [ ] Rate limiting active on all authenticated API routes
- [ ] File uploads scanned for malware before acceptance
- [ ] Dynamic Zod schemas validate custom data on every form submission
- [ ] Unit test coverage ≥ 85% for new code

### 4.3 Team Required

| Role               | Count | Focus                                  |
| ------------------ | ----- | -------------------------------------- |
| Senior Backend     | 2     | Schema engine, JSONB queries, SLA jobs |
| Frontend Developer | 1     | Dynamic renderer, admin UI             |
| QA Engineer        | 1     | Schema edge cases, workflow versioning |

---

## 5. Phase 2: Visual Form Designer + UX

**Duration:** 8 weeks
**Goal:** Self-service form creation, real-time UX, settings management

### 5.1 Deliverables

| #    | Item                    | Category      | Module Reference                                       | Deliverable                                            |
| ---- | ----------------------- | ------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| 2.1  | FormTemplate model      | Form Designer | [Module 03](./03-VISUAL-FORM-DESIGNER.md#data-model)   | Prisma migration + CRUD routes                         |
| 2.2  | Three-panel designer UI | Form Designer | [Module 03](./03-VISUAL-FORM-DESIGNER.md#designer-ui)  | field-palette, design-canvas, properties-panel         |
| 2.3  | Sections & pages        | Form Designer | [Module 03](./03-VISUAL-FORM-DESIGNER.md#sections)     | Sections with 12-column grid, pages as wizard steps    |
| 2.4  | Drag-and-drop           | Form Designer | [Module 03](./03-VISUAL-FORM-DESIGNER.md#dnd)          | @dnd-kit with nested sortable contexts                 |
| 2.5  | Conditional visibility  | Form Designer | [Module 03](./03-VISUAL-FORM-DESIGNER.md#conditions)   | condition-builder component + evaluator                |
| 2.6  | Preview mode            | Form Designer | [Module 03](./03-VISUAL-FORM-DESIGNER.md#preview)      | form-renderer shared between designer and registration |
| 2.7  | Section templates       | Form Designer | [Module 03](./03-VISUAL-FORM-DESIGNER.md#templates)    | Save/load reusable section layouts                     |
| 2.8  | SSE real-time updates   | UX            | [Module 07](./07-API-AND-INTEGRATION-LAYER.md#sse)     | Live queue updates for validator/printer/dispatcher    |
| 2.9  | Notification system     | Feature       | [Module 08](./08-UI-UX-AND-FRONTEND.md#notifications)  | Notification model + bell UI + SSE push                |
| 2.10 | Global search           | UX            | [Module 08](./08-UI-UX-AND-FRONTEND.md#search)         | Cross-event participant search bar                     |
| 2.11 | Keyboard shortcuts      | UX            | [Module 08](./08-UI-UX-AND-FRONTEND.md#shortcuts)      | Hotkeys for approval workflow                          |
| 2.12 | Skeleton loading        | UX            | [Module 08](./08-UI-UX-AND-FRONTEND.md#loading-states) | Loading states for data-heavy pages                    |
| 2.13 | Settings management     | Configuration | [Module 17](./17-SETTINGS-AND-CONFIGURATION.md)        | Full settings hierarchy + admin UI + audit trail       |

### 5.2 Definition of Done — Phase 2

- [ ] Admin can build multi-page registration forms via drag-and-drop
- [ ] Conditional visibility rules work across pages and sections
- [ ] Forms render responsively on mobile and desktop
- [ ] SSE delivers real-time updates to validator queues
- [ ] Keyboard shortcuts work for approve (A), reject (R), next (→)
- [ ] Settings UI shows hierarchy (Global → Tenant → Event) with overrides
- [ ] Feature flags toggle module visibility in sidebar
- [ ] Notification bell shows unread count with SSE updates
- [ ] Form designer has undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- [ ] E2E tests pass for form creation → registration → approval flow

### 5.3 Team Required

| Role              | Count | Focus                                |
| ----------------- | ----- | ------------------------------------ |
| Senior Frontend   | 2     | Form designer UI, DnD, preview       |
| Backend Developer | 1     | SSE, notifications, settings         |
| UX Designer       | 1     | Form builder UX, keyboard shortcuts  |
| QA Engineer       | 1     | Cross-browser testing, accessibility |

---

## 6. Phase 3: Mobile + Intelligence

**Duration:** 8 weeks
**Goal:** Mobile access, operational dashboards, internationalization

### 6.1 Deliverables

| #    | Item                         | Category       | Module Reference                                               | Deliverable                                              |
| ---- | ---------------------------- | -------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| 3.1  | PWA + responsive views       | UX             | [Module 08](./08-UI-UX-AND-FRONTEND.md#pwa)                    | Mobile validator, printer, dispatcher interfaces         |
| 3.2  | Offline mode                 | UX             | [Module 08](./08-UI-UX-AND-FRONTEND.md#offline)                | Service Worker + IndexedDB for badge collection/printing |
| 3.3  | Delegation portal            | Feature        | [Module 09](./09-REGISTRATION-AND-ACCREDITATION.md#delegation) | Focal point self-service portal                          |
| 3.4  | Conditional workflow routing | Core           | [Module 04](./04-WORKFLOW-ENGINE.md#routing)                   | Step conditions for dynamic routing                      |
| 3.5  | Step assignment/reassignment | Core           | [Module 04](./04-WORKFLOW-ENGINE.md#assignment)                | StepAssignment model + admin UI                          |
| 3.6  | Auto-action rules            | Core           | [Module 04](./04-WORKFLOW-ENGINE.md#auto-actions)              | Rule-based automatic workflow actions                    |
| 3.7  | Saved views                  | Feature        | [Module 08](./08-UI-UX-AND-FRONTEND.md#saved-views)            | Airtable-style table/kanban/calendar views               |
| 3.8  | Custom objects               | Dynamic Schema | [Module 02](./02-DYNAMIC-SCHEMA-ENGINE.md#custom-objects)      | CustomObjectDef + CustomObjectRecord + admin CRUD        |
| 3.9  | Analytics dashboard          | Feature        | [Module 10](./10-EVENT-OPERATIONS-CENTER.md#analytics)         | Real-time operational intelligence with SSE              |
| 3.10 | Internationalization         | UX             | [Module 08](./08-UI-UX-AND-FRONTEND.md#i18n)                   | react-i18next with en/fr/ar/pt/es/sw                     |

### 6.2 Definition of Done — Phase 3

- [ ] PWA installable on iOS and Android with app manifest
- [ ] Offline badge collection works without network (syncs when reconnected)
- [ ] Focal points can manage their delegation's registrations via portal
- [ ] Workflow routing dynamically selects next step based on participant data
- [ ] Analytics dashboard shows real-time registration funnel metrics
- [ ] Saved views persist per user with table/kanban/calendar modes
- [ ] UI available in English, French, Arabic, and Portuguese
- [ ] RTL layout works correctly for Arabic
- [ ] Custom objects support CRUD operations with admin management UI
- [ ] Performance: Mobile page load < 3 seconds on 4G connection

### 6.3 Team Required

| Role              | Count | Focus                                   |
| ----------------- | ----- | --------------------------------------- |
| Senior Frontend   | 2     | PWA, offline, saved views, i18n         |
| Backend Developer | 2     | Workflow routing, analytics aggregation |
| UX Designer       | 1     | Mobile UX, dashboard design             |
| QA Engineer       | 1     | Mobile testing, offline scenarios       |

---

## 7. Phase 4: Ecosystem & Integrations

**Duration:** 10 weeks
**Goal:** External integration, event continuity, bulk operations

### 7.1 Deliverables

| #    | Item                            | Category | Module Reference                                               | Deliverable                                        |
| ---- | ------------------------------- | -------- | -------------------------------------------------------------- | -------------------------------------------------- |
| 4.1  | REST API                        | Platform | [Module 07](./07-API-AND-INTEGRATION-LAYER.md#rest-api)        | API endpoints with key auth + rate limiting        |
| 4.2  | Webhook system                  | Platform | [Module 07](./07-API-AND-INTEGRATION-LAYER.md#webhooks)        | Event subscriptions for external integrations      |
| 4.3  | Check-in/access control         | Feature  | [Module 10](./10-EVENT-OPERATIONS-CENTER.md#check-in)          | QR scanner + AccessLog + venue occupancy           |
| 4.4  | Communication hub               | Feature  | [Module 14](./14-CONTENT-AND-DOCUMENTS.md#communication)       | Broadcast messaging + SMS + email templates        |
| 4.5  | Kiosk mode                      | Feature  | [Module 10](./10-EVENT-OPERATIONS-CENTER.md#kiosk)             | Self-service participant terminal                  |
| 4.6  | Bulk operations center          | Feature  | [Module 09](./09-REGISTRATION-AND-ACCREDITATION.md#bulk-ops)   | CSV import/export + batch actions + undo           |
| 4.7  | Template marketplace            | Feature  | [Module 14](./14-CONTENT-AND-DOCUMENTS.md#marketplace)         | Cross-tenant template sharing                      |
| 4.8  | Batch workflow actions          | Core     | [Module 04](./04-WORKFLOW-ENGINE.md#batch)                     | First-class batch approve/reject/bypass            |
| 4.9  | Parallel workflow paths         | Core     | [Module 04](./04-WORKFLOW-ENGINE.md#parallel)                  | Fork/join for simultaneous approvals               |
| 4.10 | Duplicate detection & blacklist | Security | [Module 09](./09-REGISTRATION-AND-ACCREDITATION.md#duplicates) | Passport/name/email matching + watchlist screening |
| 4.11 | Event cloning                   | Core     | [Module 16](./16-PARTICIPANT-EXPERIENCE.md#clone-engine)       | Deep clone with selective element copy             |
| 4.12 | Waitlist management             | Feature  | [Module 09](./09-REGISTRATION-AND-ACCREDITATION.md#waitlist)   | Auto-waitlist, position tracking, auto-promote     |

### 7.2 Definition of Done — Phase 4

- [ ] REST API documented with OpenAPI spec and accessible via API keys
- [ ] Webhooks deliver events to external endpoints with retry and logging
- [ ] QR check-in scan < 500ms; venue occupancy updates in real-time
- [ ] Communication hub sends broadcast emails/SMS to filtered participant groups
- [ ] Kiosk mode operates in fullscreen with touch-optimized UI
- [ ] CSV import handles 10,000 records with progress feedback and error reporting
- [ ] Batch approve/reject processes 100 participants in < 5 seconds
- [ ] Duplicate detection catches passport reuse across events
- [ ] Event clone completes for 1,000 elements in < 60 seconds
- [ ] Waitlist auto-promotes when quota freed, with deadline enforcement

### 7.3 Team Required

| Role               | Count | Focus                                           |
| ------------------ | ----- | ----------------------------------------------- |
| Senior Backend     | 2     | API, webhooks, clone engine, parallel workflows |
| Backend Developer  | 1     | Communication hub, bulk operations              |
| Frontend Developer | 2     | Kiosk, check-in scanner, bulk UI                |
| QA Engineer        | 1     | API testing, load testing                       |

---

## 8. Phase 5: Event Operations & Logistics

**Duration:** 12 weeks
**Goal:** Complete event operations: logistics, protocol, compliance, staffing

### 8.1 Deliverables

| #    | Item                             | Category   | Module Reference                                               | Deliverable                                          |
| ---- | -------------------------------- | ---------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| 5.1  | Accommodation management         | Logistics  | [Module 11](./11-LOGISTICS-AND-VENUE.md#accommodation)         | Hotels, room blocks, assignments, rooming lists      |
| 5.2  | Transportation & logistics       | Logistics  | [Module 11](./11-LOGISTICS-AND-VENUE.md#transport)             | Airport transfers, shuttle scheduling, vehicle fleet |
| 5.3  | Catering & meal management       | Logistics  | [Module 11](./11-LOGISTICS-AND-VENUE.md#catering)              | Meal planning, dietary aggregation, meal vouchers    |
| 5.4  | Parking & zone access            | Logistics  | [Module 11](./11-LOGISTICS-AND-VENUE.md#parking)               | Parking zones, permit generation, gate scanning      |
| 5.5  | Venue & floor plan management    | Logistics  | [Module 11](./11-LOGISTICS-AND-VENUE.md#venue)                 | Interactive floor plans, room booking, setup mgmt    |
| 5.6  | Protocol & seating management    | Protocol   | [Module 12](./12-PROTOCOL-AND-DIPLOMACY.md#seating)            | Visual seating designer, rank-based auto-assign      |
| 5.7  | Bilateral meeting scheduler      | Protocol   | [Module 12](./12-PROTOCOL-AND-DIPLOMACY.md#bilateral)          | Request/confirm flow, availability detection         |
| 5.8  | Companion & spouse program       | Protocol   | [Module 12](./12-PROTOCOL-AND-DIPLOMACY.md#companion)          | Companion registration, activity program             |
| 5.9  | Gift protocol & welcome packages | Protocol   | [Module 12](./12-PROTOCOL-AND-DIPLOMACY.md#gifts)              | Gift registry, package assembly, delivery tracking   |
| 5.10 | Incident management              | Safety     | [Module 10](./10-EVENT-OPERATIONS-CENTER.md#incidents)         | Logging, escalation, resolution, map view            |
| 5.11 | Live event command center        | Operations | [Module 10](./10-EVENT-OPERATIONS-CENTER.md#command-center)    | Multi-panel real-time dashboard for ops room         |
| 5.12 | Staff & volunteer management     | Operations | [Module 13](./13-PEOPLE-AND-WORKFORCE.md#staff)                | Roster, shift scheduling, check-in/out               |
| 5.13 | Document expiry & compliance     | Compliance | [Module 15](./15-COMPLIANCE-AND-GOVERNANCE.md#document-expiry) | Passport alerts, data retention, GDPR, visa tracking |
| 5.14 | Post-event surveys               | Feedback   | [Module 14](./14-CONTENT-AND-DOCUMENTS.md#surveys)             | Survey builder (reuse form designer)                 |
| 5.15 | Certificate generation           | Feature    | [Module 14](./14-CONTENT-AND-DOCUMENTS.md#certificates)        | Certificate designer, bulk generation                |
| 5.16 | Event series (recurring events)  | Core       | [Module 16](./16-PARTICIPANT-EXPERIENCE.md#event-series)       | YoY linking, carry-forward, cross-edition analytics  |

### 8.2 Definition of Done — Phase 5

- [ ] Accommodation assigns rooms automatically on participant approval
- [ ] Transport schedule integrates with participant personal agenda
- [ ] Catering dashboard shows dietary aggregation with vendor portal
- [ ] Protocol seating respects rank hierarchy and conflict rules
- [ ] Bilateral meetings auto-book available rooms with time-slot grid
- [ ] Incident management escalates unresolved incidents automatically
- [ ] Command center shows real-time zone occupancy, staff deployment, alerts
- [ ] Staff shifts schedulable via drag-and-drop calendar
- [ ] Compliance dashboard shows passport expiry alerts and GDPR status
- [ ] Post-event surveys reuse form designer components
- [ ] Certificates generate as PDF with QR verification codes
- [ ] Event series YoY comparison dashboard functional for 3+ editions
- [ ] All logistics modules integrated with settings and feature flags

### 8.3 Team Required

| Role               | Count | Focus                                            |
| ------------------ | ----- | ------------------------------------------------ |
| Senior Backend     | 2     | Logistics services, protocol engine, compliance  |
| Backend Developer  | 2     | Command center, incident mgmt, staff scheduling  |
| Senior Frontend    | 2     | Seating designer, command center UI, floor plans |
| Frontend Developer | 1     | Logistics UIs, survey builder                    |
| UX Designer        | 1     | Complex UIs: seating, command center, bilateral  |
| QA Engineer        | 2     | Cross-module integration, E2E flows              |

---

## 9. Phase 6: Platform Intelligence & Experience

**Duration:** 10 weeks
**Goal:** Full participant digital experience, advanced operational modules

### 9.1 Deliverables

| #    | Item                             | Category   | Module Reference                                              | Deliverable                                              |
| ---- | -------------------------------- | ---------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| 6.1  | Participant mobile app (PWA)     | Experience | [Module 16](./16-PARTICIPANT-EXPERIENCE.md#pwa)               | Digital badge, personal agenda, self-service, networking |
| 6.2  | Digital wallet integration       | Experience | [Module 16](./16-PARTICIPANT-EXPERIENCE.md#wallet)            | Apple Wallet / Google Wallet badge passes                |
| 6.3  | Interpretation services          | Logistics  | [Module 13](./13-PEOPLE-AND-WORKFORCE.md#interpretation)      | Language pair scheduling, interpreter rotation           |
| 6.4  | Media center & press ops         | Feature    | [Module 13](./13-PEOPLE-AND-WORKFORCE.md#media)               | Press workspace, press conferences, embargoes            |
| 6.5  | Risk assessment & contingency    | Planning   | [Module 15](./15-COMPLIANCE-AND-GOVERNANCE.md#risk)           | Risk register, mitigation plans, checklists              |
| 6.6  | Sustainability & carbon tracking | Compliance | [Module 15](./15-COMPLIANCE-AND-GOVERNANCE.md#sustainability) | Carbon calculator, offset tracking, reporting            |
| 6.7  | Multi-venue & zone coordination  | Operations | [Module 10](./10-EVENT-OPERATIONS-CENTER.md#multi-venue)      | Zone dashboards, inter-zone transport coordination       |
| 6.8  | Networking features              | Experience | [Module 16](./16-PARTICIPANT-EXPERIENCE.md#networking)        | Directory, meeting requests, QR contact exchange         |
| 6.9  | Session feedback                 | Experience | [Module 16](./16-PARTICIPANT-EXPERIENCE.md#feedback)          | Post-session micro-surveys, aggregated analytics         |
| 6.10 | Carry-forward participants       | Experience | [Module 16](./16-PARTICIPANT-EXPERIENCE.md#carry-forward)     | Pre-fill registration for returning participants         |

### 9.2 Definition of Done — Phase 6

- [ ] Participant PWA installable with offline badge display
- [ ] Apple Wallet and Google Wallet passes auto-surface at venue
- [ ] Personal agenda shows multi-source data (sessions, bilaterals, transport, meals)
- [ ] Networking directory respects privacy opt-in; contact exchange via QR scan
- [ ] Interpretation services scheduled with language pair matching
- [ ] Media center manages press conferences with embargo enforcement
- [ ] Risk register with 5×5 heat map and automated threshold monitoring
- [ ] Carbon calculator estimates event footprint (travel, catering, venue)
- [ ] Multi-venue zones show real-time occupancy with inter-zone shuttles
- [ ] Carry-forward pre-fills registration data for returning participants
- [ ] Session feedback collected within 24-hour window post-session
- [ ] All Phase 6 features behind feature flags, opt-in per tenant

### 9.3 Team Required

| Role              | Count | Focus                                           |
| ----------------- | ----- | ----------------------------------------------- |
| Senior Frontend   | 2     | Participant PWA, networking UI, feedback        |
| Backend Developer | 2     | Wallet integration, interpretation, media       |
| Mobile Specialist | 1     | PWA optimization, Service Worker, offline sync  |
| Backend Developer | 1     | Carbon calculator, risk assessment, multi-venue |
| UX Designer       | 1     | Participant mobile UX, wayfinding               |
| QA Engineer       | 1     | Mobile testing, cross-device, offline scenarios |

---

## 10. Team Structure & Sizing

### 10.1 Core Team Composition

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TEAM STRUCTURE                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Engineering Lead (1)                                                    │
│  ├── Architecture decisions, cross-team coordination, code review       │
│  │                                                                       │
│  ├── Platform Team (3-4 developers)                                     │
│  │   ├── Backend: Data model, schema engine, workflow, API              │
│  │   ├── Backend: Settings, security, background jobs, caching          │
│  │   └── DevOps: CI/CD, Docker, monitoring, database                   │
│  │                                                                       │
│  ├── Experience Team (3-4 developers)                                   │
│  │   ├── Frontend: Form designer, admin UI, saved views                 │
│  │   ├── Frontend: PWA, participant experience, mobile                 │
│  │   └── Frontend: Component library, design system, a11y              │
│  │                                                                       │
│  ├── Feature Team (2-3 developers)                                      │
│  │   ├── Full-stack: Logistics modules (accommodation, transport)      │
│  │   ├── Full-stack: Protocol, compliance, content                     │
│  │   └── Full-stack: Operations, analytics, reporting                  │
│  │                                                                       │
│  ├── UX Designer (1)                                                    │
│  │   └── Wireframes, prototypes, usability testing, design system      │
│  │                                                                       │
│  └── QA Engineer (1-2)                                                  │
│      ├── Test strategy, E2E automation, performance testing            │
│      └── Cross-browser, mobile, accessibility compliance               │
│                                                                          │
│  Total: 11-15 engineers across all phases                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Team Scaling by Phase

| Phase | Duration | Team Size | Key Hires                        |
| ----- | -------- | --------- | -------------------------------- |
| 0     | 4 weeks  | 2         | Existing team                    |
| 1     | 6 weeks  | 4         | + Backend dev, QA                |
| 2     | 8 weeks  | 5         | + Frontend dev                   |
| 3     | 8 weeks  | 6         | + Frontend dev, UX designer      |
| 4     | 10 weeks | 8         | + 2 full-stack developers        |
| 5     | 12 weeks | 12        | + 2 full-stack, + Frontend, + QA |
| 6     | 10 weeks | 10        | - 2 (maintenance from Phase 5)   |

### 10.3 Sprint Cadence

| Item              | Value                                               |
| ----------------- | --------------------------------------------------- |
| Sprint length     | 2 weeks                                             |
| Sprint planning   | Monday, first day of sprint                         |
| Daily standup     | 15 minutes, async when possible                     |
| Sprint demo       | Friday, last day of sprint                          |
| Retrospective     | Monthly, after every 2 sprints                      |
| Release cadence   | End of every sprint (CI/CD to staging)              |
| Production deploy | End of each phase (or monthly, whichever is sooner) |

---

## 11. Risk Management

### 11.1 Implementation Risks

| #   | Risk                                        | Probability | Impact   | Mitigation                                                                                       | Phase |
| --- | ------------------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------ | ----- |
| R1  | Database migrations break production data   | Medium      | Critical | Prisma migration previews in CI; shadow database for testing; rollback scripts pre-written       | 0-6   |
| R2  | Dynamic schema performance at scale         | Medium      | High     | Expression indexes on JSONB; benchmark with 100K records; fallback to dedicated columns          | 1     |
| R3  | Form designer complexity exceeds estimates  | High        | Medium   | MVP with subset of field types; defer conditional visibility to Phase 3 if needed                | 2     |
| R4  | Offline sync conflicts in PWA               | Medium      | Medium   | Last-write-wins with conflict detection UI; queue operations with idempotency keys               | 3     |
| R5  | Clone engine FK remapping misses edge cases | Medium      | High     | Comprehensive FK mapping table; integration tests for every model relationship; rollback support | 4     |
| R6  | Logistics modules scope creep               | High        | High     | Strict MVP per module; feature flags for incremental rollout; defer advanced features to Phase 6 | 5     |
| R7  | Wallet integration platform changes         | Low         | Medium   | Abstract wallet layer; support QR-only fallback; monitor Apple/Google API deprecation notices    | 6     |
| R8  | Multi-tenant data isolation breach          | Low         | Critical | Tenant ID in every query WHERE clause; automated tests asserting cross-tenant queries return 0   | 0-6   |
| R9  | SSE connection exhaustion under load        | Medium      | High     | Connection pooling; heartbeat with auto-disconnect after idle; SSE gateway for scale             | 2-6   |
| R10 | Third-party service outage (email, SMS)     | Medium      | Medium   | Circuit breaker pattern; retry with exponential backoff; queue for later delivery                | 4-6   |

### 11.2 Risk Response Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    RISK MATRIX                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Impact ▲                                                       │
│         │                                                        │
│  Critical│  R8              R1                                  │
│         │                                                        │
│  High   │              R2  R5  R6  R9                           │
│         │                                                        │
│  Medium │  R7          R3  R4  R10                              │
│         │                                                        │
│  Low    │                                                       │
│         │                                                        │
│         └──────────────────────────────────────────────► Prob.  │
│            Low        Medium        High                         │
│                                                                  │
│  Legend:  Critical risks (R1, R8) → Active monitoring + testing │
│           High risks (R2-R6, R9) → Mitigation plans in place   │
│           Medium risks (R3-R4, R7, R10) → Accepted with fallback│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.3 Migration Strategy

| Concern              | Strategy                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Data migration**   | Prisma migrations with `prisma migrate deploy`; never use `prisma db push` in production   |
| **Schema changes**   | All migrations reviewed by 2+ engineers; backward-compatible changes preferred             |
| **Breaking changes** | API versioning (v1, v2); old versions supported for 6 months minimum                       |
| **Feature rollout**  | Feature flags + progressive enablement (pilot tenant → all tenants)                        |
| **Rollback**         | Every deploy creates a database snapshot; application rolls back via git revert + redeploy |
| **Zero-downtime**    | Blue-green deployment; database migrations must be backward-compatible                     |

---

## 12. Definition of Done & Quality Gates

### 12.1 Universal Definition of Done (applies to every phase)

| Category          | Requirement                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **Code**          | PR reviewed by 1+ engineer; all CI checks pass; no TypeScript errors                                     |
| **Tests**         | Unit tests for business logic (≥ 85% coverage); integration tests for API routes; E2E for critical flows |
| **Security**      | No secrets in code; tenant isolation verified; rate limiting on new endpoints; RBAC enforced             |
| **Performance**   | API responses < 500ms P95; page load < 3s on 4G; no N+1 queries (verified by query logging)              |
| **Accessibility** | WCAG 2.1 AA for all new UI; keyboard navigation; screen reader tested                                    |
| **Documentation** | API endpoints in OpenAPI spec; new settings registered in Module 17; README updated                      |
| **Feature Flags** | New features behind flags; default OFF for unreleased; ON for released                                   |
| **Observability** | Structured logging for new operations; Sentry error boundary on new pages; metrics for new endpoints     |

### 12.2 Phase-Specific Quality Gates

| Phase | Gate                 | Requirement to Proceed                                                              |
| ----- | -------------------- | ----------------------------------------------------------------------------------- |
| 0 → 1 | Infrastructure Ready | CI green, Docker works, Sentry active, all indexes applied                          |
| 1 → 2 | Schema Stable        | Custom fields CRUD complete, workflow versioning tested, no migration issues        |
| 2 → 3 | Forms Working        | Form designer creates functional forms, SSE updates work, settings hierarchy works  |
| 3 → 4 | Mobile Ready         | PWA installable, offline sync works, analytics dashboard live, i18n for 4 languages |
| 4 → 5 | Ecosystem Open       | REST API documented, webhooks delivering, clone engine tested, bulk ops working     |
| 5 → 6 | Operations Complete  | All logistics modules functional, command center live, compliance dashboard active  |

### 12.3 Release Checklist

```
┌────────────────────────────────────────────────────────────────┐
│  RELEASE CHECKLIST — Phase [N] Release                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pre-Release                                                   │
│  [ ] All CI checks pass on release branch                     │
│  [ ] E2E test suite passes in staging environment             │
│  [ ] Performance benchmarks meet targets                      │
│  [ ] Security review completed (no new vulnerabilities)       │
│  [ ] Database migration tested on staging snapshot            │
│  [ ] Feature flags configured for production                  │
│  [ ] Rollback plan documented and tested                      │
│                                                                │
│  Release                                                       │
│  [ ] Database snapshot created                                │
│  [ ] Migrations applied to production                         │
│  [ ] Application deployed (blue-green switch)                 │
│  [ ] Health checks pass                                       │
│  [ ] Feature flags progressively enabled                      │
│                                                                │
│  Post-Release                                                  │
│  [ ] Monitor error rates for 2 hours                          │
│  [ ] Verify key user flows (registration, approval, badge)    │
│  [ ] Check performance dashboards (no degradation)            │
│  [ ] Notify stakeholders of new capabilities                  │
│  [ ] Update documentation and changelog                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Appendix

### A. Glossary

| Term                      | Definition                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Blue-Green Deployment** | Running two identical production environments; traffic switches from blue to green on release |
| **CI/CD**                 | Continuous Integration / Continuous Deployment — automated build, test, and deploy pipeline   |
| **Feature Flag**          | Runtime toggle that enables or disables a feature without code deployment                     |
| **MVP**                   | Minimum Viable Product — smallest feature set that delivers value to users                    |
| **P95/P99**               | 95th/99th percentile response time — metric for worst-case user experience                    |
| **PWA**                   | Progressive Web App — web application with native-like capabilities                           |
| **SLA**                   | Service Level Agreement — time commitment for workflow step completion                        |
| **Sprint**                | Fixed-length development iteration (2 weeks)                                                  |
| **YoY**                   | Year-over-Year — comparison of metrics across annual event editions                           |

### B. Module Completion Summary

| Module                          | File                                                                           | Lines               | Phase(s)   |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------- | ---------- |
| 00 Architecture Overview        | [00-ARCHITECTURE-OVERVIEW.md](./00-ARCHITECTURE-OVERVIEW.md)                   | 2,119               | 0          |
| 01 Data Model Foundation        | [01-DATA-MODEL-FOUNDATION.md](./01-DATA-MODEL-FOUNDATION.md)                   | 2,987               | 0-1        |
| 02 Dynamic Schema Engine        | [02-DYNAMIC-SCHEMA-ENGINE.md](./02-DYNAMIC-SCHEMA-ENGINE.md)                   | 7,149               | 1, 3       |
| 03 Visual Form Designer         | [03-VISUAL-FORM-DESIGNER.md](./03-VISUAL-FORM-DESIGNER.md)                     | 5,852               | 2          |
| 04 Workflow Engine              | [04-WORKFLOW-ENGINE.md](./04-WORKFLOW-ENGINE.md)                               | 6,051               | 1, 3, 4    |
| 05 Security & Access Control    | [05-SECURITY-AND-ACCESS-CONTROL.md](./05-SECURITY-AND-ACCESS-CONTROL.md)       | 2,681               | 0, 1       |
| 06 Infrastructure & DevOps      | [06-INFRASTRUCTURE-AND-DEVOPS.md](./06-INFRASTRUCTURE-AND-DEVOPS.md)           | 4,898               | 0          |
| 07 API & Integration Layer      | [07-API-AND-INTEGRATION-LAYER.md](./07-API-AND-INTEGRATION-LAYER.md)           | 5,234               | 2, 4       |
| 08 UI/UX & Frontend             | [08-UI-UX-AND-FRONTEND.md](./08-UI-UX-AND-FRONTEND.md)                         | 5,892               | 2, 3       |
| 09 Registration & Accreditation | [09-REGISTRATION-AND-ACCREDITATION.md](./09-REGISTRATION-AND-ACCREDITATION.md) | 5,331               | 3, 4       |
| 10 Event Operations Center      | [10-EVENT-OPERATIONS-CENTER.md](./10-EVENT-OPERATIONS-CENTER.md)               | 6,537               | 3, 4, 5, 6 |
| 11 Logistics & Venue            | [11-LOGISTICS-AND-VENUE.md](./11-LOGISTICS-AND-VENUE.md)                       | 5,773               | 5          |
| 12 Protocol & Diplomacy         | [12-PROTOCOL-AND-DIPLOMACY.md](./12-PROTOCOL-AND-DIPLOMACY.md)                 | 8,758               | 5          |
| 13 People & Workforce           | [13-PEOPLE-AND-WORKFORCE.md](./13-PEOPLE-AND-WORKFORCE.md)                     | 12,488              | 5, 6       |
| 14 Content & Documents          | [14-CONTENT-AND-DOCUMENTS.md](./14-CONTENT-AND-DOCUMENTS.md)                   | 11,907              | 4, 5       |
| 15 Compliance & Governance      | [15-COMPLIANCE-AND-GOVERNANCE.md](./15-COMPLIANCE-AND-GOVERNANCE.md)           | 3,210               | 5, 6       |
| 16 Participant Experience       | [16-PARTICIPANT-EXPERIENCE.md](./16-PARTICIPANT-EXPERIENCE.md)                 | 5,318               | 4, 5, 6    |
| 17 Settings & Configuration     | [17-SETTINGS-AND-CONFIGURATION.md](./17-SETTINGS-AND-CONFIGURATION.md)         | 2,395               | 2          |
| **18 Implementation Roadmap**   | **18-IMPLEMENTATION-ROADMAP.md**                                               | —                   | All        |
|                                 |                                                                                | **Total: ~96,580+** |            |

### C. Phase Duration Summary

| Phase | Weeks | Cumulative | Team Size | Key Milestone                   |
| ----- | ----- | ---------- | --------- | ------------------------------- |
| 0     | 4     | 4          | 2         | Infrastructure production-ready |
| 1     | 6     | 10         | 4         | Dynamic schema engine live      |
| 2     | 8     | 18         | 5         | Visual form designer shipped    |
| 3     | 8     | 26         | 6         | Mobile PWA + analytics          |
| 4     | 10    | 36         | 8         | External API + event cloning    |
| 5     | 12    | 48         | 12        | Full event operations           |
| 6     | 10    | 58         | 10        | Participant digital experience  |

**Total estimated duration:** ~58 weeks (~14 months) from Phase 0 start to Phase 6 completion

### D. Cross-Module Dependency Matrix

```
                 00  01  02  03  04  05  06  07  08  09  10  11  12  13  14  15  16  17
Module 00  Arch   ─   ●   ●   ●   ●   ●   ●   ●   ●   ○   ○   ○   ○   ○   ○   ○   ○   ●
Module 01  Data   ○   ─   ●   ●   ●   ○   ○   ○   ○   ●   ●   ●   ●   ●   ●   ●   ●   ○
Module 02  Schema ○   ●   ─   ●   ○   ○   ○   ○   ●   ●   ○   ○   ○   ○   ○   ○   ○   ●
Module 03  Forms  ○   ●   ●   ─   ○   ○   ○   ○   ●   ●   ○   ○   ○   ○   ●   ○   ○   ●
Module 04  WF     ○   ●   ○   ○   ─   ○   ●   ●   ○   ●   ●   ○   ○   ○   ●   ○   ●   ●
Module 05  Sec    ●   ●   ○   ○   ○   ─   ○   ●   ○   ●   ●   ○   ○   ○   ○   ●   ●   ●
Module 06  Infra  ●   ●   ○   ○   ○   ●   ─   ○   ○   ○   ○   ○   ○   ○   ○   ○   ○   ○
Module 07  API    ●   ○   ○   ○   ●   ●   ○   ─   ●   ○   ●   ○   ○   ○   ○   ○   ●   ○
Module 08  UI/UX  ●   ○   ●   ●   ○   ○   ○   ●   ─   ●   ●   ○   ○   ○   ○   ○   ●   ●
Module 09  Reg    ○   ●   ●   ●   ●   ●   ○   ○   ●   ─   ●   ○   ○   ○   ●   ○   ●   ●
Module 10  Ops    ○   ●   ○   ○   ●   ●   ○   ●   ●   ●   ─   ●   ○   ●   ○   ○   ●   ●
Module 11  Log    ○   ●   ○   ○   ○   ○   ○   ○   ●   ●   ●   ─   ●   ○   ○   ○   ●   ●
Module 12  Proto  ○   ●   ○   ○   ●   ○   ○   ○   ●   ●   ●   ●   ─   ○   ○   ○   ●   ●
Module 13  People ○   ●   ○   ○   ●   ●   ○   ○   ●   ○   ●   ●   ●   ─   ●   ○   ●   ●
Module 14  Content○   ●   ○   ●   ●   ○   ●   ●   ●   ●   ●   ○   ○   ●   ─   ○   ○   ●
Module 15  Comply ○   ●   ○   ○   ○   ●   ○   ○   ●   ●   ●   ○   ○   ○   ○   ─   ●   ●
Module 16  Part   ○   ●   ○   ●   ●   ●   ○   ●   ●   ●   ●   ●   ●   ●   ●   ●   ─   ●
Module 17  Config ●   ●   ●   ●   ●   ●   ○   ○   ●   ●   ●   ●   ●   ●   ●   ●   ●   ─

Legend: ● = Direct dependency  ○ = No direct dependency  ─ = Self
```

### E. Source Section Mapping

| Source SYSTEM_DESIGN.md Section                   | Target Module(s) | Phase(s)   |
| ------------------------------------------------- | ---------------- | ---------- |
| Section 1-2: Vision, Tech Stack                   | Module 00        | 0          |
| Section 3: Data Model                             | Module 01        | 0-1        |
| Section 4: Dynamic Schema                         | Module 02        | 1, 3       |
| Section 5: Visual Form Designer                   | Module 03        | 2          |
| Section 6: Workflow Engine                        | Module 04        | 1, 3, 4    |
| Section 7: Security & Access                      | Module 05        | 0, 1       |
| Section 8: Infrastructure                         | Module 06        | 0          |
| Section 9-10: API & Integration                   | Module 07        | 2, 4       |
| Section 11: UI/UX & Frontend                      | Module 08        | 2, 3       |
| 12.2, 12.6, 12.12, 12.20: Registration            | Module 09        | 3, 4       |
| 12.1, 12.3, 12.5, 12.17: Operations               | Module 10        | 3, 4, 5, 6 |
| 12.8, 12.9, 12.16, 12.25, 12.28, 12.33: Logistics | Module 11        | 5          |
| 12.10, 12.15, 12.26, 12.27: Protocol              | Module 12        | 5          |
| 12.22, 12.23, 12.29: People                       | Module 13        | 5, 6       |
| 12.4, 12.7, 12.18, 12.19: Content                 | Module 14        | 4, 5       |
| 12.13, 12.31, 12.32: Compliance                   | Module 15        | 5, 6       |
| 12.14, 12.21: Participant Experience              | Module 16        | 4, 5, 6    |
| Section 13: Settings                              | Module 17        | 2          |
| Section 14: Roadmap                               | Module 18        | All        |

---

_End of Module 18: Implementation Roadmap_
