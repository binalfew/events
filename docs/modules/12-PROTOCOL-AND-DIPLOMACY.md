# Module 12: Protocol and Diplomacy

> **Module:** 12 - Protocol and Diplomacy
> **Version:** 1.0
> **Last Updated:** February 13, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md), [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md), [Module 09: Registration](./09-REGISTRATION-AND-ACCREDITATION.md)
> **Required By:** [Module 10: Event Operations](./10-EVENT-OPERATIONS-CENTER.md), [Module 16: Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)
> **Integrates With:** [Module 03: Forms](./03-VISUAL-FORM-DESIGNER.md), [Module 04: Workflow](./04-WORKFLOW-ENGINE.md), [Module 07: API](./07-API-AND-INTEGRATION-LAYER.md), [Module 08: UI/UX](./08-UI-UX-AND-FRONTEND.md), [Module 11: Logistics](./11-LOGISTICS-AND-VENUE.md), [Module 13: People](./13-PEOPLE-AND-WORKFORCE.md), [Module 14: Content](./14-CONTENT-AND-DOCUMENTS.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Domain Concepts](#14-domain-concepts)
   - 1.5 [Design Principles](#15-design-principles)
2. [Architecture](#2-architecture)
   - 2.1 [Protocol Management Architecture](#21-protocol-management-architecture)
   - 2.2 [Seating Engine Architecture](#22-seating-engine-architecture)
   - 2.3 [Bilateral Scheduling Pipeline](#23-bilateral-scheduling-pipeline)
   - 2.4 [Companion Program Subsystem](#24-companion-program-subsystem)
   - 2.5 [Gift Protocol Subsystem](#25-gift-protocol-subsystem)
   - 2.6 [Bounded Context Map](#26-bounded-context-map)
3. [Data Model](#3-data-model)
   - 3.1 [Protocol and Seating Models](#31-protocol-and-seating-models)
   - 3.2 [Bilateral Meeting Models](#32-bilateral-meeting-models)
   - 3.3 [Companion Program Models](#33-companion-program-models)
   - 3.4 [Gift Protocol Models](#34-gift-protocol-models)
   - 3.5 [Enhanced Models](#35-enhanced-models)
   - 3.6 [ER Diagram](#36-er-diagram)
   - 3.7 [Index Catalog](#37-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Protocol and Ranking APIs](#41-protocol-and-ranking-apis)
   - 4.2 [Seating Management APIs](#42-seating-management-apis)
   - 4.3 [Bilateral Meeting APIs](#43-bilateral-meeting-apis)
   - 4.4 [Companion Program APIs](#44-companion-program-apis)
   - 4.5 [Gift Protocol APIs](#45-gift-protocol-apis)
   - 4.6 [SSE Events](#46-sse-events)
   - 4.7 [Webhook Events](#47-webhook-events)
5. [Business Logic](#5-business-logic)
   - 5.1 [Protocol Rank Engine](#51-protocol-rank-engine)
   - 5.2 [Auto-Seating Algorithm](#52-auto-seating-algorithm)
   - 5.3 [Seating Conflict Resolution](#53-seating-conflict-resolution)
   - 5.4 [Bilateral Scheduling Algorithm](#54-bilateral-scheduling-algorithm)
   - 5.5 [Meeting Brief Generation](#55-meeting-brief-generation)
   - 5.6 [Companion Registration Lifecycle](#56-companion-registration-lifecycle)
   - 5.7 [Gift Allocation Engine](#57-gift-allocation-engine)
   - 5.8 [Welcome Package Assembly Pipeline](#58-welcome-package-assembly-pipeline)
   - 5.9 [Nameplate and Flag Generation](#59-nameplate-and-flag-generation)
   - 5.10 [Cultural Sensitivity Rules Engine](#510-cultural-sensitivity-rules-engine)
   - 5.11 [VIP Movement Coordination](#511-vip-movement-coordination)
6. [User Interface](#6-user-interface)
   - 6.1 [Visual Seating Chart Editor](#61-visual-seating-chart-editor)
   - 6.2 [Bilateral Meeting Dashboard](#62-bilateral-meeting-dashboard)
   - 6.3 [Bilateral Request Portal](#63-bilateral-request-portal)
   - 6.4 [Companion Program Interface](#64-companion-program-interface)
   - 6.5 [Gift Inventory Management Dashboard](#65-gift-inventory-management-dashboard)
   - 6.6 [Welcome Package Assembly Station](#66-welcome-package-assembly-station)
   - 6.7 [Protocol Rank Management Interface](#67-protocol-rank-management-interface)
   - 6.8 [Meeting Brief Preview](#68-meeting-brief-preview)
   - 6.9 [VIP Movement Tracker](#69-vip-movement-tracker)
   - 6.10 [Responsive and Mobile Views](#610-responsive-and-mobile-views)
7. [Integration Points](#7-integration-points)
   - 7.1 [Module Integration Map](#71-module-integration-map)
   - 7.2 [Event-Driven Integration](#72-event-driven-integration)
   - 7.3 [Integration Contracts](#73-integration-contracts)
8. [Configuration](#8-configuration)
   - 8.1 [Feature Flags](#81-feature-flags)
   - 8.2 [Protocol Ranking Configuration](#82-protocol-ranking-configuration)
   - 8.3 [Bilateral Scheduling Configuration](#83-bilateral-scheduling-configuration)
   - 8.4 [Gift Protocol Configuration](#84-gift-protocol-configuration)
   - 8.5 [Companion Program Configuration](#85-companion-program-configuration)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Seating Algorithm Tests](#91-seating-algorithm-tests)
   - 9.2 [Bilateral Scheduling Tests](#92-bilateral-scheduling-tests)
   - 9.3 [Conflict Resolution Tests](#93-conflict-resolution-tests)
   - 9.4 [Gift Allocation Tests](#94-gift-allocation-tests)
   - 9.5 [Companion Lifecycle Tests](#95-companion-lifecycle-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [Protocol Data Classification](#101-protocol-data-classification)
    - 10.2 [Diplomatic Sensitivity Controls](#102-diplomatic-sensitivity-controls)
    - 10.3 [Bilateral Meeting Confidentiality](#103-bilateral-meeting-confidentiality)
    - 10.4 [Gift Compliance Audit Trail](#104-gift-compliance-audit-trail)
    - 10.5 [Role-Based Access Matrix](#105-role-based-access-matrix)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Seating Algorithm Latency](#111-seating-algorithm-latency)
    - 11.2 [Bilateral Scheduling Throughput](#112-bilateral-scheduling-throughput)
    - 11.3 [Real-Time Update Propagation](#113-real-time-update-propagation)
    - 11.4 [PDF Generation Performance](#114-pdf-generation-performance)
    - 11.5 [Concurrent Editing Targets](#115-concurrent-editing-targets)
12. [Open Questions and Decisions](#12-open-questions-and-decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Protocol Rank Systems Catalog](#c-protocol-rank-systems-catalog)
  - D. [Seating Layout Templates](#d-seating-layout-templates)

---

## 1. Overview

### 1.1 Purpose

The Protocol and Diplomacy module manages the formal ceremonial, diplomatic, and hospitality functions required at high-level international summits, conferences, and diplomatic events. Diplomatic events follow strict protocol: heads of state are seated by seniority of service (longest-serving president first), countries follow alphabetical or rotational order (which shifts each summit), and bilateral meeting partners must not be adjacent to adversarial nations. Seating mistakes at the opening ceremony of an AU Summit could cause a diplomatic incident. The protocol module provides a rank-aware seating engine, a visual chart editor, bilateral meeting scheduling with brief generation, companion and spouse program management, and gift protocol compliance with welcome package assembly tracking.

This module is critical for organizations such as the African Union, United Nations, and regional economic communities where protocol errors carry diplomatic consequences. It transforms what is traditionally managed on whiteboards, spreadsheets, and paper-based tracking into a structured, auditable, real-time digital system.

### 1.2 Scope

The module encompasses four primary domains:

| Domain                   | Description                                        | Key Capabilities                                                                                                                                             |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Protocol and Seating** | Diplomatic precedence ranking and ceremony seating | Rank engines (seniority, alphabetical, rotational, custom), auto-seating with conflict rules, visual drag-and-drop editor, nameplate and flag printing       |
| **Bilateral Meetings**   | Private meeting scheduling between delegations     | Request and confirmation workflow, auto-scheduling with room and interpreter co-scheduling, priority-based conflict resolution, meeting brief PDF generation |
| **Companion Programs**   | Spouse and accompanying persons management         | Registration via delegation portal, activity program scheduling with sign-up and capacity tracking, separate badge generation, shared logistics              |
| **Gift Protocol**        | Diplomatic gift compliance and welcome packages    | Gift inventory with value tracking, protocol-level allocation rules, threshold compliance, welcome package definition, assembly line workflow with QA        |

**Out of Scope:**

- Catering menu planning (Module 11: Logistics)
- Transport vehicle dispatch (Module 11: Logistics)
- Badge printing hardware integration (Module 10: Event Operations)
- Interpreter roster management (Module 13: People and Workforce)
- Security screening and access control (Module 05: Security)

### 1.3 Key Personas

| Persona                   | Role                                                             | Primary Actions                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chief of Protocol**     | Senior diplomatic officer overseeing all protocol functions      | Approves seating arrangements, resolves diplomatic conflicts, authorizes gift allocations above threshold, signs off on bilateral schedules |
| **Protocol Officer**      | Day-to-day protocol operations staff                             | Manages protocol ranks, operates seating editor, processes bilateral requests, generates meeting briefs, coordinates nameplate printing     |
| **Focal Point**           | Delegation representative managing their country's participation | Submits bilateral meeting requests, registers companions, views delegation schedule, accepts or declines meeting invitations                |
| **Companion Coordinator** | Staff managing the spouse and accompanying persons program       | Creates activity programs, manages sign-ups, coordinates companion transport and badges, tracks attendance                                  |
| **Gift Manager**          | Staff responsible for gift inventory and welcome packages        | Manages gift item inventory, creates package definitions, oversees assembly workflow, tracks delivery status                                |
| **Assembly Staff**        | Logistics workers assembling welcome packages                    | Follows packing lists, marks items as assembled, passes to QA check                                                                         |
| **VIP Liaison Officer**   | Dedicated staff assigned to high-priority delegations            | Monitors VIP movement schedules, coordinates motorcade timing, manages last-minute schedule changes                                         |

### 1.4 Domain Concepts

**Protocol Precedence** -- The formal ordering of nations and dignitaries at diplomatic events. Precedence determines seating position, speaking order, motorcade sequence, and receiving line placement. Multiple ranking systems exist:

- **Seniority System**: Longest-serving head of state receives highest rank. Used by the African Union for formal summit sessions.
- **Alphabetical System**: Countries ordered alphabetically by name in the event's working language. Order changes depending on whether English, French, or Arabic is the primary language.
- **Rotational System**: Starting position shifts each summit edition. If Kenya was first at the 37th summit, the next alphabetical country begins at the 38th.
- **Custom System**: Manual rank assignment for special events, award ceremonies, or host-determined ordering.

**Diplomatic Immunity and Sensitivity** -- Certain delegations have active disputes or severed relations. The system must enforce seating distance rules (e.g., Eritrea and Ethiopia cannot be adjacent) and prevent bilateral scheduling between parties who have explicitly declined engagement.

**Seating Protocol** -- Physical arrangement of dignitaries follows precise rules. The host nation occupies the center position facing the entrance. Rank 1 sits to the host's right, Rank 2 to the left, alternating outward. Behind-the-chair positions accommodate advisors from the same delegation.

**Bilateral Diplomacy** -- Private meetings between two delegations, typically 30 minutes, requiring room assignment, interpreter availability, and transport coordination. At a full AU Summit, 55 member states may generate 200+ bilateral meeting requests in a 4-day window.

**Companion Program** -- Structured activities for spouses, children, and accompanying persons. Companions receive separate badges with limited zone access, share the delegate's hotel and transport, but follow their own activity schedule.

**Gift Protocol Compliance** -- Many diplomatic organizations impose value thresholds on official gifts (e.g., $250 USD). Gifts above the threshold require approval. Gifts are allocated by protocol level (heads of state receive more items than delegates).

### 1.5 Design Principles

| Principle                     | Application                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Diplomatic Accuracy**       | Protocol rankings must be verifiable and auditable. Every rank change, seating swap, and gift allocation is logged with timestamp and actor.                     |
| **Conflict-Aware Scheduling** | All auto-assignment algorithms check diplomatic conflict rules before placement. No arrangement is finalized without conflict validation.                        |
| **Real-Time Collaboration**   | Multiple protocol officers may edit seating arrangements simultaneously. SSE-driven updates propagate changes in real-time to prevent conflicting edits.         |
| **Undo and Version Control**  | Seating arrangements maintain version history. Any change can be reverted to a previous state, essential when last-minute VIP arrivals require reshuffling.      |
| **Print-Ready Output**        | Nameplates, flags, packing lists, and meeting briefs must generate print-ready PDFs using @react-pdf/renderer with correct formatting for physical production.   |
| **Cultural Sensitivity**      | The system accommodates religious observances, dietary requirements, and cultural taboos that affect seating, gift selection, and companion activities.          |
| **Multi-Tenant Isolation**    | All protocol data is scoped by tenantId and eventId. One organization's diplomatic conflict rules never leak to another.                                         |
| **Graceful Degradation**      | If the auto-seating algorithm cannot satisfy all constraints, it returns the best partial solution with a list of unresolved violations for manual intervention. |

---

## 2. Architecture

### 2.1 Protocol Management Architecture

The Protocol and Diplomacy module is composed of four loosely coupled subsystems that share common infrastructure for tenant isolation, event scoping, and audit logging.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROTOCOL AND DIPLOMACY MODULE                         │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   Protocol &     │  │    Bilateral     │  │   Companion      │          │
│  │   Seating        │  │    Meeting       │  │   Program        │          │
│  │   Subsystem      │  │    Scheduler     │  │   Subsystem      │          │
│  │                  │  │                  │  │                  │          │
│  │  - Rank Engine   │  │  - Request Mgmt  │  │  - Registration  │          │
│  │  - Seat Solver   │  │  - Auto-Schedule │  │  - Activities    │          │
│  │  - Conflict Mgr  │  │  - Room Assign   │  │  - Sign-ups     │          │
│  │  - Layout Editor │  │  - Brief Gen     │  │  - Badge Gen     │          │
│  │  - Print Queue   │  │  - Interpreter   │  │  - Attendance    │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                     │                     │
│  ┌────────┴─────────────────────┴─────────────────────┴─────────┐          │
│  │                   Shared Protocol Services                    │          │
│  │                                                               │          │
│  │  ┌─────────────┐ ┌──────────────┐ ┌────────────────────┐     │          │
│  │  │ Audit Trail │ │ Cultural     │ │ VIP Movement       │     │          │
│  │  │ Service     │ │ Sensitivity  │ │ Coordinator        │     │          │
│  │  │             │ │ Engine       │ │                    │     │          │
│  │  └─────────────┘ └──────────────┘ └────────────────────┘     │          │
│  └───────────────────────────┬───────────────────────────────────┘          │
│                              │                                              │
│  ┌───────────────────────────┴───────────────────────────────────┐          │
│  │                    Gift Protocol Subsystem                     │          │
│  │                                                               │          │
│  │  ┌─────────────┐ ┌──────────────┐ ┌────────────────────┐     │          │
│  │  │ Gift        │ │ Allocation   │ │ Welcome Package    │     │          │
│  │  │ Inventory   │ │ Engine       │ │ Assembly Pipeline  │     │          │
│  │  └─────────────┘ └──────────────┘ └────────────────────┘     │          │
│  └───────────────────────────────────────────────────────────────┘          │
│                                                                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────┴─────┐    ┌──────┴──────┐    ┌─────┴──────┐
              │ Module 01 │    │ Module 09   │    │ Module 11  │
              │ Data Model│    │ Registration│    │ Logistics  │
              │ Foundation│    │ Accred.     │    │ Venue      │
              └───────────┘    └─────────────┘    └────────────┘
```

**Component Responsibilities:**

| Component                   | Responsibility                                                     | Key Dependencies                                |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Rank Engine                 | Computes and maintains protocol precedence for all ranking systems | Participant data from Module 09                 |
| Seat Solver                 | Constraint-satisfaction algorithm for auto-seating                 | Rank Engine, Conflict Manager                   |
| Conflict Manager            | Maintains and enforces diplomatic conflict rules                   | SeatingConflictRule store                       |
| Layout Editor               | Visual drag-and-drop seating interface                             | @dnd-kit, React 18                              |
| Print Queue                 | Generates nameplates, flags, and table cards                       | @react-pdf/renderer, Badge Print infrastructure |
| Request Management          | CRUD and lifecycle for bilateral requests                          | Focal Point portal                              |
| Auto-Schedule               | Constraint-based meeting-to-slot-to-room assignment                | Room inventory, Interpreter availability        |
| Brief Generation            | PDF meeting briefs per delegation                                  | @react-pdf/renderer                             |
| Companion Registration      | Companion person CRUD linked to primary participants               | Delegation portal, Badge system                 |
| Activity Management         | Activity CRUD, capacity tracking, sign-up workflow                 | Venue room inventory                            |
| Gift Inventory              | Gift item stock management                                         | Procurement data                                |
| Allocation Engine           | Protocol-level gift matching with threshold compliance             | Protocol ranks                                  |
| Assembly Pipeline           | Packing list generation, assembly tracking, QA workflow            | Print infrastructure                            |
| Audit Trail Service         | Immutable log of all protocol changes                              | Shared across all subsystems                    |
| Cultural Sensitivity Engine | Validates arrangements against cultural and religious rules        | Configuration store                             |
| VIP Movement Coordinator    | Schedules and tracks VIP transport between events                  | Module 11 Transport                             |

### 2.2 Seating Engine Architecture

The seating engine uses a constraint-satisfaction approach to assign participants to seats while respecting protocol rank, diplomatic conflicts, and layout geometry.

```
┌─────────────────────────────────────────────────────────────────┐
│                     SEATING ENGINE PIPELINE                      │
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐      │
│  │ Input    │    │ Constraint   │    │ Solver            │      │
│  │ Assembly │───>│ Builder      │───>│                   │      │
│  │          │    │              │    │ 1. Rank-ordered   │      │
│  │ - Layout │    │ - Hard:      │    │    placement      │      │
│  │ - Ranks  │    │   conflict   │    │ 2. Conflict check │      │
│  │ - Rules  │    │   rules      │    │ 3. Swap repair    │      │
│  │ - Guests │    │ - Soft:      │    │ 4. Backtrack if   │      │
│  │          │    │   preference │    │    needed         │      │
│  └──────────┘    └──────────────┘    └─────────┬─────────┘      │
│                                                │                 │
│                                      ┌─────────┴─────────┐      │
│                                      │ Solution          │      │
│                                      │ Validator         │      │
│                                      │                   │      │
│                                      │ - All hard        │      │
│                                      │   constraints met?│      │
│                                      │ - Score soft      │      │
│                                      │   preferences     │      │
│                                      │ - Return result   │      │
│                                      │   + violations    │      │
│                                      └─────────┬─────────┘      │
│                                                │                 │
│                              ┌─────────────────┴──────────┐     │
│                              │                            │     │
│                       ┌──────┴──────┐              ┌──────┴───┐ │
│                       │ SUCCESS     │              │ PARTIAL  │ │
│                       │ All seated, │              │ Returns  │ │
│                       │ no conflicts│              │ best fit │ │
│                       │             │              │ + list of│ │
│                       │ -> Preview  │              │ violated │ │
│                       │    for admin│              │ rules    │ │
│                       └─────────────┘              └──────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Layout Geometry Models:**

| Layout Type   | Geometry                                    | Seat Numbering                               | Behind-Chair Support |
| ------------- | ------------------------------------------- | -------------------------------------------- | -------------------- |
| BOARDROOM     | Rectangular table, seats on both long sides | Left-to-right, alternating sides from center | Yes, 1-2 per seat    |
| U_SHAPE       | Open rectangle, seats on outer edge         | Clockwise from head position                 | Yes, 1-2 per seat    |
| HOLLOW_SQUARE | Closed rectangle, seats on all four sides   | Head side first, then clockwise              | Yes, 1-2 per seat    |
| THEATER       | Rows facing stage, no tables                | Row-column (A1, A2, B1, B2)                  | No                   |
| BANQUET       | Round tables, typically 8-12 seats each     | Table number + seat number                   | No                   |
| CLASSROOM     | Rows with tables facing front               | Row-column                                   | No                   |

### 2.3 Bilateral Scheduling Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                  BILATERAL SCHEDULING PIPELINE                       │
│                                                                      │
│  REQUEST PHASE              MATCHING PHASE         SCHEDULING PHASE  │
│                                                                      │
│  ┌───────────┐             ┌──────────────┐       ┌──────────────┐  │
│  │ Focal Pt  │  submit     │ Counterpart  │ both  │ Auto-        │  │
│  │ Request   │────────────>│ Notification │─────> │ Scheduler    │  │
│  │ Portal    │             │ & Response   │confirm│              │  │
│  └───────────┘             └──────┬───────┘       │ 1. Sort by   │  │
│                                   │                │    priority  │  │
│                            decline│                │ 2. Find slot │  │
│                                   v                │ 3. Find room │  │
│                            ┌──────────────┐       │ 4. Check     │  │
│                            │ DECLINED     │       │    interp.   │  │
│                            │ Notify       │       │ 5. Assign    │  │
│                            │ requester    │       └──────┬───────┘  │
│                            └──────────────┘              │          │
│                                                          v          │
│  EXECUTION PHASE                                ┌──────────────┐    │
│                                                 │ SCHEDULED    │    │
│  ┌───────────┐    ┌──────────────┐             │ Notify both  │    │
│  │ Meeting   │    │ Brief Gen    │             │ parties      │    │
│  │ Execution │<───│ PDF per      │<────────────│              │    │
│  │ Tracking  │    │ delegation   │             └──────────────┘    │
│  └─────┬─────┘    └──────────────┘                                  │
│        │                                                             │
│        v                                                             │
│  ┌───────────┐                                                      │
│  │ COMPLETED │                                                      │
│  │ Feedback  │                                                      │
│  └───────────┘                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Scheduling Constraints:**

| Constraint               | Type             | Description                                               |
| ------------------------ | ---------------- | --------------------------------------------------------- |
| No double-booking        | Hard             | Neither party may have another meeting in the same slot   |
| Room capacity            | Hard             | Room must accommodate both delegations                    |
| Interpreter availability | Hard (if needed) | Required language interpreter must be free                |
| Preferred time window    | Soft             | Parties' preferred dates and times                        |
| Priority ordering        | Soft             | CRITICAL meetings scheduled before LOW                    |
| Room proximity           | Soft             | Back-to-back meetings in nearby rooms preferred           |
| Buffer time              | Soft             | 15-minute gap between consecutive meetings for same party |

### 2.4 Companion Program Subsystem

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPANION PROGRAM SUBSYSTEM                     │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐            │
│  │ Registration Flow   │     │ Activity Program     │            │
│  │                     │     │                      │            │
│  │ Focal Point         │     │ Coordinator creates  │            │
│  │   adds companion    │     │   activities with    │            │
│  │   to delegate       │     │   capacity, dates,   │            │
│  │        │            │     │   dress code, cost   │            │
│  │        v            │     │        │             │            │
│  │ Admin validates     │     │        v             │            │
│  │   passport, photo   │     │ Companions sign up   │            │
│  │        │            │     │   (capacity check)   │            │
│  │        v            │     │        │             │            │
│  │ Badge generated     │     │        v             │            │
│  │   (COMPANION type,  │     │ Coordinator confirms │            │
│  │    limited zones)   │     │   attendance list    │            │
│  │        │            │     │        │             │            │
│  │        v            │     │        v             │            │
│  │ Shared logistics:   │     │ Day-of: check-in     │            │
│  │   hotel, transport  │     │   at meeting point   │            │
│  └─────────────────────┘     └─────────────────────┘            │
│                                                                  │
│  Shared Services:                                                │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────────┐         │
│  │ Badge Gen  │ │ Transport    │ │ Meal Plan          │         │
│  │ (Module 10)│ │ (Module 11)  │ │ Tracking           │         │
│  └────────────┘ └──────────────┘ └────────────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.5 Gift Protocol Subsystem

```
┌─────────────────────────────────────────────────────────────────┐
│                    GIFT PROTOCOL SUBSYSTEM                       │
│                                                                  │
│  INVENTORY           ALLOCATION           ASSEMBLY               │
│  ┌──────────────┐   ┌──────────────┐    ┌──────────────────┐    │
│  │ Gift Items   │   │ Protocol     │    │ Package          │    │
│  │              │   │ Level Match  │    │ Definition       │    │
│  │ - Name       │   │              │    │                  │    │
│  │ - Category   │   │ HEAD_OF_STATE│    │ "VIP Package"    │    │
│  │ - Value      │──>│   -> Medal   │──> │  - Medal         │    │
│  │ - Stock qty  │   │   -> Book    │    │  - Yearbook      │    │
│  │ - Allocated  │   │   -> Crystal │    │  - City guide    │    │
│  └──────────────┘   │              │    │  - SIM card      │    │
│                     │ MINISTER     │    │  - Badge holder  │    │
│                     │   -> Medal   │    └────────┬─────────┘    │
│                     │   -> Book    │             │              │
│                     │              │    ┌────────┴─────────┐    │
│                     │ AMBASSADOR   │    │ Assembly Line    │    │
│                     │   -> Book    │    │                  │    │
│                     │              │    │ PENDING          │    │
│                     │ DELEGATE     │    │   -> ASSEMBLED   │    │
│                     │   -> (none)  │    │   -> QA_CHECKED  │    │
│                     └──────────────┘    │   -> DELIVERED   │    │
│                                         └──────────────────┘    │
│                                                                  │
│  Compliance Layer:                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ - Gift value threshold check ($250 USD default)          │   │
│  │ - Above-threshold requires Chief of Protocol approval    │   │
│  │ - Stock availability validated before allocation         │   │
│  │ - Full audit trail of all allocations and deliveries     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.6 Bounded Context Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BOUNDED CONTEXT MAP                              │
│                                                                          │
│  ┌─────────────┐         ┌──────────────┐         ┌──────────────┐      │
│  │ Module 09   │ country │ Protocol &   │ rank    │ Module 10    │      │
│  │ Registration│────────>│ Seating      │────────>│ Event Ops    │      │
│  │             │ type    │ Context      │ seating │ (print queue)│      │
│  │ Participant │         │              │         │              │      │
│  │ data        │         │ ProtocolRank │         │ Badge printer│      │
│  └──────┬──────┘         │ SeatAssign.  │         └──────────────┘      │
│         │                │ ConflictRule │                                │
│         │                └──────┬───────┘                                │
│         │                       │                                        │
│         │     ┌─────────────────┴────────────────┐                      │
│         │     │                                  │                      │
│         v     v                                  v                      │
│  ┌──────────────┐         ┌──────────────┐  ┌──────────────┐           │
│  │ Bilateral    │ room    │ Module 11    │  │ Module 13    │           │
│  │ Meeting      │────────>│ Logistics    │  │ People       │           │
│  │ Context      │         │              │  │              │           │
│  │              │ transport│ Rooms,       │  │ Interpreter  │           │
│  │ Request,Slot │<────────│ Vehicles     │  │ availability │           │
│  │ Room, Brief  │         └──────────────┘  └──────────────┘           │
│  └──────────────┘                                                       │
│                                                                          │
│  ┌──────────────┐         ┌──────────────┐                              │
│  │ Companion    │ badge   │ Gift         │ delivery                     │
│  │ Program      │────────>│ Protocol     │────────> Hotel / Reg Desk    │
│  │ Context      │         │ Context      │                              │
│  │              │ delegate│              │ stock                        │
│  │ Registration │<────────│ GiftItem     │<──────── Procurement         │
│  │ Activity     │ link    │ Allocation   │                              │
│  │ Signup       │         │ WelcomePkg   │                              │
│  └──────────────┘         └──────────────┘                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Protocol and Seating Models

The protocol and seating data model provides rank-aware seating with conflict enforcement. The existing SeatingArrangement and SeatAssignment models are retained, with the addition of a protocol ranking system and conflict rule store.

```prisma
model ProtocolRank {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  countryCode     String   // "KEN", "ETH", "NGA"
  countryName     String
  rank            Int      // 1 = highest precedence
  rankingSystem   String   // "SENIORITY", "ALPHABETICAL", "ROTATIONAL", "CUSTOM"
  headOfStateTitle String? // "President", "Prime Minister", "King"
  headOfStateName String?
  inOfficeSince   DateTime? // For seniority-based ranking
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, eventId, countryCode])
  @@index([eventId, rank])
}

model SeatingConflictRule {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  countryA    String   // Country code
  countryB    String   // Country code
  ruleType    String   // "NO_ADJACENT", "MINIMUM_DISTANCE", "SAME_TABLE_OK"
  distance    Int?     // Minimum seats apart (for MINIMUM_DISTANCE)
  reason      String?
  createdBy   String
  createdAt   DateTime @default(now())

  @@unique([tenantId, eventId, countryA, countryB])
}

model SeatingArrangement {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  meetingId   String
  name        String
  layoutType  String   // THEATER, BOARDROOM, BANQUET, U_SHAPE, CLASSROOM, HOLLOW_SQUARE
  layout      Json     // Visual layout data (table positions, shapes, dimensions)
  totalSeats  Int
  assignedSeats Int    @default(0)
  isFinalized Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  seats       SeatAssignment[]

  @@unique([tenantId, eventId, meetingId, name])
}

model SeatAssignment {
  id            String   @id @default(cuid())
  arrangementId String
  arrangement   SeatingArrangement @relation(fields: [arrangementId], references: [id], onDelete: Cascade)
  participantId String?
  seatLabel     String
  tableNumber   Int?
  seatNumber    Int?
  positionX     Float?
  positionY     Float?
  isReserved    Boolean  @default(false)
  reservedFor   String?
  protocolRank  Int?
  nameplatePrinted Boolean @default(false)

  @@unique([arrangementId, seatLabel])
  @@index([arrangementId, protocolRank])
}
```

### 3.2 Bilateral Meeting Models

At diplomatic summits, delegation leaders request private meetings with other delegations. At the AU Summit, 55 member states may generate 200+ bilateral meeting requests in a 4-day window.

```prisma
enum BilateralStatus {
  REQUESTED
  COUNTERPART_NOTIFIED
  BOTH_CONFIRMED
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  DECLINED
  CANCELLED
}

enum BilateralPriority {
  CRITICAL  // Head of State level
  HIGH      // Minister level
  MEDIUM    // Ambassador level
  LOW       // Delegate level
}

model BilateralRequest {
  id              String            @id @default(cuid())
  tenantId        String
  eventId         String
  requestingParty String
  requestedParty  String
  requestedBy     String
  status          BilateralStatus
  priority        BilateralPriority
  duration        Int               // Minutes (default 30)
  topic           String?
  notes           String?
  interpreterNeeded Boolean         @default(false)
  languages       String[]          // Required interpretation languages

  slotId          String?
  slot            BilateralSlot?    @relation(fields: [slotId], references: [id])
  roomId          String?
  room            BilateralRoom?    @relation(fields: [roomId], references: [id])
  confirmedByRequester Boolean      @default(false)
  confirmedByRequested Boolean      @default(false)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([eventId, status])
  @@index([eventId, requestingParty])
  @@index([eventId, requestedParty])
  @@index([eventId, priority])
}

model BilateralSlot {
  id        String   @id @default(cuid())
  eventId   String
  date      DateTime @db.Date
  startTime String   // "09:00"
  endTime   String   // "09:30"
  createdAt DateTime @default(now())

  requests  BilateralRequest[]

  @@unique([eventId, date, startTime])
  @@index([eventId, date])
}

model BilateralRoom {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  name        String   // "Bilateral Room 1", "VIP Meeting Room"
  building    String?
  floor       String?
  capacity    Int
  amenities   String[] // ["Interpretation booth", "Video conferencing", "Refreshments"]
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  requests    BilateralRequest[]

  @@unique([tenantId, eventId, name])
}
```

### 3.3 Companion Program Models

Diplomatic summits and major conferences include programs for accompanying persons. A Minister may bring a spouse, an assistant, and two children. They need accreditation, transport, and activities but are not in the approval workflow.

```prisma
model CompanionRegistration {
  id                   String   @id @default(cuid())
  tenantId             String
  tenant               Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId              String
  event                Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  primaryParticipantId String
  primaryParticipant   Participant @relation(fields: [primaryParticipantId], references: [id], onDelete: Cascade)

  firstName         String
  familyName        String
  relationship      CompanionRelationship
  gender            String?
  dateOfBirth       DateTime?
  nationalityId     String?
  passportNumber    String?
  email             String?
  phone             String?
  customData        Json     @default("{}")
  photoUrl          String?

  // Badge & status
  registrationCode  String   @unique
  status            String   // REGISTERED, APPROVED, BADGE_PRINTED, COLLECTED, CANCELLED
  badgeTemplateId   String?  // Separate badge template for companions

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  activitySignups CompanionActivitySignup[]

  @@index([eventId, primaryParticipantId])
  @@index([status])
}

enum CompanionRelationship {
  SPOUSE
  CHILD
  PARENT
  ASSISTANT
  AIDE_DE_CAMP
  OTHER
}

model CompanionActivity {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String   // "City Tour - Addis Ababa", "National Museum Visit"
  description String?
  date        DateTime @db.Date
  startTime   DateTime
  endTime     DateTime
  location    String
  meetingPoint String? // "Hotel lobby at 09:30"
  capacity    Int
  currentSignups Int   @default(0)
  transportIncluded Boolean @default(true)
  dressCode   String?
  cost        Float?   @default(0)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  signups     CompanionActivitySignup[]

  @@unique([tenantId, eventId, name, date])
  @@index([eventId, date])
}

model CompanionActivitySignup {
  id            String   @id @default(cuid())
  activityId    String
  activity      CompanionActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  companionId   String
  companion     CompanionRegistration @relation(fields: [companionId], references: [id], onDelete: Cascade)
  status        String   // SIGNED_UP, CONFIRMED, ATTENDED, CANCELLED, NO_SHOW
  notes         String?
  createdAt     DateTime @default(now())

  @@unique([activityId, companionId])
}
```

### 3.4 Gift Protocol Models

```prisma
model GiftItem {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String   // "Commemorative Medal", "AU Yearbook 2026", "Crystal Award"
  description String?
  category    String   // COMMEMORATIVE, BRANDED, BOOK, AWARD, SOUVENIR
  value       Float?   // Monetary value (for protocol compliance)
  currency    String   @default("USD")
  quantity    Int      // Total stock
  allocated   Int      @default(0)
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  allocations GiftAllocation[]

  @@index([eventId, category])
}

model GiftAllocation {
  id              String   @id @default(cuid())
  giftItemId      String
  giftItem        GiftItem @relation(fields: [giftItemId], references: [id], onDelete: Cascade)
  recipientType   String   // "DELEGATION", "INDIVIDUAL"
  recipientId     String?  // participantId or country name
  recipientName   String   // "Republic of Kenya", "H.E. John Doe"
  quantity        Int      @default(1)
  protocolLevel   String?  // "HEAD_OF_STATE", "MINISTER", "AMBASSADOR", "DELEGATE"
  status          String   // ALLOCATED, ASSEMBLED, DELIVERED, RETURNED
  deliveredAt     DateTime?
  deliveredBy     String?  // staffId
  deliveryMethod  String?  // "HOTEL_ROOM", "REGISTRATION_DESK", "GALA_DINNER"
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([giftItemId])
  @@index([recipientId])
  @@index([status])
}

model WelcomePackage {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name            String   // "VIP Welcome Package", "Standard Delegate Package"
  forParticipantType String? // null = default
  contents        Json     // [{"item": "Event Program", "qty": 1}, {"item": "City Guide", "qty": 1}, ...]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  assemblies      PackageAssembly[]

  @@unique([tenantId, eventId, name])
}

model PackageAssembly {
  id              String   @id @default(cuid())
  packageId       String
  package         WelcomePackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  participantId   String?
  delegationName  String?  // "Republic of Kenya" — one package per delegation or per individual
  status          String   // PENDING, ASSEMBLED, QA_CHECKED, DELIVERED
  assembledBy     String?
  assembledAt     DateTime?
  checkedBy       String?
  checkedAt       DateTime?
  deliveredAt     DateTime?
  deliveryMethod  String?  // HOTEL_ROOM, REGISTRATION_DESK, KIOSK
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([packageId, status])
  @@index([participantId])
}
```

### 3.5 Enhanced Models

The following models extend the core data model with additional capabilities for protocol management, cultural considerations, VIP coordination, and version tracking.

```prisma
model ProtocolTemplate {
  id              String   @id @default(cuid())
  tenantId        String
  name            String   // "AU Summit Standard", "ECOWAS Ministerial"
  description     String?
  rankingSystem   String   // "SENIORITY", "ALPHABETICAL", "ROTATIONAL", "CUSTOM"
  defaultConflicts Json    // Pre-configured conflict rules for this template
  seatingRules    Json     // Default seating parameters (behind-chair count, host position, etc.)
  giftRules       Json     // Protocol level -> gift items mapping
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, name])
}

model CulturalConsideration {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  countryCode     String?  // null = applies to all
  participantId   String?  // null = country-level rule
  category        String   // "DIETARY", "RELIGIOUS", "DRESS_CODE", "GREETING", "SEATING", "GIFT"
  description     String
  severity        String   // "MANDATORY", "PREFERRED", "INFORMATIONAL"
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  appliesTo       String[] // ["SEATING", "GIFTS", "BILATERAL", "COMPANION", "CATERING"]
  metadata        Json     @default("{}")
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([eventId, countryCode])
  @@index([eventId, category])
}

model VIPMovementSchedule {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  participantId   String
  delegationName  String
  date            DateTime @db.Date
  entries         Json     // Array of {time, location, activity, transport, security}
  motorcadeRequired Boolean @default(false)
  securityLevel   String   // "STANDARD", "ENHANCED", "PRESIDENTIAL"
  escortTeamId    String?
  notes           String?
  status          String   // "DRAFT", "CONFIRMED", "ACTIVE", "COMPLETED"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, eventId, participantId, date])
  @@index([eventId, date])
}

model DiplomaticIncidentLog {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  incidentType    String   // "SEATING_ERROR", "PROTOCOL_BREACH", "SCHEDULING_CONFLICT", "GIFT_ISSUE", "SECURITY"
  severity        String   // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  description     String
  involvedParties String[] // Country codes or participant IDs
  reportedBy      String
  resolvedBy      String?
  resolution      String?
  status          String   // "REPORTED", "INVESTIGATING", "RESOLVED", "ESCALATED"
  reportedAt      DateTime @default(now())
  resolvedAt      DateTime?

  @@index([eventId, severity])
  @@index([eventId, status])
}

model ProtocolBriefing {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  delegationCode  String   // Country code
  delegationName  String
  briefingType    String   // "ARRIVAL", "DAILY", "BILATERAL", "DEPARTURE"
  date            DateTime @db.Date
  content         Json     // Structured briefing content
  pdfUrl          String?  // Generated PDF stored in Azure Blob
  generatedAt     DateTime?
  distributedAt   DateTime?
  distributedTo   String[] // List of recipient emails
  status          String   // "DRAFT", "GENERATED", "DISTRIBUTED"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, eventId, delegationCode, briefingType, date])
  @@index([eventId, delegationCode])
}

model SeatingVersion {
  id              String   @id @default(cuid())
  arrangementId   String
  version         Int
  snapshot        Json     // Full snapshot of all SeatAssignments at this version
  changeDescription String?
  changedBy       String
  changedAt       DateTime @default(now())
  isActive        Boolean  @default(false)

  @@unique([arrangementId, version])
  @@index([arrangementId, isActive])
}
```

### 3.6 ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       PROTOCOL & DIPLOMACY ER DIAGRAM                            │
│                                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐     │
│  │ ProtocolRank     │       │ SeatingConflict  │       │ ProtocolTemplate │     │
│  │                  │       │ Rule             │       │                  │     │
│  │ PK id            │       │                  │       │ PK id            │     │
│  │ FK tenantId      │       │ PK id            │       │ FK tenantId      │     │
│  │ FK eventId       │       │ FK tenantId      │       │    name          │     │
│  │    countryCode   │       │ FK eventId       │       │    rankingSystem │     │
│  │    rank          │       │    countryA      │       │    defaults...   │     │
│  │    rankingSystem │       │    countryB      │       └──────────────────┘     │
│  │    headOfState.. │       │    ruleType      │                                │
│  └────────┬─────────┘       │    distance      │                                │
│           │                 └──────────────────┘                                │
│           │ rank informs                                                        │
│           v                                                                     │
│  ┌──────────────────┐       ┌──────────────────┐                                │
│  │ SeatingArrange-  │1    * │ SeatAssignment   │       ┌──────────────────┐     │
│  │ ment             │───────│                  │       │ SeatingVersion   │     │
│  │                  │       │ PK id            │       │                  │     │
│  │ PK id            │       │ FK arrangementId │       │ PK id            │     │
│  │ FK tenantId      │       │ FK participantId │       │ FK arrangementId │     │
│  │ FK eventId       │       │    seatLabel     │       │    version       │     │
│  │ FK meetingId     │       │    tableNumber   │       │    snapshot      │     │
│  │    layoutType    │       │    protocolRank  │       │    changedBy     │     │
│  │    layout (JSON) │       │    nameplate...  │       └──────────────────┘     │
│  │    isFinalized   │       └──────────────────┘                                │
│  └──────────────────┘                                                           │
│                                                                                  │
│  ════════════════════════════════════════════════════════════════════════        │
│                                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐     │
│  │ BilateralRequest │*    1 │ BilateralSlot    │       │ BilateralRoom    │     │
│  │                  │───────│                  │       │                  │     │
│  │ PK id            │       │ PK id            │  1  * │ PK id            │     │
│  │ FK tenantId      │       │ FK eventId       │───────│ FK tenantId      │     │
│  │ FK eventId       │       │    date          │       │ FK eventId       │     │
│  │ FK slotId        │       │    startTime     │       │    name          │     │
│  │ FK roomId        │       │    endTime       │       │    capacity      │     │
│  │    requesting..  │       └──────────────────┘       │    amenities     │     │
│  │    requested..   │                                   └──────────────────┘     │
│  │    status        │       ┌──────────────────┐                                │
│  │    priority      │       │ ProtocolBriefing │                                │
│  │    duration      │       │                  │                                │
│  │    interpreter.. │       │ PK id            │                                │
│  └──────────────────┘       │ FK tenantId      │                                │
│                              │ FK eventId       │                                │
│                              │    delegationCode│                                │
│                              │    briefingType  │                                │
│                              │    pdfUrl        │                                │
│                              └──────────────────┘                                │
│                                                                                  │
│  ════════════════════════════════════════════════════════════════════════        │
│                                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐     │
│  │ CompanionReg-    │1    * │ CompanionActivity│1    * │ CompanionActivity│     │
│  │ istration        │       │ Signup           │───────│                  │     │
│  │                  │───────│                  │       │ PK id            │     │
│  │ PK id            │       │ PK id            │       │ FK tenantId      │     │
│  │ FK tenantId      │       │ FK activityId    │       │ FK eventId       │     │
│  │ FK eventId       │       │ FK companionId   │       │    name          │     │
│  │ FK primaryPart.. │       │    status        │       │    date          │     │
│  │    firstName     │       └──────────────────┘       │    capacity      │     │
│  │    familyName    │                                   │    location      │     │
│  │    relationship  │                                   └──────────────────┘     │
│  │    registr.Code  │                                                           │
│  │    status        │                                                           │
│  └──────────────────┘                                                           │
│                                                                                  │
│  ════════════════════════════════════════════════════════════════════════        │
│                                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐     │
│  │ GiftItem         │1    * │ GiftAllocation   │       │ WelcomePackage   │     │
│  │                  │───────│                  │       │                  │     │
│  │ PK id            │       │ PK id            │       │ PK id            │1  * │
│  │ FK tenantId      │       │ FK giftItemId    │       │ FK tenantId      │──┐  │
│  │ FK eventId       │       │    recipientType │       │ FK eventId       │  │  │
│  │    name          │       │    recipientId   │       │    name          │  │  │
│  │    category      │       │    protocolLevel │       │    contents(JSON)│  │  │
│  │    value         │       │    status        │       └──────────────────┘  │  │
│  │    quantity      │       │    deliveredAt   │                             │  │
│  │    allocated     │       └──────────────────┘       ┌──────────────────┐  │  │
│  └──────────────────┘                                   │ PackageAssembly  │  │  │
│                                                         │                  │──┘  │
│  ┌──────────────────┐       ┌──────────────────┐       │ PK id            │     │
│  │ CulturalConsid-  │       │ DiplomaticInci-  │       │ FK packageId     │     │
│  │ eration          │       │ dentLog          │       │ FK participantId │     │
│  │                  │       │                  │       │    status        │     │
│  │ PK id            │       │ PK id            │       │    assembledBy   │     │
│  │ FK tenantId      │       │ FK tenantId      │       │    deliveryMethod│     │
│  │ FK eventId       │       │ FK eventId       │       └──────────────────┘     │
│  │    countryCode   │       │    incidentType  │                                │
│  │    category      │       │    severity      │       ┌──────────────────┐     │
│  │    severity      │       │    involvedParties│      │ VIPMovement      │     │
│  │    appliesTo[]   │       │    status        │       │ Schedule         │     │
│  └──────────────────┘       └──────────────────┘       │                  │     │
│                                                         │ PK id            │     │
│                                                         │ FK participantId │     │
│                                                         │    entries(JSON) │     │
│                                                         │    securityLevel │     │
│                                                         └──────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Index Catalog

| Table                   | Index                      | Columns                                                   | Purpose                             |
| ----------------------- | -------------------------- | --------------------------------------------------------- | ----------------------------------- |
| ProtocolRank            | `idx_protocol_rank_event`  | `(eventId, rank)`                                         | Fast rank-ordered queries per event |
| ProtocolRank            | `uq_protocol_rank_country` | `(tenantId, eventId, countryCode)`                        | One rank per country per event      |
| SeatingConflictRule     | `uq_conflict_rule_pair`    | `(tenantId, eventId, countryA, countryB)`                 | One rule per country pair           |
| SeatingArrangement      | `uq_arrangement_meeting`   | `(tenantId, eventId, meetingId, name)`                    | Unique arrangement per meeting      |
| SeatAssignment          | `uq_seat_label`            | `(arrangementId, seatLabel)`                              | No duplicate seat labels            |
| SeatAssignment          | `idx_seat_rank`            | `(arrangementId, protocolRank)`                           | Rank-ordered seat queries           |
| BilateralRequest        | `idx_bilateral_status`     | `(eventId, status)`                                       | Filter by status                    |
| BilateralRequest        | `idx_bilateral_requester`  | `(eventId, requestingParty)`                              | Find requests from a party          |
| BilateralRequest        | `idx_bilateral_requested`  | `(eventId, requestedParty)`                               | Find requests to a party            |
| BilateralRequest        | `idx_bilateral_priority`   | `(eventId, priority)`                                     | Priority-based scheduling           |
| BilateralSlot           | `uq_slot_time`             | `(eventId, date, startTime)`                              | No overlapping slots                |
| BilateralSlot           | `idx_slot_date`            | `(eventId, date)`                                         | Date-range queries                  |
| BilateralRoom           | `uq_room_name`             | `(tenantId, eventId, name)`                               | Unique room names                   |
| CompanionRegistration   | `idx_companion_event`      | `(eventId, primaryParticipantId)`                         | Companions per delegate             |
| CompanionRegistration   | `idx_companion_status`     | `(status)`                                                | Status filtering                    |
| CompanionActivity       | `uq_activity_name`         | `(tenantId, eventId, name, date)`                         | Unique activities                   |
| CompanionActivity       | `idx_activity_date`        | `(eventId, date)`                                         | Date-based activity listing         |
| CompanionActivitySignup | `uq_signup`                | `(activityId, companionId)`                               | No double sign-ups                  |
| GiftItem                | `idx_gift_category`        | `(eventId, category)`                                     | Category-based inventory            |
| GiftAllocation          | `idx_alloc_gift`           | `(giftItemId)`                                            | Allocations per gift item           |
| GiftAllocation          | `idx_alloc_recipient`      | `(recipientId)`                                           | Allocations per recipient           |
| GiftAllocation          | `idx_alloc_status`         | `(status)`                                                | Status-based tracking               |
| WelcomePackage          | `uq_package_name`          | `(tenantId, eventId, name)`                               | Unique package names                |
| PackageAssembly         | `idx_assembly_status`      | `(packageId, status)`                                     | Assembly progress tracking          |
| PackageAssembly         | `idx_assembly_participant` | `(participantId)`                                         | Packages per participant            |
| CulturalConsideration   | `idx_cultural_country`     | `(eventId, countryCode)`                                  | Country cultural rules              |
| CulturalConsideration   | `idx_cultural_category`    | `(eventId, category)`                                     | Category-based lookup               |
| VIPMovementSchedule     | `uq_vip_schedule`          | `(tenantId, eventId, participantId, date)`                | One schedule per VIP per day        |
| VIPMovementSchedule     | `idx_vip_date`             | `(eventId, date)`                                         | Date-based VIP schedules            |
| DiplomaticIncidentLog   | `idx_incident_severity`    | `(eventId, severity)`                                     | Severity-based filtering            |
| DiplomaticIncidentLog   | `idx_incident_status`      | `(eventId, status)`                                       | Status tracking                     |
| ProtocolBriefing        | `uq_briefing`              | `(tenantId, eventId, delegationCode, briefingType, date)` | One briefing per type per day       |
| SeatingVersion          | `uq_version`               | `(arrangementId, version)`                                | Unique version numbers              |
| SeatingVersion          | `idx_version_active`       | `(arrangementId, isActive)`                               | Quick active version lookup         |

---

## 4. API Specification

All endpoints require authentication via Bearer token and enforce tenant isolation. Routes are prefixed with `/api/events/:eventId/protocol`.

### 4.1 Protocol and Ranking APIs

#### `GET /api/events/:eventId/protocol/ranks`

List all protocol ranks for an event, ordered by rank ascending.

**Query Parameters:**

| Parameter       | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `rankingSystem` | string | No       | Filter by ranking system                     |
| `search`        | string | No       | Search by country name or head of state name |

**Response: `200 OK`**

```typescript
interface ProtocolRankListResponse {
  data: {
    id: string;
    countryCode: string;
    countryName: string;
    rank: number;
    rankingSystem: "SENIORITY" | "ALPHABETICAL" | "ROTATIONAL" | "CUSTOM";
    headOfStateTitle: string | null;
    headOfStateName: string | null;
    inOfficeSince: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  meta: {
    total: number;
    rankingSystem: string;
  };
}
```

#### `POST /api/events/:eventId/protocol/ranks`

Create or update a protocol rank entry.

**Request Body:**

```typescript
interface CreateProtocolRankRequest {
  countryCode: string; // ISO 3166-1 alpha-3
  countryName: string;
  rank: number;
  rankingSystem: "SENIORITY" | "ALPHABETICAL" | "ROTATIONAL" | "CUSTOM";
  headOfStateTitle?: string;
  headOfStateName?: string;
  inOfficeSince?: string; // ISO 8601 date
  notes?: string;
}
```

**Response: `201 Created`**

```typescript
interface ProtocolRankResponse {
  data: ProtocolRank;
}
```

#### `PUT /api/events/:eventId/protocol/ranks/:rankId`

Update an existing protocol rank.

**Request Body:** Same as `CreateProtocolRankRequest` (all fields optional).

**Response: `200 OK`**

#### `DELETE /api/events/:eventId/protocol/ranks/:rankId`

Delete a protocol rank entry.

**Response: `204 No Content`**

#### `POST /api/events/:eventId/protocol/ranks/generate`

Auto-generate ranks based on a ranking system.

**Request Body:**

```typescript
interface GenerateRanksRequest {
  rankingSystem: "SENIORITY" | "ALPHABETICAL" | "ROTATIONAL";
  language?: string; // For ALPHABETICAL: "EN", "FR", "AR"
  rotationOffset?: number; // For ROTATIONAL: shift from previous edition
  previousEditionEventId?: string; // For ROTATIONAL: copy and shift
}
```

**Response: `200 OK`**

```typescript
interface GenerateRanksResponse {
  data: ProtocolRank[];
  meta: {
    generated: number;
    system: string;
  };
}
```

#### `POST /api/events/:eventId/protocol/conflict-rules`

Create a seating conflict rule.

**Request Body:**

```typescript
interface CreateConflictRuleRequest {
  countryA: string;
  countryB: string;
  ruleType: "NO_ADJACENT" | "MINIMUM_DISTANCE" | "SAME_TABLE_OK";
  distance?: number;
  reason?: string;
}
```

**Response: `201 Created`**

```typescript
interface ConflictRuleResponse {
  data: SeatingConflictRule;
}
```

#### `GET /api/events/:eventId/protocol/conflict-rules`

List all conflict rules for an event.

**Response: `200 OK`**

```typescript
interface ConflictRuleListResponse {
  data: SeatingConflictRule[];
  meta: { total: number };
}
```

#### `DELETE /api/events/:eventId/protocol/conflict-rules/:ruleId`

Delete a conflict rule.

**Response: `204 No Content`**

### 4.2 Seating Management APIs

#### `GET /api/events/:eventId/protocol/seating/arrangements`

List all seating arrangements for an event.

**Query Parameters:**

| Parameter     | Type    | Required | Description                   |
| ------------- | ------- | -------- | ----------------------------- |
| `meetingId`   | string  | No       | Filter by meeting             |
| `layoutType`  | string  | No       | Filter by layout type         |
| `isFinalized` | boolean | No       | Filter by finalization status |

**Response: `200 OK`**

```typescript
interface SeatingArrangementListResponse {
  data: {
    id: string;
    meetingId: string;
    name: string;
    layoutType: string;
    totalSeats: number;
    assignedSeats: number;
    isFinalized: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
  meta: { total: number };
}
```

#### `POST /api/events/:eventId/protocol/seating/arrangements`

Create a new seating arrangement.

**Request Body:**

```typescript
interface CreateArrangementRequest {
  meetingId: string;
  name: string;
  layoutType: "THEATER" | "BOARDROOM" | "BANQUET" | "U_SHAPE" | "CLASSROOM" | "HOLLOW_SQUARE";
  layout: {
    tables: Array<{
      id: string;
      shape: "rectangular" | "round" | "u-shape" | "hollow-square";
      positionX: number;
      positionY: number;
      width: number;
      height: number;
      seats: number;
      label?: string;
    }>;
    dimensions: { width: number; height: number };
    entrancePosition: { x: number; y: number };
  };
  totalSeats: number;
}
```

**Response: `201 Created`**

#### `GET /api/events/:eventId/protocol/seating/arrangements/:arrangementId`

Get a complete seating arrangement with all seat assignments.

**Response: `200 OK`**

```typescript
interface SeatingArrangementDetailResponse {
  data: {
    id: string;
    meetingId: string;
    name: string;
    layoutType: string;
    layout: object;
    totalSeats: number;
    assignedSeats: number;
    isFinalized: boolean;
    seats: Array<{
      id: string;
      seatLabel: string;
      tableNumber: number | null;
      seatNumber: number | null;
      positionX: number | null;
      positionY: number | null;
      isReserved: boolean;
      reservedFor: string | null;
      protocolRank: number | null;
      nameplatePrinted: boolean;
      participant: {
        id: string;
        firstName: string;
        familyName: string;
        countryCode: string;
        countryName: string;
        participantType: string;
        title: string | null;
        photoUrl: string | null;
      } | null;
    }>;
    conflictViolations: Array<{
      ruleId: string;
      countryA: string;
      countryB: string;
      ruleType: string;
      requiredDistance: number;
      actualDistance: number;
      seatA: string;
      seatB: string;
    }>;
    versions: Array<{
      version: number;
      changedAt: string;
      changedBy: string;
      changeDescription: string | null;
      isActive: boolean;
    }>;
  };
}
```

#### `POST /api/events/:eventId/protocol/seating/arrangements/:arrangementId/auto-assign`

Run the auto-seating algorithm.

**Request Body:**

```typescript
interface AutoAssignRequest {
  rankingSystem: "SENIORITY" | "ALPHABETICAL" | "ROTATIONAL" | "CUSTOM";
  hostCountryCode: string;
  includeAdvisors: boolean; // Auto-assign behind-the-chair positions
  respectConflictRules: boolean; // Default: true
  preserveManualAssignments: boolean; // Don't move manually placed seats
}
```

**Response: `200 OK`**

```typescript
interface AutoAssignResponse {
  data: {
    arrangementId: string;
    assignedCount: number;
    unassignedCount: number;
    conflictViolations: Array<{
      countryA: string;
      countryB: string;
      ruleType: string;
      message: string;
    }>;
    seats: SeatAssignment[];
  };
  meta: {
    algorithm: string;
    executionTimeMs: number;
    constraintsSatisfied: number;
    constraintsViolated: number;
  };
}
```

#### `PUT /api/events/:eventId/protocol/seating/arrangements/:arrangementId/seats/:seatId`

Assign or update a single seat.

**Request Body:**

```typescript
interface UpdateSeatRequest {
  participantId?: string | null;
  isReserved?: boolean;
  reservedFor?: string;
}
```

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/seating/arrangements/:arrangementId/swap`

Swap two seat assignments.

**Request Body:**

```typescript
interface SwapSeatsRequest {
  seatIdA: string;
  seatIdB: string;
}
```

**Response: `200 OK`**

```typescript
interface SwapSeatsResponse {
  data: {
    seatA: SeatAssignment;
    seatB: SeatAssignment;
    newViolations: ConflictViolation[];
    resolvedViolations: ConflictViolation[];
  };
}
```

#### `POST /api/events/:eventId/protocol/seating/arrangements/:arrangementId/conflict-check`

Validate current arrangement against all conflict rules.

**Response: `200 OK`**

```typescript
interface ConflictCheckResponse {
  data: {
    isValid: boolean;
    violations: ConflictViolation[];
    suggestions: Array<{
      violation: ConflictViolation;
      suggestedSwap: { seatA: string; seatB: string };
      resolvesViolation: boolean;
    }>;
  };
}
```

#### `POST /api/events/:eventId/protocol/seating/arrangements/:arrangementId/finalize`

Finalize the arrangement (lock for editing).

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/seating/arrangements/:arrangementId/print-nameplates`

Generate nameplates for all assigned seats.

**Request Body:**

```typescript
interface PrintNameplatesRequest {
  seatIds?: string[]; // Specific seats; empty = all assigned seats
  format: "A5_LANDSCAPE" | "A4_STANDING" | "TABLE_TENT";
  languages: string[]; // ["EN", "FR", "AR"]
  includeFlags: boolean;
  includeTitle: boolean;
}
```

**Response: `200 OK`**

```typescript
interface PrintNameplatesResponse {
  data: {
    jobId: string;
    totalNameplates: number;
    pdfUrl: string; // URL to generated PDF in Azure Blob Storage
    status: "QUEUED" | "GENERATING" | "READY";
  };
}
```

#### `POST /api/events/:eventId/protocol/seating/arrangements/:arrangementId/versions/restore`

Restore a previous version of the seating arrangement.

**Request Body:**

```typescript
interface RestoreVersionRequest {
  version: number;
}
```

**Response: `200 OK`**

### 4.3 Bilateral Meeting APIs

#### `GET /api/events/:eventId/protocol/bilateral/requests`

List all bilateral meeting requests.

**Query Parameters:**

| Parameter  | Type              | Required | Description                           |
| ---------- | ----------------- | -------- | ------------------------------------- |
| `status`   | BilateralStatus   | No       | Filter by status                      |
| `priority` | BilateralPriority | No       | Filter by priority                    |
| `party`    | string            | No       | Filter by either party (country code) |
| `date`     | string            | No       | Filter by scheduled date              |
| `page`     | number            | No       | Page number (default 1)               |
| `limit`    | number            | No       | Items per page (default 50)           |

**Response: `200 OK`**

```typescript
interface BilateralRequestListResponse {
  data: Array<{
    id: string;
    requestingParty: string;
    requestingPartyName: string;
    requestedParty: string;
    requestedPartyName: string;
    status: BilateralStatus;
    priority: BilateralPriority;
    duration: number;
    topic: string | null;
    interpreterNeeded: boolean;
    languages: string[];
    slot: {
      date: string;
      startTime: string;
      endTime: string;
    } | null;
    room: {
      id: string;
      name: string;
      building: string | null;
    } | null;
    confirmedByRequester: boolean;
    confirmedByRequested: boolean;
    createdAt: string;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    statusCounts: Record<BilateralStatus, number>;
  };
}
```

#### `POST /api/events/:eventId/protocol/bilateral/requests`

Create a new bilateral meeting request.

**Request Body:**

```typescript
interface CreateBilateralRequestBody {
  requestedParty: string; // Country code
  duration: number; // Minutes (15, 30, 45, 60)
  topic?: string;
  notes?: string;
  interpreterNeeded: boolean;
  languages?: string[];
  preferredTimes?: Array<{
    date: string; // ISO 8601 date
    timePreference: "MORNING" | "AFTERNOON" | "ANY";
  }>;
}
```

**Response: `201 Created`**

#### `PUT /api/events/:eventId/protocol/bilateral/requests/:requestId/respond`

Counterpart responds to a bilateral request.

**Request Body:**

```typescript
interface BilateralResponseBody {
  action: "ACCEPT" | "DECLINE" | "SUGGEST_ALTERNATIVE";
  declineReason?: string;
  alternativeTimes?: Array<{
    date: string;
    timePreference: "MORNING" | "AFTERNOON" | "ANY";
  }>;
}
```

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/bilateral/auto-schedule`

Run the auto-scheduling algorithm for all confirmed requests.

**Request Body:**

```typescript
interface AutoScheduleRequest {
  scope: "ALL_CONFIRMED" | "SPECIFIC";
  requestIds?: string[];
  respectPriority: boolean;
  allowDisplacement: boolean; // Allow displacing lower priority for higher
  bufferMinutes: number; // Gap between consecutive meetings (default 15)
}
```

**Response: `200 OK`**

```typescript
interface AutoScheduleResponse {
  data: {
    scheduled: Array<{
      requestId: string;
      slotId: string;
      roomId: string;
      date: string;
      startTime: string;
      endTime: string;
      roomName: string;
    }>;
    unscheduled: Array<{
      requestId: string;
      reason: string;
    }>;
    displaced: Array<{
      requestId: string;
      previousSlot: string;
      newSlot: string;
      reason: string;
    }>;
  };
  meta: {
    totalProcessed: number;
    scheduledCount: number;
    unscheduledCount: number;
    displacedCount: number;
    executionTimeMs: number;
  };
}
```

#### `POST /api/events/:eventId/protocol/bilateral/requests/:requestId/reschedule`

Reschedule a bilateral meeting.

**Request Body:**

```typescript
interface RescheduleRequest {
  slotId: string;
  roomId: string;
  reason?: string;
}
```

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/bilateral/briefs/generate`

Generate meeting briefs for delegations.

**Request Body:**

```typescript
interface GenerateBriefsRequest {
  delegationCodes?: string[]; // Empty = all delegations with meetings
  includeTransport: boolean;
  includeInterpreter: boolean;
  languages: string[]; // Brief document languages
}
```

**Response: `200 OK`**

```typescript
interface GenerateBriefsResponse {
  data: Array<{
    delegationCode: string;
    delegationName: string;
    meetingCount: number;
    pdfUrl: string;
    generatedAt: string;
  }>;
  meta: {
    totalBriefs: number;
    generationTimeMs: number;
  };
}
```

#### `GET /api/events/:eventId/protocol/bilateral/slots`

List available bilateral slots.

**Query Parameters:**

| Parameter   | Type    | Required | Description              |
| ----------- | ------- | -------- | ------------------------ |
| `date`      | string  | No       | Filter by date           |
| `available` | boolean | No       | Only show unbooked slots |

**Response: `200 OK`**

#### `GET /api/events/:eventId/protocol/bilateral/rooms`

List bilateral meeting rooms.

**Response: `200 OK`**

### 4.4 Companion Program APIs

#### `GET /api/events/:eventId/protocol/companions`

List all companion registrations.

**Query Parameters:**

| Parameter       | Type   | Required | Description                   |
| --------------- | ------ | -------- | ----------------------------- |
| `participantId` | string | No       | Filter by primary participant |
| `status`        | string | No       | Filter by registration status |
| `relationship`  | string | No       | Filter by relationship type   |
| `search`        | string | No       | Search by name                |

**Response: `200 OK`**

```typescript
interface CompanionListResponse {
  data: Array<{
    id: string;
    firstName: string;
    familyName: string;
    relationship: CompanionRelationship;
    registrationCode: string;
    status: string;
    primaryParticipant: {
      id: string;
      firstName: string;
      familyName: string;
      countryName: string;
      participantType: string;
    };
    activitySignups: Array<{
      activityId: string;
      activityName: string;
      date: string;
      status: string;
    }>;
    createdAt: string;
  }>;
  meta: {
    total: number;
    statusCounts: Record<string, number>;
  };
}
```

#### `POST /api/events/:eventId/protocol/companions`

Register a new companion.

**Request Body:**

```typescript
interface CreateCompanionRequest {
  primaryParticipantId: string;
  firstName: string;
  familyName: string;
  relationship: "SPOUSE" | "CHILD" | "PARENT" | "ASSISTANT" | "AIDE_DE_CAMP" | "OTHER";
  gender?: string;
  dateOfBirth?: string;
  nationalityId?: string;
  passportNumber?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  customData?: Record<string, unknown>;
}
```

**Response: `201 Created`**

```typescript
interface CompanionResponse {
  data: CompanionRegistration & {
    registrationCode: string;
  };
}
```

#### `PUT /api/events/:eventId/protocol/companions/:companionId`

Update companion registration.

**Request Body:** Partial `CreateCompanionRequest`.

**Response: `200 OK`**

#### `PUT /api/events/:eventId/protocol/companions/:companionId/status`

Update companion registration status.

**Request Body:**

```typescript
interface UpdateCompanionStatusRequest {
  status: "REGISTERED" | "APPROVED" | "BADGE_PRINTED" | "COLLECTED" | "CANCELLED";
}
```

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/companions/:companionId/badge`

Generate badge for a companion.

**Response: `200 OK`**

```typescript
interface CompanionBadgeResponse {
  data: {
    companionId: string;
    badgeUrl: string;
    badgeTemplateId: string;
    zones: string[];
  };
}
```

#### `GET /api/events/:eventId/protocol/companion-activities`

List all companion activities.

**Query Parameters:**

| Parameter     | Type    | Required | Description                               |
| ------------- | ------- | -------- | ----------------------------------------- |
| `date`        | string  | No       | Filter by date                            |
| `hasCapacity` | boolean | No       | Only show activities with available spots |

**Response: `200 OK`**

```typescript
interface CompanionActivityListResponse {
  data: Array<{
    id: string;
    name: string;
    description: string | null;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    meetingPoint: string | null;
    capacity: number;
    currentSignups: number;
    availableSpots: number;
    transportIncluded: boolean;
    dressCode: string | null;
    cost: number;
    signups: Array<{
      companionId: string;
      companionName: string;
      delegationName: string;
      status: string;
    }>;
  }>;
}
```

#### `POST /api/events/:eventId/protocol/companion-activities`

Create a new companion activity.

**Request Body:**

```typescript
interface CreateCompanionActivityRequest {
  name: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingPoint?: string;
  capacity: number;
  transportIncluded: boolean;
  dressCode?: string;
  cost?: number;
  notes?: string;
}
```

**Response: `201 Created`**

#### `POST /api/events/:eventId/protocol/companion-activities/:activityId/signup`

Sign up a companion for an activity.

**Request Body:**

```typescript
interface ActivitySignupRequest {
  companionId: string;
  notes?: string;
}
```

**Response: `201 Created`**

```typescript
interface ActivitySignupResponse {
  data: {
    signupId: string;
    activityId: string;
    companionId: string;
    status: "SIGNED_UP";
    remainingCapacity: number;
  };
}
```

#### `PUT /api/events/:eventId/protocol/companion-activities/:activityId/signups/:signupId/status`

Update signup status (confirm, attend, cancel, no-show).

**Request Body:**

```typescript
interface UpdateSignupStatusRequest {
  status: "SIGNED_UP" | "CONFIRMED" | "ATTENDED" | "CANCELLED" | "NO_SHOW";
}
```

**Response: `200 OK`**

### 4.5 Gift Protocol APIs

#### `GET /api/events/:eventId/protocol/gifts`

List all gift items in inventory.

**Query Parameters:**

| Parameter  | Type    | Required | Description                     |
| ---------- | ------- | -------- | ------------------------------- |
| `category` | string  | No       | Filter by category              |
| `inStock`  | boolean | No       | Only items with available stock |

**Response: `200 OK`**

```typescript
interface GiftItemListResponse {
  data: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    value: number | null;
    currency: string;
    quantity: number;
    allocated: number;
    available: number;
    imageUrl: string | null;
    allocations: Array<{
      recipientName: string;
      protocolLevel: string;
      status: string;
    }>;
  }>;
  meta: {
    totalItems: number;
    totalStock: number;
    totalAllocated: number;
  };
}
```

#### `POST /api/events/:eventId/protocol/gifts`

Add a gift item to inventory.

**Request Body:**

```typescript
interface CreateGiftItemRequest {
  name: string;
  description?: string;
  category: "COMMEMORATIVE" | "BRANDED" | "BOOK" | "AWARD" | "SOUVENIR";
  value?: number;
  currency?: string;
  quantity: number;
  imageUrl?: string;
}
```

**Response: `201 Created`**

#### `PUT /api/events/:eventId/protocol/gifts/:giftId`

Update gift item details or stock.

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/gifts/allocations`

Allocate a gift to a recipient.

**Request Body:**

```typescript
interface CreateGiftAllocationRequest {
  giftItemId: string;
  recipientType: "DELEGATION" | "INDIVIDUAL";
  recipientId?: string;
  recipientName: string;
  quantity: number;
  protocolLevel?: "HEAD_OF_STATE" | "MINISTER" | "AMBASSADOR" | "DELEGATE";
  deliveryMethod?: "HOTEL_ROOM" | "REGISTRATION_DESK" | "GALA_DINNER";
  notes?: string;
}
```

**Response: `201 Created`**

```typescript
interface GiftAllocationResponse {
  data: GiftAllocation & {
    complianceCheck: {
      withinThreshold: boolean;
      totalValueToRecipient: number;
      threshold: number;
      requiresApproval: boolean;
    };
  };
}
```

#### `PUT /api/events/:eventId/protocol/gifts/allocations/:allocationId/status`

Update allocation status (assembled, delivered, returned).

**Request Body:**

```typescript
interface UpdateAllocationStatusRequest {
  status: "ALLOCATED" | "ASSEMBLED" | "DELIVERED" | "RETURNED";
  deliveredBy?: string;
  notes?: string;
}
```

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/gifts/allocations/bulk`

Bulk allocate gifts by protocol level.

**Request Body:**

```typescript
interface BulkGiftAllocationRequest {
  protocolLevel: "HEAD_OF_STATE" | "MINISTER" | "AMBASSADOR" | "DELEGATE";
  giftItemIds: string[];
  deliveryMethod: "HOTEL_ROOM" | "REGISTRATION_DESK" | "GALA_DINNER";
}
```

**Response: `200 OK`**

```typescript
interface BulkAllocationResponse {
  data: {
    created: number;
    skipped: number;
    errors: Array<{
      recipientName: string;
      reason: string;
    }>;
  };
}
```

#### `GET /api/events/:eventId/protocol/welcome-packages`

List welcome package definitions.

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/welcome-packages`

Create a welcome package definition.

**Request Body:**

```typescript
interface CreateWelcomePackageRequest {
  name: string;
  forParticipantType?: string;
  contents: Array<{
    item: string;
    qty: number;
    notes?: string;
  }>;
}
```

**Response: `201 Created`**

#### `GET /api/events/:eventId/protocol/welcome-packages/assemblies`

List all package assemblies and their status.

**Query Parameters:**

| Parameter   | Type   | Required | Description                  |
| ----------- | ------ | -------- | ---------------------------- |
| `status`    | string | No       | Filter by assembly status    |
| `packageId` | string | No       | Filter by package definition |

**Response: `200 OK`**

```typescript
interface AssemblyListResponse {
  data: Array<{
    id: string;
    packageName: string;
    participantId: string | null;
    delegationName: string | null;
    status: "PENDING" | "ASSEMBLED" | "QA_CHECKED" | "DELIVERED";
    assembledBy: string | null;
    assembledAt: string | null;
    checkedBy: string | null;
    checkedAt: string | null;
    deliveredAt: string | null;
    deliveryMethod: string | null;
    contents: Array<{ item: string; qty: number }>;
  }>;
  meta: {
    total: number;
    statusCounts: Record<string, number>;
  };
}
```

#### `PUT /api/events/:eventId/protocol/welcome-packages/assemblies/:assemblyId/status`

Update assembly status through the workflow.

**Request Body:**

```typescript
interface UpdateAssemblyStatusRequest {
  status: "PENDING" | "ASSEMBLED" | "QA_CHECKED" | "DELIVERED";
  staffId?: string;
  deliveryMethod?: "HOTEL_ROOM" | "REGISTRATION_DESK" | "KIOSK";
  notes?: string;
}
```

**Response: `200 OK`**

#### `POST /api/events/:eventId/protocol/welcome-packages/assemblies/:assemblyId/packing-list`

Generate a printable packing list PDF.

**Response: `200 OK`**

```typescript
interface PackingListResponse {
  data: {
    assemblyId: string;
    pdfUrl: string;
  };
}
```

### 4.6 SSE Events

The module publishes real-time updates via Server-Sent Events for collaborative editing and live dashboards.

**Endpoint:** `GET /api/events/:eventId/protocol/stream`

```typescript
// SSE Event Types
type ProtocolSSEEvent =
  | {
      type: "seating.updated";
      data: {
        arrangementId: string;
        seatId: string;
        participantId: string | null;
        changedBy: string;
      };
    }
  | {
      type: "seating.swapped";
      data: { arrangementId: string; seatIdA: string; seatIdB: string; changedBy: string };
    }
  | { type: "seating.finalized"; data: { arrangementId: string; finalizedBy: string } }
  | { type: "seating.conflict"; data: { arrangementId: string; violation: ConflictViolation } }
  | {
      type: "bilateral.requested";
      data: { requestId: string; requestingParty: string; requestedParty: string };
    }
  | { type: "bilateral.confirmed"; data: { requestId: string; status: BilateralStatus } }
  | {
      type: "bilateral.scheduled";
      data: { requestId: string; slotId: string; roomId: string; date: string; time: string };
    }
  | { type: "bilateral.cancelled"; data: { requestId: string; reason: string } }
  | { type: "companion.registered"; data: { companionId: string; primaryParticipantId: string } }
  | {
      type: "companion.activity.signup";
      data: { activityId: string; companionId: string; remainingCapacity: number };
    }
  | {
      type: "gift.allocated";
      data: { allocationId: string; giftItemId: string; recipientName: string };
    }
  | { type: "gift.delivered"; data: { allocationId: string; deliveryMethod: string } }
  | { type: "package.status"; data: { assemblyId: string; status: string; updatedBy: string } }
  | { type: "gift.stock.low"; data: { giftItemId: string; name: string; remaining: number } };
```

**Connection Example:**

```typescript
// Client-side SSE connection
const eventSource = new EventSource(`/api/events/${eventId}/protocol/stream`, {
  headers: { Authorization: `Bearer ${token}` },
});

eventSource.addEventListener("seating.updated", (event) => {
  const data = JSON.parse(event.data);
  // Update local seating chart state
  updateSeatAssignment(data.seatId, data.participantId);
});

eventSource.addEventListener("bilateral.scheduled", (event) => {
  const data = JSON.parse(event.data);
  // Update bilateral dashboard
  refreshBilateralGrid(data.date);
});

eventSource.addEventListener("gift.stock.low", (event) => {
  const data = JSON.parse(event.data);
  // Show low stock warning
  showNotification(`Low stock: ${data.name} (${data.remaining} remaining)`);
});
```

### 4.7 Webhook Events

External systems can subscribe to protocol events via the webhook infrastructure defined in Module 07.

| Event                          | Payload                                                | Trigger                           |
| ------------------------------ | ------------------------------------------------------ | --------------------------------- |
| `protocol.seating.finalized`   | `{ arrangementId, meetingId, seatCount, finalizedBy }` | Seating arrangement locked        |
| `protocol.bilateral.scheduled` | `{ requestId, parties, date, time, room }`             | Meeting assigned to slot and room |
| `protocol.bilateral.cancelled` | `{ requestId, parties, reason }`                       | Meeting cancelled                 |
| `protocol.companion.approved`  | `{ companionId, primaryParticipantId, badgeRequired }` | Companion registration approved   |
| `protocol.gift.delivered`      | `{ allocationId, recipientName, deliveryMethod }`      | Gift confirmed delivered          |
| `protocol.package.assembled`   | `{ assemblyId, packageName, delegationName }`          | Package passed QA                 |
| `protocol.incident.reported`   | `{ incidentId, type, severity, parties }`              | Diplomatic incident logged        |
| `protocol.vip.movement`        | `{ scheduleId, participantId, status }`                | VIP movement status change        |

---

## 5. Business Logic

### 5.1 Protocol Rank Engine

The protocol rank engine supports four ranking systems as defined in the source specification:

```
Admin selects arrangement → clicks [Auto-Assign by Protocol]
  → Choose ranking system:
    (●) Seniority (longest-serving head of state first)
    ( ) Alphabetical (by country name in event language)
    ( ) Rotational (shift starting position from previous edition)
    ( ) Custom (manual rank numbers)
```

**TypeScript Implementation:**

```typescript
// file: app/services/protocol/rank-engine.server.ts

import { prisma } from "~/db.server";

type RankingSystem = "SENIORITY" | "ALPHABETICAL" | "ROTATIONAL" | "CUSTOM";

interface RankGenerationOptions {
  tenantId: string;
  eventId: string;
  rankingSystem: RankingSystem;
  language?: string;
  rotationOffset?: number;
  previousEditionEventId?: string;
}

interface RankedCountry {
  countryCode: string;
  countryName: string;
  rank: number;
  headOfStateTitle?: string;
  headOfStateName?: string;
  inOfficeSince?: Date;
}

export async function generateProtocolRanks(
  options: RankGenerationOptions,
): Promise<RankedCountry[]> {
  const { tenantId, eventId, rankingSystem } = options;

  // Load all confirmed participants who are heads of delegation
  const participants = await prisma.participant.findMany({
    where: {
      tenantId,
      eventId,
      status: "APPROVED",
      participantType: { in: ["HEAD_OF_STATE", "HEAD_OF_GOVERNMENT", "MINISTER", "AMBASSADOR"] },
    },
    include: { country: true },
  });

  // Deduplicate by country (one rank per country)
  const countryMap = new Map<string, (typeof participants)[0]>();
  for (const p of participants) {
    const existing = countryMap.get(p.countryCode);
    if (
      !existing ||
      getProtocolWeight(p.participantType) > getProtocolWeight(existing.participantType)
    ) {
      countryMap.set(p.countryCode, p);
    }
  }

  const countries = Array.from(countryMap.values());
  let ranked: RankedCountry[];

  switch (rankingSystem) {
    case "SENIORITY":
      ranked = rankBySeniority(countries);
      break;
    case "ALPHABETICAL":
      ranked = rankByAlphabetical(countries, options.language ?? "EN");
      break;
    case "ROTATIONAL":
      ranked = await rankByRotation(countries, options);
      break;
    case "CUSTOM":
      // Custom ranks are manually assigned; return existing or default order
      ranked = countries.map((c, idx) => ({
        countryCode: c.countryCode,
        countryName: c.country?.name ?? c.countryCode,
        rank: idx + 1,
      }));
      break;
  }

  // Persist to database
  await prisma.$transaction(
    ranked.map((r) =>
      prisma.protocolRank.upsert({
        where: {
          tenantId_eventId_countryCode: {
            tenantId,
            eventId,
            countryCode: r.countryCode,
          },
        },
        update: { rank: r.rank, rankingSystem, headOfStateName: r.headOfStateName },
        create: {
          tenantId,
          eventId,
          countryCode: r.countryCode,
          countryName: r.countryName,
          rank: r.rank,
          rankingSystem,
          headOfStateTitle: r.headOfStateTitle,
          headOfStateName: r.headOfStateName,
          inOfficeSince: r.inOfficeSince,
        },
      }),
    ),
  );

  return ranked;
}

function rankBySeniority(countries: any[]): RankedCountry[] {
  // Sort by inOfficeSince ascending (longest in office = highest rank)
  return countries
    .filter((c) => c.inOfficeSince)
    .sort((a, b) => new Date(a.inOfficeSince).getTime() - new Date(b.inOfficeSince).getTime())
    .map((c, idx) => ({
      countryCode: c.countryCode,
      countryName: c.country?.name ?? c.countryCode,
      rank: idx + 1,
      headOfStateTitle: c.title,
      headOfStateName: `${c.firstName} ${c.familyName}`,
      inOfficeSince: c.inOfficeSince,
    }));
}

function rankByAlphabetical(countries: any[], language: string): RankedCountry[] {
  // Sort by country name in the specified language
  const collator = new Intl.Collator(languageToLocale(language), { sensitivity: "base" });
  return countries
    .sort((a, b) =>
      collator.compare(
        a.country?.nameLocalized?.[language] ?? a.countryCode,
        b.country?.nameLocalized?.[language] ?? b.countryCode,
      ),
    )
    .map((c, idx) => ({
      countryCode: c.countryCode,
      countryName: c.country?.nameLocalized?.[language] ?? c.country?.name ?? c.countryCode,
      rank: idx + 1,
    }));
}

async function rankByRotation(
  countries: any[],
  options: RankGenerationOptions,
): Promise<RankedCountry[]> {
  // Start with alphabetical, then shift by rotation offset
  const alphabetical = rankByAlphabetical(countries, options.language ?? "EN");

  let offset = options.rotationOffset ?? 0;

  if (options.previousEditionEventId && offset === 0) {
    // Calculate offset from previous edition
    const previousRanks = await prisma.protocolRank.findMany({
      where: { eventId: options.previousEditionEventId, rankingSystem: "ROTATIONAL" },
      orderBy: { rank: "asc" },
    });
    if (previousRanks.length > 0) {
      offset = previousRanks.length > 0 ? 1 : 0; // Shift by 1 position
    }
  }

  // Apply rotation: shift starting position
  const total = alphabetical.length;
  return alphabetical
    .map((c, idx) => ({
      ...c,
      rank: ((idx + offset) % total) + 1,
    }))
    .sort((a, b) => a.rank - b.rank);
}

function getProtocolWeight(participantType: string): number {
  const weights: Record<string, number> = {
    HEAD_OF_STATE: 4,
    HEAD_OF_GOVERNMENT: 3,
    MINISTER: 2,
    AMBASSADOR: 1,
  };
  return weights[participantType] ?? 0;
}

function languageToLocale(lang: string): string {
  const map: Record<string, string> = { EN: "en", FR: "fr", AR: "ar", PT: "pt", ES: "es" };
  return map[lang] ?? "en";
}
```

### 5.2 Auto-Seating Algorithm

The auto-seating algorithm from the source specification:

```
Admin selects arrangement → clicks [Auto-Assign by Protocol]
  → Choose ranking system:
    (●) Seniority (longest-serving head of state first)
    ( ) Alphabetical (by country name in event language)
    ( ) Rotational (shift starting position from previous edition)
    ( ) Custom (manual rank numbers)

  → Algorithm (for BOARDROOM / U_SHAPE / HOLLOW_SQUARE layouts):
    1. Load all confirmed participants for this meeting
    2. Sort by ProtocolRank.rank (ascending = highest precedence first)
    3. Seat placement:
       - Position 1 (center, facing entrance): Host head of state
       - Position 2 (right of host): Rank 1 country head of state
       - Position 3 (left of host): Rank 2 country head of state
       - Alternating right-left for remaining positions
    4. Apply conflict rules:
       - For each SeatingConflictRule, check if countryA and countryB
         are within the specified distance
       - If violated: swap offending seat with nearest non-conflicting seat
    5. Behind-the-chair seating:
       - Each head of state has 1-2 advisors seated directly behind them
       - Auto-assign delegates from same country to behind-chair positions
    6. Preview result for admin review before finalizing

  → For BANQUET layouts:
    - Assign tables by country grouping
    - Head table: host + guest of honor + top-ranked leaders
    - Remaining tables: balanced by region + protocol rank
    - Conflict rules enforced at table level (adversaries not at same table)
```

**Extended TypeScript Implementation with Constraint Satisfaction:**

```typescript
// file: app/services/protocol/seating-solver.server.ts

import { prisma } from "~/db.server";

interface SeatPosition {
  seatId: string;
  seatLabel: string;
  tableNumber?: number;
  seatNumber?: number;
  positionX: number;
  positionY: number;
  side: "HEAD" | "RIGHT" | "LEFT" | "FAR" | "TABLE";
  distanceFromCenter: number;
}

interface ParticipantToSeat {
  participantId: string;
  countryCode: string;
  countryName: string;
  protocolRank: number;
  participantType: string;
  name: string;
  isHost: boolean;
  advisors: Array<{ participantId: string; name: string }>;
}

interface ConflictRule {
  id: string;
  countryA: string;
  countryB: string;
  ruleType: "NO_ADJACENT" | "MINIMUM_DISTANCE" | "SAME_TABLE_OK";
  distance?: number;
}

interface SeatingResult {
  assignments: Map<string, string>; // seatId -> participantId
  violations: ConflictViolation[];
  score: number;
  isComplete: boolean;
}

interface ConflictViolation {
  ruleId: string;
  countryA: string;
  countryB: string;
  ruleType: string;
  requiredDistance: number;
  actualDistance: number;
  seatA: string;
  seatB: string;
}

export async function autoAssignSeating(
  tenantId: string,
  eventId: string,
  arrangementId: string,
  options: {
    rankingSystem: string;
    hostCountryCode: string;
    includeAdvisors: boolean;
    respectConflictRules: boolean;
    preserveManualAssignments: boolean;
  },
): Promise<SeatingResult> {
  const startTime = Date.now();

  // 1. Load arrangement with seats
  const arrangement = await prisma.seatingArrangement.findUnique({
    where: { id: arrangementId },
    include: { seats: true },
  });
  if (!arrangement) throw new Error("Arrangement not found");

  // 2. Load protocol ranks
  const ranks = await prisma.protocolRank.findMany({
    where: { tenantId, eventId },
    orderBy: { rank: "asc" },
  });

  // 3. Load conflict rules
  const conflictRules = await prisma.seatingConflictRule.findMany({
    where: { tenantId, eventId },
  });

  // 4. Load participants for this meeting
  const participants = await loadMeetingParticipants(tenantId, eventId, arrangement.meetingId);

  // 5. Build seat positions based on layout type
  const seatPositions = buildSeatPositions(arrangement);

  // 6. Build participant list sorted by rank
  const participantsToSeat = buildParticipantList(
    participants,
    ranks,
    options.hostCountryCode,
    options.includeAdvisors,
  );

  // 7. Identify manually assigned seats to preserve
  const preservedAssignments = new Map<string, string>();
  if (options.preserveManualAssignments) {
    for (const seat of arrangement.seats) {
      if (seat.participantId) {
        preservedAssignments.set(seat.id, seat.participantId);
      }
    }
  }

  // 8. Run placement algorithm based on layout type
  let result: SeatingResult;
  if (["BOARDROOM", "U_SHAPE", "HOLLOW_SQUARE"].includes(arrangement.layoutType)) {
    result = solveProtocolSeating(
      seatPositions,
      participantsToSeat,
      conflictRules,
      preservedAssignments,
    );
  } else if (arrangement.layoutType === "BANQUET") {
    result = solveBanquetSeating(
      seatPositions,
      participantsToSeat,
      conflictRules,
      preservedAssignments,
    );
  } else {
    // THEATER, CLASSROOM - simple row-based assignment
    result = solveRowBasedSeating(
      seatPositions,
      participantsToSeat,
      conflictRules,
      preservedAssignments,
    );
  }

  // 9. Create version snapshot before applying
  await createSeatingVersion(arrangementId, arrangement.seats, "Auto-assign");

  // 10. Apply assignments to database
  await applyAssignments(arrangementId, result.assignments);

  return result;
}

function solveProtocolSeating(
  seats: SeatPosition[],
  participants: ParticipantToSeat[],
  rules: ConflictRule[],
  preserved: Map<string, string>,
): SeatingResult {
  const assignments = new Map<string, string>(preserved);
  const violations: ConflictViolation[] = [];

  // Sort seats: center first, then alternating right-left
  const headSide = seats
    .filter((s) => s.side === "HEAD")
    .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
  const rightSide = seats
    .filter((s) => s.side === "RIGHT")
    .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
  const leftSide = seats
    .filter((s) => s.side === "LEFT")
    .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
  const farSide = seats
    .filter((s) => s.side === "FAR")
    .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);

  // Build interleaved seat order: center, right1, left1, right2, left2, ...
  const orderedSeats: SeatPosition[] = [];
  // Position 1: center of head side (host)
  if (headSide.length > 0) orderedSeats.push(headSide[0]);

  // Alternate right and left
  const maxSide = Math.max(rightSide.length, leftSide.length);
  for (let i = 0; i < maxSide; i++) {
    if (i < rightSide.length) orderedSeats.push(rightSide[i]);
    if (i < leftSide.length) orderedSeats.push(leftSide[i]);
  }

  // Add remaining head side seats and far side
  for (let i = 1; i < headSide.length; i++) orderedSeats.push(headSide[i]);
  orderedSeats.push(...farSide);

  // Place host first
  const host = participants.find((p) => p.isHost);
  const rankedParticipants = participants
    .filter((p) => !p.isHost)
    .sort((a, b) => a.protocolRank - b.protocolRank);

  const allToPlace = host ? [host, ...rankedParticipants] : rankedParticipants;

  // Place each participant in order
  let seatIdx = 0;
  for (const participant of allToPlace) {
    // Skip preserved seats
    while (seatIdx < orderedSeats.length && preserved.has(orderedSeats[seatIdx].seatId)) {
      seatIdx++;
    }
    if (seatIdx >= orderedSeats.length) break;

    assignments.set(orderedSeats[seatIdx].seatId, participant.participantId);
    seatIdx++;
  }

  // Apply conflict rules with swap repair
  const resolvedViolations = repairConflicts(assignments, seats, rules, preserved);
  violations.push(...resolvedViolations.unresolved);

  const unassigned = allToPlace.length - assignments.size + preserved.size;

  return {
    assignments,
    violations,
    score: calculateScore(assignments, rules, seats),
    isComplete: unassigned === 0 && violations.length === 0,
  };
}

function solveBanquetSeating(
  seats: SeatPosition[],
  participants: ParticipantToSeat[],
  rules: ConflictRule[],
  preserved: Map<string, string>,
): SeatingResult {
  const assignments = new Map<string, string>(preserved);
  const violations: ConflictViolation[] = [];

  // Group seats by table
  const tables = new Map<number, SeatPosition[]>();
  for (const seat of seats) {
    const tbl = seat.tableNumber ?? 0;
    if (!tables.has(tbl)) tables.set(tbl, []);
    tables.get(tbl)!.push(seat);
  }

  // Sort participants by rank
  const sorted = [...participants].sort((a, b) => a.protocolRank - b.protocolRank);

  // Head table: host + top-ranked leaders
  const headTable = tables.get(1) ?? tables.values().next().value;
  const headTableCapacity = headTable?.length ?? 0;

  // Assign head table
  const host = sorted.find((p) => p.isHost);
  const headTableGuests = sorted
    .filter((p) => !p.isHost)
    .slice(0, headTableCapacity - (host ? 1 : 0));

  let headSeatIdx = 0;
  if (host && headTable) {
    assignments.set(headTable[headSeatIdx].seatId, host.participantId);
    headSeatIdx++;
  }
  for (const guest of headTableGuests) {
    if (headSeatIdx < headTable.length) {
      assignments.set(headTable[headSeatIdx].seatId, guest.participantId);
      headSeatIdx++;
    }
  }

  // Remaining tables: group by region, balanced by rank
  const assignedIds = new Set([
    host?.participantId,
    ...headTableGuests.map((g) => g.participantId),
  ]);
  const remaining = sorted.filter((p) => !assignedIds.has(p.participantId));

  const otherTables = Array.from(tables.entries())
    .filter(([num]) => num !== 1)
    .sort(([a], [b]) => a - b);

  let tableIdx = 0;
  let seatInTable = 0;
  for (const participant of remaining) {
    if (tableIdx >= otherTables.length) break;
    const [, tableSeats] = otherTables[tableIdx];

    // Check conflict rules at table level
    const canSitHere = !hasTableConflict(participant, tableSeats, assignments, rules);
    if (canSitHere && seatInTable < tableSeats.length) {
      assignments.set(tableSeats[seatInTable].seatId, participant.participantId);
      seatInTable++;
      if (seatInTable >= tableSeats.length) {
        tableIdx++;
        seatInTable = 0;
      }
    } else {
      // Try next table
      tableIdx++;
      seatInTable = 0;
    }
  }

  return {
    assignments,
    violations,
    score: calculateScore(assignments, rules, seats),
    isComplete: violations.length === 0,
  };
}

function solveRowBasedSeating(
  seats: SeatPosition[],
  participants: ParticipantToSeat[],
  rules: ConflictRule[],
  preserved: Map<string, string>,
): SeatingResult {
  const assignments = new Map<string, string>(preserved);
  const sorted = [...participants].sort((a, b) => a.protocolRank - b.protocolRank);
  const availableSeats = seats.filter((s) => !preserved.has(s.seatId));

  for (let i = 0; i < Math.min(sorted.length, availableSeats.length); i++) {
    assignments.set(availableSeats[i].seatId, sorted[i].participantId);
  }

  return {
    assignments,
    violations: [],
    score: 1.0,
    isComplete: true,
  };
}

function repairConflicts(
  assignments: Map<string, string>,
  seats: SeatPosition[],
  rules: ConflictRule[],
  preserved: Map<string, string>,
): { resolved: ConflictViolation[]; unresolved: ConflictViolation[] } {
  const resolved: ConflictViolation[] = [];
  const unresolved: ConflictViolation[] = [];
  const maxIterations = 100;
  let iteration = 0;

  while (iteration < maxIterations) {
    const violation = findFirstViolation(assignments, seats, rules);
    if (!violation) break;

    // Try to find a swap that resolves this violation
    const swapTarget = findBestSwap(violation, assignments, seats, rules, preserved);
    if (swapTarget) {
      // Perform swap
      const valA = assignments.get(violation.seatA);
      const valB = assignments.get(swapTarget);
      if (valA) assignments.set(swapTarget, valA);
      if (valB) assignments.set(violation.seatA, valB);
      resolved.push(violation);
    } else {
      unresolved.push(violation);
      break; // Cannot resolve further
    }
    iteration++;
  }

  return { resolved, unresolved };
}

function findFirstViolation(
  assignments: Map<string, string>,
  seats: SeatPosition[],
  rules: ConflictRule[],
): ConflictViolation | null {
  // Build seat-to-country lookup
  const seatCountry = new Map<string, string>();
  // (would need participant -> country lookup in production)
  // Check each rule against current assignments
  for (const rule of rules) {
    const seatsA = findSeatsByCountry(rule.countryA, assignments, seats);
    const seatsB = findSeatsByCountry(rule.countryB, assignments, seats);

    for (const sA of seatsA) {
      for (const sB of seatsB) {
        const distance = calculateSeatDistance(sA, sB, seats);
        if (rule.ruleType === "NO_ADJACENT" && distance <= 1) {
          return {
            ruleId: rule.id,
            countryA: rule.countryA,
            countryB: rule.countryB,
            ruleType: rule.ruleType,
            requiredDistance: 2,
            actualDistance: distance,
            seatA: sA.seatId,
            seatB: sB.seatId,
          };
        }
        if (rule.ruleType === "MINIMUM_DISTANCE" && distance < (rule.distance ?? 3)) {
          return {
            ruleId: rule.id,
            countryA: rule.countryA,
            countryB: rule.countryB,
            ruleType: rule.ruleType,
            requiredDistance: rule.distance ?? 3,
            actualDistance: distance,
            seatA: sA.seatId,
            seatB: sB.seatId,
          };
        }
      }
    }
  }
  return null;
}

function calculateSeatDistance(a: SeatPosition, b: SeatPosition, allSeats: SeatPosition[]): number {
  // For linear layouts: count seats between two positions on the same side
  if (a.side === b.side) {
    return Math.abs(a.seatNumber! - b.seatNumber!);
  }
  // For seats on adjacent sides: use Euclidean distance on position coordinates
  const dx = a.positionX - b.positionX;
  const dy = a.positionY - b.positionY;
  return Math.sqrt(dx * dx + dy * dy) / 80; // Normalize to seat units
}

function calculateScore(
  assignments: Map<string, string>,
  rules: ConflictRule[],
  seats: SeatPosition[],
): number {
  // Score from 0.0 to 1.0 based on constraint satisfaction
  let satisfied = 0;
  let total = rules.length;
  for (const rule of rules) {
    const violation = findFirstViolation(assignments, seats, [rule]);
    if (!violation) satisfied++;
  }
  return total > 0 ? satisfied / total : 1.0;
}

// Helper stubs
function buildSeatPositions(arrangement: any): SeatPosition[] {
  return [];
}
function buildParticipantList(...args: any[]): ParticipantToSeat[] {
  return [];
}
function loadMeetingParticipants(...args: any[]): Promise<any[]> {
  return Promise.resolve([]);
}
function findSeatsByCountry(...args: any[]): SeatPosition[] {
  return [];
}
function hasTableConflict(...args: any[]): boolean {
  return false;
}
function findBestSwap(...args: any[]): string | null {
  return null;
}
async function createSeatingVersion(...args: any[]): Promise<void> {}
async function applyAssignments(...args: any[]): Promise<void> {}
```

### 5.3 Seating Conflict Resolution

```typescript
// file: app/services/protocol/conflict-resolver.server.ts

interface ConflictResolutionResult {
  isValid: boolean;
  violations: ConflictViolation[];
  suggestions: SwapSuggestion[];
}

interface SwapSuggestion {
  violation: ConflictViolation;
  seatA: string;
  seatB: string;
  newDistanceAfterSwap: number;
  resolvesViolation: boolean;
  createsNewViolations: boolean;
}

export async function validateAndSuggest(arrangementId: string): Promise<ConflictResolutionResult> {
  const arrangement = await prisma.seatingArrangement.findUnique({
    where: { id: arrangementId },
    include: { seats: { include: { participant: true } } },
  });
  if (!arrangement) throw new Error("Arrangement not found");

  const rules = await prisma.seatingConflictRule.findMany({
    where: { tenantId: arrangement.tenantId, eventId: arrangement.eventId },
  });

  const violations = findAllViolations(arrangement.seats, rules);
  const suggestions: SwapSuggestion[] = [];

  for (const violation of violations) {
    // For each violation, find the best swap that resolves it
    const candidateSwaps = generateCandidateSwaps(violation, arrangement.seats, rules);

    // Rank candidates by: resolves violation > doesn't create new ones > minimal rank disruption
    const ranked = candidateSwaps.sort((a, b) => {
      if (a.resolvesViolation !== b.resolvesViolation) return a.resolvesViolation ? -1 : 1;
      if (a.createsNewViolations !== b.createsNewViolations) return a.createsNewViolations ? 1 : -1;
      return b.newDistanceAfterSwap - a.newDistanceAfterSwap;
    });

    if (ranked.length > 0) {
      suggestions.push(ranked[0]);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    suggestions,
  };
}

function findAllViolations(seats: any[], rules: ConflictRule[]): ConflictViolation[] {
  const violations: ConflictViolation[] = [];
  for (const rule of rules) {
    const seatsA = seats.filter((s) => s.participant?.countryCode === rule.countryA);
    const seatsB = seats.filter((s) => s.participant?.countryCode === rule.countryB);

    for (const sA of seatsA) {
      for (const sB of seatsB) {
        const dist = seatDistance(sA, sB);
        if (rule.ruleType === "NO_ADJACENT" && dist <= 1) {
          violations.push({
            ruleId: rule.id,
            countryA: rule.countryA,
            countryB: rule.countryB,
            ruleType: rule.ruleType,
            requiredDistance: 2,
            actualDistance: dist,
            seatA: sA.id,
            seatB: sB.id,
          });
        }
        if (rule.ruleType === "MINIMUM_DISTANCE" && dist < (rule.distance ?? 3)) {
          violations.push({
            ruleId: rule.id,
            countryA: rule.countryA,
            countryB: rule.countryB,
            ruleType: rule.ruleType,
            requiredDistance: rule.distance ?? 3,
            actualDistance: dist,
            seatA: sA.id,
            seatB: sB.id,
          });
        }
      }
    }
  }
  return violations;
}

function generateCandidateSwaps(
  violation: ConflictViolation,
  allSeats: any[],
  rules: ConflictRule[],
): SwapSuggestion[] {
  const candidates: SwapSuggestion[] = [];
  const offendingSeat = allSeats.find((s) => s.id === violation.seatA);
  if (!offendingSeat) return candidates;

  for (const candidate of allSeats) {
    if (candidate.id === violation.seatA || candidate.id === violation.seatB) continue;
    if (!candidate.participantId) continue; // Skip empty seats for swap

    // Simulate swap
    const newDist = seatDistance(candidate, allSeats.find((s) => s.id === violation.seatB)!);
    const resolves = newDist >= violation.requiredDistance;

    // Check if swap creates new violations
    const newViolations = checkSwapViolations(offendingSeat, candidate, allSeats, rules);

    candidates.push({
      violation,
      seatA: violation.seatA,
      seatB: candidate.id,
      newDistanceAfterSwap: newDist,
      resolvesViolation: resolves,
      createsNewViolations: newViolations.length > 0,
    });
  }

  return candidates;
}

function seatDistance(a: any, b: any): number {
  if (a.tableNumber === b.tableNumber && a.seatNumber && b.seatNumber) {
    return Math.abs(a.seatNumber - b.seatNumber);
  }
  const dx = (a.positionX ?? 0) - (b.positionX ?? 0);
  const dy = (a.positionY ?? 0) - (b.positionY ?? 0);
  return Math.sqrt(dx * dx + dy * dy) / 80;
}

function checkSwapViolations(
  seatA: any,
  seatB: any,
  allSeats: any[],
  rules: ConflictRule[],
): ConflictViolation[] {
  return []; // Implementation: simulate swap and check all rules
}
```

### 5.4 Bilateral Scheduling Algorithm

The bilateral scheduling flow from the source specification:

```
Focal point opens Delegation Portal → [Request Bilateral Meeting]
  → Select counterpart: [Republic of Ethiopia ▾]
  → Priority: auto-set by participant type (Head of State = CRITICAL)
  → Duration: [30 min ▾]
  → Topic: [Climate cooperation and Nile negotiations]
  → Interpreter needed: [✓] Languages: [Amharic, English]
  → Preferred times: [Feb 11 morning ▾] [Feb 12 any ▾]
  → Submit → BilateralRequest created (status: REQUESTED)

  Protocol office workflow:
  → Request appears in bilateral dashboard
  → System notifies Ethiopia's focal point: "Kenya requests bilateral meeting"
  → Ethiopia's focal point: [Accept] / [Decline] / [Suggest Alternative]
  → If both parties confirm: status → BOTH_CONFIRMED

  → Auto-scheduling algorithm:
    1. Gather all BOTH_CONFIRMED requests
    2. For each request:
       a. Find available BilateralSlots where NEITHER party has another meeting
       b. Filter by party's preferred time windows
       c. Find available BilateralRoom of sufficient capacity
       d. If interpreter needed: check interpreter availability (§12.23)
    3. Assign slot + room → status → SCHEDULED
    4. Notify both parties: "Bilateral confirmed: Feb 11, 10:00, Room 7"

  → Conflict resolution:
    - If time conflict: prioritize by BilateralPriority
    - CRITICAL meetings scheduled first, displacing MEDIUM/LOW if needed
    - Displaced meetings re-scheduled to next available slot
    - Admin can manually override any assignment
```

**Extended TypeScript Implementation:**

```typescript
// file: app/services/protocol/bilateral-scheduler.server.ts

import { prisma } from "~/db.server";

interface ScheduleResult {
  scheduled: ScheduledMeeting[];
  unscheduled: UnscheduledMeeting[];
  displaced: DisplacedMeeting[];
}

interface ScheduledMeeting {
  requestId: string;
  slotId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomName: string;
}

interface UnscheduledMeeting {
  requestId: string;
  reason: string;
}

interface DisplacedMeeting {
  requestId: string;
  previousSlotId: string;
  newSlotId: string;
  reason: string;
}

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function autoScheduleBilaterals(
  tenantId: string,
  eventId: string,
  options: {
    scope: "ALL_CONFIRMED" | "SPECIFIC";
    requestIds?: string[];
    respectPriority: boolean;
    allowDisplacement: boolean;
    bufferMinutes: number;
  },
): Promise<ScheduleResult> {
  // 1. Gather all BOTH_CONFIRMED requests
  const whereClause: any = {
    tenantId,
    eventId,
    status: options.scope === "ALL_CONFIRMED" ? "BOTH_CONFIRMED" : undefined,
  };
  if (options.scope === "SPECIFIC" && options.requestIds) {
    whereClause.id = { in: options.requestIds };
  }

  const requests = await prisma.bilateralRequest.findMany({
    where: whereClause,
    orderBy: options.respectPriority ? { priority: "asc" } : { createdAt: "asc" },
  });

  // Sort by priority weight
  if (options.respectPriority) {
    requests.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  // 2. Load all available slots
  const slots = await prisma.bilateralSlot.findMany({
    where: { eventId },
    include: { requests: { where: { status: "SCHEDULED" } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  // 3. Load all available rooms
  const rooms = await prisma.bilateralRoom.findMany({
    where: { tenantId, eventId, isAvailable: true },
  });

  // 4. Build availability matrix
  const partySchedule = await buildPartyScheduleMap(eventId);
  const roomSchedule = buildRoomScheduleMap(slots, rooms);

  const scheduled: ScheduledMeeting[] = [];
  const unscheduled: UnscheduledMeeting[] = [];
  const displaced: DisplacedMeeting[] = [];

  // 5. Schedule each request
  for (const request of requests) {
    const result = findBestSlotAndRoom(
      request,
      slots,
      rooms,
      partySchedule,
      roomSchedule,
      options.bufferMinutes,
    );

    if (result) {
      // Assign slot and room
      await prisma.bilateralRequest.update({
        where: { id: request.id },
        data: {
          slotId: result.slotId,
          roomId: result.roomId,
          status: "SCHEDULED",
        },
      });

      // Update availability
      markSlotOccupied(result.slotId, result.roomId, request, partySchedule, roomSchedule);

      scheduled.push({
        requestId: request.id,
        slotId: result.slotId,
        roomId: result.roomId,
        date: result.date,
        startTime: result.startTime,
        endTime: result.endTime,
        roomName: result.roomName,
      });
    } else if (options.allowDisplacement) {
      // Try to displace a lower priority meeting
      const displacementResult = tryDisplacement(
        request,
        slots,
        rooms,
        partySchedule,
        roomSchedule,
        options.bufferMinutes,
      );

      if (displacementResult) {
        scheduled.push(displacementResult.newMeeting);
        displaced.push(displacementResult.displaced);
      } else {
        unscheduled.push({
          requestId: request.id,
          reason: "No available slot/room combination found, even with displacement",
        });
      }
    } else {
      unscheduled.push({
        requestId: request.id,
        reason: "No available slot/room combination found",
      });
    }
  }

  // 6. Send notifications for all scheduled meetings
  for (const meeting of scheduled) {
    await sendBilateralNotification(meeting);
  }

  return { scheduled, unscheduled, displaced };
}

function findBestSlotAndRoom(
  request: any,
  slots: any[],
  rooms: any[],
  partySchedule: Map<string, Set<string>>,
  roomSchedule: Map<string, Map<string, string>>,
  bufferMinutes: number,
): {
  slotId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomName: string;
} | null {
  for (const slot of slots) {
    // Check if neither party is busy during this slot (+ buffer)
    const slotKey = `${slot.date}_${slot.startTime}`;
    const requesterBusy = partySchedule.get(request.requestingParty)?.has(slotKey);
    const requestedBusy = partySchedule.get(request.requestedParty)?.has(slotKey);

    if (requesterBusy || requestedBusy) continue;

    // Check buffer time for consecutive meetings
    if (bufferMinutes > 0) {
      const hasBufferConflict = checkBufferConflict(
        slot,
        request.requestingParty,
        request.requestedParty,
        partySchedule,
        bufferMinutes,
      );
      if (hasBufferConflict) continue;
    }

    // Find available room for this slot
    for (const room of rooms) {
      if (room.capacity < 2) continue; // Min 2 for bilateral

      const roomSlotKey = `${room.id}_${slotKey}`;
      const roomBusy = roomSchedule.get(room.id)?.has(slotKey);
      if (roomBusy) continue;

      // Check interpreter if needed
      if (request.interpreterNeeded) {
        const interpreterAvailable = true; // Check via Module 13 API
        if (!interpreterAvailable) continue;
      }

      // Check amenity requirements
      if (request.interpreterNeeded && !room.amenities.includes("Interpretation booth")) {
        continue;
      }

      return {
        slotId: slot.id,
        roomId: room.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomName: room.name,
      };
    }
  }

  return null;
}

function tryDisplacement(
  highPriorityRequest: any,
  slots: any[],
  rooms: any[],
  partySchedule: Map<string, Set<string>>,
  roomSchedule: Map<string, Map<string, string>>,
  bufferMinutes: number,
): { newMeeting: ScheduledMeeting; displaced: DisplacedMeeting } | null {
  // Find a lower-priority scheduled meeting that occupies a suitable slot
  for (const slot of slots) {
    for (const existingRequest of slot.requests) {
      if (
        PRIORITY_ORDER[existingRequest.priority] <= PRIORITY_ORDER[highPriorityRequest.priority]
      ) {
        continue; // Cannot displace equal or higher priority
      }

      // Can the high-priority request use this slot?
      const slotKey = `${slot.date}_${slot.startTime}`;
      const requesterBusy = partySchedule.get(highPriorityRequest.requestingParty)?.has(slotKey);
      const requestedBusy = partySchedule.get(highPriorityRequest.requestedParty)?.has(slotKey);

      if (!requesterBusy && !requestedBusy) {
        // Displace the existing meeting and reschedule it
        return {
          newMeeting: {
            requestId: highPriorityRequest.id,
            slotId: slot.id,
            roomId: existingRequest.roomId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            roomName: "Displaced room",
          },
          displaced: {
            requestId: existingRequest.id,
            previousSlotId: slot.id,
            newSlotId: "", // Will be rescheduled in next pass
            reason: `Displaced by ${highPriorityRequest.priority} priority meeting`,
          },
        };
      }
    }
  }

  return null;
}

// Helper stubs
async function buildPartyScheduleMap(eventId: string): Promise<Map<string, Set<string>>> {
  return new Map();
}
function buildRoomScheduleMap(slots: any[], rooms: any[]): Map<string, Map<string, string>> {
  return new Map();
}
function markSlotOccupied(...args: any[]): void {}
function checkBufferConflict(...args: any[]): boolean {
  return false;
}
async function sendBilateralNotification(meeting: ScheduledMeeting): Promise<void> {}
```

### 5.5 Meeting Brief Generation

The meeting brief PDF generation from the source specification:

```
Admin clicks [Generate Briefs] → Select delegation
  → System produces PDF per delegation:

  ┌──────────────────────────────────────────────────────────────┐
  │ BILATERAL MEETING BRIEF — Republic of Kenya                  │
  │ 38th AU Summit, February 10-17, 2026                        │
  ├──────────────────────────────────────────────────────────────┤
  │                                                              │
  │ Meeting 1: Kenya ↔ Ethiopia                                  │
  │ Date: Feb 11 | Time: 09:00-09:30 | Room: Bilateral Room 1  │
  │ Topic: Climate cooperation and Nile negotiations             │
  │ Interpreter: Amharic-English (Interpreter: A. Tadesse)       │
  │ Counterpart: H.E. President [Name]                          │
  │ Transport: Pickup from Sheraton at 08:30                     │
  │                                                              │
  │ Meeting 2: Kenya ↔ Nigeria                                   │
  │ Date: Feb 11 | Time: 10:00-10:30 | Room: Bilateral Room 1  │
  │ Topic: Trade and security cooperation                       │
  │ Counterpart: H.E. President [Name]                          │
  │ Transport: Already at venue                                  │
  │                                                              │
  │ ... (5 total meetings)                                       │
  └──────────────────────────────────────────────────────────────┘
```

**TypeScript Implementation:**

```typescript
// file: app/services/protocol/brief-generator.server.ts

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "~/db.server";
import { uploadToBlob } from "~/services/storage.server";

interface MeetingBriefData {
  delegationCode: string;
  delegationName: string;
  eventName: string;
  eventDates: string;
  meetings: Array<{
    number: number;
    counterpartCode: string;
    counterpartName: string;
    date: string;
    startTime: string;
    endTime: string;
    roomName: string;
    topic: string | null;
    interpreterInfo: string | null;
    counterpartTitle: string | null;
    counterpartLeaderName: string | null;
    transportNote: string | null;
  }>;
  generatedAt: Date;
}

export async function generateMeetingBrief(
  tenantId: string,
  eventId: string,
  delegationCode: string,
): Promise<{ pdfUrl: string; meetingCount: number }> {
  // 1. Load all scheduled meetings for this delegation
  const meetings = await prisma.bilateralRequest.findMany({
    where: {
      tenantId,
      eventId,
      status: "SCHEDULED",
      OR: [{ requestingParty: delegationCode }, { requestedParty: delegationCode }],
    },
    include: {
      slot: true,
      room: true,
    },
    orderBy: [{ slot: { date: "asc" } }, { slot: { startTime: "asc" } }],
  });

  // 2. Load event details
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  // 3. Build brief data
  const briefData: MeetingBriefData = {
    delegationCode,
    delegationName: await getCountryName(delegationCode),
    eventName: event?.name ?? "Summit",
    eventDates: formatEventDates(event),
    meetings: await Promise.all(
      meetings.map(async (m, idx) => {
        const counterpartCode =
          m.requestingParty === delegationCode ? m.requestedParty : m.requestingParty;
        const counterpartRank = await prisma.protocolRank.findFirst({
          where: { eventId, countryCode: counterpartCode },
        });

        return {
          number: idx + 1,
          counterpartCode,
          counterpartName: await getCountryName(counterpartCode),
          date: formatDate(m.slot?.date),
          startTime: m.slot?.startTime ?? "",
          endTime: m.slot?.endTime ?? "",
          roomName: m.room?.name ?? "TBD",
          topic: m.topic,
          interpreterInfo: m.interpreterNeeded
            ? `${m.languages.join("-")} interpretation required`
            : null,
          counterpartTitle: counterpartRank?.headOfStateTitle ?? null,
          counterpartLeaderName: counterpartRank?.headOfStateName ?? null,
          transportNote: null, // Populated from transport module
        };
      }),
    ),
    generatedAt: new Date(),
  };

  // 4. Render PDF using @react-pdf/renderer
  const pdfBuffer = await renderToBuffer(MeetingBriefDocument({ data: briefData }));

  // 5. Upload to Azure Blob Storage
  const blobPath = `protocol/briefs/${eventId}/${delegationCode}_brief_${Date.now()}.pdf`;
  const pdfUrl = await uploadToBlob(blobPath, pdfBuffer, "application/pdf");

  // 6. Save briefing record
  await prisma.protocolBriefing.upsert({
    where: {
      tenantId_eventId_delegationCode_briefingType_date: {
        tenantId,
        eventId,
        delegationCode,
        briefingType: "BILATERAL",
        date: new Date(),
      },
    },
    update: { pdfUrl, generatedAt: new Date(), status: "GENERATED" },
    create: {
      tenantId,
      eventId,
      delegationCode,
      delegationName: briefData.delegationName,
      briefingType: "BILATERAL",
      date: new Date(),
      content: briefData as any,
      pdfUrl,
      generatedAt: new Date(),
      status: "GENERATED",
    },
  });

  return { pdfUrl, meetingCount: meetings.length };
}

// React PDF Document component (server-side only)
function MeetingBriefDocument({ data }: { data: MeetingBriefData }) {
  // This would be a React component using @react-pdf/renderer primitives
  // (Document, Page, View, Text, StyleSheet)
  // See Section 6.8 for the full component
  return null; // Placeholder - full implementation in UI section
}

// Helper stubs
async function getCountryName(code: string): Promise<string> {
  return code;
}
function formatEventDates(event: any): string {
  return "";
}
function formatDate(d: any): string {
  return "";
}
```

### 5.6 Companion Registration Lifecycle

From the source specification:

```
Focal point logs in → Views delegation → Clicks "Add Companion" on a delegate's row
  → Form: name, relationship, DOB, passport (if needed), photo
  → Companion registration created with status REGISTERED
  → Admin/validator reviews → status → APPROVED
  → Badge generated (separate template: different color, "COMPANION" label, limited zone access)
  → Companion appears on delegate's profile: "Traveling with: Jane Doe (Spouse)"
```

**TypeScript Implementation:**

```typescript
// file: app/services/protocol/companion-lifecycle.server.ts

import { prisma } from "~/db.server";
import { generateRegistrationCode } from "~/utils/codes.server";

interface CompanionRegistrationInput {
  tenantId: string;
  eventId: string;
  primaryParticipantId: string;
  firstName: string;
  familyName: string;
  relationship: "SPOUSE" | "CHILD" | "PARENT" | "ASSISTANT" | "AIDE_DE_CAMP" | "OTHER";
  gender?: string;
  dateOfBirth?: Date;
  nationalityId?: string;
  passportNumber?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  customData?: Record<string, unknown>;
}

export async function registerCompanion(
  input: CompanionRegistrationInput,
): Promise<{ companionId: string; registrationCode: string }> {
  // 1. Validate primary participant exists and is approved
  const primaryParticipant = await prisma.participant.findUnique({
    where: { id: input.primaryParticipantId },
  });
  if (!primaryParticipant) throw new Error("Primary participant not found");
  if (primaryParticipant.status !== "APPROVED" && primaryParticipant.status !== "BADGE_PRINTED") {
    throw new Error("Primary participant must be approved before adding companions");
  }

  // 2. Check companion limits (configurable per event)
  const existingCompanions = await prisma.companionRegistration.count({
    where: {
      eventId: input.eventId,
      primaryParticipantId: input.primaryParticipantId,
      status: { not: "CANCELLED" },
    },
  });
  const maxCompanions = await getCompanionLimit(input.tenantId, input.eventId);
  if (existingCompanions >= maxCompanions) {
    throw new Error(`Maximum ${maxCompanions} companions per delegate`);
  }

  // 3. Generate registration code
  const registrationCode = await generateRegistrationCode("CMP");

  // 4. Create companion registration
  const companion = await prisma.companionRegistration.create({
    data: {
      tenantId: input.tenantId,
      eventId: input.eventId,
      primaryParticipantId: input.primaryParticipantId,
      firstName: input.firstName,
      familyName: input.familyName,
      relationship: input.relationship,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      nationalityId: input.nationalityId,
      passportNumber: input.passportNumber,
      email: input.email,
      phone: input.phone,
      photoUrl: input.photoUrl,
      customData: input.customData ?? {},
      registrationCode,
      status: "REGISTERED",
    },
  });

  return { companionId: companion.id, registrationCode };
}

export async function approveCompanion(companionId: string, approvedBy: string): Promise<void> {
  const companion = await prisma.companionRegistration.findUnique({
    where: { id: companionId },
  });
  if (!companion) throw new Error("Companion not found");
  if (companion.status !== "REGISTERED") {
    throw new Error(`Cannot approve companion in status: ${companion.status}`);
  }

  await prisma.companionRegistration.update({
    where: { id: companionId },
    data: { status: "APPROVED" },
  });

  // Auto-create welcome package assembly (companion version)
  const companionPackage = await prisma.welcomePackage.findFirst({
    where: {
      tenantId: companion.tenantId,
      eventId: companion.eventId,
      forParticipantType: "COMPANION",
    },
  });

  if (companionPackage) {
    await prisma.packageAssembly.create({
      data: {
        packageId: companionPackage.id,
        participantId: companion.id,
        delegationName: null,
        status: "PENDING",
      },
    });
  }
}

export async function generateCompanionBadge(
  companionId: string,
): Promise<{ badgeUrl: string; zones: string[] }> {
  const companion = await prisma.companionRegistration.findUnique({
    where: { id: companionId },
    include: { primaryParticipant: true },
  });
  if (!companion) throw new Error("Companion not found");
  if (companion.status !== "APPROVED") {
    throw new Error("Companion must be approved before badge generation");
  }

  // Companion badges have limited zone access
  const zones = ["SOCIAL_EVENTS", "SPOUSE_PROGRAM", "DINING", "HOTEL_SHUTTLE"];

  // Generate badge through Module 10 badge infrastructure
  const badgeUrl = await generateBadgePdf({
    registrationCode: companion.registrationCode,
    name: `${companion.firstName} ${companion.familyName}`,
    type: "COMPANION",
    relationship: companion.relationship,
    primaryDelegate: `${companion.primaryParticipant.firstName} ${companion.primaryParticipant.familyName}`,
    photoUrl: companion.photoUrl,
    zones,
    templateId: companion.badgeTemplateId,
  });

  await prisma.companionRegistration.update({
    where: { id: companionId },
    data: { status: "BADGE_PRINTED" },
  });

  return { badgeUrl, zones };
}

export async function signUpForActivity(
  companionId: string,
  activityId: string,
  notes?: string,
): Promise<{ signupId: string; remainingCapacity: number }> {
  // Use transaction to prevent race condition on capacity
  return await prisma.$transaction(async (tx) => {
    const activity = await tx.companionActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new Error("Activity not found");

    if (activity.currentSignups >= activity.capacity) {
      throw new Error("Activity is full");
    }

    // Check for scheduling conflict
    const companion = await tx.companionRegistration.findUnique({
      where: { id: companionId },
      include: { activitySignups: { include: { activity: true } } },
    });
    if (!companion) throw new Error("Companion not found");

    const hasConflict = companion.activitySignups.some((s) => {
      if (s.status === "CANCELLED") return false;
      const existing = s.activity;
      return (
        existing.date.getTime() === activity.date.getTime() &&
        existing.startTime < activity.endTime &&
        existing.endTime > activity.startTime
      );
    });
    if (hasConflict) throw new Error("Time conflict with existing activity signup");

    const signup = await tx.companionActivitySignup.create({
      data: {
        activityId,
        companionId,
        status: "SIGNED_UP",
        notes,
      },
    });

    await tx.companionActivity.update({
      where: { id: activityId },
      data: { currentSignups: { increment: 1 } },
    });

    return {
      signupId: signup.id,
      remainingCapacity: activity.capacity - activity.currentSignups - 1,
    };
  });
}

// Helper stubs
async function getCompanionLimit(tenantId: string, eventId: string): Promise<number> {
  return 5;
}
async function generateBadgePdf(data: any): Promise<string> {
  return "";
}
```

### 5.7 Gift Allocation Engine

The gift protocol rules from the source specification:

```json
// Configurable per tenant/event via SystemSetting or event customData
{
  "giftValueThreshold": 250,
  "giftValueCurrency": "USD",
  "requireApprovalAboveThreshold": true,
  "giftsByProtocolLevel": {
    "HEAD_OF_STATE": ["Commemorative Medal", "AU Yearbook 2026", "Crystal Award"],
    "MINISTER": ["Commemorative Medal", "AU Yearbook 2026"],
    "AMBASSADOR": ["AU Yearbook 2026"],
    "DELEGATE": []
  }
}
```

When gifts are allocated, the system checks:

- Total gift value to recipient does not exceed threshold (or flags for approval if it does)
- Stock is available (`GiftItem.quantity - GiftItem.allocated > 0`)
- Protocol level matches the allocation rules

**TypeScript Implementation:**

```typescript
// file: app/services/protocol/gift-allocation.server.ts

import { prisma } from "~/db.server";

interface GiftProtocolConfig {
  giftValueThreshold: number;
  giftValueCurrency: string;
  requireApprovalAboveThreshold: boolean;
  giftsByProtocolLevel: Record<string, string[]>;
}

interface AllocationResult {
  allocationId: string;
  complianceCheck: {
    withinThreshold: boolean;
    totalValueToRecipient: number;
    threshold: number;
    requiresApproval: boolean;
  };
}

export async function allocateGift(
  tenantId: string,
  eventId: string,
  input: {
    giftItemId: string;
    recipientType: "DELEGATION" | "INDIVIDUAL";
    recipientId?: string;
    recipientName: string;
    quantity: number;
    protocolLevel?: string;
    deliveryMethod?: string;
    notes?: string;
  },
): Promise<AllocationResult> {
  // 1. Load gift item
  const giftItem = await prisma.giftItem.findUnique({
    where: { id: input.giftItemId },
  });
  if (!giftItem) throw new Error("Gift item not found");

  // 2. Check stock availability
  const available = giftItem.quantity - giftItem.allocated;
  if (available < input.quantity) {
    throw new Error(`Insufficient stock: ${available} available, ${input.quantity} requested`);
  }

  // 3. Load protocol configuration
  const config = await getGiftProtocolConfig(tenantId, eventId);

  // 4. Validate protocol level matching
  if (input.protocolLevel && config.giftsByProtocolLevel[input.protocolLevel]) {
    const allowedGifts = config.giftsByProtocolLevel[input.protocolLevel];
    if (allowedGifts.length > 0 && !allowedGifts.includes(giftItem.name)) {
      throw new Error(
        `Gift "${giftItem.name}" not allowed for protocol level ${input.protocolLevel}. ` +
          `Allowed: ${allowedGifts.join(", ")}`,
      );
    }
  }

  // 5. Calculate total gift value to this recipient
  const existingAllocations = await prisma.giftAllocation.findMany({
    where: {
      recipientId: input.recipientId,
      status: { not: "RETURNED" },
    },
    include: { giftItem: true },
  });

  const existingTotalValue = existingAllocations.reduce(
    (sum, a) => sum + (a.giftItem.value ?? 0) * a.quantity,
    0,
  );
  const newItemValue = (giftItem.value ?? 0) * input.quantity;
  const totalValueToRecipient = existingTotalValue + newItemValue;

  const withinThreshold = totalValueToRecipient <= config.giftValueThreshold;
  const requiresApproval = !withinThreshold && config.requireApprovalAboveThreshold;

  // 6. Create allocation
  const allocation = await prisma.$transaction(async (tx) => {
    // Decrement stock
    await tx.giftItem.update({
      where: { id: input.giftItemId },
      data: { allocated: { increment: input.quantity } },
    });

    // Create allocation record
    return tx.giftAllocation.create({
      data: {
        giftItemId: input.giftItemId,
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        recipientName: input.recipientName,
        quantity: input.quantity,
        protocolLevel: input.protocolLevel,
        status: requiresApproval ? "ALLOCATED" : "ALLOCATED",
        deliveryMethod: input.deliveryMethod,
        notes: input.notes,
      },
    });
  });

  return {
    allocationId: allocation.id,
    complianceCheck: {
      withinThreshold,
      totalValueToRecipient,
      threshold: config.giftValueThreshold,
      requiresApproval,
    },
  };
}

export async function bulkAllocateByProtocolLevel(
  tenantId: string,
  eventId: string,
  protocolLevel: string,
  giftItemIds: string[],
  deliveryMethod: string,
): Promise<{
  created: number;
  skipped: number;
  errors: Array<{ recipientName: string; reason: string }>;
}> {
  // Find all participants at this protocol level
  const ranks = await prisma.protocolRank.findMany({
    where: { tenantId, eventId },
  });

  const config = await getGiftProtocolConfig(tenantId, eventId);
  const allowedGifts = config.giftsByProtocolLevel[protocolLevel] ?? [];

  let created = 0;
  let skipped = 0;
  const errors: Array<{ recipientName: string; reason: string }> = [];

  for (const rank of ranks) {
    for (const giftItemId of giftItemIds) {
      try {
        // Check if already allocated
        const existing = await prisma.giftAllocation.findFirst({
          where: {
            giftItemId,
            recipientId: rank.countryCode,
            status: { not: "RETURNED" },
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await allocateGift(tenantId, eventId, {
          giftItemId,
          recipientType: "DELEGATION",
          recipientId: rank.countryCode,
          recipientName: rank.countryName,
          quantity: 1,
          protocolLevel,
          deliveryMethod,
        });
        created++;
      } catch (error: any) {
        errors.push({
          recipientName: rank.countryName,
          reason: error.message,
        });
      }
    }
  }

  return { created, skipped, errors };
}

async function getGiftProtocolConfig(
  tenantId: string,
  eventId: string,
): Promise<GiftProtocolConfig> {
  // Load from SystemSetting or event customData
  const defaults: GiftProtocolConfig = {
    giftValueThreshold: 250,
    giftValueCurrency: "USD",
    requireApprovalAboveThreshold: true,
    giftsByProtocolLevel: {
      HEAD_OF_STATE: ["Commemorative Medal", "AU Yearbook 2026", "Crystal Award"],
      MINISTER: ["Commemorative Medal", "AU Yearbook 2026"],
      AMBASSADOR: ["AU Yearbook 2026"],
      DELEGATE: [],
    },
  };
  return defaults;
}
```

### 5.8 Welcome Package Assembly Pipeline

From the source specification:

```
Admin creates package definitions → "VIP Package" contains: medal, yearbook, city guide, SIM card, badge holder
  → Participant approved → PackageAssembly auto-created (status: PENDING)
  → Assembly team prints packing list:

     PACKING LIST - Delegation: Republic of Kenya
     Package: VIP Welcome Package
     Recipient: H.E. President Ruto

     ☐ Commemorative Medal (gold box)
     ☐ AU Yearbook 2026
     ☐ Addis Ababa City Guide (English)
     ☐ Local SIM Card + data plan card
     ☐ Badge holder (VIP - gold)
     ☐ Event program booklet
     ☐ Branded pen + notepad
     ☐ Personalized welcome letter

     Assembled by: _________ Date: _________
     QA checked by: ________ Date: _________

  → Staff marks as ASSEMBLED → QA person checks → DELIVERED to hotel room
  → If hotel delivery not possible: available at registration desk pickup
```

**TypeScript Implementation:**

```typescript
// file: app/services/protocol/package-assembly.server.ts

import { prisma } from "~/db.server";
import { renderToBuffer } from "@react-pdf/renderer";
import { uploadToBlob } from "~/services/storage.server";

export async function autoCreateAssemblies(
  tenantId: string,
  eventId: string,
  participantId: string,
  participantType: string,
): Promise<string | null> {
  // Find the appropriate package for this participant type
  const pkg = await prisma.welcomePackage.findFirst({
    where: {
      tenantId,
      eventId,
      OR: [
        { forParticipantType: participantType },
        { forParticipantType: null }, // Default package
      ],
    },
    orderBy: { forParticipantType: "desc" }, // Specific type takes precedence
  });

  if (!pkg) return null;

  // Check if assembly already exists
  const existing = await prisma.packageAssembly.findFirst({
    where: { packageId: pkg.id, participantId },
  });
  if (existing) return existing.id;

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });

  const assembly = await prisma.packageAssembly.create({
    data: {
      packageId: pkg.id,
      participantId,
      delegationName: participant?.countryName ?? null,
      status: "PENDING",
    },
  });

  return assembly.id;
}

export async function advanceAssemblyStatus(
  assemblyId: string,
  newStatus: "ASSEMBLED" | "QA_CHECKED" | "DELIVERED",
  staffId: string,
  deliveryMethod?: string,
  notes?: string,
): Promise<void> {
  const assembly = await prisma.packageAssembly.findUnique({
    where: { id: assemblyId },
  });
  if (!assembly) throw new Error("Assembly not found");

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    PENDING: ["ASSEMBLED"],
    ASSEMBLED: ["QA_CHECKED"],
    QA_CHECKED: ["DELIVERED"],
    DELIVERED: [],
  };

  if (!validTransitions[assembly.status]?.includes(newStatus)) {
    throw new Error(`Invalid transition: ${assembly.status} -> ${newStatus}`);
  }

  const updateData: any = { status: newStatus, notes };

  switch (newStatus) {
    case "ASSEMBLED":
      updateData.assembledBy = staffId;
      updateData.assembledAt = new Date();
      break;
    case "QA_CHECKED":
      updateData.checkedBy = staffId;
      updateData.checkedAt = new Date();
      break;
    case "DELIVERED":
      updateData.deliveredAt = new Date();
      updateData.deliveryMethod = deliveryMethod ?? "REGISTRATION_DESK";
      break;
  }

  await prisma.packageAssembly.update({
    where: { id: assemblyId },
    data: updateData,
  });
}

export async function generatePackingListPdf(assemblyId: string): Promise<string> {
  const assembly = await prisma.packageAssembly.findUnique({
    where: { id: assemblyId },
    include: {
      package: true,
    },
  });
  if (!assembly) throw new Error("Assembly not found");

  const participant = assembly.participantId
    ? await prisma.participant.findUnique({ where: { id: assembly.participantId } })
    : null;

  const contents = assembly.package.contents as Array<{
    item: string;
    qty: number;
    notes?: string;
  }>;

  const pdfBuffer = await renderToBuffer(
    PackingListDocument({
      delegationName: assembly.delegationName ?? "Unknown",
      packageName: assembly.package.name,
      recipientName: participant
        ? `${participant.title ?? ""} ${participant.firstName} ${participant.familyName}`.trim()
        : (assembly.delegationName ?? "Unknown"),
      contents,
    }),
  );

  const blobPath = `protocol/packing-lists/${assembly.package.eventId}/${assemblyId}.pdf`;
  return await uploadToBlob(blobPath, pdfBuffer, "application/pdf");
}

// React PDF component stub
function PackingListDocument(data: any) {
  return null;
}
```

### 5.9 Nameplate and Flag Generation

From the source specification:

```
Admin clicks [Print All] → generates print queue:
  → For each assigned seat:
    - Nameplate card (A5 landscape):
      Front: Country flag + Head of State title + Name
      Back: Country name in 3 event languages (EN, FR, AR)
    - Country flag placard (A4 standing)
    - Table number tent card (for banquet layouts)
  → Sent to badge printer queue (same Print station infrastructure)
  → Printer staff print, fold, and place at seats
  → SeatAssignment.nameplatePrinted → true
```

**TypeScript Implementation:**

```typescript
// file: app/services/protocol/nameplate-generator.server.ts

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "~/db.server";
import { uploadToBlob } from "~/services/storage.server";

interface NameplateData {
  seatLabel: string;
  countryCode: string;
  countryName: string;
  countryNameFR: string;
  countryNameAR: string;
  title: string;
  name: string;
  flagUrl: string;
  tableNumber?: number;
  protocolRank?: number;
}

export async function generateNameplates(
  arrangementId: string,
  options: {
    seatIds?: string[];
    format: "A5_LANDSCAPE" | "A4_STANDING" | "TABLE_TENT";
    languages: string[];
    includeFlags: boolean;
    includeTitle: boolean;
  },
): Promise<{ jobId: string; totalNameplates: number; pdfUrl: string }> {
  const arrangement = await prisma.seatingArrangement.findUnique({
    where: { id: arrangementId },
    include: {
      seats: {
        where: options.seatIds ? { id: { in: options.seatIds } } : { participantId: { not: null } },
        include: { participant: true },
      },
    },
  });
  if (!arrangement) throw new Error("Arrangement not found");

  const nameplates: NameplateData[] = [];
  for (const seat of arrangement.seats) {
    if (!seat.participantId || !seat.participant) continue;
    const p = seat.participant as any;

    nameplates.push({
      seatLabel: seat.seatLabel,
      countryCode: p.countryCode,
      countryName: p.countryName ?? p.countryCode,
      countryNameFR: p.countryNameFR ?? p.countryName ?? p.countryCode,
      countryNameAR: p.countryNameAR ?? p.countryName ?? p.countryCode,
      title: options.includeTitle ? (p.title ?? "") : "",
      name: `${p.firstName} ${p.familyName}`,
      flagUrl: `/flags/${p.countryCode.toLowerCase()}.svg`,
      tableNumber: seat.tableNumber ?? undefined,
      protocolRank: seat.protocolRank ?? undefined,
    });
  }

  // Sort by protocol rank for print order
  nameplates.sort((a, b) => (a.protocolRank ?? 999) - (b.protocolRank ?? 999));

  // Render all nameplates to a single PDF
  const pdfBuffer = await renderToBuffer(
    NameplateDocument({ nameplates, format: options.format, includeFlags: options.includeFlags }),
  );

  const blobPath = `protocol/nameplates/${arrangement.eventId}/${arrangementId}_${Date.now()}.pdf`;
  const pdfUrl = await uploadToBlob(blobPath, pdfBuffer, "application/pdf");

  // Mark seats as printed
  await prisma.seatAssignment.updateMany({
    where: {
      arrangementId,
      id: { in: arrangement.seats.map((s) => s.id) },
    },
    data: { nameplatePrinted: true },
  });

  return {
    jobId: `np_${Date.now()}`,
    totalNameplates: nameplates.length,
    pdfUrl,
  };
}

// React PDF component stub
function NameplateDocument(data: any) {
  return null;
}
```

### 5.10 Cultural Sensitivity Rules Engine

```typescript
// file: app/services/protocol/cultural-sensitivity.server.ts

import { prisma } from "~/db.server";

interface CulturalCheck {
  domain: "SEATING" | "GIFTS" | "BILATERAL" | "COMPANION" | "CATERING";
  countryCode?: string;
  participantId?: string;
  context: Record<string, unknown>;
}

interface CulturalCheckResult {
  passed: boolean;
  warnings: Array<{
    severity: "MANDATORY" | "PREFERRED" | "INFORMATIONAL";
    category: string;
    description: string;
    countryCode?: string;
    suggestion?: string;
  }>;
}

export async function checkCulturalSensitivity(
  tenantId: string,
  eventId: string,
  check: CulturalCheck,
): Promise<CulturalCheckResult> {
  // Load applicable cultural considerations
  const considerations = await prisma.culturalConsideration.findMany({
    where: {
      tenantId,
      eventId,
      appliesTo: { has: check.domain },
      OR: [
        { countryCode: check.countryCode },
        { countryCode: null }, // Global rules
        { participantId: check.participantId },
      ],
    },
  });

  const warnings: CulturalCheckResult["warnings"] = [];

  for (const rule of considerations) {
    const isViolated = evaluateCulturalRule(rule, check);
    if (isViolated) {
      warnings.push({
        severity: rule.severity as any,
        category: rule.category,
        description: rule.description,
        countryCode: rule.countryCode ?? undefined,
        suggestion: (rule.metadata as any)?.suggestion,
      });
    }
  }

  const hasMandatoryViolation = warnings.some((w) => w.severity === "MANDATORY");

  return {
    passed: !hasMandatoryViolation,
    warnings,
  };
}

function evaluateCulturalRule(rule: any, check: CulturalCheck): boolean {
  switch (rule.category) {
    case "DIETARY":
      // Check if gift contains food items that violate dietary restrictions
      if (check.domain === "GIFTS") {
        const giftCategory = check.context.giftCategory as string;
        const restrictions = (rule.metadata as any)?.restrictedCategories ?? [];
        return restrictions.includes(giftCategory);
      }
      return false;

    case "RELIGIOUS":
      // Check if activity or meeting conflicts with religious observance times
      if (check.domain === "BILATERAL" || check.domain === "COMPANION") {
        const meetingTime = check.context.startTime as string;
        const observanceTimes = (rule.metadata as any)?.observanceTimes ?? [];
        return observanceTimes.some((t: any) => isTimeOverlap(meetingTime, t));
      }
      return false;

    case "SEATING":
      // Check seating arrangement against cultural seating rules
      if (check.domain === "SEATING") {
        const position = check.context.seatSide as string;
        const prohibitedPositions = (rule.metadata as any)?.prohibitedPositions ?? [];
        return prohibitedPositions.includes(position);
      }
      return false;

    case "GIFT":
      // Check if gift type is culturally inappropriate
      if (check.domain === "GIFTS") {
        const giftName = check.context.giftName as string;
        const prohibitedGifts = (rule.metadata as any)?.prohibitedGiftTypes ?? [];
        return prohibitedGifts.some((pg: string) =>
          giftName.toLowerCase().includes(pg.toLowerCase()),
        );
      }
      return false;

    default:
      return false;
  }
}

function isTimeOverlap(meetingTime: string, observance: { start: string; end: string }): boolean {
  return meetingTime >= observance.start && meetingTime <= observance.end;
}
```

### 5.11 VIP Movement Coordination

```typescript
// file: app/services/protocol/vip-movement.server.ts

import { prisma } from "~/db.server";

interface MovementEntry {
  time: string;
  endTime?: string;
  location: string;
  activity: string;
  transportMode: "MOTORCADE" | "SHUTTLE" | "WALKING" | "PRIVATE_VEHICLE";
  securityDetail?: string;
  notes?: string;
}

export async function generateVIPSchedule(
  tenantId: string,
  eventId: string,
  participantId: string,
  date: Date,
): Promise<{ scheduleId: string; entries: MovementEntry[] }> {
  // 1. Gather all activities for this VIP on this date
  const bilaterals = await prisma.bilateralRequest.findMany({
    where: {
      eventId,
      status: "SCHEDULED",
      slot: { date },
      OR: [{ requestingParty: participantId }, { requestedParty: participantId }],
    },
    include: { slot: true, room: true },
  });

  // 2. Get meeting/session schedule from agenda
  const sessions = await getSessionSchedule(eventId, participantId, date);

  // 3. Get seating assignments (ceremonies, dinners)
  const seatingEvents = await getSeatingEvents(eventId, participantId, date);

  // 4. Build chronological movement schedule
  const entries: MovementEntry[] = [];

  // Add hotel departure
  entries.push({
    time: "07:30",
    location: "Hotel Lobby",
    activity: "Departure to venue",
    transportMode: "MOTORCADE",
  });

  // Add all events in chronological order
  const allEvents = [
    ...bilaterals.map((b) => ({
      time: b.slot?.startTime ?? "00:00",
      endTime: b.slot?.endTime,
      location: b.room?.name ?? "TBD",
      activity: `Bilateral: ${b.requestingParty} - ${b.requestedParty}`,
      type: "bilateral" as const,
    })),
    ...sessions.map((s: any) => ({
      time: s.startTime,
      endTime: s.endTime,
      location: s.venue,
      activity: s.name,
      type: "session" as const,
    })),
    ...seatingEvents.map((se: any) => ({
      time: se.startTime,
      endTime: se.endTime,
      location: se.venue,
      activity: se.name,
      type: "ceremony" as const,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  for (const event of allEvents) {
    entries.push({
      time: event.time,
      endTime: event.endTime,
      location: event.location,
      activity: event.activity,
      transportMode: determineTransportMode(event, entries),
    });
  }

  // Add hotel return
  entries.push({
    time: "22:00",
    location: "Hotel",
    activity: "Return to hotel",
    transportMode: "MOTORCADE",
  });

  // 5. Determine security level from participant type
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  const securityLevel =
    participant?.participantType === "HEAD_OF_STATE"
      ? "PRESIDENTIAL"
      : participant?.participantType === "HEAD_OF_GOVERNMENT"
        ? "ENHANCED"
        : "STANDARD";

  // 6. Save schedule
  const schedule = await prisma.vIPMovementSchedule.upsert({
    where: {
      tenantId_eventId_participantId_date: {
        tenantId,
        eventId,
        participantId,
        date,
      },
    },
    update: {
      entries: entries as any,
      securityLevel,
      motorcadeRequired: securityLevel === "PRESIDENTIAL",
      status: "DRAFT",
    },
    create: {
      tenantId,
      eventId,
      participantId,
      delegationName: participant?.countryName ?? "",
      date,
      entries: entries as any,
      securityLevel,
      motorcadeRequired: securityLevel === "PRESIDENTIAL",
      status: "DRAFT",
    },
  });

  return { scheduleId: schedule.id, entries };
}

function determineTransportMode(
  event: any,
  previousEntries: MovementEntry[],
): MovementEntry["transportMode"] {
  if (previousEntries.length === 0) return "MOTORCADE";
  const lastEntry = previousEntries[previousEntries.length - 1];
  if (lastEntry.location === event.location) return "WALKING";
  return "SHUTTLE";
}

// Helper stubs
async function getSessionSchedule(
  eventId: string,
  participantId: string,
  date: Date,
): Promise<any[]> {
  return [];
}
async function getSeatingEvents(
  eventId: string,
  participantId: string,
  date: Date,
): Promise<any[]> {
  return [];
}
```

---

## 6. User Interface

### 6.1 Visual Seating Chart Editor

The visual seating chart editor from the source specification:

```
┌─────────────────────────────────────────────────────────────────┐
│  Seating: Opening Ceremony          [Auto-Assign] [Print All]  │
├──────────────────────────────────────────────────┬──────────────┤
│                                                  │ Unassigned:  │
│          HOLLOW SQUARE LAYOUT                    │              │
│                                                  │ ☐ Min. Juma  │
│    ┌─────┬─────┬─────┬─────┬─────┐              │   Kenya      │
│    │NGA  │ETH  │HOST │KEN  │ZAF  │              │ ☐ Amb. Diallo│
│    │Rank3│Rank2│  ★  │Rank1│Rank4│  ← Head side │   Senegal    │
│    └─────┴─────┴─────┴─────┴─────┘              │ ☐ Del. Asante│
│    ┌─────┐                   ┌─────┐            │   Ghana      │
│    │MOZ  │                   │TZA  │            │              │
│    │Rank9│    (open center)  │Rank6│ ← Sides    │ Drag to seat │
│    ├─────┤                   ├─────┤            │              │
│    │AGO  │                   │UGA  │            │──────────────│
│    │Rk11 │                   │Rank8│            │ Conflict:    │
│    └─────┘                   └─────┘            │ 🔴 ERI-ETH  │
│    ┌─────┬─────┬─────┬─────┬─────┐             │    no adjacent│
│    │RWA  │SEN  │DRC  │GHA  │CMR  │             │ 🟡 MAR-DZA  │
│    │Rk13 │Rk12 │Rk10 │Rank7│Rank5│ ← Far side │    min 3 seats│
│    └─────┴─────┴─────┴─────┴─────┘             │              │
│                                                  │              │
│  ✅ No conflict violations detected              │              │
│                                                  │              │
└──────────────────────────────────────────────────┴──────────────┘
```

Drag-and-drop: an admin can drag an unassigned participant from the sidebar to any seat, or drag a seated participant to a different seat (swap). Conflict violations are highlighted in real-time.

**Enhanced Features:**

- **Undo/Redo Stack**: Every drag-and-drop, auto-assign, and swap operation is pushed to an undo stack. Ctrl+Z undoes the last operation; Ctrl+Shift+Z redoes.
- **Zoom and Pan**: Mouse wheel zooms the layout; click-and-drag on empty space pans. Fit-to-screen button resets view.
- **Multi-Layout Preview**: Side-by-side comparison of different layout types for the same meeting.
- **Real-Time Collaboration**: SSE-driven updates show other editors' cursors and pending changes.
- **Conflict Highlighting**: Seats violating conflict rules show red borders with tooltip explaining the violation. Yellow borders for soft constraint warnings.

**React Component Architecture:**

```typescript
// file: app/components/protocol/seating-chart-editor.tsx

import { useFetcher } from "react-router";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

interface SeatingChartEditorProps {
  arrangementId: string;
  arrangement: SeatingArrangementDetail;
  unassignedParticipants: Participant[];
  conflictRules: ConflictRule[];
  isFinalized: boolean;
}

type EditorAction =
  | { type: "ASSIGN_SEAT"; seatId: string; participantId: string }
  | { type: "SWAP_SEATS"; seatIdA: string; seatIdB: string }
  | { type: "UNASSIGN_SEAT"; seatId: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAN"; x: number; y: number };

interface EditorState {
  seats: Map<string, string | null>;
  undoStack: Map<string, string | null>[];
  redoStack: Map<string, string | null>[];
  zoom: number;
  panX: number;
  panY: number;
  activeViolations: ConflictViolation[];
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "ASSIGN_SEAT": {
      const newSeats = new Map(state.seats);
      const previous = new Map(state.seats);
      newSeats.set(action.seatId, action.participantId);
      return {
        ...state,
        seats: newSeats,
        undoStack: [...state.undoStack, previous],
        redoStack: [],
      };
    }
    case "SWAP_SEATS": {
      const newSeats = new Map(state.seats);
      const previous = new Map(state.seats);
      const valA = newSeats.get(action.seatIdA);
      const valB = newSeats.get(action.seatIdB);
      newSeats.set(action.seatIdA, valB ?? null);
      newSeats.set(action.seatIdB, valA ?? null);
      return {
        ...state,
        seats: newSeats,
        undoStack: [...state.undoStack, previous],
        redoStack: [],
      };
    }
    case "UNASSIGN_SEAT": {
      const newSeats = new Map(state.seats);
      const previous = new Map(state.seats);
      newSeats.set(action.seatId, null);
      return {
        ...state,
        seats: newSeats,
        undoStack: [...state.undoStack, previous],
        redoStack: [],
      };
    }
    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        seats: previousState,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, new Map(state.seats)],
      };
    }
    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const nextState = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        seats: nextState,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, new Map(state.seats)],
      };
    }
    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.25, Math.min(3, action.zoom)) };
    case "SET_PAN":
      return { ...state, panX: action.x, panY: action.y };
    default:
      return state;
  }
}

export function SeatingChartEditor({
  arrangementId,
  arrangement,
  unassignedParticipants,
  conflictRules,
  isFinalized,
}: SeatingChartEditorProps) {
  const fetcher = useFetcher();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Initialize state from server data
  const initialSeats = new Map<string, string | null>();
  for (const seat of arrangement.seats) {
    initialSeats.set(seat.id, seat.participant?.id ?? null);
  }

  const [state, dispatch] = useReducer(editorReducer, {
    seats: initialSeats,
    undoStack: [],
    redoStack: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    activeViolations: arrangement.conflictViolations,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
      if (e.ctrlKey && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // SSE for real-time updates from other editors
  useEffect(() => {
    const source = new EventSource(
      `/api/events/${arrangement.eventId}/protocol/stream`
    );
    source.addEventListener("seating.updated", (e) => {
      const data = JSON.parse(e.data);
      if (data.arrangementId === arrangementId) {
        dispatch({
          type: "ASSIGN_SEAT",
          seatId: data.seatId,
          participantId: data.participantId,
        });
      }
    });
    return () => source.close();
  }, [arrangementId]);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      if (!over || isFinalized) return;

      const participantId = active.id;
      const targetSeatId = over.id;

      // Check if dragging from sidebar (new assignment) or seat (swap)
      const sourceSeatId = findSeatByParticipant(state.seats, participantId);

      if (sourceSeatId) {
        // Swap
        dispatch({ type: "SWAP_SEATS", seatIdA: sourceSeatId, seatIdB: targetSeatId });
        fetcher.submit(
          { seatIdA: sourceSeatId, seatIdB: targetSeatId },
          { method: "POST", action: `/api/events/${arrangement.eventId}/protocol/seating/arrangements/${arrangementId}/swap` }
        );
      } else {
        // New assignment
        dispatch({ type: "ASSIGN_SEAT", seatId: targetSeatId, participantId });
        fetcher.submit(
          { participantId },
          { method: "PUT", action: `/api/events/${arrangement.eventId}/protocol/seating/arrangements/${arrangementId}/seats/${targetSeatId}` }
        );
      }

      setActiveDragId(null);
    },
    [state.seats, isFinalized, arrangementId, fetcher]
  );

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    dispatch({ type: "SET_ZOOM", zoom: state.zoom + delta });
  }, [state.zoom]);

  return (
    <div className="flex h-full">
      {/* Main canvas area */}
      <div
        className="flex-1 overflow-hidden relative bg-gray-50 border rounded-lg"
        onWheel={handleWheel}
        ref={canvasRef}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveDragId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          {/* Toolbar */}
          <div className="absolute top-2 left-2 z-10 flex gap-2">
            <button
              onClick={() => dispatch({ type: "UNDO" })}
              disabled={state.undoStack.length === 0}
              className="px-3 py-1 bg-white border rounded shadow-sm text-sm disabled:opacity-50"
            >
              Undo
            </button>
            <button
              onClick={() => dispatch({ type: "REDO" })}
              disabled={state.redoStack.length === 0}
              className="px-3 py-1 bg-white border rounded shadow-sm text-sm disabled:opacity-50"
            >
              Redo
            </button>
            <span className="px-2 py-1 text-sm text-gray-500">
              Zoom: {Math.round(state.zoom * 100)}%
            </span>
          </div>

          {/* Seating layout - rendered based on layoutType */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `scale(${state.zoom}) translate(${state.panX}px, ${state.panY}px)`,
              transformOrigin: "center",
            }}
          >
            {arrangement.seats.map((seat) => (
              <SeatDropZone
                key={seat.id}
                seat={seat}
                participantId={state.seats.get(seat.id) ?? null}
                violations={state.activeViolations.filter(
                  (v) => v.seatA === seat.id || v.seatB === seat.id
                )}
                isFinalized={isFinalized}
              />
            ))}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragId ? <DraggedParticipantCard id={activeDragId} /> : null}
          </DragOverlay>
        </DndContext>

        {/* Conflict status bar */}
        <div className="absolute bottom-2 left-2 right-2 p-2 bg-white/90 rounded border text-sm">
          {state.activeViolations.length === 0 ? (
            <span className="text-green-700">No conflict violations detected</span>
          ) : (
            <span className="text-red-700">
              {state.activeViolations.length} conflict violation(s) detected
            </span>
          )}
        </div>
      </div>

      {/* Sidebar: unassigned participants + conflict rules */}
      <div className="w-72 border-l bg-white overflow-y-auto p-4">
        <h3 className="font-semibold text-sm mb-3">
          Unassigned ({unassignedParticipants.length})
        </h3>
        {unassignedParticipants.map((p) => (
          <DraggableParticipant key={p.id} participant={p} />
        ))}

        <hr className="my-4" />

        <h3 className="font-semibold text-sm mb-3">Conflict Rules</h3>
        {conflictRules.map((rule) => (
          <div key={rule.id} className="text-xs p-2 mb-1 rounded bg-gray-50">
            <span className={rule.ruleType === "NO_ADJACENT" ? "text-red-600" : "text-yellow-600"}>
              {rule.ruleType === "NO_ADJACENT" ? "NO ADJ" : `MIN ${rule.distance}`}
            </span>{" "}
            {rule.countryA} - {rule.countryB}
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-components (stubs for architecture illustration)
function SeatDropZone(props: any) { return null; }
function DraggableParticipant(props: any) { return null; }
function DraggedParticipantCard(props: any) { return null; }
function findSeatByParticipant(seats: Map<string, string | null>, participantId: string): string | undefined {
  for (const [seatId, pId] of seats) {
    if (pId === participantId) return seatId;
  }
  return undefined;
}
```

### 6.2 Bilateral Meeting Dashboard

The bilateral dashboard wireframe from the source specification:

```
┌─────────────────────────────────────────────────────────────────┐
│  Bilateral Meeting Scheduler               [Auto-Schedule All] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Feb 11, 2026                                                    │
│  ┌───────┬──────────┬──────────┬──────────┬──────────┐          │
│  │ Time  │ Room 1   │ Room 2   │ Room 3   │ Room 4   │          │
│  ├───────┼──────────┼──────────┼──────────┼──────────┤          │
│  │ 09:00 │ KEN-ETH  │ NGA-ZAF  │ EGY-SDN  │ (free)   │          │
│  │       │ ★ Crit.  │ ★ Crit.  │ ● High   │          │          │
│  │ 09:30 │ KEN-ETH  │ NGA-GHA  │ (free)   │ TZA-UGA  │          │
│  │       │ (cont.)  │ ● High   │          │ ○ Med    │          │
│  │ 10:00 │ KEN-NGA  │ ETH-DJI  │ MOZ-ZAF  │ (free)   │          │
│  │       │ ● High   │ ○ Med    │ ○ Med    │          │          │
│  │ 10:30 │ (free)   │ (free)   │ (free)   │ (free)   │          │
│  │ 11:00 │ — Plenary Session (no bilaterals) —       │          │
│  └───────┴──────────┴──────────┴──────────┴──────────┘          │
│                                                                  │
│  Pending Requests (23)         Unscheduled (8)                   │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ AGO ↔ MOZ  ● High  │     │ CMR ↔ TCD  ○ Med   │           │
│  │ Awaiting MOZ confirm│     │ No available slots   │           │
│  │ [Nudge]             │     │ [Force Schedule]     │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                  │
│  Stats: 42 scheduled | 23 pending | 8 unscheduled | 3 declined │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Enhanced Features:**

- **Gantt View**: Toggle between grid view and Gantt timeline view showing meetings as horizontal bars.
- **Conflict Overlay**: Red highlights when a party is double-booked or when meetings lack required buffer time.
- **Date Navigation**: Calendar date picker to switch between summit days.
- **Drag-to-Reschedule**: Drag meeting blocks to different slots or rooms to reschedule.

**React Component Architecture:**

```typescript
// file: app/components/protocol/bilateral-dashboard.tsx

import { useState, useMemo } from "react";
import { useFetcher, useLoaderData } from "react-router";
import * as Tabs from "@radix-ui/react-tabs";

interface BilateralDashboardProps {
  eventId: string;
  requests: BilateralRequest[];
  slots: BilateralSlot[];
  rooms: BilateralRoom[];
  selectedDate: string;
  stats: {
    scheduled: number;
    pending: number;
    unscheduled: number;
    declined: number;
  };
}

export function BilateralDashboard({
  eventId,
  requests,
  slots,
  rooms,
  selectedDate,
  stats,
}: BilateralDashboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "gantt">("grid");
  const fetcher = useFetcher();

  // Build the time-room grid
  const grid = useMemo(() => {
    const timeSlots = slots
      .filter((s) => s.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return timeSlots.map((slot) => ({
      time: slot.startTime,
      rooms: rooms.map((room) => {
        const meeting = requests.find(
          (r) => r.slotId === slot.id && r.roomId === room.id && r.status === "SCHEDULED"
        );
        return { roomId: room.id, roomName: room.name, meeting };
      }),
    }));
  }, [slots, rooms, requests, selectedDate]);

  // Categorize requests
  const pendingRequests = requests.filter(
    (r) => r.status === "REQUESTED" || r.status === "COUNTERPART_NOTIFIED"
  );
  const unscheduledRequests = requests.filter(
    (r) => r.status === "BOTH_CONFIRMED" && !r.slotId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Bilateral Meeting Scheduler</h1>
        <div className="flex gap-2">
          <Tabs.Root value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <Tabs.List className="flex bg-gray-100 rounded p-1">
              <Tabs.Trigger value="grid" className="px-3 py-1 rounded text-sm data-[state=active]:bg-white">
                Grid
              </Tabs.Trigger>
              <Tabs.Trigger value="gantt" className="px-3 py-1 rounded text-sm data-[state=active]:bg-white">
                Gantt
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
          <button
            onClick={() => fetcher.submit({}, {
              method: "POST",
              action: `/api/events/${eventId}/protocol/bilateral/auto-schedule`,
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
          >
            Auto-Schedule All
          </button>
        </div>
      </div>

      {/* Date selector */}
      <DateNavigation selectedDate={selectedDate} eventId={eventId} />

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-2 text-left text-sm font-medium w-20">Time</th>
                {rooms.map((room) => (
                  <th key={room.id} className="px-3 py-2 text-left text-sm font-medium">
                    {room.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row) => (
                <tr key={row.time} className="border-b">
                  <td className="px-3 py-2 text-sm font-mono">{row.time}</td>
                  {row.rooms.map((cell) => (
                    <td key={cell.roomId} className="px-3 py-2">
                      {cell.meeting ? (
                        <MeetingCell meeting={cell.meeting} />
                      ) : (
                        <span className="text-gray-400 text-sm">(free)</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gantt View */}
      {viewMode === "gantt" && (
        <GanttTimeline
          requests={requests.filter((r) => r.status === "SCHEDULED")}
          rooms={rooms}
          selectedDate={selectedDate}
        />
      )}

      {/* Pending and Unscheduled sections */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-3">Pending Requests ({pendingRequests.length})</h2>
          <div className="space-y-2">
            {pendingRequests.map((r) => (
              <PendingRequestCard key={r.id} request={r} eventId={eventId} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-3">Unscheduled ({unscheduledRequests.length})</h2>
          <div className="space-y-2">
            {unscheduledRequests.map((r) => (
              <UnscheduledRequestCard key={r.id} request={r} eventId={eventId} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-gray-600 border-t pt-4">
        <span>{stats.scheduled} scheduled</span>
        <span>{stats.pending} pending</span>
        <span>{stats.unscheduled} unscheduled</span>
        <span>{stats.declined} declined</span>
      </div>
    </div>
  );
}

function MeetingCell({ meeting }: { meeting: BilateralRequest }) {
  const priorityColors = {
    CRITICAL: "bg-red-50 border-red-200 text-red-800",
    HIGH: "bg-orange-50 border-orange-200 text-orange-800",
    MEDIUM: "bg-yellow-50 border-yellow-200 text-yellow-800",
    LOW: "bg-gray-50 border-gray-200 text-gray-800",
  };
  const priorityIcons = { CRITICAL: "★", HIGH: "●", MEDIUM: "○", LOW: "·" };

  return (
    <div className={`p-2 rounded border text-xs ${priorityColors[meeting.priority]}`}>
      <div className="font-medium">
        {meeting.requestingParty}-{meeting.requestedParty}
      </div>
      <div>{priorityIcons[meeting.priority]} {meeting.priority}</div>
    </div>
  );
}

// Sub-component stubs
function DateNavigation(props: any) { return null; }
function GanttTimeline(props: any) { return null; }
function PendingRequestCard(props: any) { return null; }
function UnscheduledRequestCard(props: any) { return null; }
```

### 6.3 Bilateral Request Portal

The focal point view for submitting and managing bilateral meeting requests, derived from the source specification:

```
Focal point opens Delegation Portal → [Request Bilateral Meeting]
  → Select counterpart: [Republic of Ethiopia ▾]
  → Priority: auto-set by participant type (Head of State = CRITICAL)
  → Duration: [30 min ▾]
  → Topic: [Climate cooperation and Nile negotiations]
  → Interpreter needed: [✓] Languages: [Amharic, English]
  → Preferred times: [Feb 11 morning ▾] [Feb 12 any ▾]
  → Submit → BilateralRequest created (status: REQUESTED)
```

**React Component:**

```typescript
// file: app/components/protocol/bilateral-request-form.tsx

import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useFetcher } from "react-router";
import { z } from "zod";
import * as Select from "@radix-ui/react-select";
import * as Checkbox from "@radix-ui/react-checkbox";

const bilateralRequestSchema = z.object({
  requestedParty: z.string().min(1, "Select a counterpart delegation"),
  duration: z.number().int().min(15).max(120),
  topic: z.string().optional(),
  notes: z.string().optional(),
  interpreterNeeded: z.boolean().default(false),
  languages: z.array(z.string()).optional(),
  preferredTimes: z.array(z.object({
    date: z.string(),
    timePreference: z.enum(["MORNING", "AFTERNOON", "ANY"]),
  })).min(1, "Select at least one preferred time"),
});

interface BilateralRequestFormProps {
  eventId: string;
  delegationCode: string;
  availableCountries: Array<{ code: string; name: string }>;
  eventDates: string[];
}

export function BilateralRequestForm({
  eventId,
  delegationCode,
  availableCountries,
  eventDates,
}: BilateralRequestFormProps) {
  const fetcher = useFetcher();
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: bilateralRequestSchema });
    },
  });

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-bold">Request Bilateral Meeting</h2>

      <fetcher.Form
        method="POST"
        action={`/api/events/${eventId}/protocol/bilateral/requests`}
        {...form.props}
      >
        {/* Counterpart selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Counterpart Delegation</label>
          <Select.Root name={fields.requestedParty.name}>
            <Select.Trigger className="w-full border rounded px-3 py-2 text-left">
              <Select.Value placeholder="Select delegation..." />
            </Select.Trigger>
            <Select.Content>
              {availableCountries
                .filter((c) => c.code !== delegationCode)
                .map((country) => (
                  <Select.Item key={country.code} value={country.code}>
                    <Select.ItemText>{country.name}</Select.ItemText>
                  </Select.Item>
                ))}
            </Select.Content>
          </Select.Root>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Duration</label>
          <Select.Root name={fields.duration.name} defaultValue="30">
            <Select.Trigger className="w-full border rounded px-3 py-2 text-left">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="15"><Select.ItemText>15 min</Select.ItemText></Select.Item>
              <Select.Item value="30"><Select.ItemText>30 min</Select.ItemText></Select.Item>
              <Select.Item value="45"><Select.ItemText>45 min</Select.ItemText></Select.Item>
              <Select.Item value="60"><Select.ItemText>60 min</Select.ItemText></Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Topic</label>
          <textarea
            name={fields.topic.name}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={2}
            placeholder="Climate cooperation and Nile negotiations"
          />
        </div>

        {/* Interpreter */}
        <div className="flex items-center gap-2">
          <Checkbox.Root
            name={fields.interpreterNeeded.name}
            className="w-5 h-5 border rounded flex items-center justify-center"
          >
            <Checkbox.Indicator>
              <span>&#10003;</span>
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="text-sm">Interpreter needed</label>
        </div>

        {/* Preferred times */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preferred Times</label>
          {eventDates.map((date) => (
            <div key={date} className="flex items-center gap-3">
              <span className="text-sm w-24">{date}</span>
              <Select.Root name={`preferredTimes.${date}`}>
                <Select.Trigger className="border rounded px-2 py-1 text-sm">
                  <Select.Value placeholder="Select..." />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="MORNING"><Select.ItemText>Morning</Select.ItemText></Select.Item>
                  <Select.Item value="AFTERNOON"><Select.ItemText>Afternoon</Select.ItemText></Select.Item>
                  <Select.Item value="ANY"><Select.ItemText>Any time</Select.ItemText></Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 font-medium"
          disabled={fetcher.state !== "idle"}
        >
          {fetcher.state !== "idle" ? "Submitting..." : "Submit Request"}
        </button>
      </fetcher.Form>
    </div>
  );
}
```

### 6.4 Companion Program Interface

The companion program activity interface from the source specification:

```
Companion Program - Feb 10-14, 2026

Feb 10 (Mon)
  09:30 - 13:00   City Tour - Addis Ababa Highlights     [12/20 spots]  [Sign Up]
                   Meeting point: Hotel Lobby, 09:15
                   Transport: Included (minibus)

  15:00 - 17:00   Ethiopian Coffee Ceremony               [ 8/15 spots]  [Sign Up]
                   National Museum, Ground Floor

Feb 11 (Tue)
  10:00 - 16:00   Day Trip - Debre Libanos Monastery      [18/25 spots]  [Sign Up]
                   Full day with lunch. Dress code: modest
                   Transport: Included (bus)

Feb 12 (Wed)
  14:00 - 16:00   Traditional Craft Workshop              [ 5/12 spots]  [Sign Up]
                   AU Conference Centre, Room B12

Feb 13 (Thu)
  19:00 - 23:00   Gala Dinner (all companions invited)    [Confirmed]
                   Grand Ballroom | Dress code: Black tie
                   Seating: Table 12 (with delegation)
```

**React Component:**

```typescript
// file: app/components/protocol/companion-activity-list.tsx

import { useFetcher } from "react-router";
import * as Accordion from "@radix-ui/react-accordion";

interface CompanionActivityListProps {
  eventId: string;
  companionId: string;
  activitiesByDate: Array<{
    date: string;
    dayLabel: string;
    activities: Array<{
      id: string;
      name: string;
      startTime: string;
      endTime: string;
      location: string;
      meetingPoint: string | null;
      capacity: number;
      currentSignups: number;
      transportIncluded: boolean;
      dressCode: string | null;
      cost: number;
      isSignedUp: boolean;
      signupStatus: string | null;
    }>;
  }>;
}

export function CompanionActivityList({
  eventId,
  companionId,
  activitiesByDate,
}: CompanionActivityListProps) {
  const fetcher = useFetcher();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Companion Program</h2>

      <Accordion.Root type="multiple" defaultValue={activitiesByDate.map((d) => d.date)}>
        {activitiesByDate.map(({ date, dayLabel, activities }) => (
          <Accordion.Item key={date} value={date} className="border-b">
            <Accordion.Trigger className="w-full py-3 text-left font-semibold">
              {dayLabel}
            </Accordion.Trigger>
            <Accordion.Content className="pb-4 space-y-4">
              {activities.map((activity) => {
                const spotsLeft = activity.capacity - activity.currentSignups;
                const isFull = spotsLeft <= 0;

                return (
                  <div key={activity.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-600">
                          {activity.startTime} - {activity.endTime}
                        </span>
                        <span className="font-medium">{activity.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 pl-28">
                        {activity.location}
                      </div>
                      {activity.meetingPoint && (
                        <div className="text-sm text-gray-500 pl-28">
                          Meeting point: {activity.meetingPoint}
                        </div>
                      )}
                      {activity.transportIncluded && (
                        <div className="text-sm text-gray-500 pl-28">
                          Transport: Included
                        </div>
                      )}
                      {activity.dressCode && (
                        <div className="text-sm text-gray-500 pl-28">
                          Dress code: {activity.dressCode}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${isFull ? "text-red-600" : "text-gray-600"}`}>
                        [{activity.currentSignups}/{activity.capacity} spots]
                      </span>

                      {activity.isSignedUp ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {activity.signupStatus === "CONFIRMED" ? "Confirmed" : "Signed Up"}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            fetcher.submit(
                              { companionId },
                              {
                                method: "POST",
                                action: `/api/events/${eventId}/protocol/companion-activities/${activity.id}/signup`,
                              }
                            );
                          }}
                          disabled={isFull || fetcher.state !== "idle"}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                        >
                          Sign Up
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
```

### 6.5 Gift Inventory Management Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  Gift Protocol - Inventory & Allocations         [Add Item] [Bulk] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Inventory Summary                                                   │
│  ┌──────────────────┬──────┬──────────┬───────┬──────────┐          │
│  │ Item             │ Cat. │ Value    │ Stock │ Allocated│          │
│  ├──────────────────┼──────┼──────────┼───────┼──────────┤          │
│  │ Commemorative    │COMM. │ $120 USD │  60   │    42    │          │
│  │ Medal            │      │          │       │          │          │
│  │ AU Yearbook 2026 │BOOK  │  $45 USD │ 200   │   155    │          │
│  │ Crystal Award    │AWARD │ $180 USD │  15   │    10    │          │
│  │ Branded Pen Set  │BRAND │  $25 USD │ 300   │   210    │          │
│  │ City Guide       │SOUV. │  $10 USD │ 400   │   350    │  ⚠ Low  │
│  └──────────────────┴──────┴──────────┴───────┴──────────┘          │
│                                                                      │
│  Protocol Level Allocation Rules                                     │
│  ┌────────────────┬─────────────────────────────────────────┐       │
│  │ HEAD_OF_STATE  │ Medal + Yearbook + Crystal Award        │       │
│  │ MINISTER       │ Medal + Yearbook                        │       │
│  │ AMBASSADOR     │ Yearbook                                │       │
│  │ DELEGATE       │ (none - welcome package only)           │       │
│  └────────────────┴─────────────────────────────────────────┘       │
│                                                                      │
│  Threshold: $250 USD | Above threshold requires approval             │
│                                                                      │
│  Recent Allocations                                                  │
│  ┌─────────────┬──────────────┬─────────┬──────────┬────────┐      │
│  │ Recipient   │ Item         │ Value   │ Status   │ Method │      │
│  ├─────────────┼──────────────┼─────────┼──────────┼────────┤      │
│  │ Kenya       │ Medal+Book+  │ $345    │ ⚠ Above  │ Hotel  │      │
│  │             │ Crystal      │         │ threshold│        │      │
│  │ Ethiopia    │ Medal+Book   │ $165    │ Allocated│ Hotel  │      │
│  │ Nigeria     │ Medal+Book+  │ $345    │ Approved │ Hotel  │      │
│  │             │ Crystal      │         │          │        │      │
│  └─────────────┴──────────────┴─────────┴──────────┴────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.6 Welcome Package Assembly Station

```
┌─────────────────────────────────────────────────────────────────────┐
│  Welcome Package Assembly Station                   [Print Lists]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Progress: 32/55 assembled | 28/55 QA checked | 20/55 delivered     │
│  ███████████████████████░░░░░░░░░░░░░ 58% complete                  │
│                                                                      │
│  Filter: [All ▾] [PENDING ▾] [Search...]                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ VIP Welcome Package — Republic of Kenya                     │    │
│  │ Recipient: H.E. President Ruto                              │    │
│  │                                                              │    │
│  │ ☑ Commemorative Medal (gold box)                            │    │
│  │ ☑ AU Yearbook 2026                                          │    │
│  │ ☑ Addis Ababa City Guide (English)                          │    │
│  │ ☑ Local SIM Card + data plan card                           │    │
│  │ ☑ Badge holder (VIP - gold)                                 │    │
│  │ ☑ Event program booklet                                     │    │
│  │ ☑ Branded pen + notepad                                     │    │
│  │ ☑ Personalized welcome letter                               │    │
│  │                                                              │    │
│  │ Status: QA_CHECKED                                          │    │
│  │ Assembled by: J. Bekele | QA by: M. Tadesse                │    │
│  │ Delivery: HOTEL_ROOM                                        │    │
│  │                                                              │    │
│  │ [Mark Delivered]                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Standard Package — Republic of Senegal                      │    │
│  │ Status: PENDING                                             │    │
│  │                                                              │    │
│  │ ☐ AU Yearbook 2026                                          │    │
│  │ ☐ City Guide (French)                                       │    │
│  │ ☐ Event program booklet                                     │    │
│  │ ☐ Branded pen + notepad                                     │    │
│  │                                                              │    │
│  │ [Mark Assembled]                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.7 Protocol Rank Management Interface

```
┌─────────────────────────────────────────────────────────────────────┐
│  Protocol Rankings — 38th AU Summit                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Ranking System: (●) Seniority  ( ) Alphabetical  ( ) Rotational   │
│                  ( ) Custom                                          │
│  Language (for alphabetical): [English ▾]                            │
│  [Generate Ranks]  [Import Previous Edition]                         │
│                                                                      │
│  ┌─────┬──────────┬───────────────────┬─────────────────┬─────────┐│
│  │Rank │ Country  │ Head of State     │ In Office Since │ Notes   ││
│  ├─────┼──────────┼───────────────────┼─────────────────┼─────────┤│
│  │  1  │ Cameroon │ H.E. Paul Biya    │ Nov 6, 1982     │         ││
│  │  2  │ Uganda   │ H.E. Y. Museveni  │ Jan 29, 1986    │         ││
│  │  3  │ Chad     │ H.E. M. Déby      │ Apr 20, 2021    │         ││
│  │  4  │ Egypt    │ H.E. A. el-Sisi   │ Jun 8, 2014     │         ││
│  │  5  │ Kenya    │ H.E. W. Ruto      │ Sep 13, 2022    │         ││
│  │ ... │ ...      │ ...               │ ...             │         ││
│  └─────┴──────────┴───────────────────┴─────────────────┴─────────┘│
│                                                                      │
│  Conflict Rules (4)                                                  │
│  ┌─────────────┬─────────────┬──────────────┬──────────────────┐   │
│  │ Country A   │ Country B   │ Rule Type    │ Reason           │   │
│  ├─────────────┼─────────────┼──────────────┼──────────────────┤   │
│  │ ERI         │ ETH         │ NO_ADJACENT  │ Border dispute   │   │
│  │ MAR         │ DZA         │ MIN_DIST (3) │ Western Sahara   │   │
│  │ SDN         │ SSD         │ NO_ADJACENT  │ Civil conflict   │   │
│  │ LBY (GNA)  │ LBY (LNA)  │ NO_ADJACENT  │ Rival govts      │   │
│  └─────────────┴─────────────┴──────────────┴──────────────────┘   │
│  [Add Conflict Rule]                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.8 Meeting Brief Preview

```typescript
// file: app/components/protocol/meeting-brief-preview.tsx

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  header: { borderBottom: "2pt solid #333", paddingBottom: 10, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: "bold" },
  subtitle: { fontSize: 11, color: "#555", marginTop: 4 },
  meetingBlock: { marginBottom: 15, padding: 10, border: "1pt solid #ddd", borderRadius: 4 },
  meetingTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 5 },
  detailRow: { flexDirection: "row", marginBottom: 3 },
  label: { width: 100, color: "#666", fontWeight: "bold" },
  value: { flex: 1 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTop: "1pt solid #ccc", paddingTop: 5, fontSize: 8, color: "#999" },
});

interface MeetingBriefPDFProps {
  data: {
    delegationName: string;
    eventName: string;
    eventDates: string;
    meetings: Array<{
      number: number;
      counterpartName: string;
      date: string;
      startTime: string;
      endTime: string;
      roomName: string;
      topic: string | null;
      interpreterInfo: string | null;
      counterpartTitle: string | null;
      counterpartLeaderName: string | null;
      transportNote: string | null;
    }>;
    generatedAt: Date;
  };
}

export function MeetingBriefPDF({ data }: MeetingBriefPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            BILATERAL MEETING BRIEF -- {data.delegationName}
          </Text>
          <Text style={styles.subtitle}>
            {data.eventName}, {data.eventDates}
          </Text>
        </View>

        {/* Meetings */}
        {data.meetings.map((meeting) => (
          <View key={meeting.number} style={styles.meetingBlock}>
            <Text style={styles.meetingTitle}>
              Meeting {meeting.number}: {data.delegationName} -- {meeting.counterpartName}
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{meeting.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{meeting.startTime}-{meeting.endTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Room:</Text>
              <Text style={styles.value}>{meeting.roomName}</Text>
            </View>
            {meeting.topic && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Topic:</Text>
                <Text style={styles.value}>{meeting.topic}</Text>
              </View>
            )}
            {meeting.interpreterInfo && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Interpreter:</Text>
                <Text style={styles.value}>{meeting.interpreterInfo}</Text>
              </View>
            )}
            {meeting.counterpartLeaderName && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Counterpart:</Text>
                <Text style={styles.value}>
                  {meeting.counterpartTitle} {meeting.counterpartLeaderName}
                </Text>
              </View>
            )}
            {meeting.transportNote && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Transport:</Text>
                <Text style={styles.value}>{meeting.transportNote}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated: {data.generatedAt.toISOString()} | CONFIDENTIAL - For delegation use only
          </Text>
        </View>
      </Page>
    </Document>
  );
}
```

### 6.9 VIP Movement Tracker

```
┌─────────────────────────────────────────────────────────────────────┐
│  VIP Movement Tracker - Feb 11, 2026                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Active VIP Schedules: 12 | Presidential: 3 | Enhanced: 5           │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ H.E. President Ruto — Kenya          Security: PRESIDENTIAL │    │
│  │ Status: EN ROUTE                     Motorcade: Active      │    │
│  │                                                              │    │
│  │ 07:30  Hotel Lobby          → Departure           DONE      │    │
│  │ 08:00  AU Conference Centre → Arrived             DONE      │    │
│  │ 08:30  Plenary Hall         → Opening Ceremony    DONE      │    │
│  │ 09:00  Bilateral Room 1     → Kenya-Ethiopia      ▶ ACTIVE  │    │
│  │ 09:30  Bilateral Room 1     → (cont.)                       │    │
│  │ 10:00  Bilateral Room 1     → Kenya-Nigeria       NEXT      │    │
│  │ 11:00  Plenary Hall         → Heads of State Mtg  UPCOMING  │    │
│  │ 13:00  Banquet Hall         → Official Lunch      UPCOMING  │    │
│  │ 15:00  Press Centre         → Press Conference    UPCOMING  │    │
│  │ 18:00  Hotel                → Return              UPCOMING  │    │
│  │ 19:30  Grand Ballroom       → Gala Dinner         UPCOMING  │    │
│  │ 22:00  Hotel                → Final Return        UPCOMING  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ H.E. President Tshisekedi — DRC      Security: PRESIDENTIAL │    │
│  │ Status: AT VENUE                     Motorcade: Standby     │    │
│  │                                                              │    │
│  │ 08:00  Opening Ceremony                           DONE      │    │
│  │ 09:30  Bilateral Room 2     → DRC-Rwanda          ▶ ACTIVE  │    │
│  │ 10:30  Bilateral Room 3     → DRC-Angola          NEXT      │    │
│  │ ...                                                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Alerts:                                                             │
│  ⚠ Kenya motorcade delayed 5 min (traffic at Meskel Square)        │
│  ⚠ DRC-Rwanda bilateral may run over (started 10 min late)         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.10 Responsive and Mobile Views

The protocol module adapts to mobile screen sizes for field use by protocol officers and liaison staff.

**Breakpoint Strategy:**

| Breakpoint          | Layout                             | Primary Use                   |
| ------------------- | ---------------------------------- | ----------------------------- |
| Desktop (1280px+)   | Full dashboard with sidebar panels | Protocol officer workstation  |
| Tablet (768-1279px) | Collapsed sidebar, scrollable grid | On-floor protocol management  |
| Mobile (320-767px)  | Single column, stacked cards       | VIP liaison officer field use |

**Mobile-Optimized Views:**

```
┌─────────────────────────┐
│ VIP Schedule - Kenya    │
│ Feb 11, 2026            │
├─────────────────────────┤
│                          │
│ ▶ 09:00 ACTIVE          │
│ Bilateral: Kenya-Ethiopia│
│ Room: Bilateral Room 1   │
│ [Navigate to Room]       │
│                          │
│ ⏭ 10:00 NEXT            │
│ Bilateral: Kenya-Nigeria │
│ Room: Bilateral Room 1   │
│ [View Brief]             │
│                          │
│ 📋 11:00 UPCOMING       │
│ Heads of State Meeting   │
│ Plenary Hall             │
│                          │
│ ─────────────────────── │
│ [Full Schedule] [Alerts] │
│                          │
└─────────────────────────┘
```

**Assembly Station Mobile View:**

```
┌─────────────────────────┐
│ Assembly Station         │
│ 32/55 completed          │
├─────────────────────────┤
│                          │
│ SCAN BARCODE: [________] │
│                          │
│ ┌───────────────────┐   │
│ │ Kenya - VIP Pkg   │   │
│ │ Status: PENDING    │   │
│ │                    │   │
│ │ ☐ Medal           │   │
│ │ ☐ Yearbook        │   │
│ │ ☐ City Guide      │   │
│ │ ☐ SIM Card        │   │
│ │ ☐ Badge Holder    │   │
│ │ ☐ Program         │   │
│ │ ☐ Pen + Notepad   │   │
│ │ ☐ Welcome Letter  │   │
│ │                    │   │
│ │ [Mark Assembled]   │   │
│ └───────────────────┘   │
│                          │
└─────────────────────────┘
```

**Key Mobile Considerations:**

- Touch-optimized buttons with minimum 44px tap targets
- Swipe gestures for status transitions (swipe right to advance assembly status)
- Offline capability for assembly station (sync when connectivity restored)
- Barcode/QR scanning for package lookup on assembly station
- Push notifications for VIP movement alerts and schedule changes
- Reduced data transfer for low-bandwidth environments at venues

---

## 7. Integration Points

Module 12 — Protocol and Diplomacy — operates at the intersection of multiple conference management modules. Diplomatic protocol affects registration, logistics, interpretation, content production, and event operations. This section defines every integration surface, the direction of data flow, and the mechanisms used.

### 7.1 Module Integration Matrix

| Source Module     | Target Module            | Direction     | Data Exchanged                                                         | Integration Method                 | Trigger                                      |
| ----------------- | ------------------------ | ------------- | ---------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| **12 - Protocol** | **01 - Core**            | Bidirectional | Tenant config, user identity, base entities                            | Shared Prisma schema, middleware   | On every request                             |
| **12 - Protocol** | **03 - Event Setup**     | Inbound       | Event metadata, session schedule, venue assignments                    | Database join via `eventId`        | Event creation/update                        |
| **12 - Protocol** | **04 - Delegation Mgmt** | Bidirectional | Delegation composition, head-of-delegation, member roles               | Domain events, direct DB query     | Delegation registration                      |
| **12 - Protocol** | **05 - Abstract/Agenda** | Inbound       | Session agenda, speaking order                                         | REST API query                     | Seating finalization                         |
| **12 - Protocol** | **07 - Communication**   | Outbound      | Bilateral confirmations, companion notifications, VIP alerts           | Event-driven notification dispatch | Status transitions                           |
| **12 - Protocol** | **08 - Document Mgmt**   | Outbound      | Meeting briefs, seating charts, gift reports (PDF)                     | Shared PDF generation pipeline     | On finalization                              |
| **12 - Protocol** | **09 - Registration**    | Bidirectional | Participant type, accreditation level, badge zone, companion records   | Domain events, shared DB views     | Registration completion                      |
| **12 - Protocol** | **10 - Event Ops**       | Outbound      | VIP movement updates, protocol incidents, seating status               | Real-time events (SSE/WebSocket)   | Continuous                                   |
| **12 - Protocol** | **11 - Logistics**       | Bidirectional | Transport requests, room bookings, catering assignments, accommodation | Domain events, REST API            | Bilateral scheduling, companion registration |
| **12 - Protocol** | **13 - Interpretation**  | Outbound      | Language requirements, interpreter requests, bilateral language pairs  | REST API call                      | Bilateral confirmation                       |
| **12 - Protocol** | **14 - Content**         | Outbound      | Nameplate data, flag specifications, welcome letter personalization    | Template engine API                | Seating finalization                         |
| **12 - Protocol** | **16 - Reporting**       | Outbound      | Protocol metrics, bilateral statistics, gift compliance reports        | Materialized views, reporting API  | On demand / scheduled                        |

### 7.2 Registration Integration (Module 09)

The Registration and Accreditation module is the primary upstream data source for protocol operations. Participant registration triggers automatic protocol rank assignment and determines companion eligibility.

#### 7.2.1 Participant Type → Protocol Rank Auto-Assignment

When a participant completes registration, Module 09 publishes a `ParticipantRegistered` event. Module 12 consumes this event and applies protocol rank rules based on participant type:

```typescript
// file: app/modules/protocol/services/rank-assignment.service.ts

import { injectable, inject } from "tsyringe";
import type { PrismaClient } from "@prisma/client";
import type { EventBus } from "~/core/events/event-bus";

interface ParticipantRegisteredPayload {
  participantId: string;
  eventId: string;
  tenantId: string;
  participantType: string; // HEAD_OF_STATE | HEAD_OF_GOVERNMENT | MINISTER | AMBASSADOR | DELEGATE | OBSERVER | STAFF
  delegationId: string;
  countryCode: string;
  title?: string;
  rankOverride?: string;
}

@injectable()
export class RankAssignmentService {
  constructor(
    @inject("PrismaClient") private prisma: PrismaClient,
    @inject("EventBus") private eventBus: EventBus,
  ) {}

  /**
   * Mapping from participant type to default protocol rank tier.
   * Tenants can override via SystemSetting `protocol.rank.mapping.<type>`.
   */
  private static readonly DEFAULT_RANK_MAP: Record<string, number> = {
    HEAD_OF_STATE: 1,
    HEAD_OF_GOVERNMENT: 2,
    DEPUTY_HEAD_OF_STATE: 3,
    MINISTER_FOREIGN_AFFAIRS: 4,
    MINISTER: 5,
    AMBASSADOR: 6,
    SPECIAL_ENVOY: 7,
    DELEGATE: 8,
    OBSERVER: 9,
    STAFF: 10,
  };

  async handleParticipantRegistered(payload: ParticipantRegisteredPayload): Promise<void> {
    const { participantId, eventId, tenantId, participantType, delegationId } = payload;

    // Check for tenant-specific rank mapping override
    const overrideSetting = await this.prisma.systemSetting.findFirst({
      where: {
        tenantId,
        key: `protocol.rank.mapping.${participantType}`,
      },
    });

    const rankTier = overrideSetting
      ? parseInt(overrideSetting.value, 10)
      : (RankAssignmentService.DEFAULT_RANK_MAP[participantType] ?? 8);

    // Look up the protocol rank definition for this tier
    const rankDefinition = await this.prisma.protocolRankDefinition.findFirst({
      where: { tenantId, eventId, tier: rankTier },
    });

    if (!rankDefinition) {
      console.warn(`No protocol rank definition found for tier ${rankTier} in event ${eventId}`);
      return;
    }

    // Assign protocol rank to participant
    const protocolRank = await this.prisma.protocolRank.upsert({
      where: {
        participantId_eventId: { participantId, eventId },
      },
      create: {
        participantId,
        eventId,
        tenantId,
        delegationId,
        rankDefinitionId: rankDefinition.id,
        tier: rankTier,
        assignmentMethod: payload.rankOverride ? "MANUAL" : "AUTO",
        assignedAt: new Date(),
      },
      update: {
        rankDefinitionId: rankDefinition.id,
        tier: rankTier,
        assignmentMethod: payload.rankOverride ? "MANUAL" : "AUTO",
        assignedAt: new Date(),
      },
    });

    await this.eventBus.publish("ProtocolRankAssigned", {
      protocolRankId: protocolRank.id,
      participantId,
      eventId,
      tenantId,
      tier: rankTier,
      rankName: rankDefinition.name,
      assignmentMethod: protocolRank.assignmentMethod,
    });
  }
}
```

#### 7.2.2 Companion Registration Flow

Companions (spouses, partners, aides) register through the delegation portal. Module 09 handles the base registration; Module 12 manages companion-specific protocol data:

```
Registration Portal (Module 09)
  │
  ├─ Companion basic info (name, contact, dietary, accessibility)
  │   └─ Stored in: Participant table with type = COMPANION
  │
  └─ Publishes: CompanionRegistered event
       │
       └─ Module 12 consumes:
            ├─ Creates CompanionProfile (relationship to delegate, interests, language)
            ├─ Assigns companion program eligibility
            ├─ Links to delegate's ProtocolRank for privilege inheritance
            └─ Publishes: CompanionProfileCreated event
                 │
                 └─ Module 09 consumes:
                      └─ Updates badge template to COMPANION variant
```

#### 7.2.3 Badge Template Selection for Companions

Badge templates differ based on protocol rank and companion status. Module 12 provides badge classification data to Module 09:

| Participant Type        | Badge Template             | Zone Access                         | Color Code      |
| ----------------------- | -------------------------- | ----------------------------------- | --------------- |
| Head of State           | `BADGE_VIP_ALPHA`          | ALL_ZONES                           | Gold            |
| Head of State Companion | `BADGE_VIP_COMPANION`      | VIP_LOUNGE, PLENARY, COMPANION_AREA | Gold (border)   |
| Minister                | `BADGE_VIP_BETA`           | VIP_LOUNGE, PLENARY, COMMITTEE      | Silver          |
| Minister Companion      | `BADGE_COMPANION_STANDARD` | PLENARY, COMPANION_AREA             | Silver (border) |
| Delegate                | `BADGE_DELEGATE`           | PLENARY, COMMITTEE                  | Blue            |
| Delegate Companion      | `BADGE_COMPANION_BASIC`    | COMPANION_AREA                      | Blue (border)   |
| Observer                | `BADGE_OBSERVER`           | PLENARY_GALLERY                     | Green           |

### 7.3 Logistics Integration (Module 11)

Protocol operations generate significant logistics requirements — transport, accommodation, venue rooms, and catering. Module 12 communicates these requirements to Module 11 through domain events and direct API calls.

#### 7.3.1 Transport Requests for Bilateral Meetings

When a bilateral meeting is confirmed, Module 12 auto-creates transport requests for both delegations:

```typescript
// file: app/modules/protocol/services/bilateral-logistics.service.ts

import { injectable, inject } from "tsyringe";
import type { PrismaClient } from "@prisma/client";
import type { LogisticsApiClient } from "~/modules/logistics/api-client";

interface BilateralConfirmedPayload {
  bilateralId: string;
  eventId: string;
  tenantId: string;
  requestingDelegationId: string;
  counterpartDelegationId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  venueId: string;
  roomId: string;
}

@injectable()
export class BilateralLogisticsService {
  constructor(
    @inject("PrismaClient") private prisma: PrismaClient,
    @inject("LogisticsApiClient") private logistics: LogisticsApiClient,
  ) {}

  async handleBilateralConfirmed(payload: BilateralConfirmedPayload): Promise<void> {
    const {
      bilateralId,
      eventId,
      tenantId,
      requestingDelegationId,
      counterpartDelegationId,
      scheduledStart,
      scheduledEnd,
      venueId,
      roomId,
    } = payload;

    // Fetch delegation accommodation locations for pickup
    const [requestingAccom, counterpartAccom] = await Promise.all([
      this.prisma.accommodation.findFirst({
        where: { delegationId: requestingDelegationId, eventId },
      }),
      this.prisma.accommodation.findFirst({
        where: { delegationId: counterpartDelegationId, eventId },
      }),
    ]);

    // Buffer time before meeting for transport
    const pickupBuffer = 45 * 60 * 1000; // 45 minutes
    const pickupTime = new Date(scheduledStart.getTime() - pickupBuffer);

    // Create transport requests for both delegations
    const transportRequests = [
      {
        eventId,
        tenantId,
        delegationId: requestingDelegationId,
        sourceType: "BILATERAL" as const,
        sourceId: bilateralId,
        pickupLocationId: requestingAccom?.locationId ?? null,
        dropoffLocationId: venueId,
        pickupTime,
        returnTime: scheduledEnd,
        passengerCount: 4, // Default bilateral party size
        priority: "HIGH" as const,
        notes: `Bilateral meeting transport - Room ${roomId}`,
      },
      {
        eventId,
        tenantId,
        delegationId: counterpartDelegationId,
        sourceType: "BILATERAL" as const,
        sourceId: bilateralId,
        pickupLocationId: counterpartAccom?.locationId ?? null,
        dropoffLocationId: venueId,
        pickupTime,
        returnTime: scheduledEnd,
        passengerCount: 4,
        priority: "HIGH" as const,
        notes: `Bilateral meeting transport - Room ${roomId}`,
      },
    ];

    await Promise.all(transportRequests.map((req) => this.logistics.createTransportRequest(req)));
  }
}
```

#### 7.3.2 Accommodation Sharing

Delegates and their companions share accommodation assignments. Module 11 manages the room inventory; Module 12 provides the delegation-companion linkage:

- **Delegate accommodation** is assigned by Module 11 based on delegation size and protocol rank
- **Companion accommodation** inherits from the linked delegate unless overridden
- Module 12 publishes `CompanionAccommodationLinked` when a companion is paired with a delegate room
- Room upgrades triggered by protocol rank changes flow from Module 12 → Module 11

#### 7.3.3 Venue Room Inventory for Bilateral Rooms

Bilateral scheduling requires knowledge of available meeting rooms. Module 12 queries Module 11's venue room inventory:

```typescript
// Room query interface consumed from Module 11
interface BilateralRoomQuery {
  eventId: string;
  venueId: string;
  date: Date;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  minCapacity: number;
  requiredFeatures: BilateralRoomFeature[];
}

type BilateralRoomFeature =
  | "INTERPRETATION_BOOTH"
  | "VIDEO_CONFERENCE"
  | "SECURE_COMMS"
  | "FLAG_DISPLAY"
  | "NAMEPLATE_HOLDER"
  | "REFRESHMENT_SERVICE"
  | "WAITING_AREA"
  | "PRESS_ACCESS";

interface AvailableRoom {
  roomId: string;
  roomName: string;
  venueId: string;
  capacity: number;
  features: BilateralRoomFeature[];
  floorLevel: number;
  isVIP: boolean;
  availableSlots: TimeSlot[];
}
```

#### 7.3.4 Catering Integration

Protocol seating and companion programs drive catering requirements:

| Protocol Source               | Catering Action                                   | Data Flow                                  |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------ |
| Seating arrangement finalized | Table assignments → meal service routing          | `SeatingFinalized` event → Catering module |
| Companion meal preferences    | Companion dietary needs → meal plan               | Companion profile dietary field            |
| Bilateral meeting scheduled   | Refreshment service request for meeting room      | Auto-created with transport request        |
| VIP delegation arrival        | Welcome refreshment package at accommodation      | `VIPArrivalConfirmed` event                |
| Head of State dinner          | Protocol seating order → formal dinner table plan | Separate ceremony seating sub-module       |

### 7.4 Interpretation Services Integration (Module 13)

Bilateral meetings require interpretation services when delegations do not share a common working language.

#### 7.4.1 Language Requirements → Interpreter Assignment

When a bilateral meeting is confirmed, Module 12 determines the language pair and requests interpreters:

```typescript
// file: app/modules/protocol/services/bilateral-interpretation.service.ts

interface BilateralLanguageRequirement {
  bilateralId: string;
  eventId: string;
  tenantId: string;
  requestingDelegation: {
    delegationId: string;
    primaryLanguage: string; // ISO 639-1
    secondaryLanguages: string[];
  };
  counterpartDelegation: {
    delegationId: string;
    primaryLanguage: string;
    secondaryLanguages: string[];
  };
  meetingDate: Date;
  startTime: string;
  endTime: string;
  roomId: string;
}

async function resolveInterpreterNeeds(
  requirement: BilateralLanguageRequirement,
): Promise<InterpreterRequest | null> {
  const { requestingDelegation, counterpartDelegation } = requirement;

  // Check if delegations share a common language
  const allRequestingLangs = [
    requestingDelegation.primaryLanguage,
    ...requestingDelegation.secondaryLanguages,
  ];
  const allCounterpartLangs = [
    counterpartDelegation.primaryLanguage,
    ...counterpartDelegation.secondaryLanguages,
  ];

  const commonLanguages = allRequestingLangs.filter((lang) => allCounterpartLangs.includes(lang));

  if (commonLanguages.length > 0) {
    // No interpreter needed — common language available
    return null;
  }

  // Request interpreter for the language pair
  return {
    bilateralId: requirement.bilateralId,
    eventId: requirement.eventId,
    tenantId: requirement.tenantId,
    sourceLanguage: requestingDelegation.primaryLanguage,
    targetLanguage: counterpartDelegation.primaryLanguage,
    mode: "CONSECUTIVE", // Bilateral meetings use consecutive interpretation
    date: requirement.meetingDate,
    startTime: requirement.startTime,
    endTime: requirement.endTime,
    roomId: requirement.roomId,
    priority: "HIGH",
  };
}
```

#### 7.4.2 Interpreter Availability Check

Before finalizing bilateral scheduling, Module 12 checks interpreter availability through Module 13's API:

```
Module 12 (Bilateral Scheduler)
  │
  ├─ POST /api/v1/interpretation/availability-check
  │   Body: { sourceLanguage, targetLanguage, date, startTime, endTime }
  │   Response: { available: boolean, interpreterCount: number, alternativeSlots?: TimeSlot[] }
  │
  └─ If unavailable:
       ├─ Suggest alternative time slots where interpreters are free
       └─ Flag bilateral as PENDING_INTERPRETER in scheduling queue
```

### 7.5 Content Integration (Module 14)

Module 14 handles document templates and content production. Module 12 provides data for several protocol-specific document types.

#### 7.5.1 Meeting Brief PDF Generation

Bilateral meeting briefs are generated before each meeting and distributed to both delegations:

```typescript
// Data payload sent to Module 14's PDF generation service
interface MeetingBriefData {
  bilateralId: string;
  eventId: string;
  tenantId: string;
  meetingTitle: string;
  date: string;
  time: string;
  venue: string;
  room: string;
  requestingDelegation: {
    countryName: string;
    countryCode: string;
    flagUrl: string;
    headOfDelegation: string;
    title: string;
    participants: Array<{ name: string; role: string }>;
  };
  counterpartDelegation: {
    countryName: string;
    countryCode: string;
    flagUrl: string;
    headOfDelegation: string;
    title: string;
    participants: Array<{ name: string; role: string }>;
  };
  agenda?: string[];
  interpreterAssigned: boolean;
  interpreterLanguages?: string;
  previousMeetingNotes?: string;
  protocolNotes?: string;
  securityClassification: "UNCLASSIFIED" | "CONFIDENTIAL" | "RESTRICTED";
}
```

#### 7.5.2 Nameplate and Flag Printing

Seating finalization triggers nameplate and flag printing through Module 14:

| Document Type             | Template Key              | Data Source                            | Trigger Event        |
| ------------------------- | ------------------------- | -------------------------------------- | -------------------- |
| Country nameplate (large) | `NAMEPLATE_COUNTRY_LARGE` | Delegation country name, protocol rank | `SeatingFinalized`   |
| Individual nameplate      | `NAMEPLATE_INDIVIDUAL`    | Participant name, title, delegation    | `SeatingFinalized`   |
| Table flag (bilateral)    | `FLAG_TABLE_BILATERAL`    | Both delegation country codes          | `BilateralScheduled` |
| Desk flag (plenary)       | `FLAG_DESK_PLENARY`       | Delegation country code, seat position | `SeatingFinalized`   |

#### 7.5.3 Welcome Letter Personalization

Module 12 provides personalization data for welcome letters:

- Head of delegation title and honorific (from protocol rank)
- Companion name and relationship
- Assigned bilateral meeting schedule summary
- Companion program itinerary
- Gift package contents summary (if applicable)

### 7.6 Event Operations Integration (Module 10)

Module 10 manages the event command center. Module 12 feeds real-time protocol data into the operations dashboard.

#### 7.6.1 Command Center VIP Visibility

VIP movement tracking data flows from Module 12 to Module 10's command center:

```typescript
// Real-time VIP movement event structure
interface VIPMovementEvent {
  type: "VIP_MOVEMENT_UPDATE";
  participantId: string;
  eventId: string;
  tenantId: string;
  delegationId: string;
  protocolRankTier: number;
  movement: {
    fromLocation: string;
    toLocation: string;
    status: "DEPARTED" | "IN_TRANSIT" | "ARRIVED" | "DELAYED";
    estimatedArrival?: Date;
    vehicleId?: string;
    securityDetail?: string;
  };
  timestamp: Date;
}

// Pushed via Server-Sent Events to command center dashboard
// GET /api/v1/events/:eventId/protocol/vip-movements/stream
```

#### 7.6.2 Protocol Incident Logging

Diplomatic incidents logged in Module 12 feed into Module 10's operations dashboard:

```typescript
interface ProtocolIncident {
  incidentId: string;
  eventId: string;
  tenantId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category:
    | "SEATING_DISPUTE"
    | "PRECEDENCE_OBJECTION"
    | "BILATERAL_CANCELLATION"
    | "VIP_DELAY"
    | "FLAG_PROTOCOL_VIOLATION"
    | "DIPLOMATIC_COMPLAINT"
    | "SECURITY_CONCERN"
    | "OTHER";
  description: string;
  involvedDelegations: string[];
  reportedBy: string;
  reportedAt: Date;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVING" | "RESOLVED" | "ESCALATED";
  resolutionNotes?: string;
}
```

#### 7.6.3 Seating Finalization → Badge Zone Updates

When seating is finalized, zone access may be updated based on assigned seating areas:

```
SeatingFinalized event
  │
  └─ For each participant with assigned seat:
       ├─ Determine zone from seat location (e.g., PLENARY_FRONT → VIP_ZONE)
       ├─ Publish BadgeZoneUpdateRequested to Module 09
       └─ Module 09 updates badge access zone permissions
```

### 7.7 Domain Events Published and Consumed

#### 7.7.1 Events Published by Module 12

| Event Name                   | Payload Summary                                   | Consumers             | Trigger                             |
| ---------------------------- | ------------------------------------------------- | --------------------- | ----------------------------------- |
| `ProtocolRankAssigned`       | participantId, rankTier, rankName, method         | Module 09, 11         | Rank auto-assign or manual override |
| `ProtocolRankOverridden`     | participantId, oldTier, newTier, reason           | Module 09, 10, 11     | Manual rank change                  |
| `SeatingDraftCreated`        | seatingId, eventId, sessionId, layout, seatCount  | Module 10             | Draft seating created               |
| `SeatingFinalized`           | seatingId, assignments[], sessionId               | Module 09, 11, 14     | Seating plan locked                 |
| `SeatingRevoked`             | seatingId, reason                                 | Module 09, 10, 14     | Seating plan reverted to draft      |
| `BilateralRequested`         | bilateralId, requestingDelegation, counterpart    | Module 07, 10         | New bilateral request submitted     |
| `BilateralConfirmed`         | bilateralId, schedule, room, interpreterNeeded    | Module 11, 13, 14     | Both parties confirmed              |
| `BilateralScheduled`         | bilateralId, finalTime, room, interpreterAssigned | Module 07, 10, 11, 14 | Auto-scheduler placed meeting       |
| `BilateralCancelled`         | bilateralId, reason, cancelledBy                  | Module 07, 10, 11, 13 | Bilateral cancelled                 |
| `BilateralCompleted`         | bilateralId, actualDuration, notes                | Module 10, 16         | Meeting concluded                   |
| `CompanionProfileCreated`    | companionId, delegateId, programEligibility       | Module 09, 11         | Companion registered                |
| `CompanionProgramAssigned`   | companionId, programId, itinerary                 | Module 07, 11         | Program assignment                  |
| `GiftAllocated`              | giftItemId, delegationId, recipientDelegationId   | Module 10, 16         | Gift assigned to delegation         |
| `GiftPackageAssembled`       | packageId, items[], assembledBy                   | Module 10             | Package assembly complete           |
| `PackageDelivered`           | packageId, deliveredTo, deliveredAt, signature    | Module 10, 16         | Gift delivered and confirmed        |
| `VIPMovementUpdate`          | participantId, from, to, status                   | Module 10             | VIP location change                 |
| `DiplomaticIncidentReported` | incidentId, severity, category, delegations       | Module 10             | Incident logged                     |
| `DiplomaticIncidentResolved` | incidentId, resolution                            | Module 10, 16         | Incident closed                     |

#### 7.7.2 Events Consumed by Module 12

| Event Name               | Source Module | Action Taken                               |
| ------------------------ | ------------- | ------------------------------------------ |
| `ParticipantRegistered`  | Module 09     | Auto-assign protocol rank                  |
| `ParticipantUpdated`     | Module 09     | Re-evaluate rank if type changed           |
| `ParticipantCancelled`   | Module 09     | Remove from seating, cancel bilaterals     |
| `DelegationCreated`      | Module 04     | Initialize delegation protocol profile     |
| `DelegationUpdated`      | Module 04     | Update head-of-delegation reference        |
| `SessionScheduled`       | Module 03     | Create seating arrangement stub            |
| `SessionCancelled`       | Module 03     | Archive associated seating arrangements    |
| `VenueRoomUpdated`       | Module 11     | Refresh bilateral room availability cache  |
| `InterpreterAssigned`    | Module 13     | Update bilateral interpreter status        |
| `InterpreterUnavailable` | Module 13     | Trigger bilateral reschedule suggestion    |
| `EventPhaseChanged`      | Module 03     | Enforce seating lock rules per event phase |

---

## 8. Configuration

Module 12 is highly configurable to support diverse diplomatic traditions, organizational norms, and event-specific protocol requirements. Configuration is managed through three layers: database-stored `SystemSetting` entries (per-tenant), feature flags, and environment variables.

### 8.1 Settings Keys (SystemSetting Entries)

All settings are scoped per tenant and optionally per event. The `key` follows dot-notation convention. Values are stored as JSON strings.

| Key                                              | Type      | Default                                                               | Description                                                                                                            |
| ------------------------------------------------ | --------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `protocol.ranking.system`                        | `enum`    | `"ALPHABETICAL_EN"`                                                   | Default ranking system for new events. Values: `ALPHABETICAL_EN`, `ALPHABETICAL_FR`, `SENIORITY`, `CUSTOM`             |
| `protocol.ranking.tieBreaker`                    | `enum`    | `"REGISTRATION_DATE"`                                                 | Tie-breaking rule when two delegations share the same rank tier. Values: `REGISTRATION_DATE`, `COUNTRY_CODE`, `RANDOM` |
| `protocol.ranking.autoAssign`                    | `boolean` | `true`                                                                | Whether to auto-assign protocol ranks on participant registration                                                      |
| `protocol.ranking.manualOverrideAllowed`         | `boolean` | `true`                                                                | Whether Protocol Officers can manually override auto-assigned ranks                                                    |
| `protocol.ranking.hostCountryFirst`              | `boolean` | `true`                                                                | Whether the host country is always seated/ranked first regardless of system                                            |
| `protocol.seating.defaultLayout`                 | `enum`    | `"HOLLOW_SQUARE"`                                                     | Default seating layout for new sessions. Values: `BOARDROOM`, `HOLLOW_SQUARE`, `U_SHAPE`, `BANQUET`, `THEATER`         |
| `protocol.seating.conflictRuleTemplates`         | `json`    | `"[]"`                                                                | Pre-defined conflict rule templates available for seating (JSON array)                                                 |
| `protocol.seating.autoAssignEnabled`             | `boolean` | `false`                                                               | Whether to run auto-seating algorithm or require manual placement                                                      |
| `protocol.seating.lockOnFinalize`                | `boolean` | `true`                                                                | Whether finalized seating cannot be modified without revocation                                                        |
| `protocol.seating.maxRevisionsBeforeLock`        | `number`  | `5`                                                                   | Maximum draft revisions allowed before forced review                                                                   |
| `protocol.seating.nameplateFormat`               | `enum`    | `"COUNTRY_ONLY"`                                                      | Nameplate display format. Values: `COUNTRY_ONLY`, `COUNTRY_AND_NAME`, `FULL_TITLE`                                     |
| `protocol.bilateral.schedulingWindow`            | `json`    | `{"start":"08:00","end":"20:00"}`                                     | Daily time window for bilateral meeting scheduling                                                                     |
| `protocol.bilateral.defaultDuration`             | `number`  | `30`                                                                  | Default bilateral meeting duration in minutes                                                                          |
| `protocol.bilateral.maxDuration`                 | `number`  | `90`                                                                  | Maximum allowed bilateral meeting duration in minutes                                                                  |
| `protocol.bilateral.bufferBetweenMeetings`       | `number`  | `15`                                                                  | Minimum buffer in minutes between consecutive bilaterals for a delegation                                              |
| `protocol.bilateral.maxPerDelegationPerDay`      | `number`  | `6`                                                                   | Maximum bilateral meetings per delegation per day                                                                      |
| `protocol.bilateral.counterpartResponseDeadline` | `number`  | `48`                                                                  | Hours allowed for counterpart to respond to bilateral request                                                          |
| `protocol.bilateral.autoScheduleEnabled`         | `boolean` | `true`                                                                | Whether to auto-schedule confirmed bilaterals or require manual placement                                              |
| `protocol.bilateral.priorityWeights`             | `json`    | `{"rankDiff":0.4,"requestAge":0.3,"preference":0.2,"constraint":0.1}` | Priority scoring weights for scheduling algorithm                                                                      |
| `protocol.companion.enabled`                     | `boolean` | `true`                                                                | Whether companion program is active for this tenant/event                                                              |
| `protocol.companion.maxPerDelegate`              | `number`  | `1`                                                                   | Maximum companions allowed per delegate                                                                                |
| `protocol.companion.programTypes`                | `json`    | `["CULTURAL","SIGHTSEEING","SHOPPING","WELLNESS"]`                    | Available companion program categories                                                                                 |
| `protocol.companion.registrationDeadlineDays`    | `number`  | `14`                                                                  | Days before event that companion registration closes                                                                   |
| `protocol.gift.enabled`                          | `boolean` | `true`                                                                | Whether gift protocol module is active                                                                                 |
| `protocol.gift.thresholdAmount`                  | `number`  | `50`                                                                  | Gift value threshold in USD for enhanced tracking                                                                      |
| `protocol.gift.thresholdMode`                    | `enum`    | `"PER_ITEM"`                                                          | How threshold is applied. Values: `PER_ITEM`, `CUMULATIVE_PER_DELEGATION`                                              |
| `protocol.gift.requireApproval`                  | `boolean` | `false`                                                               | Whether gifts above threshold require approval before allocation                                                       |
| `protocol.gift.trackingEnabled`                  | `boolean` | `true`                                                                | Whether gift delivery tracking with signatures is enabled                                                              |
| `protocol.gift.assemblyStationCount`             | `number`  | `3`                                                                   | Number of concurrent assembly stations                                                                                 |
| `protocol.gift.packageTypes`                     | `json`    | `["WELCOME","DEPARTURE","COMMEMORATIVE","BILATERAL"]`                 | Available gift package categories                                                                                      |
| `protocol.vip.movementTrackingEnabled`           | `boolean` | `false`                                                               | Whether VIP movement tracking is active                                                                                |
| `protocol.vip.movementUpdateInterval`            | `number`  | `300`                                                                 | Seconds between VIP location update polls                                                                              |
| `protocol.vip.alertThresholdDelay`               | `number`  | `15`                                                                  | Minutes of delay before VIP delay alert fires                                                                          |
| `protocol.incident.autoEscalateMinutes`          | `number`  | `60`                                                                  | Minutes before unacknowledged HIGH/CRITICAL incidents auto-escalate                                                    |
| `protocol.incident.notifyChiefOfProtocol`        | `boolean` | `true`                                                                | Whether the Chief of Protocol is auto-notified on all incidents                                                        |
| `protocol.workflow.seatingApprovalSteps`         | `json`    | `["DRAFT","REVIEW","APPROVE","FINALIZE"]`                             | Workflow steps for seating plan approval                                                                               |
| `protocol.workflow.bilateralApprovalRequired`    | `boolean` | `false`                                                               | Whether bilateral scheduling requires Chief of Protocol approval                                                       |

### 8.2 Feature Flags

Feature flags control module capability availability. They are evaluated at runtime and can be toggled without deployment.

| Flag Key                            | Default | Scope  | Description                                                     |
| ----------------------------------- | ------- | ------ | --------------------------------------------------------------- |
| `PROTOCOL_SEATING_ENABLED`          | `true`  | Tenant | Master toggle for seating arrangement functionality             |
| `PROTOCOL_SEATING_AUTO_ALGORITHM`   | `false` | Tenant | Enable AI/constraint-based auto-seating algorithm               |
| `PROTOCOL_SEATING_CONFLICT_RULES`   | `true`  | Tenant | Enable conflict rule enforcement in seating                     |
| `PROTOCOL_SEATING_REALTIME_PREVIEW` | `true`  | Tenant | Enable real-time drag-and-drop seating preview                  |
| `BILATERAL_SCHEDULING_ENABLED`      | `true`  | Tenant | Master toggle for bilateral meeting scheduling                  |
| `BILATERAL_AUTO_SCHEDULER`          | `true`  | Tenant | Enable automatic scheduling engine for confirmed bilaterals     |
| `BILATERAL_INTERPRETER_CHECK`       | `true`  | Tenant | Check interpreter availability before scheduling                |
| `BILATERAL_BRIEF_GENERATION`        | `true`  | Tenant | Auto-generate meeting briefs for confirmed bilaterals           |
| `COMPANION_PROGRAM_ENABLED`         | `true`  | Tenant | Master toggle for companion registration and program management |
| `COMPANION_SELF_REGISTRATION`       | `false` | Tenant | Allow companions to self-register through public portal         |
| `COMPANION_PROGRAM_ITINERARY`       | `true`  | Tenant | Enable itinerary generation for companion programs              |
| `GIFT_PROTOCOL_ENABLED`             | `true`  | Tenant | Master toggle for gift allocation and tracking                  |
| `GIFT_ASSEMBLY_STATION`             | `true`  | Tenant | Enable assembly station interface for gift packages             |
| `GIFT_QR_TRACKING`                  | `false` | Tenant | Enable QR code-based gift delivery tracking                     |
| `GIFT_COMPLIANCE_REPORTING`         | `false` | Tenant | Enable gift value compliance reports                            |
| `VIP_MOVEMENT_TRACKING`             | `false` | Tenant | Enable real-time VIP movement tracking                          |
| `VIP_MOVEMENT_MAP_VIEW`             | `false` | Tenant | Enable map-based VIP location visualization                     |
| `CULTURAL_SENSITIVITY_ENGINE`       | `false` | Tenant | Enable cultural sensitivity rule checking in seating and gifts  |
| `PROTOCOL_INCIDENT_MODULE`          | `true`  | Tenant | Enable diplomatic incident logging and tracking                 |
| `PROTOCOL_MOBILE_INTERFACE`         | `false` | Global | Enable mobile-optimized protocol management views               |
| `PROTOCOL_OFFLINE_MODE`             | `false` | Global | Enable offline capability for assembly and movement tracking    |
| `PROTOCOL_PDF_WATERMARK`            | `true`  | Tenant | Add security watermark to generated protocol PDFs               |

### 8.3 Environment Variables

Environment-level configuration for infrastructure and service connections.

| Variable                                 | Required | Default              | Description                                                   |
| ---------------------------------------- | -------- | -------------------- | ------------------------------------------------------------- |
| `PROTOCOL_PDF_STORAGE_CONTAINER`         | Yes      | `protocol-documents` | Azure Blob Storage container for generated PDFs               |
| `PROTOCOL_PDF_STORAGE_CONNECTION_STRING` | Yes      | —                    | Connection string for PDF storage account                     |
| `PROTOCOL_PDF_GENERATION_TIMEOUT_MS`     | No       | `30000`              | Timeout for PDF generation operations                         |
| `PROTOCOL_PDF_MAX_CONCURRENT`            | No       | `5`                  | Maximum concurrent PDF generation jobs                        |
| `BILATERAL_MAX_CONCURRENT_SCHEDULES`     | No       | `10`                 | Maximum concurrent auto-scheduling operations                 |
| `BILATERAL_SCHEDULER_TIMEOUT_MS`         | No       | `60000`              | Timeout for bilateral scheduling algorithm                    |
| `BILATERAL_CALENDAR_SYNC_ENABLED`        | No       | `false`              | Enable external calendar sync for bilateral schedules         |
| `GIFT_THRESHOLD_USD`                     | No       | `50`                 | Default gift tracking threshold (overridden by SystemSetting) |
| `GIFT_IMAGE_STORAGE_CONTAINER`           | No       | `gift-images`        | Azure Blob container for gift item photos                     |
| `GIFT_IMAGE_MAX_SIZE_MB`                 | No       | `5`                  | Maximum upload size for gift item images                      |
| `VIP_TRACKING_POLL_INTERVAL_SECONDS`     | No       | `300`                | VIP location polling interval                                 |
| `VIP_TRACKING_REDIS_KEY_PREFIX`          | No       | `vip:movement:`      | Redis key prefix for VIP tracking cache                       |
| `PROTOCOL_CACHE_TTL_SECONDS`             | No       | `300`                | Default cache TTL for protocol data                           |
| `PROTOCOL_CONFLICT_RULE_CACHE_TTL`       | No       | `600`                | Cache TTL for conflict rule data                              |
| `PROTOCOL_SSE_HEARTBEAT_INTERVAL_MS`     | No       | `30000`              | SSE heartbeat interval for real-time streams                  |
| `PROTOCOL_MAX_SEATING_CAPACITY`          | No       | `500`                | Maximum seats per seating arrangement                         |
| `PROTOCOL_ENCRYPTION_KEY`                | Yes      | —                    | AES-256 key for encrypting sensitive protocol data at rest    |

### 8.4 Protocol Templates

Pre-configured protocol templates can be loaded to bootstrap event configuration. Templates are stored as JSON and imported during event setup.

#### AU Summit Standard Template

```json
{
  "templateId": "au-summit-standard",
  "name": "African Union Summit — Standard Protocol",
  "version": "2.1",
  "description": "Standard protocol configuration for AU Heads of State and Government summits",
  "ranking": {
    "system": "ALPHABETICAL_EN",
    "tieBreaker": "REGISTRATION_DATE",
    "hostCountryFirst": true,
    "auChairpersonFirst": true,
    "rankTiers": [
      {
        "tier": 1,
        "name": "Heads of State and Government",
        "participantTypes": ["HEAD_OF_STATE", "HEAD_OF_GOVERNMENT"]
      },
      { "tier": 2, "name": "Deputy Heads of State", "participantTypes": ["DEPUTY_HEAD_OF_STATE"] },
      {
        "tier": 3,
        "name": "Ministers of Foreign Affairs",
        "participantTypes": ["MINISTER_FOREIGN_AFFAIRS"]
      },
      { "tier": 4, "name": "Ministers", "participantTypes": ["MINISTER"] },
      {
        "tier": 5,
        "name": "Ambassadors and Special Envoys",
        "participantTypes": ["AMBASSADOR", "SPECIAL_ENVOY"]
      },
      { "tier": 6, "name": "Delegates", "participantTypes": ["DELEGATE"] },
      { "tier": 7, "name": "Observers", "participantTypes": ["OBSERVER"] },
      { "tier": 8, "name": "Staff", "participantTypes": ["STAFF"] }
    ]
  },
  "seating": {
    "defaultLayout": "HOLLOW_SQUARE",
    "conflictRuleTemplates": [
      {
        "name": "Standard AU Separation",
        "description": "Delegations with active disputes are separated by at least 2 seats",
        "type": "MIN_DISTANCE",
        "minSeats": 2
      }
    ],
    "nameplateFormat": "COUNTRY_ONLY",
    "flagDisplay": true,
    "approvalWorkflow": ["DRAFT", "REVIEW", "CHIEF_APPROVAL", "FINALIZE"]
  },
  "bilateral": {
    "schedulingWindow": { "start": "08:00", "end": "20:00" },
    "defaultDuration": 30,
    "maxDuration": 60,
    "bufferMinutes": 15,
    "maxPerDelegationPerDay": 8,
    "responseDeadlineHours": 24,
    "roomFeatures": [
      "FLAG_DISPLAY",
      "NAMEPLATE_HOLDER",
      "INTERPRETATION_BOOTH",
      "REFRESHMENT_SERVICE"
    ]
  },
  "companion": {
    "enabled": true,
    "maxPerDelegate": 1,
    "programTypes": ["CULTURAL", "SIGHTSEEING", "WELLNESS"],
    "registrationDeadlineDays": 21
  },
  "gift": {
    "enabled": true,
    "thresholdAmount": 100,
    "thresholdMode": "PER_ITEM",
    "packageTypes": ["WELCOME", "DEPARTURE", "COMMEMORATIVE"],
    "requireApproval": false
  },
  "vip": {
    "movementTrackingEnabled": true,
    "alertThresholdDelay": 10
  }
}
```

#### ECOWAS Ministerial Template

```json
{
  "templateId": "ecowas-ministerial",
  "name": "ECOWAS Ministerial Meeting — Protocol Configuration",
  "version": "1.3",
  "description": "Protocol configuration for ECOWAS Council of Ministers meetings",
  "ranking": {
    "system": "ALPHABETICAL_FR",
    "tieBreaker": "COUNTRY_CODE",
    "hostCountryFirst": true,
    "ecowasChairFirst": true,
    "rankTiers": [
      {
        "tier": 1,
        "name": "Ministers of Foreign Affairs",
        "participantTypes": ["MINISTER_FOREIGN_AFFAIRS"]
      },
      { "tier": 2, "name": "Ministers", "participantTypes": ["MINISTER"] },
      { "tier": 3, "name": "Ambassadors", "participantTypes": ["AMBASSADOR"] },
      { "tier": 4, "name": "Senior Officials", "participantTypes": ["DELEGATE"] },
      { "tier": 5, "name": "Observers", "participantTypes": ["OBSERVER"] },
      { "tier": 6, "name": "Technical Staff", "participantTypes": ["STAFF"] }
    ]
  },
  "seating": {
    "defaultLayout": "U_SHAPE",
    "conflictRuleTemplates": [],
    "nameplateFormat": "COUNTRY_AND_NAME",
    "flagDisplay": true,
    "approvalWorkflow": ["DRAFT", "APPROVE", "FINALIZE"]
  },
  "bilateral": {
    "schedulingWindow": { "start": "09:00", "end": "18:00" },
    "defaultDuration": 20,
    "maxDuration": 45,
    "bufferMinutes": 10,
    "maxPerDelegationPerDay": 5,
    "responseDeadlineHours": 12,
    "roomFeatures": ["FLAG_DISPLAY", "NAMEPLATE_HOLDER", "INTERPRETATION_BOOTH"]
  },
  "companion": {
    "enabled": false
  },
  "gift": {
    "enabled": true,
    "thresholdAmount": 50,
    "thresholdMode": "PER_ITEM",
    "packageTypes": ["WELCOME", "COMMEMORATIVE"],
    "requireApproval": false
  },
  "vip": {
    "movementTrackingEnabled": false
  }
}
```

#### Technical Conference Template

```json
{
  "templateId": "technical-conference",
  "name": "Technical/Expert Conference — Light Protocol",
  "version": "1.0",
  "description": "Minimal protocol configuration for technical and expert-level meetings",
  "ranking": {
    "system": "ALPHABETICAL_EN",
    "tieBreaker": "REGISTRATION_DATE",
    "hostCountryFirst": false,
    "rankTiers": [
      { "tier": 1, "name": "Lead Experts", "participantTypes": ["DELEGATE"] },
      { "tier": 2, "name": "Technical Staff", "participantTypes": ["STAFF"] },
      { "tier": 3, "name": "Observers", "participantTypes": ["OBSERVER"] }
    ]
  },
  "seating": {
    "defaultLayout": "BOARDROOM",
    "conflictRuleTemplates": [],
    "nameplateFormat": "COUNTRY_AND_NAME",
    "flagDisplay": false,
    "approvalWorkflow": ["DRAFT", "FINALIZE"]
  },
  "bilateral": {
    "schedulingWindow": { "start": "08:00", "end": "17:00" },
    "defaultDuration": 15,
    "maxDuration": 30,
    "bufferMinutes": 5,
    "maxPerDelegationPerDay": 10,
    "responseDeadlineHours": 6,
    "roomFeatures": ["VIDEO_CONFERENCE"]
  },
  "companion": {
    "enabled": false
  },
  "gift": {
    "enabled": false
  },
  "vip": {
    "movementTrackingEnabled": false
  }
}
```

---

## 9. Testing Strategy

This section defines the comprehensive testing approach for Module 12. All protocol operations involve complex business rules, constraint satisfaction, and multi-entity state transitions that require thorough test coverage at every level.

### 9.1 Unit Tests

Unit tests target individual service methods, algorithm correctness, and validation logic in isolation. All unit tests use Vitest with mocked dependencies.

#### 9.1.1 Seating Algorithm Constraint Satisfaction

```typescript
// file: app/modules/protocol/__tests__/unit/seating-algorithm.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SeatingAlgorithm } from "../../services/seating-algorithm.service";
import type { SeatingConstraint, DelegationSeat, SeatingLayout } from "../../types";

describe("SeatingAlgorithm", () => {
  let algorithm: SeatingAlgorithm;

  beforeEach(() => {
    algorithm = new SeatingAlgorithm();
  });

  describe("generateSeatingPlan", () => {
    it("should place host country in position 1 when hostCountryFirst is enabled", () => {
      const delegations = [
        { delegationId: "del-1", countryCode: "NG", rankTier: 1, isHost: false },
        { delegationId: "del-2", countryCode: "ET", rankTier: 1, isHost: true },
        { delegationId: "del-3", countryCode: "KE", rankTier: 1, isHost: false },
      ];

      const result = algorithm.generateSeatingPlan({
        layout: "HOLLOW_SQUARE" as SeatingLayout,
        delegations,
        constraints: [],
        options: { hostCountryFirst: true, rankingSystem: "ALPHABETICAL_EN" },
      });

      expect(result.assignments[0].delegationId).toBe("del-2");
      expect(result.assignments[0].seatPosition).toBe(1);
    });

    it("should sort delegations alphabetically within the same rank tier", () => {
      const delegations = [
        { delegationId: "del-ng", countryCode: "NG", rankTier: 1, isHost: false },
        { delegationId: "del-et", countryCode: "ET", rankTier: 1, isHost: false },
        { delegationId: "del-ke", countryCode: "KE", rankTier: 1, isHost: false },
        { delegationId: "del-za", countryCode: "ZA", rankTier: 1, isHost: false },
      ];

      const result = algorithm.generateSeatingPlan({
        layout: "HOLLOW_SQUARE" as SeatingLayout,
        delegations,
        constraints: [],
        options: { hostCountryFirst: false, rankingSystem: "ALPHABETICAL_EN" },
      });

      const countryCodes = result.assignments.map((a) => a.countryCode);
      expect(countryCodes).toEqual(["ET", "KE", "NG", "ZA"]);
    });

    it("should enforce MIN_DISTANCE conflict rules between delegations", () => {
      const delegations = [
        { delegationId: "del-1", countryCode: "AA", rankTier: 1, isHost: false },
        { delegationId: "del-2", countryCode: "BB", rankTier: 1, isHost: false },
        { delegationId: "del-3", countryCode: "CC", rankTier: 1, isHost: false },
        { delegationId: "del-4", countryCode: "DD", rankTier: 1, isHost: false },
        { delegationId: "del-5", countryCode: "EE", rankTier: 1, isHost: false },
      ];

      const constraints: SeatingConstraint[] = [
        {
          type: "MIN_DISTANCE",
          delegationA: "del-1",
          delegationB: "del-2",
          minSeats: 2,
        },
      ];

      const result = algorithm.generateSeatingPlan({
        layout: "HOLLOW_SQUARE" as SeatingLayout,
        delegations,
        constraints,
        options: { hostCountryFirst: false, rankingSystem: "ALPHABETICAL_EN" },
      });

      const posA = result.assignments.find((a) => a.delegationId === "del-1")!.seatPosition;
      const posB = result.assignments.find((a) => a.delegationId === "del-2")!.seatPosition;
      expect(Math.abs(posA - posB)).toBeGreaterThanOrEqual(2);
    });

    it("should enforce MUST_NOT_ADJACENT constraint", () => {
      const delegations = [
        { delegationId: "del-1", countryCode: "AA", rankTier: 1, isHost: false },
        { delegationId: "del-2", countryCode: "BB", rankTier: 1, isHost: false },
        { delegationId: "del-3", countryCode: "CC", rankTier: 1, isHost: false },
      ];

      const constraints: SeatingConstraint[] = [
        {
          type: "MUST_NOT_ADJACENT",
          delegationA: "del-1",
          delegationB: "del-2",
        },
      ];

      const result = algorithm.generateSeatingPlan({
        layout: "BOARDROOM" as SeatingLayout,
        delegations,
        constraints,
        options: { hostCountryFirst: false, rankingSystem: "ALPHABETICAL_EN" },
      });

      const posA = result.assignments.find((a) => a.delegationId === "del-1")!.seatPosition;
      const posB = result.assignments.find((a) => a.delegationId === "del-2")!.seatPosition;
      expect(Math.abs(posA - posB)).toBeGreaterThan(1);
    });

    it("should enforce MUST_ADJACENT constraint for allied delegations", () => {
      const delegations = [
        { delegationId: "del-1", countryCode: "AA", rankTier: 1, isHost: false },
        { delegationId: "del-2", countryCode: "BB", rankTier: 1, isHost: false },
        { delegationId: "del-3", countryCode: "CC", rankTier: 1, isHost: false },
        { delegationId: "del-4", countryCode: "DD", rankTier: 1, isHost: false },
      ];

      const constraints: SeatingConstraint[] = [
        {
          type: "MUST_ADJACENT",
          delegationA: "del-1",
          delegationB: "del-3",
        },
      ];

      const result = algorithm.generateSeatingPlan({
        layout: "BOARDROOM" as SeatingLayout,
        delegations,
        constraints,
        options: { hostCountryFirst: false, rankingSystem: "ALPHABETICAL_EN" },
      });

      const posA = result.assignments.find((a) => a.delegationId === "del-1")!.seatPosition;
      const posC = result.assignments.find((a) => a.delegationId === "del-3")!.seatPosition;
      expect(Math.abs(posA - posC)).toBe(1);
    });

    it("should return infeasible result when constraints are contradictory", () => {
      const delegations = [
        { delegationId: "del-1", countryCode: "AA", rankTier: 1, isHost: false },
        { delegationId: "del-2", countryCode: "BB", rankTier: 1, isHost: false },
      ];

      const constraints: SeatingConstraint[] = [
        { type: "MUST_ADJACENT", delegationA: "del-1", delegationB: "del-2" },
        { type: "MUST_NOT_ADJACENT", delegationA: "del-1", delegationB: "del-2" },
      ];

      const result = algorithm.generateSeatingPlan({
        layout: "BOARDROOM" as SeatingLayout,
        delegations,
        constraints,
        options: { hostCountryFirst: false, rankingSystem: "ALPHABETICAL_EN" },
      });

      expect(result.feasible).toBe(false);
      expect(result.violations).toHaveLength(1);
    });
  });
});
```

#### 9.1.2 Bilateral Scheduling Priority Resolution

```typescript
// file: app/modules/protocol/__tests__/unit/bilateral-priority.test.ts

import { describe, it, expect } from "vitest";
import { BilateralPriorityCalculator } from "../../services/bilateral-priority.service";

describe("BilateralPriorityCalculator", () => {
  const calculator = new BilateralPriorityCalculator({
    rankDiff: 0.4,
    requestAge: 0.3,
    preference: 0.2,
    constraint: 0.1,
  });

  it("should prioritize head-of-state bilateral over minister-level", () => {
    const hosRequest = {
      requestingRankTier: 1, // Head of State
      counterpartRankTier: 1,
      requestedAt: new Date("2025-01-10"),
      hasPreferredSlot: false,
      constraintCount: 0,
    };

    const ministerRequest = {
      requestingRankTier: 5, // Minister
      counterpartRankTier: 5,
      requestedAt: new Date("2025-01-10"),
      hasPreferredSlot: false,
      constraintCount: 0,
    };

    const hosPriority = calculator.calculate(hosRequest);
    const ministerPriority = calculator.calculate(ministerRequest);
    expect(hosPriority).toBeGreaterThan(ministerPriority);
  });

  it("should factor in request age for same-rank bilaterals", () => {
    const olderRequest = {
      requestingRankTier: 3,
      counterpartRankTier: 3,
      requestedAt: new Date("2025-01-01"),
      hasPreferredSlot: false,
      constraintCount: 0,
    };

    const newerRequest = {
      requestingRankTier: 3,
      counterpartRankTier: 3,
      requestedAt: new Date("2025-01-15"),
      hasPreferredSlot: false,
      constraintCount: 0,
    };

    const olderPriority = calculator.calculate(olderRequest);
    const newerPriority = calculator.calculate(newerRequest);
    expect(olderPriority).toBeGreaterThan(newerPriority);
  });

  it("should boost priority for requests with preferred time slots", () => {
    const withPreference = {
      requestingRankTier: 3,
      counterpartRankTier: 3,
      requestedAt: new Date("2025-01-10"),
      hasPreferredSlot: true,
      constraintCount: 0,
    };

    const withoutPreference = {
      requestingRankTier: 3,
      counterpartRankTier: 3,
      requestedAt: new Date("2025-01-10"),
      hasPreferredSlot: false,
      constraintCount: 0,
    };

    const withPriority = calculator.calculate(withPreference);
    const withoutPriority = calculator.calculate(withoutPreference);
    expect(withPriority).toBeGreaterThan(withoutPriority);
  });
});
```

#### 9.1.3 Gift Threshold Validation

```typescript
// file: app/modules/protocol/__tests__/unit/gift-threshold.test.ts

import { describe, it, expect } from "vitest";
import { GiftThresholdValidator } from "../../services/gift-threshold.service";

describe("GiftThresholdValidator", () => {
  describe("PER_ITEM mode", () => {
    const validator = new GiftThresholdValidator({
      thresholdAmount: 50,
      thresholdMode: "PER_ITEM",
    });

    it("should flag items exceeding per-item threshold", () => {
      const result = validator.validate({
        items: [
          { name: "Commemorative Book", estimatedValue: 25 },
          { name: "Crystal Trophy", estimatedValue: 75 },
          { name: "Pin Badge", estimatedValue: 5 },
        ],
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.flaggedItems).toHaveLength(1);
      expect(result.flaggedItems[0].name).toBe("Crystal Trophy");
    });

    it("should pass when no items exceed threshold", () => {
      const result = validator.validate({
        items: [
          { name: "Commemorative Book", estimatedValue: 25 },
          { name: "Pin Badge", estimatedValue: 5 },
        ],
      });

      expect(result.requiresApproval).toBe(false);
      expect(result.flaggedItems).toHaveLength(0);
    });
  });

  describe("CUMULATIVE_PER_DELEGATION mode", () => {
    const validator = new GiftThresholdValidator({
      thresholdAmount: 100,
      thresholdMode: "CUMULATIVE_PER_DELEGATION",
    });

    it("should flag when cumulative value exceeds threshold", () => {
      const result = validator.validate({
        items: [
          { name: "Commemorative Book", estimatedValue: 40 },
          { name: "Local Artwork", estimatedValue: 45 },
          { name: "Wine Selection", estimatedValue: 30 },
        ],
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.cumulativeValue).toBe(115);
      expect(result.thresholdExceededBy).toBe(15);
    });

    it("should pass when cumulative value is within threshold", () => {
      const result = validator.validate({
        items: [
          { name: "Commemorative Book", estimatedValue: 40 },
          { name: "Pin Badge", estimatedValue: 5 },
        ],
      });

      expect(result.requiresApproval).toBe(false);
      expect(result.cumulativeValue).toBe(45);
    });
  });
});
```

#### 9.1.4 Cultural Rule Matching

```typescript
// file: app/modules/protocol/__tests__/unit/cultural-rules.test.ts

import { describe, it, expect } from "vitest";
import { CulturalRuleEngine } from "../../services/cultural-rule.service";

describe("CulturalRuleEngine", () => {
  const engine = new CulturalRuleEngine();

  it("should flag gift items that violate cultural restrictions", () => {
    const rules = [
      {
        countryCode: "SA",
        ruleType: "GIFT_RESTRICTION" as const,
        restriction: "NO_ALCOHOL",
        description: "Alcohol-based gifts not appropriate",
      },
    ];

    const items = [
      { name: "Wine Selection", category: "ALCOHOL", estimatedValue: 30 },
      { name: "Commemorative Book", category: "LITERATURE", estimatedValue: 25 },
    ];

    const violations = engine.checkGiftViolations(rules, items, "SA");
    expect(violations).toHaveLength(1);
    expect(violations[0].item.name).toBe("Wine Selection");
    expect(violations[0].rule.restriction).toBe("NO_ALCOHOL");
  });

  it("should flag seating arrangements that violate cultural protocol", () => {
    const rules = [
      {
        countryCode: "JP",
        ruleType: "SEATING_PROTOCOL" as const,
        restriction: "SENIOR_FACING_DOOR",
        description: "Senior delegates should face the entrance",
      },
    ];

    const seatAssignment = {
      delegationId: "del-jp",
      countryCode: "JP",
      seatPosition: 5,
      facingDirection: "AWAY_FROM_DOOR" as const,
      rankTier: 1,
    };

    const violations = engine.checkSeatingViolations(rules, seatAssignment);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule.restriction).toBe("SENIOR_FACING_DOOR");
  });

  it("should return no violations when all rules are satisfied", () => {
    const rules = [
      {
        countryCode: "SA",
        ruleType: "GIFT_RESTRICTION" as const,
        restriction: "NO_ALCOHOL",
        description: "Alcohol-based gifts not appropriate",
      },
    ];

    const items = [
      { name: "Commemorative Book", category: "LITERATURE", estimatedValue: 25 },
      { name: "Local Artwork", category: "ART", estimatedValue: 50 },
    ];

    const violations = engine.checkGiftViolations(rules, items, "SA");
    expect(violations).toHaveLength(0);
  });
});
```

### 9.2 Integration Tests

Integration tests verify multi-service workflows with a real database (test PostgreSQL instance), using Prisma transactions that are rolled back after each test.

#### 9.2.1 Bilateral Request-to-Scheduling Flow

```typescript
// file: app/modules/protocol/__tests__/integration/bilateral-flow.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { BilateralRequestService } from "../../services/bilateral-request.service";
import { BilateralSchedulerService } from "../../services/bilateral-scheduler.service";
import { createTestContext, cleanupTestContext } from "~/test-utils/context";
import { createTestEvent, createTestDelegation, createTestRoom } from "~/test-utils/factories";

describe("Bilateral Request-to-Scheduling Flow", () => {
  let prisma: PrismaClient;
  let requestService: BilateralRequestService;
  let schedulerService: BilateralSchedulerService;
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext();
    prisma = testContext.prisma;
    requestService = testContext.resolve(BilateralRequestService);
    schedulerService = testContext.resolve(BilateralSchedulerService);
  });

  afterEach(async () => {
    await cleanupTestContext(testContext);
  });

  it("should complete full flow: request → confirm → schedule → generate brief", async () => {
    // Setup
    const event = await createTestEvent(prisma, { tenantId: testContext.tenantId });
    const delegation1 = await createTestDelegation(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      countryCode: "NG",
    });
    const delegation2 = await createTestDelegation(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      countryCode: "ET",
    });
    const room = await createTestRoom(prisma, {
      eventId: event.id,
      venueId: event.venueId,
      features: ["FLAG_DISPLAY", "INTERPRETATION_BOOTH"],
    });

    // Step 1: Submit bilateral request
    const request = await requestService.submitRequest({
      eventId: event.id,
      tenantId: testContext.tenantId,
      requestingDelegationId: delegation1.id,
      counterpartDelegationId: delegation2.id,
      proposedDate: new Date("2025-02-15"),
      preferredTimeSlots: [
        { start: "09:00", end: "09:30" },
        { start: "14:00", end: "14:30" },
      ],
      topic: "Trade cooperation",
      requestedBy: testContext.userId,
    });

    expect(request.status).toBe("PENDING_COUNTERPART");

    // Step 2: Counterpart confirms
    const confirmed = await requestService.respondToRequest({
      bilateralId: request.id,
      delegationId: delegation2.id,
      response: "ACCEPTED",
      confirmedBy: "counterpart-user-id",
    });

    expect(confirmed.status).toBe("CONFIRMED");

    // Step 3: Auto-schedule
    const scheduled = await schedulerService.scheduleConfirmedBilateral({
      bilateralId: confirmed.id,
      eventId: event.id,
      tenantId: testContext.tenantId,
    });

    expect(scheduled.status).toBe("SCHEDULED");
    expect(scheduled.roomId).toBe(room.id);
    expect(scheduled.scheduledStart).toBeDefined();
    expect(scheduled.scheduledEnd).toBeDefined();

    // Step 4: Verify transport requests were created
    const transportRequests = await prisma.transportRequest.findMany({
      where: { sourceId: confirmed.id, sourceType: "BILATERAL" },
    });
    expect(transportRequests).toHaveLength(2);

    // Step 5: Verify meeting brief was generated
    const brief = await prisma.document.findFirst({
      where: {
        sourceType: "BILATERAL_BRIEF",
        sourceId: confirmed.id,
      },
    });
    expect(brief).toBeDefined();
    expect(brief!.status).toBe("GENERATED");
  });

  it("should handle counterpart rejection gracefully", async () => {
    const event = await createTestEvent(prisma, { tenantId: testContext.tenantId });
    const delegation1 = await createTestDelegation(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      countryCode: "GH",
    });
    const delegation2 = await createTestDelegation(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      countryCode: "SN",
    });

    const request = await requestService.submitRequest({
      eventId: event.id,
      tenantId: testContext.tenantId,
      requestingDelegationId: delegation1.id,
      counterpartDelegationId: delegation2.id,
      proposedDate: new Date("2025-02-15"),
      preferredTimeSlots: [{ start: "10:00", end: "10:30" }],
      topic: "Regional security",
      requestedBy: testContext.userId,
    });

    const rejected = await requestService.respondToRequest({
      bilateralId: request.id,
      delegationId: delegation2.id,
      response: "DECLINED",
      declineReason: "Schedule conflict",
      confirmedBy: "counterpart-user-id",
    });

    expect(rejected.status).toBe("DECLINED");

    // Verify no transport requests created
    const transportRequests = await prisma.transportRequest.findMany({
      where: { sourceId: request.id },
    });
    expect(transportRequests).toHaveLength(0);
  });
});
```

#### 9.2.2 Seating with Conflict Rules

```typescript
// file: app/modules/protocol/__tests__/integration/seating-conflict.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { SeatingArrangementService } from "../../services/seating-arrangement.service";
import { createTestContext, cleanupTestContext } from "~/test-utils/context";
import {
  createTestEvent,
  createTestSession,
  createTestDelegationBatch,
  createTestConflictRules,
} from "~/test-utils/factories";

describe("Seating with Conflict Rules", () => {
  let prisma: PrismaClient;
  let seatingService: SeatingArrangementService;
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext();
    prisma = testContext.prisma;
    seatingService = testContext.resolve(SeatingArrangementService);
  });

  afterEach(async () => {
    await cleanupTestContext(testContext);
  });

  it("should create valid seating arrangement respecting all conflict rules", async () => {
    const event = await createTestEvent(prisma, { tenantId: testContext.tenantId });
    const session = await createTestSession(prisma, { eventId: event.id });

    // Create 10 delegations
    const delegations = await createTestDelegationBatch(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      count: 10,
    });

    // Create conflict rules
    await createTestConflictRules(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      rules: [
        {
          delegationAId: delegations[0].id,
          delegationBId: delegations[1].id,
          type: "MUST_NOT_ADJACENT",
        },
        {
          delegationAId: delegations[2].id,
          delegationBId: delegations[3].id,
          type: "MIN_DISTANCE",
          minSeats: 3,
        },
        {
          delegationAId: delegations[4].id,
          delegationBId: delegations[5].id,
          type: "MUST_ADJACENT",
        },
      ],
    });

    // Generate seating
    const arrangement = await seatingService.createArrangement({
      eventId: event.id,
      tenantId: testContext.tenantId,
      sessionId: session.id,
      layout: "HOLLOW_SQUARE",
      autoAssign: true,
    });

    expect(arrangement.status).toBe("DRAFT");
    expect(arrangement.assignments).toHaveLength(10);

    // Verify conflict rules satisfied
    const violations = await seatingService.validateConstraints(arrangement.id);
    expect(violations).toHaveLength(0);
  });
});
```

#### 9.2.3 Package Assembly Pipeline

```typescript
// file: app/modules/protocol/__tests__/integration/gift-assembly.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { GiftPackageService } from "../../services/gift-package.service";
import { createTestContext, cleanupTestContext } from "~/test-utils/context";
import { createTestEvent, createTestDelegation, createTestGiftItems } from "~/test-utils/factories";

describe("Gift Package Assembly Pipeline", () => {
  let prisma: PrismaClient;
  let packageService: GiftPackageService;
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeEach(async () => {
    testContext = await createTestContext();
    prisma = testContext.prisma;
    packageService = testContext.resolve(GiftPackageService);
  });

  afterEach(async () => {
    await cleanupTestContext(testContext);
  });

  it("should complete assembly pipeline: allocate → assemble → verify → deliver", async () => {
    const event = await createTestEvent(prisma, { tenantId: testContext.tenantId });
    const delegation = await createTestDelegation(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      countryCode: "RW",
    });
    const giftItems = await createTestGiftItems(prisma, {
      eventId: event.id,
      tenantId: testContext.tenantId,
      items: [
        { name: "Welcome Book", category: "LITERATURE", estimatedValue: 20, quantity: 55 },
        { name: "Local Coffee", category: "FOOD", estimatedValue: 15, quantity: 55 },
        { name: "Commemorative Pin", category: "ACCESSORY", estimatedValue: 5, quantity: 55 },
      ],
    });

    // Step 1: Allocate package
    const pkg = await packageService.allocatePackage({
      eventId: event.id,
      tenantId: testContext.tenantId,
      delegationId: delegation.id,
      packageType: "WELCOME",
      itemIds: giftItems.map((gi) => gi.id),
    });

    expect(pkg.status).toBe("ALLOCATED");
    expect(pkg.items).toHaveLength(3);

    // Step 2: Begin assembly
    const assembling = await packageService.beginAssembly({
      packageId: pkg.id,
      assembledBy: testContext.userId,
      stationId: "station-1",
    });

    expect(assembling.status).toBe("ASSEMBLING");

    // Step 3: Complete assembly
    const assembled = await packageService.completeAssembly({
      packageId: pkg.id,
      assembledBy: testContext.userId,
      qualityCheckPassed: true,
    });

    expect(assembled.status).toBe("ASSEMBLED");

    // Step 4: Record delivery
    const delivered = await packageService.recordDelivery({
      packageId: pkg.id,
      deliveredTo: delegation.headOfDelegationName,
      deliveredAt: new Date(),
      deliveredBy: testContext.userId,
      signatureConfirmed: true,
    });

    expect(delivered.status).toBe("DELIVERED");
    expect(delivered.deliverySignature).toBeDefined();

    // Verify inventory decremented
    for (const item of giftItems) {
      const updated = await prisma.giftItem.findUnique({ where: { id: item.id } });
      expect(updated!.quantity).toBe(54); // 55 - 1
    }
  });
});
```

### 9.3 E2E Tests (Playwright)

End-to-end tests verify complete user workflows through the browser, including UI interactions, form submissions, and visual outcomes.

#### 9.3.1 Protocol Ranks → Seating → Nameplates Flow

```typescript
// file: e2e/protocol/seating-complete-flow.spec.ts

import { test, expect } from "@playwright/test";
import { loginAsProtocolOfficer } from "../helpers/auth";
import { seedEventWithDelegations } from "../helpers/seed";

test.describe("Protocol Seating Complete Flow", () => {
  let eventId: string;

  test.beforeAll(async () => {
    const seed = await seedEventWithDelegations({ delegationCount: 10 });
    eventId = seed.eventId;
  });

  test("should create protocol ranks, auto-assign seating, finalize, and print nameplates", async ({
    page,
  }) => {
    await loginAsProtocolOfficer(page);

    // Navigate to Protocol module
    await page.goto(`/events/${eventId}/protocol`);
    await expect(page.getByRole("heading", { name: "Protocol & Diplomacy" })).toBeVisible();

    // Step 1: Verify auto-assigned protocol ranks
    await page.getByRole("link", { name: "Protocol Ranks" }).click();
    await expect(page.getByTestId("rank-table")).toBeVisible();

    const rankRows = page.getByTestId("rank-row");
    await expect(rankRows).toHaveCount(10);

    // Verify ranks are ordered by tier
    const firstRankTier = await rankRows.first().getByTestId("rank-tier").textContent();
    expect(parseInt(firstRankTier!)).toBeLessThanOrEqual(
      parseInt((await rankRows.last().getByTestId("rank-tier").textContent())!),
    );

    // Step 2: Create seating arrangement
    await page.getByRole("link", { name: "Seating" }).click();
    await page.getByRole("button", { name: "Create Arrangement" }).click();

    // Select session and layout
    await page.getByLabel("Session").selectOption({ label: "Plenary Session 1" });
    await page.getByLabel("Layout").selectOption("HOLLOW_SQUARE");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("Seating arrangement created")).toBeVisible();

    // Step 3: Run auto-assign
    await page.getByRole("button", { name: "Auto-Assign Seats" }).click();
    await page.getByRole("button", { name: "Confirm Auto-Assign" }).click();

    // Wait for algorithm to complete
    await expect(page.getByText("All delegations assigned")).toBeVisible({ timeout: 10000 });

    // Verify all seats are filled
    const assignedSeats = page.getByTestId("assigned-seat");
    await expect(assignedSeats).toHaveCount(10);

    // Step 4: Finalize seating
    await page.getByRole("button", { name: "Finalize" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirm Finalize" }).click();

    await expect(page.getByText("Seating finalized")).toBeVisible();
    await expect(page.getByTestId("seating-status")).toHaveText("FINALIZED");

    // Step 5: Generate nameplates
    await page.getByRole("button", { name: "Print Nameplates" }).click();
    await expect(page.getByText("Generating nameplates...")).toBeVisible();
    await expect(page.getByText("Nameplates ready for download")).toBeVisible({ timeout: 15000 });

    // Verify PDF download link exists
    const downloadLink = page.getByRole("link", { name: /Download.*PDF/ });
    await expect(downloadLink).toBeVisible();
  });
});
```

#### 9.3.2 Bilateral Request → Confirm → Schedule → Brief Flow

```typescript
// file: e2e/protocol/bilateral-complete-flow.spec.ts

import { test, expect } from "@playwright/test";
import { loginAsProtocolOfficer, loginAsFocalPoint } from "../helpers/auth";
import { seedEventWithDelegations } from "../helpers/seed";

test.describe("Bilateral Meeting Complete Flow", () => {
  let eventId: string;
  let delegation1Id: string;
  let delegation2Id: string;

  test.beforeAll(async () => {
    const seed = await seedEventWithDelegations({
      delegationCount: 5,
      withBilateralRooms: true,
    });
    eventId = seed.eventId;
    delegation1Id = seed.delegations[0].id;
    delegation2Id = seed.delegations[1].id;
  });

  test("should submit bilateral request, counterpart confirms, auto-schedule, and generate brief", async ({
    browser,
  }) => {
    // Requesting delegation focal point submits request
    const requestPage = await browser.newPage();
    await loginAsFocalPoint(requestPage, delegation1Id);

    await requestPage.goto(`/events/${eventId}/protocol/bilateral`);
    await requestPage.getByRole("button", { name: "New Bilateral Request" }).click();

    // Fill in bilateral request form
    await requestPage.getByLabel("Counterpart Delegation").selectOption(delegation2Id);
    await requestPage.getByLabel("Proposed Date").fill("2025-02-15");
    await requestPage.getByLabel("Preferred Time").first().selectOption("09:00");
    await requestPage.getByLabel("Duration (minutes)").fill("30");
    await requestPage.getByLabel("Topic").fill("Economic cooperation and trade");
    await requestPage.getByRole("button", { name: "Submit Request" }).click();

    await expect(requestPage.getByText("Bilateral request submitted")).toBeVisible();
    await expect(requestPage.getByTestId("bilateral-status")).toHaveText("PENDING_COUNTERPART");

    // Counterpart focal point confirms
    const counterpartPage = await browser.newPage();
    await loginAsFocalPoint(counterpartPage, delegation2Id);

    await counterpartPage.goto(`/events/${eventId}/protocol/bilateral`);
    await expect(counterpartPage.getByText("Incoming Bilateral Requests")).toBeVisible();

    const incomingRequest = counterpartPage.getByTestId("incoming-request").first();
    await expect(incomingRequest).toContainText("Economic cooperation");

    await incomingRequest.getByRole("button", { name: "Accept" }).click();
    await counterpartPage
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm Acceptance" })
      .click();

    await expect(counterpartPage.getByText("Bilateral confirmed")).toBeVisible();

    // Protocol officer verifies scheduling
    const officerPage = await browser.newPage();
    await loginAsProtocolOfficer(officerPage);

    await officerPage.goto(`/events/${eventId}/protocol/bilateral`);
    await officerPage.getByRole("tab", { name: "Scheduled" }).click();

    const scheduledMeeting = officerPage.getByTestId("scheduled-bilateral").first();
    await expect(scheduledMeeting).toBeVisible({ timeout: 15000 });
    await expect(scheduledMeeting).toContainText("Economic cooperation");
    await expect(scheduledMeeting.getByTestId("room-assignment")).not.toBeEmpty();

    // Check that meeting brief was generated
    await scheduledMeeting.getByRole("button", { name: "View Brief" }).click();
    await expect(officerPage.getByTestId("meeting-brief-preview")).toBeVisible();
    await expect(officerPage.getByText("Meeting Brief")).toBeVisible();

    // Cleanup
    await requestPage.close();
    await counterpartPage.close();
    await officerPage.close();
  });
});
```

### 9.4 Performance Tests

Performance tests verify that protocol operations meet response time requirements under realistic load conditions.

#### 9.4.1 Bilateral Scheduling at Scale

```typescript
// file: app/modules/protocol/__tests__/performance/bilateral-scheduling.perf.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { BilateralSchedulerService } from "../../services/bilateral-scheduler.service";
import { createTestContext, cleanupTestContext } from "~/test-utils/context";
import {
  createBulkBilateralRequests,
  createBulkDelegationsWithRanks,
} from "~/test-utils/factories";

describe("Bilateral Scheduling Performance", () => {
  let prisma: PrismaClient;
  let scheduler: BilateralSchedulerService;
  let testContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    testContext = await createTestContext();
    prisma = testContext.prisma;
    scheduler = testContext.resolve(BilateralSchedulerService);
  });

  afterAll(async () => {
    await cleanupTestContext(testContext);
  });

  it("should schedule 200+ bilateral requests within 30 seconds", async () => {
    // Setup: Create 55 delegations and 200 confirmed bilateral requests
    const { eventId, delegations } = await createBulkDelegationsWithRanks(prisma, {
      tenantId: testContext.tenantId,
      count: 55,
    });

    const requests = await createBulkBilateralRequests(prisma, {
      eventId,
      tenantId: testContext.tenantId,
      delegations,
      count: 200,
      status: "CONFIRMED",
    });

    const startTime = performance.now();

    const result = await scheduler.scheduleBatch({
      eventId,
      tenantId: testContext.tenantId,
      bilateralIds: requests.map((r) => r.id),
    });

    const elapsed = performance.now() - startTime;

    console.log(
      `Scheduled ${result.scheduled} of ${requests.length} bilaterals in ${elapsed.toFixed(0)}ms`,
    );
    console.log(`Conflicts: ${result.conflicts}, Unscheduled: ${result.unscheduled}`);

    expect(elapsed).toBeLessThan(30000); // 30 seconds max
    expect(result.scheduled).toBeGreaterThan(180); // At least 90% scheduled
  }, 60000);
});
```

#### 9.4.2 Seating Algorithm at Scale

```typescript
// file: app/modules/protocol/__tests__/performance/seating-algorithm.perf.ts

import { describe, it, expect } from "vitest";
import { SeatingAlgorithm } from "../../services/seating-algorithm.service";

describe("Seating Algorithm Performance", () => {
  it("should seat 55 delegations with 10 conflict rules in under 5 seconds", () => {
    const algorithm = new SeatingAlgorithm();

    // Generate 55 delegations
    const delegations = Array.from({ length: 55 }, (_, i) => ({
      delegationId: `del-${i}`,
      countryCode: `C${String(i).padStart(2, "0")}`,
      rankTier: Math.ceil((i + 1) / 7), // Distribute across 8 tiers
      isHost: i === 0,
    }));

    // Generate 10 conflict rules
    const constraints = [
      { type: "MUST_NOT_ADJACENT" as const, delegationA: "del-1", delegationB: "del-5" },
      { type: "MUST_NOT_ADJACENT" as const, delegationA: "del-10", delegationB: "del-15" },
      { type: "MIN_DISTANCE" as const, delegationA: "del-3", delegationB: "del-20", minSeats: 3 },
      { type: "MIN_DISTANCE" as const, delegationA: "del-8", delegationB: "del-25", minSeats: 2 },
      { type: "MUST_ADJACENT" as const, delegationA: "del-30", delegationB: "del-31" },
      { type: "MUST_ADJACENT" as const, delegationA: "del-40", delegationB: "del-41" },
      { type: "MUST_NOT_ADJACENT" as const, delegationA: "del-12", delegationB: "del-50" },
      { type: "MIN_DISTANCE" as const, delegationA: "del-22", delegationB: "del-35", minSeats: 4 },
      { type: "MUST_NOT_ADJACENT" as const, delegationA: "del-7", delegationB: "del-45" },
      { type: "MUST_ADJACENT" as const, delegationA: "del-48", delegationB: "del-49" },
    ];

    const startTime = performance.now();

    const result = algorithm.generateSeatingPlan({
      layout: "HOLLOW_SQUARE",
      delegations,
      constraints,
      options: { hostCountryFirst: true, rankingSystem: "ALPHABETICAL_EN" },
    });

    const elapsed = performance.now() - startTime;

    console.log(`Seated ${result.assignments.length} delegations in ${elapsed.toFixed(0)}ms`);
    console.log(`Feasible: ${result.feasible}, Violations: ${result.violations.length}`);

    expect(elapsed).toBeLessThan(5000); // 5 seconds max
    expect(result.feasible).toBe(true);
    expect(result.assignments).toHaveLength(55);
    expect(result.violations).toHaveLength(0);
  });
});
```

### 9.5 Test Data Factories

Test data factories use `@faker-js/faker` to generate realistic protocol test data.

```typescript
// file: app/modules/protocol/__tests__/factories/protocol-factories.ts

import { faker } from "@faker-js/faker";
import type { PrismaClient } from "@prisma/client";

// ---------- Protocol Rank Factory ----------

interface CreateProtocolRankOptions {
  participantId?: string;
  eventId: string;
  tenantId: string;
  delegationId?: string;
  tier?: number;
  assignmentMethod?: "AUTO" | "MANUAL";
}

export async function createProtocolRank(prisma: PrismaClient, options: CreateProtocolRankOptions) {
  const tier = options.tier ?? faker.number.int({ min: 1, max: 8 });

  const rankDefinition = await prisma.protocolRankDefinition.findFirst({
    where: { eventId: options.eventId, tenantId: options.tenantId, tier },
  });

  return prisma.protocolRank.create({
    data: {
      participantId: options.participantId ?? faker.string.uuid(),
      eventId: options.eventId,
      tenantId: options.tenantId,
      delegationId: options.delegationId ?? faker.string.uuid(),
      rankDefinitionId: rankDefinition?.id ?? faker.string.uuid(),
      tier,
      assignmentMethod: options.assignmentMethod ?? "AUTO",
      assignedAt: faker.date.recent(),
    },
  });
}

// ---------- Seating Arrangement Factory ----------

interface CreateSeatingArrangementOptions {
  eventId: string;
  tenantId: string;
  sessionId: string;
  layout?: "BOARDROOM" | "HOLLOW_SQUARE" | "U_SHAPE" | "BANQUET" | "THEATER";
  status?: "DRAFT" | "REVIEW" | "FINALIZED" | "ARCHIVED";
  totalSeats?: number;
}

export async function createSeatingArrangement(
  prisma: PrismaClient,
  options: CreateSeatingArrangementOptions,
) {
  const layout =
    options.layout ??
    faker.helpers.arrayElement(["BOARDROOM", "HOLLOW_SQUARE", "U_SHAPE", "BANQUET", "THEATER"]);
  const totalSeats = options.totalSeats ?? faker.number.int({ min: 10, max: 55 });

  return prisma.seatingArrangement.create({
    data: {
      eventId: options.eventId,
      tenantId: options.tenantId,
      sessionId: options.sessionId,
      layout,
      status: options.status ?? "DRAFT",
      totalSeats,
      version: 1,
      createdBy: faker.string.uuid(),
    },
  });
}

// ---------- Bilateral Request Factory ----------

interface CreateBilateralRequestOptions {
  eventId: string;
  tenantId: string;
  requestingDelegationId?: string;
  counterpartDelegationId?: string;
  status?:
    | "PENDING_COUNTERPART"
    | "CONFIRMED"
    | "DECLINED"
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";
  proposedDate?: Date;
}

export async function createBilateralRequest(
  prisma: PrismaClient,
  options: CreateBilateralRequestOptions,
) {
  return prisma.bilateralRequest.create({
    data: {
      eventId: options.eventId,
      tenantId: options.tenantId,
      requestingDelegationId: options.requestingDelegationId ?? faker.string.uuid(),
      counterpartDelegationId: options.counterpartDelegationId ?? faker.string.uuid(),
      status: options.status ?? "PENDING_COUNTERPART",
      proposedDate: options.proposedDate ?? faker.date.soon({ days: 30 }),
      preferredTimeSlots: JSON.stringify([
        {
          start: faker.helpers.arrayElement(["08:00", "09:00", "10:00", "14:00", "15:00"]),
          end: faker.helpers.arrayElement(["08:30", "09:30", "10:30", "14:30", "15:30"]),
        },
      ]),
      topic: faker.lorem.sentence(),
      requestedBy: faker.string.uuid(),
      requestedAt: faker.date.recent(),
    },
  });
}

// ---------- Companion Registration Factory ----------

interface CreateCompanionRegistrationOptions {
  eventId: string;
  tenantId: string;
  delegateParticipantId?: string;
  delegationId?: string;
}

export async function createCompanionRegistration(
  prisma: PrismaClient,
  options: CreateCompanionRegistrationOptions,
) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return prisma.companionProfile.create({
    data: {
      eventId: options.eventId,
      tenantId: options.tenantId,
      delegateParticipantId: options.delegateParticipantId ?? faker.string.uuid(),
      delegationId: options.delegationId ?? faker.string.uuid(),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      relationship: faker.helpers.arrayElement(["SPOUSE", "PARTNER", "AIDE"]),
      email: faker.internet.email({ firstName, lastName }),
      phone: faker.phone.number(),
      dietaryRequirements: faker.helpers.arrayElement([
        "NONE",
        "VEGETARIAN",
        "VEGAN",
        "HALAL",
        "KOSHER",
        "GLUTEN_FREE",
      ]),
      accessibilityNeeds: faker.datatype.boolean(0.1) ? faker.lorem.sentence() : null,
      preferredLanguage: faker.helpers.arrayElement(["en", "fr", "ar", "pt", "es"]),
      programInterests: faker.helpers.arrayElements(
        ["CULTURAL", "SIGHTSEEING", "SHOPPING", "WELLNESS"],
        { min: 1, max: 3 },
      ),
      registeredAt: faker.date.recent(),
    },
  });
}

// ---------- Gift Item Factory ----------

interface CreateGiftItemOptions {
  eventId: string;
  tenantId: string;
  name?: string;
  category?: string;
  estimatedValue?: number;
  quantity?: number;
}

export async function createGiftItem(prisma: PrismaClient, options: CreateGiftItemOptions) {
  return prisma.giftItem.create({
    data: {
      eventId: options.eventId,
      tenantId: options.tenantId,
      name: options.name ?? faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category:
        options.category ??
        faker.helpers.arrayElement([
          "LITERATURE",
          "ART",
          "FOOD",
          "ACCESSORY",
          "TEXTILE",
          "TECHNOLOGY",
        ]),
      estimatedValue:
        options.estimatedValue ?? faker.number.float({ min: 5, max: 200, fractionDigits: 2 }),
      currency: "USD",
      quantity: options.quantity ?? faker.number.int({ min: 10, max: 100 }),
      imageUrl: faker.image.url(),
      supplier: faker.company.name(),
      createdBy: faker.string.uuid(),
    },
  });
}

// ---------- Bulk Factories ----------

export async function createBulkDelegationsWithRanks(
  prisma: PrismaClient,
  options: { tenantId: string; count: number },
) {
  const event = await prisma.event.create({
    data: {
      tenantId: options.tenantId,
      name: faker.company.catchPhrase(),
      startDate: faker.date.soon({ days: 60 }),
      endDate: faker.date.soon({ days: 67 }),
      venueId: faker.string.uuid(),
      status: "ACTIVE",
    },
  });

  const countryCodes = faker.helpers.uniqueArray(
    () => faker.location.countryCode("alpha-2"),
    options.count,
  );

  const delegations = await Promise.all(
    countryCodes.map((code, index) =>
      prisma.delegation.create({
        data: {
          eventId: event.id,
          tenantId: options.tenantId,
          countryCode: code,
          name: `Delegation of ${faker.location.country()}`,
          headOfDelegationName: faker.person.fullName(),
          memberCount: faker.number.int({ min: 2, max: 10 }),
          rankTier: Math.ceil((index + 1) / 7),
        },
      }),
    ),
  );

  return { eventId: event.id, delegations };
}

export async function createBulkBilateralRequests(
  prisma: PrismaClient,
  options: {
    eventId: string;
    tenantId: string;
    delegations: Array<{ id: string }>;
    count: number;
    status: string;
  },
) {
  const requests = [];

  for (let i = 0; i < options.count; i++) {
    const delA = faker.helpers.arrayElement(options.delegations);
    let delB = faker.helpers.arrayElement(options.delegations);
    while (delB.id === delA.id) {
      delB = faker.helpers.arrayElement(options.delegations);
    }

    const request = await createBilateralRequest(prisma, {
      eventId: options.eventId,
      tenantId: options.tenantId,
      requestingDelegationId: delA.id,
      counterpartDelegationId: delB.id,
      status: options.status as any,
    });
    requests.push(request);
  }

  return requests;
}
```

---

## 10. Security Considerations

Diplomatic protocol data is inherently sensitive. Bilateral meeting topics, conflict rules between nations, VIP schedules, and diplomatic incident details require rigorous access control, audit trails, and data classification. This section defines the security posture for Module 12.

### 10.1 Access Control Matrix

Module 12 uses role-based access control (RBAC) integrated with Module 01's authentication and authorization framework. Permissions are scoped per tenant and per event.

| Action                       | Protocol Officer | Chief of Protocol | Focal Point          | Companion Coordinator | Gift Manager | System Admin |
| ---------------------------- | ---------------- | ----------------- | -------------------- | --------------------- | ------------ | ------------ |
| **Protocol Ranks**           |                  |                   |                      |                       |              |              |
| View all protocol ranks      | Yes              | Yes               | Own delegation       | No                    | No           | Yes          |
| Auto-assign protocol ranks   | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Override protocol rank       | No               | Yes               | No                   | No                    | No           | Yes          |
| Configure rank definitions   | No               | Yes               | No                   | No                    | No           | Yes          |
| **Seating**                  |                  |                   |                      |                       |              |              |
| View seating arrangement     | Yes              | Yes               | Own delegation seat  | No                    | No           | Yes          |
| Create seating arrangement   | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Edit draft seating           | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Run auto-assign algorithm    | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Add/edit conflict rules      | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Finalize seating             | No               | Yes               | No                   | No                    | No           | Yes          |
| Revoke finalized seating     | No               | Yes               | No                   | No                    | No           | Yes          |
| Print nameplates             | Yes              | Yes               | No                   | No                    | No           | Yes          |
| **Bilateral Meetings**       |                  |                   |                      |                       |              |              |
| View all bilateral requests  | Yes              | Yes               | Own delegation       | No                    | No           | Yes          |
| Submit bilateral request     | Yes              | Yes               | Yes (own delegation) | No                    | No           | Yes          |
| Respond to bilateral request | Yes              | Yes               | Yes (own delegation) | No                    | No           | Yes          |
| Cancel bilateral request     | Yes              | Yes               | Yes (own delegation) | No                    | No           | Yes          |
| Run auto-scheduler           | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Override schedule            | No               | Yes               | No                   | No                    | No           | Yes          |
| View meeting brief           | Yes              | Yes               | Yes (own delegation) | No                    | No           | Yes          |
| **Companion Program**        |                  |                   |                      |                       |              |              |
| View all companions          | Yes              | Yes               | Own delegation       | Yes                   | No           | Yes          |
| Register companion           | Yes              | Yes               | Yes (own delegation) | Yes                   | No           | Yes          |
| Edit companion profile       | Yes              | Yes               | Yes (own delegation) | Yes                   | No           | Yes          |
| Manage companion programs    | No               | Yes               | No                   | Yes                   | No           | Yes          |
| Assign program itinerary     | No               | Yes               | No                   | Yes                   | No           | Yes          |
| **Gift Protocol**            |                  |                   |                      |                       |              |              |
| View gift inventory          | Yes              | Yes               | No                   | No                    | Yes          | Yes          |
| Add/edit gift items          | No               | Yes               | No                   | No                    | Yes          | Yes          |
| Allocate gift packages       | Yes              | Yes               | No                   | No                    | Yes          | Yes          |
| Operate assembly station     | Yes              | No                | No                   | No                    | Yes          | Yes          |
| Record gift delivery         | Yes              | Yes               | No                   | No                    | Yes          | Yes          |
| View gift compliance report  | No               | Yes               | No                   | No                    | Yes          | Yes          |
| **VIP Movement**             |                  |                   |                      |                       |              |              |
| View VIP movements           | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Update VIP location          | Yes              | Yes               | No                   | No                    | No           | Yes          |
| View movement history        | Yes              | Yes               | No                   | No                    | No           | Yes          |
| **Incidents**                |                  |                   |                      |                       |              |              |
| Report protocol incident     | Yes              | Yes               | Yes                  | No                    | No           | Yes          |
| View all incidents           | Yes              | Yes               | Own delegation       | No                    | No           | Yes          |
| Resolve incident             | Yes              | Yes               | No                   | No                    | No           | Yes          |
| Escalate incident            | No               | Yes               | No                   | No                    | No           | Yes          |

### 10.2 Data Sensitivity Classification

All Module 12 data is classified according to organizational data governance policy. Classification determines encryption requirements, access logging, and retention rules.

| Data Category                    | Classification        | Encryption at Rest                | Access Logging   | Retention        |
| -------------------------------- | --------------------- | --------------------------------- | ---------------- | ---------------- |
| Protocol rank assignments        | INTERNAL              | Standard (AES-256)                | Standard audit   | Event + 5 years  |
| Seating arrangements (draft)     | INTERNAL              | Standard                          | Standard audit   | Event + 1 year   |
| Seating arrangements (finalized) | CONFIDENTIAL          | Enhanced (AES-256 + key rotation) | Enhanced audit   | Event + 5 years  |
| Conflict rules between nations   | CONFIDENTIAL          | Enhanced                          | Enhanced audit   | Event + 10 years |
| Bilateral request topics         | CONFIDENTIAL          | Enhanced                          | Enhanced audit   | Event + 5 years  |
| Bilateral meeting briefs (PDF)   | CONFIDENTIAL          | Enhanced + watermark              | Enhanced audit   | Event + 5 years  |
| Bilateral meeting notes          | RESTRICTED            | Enhanced + field-level encryption | Full audit trail | Event + 10 years |
| Companion personal data          | INTERNAL (PII)        | Standard + PII handling           | Standard audit   | Event + 2 years  |
| Companion dietary/accessibility  | INTERNAL (PII/Health) | Enhanced                          | Standard audit   | Event + 1 year   |
| Gift item inventory              | INTERNAL              | Standard                          | Standard audit   | Event + 3 years  |
| Gift values and costs            | CONFIDENTIAL          | Enhanced                          | Enhanced audit   | Event + 7 years  |
| Gift compliance reports          | CONFIDENTIAL          | Enhanced                          | Enhanced audit   | Event + 7 years  |
| VIP movement data                | RESTRICTED            | Enhanced + TTL-based purge        | Full audit trail | Event + 30 days  |
| VIP schedule details             | CONFIDENTIAL          | Enhanced                          | Enhanced audit   | Event + 1 year   |
| Diplomatic incident details      | RESTRICTED            | Enhanced + field-level encryption | Full audit trail | Event + 10 years |
| Diplomatic incident resolution   | CONFIDENTIAL          | Enhanced                          | Enhanced audit   | Event + 10 years |

### 10.3 Audit Trail Requirements

Module 12 generates audit entries for all state-changing operations. Audit entries are immutable and stored in a separate audit table with tamper-evident checksums.

#### 10.3.1 Audited Operations

| Operation Category  | Specific Actions Audited                                            | Audit Detail Level                         |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| Protocol Rank       | Assign, override, remove                                            | Full: old value, new value, reason, actor  |
| Seating Arrangement | Create, edit assignment, add/remove conflict rule, finalize, revoke | Full: before/after state, actor, timestamp |
| Bilateral Request   | Submit, respond, confirm, decline, cancel, reschedule               | Full: status transition, actor, reason     |
| Bilateral Schedule  | Auto-schedule, manual override, room change                         | Full: schedule details, algorithm output   |
| Companion           | Register, update profile, assign program                            | Standard: changed fields, actor            |
| Gift                | Add item, allocate, assemble, deliver                               | Full: item details, quantities, actor      |
| Gift Compliance     | Threshold trigger, approval request, approval decision              | Full: values, approver, decision           |
| VIP Movement        | Location update, delay alert                                        | Standard: location, timestamp, source      |
| Protocol Incident   | Report, acknowledge, resolve, escalate                              | Full: all fields, actor, timestamps        |

#### 10.3.2 Audit Entry Structure

```typescript
interface ProtocolAuditEntry {
  id: string;
  tenantId: string;
  eventId: string;
  entityType:
    | "PROTOCOL_RANK"
    | "SEATING"
    | "BILATERAL"
    | "COMPANION"
    | "GIFT"
    | "VIP_MOVEMENT"
    | "INCIDENT";
  entityId: string;
  action: string;
  actorId: string;
  actorRole: string;
  timestamp: Date;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    reason?: string;
  };
  checksum: string; // SHA-256 of concatenated fields for tamper detection
}
```

### 10.4 Protocol Data Confidentiality

#### 10.4.1 Bilateral Meeting Topics

Bilateral meeting topics and agendas are diplomatically sensitive. Access controls ensure only authorized parties can view topic details:

- **Requesting delegation** focal point and head of delegation can view the topic
- **Counterpart delegation** focal point and head of delegation can view the topic only after receiving the request
- **Protocol Officers** and **Chief of Protocol** can view all topics for scheduling purposes
- **Other delegations** cannot view bilateral topics between other parties
- Topics are encrypted at rest with per-event encryption keys
- API responses for bilateral listings for non-party users redact the `topic` field

#### 10.4.2 Diplomatic Incident Details

Incident details are the most sensitive data in Module 12:

- Field-level encryption for `description`, `resolutionNotes`, and `involvedDelegations`
- Access restricted to Chief of Protocol and System Admin by default
- Protocol Officers can view incidents they reported or are assigned to resolve
- Focal Points can view incidents involving their own delegation (with redacted details of other delegations)
- All incident detail views generate enhanced audit entries
- Incident data is excluded from general reporting queries; a dedicated compliance report requires Chief of Protocol authorization

#### 10.4.3 Conflict Rules Between Nations

Seating conflict rules reveal sensitive diplomatic relationships:

- Conflict rules are visible only to Protocol Officers and Chief of Protocol
- The seating arrangement view shows the effect of conflict rules (seat placements) but not the rules themselves to non-protocol users
- Conflict rule CRUD operations require explicit `protocol.conflict.manage` permission
- Rule descriptions should use neutral language (e.g., "minimum separation" rather than "hostile relations")

### 10.5 PDF Document Security

Meeting briefs and protocol documents generated as PDFs contain sensitive scheduling and diplomatic data. Security measures include:

| Security Measure      | Implementation                                                              | Applies To                       |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------- |
| Watermarking          | Dynamic watermark with event name, classification, and generation timestamp | All protocol PDFs                |
| Access control        | Azure Blob SAS tokens with time-limited access (1 hour expiry)              | All protocol PDFs                |
| Encryption at rest    | Azure Storage Service Encryption (SSE) with customer-managed keys           | All protocol PDFs                |
| Download logging      | Every PDF download generates an audit entry with user, timestamp, and IP    | All protocol PDFs                |
| Metadata stripping    | PDF metadata (author, creation tool) stripped before distribution           | Meeting briefs                   |
| Version tracking      | Each PDF version is stored separately; old versions are not deleted         | Seating charts, meeting briefs   |
| Classification header | PDF header displays sensitivity classification in red                       | CONFIDENTIAL and RESTRICTED docs |
| Print restriction     | PDF permissions set to prevent printing for RESTRICTED documents            | Diplomatic incident reports      |

---

## 11. Performance Requirements

Module 12 must deliver responsive performance for real-time protocol operations during live events. Seating operations, bilateral scheduling, and VIP tracking are time-sensitive and must meet strict SLA targets.

### 11.1 Response Time Targets

| Operation                                      | Target (P50) | Target (P95) | Target (P99) | Max Acceptable |
| ---------------------------------------------- | ------------ | ------------ | ------------ | -------------- |
| Load protocol dashboard                        | 200ms        | 400ms        | 600ms        | 1000ms         |
| View protocol rank list (55 delegations)       | 100ms        | 200ms        | 350ms        | 500ms          |
| Assign protocol rank (single)                  | 150ms        | 300ms        | 500ms        | 800ms          |
| Load seating arrangement (visual)              | 300ms        | 500ms        | 800ms        | 1200ms         |
| Drag-and-drop seat reassignment                | 50ms         | 100ms        | 200ms        | 300ms          |
| Auto-assign seating (55 delegations, 10 rules) | 1500ms       | 3000ms       | 5000ms       | 8000ms         |
| Finalize seating arrangement                   | 500ms        | 800ms        | 1200ms       | 2000ms         |
| Load bilateral request list                    | 150ms        | 300ms        | 500ms        | 800ms          |
| Submit bilateral request                       | 200ms        | 400ms        | 600ms        | 1000ms         |
| Auto-schedule single bilateral                 | 300ms        | 500ms        | 800ms        | 1500ms         |
| Auto-schedule batch (200 requests)             | 10000ms      | 20000ms      | 30000ms      | 45000ms        |
| Generate meeting brief PDF                     | 1500ms       | 3000ms       | 5000ms       | 8000ms         |
| Load companion list                            | 100ms        | 200ms        | 350ms        | 500ms          |
| Register companion                             | 200ms        | 400ms        | 600ms        | 1000ms         |
| Load gift inventory                            | 150ms        | 300ms        | 500ms        | 800ms          |
| Allocate gift package                          | 200ms        | 400ms        | 600ms        | 1000ms         |
| Record gift delivery                           | 150ms        | 300ms        | 500ms        | 800ms          |
| VIP movement update (single)                   | 50ms         | 100ms        | 200ms        | 300ms          |
| VIP movement SSE event delivery                | 100ms        | 200ms        | 400ms        | 600ms          |
| Report protocol incident                       | 200ms        | 400ms        | 600ms        | 1000ms         |
| Load protocol reports                          | 500ms        | 1000ms       | 2000ms       | 3000ms         |

### 11.2 Throughput Targets

| Scenario                                               | Target                       | Conditions                                    |
| ------------------------------------------------------ | ---------------------------- | --------------------------------------------- |
| Auto-seating for 55 delegations with 10 conflict rules | < 5 seconds                  | Single event, HOLLOW_SQUARE layout            |
| Auto-seating for 55 delegations with 25 conflict rules | < 10 seconds                 | Includes backtracking for complex constraints |
| Bilateral scheduling for 200 confirmed requests        | < 30 seconds                 | 55 delegations, 5 rooms, 3-day event          |
| Bilateral scheduling for 500 confirmed requests        | < 90 seconds                 | Large summit, 10 rooms, 5-day event           |
| Concurrent bilateral request submissions               | 50 requests/second           | Peak submission period                        |
| VIP movement updates                                   | 100 updates/second           | All VIP delegations reporting simultaneously  |
| Gift package assembly throughput                       | 20 packages/hour per station | 3 concurrent assembly stations                |
| PDF generation throughput                              | 10 documents/minute          | Concurrent meeting brief generation           |
| SSE event broadcast to command center                  | < 200ms latency              | 50 concurrent command center connections      |

### 11.3 Optimization Strategies

#### 11.3.1 Seating Algorithm Optimization

The seating algorithm operates on an O(n^2) constraint satisfaction problem. Mitigation strategies:

- **Greedy placement with backtracking**: Place delegations in rank order; backtrack only when constraints are violated. This avoids full combinatorial search for most configurations.
- **Constraint pre-processing**: Before running the algorithm, classify constraints by type. MUST_ADJACENT constraints are processed first (they reduce degrees of freedom the most), followed by MUST_NOT_ADJACENT and MIN_DISTANCE.
- **Spatial indexing**: For large layouts, maintain a spatial index of seat positions to enable O(1) adjacency checks instead of O(n) scans.
- **Early termination**: If the algorithm detects an infeasible constraint set (e.g., contradictory rules), terminate immediately and return a diagnostic report.
- **Result caching**: Cache seating results for the same delegation set and constraint combination. Invalidate on any change to delegations, ranks, or conflict rules.

#### 11.3.2 Conflict Rule Caching

Conflict rules change infrequently but are queried on every seating operation:

```typescript
// Redis-based conflict rule cache
const CONFLICT_RULE_CACHE_KEY = (eventId: string) => `protocol:conflict-rules:${eventId}`;
const CONFLICT_RULE_CACHE_TTL = 600; // 10 minutes

async function getConflictRules(eventId: string): Promise<ConflictRule[]> {
  const cached = await redis.get(CONFLICT_RULE_CACHE_KEY(eventId));
  if (cached) return JSON.parse(cached);

  const rules = await prisma.seatingConflictRule.findMany({
    where: { eventId, isActive: true },
  });

  await redis.setex(
    CONFLICT_RULE_CACHE_KEY(eventId),
    CONFLICT_RULE_CACHE_TTL,
    JSON.stringify(rules),
  );

  return rules;
}

// Invalidate on rule change
async function invalidateConflictRuleCache(eventId: string): Promise<void> {
  await redis.del(CONFLICT_RULE_CACHE_KEY(eventId));
}
```

#### 11.3.3 PDF Generation Connection Pooling

PDF generation is I/O intensive. Use a connection pool to limit concurrent PDF operations:

```typescript
import PQueue from "p-queue";

const pdfGenerationQueue = new PQueue({
  concurrency: parseInt(process.env.PROTOCOL_PDF_MAX_CONCURRENT ?? "5"),
  timeout: parseInt(process.env.PROTOCOL_PDF_GENERATION_TIMEOUT_MS ?? "30000"),
});

async function generateMeetingBrief(data: MeetingBriefData): Promise<string> {
  return pdfGenerationQueue.add(async () => {
    const pdf = await renderPdfTemplate("bilateral-brief", data);
    const blobUrl = await uploadToAzureBlob(pdf, `briefs/${data.bilateralId}.pdf`);
    return blobUrl;
  });
}
```

#### 11.3.4 Bilateral Scheduler Optimization

The bilateral scheduler uses a priority queue with constraint-based time slot matching:

- **Priority queue**: Sort pending bilaterals by priority score (rank-weighted). Schedule highest-priority meetings first to give them best time slot selection.
- **Time slot bitmap**: Represent each delegation's schedule as a bitmap (1 bit per 15-minute slot). Overlap detection becomes a bitwise AND operation — O(1) per check.
- **Room availability index**: Maintain an in-memory index of room availability per time slot. Updated as each bilateral is scheduled.
- **Parallel constraint checking**: Check interpreter availability and transport feasibility in parallel with room assignment.

### 11.4 Scalability Considerations

#### 11.4.1 Multi-Event Concurrent Protocol Management

The system must support multiple events running concurrently across different tenants:

- All protocol data is scoped by `tenantId` and `eventId` — no cross-event leakage
- Redis cache keys include both tenant and event identifiers
- PDF generation queue is shared across events but respects per-event concurrency limits
- SSE connections for VIP tracking are scoped per event
- Background scheduling jobs are partitioned by event to prevent one large event from blocking others

#### 11.4.2 Large Delegation Counts

For summit-level events with 55+ delegations:

- Seating algorithm is tested up to 100 delegations with 50 conflict rules
- Bilateral scheduling is tested up to 500 concurrent requests across 55 delegations
- UI virtualization for delegation lists (React `react-window`) to handle large datasets without DOM bloat
- Server-side pagination for bilateral request lists, gift inventory, and companion lists
- Database indexes on `(eventId, tenantId, status)` composite keys for all protocol tables

#### 11.4.3 Database Query Optimization

Key indexes for Module 12 performance:

```sql
-- Protocol ranks
CREATE INDEX idx_protocol_rank_event_tenant ON protocol_rank (event_id, tenant_id);
CREATE INDEX idx_protocol_rank_participant ON protocol_rank (participant_id, event_id);
CREATE INDEX idx_protocol_rank_tier ON protocol_rank (event_id, tier);

-- Seating
CREATE INDEX idx_seating_arrangement_event ON seating_arrangement (event_id, tenant_id, status);
CREATE INDEX idx_seating_assignment_arrangement ON seating_assignment (arrangement_id, seat_position);
CREATE INDEX idx_seating_conflict_rule_event ON seating_conflict_rule (event_id, is_active);

-- Bilateral
CREATE INDEX idx_bilateral_request_event_status ON bilateral_request (event_id, tenant_id, status);
CREATE INDEX idx_bilateral_request_delegations ON bilateral_request (requesting_delegation_id, counterpart_delegation_id);
CREATE INDEX idx_bilateral_schedule_date ON bilateral_request (proposed_date, status) WHERE status IN ('CONFIRMED', 'SCHEDULED');

-- Companion
CREATE INDEX idx_companion_profile_event ON companion_profile (event_id, tenant_id);
CREATE INDEX idx_companion_profile_delegate ON companion_profile (delegate_participant_id);

-- Gift
CREATE INDEX idx_gift_item_event ON gift_item (event_id, tenant_id);
CREATE INDEX idx_gift_package_event_status ON gift_package (event_id, tenant_id, status);
CREATE INDEX idx_gift_package_delegation ON gift_package (delegation_id, package_type);

-- VIP Movement
CREATE INDEX idx_vip_movement_event_participant ON vip_movement (event_id, participant_id, timestamp DESC);

-- Audit
CREATE INDEX idx_protocol_audit_entity ON protocol_audit (entity_type, entity_id);
CREATE INDEX idx_protocol_audit_event_time ON protocol_audit (event_id, timestamp DESC);
CREATE INDEX idx_protocol_audit_actor ON protocol_audit (actor_id, timestamp DESC);
```

---

## 12. Open Questions & Decisions

### 12.1 ADR Log

Architectural Decision Records for Module 12 are tracked below. Each ADR documents a significant technical or design decision, the options considered, and the rationale for the chosen approach.

#### ADR-012-001: Constraint Satisfaction vs Greedy Algorithm for Seating

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | ACCEPTED                                                                                                                                                                                                                                                                                                                                                                                |
| **Date**         | 2025-01-15                                                                                                                                                                                                                                                                                                                                                                              |
| **Context**      | The seating algorithm must place 55+ delegations into a layout while respecting conflict rules (MUST_ADJACENT, MUST_NOT_ADJACENT, MIN_DISTANCE). Two algorithmic approaches were considered.                                                                                                                                                                                            |
| **Option A**     | **Full constraint satisfaction (CSP)** using backtracking with arc consistency. Guarantees optimal solution if one exists. Complexity: O(d^n) worst case where d = domain size, n = variables.                                                                                                                                                                                          |
| **Option B**     | **Greedy placement with limited backtracking**. Place delegations in rank order, greedily choosing best available seat. Backtrack up to k steps (configurable) on constraint violation. Complexity: O(n^2 \* k) average case.                                                                                                                                                           |
| **Decision**     | **Option B — Greedy with limited backtracking**. Full CSP is computationally expensive for 55+ delegations and unnecessary given that most AU/ECOWAS events have fewer than 15 conflict rules. The greedy approach solves 95%+ of real-world cases and provides predictable performance. A constraint violation report is generated when the algorithm cannot find a feasible solution. |
| **Consequences** | The algorithm may not find a solution even when one exists (incomplete search). Protocol officers can manually resolve remaining conflicts. Future enhancement: add optional CSP fallback for complex constraint sets.                                                                                                                                                                  |

#### ADR-012-002: Real-Time vs Batch Bilateral Scheduling

| Field            | Value                                                                                                                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | ACCEPTED                                                                                                                                                                                                                                                          |
| **Date**         | 2025-01-20                                                                                                                                                                                                                                                        |
| **Context**      | Bilateral scheduling can operate in two modes: scheduling each bilateral immediately upon confirmation (real-time) or collecting confirmed requests and scheduling them in batch to optimize room utilization.                                                    |
| **Option A**     | **Real-time scheduling**: Each confirmed bilateral is immediately placed in the first available slot. Simple, immediate feedback. May result in suboptimal room utilization as later high-priority requests may not find preferred slots.                         |
| **Option B**     | **Batch scheduling**: Collect confirmed requests over a configurable window (e.g., 4 hours), then run batch optimization to maximize room utilization and priority-weighted satisfaction. Better global optimization but delayed feedback.                        |
| **Option C**     | **Hybrid**: Real-time scheduling for high-priority (tier 1-2) bilaterals; batch scheduling for all others. Combines immediacy for VIP meetings with optimization for the bulk.                                                                                    |
| **Decision**     | **Option C — Hybrid approach**. Head-of-state bilaterals (tier 1-2) are scheduled immediately upon confirmation to provide instant feedback for the most time-sensitive meetings. All other bilaterals are collected and scheduled in configurable batch windows. |
| **Consequences** | Increased complexity in the scheduler (two code paths). High-priority bilaterals may consume preferred slots before batch optimization runs. Batch window is configurable via `protocol.bilateral.batchWindowMinutes` setting.                                    |

#### ADR-012-003: Gift Value Threshold — Per-Item vs Cumulative

| Field            | Value                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**       | ACCEPTED                                                                                                                                                                                                                                         |
| **Date**         | 2025-02-01                                                                                                                                                                                                                                       |
| **Context**      | Gift compliance tracking requires a threshold above which enhanced tracking or approval is required. The threshold can be applied per individual gift item or cumulatively per delegation (total gift value across all items).                   |
| **Option A**     | **Per-item threshold**: Each gift item is independently evaluated. Simple to implement. A delegation could receive many items just below the threshold, exceeding the spirit of the limit.                                                       |
| **Option B**     | **Cumulative per-delegation threshold**: Total gift value across all items for a delegation is tracked. Better compliance coverage but requires running total calculation on each allocation.                                                    |
| **Option C**     | **Configurable**: Make the threshold mode a system setting so each tenant can choose the approach that matches their compliance framework.                                                                                                       |
| **Decision**     | **Option C — Configurable**. The `protocol.gift.thresholdMode` setting accepts `PER_ITEM` or `CUMULATIVE_PER_DELEGATION`. Default is `PER_ITEM` for simplicity. Organizations with strict compliance requirements can switch to cumulative mode. |
| **Consequences** | Both modes must be implemented and tested. Gift allocation UI must clearly display which mode is active and show running totals when in cumulative mode.                                                                                         |

#### ADR-012-004: VIP Movement Tracking Granularity

| Field            | Value                                                                                                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | PROPOSED                                                                                                                                                                                                                                                                                           |
| **Date**         | 2025-02-05                                                                                                                                                                                                                                                                                         |
| **Context**      | VIP movement tracking can operate at different granularity levels: venue-level (VIP is at Venue X), room-level (VIP is in Room Y at Venue X), or GPS-level (VIP is at coordinates). Higher granularity provides better operational awareness but raises privacy concerns and technical complexity. |
| **Option A**     | **Venue-level tracking**: VIP location reported as venue (e.g., "Conference Center", "Hotel Alpha"). Simple, low-privacy-risk. Sufficient for transport coordination.                                                                                                                              |
| **Option B**     | **Room-level tracking**: VIP location reported as specific room within a venue. Better for security coordination and bilateral meeting confirmation. Requires integration with venue room management.                                                                                              |
| **Option C**     | **GPS-level tracking**: Real-time GPS coordinates. Maximum operational awareness. Significant privacy implications. Requires mobile app or tracking device integration.                                                                                                                            |
| **Decision**     | **PENDING** — Leaning toward Option B (room-level). GPS tracking raises significant privacy concerns and is likely disproportionate for conference management. Room-level provides sufficient granularity for all identified use cases. Awaiting security team review.                             |
| **Consequences** | Room-level tracking requires venue floor plan integration. Movement updates are manual (security team reports) or semi-automated (badge scan at room entry).                                                                                                                                       |

### 12.2 Open Questions

| #          | Question                                                                                                                                                                                                                                                      | Priority | Raised By         | Date       | Status        | Notes                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------- | ---------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-012-001 | How should protocol rank be determined for delegations led by a charge d'affaires rather than a full ambassador? Is there a standard AU protocol for this?                                                                                                    | HIGH     | Protocol Team     | 2025-01-18 | OPEN          | Affects rank auto-assignment logic. Current workaround: manual override by Chief of Protocol.                                                                   |
| OQ-012-002 | Should the seating algorithm support L-shaped and circular table layouts in addition to the five standard layouts? Some specialized AU meetings use non-standard configurations.                                                                              | MEDIUM   | Event Operations  | 2025-01-22 | OPEN          | Current layouts cover 90%+ of events. L-shaped could be implemented as a CUSTOM layout with manual placement.                                                   |
| OQ-012-003 | What are the specific cultural sensitivity rules that the engine should enforce? Is there a published reference for diplomatic gift restrictions by country/region?                                                                                           | HIGH     | Protocol Team     | 2025-02-01 | INVESTIGATING | Research phase. Consulting with AU Protocol Division for a maintained reference. May need to be a manually maintained lookup table rather than automated rules. |
| OQ-012-004 | How should bilateral meeting requests be handled when one delegation's head of state departs early? Should existing confirmed bilaterals be automatically downgraded to ministerial level or cancelled?                                                       | MEDIUM   | Protocol Team     | 2025-02-03 | OPEN          | Affects bilateral status management and notification flows. Current expectation: manual handling by Protocol Officer.                                           |
| OQ-012-005 | What gift compliance regulations apply to AU-organized events? Are there value limits imposed by the AU or by individual member state laws? Should the system support different compliance thresholds per delegation based on their home country regulations? | HIGH     | Legal/Compliance  | 2025-02-05 | OPEN          | Per-delegation thresholds would require a country-specific compliance configuration layer. Significant scope increase.                                          |
| OQ-012-006 | Should the companion program module support group activities (e.g., 20 companions on a single bus tour) or only individual itineraries? Group activities have logistics implications for Module 11 (group transport, group catering).                         | LOW      | Companion Program | 2025-02-07 | OPEN          | Initial implementation supports individual itineraries. Group activity support would be a Phase 2 enhancement.                                                  |
| OQ-012-007 | How should the system handle protocol rank for observer organizations (AU organs, RECs, UN agencies) that are not member state delegations? They participate in sessions but have different precedence rules.                                                 | MEDIUM   | Protocol Team     | 2025-02-08 | OPEN          | Current data model supports observer participant type but rank assignment rules are undefined for non-state entities.                                           |
| OQ-012-008 | What is the data retention policy for VIP movement tracking data? Real-time movement data has significant privacy implications. Should movement history be purged after the event or retained for security audit purposes?                                    | HIGH     | Security/Privacy  | 2025-02-10 | OPEN          | Current proposal: 30-day retention post-event with automatic purge. Awaiting legal review.                                                                      |

---

## Appendix

### A. Glossary

| Term                         | Definition                                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bilateral Meeting**        | A formal meeting between two delegations, scheduled through protocol channels. Distinguished from informal encounters by having an agreed agenda, assigned room, and optional interpreter.                     |
| **Chief of Protocol**        | The senior official responsible for all protocol arrangements at an event. Has final authority on rank overrides, seating finalization, and incident escalation.                                               |
| **Companion**                | A spouse, partner, or designated aide who accompanies a delegate to an event. Companions have separate registration, badge, accommodation, and program tracks.                                                 |
| **Companion Program**        | A structured program of activities (cultural tours, sightseeing, wellness) organized for companions while delegates attend formal sessions.                                                                    |
| **Conflict Rule**            | A constraint applied to seating arrangements that defines required separation or proximity between specific delegations. Types: MUST_ADJACENT, MUST_NOT_ADJACENT, MIN_DISTANCE, FIXED_POSITION.                |
| **Counterpart**              | The other delegation in a bilateral meeting request. The requesting delegation proposes; the counterpart accepts, declines, or suggests alternatives.                                                          |
| **Delegation**               | A group of participants representing a single member state, observer organization, or institution at an event. Led by a head of delegation.                                                                    |
| **Focal Point**              | The designated contact person within a delegation who manages bilateral requests, companion registrations, and protocol communications.                                                                        |
| **Gift Package**             | A curated collection of gift items assembled for a specific delegation. Package types: WELCOME (arrival), DEPARTURE (farewell), COMMEMORATIVE (special occasion), BILATERAL (meeting gift).                    |
| **Gift Protocol**            | The set of rules and procedures governing the selection, allocation, assembly, tracking, and delivery of gifts to delegations. Includes value thresholds, cultural sensitivity rules, and compliance tracking. |
| **Head of Delegation**       | The highest-ranking member of a delegation. Protocol rank is determined primarily by the head of delegation's title and seniority.                                                                             |
| **Nameplate**                | A physical or printed card displaying a delegation's country name (and optionally the representative's name and title) placed at their assigned seat.                                                          |
| **Precedence**               | The order of priority or rank among delegations, determining seating position, speaking order, and other protocol privileges. Based on the ranking system (alphabetical, seniority, custom).                   |
| **Protocol Incident**        | Any event that disrupts or violates diplomatic protocol norms. Ranges from seating disputes to flag protocol violations to diplomatic complaints. Tracked with severity, category, and resolution status.      |
| **Protocol Officer**         | A staff member responsible for managing day-to-day protocol operations: seating arrangements, bilateral scheduling, gift management, and companion coordination.                                               |
| **Protocol Rank**            | The assigned precedence position of a participant/delegation within an event. Determined by participant type, ranking system, and optional manual override.                                                    |
| **Protocol Rank Definition** | A template defining the characteristics of a rank tier (name, tier number, associated participant types, privileges). Configured per event.                                                                    |
| **Protocol Template**        | A pre-configured set of protocol settings that can be imported when creating a new event. Includes ranking system, seating defaults, bilateral windows, and gift configuration.                                |
| **Ranking System**           | The method used to determine delegation precedence. Four systems: ALPHABETICAL_EN (English alphabetical), ALPHABETICAL_FR (French alphabetical), SENIORITY (date of accession), CUSTOM (manual assignment).    |
| **Seating Arrangement**      | A complete mapping of delegations to seat positions for a specific session. Has a lifecycle: DRAFT -> REVIEW -> FINALIZED -> ARCHIVED.                                                                         |
| **Seating Layout**           | The physical configuration of seats in a session room. Standard types: BOARDROOM, HOLLOW_SQUARE, U_SHAPE, BANQUET, THEATER.                                                                                    |
| **VIP Movement**             | The tracked location and transit status of high-ranking delegates (typically tier 1-3) during an event. Used for security coordination and schedule management.                                                |

### B. Protocol Precedence Reference

Protocol precedence determines the order in which delegations are seated, addressed, and served at formal events. The system supports four ranking systems:

#### B.1 Alphabetical — English (ALPHABETICAL_EN)

The default system for most AU events. Delegations are ordered alphabetically by their English country name.

**Example ordering for an AU Summit:**

| Position | Country                                                     | Country Code |
| -------- | ----------------------------------------------------------- | ------------ |
| 1        | (Host Country — always first when `hostCountryFirst: true`) | —            |
| 2        | Algeria                                                     | DZ           |
| 3        | Angola                                                      | AO           |
| 4        | Benin                                                       | BJ           |
| 5        | Botswana                                                    | BW           |
| 6        | Burkina Faso                                                | BF           |
| ...      | ...                                                         | ...          |
| 54       | Zambia                                                      | ZM           |
| 55       | Zimbabwe                                                    | ZW           |

Within each rank tier, delegations are sorted alphabetically. Higher rank tiers take priority:

- Tier 1 (Heads of State) — all alphabetical among themselves, seated first
- Tier 2 (Deputy Heads of State) — alphabetical, seated after Tier 1
- etc.

#### B.2 Alphabetical — French (ALPHABETICAL_FR)

Used when French is the working language of the event. Delegations are ordered by their French country name.

**Key differences from English ordering:**

- Afrique du Sud (South Africa) appears near the beginning instead of "S"
- Cote d'Ivoire appears under "C" instead of its English position
- Egypte instead of Egypt
- Guinee equatoriale instead of Equatorial Guinea
- Republique centrafricaine instead of Central African Republic

#### B.3 Seniority (SENIORITY)

Delegations are ordered by the date their head of state or government assumed office. Longer-serving leaders are seated first within each rank tier.

**Example:**

| Position | Country           | Head of State      | In Office Since |
| -------- | ----------------- | ------------------ | --------------- |
| 1        | (Host Country)    | —                  | —               |
| 2        | Equatorial Guinea | President Obiang   | 1979            |
| 3        | Uganda            | President Museveni | 1986            |
| 4        | Eritrea           | President Afwerki  | 1993            |
| ...      | ...               | ...                | ...             |

**Note:** This system requires accurate accession date data in the participant profile. When dates are unavailable, the system falls back to alphabetical ordering.

#### B.4 Custom (CUSTOM)

Fully manual ordering defined by the Chief of Protocol. Each delegation is assigned an explicit position number. Used for events with special protocol requirements (rotating chairpersonships, regional groupings, etc.).

### C. Seating Layout Templates

Visual representations of each standard seating layout type. These templates define seat positions and numbering conventions used by the seating algorithm.

#### C.1 BOARDROOM Layout

```
Standard boardroom: two parallel sides facing each other.
Seats numbered left-to-right, starting with the head position.

         [Head/Chair Position]
    ┌─────────────────────────────┐
    │  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
    │  │ 2 │ │ 4 │ │ 6 │ │ 8 │  │   ← Side A
    │  └───┘ └───┘ └───┘ └───┘  │
    │           TABLE             │
    │  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
    │  │ 3 │ │ 5 │ │ 7 │ │ 9 │  │   ← Side B
    │  └───┘ └───┘ └───┘ └───┘  │
    └─────────────────────────────┘

Position 1 = Chair/Host (head of table)
Even positions = Side A (left of chair)
Odd positions = Side B (right of chair, facing Side A)
Alternating sides ensures highest-ranked delegations are closest to the chair.
```

#### C.2 HOLLOW_SQUARE Layout

```
Hollow square: four sides with an open center. Standard for AU summit plenaries.
Chair position at the top center. Numbering flows clockwise.

              ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
              │ 2 │ │ 3 │ │ 1 │ │ 4 │ │ 5 │   ← Top Side (Chair in center)
              └───┘ └───┘ └─┬─┘ └───┘ └───┘
    ┌───┐                   │                   ┌───┐
    │14 │                   │                   │ 6 │
    └───┘                   │                   └───┘
    ┌───┐        (Open      │      Center)      ┌───┐
    │13 │                   │                   │ 7 │   ← Right Side
    └───┘                   │                   └───┘
    ┌───┐                   │                   ┌───┐
    │12 │                   │                   │ 8 │
    └───┘                   │                   └───┘
              ┌───┐ ┌───┐  │  ┌───┐ ┌───┐
              │11 │ │10 │  │  │ 9 │ │ . │      ← Bottom Side
              └───┘ └───┘  │  └───┘ └───┘

← Left Side

Position 1 = Chair (top center)
Positions 2-5 = Top side, alternating left-right from chair
Positions 6-8 = Right side, top to bottom
Positions 9-11 = Bottom side, right to left
Positions 12-14 = Left side, bottom to top
```

#### C.3 U_SHAPE Layout

```
U-shape: three sides with one open end. Used for ministerial meetings.
Chair at the closed end. Numbering flows from chair outward.

              ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
              │ 2 │ │ 3 │ │ 1 │ │ 4 │ │ 5 │   ← Head (closed end)
              └───┘ └───┘ └───┘ └───┘ └───┘
    ┌───┐                                       ┌───┐
    │12 │                                       │ 6 │
    └───┘                                       └───┘
    ┌───┐                                       ┌───┐
    │11 │              (Open End)               │ 7 │
    └───┘                                       └───┘
    ┌───┐                                       ┌───┐
    │10 │                                       │ 8 │
    └───┘                                       └───┘
    ┌───┐                                       ┌───┐
    │ 9 │                                       │ . │
    └───┘                                       └───┘

    ← Left Arm                     Right Arm →

Position 1 = Chair (head center)
Positions 2, 3 = Head left; 4, 5 = Head right
Positions 6-8 = Right arm (top to bottom)
Positions 9-12 = Left arm (bottom to top)
Open end faces the audience/gallery.
```

#### C.4 BANQUET Layout

```
Banquet: multiple round tables. Used for formal dinners and gala events.
Each table has a host position (seat 1) and seats numbered clockwise.

    Table 1 (Head Table)         Table 2                Table 3
    ┌─────────────────┐     ┌─────────────────┐    ┌─────────────────┐
    │    ┌───┐        │     │    ┌───┐        │    │    ┌───┐        │
    │ ┌──┤ 1 ├──┐     │     │ ┌──┤ 1 ├──┐     │    │ ┌──┤ 1 ├──┐     │
    │ │  └───┘  │     │     │ │  └───┘  │     │    │ │  └───┘  │     │
    │┌┴┐      ┌┴┐    │     │┌┴┐      ┌┴┐    │    │┌┴┐      ┌┴┐    │
    ││8│      │2│    │     ││8│      │2│    │    ││8│      │2│    │
    │└┬┘      └┬┘    │     │└┬┘      └┬┘    │    │└┬┘      └┬┘    │
    │┌┴┐      ┌┴┐    │     │┌┴┐      ┌┴┐    │    │┌┴┐      ┌┴┐    │
    ││7│  ●   │3│    │     ││7│  ●   │3│    │    ││7│  ●   │3│    │
    │└┬┘      └┬┘    │     │└┬┘      └┬┘    │    │└┬┘      └┬┘    │
    │┌┴┐      ┌┴┐    │     │┌┴┐      ┌┴┐    │    │┌┴┐      ┌┴┐    │
    ││6│      │4│    │     ││6│      │4│    │    ││6│      │4│    │
    │└┬┘      └┬┘    │     │└┬┘      └┬┘    │    │└┬┘      └┬┘    │
    │ └──┌───┐─┘     │     │ └──┌───┐─┘     │    │ └──┌───┐─┘     │
    │    │ 5 │        │     │    │ 5 │        │    │    │ 5 │        │
    │    └───┘        │     │    └───┘        │    │    └───┘        │
    └─────────────────┘     └─────────────────┘    └─────────────────┘

Table assignment is by protocol rank:
- Table 1: Highest-ranked delegations
- Seat 1 on each table: Highest rank at that table
- Remaining seats alternate left-right from seat 1
```

#### C.5 THEATER Layout

```
Theater: rows facing a stage/podium. Used for large plenary sessions with speaking order.
No table — seats only. Front rows reserved for highest-ranked delegations.

                    ┌──────────────┐
                    │   PODIUM /   │
                    │    STAGE     │
                    └──────────────┘

    Row 1:  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
    (VIP)   │1 │ │2 │ │3 │ │4 │ │5 │ │6 │ │7 │ │8 │ │9 │ │10│
            └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘

    Row 2:  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
            │11│ │12│ │13│ │14│ │15│ │16│ │17│ │18│ │19│ │20│
            └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘

    Row 3:  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
            │21│ │22│ │23│ │24│ │25│ │26│ │27│ │28│ │29│ │30│
            └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘

    ...additional rows as needed...

Numbering: Left-to-right within each row, front to back.
Row 1 center seats (5, 6) are highest priority.
Seat assignment spirals outward from center: 5→6→4→7→3→8→2→9→1→10
```

### D. Bilateral Status State Diagram

The following ASCII state machine shows all valid `BilateralStatus` transitions:

```
                                    ┌──────────────────────┐
                                    │                      │
                                    ▼                      │
┌──────────┐   submit    ┌─────────────────────┐           │
│          │────────────▶│ PENDING_COUNTERPART  │           │
│  (new)   │             │                     │           │
└──────────┘             └────────┬──────┬─────┘           │
                                  │      │                 │
                          accept  │      │ decline         │
                                  │      │                 │
                                  ▼      ▼                 │
                         ┌──────────┐  ┌──────────┐        │
                         │CONFIRMED │  │ DECLINED │        │
                         │          │  │          │        │
                         └────┬─────┘  └──────────┘        │
                              │                            │
                    auto/     │                            │
                    manual    │                            │
                    schedule  │                            │
                              ▼                            │
                         ┌──────────┐                      │
                         │SCHEDULED │                      │
                         │          │                      │
                         └──┬───┬───┘                      │
                            │   │                          │
               start        │   │  reschedule              │
               meeting      │   │                          │
                            │   └──────────────────────────┘
                            │
                            ▼
                         ┌──────────┐
                         │IN_PROGRESS│
                         │          │
                         └────┬─────┘
                              │
                    complete  │
                              │
                              ▼
                         ┌──────────┐
                         │COMPLETED │
                         │          │
                         └──────────┘


  ──── Cancel transitions (from any active state) ────

  PENDING_COUNTERPART ──cancel──▶ CANCELLED
  CONFIRMED           ──cancel──▶ CANCELLED
  SCHEDULED           ──cancel──▶ CANCELLED

  ──── Expire transition ────

  PENDING_COUNTERPART ──timeout──▶ EXPIRED
  (after counterpart response deadline passes)


  State Descriptions:
  ┌─────────────────────┬───────────────────────────────────────────────┐
  │ State               │ Description                                   │
  ├─────────────────────┼───────────────────────────────────────────────┤
  │ PENDING_COUNTERPART │ Request submitted, awaiting counterpart reply │
  │ CONFIRMED           │ Both parties agreed, awaiting scheduling      │
  │ DECLINED            │ Counterpart declined the request              │
  │ SCHEDULED           │ Time slot and room assigned                   │
  │ IN_PROGRESS         │ Meeting currently underway                    │
  │ COMPLETED           │ Meeting concluded                             │
  │ CANCELLED           │ Request cancelled by either party or officer  │
  │ EXPIRED             │ Counterpart did not respond within deadline   │
  └─────────────────────┴───────────────────────────────────────────────┘
```

### E. References

#### Internal Module References

| Module    | Document                                                               | Relevance to Module 12                                              |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Module 01 | [Core Platform](./01-CORE-PLATFORM.md)                                 | Authentication, authorization, tenant management, base entities     |
| Module 03 | [Event Setup](./03-EVENT-SETUP.md)                                     | Event metadata, session scheduling, venue assignment                |
| Module 04 | [Delegation Management](./04-DELEGATION-MANAGEMENT.md)                 | Delegation composition, head of delegation, member roles            |
| Module 05 | [Abstract & Agenda](./05-ABSTRACT-AND-AGENDA.md)                       | Session agenda, speaking order                                      |
| Module 07 | [Communication](./07-COMMUNICATION.md)                                 | Notification dispatch for bilateral confirmations, companion alerts |
| Module 08 | [Document Management](./08-DOCUMENT-MANAGEMENT.md)                     | PDF generation pipeline, document storage                           |
| Module 09 | [Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | Participant registration, badge templates, accreditation levels     |
| Module 10 | [Event Operations](./10-EVENT-OPERATIONS.md)                           | Command center, operations dashboard, real-time monitoring          |
| Module 11 | [Logistics](./11-LOGISTICS.md)                                         | Transport, accommodation, venue rooms, catering                     |
| Module 13 | [Interpretation Services](./13-INTERPRETATION-SERVICES.md)             | Interpreter assignment, language pair availability                  |
| Module 14 | [Content Production](./14-CONTENT-PRODUCTION.md)                       | Nameplate templates, flag printing, welcome letters                 |
| Module 16 | [Reporting & Analytics](./16-REPORTING-AND-ANALYTICS.md)               | Protocol metrics, bilateral statistics, gift compliance reports     |

#### Technology Stack

| Technology         | Version | Usage in Module 12                                               |
| ------------------ | ------- | ---------------------------------------------------------------- |
| Node.js            | 20 LTS  | Server runtime                                                   |
| React              | 18      | UI components for seating, bilateral, companion, gift management |
| React Router       | 7       | Client and server routing, loaders, actions                      |
| Express            | 4       | API server for protocol endpoints                                |
| PostgreSQL         | 16      | Primary data store for all protocol entities                     |
| Prisma             | 5       | ORM and database migration management                            |
| Redis              | 7       | Caching (conflict rules, room availability), VIP tracking state  |
| Vitest             | Latest  | Unit and integration testing                                     |
| Playwright         | Latest  | End-to-end browser testing                                       |
| @faker-js/faker    | Latest  | Test data generation                                             |
| Azure Blob Storage | —       | PDF document storage                                             |
| p-queue            | Latest  | PDF generation concurrency control                               |
