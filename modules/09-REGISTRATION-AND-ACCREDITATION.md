# Module 09: Registration and Accreditation

> **Module:** 09 - Registration and Accreditation
> **Version:** 1.0
> **Last Updated:** February 12, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md), [Module 02: Dynamic Schema](./02-DYNAMIC-SCHEMA-ENGINE.md), [Module 03: Form Designer](./03-VISUAL-FORM-DESIGNER.md), [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md)
> **Required By:** [Module 10: Event Operations](./10-EVENT-OPERATIONS-CENTER.md), [Module 16: Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)
> **Integrates With:** [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md), [Module 07: API](./07-API-AND-INTEGRATION-LAYER.md), [Module 11: Logistics](./11-LOGISTICS-AND-VENUE.md), [Module 14: Content](./14-CONTENT-AND-DOCUMENTS.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Design Principles](#14-design-principles)
2. [Architecture](#2-architecture)
   - 2.1 [Registration Pipeline Architecture](#21-registration-pipeline-architecture)
   - 2.2 [Delegation Management Subsystem](#22-delegation-management-subsystem)
   - 2.3 [Bulk Import Pipeline Architecture](#23-bulk-import-pipeline-architecture)
   - 2.4 [Duplicate Detection Engine Architecture](#24-duplicate-detection-engine-architecture)
   - 2.5 [Component Interaction Diagram](#25-component-interaction-diagram)
3. [Data Model](#3-data-model)
   - 3.1 [Delegation Models](#31-delegation-models)
   - 3.2 [Bulk Operation Models](#32-bulk-operation-models)
   - 3.3 [Duplicate Detection and Blacklist Models](#33-duplicate-detection-and-blacklist-models)
   - 3.4 [Waitlist Models](#34-waitlist-models)
   - 3.5 [Participant State Machine](#35-participant-state-machine)
   - 3.6 [ER Diagram](#36-er-diagram)
   - 3.7 [Index Catalog](#37-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Self-Service Registration API](#41-self-service-registration-api)
   - 4.2 [Focal Point Registration API](#42-focal-point-registration-api)
   - 4.3 [Delegation Management API](#43-delegation-management-api)
   - 4.4 [Bulk Import API](#44-bulk-import-api)
   - 4.5 [Duplicate Detection API](#45-duplicate-detection-api)
   - 4.6 [Blacklist Management API](#46-blacklist-management-api)
   - 4.7 [Waitlist API](#47-waitlist-api)
5. [Business Logic](#5-business-logic)
   - 5.1 [Delegation Portal Wireframe](#51-delegation-portal-wireframe)
   - 5.2 [Registration Within Quota Flow](#52-registration-within-quota-flow)
   - 5.3 [Participant Replacement Flow](#53-participant-replacement-flow)
   - 5.4 [Delegation Integration Points](#54-delegation-integration-points)
   - 5.5 [Self-Service Registration Flow](#55-self-service-registration-flow)
   - 5.6 [Focal Point Registration Flow](#56-focal-point-registration-flow)
   - 5.7 [Bulk Import Pipeline](#57-bulk-import-pipeline)
   - 5.8 [Duplicate Detection Algorithm](#58-duplicate-detection-algorithm)
   - 5.9 [Blacklist Screening](#59-blacklist-screening)
   - 5.10 [Waitlist Prioritization Algorithm](#510-waitlist-prioritization-algorithm)
   - 5.11 [Registration State Machine](#511-registration-state-machine)
   - 5.12 [Quota Enforcement Engine](#512-quota-enforcement-engine)
6. [User Interface](#6-user-interface)
   - 6.1 [Delegation Portal Wireframe](#61-delegation-portal-wireframe)
   - 6.2 [Public Registration Form Wireframe](#62-public-registration-form-wireframe)
   - 6.3 [Bulk Import Wizard Wireframe](#63-bulk-import-wizard-wireframe)
   - 6.4 [Duplicate Resolution UI](#64-duplicate-resolution-ui)
   - 6.5 [Waitlist Management Dashboard](#65-waitlist-management-dashboard)
   - 6.6 [Registration Status Tracker](#66-registration-status-tracker)
   - 6.7 [Admin Registration Overview Dashboard](#67-admin-registration-overview-dashboard)
7. [Integration Points](#7-integration-points)
   - 7.1 [Module Integration Map](#71-module-integration-map)
   - 7.2 [Event-Driven Integration](#72-event-driven-integration)
   - 7.3 [Integration Contracts](#73-integration-contracts)
8. [Configuration](#8-configuration)
   - 8.1 [Feature Flags](#81-feature-flags)
   - 8.2 [Duplicate Detection Configuration](#82-duplicate-detection-configuration)
   - 8.3 [Waitlist Configuration](#83-waitlist-configuration)
   - 8.4 [Bulk Import Configuration](#84-bulk-import-configuration)
   - 8.5 [Quota Enforcement Configuration](#85-quota-enforcement-configuration)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Registration Flow E2E Tests](#91-registration-flow-e2e-tests)
   - 9.2 [Duplicate Detection Accuracy Tests](#92-duplicate-detection-accuracy-tests)
   - 9.3 [Bulk Import Stress Tests](#93-bulk-import-stress-tests)
   - 9.4 [Quota Enforcement Concurrency Tests](#94-quota-enforcement-concurrency-tests)
   - 9.5 [Waitlist Promotion Tests](#95-waitlist-promotion-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [Rate Limiting](#101-rate-limiting)
    - 10.2 [CAPTCHA for Public Forms](#102-captcha-for-public-forms)
    - 10.3 [Document Upload Validation](#103-document-upload-validation)
    - 10.4 [PII Handling](#104-pii-handling)
    - 10.5 [Focal Point Authorization](#105-focal-point-authorization)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Registration Throughput Targets](#111-registration-throughput-targets)
    - 11.2 [Duplicate Check Latency](#112-duplicate-check-latency)
    - 11.3 [Bulk Import Processing Rate](#113-bulk-import-processing-rate)
    - 11.4 [Quota Query Performance](#114-quota-query-performance)
    - 11.5 [Concurrent Registration Handling](#115-concurrent-registration-handling)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Participant Status Transition Catalog](#c-participant-status-transition-catalog)

---

## 1. Overview

### 1.1 Purpose

The Registration and Accreditation module serves as the **central registration pipeline** for the multi-tenant accreditation platform. All participant registrations -- regardless of their entry point -- converge into a unified processing pipeline that validates data, checks for duplicates, screens against blacklists, and feeds into the workflow engine for multi-step approval.

The module supports three distinct registration entry points:

1. **Self-Service Registration** -- Participants register themselves through a public-facing form link. The form is dynamically rendered from templates defined in Module 03 (Form Designer). After submission, the registration passes through duplicate detection, blacklist screening, and enters the workflow engine.

2. **Focal Point Delegation Registration** -- In diplomatic events, participants do not register themselves individually. A focal point (embassy official or organizational coordinator) manages the entire delegation through a dedicated portal. The focal point registers participants within allocated quotas, uploads documents, tracks progress, and manages replacements.

3. **Bulk Import** -- For large-scale events with thousands of participants, administrators import registrations from CSV/Excel files. The bulk import pipeline provides column mapping, per-row validation, duplicate checking, preview, and execution with progress tracking and undo capability.

All three entry points converge into a shared pipeline:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Self-Service   │    │  Focal Point     │    │   Bulk Import    │
│   Registration   │    │  Delegation      │    │   (CSV/Excel)    │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Validation Layer     │
                    │   (Schema + Business)  │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Duplicate Detection   │
                    │  (Fuzzy + Exact Match) │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Blacklist Screening   │
                    │  (Security Watchlist)  │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Workflow Engine      │
                    │   (Module 04 Entry)    │
                    └───────────────────────┘
```

### 1.2 Scope

This module covers the following subsystems:

| Subsystem                     | Description                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Delegation Management**     | Focal point portal with quota tracking, participant registration within allocations, document upload, replacement requests, and delegation-level status monitoring                         |
| **Bulk Operations**           | CSV/Excel import with column mapping, validation, preview, batch execution with progress tracking, undo capability, and bulk status changes                                                |
| **Duplicate Detection**       | Multi-field scoring algorithm using Levenshtein distance, phonetic matching (Soundex/Metaphone), exact match on passport/email, configurable thresholds, merge UI for confirmed duplicates |
| **Blacklist Screening**       | Real-time check on every registration, periodic re-scan of existing participants, match confidence levels, admin review queue for potential matches                                        |
| **Waitlist Management**       | Priority-based queuing when quotas are full, auto-promotion on cancellation/rejection/quota increase, deadline-based offer expiration, position tracking                                   |
| **Participant State Machine** | Complete lifecycle from DRAFT through SUBMITTED, IN_REVIEW, APPROVED/REJECTED/RETURNED, PRINTED, COLLECTED, WITHDRAWN/REPLACED with all valid transitions                                  |

### 1.3 Key Personas

| Persona         | Role                                                                                                                                                                                                                                          | Primary Actions                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Focal Point** | Embassy official or organizational coordinator who manages an entire delegation. Registers participants within allocated quotas, uploads documents, tracks approval progress, requests quota increases, and manages participant replacements. | Register participants, manage quota, request replacements, upload documents             |
| **Registrant**  | Individual participant who self-registers through a public form link. Views their registration status, uploads required documents, and responds to information requests from reviewers.                                                       | Self-register, upload documents, track status, confirm waitlist promotion               |
| **Admin**       | Platform administrator who configures registration settings, manages bulk operations, reviews duplicate candidates, manages blacklists, adjusts quotas, and monitors overall registration progress.                                           | Configure registration, bulk import, review duplicates, manage blacklist, adjust quotas |
| **Validator**   | Workflow reviewer who processes individual registrations through approval steps. Reviews submitted information and documents, approves or rejects registrations, and requests additional information.                                         | Review registrations, approve/reject, request additional information                    |

### 1.4 Design Principles

1. **Convergent Pipeline** -- All registration entry points converge into the same validation, duplicate detection, blacklist screening, and workflow entry pipeline. No special paths that bypass checks.

2. **Quota-Aware by Default** -- Every registration action checks quota availability. Concurrent registrations use optimistic locking to prevent over-allocation.

3. **Undo-First for Bulk Operations** -- All bulk operations capture pre-operation snapshots enabling rollback within a configurable time window.

4. **Progressive Disclosure** -- Duplicate detection results surface warnings at submission time but do not block registration unless confidence exceeds the auto-flag threshold. Low-confidence matches are logged for admin review.

5. **Waitlist as Queue, Not Dead End** -- When quotas are full, registrations enter a managed priority queue rather than being rejected outright. Auto-promotion ensures fair advancement.

6. **Audit Everything** -- Every registration action, duplicate resolution, blacklist override, and quota change is logged with full context for compliance and traceability.

---

## 2. Architecture

### 2.1 Registration Pipeline Architecture

The registration pipeline is the central processing path through which all participant registrations flow. The three entry points (self-service, focal point, bulk import) each perform entry-point-specific preprocessing before feeding into the shared pipeline.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION PIPELINE ARCHITECTURE                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ENTRY POINTS                                                             │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Self-Service │  │ Focal Point      │  │ Bulk Import      │            │
│  │ Public Form  │  │ Delegation Portal│  │ CSV/Excel Upload │            │
│  │              │  │                  │  │                  │            │
│  │ - CAPTCHA    │  │ - Auth check     │  │ - File parse     │            │
│  │ - Rate limit │  │ - Quota check    │  │ - Column map     │            │
│  │ - Form render│  │ - Delegation ctx │  │ - Row validate   │            │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘            │
│         │                   │                      │                      │
│  ───────┴───────────────────┴──────────────────────┴──────────────        │
│                                                                           │
│  SHARED PIPELINE                                                          │
│  ┌─────────────────────────────────────────────────────────────┐         │
│  │ Stage 1: Schema Validation                                   │         │
│  │  - Required fields check                                     │         │
│  │  - Field type validation (email, date, phone)                │         │
│  │  - Custom validation rules from FormTemplate                 │         │
│  └─────────────────────────┬───────────────────────────────────┘         │
│                             │                                             │
│  ┌─────────────────────────▼───────────────────────────────────┐         │
│  │ Stage 2: Duplicate Detection                                 │         │
│  │  - Exact match: passport number, email                       │         │
│  │  - Fuzzy match: name (Levenshtein), phonetic (Soundex)       │         │
│  │  - Cross-field scoring with configurable thresholds          │         │
│  │  - Score >= 0.90: Auto-flag, hold registration               │         │
│  │  - Score 0.70-0.89: Warning, proceed with notification       │         │
│  │  - Score < 0.70: Pass through                                │         │
│  └─────────────────────────┬───────────────────────────────────┘         │
│                             │                                             │
│  ┌─────────────────────────▼───────────────────────────────────┐         │
│  │ Stage 3: Blacklist Screening                                 │         │
│  │  - Exact passport/email match against Blacklist table        │         │
│  │  - Fuzzy name match against name + nameVariations            │         │
│  │  - Organization match                                        │         │
│  │  - Match found: Status = FLAGGED, admin alerted              │         │
│  │  - No match: Proceed to workflow                             │         │
│  └─────────────────────────┬───────────────────────────────────┘         │
│                             │                                             │
│  ┌─────────────────────────▼───────────────────────────────────┐         │
│  │ Stage 4: Workflow Entry (Module 04)                          │         │
│  │  - Participant record created with status SUBMITTED          │         │
│  │  - Enters event workflow at Step 1                           │         │
│  │  - Confirmation email sent via Module 14                     │         │
│  └─────────────────────────────────────────────────────────────┘         │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Delegation Management Subsystem

The delegation management subsystem provides the focal point portal for managing participant registrations within an allocated quota structure.

```
┌──────────────────────────────────────────────────────────────────────┐
│                  DELEGATION MANAGEMENT SUBSYSTEM                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐                                                     │
│  │  Focal Point  │                                                     │
│  │  Auth Layer   │──── JWT + delegation scope validation               │
│  └──────┬───────┘                                                     │
│         │                                                              │
│  ┌──────▼────────────────────────────────────────────────┐            │
│  │              DELEGATION PORTAL                         │            │
│  │                                                        │            │
│  │  ┌─────────────────┐  ┌──────────────────────────┐    │            │
│  │  │  Quota Dashboard │  │  Participant Registry     │    │            │
│  │  │                  │  │                           │    │            │
│  │  │  - Per-type view │  │  - List with status       │    │            │
│  │  │  - Used/Pending  │  │  - Filter by type/status  │    │            │
│  │  │  - Remaining     │  │  - Individual detail view  │    │            │
│  │  └─────────────────┘  └──────────────────────────┘    │            │
│  │                                                        │            │
│  │  ┌─────────────────┐  ┌──────────────────────────┐    │            │
│  │  │  Actions Panel   │  │  Request Management      │    │            │
│  │  │                  │  │                           │    │            │
│  │  │  - Register new  │  │  - Quota increase reqs   │    │            │
│  │  │  - Replace       │  │  - Replacement requests   │    │            │
│  │  │  - Upload docs   │  │  - Request history        │    │            │
│  │  │  - Export list   │  │  - Status tracking        │    │            │
│  │  └─────────────────┘  └──────────────────────────┘    │            │
│  └───────────────────────────────────────────────────────┘            │
│                                                                       │
│  DATA LAYER                                                           │
│  ┌────────────┐ ┌────────────────┐ ┌──────────────────┐              │
│  │ Delegation  │ │ DelegationQuota│ │ QuotaChangeReq   │              │
│  │             │ │                │ │                   │              │
│  │ - name      │ │ - allocated    │ │ - current/request │              │
│  │ - code      │ │ - used         │ │ - reason          │              │
│  │ - focalPt   │ │ - pending      │ │ - status          │              │
│  └────────────┘ └────────────────┘ └──────────────────┘              │
│  ┌────────────────────────┐                                           │
│  │ ParticipantReplacement  │                                           │
│  │ - original/replacement  │                                           │
│  │ - reason, status        │                                           │
│  └────────────────────────┘                                           │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Bulk Import Pipeline Architecture

The bulk import pipeline processes CSV/Excel files through a multi-stage pipeline with validation, preview, and execution phases.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    BULK IMPORT PIPELINE                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Stage 1: UPLOAD                                                      │
│  ┌─────────────────────────────────────────────────┐                 │
│  │  File Upload (max 10MB, UTF-8)                   │                 │
│  │  → Delimiter detection (comma, semicolon, tab)   │                 │
│  │  → Column extraction                             │                 │
│  │  → Column mapping UI                             │                 │
│  │    CSV Column        → System Field              │                 │
│  │    "Full Name"       → participant.name           │                 │
│  │    "Email"           → participant.email           │                 │
│  │    "Passport No."    → participant.passportNumber  │                 │
│  └──────────────────────────┬──────────────────────┘                 │
│                              │                                        │
│  Stage 2: VALIDATION                                                  │
│  ┌──────────────────────────▼──────────────────────┐                 │
│  │  BulkOperation created (status: VALIDATING)      │                 │
│  │  Per-row checks:                                 │                 │
│  │  → Required fields → Email format → Country      │                 │
│  │  → Participant type → Duplicate check             │                 │
│  │  Results: "847 valid, 12 warnings, 3 errors"     │                 │
│  │  BulkOperation.status → PREVIEW                  │                 │
│  └──────────────────────────┬──────────────────────┘                 │
│                              │                                        │
│  Stage 3: PREVIEW                                                     │
│  ┌──────────────────────────▼──────────────────────┐                 │
│  │  Show first 20 rows as they would be imported    │                 │
│  │  Summary: "847 new, 0 duplicates, 3 skipped"     │                 │
│  │  [Confirm Import] or [Cancel]                    │                 │
│  └──────────────────────────┬──────────────────────┘                 │
│                              │                                        │
│  Stage 4: EXECUTION                                                   │
│  ┌──────────────────────────▼──────────────────────┐                 │
│  │  BulkOperation.status → PROCESSING               │                 │
│  │  Worker processes in batches of 50                │                 │
│  │  Each participant → duplicate check → blacklist   │                 │
│  │  → workflow Step 1                                │                 │
│  │  Progress via SSE: "247/847 (29%)"               │                 │
│  │  BulkOperation.status → COMPLETED                 │                 │
│  │  Undo available for 24 hours                      │                 │
│  └──────────────────────────────────────────────────┘                 │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.4 Duplicate Detection Engine Architecture

The duplicate detection engine uses a multi-layered matching approach combining exact matches, fuzzy string matching, and cross-field scoring.

```
┌──────────────────────────────────────────────────────────────────────┐
│                  DUPLICATE DETECTION ENGINE                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  INPUT: Participant registration data                                 │
│  ┌─────────────────────────────────────────────────────┐             │
│  │  name, passport, email, DOB, country, phone, org    │             │
│  └──────────────────────────┬──────────────────────────┘             │
│                              │                                        │
│  LAYER 1: Exact Match (confidence = 1.0)                              │
│  ┌──────────────────────────▼──────────────────────────┐             │
│  │  Passport number exact match      → score: 1.00     │             │
│  │  Email exact match                → score: 0.95     │             │
│  └──────────────────────────┬──────────────────────────┘             │
│                              │                                        │
│  LAYER 2: Fuzzy Match                                                 │
│  ┌──────────────────────────▼──────────────────────────┐             │
│  │  Name: Levenshtein distance <= 2  → score: 0.85     │             │
│  │  Name: Soundex/Metaphone match    → score: 0.80     │             │
│  │  Name + DOB match                 → score: 0.90     │             │
│  │  Name + Country match             → score: 0.70     │             │
│  │  Phone (normalized) match         → score: 0.80     │             │
│  └──────────────────────────┬──────────────────────────┘             │
│                              │                                        │
│  LAYER 3: Cross-Field Scoring                                         │
│  ┌──────────────────────────▼──────────────────────────┐             │
│  │  confidenceScore = max(individual field scores)      │             │
│  │  Multiple fields match: +0.05 per additional match   │             │
│  │  Example: name(0.85) + country(0.70) → 0.90          │             │
│  └──────────────────────────┬──────────────────────────┘             │
│                              │                                        │
│  LAYER 4: Threshold Decision                                          │
│  ┌──────────────────────────▼──────────────────────────┐             │
│  │  >= 0.90: AUTO-FLAG (registration held)              │             │
│  │  0.70-0.89: WARNING (proceed, admin notified)        │             │
│  │  < 0.70: PASS (no action)                            │             │
│  └──────────────────────────┬──────────────────────────┘             │
│                              │                                        │
│  CROSS-EVENT DETECTION                                                │
│  ┌──────────────────────────▼──────────────────────────┐             │
│  │  After within-event check, run same algorithm        │             │
│  │  against participants from all concurrent events     │             │
│  │  for the same tenant                                 │             │
│  └─────────────────────────────────────────────────────┘             │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.5 Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      MODULE 09 COMPONENT INTERACTIONS                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐                                                     │
│  │  Module 03        │──── Form templates for registration                │
│  │  Form Designer    │                                                     │
│  └────────┬─────────┘                                                     │
│           │ renders                                                        │
│  ┌────────▼─────────┐     ┌──────────────────┐     ┌──────────────────┐  │
│  │  Registration     │────▶│  Duplicate        │────▶│  Blacklist       │  │
│  │  Entry Points     │     │  Detection Engine │     │  Screening       │  │
│  └────────┬─────────┘     └──────────────────┘     └────────┬─────────┘  │
│           │                                                   │            │
│           │              ┌──────────────────┐                │            │
│           └─────────────▶│  Quota Enforcement│                │            │
│                          │  Engine           │                │            │
│                          └──────────────────┘                │            │
│                                                               │            │
│  ┌──────────────────┐     ┌──────────────────┐     ┌────────▼─────────┐  │
│  │  Module 04        │◀────│  Workflow Entry   │◀────│  Registration    │  │
│  │  Workflow Engine  │     │  Service          │     │  Pipeline        │  │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘  │
│                                                                           │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐  │
│  │  Module 14        │     │  Module 11        │     │  Module 05       │  │
│  │  Content/Email    │     │  Logistics        │     │  Security        │  │
│  │  - Confirmations  │     │  - Accommodation  │     │  - Auth/Authz    │  │
│  │  - Notifications  │     │  - Transport      │     │  - Audit logging │  │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘  │
│                                                                           │
│  ┌──────────────────┐                                                     │
│  │  Waitlist Manager │──── Captures overflow, auto-promotes on opening    │
│  └──────────────────┘                                                     │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Delegation Models

```prisma
model Delegation {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  name            String   // "Republic of Kenya", "African Development Bank"
  code            String   // "KEN", "AFDB"
  headOfDelegation String? // participantId of the leader
  focalPointId    String   // userId of the focal point
  secondaryFocalId String? // backup focal point
  status          String   // ACTIVE, SUSPENDED, COMPLETED
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  quotaAllocations DelegationQuota[]

  @@unique([tenantId, eventId, code])
  @@index([focalPointId])
}

model DelegationQuota {
  id                String   @id @default(cuid())
  delegationId      String
  delegation        Delegation @relation(fields: [delegationId], references: [id], onDelete: Cascade)
  participantTypeId String
  allocatedQuota    Int
  usedQuota         Int      @default(0)
  pendingQuota      Int      @default(0) // Submitted but not yet approved
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([delegationId, participantTypeId])
}

model QuotaChangeRequest {
  id              String   @id @default(cuid())
  delegationId    String
  participantTypeId String
  currentQuota    Int
  requestedQuota  Int
  reason          String
  status          String   // PENDING, APPROVED, DENIED
  requestedBy     String   // userId
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?
  createdAt       DateTime @default(now())

  @@index([delegationId, status])
}

model ParticipantReplacement {
  id                  String   @id @default(cuid())
  delegationId        String
  originalParticipantId String
  replacementParticipantId String?
  reason              String
  status              String   // PENDING, APPROVED, DENIED, COMPLETED
  requestedBy         String
  approvedBy          String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([delegationId, status])
}
```

### 3.2 Bulk Operation Models

```prisma
enum BulkOperationType {
  IMPORT_PARTICIPANTS
  IMPORT_INVITATIONS
  EXPORT_PARTICIPANTS
  EXPORT_APPROVALS
  STATUS_CHANGE
  BULK_APPROVE
  BULK_REJECT
  BULK_BYPASS
  FIELD_UPDATE
  DELETE
}

enum BulkOperationStatus {
  VALIDATING
  PREVIEW
  CONFIRMED
  PROCESSING
  COMPLETED
  FAILED
  ROLLED_BACK
}

model BulkOperation {
  id              String              @id @default(cuid())
  tenantId        String
  eventId         String
  type            BulkOperationType
  status          BulkOperationStatus
  description     String              // "Import 847 delegates from AU_delegates.csv"
  filters         Json?               // For status change: { participantTypes, countries, statuses }
  totalItems      Int                 @default(0)
  processedItems  Int                 @default(0)
  successCount    Int                 @default(0)
  failureCount    Int                 @default(0)
  inputFileUrl    String?             // For imports: uploaded CSV location
  outputFileUrl   String?             // For exports: download link
  snapshotData    Json?               // Pre-operation state for undo
  undoDeadline    DateTime?           // Undo available until this time
  errorLog        Json?               // Array of { row, field, error }
  startedAt       DateTime?
  completedAt     DateTime?
  rolledBackAt    DateTime?
  createdBy       String
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  items           BulkOperationItem[]

  @@index([eventId, status])
  @@index([eventId, type, createdAt])
}

model BulkOperationItem {
  id            String        @id @default(cuid())
  operationId   String
  operation     BulkOperation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  participantId String?
  rowNumber     Int?          // For CSV imports
  status        String        // PENDING, SUCCESS, FAILED, SKIPPED, ROLLED_BACK
  inputData     Json?         // Raw data for this item
  previousState Json?         // State before operation (for undo)
  errorMessage  String?
  processedAt   DateTime?

  @@index([operationId, status])
}
```

### 3.3 Duplicate Detection and Blacklist Models

```prisma
enum DuplicateStatus {
  PENDING_REVIEW
  CONFIRMED_DUPLICATE
  NOT_DUPLICATE
  MERGED
}

model DuplicateCandidate {
  id              String          @id @default(cuid())
  tenantId        String
  eventId         String?         // null for cross-event duplicates
  participantAId  String
  participantBId  String
  confidenceScore Float           // 0.0 - 1.0
  matchFields     Json            // { passport: 1.0, name: 0.85, email: 0.75 }
  status          DuplicateStatus
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?
  createdAt       DateTime        @default(now())

  @@unique([participantAId, participantBId])
  @@index([eventId, status])
  @@index([confidenceScore])
}

model MergeHistory {
  id                String   @id @default(cuid())
  tenantId          String
  survivingId       String   // The participant record that remains
  mergedId          String   // The participant record that was absorbed
  fieldResolution   Json     // { name: "survivingId", email: "mergedId", ... } — which record's field won
  approvalsMigrated Int      // Count of approval records moved
  mergedBy          String
  mergedAt          DateTime @default(now())

  @@index([survivingId])
  @@index([mergedId])
}

model Blacklist {
  id             String    @id @default(cuid())
  tenantId       String?   // null = global blacklist
  type           String    // INDIVIDUAL, ORGANIZATION, COUNTRY
  name           String?
  nameVariations String[]  // ["Mohammed Ali", "Muhammad Ali", "Mohamed Ali"]
  passportNumber String?
  email          String?
  dateOfBirth    DateTime?
  nationality    String?
  organization   String?
  reason         String
  source         String?   // "UN Security Council", "Internal", "Government"
  addedBy        String
  expiresAt      DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([passportNumber])
  @@index([email])
  @@index([isActive])
  @@index([name])
}
```

### 3.4 Waitlist Models

```prisma
enum WaitlistStatus {
  ACTIVE      // In the queue, waiting for a slot
  PROMOTED    // Promoted to active registration, entered workflow
  EXPIRED     // Offer expired (participant didn't confirm in time)
  WITHDRAWN   // Participant voluntarily left the waitlist
  CANCELLED   // Admin cancelled the entry
}

enum WaitlistPriority {
  STANDARD
  HIGH        // Priority delegation, returning participant
  VIP         // Head of State, Minister-level
}

model WaitlistEntry {
  id                String          @id @default(cuid())
  tenantId          String
  tenant            Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId           String
  event             Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participantId     String
  participant       Participant     @relation(fields: [participantId], references: [id], onDelete: Cascade)
  participantType   String          // Waitlist is per participant type
  invitationId      String?         // The invitation this registration was under
  priority          WaitlistPriority @default(STANDARD)
  position          Int             // Queue position within priority tier
  status            WaitlistStatus  @default(ACTIVE)
  registrationData  Json            // Snapshot of the registration form data at time of waitlisting
  promotedAt        DateTime?
  promotionDeadline DateTime?       // Must confirm by this time or slot goes to next person
  expiredAt         DateTime?
  withdrawnAt       DateTime?
  notificationsSent Int             @default(0)
  lastNotifiedAt    DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  promotions        WaitlistPromotion[]

  @@unique([eventId, participantId])
  @@index([eventId, participantType, priority, position])
  @@index([eventId, status])
  @@index([status, promotionDeadline])
}

model WaitlistPromotion {
  id              String        @id @default(cuid())
  waitlistEntryId String
  waitlistEntry   WaitlistEntry @relation(fields: [waitlistEntryId], references: [id], onDelete: Cascade)
  triggeredBy     String        // "cancellation", "rejection", "quota_increase", "manual"
  triggerEntityId String?       // participantId of the person who cancelled/was rejected
  promotedBy      String?       // userId if manual promotion
  slotAvailableAt DateTime      // When the slot opened
  promotedAt      DateTime      @default(now())
  confirmedAt     DateTime?     // When participant confirmed acceptance
  declinedAt      DateTime?     // If participant declined or deadline passed

  @@index([waitlistEntryId])
}
```

### 3.5 Participant State Machine

The participant state machine defines all valid states and transitions throughout the registration and accreditation lifecycle.

```
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                         │ submit
                    ┌────▼─────┐
            ┌───────│ SUBMITTED│───────┐
            │       └────┬─────┘       │
            │            │ assign      │ auto-reject
            │       ┌────▼─────┐       │    (blacklist)
            │       │IN_REVIEW │       │
            │       └──┬───┬───┘       │
            │    approve│   │reject    │
            │   ┌──────▼┐ ┌▼────────┐ │
            │   │APPROVED│ │REJECTED │◀┘
            │   └───┬────┘ └─────────┘
            │       │ print
            │  ┌────▼─────┐
            │  │ PRINTED   │
            │  └────┬──────┘
            │       │ collect
            │  ┌────▼──────┐
            │  │ COLLECTED  │
            │  └────────────┘
            │
            │  ┌────────────┐
            ├──│ WAITLISTED │ (quota full)
            │  └────────────┘
            │
            │  ┌────────────┐
            ├──│ FLAGGED    │ (blacklist match)
            │  └────────────┘
            │
            │  ┌────────────┐
            ├──│ WITHDRAWN  │ (voluntary withdrawal)
            │  └────────────┘
            │
            │  ┌────────────┐
            └──│ REPLACED   │ (delegation replacement)
               └────────────┘

  Additional transitions:
  - IN_REVIEW → RETURNED (request more info) → SUBMITTED (re-submit)
  - APPROVED → WITHDRAWN (voluntary)
  - APPROVED → REPLACED (delegation swap)
  - WAITLISTED → SUBMITTED (promoted from waitlist)
  - FLAGGED → SUBMITTED (blacklist override by admin)
  - FLAGGED → REJECTED (blacklist confirmed)
  - Any active status → WITHDRAWN (voluntary withdrawal)
```

**ParticipantStatus Enum:**

```typescript
enum ParticipantStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  IN_REVIEW = "IN_REVIEW",
  RETURNED = "RETURNED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PRINTED = "PRINTED",
  COLLECTED = "COLLECTED",
  WAITLISTED = "WAITLISTED",
  FLAGGED = "FLAGGED",
  WITHDRAWN = "WITHDRAWN",
  REPLACED = "REPLACED",
}
```

### 3.6 ER Diagram

```
┌────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Delegation    │──1:N──│  DelegationQuota  │       │ QuotaChangeReq   │
│                 │       │                   │       │                   │
│ id              │       │ delegationId (FK) │       │ delegationId (FK) │
│ tenantId        │       │ participantTypeId │       │ participantTypeId │
│ eventId         │       │ allocatedQuota    │       │ currentQuota      │
│ name            │       │ usedQuota         │       │ requestedQuota    │
│ code            │       │ pendingQuota      │       │ status            │
│ focalPointId    │       └──────────────────┘       └──────────────────┘
│ status          │
└───────┬────────┘
        │
        │ 1:N
        ▼
┌──────────────────────┐
│ ParticipantReplacement│
│                       │
│ delegationId (FK)     │
│ originalParticipantId │
│ replacementPartId     │
│ status                │
└──────────────────────┘

┌────────────────┐       ┌──────────────────┐
│ BulkOperation   │──1:N──│ BulkOperationItem │
│                 │       │                   │
│ tenantId        │       │ operationId (FK)  │
│ eventId         │       │ participantId     │
│ type            │       │ rowNumber         │
│ status          │       │ status            │
│ totalItems      │       │ inputData         │
│ processedItems  │       │ previousState     │
│ inputFileUrl    │       │ errorMessage      │
│ snapshotData    │       └──────────────────┘
└────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ DuplicateCandidate│     │   MergeHistory    │     │   Blacklist     │
│                   │     │                   │     │                 │
│ participantAId    │     │ survivingId       │     │ tenantId        │
│ participantBId    │     │ mergedId          │     │ type            │
│ confidenceScore   │     │ fieldResolution   │     │ name            │
│ matchFields       │     │ approvalsMigrated │     │ nameVariations  │
│ status            │     │ mergedBy          │     │ passportNumber  │
└──────────────────┘     └──────────────────┘     │ email           │
                                                    │ isActive        │
┌────────────────┐       ┌──────────────────┐     └────────────────┘
│ WaitlistEntry   │──1:N──│WaitlistPromotion  │
│                 │       │                   │
│ participantId   │       │ waitlistEntryId   │
│ participantType │       │ triggeredBy       │
│ priority        │       │ triggerEntityId   │
│ position        │       │ promotedAt        │
│ status          │       │ confirmedAt       │
│ registrationData│       │ declinedAt        │
└────────────────┘       └──────────────────┘
```

### 3.7 Index Catalog

| Table                    | Index    | Columns                                          | Purpose                                      |
| ------------------------ | -------- | ------------------------------------------------ | -------------------------------------------- |
| `Delegation`             | `unique` | `(tenantId, eventId, code)`                      | Prevent duplicate delegation codes per event |
| `Delegation`             | `index`  | `(focalPointId)`                                 | Lookup delegations by focal point            |
| `DelegationQuota`        | `unique` | `(delegationId, participantTypeId)`              | One quota allocation per type per delegation |
| `QuotaChangeRequest`     | `index`  | `(delegationId, status)`                         | List pending requests for a delegation       |
| `ParticipantReplacement` | `index`  | `(delegationId, status)`                         | List pending replacements for a delegation   |
| `BulkOperation`          | `index`  | `(eventId, status)`                              | List active operations for an event          |
| `BulkOperation`          | `index`  | `(eventId, type, createdAt)`                     | Operation history filtered by type           |
| `BulkOperationItem`      | `index`  | `(operationId, status)`                          | Track item processing progress               |
| `DuplicateCandidate`     | `unique` | `(participantAId, participantBId)`               | Prevent duplicate pair entries               |
| `DuplicateCandidate`     | `index`  | `(eventId, status)`                              | List pending reviews for an event            |
| `DuplicateCandidate`     | `index`  | `(confidenceScore)`                              | Sort by confidence for prioritized review    |
| `MergeHistory`           | `index`  | `(survivingId)`                                  | Lookup merge history for a participant       |
| `MergeHistory`           | `index`  | `(mergedId)`                                     | Reverse lookup of absorbed records           |
| `Blacklist`              | `index`  | `(passportNumber)`                               | Fast passport screening                      |
| `Blacklist`              | `index`  | `(email)`                                        | Fast email screening                         |
| `Blacklist`              | `index`  | `(isActive)`                                     | Filter active entries only                   |
| `Blacklist`              | `index`  | `(name)`                                         | Name-based screening lookup                  |
| `WaitlistEntry`          | `unique` | `(eventId, participantId)`                       | One waitlist entry per participant per event |
| `WaitlistEntry`          | `index`  | `(eventId, participantType, priority, position)` | Priority-ordered queue lookup                |
| `WaitlistEntry`          | `index`  | `(eventId, status)`                              | Filter waitlist by status                    |
| `WaitlistEntry`          | `index`  | `(status, promotionDeadline)`                    | Deadline monitoring background job           |
| `WaitlistPromotion`      | `index`  | `(waitlistEntryId)`                              | Promotion history for an entry               |

---

## 4. API Specification

All endpoints are tenant-scoped and require authentication unless otherwise noted. Base path: `/api/v1/tenants/:tenantId/events/:eventId`.

### 4.1 Self-Service Registration API

#### `POST /registration/public`

Public endpoint (no authentication required). Creates a self-service registration from a public form link.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/registration/public
// Headers: X-CAPTCHA-Token (required)

interface SelfServiceRegistrationRequest {
  formTemplateId: string;
  invitationCode?: string; // Optional invitation code for pre-authorized registration
  participantType: string;
  data: Record<string, unknown>; // Dynamic form data matching FormTemplate schema
  documents?: {
    fieldName: string;
    fileId: string; // Pre-uploaded via /uploads endpoint
  }[];
}

interface SelfServiceRegistrationResponse {
  id: string;
  registrationCode: string; // e.g., "REG-2026-0089"
  status: ParticipantStatus; // SUBMITTED, WAITLISTED, or FLAGGED
  waitlistPosition?: number; // If waitlisted
  duplicateWarning?: {
    candidateId: string;
    confidenceScore: number;
    message: string;
  };
  trackingUrl: string; // Public URL to check status
  createdAt: string;
}
```

**Status Codes:**

| Code  | Description                                           |
| ----- | ----------------------------------------------------- |
| `201` | Registration created successfully                     |
| `202` | Registration waitlisted (quota full)                  |
| `400` | Validation errors (with per-field error details)      |
| `403` | CAPTCHA verification failed                           |
| `409` | Duplicate detected (auto-flagged, confidence >= 0.90) |
| `423` | Registration blocked (blacklist match)                |
| `429` | Rate limit exceeded                                   |

#### `GET /registration/public/:registrationCode/status`

Public endpoint. Returns current registration status for participant tracking.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/registration/public/:registrationCode/status

interface RegistrationStatusResponse {
  registrationCode: string;
  status: ParticipantStatus;
  currentStep?: {
    stepNumber: number;
    stepName: string;
    assignedAt: string;
  };
  waitlist?: {
    position: number;
    priority: WaitlistPriority;
    aheadOfYou: number;
    behindYou: number;
    quotaStatus: string; // "50/50 (full)"
  };
  timeline: {
    event: string;
    timestamp: string;
    description: string;
  }[];
  requiredActions?: {
    type: string; // "UPLOAD_DOCUMENT", "PROVIDE_INFO"
    field: string;
    message: string;
    deadline?: string;
  }[];
}
```

### 4.2 Focal Point Registration API

#### `POST /delegations/:delegationId/participants`

Registers a new participant within a delegation. Requires focal point authorization.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId/participants
// Auth: Bearer token (focal point role for this delegation)

interface FocalPointRegistrationRequest {
  participantTypeId: string;
  formTemplateId: string;
  data: Record<string, unknown>;
  documents?: {
    fieldName: string;
    fileId: string;
  }[];
}

interface FocalPointRegistrationResponse {
  id: string;
  participantId: string;
  registrationCode: string;
  status: ParticipantStatus;
  quota: {
    participantType: string;
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
  };
  duplicateWarning?: {
    candidateId: string;
    confidenceScore: number;
    message: string;
  };
  createdAt: string;
}
```

**Status Codes:**

| Code  | Description                                           |
| ----- | ----------------------------------------------------- |
| `201` | Participant registered successfully within delegation |
| `400` | Validation errors                                     |
| `403` | Not authorized as focal point for this delegation     |
| `409` | Quota exceeded for this participant type              |
| `422` | Delegation is suspended or completed                  |

### 4.3 Delegation Management API

#### `GET /delegations`

List all delegations for the event. Admin sees all; focal points see only their own.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/delegations
// Query params: ?status=ACTIVE&search=kenya&page=1&pageSize=20

interface DelegationListResponse {
  data: {
    id: string;
    name: string;
    code: string;
    status: string;
    focalPoint: { id: string; name: string; email: string };
    quotaSummary: {
      totalAllocated: number;
      totalUsed: number;
      totalPending: number;
      totalRemaining: number;
    };
    participantCount: number;
    completionPercentage: number;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

#### `POST /delegations`

Create a new delegation.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/delegations

interface CreateDelegationRequest {
  name: string;
  code: string;
  focalPointId: string;
  secondaryFocalId?: string;
  notes?: string;
  quotas: {
    participantTypeId: string;
    allocatedQuota: number;
  }[];
}
```

#### `GET /delegations/:delegationId`

Get delegation details including full quota breakdown.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId

interface DelegationDetailResponse {
  id: string;
  name: string;
  code: string;
  status: string;
  focalPoint: { id: string; name: string; email: string };
  secondaryFocal?: { id: string; name: string; email: string };
  headOfDelegation?: { id: string; name: string };
  notes?: string;
  quotas: {
    participantTypeId: string;
    participantTypeName: string;
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
  }[];
  participants: {
    id: string;
    name: string;
    participantType: string;
    status: ParticipantStatus;
    currentStep?: string;
    registeredAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
```

#### `PUT /delegations/:delegationId`

Update delegation details.

```typescript
// PUT /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId

interface UpdateDelegationRequest {
  name?: string;
  focalPointId?: string;
  secondaryFocalId?: string;
  headOfDelegation?: string;
  notes?: string;
  status?: "ACTIVE" | "SUSPENDED" | "COMPLETED";
}
```

#### `GET /delegations/:delegationId/quotas`

Get detailed quota information for a delegation.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId/quotas

interface QuotaDetailResponse {
  delegationId: string;
  delegationName: string;
  quotas: {
    id: string;
    participantTypeId: string;
    participantTypeName: string;
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
    utilizationPercentage: number;
    changeRequests: {
      id: string;
      requestedQuota: number;
      reason: string;
      status: string;
      createdAt: string;
    }[];
  }[];
}
```

#### `POST /delegations/:delegationId/quota-change-requests`

Request a quota increase for a participant type.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId/quota-change-requests

interface QuotaChangeRequestInput {
  participantTypeId: string;
  requestedQuota: number;
  reason: string;
}

interface QuotaChangeRequestResponse {
  id: string;
  delegationId: string;
  participantTypeId: string;
  currentQuota: number;
  requestedQuota: number;
  reason: string;
  status: "PENDING";
  createdAt: string;
}
```

#### `PUT /delegations/:delegationId/quota-change-requests/:requestId`

Admin approves or denies a quota change request.

```typescript
// PUT /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId/quota-change-requests/:requestId

interface QuotaChangeReviewInput {
  status: "APPROVED" | "DENIED";
  reviewNotes?: string;
}
```

#### `POST /delegations/:delegationId/replacements`

Request a participant replacement within a delegation.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId/replacements

interface ReplacementRequestInput {
  originalParticipantId: string;
  reason: string;
}

interface ReplacementRequestResponse {
  id: string;
  delegationId: string;
  originalParticipantId: string;
  reason: string;
  status: "PENDING";
  createdAt: string;
}
```

#### `PUT /delegations/:delegationId/replacements/:replacementId`

Admin approves or denies a replacement request.

```typescript
// PUT /api/v1/tenants/:tenantId/events/:eventId/delegations/:delegationId/replacements/:replacementId

interface ReplacementReviewInput {
  status: "APPROVED" | "DENIED";
  reviewNotes?: string;
}
```

### 4.4 Bulk Import API

#### `POST /bulk-operations/import`

Initiate a bulk import operation by uploading a file.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/bulk-operations/import
// Content-Type: multipart/form-data

interface BulkImportRequest {
  file: File; // CSV or Excel file (max 10MB)
  type: "IMPORT_PARTICIPANTS" | "IMPORT_INVITATIONS";
  description?: string;
  delegationCode?: string; // Optional: assign all imported participants to a delegation
}

interface BulkImportInitResponse {
  operationId: string;
  status: "VALIDATING";
  detectedColumns: string[];
  suggestedMapping: {
    csvColumn: string;
    systemField: string | null;
    confidence: number;
  }[];
  totalRows: number;
}
```

#### `POST /bulk-operations/:operationId/mapping`

Submit column mapping for the import.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/bulk-operations/:operationId/mapping

interface ColumnMappingRequest {
  mappings: {
    csvColumn: string;
    systemField: string; // e.g., "participant.name", "participant.email"
  }[];
  defaultValues?: {
    systemField: string;
    value: string; // e.g., default participant type
  }[];
}
```

#### `POST /bulk-operations/:operationId/validate`

Run validation on all rows with the provided mapping.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/bulk-operations/:operationId/validate

interface ValidationResultResponse {
  operationId: string;
  status: "PREVIEW";
  summary: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
    duplicateRows: number;
  };
  errors: {
    rowNumber: number;
    field: string;
    value: string;
    error: string;
  }[];
  warnings: {
    rowNumber: number;
    field: string;
    message: string;
  }[];
  preview: Record<string, unknown>[]; // First 20 rows as they would be imported
}
```

#### `POST /bulk-operations/:operationId/execute`

Confirm and execute the bulk import.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/bulk-operations/:operationId/execute

interface BulkExecuteResponse {
  operationId: string;
  status: "PROCESSING";
  estimatedDuration: number; // seconds
  sseEndpoint: string; // SSE endpoint for progress updates
}
```

#### `GET /bulk-operations/:operationId/status`

Get current status and progress of a bulk operation.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/bulk-operations/:operationId/status

interface BulkOperationStatusResponse {
  operationId: string;
  type: BulkOperationType;
  status: BulkOperationStatus;
  description: string;
  progress: {
    totalItems: number;
    processedItems: number;
    successCount: number;
    failureCount: number;
    percentComplete: number;
  };
  undoAvailable: boolean;
  undoDeadline?: string;
  errorLog?: {
    rowNumber: number;
    field: string;
    error: string;
  }[];
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}
```

#### `POST /bulk-operations/:operationId/undo`

Undo a completed bulk operation (within the undo deadline).

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/bulk-operations/:operationId/undo

interface BulkUndoResponse {
  operationId: string;
  status: "ROLLED_BACK";
  itemsRolledBack: number;
  rolledBackAt: string;
}
```

**Status Codes:**

| Code  | Description                          |
| ----- | ------------------------------------ |
| `200` | Undo successful                      |
| `400` | Operation is not in COMPLETED status |
| `410` | Undo deadline has passed             |

#### `GET /bulk-operations`

List all bulk operations for the event.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/bulk-operations
// Query params: ?type=IMPORT_PARTICIPANTS&status=COMPLETED&page=1&pageSize=20

interface BulkOperationListResponse {
  data: BulkOperationStatusResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### 4.5 Duplicate Detection API

#### `POST /duplicates/search`

Manually search for duplicates of a specific participant.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/duplicates/search

interface DuplicateSearchRequest {
  participantId?: string; // Search against a specific participant
  searchFields?: {
    name?: string;
    passportNumber?: string;
    email?: string;
    dateOfBirth?: string;
    nationality?: string;
    phone?: string;
  };
  thresholdOverride?: number; // Override minimum confidence threshold
  includesCrossEvent?: boolean; // Search across all tenant events
}

interface DuplicateSearchResponse {
  candidates: {
    id: string;
    participantId: string;
    participantName: string;
    confidenceScore: number;
    matchFields: Record<string, number>;
    participantStatus: ParticipantStatus;
    eventName: string;
    registeredAt: string;
  }[];
  searchDuration: number; // milliseconds
}
```

#### `GET /duplicates`

List all duplicate candidates pending review.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/duplicates
// Query params: ?status=PENDING_REVIEW&minConfidence=0.80&page=1&pageSize=20

interface DuplicateCandidateListResponse {
  data: {
    id: string;
    participantA: {
      id: string;
      name: string;
      email: string;
      passportNumber: string;
      status: ParticipantStatus;
      registeredBy: string;
    };
    participantB: {
      id: string;
      name: string;
      email: string;
      passportNumber: string;
      status: ParticipantStatus;
      registeredBy: string;
    };
    confidenceScore: number;
    matchFields: Record<string, number>;
    status: DuplicateStatus;
    createdAt: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    totalPending: number;
    avgConfidence: number;
    highConfidenceCount: number; // >= 0.90
  };
}
```

#### `POST /duplicates/:candidateId/merge`

Merge two duplicate participants.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/duplicates/:candidateId/merge

interface MergeRequest {
  survivingParticipantId: string; // Which record survives
  fieldResolution: {
    fieldName: string;
    sourceParticipantId: string; // Which participant's value to keep
  }[];
}

interface MergeResponse {
  mergeHistoryId: string;
  survivingId: string;
  mergedId: string;
  fieldResolution: Record<string, string>;
  approvalsMigrated: number;
  documentsMigrated: number;
  mergedAt: string;
}
```

#### `POST /duplicates/:candidateId/dismiss`

Dismiss a duplicate candidate as not a duplicate.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/duplicates/:candidateId/dismiss

interface DismissRequest {
  reviewNotes?: string;
}
```

### 4.6 Blacklist Management API

#### `GET /blacklist`

List all blacklist entries.

```typescript
// GET /api/v1/tenants/:tenantId/blacklist
// Query params: ?type=INDIVIDUAL&isActive=true&search=&page=1&pageSize=20

interface BlacklistListResponse {
  data: {
    id: string;
    type: string;
    name: string;
    nameVariations: string[];
    passportNumber?: string;
    email?: string;
    nationality?: string;
    organization?: string;
    reason: string;
    source?: string;
    isActive: boolean;
    expiresAt?: string;
    addedBy: string;
    createdAt: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

#### `POST /blacklist`

Add a new blacklist entry.

```typescript
// POST /api/v1/tenants/:tenantId/blacklist

interface CreateBlacklistRequest {
  type: "INDIVIDUAL" | "ORGANIZATION" | "COUNTRY";
  name?: string;
  nameVariations?: string[];
  passportNumber?: string;
  email?: string;
  dateOfBirth?: string;
  nationality?: string;
  organization?: string;
  reason: string;
  source?: string;
  expiresAt?: string;
}
```

#### `PUT /blacklist/:entryId`

Update a blacklist entry.

```typescript
// PUT /api/v1/tenants/:tenantId/blacklist/:entryId

interface UpdateBlacklistRequest {
  name?: string;
  nameVariations?: string[];
  passportNumber?: string;
  email?: string;
  reason?: string;
  source?: string;
  isActive?: boolean;
  expiresAt?: string;
}
```

#### `DELETE /blacklist/:entryId`

Deactivate a blacklist entry (soft delete).

#### `POST /blacklist/screen`

Screen a participant against the blacklist (manual screening).

```typescript
// POST /api/v1/tenants/:tenantId/blacklist/screen

interface ScreeningRequest {
  name: string;
  passportNumber?: string;
  email?: string;
  organization?: string;
  nationality?: string;
}

interface ScreeningResponse {
  matches: {
    blacklistEntryId: string;
    matchType: string; // "EXACT_PASSPORT", "EXACT_EMAIL", "FUZZY_NAME", "ORGANIZATION"
    confidence: number;
    blacklistEntry: {
      type: string;
      name: string;
      reason: string;
      source: string;
    };
  }[];
  isBlocked: boolean; // true if any high-confidence match found
}
```

#### `POST /blacklist/rescan`

Trigger a re-scan of all existing participants against the blacklist.

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/blacklist/rescan

interface RescanResponse {
  operationId: string;
  totalParticipants: number;
  estimatedDuration: number; // seconds
  sseEndpoint: string;
}
```

### 4.7 Waitlist API

#### `GET /waitlist`

List all waitlist entries for the event.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/waitlist
// Query params: ?status=ACTIVE&participantType=Delegate&priority=VIP&page=1&pageSize=20

interface WaitlistListResponse {
  data: {
    id: string;
    participant: {
      id: string;
      name: string;
      email: string;
      participantType: string;
    };
    priority: WaitlistPriority;
    position: number;
    status: WaitlistStatus;
    registrationData: Record<string, unknown>;
    promotedAt?: string;
    promotionDeadline?: string;
    createdAt: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  analytics: {
    totalActive: number;
    totalPromoted: number;
    totalExpired: number;
    averageWaitTime: Record<WaitlistPriority, number>; // hours
    demandToCapacity: Record<string, number>; // by participant type
  };
}
```

#### `GET /waitlist/:entryId`

Get detailed waitlist entry information.

```typescript
// GET /api/v1/tenants/:tenantId/events/:eventId/waitlist/:entryId

interface WaitlistEntryDetailResponse {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
    participantType: string;
  };
  priority: WaitlistPriority;
  position: number;
  aheadOfYou: number;
  behindYou: number;
  status: WaitlistStatus;
  registrationData: Record<string, unknown>;
  positionHistory: {
    position: number;
    changedAt: string;
    reason: string;
  }[];
  promotions: {
    triggeredBy: string;
    promotedAt: string;
    confirmedAt?: string;
    declinedAt?: string;
  }[];
  createdAt: string;
}
```

#### `POST /waitlist/:entryId/promote`

Manually promote a waitlist entry (admin action, skips queue).

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/waitlist/:entryId/promote

interface ManualPromoteResponse {
  waitlistEntryId: string;
  participantId: string;
  status: "PROMOTED";
  promotionDeadline: string;
  promotedAt: string;
}
```

#### `POST /waitlist/:entryId/withdraw`

Withdraw from the waitlist (participant or admin action).

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/waitlist/:entryId/withdraw

interface WithdrawResponse {
  waitlistEntryId: string;
  status: "WITHDRAWN";
  withdrawnAt: string;
}
```

#### `POST /waitlist/:entryId/confirm`

Confirm acceptance of a waitlist promotion (participant action).

```typescript
// POST /api/v1/tenants/:tenantId/events/:eventId/waitlist/:entryId/confirm

interface ConfirmPromotionResponse {
  waitlistEntryId: string;
  participantId: string;
  status: "PROMOTED";
  newParticipantStatus: ParticipantStatus; // SUBMITTED (enters workflow)
  confirmedAt: string;
}
```

---

## 5. Business Logic

### 5.1 Delegation Portal Wireframe

In diplomatic events, participants don't register themselves individually. A **focal point** -- typically an embassy official or organizational coordinator -- manages the entire delegation. They need a dedicated portal to view quotas, register participants within their allocation, upload documents, and track progress. Without this, focal points must email the accreditation office for every action, creating an unscalable bottleneck.

```
┌─────────────────────────────────────────────────────────────┐
│  Republic of Kenya — Delegation Portal                       │
│  38th AU Summit  |  Focal Point: Jane Wanjiku               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Quota Overview                                              │
│  ┌─────────────────────┬───────┬──────┬─────────┬─────────┐ │
│  │ Participant Type     │ Quota │ Used │ Pending │ Remain  │ │
│  ├─────────────────────┼───────┼──────┼─────────┼─────────┤ │
│  │ Head of State        │   1   │  1   │    0    │   0     │ │
│  │ Minister             │   5   │  3   │    1    │   1     │ │
│  │ Delegate             │  15   │  12  │    2    │   1     │ │
│  │ Support Staff        │  10   │   6  │    0    │   4     │ │
│  │ Security             │   8   │   8  │    0    │   0     │ │
│  └─────────────────────┴───────┴──────┴─────────┴─────────┘ │
│                                                              │
│  [+ Register Participant]  [Request Quota Increase]          │
│                                                              │
│  Participants (22 of 39 quota)                  [Filter]     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ H.E. William Ruto      │ Head of State │ Approved     │   │
│  │ Amb. Raychelle Omamo   │ Minister      │ Approved     │   │
│  │ Dr. Monica Juma        │ Minister      │ In Review    │   │
│  │ John Kamau             │ Delegate      │ Missing doc  │   │
│  │ Mary Njeri             │ Delegate      │ Pending      │   │
│  │ ...                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Quick Actions:                                              │
│  [Upload Documents]  [Replace Participant]  [Export List]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Registration Within Quota Flow

```
Focal point clicks [+ Register Participant]
  → System checks: DelegationQuota.usedQuota + pendingQuota < allocatedQuota?
    → No → "Quota full for this participant type. Request increase or choose another type."
    → Yes → Registration form opens (dynamic form from FormTemplate)
  → Focal point fills in participant details, uploads documents
  → Submit → Participant record created with delegation link
  → DelegationQuota.pendingQuota incremented
  → Participant enters workflow (Step 1)
  → When participant reaches APPROVED status → pendingQuota decremented, usedQuota incremented
  → When participant is REJECTED → pendingQuota decremented
```

### 5.3 Participant Replacement Flow

```
Focal point selects approved participant → [Replace]
  → Reason required: "Participant unable to travel", "Changed delegation composition"
  → Creates ParticipantReplacement (status: PENDING)
  → Admin reviews replacement request
  → If APPROVED:
    → Original participant status set to REPLACED (withdrawn from workflow)
    → Focal point receives notification to register replacement
    → Replacement registration opens with pre-filled delegation info
    → Replacement enters workflow from Step 1
    → DelegationQuota counts remain unchanged (swap, not addition)
  → If DENIED:
    → Focal point notified with reason
```

### 5.4 Delegation Integration Points

| System            | Integration                                                           |
| ----------------- | --------------------------------------------------------------------- |
| Invitation System | DelegationQuota derived from InvitationConstraint records             |
| Workflow Engine   | Registered participants enter event workflow automatically            |
| Communication Hub | Focal points receive status update emails for their delegation        |
| Waitlist          | When quota is full, option to join waitlist instead of hard rejection |
| Analytics         | Delegation completion rates feed into registration velocity dashboard |
| Accommodation     | Focal point can view/manage room assignments for their delegation     |
| Transport         | Focal point provides arrival/departure data for delegation members    |

### 5.5 Self-Service Registration Flow

The self-service registration flow handles individual participants registering through a public form link. This is the most common entry point for open events.

```typescript
// Self-Service Registration Pipeline
class SelfServiceRegistrationService {
  async register(
    tenantId: string,
    eventId: string,
    request: SelfServiceRegistrationRequest,
  ): Promise<SelfServiceRegistrationResponse> {
    // Stage 1: CAPTCHA verification
    const captchaValid = await this.captchaService.verify(request.captchaToken);
    if (!captchaValid) {
      throw new ForbiddenError("CAPTCHA verification failed");
    }

    // Stage 2: Rate limit check
    const rateLimitOk = await this.rateLimiter.check(`registration:${tenantId}:${eventId}`, {
      maxRequests: 100,
      windowMs: 60_000,
    });
    if (!rateLimitOk) {
      throw new TooManyRequestsError("Rate limit exceeded. Please try again later.");
    }

    // Stage 3: Load and validate form template
    const formTemplate = await this.formService.getTemplate(request.formTemplateId);
    const validationResult = await this.formService.validate(formTemplate, request.data);
    if (!validationResult.valid) {
      throw new ValidationError("Form validation failed", validationResult.errors);
    }

    // Stage 4: Quota check
    const quotaAvailable = await this.quotaService.checkAvailability(
      eventId,
      request.participantType,
      request.invitationCode,
    );

    return await this.db.$transaction(async (tx) => {
      // Stage 5: Create participant record
      const participant = await tx.participant.create({
        data: {
          tenantId,
          eventId,
          participantType: request.participantType,
          status: quotaAvailable ? "SUBMITTED" : "WAITLISTED",
          formData: request.data,
          registrationSource: "SELF_SERVICE",
          registrationCode: await this.generateRegistrationCode(eventId),
        },
      });

      // Stage 6: Duplicate detection
      const duplicateResult = await this.duplicateDetector.check(tenantId, eventId, participant);

      if (duplicateResult.highestScore >= 0.9) {
        // Auto-flag: hold registration for admin review
        await tx.participant.update({
          where: { id: participant.id },
          data: { status: "FLAGGED" },
        });
        await tx.duplicateCandidate.create({
          data: {
            tenantId,
            eventId,
            participantAId: duplicateResult.matchedParticipantId,
            participantBId: participant.id,
            confidenceScore: duplicateResult.highestScore,
            matchFields: duplicateResult.matchFields,
            status: "PENDING_REVIEW",
          },
        });
        await this.notificationService.notifyAdmins(eventId, {
          type: "DUPLICATE_FLAGGED",
          participantId: participant.id,
          confidenceScore: duplicateResult.highestScore,
        });
      }

      // Stage 7: Blacklist screening
      const blacklistResult = await this.blacklistScreener.screen(tenantId, {
        name: request.data.name as string,
        passportNumber: request.data.passportNumber as string,
        email: request.data.email as string,
        organization: request.data.organization as string,
        nationality: request.data.nationality as string,
      });

      if (blacklistResult.matches.length > 0) {
        await tx.participant.update({
          where: { id: participant.id },
          data: { status: "FLAGGED" },
        });
        await this.notificationService.notifyAdmins(eventId, {
          type: "BLACKLIST_MATCH",
          participantId: participant.id,
          matches: blacklistResult.matches,
        });
        return this.buildResponse(participant, "FLAGGED");
      }

      // Stage 8: Handle quota-full scenario (waitlist)
      if (!quotaAvailable) {
        const waitlistEntry = await this.waitlistService.addToWaitlist(
          tx,
          tenantId,
          eventId,
          participant,
        );
        return this.buildResponse(participant, "WAITLISTED", {
          waitlistPosition: waitlistEntry.position,
        });
      }

      // Stage 9: Enter workflow
      if (participant.status === "SUBMITTED") {
        await this.workflowService.enterWorkflow(tx, eventId, participant.id);
      }

      // Stage 10: Send confirmation email
      await this.notificationService.sendRegistrationConfirmation(participant);

      return this.buildResponse(participant, participant.status, {
        duplicateWarning:
          duplicateResult.highestScore >= 0.7
            ? {
                candidateId: duplicateResult.candidateId,
                confidenceScore: duplicateResult.highestScore,
                message: "A similar registration was found. An administrator will review.",
              }
            : undefined,
      });
    });
  }
}
```

**Flow Diagram:**

```
Public Registration Link
  │
  ▼
┌─────────────────┐
│ CAPTCHA Check    │──── Fail → 403 Forbidden
└────────┬────────┘
         │ Pass
┌────────▼────────┐
│ Rate Limit Check │──── Exceeded → 429 Too Many Requests
└────────┬────────┘
         │ OK
┌────────▼────────┐
│ Form Render      │◀─── FormTemplate from Module 03
│ (Dynamic fields) │
└────────┬────────┘
         │ Submit
┌────────▼────────┐
│ Schema Validate  │──── Invalid → 400 with per-field errors
└────────┬────────┘
         │ Valid
┌────────▼────────┐
│ Duplicate Check  │──── Score >= 0.90 → FLAGGED (admin review)
│ (Fuzzy + Exact)  │──── Score 0.70-0.89 → Warning (proceed)
└────────┬────────┘
         │
┌────────▼────────┐
│ Blacklist Screen │──── Match found → FLAGGED (admin alert)
└────────┬────────┘
         │ Clear
┌────────▼────────┐
│ Quota Check      │──── Full → WAITLISTED (enter queue)
└────────┬────────┘
         │ Available
┌────────▼────────┐
│ Workflow Entry   │──── Participant enters Step 1
│ (Module 04)      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Confirmation     │──── Email + SMS via Module 14
│ Notification     │
└─────────────────┘
```

### 5.6 Focal Point Registration Flow

The focal point registration flow handles delegation-based registrations where a focal point registers participants on behalf of their organization.

```typescript
class FocalPointRegistrationService {
  async registerParticipant(
    tenantId: string,
    eventId: string,
    delegationId: string,
    userId: string,
    request: FocalPointRegistrationRequest,
  ): Promise<FocalPointRegistrationResponse> {
    // Stage 1: Verify focal point authorization
    const delegation = await this.db.delegation.findUnique({
      where: { id: delegationId },
      include: { quotaAllocations: true },
    });

    if (!delegation) {
      throw new NotFoundError("Delegation not found");
    }

    if (delegation.focalPointId !== userId && delegation.secondaryFocalId !== userId) {
      throw new ForbiddenError("Not authorized as focal point for this delegation");
    }

    if (delegation.status !== "ACTIVE") {
      throw new UnprocessableError(`Delegation is ${delegation.status.toLowerCase()}`);
    }

    // Stage 2: Quota check with optimistic locking
    const quota = delegation.quotaAllocations.find(
      (q) => q.participantTypeId === request.participantTypeId,
    );

    if (!quota) {
      throw new ValidationError("Invalid participant type for this delegation");
    }

    const remaining = quota.allocatedQuota - quota.usedQuota - quota.pendingQuota;
    if (remaining <= 0) {
      throw new ConflictError(
        "Quota full for this participant type. Request an increase or choose another type.",
      );
    }

    return await this.db.$transaction(async (tx) => {
      // Stage 3: Increment pending quota (optimistic lock)
      const updated = await tx.delegationQuota.updateMany({
        where: {
          id: quota.id,
          pendingQuota: quota.pendingQuota, // Optimistic lock
        },
        data: {
          pendingQuota: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new ConflictError("Quota was modified concurrently. Please retry.");
      }

      // Stage 4: Create participant with delegation link
      const participant = await tx.participant.create({
        data: {
          tenantId,
          eventId,
          delegationId,
          participantType: request.participantTypeId,
          status: "SUBMITTED",
          formData: request.data,
          registrationSource: "FOCAL_POINT",
          registeredBy: userId,
          registrationCode: await this.generateRegistrationCode(eventId),
        },
      });

      // Stage 5: Run through shared pipeline (duplicate + blacklist)
      await this.registrationPipeline.processParticipant(tx, tenantId, eventId, participant);

      // Stage 6: Enter workflow
      if (participant.status === "SUBMITTED") {
        await this.workflowService.enterWorkflow(tx, eventId, participant.id);
      }

      // Stage 7: Return response with updated quota info
      const updatedQuota = await tx.delegationQuota.findUnique({
        where: { id: quota.id },
      });

      return {
        id: participant.id,
        participantId: participant.id,
        registrationCode: participant.registrationCode,
        status: participant.status,
        quota: {
          participantType: request.participantTypeId,
          allocated: updatedQuota!.allocatedQuota,
          used: updatedQuota!.usedQuota,
          pending: updatedQuota!.pendingQuota,
          remaining:
            updatedQuota!.allocatedQuota - updatedQuota!.usedQuota - updatedQuota!.pendingQuota,
        },
        createdAt: participant.createdAt.toISOString(),
      };
    });
  }
}
```

### 5.7 Bulk Import Pipeline

The bulk import pipeline processes CSV/Excel files through a staged pipeline with validation, preview, and batch execution.

**CSV Import Flow:**

```
Admin opens Bulk Operations → [Import Participants]
  → Step 1: Upload
    - Drag & drop CSV file (max 10MB, UTF-8)
    - System detects delimiter (comma, semicolon, tab)
    - Column mapping screen: map CSV columns to participant fields
      CSV Column          →  System Field
      "Full Name"         →  participant.name
      "Email"             →  participant.email
      "Passport No."      →  participant.passportNumber
      "Country"           →  participant.country
      "Type"              →  participant.participantType
      (unmapped columns stored in customData)

  → Step 2: Validation
    - BulkOperation created (status: VALIDATING)
    - For each row:
      - Required fields present?
      - Email format valid?
      - Country exists in system?
      - Participant type valid for event?
      - Duplicate check against existing participants (passport, email)
    - Results: "847 valid rows, 12 warnings, 3 errors"
    - Errors shown with row number and field: "Row 42: Invalid email format"
    - BulkOperation.status → PREVIEW

  → Step 3: Preview
    - Show first 20 rows as they would be imported
    - Summary: "847 new participants, 0 duplicates, 3 skipped (errors)"
    - [Confirm Import] or [Cancel]

  → Step 4: Execution
    - BulkOperation.status → PROCESSING
    - Worker processes rows in batches of 50
    - Each participant created → enters workflow Step 1
    - Progress streamed via SSE: "Processing... 247/847 (29%)"
    - BulkOperation.status → COMPLETED
    - Undo available for 24 hours (undoDeadline set)

  → Undo (within 24 hours):
    - Admin clicks [Undo Operation]
    - System reads snapshotData → deletes all created participants
    - BulkOperation.status → ROLLED_BACK
```

**Bulk Import Worker Implementation:**

```typescript
class BulkImportWorker {
  private readonly BATCH_SIZE = 50;

  async processImport(operationId: string): Promise<void> {
    const operation = await this.db.bulkOperation.findUniqueOrThrow({
      where: { id: operationId },
      include: { items: { where: { status: "PENDING" }, orderBy: { rowNumber: "asc" } } },
    });

    await this.db.bulkOperation.update({
      where: { id: operationId },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    const batches = this.chunkArray(operation.items, this.BATCH_SIZE);
    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(async (item) => {
          try {
            await this.db.$transaction(async (tx) => {
              // Parse row data
              const participantData = this.mapRowToParticipant(
                item.inputData as Record<string, unknown>,
                operation.tenantId,
                operation.eventId,
              );

              // Duplicate detection per row
              const dupResult = await this.duplicateDetector.check(
                operation.tenantId,
                operation.eventId,
                participantData,
              );

              if (dupResult.highestScore >= 0.9) {
                // Skip row, mark as duplicate
                await tx.bulkOperationItem.update({
                  where: { id: item.id },
                  data: {
                    status: "SKIPPED",
                    errorMessage: `Duplicate detected (${(dupResult.highestScore * 100).toFixed(0)}% match with ${dupResult.matchedParticipantId})`,
                    processedAt: new Date(),
                  },
                });
                failureCount++;
                return;
              }

              // Blacklist screening per row
              const blacklistResult = await this.blacklistScreener.screen(
                operation.tenantId,
                participantData,
              );

              // Create participant
              const participant = await tx.participant.create({
                data: {
                  ...participantData,
                  status: blacklistResult.matches.length > 0 ? "FLAGGED" : "SUBMITTED",
                  registrationSource: "BULK_IMPORT",
                  registrationCode: await this.generateRegistrationCode(operation.eventId),
                },
              });

              // Capture snapshot for undo
              await tx.bulkOperationItem.update({
                where: { id: item.id },
                data: {
                  status: "SUCCESS",
                  participantId: participant.id,
                  previousState: null, // New record, undo = delete
                  processedAt: new Date(),
                },
              });

              // Enter workflow if not flagged
              if (participant.status === "SUBMITTED") {
                await this.workflowService.enterWorkflow(tx, operation.eventId, participant.id);
              }

              successCount++;
            });
          } catch (error) {
            await this.db.bulkOperationItem.update({
              where: { id: item.id },
              data: {
                status: "FAILED",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                processedAt: new Date(),
              },
            });
            failureCount++;
          }
        }),
      );

      processedCount += batch.length;

      // Update progress
      await this.db.bulkOperation.update({
        where: { id: operationId },
        data: { processedItems: processedCount, successCount, failureCount },
      });

      // Emit SSE progress event
      this.sseEmitter.emit(`bulk-operation:${operationId}`, {
        processedItems: processedCount,
        totalItems: operation.totalItems,
        successCount,
        failureCount,
        percentComplete: Math.round((processedCount / operation.totalItems) * 100),
      });
    }

    // Mark operation as completed
    await this.db.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: failureCount === operation.totalItems ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
        undoDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

**Bulk Status Change Flow:**

```
Admin opens Bulk Operations → [Status Change]
  → Filter participants:
    - Participant type: [Support Staff]
    - Current status: [Pending at Step 2]
    - Country: [All]
  → Preview: "234 participants match these filters"
  → Action: [Approve All] / [Reject All] / [Move to Step X]
  → Confirmation: "This will approve 234 Support Staff currently at Step 2. Continue?"
  → Execute:
    - Snapshot current state of all 234 participants
    - Process in batches: move each through workflow
    - Create Approval records for audit trail
    - Progress: "Approved 89/234..."
    - Complete: "234 participants approved. Undo available for 24 hours."
```

**Bulk Operations Integration Points:**

| System              | Integration                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| Workflow Engine     | Imported participants auto-enter workflow; bulk approvals create Approval records |
| Delegation Portal   | Bulk import can specify delegation codes; quota counts updated                    |
| Duplicate Detection | Every import row checked against duplicate detection engine                       |
| Analytics           | Operation completion rates and import volumes feed into dashboard                 |
| Communication Hub   | Bulk operations can trigger batch notifications                                   |
| Audit Trail         | All bulk operations logged with full undo snapshots                               |

### 5.8 Duplicate Detection Algorithm

The duplicate detection engine uses multi-field scoring to identify candidates. It runs automatically on every registration submission and can also be triggered manually by administrators.

**Algorithm Detail:**

```
On participant registration submission:

  → Step 1: Exact match checks (confidence = 1.0)
    - Passport number exact match → 1.0
    - Email exact match → 0.95

  → Step 2: Fuzzy match checks
    - Name similarity (Levenshtein distance <= 2):
      "Mohammed Hassan" vs "Muhammad Hassan" → 0.85
      Transliteration handling: Arabic → Latin variations stored in lookup table
    - Name + Date of Birth match → 0.90
    - Name + Country match → 0.70
    - Phone number match (normalized, strip country code) → 0.80

  → Step 3: Cross-field scoring
    confidenceScore = max(individual field scores)
    If multiple fields match: boost score by 0.05 per additional match
    Example: name (0.85) + country (0.70) → combined score: 0.90

  → Step 4: Threshold decision
    - Score >= 0.90 → Auto-flag: registration held, DuplicateCandidate created (PENDING_REVIEW)
    - Score 0.70 - 0.89 → Warning flag: registration proceeds but admin notified
    - Score < 0.70 → No action

  → Cross-event detection:
    - After within-event check, run same algorithm against participants
      from all concurrent events for the same tenant
    - "Same passport number registered for Summit AND Youth Forum"
```

**Implementation:**

```typescript
interface DuplicateCheckResult {
  highestScore: number;
  matchedParticipantId: string | null;
  candidateId: string | null;
  matchFields: Record<string, number>;
  allMatches: {
    participantId: string;
    score: number;
    fields: Record<string, number>;
  }[];
}

class DuplicateDetectionEngine {
  private readonly AUTO_FLAG_THRESHOLD = 0.9;
  private readonly WARNING_THRESHOLD = 0.7;
  private readonly MULTI_FIELD_BOOST = 0.05;

  async check(
    tenantId: string,
    eventId: string,
    participant: {
      name: string;
      passportNumber?: string;
      email?: string;
      dateOfBirth?: Date;
      country?: string;
      phone?: string;
    },
  ): Promise<DuplicateCheckResult> {
    const allMatches: DuplicateCheckResult["allMatches"] = [];

    // Stage 1: Exact passport match
    if (participant.passportNumber) {
      const passportMatches = await this.db.participant.findMany({
        where: {
          tenantId,
          eventId,
          passportNumber: participant.passportNumber,
          status: { notIn: ["REJECTED", "WITHDRAWN", "REPLACED"] },
        },
      });

      for (const match of passportMatches) {
        this.addOrUpdateMatch(allMatches, match.id, "passport", 1.0);
      }
    }

    // Stage 2: Exact email match
    if (participant.email) {
      const emailMatches = await this.db.participant.findMany({
        where: {
          tenantId,
          eventId,
          email: participant.email.toLowerCase(),
          status: { notIn: ["REJECTED", "WITHDRAWN", "REPLACED"] },
        },
      });

      for (const match of emailMatches) {
        this.addOrUpdateMatch(allMatches, match.id, "email", 0.95);
      }
    }

    // Stage 3: Fuzzy name matching
    const nameCandidates = await this.findNameCandidates(tenantId, eventId, participant.name);
    for (const candidate of nameCandidates) {
      const nameScore = this.calculateNameSimilarity(participant.name, candidate.name);
      if (nameScore >= this.WARNING_THRESHOLD) {
        this.addOrUpdateMatch(allMatches, candidate.id, "name", nameScore);
      }
    }

    // Stage 4: Cross-field scoring with boost
    for (const match of allMatches) {
      const fieldCount = Object.keys(match.fields).length;
      if (fieldCount > 1) {
        const boost = (fieldCount - 1) * this.MULTI_FIELD_BOOST;
        match.score = Math.min(1.0, match.score + boost);
      }
    }

    // Sort by score descending
    allMatches.sort((a, b) => b.score - a.score);

    const topMatch = allMatches[0];
    return {
      highestScore: topMatch?.score ?? 0,
      matchedParticipantId: topMatch?.participantId ?? null,
      candidateId: null,
      matchFields: topMatch?.fields ?? {},
      allMatches,
    };
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalized1 = this.normalizeName(name1);
    const normalized2 = this.normalizeName(name2);

    // Levenshtein distance
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    const levenshteinScore = maxLen > 0 ? 1 - distance / maxLen : 1;

    // Soundex comparison
    const soundex1 = this.soundex(normalized1);
    const soundex2 = this.soundex(normalized2);
    const soundexMatch = soundex1 === soundex2 ? 0.8 : 0;

    // Metaphone comparison
    const metaphone1 = this.doubleMetaphone(normalized1);
    const metaphone2 = this.doubleMetaphone(normalized2);
    const metaphoneMatch =
      metaphone1.primary === metaphone2.primary || metaphone1.alternate === metaphone2.alternate
        ? 0.82
        : 0;

    // Return highest score from all methods
    return Math.max(levenshteinScore, soundexMatch, metaphoneMatch);
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\b(mr|mrs|ms|dr|prof|h\.e\.|amb|hon)\b/g, ""); // Remove titles
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }

    return dp[m][n];
  }

  private soundex(name: string): string {
    const chars = name.toUpperCase().split("");
    const first = chars[0];
    const codes: Record<string, string> = {
      B: "1",
      F: "1",
      P: "1",
      V: "1",
      C: "2",
      G: "2",
      J: "2",
      K: "2",
      Q: "2",
      S: "2",
      X: "2",
      Z: "2",
      D: "3",
      T: "3",
      L: "4",
      M: "5",
      N: "5",
      R: "6",
    };

    const coded = chars
      .slice(1)
      .map((c) => codes[c] || "0")
      .filter((c) => c !== "0");

    // Remove adjacent duplicates
    const deduped = coded.filter((c, i) => i === 0 || c !== coded[i - 1]);

    return (first + deduped.join("")).padEnd(4, "0").slice(0, 4);
  }

  private doubleMetaphone(name: string): { primary: string; alternate: string } {
    // Simplified double metaphone implementation
    // In production, use a library like 'natural' or 'double-metaphone'
    const primary = this.soundex(name); // Fallback to soundex for brevity
    return { primary, alternate: primary };
  }

  private async findNameCandidates(
    tenantId: string,
    eventId: string,
    name: string,
  ): Promise<{ id: string; name: string }[]> {
    // Use trigram similarity for initial candidate selection
    // This leverages PostgreSQL pg_trgm extension for fast fuzzy lookup
    return await this.db.$queryRaw`
      SELECT id, name
      FROM "Participant"
      WHERE "tenantId" = ${tenantId}
        AND "eventId" = ${eventId}
        AND status NOT IN ('REJECTED', 'WITHDRAWN', 'REPLACED')
        AND similarity(name, ${name}) > 0.3
      ORDER BY similarity(name, ${name}) DESC
      LIMIT 20
    `;
  }

  private addOrUpdateMatch(
    matches: DuplicateCheckResult["allMatches"],
    participantId: string,
    field: string,
    score: number,
  ): void {
    const existing = matches.find((m) => m.participantId === participantId);
    if (existing) {
      existing.fields[field] = score;
      existing.score = Math.max(existing.score, score);
    } else {
      matches.push({
        participantId,
        score,
        fields: { [field]: score },
      });
    }
  }
}
```

**Merge Flow:**

```
Admin clicks [Merge A <- B] (A survives, B is absorbed):
  → Field resolution dialog:
    For each field where A and B differ:
      Name:  (*) Mohammed Hassan [A]  ( ) Muhammad Hassan [B]
      Email: ( ) m.hassan@gov.eg [A]  (*) mhassan@gmail.com [B]
      Photo: (*) [A's photo]          ( ) [B's photo]

  → Execute merge:
    1. Update surviving record (A) with resolved field values
    2. Move all Approval records from B → A
    3. Move all AccessLog records from B → A
    4. Move all document uploads from B → A
    5. Update DelegationQuota.usedQuota (decrement for B's delegation)
    6. Create MergeHistory record for audit trail
    7. Soft-delete participant B (retain for audit, exclude from queries)
    8. DuplicateCandidate.status → MERGED
```

**Duplicate Review Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Duplicate Review                            12 pending reviews │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Potential Duplicate (Confidence: 92%)                           │
│  ┌──────────────────────────┬──────────────────────────┐        │
│  │ PARTICIPANT A            │ PARTICIPANT B             │        │
│  ├──────────────────────────┼──────────────────────────┤        │
│  │ Name: Mohammed Hassan    │ Name: Muhammad Hassan     │        │
│  │ Passport: AB1234567    = │ Passport: AB1234567    =  │        │
│  │ Email: m.hassan@gov.eg   │ Email: mhassan@gmail.com  │        │
│  │ Country: Egypt         = │ Country: Egypt          = │        │
│  │ DOB: 1975-03-15       = │ DOB: 1975-03-15        = │        │
│  │ Type: Delegate           │ Type: Delegate            │        │
│  │ Status: Approved (Step4) │ Status: Pending (Step 1)  │        │
│  │ Registered by: Embassy   │ Registered by: Self       │        │
│  │ Photo: [thumbnail]       │ Photo: [thumbnail]        │        │
│  └──────────────────────────┴──────────────────────────┘        │
│                                                                  │
│  Match details: passport=100%, name=85%, DOB=100%, country=100% │
│                                                                  │
│  [Not Duplicate]  [Merge A <- B]  [Merge B <- A]  [Skip]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Duplicate Detection Integration Points:**

| System            | Integration                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| Registration      | Every registration triggers duplicate + blacklist check before workflow entry |
| Workflow Engine   | Flagged registrations held outside workflow until review                      |
| Bulk Operations   | CSV imports run batch duplicate + blacklist screening                         |
| Communication Hub | Notifications sent to admin on flags                                          |
| Delegation Portal | Duplicate within same delegation flagged to focal point                       |
| Audit Trail       | All merge operations and blacklist overrides logged                           |
| Analytics         | Duplicate rates and blacklist hit rates reported                              |

### 5.9 Blacklist Screening

The blacklist system screens every registration against security watchlists. It supports individual, organization, and country-level entries with fuzzy name matching and multiple name variations.

**Blacklist Screening Flow:**

```
On every participant registration:
  → Extract: name, passport number, email, organization, nationality
  → Query Blacklist table:
    1. Exact passport number match
    2. Exact email match
    3. Fuzzy name match against name + nameVariations
    4. Organization match
  → If any match found:
    - Registration is NOT entered into workflow
    - Status set to FLAGGED
    - Admin receives alert: "Registration matches blacklist entry #42"
    - Admin reviews:
      [Confirm Block] → registration rejected, participant notified
      [Override — Allow] → registration enters workflow, override logged with reason
```

**Blacklist Screening Implementation:**

```typescript
interface BlacklistScreeningResult {
  matches: {
    blacklistEntryId: string;
    matchType: "EXACT_PASSPORT" | "EXACT_EMAIL" | "FUZZY_NAME" | "ORGANIZATION" | "NATIONALITY";
    confidence: number;
    blacklistEntry: {
      type: string;
      name: string | null;
      reason: string;
      source: string | null;
    };
  }[];
  isBlocked: boolean;
}

class BlacklistScreeningService {
  async screen(
    tenantId: string,
    participant: {
      name: string;
      passportNumber?: string;
      email?: string;
      organization?: string;
      nationality?: string;
    },
  ): Promise<BlacklistScreeningResult> {
    const matches: BlacklistScreeningResult["matches"] = [];

    // Check 1: Exact passport match
    if (participant.passportNumber) {
      const passportMatches = await this.db.blacklist.findMany({
        where: {
          OR: [{ tenantId }, { tenantId: null }], // Tenant + global
          passportNumber: participant.passportNumber,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      for (const entry of passportMatches) {
        matches.push({
          blacklistEntryId: entry.id,
          matchType: "EXACT_PASSPORT",
          confidence: 1.0,
          blacklistEntry: {
            type: entry.type,
            name: entry.name,
            reason: entry.reason,
            source: entry.source,
          },
        });
      }
    }

    // Check 2: Exact email match
    if (participant.email) {
      const emailMatches = await this.db.blacklist.findMany({
        where: {
          OR: [{ tenantId }, { tenantId: null }],
          email: participant.email.toLowerCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      for (const entry of emailMatches) {
        matches.push({
          blacklistEntryId: entry.id,
          matchType: "EXACT_EMAIL",
          confidence: 0.95,
          blacklistEntry: {
            type: entry.type,
            name: entry.name,
            reason: entry.reason,
            source: entry.source,
          },
        });
      }
    }

    // Check 3: Fuzzy name match against name + nameVariations
    if (participant.name) {
      const nameEntries = await this.db.blacklist.findMany({
        where: {
          OR: [{ tenantId }, { tenantId: null }],
          isActive: true,
          type: "INDIVIDUAL",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: {
          id: true,
          name: true,
          nameVariations: true,
          type: true,
          reason: true,
          source: true,
        },
      });

      for (const entry of nameEntries) {
        const namesToCheck = [entry.name, ...entry.nameVariations].filter(Boolean) as string[];
        for (const blacklistName of namesToCheck) {
          const similarity = this.calculateNameSimilarity(participant.name, blacklistName);
          if (similarity >= 0.8) {
            matches.push({
              blacklistEntryId: entry.id,
              matchType: "FUZZY_NAME",
              confidence: similarity,
              blacklistEntry: {
                type: entry.type,
                name: entry.name,
                reason: entry.reason,
                source: entry.source,
              },
            });
            break; // One match per entry is sufficient
          }
        }
      }
    }

    // Check 4: Organization match
    if (participant.organization) {
      const orgMatches = await this.db.blacklist.findMany({
        where: {
          OR: [{ tenantId }, { tenantId: null }],
          type: "ORGANIZATION",
          organization: { contains: participant.organization, mode: "insensitive" },
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      for (const entry of orgMatches) {
        matches.push({
          blacklistEntryId: entry.id,
          matchType: "ORGANIZATION",
          confidence: 0.85,
          blacklistEntry: {
            type: entry.type,
            name: entry.name,
            reason: entry.reason,
            source: entry.source,
          },
        });
      }
    }

    return {
      matches,
      isBlocked: matches.some((m) => m.confidence >= 0.8),
    };
  }

  /**
   * Periodic re-scan of all active participants against the blacklist.
   * Triggered when new blacklist entries are added or on a schedule.
   */
  async rescanParticipants(
    tenantId: string,
    eventId: string,
  ): Promise<{
    scanned: number;
    newFlags: number;
  }> {
    const participants = await this.db.participant.findMany({
      where: {
        tenantId,
        eventId,
        status: { notIn: ["REJECTED", "WITHDRAWN", "REPLACED", "FLAGGED"] },
      },
    });

    let newFlags = 0;

    for (const participant of participants) {
      const result = await this.screen(tenantId, {
        name: participant.name,
        passportNumber: participant.passportNumber ?? undefined,
        email: participant.email ?? undefined,
        organization: participant.organization ?? undefined,
        nationality: participant.nationality ?? undefined,
      });

      if (result.isBlocked) {
        await this.db.participant.update({
          where: { id: participant.id },
          data: { status: "FLAGGED" },
        });
        await this.notificationService.notifyAdmins(eventId, {
          type: "BLACKLIST_RESCAN_HIT",
          participantId: participant.id,
          matches: result.matches,
        });
        newFlags++;
      }
    }

    return { scanned: participants.length, newFlags };
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return 1;
    const distance = this.levenshteinDistance(n1, n2);
    return 1 - distance / maxLen;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (s1[i - 1] === s2[j - 1] ? 0 : 1),
        );
      }
    }
    return dp[m][n];
  }
}
```

### 5.10 Waitlist Prioritization Algorithm

When registration quotas fill up, the system captures overflow demand in a priority-based waitlist. The waitlist maintains fair ordering and automatically promotes candidates when slots open.

**Auto-Waitlist Trigger Flow:**

```
Participant submits registration form
  -> System checks InvitationConstraint for this participantType + eventId:
     currentCount = COUNT(Participant WHERE eventId AND participantType AND status != REJECTED)
     quota = InvitationConstraint.maxParticipants

  -> If currentCount < quota:
     -> Normal flow: create Participant, enter workflow at step 1
     -> No waitlist involved

  -> If currentCount >= quota:
     -> Create Participant record with status = WAITLISTED
     -> Determine priority:
        - Check participantType against priority mapping (configured per event)
        - VIP types (Head of State, Minister) -> WaitlistPriority.VIP
        - Returning delegations -> WaitlistPriority.HIGH
        - All others -> WaitlistPriority.STANDARD
     -> Calculate position:
        - Within the same priority tier, position = MAX(position) + 1
        - VIP position 1 is ahead of HIGH position 1, which is ahead of STANDARD position 1
     -> Create WaitlistEntry with registrationData snapshot
     -> Send notification via Communication Hub:
        "Your registration for [event] has been waitlisted.
         Your position: #3 (VIP priority)
         We will notify you immediately if a slot becomes available."
     -> Display confirmation page with queue position
```

**Auto-Promotion Flow:**

```
Slot becomes available (one of):
  a) Registered participant cancels their registration
  b) Participant is rejected by a validator
  c) Admin manually increases quota for this participantType
  d) Admin manually promotes a specific waitlist entry

  -> System identifies the trigger:
     For (a) or (b): the departing participant's type determines which waitlist to check
     For (c): recheck all ACTIVE entries for this type
     For (d): skip queue logic, promote specified entry

  -> Query next eligible entry:
     SELECT * FROM WaitlistEntry
     WHERE eventId = :eventId
       AND participantType = :type
       AND status = 'ACTIVE'
     ORDER BY
       CASE priority
         WHEN 'VIP' THEN 0
         WHEN 'HIGH' THEN 1
         WHEN 'STANDARD' THEN 2
       END,
       position ASC
     LIMIT 1

  -> If entry found:
     -> Create WaitlistPromotion record
     -> Set WaitlistEntry.status = PROMOTED, promotedAt = now()
     -> Set promotionDeadline = now() + 48 hours (configurable)
     -> Restore Participant from registrationData snapshot:
        - Update Participant.status from WAITLISTED to first workflow step
        - Enter the event workflow pipeline
     -> Send urgent notification:
        "A slot has opened for [event]! You have been promoted from the waitlist.
         Please confirm your registration by [deadline].
         [Confirm Registration] [Withdraw]"

  -> Deadline monitoring (background job, runs every 15 minutes):
     -> Query WaitlistEntry WHERE status = PROMOTED
       AND promotionDeadline < now() AND confirmedAt IS NULL
     -> For each expired promotion:
        -> Set WaitlistEntry.status = EXPIRED
        -> Remove participant from workflow
        -> Trigger auto-promotion for the next person in queue
        -> Notify expired participant: "Your waitlist offer has expired"

  -> Recalculate positions after any change:
     -> All remaining ACTIVE entries in the affected priority tier
       get their position recalculated to close gaps
     -> Notify affected participants if their position changed significantly
```

**Waitlist Service Implementation:**

```typescript
class WaitlistService {
  async addToWaitlist(
    tx: PrismaTransactionClient,
    tenantId: string,
    eventId: string,
    participant: Participant,
  ): Promise<WaitlistEntry> {
    // Determine priority
    const priority = await this.determinePriority(eventId, participant);

    // Calculate position within priority tier
    const maxPosition = await tx.waitlistEntry.aggregate({
      where: {
        eventId,
        participantType: participant.participantType,
        priority,
        status: "ACTIVE",
      },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? 0) + 1;

    const entry = await tx.waitlistEntry.create({
      data: {
        tenantId,
        eventId,
        participantId: participant.id,
        participantType: participant.participantType,
        priority,
        position,
        status: "ACTIVE",
        registrationData: participant.formData as object,
      },
    });

    // Send waitlist notification
    await this.notificationService.sendWaitlistConfirmation(participant, entry);

    return entry;
  }

  async promoteNext(
    eventId: string,
    participantType: string,
    triggeredBy: string,
    triggerEntityId?: string,
  ): Promise<WaitlistEntry | null> {
    return await this.db.$transaction(async (tx) => {
      // Find next eligible entry (priority-ordered)
      const nextEntry = await tx.waitlistEntry.findFirst({
        where: {
          eventId,
          participantType,
          status: "ACTIVE",
        },
        orderBy: [
          {
            priority: "asc", // VIP (0) < HIGH (1) < STANDARD (2)
          },
          { position: "asc" },
        ],
      });

      if (!nextEntry) return null;

      // Calculate promotion deadline
      const config = await this.getWaitlistConfig(eventId);
      const deadline = new Date(Date.now() + config.promotionDeadlineHours * 60 * 60 * 1000);

      // Update waitlist entry
      await tx.waitlistEntry.update({
        where: { id: nextEntry.id },
        data: {
          status: "PROMOTED",
          promotedAt: new Date(),
          promotionDeadline: deadline,
        },
      });

      // Create promotion record
      await tx.waitlistPromotion.create({
        data: {
          waitlistEntryId: nextEntry.id,
          triggeredBy,
          triggerEntityId,
          slotAvailableAt: new Date(),
        },
      });

      // Restore participant to active status
      await tx.participant.update({
        where: { id: nextEntry.participantId },
        data: { status: "SUBMITTED" },
      });

      // Enter workflow
      await this.workflowService.enterWorkflow(tx, eventId, nextEntry.participantId);

      // Send promotion notification
      const participant = await tx.participant.findUniqueOrThrow({
        where: { id: nextEntry.participantId },
      });
      await this.notificationService.sendPromotionNotification(participant, deadline);

      // Recalculate positions for remaining entries
      await this.recalculatePositions(tx, eventId, participantType, nextEntry.priority);

      return nextEntry;
    });
  }

  /**
   * Background job: check for expired promotions every 15 minutes
   */
  async checkExpiredPromotions(): Promise<void> {
    const expired = await this.db.waitlistEntry.findMany({
      where: {
        status: "PROMOTED",
        promotionDeadline: { lt: new Date() },
      },
      include: { promotions: true },
    });

    for (const entry of expired) {
      await this.db.$transaction(async (tx) => {
        // Expire the entry
        await tx.waitlistEntry.update({
          where: { id: entry.id },
          data: { status: "EXPIRED", expiredAt: new Date() },
        });

        // Update promotion record
        const latestPromotion = entry.promotions[entry.promotions.length - 1];
        if (latestPromotion) {
          await tx.waitlistPromotion.update({
            where: { id: latestPromotion.id },
            data: { declinedAt: new Date() },
          });
        }

        // Remove participant from workflow
        await tx.participant.update({
          where: { id: entry.participantId },
          data: { status: "WAITLISTED" },
        });

        // Notify expired participant
        const participant = await tx.participant.findUniqueOrThrow({
          where: { id: entry.participantId },
        });
        await this.notificationService.sendPromotionExpired(participant);

        // Auto-promote next in line
        await this.promoteNext(
          entry.eventId,
          entry.participantType,
          "expiration",
          entry.participantId,
        );
      });
    }
  }

  private async recalculatePositions(
    tx: PrismaTransactionClient,
    eventId: string,
    participantType: string,
    priority: WaitlistPriority,
  ): Promise<void> {
    const activeEntries = await tx.waitlistEntry.findMany({
      where: {
        eventId,
        participantType,
        priority,
        status: "ACTIVE",
      },
      orderBy: { position: "asc" },
    });

    for (let i = 0; i < activeEntries.length; i++) {
      if (activeEntries[i].position !== i + 1) {
        await tx.waitlistEntry.update({
          where: { id: activeEntries[i].id },
          data: { position: i + 1 },
        });
      }
    }
  }

  private async determinePriority(
    eventId: string,
    participant: Participant,
  ): Promise<WaitlistPriority> {
    const config = await this.getWaitlistConfig(eventId);
    const vipTypes = config.vipParticipantTypes ?? ["HEAD_OF_STATE", "MINISTER"];
    const highTypes = config.highPriorityTypes ?? ["AMBASSADOR", "SENIOR_OFFICIAL"];

    if (vipTypes.includes(participant.participantType)) {
      return "VIP";
    }
    if (highTypes.includes(participant.participantType)) {
      return "HIGH";
    }
    return "STANDARD";
  }

  private async getWaitlistConfig(eventId: string) {
    return {
      promotionDeadlineHours: 48,
      vipParticipantTypes: ["HEAD_OF_STATE", "MINISTER"],
      highPriorityTypes: ["AMBASSADOR", "SENIOR_OFFICIAL"],
      autoPromoteEnabled: true,
      positionNotificationThreshold: 3,
    };
  }
}
```

### 5.11 Registration State Machine

The registration state machine governs all valid transitions for a participant throughout the accreditation lifecycle.

```typescript
interface StateTransition {
  from: ParticipantStatus;
  to: ParticipantStatus;
  trigger: string;
  conditions: string[];
  sideEffects: string[];
}

const REGISTRATION_STATE_MACHINE: StateTransition[] = [
  // Draft → Submitted
  {
    from: "DRAFT",
    to: "SUBMITTED",
    trigger: "participant_submits_form",
    conditions: ["All required fields populated", "Form validation passes"],
    sideEffects: [
      "Trigger duplicate detection",
      "Trigger blacklist screening",
      "Enter workflow if clear",
    ],
  },

  // Submitted → In Review
  {
    from: "SUBMITTED",
    to: "IN_REVIEW",
    trigger: "validator_picks_up_registration",
    conditions: ["Participant is at current workflow step", "Validator has permission"],
    sideEffects: ["Lock registration from other validators", "Start review timer"],
  },

  // In Review → Approved
  {
    from: "IN_REVIEW",
    to: "APPROVED",
    trigger: "validator_approves",
    conditions: ["All required documents uploaded", "Validator has approval permission"],
    sideEffects: [
      "Create Approval record",
      "DelegationQuota: decrement pendingQuota, increment usedQuota",
      "Send approval notification to participant",
      "Trigger badge generation readiness check",
    ],
  },

  // In Review → Rejected
  {
    from: "IN_REVIEW",
    to: "REJECTED",
    trigger: "validator_rejects",
    conditions: ["Rejection reason provided", "Validator has rejection permission"],
    sideEffects: [
      "Create Approval record (rejection)",
      "DelegationQuota: decrement pendingQuota",
      "Send rejection notification to participant",
      "Trigger waitlist auto-promotion for this participant type",
    ],
  },

  // In Review → Returned
  {
    from: "IN_REVIEW",
    to: "RETURNED",
    trigger: "validator_requests_more_info",
    conditions: ["Return reason and required actions specified"],
    sideEffects: [
      "Create return note on registration",
      "Send notification to participant with required actions",
      "Set deadline for participant response",
    ],
  },

  // Returned → Submitted
  {
    from: "RETURNED",
    to: "SUBMITTED",
    trigger: "participant_resubmits",
    conditions: ["Required information/documents provided"],
    sideEffects: ["Re-enter workflow at the step that returned it"],
  },

  // Approved → Printed
  {
    from: "APPROVED",
    to: "PRINTED",
    trigger: "badge_printed",
    conditions: ["Badge template rendered", "Print job completed"],
    sideEffects: ["Log print event", "Badge serial number recorded"],
  },

  // Printed → Collected
  {
    from: "PRINTED",
    to: "COLLECTED",
    trigger: "badge_collected_at_desk",
    conditions: ["Identity verified at collection point", "Photo match confirmed"],
    sideEffects: ["Log collection event with timestamp", "Mark participant as checked-in ready"],
  },

  // Submitted → Waitlisted
  {
    from: "SUBMITTED",
    to: "WAITLISTED",
    trigger: "quota_exceeded",
    conditions: ["Quota full for participant type"],
    sideEffects: ["Create WaitlistEntry", "Send waitlist notification", "Record queue position"],
  },

  // Waitlisted → Submitted
  {
    from: "WAITLISTED",
    to: "SUBMITTED",
    trigger: "promoted_from_waitlist",
    conditions: ["Slot available", "Participant confirmed promotion"],
    sideEffects: [
      "Update WaitlistEntry status to PROMOTED",
      "Enter workflow at Step 1",
      "Recalculate waitlist positions",
    ],
  },

  // Any → Flagged (blacklist/duplicate)
  {
    from: "SUBMITTED",
    to: "FLAGGED",
    trigger: "blacklist_or_duplicate_match",
    conditions: ["Blacklist match confidence >= threshold OR duplicate score >= 0.90"],
    sideEffects: ["Do NOT enter workflow", "Alert admin", "Create review queue entry"],
  },

  // Flagged → Submitted (override)
  {
    from: "FLAGGED",
    to: "SUBMITTED",
    trigger: "admin_override_allow",
    conditions: ["Admin provides override reason", "Admin has override permission"],
    sideEffects: ["Log override with reason", "Enter workflow at Step 1"],
  },

  // Flagged → Rejected (confirm block)
  {
    from: "FLAGGED",
    to: "REJECTED",
    trigger: "admin_confirm_block",
    conditions: ["Admin confirms blacklist/duplicate block"],
    sideEffects: ["Send rejection notification", "Log block confirmation"],
  },

  // Approved → Withdrawn
  {
    from: "APPROVED",
    to: "WITHDRAWN",
    trigger: "participant_withdraws",
    conditions: ["Withdrawal request submitted"],
    sideEffects: [
      "DelegationQuota: decrement usedQuota",
      "Trigger waitlist auto-promotion",
      "Cancel any pending logistics (accommodation, transport)",
    ],
  },

  // Approved → Replaced
  {
    from: "APPROVED",
    to: "REPLACED",
    trigger: "delegation_replacement_approved",
    conditions: ["Replacement request approved by admin"],
    sideEffects: [
      "ParticipantReplacement status → COMPLETED",
      "Notify focal point to register replacement",
      "DelegationQuota counts unchanged (swap)",
      "Revoke any issued badge",
    ],
  },
];

class RegistrationStateMachine {
  private transitions: Map<string, StateTransition[]>;

  constructor() {
    this.transitions = new Map();
    for (const t of REGISTRATION_STATE_MACHINE) {
      const key = t.from;
      const existing = this.transitions.get(key) ?? [];
      existing.push(t);
      this.transitions.set(key, existing);
    }
  }

  canTransition(from: ParticipantStatus, to: ParticipantStatus): boolean {
    const available = this.transitions.get(from) ?? [];
    return available.some((t) => t.to === to);
  }

  getAvailableTransitions(from: ParticipantStatus): StateTransition[] {
    return this.transitions.get(from) ?? [];
  }

  async executeTransition(
    participantId: string,
    to: ParticipantStatus,
    context: {
      userId: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    const participant = await this.db.participant.findUniqueOrThrow({
      where: { id: participantId },
    });

    const currentStatus = participant.status as ParticipantStatus;
    const transition = (this.transitions.get(currentStatus) ?? []).find((t) => t.to === to);

    if (!transition) {
      throw new ValidationError(
        `Invalid transition from ${currentStatus} to ${to}. ` +
          `Valid targets: ${this.getAvailableTransitions(currentStatus)
            .map((t) => t.to)
            .join(", ")}`,
      );
    }

    // Execute transition within a transaction
    await this.db.$transaction(async (tx) => {
      await tx.participant.update({
        where: { id: participantId },
        data: { status: to },
      });

      // Log state change
      await tx.auditLog.create({
        data: {
          entityType: "PARTICIPANT",
          entityId: participantId,
          action: `STATUS_CHANGE:${currentStatus}->${to}`,
          performedBy: context.userId,
          metadata: {
            trigger: transition.trigger,
            reason: context.reason,
            ...context.metadata,
          },
        },
      });

      // Execute side effects
      await this.executeSideEffects(tx, transition, participantId, context);
    });
  }

  private async executeSideEffects(
    tx: PrismaTransactionClient,
    transition: StateTransition,
    participantId: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    // Side effects are dispatched based on the transition
    // Each side effect is implemented as an independent handler
    for (const effect of transition.sideEffects) {
      await this.sideEffectRegistry.execute(effect, {
        tx,
        participantId,
        transition,
        context,
      });
    }
  }
}
```

### 5.12 Quota Enforcement Engine

The quota enforcement engine ensures that registration counts never exceed allocated quotas, even under concurrent access.

```typescript
class QuotaEnforcementEngine {
  /**
   * Check quota availability with optimistic locking for concurrent safety.
   * Supports two modes:
   *   - STRICT: Hard reject when quota is full
   *   - SOFT: Allow over-quota with warning (configurable per event)
   */
  async checkAndReserve(
    tx: PrismaTransactionClient,
    eventId: string,
    participantType: string,
    delegationId?: string,
  ): Promise<{ available: boolean; remaining: number; mode: "STRICT" | "SOFT" }> {
    const config = await this.getQuotaConfig(eventId);

    if (delegationId) {
      return this.checkDelegationQuota(tx, delegationId, participantType, config.mode);
    }

    return this.checkEventQuota(tx, eventId, participantType, config.mode);
  }

  private async checkDelegationQuota(
    tx: PrismaTransactionClient,
    delegationId: string,
    participantTypeId: string,
    mode: "STRICT" | "SOFT",
  ): Promise<{ available: boolean; remaining: number; mode: "STRICT" | "SOFT" }> {
    // Use SELECT FOR UPDATE to prevent concurrent over-allocation
    const quota = await tx.$queryRaw<DelegationQuota[]>`
      SELECT * FROM "DelegationQuota"
      WHERE "delegationId" = ${delegationId}
        AND "participantTypeId" = ${participantTypeId}
      FOR UPDATE
    `;

    if (quota.length === 0) {
      throw new ValidationError("No quota allocation found for this participant type");
    }

    const q = quota[0];
    const remaining = q.allocatedQuota - q.usedQuota - q.pendingQuota;

    if (remaining <= 0 && mode === "STRICT") {
      return { available: false, remaining: 0, mode };
    }

    // Reserve slot by incrementing pending
    await tx.delegationQuota.update({
      where: { id: q.id },
      data: { pendingQuota: { increment: 1 } },
    });

    return { available: true, remaining: remaining - 1, mode };
  }

  private async checkEventQuota(
    tx: PrismaTransactionClient,
    eventId: string,
    participantType: string,
    mode: "STRICT" | "SOFT",
  ): Promise<{ available: boolean; remaining: number; mode: "STRICT" | "SOFT" }> {
    // Count current registrations for this type
    const currentCount = await tx.participant.count({
      where: {
        eventId,
        participantType,
        status: { notIn: ["REJECTED", "WITHDRAWN", "REPLACED"] },
      },
    });

    // Get quota from InvitationConstraint
    const constraint = await tx.invitationConstraint.findFirst({
      where: { eventId, participantType },
    });

    if (!constraint) {
      // No quota constraint = unlimited
      return { available: true, remaining: Infinity, mode };
    }

    const remaining = constraint.maxParticipants - currentCount;

    if (remaining <= 0 && mode === "STRICT") {
      return { available: false, remaining: 0, mode };
    }

    return { available: remaining > 0, remaining: Math.max(0, remaining), mode };
  }

  /**
   * Called when a participant is approved: move from pending to used quota
   */
  async onParticipantApproved(tx: PrismaTransactionClient, participantId: string): Promise<void> {
    const participant = await tx.participant.findUniqueOrThrow({
      where: { id: participantId },
    });

    if (!participant.delegationId) return;

    await tx.delegationQuota.updateMany({
      where: {
        delegationId: participant.delegationId,
        participantTypeId: participant.participantType,
      },
      data: {
        pendingQuota: { decrement: 1 },
        usedQuota: { increment: 1 },
      },
    });
  }

  /**
   * Called when a participant is rejected: release pending quota
   */
  async onParticipantRejected(tx: PrismaTransactionClient, participantId: string): Promise<void> {
    const participant = await tx.participant.findUniqueOrThrow({
      where: { id: participantId },
    });

    if (!participant.delegationId) return;

    await tx.delegationQuota.updateMany({
      where: {
        delegationId: participant.delegationId,
        participantTypeId: participant.participantType,
      },
      data: {
        pendingQuota: { decrement: 1 },
      },
    });

    // Trigger waitlist promotion
    await this.waitlistService.promoteNext(
      participant.eventId,
      participant.participantType,
      "rejection",
      participantId,
    );
  }

  /**
   * Called when a quota change request is approved
   */
  async onQuotaChangeApproved(tx: PrismaTransactionClient, requestId: string): Promise<void> {
    const request = await tx.quotaChangeRequest.findUniqueOrThrow({
      where: { id: requestId },
    });

    await tx.delegationQuota.updateMany({
      where: {
        delegationId: request.delegationId,
        participantTypeId: request.participantTypeId,
      },
      data: {
        allocatedQuota: request.requestedQuota,
      },
    });

    // Check if waitlisted participants can now be promoted
    const delegation = await tx.delegation.findUniqueOrThrow({
      where: { id: request.delegationId },
    });

    await this.waitlistService.promoteNext(
      delegation.eventId,
      request.participantTypeId,
      "quota_increase",
      requestId,
    );
  }
}
```

---

## 6. User Interface

### 6.1 Delegation Portal Wireframe

The delegation portal is the primary interface for focal points to manage their delegation's registration process.

```
┌─────────────────────────────────────────────────────────────┐
│  Republic of Kenya — Delegation Portal                       │
│  38th AU Summit  |  Focal Point: Jane Wanjiku               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Quota Overview                                              │
│  ┌─────────────────────┬───────┬──────┬─────────┬─────────┐ │
│  │ Participant Type     │ Quota │ Used │ Pending │ Remain  │ │
│  ├─────────────────────┼───────┼──────┼─────────┼─────────┤ │
│  │ Head of State        │   1   │  1   │    0    │   0     │ │
│  │ Minister             │   5   │  3   │    1    │   1     │ │
│  │ Delegate             │  15   │  12  │    2    │   1     │ │
│  │ Support Staff        │  10   │   6  │    0    │   4     │ │
│  │ Security             │   8   │   8  │    0    │   0     │ │
│  └─────────────────────┴───────┴──────┴─────────┴─────────┘ │
│                                                              │
│  [+ Register Participant]  [Request Quota Increase]          │
│                                                              │
│  Participants (22 of 39 quota)                  [Filter]     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ H.E. William Ruto      │ Head of State │ Approved     │   │
│  │ Amb. Raychelle Omamo   │ Minister      │ Approved     │   │
│  │ Dr. Monica Juma        │ Minister      │ In Review    │   │
│  │ John Kamau             │ Delegate      │ Missing doc  │   │
│  │ Mary Njeri             │ Delegate      │ Pending      │   │
│  │ ...                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Quick Actions:                                              │
│  [Upload Documents]  [Replace Participant]  [Export List]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Public Registration Form Wireframe

The public registration form is rendered dynamically from a FormTemplate defined in Module 03.

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  38th African Union Summit                                   │
│  PARTICIPANT REGISTRATION                                    │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  Participant Type: [Delegate            v]                   │
│                                                              │
│  PERSONAL INFORMATION                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Title:     [Mr.  v]                                  │    │
│  │ First Name:  [________________________]  *           │    │
│  │ Last Name:   [________________________]  *           │    │
│  │ Date of Birth: [____ / ____ / ______]   *           │    │
│  │ Nationality:  [Select Country       v]  *           │    │
│  │ Gender:       ( ) Male  ( ) Female  ( ) Other       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  CONTACT INFORMATION                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Email:        [________________________]  *          │    │
│  │ Phone:        [+___] [________________]              │    │
│  │ Organization: [________________________]             │    │
│  │ Position:     [________________________]             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  TRAVEL DOCUMENT                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Passport Number: [________________________]  *       │    │
│  │ Passport Expiry: [____ / ____ / ______]  *          │    │
│  │                                                      │    │
│  │ Passport Scan:  [Choose File] or drag & drop         │    │
│  │  Accepted: PDF, JPG, PNG (max 5MB)                  │    │
│  │                                                      │    │
│  │ Photo (passport style):  [Choose File]              │    │
│  │  Requirements: 600x600px min, white background      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  INVITATION CODE (Optional)                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Code: [________________________]                     │    │
│  │ If you received an invitation code, enter it above   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [  I agree to the terms and conditions  ]                  │
│                                                              │
│  [        Submit Registration        ]                       │
│                                                              │
│  * Required fields                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Bulk Import Wizard Wireframe

The bulk import wizard guides administrators through a 4-step process.

```
┌─────────────────────────────────────────────────────────────────┐
│  Bulk Import Wizard                                              │
│  Step: [1. Upload] ── [2. Map] ── [3. Validate] ── [4. Execute] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STEP 1: UPLOAD FILE                                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                         │     │
│  │    ┌─────────────────────────────────────────────┐     │     │
│  │    │                                              │     │     │
│  │    │     Drag & drop your CSV or Excel file       │     │     │
│  │    │           or [Browse Files]                  │     │     │
│  │    │                                              │     │     │
│  │    │   Supported: .csv, .xlsx  (max 10MB, UTF-8) │     │     │
│  │    │                                              │     │     │
│  │    └─────────────────────────────────────────────┘     │     │
│  │                                                         │     │
│  │  File: AU_delegates.csv  (2.3 MB, 847 rows detected)  │     │
│  │  Delimiter: comma (auto-detected)                       │     │
│  │                                                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  [Cancel]                                        [Next: Map ->]  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STEP 2: COLUMN MAPPING                                          │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ CSV Column          →  System Field            Status  │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │ "Full Name"         →  [participant.name      v]  OK   │     │
│  │ "Email Address"     →  [participant.email     v]  OK   │     │
│  │ "Passport No."      →  [participant.passport  v]  OK   │     │
│  │ "Country"           →  [participant.country   v]  OK   │     │
│  │ "Category"          →  [participant.type      v]  OK   │     │
│  │ "Dietary Needs"     →  [-- Custom Field --    v]  NEW  │     │
│  │ "Internal Code"     →  [-- Skip Column --     v]  SKIP │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Default values:                                                  │
│  Delegation: [Republic of Kenya (KEN) v]                         │
│  If no participant type: [Delegate v]                            │
│                                                                   │
│  [<- Back]                                  [Next: Validate ->]  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STEP 3: VALIDATION RESULTS                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                         │     │
│  │  Summary:                                               │     │
│  │  [====================================____] 847 rows    │     │
│  │                                                         │     │
│  │  Valid:      832  (98.2%)                               │     │
│  │  Warnings:    12  (1.4%)  -- possible duplicates        │     │
│  │  Errors:       3  (0.4%)  -- will be skipped            │     │
│  │                                                         │     │
│  │  ERRORS (3)                                             │     │
│  │  ┌──────┬───────────────┬──────────────────────────┐   │     │
│  │  │ Row  │ Field         │ Error                     │   │     │
│  │  ├──────┼───────────────┼──────────────────────────┤   │     │
│  │  │ 42   │ Email         │ Invalid email format      │   │     │
│  │  │ 156  │ Country       │ "Wakanda" not found       │   │     │
│  │  │ 789  │ Passport      │ Required field empty      │   │     │
│  │  └──────┴───────────────┴──────────────────────────┘   │     │
│  │                                                         │     │
│  │  PREVIEW (first 5 of 832 valid rows)                    │     │
│  │  ┌─────────────────┬──────────────┬──────────┐         │     │
│  │  │ Name            │ Email        │ Type     │         │     │
│  │  ├─────────────────┼──────────────┼──────────┤         │     │
│  │  │ John Kamau      │ jk@gov.ke    │ Delegate │         │     │
│  │  │ Mary Njeri      │ mn@gov.ke    │ Delegate │         │     │
│  │  │ Peter Ochieng   │ po@gov.ke    │ Staff    │         │     │
│  │  │ ...             │ ...          │ ...      │         │     │
│  │  └─────────────────┴──────────────┴──────────┘         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  [<- Back]                                [Next: Execute ->]     │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STEP 4: EXECUTION                                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                         │     │
│  │  Importing 832 participants...                          │     │
│  │                                                         │     │
│  │  [================================________] 67%         │     │
│  │  557 / 832 processed                                    │     │
│  │                                                         │     │
│  │  Success: 549    Skipped: 5    Failed: 3                │     │
│  │                                                         │     │
│  │  Recent activity:                                       │     │
│  │  Row 554: John Doe imported successfully                │     │
│  │  Row 555: Jane Smith imported successfully              │     │
│  │  Row 556: SKIPPED - duplicate (92% match with #1234)   │     │
│  │  Row 557: Peter Jones imported successfully             │     │
│  │                                                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  (Undo will be available for 24 hours after completion)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Duplicate Resolution UI

The duplicate resolution UI provides a side-by-side comparison with merge controls for confirmed duplicates.

```
┌─────────────────────────────────────────────────────────────────┐
│  Duplicate Review                            12 pending reviews │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Potential Duplicate (Confidence: 92%)                           │
│  ┌──────────────────────────┬──────────────────────────┐        │
│  │ PARTICIPANT A            │ PARTICIPANT B             │        │
│  ├──────────────────────────┼──────────────────────────┤        │
│  │ Name: Mohammed Hassan    │ Name: Muhammad Hassan     │        │
│  │ Passport: AB1234567    = │ Passport: AB1234567    =  │        │
│  │ Email: m.hassan@gov.eg   │ Email: mhassan@gmail.com  │        │
│  │ Country: Egypt         = │ Country: Egypt          = │        │
│  │ DOB: 1975-03-15       = │ DOB: 1975-03-15        = │        │
│  │ Type: Delegate           │ Type: Delegate            │        │
│  │ Status: Approved (Step4) │ Status: Pending (Step 1)  │        │
│  │ Registered by: Embassy   │ Registered by: Self       │        │
│  │ Photo: [thumbnail]       │ Photo: [thumbnail]        │        │
│  └──────────────────────────┴──────────────────────────┘        │
│                                                                  │
│  Match details: passport=100%, name=85%, DOB=100%, country=100% │
│                                                                  │
│  ── MERGE FIELD RESOLUTION ──                                    │
│  (Select which value to keep for each differing field)          │
│  ┌────────────┬──────────────────┬──────────────────────┐       │
│  │ Field      │ Keep A           │ Keep B                │       │
│  ├────────────┼──────────────────┼──────────────────────┤       │
│  │ Name       │ (*) Mohammed     │ ( ) Muhammad          │       │
│  │ Email      │ ( ) m.hassan@    │ (*) mhassan@gmail     │       │
│  │ Photo      │ (*) [A's photo]  │ ( ) [B's photo]       │       │
│  │ Phone      │ (*) +20-1234     │ ( ) +20-5678          │       │
│  └────────────┴──────────────────┴──────────────────────┘       │
│                                                                  │
│  [Not Duplicate]  [Merge A <- B]  [Merge B <- A]  [Skip]       │
│                                                                  │
│  ── MERGE PREVIEW ──                                             │
│  Surviving record: Mohammed Hassan (A)                           │
│  Email: mhassan@gmail.com (from B)                              │
│  2 approval records will be migrated from B                      │
│  1 document upload will be migrated from B                       │
│  Delegation quota will be adjusted: Kenya -1 used               │
│                                                                  │
│  [Confirm Merge]  [Cancel]                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Waitlist Management Dashboard

The waitlist management dashboard provides administrators with visibility into excess demand and control over promotions.

```
+----------------------------------------------------------------------+
|  Waitlist Analytics - 38th AU Summit                                 |
+----------------------------------------------------------------------+
|                                                                       |
|  DEMAND vs CAPACITY                      CONVERSION FUNNEL            |
|                                                                       |
|  Participant Type    Quota  Reg'd  Wait   Waitlisted:        47      |
|  -------------------------------------    Promoted:          12 (26%) |
|  Delegate              50    50     17    Confirmed:          9 (75%) |
|  Observer              30    30      8    Expired/Declined:   3 (25%) |
|  Media                 40    35      0    Still waiting:     35       |
|  Staff                100    87      0                                |
|  Interpreter           20    20     14    AVERAGE WAIT TIME           |
|  NGO                   25    25      8    VIP:    1.2 days            |
|                                           HIGH:   2.8 days            |
|  Total waitlisted: 47                     STANDARD: 4.5 days         |
|  Demand-to-capacity: 1.15x                                           |
|                                                                       |
|  WAITLIST ACTIVITY (last 7 days)                                     |
|  +--------------------------------------------------+                |
|  |  Joined  ====  ====  ==    =     ==   ===  ==    |                |
|  |  Left    --    -     ---   --    -    --   -     |                |
|  |         Feb 1  Feb 2  Feb 3 Feb 4 Feb 5 Feb 6 Feb 7             |
|  +--------------------------------------------------+                |
|                                                                       |
|  RECOMMENDATIONS                                                      |
|  [!] Interpreter quota has 70% excess demand -> Consider +10 slots   |
|  [!] Delegate waitlist has 3 VIP entries -> Review for manual promo  |
|                                                                       |
|  [Export Waitlist]  [Bulk Promote]  [Adjust Quotas]                  |
+----------------------------------------------------------------------+
```

### 6.6 Registration Status Tracker

The participant-facing status tracker allows registrants to monitor their registration progress.

```
+--------------------------------------------------------------+
|  Registration Status                      REG-2026-0089      |
+--------------------------------------------------------------+
|                                                               |
|  Status: WAITLISTED                                          |
|                                                               |
|  +------------------------------------------------------+    |
|  |                                                        |    |
|  |  Your position in queue:  #3                          |    |
|  |  Priority level: VIP                                   |    |
|  |                                                        |    |
|  |  Ahead of you:  2 people                              |    |
|  |  Behind you:   14 people                              |    |
|  |                                                        |    |
|  |  Quota: 50 / 50 (full)                                |    |
|  |  Waitlisted: Feb 5, 2026 at 10:23                    |    |
|  |                                                        |    |
|  |  o-----------*------------------------------ o        |    |
|  |  Submitted   Waitlisted                  Promoted      |    |
|  |                                                        |    |
|  |  You will be notified immediately by email            |    |
|  |  and SMS when a slot becomes available.               |    |
|  |                                                        |    |
|  |  [Withdraw from Waitlist]                             |    |
|  |                                                        |    |
|  +------------------------------------------------------+    |
|                                                               |
|  Position history:                                            |
|  Feb 5, 10:23 - Joined waitlist at position #7               |
|  Feb 6, 14:10 - Moved to position #5 (2 withdrawals)        |
|  Feb 7, 09:00 - Moved to position #3 (2 promotions)         |
|                                                               |
+--------------------------------------------------------------+
```

### 6.7 Admin Registration Overview Dashboard

The admin dashboard provides a comprehensive view of registration progress across all entry points.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Registration Overview - 38th AU Summit                              │
│  Last updated: Feb 10, 2026 14:30                    [Refresh]      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  REGISTRATION SUMMARY                                                 │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐       │
│  │  Total       │  Self-Service│  Delegation  │  Bulk Import │       │
│  │  1,847       │  423 (23%)   │  1,124 (61%) │  300 (16%)   │       │
│  └──────────────┴──────────────┴──────────────┴──────────────┘       │
│                                                                       │
│  STATUS BREAKDOWN                                                     │
│  ┌───────────────┬───────┬────────────────────────────────────┐      │
│  │ Status        │ Count │ Bar                                 │      │
│  ├───────────────┼───────┼────────────────────────────────────┤      │
│  │ Approved      │  982  │ ================================    │      │
│  │ In Review     │  312  │ ==========                          │      │
│  │ Submitted     │  198  │ ======                              │      │
│  │ Printed       │  156  │ =====                               │      │
│  │ Collected     │   89  │ ===                                 │      │
│  │ Waitlisted    │   47  │ =                                   │      │
│  │ Flagged       │   12  │ =                                   │      │
│  │ Rejected      │   34  │ =                                   │      │
│  │ Withdrawn     │   17  │ =                                   │      │
│  └───────────────┴───────┴────────────────────────────────────┘      │
│                                                                       │
│  ALERTS                                                               │
│  [!] 12 flagged registrations pending review                         │
│  [!] 8 duplicate candidates (confidence > 90%)                       │
│  [!] 3 quota change requests pending                                 │
│  [!] Interpreter quota at 100% - 14 waitlisted                      │
│                                                                       │
│  DELEGATION PROGRESS (Top 10)                                        │
│  ┌──────────────────┬────────┬─────────────────────────────────┐    │
│  │ Delegation       │ Status │ Progress                         │    │
│  ├──────────────────┼────────┼─────────────────────────────────┤    │
│  │ Kenya            │ 85%    │ ========================----     │    │
│  │ Nigeria          │ 72%    │ ====================--------     │    │
│  │ South Africa     │ 95%    │ ============================-    │    │
│  │ Egypt            │ 60%    │ ================------------     │    │
│  │ Ethiopia         │ 45%    │ ============----------------     │    │
│  └──────────────────┴────────┴─────────────────────────────────┘    │
│                                                                       │
│  RECENT ACTIVITY                                                      │
│  14:28 - Bulk import: 300 participants from AU_staff.csv             │
│  14:15 - Kenya delegation: 2 new registrations by Jane Wanjiku       │
│  14:02 - Duplicate resolved: Mohammed/Muhammad Hassan (merged)       │
│  13:45 - Blacklist match: John Doe flagged (passport match)          │
│                                                                       │
│  [View All Registrations]  [Bulk Operations]  [Manage Delegations]   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Operations History Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Bulk Operations History                        [New Operation] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────┬─────────────────────────┬────────┬───────┬────────┐ │
│  │ Status │ Description             │ Items  │ By    │ Date   │ │
│  ├────────┼─────────────────────────┼────────┼───────┼────────┤ │
│  │ Done   │ Import 847 delegates    │ 847/847│ Admin │ Feb 3  │ │
│  │        │ from AU_delegates.csv   │        │       │ [Undo] │ │
│  │ Done   │ Approve 234 Support     │ 234/234│ Admin │ Feb 3  │ │
│  │        │ Staff at Step 2         │        │       │ [Undo] │ │
│  │ Fail   │ Import media_list.csv   │  3/120 │ Admin │ Feb 2  │ │
│  │        │ 117 validation errors   │        │       │ [View] │ │
│  │ Undo   │ Import observers.csv    │ 56/56  │ Admin │ Feb 1  │ │
│  │        │ Rolled back Feb 2       │        │       │        │ │
│  │ Export │ Export all participants  │ 1,847  │ Admin │ Feb 1  │ │
│  │        │ to participants.xlsx    │        │       │ [DL]   │ │
│  └────────┴─────────────────────────┴────────┴───────┴────────┘ │
│                                                                  │
│  Page 1 of 3                              [<- Previous] [Next ->]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Module Integration Map

| Integration         | Source Module | Target Module                | Direction | Description                                                                                                           |
| ------------------- | ------------- | ---------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| Form Rendering      | Module 09     | Module 03 (Form Designer)    | Consumes  | Registration forms rendered from FormTemplate definitions; dynamic field validation rules applied at submission       |
| Workflow Entry      | Module 09     | Module 04 (Workflow Engine)  | Produces  | Submitted registrations enter the event workflow at Step 1; status transitions driven by workflow approvals           |
| Email Confirmations | Module 09     | Module 14 (Content)          | Produces  | Registration confirmations, waitlist notifications, promotion offers, status change alerts sent via Communication Hub |
| Accommodation Links | Module 09     | Module 11 (Logistics)        | Produces  | Approved participants linked to accommodation assignments; focal points manage room preferences for delegation        |
| Transport Links     | Module 09     | Module 11 (Logistics)        | Produces  | Arrival/departure data collected during registration; transport assignments linked to approved participants           |
| Check-in Readiness  | Module 09     | Module 10 (Event Operations) | Produces  | Approved + badge-printed participants flagged as check-in ready; participant data available for on-site verification  |
| Security Screening  | Module 09     | Module 05 (Security)         | Consumes  | Blacklist data maintained in security module; duplicate detection uses security-grade matching algorithms             |
| API Exposure        | Module 09     | Module 07 (API Layer)        | Produces  | All registration, delegation, bulk, duplicate, blacklist, and waitlist endpoints exposed through unified API gateway  |

### 7.2 Event-Driven Integration

Registration events published for consumption by other modules:

```typescript
// Events published by Module 09
interface RegistrationEvents {
  // Participant lifecycle events
  "participant.registered": {
    participantId: string;
    eventId: string;
    tenantId: string;
    source: "SELF_SERVICE" | "FOCAL_POINT" | "BULK_IMPORT";
    participantType: string;
    delegationId?: string;
  };

  "participant.status_changed": {
    participantId: string;
    eventId: string;
    previousStatus: ParticipantStatus;
    newStatus: ParticipantStatus;
    changedBy: string;
    trigger: string;
  };

  "participant.approved": {
    participantId: string;
    eventId: string;
    participantType: string;
    delegationId?: string;
  };

  "participant.rejected": {
    participantId: string;
    eventId: string;
    participantType: string;
    reason: string;
  };

  "participant.withdrawn": {
    participantId: string;
    eventId: string;
    participantType: string;
    delegationId?: string;
  };

  // Delegation events
  "delegation.quota_changed": {
    delegationId: string;
    eventId: string;
    participantTypeId: string;
    oldQuota: number;
    newQuota: number;
  };

  "delegation.replacement_completed": {
    delegationId: string;
    originalParticipantId: string;
    replacementParticipantId: string;
  };

  // Duplicate / Blacklist events
  "duplicate.flagged": {
    candidateId: string;
    participantAId: string;
    participantBId: string;
    confidenceScore: number;
  };

  "duplicate.merged": {
    mergeHistoryId: string;
    survivingId: string;
    mergedId: string;
  };

  "blacklist.match_found": {
    participantId: string;
    blacklistEntryId: string;
    matchType: string;
    confidence: number;
  };

  // Waitlist events
  "waitlist.entry_added": {
    waitlistEntryId: string;
    participantId: string;
    position: number;
    priority: WaitlistPriority;
  };

  "waitlist.participant_promoted": {
    waitlistEntryId: string;
    participantId: string;
    triggeredBy: string;
    promotionDeadline: string;
  };

  "waitlist.promotion_expired": {
    waitlistEntryId: string;
    participantId: string;
  };

  // Bulk operation events
  "bulk_operation.completed": {
    operationId: string;
    type: BulkOperationType;
    totalItems: number;
    successCount: number;
    failureCount: number;
  };

  "bulk_operation.rolled_back": {
    operationId: string;
    itemsRolledBack: number;
  };
}
```

### 7.3 Integration Contracts

**Waitlist Integration with Other Systems:**

| System                       | Integration                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **Invitation / Quotas**      | InvitationConstraint.maxParticipants is the trigger threshold; quota changes trigger re-evaluation |
| **Workflow Engine**          | Promoted participants enter the workflow at step 1, same as direct registrations                   |
| **Communication Hub**        | Waitlist notifications (position updates, promotion offers, expiry warnings, confirmations)        |
| **Participant Registration** | Registration form data snapshot stored in WaitlistEntry for restoration on promotion               |
| **Command Center**           | Waitlist demand-to-capacity widget, promotion activity alerts                                      |
| **Analytics / Reporting**    | Conversion rates, wait times, demand patterns feed into event planning reports                     |
| **Post-Event Surveys**       | Promoted-from-waitlist participants tagged for experience comparison                               |

---

## 8. Configuration

### 8.1 Feature Flags

```typescript
interface RegistrationFeatureFlags {
  /**
   * Enable self-service registration via public form links.
   * When disabled, only focal point and bulk import entry points are available.
   */
  selfServiceRegistration: {
    enabled: boolean;
    requireInvitationCode: boolean; // If true, public registration requires a valid invitation code
    requireCaptcha: boolean; // CAPTCHA requirement for public forms
    allowedParticipantTypes: string[]; // Which types can self-register (empty = all)
  };

  /**
   * Enable bulk import operations.
   * When disabled, the bulk operations center is hidden from the admin UI.
   */
  bulkImport: {
    enabled: boolean;
    maxFileSize: number; // bytes, default: 10MB (10_485_760)
    maxRows: number; // default: 10_000
    allowedFileTypes: string[]; // default: ['.csv', '.xlsx']
    undoWindowHours: number; // default: 24
  };

  /**
   * Enable duplicate detection engine.
   * When disabled, registrations are not checked for duplicates.
   */
  duplicateDetection: {
    enabled: boolean;
    autoFlagThreshold: number; // default: 0.90 (auto-flag and hold)
    warningThreshold: number; // default: 0.70 (warn but proceed)
    crossEventDetection: boolean; // Check across all tenant events
    enablePhoneticMatching: boolean; // Soundex/Metaphone matching
    enableTransliteration: boolean; // Arabic/Latin name variant matching
  };

  /**
   * Enable waitlist management.
   * When disabled, registrations that exceed quota are rejected immediately.
   */
  waitlist: {
    enabled: boolean;
    autoPromoteEnabled: boolean; // Automatically promote next in queue
    promotionDeadlineHours: number; // default: 48
    maxWaitlistSize: number; // Per participant type, default: 100
    positionNotificationEnabled: boolean; // Notify on position changes
    positionChangeThreshold: number; // Min position change to trigger notification, default: 3
  };

  /**
   * Enable delegation management portal.
   * When disabled, all registrations must come through self-service or bulk import.
   */
  delegationPortal: {
    enabled: boolean;
    allowSecondaryFocalPoint: boolean;
    allowQuotaChangeRequests: boolean;
    allowReplacements: boolean;
    focalPointCanViewAccommodation: boolean;
    focalPointCanViewTransport: boolean;
  };
}
```

### 8.2 Duplicate Detection Configuration

```typescript
interface DuplicateDetectionConfig {
  // Scoring weights for each field
  fieldWeights: {
    passport: { exactMatchScore: number }; // default: 1.00
    email: { exactMatchScore: number }; // default: 0.95
    name: {
      levenshteinThreshold: number; // max Levenshtein distance, default: 2
      levenshteinScore: number; // score when within threshold, default: 0.85
      soundexScore: number; // score for Soundex match, default: 0.80
      metaphoneScore: number; // score for Metaphone match, default: 0.82
    };
    nameAndDob: { combinedScore: number }; // default: 0.90
    nameAndCountry: { combinedScore: number }; // default: 0.70
    phone: { normalizedMatchScore: number }; // default: 0.80
  };

  // Multi-field boost
  multiFieldBoost: number; // per additional matching field, default: 0.05

  // Threshold decisions
  autoFlagThreshold: number; // default: 0.90
  warningThreshold: number; // default: 0.70

  // Performance tuning
  maxCandidatesPerCheck: number; // Limit fuzzy search results, default: 20
  trigramSimilarityThreshold: number; // pg_trgm threshold for name candidate selection, default: 0.3

  // Transliteration tables
  transliterationEnabled: boolean;
  transliterationTables: {
    source: string; // e.g., "arabic"
    mappings: Record<string, string[]>; // e.g., "محمد" → ["Mohammed", "Muhammad", "Mohamed"]
  }[];
}
```

### 8.3 Waitlist Configuration

```typescript
interface WaitlistConfig {
  // Priority mapping per event
  priorityMapping: {
    vipParticipantTypes: string[]; // default: ['HEAD_OF_STATE', 'MINISTER']
    highPriorityTypes: string[]; // default: ['AMBASSADOR', 'SENIOR_OFFICIAL']
    // All other types default to STANDARD
  };

  // Promotion settings
  autoPromoteEnabled: boolean; // default: true
  promotionDeadlineHours: number; // default: 48
  deadlineCheckIntervalMinutes: number; // default: 15

  // Notification settings
  notifyOnPositionChange: boolean; // default: true
  positionChangeThreshold: number; // Min change to trigger notification, default: 3
  notifyOnPromotion: boolean; // default: true
  notifyOnExpiry: boolean; // default: true
  maxNotificationsPerEntry: number; // Prevent spam, default: 20

  // Limits
  maxWaitlistSizePerType: number; // default: 100
  maxWaitlistSizePerEvent: number; // default: 500
}
```

### 8.4 Bulk Import Configuration

```typescript
interface BulkImportConfig {
  // File constraints
  maxFileSize: number; // bytes, default: 10_485_760 (10MB)
  maxRows: number; // default: 10_000
  allowedFileTypes: string[]; // default: ['.csv', '.xlsx']
  allowedDelimiters: string[]; // default: [',', ';', '\t']
  encoding: string; // default: 'UTF-8'

  // Processing
  batchSize: number; // Rows per batch, default: 50
  maxConcurrentBatches: number; // default: 4
  timeoutPerRow: number; // ms, default: 5000

  // Undo
  undoWindowHours: number; // default: 24
  snapshotRetentionDays: number; // How long to keep undo data, default: 30

  // Column mapping
  autoMapEnabled: boolean; // Auto-detect column mappings, default: true
  autoMapConfidenceThreshold: number; // default: 0.80
  requiredFields: string[]; // Fields that must be mapped, default: ['name', 'email', 'participantType']

  // Duplicate handling during import
  duplicateAction: "SKIP" | "FLAG" | "OVERWRITE"; // default: 'SKIP'
}
```

### 8.5 Quota Enforcement Configuration

```typescript
interface QuotaEnforcementConfig {
  /**
   * STRICT: Hard reject when quota is full. No over-allocation allowed.
   * SOFT: Allow over-quota registration with admin warning. Useful for VIP registrations.
   */
  mode: "STRICT" | "SOFT";

  // Soft mode settings
  softModeMaxOverage: number; // Max % over quota in soft mode, default: 10
  softModeRequiresApproval: boolean; // Require admin approval for over-quota, default: true

  // Concurrent access
  lockStrategy: "OPTIMISTIC" | "PESSIMISTIC"; // default: 'OPTIMISTIC'
  retryAttempts: number; // For optimistic lock failures, default: 3
  retryDelayMs: number; // Backoff delay, default: 100

  // Notifications
  notifyOnQuotaThreshold: number; // Alert when usage hits this %, default: 80
  notifyOnQuotaFull: boolean; // default: true
}
```

---

## 9. Testing Strategy

### 9.1 Registration Flow E2E Tests

```typescript
describe("Registration Flow E2E Tests", () => {
  describe("Self-Service Registration", () => {
    it("should complete full self-service registration flow", async () => {
      // 1. Load public registration form
      const form = await api.get(`/registration/public/form/${formTemplateId}`);
      expect(form.status).toBe(200);
      expect(form.body.fields.length).toBeGreaterThan(0);

      // 2. Submit registration with valid data
      const registration = await api.post("/registration/public", {
        formTemplateId,
        participantType: "DELEGATE",
        data: validParticipantData,
        captchaToken: "test-valid-token",
      });
      expect(registration.status).toBe(201);
      expect(registration.body.status).toBe("SUBMITTED");
      expect(registration.body.registrationCode).toMatch(/^REG-\d{4}-\d{4}$/);

      // 3. Verify participant entered workflow
      const status = await api.get(
        `/registration/public/${registration.body.registrationCode}/status`,
      );
      expect(status.body.currentStep).toBeDefined();
      expect(status.body.currentStep.stepNumber).toBe(1);
    });

    it("should reject registration with invalid CAPTCHA", async () => {
      const registration = await api.post("/registration/public", {
        formTemplateId,
        participantType: "DELEGATE",
        data: validParticipantData,
        captchaToken: "invalid-token",
      });
      expect(registration.status).toBe(403);
    });

    it("should return validation errors for invalid data", async () => {
      const registration = await api.post("/registration/public", {
        formTemplateId,
        participantType: "DELEGATE",
        data: { name: "", email: "not-an-email" },
        captchaToken: "test-valid-token",
      });
      expect(registration.status).toBe(400);
      expect(registration.body.errors).toContainEqual(
        expect.objectContaining({ field: "name", message: expect.any(String) }),
      );
    });

    it("should waitlist registration when quota is full", async () => {
      // Fill quota first
      await fillQuotaForType(eventId, "DELEGATE");

      const registration = await api.post("/registration/public", {
        formTemplateId,
        participantType: "DELEGATE",
        data: validParticipantData,
        captchaToken: "test-valid-token",
      });
      expect(registration.status).toBe(202);
      expect(registration.body.status).toBe("WAITLISTED");
      expect(registration.body.waitlistPosition).toBeDefined();
    });

    it("should flag registration matching blacklist", async () => {
      // Add to blacklist
      await api.post("/blacklist", {
        type: "INDIVIDUAL",
        passportNumber: validParticipantData.passportNumber,
        reason: "Test blacklist",
      });

      const registration = await api.post("/registration/public", {
        formTemplateId,
        participantType: "DELEGATE",
        data: validParticipantData,
        captchaToken: "test-valid-token",
      });
      expect(registration.status).toBe(423);
    });
  });

  describe("Focal Point Registration", () => {
    it("should register participant within delegation quota", async () => {
      const registration = await api.post(
        `/delegations/${delegationId}/participants`,
        {
          participantTypeId: "DELEGATE",
          formTemplateId,
          data: validParticipantData,
        },
        { headers: { Authorization: `Bearer ${focalPointToken}` } },
      );
      expect(registration.status).toBe(201);
      expect(registration.body.quota.remaining).toBeGreaterThanOrEqual(0);
    });

    it("should reject registration when delegation quota full", async () => {
      await fillDelegationQuota(delegationId, "DELEGATE");

      const registration = await api.post(
        `/delegations/${delegationId}/participants`,
        {
          participantTypeId: "DELEGATE",
          formTemplateId,
          data: validParticipantData,
        },
        { headers: { Authorization: `Bearer ${focalPointToken}` } },
      );
      expect(registration.status).toBe(409);
    });

    it("should reject non-focal-point users", async () => {
      const registration = await api.post(
        `/delegations/${delegationId}/participants`,
        {
          participantTypeId: "DELEGATE",
          formTemplateId,
          data: validParticipantData,
        },
        { headers: { Authorization: `Bearer ${nonFocalPointToken}` } },
      );
      expect(registration.status).toBe(403);
    });
  });

  describe("Bulk Import", () => {
    it("should complete full bulk import flow", async () => {
      // 1. Upload
      const upload = await api.post("/bulk-operations/import", {
        file: testCsvFile,
        type: "IMPORT_PARTICIPANTS",
      });
      expect(upload.status).toBe(200);
      expect(upload.body.detectedColumns.length).toBeGreaterThan(0);

      // 2. Map columns
      await api.post(`/bulk-operations/${upload.body.operationId}/mapping`, {
        mappings: columnMappings,
      });

      // 3. Validate
      const validation = await api.post(`/bulk-operations/${upload.body.operationId}/validate`);
      expect(validation.body.status).toBe("PREVIEW");
      expect(validation.body.summary.validRows).toBeGreaterThan(0);

      // 4. Execute
      const execution = await api.post(`/bulk-operations/${upload.body.operationId}/execute`);
      expect(execution.body.status).toBe("PROCESSING");

      // 5. Wait for completion
      await waitForOperationComplete(upload.body.operationId);

      // 6. Verify
      const status = await api.get(`/bulk-operations/${upload.body.operationId}/status`);
      expect(status.body.status).toBe("COMPLETED");
      expect(status.body.progress.successCount).toBeGreaterThan(0);
    });
  });
});
```

### 9.2 Duplicate Detection Accuracy Tests

```typescript
describe("Duplicate Detection Accuracy Tests", () => {
  // Precision: Of all flagged duplicates, what % are actually duplicates?
  // Target: >= 95% precision
  it("should achieve >= 95% precision on known duplicate dataset", async () => {
    const testCases = loadDuplicateTestDataset(); // 500 known pairs
    let truePositives = 0;
    let falsePositives = 0;

    for (const testCase of testCases) {
      const result = await duplicateEngine.check(tenantId, eventId, testCase.participant);

      if (result.highestScore >= 0.9) {
        if (testCase.isDuplicate) {
          truePositives++;
        } else {
          falsePositives++;
        }
      }
    }

    const precision = truePositives / (truePositives + falsePositives);
    expect(precision).toBeGreaterThanOrEqual(0.95);
  });

  // Recall: Of all actual duplicates, what % did we catch?
  // Target: >= 90% recall
  it("should achieve >= 90% recall on known duplicate dataset", async () => {
    const testCases = loadDuplicateTestDataset();
    let truePositives = 0;
    let falseNegatives = 0;

    for (const testCase of testCases.filter((t) => t.isDuplicate)) {
      const result = await duplicateEngine.check(tenantId, eventId, testCase.participant);

      if (result.highestScore >= 0.7) {
        truePositives++;
      } else {
        falseNegatives++;
      }
    }

    const recall = truePositives / (truePositives + falseNegatives);
    expect(recall).toBeGreaterThanOrEqual(0.9);
  });

  it("should correctly match Arabic name transliterations", async () => {
    const variations = [
      "Mohammed Hassan",
      "Muhammad Hassan",
      "Mohamed Hassan",
      "Mohamad Hassan",
      "Muhammed Hasan",
    ];

    for (let i = 1; i < variations.length; i++) {
      const score = duplicateEngine.calculateNameSimilarity(variations[0], variations[i]);
      expect(score).toBeGreaterThanOrEqual(0.75);
    }
  });

  it("should not flag clearly different names", async () => {
    const score = duplicateEngine.calculateNameSimilarity("John Smith", "Maria Gonzalez");
    expect(score).toBeLessThan(0.5);
  });

  it("should handle cross-event duplicate detection", async () => {
    // Register same person in two events
    await registerParticipant(event1Id, testParticipant);
    const result = await duplicateEngine.check(tenantId, event2Id, testParticipant, {
      crossEvent: true,
    });
    expect(result.highestScore).toBeGreaterThanOrEqual(0.9);
  });
});
```

### 9.3 Bulk Import Stress Tests

```typescript
describe("Bulk Import Stress Tests", () => {
  it("should process 10,000 records within acceptable time", async () => {
    const largeCsv = generateCsvWithRows(10_000);
    const startTime = Date.now();

    const upload = await api.post("/bulk-operations/import", {
      file: largeCsv,
      type: "IMPORT_PARTICIPANTS",
    });

    await api.post(`/bulk-operations/${upload.body.operationId}/mapping`, {
      mappings: standardMappings,
    });

    await api.post(`/bulk-operations/${upload.body.operationId}/validate`);
    await api.post(`/bulk-operations/${upload.body.operationId}/execute`);
    await waitForOperationComplete(upload.body.operationId, { timeout: 300_000 });

    const duration = Date.now() - startTime;
    const status = await api.get(`/bulk-operations/${upload.body.operationId}/status`);

    // Target: 100 rows/sec = 10,000 in 100 seconds
    expect(duration).toBeLessThan(120_000); // Allow 20% overhead
    expect(status.body.progress.successCount).toBeGreaterThan(9_500); // >= 95% success
    expect(status.body.status).toBe("COMPLETED");
  });

  it("should handle concurrent bulk operations without interference", async () => {
    const operations = await Promise.all([
      startBulkImport(generateCsvWithRows(1_000)),
      startBulkImport(generateCsvWithRows(1_000)),
      startBulkImport(generateCsvWithRows(1_000)),
    ]);

    await Promise.all(operations.map((op) => waitForOperationComplete(op.operationId)));

    for (const op of operations) {
      const status = await api.get(`/bulk-operations/${op.operationId}/status`);
      expect(status.body.status).toBe("COMPLETED");
      expect(status.body.progress.successCount).toBeGreaterThan(900);
    }
  });

  it("should successfully undo a large bulk import", async () => {
    const opId = await executeBulkImport(generateCsvWithRows(5_000));

    const beforeCount = await getParticipantCount(eventId);

    const undo = await api.post(`/bulk-operations/${opId}/undo`);
    expect(undo.status).toBe(200);

    const afterCount = await getParticipantCount(eventId);
    expect(afterCount).toBe(beforeCount - undo.body.itemsRolledBack);
  });
});
```

### 9.4 Quota Enforcement Concurrency Tests

```typescript
describe("Quota Enforcement Concurrency Tests", () => {
  it("should not over-allocate under concurrent registrations", async () => {
    // Set up delegation with quota of 10
    const delegationId = await createDelegation({
      quotas: [{ participantTypeId: "DELEGATE", allocatedQuota: 10 }],
    });

    // Fire 20 concurrent registrations
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, (_, i) =>
        api.post(`/delegations/${delegationId}/participants`, {
          participantTypeId: "DELEGATE",
          formTemplateId,
          data: { ...validParticipantData, email: `user${i}@test.com` },
        }),
      ),
    );

    const successes = results.filter((r) => r.status === "fulfilled" && r.value.status === 201);
    const rejections = results.filter((r) => r.status === "fulfilled" && r.value.status === 409);

    // Exactly 10 should succeed, 10 should be rejected
    expect(successes.length).toBe(10);
    expect(rejections.length).toBe(10);

    // Verify quota counts are consistent
    const quota = await api.get(`/delegations/${delegationId}/quotas`);
    const delegateQuota = quota.body.quotas.find((q: any) => q.participantTypeId === "DELEGATE");
    expect(delegateQuota.used + delegateQuota.pending).toBe(10);
  });

  it("should handle optimistic lock retries gracefully", async () => {
    const delegationId = await createDelegation({
      quotas: [{ participantTypeId: "DELEGATE", allocatedQuota: 5 }],
    });

    // Simulate rapid sequential registrations
    for (let i = 0; i < 5; i++) {
      const result = await api.post(`/delegations/${delegationId}/participants`, {
        participantTypeId: "DELEGATE",
        formTemplateId,
        data: { ...validParticipantData, email: `user${i}@test.com` },
      });
      expect(result.status).toBe(201);
    }

    // 6th should fail
    const overflow = await api.post(`/delegations/${delegationId}/participants`, {
      participantTypeId: "DELEGATE",
      formTemplateId,
      data: { ...validParticipantData, email: "overflow@test.com" },
    });
    expect(overflow.status).toBe(409);
  });
});
```

### 9.5 Waitlist Promotion Tests

```typescript
describe("Waitlist Promotion Tests", () => {
  it("should auto-promote next in queue when participant is rejected", async () => {
    // Fill quota
    const participants = await fillQuotaForType(eventId, "DELEGATE");

    // Add to waitlist
    const waitlisted = await registerAndWaitlist(eventId, "DELEGATE");

    // Reject one active participant
    await api.put(`/participants/${participants[0].id}/status`, {
      status: "REJECTED",
      reason: "Test rejection",
    });

    // Verify waitlisted participant was promoted
    await waitFor(async () => {
      const entry = await api.get(`/waitlist/${waitlisted.waitlistEntryId}`);
      expect(entry.body.status).toBe("PROMOTED");
      expect(entry.body.promotions.length).toBe(1);
      expect(entry.body.promotions[0].triggeredBy).toBe("rejection");
    });
  });

  it("should respect priority ordering in promotions", async () => {
    await fillQuotaForType(eventId, "DELEGATE");

    // Add standard priority first
    const standard = await registerAndWaitlist(eventId, "DELEGATE", "STANDARD");
    // Add VIP priority second
    const vip = await registerAndWaitlist(eventId, "DELEGATE", "VIP");

    // Open one slot
    await rejectParticipant(eventId);

    // VIP should be promoted (even though added later)
    await waitFor(async () => {
      const vipEntry = await api.get(`/waitlist/${vip.waitlistEntryId}`);
      expect(vipEntry.body.status).toBe("PROMOTED");

      const stdEntry = await api.get(`/waitlist/${standard.waitlistEntryId}`);
      expect(stdEntry.body.status).toBe("ACTIVE");
    });
  });

  it("should expire promotion and promote next when deadline passes", async () => {
    // Setup: waitlisted participant gets promoted
    const entry = await setupPromotedWaitlistEntry(eventId, "DELEGATE");

    // Fast-forward past deadline
    await setPromotionDeadline(entry.id, new Date(Date.now() - 1000));

    // Trigger deadline check
    await waitlistService.checkExpiredPromotions();

    // Verify expired
    const updated = await api.get(`/waitlist/${entry.id}`);
    expect(updated.body.status).toBe("EXPIRED");
  });

  it("should recalculate positions after promotion", async () => {
    await fillQuotaForType(eventId, "DELEGATE");

    const entries = await Promise.all([
      registerAndWaitlist(eventId, "DELEGATE"), // position 1
      registerAndWaitlist(eventId, "DELEGATE"), // position 2
      registerAndWaitlist(eventId, "DELEGATE"), // position 3
    ]);

    // Promote first
    await rejectParticipant(eventId);

    await waitFor(async () => {
      // Position 2 should now be position 1
      const entry2 = await api.get(`/waitlist/${entries[1].waitlistEntryId}`);
      expect(entry2.body.position).toBe(1);

      // Position 3 should now be position 2
      const entry3 = await api.get(`/waitlist/${entries[2].waitlistEntryId}`);
      expect(entry3.body.position).toBe(2);
    });
  });
});
```

---

## 10. Security Considerations

### 10.1 Rate Limiting

Rate limiting protects public registration endpoints from abuse and ensures fair access during high-demand periods.

```typescript
const RATE_LIMIT_CONFIG = {
  // Public registration form submission
  publicRegistration: {
    windowMs: 60_000, // 1 minute window
    maxRequests: 10, // 10 submissions per minute per IP
    keyGenerator: (req: Request) => req.ip,
    message: "Too many registration attempts. Please wait before trying again.",
  },

  // Registration status check
  statusCheck: {
    windowMs: 60_000,
    maxRequests: 30, // 30 checks per minute per registration code
    keyGenerator: (req: Request) => req.params.registrationCode,
  },

  // Focal point registration
  focalPointRegistration: {
    windowMs: 60_000,
    maxRequests: 50, // 50 registrations per minute per focal point
    keyGenerator: (req: Request) => req.user.id,
  },

  // Bulk operations
  bulkOperations: {
    windowMs: 3_600_000, // 1 hour window
    maxRequests: 10, // 10 bulk operations per hour per admin
    keyGenerator: (req: Request) => req.user.id,
  },

  // Duplicate search
  duplicateSearch: {
    windowMs: 60_000,
    maxRequests: 20, // 20 searches per minute per admin
    keyGenerator: (req: Request) => req.user.id,
  },
};
```

### 10.2 CAPTCHA for Public Forms

```typescript
class CaptchaService {
  private readonly RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

  async verify(token: string): Promise<boolean> {
    const response = await fetch(this.RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success && data.score >= 0.5; // reCAPTCHA v3 score threshold
  }
}
```

### 10.3 Document Upload Validation

```typescript
const UPLOAD_VALIDATION_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],

  // Image-specific validation
  image: {
    minWidth: 300,
    minHeight: 300,
    maxWidth: 4000,
    maxHeight: 4000,
    passportPhoto: {
      minWidth: 600,
      minHeight: 600,
      aspectRatioTolerance: 0.1, // Allow 10% deviation from 1:1
    },
  },
};

class DocumentUploadValidator {
  async validate(file: UploadedFile): Promise<ValidationResult> {
    const errors: string[] = [];

    // Size check
    if (file.size > UPLOAD_VALIDATION_CONFIG.maxFileSize) {
      errors.push(
        `File size ${file.size} exceeds maximum of ${UPLOAD_VALIDATION_CONFIG.maxFileSize}`,
      );
    }

    // MIME type check (read actual file header, not just extension)
    const detectedMime = await this.detectMimeType(file.buffer);
    if (!UPLOAD_VALIDATION_CONFIG.allowedMimeTypes.includes(detectedMime)) {
      errors.push(`File type ${detectedMime} is not allowed`);
    }

    // Extension check
    const ext = path.extname(file.originalName).toLowerCase();
    if (!UPLOAD_VALIDATION_CONFIG.allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} is not allowed`);
    }

    // Virus scan
    const scanResult = await this.virusScanner.scan(file.buffer);
    if (scanResult.infected) {
      errors.push("File failed virus scan");
    }

    return { valid: errors.length === 0, errors };
  }
}
```

### 10.4 PII Handling

```typescript
// PII fields are encrypted at rest using AES-256
const PII_FIELDS = ["passportNumber", "dateOfBirth", "phone", "email", "nationalId"];

// All PII access is audit-logged
class PIIAuditLogger {
  async logAccess(
    userId: string,
    participantId: string,
    fields: string[],
    action: "VIEW" | "EXPORT" | "MODIFY",
  ): Promise<void> {
    await this.db.auditLog.create({
      data: {
        entityType: "PARTICIPANT_PII",
        entityId: participantId,
        action: `PII_${action}`,
        performedBy: userId,
        metadata: {
          fieldsAccessed: fields,
          timestamp: new Date().toISOString(),
          ipAddress: this.requestContext.ip,
          userAgent: this.requestContext.userAgent,
        },
      },
    });
  }
}
```

### 10.5 Focal Point Authorization

```typescript
class FocalPointAuthorizationGuard {
  async canAccess(userId: string, delegationId: string): Promise<boolean> {
    const delegation = await this.db.delegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) return false;

    // Only the primary or secondary focal point can access
    return delegation.focalPointId === userId || delegation.secondaryFocalId === userId;
  }

  async canModify(userId: string, delegationId: string): Promise<boolean> {
    // Same as canAccess but delegation must be ACTIVE
    const delegation = await this.db.delegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) return false;
    if (delegation.status !== "ACTIVE") return false;

    return delegation.focalPointId === userId || delegation.secondaryFocalId === userId;
  }
}
```

---

## 11. Performance Requirements

### 11.1 Registration Throughput Targets

| Metric                    | Target      | Description                                                              |
| ------------------------- | ----------- | ------------------------------------------------------------------------ |
| Self-service registration | 1,000/hour  | Peak registration rate during high-demand events                         |
| Focal point registration  | 500/hour    | Per focal point, during delegation rush periods                          |
| Overall system throughput | 5,000/hour  | Combined across all entry points, all tenants                            |
| Registration form load    | < 2 seconds | Time to load and render dynamic registration form                        |
| Registration submission   | < 3 seconds | Time from submit to confirmation (includes duplicate + blacklist checks) |

### 11.2 Duplicate Check Latency

| Metric                       | Target    | Description                                 |
| ---------------------------- | --------- | ------------------------------------------- |
| Single registration check    | < 500ms   | Inline check during registration submission |
| Exact match (passport/email) | < 50ms    | Indexed lookup, should be near-instant      |
| Fuzzy name matching          | < 400ms   | pg_trgm + application-level scoring         |
| Cross-event detection        | < 1,000ms | Queries across multiple event datasets      |
| Bulk import per-row check    | < 200ms   | Optimized for batch processing with caching |

### 11.3 Bulk Import Processing Rate

| Metric              | Target       | Description                                                |
| ------------------- | ------------ | ---------------------------------------------------------- |
| Row processing rate | 100 rows/sec | Including validation, duplicate check, and record creation |
| 1,000 row import    | < 15 seconds | Small import completed quickly                             |
| 10,000 row import   | < 2 minutes  | Large import within acceptable time                        |
| File upload         | < 5 seconds  | For 10MB file                                              |
| Validation phase    | < 30 seconds | For 10,000 rows                                            |
| Undo operation      | < 30 seconds | For 10,000 row rollback                                    |

### 11.4 Quota Query Performance

| Metric                   | Target     | Description                               |
| ------------------------ | ---------- | ----------------------------------------- |
| Delegation quota lookup  | < 50ms     | Single delegation quota check             |
| Event-wide quota summary | < 200ms    | Aggregated quota across all delegations   |
| Quota dashboard render   | < 1 second | Full quota overview for a delegation      |
| Concurrent quota check   | < 100ms    | With pessimistic locking under contention |

### 11.5 Concurrent Registration Handling

| Metric                          | Target                | Description                        |
| ------------------------------- | --------------------- | ---------------------------------- |
| Concurrent registrations        | 100 simultaneous      | Per event, without data corruption |
| Optimistic lock retry success   | 99% within 3 attempts | For quota enforcement              |
| Database connection pool        | 20 connections        | Per service instance               |
| SSE connections (bulk progress) | 50 simultaneous       | Per bulk operation                 |

---

## 12. Open Questions & Decisions

| #   | Question                                    | Context                                                                                                                                                                             | Options                                                                                                         | Status |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | **Duplicate detection ML enhancement**      | Current algorithm uses rule-based scoring. ML could improve accuracy by learning from admin merge/dismiss decisions.                                                                | a) Keep rule-based (simpler, explainable) b) Add ML layer on top of rules c) Hybrid: ML suggests, rules enforce | Open   |
| 2   | **Cross-event duplicate detection**         | Currently supported but performance implications for tenants with many concurrent events.                                                                                           | a) Always on b) Opt-in per event c) Background batch process only                                               | Open   |
| 3   | **Bulk import field mapping templates**     | Focal points and admins often import files with the same column structure. Saving and reusing mapping templates would save time.                                                    | a) Save per-user templates b) Save per-event templates c) Global template library                               | Open   |
| 4   | **Waitlist notification preferences**       | Participants may prefer SMS, email, or push notifications for waitlist updates. Current system uses email only.                                                                     | a) Email only (simple) b) Email + SMS c) Full preference system (email/SMS/push)                                | Open   |
| 5   | **Delegation hierarchy (sub-delegations)**  | Some large delegations have sub-groups (e.g., Ministry of Foreign Affairs, Ministry of Defense) that want separate focal points and quota allocations within the parent delegation. | a) Flat structure only b) One level of nesting c) Full tree hierarchy                                           | Open   |
| 6   | **Offline registration support**            | Some events occur in venues with unreliable internet. Focal points may need to register participants offline and sync later.                                                        | a) Online only b) Progressive web app with offline queue c) Dedicated mobile app with sync                      | Open   |
| 7   | **Photo similarity in duplicate detection** | Facial recognition could enhance duplicate detection, especially for aliases with different names but same person.                                                                  | a) No facial recognition (privacy concerns) b) Opt-in with consent c) Admin-only tool                           | Open   |
| 8   | **Bulk import conflict resolution**         | When a bulk import row conflicts with an existing record (e.g., same email), the current options are SKIP, FLAG, or OVERWRITE. Should there be a merge option?                      | a) Current options sufficient b) Add MERGE option c) Row-by-row conflict resolution UI                          | Open   |
| 9   | **Waitlist position visibility**            | Currently participants can see their exact position. Some organizers may prefer to show only approximate position or just "waitlisted" status.                                      | a) Exact position (current) b) Approximate range c) Configurable per event                                      | Open   |
| 10  | **Registration expiry**                     | Should draft or submitted registrations expire if not completed within a time window?                                                                                               | a) No expiry b) Configurable expiry per event c) Expiry with reminder notifications                             | Open   |

---

## Appendix

### A. Glossary

| Term                          | Definition                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accreditation**             | The formal process of verifying and approving a participant's credentials for event access, resulting in issuance of an event badge                                   |
| **Blacklist**                 | A security watchlist of individuals, organizations, or countries whose registrations should be flagged or blocked                                                     |
| **Bulk Operation**            | A batch action applied to multiple participant records simultaneously, such as import, status change, or export                                                       |
| **Delegation**                | A group of participants from a single organization or country, managed collectively by a focal point                                                                  |
| **Duplicate Candidate**       | A pair of participant records identified by the duplicate detection engine as potentially representing the same individual                                            |
| **Focal Point**               | An authorized representative (typically embassy official or organizational coordinator) who manages a delegation's registration process                               |
| **Merge**                     | The process of combining two duplicate participant records into a single surviving record, preserving selected field values from each                                 |
| **Optimistic Locking**        | A concurrency control strategy where conflicting updates are detected at write time rather than prevented with locks, using version checks                            |
| **Participant Type**          | A classification category for event attendees (e.g., Head of State, Minister, Delegate, Observer, Media, Staff) that determines quota allocation and workflow routing |
| **Quota**                     | The maximum number of participants of a given type that a delegation or event can register                                                                            |
| **Registration Code**         | A unique human-readable identifier assigned to each registration (e.g., REG-2026-0089) for participant tracking                                                       |
| **Registration Pipeline**     | The shared processing path through which all registrations flow: validation, duplicate detection, blacklist screening, and workflow entry                             |
| **Replacement**               | A delegation-level operation where an approved participant is swapped for a new registrant, maintaining quota counts                                                  |
| **Self-Service Registration** | A registration initiated by the participant themselves through a public form link, without focal point involvement                                                    |
| **Snapshot**                  | A JSON capture of pre-operation state used to enable undo/rollback of bulk operations                                                                                 |
| **State Machine**             | The formal model defining all valid participant statuses and the transitions between them                                                                             |
| **Waitlist**                  | A priority-ordered queue of participants waiting for registration slots to become available when event quotas are full                                                |
| **Waitlist Promotion**        | The process of moving a waitlisted participant to active registration status when a slot becomes available                                                            |

### B. References

| Reference                            | Description                                                   |
| ------------------------------------ | ------------------------------------------------------------- |
| Module 01: Data Model Foundation     | Core entity definitions and tenant model                      |
| Module 02: Dynamic Schema Engine     | Custom field definitions and validation rules                 |
| Module 03: Visual Form Designer      | FormTemplate definitions used for registration form rendering |
| Module 04: Workflow Engine           | Multi-step approval pipeline that registrations enter         |
| Module 05: Security & Access Control | Authentication, authorization, and audit logging              |
| Module 07: API & Integration Layer   | API gateway and endpoint exposure standards                   |
| Module 10: Event Operations Center   | On-site check-in and badge collection                         |
| Module 11: Logistics & Venue         | Accommodation and transport integration                       |
| Module 14: Content & Documents       | Email templates, notifications, and document management       |
| Module 16: Participant Experience    | Participant-facing portal and status tracking                 |
| SYSTEM_DESIGN.md Section 12.2        | Delegation Management Portal source specification             |
| SYSTEM_DESIGN.md Section 12.6        | Bulk Operations Center source specification                   |
| SYSTEM_DESIGN.md Section 12.12       | Duplicate Detection & Blacklist source specification          |
| SYSTEM_DESIGN.md Section 12.20       | Waitlist Management source specification                      |

### C. Participant Status Transition Catalog

The following catalog documents every participant status with its valid transitions, triggers, and side effects.

| #   | From Status           | To Status            | Trigger                                | Conditions                                                         | Side Effects                                                                                                                                 |
| --- | --------------------- | -------------------- | -------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `DRAFT`               | `SUBMITTED`          | Participant submits registration form  | All required fields populated; form validation passes              | Trigger duplicate detection; trigger blacklist screening; enter workflow if clear                                                            |
| 2   | `SUBMITTED`           | `IN_REVIEW`          | Validator picks up registration        | Participant is at current workflow step; validator has permission  | Lock registration from other validators; start review timer                                                                                  |
| 3   | `IN_REVIEW`           | `APPROVED`           | Validator approves                     | All required documents uploaded; validator has approval permission | Create Approval record; update DelegationQuota (pending→used); send approval notification; trigger badge readiness check                     |
| 4   | `IN_REVIEW`           | `REJECTED`           | Validator rejects                      | Rejection reason provided; validator has rejection permission      | Create Approval record (rejection); update DelegationQuota (decrement pending); send rejection notification; trigger waitlist auto-promotion |
| 5   | `IN_REVIEW`           | `RETURNED`           | Validator requests more info           | Return reason and required actions specified                       | Create return note; send notification with required actions; set response deadline                                                           |
| 6   | `RETURNED`            | `SUBMITTED`          | Participant resubmits                  | Required information/documents provided                            | Re-enter workflow at the step that returned it                                                                                               |
| 7   | `APPROVED`            | `PRINTED`            | Badge printed                          | Badge template rendered; print job completed                       | Log print event; record badge serial number                                                                                                  |
| 8   | `PRINTED`             | `COLLECTED`          | Badge collected at desk                | Identity verified at collection point; photo match confirmed       | Log collection event with timestamp; mark as check-in ready                                                                                  |
| 9   | `SUBMITTED`           | `WAITLISTED`         | Quota exceeded at time of registration | Quota full for participant type                                    | Create WaitlistEntry; send waitlist notification; record queue position                                                                      |
| 10  | `WAITLISTED`          | `SUBMITTED`          | Promoted from waitlist                 | Slot available; participant confirmed promotion within deadline    | Update WaitlistEntry to PROMOTED; enter workflow at Step 1; recalculate waitlist positions                                                   |
| 11  | `SUBMITTED`           | `FLAGGED`            | Blacklist or duplicate match           | Blacklist match confidence >= threshold OR duplicate score >= 0.90 | Do NOT enter workflow; alert admin; create review queue entry                                                                                |
| 12  | `FLAGGED`             | `SUBMITTED`          | Admin override (allow)                 | Admin provides override reason; admin has override permission      | Log override with reason; enter workflow at Step 1                                                                                           |
| 13  | `FLAGGED`             | `REJECTED`           | Admin confirms block                   | Admin confirms blacklist/duplicate block                           | Send rejection notification; log block confirmation                                                                                          |
| 14  | `APPROVED`            | `WITHDRAWN`          | Participant withdraws                  | Withdrawal request submitted                                       | Decrement DelegationQuota usedQuota; trigger waitlist auto-promotion; cancel pending logistics                                               |
| 15  | `SUBMITTED`           | `WITHDRAWN`          | Participant withdraws                  | Withdrawal request submitted                                       | Decrement DelegationQuota pendingQuota; remove from workflow                                                                                 |
| 16  | `IN_REVIEW`           | `WITHDRAWN`          | Participant withdraws during review    | Withdrawal request submitted                                       | Decrement DelegationQuota pendingQuota; release validator lock; remove from workflow                                                         |
| 17  | `APPROVED`            | `REPLACED`           | Delegation replacement approved        | Replacement request approved by admin                              | ParticipantReplacement status→COMPLETED; notify focal point to register replacement; quota counts unchanged (swap); revoke any issued badge  |
| 18  | `WAITLISTED`          | `WITHDRAWN`          | Participant withdraws from waitlist    | Voluntary withdrawal                                               | Remove WaitlistEntry; recalculate positions; notify next in queue if position changes significantly                                          |
| 19  | `PROMOTED` (waitlist) | `EXPIRED` (waitlist) | Promotion deadline passed              | promotionDeadline < now() AND confirmedAt IS NULL                  | Revert participant to WAITLISTED or remove; trigger auto-promotion for next in queue; notify expired participant                             |

---

_This document is a living specification. All sections will be updated as implementation progresses and open questions are resolved._
