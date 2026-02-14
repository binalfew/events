# Module 13: People and Workforce

> **Module:** 13 - People and Workforce
> **Version:** 1.0
> **Last Updated:** February 13, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md), [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md)
> **Required By:** [Module 10: Event Operations](./10-EVENT-OPERATIONS-CENTER.md), [Module 12: Protocol](./12-PROTOCOL-AND-DIPLOMACY.md)
> **Integrates With:** [Module 04: Workflow](./04-WORKFLOW-ENGINE.md), [Module 07: API](./07-API-AND-INTEGRATION-LAYER.md), [Module 08: UI/UX](./08-UI-UX-AND-FRONTEND.md), [Module 09: Registration](./09-REGISTRATION-AND-ACCREDITATION.md), [Module 11: Logistics](./11-LOGISTICS-AND-VENUE.md), [Module 14: Content](./14-CONTENT-AND-DOCUMENTS.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Domain Concepts](#14-domain-concepts)
   - 1.5 [Design Principles](#15-design-principles)
2. [Architecture](#2-architecture)
   - 2.1 [People Management Platform Architecture](#21-people-management-platform-architecture)
   - 2.2 [Staff Scheduling Engine](#22-staff-scheduling-engine)
   - 2.3 [Interpretation Assignment Pipeline](#23-interpretation-assignment-pipeline)
   - 2.4 [Media Operations Subsystem](#24-media-operations-subsystem)
   - 2.5 [Bounded Context Map](#25-bounded-context-map)
3. [Data Model](#3-data-model)
   - 3.1 [Staff and Volunteer Models](#31-staff-and-volunteer-models)
   - 3.2 [Interpretation Service Models](#32-interpretation-service-models)
   - 3.3 [Media and Press Models](#33-media-and-press-models)
   - 3.4 [Enhanced Models](#34-enhanced-models)
   - 3.5 [ER Diagram](#35-er-diagram)
   - 3.6 [Index Catalog](#36-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Staff Management APIs](#41-staff-management-apis)
   - 4.2 [Shift Management APIs](#42-shift-management-apis)
   - 4.3 [Interpretation Service APIs](#43-interpretation-service-apis)
   - 4.4 [Media Operations APIs](#44-media-operations-apis)
   - 4.5 [SSE Events](#45-sse-events)
   - 4.6 [Webhook Events](#46-webhook-events)
5. [Business Logic](#5-business-logic)
   - 5.1 [Shift Scheduling Algorithm](#51-shift-scheduling-algorithm)
   - 5.2 [Staff Check-In/Out Flow](#52-staff-check-inout-flow)
   - 5.3 [Interpreter Fatigue Rotation Algorithm](#53-interpreter-fatigue-rotation-algorithm)
   - 5.4 [Receiver Handset Tracking](#54-receiver-handset-tracking)
   - 5.5 [Interpretation Cost Calculation](#55-interpretation-cost-calculation)
   - 5.6 [Interview Request Flow](#56-interview-request-flow)
   - 5.7 [Embargo System](#57-embargo-system)
   - 5.8 [Performance Tracking Engine](#58-performance-tracking-engine)
   - 5.9 [Volunteer Onboarding Pipeline](#59-volunteer-onboarding-pipeline)
   - 5.10 [Staff Mobile App Features](#510-staff-mobile-app-features)
6. [User Interface](#6-user-interface)
   - 6.1 [Shift Scheduling Interface](#61-shift-scheduling-interface)
   - 6.2 [Staff Dashboard](#62-staff-dashboard)
   - 6.3 [Interpreter Assignment Board](#63-interpreter-assignment-board)
   - 6.4 [Receiver Equipment Dashboard](#64-receiver-equipment-dashboard)
   - 6.5 [Press Conference Management](#65-press-conference-management)
   - 6.6 [Interview Request Portal](#66-interview-request-portal)
   - 6.7 [Media Advisory Editor](#67-media-advisory-editor)
   - 6.8 [Staff Mobile App Wireframe](#68-staff-mobile-app-wireframe)
   - 6.9 [Responsive and Mobile Views](#69-responsive-and-mobile-views)
7. [Testing Strategy](#7-testing-strategy)
8. [Performance](#8-performance)
9. [Security](#9-security)
10. [Migration](#10-migration)
11. [Observability](#11-observability)
12. [Appendix](#12-appendix)

---

## 1. Overview

### 1.1 Purpose

Module 13 provides a unified people management platform for all non-participant personnel involved in event operations. While Module 09 (Registration and Accreditation) handles delegates, observers, and other credentialed participants, this module manages the operational workforce that makes events function: staff members, volunteers, interpreters, drivers, security personnel, and media/press operations.

The platform addresses three distinct but interconnected domains:

1. **Staff and Volunteer Management** -- Recruitment, scheduling, check-in/out, task assignment, and performance tracking for all operational personnel from coordinators and ushers to IT support and medical staff.

2. **Interpretation and Language Services** -- Interpreter scheduling with fatigue rotation, booth management, receiver handset tracking, and cost calculation for multilingual events requiring simultaneous interpretation across multiple language pairs.

3. **Media and Press Operations** -- Press conference management, interview request routing, media advisory distribution with embargo controls, and pool journalist coordination for events with significant press coverage.

These three domains share a common foundation: the `StaffMember` entity that represents any person working at the event. An interpreter is a staff member with role `INTERPRETER`. A press officer is a staff member with role `PROTOCOL_OFFICER` assigned to the media team. This unified model eliminates duplication while allowing domain-specific behavior through role-based branching.

### 1.2 Scope

**In Scope:**

| Domain                      | Capabilities                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Staff Management**        | Staff registration, role assignment, team grouping, badge linkage, skill tagging                                              |
| **Shift Scheduling**        | Timeline-based scheduling, drag-and-drop assignment, coverage gap detection, conflict detection, auto-scheduling, shift swaps |
| **Check-In/Out**            | Badge-based attendance, break tracking, overtime detection, no-show handling                                                  |
| **Task Logging**            | Action capture per staff member, productivity metrics, workload analysis                                                      |
| **Performance**             | Auto-captured metrics from system actions, shift compliance, SLA tracking                                                     |
| **Volunteer Pipeline**      | Application intake, screening, training tracking, assignment, evaluation                                                      |
| **Interpretation Services** | Language pair scheduling, interpreter assignment, 30-minute fatigue rotation, booth management                                |
| **Equipment Tracking**      | Receiver handset check-out/in, loss detection, charging status, cost tracking                                                 |
| **Cost Calculation**        | Per-language-pair rate tracking, total interpretation cost rollup, equipment rental costs                                     |
| **Press Conferences**       | Scheduling, speaker management, pool restrictions, room booking integration                                                   |
| **Interview Requests**      | Journalist request submission, delegation routing, focal point approval, scheduling                                           |
| **Media Advisories**        | Rich-text advisories, embargo scheduling, automated distribution, press kit integration                                       |

**Out of Scope:**

| Excluded                                   | Handled By              |
| ------------------------------------------ | ----------------------- |
| Participant registration and accreditation | Module 09               |
| Venue and room setup                       | Module 11               |
| Vehicle and transport management           | Module 11               |
| Badge design and printing                  | Module 09               |
| Incident command and response              | Module 10               |
| Protocol ranking and seating               | Module 12               |
| Content publishing and CMS                 | Module 14               |
| Payroll and HR systems                     | External HR integration |

### 1.3 Key Personas

| Persona               | Role                                        | Primary Activities                                                                                         |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **HR Coordinator**    | Manages staff roster and volunteer pipeline | Registers staff, assigns roles and teams, tracks training completion, handles volunteer applications       |
| **Shift Manager**     | Oversees daily scheduling and attendance    | Creates shift schedules, monitors check-ins, handles coverage gaps, approves shift swaps, reviews overtime |
| **Team Lead**         | Supervises a specific operational team      | Views team schedule, logs tasks, tracks team performance, handles break rotations                          |
| **Chief Interpreter** | Manages interpretation services             | Assigns interpreters to language pairs, manages fatigue rotation, monitors booth operations, tracks costs  |
| **Booth Coordinator** | Manages interpretation booth operations     | Manages booth equipment, coordinates interpreter handoffs, tracks receiver distribution                    |
| **Press Officer**     | Manages media operations and communications | Schedules press conferences, reviews interview requests, drafts media advisories, manages embargoes        |
| **Media Liaison**     | Interfaces between media and delegations    | Routes interview requests to focal points, coordinates media access, manages pool assignments              |
| **Staff Member**      | Any operational team member                 | Views own schedule, checks in/out, logs breaks, receives task assignments, requests shift swaps            |
| **Volunteer**         | Event volunteer                             | Applies for volunteer positions, completes training, views assignments, checks in at posts                 |
| **Journalist**        | Accredited press/media participant          | Requests interviews, accesses press conferences, receives media advisories, joins media pools              |

### 1.4 Domain Concepts

**Staff and Workforce Domain:**

- **StaffMember** -- Any person working at the event who is not a credentialed participant. Has a role (coordinator, usher, interpreter, etc.), belongs to a team, possesses skills, and maintains a status (active, on break, off duty).
- **StaffShift** -- A scheduled time block for a staff member at a specific zone, location, and task. Tracks check-in/out times and break duration.
- **StaffTaskLog** -- An immutable record of a specific action performed by a staff member, such as processing a participant, escorting a VIP, or resolving an incident.
- **Coverage Gap** -- A time/zone combination where no staff member is assigned, detected by the scheduling engine and flagged for resolution.
- **Shift Swap** -- A request from one staff member to exchange a shift with another, requiring manager approval.

**Interpretation Domain:**

- **InterpretationService** -- A language pair (e.g., English to French) required for a specific meeting, assigned to an audio channel and optionally to a physical booth.
- **InterpreterAssignment** -- A 30-minute rotation block assigning an interpreter to an interpretation service, alternating between lead (actively interpreting) and support roles.
- **InterpretationBooth** -- A physical booth in a venue room, wired for specific languages, with a defined interpreter capacity and equipment manifest.
- **ReceiverHandset** -- A physical device distributed to participants for listening to interpretation, tracked through check-out, return, loss, and charging states.
- **Fatigue Rotation** -- The mandatory 30-minute maximum active interpreting period, after which interpreters swap lead/support roles to maintain quality and prevent cognitive fatigue.

**Media Domain:**

- **PressConference** -- A scheduled media event with speakers, optionally restricted to pool journalists, linked to a room booking and media advisories.
- **InterviewRequest** -- A formal request from a journalist to interview a delegate or delegation representative, routed through the delegation focal point.
- **MediaAdvisory** -- A communication distributed to accredited media, optionally embargoed until a specific date/time, with attachments and targeted distribution lists.
- **Embargo** -- A time-based restriction on publication of information, automatically lifted by a background job that publishes the advisory and notifies media.
- **Media Pool** -- A restricted group of journalists granted exclusive access to a press event, typically used when space is limited or security is elevated.

### 1.5 Design Principles

1. **Unified People Model** -- All operational personnel are `StaffMember` entities differentiated by role. This allows shared scheduling, check-in/out, and task logging infrastructure across coordinators, interpreters, medical staff, and volunteers.

2. **Schedule-Centric Operations** -- The shift schedule is the central artifact. All workforce decisions -- coverage analysis, overtime calculation, performance measurement, cost tracking -- derive from or relate to scheduled and actual shift data.

3. **Fatigue-Aware Interpretation** -- Interpreter scheduling enforces 30-minute maximum active rotation as a hard constraint. The system prevents assignment of interpreters who have not had adequate rest, protecting both interpreter well-being and interpretation quality.

4. **Badge-as-Identity** -- Staff badge scans serve dual purpose: access control (via Module 05) and attendance tracking. A badge scan at a zone terminal simultaneously validates access permissions and records shift check-in, eliminating redundant processes.

5. **Gap-Before-Fail** -- Coverage gaps are detected proactively during schedule creation, not reactively when a post goes unstaffed. The scheduling engine continuously monitors for unassigned time/zone combinations and alerts shift managers before gaps become operational failures.

6. **Embargo Integrity** -- Media advisories under embargo are stored but not visible to media participants until the embargo lifts. The background job that publishes embargoed content runs on a separate queue with retry logic to ensure timely and reliable distribution.

7. **Delegation-Mediated Media Access** -- Interview requests flow through delegation focal points, never directly to delegates. This respects diplomatic protocol and gives delegations control over media engagement with their representatives.

8. **Multi-Tenant Isolation** -- All people data is tenant-scoped. A staff member in Tenant A has no visibility into Tenant B operations. Interpretation costs, media advisories, and shift schedules are all isolated by tenant boundary.

9. **Mobile-First Staff Experience** -- Staff members interact with the system primarily through mobile devices at their posts. The staff mobile app provides check-in/out, break logging, task receipt, schedule viewing, and shift swap requests in a touch-optimized interface.

10. **Audit Everything** -- Every check-in, check-out, shift swap, interview request status change, and embargo lift is recorded in the audit log with actor, timestamp, and before/after state for full accountability.

---

## 2. Architecture

### 2.1 People Management Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PEOPLE & WORKFORCE PLATFORM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│  │   PRESENTATION      │  │   PRESENTATION      │  │   PRESENTATION     │  │
│  │                     │  │                     │  │                    │  │
│  │  Staff Dashboard    │  │  Interpreter Board  │  │  Media Portal      │  │
│  │  Shift Scheduler    │  │  Booth Timeline     │  │  Press Conference  │  │
│  │  Mobile App         │  │  Receiver Tracker   │  │  Interview Portal  │  │
│  │  Check-In Terminal  │  │  Cost Dashboard     │  │  Advisory Editor   │  │
│  └────────┬────────────┘  └────────┬────────────┘  └────────┬───────────┘  │
│           │                        │                         │              │
│  ┌────────┴────────────────────────┴─────────────────────────┴───────────┐  │
│  │                         API GATEWAY (Express 4)                       │  │
│  │                                                                       │  │
│  │  /api/events/:eid/staff/*         Staff CRUD, scheduling, check-in   │  │
│  │  /api/events/:eid/shifts/*        Shift management, swaps, gaps      │  │
│  │  /api/events/:eid/interpretation/* Services, assignments, booths     │  │
│  │  /api/events/:eid/receivers/*     Handset tracking, distribution     │  │
│  │  /api/events/:eid/press/*         Conferences, interviews, advisory  │  │
│  │  /api/events/:eid/media/*         Pool management, embargo control   │  │
│  └────────┬────────────────────────┬─────────────────────────┬───────────┘  │
│           │                        │                         │              │
│  ┌────────┴──────────┐  ┌─────────┴──────────┐  ┌──────────┴───────────┐  │
│  │  STAFF SERVICE    │  │  INTERPRETATION    │  │  MEDIA SERVICE       │  │
│  │                   │  │  SERVICE           │  │                      │  │
│  │  StaffManager     │  │  InterpreterMgr    │  │  PressConfMgr        │  │
│  │  ShiftScheduler   │  │  FatigueRotation   │  │  InterviewRouter     │  │
│  │  CheckInEngine    │  │  BoothManager      │  │  EmbargoScheduler    │  │
│  │  TaskLogger       │  │  ReceiverTracker   │  │  AdvisoryPublisher   │  │
│  │  PerformanceCalc  │  │  CostCalculator    │  │  PoolManager         │  │
│  │  VolunteerPipe    │  │  CertTracker       │  │  MediaDistributor    │  │
│  │  SwapProcessor    │  │  SkillMatcher      │  │  EmbedCodeGen        │  │
│  └────────┬──────────┘  └─────────┬──────────┘  └──────────┬───────────┘  │
│           │                        │                         │              │
│  ┌────────┴────────────────────────┴─────────────────────────┴───────────┐  │
│  │                     DATA LAYER (Prisma 5 + PostgreSQL 16)             │  │
│  │                                                                       │  │
│  │  StaffMember  StaffShift  StaffTaskLog  StaffEvaluation              │  │
│  │  TrainingRecord  VolunteerApplication  ShiftSwapRequest              │  │
│  │  InterpretationService  InterpreterAssignment  InterpretationBooth   │  │
│  │  ReceiverHandset  InterpreterCertification                           │  │
│  │  PressConference  PressConferenceSpeaker  InterviewRequest           │  │
│  │  MediaAdvisory  MediaPoolAssignment                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     INTEGRATION LAYER                                │  │
│  │                                                                      │  │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────────────┐  │  │
│  │  │  Badge &   │ │  Venue &   │ │ Workflow │ │  Command Center    │  │  │
│  │  │  Access    │ │  Room Mgmt │ │ Engine   │ │  Real-time Overlay │  │  │
│  │  │ (Mod 05)  │ │ (Mod 11)   │ │ (Mod 04) │ │  (Mod 10)          │  │  │
│  │  └────────────┘ └────────────┘ └──────────┘ └────────────────────┘  │  │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────────────┐  │  │
│  │  │ Registr.   │ │  Content   │ │ Notif.   │ │  Transport         │  │  │
│  │  │ & Accred.  │ │  & Docs    │ │ Service  │ │  (Mod 11)          │  │  │
│  │  │ (Mod 09)   │ │ (Mod 14)   │ │ (Mod 07) │ │                    │  │  │
│  │  └────────────┘ └────────────┘ └──────────┘ └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Staff Scheduling Engine

The scheduling engine is the core computational component for workforce management. It handles both manual scheduling (drag-and-drop by shift managers) and automated scheduling (algorithm-driven distribution).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STAFF SCHEDULING ENGINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐     ┌──────────────────────────────────────┐ │
│  │  MANUAL SCHEDULING   │     │  AUTO-SCHEDULING ALGORITHM           │ │
│  │                      │     │                                      │ │
│  │  @dnd-kit Scheduler  │     │  Input:                              │ │
│  │  ┌────────────────┐  │     │  - Staff roster with skills, roles   │ │
│  │  │ Drag staff to  │  │     │  - Zone/location requirements        │ │
│  │  │ timeline slots │──┼──┐  │  - Time blocks needing coverage      │ │
│  │  └────────────────┘  │  │  │  - Max hours per staff per day       │ │
│  │  ┌────────────────┐  │  │  │  - Required break intervals          │ │
│  │  │ Resize shift   │  │  │  │                                      │ │
│  │  │ blocks         │──┼──┤  │  Algorithm:                          │ │
│  │  └────────────────┘  │  │  │  1. Build requirement matrix         │ │
│  │  ┌────────────────┐  │  │  │  2. Sort by constraint tightness     │ │
│  │  │ Swap shifts    │  │  │  │  3. Greedy fill with backtracking    │ │
│  │  │ between staff  │──┼──┤  │  4. Balance hours across staff       │ │
│  │  └────────────────┘  │  │  │  5. Insert mandatory breaks          │ │
│  │                      │  │  │  6. Validate coverage completeness   │ │
│  └──────────────────────┘  │  │                                      │ │
│                            │  └────────────────┬─────────────────────┘ │
│                            │                   │                       │
│  ┌─────────────────────────┴───────────────────┴─────────────────────┐ │
│  │                    VALIDATION ENGINE                               │ │
│  │                                                                    │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────────┐  │ │
│  │  │ Coverage   │ │ Conflict   │ │ Skill      │ │ Hours Limit   │  │ │
│  │  │ Gap        │ │ Detection  │ │ Matching   │ │ Check         │  │ │
│  │  │ Detection  │ │            │ │            │ │               │  │ │
│  │  │            │ │ No double  │ │ Zone needs │ │ Max 10h/day   │  │ │
│  │  │ Zone×Time  │ │ booking    │ │ vs staff   │ │ Max 48h/week  │  │ │
│  │  │ with zero  │ │ across     │ │ skills     │ │ Min 8h rest   │  │ │
│  │  │ coverage   │ │ overlapping│ │ match      │ │ between days  │  │ │
│  │  │            │ │ shifts     │ │            │ │               │  │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └───────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    OUTPUT                                         │ │
│  │                                                                    │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────────┐  │ │
│  │  │ Shift       │ │ Gap Report   │ │ Notifications             │  │ │
│  │  │ Assignments │ │              │ │                           │  │ │
│  │  │             │ │ Unmet zones  │ │ "Your shift: Gate 3,     │  │ │
│  │  │ StaffShift  │ │ Understaffed │ │  08:00-14:00, Feb 10"    │  │ │
│  │  │ records     │ │ time blocks  │ │                           │  │ │
│  │  └─────────────┘ └──────────────┘ └───────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Interpretation Assignment Pipeline

The interpretation assignment pipeline transforms meeting language requirements into concrete interpreter schedules with fatigue rotation enforced at every step.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  INTERPRETATION ASSIGNMENT PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │  Meeting Created │                                                   │
│  │  with Language   │                                                   │
│  │  Requirements    │                                                   │
│  └────────┬────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────┐                    │
│  │  1. LANGUAGE PAIR EXTRACTION                     │                   │
│  │                                                   │                   │
│  │  Meeting: Opening Ceremony (09:00-12:00)          │                   │
│  │  Required: EN→FR, FR→EN, EN→AR, AR→EN, EN→PT     │                   │
│  │                                                   │                   │
│  │  Creates InterpretationService per language pair   │                   │
│  │  Assigns channel numbers (2, 3, 4, 5, 6)          │                   │
│  └────────┬────────────────────────────────────────┘                    │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────┐                    │
│  │  2. BOOTH ALLOCATION                             │                   │
│  │                                                   │                   │
│  │  Match language pairs to available booths:        │                   │
│  │  Booth 1 (wired: en,fr,ar) → EN→FR, FR→EN       │                   │
│  │  Booth 2 (wired: en,ar,pt) → EN→AR, AR→EN       │                   │
│  │  Booth 3 (wired: en,pt,es) → EN→PT              │                   │
│  │                                                   │                   │
│  │  Check: booth.capacity >= interpreters needed     │                   │
│  └────────┬────────────────────────────────────────┘                    │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────┐                    │
│  │  3. INTERPRETER MATCHING                         │                   │
│  │                                                   │                   │
│  │  For each language pair:                          │                   │
│  │  - Query StaffMember WHERE role = INTERPRETER     │                   │
│  │    AND skills @> '["en","fr"]'                    │                   │
│  │  - Check InterpreterCertification for valid cert  │                   │
│  │  - Check availability (no overlapping shifts)     │                   │
│  │  - Rank by: certification level, experience,      │                   │
│  │    hours already assigned today                   │                   │
│  └────────┬────────────────────────────────────────┘                    │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────┐                    │
│  │  4. FATIGUE ROTATION SCHEDULING                  │                   │
│  │                                                   │                   │
│  │  Session: 09:00-12:00 (180 min)                   │                   │
│  │  Rotation interval: 30 min                        │                   │
│  │  Blocks needed: 6                                 │                   │
│  │  Interpreters needed: 3 (min 2 per block)         │                   │
│  │                                                   │                   │
│  │  09:00-09:30  A(lead) + B(support)               │                   │
│  │  09:30-10:00  B(lead) + A(support)               │                   │
│  │  10:00-10:30  A(lead) + C(support)               │                   │
│  │  10:30-11:00  C(lead) + A(support)               │                   │
│  │  11:00-11:30  B(lead) + C(support)               │                   │
│  │  11:30-12:00  C(lead) + B(support)               │                   │
│  │                                                   │                   │
│  │  Creates InterpreterAssignment per block          │                   │
│  └────────┬────────────────────────────────────────┘                    │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────┐                    │
│  │  5. VALIDATION & GAP DETECTION                   │                   │
│  │                                                   │                   │
│  │  [x] All language pairs covered                   │                   │
│  │  [x] No interpreter double-booked                 │                   │
│  │  [x] 30-min rest between active blocks            │                   │
│  │  [ ] ALERT: No AR→PT interpreter available        │                   │
│  │      for Session X at 14:00                       │                   │
│  └─────────────────────────────────────────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Media Operations Subsystem

The media operations subsystem manages the full lifecycle of press activities, from conference scheduling through interview coordination to embargoed advisory distribution.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MEDIA OPERATIONS SUBSYSTEM                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  PRESS CONFERENCE MANAGEMENT  │  │  INTERVIEW REQUEST ROUTING     │ │
│  │                               │  │                                │ │
│  │  Press Officer                │  │  Journalist                    │ │
│  │    │                          │  │    │                           │ │
│  │    ├─ Create conference       │  │    ├─ Submit request           │ │
│  │    ├─ Add speakers            │  │    │  (target, topic, format)  │ │
│  │    ├─ Set pool restrictions   │  │    │                           │ │
│  │    ├─ Link room booking       │  │    ▼                           │ │
│  │    ├─ Create media advisory   │  │  System routes to             │ │
│  │    └─ Publish/cancel          │  │  delegation focal point       │ │
│  │                               │  │    │                           │ │
│  │  Pool Manager                 │  │    ▼                           │ │
│  │    │                          │  │  Focal Point                   │ │
│  │    ├─ Create media pool       │  │    ├─ Review request           │ │
│  │    ├─ Assign journalists      │  │    ├─ Approve / Decline        │ │
│  │    ├─ Rotate pool members     │  │    ├─ Set time & location      │ │
│  │    └─ Manage pool schedule    │  │    └─ Forward to delegate      │ │
│  │                               │  │                                │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  MEDIA ADVISORY & EMBARGO ENGINE                                  │ │
│  │                                                                    │ │
│  │  ┌──────────┐    ┌───────────┐    ┌──────────────┐               │ │
│  │  │  Draft    │───▶│  Embargoed │───▶│  Published   │              │ │
│  │  │          │    │           │    │              │               │ │
│  │  │ Author   │    │ Stored,   │    │ isPublished  │               │ │
│  │  │ writes   │    │ hidden    │    │ = true       │               │ │
│  │  │ advisory │    │ from      │    │ Email blast  │               │ │
│  │  │          │    │ media     │    │ to all media │               │ │
│  │  └──────────┘    └─────┬─────┘    └──────────────┘               │ │
│  │                        │                                          │ │
│  │         ┌──────────────┴───────────────┐                         │ │
│  │         │  Embargo Scheduler (cron)     │                         │ │
│  │         │                               │                         │ │
│  │         │  Every minute:                │                         │ │
│  │         │  SELECT * FROM MediaAdvisory  │                         │ │
│  │         │  WHERE embargoUntil <= NOW()  │                         │ │
│  │         │    AND isPublished = false     │                         │ │
│  │         │                               │                         │ │
│  │         │  For each: publish & notify   │                         │ │
│  │         └───────────────────────────────┘                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Bounded Context Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BOUNDED CONTEXT MAP                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  PEOPLE & WORKFORCE (Module 13)                   │  │
│  │                                                                   │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────────┐ │  │
│  │  │  Staff &        │ │  Interpretation  │ │  Media & Press     │ │  │
│  │  │  Volunteers     │ │  Services        │ │  Operations        │ │  │
│  │  │                 │ │                  │ │                    │ │  │
│  │  │  StaffMember    │ │  Interp.Service  │ │  PressConference   │ │  │
│  │  │  StaffShift     │◀┤  Interp.Assign   │ │  InterviewRequest  │ │  │
│  │  │  StaffTaskLog   │ │  Interp.Booth    │ │  MediaAdvisory     │ │  │
│  │  │  StaffEvaluation│ │  ReceiverHandset │ │  MediaPool         │ │  │
│  │  │  TrainingRecord │ │  Interp.Cert     │ │                    │ │  │
│  │  │  VolunteerApp   │ │                  │ │                    │ │  │
│  │  │  ShiftSwap      │ │  Shares StaffMbr │ │  Routes to         │ │  │
│  │  │                 │ │  (role=INTERP)   │ │  Delegation FP     │ │  │
│  │  └────────┬────────┘ └────────┬─────────┘ └────────┬───────────┘ │  │
│  │           │                   │                     │             │  │
│  └───────────┼───────────────────┼─────────────────────┼─────────────┘  │
│              │                   │                     │                 │
│   ┌──────────┴─────┐   ┌────────┴───────┐   ┌────────┴──────────┐     │
│   │ Badge & Access │   │ Venue & Room   │   │ Registration &    │     │
│   │ (Module 05)    │   │ (Module 11)    │   │ Accreditation     │     │
│   │                │   │                │   │ (Module 09)       │     │
│   │ Badge scan =   │   │ Booth location │   │ Participant data  │     │
│   │ check-in +     │   │ Room booking   │   │ for interview     │     │
│   │ access ctrl    │   │ Zone mapping   │   │ target lookup     │     │
│   └────────────────┘   └────────────────┘   └───────────────────┘     │
│                                                                         │
│   ┌────────────────┐   ┌────────────────┐   ┌───────────────────┐     │
│   │ Workflow Engine │   │ Command Center │   │ Content & Docs    │     │
│   │ (Module 04)    │   │ (Module 10)    │   │ (Module 14)       │     │
│   │                │   │                │   │                   │     │
│   │ Approval flows │   │ Real-time      │   │ Advisory content  │     │
│   │ for shift swap │   │ staff position │   │ Press kit PDF     │     │
│   │ volunteer app  │   │ overlay on map │   │ generation        │     │
│   └────────────────┘   └────────────────┘   └───────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Context Relationships:**

| Source Context     | Target Context           | Relationship          | Integration Pattern                                     |
| ------------------ | ------------------------ | --------------------- | ------------------------------------------------------- |
| Staff & Volunteers | Badge & Access (Mod 05)  | Conformist            | Badge scan triggers check-in via event hook             |
| Staff & Volunteers | Command Center (Mod 10)  | Published Language    | Staff status SSE events consumed by ops dashboard       |
| Staff & Volunteers | Workflow Engine (Mod 04) | Customer-Supplier     | Shift swap approval uses workflow step definitions      |
| Interpretation     | Venue & Room (Mod 11)    | Shared Kernel         | Booth location references venue room identifiers        |
| Interpretation     | Staff & Volunteers       | Conformist            | InterpreterAssignment references StaffMember entity     |
| Media & Press      | Registration (Mod 09)    | Anti-Corruption Layer | Interview targets resolved through participant lookup   |
| Media & Press      | Content & Docs (Mod 14)  | Customer-Supplier     | Advisory attachments stored via content module          |
| Media & Press      | Staff & Volunteers       | Shared Kernel         | Press officers are StaffMember entities with media team |

---

## 3. Data Model

### 3.1 Staff and Volunteer Models

These models form the core workforce management layer. The `StaffMember` entity is the universal person record for all non-participant event personnel. `StaffShift` captures scheduled and actual time blocks, and `StaffTaskLog` provides an immutable action history.

```prisma
model StaffMember {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId      String?  // Link to User if they have system access
  user        User?    @relation(fields: [userId], references: [id])
  name        String
  phone       String
  email       String?
  photo       String?  // Azure Blob URL
  role        StaffRole
  team        String?  // "Registration Team A", "VIP Protocol", "Transport"
  skills      Json     @default("[]") // ["French", "Arabic", "First Aid", "Sign Language"]
  status      StaffStatus @default(OFF_DUTY)
  badgeId     String?  // Linked to a badge for access control
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  shifts      StaffShift[]
  taskLogs    StaffTaskLog[]

  @@index([eventId, role])
  @@index([eventId, team])
  @@index([status])
}

enum StaffRole {
  COORDINATOR
  USHER
  INTERPRETER
  IT_SUPPORT
  MEDICAL
  DRIVER
  SECURITY_GUARD
  PROTOCOL_OFFICER
  REGISTRATION_CLERK
  CATERING
  AV_TECHNICIAN
  VOLUNTEER
}

enum StaffStatus {
  ACTIVE        // On duty, working
  ON_BREAK      // Logged break
  OFF_DUTY      // Not on shift
  ABSENT        // Expected but not checked in
  UNAVAILABLE   // Sick, personal leave
}

model StaffShift {
  id           String      @id @default(cuid())
  staffId      String
  staff        StaffMember @relation(fields: [staffId], references: [id], onDelete: Cascade)
  date         DateTime    @db.Date
  startTime    DateTime
  endTime      DateTime
  zone         String?     // "Registration Zone", "VIP Area", "Gate 3"
  location     String?     // Specific room or post
  task         String?     // "Registration Desk A", "VIP Lounge Door", "Shuttle Bay"
  status       ShiftStatus @default(SCHEDULED)
  checkedInAt  DateTime?
  checkedOutAt DateTime?
  breakMinutes Int         @default(0) // Total break time taken
  notes        String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([staffId, date])
  @@index([date, zone])
  @@index([status])
}

enum ShiftStatus {
  SCHEDULED
  CHECKED_IN
  CHECKED_OUT
  NO_SHOW
  CANCELLED
}

model StaffTaskLog {
  id          String      @id @default(cuid())
  staffId     String
  staff       StaffMember @relation(fields: [staffId], references: [id], onDelete: Cascade)
  action      String      // "processed_participant", "escorted_vip", "resolved_incident"
  metadata    Json?       // {"participantId": "...", "duration": 5}
  createdAt   DateTime    @default(now())

  @@index([staffId, createdAt])
}
```

### 3.2 Interpretation Service Models

These models manage the full interpretation lifecycle: service definitions per meeting/language pair, interpreter assignments with fatigue rotation, physical booth tracking, and receiver handset distribution.

```prisma
model InterpretationService {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId       String
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  meetingId     String
  meeting       Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  fromLanguage  String   // ISO 639-1: "en", "fr", "ar"
  toLanguage    String
  channelNumber Int      // Audio channel participants tune to
  boothId       String?
  booth         InterpretationBooth? @relation(fields: [boothId], references: [id])
  status        String   // SCHEDULED, ACTIVE, COMPLETED, CANCELLED
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  assignments   InterpreterAssignment[]

  @@unique([meetingId, fromLanguage, toLanguage])
  @@index([eventId, meetingId])
}

model InterpreterAssignment {
  id          String   @id @default(cuid())
  serviceId   String
  service     InterpretationService @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  staffId     String   // StaffMember of role INTERPRETER
  startTime   DateTime // Interpreters rotate mid-session
  endTime     DateTime
  isLead      Boolean  @default(false) // Lead interpreter manages the booth
  status      String   // SCHEDULED, ACTIVE, COMPLETED, ABSENT
  createdAt   DateTime @default(now())

  @@index([staffId, startTime])
  @@index([serviceId])
}

model InterpretationBooth {
  id          String   @id @default(cuid())
  tenantId    String
  venueId     String
  venue       Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  roomName    String   // Which room this booth serves
  boothNumber Int
  languages   Json     @default("[]") // ["en","fr","ar"] - languages this booth is wired for
  capacity    Int      @default(3) // How many interpreters fit
  equipment   Json     @default("[]") // ["console_bosch_integrus", "microphone_x2"]
  status      String   // OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  services    InterpretationService[]

  @@unique([venueId, roomName, boothNumber])
}

model ReceiverHandset {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  serialNumber String  @unique
  status      String   // AVAILABLE, CHECKED_OUT, LOST, DAMAGED, CHARGING
  currentHolder String? // participantId
  checkedOutAt DateTime?
  checkedInAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([eventId, status])
}
```

### 3.3 Media and Press Models

These models support press conference scheduling, interview request routing, and media advisory distribution with embargo controls.

```prisma
model PressConference {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  title       String   // "Joint Press Conference: Climate Action Summit"
  description String?
  date        DateTime @db.Date
  startTime   DateTime
  endTime     DateTime
  roomId      String?  // Links to Room booking
  status      String   // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  isPoolOnly  Boolean  @default(false) // Restricted to pool journalists
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  speakers    PressConferenceSpeaker[]
  mediaAdvisories MediaAdvisory[]

  @@index([eventId, date])
}

model PressConferenceSpeaker {
  id                String   @id @default(cuid())
  pressConferenceId String
  pressConference   PressConference @relation(fields: [pressConferenceId], references: [id], onDelete: Cascade)
  participantId     String?  // If the speaker is a registered participant
  name              String
  title             String   // "Minister of Foreign Affairs, Republic of Kenya"
  speakingOrder     Int
  topic             String?
  biography         String?
  photoUrl          String?

  @@index([pressConferenceId])
}

model InterviewRequest {
  id                String   @id @default(cuid())
  tenantId          String
  eventId           String
  requestorId       String   // Participant of type Press/Media
  targetParticipantId String?
  targetDelegation  String?  // Country or organization name
  outlet            String   // "BBC World Service", "Al Jazeera"
  topic             String
  preferredDate     DateTime?
  preferredDuration Int?     // Minutes
  format            String   // IN_PERSON, PHONE, VIDEO, WRITTEN
  status            String   // SUBMITTED, FORWARDED, APPROVED, DECLINED, SCHEDULED, COMPLETED
  forwardedTo       String?  // Focal point userId who received the request
  respondedBy       String?
  respondedAt       DateTime?
  scheduledTime     DateTime?
  scheduledLocation String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([eventId, status])
  @@index([targetDelegation])
  @@index([requestorId])
}

model MediaAdvisory {
  id                String   @id @default(cuid())
  tenantId          String
  eventId           String
  pressConferenceId String?
  pressConference   PressConference? @relation(fields: [pressConferenceId], references: [id])
  title             String
  body              String   // Rich text / markdown content
  embargoUntil      DateTime? // null = immediate release
  isPublished       Boolean  @default(false)
  publishedAt       DateTime?
  attachments       Json     @default("[]") // [{"name":"backgrounder.pdf","url":"..."}]
  distributedTo     Json     @default("[]") // ["all_media"] or specific participant IDs
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([eventId, isPublished])
  @@index([embargoUntil])
}
```

### 3.4 Enhanced Models

These models extend the core data model with capabilities not present in the base system design: staff evaluation, training tracking, volunteer applications, shift swap requests, interpreter certifications, and media pool assignments.

```prisma
// ─── Staff Evaluation ───────────────────────────────────────────────────────

model StaffEvaluation {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  staffId     String
  evaluatorId String   // StaffMember id of the evaluator (team lead or shift manager)
  shiftId     String?  // Optional: evaluation tied to a specific shift
  period      String   // "2026-02-10", "2026-02-10_AM", "week-1"
  ratings     Json     // {"punctuality": 5, "communication": 4, "initiative": 5, "teamwork": 4}
  overall     Float    // Computed average: 4.5
  strengths   String?  // Free-text positive observations
  improvements String? // Free-text areas for improvement
  actionItems Json     @default("[]") // [{"item":"Attend conflict resolution training","dueBy":"2026-03-01"}]
  status      EvaluationStatus @default(DRAFT)
  reviewedBy  String?  // Staff member who acknowledged the evaluation
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([staffId, eventId])
  @@index([evaluatorId])
  @@index([eventId, period])
}

enum EvaluationStatus {
  DRAFT
  SUBMITTED
  ACKNOWLEDGED
  DISPUTED
}

// ─── Training Record ────────────────────────────────────────────────────────

model TrainingRecord {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId       String
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  staffId       String
  trainingType  TrainingType
  title         String   // "Registration System Training", "VIP Protocol Briefing"
  description   String?
  scheduledDate DateTime?
  completedDate DateTime?
  expiresAt     DateTime? // Certification expiry
  score         Float?    // Assessment score if applicable (0-100)
  passThreshold Float?    // Minimum score to pass (e.g., 80)
  passed        Boolean   @default(false)
  certificateUrl String?  // URL to training certificate PDF
  trainerId     String?   // Who delivered the training
  duration      Int?      // Duration in minutes
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([staffId, eventId])
  @@index([trainingType])
  @@index([eventId, completedDate])
}

enum TrainingType {
  ORIENTATION       // General event orientation
  SYSTEM_TRAINING   // Platform/system usage
  PROTOCOL_BRIEFING // VIP handling, diplomatic protocol
  SAFETY_TRAINING   // Emergency procedures, first aid
  ROLE_SPECIFIC     // Job-specific training
  LANGUAGE_COURSE   // Language skill development
  SECURITY_CLEARANCE // Security vetting process
  ACCESSIBILITY     // Disability awareness, accessible service
}

// ─── Volunteer Application ──────────────────────────────────────────────────

model VolunteerApplication {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  applicantName   String
  email           String
  phone           String
  dateOfBirth     DateTime? @db.Date
  nationality     String?
  languages       Json     @default("[]") // ["English", "French", "Arabic"]
  skills          Json     @default("[]") // ["First Aid", "Sign Language", "Driving"]
  education       String?  // "Bachelor's in International Relations"
  experience      String?  // Free-text prior volunteer experience
  availability    Json     @default("[]") // [{"date":"2026-02-10","from":"06:00","to":"18:00"},...]
  preferredRoles  Json     @default("[]") // ["USHER", "REGISTRATION_CLERK", "DRIVER"]
  motivation      String?  // Why they want to volunteer
  emergencyContact Json?   // {"name":"...","phone":"...","relation":"..."}
  photoUrl        String?
  resumeUrl       String?
  status          VolunteerAppStatus @default(SUBMITTED)
  reviewedBy      String?  // UserId of reviewer
  reviewNotes     String?
  staffMemberId   String?  // Created StaffMember upon acceptance
  submittedAt     DateTime @default(now())
  reviewedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([eventId, status])
  @@index([email])
}

enum VolunteerAppStatus {
  SUBMITTED
  UNDER_REVIEW
  SHORTLISTED
  INTERVIEW_SCHEDULED
  ACCEPTED
  WAITLISTED
  DECLINED
  WITHDRAWN
}

// ─── Shift Swap Request ─────────────────────────────────────────────────────

model ShiftSwapRequest {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  requestorShiftId String  // The shift the requestor wants to give away
  targetShiftId   String?  // The shift the requestor wants to take (if swap vs. drop)
  requestorId     String   // StaffMember requesting the swap
  targetStaffId   String?  // StaffMember they want to swap with
  reason          String?
  status          SwapRequestStatus @default(PENDING_PEER)
  peerApprovedAt  DateTime? // When the target staff member agreed
  managerApprovedBy String? // Shift manager who approved
  managerApprovedAt DateTime?
  managerNotes    String?
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([eventId, status])
  @@index([requestorId])
  @@index([targetStaffId])
}

enum SwapRequestStatus {
  PENDING_PEER      // Waiting for target staff member to accept
  PEER_ACCEPTED     // Target agreed, waiting for manager approval
  PEER_DECLINED     // Target staff member declined
  PENDING_MANAGER   // Manager review required
  APPROVED          // Manager approved, shifts swapped
  DENIED            // Manager denied the swap
  CANCELLED         // Requestor cancelled
  EXPIRED           // Request expired without response
}

// ─── Interpreter Certification ──────────────────────────────────────────────

model InterpreterCertification {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  staffId         String   // StaffMember of role INTERPRETER
  fromLanguage    String   // ISO 639-1 code
  toLanguage      String   // ISO 639-1 code
  certLevel       CertificationLevel
  certBody        String   // "AIIC", "ITI", "ATA", "National Accreditation Board"
  certNumber      String?  // Certificate/license number
  issuedDate      DateTime @db.Date
  expiryDate      DateTime? @db.Date
  verificationUrl String?  // URL to verify certification
  documentUrl     String?  // Scanned certificate
  isVerified      Boolean  @default(false) // Admin has verified the certification
  verifiedBy      String?
  verifiedAt      DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([staffId, fromLanguage, toLanguage, certBody])
  @@index([staffId])
  @@index([fromLanguage, toLanguage])
}

enum CertificationLevel {
  TRAINEE       // In training, not yet certified
  ASSOCIATE     // Entry-level certified
  PROFESSIONAL  // Full professional certification
  CONFERENCE    // Conference-level (highest for simultaneous)
  MASTER        // Master interpreter, can lead teams
}

// ─── Media Pool Assignment ──────────────────────────────────────────────────

model MediaPoolAssignment {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  poolName        String   // "Photo Pool A", "TV Pool", "Print Press Pool"
  participantId   String   // Press/Media participant
  outlet          String   // Media outlet name
  mediaType       MediaType
  assignedDate    DateTime @db.Date
  zone            String?  // Specific zone or area access
  credentials     Json     @default("[]") // ["photo_vest", "camera_pass", "floor_access"]
  status          PoolStatus @default(ACTIVE)
  rotationOrder   Int?     // For rotating pool positions
  notes           String?
  assignedBy      String   // UserId of press officer
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([eventId, poolName])
  @@index([participantId])
  @@index([eventId, assignedDate])
}

enum MediaType {
  TELEVISION
  RADIO
  PRINT
  ONLINE
  PHOTO
  WIRE_SERVICE
  FREELANCE
}

enum PoolStatus {
  ACTIVE
  STANDBY
  ROTATED_OUT
  REVOKED
}
```

### 3.5 ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PEOPLE & WORKFORCE ER DIAGRAM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐          ┌──────────────────┐                        │
│  │     Tenant       │          │      Event       │                        │
│  │  ─────────────── │          │  ─────────────── │                        │
│  │  id              │──┐   ┌──│  id              │──┐                     │
│  │  name            │  │   │  │  name            │  │                     │
│  └──────────────────┘  │   │  └──────────────────┘  │                     │
│                        │   │                         │                     │
│    ┌───────────────────┴───┴─────────────────────────┤                     │
│    │                                                  │                     │
│    ▼                                                  ▼                     │
│  ┌──────────────────┐       1:N        ┌──────────────────┐               │
│  │   StaffMember    │─────────────────▶│    StaffShift    │               │
│  │  ─────────────── │                  │  ─────────────── │               │
│  │  id              │                  │  id              │               │
│  │  tenantId (FK)   │                  │  staffId (FK)    │               │
│  │  eventId (FK)    │       1:N        │  date            │               │
│  │  userId (FK?)    │─────────────┐    │  startTime       │               │
│  │  name            │             │    │  endTime         │               │
│  │  phone           │             │    │  zone            │               │
│  │  email           │             │    │  location        │               │
│  │  role (enum)     │             │    │  task            │               │
│  │  team            │             │    │  status (enum)   │               │
│  │  skills (JSON)   │             │    │  checkedInAt     │               │
│  │  status (enum)   │             │    │  checkedOutAt    │               │
│  │  badgeId         │             │    │  breakMinutes    │               │
│  └──┬───┬───┬───────┘             │    └──────────────────┘               │
│     │   │   │                     │                                        │
│     │   │   │  1:N                ▼                                        │
│     │   │   │         ┌──────────────────┐                                │
│     │   │   └────────▶│  StaffTaskLog    │                                │
│     │   │             │  ─────────────── │                                │
│     │   │             │  id              │                                │
│     │   │             │  staffId (FK)    │                                │
│     │   │             │  action          │                                │
│     │   │             │  metadata (JSON) │                                │
│     │   │             │  createdAt       │                                │
│     │   │             └──────────────────┘                                │
│     │   │                                                                  │
│     │   │  1:N        ┌──────────────────┐                                │
│     │   └────────────▶│ StaffEvaluation  │                                │
│     │                 │  ─────────────── │                                │
│     │                 │  id              │                                │
│     │                 │  staffId         │                                │
│     │                 │  evaluatorId     │                                │
│     │                 │  ratings (JSON)  │                                │
│     │                 │  overall         │                                │
│     │                 │  status (enum)   │                                │
│     │                 └──────────────────┘                                │
│     │                                                                      │
│     │  1:N  ┌──────────────────────────┐                                  │
│     └──────▶│ InterpreterCertification │                                  │
│             │  ─────────────────────── │                                  │
│             │  id                      │                                  │
│             │  staffId (FK)            │                                  │
│             │  fromLanguage            │                                  │
│             │  toLanguage              │                                  │
│             │  certLevel (enum)        │                                  │
│             │  certBody                │                                  │
│             │  expiryDate              │                                  │
│             └──────────────────────────┘                                  │
│                                                                             │
│  ┌──────────────────────┐    1:N     ┌────────────────────────┐           │
│  │ InterpretationService│───────────▶│ InterpreterAssignment  │           │
│  │  ──────────────────  │            │  ───────────────────── │           │
│  │  id                  │            │  id                    │           │
│  │  tenantId (FK)       │            │  serviceId (FK)        │           │
│  │  eventId (FK)        │            │  staffId (FK) ─────────┼──▶ StaffMember │
│  │  meetingId (FK)      │            │  startTime             │           │
│  │  fromLanguage        │            │  endTime               │           │
│  │  toLanguage          │            │  isLead                │           │
│  │  channelNumber       │            │  status                │           │
│  │  boothId (FK)────────┼──┐         └────────────────────────┘           │
│  │  status              │  │                                              │
│  └──────────────────────┘  │                                              │
│                            │                                              │
│                            ▼                                              │
│              ┌──────────────────────┐                                     │
│              │ InterpretationBooth  │                                     │
│              │  ─────────────────── │                                     │
│              │  id                  │      ┌──────────────────┐           │
│              │  tenantId            │      │  ReceiverHandset │           │
│              │  venueId (FK)        │      │  ─────────────── │           │
│              │  roomName            │      │  id              │           │
│              │  boothNumber         │      │  tenantId        │           │
│              │  languages (JSON)    │      │  eventId         │           │
│              │  capacity            │      │  serialNumber    │           │
│              │  equipment (JSON)    │      │  status          │           │
│              │  status              │      │  currentHolder   │           │
│              └──────────────────────┘      │  checkedOutAt    │           │
│                                            │  checkedInAt     │           │
│                                            └──────────────────┘           │
│                                                                             │
│  ┌──────────────────┐     1:N     ┌──────────────────────────┐           │
│  │ PressConference  │────────────▶│ PressConferenceSpeaker   │           │
│  │  ─────────────── │             │  ─────────────────────── │           │
│  │  id              │             │  id                      │           │
│  │  tenantId        │             │  pressConferenceId (FK)  │           │
│  │  eventId (FK)    │             │  participantId           │           │
│  │  title           │    1:N      │  name                    │           │
│  │  date            │────┐        │  title                   │           │
│  │  startTime       │    │        │  speakingOrder           │           │
│  │  endTime         │    │        │  topic                   │           │
│  │  roomId          │    │        └──────────────────────────┘           │
│  │  status          │    │                                               │
│  │  isPoolOnly      │    │        ┌──────────────────┐                   │
│  └──────────────────┘    └───────▶│  MediaAdvisory   │                   │
│                                    │  ─────────────── │                   │
│                                    │  id              │                   │
│  ┌──────────────────┐              │  tenantId        │                   │
│  │ InterviewRequest │              │  eventId         │                   │
│  │  ─────────────── │              │  pressConfId(FK?)│                   │
│  │  id              │              │  title           │                   │
│  │  tenantId        │              │  body            │                   │
│  │  eventId         │              │  embargoUntil    │                   │
│  │  requestorId     │              │  isPublished     │                   │
│  │  targetParticipant│             │  attachments     │                   │
│  │  targetDelegation│              │  distributedTo   │                   │
│  │  outlet          │              └──────────────────┘                   │
│  │  topic           │                                                     │
│  │  format          │              ┌──────────────────────┐              │
│  │  status          │              │ MediaPoolAssignment  │              │
│  │  scheduledTime   │              │  ─────────────────── │              │
│  │  scheduledLoc    │              │  id                  │              │
│  └──────────────────┘              │  eventId             │              │
│                                    │  poolName            │              │
│  ┌──────────────────────┐          │  participantId       │              │
│  │ VolunteerApplication │          │  outlet              │              │
│  │  ──────────────────  │          │  mediaType (enum)    │              │
│  │  id                  │          │  status (enum)       │              │
│  │  eventId (FK)        │          │  rotationOrder       │              │
│  │  applicantName       │          └──────────────────────┘              │
│  │  email               │                                                │
│  │  languages (JSON)    │          ┌──────────────────────┐              │
│  │  skills (JSON)       │          │  ShiftSwapRequest    │              │
│  │  availability (JSON) │          │  ─────────────────── │              │
│  │  preferredRoles      │          │  id                  │              │
│  │  status (enum)       │          │  requestorShiftId    │              │
│  │  staffMemberId ──────┼──▶ SM   │  targetShiftId       │              │
│  └──────────────────────┘          │  requestorId ────────┼──▶ SM       │
│                                    │  targetStaffId       │              │
│  ┌──────────────────────┐          │  status (enum)       │              │
│  │   TrainingRecord     │          │  managerApprovedBy   │              │
│  │  ──────────────────  │          └──────────────────────┘              │
│  │  id                  │                                                │
│  │  staffId (FK) ───────┼──▶ StaffMember                                │
│  │  trainingType (enum) │                                                │
│  │  title               │                                                │
│  │  completedDate       │                                                │
│  │  score               │                                                │
│  │  passed              │                                                │
│  └──────────────────────┘                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Index Catalog

| Table                      | Index Name                     | Columns                                         | Type   | Purpose                                    |
| -------------------------- | ------------------------------ | ----------------------------------------------- | ------ | ------------------------------------------ |
| `StaffMember`              | `idx_staff_event_role`         | `(eventId, role)`                               | B-tree | Filter staff by role within an event       |
| `StaffMember`              | `idx_staff_event_team`         | `(eventId, team)`                               | B-tree | Filter staff by team within an event       |
| `StaffMember`              | `idx_staff_status`             | `(status)`                                      | B-tree | Quick lookup of active/available staff     |
| `StaffShift`               | `idx_shift_staff_date`         | `(staffId, date)`                               | B-tree | Staff personal schedule lookup             |
| `StaffShift`               | `idx_shift_date_zone`          | `(date, zone)`                                  | B-tree | Coverage analysis per zone per day         |
| `StaffShift`               | `idx_shift_status`             | `(status)`                                      | B-tree | Filter by shift completion status          |
| `StaffTaskLog`             | `idx_tasklog_staff_time`       | `(staffId, createdAt)`                          | B-tree | Staff activity timeline                    |
| `StaffEvaluation`          | `idx_eval_staff_event`         | `(staffId, eventId)`                            | B-tree | Evaluation history per staff per event     |
| `StaffEvaluation`          | `idx_eval_evaluator`           | `(evaluatorId)`                                 | B-tree | Evaluations written by a manager           |
| `StaffEvaluation`          | `idx_eval_period`              | `(eventId, period)`                             | B-tree | Evaluations for a specific period          |
| `TrainingRecord`           | `idx_training_staff_event`     | `(staffId, eventId)`                            | B-tree | Training records per staff member          |
| `TrainingRecord`           | `idx_training_type`            | `(trainingType)`                                | B-tree | Filter by training category                |
| `TrainingRecord`           | `idx_training_completed`       | `(eventId, completedDate)`                      | B-tree | Recently completed trainings               |
| `VolunteerApplication`     | `idx_volunteer_event_status`   | `(eventId, status)`                             | B-tree | Filter applications by status              |
| `VolunteerApplication`     | `idx_volunteer_email`          | `(email)`                                       | B-tree | Lookup by applicant email                  |
| `ShiftSwapRequest`         | `idx_swap_event_status`        | `(eventId, status)`                             | B-tree | Pending swaps per event                    |
| `ShiftSwapRequest`         | `idx_swap_requestor`           | `(requestorId)`                                 | B-tree | Swaps requested by a staff member          |
| `ShiftSwapRequest`         | `idx_swap_target`              | `(targetStaffId)`                               | B-tree | Swap requests targeting a staff member     |
| `InterpretationService`    | `uq_interp_meeting_lang`       | `(meetingId, fromLanguage, toLanguage)`         | Unique | One service per language pair per meeting  |
| `InterpretationService`    | `idx_interp_event_meeting`     | `(eventId, meetingId)`                          | B-tree | Services for a specific meeting            |
| `InterpreterAssignment`    | `idx_assign_staff_time`        | `(staffId, startTime)`                          | B-tree | Interpreter schedule lookup                |
| `InterpreterAssignment`    | `idx_assign_service`           | `(serviceId)`                                   | B-tree | Assignments for a service                  |
| `InterpretationBooth`      | `uq_booth_venue_room_num`      | `(venueId, roomName, boothNumber)`              | Unique | One booth per number per room              |
| `ReceiverHandset`          | `uq_receiver_serial`           | `(serialNumber)`                                | Unique | Unique serial number per handset           |
| `ReceiverHandset`          | `idx_receiver_event_status`    | `(eventId, status)`                             | B-tree | Available receivers per event              |
| `InterpreterCertification` | `uq_cert_staff_lang_body`      | `(staffId, fromLanguage, toLanguage, certBody)` | Unique | One cert per interpreter per pair per body |
| `InterpreterCertification` | `idx_cert_staff`               | `(staffId)`                                     | B-tree | All certs for an interpreter               |
| `InterpreterCertification` | `idx_cert_languages`           | `(fromLanguage, toLanguage)`                    | B-tree | Find certified interpreters by pair        |
| `PressConference`          | `idx_press_event_date`         | `(eventId, date)`                               | B-tree | Press conferences per event per day        |
| `PressConferenceSpeaker`   | `idx_speaker_conference`       | `(pressConferenceId)`                           | B-tree | Speakers for a conference                  |
| `InterviewRequest`         | `idx_interview_event_status`   | `(eventId, status)`                             | B-tree | Filter interview requests by status        |
| `InterviewRequest`         | `idx_interview_delegation`     | `(targetDelegation)`                            | B-tree | Requests targeting a delegation            |
| `InterviewRequest`         | `idx_interview_requestor`      | `(requestorId)`                                 | B-tree | Requests from a specific journalist        |
| `MediaAdvisory`            | `idx_advisory_event_published` | `(eventId, isPublished)`                        | B-tree | Published/unpublished advisories           |
| `MediaAdvisory`            | `idx_advisory_embargo`         | `(embargoUntil)`                                | B-tree | Upcoming embargo lifts for scheduler       |
| `MediaPoolAssignment`      | `idx_pool_event_name`          | `(eventId, poolName)`                           | B-tree | Members of a specific pool                 |
| `MediaPoolAssignment`      | `idx_pool_participant`         | `(participantId)`                               | B-tree | Pool assignments for a journalist          |
| `MediaPoolAssignment`      | `idx_pool_event_date`          | `(eventId, assignedDate)`                       | B-tree | Pool assignments per day                   |

---

## 4. API Specification

All endpoints are scoped under `/api/events/:eventId` and require tenant context via middleware. Authentication and authorization are handled by Module 05. All responses follow the standard envelope format `{ data, meta, errors }`.

### 4.1 Staff Management APIs

#### `POST /api/events/:eventId/staff`

Create a new staff member.

**Request:**

```typescript
interface CreateStaffRequest {
  name: string;
  phone: string;
  email?: string;
  photo?: string; // Base64 or Azure Blob URL
  role: StaffRole; // "COORDINATOR" | "USHER" | "INTERPRETER" | ...
  team?: string; // "Registration Team A", "VIP Protocol"
  skills?: string[]; // ["French", "Arabic", "First Aid"]
  badgeId?: string; // Link to existing badge
  userId?: string; // Link to User for system access
  notes?: string;
}
```

**Response: `201 Created`**

```typescript
interface StaffMemberResponse {
  data: {
    id: string;
    tenantId: string;
    eventId: string;
    name: string;
    phone: string;
    email: string | null;
    photo: string | null;
    role: StaffRole;
    team: string | null;
    skills: string[];
    status: StaffStatus; // Defaults to OFF_DUTY
    badgeId: string | null;
    userId: string | null;
    notes: string | null;
    createdAt: string; // ISO 8601
    updatedAt: string;
  };
}
```

**Validation (Zod):**

```typescript
const createStaffSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  email: z.string().email().optional(),
  photo: z.string().url().optional(),
  role: z.nativeEnum(StaffRole),
  team: z.string().max(100).optional(),
  skills: z.array(z.string().max(50)).max(20).optional().default([]),
  badgeId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  notes: z.string().max(2000).optional(),
});
```

#### `GET /api/events/:eventId/staff`

List staff members with filtering and pagination.

**Query Parameters:**

```typescript
interface ListStaffParams {
  role?: StaffRole; // Filter by role
  team?: string; // Filter by team name
  status?: StaffStatus; // Filter by current status
  skill?: string; // Filter by skill (partial match)
  search?: string; // Search name, email, phone
  page?: number; // Default: 1
  pageSize?: number; // Default: 50, max: 200
  sortBy?: "name" | "role" | "team" | "status" | "createdAt";
  sortOrder?: "asc" | "desc"; // Default: "asc"
}
```

**Response: `200 OK`**

```typescript
interface ListStaffResponse {
  data: StaffMemberResponse["data"][];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
```

#### `GET /api/events/:eventId/staff/:staffId`

Get a single staff member with their current shift and recent task logs.

**Response: `200 OK`**

```typescript
interface StaffDetailResponse {
  data: StaffMemberResponse["data"] & {
    currentShift: {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      zone: string | null;
      location: string | null;
      task: string | null;
      status: ShiftStatus;
      checkedInAt: string | null;
      checkedOutAt: string | null;
      breakMinutes: number;
    } | null;
    recentTasks: {
      id: string;
      action: string;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }[];
    shiftCount: number; // Total shifts for this event
    totalHours: number; // Total worked hours
    evaluationAvg: number | null; // Average evaluation score
  };
}
```

#### `PATCH /api/events/:eventId/staff/:staffId`

Update a staff member.

**Request:**

```typescript
interface UpdateStaffRequest {
  name?: string;
  phone?: string;
  email?: string;
  photo?: string;
  role?: StaffRole;
  team?: string;
  skills?: string[];
  status?: StaffStatus;
  badgeId?: string;
  notes?: string;
}
```

**Response: `200 OK`** -- Returns updated `StaffMemberResponse`.

#### `DELETE /api/events/:eventId/staff/:staffId`

Soft-delete a staff member. Fails if staff has active shifts.

**Response: `204 No Content`**

#### `POST /api/events/:eventId/staff/:staffId/check-in`

Check in a staff member to their current shift.

**Request:**

```typescript
interface CheckInRequest {
  shiftId: string; // Which shift to check into
  method: "BADGE_SCAN" | "MANUAL" | "MOBILE_APP";
  location?: string; // GPS coordinates or zone terminal ID
}
```

**Response: `200 OK`**

```typescript
interface CheckInResponse {
  data: {
    shiftId: string;
    staffId: string;
    status: "CHECKED_IN";
    checkedInAt: string;
    isLate: boolean; // true if > 15 min past shift start
    lateMinutes: number; // minutes late (0 if on time)
    staffStatus: "ACTIVE"; // StaffMember.status updated
  };
}
```

#### `POST /api/events/:eventId/staff/:staffId/check-out`

Check out a staff member from their current shift.

**Request:**

```typescript
interface CheckOutRequest {
  shiftId: string;
  method: "BADGE_SCAN" | "MANUAL" | "MOBILE_APP";
  notes?: string;
}
```

**Response: `200 OK`**

```typescript
interface CheckOutResponse {
  data: {
    shiftId: string;
    staffId: string;
    status: "CHECKED_OUT";
    checkedOutAt: string;
    totalHours: number; // Actual hours worked
    scheduledHours: number; // Expected hours
    breakMinutes: number;
    isOvertime: boolean; // actual > scheduled
    overtimeMinutes: number;
    staffStatus: "OFF_DUTY";
  };
}
```

#### `POST /api/events/:eventId/staff/:staffId/break`

Start or end a break for a staff member.

**Request:**

```typescript
interface BreakRequest {
  action: "START" | "END";
  shiftId: string;
}
```

**Response: `200 OK`**

```typescript
interface BreakResponse {
  data: {
    shiftId: string;
    staffId: string;
    breakAction: "START" | "END";
    staffStatus: "ON_BREAK" | "ACTIVE";
    breakStartedAt: string | null;
    totalBreakMinutes: number;
    maxBreakMinutes: number; // Configured limit
  };
}
```

#### `POST /api/events/:eventId/staff/:staffId/tasks`

Log a task performed by a staff member.

**Request:**

```typescript
interface LogTaskRequest {
  action: string; // "processed_participant", "escorted_vip"
  metadata?: Record<string, unknown>;
}
```

**Response: `201 Created`**

```typescript
interface TaskLogResponse {
  data: {
    id: string;
    staffId: string;
    action: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
}
```

#### `GET /api/events/:eventId/staff/:staffId/performance`

Get performance metrics for a staff member.

**Query Parameters:**

```typescript
interface PerformanceParams {
  dateFrom?: string; // ISO date
  dateTo?: string;
  period?: "daily" | "weekly" | "event";
}
```

**Response: `200 OK`**

```typescript
interface PerformanceResponse {
  data: {
    staffId: string;
    staffName: string;
    role: StaffRole;
    period: { from: string; to: string };
    metrics: {
      totalShifts: number;
      totalHoursWorked: number;
      totalBreakMinutes: number;
      punctualityRate: number; // % of shifts checked in on time
      attendanceRate: number; // % of shifts not NO_SHOW
      tasksCompleted: number;
      avgTaskDuration: number | null; // minutes, if tracked in metadata
      overtimeHours: number;
    };
    roleMetrics?: {
      // Registration clerks
      participantsProcessed?: number;
      avgProcessingTime?: number;
      // Validators
      approvalsCount?: number;
      rejectionsCount?: number;
      avgReviewTime?: number;
      slaCompliance?: number;
    };
    evaluations: {
      count: number;
      averageOverall: number | null;
      latestRatings: Record<string, number> | null;
    };
  };
}
```

### 4.2 Shift Management APIs

#### `POST /api/events/:eventId/shifts`

Create a shift assignment.

**Request:**

```typescript
interface CreateShiftRequest {
  staffId: string;
  date: string; // ISO date: "2026-02-10"
  startTime: string; // ISO datetime: "2026-02-10T06:00:00Z"
  endTime: string;
  zone?: string;
  location?: string;
  task?: string;
  notes?: string;
}
```

**Response: `201 Created`**

```typescript
interface ShiftResponse {
  data: {
    id: string;
    staffId: string;
    staffName: string;
    date: string;
    startTime: string;
    endTime: string;
    zone: string | null;
    location: string | null;
    task: string | null;
    status: ShiftStatus;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    breakMinutes: number;
    notes: string | null;
    conflicts: ShiftConflict[]; // Any detected conflicts
    createdAt: string;
  };
}

interface ShiftConflict {
  type: "DOUBLE_BOOKING" | "INSUFFICIENT_REST" | "MAX_HOURS_EXCEEDED";
  message: string;
  conflictingShiftId?: string;
}
```

**Validation (Zod):**

```typescript
const createShiftSchema = z
  .object({
    staffId: z.string().cuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    zone: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    task: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "endTime must be after startTime",
  });
```

#### `GET /api/events/:eventId/shifts`

List shifts with filtering. Used by the scheduling interface.

**Query Parameters:**

```typescript
interface ListShiftsParams {
  date?: string; // Filter by date
  dateFrom?: string; // Date range start
  dateTo?: string; // Date range end
  staffId?: string; // Shifts for a specific staff member
  zone?: string; // Filter by zone
  team?: string; // Filter by staff member's team
  status?: ShiftStatus; // Filter by status
  page?: number;
  pageSize?: number; // Default: 100
}
```

**Response: `200 OK`**

```typescript
interface ListShiftsResponse {
  data: ShiftResponse["data"][];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    coverageGaps: CoverageGap[]; // Detected gaps for the queried period
  };
}

interface CoverageGap {
  zone: string;
  date: string;
  gapStart: string; // ISO datetime
  gapEnd: string;
  requiredStaff: number; // Minimum needed
  assignedStaff: number; // Currently assigned (0 for full gaps)
  suggestedStaff: {
    staffId: string;
    name: string;
    isAvailable: boolean;
    matchingSkills: string[];
  }[];
}
```

#### `POST /api/events/:eventId/shifts/auto-schedule`

Run the auto-scheduling algorithm for a date range and zone.

**Request:**

```typescript
interface AutoScheduleRequest {
  dateFrom: string;
  dateTo: string;
  zones?: string[]; // Specific zones, or all if omitted
  teams?: string[]; // Specific teams to schedule
  maxHoursPerDay: number; // Default: 10
  maxHoursPerWeek: number; // Default: 48
  minRestHours: number; // Default: 8 (between shifts)
  breakInterval: number; // Minutes between breaks, default: 240
  breakDuration: number; // Break duration in minutes, default: 30
  dryRun: boolean; // If true, return plan without creating shifts
}
```

**Response: `200 OK`**

```typescript
interface AutoScheduleResponse {
  data: {
    shiftsCreated: number; // 0 if dryRun
    shiftsPlanned: ShiftResponse["data"][];
    coverageGaps: CoverageGap[];
    conflicts: ShiftConflict[];
    stats: {
      staffUtilized: number;
      avgHoursPerStaff: number;
      maxHoursAssigned: number;
      minHoursAssigned: number;
      zonesFullyCovered: number;
      zonesPartiallyCovered: number;
      zonesUncovered: number;
    };
  };
}
```

#### `POST /api/events/:eventId/shifts/swap-request`

Request a shift swap between two staff members.

**Request:**

```typescript
interface ShiftSwapRequestBody {
  requestorShiftId: string; // Shift to give away
  targetStaffId?: string; // Who to swap with (null = open request)
  targetShiftId?: string; // Specific shift to take
  reason?: string;
}
```

**Response: `201 Created`**

```typescript
interface ShiftSwapResponse {
  data: {
    id: string;
    requestorShiftId: string;
    targetShiftId: string | null;
    requestorId: string;
    requestorName: string;
    targetStaffId: string | null;
    targetStaffName: string | null;
    reason: string | null;
    status: SwapRequestStatus;
    createdAt: string;
  };
}
```

#### `PATCH /api/events/:eventId/shifts/swap-request/:swapId`

Respond to a shift swap request (peer acceptance or manager approval).

**Request:**

```typescript
interface SwapResponseBody {
  action: "PEER_ACCEPT" | "PEER_DECLINE" | "MANAGER_APPROVE" | "MANAGER_DENY" | "CANCEL";
  notes?: string;
}
```

**Response: `200 OK`** -- Returns updated `ShiftSwapResponse`.

#### `GET /api/events/:eventId/shifts/coverage`

Analyze coverage for a date/zone combination.

**Query Parameters:**

```typescript
interface CoverageParams {
  date: string;
  zone?: string; // Specific zone or all
  includeAvailable?: boolean; // Include available staff suggestions
}
```

**Response: `200 OK`**

```typescript
interface CoverageResponse {
  data: {
    date: string;
    zones: {
      zone: string;
      timeBlocks: {
        start: string;
        end: string;
        assignedStaff: { staffId: string; name: string; role: StaffRole }[];
        requiredCount: number;
        isCovered: boolean;
        gap: boolean;
      }[];
    }[];
    summary: {
      totalZones: number;
      coveredZones: number;
      gapCount: number;
      understaffedCount: number;
    };
  };
}
```

### 4.3 Interpretation Service APIs

#### `POST /api/events/:eventId/interpretation/services`

Create an interpretation service for a meeting and language pair.

**Request:**

```typescript
interface CreateInterpretationServiceRequest {
  meetingId: string;
  fromLanguage: string; // ISO 639-1 code
  toLanguage: string;
  channelNumber: number;
  boothId?: string;
  notes?: string;
}
```

**Response: `201 Created`**

```typescript
interface InterpretationServiceResponse {
  data: {
    id: string;
    tenantId: string;
    eventId: string;
    meetingId: string;
    meetingTitle: string;
    fromLanguage: string;
    toLanguage: string;
    languagePairLabel: string; // "English -> French"
    channelNumber: number;
    boothId: string | null;
    boothInfo: {
      id: string;
      roomName: string;
      boothNumber: number;
    } | null;
    status: string;
    assignments: InterpreterAssignmentData[];
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

interface InterpreterAssignmentData {
  id: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  isLead: boolean;
  status: string;
}
```

#### `GET /api/events/:eventId/interpretation/services`

List interpretation services with filtering.

**Query Parameters:**

```typescript
interface ListInterpretationParams {
  meetingId?: string;
  fromLanguage?: string;
  toLanguage?: string;
  status?: string;
  date?: string; // Filter by meeting date
  page?: number;
  pageSize?: number;
}
```

**Response: `200 OK`** -- Returns paginated `InterpretationServiceResponse[]`.

#### `POST /api/events/:eventId/interpretation/services/:serviceId/assign`

Assign interpreters to a service with fatigue rotation.

**Request:**

```typescript
interface AssignInterpretersRequest {
  interpreterIds: string[]; // StaffMember IDs (role = INTERPRETER)
  rotationIntervalMinutes: number; // Default: 30
  autoRotate: boolean; // Auto-generate rotation blocks
}
```

**Response: `201 Created`**

```typescript
interface AssignInterpretersResponse {
  data: {
    serviceId: string;
    assignments: InterpreterAssignmentData[];
    rotation: {
      totalBlocks: number;
      intervalMinutes: number;
      interpretersUsed: number;
    };
    warnings: string[]; // "Interpreter X has only 20min rest before next session"
  };
}
```

#### `POST /api/events/:eventId/interpretation/auto-assign`

Auto-assign interpreters for all services in a meeting or date range.

**Request:**

```typescript
interface AutoAssignRequest {
  meetingId?: string; // Specific meeting
  date?: string; // All meetings on a date
  rotationIntervalMinutes: number;
  minRestBetweenBlocks: number; // Minutes, default: 30
  preferCertified: boolean; // Prioritize certified interpreters
  dryRun: boolean;
}
```

**Response: `200 OK`**

```typescript
interface AutoAssignResponse {
  data: {
    servicesProcessed: number;
    assignmentsCreated: number;
    unassignableGaps: {
      serviceId: string;
      fromLanguage: string;
      toLanguage: string;
      meetingTitle: string;
      blockStart: string;
      blockEnd: string;
      reason: string; // "No certified AR->PT interpreter available"
    }[];
    stats: {
      interpretersUtilized: number;
      avgBlocksPerInterpreter: number;
      maxConsecutiveBlocks: number;
      totalRotationBlocks: number;
    };
  };
}
```

#### `GET /api/events/:eventId/interpretation/booths`

List interpretation booths for the event venue.

**Response: `200 OK`**

```typescript
interface BoothListResponse {
  data: {
    id: string;
    venueId: string;
    roomName: string;
    boothNumber: number;
    languages: string[];
    capacity: number;
    equipment: string[];
    status: string;
    currentServices: {
      serviceId: string;
      fromLanguage: string;
      toLanguage: string;
      meetingTitle: string;
      startTime: string;
      endTime: string;
    }[];
  }[];
}
```

#### `POST /api/events/:eventId/receivers/:serialNumber/check-out`

Check out a receiver handset to a participant.

**Request:**

```typescript
interface ReceiverCheckOutRequest {
  participantId: string;
  preferredLanguage?: string; // Auto-detected from registration
}
```

**Response: `200 OK`**

```typescript
interface ReceiverCheckOutResponse {
  data: {
    id: string;
    serialNumber: string;
    status: "CHECKED_OUT";
    currentHolder: string;
    participantName: string;
    preferredLanguage: string;
    checkedOutAt: string;
    channelSuggestion: number; // Suggested channel for their language
  };
}
```

#### `POST /api/events/:eventId/receivers/:serialNumber/check-in`

Return a receiver handset.

**Response: `200 OK`**

```typescript
interface ReceiverCheckInResponse {
  data: {
    id: string;
    serialNumber: string;
    status: "AVAILABLE";
    previousHolder: string;
    checkedInAt: string;
    sessionDuration: number; // Minutes the handset was out
  };
}
```

#### `GET /api/events/:eventId/receivers/dashboard`

Get receiver handset dashboard data.

**Response: `200 OK`**

```typescript
interface ReceiverDashboardResponse {
  data: {
    total: number;
    checkedOut: number;
    available: number;
    charging: number;
    lost: number;
    damaged: number;
    lostCost: number; // total lost x cost per unit
    costPerUnit: number;
    overdueReturns: {
      serialNumber: string;
      participantId: string;
      participantName: string;
      checkedOutAt: string;
      hoursOverdue: number;
    }[];
    utilizationRate: number; // checkedOut / total
  };
}
```

#### `GET /api/events/:eventId/interpretation/costs`

Get interpretation cost summary.

**Response: `200 OK`**

```typescript
interface InterpretationCostResponse {
  data: {
    languagePairs: {
      fromLanguage: string;
      toLanguage: string;
      label: string; // "EN -> FR"
      totalHours: number;
      ratePerHour: number;
      sessionCount: number;
      totalCost: number;
    }[];
    equipmentCosts: {
      item: string; // "Booth rental", "Receiver handsets"
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[];
    summary: {
      totalInterpretationCost: number;
      totalEquipmentCost: number;
      grandTotal: number;
    };
  };
}
```

### 4.4 Media Operations APIs

#### `POST /api/events/:eventId/press/conferences`

Create a press conference.

**Request:**

```typescript
interface CreatePressConferenceRequest {
  title: string;
  description?: string;
  date: string; // ISO date
  startTime: string; // ISO datetime
  endTime: string;
  roomId?: string;
  isPoolOnly: boolean;
  speakers: {
    participantId?: string;
    name: string;
    title: string;
    speakingOrder: number;
    topic?: string;
    biography?: string;
    photoUrl?: string;
  }[];
}
```

**Response: `201 Created`**

```typescript
interface PressConferenceResponse {
  data: {
    id: string;
    tenantId: string;
    eventId: string;
    title: string;
    description: string | null;
    date: string;
    startTime: string;
    endTime: string;
    roomId: string | null;
    roomName: string | null;
    status: string;
    isPoolOnly: boolean;
    speakers: {
      id: string;
      participantId: string | null;
      name: string;
      title: string;
      speakingOrder: number;
      topic: string | null;
      biography: string | null;
      photoUrl: string | null;
    }[];
    mediaAdvisories: {
      id: string;
      title: string;
      isPublished: boolean;
      embargoUntil: string | null;
    }[];
    createdAt: string;
    updatedAt: string;
  };
}
```

**Validation (Zod):**

```typescript
const createPressConferenceSchema = z
  .object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    roomId: z.string().cuid().optional(),
    isPoolOnly: z.boolean().default(false),
    speakers: z
      .array(
        z.object({
          participantId: z.string().cuid().optional(),
          name: z.string().min(1).max(255),
          title: z.string().min(1).max(500),
          speakingOrder: z.number().int().min(1),
          topic: z.string().max(500).optional(),
          biography: z.string().max(5000).optional(),
          photoUrl: z.string().url().optional(),
        }),
      )
      .min(1),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "endTime must be after startTime",
  });
```

#### `GET /api/events/:eventId/press/conferences`

List press conferences with filtering.

**Query Parameters:**

```typescript
interface ListPressConferenceParams {
  date?: string;
  status?: string;
  isPoolOnly?: boolean;
  page?: number;
  pageSize?: number;
}
```

**Response: `200 OK`** -- Returns paginated `PressConferenceResponse[]`.

#### `POST /api/events/:eventId/press/interviews`

Submit an interview request (typically by a journalist).

**Request:**

```typescript
interface CreateInterviewRequest {
  targetParticipantId?: string;
  targetDelegation?: string;
  outlet: string;
  topic: string;
  preferredDate?: string;
  preferredDuration?: number; // Minutes
  format: "IN_PERSON" | "PHONE" | "VIDEO" | "WRITTEN";
  notes?: string;
}
```

**Response: `201 Created`**

```typescript
interface InterviewRequestResponse {
  data: {
    id: string;
    tenantId: string;
    eventId: string;
    requestorId: string;
    requestorName: string;
    requestorOutlet: string;
    targetParticipantId: string | null;
    targetParticipantName: string | null;
    targetDelegation: string | null;
    outlet: string;
    topic: string;
    preferredDate: string | null;
    preferredDuration: number | null;
    format: string;
    status: string;
    forwardedTo: string | null;
    respondedBy: string | null;
    respondedAt: string | null;
    scheduledTime: string | null;
    scheduledLocation: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
```

#### `PATCH /api/events/:eventId/press/interviews/:interviewId`

Update interview request status (approve, decline, schedule, forward).

**Request:**

```typescript
interface UpdateInterviewRequest {
  action: "FORWARD" | "APPROVE" | "DECLINE" | "SCHEDULE" | "COMPLETE" | "CANCEL";
  forwardedTo?: string; // userId of focal point
  scheduledTime?: string; // Required when action = SCHEDULE
  scheduledLocation?: string;
  notes?: string;
}
```

**Response: `200 OK`** -- Returns updated `InterviewRequestResponse`.

#### `POST /api/events/:eventId/press/advisories`

Create a media advisory.

**Request:**

```typescript
interface CreateMediaAdvisoryRequest {
  pressConferenceId?: string;
  title: string;
  body: string; // Rich text / markdown
  embargoUntil?: string; // ISO datetime, null = immediate release
  attachments?: { name: string; url: string }[];
  distributedTo?: string[]; // ["all_media"] or specific participant IDs
}
```

**Response: `201 Created`**

```typescript
interface MediaAdvisoryResponse {
  data: {
    id: string;
    tenantId: string;
    eventId: string;
    pressConferenceId: string | null;
    title: string;
    body: string;
    embargoUntil: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    attachments: { name: string; url: string }[];
    distributedTo: string[];
    recipientCount: number; // Resolved count of recipients
    createdAt: string;
    updatedAt: string;
  };
}
```

**Validation (Zod):**

```typescript
const createMediaAdvisorySchema = z
  .object({
    pressConferenceId: z.string().cuid().optional(),
    title: z.string().min(1).max(500),
    body: z.string().min(1).max(50000),
    embargoUntil: z.string().datetime().optional(),
    attachments: z
      .array(
        z.object({
          name: z.string().min(1).max(255),
          url: z.string().url(),
        }),
      )
      .max(20)
      .optional()
      .default([]),
    distributedTo: z.array(z.string()).optional().default(["all_media"]),
  })
  .refine((data) => !data.embargoUntil || new Date(data.embargoUntil) > new Date(), {
    message: "embargoUntil must be in the future",
  });
```

#### `POST /api/events/:eventId/press/advisories/:advisoryId/publish`

Manually publish an advisory (overrides embargo).

**Response: `200 OK`**

```typescript
interface PublishAdvisoryResponse {
  data: {
    id: string;
    isPublished: true;
    publishedAt: string;
    embargoOverridden: boolean; // true if published before embargoUntil
    notificationsSent: number; // Count of email notifications queued
  };
}
```

#### `POST /api/events/:eventId/media/pools`

Create a media pool.

**Request:**

```typescript
interface CreateMediaPoolRequest {
  poolName: string;
  members: {
    participantId: string;
    outlet: string;
    mediaType: MediaType;
    zone?: string;
    credentials?: string[];
    rotationOrder?: number;
  }[];
  assignedDate: string;
}
```

**Response: `201 Created`**

```typescript
interface MediaPoolResponse {
  data: {
    poolName: string;
    assignedDate: string;
    members: {
      id: string;
      participantId: string;
      participantName: string;
      outlet: string;
      mediaType: MediaType;
      zone: string | null;
      credentials: string[];
      status: PoolStatus;
      rotationOrder: number | null;
    }[];
    totalMembers: number;
  };
}
```

### 4.5 SSE Events

Staff and workforce SSE events are pushed to connected clients for real-time dashboard updates.

**Endpoint:** `GET /api/events/:eventId/people/stream`

```typescript
// Staff status changes
interface StaffStatusEvent {
  type: "staff.status_changed";
  data: {
    staffId: string;
    staffName: string;
    previousStatus: StaffStatus;
    newStatus: StaffStatus;
    zone: string | null;
    timestamp: string;
  };
}

// Shift check-in/out
interface ShiftCheckEvent {
  type: "shift.checked_in" | "shift.checked_out" | "shift.no_show";
  data: {
    shiftId: string;
    staffId: string;
    staffName: string;
    zone: string | null;
    location: string | null;
    isLate?: boolean;
    lateMinutes?: number;
    timestamp: string;
  };
}

// Coverage gap detected
interface CoverageGapEvent {
  type: "coverage.gap_detected" | "coverage.gap_filled";
  data: {
    zone: string;
    date: string;
    gapStart: string;
    gapEnd: string;
    assignedStaff?: string; // For gap_filled
    timestamp: string;
  };
}

// Shift swap events
interface ShiftSwapEvent {
  type: "swap.requested" | "swap.peer_accepted" | "swap.approved" | "swap.denied";
  data: {
    swapId: string;
    requestorId: string;
    requestorName: string;
    targetStaffId: string | null;
    targetStaffName: string | null;
    status: SwapRequestStatus;
    timestamp: string;
  };
}

// Interpreter rotation
interface InterpreterRotationEvent {
  type: "interpreter.rotation_due" | "interpreter.rotated";
  data: {
    serviceId: string;
    boothId: string | null;
    fromLanguage: string;
    toLanguage: string;
    outgoingInterpreter: string;
    incomingInterpreter: string;
    rotationTime: string;
  };
}

// Receiver handset events
interface ReceiverEvent {
  type: "receiver.checked_out" | "receiver.returned" | "receiver.overdue";
  data: {
    serialNumber: string;
    participantId: string | null;
    participantName: string | null;
    status: string;
    timestamp: string;
  };
}

// Interview request status changes
interface InterviewStatusEvent {
  type:
    | "interview.submitted"
    | "interview.forwarded"
    | "interview.approved"
    | "interview.declined"
    | "interview.scheduled";
  data: {
    interviewId: string;
    requestorName: string;
    outlet: string;
    targetDelegation: string | null;
    status: string;
    timestamp: string;
  };
}

// Embargo lift
interface EmbargoEvent {
  type: "advisory.embargo_lifted" | "advisory.published";
  data: {
    advisoryId: string;
    title: string;
    recipientCount: number;
    publishedAt: string;
  };
}
```

### 4.6 Webhook Events

External systems can subscribe to these webhook events for integration.

```typescript
// Webhook payload envelope
interface WebhookPayload<T> {
  webhookId: string;
  eventType: string;
  tenantId: string;
  eventId: string;
  timestamp: string;
  data: T;
}

// Available webhook events
type PeopleWebhookEvents =
  | "people.staff.created"
  | "people.staff.updated"
  | "people.staff.deleted"
  | "people.shift.created"
  | "people.shift.checked_in"
  | "people.shift.checked_out"
  | "people.shift.no_show"
  | "people.shift.swap_approved"
  | "people.volunteer.applied"
  | "people.volunteer.accepted"
  | "people.volunteer.declined"
  | "people.interpreter.assigned"
  | "people.interpreter.rotated"
  | "people.receiver.checked_out"
  | "people.receiver.lost"
  | "people.press.conference_created"
  | "people.press.conference_started"
  | "people.press.conference_completed"
  | "people.interview.submitted"
  | "people.interview.approved"
  | "people.interview.declined"
  | "people.interview.scheduled"
  | "people.advisory.published"
  | "people.advisory.embargo_lifted"
  | "people.pool.assignment_created"
  | "people.pool.assignment_revoked";

// Example webhook for shift check-in
interface ShiftCheckedInWebhook {
  webhookId: string;
  eventType: "people.shift.checked_in";
  tenantId: string;
  eventId: string;
  timestamp: string;
  data: {
    shiftId: string;
    staffId: string;
    staffName: string;
    role: StaffRole;
    zone: string | null;
    location: string | null;
    checkedInAt: string;
    isLate: boolean;
    scheduledStart: string;
  };
}

// Example webhook for embargo lift
interface EmbargoLiftedWebhook {
  webhookId: string;
  eventType: "people.advisory.embargo_lifted";
  tenantId: string;
  eventId: string;
  timestamp: string;
  data: {
    advisoryId: string;
    title: string;
    embargoUntil: string;
    publishedAt: string;
    recipientCount: number;
    attachmentCount: number;
  };
}
```

---

## 5. Business Logic

### 5.1 Shift Scheduling Algorithm

The shift scheduling algorithm handles automatic distribution of staff across zones, locations, and time blocks. It uses a constraint-based greedy approach with backtracking for conflict resolution.

**Key scheduling features from the source design:**

- Drag-and-drop shift blocks on a timeline (same `@dnd-kit` used in form designer)
- **Coverage gap detection**: system highlights time/zone combinations with no assigned staff
- **Conflict detection**: warn if a staff member is double-booked
- **Skill filter**: when filling a gap at the Interpretation Booth, filter to staff with French language skill
- **Auto-schedule**: algorithm distributes shifts evenly across available staff, respecting maximum hours and required breaks
- **Shift swap**: staff can request to swap shifts with each other, pending manager approval

**Auto-Scheduling Algorithm Implementation:**

```typescript
// ─── Types ──────────────────────────────────────────────────────────────

interface ScheduleRequirement {
  zone: string;
  location?: string;
  task?: string;
  date: string; // ISO date
  startTime: Date;
  endTime: Date;
  requiredCount: number; // How many staff needed
  requiredSkills?: string[]; // Skills needed for this position
  requiredRoles?: StaffRole[]; // Acceptable roles
  priority: number; // 1 = critical, 2 = important, 3 = optional
}

interface StaffAvailability {
  staffId: string;
  name: string;
  role: StaffRole;
  skills: string[];
  team: string | null;
  existingShifts: { startTime: Date; endTime: Date }[];
  totalHoursToday: number;
  totalHoursThisWeek: number;
  lastShiftEndTime: Date | null;
}

interface ScheduleConfig {
  maxHoursPerDay: number; // Default: 10
  maxHoursPerWeek: number; // Default: 48
  minRestHoursBetweenDays: number; // Default: 8
  breakIntervalMinutes: number; // Default: 240 (every 4 hours)
  breakDurationMinutes: number; // Default: 30
  balanceHoursAcrossStaff: boolean; // Default: true
}

interface ScheduleResult {
  assignments: {
    staffId: string;
    requirement: ScheduleRequirement;
    shiftStart: Date;
    shiftEnd: Date;
    breakStart?: Date;
    breakEnd?: Date;
  }[];
  unmetRequirements: ScheduleRequirement[];
  conflicts: ShiftConflict[];
  stats: {
    staffUtilized: number;
    avgHoursPerStaff: number;
    coveragePercentage: number;
  };
}

// ─── Algorithm ──────────────────────────────────────────────────────────

async function autoSchedule(
  eventId: string,
  requirements: ScheduleRequirement[],
  config: ScheduleConfig,
  prisma: PrismaClient,
): Promise<ScheduleResult> {
  // Step 1: Load available staff and their current commitments
  const staff = await loadStaffAvailability(eventId, requirements, prisma);

  // Step 2: Sort requirements by constraint tightness
  //   - Fewer qualified staff = tighter constraint = schedule first
  //   - Higher priority requirements first
  const sortedRequirements = sortByConstraintTightness(requirements, staff);

  // Step 3: Build assignment plan using greedy algorithm with backtracking
  const assignments: ScheduleResult["assignments"] = [];
  const unmetRequirements: ScheduleRequirement[] = [];

  for (const requirement of sortedRequirements) {
    const candidates = findEligibleStaff(requirement, staff, config);

    if (candidates.length === 0) {
      unmetRequirements.push(requirement);
      continue;
    }

    // Sort candidates by hours balance (least hours first for fairness)
    if (config.balanceHoursAcrossStaff) {
      candidates.sort((a, b) => a.totalHoursThisWeek - b.totalHoursThisWeek);
    }

    let assigned = 0;
    for (const candidate of candidates) {
      if (assigned >= requirement.requiredCount) break;

      // Validate assignment does not violate constraints
      const validation = validateAssignment(candidate, requirement, config);
      if (!validation.valid) continue;

      // Calculate shift with breaks
      const shift = calculateShiftWithBreaks(
        requirement.startTime,
        requirement.endTime,
        config.breakIntervalMinutes,
        config.breakDurationMinutes,
      );

      assignments.push({
        staffId: candidate.staffId,
        requirement,
        shiftStart: shift.start,
        shiftEnd: shift.end,
        breakStart: shift.breakStart,
        breakEnd: shift.breakEnd,
      });

      // Update candidate's tracked hours for subsequent assignments
      const shiftHours = (shift.end.getTime() - shift.start.getTime()) / 3600000;
      candidate.totalHoursToday += shiftHours;
      candidate.totalHoursThisWeek += shiftHours;
      candidate.existingShifts.push({
        startTime: shift.start,
        endTime: shift.end,
      });

      assigned++;
    }

    if (assigned < requirement.requiredCount) {
      unmetRequirements.push({
        ...requirement,
        requiredCount: requirement.requiredCount - assigned,
      });
    }
  }

  return {
    assignments,
    unmetRequirements,
    conflicts: detectConflicts(assignments),
    stats: computeStats(assignments, staff),
  };
}

function sortByConstraintTightness(
  requirements: ScheduleRequirement[],
  staff: StaffAvailability[],
): ScheduleRequirement[] {
  return requirements
    .map((req) => ({
      req,
      eligibleCount: staff.filter((s) => matchesRequirement(s, req)).length,
    }))
    .sort((a, b) => {
      // Priority first, then constraint tightness
      if (a.req.priority !== b.req.priority) {
        return a.req.priority - b.req.priority;
      }
      return a.eligibleCount - b.eligibleCount;
    })
    .map((x) => x.req);
}

function findEligibleStaff(
  requirement: ScheduleRequirement,
  staff: StaffAvailability[],
  config: ScheduleConfig,
): StaffAvailability[] {
  return staff.filter((s) => {
    // Role check
    if (requirement.requiredRoles && !requirement.requiredRoles.includes(s.role)) {
      return false;
    }

    // Skill check
    if (requirement.requiredSkills) {
      const hasAllSkills = requirement.requiredSkills.every((skill) =>
        s.skills.some((ss) => ss.toLowerCase().includes(skill.toLowerCase())),
      );
      if (!hasAllSkills) return false;
    }

    // Time overlap check (no double-booking)
    const hasOverlap = s.existingShifts.some(
      (shift) => shift.startTime < requirement.endTime && shift.endTime > requirement.startTime,
    );
    if (hasOverlap) return false;

    // Hours limit check
    const shiftHours = (requirement.endTime.getTime() - requirement.startTime.getTime()) / 3600000;
    if (s.totalHoursToday + shiftHours > config.maxHoursPerDay) return false;
    if (s.totalHoursThisWeek + shiftHours > config.maxHoursPerWeek) return false;

    // Rest period check
    if (s.lastShiftEndTime) {
      const restHours = (requirement.startTime.getTime() - s.lastShiftEndTime.getTime()) / 3600000;
      if (restHours < config.minRestHoursBetweenDays) return false;
    }

    return true;
  });
}

function validateAssignment(
  staff: StaffAvailability,
  requirement: ScheduleRequirement,
  config: ScheduleConfig,
): { valid: boolean; reason?: string } {
  const shiftDurationHours =
    (requirement.endTime.getTime() - requirement.startTime.getTime()) / 3600000;

  if (staff.totalHoursToday + shiftDurationHours > config.maxHoursPerDay) {
    return { valid: false, reason: "Exceeds daily hours limit" };
  }

  if (staff.totalHoursThisWeek + shiftDurationHours > config.maxHoursPerWeek) {
    return { valid: false, reason: "Exceeds weekly hours limit" };
  }

  // Check minimum rest between shifts
  for (const existing of staff.existingShifts) {
    if (
      Math.abs(requirement.startTime.getTime() - existing.endTime.getTime()) <
      config.minRestHoursBetweenDays * 3600000
    ) {
      return { valid: false, reason: "Insufficient rest between shifts" };
    }
  }

  return { valid: true };
}

function calculateShiftWithBreaks(
  start: Date,
  end: Date,
  breakIntervalMinutes: number,
  breakDurationMinutes: number,
): {
  start: Date;
  end: Date;
  breakStart?: Date;
  breakEnd?: Date;
} {
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;

  if (durationMinutes <= breakIntervalMinutes) {
    return { start, end };
  }

  // Insert break at the midpoint or at breakInterval
  const breakStartMs = start.getTime() + breakIntervalMinutes * 60000;
  const breakStart = new Date(breakStartMs);
  const breakEnd = new Date(breakStartMs + breakDurationMinutes * 60000);

  return { start, end, breakStart, breakEnd };
}

// ─── Coverage Gap Detection ─────────────────────────────────────────────

interface CoverageGap {
  zone: string;
  date: string;
  gapStart: Date;
  gapEnd: Date;
  requiredStaff: number;
  assignedStaff: number;
}

async function detectCoverageGaps(
  eventId: string,
  date: string,
  zones: string[],
  prisma: PrismaClient,
): Promise<CoverageGap[]> {
  const gaps: CoverageGap[] = [];

  for (const zone of zones) {
    // Get all shifts for this zone and date
    const shifts = await prisma.staffShift.findMany({
      where: {
        staff: { eventId },
        date: new Date(date),
        zone,
        status: { not: "CANCELLED" },
      },
      orderBy: { startTime: "asc" },
    });

    // Get zone coverage requirements (configurable per event)
    const requirements = await getZoneRequirements(eventId, zone, date, prisma);

    for (const req of requirements) {
      // Count staff covering each time slot (15-minute granularity)
      const slotMinutes = 15;
      let currentTime = new Date(req.startTime);

      while (currentTime < new Date(req.endTime)) {
        const slotEnd = new Date(currentTime.getTime() + slotMinutes * 60000);
        const coveringStaff = shifts.filter(
          (s) => new Date(s.startTime) <= currentTime && new Date(s.endTime) >= slotEnd,
        );

        if (coveringStaff.length < req.requiredCount) {
          // Find or extend existing gap
          const lastGap = gaps[gaps.length - 1];
          if (
            lastGap &&
            lastGap.zone === zone &&
            lastGap.gapEnd.getTime() === currentTime.getTime()
          ) {
            lastGap.gapEnd = slotEnd;
          } else {
            gaps.push({
              zone,
              date,
              gapStart: new Date(currentTime),
              gapEnd: slotEnd,
              requiredStaff: req.requiredCount,
              assignedStaff: coveringStaff.length,
            });
          }
        }

        currentTime = slotEnd;
      }
    }
  }

  return gaps;
}
```

### 5.2 Staff Check-In/Out Flow

The check-in/out flow tracks staff attendance through badge scans, mobile app actions, or manual admin check-in.

```
Staff arrives at post -> Scans own badge at zone terminal (or admin scans them in)
  -> StaffShift.status = CHECKED_IN, checkedInAt = now()
  -> Staff appears as "Active" on command center availability map
  -> Late check-in alert if > 15 minutes past shift start

Staff takes break -> Taps "Break" on their phone or zone terminal
  -> StaffMember.status = ON_BREAK
  -> Break timer starts (auto-return to ACTIVE after configured max break)

Staff ends shift -> Scans badge out or admin checks them out
  -> StaffShift.status = CHECKED_OUT, checkedOutAt = now()
  -> If overtime (actual hours > scheduled hours), flag for review

No-show detection -> Background job at shift start + 30 minutes
  -> If StaffShift.status still SCHEDULED, set to NO_SHOW
  -> Notify shift manager -> suggest available replacement
```

**TypeScript Implementation:**

```typescript
// ─── Check-In Service ───────────────────────────────────────────────────

interface CheckInResult {
  shiftId: string;
  staffId: string;
  status: "CHECKED_IN";
  checkedInAt: Date;
  isLate: boolean;
  lateMinutes: number;
  staffStatus: "ACTIVE";
}

async function checkInStaff(
  staffId: string,
  shiftId: string,
  method: "BADGE_SCAN" | "MANUAL" | "MOBILE_APP",
  location: string | null,
  prisma: PrismaClient,
): Promise<CheckInResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Load shift and validate
    const shift = await tx.staffShift.findUnique({
      where: { id: shiftId },
      include: { staff: true },
    });

    if (!shift) throw new AppError("SHIFT_NOT_FOUND", 404);
    if (shift.staffId !== staffId) throw new AppError("STAFF_SHIFT_MISMATCH", 400);
    if (shift.status !== "SCHEDULED") {
      throw new AppError("SHIFT_ALREADY_CHECKED_IN", 400);
    }

    const now = new Date();
    const shiftStart = new Date(shift.startTime);
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - shiftStart.getTime()) / 60000));
    const isLate = lateMinutes > 15;

    // 2. Update shift status
    await tx.staffShift.update({
      where: { id: shiftId },
      data: {
        status: "CHECKED_IN",
        checkedInAt: now,
        notes: isLate
          ? `Late check-in: ${lateMinutes} minutes (via ${method})`
          : `Checked in via ${method}`,
      },
    });

    // 3. Update staff member status to ACTIVE
    await tx.staffMember.update({
      where: { id: staffId },
      data: { status: "ACTIVE" },
    });

    // 4. Log the check-in action
    await tx.staffTaskLog.create({
      data: {
        staffId,
        action: "shift_check_in",
        metadata: {
          shiftId,
          method,
          location,
          isLate,
          lateMinutes,
          scheduledStart: shift.startTime.toISOString(),
          actualStart: now.toISOString(),
        },
      },
    });

    // 5. Emit SSE event for command center
    await emitStaffEvent({
      type: "shift.checked_in",
      data: {
        shiftId,
        staffId,
        staffName: shift.staff.name,
        zone: shift.zone,
        location: shift.location,
        isLate,
        lateMinutes,
        timestamp: now.toISOString(),
      },
    });

    // 6. If late, notify shift manager
    if (isLate) {
      await notifyShiftManager(shift.staff.eventId, {
        type: "LATE_CHECK_IN",
        staffName: shift.staff.name,
        zone: shift.zone,
        lateMinutes,
        shiftId,
      });
    }

    return {
      shiftId,
      staffId,
      status: "CHECKED_IN" as const,
      checkedInAt: now,
      isLate,
      lateMinutes,
      staffStatus: "ACTIVE" as const,
    };
  });
}

// ─── Check-Out Service ──────────────────────────────────────────────────

interface CheckOutResult {
  shiftId: string;
  staffId: string;
  status: "CHECKED_OUT";
  checkedOutAt: Date;
  totalHours: number;
  scheduledHours: number;
  breakMinutes: number;
  isOvertime: boolean;
  overtimeMinutes: number;
  staffStatus: "OFF_DUTY";
}

async function checkOutStaff(
  staffId: string,
  shiftId: string,
  method: "BADGE_SCAN" | "MANUAL" | "MOBILE_APP",
  notes: string | null,
  prisma: PrismaClient,
): Promise<CheckOutResult> {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.staffShift.findUnique({
      where: { id: shiftId },
      include: { staff: true },
    });

    if (!shift) throw new AppError("SHIFT_NOT_FOUND", 404);
    if (shift.staffId !== staffId) throw new AppError("STAFF_SHIFT_MISMATCH", 400);
    if (shift.status !== "CHECKED_IN") {
      throw new AppError("SHIFT_NOT_CHECKED_IN", 400);
    }

    const now = new Date();
    const checkedInAt = new Date(shift.checkedInAt!);
    const scheduledStart = new Date(shift.startTime);
    const scheduledEnd = new Date(shift.endTime);

    const totalMinutes = (now.getTime() - checkedInAt.getTime()) / 60000 - shift.breakMinutes;
    const totalHours = totalMinutes / 60;
    const scheduledHours = (scheduledEnd.getTime() - scheduledStart.getTime()) / 3600000;
    const overtimeMinutes = Math.max(0, totalMinutes - scheduledHours * 60);
    const isOvertime = overtimeMinutes > 0;

    // Update shift
    await tx.staffShift.update({
      where: { id: shiftId },
      data: {
        status: "CHECKED_OUT",
        checkedOutAt: now,
        notes: [
          shift.notes,
          notes,
          isOvertime ? `Overtime: ${Math.round(overtimeMinutes)} minutes` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      },
    });

    // Check if staff has another shift today
    const nextShift = await tx.staffShift.findFirst({
      where: {
        staffId,
        date: shift.date,
        status: "SCHEDULED",
        startTime: { gt: now },
      },
    });

    // Update staff status
    await tx.staffMember.update({
      where: { id: staffId },
      data: { status: nextShift ? "OFF_DUTY" : "OFF_DUTY" },
    });

    // Log check-out
    await tx.staffTaskLog.create({
      data: {
        staffId,
        action: "shift_check_out",
        metadata: {
          shiftId,
          method,
          totalHours: Math.round(totalHours * 100) / 100,
          breakMinutes: shift.breakMinutes,
          isOvertime,
          overtimeMinutes: Math.round(overtimeMinutes),
        },
      },
    });

    // Emit event
    await emitStaffEvent({
      type: "shift.checked_out",
      data: {
        shiftId,
        staffId,
        staffName: shift.staff.name,
        zone: shift.zone,
        location: shift.location,
        timestamp: now.toISOString(),
      },
    });

    // Flag overtime for review
    if (isOvertime) {
      await notifyShiftManager(shift.staff.eventId, {
        type: "OVERTIME_DETECTED",
        staffName: shift.staff.name,
        overtimeMinutes: Math.round(overtimeMinutes),
        shiftId,
      });
    }

    return {
      shiftId,
      staffId,
      status: "CHECKED_OUT" as const,
      checkedOutAt: now,
      totalHours: Math.round(totalHours * 100) / 100,
      scheduledHours,
      breakMinutes: shift.breakMinutes,
      isOvertime,
      overtimeMinutes: Math.round(overtimeMinutes),
      staffStatus: "OFF_DUTY" as const,
    };
  });
}

// ─── No-Show Detection Background Job ──────────────────────────────────

async function detectNoShows(prisma: PrismaClient): Promise<void> {
  const threshold = new Date(Date.now() - 30 * 60000); // 30 minutes ago

  // Find shifts that started > 30 minutes ago and are still SCHEDULED
  const noShows = await prisma.staffShift.findMany({
    where: {
      status: "SCHEDULED",
      startTime: { lte: threshold },
    },
    include: { staff: true },
  });

  for (const shift of noShows) {
    await prisma.$transaction(async (tx) => {
      // Mark as NO_SHOW
      await tx.staffShift.update({
        where: { id: shift.id },
        data: { status: "NO_SHOW" },
      });

      // Update staff status
      await tx.staffMember.update({
        where: { id: shift.staffId },
        data: { status: "ABSENT" },
      });

      // Log no-show
      await tx.staffTaskLog.create({
        data: {
          staffId: shift.staffId,
          action: "no_show_detected",
          metadata: {
            shiftId: shift.id,
            scheduledStart: shift.startTime.toISOString(),
            zone: shift.zone,
            detectedAt: new Date().toISOString(),
          },
        },
      });
    });

    // Notify shift manager with replacement suggestions
    const availableReplacements = await findAvailableReplacements(
      shift.staff.eventId,
      shift.zone,
      shift.startTime,
      shift.endTime,
      prisma,
    );

    await emitStaffEvent({
      type: "shift.no_show",
      data: {
        shiftId: shift.id,
        staffId: shift.staffId,
        staffName: shift.staff.name,
        zone: shift.zone,
        location: shift.location,
        timestamp: new Date().toISOString(),
      },
    });

    await notifyShiftManager(shift.staff.eventId, {
      type: "NO_SHOW",
      staffName: shift.staff.name,
      zone: shift.zone,
      shiftId: shift.id,
      suggestedReplacements: availableReplacements.map((r) => ({
        staffId: r.id,
        name: r.name,
        role: r.role,
        currentStatus: r.status,
      })),
    });
  }
}

// ─── Break Management ───────────────────────────────────────────────────

async function handleBreak(
  staffId: string,
  shiftId: string,
  action: "START" | "END",
  prisma: PrismaClient,
): Promise<{
  breakAction: "START" | "END";
  staffStatus: StaffStatus;
  totalBreakMinutes: number;
}> {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.staffShift.findUnique({
      where: { id: shiftId },
    });

    if (!shift || shift.staffId !== staffId) {
      throw new AppError("SHIFT_NOT_FOUND", 404);
    }

    if (action === "START") {
      await tx.staffMember.update({
        where: { id: staffId },
        data: { status: "ON_BREAK" },
      });

      await tx.staffTaskLog.create({
        data: {
          staffId,
          action: "break_started",
          metadata: { shiftId, timestamp: new Date().toISOString() },
        },
      });

      // Schedule auto-end break after max duration (e.g., 45 minutes)
      await scheduleBreakAutoEnd(staffId, shiftId, 45);

      return {
        breakAction: "START" as const,
        staffStatus: "ON_BREAK" as StaffStatus,
        totalBreakMinutes: shift.breakMinutes,
      };
    } else {
      // Calculate break duration from last break_started log
      const breakStartLog = await tx.staffTaskLog.findFirst({
        where: {
          staffId,
          action: "break_started",
        },
        orderBy: { createdAt: "desc" },
      });

      const breakDuration = breakStartLog
        ? Math.floor((Date.now() - new Date(breakStartLog.createdAt).getTime()) / 60000)
        : 0;

      await tx.staffShift.update({
        where: { id: shiftId },
        data: {
          breakMinutes: shift.breakMinutes + breakDuration,
        },
      });

      await tx.staffMember.update({
        where: { id: staffId },
        data: { status: "ACTIVE" },
      });

      await tx.staffTaskLog.create({
        data: {
          staffId,
          action: "break_ended",
          metadata: {
            shiftId,
            breakDurationMinutes: breakDuration,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        breakAction: "END" as const,
        staffStatus: "ACTIVE" as StaffStatus,
        totalBreakMinutes: shift.breakMinutes + breakDuration,
      };
    }
  });
}
```

### 5.3 Interpreter Fatigue Rotation Algorithm

Interpreters cannot work continuously for more than 30 minutes at peak concentration. The system enforces rotation:

```
Session: Opening Ceremony (09:00 - 12:00)
Language pair: English -> French
Booth 1, Channel 2

  09:00 - 09:30  Interpreter A (lead) + Interpreter B (support)
  09:30 - 10:00  Interpreter B (lead) + Interpreter A (support)
  10:00 - 10:30  Interpreter A (lead) + Interpreter C (support) <- rotation
  10:30 - 11:00  Interpreter C (lead) + Interpreter A (support)
  11:00 - 11:30  Interpreter B (lead) + Interpreter C (support)
  11:30 - 12:00  Interpreter C (lead) + Interpreter B (support)
```

**Auto-scheduling algorithm:**

1. For each meeting, get required language pairs
2. For each language pair, find interpreters with matching skills from `StaffMember.skills`
3. Check interpreter availability (no overlapping `InterpreterAssignment`)
4. Assign in 30-minute rotating blocks, ensuring minimum 30-minute rest between consecutive active blocks
5. Flag unassignable gaps: "No Arabic->Portuguese interpreter available for Session X at 14:00"

**Detailed TypeScript Implementation:**

```typescript
// ─── Types ──────────────────────────────────────────────────────────────

interface LanguagePairRequirement {
  serviceId: string;
  meetingId: string;
  meetingTitle: string;
  fromLanguage: string;
  toLanguage: string;
  sessionStart: Date;
  sessionEnd: Date;
  boothId: string | null;
}

interface InterpreterCandidate {
  staffId: string;
  name: string;
  languagePairs: { from: string; to: string }[];
  certLevel: CertificationLevel | null;
  existingAssignments: { startTime: Date; endTime: Date }[];
  totalActiveMinutesToday: number;
}

interface RotationBlock {
  startTime: Date;
  endTime: Date;
  leadInterpreter: InterpreterCandidate;
  supportInterpreter: InterpreterCandidate;
}

interface FatigueRotationResult {
  serviceId: string;
  blocks: RotationBlock[];
  interpretersUsed: InterpreterCandidate[];
  warnings: string[];
  unassignableBlocks: { startTime: Date; endTime: Date; reason: string }[];
}

// ─── Rotation Algorithm ─────────────────────────────────────────────────

const DEFAULT_ROTATION_INTERVAL = 30; // minutes
const MIN_REST_BETWEEN_ACTIVE = 30; // minutes
const MAX_ACTIVE_MINUTES_PER_DAY = 360; // 6 hours total active interpreting
const MAX_CONSECUTIVE_LEAD_BLOCKS = 2; // Max 2 consecutive lead blocks

async function generateFatigueRotation(
  requirement: LanguagePairRequirement,
  interpreters: InterpreterCandidate[],
  rotationIntervalMinutes: number = DEFAULT_ROTATION_INTERVAL,
): Promise<FatigueRotationResult> {
  const { sessionStart, sessionEnd, serviceId } = requirement;
  const sessionDurationMinutes = (sessionEnd.getTime() - sessionStart.getTime()) / 60000;
  const totalBlocks = Math.ceil(sessionDurationMinutes / rotationIntervalMinutes);
  const warnings: string[] = [];
  const unassignableBlocks: { startTime: Date; endTime: Date; reason: string }[] = [];

  // Filter interpreters who can handle this language pair
  const qualified = interpreters.filter((interp) =>
    interp.languagePairs.some(
      (lp) => lp.from === requirement.fromLanguage && lp.to === requirement.toLanguage,
    ),
  );

  if (qualified.length < 2) {
    return {
      serviceId,
      blocks: [],
      interpretersUsed: [],
      warnings: [
        `Insufficient interpreters for ${requirement.fromLanguage}->${requirement.toLanguage}. ` +
          `Need minimum 2, found ${qualified.length}.`,
      ],
      unassignableBlocks: [
        {
          startTime: sessionStart,
          endTime: sessionEnd,
          reason: `Only ${qualified.length} qualified interpreter(s) available`,
        },
      ],
    };
  }

  // Sort by certification level (higher = preferred), then by hours balance
  const sortedInterpreters = [...qualified].sort((a, b) => {
    const certOrder: Record<string, number> = {
      MASTER: 5,
      CONFERENCE: 4,
      PROFESSIONAL: 3,
      ASSOCIATE: 2,
      TRAINEE: 1,
    };
    const aCert = certOrder[a.certLevel || "TRAINEE"] || 0;
    const bCert = certOrder[b.certLevel || "TRAINEE"] || 0;
    if (aCert !== bCert) return bCert - aCert;
    return a.totalActiveMinutesToday - b.totalActiveMinutesToday;
  });

  // Determine how many interpreters we need
  //   - Sessions <= 2 hours: 2 interpreters
  //   - Sessions > 2 hours: 3 interpreters
  //   - Sessions > 4 hours: 4 interpreters (to allow proper rest)
  const interpretersNeeded =
    sessionDurationMinutes <= 120 ? 2 : sessionDurationMinutes <= 240 ? 3 : 4;

  const selectedInterpreters = sortedInterpreters.slice(
    0,
    Math.min(interpretersNeeded, sortedInterpreters.length),
  );

  if (selectedInterpreters.length < 2) {
    warnings.push(
      `Only ${selectedInterpreters.length} interpreter(s) available; minimum 2 required.`,
    );
  }

  // Generate rotation blocks
  const blocks: RotationBlock[] = [];
  const interpCount = selectedInterpreters.length;

  // Track consecutive lead blocks per interpreter
  const consecutiveLeadCount: Map<string, number> = new Map();
  // Track last active block end time per interpreter for rest enforcement
  const lastActiveEnd: Map<string, Date> = new Map();

  for (let i = 0; i < totalBlocks; i++) {
    const blockStart = new Date(sessionStart.getTime() + i * rotationIntervalMinutes * 60000);
    const blockEnd = new Date(
      Math.min(blockStart.getTime() + rotationIntervalMinutes * 60000, sessionEnd.getTime()),
    );

    // Round-robin lead assignment with fatigue constraints
    const leadIndex = i % interpCount;
    let supportIndex = (i + 1) % interpCount;

    // Ensure support is different from lead
    if (supportIndex === leadIndex) {
      supportIndex = (leadIndex + 1) % interpCount;
    }

    let lead = selectedInterpreters[leadIndex];
    let support = selectedInterpreters[supportIndex];

    // Check if lead has exceeded consecutive lead blocks
    const leadConsecutive = consecutiveLeadCount.get(lead.staffId) || 0;
    if (leadConsecutive >= MAX_CONSECUTIVE_LEAD_BLOCKS) {
      // Swap lead and support, or rotate to next available
      const temp = lead;
      lead = support;
      support = temp;
      consecutiveLeadCount.set(temp.staffId, 0);
    }

    // Check rest constraint for lead interpreter
    const lastEnd = lastActiveEnd.get(lead.staffId);
    if (lastEnd) {
      const restMinutes = (blockStart.getTime() - lastEnd.getTime()) / 60000;
      if (restMinutes < MIN_REST_BETWEEN_ACTIVE && interpCount > 2) {
        // Try to find an alternative lead
        const alternative = selectedInterpreters.find(
          (interp) =>
            interp.staffId !== lead.staffId &&
            interp.staffId !== support.staffId &&
            (!lastActiveEnd.has(interp.staffId) ||
              (blockStart.getTime() - lastActiveEnd.get(interp.staffId)!.getTime()) / 60000 >=
                MIN_REST_BETWEEN_ACTIVE),
        );
        if (alternative) {
          lead = alternative;
        } else {
          warnings.push(
            `Block ${i + 1} (${blockStart.toISOString()}): ${lead.name} has ` +
              `only ${Math.round(restMinutes)}min rest. Minimum ${MIN_REST_BETWEEN_ACTIVE}min recommended.`,
          );
        }
      }
    }

    // Check availability (no overlapping assignments)
    const leadAvailable = !lead.existingAssignments.some(
      (a) => a.startTime < blockEnd && a.endTime > blockStart,
    );
    const supportAvailable = !support.existingAssignments.some(
      (a) => a.startTime < blockEnd && a.endTime > blockStart,
    );

    if (!leadAvailable || !supportAvailable) {
      unassignableBlocks.push({
        startTime: blockStart,
        endTime: blockEnd,
        reason: `${!leadAvailable ? lead.name : support.name} has conflicting assignment`,
      });
      continue;
    }

    blocks.push({
      startTime: blockStart,
      endTime: blockEnd,
      leadInterpreter: lead,
      supportInterpreter: support,
    });

    // Update tracking
    consecutiveLeadCount.set(lead.staffId, (consecutiveLeadCount.get(lead.staffId) || 0) + 1);
    // Reset consecutive count for non-lead interpreters
    for (const interp of selectedInterpreters) {
      if (interp.staffId !== lead.staffId) {
        consecutiveLeadCount.set(interp.staffId, 0);
      }
    }
    lastActiveEnd.set(lead.staffId, blockEnd);

    // Update existing assignments for subsequent conflict checks
    lead.existingAssignments.push({ startTime: blockStart, endTime: blockEnd });
    support.existingAssignments.push({ startTime: blockStart, endTime: blockEnd });

    // Update total active minutes
    lead.totalActiveMinutesToday += rotationIntervalMinutes;
    support.totalActiveMinutesToday += rotationIntervalMinutes;

    // Check daily limits
    if (lead.totalActiveMinutesToday > MAX_ACTIVE_MINUTES_PER_DAY) {
      warnings.push(
        `${lead.name} has exceeded ${MAX_ACTIVE_MINUTES_PER_DAY}min daily active limit.`,
      );
    }
  }

  return {
    serviceId,
    blocks,
    interpretersUsed: selectedInterpreters,
    warnings,
    unassignableBlocks,
  };
}

// ─── Persist Rotation to Database ───────────────────────────────────────

async function persistFatigueRotation(
  result: FatigueRotationResult,
  prisma: PrismaClient,
): Promise<InterpreterAssignment[]> {
  const assignments: InterpreterAssignment[] = [];

  for (const block of result.blocks) {
    // Create lead assignment
    const leadAssignment = await prisma.interpreterAssignment.create({
      data: {
        serviceId: result.serviceId,
        staffId: block.leadInterpreter.staffId,
        startTime: block.startTime,
        endTime: block.endTime,
        isLead: true,
        status: "SCHEDULED",
      },
    });
    assignments.push(leadAssignment);

    // Create support assignment
    const supportAssignment = await prisma.interpreterAssignment.create({
      data: {
        serviceId: result.serviceId,
        staffId: block.supportInterpreter.staffId,
        startTime: block.startTime,
        endTime: block.endTime,
        isLead: false,
        status: "SCHEDULED",
      },
    });
    assignments.push(supportAssignment);
  }

  return assignments;
}
```

### 5.4 Receiver Handset Tracking

```
Participant arrives at meeting -> Approaches equipment desk
  -> Staff scans participant badge -> System shows preferred language (from registration)
  -> Staff hands receiver, scans receiver barcode
  -> ReceiverHandset.status = CHECKED_OUT, currentHolder = participantId
  -> Participant shown on "Active Receivers" count

Meeting ends -> Participant returns receiver
  -> Staff scans receiver barcode -> ReceiverHandset.status = AVAILABLE
  -> If participant leaves without returning:
    -> End-of-day report: "12 receivers not returned"
    -> Notification sent to participant: "Please return your receiver to the equipment desk"
```

**Equipment dashboard:**

```
Receivers: 500 total | 342 checked out | 145 available | 8 charging | 5 lost

Lost receiver cost this event: $250 (5 x $50)
Top unreturned: Table showing participant names with overdue receivers
```

**TypeScript Implementation:**

```typescript
// ─── Receiver Check-Out ─────────────────────────────────────────────────

interface ReceiverCheckOutResult {
  handsetId: string;
  serialNumber: string;
  participantId: string;
  participantName: string;
  preferredLanguage: string;
  channelSuggestion: number;
  checkedOutAt: Date;
}

async function checkOutReceiver(
  eventId: string,
  serialNumber: string,
  participantId: string,
  prisma: PrismaClient,
): Promise<ReceiverCheckOutResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Find the receiver
    const receiver = await tx.receiverHandset.findUnique({
      where: { serialNumber },
    });

    if (!receiver) throw new AppError("RECEIVER_NOT_FOUND", 404);
    if (receiver.eventId !== eventId) throw new AppError("RECEIVER_WRONG_EVENT", 400);
    if (receiver.status !== "AVAILABLE") {
      throw new AppError(`RECEIVER_NOT_AVAILABLE: Current status is ${receiver.status}`, 400);
    }

    // 2. Get participant's preferred language from registration
    const participant = await tx.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        name: true,
        preferredLanguage: true,
      },
    });

    if (!participant) throw new AppError("PARTICIPANT_NOT_FOUND", 404);

    // 3. Find the channel for their preferred language
    const activeService = await tx.interpretationService.findFirst({
      where: {
        eventId,
        toLanguage: participant.preferredLanguage || "en",
        status: "ACTIVE",
      },
    });

    const channelSuggestion = activeService?.channelNumber || 1;

    // 4. Update receiver status
    const now = new Date();
    await tx.receiverHandset.update({
      where: { serialNumber },
      data: {
        status: "CHECKED_OUT",
        currentHolder: participantId,
        checkedOutAt: now,
        checkedInAt: null,
      },
    });

    // 5. Emit event
    await emitReceiverEvent({
      type: "receiver.checked_out",
      data: {
        serialNumber,
        participantId,
        participantName: participant.name,
        status: "CHECKED_OUT",
        timestamp: now.toISOString(),
      },
    });

    return {
      handsetId: receiver.id,
      serialNumber,
      participantId,
      participantName: participant.name,
      preferredLanguage: participant.preferredLanguage || "en",
      channelSuggestion,
      checkedOutAt: now,
    };
  });
}

// ─── Receiver Return ────────────────────────────────────────────────────

async function returnReceiver(
  eventId: string,
  serialNumber: string,
  prisma: PrismaClient,
): Promise<{
  serialNumber: string;
  previousHolder: string;
  sessionDurationMinutes: number;
}> {
  return prisma.$transaction(async (tx) => {
    const receiver = await tx.receiverHandset.findUnique({
      where: { serialNumber },
    });

    if (!receiver) throw new AppError("RECEIVER_NOT_FOUND", 404);
    if (receiver.status !== "CHECKED_OUT") {
      throw new AppError("RECEIVER_NOT_CHECKED_OUT", 400);
    }

    const now = new Date();
    const sessionDuration = receiver.checkedOutAt
      ? Math.floor((now.getTime() - receiver.checkedOutAt.getTime()) / 60000)
      : 0;

    const previousHolder = receiver.currentHolder || "unknown";

    await tx.receiverHandset.update({
      where: { serialNumber },
      data: {
        status: "AVAILABLE",
        currentHolder: null,
        checkedInAt: now,
      },
    });

    return {
      serialNumber,
      previousHolder,
      sessionDurationMinutes: sessionDuration,
    };
  });
}

// ─── Overdue Receiver Detection (Background Job) ────────────────────────

async function detectOverdueReceivers(
  eventId: string,
  overdueThresholdMinutes: number,
  prisma: PrismaClient,
): Promise<void> {
  const threshold = new Date(Date.now() - overdueThresholdMinutes * 60000);

  const overdueReceivers = await prisma.receiverHandset.findMany({
    where: {
      eventId,
      status: "CHECKED_OUT",
      checkedOutAt: { lte: threshold },
    },
  });

  for (const receiver of overdueReceivers) {
    if (receiver.currentHolder) {
      // Send notification to participant
      await sendNotification({
        recipientId: receiver.currentHolder,
        type: "RECEIVER_OVERDUE",
        title: "Please return your receiver",
        body:
          `Your interpretation receiver (${receiver.serialNumber}) is overdue. ` +
          `Please return it to the nearest equipment desk.`,
      });

      await emitReceiverEvent({
        type: "receiver.overdue",
        data: {
          serialNumber: receiver.serialNumber,
          participantId: receiver.currentHolder,
          status: "CHECKED_OUT",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
```

### 5.5 Interpretation Cost Calculation

```
Interpretation Cost Summary - 38th AU Summit:
┌──────────────────┬───────┬───────────┬──────────┬───────────┐
│ Language Pair     │ Hours │ Rate/Hour │ Sessions │ Total     │
├──────────────────┼───────┼───────────┼──────────┼───────────┤
│ EN -> FR         │  120  │  $80      │  24      │  $9,600   │
│ FR -> EN         │  120  │  $80      │  24      │  $9,600   │
│ EN -> AR         │   80  │  $95      │  16      │  $7,600   │
│ AR -> EN         │   80  │  $95      │  16      │  $7,600   │
│ EN -> PT         │   40  │  $90      │   8      │  $3,600   │
│ PT -> EN         │   40  │  $90      │   8      │  $3,600   │
├──────────────────┼───────┼───────────┼──────────┼───────────┤
│ TOTAL            │  480  │           │          │ $41,600   │
│ Equipment rental │       │           │          │  $8,500   │
│ GRAND TOTAL      │       │           │          │ $50,100   │
└──────────────────┴───────┴───────────┴──────────┴───────────┘
```

Auto-calculated from `InterpreterAssignment` durations multiplied by configurable rate per language pair. Feeds into the event budget (Module 11 Logistics).

**TypeScript Implementation:**

```typescript
// ─── Cost Configuration ─────────────────────────────────────────────────

interface LanguagePairRate {
  fromLanguage: string;
  toLanguage: string;
  ratePerHour: number; // USD
  currency: string;
}

interface EquipmentCostItem {
  item: string;
  quantity: number;
  unitCost: number;
}

// ─── Cost Calculation Engine ────────────────────────────────────────────

interface InterpretationCostSummary {
  languagePairs: {
    fromLanguage: string;
    toLanguage: string;
    label: string;
    totalHours: number;
    ratePerHour: number;
    sessionCount: number;
    totalCost: number;
  }[];
  equipmentCosts: EquipmentCostItem[];
  summary: {
    totalInterpretationCost: number;
    totalEquipmentCost: number;
    grandTotal: number;
  };
}

async function calculateInterpretationCosts(
  eventId: string,
  rates: LanguagePairRate[],
  equipmentCosts: EquipmentCostItem[],
  prisma: PrismaClient,
): Promise<InterpretationCostSummary> {
  // 1. Aggregate interpreter assignment hours per language pair
  const services = await prisma.interpretationService.findMany({
    where: { eventId },
    include: {
      assignments: true,
    },
  });

  // Group by language pair
  const pairMap = new Map<
    string,
    {
      fromLanguage: string;
      toLanguage: string;
      totalMinutes: number;
      sessionCount: number;
    }
  >();

  for (const service of services) {
    const key = `${service.fromLanguage}->${service.toLanguage}`;
    const existing = pairMap.get(key) || {
      fromLanguage: service.fromLanguage,
      toLanguage: service.toLanguage,
      totalMinutes: 0,
      sessionCount: 0,
    };

    // Sum interpreter-hours from assignments (only lead hours count for billing)
    const leadAssignments = service.assignments.filter((a) => a.isLead);
    for (const assignment of leadAssignments) {
      const duration =
        (new Date(assignment.endTime).getTime() - new Date(assignment.startTime).getTime()) / 60000;
      existing.totalMinutes += duration;
    }

    existing.sessionCount++;
    pairMap.set(key, existing);
  }

  // 2. Apply rates
  const languagePairCosts = Array.from(pairMap.values()).map((pair) => {
    const rate = rates.find(
      (r) => r.fromLanguage === pair.fromLanguage && r.toLanguage === pair.toLanguage,
    );
    const ratePerHour = rate?.ratePerHour || 0;
    const totalHours = Math.round((pair.totalMinutes / 60) * 100) / 100;
    const totalCost = Math.round(totalHours * ratePerHour * 100) / 100;

    return {
      fromLanguage: pair.fromLanguage,
      toLanguage: pair.toLanguage,
      label: `${pair.fromLanguage.toUpperCase()} -> ${pair.toLanguage.toUpperCase()}`,
      totalHours,
      ratePerHour,
      sessionCount: pair.sessionCount,
      totalCost,
    };
  });

  // 3. Calculate totals
  const totalInterpretationCost = languagePairCosts.reduce((sum, p) => sum + p.totalCost, 0);
  const totalEquipmentCost = equipmentCosts.reduce((sum, e) => sum + e.quantity * e.unitCost, 0);

  return {
    languagePairs: languagePairCosts,
    equipmentCosts,
    summary: {
      totalInterpretationCost,
      totalEquipmentCost,
      grandTotal: totalInterpretationCost + totalEquipmentCost,
    },
  };
}
```

### 5.6 Interview Request Flow

```
Journalist (Press/Media participant) -> Opens "Request Interview" in their portal
  -> Selects target: delegation or specific delegate (searchable dropdown)
  -> Fills: topic, preferred date/time, format (in-person/video/written), outlet name
  -> Submits -> InterviewRequest created (status: SUBMITTED)

System -> Routes request to the target delegation's focal point
  -> Focal point sees in their delegation portal: "3 interview requests pending"
  -> Focal point reviews -> [Approve] [Decline] [Forward to delegate]

If approved:
  -> Focal point sets time and location
  -> InterviewRequest.status = SCHEDULED
  -> Both journalist and delegation receive notification
  -> Appears on both parties' personal agendas
  -> If room needed -> auto-check availability and suggest booking

If declined:
  -> Journalist notified with optional reason
  -> InterviewRequest.status = DECLINED
```

**TypeScript Implementation:**

```typescript
// ─── Interview Request State Machine ────────────────────────────────────

type InterviewAction =
  | "SUBMIT"
  | "FORWARD"
  | "APPROVE"
  | "DECLINE"
  | "SCHEDULE"
  | "COMPLETE"
  | "CANCEL";

const INTERVIEW_TRANSITIONS: Record<
  string,
  { validActions: InterviewAction[]; nextStatus: Record<InterviewAction, string> }
> = {
  SUBMITTED: {
    validActions: ["FORWARD", "APPROVE", "DECLINE", "CANCEL"],
    nextStatus: {
      SUBMIT: "SUBMITTED",
      FORWARD: "FORWARDED",
      APPROVE: "APPROVED",
      DECLINE: "DECLINED",
      SCHEDULE: "SCHEDULED",
      COMPLETE: "COMPLETED",
      CANCEL: "CANCELLED",
    },
  },
  FORWARDED: {
    validActions: ["APPROVE", "DECLINE", "FORWARD"],
    nextStatus: {
      SUBMIT: "SUBMITTED",
      FORWARD: "FORWARDED",
      APPROVE: "APPROVED",
      DECLINE: "DECLINED",
      SCHEDULE: "SCHEDULED",
      COMPLETE: "COMPLETED",
      CANCEL: "CANCELLED",
    },
  },
  APPROVED: {
    validActions: ["SCHEDULE", "CANCEL"],
    nextStatus: {
      SUBMIT: "SUBMITTED",
      FORWARD: "FORWARDED",
      APPROVE: "APPROVED",
      DECLINE: "DECLINED",
      SCHEDULE: "SCHEDULED",
      COMPLETE: "COMPLETED",
      CANCEL: "CANCELLED",
    },
  },
  SCHEDULED: {
    validActions: ["COMPLETE", "CANCEL"],
    nextStatus: {
      SUBMIT: "SUBMITTED",
      FORWARD: "FORWARDED",
      APPROVE: "APPROVED",
      DECLINE: "DECLINED",
      SCHEDULE: "SCHEDULED",
      COMPLETE: "COMPLETED",
      CANCEL: "CANCELLED",
    },
  },
};

async function processInterviewAction(
  interviewId: string,
  action: InterviewAction,
  actorId: string,
  payload: {
    forwardedTo?: string;
    scheduledTime?: string;
    scheduledLocation?: string;
    notes?: string;
  },
  prisma: PrismaClient,
): Promise<InterviewRequest> {
  return prisma.$transaction(async (tx) => {
    const interview = await tx.interviewRequest.findUnique({
      where: { id: interviewId },
    });

    if (!interview) throw new AppError("INTERVIEW_NOT_FOUND", 404);

    // Validate state transition
    const currentState = INTERVIEW_TRANSITIONS[interview.status];
    if (!currentState || !currentState.validActions.includes(action)) {
      throw new AppError(`Invalid action ${action} for status ${interview.status}`, 400);
    }

    const newStatus = currentState.nextStatus[action];

    // Build update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    switch (action) {
      case "FORWARD":
        if (!payload.forwardedTo) {
          throw new AppError("forwardedTo is required for FORWARD action", 400);
        }
        updateData.forwardedTo = payload.forwardedTo;
        break;

      case "APPROVE":
      case "DECLINE":
        updateData.respondedBy = actorId;
        updateData.respondedAt = new Date();
        if (payload.notes) updateData.notes = payload.notes;
        break;

      case "SCHEDULE":
        if (!payload.scheduledTime) {
          throw new AppError("scheduledTime is required for SCHEDULE action", 400);
        }
        updateData.scheduledTime = new Date(payload.scheduledTime);
        updateData.scheduledLocation = payload.scheduledLocation || null;
        updateData.respondedBy = actorId;
        updateData.respondedAt = new Date();

        // Auto-suggest room booking if location not specified
        if (!payload.scheduledLocation) {
          const suggestedRoom = await findAvailableRoom(
            interview.eventId,
            new Date(payload.scheduledTime),
            interview.preferredDuration || 30,
            tx,
          );
          if (suggestedRoom) {
            updateData.scheduledLocation = suggestedRoom.name;
          }
        }
        break;
    }

    const updated = await tx.interviewRequest.update({
      where: { id: interviewId },
      data: updateData,
    });

    // Send notifications
    switch (action) {
      case "FORWARD":
        await sendNotification({
          recipientId: payload.forwardedTo!,
          type: "INTERVIEW_FORWARDED",
          title: "Interview Request Forwarded to You",
          body: `An interview request from ${interview.outlet} regarding "${interview.topic}" has been forwarded to you for review.`,
        });
        break;

      case "APPROVE":
      case "SCHEDULE":
        // Notify journalist
        await sendNotification({
          recipientId: interview.requestorId,
          type: action === "SCHEDULE" ? "INTERVIEW_SCHEDULED" : "INTERVIEW_APPROVED",
          title: `Interview Request ${action === "SCHEDULE" ? "Scheduled" : "Approved"}`,
          body:
            action === "SCHEDULE"
              ? `Your interview request has been scheduled for ${payload.scheduledTime} at ${payload.scheduledLocation || "TBD"}.`
              : `Your interview request regarding "${interview.topic}" has been approved.`,
        });
        break;

      case "DECLINE":
        await sendNotification({
          recipientId: interview.requestorId,
          type: "INTERVIEW_DECLINED",
          title: "Interview Request Declined",
          body: `Your interview request regarding "${interview.topic}" has been declined.${
            payload.notes ? ` Reason: ${payload.notes}` : ""
          }`,
        });
        break;
    }

    // Emit SSE event
    await emitInterviewEvent({
      type: `interview.${action.toLowerCase()}` as any,
      data: {
        interviewId,
        requestorName: interview.requestorId,
        outlet: interview.outlet,
        targetDelegation: interview.targetDelegation,
        status: newStatus,
        timestamp: new Date().toISOString(),
      },
    });

    return updated;
  });
}
```

### 5.7 Embargo System

```
Admin creates MediaAdvisory:
  Title: "Joint Statement on Climate Action"
  Embargo until: Feb 12, 2026 at 14:00 UTC
  Attachments: statement.pdf, backgrounder.pdf

  -> Advisory saved, NOT visible to media yet
  -> At 14:00 UTC, background job:
    -> Sets isPublished = true, publishedAt = now()
    -> Sends email to all accredited Press/Media participants:
      "EMBARGO LIFTED: Joint Statement on Climate Action now available"
    -> Advisory appears in participant app press kit section
    -> If digital press kit exists, PDF auto-added
```

Advisories distributed before embargo lift show: "EMBARGOED - Not for publication before Feb 12, 14:00 UTC"

**TypeScript Implementation:**

```typescript
// ─── Embargo Scheduler (Background Job) ─────────────────────────────────

async function processEmbargoLifts(prisma: PrismaClient): Promise<number> {
  const now = new Date();

  // Find all advisories whose embargo has passed and are not yet published
  const readyToPublish = await prisma.mediaAdvisory.findMany({
    where: {
      embargoUntil: { lte: now },
      isPublished: false,
    },
  });

  let publishedCount = 0;

  for (const advisory of readyToPublish) {
    try {
      await publishAdvisory(advisory.id, false, prisma);
      publishedCount++;
    } catch (error) {
      console.error(`Failed to publish advisory ${advisory.id}: ${error}`);
      // Retry will happen on next cron cycle
    }
  }

  return publishedCount;
}

// ─── Advisory Publication ───────────────────────────────────────────────

interface PublishResult {
  advisoryId: string;
  publishedAt: Date;
  embargoOverridden: boolean;
  notificationsSent: number;
}

async function publishAdvisory(
  advisoryId: string,
  overrideEmbargo: boolean,
  prisma: PrismaClient,
): Promise<PublishResult> {
  return prisma.$transaction(async (tx) => {
    const advisory = await tx.mediaAdvisory.findUnique({
      where: { id: advisoryId },
    });

    if (!advisory) throw new AppError("ADVISORY_NOT_FOUND", 404);
    if (advisory.isPublished) throw new AppError("ALREADY_PUBLISHED", 400);

    // Check embargo
    const now = new Date();
    const embargoActive = advisory.embargoUntil && new Date(advisory.embargoUntil) > now;

    if (embargoActive && !overrideEmbargo) {
      throw new AppError(`Advisory is under embargo until ${advisory.embargoUntil}`, 400);
    }

    // Publish the advisory
    await tx.mediaAdvisory.update({
      where: { id: advisoryId },
      data: {
        isPublished: true,
        publishedAt: now,
      },
    });

    // Resolve distribution list
    const recipients = await resolveDistributionList(
      advisory.eventId,
      advisory.distributedTo as string[],
      tx,
    );

    // Send notifications to all media participants
    let notificationsSent = 0;
    for (const recipient of recipients) {
      await sendNotification({
        recipientId: recipient.participantId,
        type: "ADVISORY_PUBLISHED",
        title: embargoActive
          ? `EMBARGO LIFTED: ${advisory.title}`
          : `Media Advisory: ${advisory.title}`,
        body: `${advisory.title} is now available. ${
          (advisory.attachments as any[]).length > 0
            ? `${(advisory.attachments as any[]).length} attachment(s) included.`
            : ""
        }`,
      });
      notificationsSent++;
    }

    // Send emails
    await sendBulkEmail({
      recipients: recipients.map((r) => r.email),
      subject: embargoActive
        ? `EMBARGO LIFTED: ${advisory.title}`
        : `Media Advisory: ${advisory.title}`,
      templateId: "media-advisory-published",
      data: {
        title: advisory.title,
        body: advisory.body,
        attachments: advisory.attachments,
        embargoWasActive: embargoActive,
        publishedAt: now.toISOString(),
      },
    });

    // Emit SSE event
    await emitMediaEvent({
      type: embargoActive ? "advisory.embargo_lifted" : "advisory.published",
      data: {
        advisoryId,
        title: advisory.title,
        recipientCount: recipients.length,
        publishedAt: now.toISOString(),
      },
    });

    return {
      advisoryId,
      publishedAt: now,
      embargoOverridden: embargoActive || false,
      notificationsSent,
    };
  });
}

// ─── Distribution List Resolution ───────────────────────────────────────

async function resolveDistributionList(
  eventId: string,
  distributedTo: string[],
  tx: PrismaClient,
): Promise<{ participantId: string; email: string }[]> {
  if (distributedTo.includes("all_media")) {
    // Fetch all accredited press/media participants
    const participants = await tx.participant.findMany({
      where: {
        eventId,
        category: { in: ["PRESS", "MEDIA"] },
        status: "ACCREDITED",
      },
      select: { id: true, email: true },
    });
    return participants.map((p) => ({
      participantId: p.id,
      email: p.email,
    }));
  }

  // Specific participant IDs
  const participants = await tx.participant.findMany({
    where: {
      id: { in: distributedTo },
      eventId,
    },
    select: { id: true, email: true },
  });
  return participants.map((p) => ({
    participantId: p.id,
    email: p.email,
  }));
}

// ─── Embargo Display Logic ──────────────────────────────────────────────

function getAdvisoryDisplayInfo(advisory: MediaAdvisory): {
  isVisible: boolean;
  embargoLabel: string | null;
  content: string | null;
} {
  if (advisory.isPublished) {
    return {
      isVisible: true,
      embargoLabel: null,
      content: advisory.body,
    };
  }

  if (advisory.embargoUntil) {
    const embargoDate = new Date(advisory.embargoUntil);
    return {
      isVisible: false,
      embargoLabel: `EMBARGOED - Not for publication before ${embargoDate.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )}, ${embargoDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })}`,
      content: null,
    };
  }

  return { isVisible: false, embargoLabel: "DRAFT", content: null };
}
```

### 5.8 Performance Tracking Engine

For staff in measurable roles (registration clerks, validators), auto-capture productivity metrics from existing system actions:

```
Registration Clerk Ahmed - Feb 10:
  Participants processed: 47
  Avg processing time: 4.2 minutes
  Shift hours: 8h (6:00 - 14:00)
  Break time: 45 minutes

Validator Sara - Feb 10:
  Approvals: 62
  Rejections: 8
  Avg review time: 2.1 minutes
  SLA compliance: 98%
```

Data sourced from `Approval` records (already created by workflow engine) joined with `StaffShift` timing.

**Extended TypeScript Implementation:**

```typescript
// ─── Performance Metrics Engine ─────────────────────────────────────────

interface StaffPerformanceMetrics {
  staffId: string;
  staffName: string;
  role: StaffRole;
  period: { from: Date; to: Date };
  attendance: {
    totalShifts: number;
    completedShifts: number;
    noShows: number;
    punctualityRate: number; // % on-time check-ins
    attendanceRate: number; // % not NO_SHOW
    totalHoursWorked: number;
    totalHoursScheduled: number;
    totalBreakMinutes: number;
    overtimeHours: number;
    avgCheckInDelay: number; // minutes
  };
  productivity: {
    tasksCompleted: number;
    tasksPerHour: number;
    avgTaskDuration: number | null;
    roleSpecific: RoleSpecificMetrics | null;
  };
  evaluations: {
    count: number;
    avgOverall: number | null;
    categories: Record<string, number>;
    trend: "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA";
  };
}

type RoleSpecificMetrics =
  | RegistrationClerkMetrics
  | ValidatorMetrics
  | InterpreterMetrics
  | DriverMetrics;

interface RegistrationClerkMetrics {
  type: "REGISTRATION_CLERK";
  participantsProcessed: number;
  avgProcessingTimeMinutes: number;
  peakThroughputPerHour: number;
  errorRate: number; // % of registrations needing correction
}

interface ValidatorMetrics {
  type: "VALIDATOR";
  approvalsCount: number;
  rejectionsCount: number;
  avgReviewTimeMinutes: number;
  slaComplianceRate: number; // % within SLA threshold
  overdueCases: number;
}

interface InterpreterMetrics {
  type: "INTERPRETER";
  sessionsInterpreted: number;
  totalActiveMinutes: number;
  languagePairsCovered: string[];
  fatigueViolations: number; // Times assigned without adequate rest
  avgSessionRating: number | null;
}

interface DriverMetrics {
  type: "DRIVER";
  tripsCompleted: number;
  totalKmDriven: number;
  avgTripDuration: number;
  onTimePickupRate: number;
}

async function calculatePerformance(
  staffId: string,
  eventId: string,
  dateFrom: Date,
  dateTo: Date,
  prisma: PrismaClient,
): Promise<StaffPerformanceMetrics> {
  // 1. Load staff member
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffId },
  });
  if (!staff) throw new AppError("STAFF_NOT_FOUND", 404);

  // 2. Load shifts in period
  const shifts = await prisma.staffShift.findMany({
    where: {
      staffId,
      date: { gte: dateFrom, lte: dateTo },
    },
    orderBy: { date: "asc" },
  });

  // 3. Calculate attendance metrics
  const completedShifts = shifts.filter((s) => s.status === "CHECKED_OUT");
  const noShows = shifts.filter((s) => s.status === "NO_SHOW");
  const checkedIn = shifts.filter((s) => s.status === "CHECKED_IN" || s.status === "CHECKED_OUT");

  const onTimeCheckIns = checkedIn.filter((s) => {
    if (!s.checkedInAt) return false;
    const delay = (new Date(s.checkedInAt).getTime() - new Date(s.startTime).getTime()) / 60000;
    return delay <= 15; // 15-minute grace period
  });

  const totalHoursWorked = completedShifts.reduce((sum, s) => {
    if (!s.checkedInAt || !s.checkedOutAt) return sum;
    const hours =
      (new Date(s.checkedOutAt).getTime() - new Date(s.checkedInAt).getTime()) / 3600000;
    return sum + hours - s.breakMinutes / 60;
  }, 0);

  const totalHoursScheduled = shifts.reduce((sum, s) => {
    return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
  }, 0);

  const totalBreakMinutes = shifts.reduce((sum, s) => sum + s.breakMinutes, 0);

  const overtimeHours = completedShifts.reduce((sum, s) => {
    if (!s.checkedInAt || !s.checkedOutAt) return sum;
    const actual =
      (new Date(s.checkedOutAt).getTime() - new Date(s.checkedInAt).getTime()) / 3600000 -
      s.breakMinutes / 60;
    const scheduled = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
    return sum + Math.max(0, actual - scheduled);
  }, 0);

  const avgCheckInDelay =
    checkedIn.length > 0
      ? checkedIn.reduce((sum, s) => {
          if (!s.checkedInAt) return sum;
          return (
            sum +
            Math.max(
              0,
              (new Date(s.checkedInAt).getTime() - new Date(s.startTime).getTime()) / 60000,
            )
          );
        }, 0) / checkedIn.length
      : 0;

  // 4. Load task logs
  const tasks = await prisma.staffTaskLog.findMany({
    where: {
      staffId,
      createdAt: { gte: dateFrom, lte: dateTo },
    },
  });

  // 5. Calculate role-specific metrics
  const roleSpecific = await calculateRoleSpecificMetrics(staff, eventId, dateFrom, dateTo, prisma);

  // 6. Load evaluations
  const evaluations = await prisma.staffEvaluation.findMany({
    where: {
      staffId,
      eventId,
    },
    orderBy: { createdAt: "desc" },
  });

  const evalCategories: Record<string, number[]> = {};
  for (const evaluation of evaluations) {
    const ratings = evaluation.ratings as Record<string, number>;
    for (const [category, score] of Object.entries(ratings)) {
      if (!evalCategories[category]) evalCategories[category] = [];
      evalCategories[category].push(score);
    }
  }

  const avgCategories: Record<string, number> = {};
  for (const [category, scores] of Object.entries(evalCategories)) {
    avgCategories[category] =
      Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100;
  }

  // Determine trend from last 3 evaluations
  let trend: "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA" = "INSUFFICIENT_DATA";
  if (evaluations.length >= 3) {
    const recent = evaluations.slice(0, 3).map((e) => e.overall);
    if (recent[0] > recent[1] && recent[1] > recent[2]) trend = "IMPROVING";
    else if (recent[0] < recent[1] && recent[1] < recent[2]) trend = "DECLINING";
    else trend = "STABLE";
  }

  return {
    staffId,
    staffName: staff.name,
    role: staff.role as StaffRole,
    period: { from: dateFrom, to: dateTo },
    attendance: {
      totalShifts: shifts.length,
      completedShifts: completedShifts.length,
      noShows: noShows.length,
      punctualityRate:
        checkedIn.length > 0
          ? Math.round((onTimeCheckIns.length / checkedIn.length) * 10000) / 100
          : 100,
      attendanceRate:
        shifts.length > 0
          ? Math.round(((shifts.length - noShows.length) / shifts.length) * 10000) / 100
          : 100,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
      totalHoursScheduled: Math.round(totalHoursScheduled * 100) / 100,
      totalBreakMinutes,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      avgCheckInDelay: Math.round(avgCheckInDelay * 10) / 10,
    },
    productivity: {
      tasksCompleted: tasks.length,
      tasksPerHour:
        totalHoursWorked > 0 ? Math.round((tasks.length / totalHoursWorked) * 100) / 100 : 0,
      avgTaskDuration: null, // Calculated if metadata includes duration
      roleSpecific,
    },
    evaluations: {
      count: evaluations.length,
      avgOverall:
        evaluations.length > 0
          ? Math.round(
              (evaluations.reduce((s, e) => s + e.overall, 0) / evaluations.length) * 100,
            ) / 100
          : null,
      categories: avgCategories,
      trend,
    },
  };
}

async function calculateRoleSpecificMetrics(
  staff: StaffMember,
  eventId: string,
  dateFrom: Date,
  dateTo: Date,
  prisma: PrismaClient,
): Promise<RoleSpecificMetrics | null> {
  switch (staff.role) {
    case "REGISTRATION_CLERK": {
      const tasks = await prisma.staffTaskLog.findMany({
        where: {
          staffId: staff.id,
          action: "processed_participant",
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      });

      const durations = tasks
        .map((t) => (t.metadata as any)?.duration)
        .filter((d) => typeof d === "number");

      return {
        type: "REGISTRATION_CLERK",
        participantsProcessed: tasks.length,
        avgProcessingTimeMinutes:
          durations.length > 0
            ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10
            : 0,
        peakThroughputPerHour: calculatePeakThroughput(tasks),
        errorRate: 0, // Calculated from correction logs
      };
    }

    case "INTERPRETER": {
      const assignments = await prisma.interpreterAssignment.findMany({
        where: {
          staffId: staff.id,
          startTime: { gte: dateFrom },
          endTime: { lte: dateTo },
        },
        include: { service: true },
      });

      const activeMins = assignments
        .filter((a) => a.isLead)
        .reduce(
          (sum, a) =>
            sum + (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000,
          0,
        );

      const languagePairs = [
        ...new Set(assignments.map((a) => `${a.service.fromLanguage}->${a.service.toLanguage}`)),
      ];

      return {
        type: "INTERPRETER",
        sessionsInterpreted: assignments.length,
        totalActiveMinutes: Math.round(activeMins),
        languagePairsCovered: languagePairs,
        fatigueViolations: 0, // Calculated from rotation gap analysis
        avgSessionRating: null,
      };
    }

    default:
      return null;
  }
}

function calculatePeakThroughput(tasks: { createdAt: Date }[]): number {
  if (tasks.length === 0) return 0;

  // Group tasks by hour and find the max
  const hourBuckets: Map<string, number> = new Map();
  for (const task of tasks) {
    const hour = new Date(task.createdAt).toISOString().slice(0, 13);
    hourBuckets.set(hour, (hourBuckets.get(hour) || 0) + 1);
  }

  return Math.max(...hourBuckets.values());
}
```

### 5.9 Volunteer Onboarding Pipeline

The volunteer onboarding pipeline manages the full lifecycle from application through training to event-day assignment.

```typescript
// ─── Volunteer Pipeline State Machine ───────────────────────────────────

type VolunteerAction =
  | "SUBMIT"
  | "START_REVIEW"
  | "SHORTLIST"
  | "SCHEDULE_INTERVIEW"
  | "ACCEPT"
  | "WAITLIST"
  | "DECLINE"
  | "WITHDRAW";

const VOLUNTEER_TRANSITIONS: Record<string, VolunteerAction[]> = {
  SUBMITTED: ["START_REVIEW", "DECLINE", "WITHDRAW"],
  UNDER_REVIEW: ["SHORTLIST", "DECLINE", "WITHDRAW"],
  SHORTLISTED: ["SCHEDULE_INTERVIEW", "ACCEPT", "DECLINE", "WITHDRAW"],
  INTERVIEW_SCHEDULED: ["ACCEPT", "WAITLIST", "DECLINE", "WITHDRAW"],
  ACCEPTED: ["WITHDRAW"],
  WAITLISTED: ["ACCEPT", "DECLINE", "WITHDRAW"],
  DECLINED: [],
  WITHDRAWN: [],
};

// ─── Pipeline Processing ────────────────────────────────────────────────

async function processVolunteerApplication(
  applicationId: string,
  action: VolunteerAction,
  actorId: string,
  payload: {
    reviewNotes?: string;
    interviewDate?: string;
    assignedRole?: StaffRole;
    assignedTeam?: string;
  },
  prisma: PrismaClient,
): Promise<VolunteerApplication> {
  return prisma.$transaction(async (tx) => {
    const application = await tx.volunteerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new AppError("APPLICATION_NOT_FOUND", 404);

    const validActions = VOLUNTEER_TRANSITIONS[application.status];
    if (!validActions?.includes(action)) {
      throw new AppError(`Invalid action ${action} for status ${application.status}`, 400);
    }

    const statusMap: Record<VolunteerAction, string> = {
      SUBMIT: "SUBMITTED",
      START_REVIEW: "UNDER_REVIEW",
      SHORTLIST: "SHORTLISTED",
      SCHEDULE_INTERVIEW: "INTERVIEW_SCHEDULED",
      ACCEPT: "ACCEPTED",
      WAITLIST: "WAITLISTED",
      DECLINE: "DECLINED",
      WITHDRAW: "WITHDRAWN",
    };

    const updateData: Record<string, unknown> = {
      status: statusMap[action],
      reviewedBy: actorId,
      reviewedAt: new Date(),
      reviewNotes: payload.reviewNotes || application.reviewNotes,
    };

    // On acceptance, create a StaffMember record
    if (action === "ACCEPT") {
      const staffMember = await tx.staffMember.create({
        data: {
          tenantId: application.tenantId,
          eventId: application.eventId,
          name: application.applicantName,
          phone: application.phone,
          email: application.email,
          photo: application.photoUrl,
          role: (payload.assignedRole as StaffRole) || "VOLUNTEER",
          team: payload.assignedTeam || null,
          skills: application.skills,
          status: "OFF_DUTY",
        },
      });

      updateData.staffMemberId = staffMember.id;

      // Create mandatory training records
      const mandatoryTrainings = [
        {
          trainingType: "ORIENTATION" as TrainingType,
          title: "General Event Orientation",
        },
        {
          trainingType: "SAFETY_TRAINING" as TrainingType,
          title: "Emergency Procedures & Safety",
        },
      ];

      for (const training of mandatoryTrainings) {
        await tx.trainingRecord.create({
          data: {
            tenantId: application.tenantId,
            eventId: application.eventId,
            staffId: staffMember.id,
            trainingType: training.trainingType,
            title: training.title,
            passed: false,
          },
        });
      }

      // Send acceptance notification
      await sendNotification({
        recipientEmail: application.email,
        type: "VOLUNTEER_ACCEPTED",
        title: "Volunteer Application Accepted",
        body:
          `Congratulations! Your volunteer application for the event has been accepted. ` +
          `You have been assigned the role of ${payload.assignedRole || "VOLUNTEER"}. ` +
          `Please check your email for training schedule details.`,
      });
    }

    if (action === "DECLINE") {
      await sendNotification({
        recipientEmail: application.email,
        type: "VOLUNTEER_DECLINED",
        title: "Volunteer Application Update",
        body:
          `Thank you for your interest in volunteering. Unfortunately, we are unable ` +
          `to offer you a position at this time.${
            payload.reviewNotes ? ` Note: ${payload.reviewNotes}` : ""
          }`,
      });
    }

    return tx.volunteerApplication.update({
      where: { id: applicationId },
      data: updateData,
    });
  });
}

// ─── Training Completion Check ──────────────────────────────────────────

async function checkTrainingReadiness(
  staffId: string,
  eventId: string,
  prisma: PrismaClient,
): Promise<{
  isReady: boolean;
  completedTrainings: number;
  requiredTrainings: number;
  pendingTrainings: { title: string; type: TrainingType; scheduledDate: string | null }[];
}> {
  const trainings = await prisma.trainingRecord.findMany({
    where: { staffId, eventId },
  });

  const mandatoryTypes: TrainingType[] = ["ORIENTATION", "SAFETY_TRAINING"];

  const completedTrainings = trainings.filter((t) => t.passed).length;
  const pendingTrainings = trainings
    .filter((t) => !t.passed)
    .map((t) => ({
      title: t.title,
      type: t.trainingType as TrainingType,
      scheduledDate: t.scheduledDate?.toISOString() || null,
    }));

  const mandatoryComplete = mandatoryTypes.every((type) =>
    trainings.some((t) => t.trainingType === type && t.passed),
  );

  return {
    isReady: mandatoryComplete,
    completedTrainings,
    requiredTrainings: trainings.length,
    pendingTrainings,
  };
}
```

### 5.10 Staff Mobile App Features

The staff mobile app provides essential workforce operations through a touch-optimized interface.

```typescript
// ─── Mobile App API Endpoints ───────────────────────────────────────────

// These endpoints power the React Native / PWA mobile experience

interface MobileStaffHome {
  staff: {
    id: string;
    name: string;
    role: StaffRole;
    team: string | null;
    status: StaffStatus;
    photo: string | null;
  };
  currentShift: {
    id: string;
    zone: string | null;
    location: string | null;
    task: string | null;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
    checkedInAt: string | null;
    breakMinutes: number;
  } | null;
  upcomingShifts: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    zone: string | null;
    task: string | null;
  }[];
  notifications: {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
  }[];
  quickActions: {
    canCheckIn: boolean;
    canCheckOut: boolean;
    canStartBreak: boolean;
    canEndBreak: boolean;
    canRequestSwap: boolean;
    pendingSwaps: number;
  };
}

// GET /api/mobile/staff/home
async function getMobileHome(staffId: string, prisma: PrismaClient): Promise<MobileStaffHome> {
  const now = new Date();
  const today = new Date(now.toISOString().split("T")[0]);

  const staff = await prisma.staffMember.findUnique({
    where: { id: staffId },
  });
  if (!staff) throw new AppError("STAFF_NOT_FOUND", 404);

  // Find current shift (checked in, or next scheduled for today)
  const currentShift = await prisma.staffShift.findFirst({
    where: {
      staffId,
      date: today,
      status: { in: ["CHECKED_IN", "SCHEDULED"] },
      startTime: { lte: new Date(now.getTime() + 60 * 60000) }, // Within next hour
      endTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
  });

  // Upcoming shifts (next 7 days)
  const upcomingShifts = await prisma.staffShift.findMany({
    where: {
      staffId,
      date: { gt: today },
      status: "SCHEDULED",
    },
    orderBy: { startTime: "asc" },
    take: 10,
  });

  // Pending swap requests
  const pendingSwaps = await prisma.shiftSwapRequest.count({
    where: {
      targetStaffId: staffId,
      status: "PENDING_PEER",
    },
  });

  return {
    staff: {
      id: staff.id,
      name: staff.name,
      role: staff.role as StaffRole,
      team: staff.team,
      status: staff.status as StaffStatus,
      photo: staff.photo,
    },
    currentShift: currentShift
      ? {
          id: currentShift.id,
          zone: currentShift.zone,
          location: currentShift.location,
          task: currentShift.task,
          startTime: currentShift.startTime.toISOString(),
          endTime: currentShift.endTime.toISOString(),
          status: currentShift.status as ShiftStatus,
          checkedInAt: currentShift.checkedInAt?.toISOString() || null,
          breakMinutes: currentShift.breakMinutes,
        }
      : null,
    upcomingShifts: upcomingShifts.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split("T")[0],
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      zone: s.zone,
      task: s.task,
    })),
    notifications: [], // Loaded separately
    quickActions: {
      canCheckIn: !!currentShift && currentShift.status === "SCHEDULED",
      canCheckOut: !!currentShift && currentShift.status === "CHECKED_IN",
      canStartBreak: staff.status === "ACTIVE",
      canEndBreak: staff.status === "ON_BREAK",
      canRequestSwap: upcomingShifts.length > 0,
      pendingSwaps,
    },
  };
}

// ─── Mobile Quick Actions ───────────────────────────────────────────────

// POST /api/mobile/staff/quick-check-in
// Simplified check-in using device location
async function mobileQuickCheckIn(
  staffId: string,
  deviceLocation: { lat: number; lng: number } | null,
  prisma: PrismaClient,
): Promise<CheckInResult> {
  // Find the current or next shift for today
  const now = new Date();
  const today = new Date(now.toISOString().split("T")[0]);

  const shift = await prisma.staffShift.findFirst({
    where: {
      staffId,
      date: today,
      status: "SCHEDULED",
      startTime: { lte: new Date(now.getTime() + 30 * 60000) }, // Within 30 min
    },
    orderBy: { startTime: "asc" },
  });

  if (!shift) {
    throw new AppError("NO_ELIGIBLE_SHIFT", 404);
  }

  return checkInStaff(
    staffId,
    shift.id,
    "MOBILE_APP",
    deviceLocation ? `${deviceLocation.lat},${deviceLocation.lng}` : null,
    prisma,
  );
}
```

---

## 6. User Interface

### 6.1 Shift Scheduling Interface

The shift scheduling interface provides a visual timeline for managing staff assignments with drag-and-drop powered by `@dnd-kit`.

**Source wireframe (verbatim from system design):**

```
┌──────────────────────────────────────────────────────────────────┐
│  Staff Schedule - Feb 10, 2026              [Day] [Week] [List]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Zone: Registration        Team: Registration Team A              │
│                                                                   │
│  06:00  07:00  08:00  09:00  10:00  11:00  12:00  13:00  14:00  │
│  ──────────────────────────────────────────────────────────────── │
│  Ahmed  ├────── Desk A ──────────┤ Break ├── Desk A ──┤          │
│  Sara   ├────── Desk B ──────────┤ Break ├── Desk B ──┤          │
│  Omar         ├────── Desk C ──────────┤ Break ├── Desk C ──┤   │
│  Fatima       ├────── Desk D ──────────┤ Break ├── Desk D ──┤   │
│                                                                   │
│  Zone: VIP Protocol        Team: Protocol                        │
│  ──────────────────────────────────────────────────────────────── │
│  David  ├────── VIP Lounge ──────────────────────────────────┤   │
│  Maria  ├────── Airport Arrivals ──────┤ VIP Lounge ────────┤   │
│                                                                   │
│  Coverage Gap Alert: Gate 3 has no usher from 12:00-13:00        │
│  [Assign staff]                                                   │
│                                                                   │
│  Unassigned: 3 volunteers available  [View & Assign]             │
└──────────────────────────────────────────────────────────────────┘
```

**Enhanced scheduling features:**

- Drag-and-drop shift blocks on a timeline (same `@dnd-kit` used in form designer)
- **Coverage gap detection**: system highlights time/zone combinations with no assigned staff
- **Conflict detection**: warn if a staff member is double-booked
- **Skill filter**: when filling a gap at the Interpretation Booth, filter to staff with French language skill
- **Auto-schedule**: algorithm distributes shifts evenly across available staff, respecting maximum hours and required breaks
- **Shift swap**: staff can request to swap shifts with each other, pending manager approval

**Enhanced Wireframe with Drag-and-Drop and Gap Detection:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Staff Schedule                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Event: 38th AU Summit    Date: Feb 10, 2026                     │   │
│  │  [◀ Prev Day]  [Today]  [Next Day ▶]    [Day] [Week] [List]     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────┐  ┌──────────────────────────────────────────────────────┐ │
│  │ FILTERS  │  │  TIMELINE VIEW                                      │ │
│  │          │  │                                                      │ │
│  │ Zone:    │  │  06:00  08:00  10:00  12:00  14:00  16:00  18:00   │ │
│  │ [All   ▼]│  │  ═══════════════════════════════════════════════════ │ │
│  │          │  │                                                      │ │
│  │ Team:    │  │  REGISTRATION ZONE  (4/4 staffed)         ● Full   │ │
│  │ [All   ▼]│  │  ─────────────────────────────────────────────────  │ │
│  │          │  │  Ahmed  ┃██ Desk A ████████┃ Brk ┃██ Desk A ██┃    │ │
│  │ Role:    │  │  Sara   ┃██ Desk B ████████┃ Brk ┃██ Desk B ██┃    │ │
│  │ [All   ▼]│  │  Omar      ┃██ Desk C ████████┃ Brk ┃██ Desk C ██┃│ │
│  │          │  │  Fatima     ┃██ Desk D ████████┃ Brk ┃██ Desk D ██┃│ │
│  │ Skill:   │  │                                                      │ │
│  │ [     ▼] │  │  VIP PROTOCOL  (2/2 staffed)              ● Full   │ │
│  │          │  │  ─────────────────────────────────────────────────  │ │
│  │ Status:  │  │  David  ┃████ VIP Lounge ██████████████████████┃    │ │
│  │ [All   ▼]│  │  Maria  ┃██ Airport Arr ████┃██ VIP Lounge ███┃    │ │
│  │          │  │                                                      │ │
│  │──────────│  │  GATE 3  (0/1 staffed)                 ⚠ GAP      │ │
│  │ ACTIONS  │  │  ─────────────────────────────────────────────────  │ │
│  │          │  │            ┃░░░░░ UNCOVERED ░░░░░┃                   │ │
│  │ [Auto-   │  │            12:00     to     13:00                    │ │
│  │ Schedule]│  │            [Assign Staff ▼]                          │ │
│  │          │  │            Suggested: Ali (Usher, available)        │ │
│  │ [Find    │  │                                                      │ │
│  │  Gaps]   │  │  ═══════════════════════════════════════════════════ │ │
│  │          │  │                                                      │ │
│  │ [Export  │  │  SUMMARY BAR                                        │ │
│  │  PDF]    │  │  ┌──────────────────────────────────────────────┐   │ │
│  │          │  │  │ Total: 8 staff │ On duty: 6 │ Gaps: 1       │   │ │
│  └──────────┘  │  │ Hours scheduled: 64h │ Overtime risk: 0     │   │ │
│                │  └──────────────────────────────────────────────┘   │ │
│                └──────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  UNASSIGNED STAFF POOL                            [3 available]  │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │ 👤 Ali       │  │ 👤 Yusuf     │  │ 👤 Leila     │           │   │
│  │  │ Role: Usher  │  │ Role: Vol.   │  │ Role: Vol.   │           │   │
│  │  │ Skills:      │  │ Skills:      │  │ Skills:      │           │   │
│  │  │ English, FR  │  │ Arabic       │  │ French,      │           │   │
│  │  │              │  │              │  │ First Aid    │           │   │
│  │  │ [Drag to     │  │ [Drag to     │  │ [Drag to     │           │   │
│  │  │  assign]     │  │  assign]     │  │  assign]     │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**React Component Structure:**

```typescript
// ─── Shift Scheduler Component Tree ─────────────────────────────────────

// <ShiftScheduler>
//   <SchedulerToolbar>
//     <DateNavigation />
//     <ViewToggle views={["day", "week", "list"]} />
//   </SchedulerToolbar>
//   <SchedulerFilters>
//     <ZoneFilter />
//     <TeamFilter />
//     <RoleFilter />
//     <SkillFilter />
//     <StatusFilter />
//   </SchedulerFilters>
//   <DndContext onDragEnd={handleShiftDrop}>
//     <SchedulerTimeline>
//       {zones.map(zone => (
//         <ZoneRow key={zone.id}>
//           <ZoneHeader zone={zone} coverageStatus={zone.status} />
//           {zone.staff.map(staff => (
//             <StaffTimeline key={staff.id} staff={staff}>
//               {staff.shifts.map(shift => (
//                 <DraggableShiftBlock shift={shift} />
//               ))}
//             </StaffTimeline>
//           ))}
//           {zone.gaps.map(gap => (
//             <CoverageGapIndicator gap={gap} onAssign={handleGapAssign} />
//           ))}
//         </ZoneRow>
//       ))}
//     </SchedulerTimeline>
//     <UnassignedStaffPool>
//       {availableStaff.map(staff => (
//         <DraggableStaffCard staff={staff} />
//       ))}
//     </UnassignedStaffPool>
//   </DndContext>
//   <SchedulerSummaryBar stats={scheduleStats} />
// </ShiftScheduler>

import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";

interface ShiftSchedulerProps {
  eventId: string;
  date: string;
}

function ShiftScheduler({ eventId, date }: ShiftSchedulerProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "list">("day");
  const [filters, setFilters] = useState<ShiftFilters>({});
  const [activeShift, setActiveShift] = useState<ShiftBlock | null>(null);

  // Fetch schedule data with SWR or React Query
  const { data: schedule, mutate } = useSWR(
    `/api/events/${eventId}/shifts?date=${date}&${new URLSearchParams(filters)}`,
    fetcher
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const shiftId = active.id as string;
    const targetSlot = over.data.current as {
      staffId: string;
      startTime: string;
      zone: string;
    };

    // Move shift to new position
    await fetch(`/api/events/${eventId}/shifts/${shiftId}`, {
      method: "PATCH",
      body: JSON.stringify({
        staffId: targetSlot.staffId,
        startTime: targetSlot.startTime,
        zone: targetSlot.zone,
      }),
    });

    mutate(); // Refresh schedule
  };

  return (
    <div className="flex flex-col h-full">
      <SchedulerToolbar
        date={date}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onAutoSchedule={() => handleAutoSchedule(eventId, date)}
      />
      <div className="flex flex-1 overflow-hidden">
        <SchedulerFilters filters={filters} onChange={setFilters} />
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SchedulerTimeline
            schedule={schedule}
            viewMode={viewMode}
            date={date}
          />
          <DragOverlay>
            {activeShift && <ShiftBlockPreview shift={activeShift} />}
          </DragOverlay>
        </DndContext>
      </div>
      <SchedulerSummaryBar stats={schedule?.meta} />
    </div>
  );
}
```

### 6.2 Staff Dashboard

The staff dashboard provides a comprehensive overview for shift managers and HR coordinators.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Staff Dashboard                                          Feb 10, 2026  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  TOTAL STAFF │  │  ON DUTY    │  │  ON BREAK   │  │  ABSENT/     │  │
│  │              │  │             │  │             │  │  NO-SHOW     │  │
│  │    124       │  │    87       │  │    12       │  │    5         │  │
│  │              │  │  ● Active   │  │  ◐ Break    │  │  ○ Absent    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────┐  ┌────────────────────────────┐   │
│  │  TEAM AVAILABILITY MAP           │  │  ALERTS & NOTIFICATIONS   │   │
│  │                                   │  │                           │   │
│  │  Registration Team A  ████████░░ │  │  ⚠ Late check-in:        │   │
│  │    8/10 present                   │  │    Ahmed (Gate 3) +22min  │   │
│  │                                   │  │                           │   │
│  │  Registration Team B  ██████████ │  │  ⚠ Coverage gap:         │   │
│  │    10/10 present                  │  │    Gate 3, 12:00-13:00   │   │
│  │                                   │  │    No usher assigned     │   │
│  │  VIP Protocol         ██████░░░░ │  │                           │   │
│  │    6/10 present                   │  │  ⓘ Shift swap request:  │   │
│  │                                   │  │    Sara <-> Omar         │   │
│  │  Transport            █████████░ │  │    Pending approval      │   │
│  │    9/10 present                   │  │                           │   │
│  │                                   │  │  ⓘ Overtime alert:      │   │
│  │  Interpretation       ████████░░ │  │    David (VIP Protocol)  │   │
│  │    8/10 present                   │  │    +1.5h over scheduled  │   │
│  │                                   │  │                           │   │
│  │  Medical              ██████████ │  │  [View All Alerts →]     │   │
│  │    4/4 present                    │  │                           │   │
│  └──────────────────────────────────┘  └────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  REAL-TIME STAFF STATUS                                [Search] │   │
│  │                                                                   │   │
│  │  Name         Role              Zone              Status    Since │   │
│  │  ────────────────────────────────────────────────────────────────│   │
│  │  Ahmed Al-F.  Registration Clk  Registration      ● Active  06:02│   │
│  │  Sara M.      Registration Clk  Registration      ● Active  06:00│   │
│  │  David K.     Protocol Officer  VIP Lounge        ● Active  07:30│   │
│  │  Maria L.     Protocol Officer  Airport Arrivals  ● Active  05:45│   │
│  │  Omar S.      Registration Clk  --                ◐ Break   11:30│   │
│  │  Yusuf T.     Volunteer         --                ○ Off     --   │   │
│  │  Ali N.       Usher             Gate 1            ● Active  08:00│   │
│  │  ...                                                              │   │
│  │                                                                   │   │
│  │  [1] [2] [3] ... [5]    Showing 1-20 of 124                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  TODAY'S PERFORMANCE        │  │  SHIFT SWAP REQUESTS           │   │
│  │                              │  │                                │   │
│  │  Avg check-in delay: 4 min  │  │  3 pending  │ 2 approved today│   │
│  │  Punctuality rate: 94%      │  │                                │   │
│  │  Participants processed: 312│  │  Sara -> Omar  [Approve][Deny]│   │
│  │  Avg processing time: 3.8m  │  │  Feb 10 PM shift              │   │
│  │                              │  │                                │   │
│  │  [Detailed Report →]        │  │  Fatima -> Leila  [Review]    │   │
│  └─────────────────────────────┘  │  Feb 11 AM shift              │   │
│                                    └────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Structure:**

```typescript
// <StaffDashboard>
//   <DashboardHeader date={date} eventName={event.name} />
//   <StaffStatusCards total={124} onDuty={87} onBreak={12} absent={5} />
//   <div className="grid grid-cols-2 gap-4">
//     <TeamAvailabilityMap teams={teams} />
//     <AlertsPanel alerts={alerts} />
//   </div>
//   <StaffStatusTable
//     staff={staff}
//     filters={filters}
//     pagination={pagination}
//   />
//   <div className="grid grid-cols-2 gap-4">
//     <PerformanceSummary metrics={todayMetrics} />
//     <ShiftSwapPanel swapRequests={pendingSwaps} onAction={handleSwapAction} />
//   </div>
// </StaffDashboard>
```

### 6.3 Interpreter Assignment Board

The interpreter assignment board provides a specialized view for the Chief Interpreter to manage booth assignments, rotation schedules, and real-time interpreter status.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Interpreter Assignment Board                            Feb 10, 2026   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  SESSION: Opening Ceremony (09:00 - 12:00) - Main Hall           │   │
│  │  Languages: EN→FR, FR→EN, EN→AR, AR→EN, EN→PT                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  BOOTH TIMELINE                                                   │   │
│  │                                                                   │   │
│  │          09:00   09:30   10:00   10:30   11:00   11:30   12:00  │   │
│  │  ────────────────────────────────────────────────────────────── │   │
│  │  Booth 1 (EN→FR, Ch.2)                                          │   │
│  │  Lead:   ┃ A ██████┃ B ██████┃ A ██████┃ C ██████┃ B ████┃ C ██┃   │
│  │  Supp:   ┃ B ░░░░░░┃ A ░░░░░░┃ C ░░░░░░┃ A ░░░░░░┃ C ░░░░┃ B ░░┃   │
│  │                                                                   │   │
│  │  Booth 2 (EN→AR, Ch.4)                                          │   │
│  │  Lead:   ┃ D ██████┃ E ██████┃ D ██████┃ F ██████┃ E ████┃ F ██┃   │
│  │  Supp:   ┃ E ░░░░░░┃ D ░░░░░░┃ F ░░░░░░┃ D ░░░░░░┃ F ░░░░┃ E ░░┃   │
│  │                                                                   │   │
│  │  Booth 3 (EN→PT, Ch.6)                                          │   │
│  │  Lead:   ┃ G ██████┃ H ██████┃ G ██████┃ H ██████┃ G ████┃ H ██┃   │
│  │  Supp:   ┃ H ░░░░░░┃ G ░░░░░░┃ H ░░░░░░┃ G ░░░░░░┃ H ░░░░┃ G ░░┃   │
│  │                                                                   │   │
│  │  ████ = Lead (actively interpreting)                              │   │
│  │  ░░░░ = Support (monitoring, ready to take over)                 │   │
│  │  ▓▓▓▓ = Resting (between active blocks)                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  INTERPRETER STATUS          │  │  ROTATION VIEWER               │   │
│  │                              │  │                                │   │
│  │  Name    Lang   Status  Time│  │  Next rotation in: 12:34      │   │
│  │  ──────────────────────────│  │                                │   │
│  │  Int. A  EN→FR  ██ Lead  :24│  │  Current block: 09:00-09:30   │   │
│  │  Int. B  EN→FR  ░░ Supp  :24│  │  Lead: Interpreter A          │   │
│  │  Int. C  EN→FR  ▓▓ Rest  :54│  │  Support: Interpreter B       │   │
│  │  Int. D  EN→AR  ██ Lead  :24│  │                                │   │
│  │  Int. E  EN→AR  ░░ Supp  :24│  │  Next block: 09:30-10:00     │   │
│  │  Int. F  EN→AR  ▓▓ Rest  :54│  │  Lead: Interpreter B          │   │
│  │  Int. G  EN→PT  ██ Lead  :24│  │  Support: Interpreter A       │   │
│  │  Int. H  EN→PT  ░░ Supp  :24│  │                                │   │
│  │                              │  │  ⚠ Int. C needed at 10:00    │   │
│  │  Fatigue alerts: 0          │  │     (ensure 30min rest met)   │   │
│  └─────────────────────────────┘  └────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  UNASSIGNED GAPS                                                  │   │
│  │                                                                   │   │
│  │  ⚠ Session: Economic Forum (14:00-17:00)                        │   │
│  │    AR→PT: No certified interpreter available                     │   │
│  │    [Search External] [Request from Pool] [Flag as Critical]      │   │
│  │                                                                   │   │
│  │  ⚠ Session: Climate Panel (15:00-16:30)                         │   │
│  │    EN→ES: Only 1 interpreter (need 2 minimum)                    │   │
│  │    [Assign from Available] [Request Overtime Extension]           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Structure:**

```typescript
// <InterpreterAssignmentBoard>
//   <SessionSelector sessions={meetingSessions} onSelect={selectSession} />
//   <BoothTimeline>
//     {booths.map(booth => (
//       <BoothRow key={booth.id}>
//         <BoothHeader booth={booth} languagePair={booth.pair} channel={booth.channel} />
//         <RotationTimeline
//           blocks={booth.rotationBlocks}
//           sessionStart={session.startTime}
//           sessionEnd={session.endTime}
//         />
//       </BoothRow>
//     ))}
//   </BoothTimeline>
//   <div className="grid grid-cols-2 gap-4">
//     <InterpreterStatusPanel interpreters={activeInterpreters} />
//     <RotationViewer
//       currentBlock={currentBlock}
//       nextBlock={nextBlock}
//       countdown={rotationCountdown}
//     />
//   </div>
//   <UnassignedGapsPanel gaps={unassignedGaps} onAction={handleGapAction} />
// </InterpreterAssignmentBoard>
```

### 6.4 Receiver Equipment Dashboard

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Receiver Equipment Dashboard                            Feb 10, 2026   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  TOTAL       │  │  CHECKED OUT│  │  AVAILABLE   │  │  LOST/       │  │
│  │              │  │             │  │              │  │  DAMAGED     │  │
│  │    500       │  │    342      │  │    145       │  │    13        │  │
│  │  receivers   │  │  68.4%      │  │  29.0%       │  │  $650       │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  UTILIZATION OVER TIME                                           │   │
│  │                                                                   │   │
│  │  400 ┤                    ╭─────╮                                │   │
│  │      │                ╭───╯     ╰───╮                            │   │
│  │  300 ┤            ╭───╯             ╰───╮                        │   │
│  │      │        ╭───╯                     ╰───╮                    │   │
│  │  200 ┤    ╭───╯                             ╰───╮               │   │
│  │      │╭───╯                                     ╰───╮           │   │
│  │  100 ┤                                               ╰───       │   │
│  │      │                                                           │   │
│  │    0 ┼────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────   │   │
│  │      06   07   08   09   10   11   12   13   14   15   16       │   │
│  │                                                                   │   │
│  │  ── Checked Out    ── Available    ── Charging                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Receivers: 500 total | 342 checked out | 145 available | 8 charging   │
│  | 5 lost                                                                │
│                                                                          │
│  Lost receiver cost this event: $250 (5 x $50)                         │
│  Top unreturned: Table showing participant names with overdue receivers │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  OVERDUE RECEIVERS                            [Send Reminders]  │   │
│  │                                                                   │   │
│  │  Serial      Participant         Checked Out   Overdue By        │   │
│  │  ──────────────────────────────────────────────────────────────  │   │
│  │  RX-0142     John Smith (USA)    09:15         3h 45m           │   │
│  │  RX-0287     Marie D. (France)   08:30         4h 30m           │   │
│  │  RX-0391     Ahmed K. (Egypt)    10:00         3h 00m           │   │
│  │  RX-0455     Li Wei (China)      07:45         5h 15m           │   │
│  │                                                                   │   │
│  │  [Bulk Notify All Overdue]  [Mark Selected as Lost]             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  LANGUAGE DISTRIBUTION                                           │   │
│  │                                                                   │   │
│  │  Channel 2 (EN→FR):  148 receivers active                       │   │
│  │  Channel 3 (FR→EN):   42 receivers active                       │   │
│  │  Channel 4 (EN→AR):   89 receivers active                       │   │
│  │  Channel 5 (AR→EN):   31 receivers active                       │   │
│  │  Channel 6 (EN→PT):   32 receivers active                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Press Conference Management

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Press Conference Management                             Feb 10, 2026   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  UPCOMING CONFERENCES                          [+ New Conference] │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  Joint Press Conference: Climate Action Summit             │  │   │
│  │  │  📅 Feb 10, 2026  ⏰ 14:00-15:00  📍 Press Room A        │  │   │
│  │  │  Status: SCHEDULED        Pool Only: No                    │  │   │
│  │  │                                                            │  │   │
│  │  │  Speakers:                                                 │  │   │
│  │  │  1. H.E. John Doe - President, Republic of Kenya          │  │   │
│  │  │     Topic: Climate Finance Commitments                     │  │   │
│  │  │  2. Dr. Jane Smith - AU Commission Chair                   │  │   │
│  │  │     Topic: Continental Climate Strategy                    │  │   │
│  │  │                                                            │  │   │
│  │  │  Advisory: "Joint Statement on Climate Action"             │  │   │
│  │  │  ⏳ Embargo until: Feb 12, 14:00 UTC                      │  │   │
│  │  │                                                            │  │   │
│  │  │  [Edit] [Cancel] [Create Advisory] [Manage Speakers]       │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  Bilateral Press Briefing: Trade Agreement                 │  │   │
│  │  │  📅 Feb 10, 2026  ⏰ 16:30-17:00  📍 Press Room B        │  │   │
│  │  │  Status: SCHEDULED        Pool Only: Yes (TV Pool)         │  │   │
│  │  │                                                            │  │   │
│  │  │  Speakers:                                                 │  │   │
│  │  │  1. Min. Trade Affairs, Country A                          │  │   │
│  │  │  2. Min. Trade Affairs, Country B                          │  │   │
│  │  │                                                            │  │   │
│  │  │  [Edit] [Cancel] [Manage Pool Access]                      │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  CONFERENCE FORM (Create/Edit)                                    │   │
│  │                                                                   │   │
│  │  Title:  [Joint Press Conference: Climate Action Summit     ]    │   │
│  │  Date:   [2026-02-10]  Start: [14:00]  End: [15:00]             │   │
│  │  Room:   [Press Room A                                    ▼]    │   │
│  │  Pool:   [ ] Restricted to pool journalists only                 │   │
│  │                                                                   │   │
│  │  Speakers:  [+ Add Speaker]                                      │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ #  Name                Title                    [Actions]│   │   │
│  │  │ 1  H.E. John Doe      President, Republic of..  [↑][↓][x]│   │   │
│  │  │ 2  Dr. Jane Smith      AU Commission Chair       [↑][↓][x]│   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  [Save Draft]  [Schedule]  [Cancel]                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Interview Request Portal

The interview request portal serves two audiences: journalists submitting requests and delegation focal points reviewing them.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Interview Request Portal                                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  JOURNALIST VIEW: Submit Interview Request                       │   │
│  │                                                                   │   │
│  │  Target:  ( ) Specific Delegate  (●) Delegation                  │   │
│  │                                                                   │   │
│  │  Delegation: [Republic of Kenya                            ▼]    │   │
│  │  Or search delegate: [Type to search participants...        ]    │   │
│  │                                                                   │   │
│  │  Your Outlet:  [BBC World Service                           ]    │   │
│  │  Topic:        [Climate finance commitments and AU strategy ]    │   │
│  │                                                                   │   │
│  │  Preferred Date: [2026-02-11]   Duration: [30 min  ▼]           │   │
│  │                                                                   │   │
│  │  Format:  (●) In Person  ( ) Phone  ( ) Video  ( ) Written      │   │
│  │                                                                   │   │
│  │  Additional Notes:                                                │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ I would like to discuss the new climate finance          │   │   │
│  │  │ framework announced at the plenary session.              │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  [Submit Request]                                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  MY REQUESTS                                                      │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  Republic of Kenya - Climate Finance                       │  │   │
│  │  │  Status: ● SCHEDULED  │  Feb 11, 10:00  │  Room 204       │  │   │
│  │  │  Format: In Person    │  Duration: 30 min                  │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  AU Commission - Continental Strategy                      │  │   │
│  │  │  Status: ◐ FORWARDED  │  Pending focal point response      │  │   │
│  │  │  Format: Video        │  Duration: 20 min                  │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  Republic of Ghana - Trade Partnership                     │  │   │
│  │  │  Status: ○ DECLINED   │  "Schedule conflicts"              │  │   │
│  │  │  Format: In Person    │  Submitted: Feb 9                  │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  FOCAL POINT VIEW: Review Interview Requests                     │   │
│  │                                                                   │   │
│  │  Delegation: Republic of Kenya        Pending: 3 requests        │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  From: Marie Dupont (Le Monde)                             │  │   │
│  │  │  Topic: Climate finance commitments                        │  │   │
│  │  │  Format: In Person  │  Preferred: Feb 11, AM               │  │   │
│  │  │  Duration: 30 min                                          │  │   │
│  │  │                                                            │  │   │
│  │  │  Schedule: [2026-02-11]  Time: [10:00]                     │  │   │
│  │  │  Location: [Room 204                                  ▼]  │  │   │
│  │  │                                                            │  │   │
│  │  │  [Approve & Schedule]  [Decline]  [Forward to Delegate]    │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  From: James Chen (Reuters)                                │  │   │
│  │  │  Topic: AU trade agreement impact                          │  │   │
│  │  │  Format: Phone  │  Preferred: Feb 12, PM                   │  │   │
│  │  │  Duration: 15 min                                          │  │   │
│  │  │                                                            │  │   │
│  │  │  [Approve & Schedule]  [Decline]  [Forward to Delegate]    │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.7 Media Advisory Editor

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Media Advisory Editor                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Title:   [Joint Statement on Climate Action                  ]  │   │
│  │                                                                   │   │
│  │  Linked Press Conference: [Climate Action Summit ▼] (optional)   │   │
│  │                                                                   │   │
│  │  Embargo:  [●] Set embargo    [ ] Immediate release              │   │
│  │  Embargo until: [2026-02-12]  [14:00]  [UTC ▼]                  │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  ADVISORY BODY (Rich Text Editor)                        │   │   │
│  │  │  ┌──────────────────────────────────────────────────┐   │   │   │
│  │  │  │ B  I  U  H1  H2  •  1.  ""  🔗  📎             │   │   │   │
│  │  │  ├──────────────────────────────────────────────────┤   │   │   │
│  │  │  │                                                  │   │   │   │
│  │  │  │  MEDIA ADVISORY                                  │   │   │   │
│  │  │  │                                                  │   │   │   │
│  │  │  │  Joint Statement on Climate Action               │   │   │   │
│  │  │  │                                                  │   │   │   │
│  │  │  │  The African Union Commission and Member         │   │   │   │
│  │  │  │  States announce a comprehensive climate         │   │   │   │
│  │  │  │  action framework...                             │   │   │   │
│  │  │  │                                                  │   │   │   │
│  │  │  └──────────────────────────────────────────────────┘   │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Attachments:                                [+ Add Attachment]   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  📄 statement.pdf (240 KB)                         [x]   │   │   │
│  │  │  📄 backgrounder.pdf (120 KB)                      [x]   │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Distribution:                                                    │   │
│  │  (●) All accredited media                                        │   │
│  │  ( ) Selected participants  [Choose recipients...]                │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  EMBARGO PREVIEW                                         │   │   │
│  │  │                                                          │   │   │
│  │  │  ⏳ EMBARGOED - Not for publication before               │   │   │
│  │  │     Feb 12, 2026, 14:00 UTC                              │   │   │
│  │  │                                                          │   │   │
│  │  │  Recipients will see this banner until embargo lifts.    │   │   │
│  │  │  At 14:00 UTC, the system will automatically:            │   │   │
│  │  │  • Publish the advisory                                  │   │   │
│  │  │  • Send email notifications to all recipients            │   │   │
│  │  │  • Add to participant press kit                           │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  [Save Draft]  [Schedule Publication]  [Publish Now]  [Cancel]   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.8 Staff Mobile App Wireframe

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  ┌─────────────────────────┐│     │  ┌─────────────────────────┐│
│  │  Staff Mobile App       ││     │  │  My Schedule            ││
│  │  Welcome, Ahmed         ││     │  │                         ││
│  └─────────────────────────┘│     │  │  Today - Feb 10         ││
│                              │     │  │                         ││
│  ┌─────────────────────────┐│     │  │  ┌─────────────────────┐││
│  │  CURRENT SHIFT           ││     │  │  │ 06:00-14:00         │││
│  │                          ││     │  │  │ Registration Desk A │││
│  │  Registration Desk A    ││     │  │  │ Zone: Registration  │││
│  │  Zone: Registration     ││     │  │  │ Status: ● Active    │││
│  │  06:00 - 14:00          ││     │  │  └─────────────────────┘││
│  │                          ││     │  │                         ││
│  │  Status: ● ACTIVE       ││     │  │  Tomorrow - Feb 11      ││
│  │  Time on shift: 4h 22m  ││     │  │                         ││
│  │                          ││     │  │  ┌─────────────────────┐││
│  │  ┌────────┐ ┌──────────┐││     │  │  │ 06:00-14:00         │││
│  │  │  Take  │ │  Check   │││     │  │  │ Registration Desk B │││
│  │  │ Break  │ │   Out    │││     │  │  │ Zone: Registration  │││
│  │  │        │ │          │││     │  │  │ [Request Swap]      │││
│  │  └────────┘ └──────────┘││     │  │  └─────────────────────┘││
│  └─────────────────────────┘│     │  │                         ││
│                              │     │  │  Feb 12                 ││
│  ┌─────────────────────────┐│     │  │                         ││
│  │  NOTIFICATIONS (2)       ││     │  │  ┌─────────────────────┐││
│  │                          ││     │  │  │ 14:00-20:00         │││
│  │  ● Shift swap request   ││     │  │  │ Gate 3 Usher        │││
│  │    from Sara for Feb 11 ││     │  │  │ Zone: Entrance      │││
│  │    [Accept] [Decline]   ││     │  │  │ [Request Swap]      │││
│  │                          ││     │  │  └─────────────────────┘││
│  │  ● Schedule updated     ││     │  │                         ││
│  │    Feb 12 shift changed ││     │  └─────────────────────────┘│
│  └─────────────────────────┘│     │                              │
│                              │     │  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│  ┌────┐ ┌────┐ ┌────┐      │     │  │ 🏠 │ │ 📅 │ │ 🔔 │ │ 👤 │  │
│  │Home│ │Sched│ │Notif│     │     │  └───┘ └───┘ └───┘ └───┘  │
│  └────┘ └────┘ └────┘      │     └─────────────────────────────┘
└─────────────────────────────┘

┌─────────────────────────────┐     ┌─────────────────────────────┐
│  ┌─────────────────────────┐│     │  ┌─────────────────────────┐│
│  │  Request Shift Swap      ││     │  │  Break Timer            ││
│  └─────────────────────────┘│     │  └─────────────────────────┘│
│                              │     │                              │
│  Your Shift:                 │     │  ┌─────────────────────────┐│
│  ┌─────────────────────────┐│     │  │                         ││
│  │ Feb 11, 06:00-14:00     ││     │  │      ╭───────────╮      ││
│  │ Registration Desk B     ││     │  │     │   23:45    │      ││
│  └─────────────────────────┘│     │  │     │  remaining │      ││
│                              │     │  │      ╰───────────╯      ││
│  Swap with:                  │     │  │                         ││
│  ┌─────────────────────────┐│     │  │  Max break: 45 minutes  ││
│  │ Select colleague...    ▼││     │  │  Break started: 11:30   ││
│  └─────────────────────────┘│     │  │                         ││
│                              │     │  │  ⚠ Auto-return to      ││
│  Available to swap:          │     │  │    ACTIVE in 23:45      ││
│  ┌─────────────────────────┐│     │  │                         ││
│  │ ○ Sara M. - Feb 11      ││     │  │  ┌─────────────────────┐││
│  │   14:00-20:00, Gate 3   ││     │  │  │   End Break Early   │││
│  │                          ││     │  │  │                     │││
│  │ ○ Omar S. - Feb 11      ││     │  │  └─────────────────────┘││
│  │   06:00-14:00, Desk C   ││     │  │                         ││
│  └─────────────────────────┘│     │  └─────────────────────────┘│
│                              │     │                              │
│  Reason (optional):          │     │  Today's breaks:            │
│  ┌─────────────────────────┐│     │  Break 1: 08:15-08:30 (15m)│
│  │                         ││     │  Break 2: 11:30-now  (22m) │
│  └─────────────────────────┘│     │  Total: 37 min             │
│                              │     │                              │
│  [Submit Swap Request]       │     │  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│                              │     │  │ 🏠 │ │ 📅 │ │ 🔔 │ │ 👤 │  │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐   │     │  └───┘ └───┘ └───┘ └───┘  │
│  │ 🏠 │ │ 📅 │ │ 🔔 │ │ 👤 │   │     └─────────────────────────────┘
│  └───┘ └───┘ └───┘ └───┘   │
└─────────────────────────────┘
```

### 6.9 Responsive and Mobile Views

The People and Workforce module follows the responsive design system established in Module 08 (UI/UX). All interfaces adapt to three primary breakpoints:

**Breakpoint Strategy:**

| Breakpoint | Width          | Layout                    | Primary Users                                                      |
| ---------- | -------------- | ------------------------- | ------------------------------------------------------------------ |
| Desktop    | >= 1280px      | Full multi-panel layout   | HR Coordinators, Shift Managers, Chief Interpreter, Press Officers |
| Tablet     | 768px - 1279px | Stacked two-column        | Team Leads, Booth Coordinators at standing desks                   |
| Mobile     | < 768px        | Single column, card-based | Staff Members, Volunteers, Journalists                             |

**Tailwind Responsive Patterns:**

```typescript
// ─── Shift Schedule Responsive Layout ───────────────────────────────────

function ShiftScheduleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Filters: sidebar on desktop, collapsible drawer on mobile */}
      <aside className="
        w-full lg:w-64 xl:w-72
        lg:border-r lg:border-gray-200
        flex-shrink-0
      ">
        <div className="
          lg:sticky lg:top-0
          p-4
          bg-white
        ">
          <SchedulerFilters />
        </div>
      </aside>

      {/* Timeline: horizontal scroll on mobile, full-width on desktop */}
      <main className="
        flex-1
        overflow-x-auto
        min-w-0
      ">
        {children}
      </main>
    </div>
  );
}

// ─── Staff Card Responsive ──────────────────────────────────────────────

function StaffCard({ staff }: { staff: StaffMember }) {
  return (
    <div className="
      p-3 sm:p-4
      rounded-lg border border-gray-200
      bg-white shadow-sm
      hover:shadow-md transition-shadow
    ">
      <div className="flex items-center gap-3">
        <Avatar
          src={staff.photo}
          alt={staff.name}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm sm:text-base truncate">
            {staff.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {staff.role} - {staff.team}
          </p>
        </div>
        <StatusBadge status={staff.status} />
      </div>

      {/* Skills: horizontal scroll on mobile */}
      <div className="
        mt-2 flex flex-wrap gap-1
        overflow-x-auto
        scrollbar-thin
      ">
        {staff.skills.map((skill) => (
          <span
            key={skill}
            className="
              inline-block px-2 py-0.5
              text-xs rounded-full
              bg-blue-50 text-blue-700
              whitespace-nowrap
            "
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Interpreter Board Responsive ───────────────────────────────────────

function InterpreterBoardLayout() {
  return (
    <div className="space-y-4">
      {/* Session selector: full-width on all sizes */}
      <SessionSelector className="w-full" />

      {/* Booth timeline: horizontal scroll on tablet/mobile */}
      <div className="
        overflow-x-auto
        -mx-4 px-4
        sm:mx-0 sm:px-0
      ">
        <div className="min-w-[800px]">
          <BoothTimeline />
        </div>
      </div>

      {/* Status and rotation: side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InterpreterStatusPanel />
        <RotationViewer />
      </div>

      {/* Gaps: full-width card list */}
      <UnassignedGapsPanel />
    </div>
  );
}

// ─── Media Portal Responsive ────────────────────────────────────────────

function MediaPortalLayout() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tabs for navigation on mobile */}
      <nav className="
        flex
        border-b border-gray-200
        mb-6
        overflow-x-auto
        scrollbar-none
      ">
        <TabButton active>Press Conferences</TabButton>
        <TabButton>Interview Requests</TabButton>
        <TabButton>Media Advisories</TabButton>
        <TabButton>Media Pool</TabButton>
      </nav>

      {/* Content area */}
      <div className="space-y-4">
        {/* Cards stack vertically on all breakpoints */}
        {conferences.map((conf) => (
          <PressConferenceCard
            key={conf.id}
            conference={conf}
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Mobile-First Form Pattern ──────────────────────────────────────────

function InterviewRequestForm() {
  return (
    <Form method="post" className="space-y-4 sm:space-y-6">
      {/* Target selection: radio group stacks vertically on mobile */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">
          Interview Target
        </legend>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <RadioOption value="delegation" label="Delegation" />
          <RadioOption value="delegate" label="Specific Delegate" />
        </div>
      </fieldset>

      {/* Searchable select: full-width on all sizes */}
      <ComboboxField
        name="targetDelegation"
        label="Delegation"
        placeholder="Search delegations..."
        className="w-full"
      />

      {/* Date and duration: side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateField name="preferredDate" label="Preferred Date" />
        <SelectField
          name="preferredDuration"
          label="Duration"
          options={[
            { value: "15", label: "15 minutes" },
            { value: "30", label: "30 minutes" },
            { value: "45", label: "45 minutes" },
            { value: "60", label: "60 minutes" },
          ]}
        />
      </div>

      {/* Format: wrapping radio buttons */}
      <RadioGroupField
        name="format"
        label="Format"
        options={[
          { value: "IN_PERSON", label: "In Person" },
          { value: "PHONE", label: "Phone" },
          { value: "VIDEO", label: "Video" },
          { value: "WRITTEN", label: "Written" },
        ]}
        className="flex flex-wrap gap-2 sm:gap-4"
      />

      {/* Notes: full-width textarea */}
      <TextareaField
        name="notes"
        label="Additional Notes"
        rows={4}
        className="w-full"
      />

      {/* Submit: full-width on mobile, auto on desktop */}
      <Button
        type="submit"
        className="w-full sm:w-auto"
      >
        Submit Request
      </Button>
    </Form>
  );
}
```

**Accessibility Requirements:**

| Requirement           | Implementation                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Keyboard navigation   | All shift blocks, staff cards, and form elements are tab-navigable                                         |
| Screen reader support | ARIA labels on timeline blocks, role announcements for status changes                                      |
| Color contrast        | Status indicators use both color and icon/shape (filled circle = active, half-filled = break, empty = off) |
| Focus management      | Focus trapped in modals (swap request, conference form), returned on close                                 |
| Touch targets         | Minimum 44px touch targets for mobile check-in/out buttons                                                 |
| Reduced motion        | Drag-and-drop animations respect `prefers-reduced-motion` media query                                      |
| Live regions          | Coverage gap alerts and shift status changes use `aria-live="polite"`                                      |
| High contrast         | All text meets WCAG 2.1 AA contrast ratios (4.5:1 normal, 3:1 large)                                       |

**Integration with Module 08 (UI/UX) Components:**

| Module 08 Component       | Usage in Module 13                                                 |
| ------------------------- | ------------------------------------------------------------------ |
| `DataTable`               | Staff roster, shift list, interview requests, receiver tracking    |
| `Calendar`                | Shift scheduling day/week view, press conference calendar          |
| `Form` (Conform + Zod)    | Staff creation, shift creation, interview request, advisory editor |
| `Combobox` (Radix UI)     | Delegation search, staff search, language pair selection           |
| `Dialog` (Radix UI)       | Shift swap confirmation, conference speaker editor, gap assignment |
| `Tabs` (Radix UI)         | Media portal navigation, staff detail sections                     |
| `Badge` (Radix UI)        | Status indicators, role badges, certification levels               |
| `Toast` (Radix UI)        | Check-in/out confirmation, swap request notifications              |
| `DropdownMenu` (Radix UI) | Staff actions (edit, delete, evaluate), shift actions              |
| `ScrollArea` (Radix UI)   | Timeline horizontal scroll, booth timeline, receiver list          |

---

## 7. Integration Points

Module 13 — People and Workforce — is a cross-cutting module that touches nearly every aspect of conference management. Staff members support event operations, interpreters enable multilingual communication, and media operations facilitate public engagement. This section defines all integration surfaces, data flows, and coordination mechanisms.

### 7.1 Module Integration Matrix

| Source Module   | Target Module                   | Direction     | Data Exchanged                                                                  | Integration Method                          | Trigger                 |
| --------------- | ------------------------------- | ------------- | ------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------- |
| **13 - People** | **01 - Data Model**             | Bidirectional | Tenant config, user identity, base entities, participant linkage                | Shared Prisma schema, middleware            | On every request        |
| **13 - People** | **04 - Workflow**               | Bidirectional | Staff approval flows, volunteer onboarding workflows, interview request routing | Workflow engine API, domain events          | Status transitions      |
| **13 - People** | **05 - Security**               | Inbound       | RBAC permissions, zone access control, booth access tokens                      | Permission middleware, zone validation      | On resource access      |
| **13 - People** | **07 - API**                    | Outbound      | SSE events for staff status, webhook delivery for shift changes                 | Event bus, SSE channels, webhook dispatcher | Real-time updates       |
| **13 - People** | **08 - UI/UX**                  | Inbound       | DataTable, Calendar, Combobox, Form components                                  | React component imports                     | UI rendering            |
| **13 - People** | **09 - Registration**           | Bidirectional | Staff linked to participants, media accreditation, journalist profiles          | Domain events, shared participant ID        | Registration completion |
| **13 - People** | **10 - Event Operations**       | Bidirectional | Real-time staff dashboard, check-in integration, command center feeds           | SSE channels, operations API                | Continuous              |
| **13 - People** | **11 - Logistics**              | Bidirectional | Staff zone assignments, interpreter transport, staff accommodation              | REST API, domain events                     | Scheduling, assignment  |
| **13 - People** | **12 - Protocol**               | Bidirectional | Interpreter services for bilaterals, staff support for VIP movements            | Service requests, domain events             | Meeting scheduling      |
| **13 - People** | **14 - Content**                | Outbound      | Media advisory templates, staff communications, volunteer certificates          | Template engine API, PDF generation         | Publication, completion |
| **13 - People** | **16 - Participant Experience** | Outbound      | Journalist mobile app data, staff notifications, press conference streams       | Mobile API, push notifications              | Real-time delivery      |
| **13 - People** | **17 - Configuration**          | Inbound       | Settings keys, feature flags, tenant preferences                                | SystemSetting queries                       | Configuration access    |

### 7.2 Module 01 — Data Model Foundation

Module 13 extends the core data model with workforce-specific entities while maintaining referential integrity with shared platform models.

#### 7.2.1 Shared Entity Dependencies

```typescript
// file: app/modules/people/types/shared-entities.ts

/**
 * Module 13 entities that reference Module 01 core entities.
 * These relationships are enforced at the database level via foreign keys.
 */

// StaffMember references User (for system login) and optionally Participant
interface StaffMemberDependencies {
  tenantId: string; // From Tenant (Module 01)
  eventId: string; // From Event (Module 01)
  userId?: string; // From User (Module 01) - optional for non-system staff
  participantId?: string; // From Participant (Module 09) - for registered staff
}

// InterpreterAssignment references both StaffMember and InterpretationService
interface InterpreterAssignmentDependencies {
  interpreterId: string; // StaffMember with role INTERPRETER
  serviceId: string; // InterpretationService (Module 13)
  boothId?: string; // InterpretationBooth (Module 13)
}

// PressConference references Session and Venue
interface PressConferenceDependencies {
  eventId: string; // From Event (Module 01)
  sessionId?: string; // From Session (Module 01) - optional link to formal session
  venueId: string; // From Venue (Module 11)
  roomId: string; // From Room (Module 11)
}

// MediaAdvisory references Event and optionally PressConference
interface MediaAdvisoryDependencies {
  eventId: string; // From Event (Module 01)
  pressConferenceId?: string; // PressConference (Module 13) - if announcing a conference
}
```

#### 7.2.2 Participant-Staff Linkage

Staff members who are also registered as event participants maintain a bidirectional link:

```typescript
// file: app/modules/people/services/staff-participant-link.server.ts

import { prisma } from "~/db.server";

interface LinkStaffToParticipantInput {
  staffMemberId: string;
  participantId: string;
  tenantId: string;
  eventId: string;
}

/**
 * Links a staff member to their participant registration.
 * This enables:
 * - Staff to appear in participant lists with their role
 * - Badge generation to include staff-specific zones
 * - Unified check-in/out tracking
 */
export async function linkStaffToParticipant(input: LinkStaffToParticipantInput): Promise<void> {
  const { staffMemberId, participantId, tenantId, eventId } = input;

  // Verify both entities exist and belong to same tenant/event
  const [staff, participant] = await Promise.all([
    prisma.staffMember.findUnique({ where: { id: staffMemberId } }),
    prisma.participant.findUnique({ where: { id: participantId } }),
  ]);

  if (!staff) throw new Error("Staff member not found");
  if (!participant) throw new Error("Participant not found");
  if (staff.tenantId !== tenantId || participant.tenantId !== tenantId) {
    throw new Error("Tenant mismatch");
  }
  if (staff.eventId !== eventId || participant.eventId !== eventId) {
    throw new Error("Event mismatch");
  }

  // Update staff member with participant link
  await prisma.staffMember.update({
    where: { id: staffMemberId },
    data: { participantId },
  });

  // Update participant custom data to indicate staff role
  const existingCustomData = (participant.customData as Record<string, unknown>) ?? {};
  await prisma.participant.update({
    where: { id: participantId },
    data: {
      customData: {
        ...existingCustomData,
        isStaff: true,
        staffMemberId,
        staffRole: staff.role,
        staffDepartment: staff.department,
      },
    },
  });
}
```

### 7.3 Module 04 — Workflow Engine Integration

Module 13 leverages the workflow engine for multi-step approval processes.

#### 7.3.1 Staff Approval Workflows

Staff onboarding for certain roles requires manager or security approval:

```typescript
// file: app/modules/people/workflows/staff-approval.workflow.ts

import type { WorkflowDefinition } from "~/core/workflow/types";

export const staffApprovalWorkflow: WorkflowDefinition = {
  id: "staff-approval-v1",
  name: "Staff Member Approval",
  description: "Multi-step approval for staff onboarding",
  version: 1,

  triggers: [
    {
      type: "ENTITY_CREATED",
      entityType: "StaffMember",
      condition: {
        // Trigger only for roles requiring approval
        expression: "role IN ['SECURITY', 'VIP_LIAISON', 'PROTOCOL_OFFICER', 'INTERPRETER']",
      },
    },
  ],

  states: [
    { id: "PENDING_MANAGER", name: "Pending Manager Approval", isInitial: true },
    { id: "PENDING_SECURITY", name: "Pending Security Clearance" },
    { id: "PENDING_TRAINING", name: "Pending Training Completion" },
    { id: "APPROVED", name: "Approved", isFinal: true },
    { id: "REJECTED", name: "Rejected", isFinal: true },
  ],

  transitions: [
    {
      id: "manager-approve",
      from: "PENDING_MANAGER",
      to: "PENDING_SECURITY",
      trigger: { type: "MANUAL", action: "APPROVE" },
      requiredRole: "STAFF_MANAGER",
      guard: { expression: "true" },
    },
    {
      id: "manager-reject",
      from: "PENDING_MANAGER",
      to: "REJECTED",
      trigger: { type: "MANUAL", action: "REJECT" },
      requiredRole: "STAFF_MANAGER",
    },
    {
      id: "security-clear",
      from: "PENDING_SECURITY",
      to: "PENDING_TRAINING",
      trigger: { type: "MANUAL", action: "CLEAR" },
      requiredRole: "SECURITY_OFFICER",
      // Skip training step for certain roles
      guard: { expression: "role != 'VOLUNTEER'" },
    },
    {
      id: "security-reject",
      from: "PENDING_SECURITY",
      to: "REJECTED",
      trigger: { type: "MANUAL", action: "REJECT" },
      requiredRole: "SECURITY_OFFICER",
    },
    {
      id: "training-complete",
      from: "PENDING_TRAINING",
      to: "APPROVED",
      trigger: { type: "AUTOMATIC" },
      guard: {
        expression:
          "trainingRecords.filter(t => t.status == 'COMPLETED').length >= requiredTrainingCount",
      },
    },
    {
      id: "bypass-training",
      from: "PENDING_SECURITY",
      to: "APPROVED",
      trigger: { type: "MANUAL", action: "CLEAR" },
      requiredRole: "SECURITY_OFFICER",
      guard: { expression: "role == 'VOLUNTEER'" },
    },
  ],

  actions: [
    {
      on: "ENTER",
      state: "APPROVED",
      action: {
        type: "EMIT_EVENT",
        event: "StaffMemberApproved",
        payload: { staffMemberId: "{{entityId}}", role: "{{role}}" },
      },
    },
    {
      on: "ENTER",
      state: "REJECTED",
      action: {
        type: "SEND_NOTIFICATION",
        template: "staff-rejection",
        recipients: ["{{email}}"],
      },
    },
  ],
};
```

#### 7.3.2 Volunteer Application Workflow

```typescript
// file: app/modules/people/workflows/volunteer-application.workflow.ts

import type { WorkflowDefinition } from "~/core/workflow/types";

export const volunteerApplicationWorkflow: WorkflowDefinition = {
  id: "volunteer-application-v1",
  name: "Volunteer Application Processing",
  version: 1,

  triggers: [
    {
      type: "ENTITY_CREATED",
      entityType: "VolunteerApplication",
    },
  ],

  states: [
    { id: "SUBMITTED", name: "Application Submitted", isInitial: true },
    { id: "UNDER_REVIEW", name: "Under Review" },
    { id: "INTERVIEW_SCHEDULED", name: "Interview Scheduled" },
    { id: "PENDING_BACKGROUND", name: "Pending Background Check" },
    { id: "ACCEPTED", name: "Accepted", isFinal: true },
    { id: "WAITLISTED", name: "Waitlisted" },
    { id: "REJECTED", name: "Rejected", isFinal: true },
  ],

  transitions: [
    {
      id: "start-review",
      from: "SUBMITTED",
      to: "UNDER_REVIEW",
      trigger: { type: "AUTOMATIC" },
      // Auto-transition after 1 hour to ensure timely processing
      delay: { duration: 3600000, unit: "ms" },
    },
    {
      id: "schedule-interview",
      from: "UNDER_REVIEW",
      to: "INTERVIEW_SCHEDULED",
      trigger: { type: "MANUAL", action: "SCHEDULE_INTERVIEW" },
      requiredRole: "VOLUNTEER_COORDINATOR",
    },
    {
      id: "pass-interview",
      from: "INTERVIEW_SCHEDULED",
      to: "PENDING_BACKGROUND",
      trigger: { type: "MANUAL", action: "PASS_INTERVIEW" },
      requiredRole: "VOLUNTEER_COORDINATOR",
    },
    {
      id: "fail-interview",
      from: "INTERVIEW_SCHEDULED",
      to: "REJECTED",
      trigger: { type: "MANUAL", action: "FAIL_INTERVIEW" },
      requiredRole: "VOLUNTEER_COORDINATOR",
    },
    {
      id: "background-pass",
      from: "PENDING_BACKGROUND",
      to: "ACCEPTED",
      trigger: { type: "EXTERNAL_EVENT", source: "background-check-service" },
      guard: { expression: "backgroundCheckResult == 'PASS'" },
    },
    {
      id: "background-fail",
      from: "PENDING_BACKGROUND",
      to: "REJECTED",
      trigger: { type: "EXTERNAL_EVENT", source: "background-check-service" },
      guard: { expression: "backgroundCheckResult == 'FAIL'" },
    },
    {
      id: "waitlist",
      from: "UNDER_REVIEW",
      to: "WAITLISTED",
      trigger: { type: "MANUAL", action: "WAITLIST" },
      requiredRole: "VOLUNTEER_COORDINATOR",
    },
    {
      id: "activate-from-waitlist",
      from: "WAITLISTED",
      to: "PENDING_BACKGROUND",
      trigger: { type: "MANUAL", action: "ACTIVATE" },
      requiredRole: "VOLUNTEER_COORDINATOR",
    },
  ],

  actions: [
    {
      on: "ENTER",
      state: "ACCEPTED",
      action: {
        type: "CREATE_ENTITY",
        entityType: "StaffMember",
        data: {
          role: "VOLUNTEER",
          status: "PENDING_TRAINING",
          // Map volunteer application fields to staff member
          firstName: "{{firstName}}",
          lastName: "{{lastName}}",
          email: "{{email}}",
          phone: "{{phone}}",
          preferredLanguages: "{{languages}}",
        },
      },
    },
    {
      on: "ENTER",
      state: "ACCEPTED",
      action: {
        type: "SEND_NOTIFICATION",
        template: "volunteer-accepted",
        recipients: ["{{email}}"],
      },
    },
  ],
};
```

#### 7.3.3 Interview Request Routing Workflow

Media interview requests flow through a multi-party approval process:

```typescript
// file: app/modules/people/workflows/interview-request.workflow.ts

import type { WorkflowDefinition } from "~/core/workflow/types";

export const interviewRequestWorkflow: WorkflowDefinition = {
  id: "interview-request-v1",
  name: "Media Interview Request Processing",
  version: 1,

  triggers: [
    {
      type: "ENTITY_CREATED",
      entityType: "InterviewRequest",
    },
  ],

  states: [
    { id: "SUBMITTED", name: "Request Submitted", isInitial: true },
    { id: "MEDIA_REVIEW", name: "Media Office Review" },
    { id: "FORWARDED_TO_DELEGATION", name: "Forwarded to Delegation" },
    { id: "DELEGATION_REVIEWING", name: "Delegation Reviewing" },
    { id: "APPROVED", name: "Approved" },
    { id: "SCHEDULING", name: "Scheduling Interview" },
    { id: "SCHEDULED", name: "Interview Scheduled", isFinal: true },
    { id: "DECLINED", name: "Declined", isFinal: true },
    { id: "CANCELLED", name: "Cancelled", isFinal: true },
  ],

  transitions: [
    {
      id: "media-review",
      from: "SUBMITTED",
      to: "MEDIA_REVIEW",
      trigger: { type: "AUTOMATIC" },
    },
    {
      id: "forward-to-delegation",
      from: "MEDIA_REVIEW",
      to: "FORWARDED_TO_DELEGATION",
      trigger: { type: "MANUAL", action: "FORWARD" },
      requiredRole: "MEDIA_OFFICER",
    },
    {
      id: "media-decline",
      from: "MEDIA_REVIEW",
      to: "DECLINED",
      trigger: { type: "MANUAL", action: "DECLINE" },
      requiredRole: "MEDIA_OFFICER",
    },
    {
      id: "delegation-acknowledge",
      from: "FORWARDED_TO_DELEGATION",
      to: "DELEGATION_REVIEWING",
      trigger: { type: "MANUAL", action: "ACKNOWLEDGE" },
      requiredRole: "FOCAL_POINT",
    },
    {
      id: "delegation-approve",
      from: "DELEGATION_REVIEWING",
      to: "APPROVED",
      trigger: { type: "MANUAL", action: "APPROVE" },
      requiredRole: "FOCAL_POINT",
    },
    {
      id: "delegation-decline",
      from: "DELEGATION_REVIEWING",
      to: "DECLINED",
      trigger: { type: "MANUAL", action: "DECLINE" },
      requiredRole: "FOCAL_POINT",
    },
    {
      id: "start-scheduling",
      from: "APPROVED",
      to: "SCHEDULING",
      trigger: { type: "AUTOMATIC" },
    },
    {
      id: "confirm-schedule",
      from: "SCHEDULING",
      to: "SCHEDULED",
      trigger: { type: "MANUAL", action: "CONFIRM" },
      requiredRole: "MEDIA_OFFICER",
    },
    {
      id: "cancel",
      from: [
        "SUBMITTED",
        "MEDIA_REVIEW",
        "FORWARDED_TO_DELEGATION",
        "DELEGATION_REVIEWING",
        "APPROVED",
        "SCHEDULING",
      ],
      to: "CANCELLED",
      trigger: { type: "MANUAL", action: "CANCEL" },
      requiredRole: ["MEDIA_OFFICER", "JOURNALIST"],
    },
  ],

  actions: [
    {
      on: "ENTER",
      state: "FORWARDED_TO_DELEGATION",
      action: {
        type: "SEND_NOTIFICATION",
        template: "interview-request-forwarded",
        recipients: ["{{delegationFocalPointEmail}}"],
      },
    },
    {
      on: "ENTER",
      state: "SCHEDULED",
      action: {
        type: "SEND_NOTIFICATION",
        template: "interview-scheduled",
        recipients: ["{{journalistEmail}}", "{{delegationFocalPointEmail}}"],
      },
    },
  ],
};
```

### 7.4 Module 05 — Security and Access Control

Module 13 enforces strict access control for sensitive workforce data and restricted operational areas.

#### 7.4.1 Permission Scopes

```typescript
// file: app/modules/people/security/permissions.ts

/**
 * Permission definitions for Module 13 resources.
 * These are registered with Module 05's RBAC system.
 */
export const PEOPLE_PERMISSIONS = {
  // Staff Management
  "staff:read": "View staff member profiles",
  "staff:read:own": "View own staff profile",
  "staff:create": "Create new staff members",
  "staff:update": "Update staff member details",
  "staff:delete": "Remove staff members",
  "staff:approve": "Approve staff applications",
  "staff:assign:shift": "Assign staff to shifts",
  "staff:assign:zone": "Assign staff to zones",

  // Shift Management
  "shift:read": "View shift schedules",
  "shift:create": "Create shifts",
  "shift:update": "Modify shifts",
  "shift:delete": "Delete shifts",
  "shift:swap:request": "Request shift swaps",
  "shift:swap:approve": "Approve shift swap requests",
  "shift:auto-schedule": "Run auto-scheduling algorithm",

  // Check-in/Out
  "checkin:perform": "Perform staff check-in",
  "checkin:perform:self": "Self check-in only",
  "checkin:override": "Override check-in restrictions",
  "checkin:view:all": "View all check-in records",

  // Evaluations
  "evaluation:read": "View staff evaluations",
  "evaluation:read:own": "View own evaluations",
  "evaluation:create": "Create evaluations",
  "evaluation:update": "Update evaluations",

  // Interpretation Services
  "interpretation:read": "View interpretation services",
  "interpretation:create": "Create interpretation services",
  "interpretation:update": "Update interpretation services",
  "interpretation:assign": "Assign interpreters to services",
  "interpreter:read": "View interpreter profiles",
  "interpreter:certify": "Manage interpreter certifications",
  "booth:manage": "Manage interpretation booths",
  "receiver:track": "Track receiver handsets",

  // Media Operations
  "press-conference:read": "View press conferences",
  "press-conference:create": "Create press conferences",
  "press-conference:update": "Update press conferences",
  "press-conference:cancel": "Cancel press conferences",
  "interview:read": "View interview requests",
  "interview:read:own": "View own interview requests",
  "interview:create": "Submit interview requests",
  "interview:forward": "Forward interview requests",
  "interview:approve": "Approve interview requests",
  "advisory:read": "View media advisories",
  "advisory:create": "Create media advisories",
  "advisory:publish": "Publish media advisories",
  "advisory:embargo": "Manage advisory embargoes",
  "media-pool:manage": "Manage media pool assignments",

  // Volunteer Management
  "volunteer:read": "View volunteer applications",
  "volunteer:process": "Process volunteer applications",
  "volunteer:onboard": "Complete volunteer onboarding",
} as const;

export type PeoplePermission = keyof typeof PEOPLE_PERMISSIONS;
```

#### 7.4.2 Zone Access Control Integration

Staff members are granted access to specific venue zones based on their role and assignments:

```typescript
// file: app/modules/people/security/zone-access.server.ts

import { prisma } from "~/db.server";
import type { ZoneAccessRequest, ZoneAccessResult } from "~/core/security/types";

/**
 * Zone access rules for workforce roles.
 * Integrates with Module 05's zone access control system.
 */
const ROLE_ZONE_MAPPING: Record<string, string[]> = {
  STAFF_MANAGER: ["STAFF_OFFICE", "ALL_ZONES", "COMMAND_CENTER"],
  SHIFT_SUPERVISOR: ["STAFF_OFFICE", "ASSIGNED_ZONES", "BREAK_ROOM"],
  PROTOCOL_OFFICER: ["PROTOCOL_OFFICE", "VIP_AREAS", "BILATERAL_ROOMS", "PLENARY"],
  VIP_LIAISON: ["VIP_AREAS", "VIP_LOUNGE", "BILATERAL_ROOMS", "MOTORCADE_AREA"],
  INTERPRETER: ["INTERPRETATION_BOOTH", "PLENARY", "BILATERAL_ROOMS", "INTERPRETER_LOUNGE"],
  MEDIA_OFFICER: ["PRESS_CENTER", "PRESS_CONFERENCE_ROOM", "MEDIA_WORK_AREA"],
  PRESS_COORDINATOR: ["PRESS_CENTER", "PRESS_CONFERENCE_ROOM", "MEDIA_BRIEFING_ROOM"],
  REGISTRATION_STAFF: ["REGISTRATION_AREA", "BADGE_PRINTING", "HELP_DESK"],
  VOLUNTEER: ["ASSIGNED_ZONES", "VOLUNTEER_BRIEFING_ROOM", "BREAK_ROOM"],
  SECURITY: ["ALL_ZONES", "SECURITY_OFFICE", "CHECKPOINT"],
  LOGISTICS: ["LOGISTICS_AREA", "LOADING_DOCK", "STORAGE", "ALL_BACK_OF_HOUSE"],
  CATERING: ["KITCHEN", "DINING_AREAS", "STORAGE", "LOADING_DOCK"],
  TECHNICAL: ["TECHNICAL_BOOTH", "AV_CONTROL_ROOM", "SERVER_ROOM", "ALL_ZONES"],
};

export async function validateStaffZoneAccess(
  request: ZoneAccessRequest,
): Promise<ZoneAccessResult> {
  const { staffMemberId, zoneId, timestamp } = request;

  // Get staff member with current shift
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    include: {
      shifts: {
        where: {
          date: { equals: new Date(timestamp).toISOString().split("T")[0] },
          status: "ACTIVE",
        },
        include: { zone: true },
      },
    },
  });

  if (!staff) {
    return { allowed: false, reason: "Staff member not found" };
  }

  if (staff.status !== "ACTIVE") {
    return { allowed: false, reason: `Staff status is ${staff.status}` };
  }

  // Get zone details
  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) {
    return { allowed: false, reason: "Zone not found" };
  }

  // Check role-based zone access
  const allowedZoneTypes = ROLE_ZONE_MAPPING[staff.role] ?? [];

  // "ALL_ZONES" grants universal access
  if (allowedZoneTypes.includes("ALL_ZONES")) {
    return { allowed: true, grantedBy: "ROLE_ALL_ZONES" };
  }

  // Check if zone type matches role permissions
  if (allowedZoneTypes.includes(zone.type)) {
    return { allowed: true, grantedBy: "ROLE_ZONE_TYPE" };
  }

  // Check shift-based zone assignment
  if (allowedZoneTypes.includes("ASSIGNED_ZONES")) {
    const isAssignedToZone = staff.shifts.some(
      (shift) => shift.zoneId === zoneId || shift.zone?.parentZoneId === zoneId,
    );
    if (isAssignedToZone) {
      return { allowed: true, grantedBy: "SHIFT_ASSIGNMENT" };
    }
  }

  return {
    allowed: false,
    reason: `Role ${staff.role} does not have access to zone type ${zone.type}`,
  };
}
```

### 7.5 Module 07 — API and Integration Layer

Module 13 publishes real-time events and webhooks for workforce status changes.

#### 7.5.1 SSE Event Channels

```typescript
// file: app/modules/people/events/sse-channels.ts

/**
 * SSE channel definitions for Module 13 real-time updates.
 * These channels are registered with Module 07's SSE infrastructure.
 */
export const PEOPLE_SSE_CHANNELS = {
  // Staff status updates
  "staff:status": {
    description: "Staff member status changes (check-in, check-out, break)",
    eventTypes: ["STAFF_CHECKED_IN", "STAFF_CHECKED_OUT", "STAFF_ON_BREAK", "STAFF_BREAK_ENDED"],
    scope: "event",
    requiredPermission: "staff:read",
  },

  // Shift updates
  "shift:updates": {
    description: "Shift schedule changes and swap notifications",
    eventTypes: [
      "SHIFT_CREATED",
      "SHIFT_UPDATED",
      "SHIFT_CANCELLED",
      "SHIFT_SWAP_REQUESTED",
      "SHIFT_SWAP_APPROVED",
    ],
    scope: "event",
    requiredPermission: "shift:read",
  },

  // Coverage monitoring
  "coverage:gaps": {
    description: "Real-time coverage gap alerts",
    eventTypes: ["COVERAGE_GAP_DETECTED", "COVERAGE_GAP_RESOLVED", "UNDERSTAFFING_ALERT"],
    scope: "event",
    requiredPermission: "shift:read",
  },

  // Interpreter status
  "interpreter:status": {
    description: "Interpreter rotation and fatigue status",
    eventTypes: ["INTERPRETER_ROTATED", "INTERPRETER_FATIGUE_WARNING", "BOOTH_COVERAGE_CHANGE"],
    scope: "event",
    requiredPermission: "interpretation:read",
  },

  // Press operations
  "press:updates": {
    description: "Press conference and media advisory updates",
    eventTypes: [
      "PRESS_CONFERENCE_SCHEDULED",
      "PRESS_CONFERENCE_STARTED",
      "PRESS_CONFERENCE_ENDED",
      "ADVISORY_PUBLISHED",
      "EMBARGO_LIFTED",
    ],
    scope: "event",
    requiredPermission: "press-conference:read",
  },

  // Receiver tracking
  "receiver:tracking": {
    description: "Receiver handset distribution and returns",
    eventTypes: ["RECEIVER_ISSUED", "RECEIVER_RETURNED", "RECEIVER_LOW_STOCK", "RECEIVER_LOST"],
    scope: "event",
    requiredPermission: "receiver:track",
  },
} as const;
```

#### 7.5.2 Webhook Event Definitions

```typescript
// file: app/modules/people/events/webhooks.ts

import type { WebhookEventDefinition } from "~/core/api/types";

/**
 * Webhook events published by Module 13.
 * External systems can subscribe to these events via Module 07's webhook dispatcher.
 */
export const PEOPLE_WEBHOOK_EVENTS: WebhookEventDefinition[] = [
  // Staff lifecycle events
  {
    eventType: "people.staff.created",
    description: "New staff member created",
    payload: {
      staffMemberId: "string",
      eventId: "string",
      role: "string",
      department: "string",
      createdAt: "ISO8601",
    },
  },
  {
    eventType: "people.staff.status_changed",
    description: "Staff member status changed",
    payload: {
      staffMemberId: "string",
      previousStatus: "string",
      newStatus: "string",
      changedAt: "ISO8601",
      changedBy: "string",
    },
  },
  {
    eventType: "people.staff.checked_in",
    description: "Staff member checked in for shift",
    payload: {
      staffMemberId: "string",
      shiftId: "string",
      zoneId: "string",
      checkedInAt: "ISO8601",
      method: "string", // KIOSK | MOBILE | MANUAL
    },
  },
  {
    eventType: "people.staff.checked_out",
    description: "Staff member checked out from shift",
    payload: {
      staffMemberId: "string",
      shiftId: "string",
      checkedOutAt: "ISO8601",
      totalHours: "number",
    },
  },

  // Shift events
  {
    eventType: "people.shift.created",
    description: "New shift created",
    payload: {
      shiftId: "string",
      eventId: "string",
      staffMemberId: "string",
      date: "ISO8601",
      startTime: "string",
      endTime: "string",
      zoneId: "string",
    },
  },
  {
    eventType: "people.shift.swap_completed",
    description: "Shift swap completed between two staff members",
    payload: {
      swapRequestId: "string",
      originalShiftId: "string",
      swappedShiftId: "string",
      originalStaffId: "string",
      newStaffId: "string",
      completedAt: "ISO8601",
    },
  },

  // Interpretation events
  {
    eventType: "people.interpreter.assigned",
    description: "Interpreter assigned to service",
    payload: {
      assignmentId: "string",
      interpreterId: "string",
      serviceId: "string",
      languagePair: "string",
      startTime: "ISO8601",
      endTime: "ISO8601",
    },
  },
  {
    eventType: "people.interpreter.rotated",
    description: "Interpreter rotation occurred",
    payload: {
      serviceId: "string",
      boothId: "string",
      outgoingInterpreterId: "string",
      incomingInterpreterId: "string",
      rotatedAt: "ISO8601",
      reason: "string", // SCHEDULED | FATIGUE | BREAK | EMERGENCY
    },
  },

  // Media events
  {
    eventType: "people.press_conference.scheduled",
    description: "Press conference scheduled",
    payload: {
      pressConferenceId: "string",
      eventId: "string",
      title: "string",
      scheduledAt: "ISO8601",
      roomId: "string",
      speakerCount: "number",
    },
  },
  {
    eventType: "people.advisory.published",
    description: "Media advisory published",
    payload: {
      advisoryId: "string",
      eventId: "string",
      title: "string",
      publishedAt: "ISO8601",
      embargoLiftsAt: "ISO8601 | null",
      distributionList: "string[]",
    },
  },
  {
    eventType: "people.embargo.lifted",
    description: "Advisory embargo lifted",
    payload: {
      advisoryId: "string",
      liftedAt: "ISO8601",
      liftedBy: "string | null", // null if automatic
      wasManual: "boolean",
    },
  },
];
```

### 7.6 Module 09 — Registration and Accreditation

Module 13 integrates closely with registration for staff credentialing and media accreditation.

#### 7.6.1 Staff Badge Zone Assignment

```typescript
// file: app/modules/people/services/badge-zone-integration.server.ts

import { prisma } from "~/db.server";
import { eventBus } from "~/core/events/event-bus";

/**
 * When a staff member is approved, update their participant record
 * with appropriate badge zones based on role.
 */
eventBus.subscribe("StaffMemberApproved", async (event) => {
  const { staffMemberId, role } = event.payload;

  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    include: { participant: true },
  });

  if (!staff?.participantId) return;

  // Determine badge zones based on staff role
  const badgeZones = getBadgeZonesForRole(role);

  // Update participant's badge configuration
  await prisma.participant.update({
    where: { id: staff.participantId },
    data: {
      badgeZones: badgeZones,
      badgeType: "STAFF",
      badgeSubtype: role,
    },
  });

  // Trigger badge regeneration if already printed
  const existingBadge = await prisma.badge.findFirst({
    where: { participantId: staff.participantId, status: "PRINTED" },
  });

  if (existingBadge) {
    await eventBus.publish("BadgeRegenerationRequired", {
      badgeId: existingBadge.id,
      participantId: staff.participantId,
      reason: "Staff role zone update",
    });
  }
});

function getBadgeZonesForRole(role: string): string[] {
  const zoneMapping: Record<string, string[]> = {
    INTERPRETER: [
      "INTERPRETATION_BOOTH",
      "PLENARY",
      "BILATERAL_ROOMS",
      "INTERPRETER_LOUNGE",
      "CAFETERIA",
    ],
    MEDIA_OFFICER: ["PRESS_CENTER", "PRESS_CONFERENCE_ROOM", "MEDIA_WORK_AREA", "CAFETERIA"],
    PROTOCOL_OFFICER: ["VIP_AREAS", "BILATERAL_ROOMS", "PLENARY", "PROTOCOL_OFFICE"],
    VIP_LIAISON: ["VIP_AREAS", "VIP_LOUNGE", "BILATERAL_ROOMS", "MOTORCADE_AREA"],
    REGISTRATION_STAFF: ["REGISTRATION_AREA", "BADGE_PRINTING", "HELP_DESK", "CAFETERIA"],
    VOLUNTEER: ["GENERAL_AREAS", "VOLUNTEER_BRIEFING", "CAFETERIA"],
    SECURITY: ["ALL_ZONES"],
    LOGISTICS: ["BACK_OF_HOUSE", "LOADING_DOCK", "STORAGE", "CAFETERIA"],
    TECHNICAL: ["TECHNICAL_AREAS", "AV_CONTROL", "SERVER_ROOM", "ALL_ZONES"],
  };

  return zoneMapping[role] ?? ["GENERAL_AREAS", "CAFETERIA"];
}
```

#### 7.6.2 Media Accreditation Integration

```typescript
// file: app/modules/people/services/media-accreditation.server.ts

import { prisma } from "~/db.server";

/**
 * Links media accreditation to journalist interview capabilities.
 * Only accredited journalists can submit interview requests.
 */
export async function validateJournalistAccreditation(
  journalistId: string,
  eventId: string,
): Promise<{ valid: boolean; accreditationType?: string; restrictions?: string[] }> {
  const participant = await prisma.participant.findFirst({
    where: {
      id: journalistId,
      eventId,
      participantType: "MEDIA",
      status: { in: ["APPROVED", "BADGE_PRINTED", "CHECKED_IN"] },
    },
    include: {
      accreditation: true,
    },
  });

  if (!participant) {
    return { valid: false };
  }

  if (!participant.accreditation || participant.accreditation.status !== "APPROVED") {
    return { valid: false };
  }

  // Check accreditation type for interview eligibility
  const accreditationType = participant.accreditation.type;
  const restrictions: string[] = [];

  // Pool journalists have restrictions on solo interviews
  if (accreditationType === "POOL") {
    restrictions.push("POOL_ONLY");
  }

  // Photo-only accreditation cannot request interviews
  if (accreditationType === "PHOTO_ONLY") {
    return { valid: false };
  }

  // Technical crew cannot request interviews
  if (accreditationType === "TECHNICAL_CREW") {
    return { valid: false };
  }

  return {
    valid: true,
    accreditationType,
    restrictions,
  };
}
```

### 7.7 Module 10 — Event Operations Center

Module 13 feeds real-time workforce data into the operations command center.

#### 7.7.1 Staff Dashboard Data Feed

```typescript
// file: app/modules/people/services/operations-feed.server.ts

import { prisma } from "~/db.server";

/**
 * Provides real-time staff metrics for the Event Operations Command Center.
 * This data is consumed by Module 10's dashboard components.
 */
export async function getStaffOperationsDashboardData(
  eventId: string,
): Promise<StaffOperationsDashboard> {
  const today = new Date().toISOString().split("T")[0];

  // Get aggregate staff metrics
  const [
    totalStaff,
    activeNow,
    onBreak,
    checkedInToday,
    shiftsToday,
    coverageGaps,
    upcomingShiftChanges,
  ] = await Promise.all([
    prisma.staffMember.count({
      where: { eventId, status: "ACTIVE" },
    }),
    prisma.staffMember.count({
      where: { eventId, currentStatus: "ON_DUTY" },
    }),
    prisma.staffMember.count({
      where: { eventId, currentStatus: "ON_BREAK" },
    }),
    prisma.staffShift.count({
      where: {
        eventId,
        date: today,
        checkInTime: { not: null },
      },
    }),
    prisma.staffShift.count({
      where: { eventId, date: today },
    }),
    prisma.coverageGap.count({
      where: {
        eventId,
        date: today,
        status: "UNRESOLVED",
      },
    }),
    prisma.staffShift.findMany({
      where: {
        eventId,
        date: today,
        startTime: {
          gte: new Date().toTimeString().slice(0, 5),
          lte: new Date(Date.now() + 30 * 60000).toTimeString().slice(0, 5),
        },
        checkInTime: null,
      },
      include: { staffMember: true, zone: true },
      take: 10,
    }),
  ]);

  // Get zone coverage summary
  const zoneCoverage = await prisma.$queryRaw<ZoneCoverageRow[]>`
    SELECT
      z.id as zone_id,
      z.name as zone_name,
      z.required_staff_count,
      COUNT(DISTINCT CASE WHEN sm.current_status = 'ON_DUTY' THEN sm.id END) as current_staff,
      CASE
        WHEN COUNT(DISTINCT CASE WHEN sm.current_status = 'ON_DUTY' THEN sm.id END) >= z.required_staff_count THEN 'ADEQUATE'
        WHEN COUNT(DISTINCT CASE WHEN sm.current_status = 'ON_DUTY' THEN sm.id END) >= z.required_staff_count * 0.7 THEN 'WARNING'
        ELSE 'CRITICAL'
      END as coverage_status
    FROM zones z
    LEFT JOIN staff_shifts ss ON ss.zone_id = z.id AND ss.date = ${today}
    LEFT JOIN staff_members sm ON sm.id = ss.staff_member_id AND sm.event_id = ${eventId}
    WHERE z.event_id = ${eventId}
    GROUP BY z.id, z.name, z.required_staff_count
  `;

  return {
    summary: {
      totalStaff,
      activeNow,
      onBreak,
      checkedInToday,
      shiftsToday,
      coverageGaps,
    },
    zoneCoverage,
    upcomingShiftChanges: upcomingShiftChanges.map((shift) => ({
      shiftId: shift.id,
      staffName: `${shift.staffMember.firstName} ${shift.staffMember.lastName}`,
      zoneName: shift.zone?.name ?? "Unassigned",
      startTime: shift.startTime,
      status: "PENDING_CHECKIN",
    })),
    lastUpdated: new Date().toISOString(),
  };
}

interface StaffOperationsDashboard {
  summary: {
    totalStaff: number;
    activeNow: number;
    onBreak: number;
    checkedInToday: number;
    shiftsToday: number;
    coverageGaps: number;
  };
  zoneCoverage: ZoneCoverageRow[];
  upcomingShiftChanges: ShiftChangePreview[];
  lastUpdated: string;
}

interface ZoneCoverageRow {
  zone_id: string;
  zone_name: string;
  required_staff_count: number;
  current_staff: number;
  coverage_status: "ADEQUATE" | "WARNING" | "CRITICAL";
}

interface ShiftChangePreview {
  shiftId: string;
  staffName: string;
  zoneName: string;
  startTime: string;
  status: string;
}
```

### 7.8 Module 11 — Logistics and Venue

Module 13 integrates with logistics for staff zone assignments, interpreter transport, and accommodation.

#### 7.8.1 Staff Zone Assignment

```typescript
// file: app/modules/people/services/logistics-integration.server.ts

import { prisma } from "~/db.server";
import { logisticsApi } from "~/modules/logistics/api.server";

/**
 * Syncs staff shift assignments with venue zone capacity tracking.
 * Called when shifts are created, modified, or cancelled.
 */
export async function syncStaffZoneAssignment(
  shiftId: string,
  operation: "CREATE" | "UPDATE" | "DELETE",
): Promise<void> {
  const shift = await prisma.staffShift.findUnique({
    where: { id: shiftId },
    include: { staffMember: true, zone: true },
  });

  if (!shift) return;

  switch (operation) {
    case "CREATE":
    case "UPDATE":
      await logisticsApi.updateZoneStaffing({
        zoneId: shift.zoneId,
        date: shift.date,
        timeSlot: { start: shift.startTime, end: shift.endTime },
        staffCount: 1,
        operation: operation === "CREATE" ? "INCREMENT" : "REPLACE",
        staffRole: shift.staffMember.role,
        shiftId: shift.id,
      });
      break;

    case "DELETE":
      await logisticsApi.updateZoneStaffing({
        zoneId: shift.zoneId,
        date: shift.date,
        timeSlot: { start: shift.startTime, end: shift.endTime },
        staffCount: 1,
        operation: "DECREMENT",
        shiftId: shift.id,
      });
      break;
  }
}

/**
 * Requests transport for interpreter shifts at remote venues.
 * Interpreters working bilaterals may need transport between venues.
 */
export async function requestInterpreterTransport(
  assignmentId: string,
): Promise<{ transportRequestId: string }> {
  const assignment = await prisma.interpreterAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      interpreter: true,
      service: {
        include: { session: { include: { venue: true } } },
      },
    },
  });

  if (!assignment) throw new Error("Assignment not found");

  const venue = assignment.service.session?.venue;
  if (!venue) return { transportRequestId: "" }; // No transport needed

  // Check if venue requires transport
  const venueRequiresTransport = venue.transportRequired ?? false;
  if (!venueRequiresTransport) return { transportRequestId: "" };

  // Create transport request via Module 11
  const transportRequest = await logisticsApi.createTransportRequest({
    eventId: assignment.service.eventId,
    tenantId: assignment.service.tenantId,
    requestType: "STAFF_TRANSPORT",
    passengerType: "INTERPRETER",
    passengerId: assignment.interpreterId,
    passengerName: `${assignment.interpreter.firstName} ${assignment.interpreter.lastName}`,
    passengerCount: 1,
    pickupLocation: "INTERPRETER_LOUNGE", // Default pickup
    dropoffLocation: venue.id,
    scheduledTime: assignment.startTime,
    returnTrip: true,
    returnTime: assignment.endTime,
    priority: "NORMAL",
    notes: `Interpreter for ${assignment.service.name}`,
  });

  // Link transport request to assignment
  await prisma.interpreterAssignment.update({
    where: { id: assignmentId },
    data: { transportRequestId: transportRequest.id },
  });

  return { transportRequestId: transportRequest.id };
}
```

#### 7.8.2 Staff Accommodation Tracking

```typescript
// file: app/modules/people/services/staff-accommodation.server.ts

import { prisma } from "~/db.server";
import { logisticsApi } from "~/modules/logistics/api.server";

/**
 * Links staff members to accommodation assignments.
 * Used for overnight staff and international interpreters.
 */
export async function assignStaffAccommodation(
  staffMemberId: string,
  accommodationDetails: StaffAccommodationInput,
): Promise<{ accommodationId: string }> {
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
  });

  if (!staff) throw new Error("Staff member not found");

  // Create accommodation request via Module 11
  const accommodation = await logisticsApi.createAccommodationAssignment({
    eventId: staff.eventId,
    tenantId: staff.tenantId,
    guestType: "STAFF",
    guestId: staffMemberId,
    guestName: `${staff.firstName} ${staff.lastName}`,
    hotelId: accommodationDetails.hotelId,
    roomType: accommodationDetails.roomType,
    checkInDate: accommodationDetails.checkInDate,
    checkOutDate: accommodationDetails.checkOutDate,
    specialRequests: accommodationDetails.specialRequests,
    costCenter: `STAFF_${staff.department}`,
  });

  // Update staff record with accommodation reference
  await prisma.staffMember.update({
    where: { id: staffMemberId },
    data: { accommodationId: accommodation.id },
  });

  return { accommodationId: accommodation.id };
}

interface StaffAccommodationInput {
  hotelId: string;
  roomType: "SINGLE" | "DOUBLE" | "SUITE";
  checkInDate: Date;
  checkOutDate: Date;
  specialRequests?: string;
}
```

### 7.9 Module 12 — Protocol and Diplomacy

Module 13 provides interpretation services for bilateral meetings and staff support for VIP movements.

#### 7.9.1 Bilateral Interpretation Requests

```typescript
// file: app/modules/people/services/bilateral-interpretation.server.ts

import { prisma } from "~/db.server";
import { eventBus } from "~/core/events/event-bus";

/**
 * When a bilateral meeting is scheduled, Module 12 requests interpretation services.
 * This handler creates the interpretation service and assigns interpreters.
 */
eventBus.subscribe("BilateralMeetingScheduled", async (event) => {
  const { bilateralId, eventId, tenantId, date, startTime, endTime, roomId, languageRequirements } =
    event.payload;

  // Create interpretation service for the bilateral
  const service = await prisma.interpretationService.create({
    data: {
      tenantId,
      eventId,
      name: `Bilateral Interpretation - ${bilateralId}`,
      serviceType: "BILATERAL",
      date: new Date(date),
      startTime,
      endTime,
      roomId,
      sourceLanguages: languageRequirements.sourceLanguages,
      targetLanguages: languageRequirements.targetLanguages,
      isSimultaneous: languageRequirements.mode === "SIMULTANEOUS",
      status: "PENDING_ASSIGNMENT",
      bilateralId, // Link back to Module 12
      priority: "HIGH", // Bilaterals are high priority
    },
  });

  // Attempt auto-assignment of interpreters
  const languagePairs = generateLanguagePairs(
    languageRequirements.sourceLanguages,
    languageRequirements.targetLanguages,
  );

  for (const pair of languagePairs) {
    const availableInterpreter = await findAvailableInterpreter({
      eventId,
      date,
      startTime,
      endTime,
      sourceLanguage: pair.source,
      targetLanguage: pair.target,
      excludeIds: [], // First pass, no exclusions
    });

    if (availableInterpreter) {
      await prisma.interpreterAssignment.create({
        data: {
          serviceId: service.id,
          interpreterId: availableInterpreter.id,
          languagePair: `${pair.source}-${pair.target}`,
          startTime: new Date(`${date}T${startTime}`),
          endTime: new Date(`${date}T${endTime}`),
          status: "ASSIGNED",
        },
      });
    }
  }

  // Notify Module 12 of interpretation service status
  await eventBus.publish("InterpretationServiceReady", {
    bilateralId,
    serviceId: service.id,
    status: service.status,
    assignedInterpreters: await getAssignmentSummary(service.id),
  });
});

function generateLanguagePairs(
  sources: string[],
  targets: string[],
): Array<{ source: string; target: string }> {
  const pairs: Array<{ source: string; target: string }> = [];
  for (const source of sources) {
    for (const target of targets) {
      if (source !== target) {
        pairs.push({ source, target });
      }
    }
  }
  return pairs;
}

async function findAvailableInterpreter(params: {
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
  sourceLanguage: string;
  targetLanguage: string;
  excludeIds: string[];
}): Promise<{ id: string } | null> {
  // Implementation in Section 5 (Business Logic)
  return null;
}

async function getAssignmentSummary(serviceId: string): Promise<unknown[]> {
  return prisma.interpreterAssignment.findMany({
    where: { serviceId },
    select: {
      id: true,
      languagePair: true,
      interpreter: { select: { firstName: true, lastName: true } },
    },
  });
}
```

#### 7.9.2 VIP Support Staff Coordination

```typescript
// file: app/modules/people/services/vip-support.server.ts

import { prisma } from "~/db.server";
import { eventBus } from "~/core/events/event-bus";

/**
 * Assigns support staff to VIP movements.
 * VIP liaisons and protocol officers are assigned based on delegation.
 */
export async function assignVIPSupportStaff(
  vipMovementId: string,
  delegationId: string,
): Promise<{ liaisons: StaffAssignment[]; protocolOfficers: StaffAssignment[] }> {
  const movement = await prisma.vipMovement.findUnique({
    where: { id: vipMovementId },
    include: { delegation: true },
  });

  if (!movement) throw new Error("VIP movement not found");

  // Find available VIP liaisons for this delegation
  const liaisons = await prisma.staffMember.findMany({
    where: {
      eventId: movement.eventId,
      role: "VIP_LIAISON",
      status: "ACTIVE",
      // Liaisons may be pre-assigned to specific delegations
      OR: [
        { assignedDelegationId: delegationId },
        { assignedDelegationId: null }, // Or unassigned/floating
      ],
    },
    include: {
      shifts: {
        where: {
          date: movement.date.toISOString().split("T")[0],
          startTime: { lte: movement.departureTime },
          endTime: { gte: movement.arrivalTime },
        },
      },
    },
  });

  // Filter to those on shift during the movement
  const availableLiaisons = liaisons.filter((l) => l.shifts.length > 0);

  // Find protocol officers
  const protocolOfficers = await prisma.staffMember.findMany({
    where: {
      eventId: movement.eventId,
      role: "PROTOCOL_OFFICER",
      status: "ACTIVE",
    },
    include: {
      shifts: {
        where: {
          date: movement.date.toISOString().split("T")[0],
          startTime: { lte: movement.departureTime },
          endTime: { gte: movement.arrivalTime },
        },
      },
    },
  });

  const availableProtocolOfficers = protocolOfficers.filter((p) => p.shifts.length > 0);

  // Create assignments
  const liaisonAssignments: StaffAssignment[] = [];
  const protocolAssignments: StaffAssignment[] = [];

  if (availableLiaisons.length > 0) {
    const assigned = availableLiaisons[0]; // Assign first available
    const assignment = await prisma.vipSupportAssignment.create({
      data: {
        vipMovementId,
        staffMemberId: assigned.id,
        role: "VIP_LIAISON",
        status: "ASSIGNED",
      },
    });
    liaisonAssignments.push({
      assignmentId: assignment.id,
      staffId: assigned.id,
      staffName: `${assigned.firstName} ${assigned.lastName}`,
      role: "VIP_LIAISON",
    });
  }

  if (availableProtocolOfficers.length > 0) {
    const assigned = availableProtocolOfficers[0];
    const assignment = await prisma.vipSupportAssignment.create({
      data: {
        vipMovementId,
        staffMemberId: assigned.id,
        role: "PROTOCOL_OFFICER",
        status: "ASSIGNED",
      },
    });
    protocolAssignments.push({
      assignmentId: assignment.id,
      staffId: assigned.id,
      staffName: `${assigned.firstName} ${assigned.lastName}`,
      role: "PROTOCOL_OFFICER",
    });
  }

  return {
    liaisons: liaisonAssignments,
    protocolOfficers: protocolAssignments,
  };
}

interface StaffAssignment {
  assignmentId: string;
  staffId: string;
  staffName: string;
  role: string;
}
```

### 7.10 Module 14 — Content and Documents

Module 13 uses content services for media advisories, staff communications, and volunteer certificates.

#### 7.10.1 Media Advisory Templates

```typescript
// file: app/modules/people/services/advisory-templates.server.ts

import { prisma } from "~/db.server";
import { contentApi } from "~/modules/content/api.server";

/**
 * Media advisories use the content template engine for formatting.
 */
export async function generateAdvisoryDocument(
  advisoryId: string,
  format: "PDF" | "HTML" | "PLAIN_TEXT",
): Promise<{ documentUrl: string; content: string }> {
  const advisory = await prisma.mediaAdvisory.findUnique({
    where: { id: advisoryId },
    include: {
      event: true,
      pressConference: {
        include: { speakers: { include: { participant: true } } },
      },
    },
  });

  if (!advisory) throw new Error("Advisory not found");

  // Get the template for this advisory type
  const template = await contentApi.getTemplate({
    tenantId: advisory.tenantId,
    templateType: "MEDIA_ADVISORY",
    subtype: advisory.advisoryType,
    format,
  });

  // Prepare template data
  const templateData = {
    // Header
    eventName: advisory.event.name,
    eventDates: formatEventDates(advisory.event),
    advisoryNumber: advisory.advisoryNumber,
    releaseDate: formatDate(advisory.publishedAt ?? new Date()),

    // Embargo
    hasEmbargo: advisory.embargoUntil !== null,
    embargoUntil: advisory.embargoUntil ? formatDateTime(advisory.embargoUntil) : null,
    embargoNotice: advisory.embargoUntil
      ? `EMBARGOED UNTIL ${formatDateTime(advisory.embargoUntil)}`
      : "FOR IMMEDIATE RELEASE",

    // Content
    headline: advisory.headline,
    subheadline: advisory.subheadline,
    body: advisory.body,
    keyPoints: advisory.keyPoints,

    // Press conference details (if applicable)
    pressConference: advisory.pressConference
      ? {
          date: formatDate(advisory.pressConference.scheduledAt),
          time: formatTime(advisory.pressConference.scheduledAt),
          location: advisory.pressConference.location,
          speakers: advisory.pressConference.speakers.map((s) => ({
            name: `${s.participant.firstName} ${s.participant.familyName}`,
            title: s.title,
            organization: s.organization,
          })),
        }
      : null,

    // Contact
    mediaContact: {
      name: advisory.mediaContactName,
      email: advisory.mediaContactEmail,
      phone: advisory.mediaContactPhone,
    },

    // Footer
    distributionList: advisory.distributionList,
    copyrightYear: new Date().getFullYear(),
  };

  // Render document
  const rendered = await contentApi.renderTemplate({
    templateId: template.id,
    data: templateData,
    format,
  });

  // Store generated document
  const documentUrl = await contentApi.storeDocument({
    content: rendered.content,
    filename: `advisory_${advisory.advisoryNumber}.${format.toLowerCase()}`,
    mimeType: getMimeType(format),
    metadata: {
      advisoryId,
      eventId: advisory.eventId,
      generatedAt: new Date().toISOString(),
    },
  });

  return { documentUrl, content: rendered.content };
}

function formatEventDates(event: { startDate: Date; endDate: Date }): string {
  return `${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

function getMimeType(format: "PDF" | "HTML" | "PLAIN_TEXT"): string {
  switch (format) {
    case "PDF":
      return "application/pdf";
    case "HTML":
      return "text/html";
    case "PLAIN_TEXT":
      return "text/plain";
  }
}
```

#### 7.10.2 Volunteer Certificate Generation

```typescript
// file: app/modules/people/services/volunteer-certificate.server.ts

import { prisma } from "~/db.server";
import { contentApi } from "~/modules/content/api.server";

/**
 * Generates completion certificates for volunteers after event conclusion.
 */
export async function generateVolunteerCertificate(
  volunteerId: string,
): Promise<{ certificateUrl: string }> {
  const volunteer = await prisma.staffMember.findUnique({
    where: { id: volunteerId },
    include: {
      event: true,
      shifts: { where: { status: "COMPLETED" } },
      evaluations: { where: { evaluationType: "VOLUNTEER_COMPLETION" } },
    },
  });

  if (!volunteer) throw new Error("Volunteer not found");
  if (volunteer.role !== "VOLUNTEER") {
    throw new Error("Staff member is not a volunteer");
  }

  // Calculate volunteer statistics
  const totalShifts = volunteer.shifts.length;
  const totalHours = volunteer.shifts.reduce((sum, shift) => {
    const start = parseTime(shift.startTime);
    const end = parseTime(shift.endTime);
    return sum + (end - start) / 3600000;
  }, 0);

  const averageRating =
    volunteer.evaluations.length > 0
      ? volunteer.evaluations.reduce((sum, e) => sum + (e.rating ?? 0), 0) /
        volunteer.evaluations.length
      : null;

  // Determine certificate type based on performance
  let certificateType: "STANDARD" | "MERIT" | "DISTINCTION" = "STANDARD";
  if (averageRating !== null && averageRating >= 4.5 && totalHours >= 40) {
    certificateType = "DISTINCTION";
  } else if (averageRating !== null && averageRating >= 4.0 && totalHours >= 30) {
    certificateType = "MERIT";
  }

  // Get certificate template
  const template = await contentApi.getTemplate({
    tenantId: volunteer.tenantId,
    templateType: "VOLUNTEER_CERTIFICATE",
    subtype: certificateType,
    format: "PDF",
  });

  // Render certificate
  const rendered = await contentApi.renderTemplate({
    templateId: template.id,
    data: {
      volunteerName: `${volunteer.firstName} ${volunteer.lastName}`,
      eventName: volunteer.event.name,
      eventDates: formatEventDates(volunteer.event),
      totalHours: Math.round(totalHours),
      totalShifts,
      certificateType,
      certificateNumber: generateCertificateNumber(volunteer.id),
      issueDate: formatDate(new Date()),
      // Signatures
      signatoryName: "Event Director",
      signatoryTitle: "Director of Operations",
    },
    format: "PDF",
  });

  // Store certificate
  const certificateUrl = await contentApi.storeDocument({
    content: rendered.content,
    filename: `volunteer_certificate_${volunteer.id}.pdf`,
    mimeType: "application/pdf",
    metadata: {
      volunteerId: volunteer.id,
      eventId: volunteer.eventId,
      certificateType,
      issuedAt: new Date().toISOString(),
    },
  });

  // Update volunteer record
  await prisma.staffMember.update({
    where: { id: volunteerId },
    data: {
      certificateUrl,
      certificateIssuedAt: new Date(),
    },
  });

  return { certificateUrl };
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 3600000 + minutes * 60000;
}

function generateCertificateNumber(volunteerId: string): string {
  const year = new Date().getFullYear();
  const shortId = volunteerId.slice(-8).toUpperCase();
  return `VOL-${year}-${shortId}`;
}
```

### 7.11 Module 16 — Participant Experience

Module 13 integrates with participant-facing mobile apps for journalists and staff notifications.

#### 7.11.1 Journalist Mobile App Integration

```typescript
// file: app/modules/people/services/journalist-mobile.server.ts

import { prisma } from "~/db.server";
import { mobileApi } from "~/modules/participant-experience/api.server";

/**
 * Provides data feeds for the journalist mobile app.
 */
export async function getJournalistMobileData(
  journalistId: string,
  eventId: string,
): Promise<JournalistMobileData> {
  const journalist = await prisma.participant.findFirst({
    where: {
      id: journalistId,
      eventId,
      participantType: "MEDIA",
    },
  });

  if (!journalist) throw new Error("Journalist not found");

  // Get interview requests
  const interviewRequests = await prisma.interviewRequest.findMany({
    where: {
      eventId,
      journalistId,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get upcoming press conferences
  const pressConferences = await prisma.pressConference.findMany({
    where: {
      eventId,
      scheduledAt: { gte: new Date() },
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    include: {
      speakers: { include: { participant: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });

  // Get media advisories
  const advisories = await prisma.mediaAdvisory.findMany({
    where: {
      eventId,
      status: "PUBLISHED",
      OR: [{ embargoUntil: null }, { embargoUntil: { lte: new Date() } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  // Get media pool assignments
  const poolAssignments = await prisma.mediaPoolAssignment.findMany({
    where: {
      eventId,
      journalistId,
      status: "ACTIVE",
    },
    include: { pool: true },
  });

  return {
    profile: {
      name: `${journalist.firstName} ${journalist.familyName}`,
      organization: journalist.organization ?? "",
      accreditationType: journalist.badgeType ?? "MEDIA",
    },
    interviewRequests: interviewRequests.map((r) => ({
      id: r.id,
      status: r.status,
      targetDelegation: r.targetDelegationName,
      requestedDate: r.requestedDate?.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
    upcomingPressConferences: pressConferences.map((pc) => ({
      id: pc.id,
      title: pc.title,
      scheduledAt: pc.scheduledAt.toISOString(),
      location: pc.location,
      speakers: pc.speakers.map((s) => ({
        name: `${s.participant.firstName} ${s.participant.familyName}`,
        title: s.title,
      })),
      hasRegistered: false, // TODO: Check registration
    })),
    recentAdvisories: advisories.map((a) => ({
      id: a.id,
      headline: a.headline,
      advisoryType: a.advisoryType,
      publishedAt: a.publishedAt?.toISOString() ?? "",
      hasAttachment: a.attachmentUrl !== null,
    })),
    poolAssignments: poolAssignments.map((pa) => ({
      poolId: pa.poolId,
      poolName: pa.pool.name,
      poolType: pa.pool.type,
      location: pa.pool.location,
      date: pa.date.toISOString(),
    })),
    quickActions: [
      { type: "REQUEST_INTERVIEW", label: "Request Interview", icon: "microphone" },
      { type: "VIEW_SCHEDULE", label: "Press Conference Schedule", icon: "calendar" },
      { type: "VIEW_ADVISORIES", label: "Media Advisories", icon: "newspaper" },
      { type: "VIEW_POOL", label: "My Pool Assignments", icon: "camera" },
    ],
  };
}

interface JournalistMobileData {
  profile: {
    name: string;
    organization: string;
    accreditationType: string;
  };
  interviewRequests: Array<{
    id: string;
    status: string;
    targetDelegation: string;
    requestedDate: string | undefined;
    createdAt: string;
  }>;
  upcomingPressConferences: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    location: string;
    speakers: Array<{ name: string; title: string }>;
    hasRegistered: boolean;
  }>;
  recentAdvisories: Array<{
    id: string;
    headline: string;
    advisoryType: string;
    publishedAt: string;
    hasAttachment: boolean;
  }>;
  poolAssignments: Array<{
    poolId: string;
    poolName: string;
    poolType: string;
    location: string;
    date: string;
  }>;
  quickActions: Array<{
    type: string;
    label: string;
    icon: string;
  }>;
}
```

#### 7.11.2 Staff Notification Push

```typescript
// file: app/modules/people/services/staff-notifications.server.ts

import { prisma } from "~/db.server";
import { mobileApi } from "~/modules/participant-experience/api.server";

/**
 * Sends push notifications to staff mobile devices.
 */
export async function sendStaffNotification(
  staffMemberId: string,
  notification: StaffNotification,
): Promise<{ sent: boolean; messageId?: string }> {
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    select: {
      id: true,
      userId: true,
      email: true,
      phone: true,
      notificationPreferences: true,
    },
  });

  if (!staff) throw new Error("Staff member not found");

  const preferences = (staff.notificationPreferences as NotificationPreferences) ?? {
    push: true,
    email: true,
    sms: false,
  };

  // Determine delivery channels based on notification type and preferences
  const channels: string[] = [];

  if (notification.priority === "URGENT") {
    // Urgent notifications go to all enabled channels
    if (preferences.push) channels.push("PUSH");
    if (preferences.sms && staff.phone) channels.push("SMS");
    if (preferences.email) channels.push("EMAIL");
  } else {
    // Normal notifications respect preferences
    if (preferences.push) channels.push("PUSH");
    if (notification.type === "SHIFT_REMINDER" && preferences.email) {
      channels.push("EMAIL");
    }
  }

  if (channels.length === 0) {
    return { sent: false };
  }

  // Send via Module 16's notification service
  const result = await mobileApi.sendNotification({
    userId: staff.userId,
    channels,
    notification: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      category: notification.type,
      priority: notification.priority,
      actions: notification.actions,
    },
  });

  // Log notification
  await prisma.notificationLog.create({
    data: {
      recipientId: staffMemberId,
      recipientType: "STAFF",
      notificationType: notification.type,
      title: notification.title,
      body: notification.body,
      channels: channels,
      status: result.success ? "SENT" : "FAILED",
      messageId: result.messageId,
      sentAt: new Date(),
    },
  });

  return { sent: result.success, messageId: result.messageId };
}

interface StaffNotification {
  type:
    | "SHIFT_REMINDER"
    | "SHIFT_CHANGE"
    | "SWAP_REQUEST"
    | "SWAP_APPROVED"
    | "COVERAGE_GAP"
    | "ASSIGNMENT_UPDATE"
    | "URGENT_RECALL";
  title: string;
  body: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  data?: Record<string, unknown>;
  actions?: Array<{
    id: string;
    title: string;
    type: "ACCEPT" | "DECLINE" | "VIEW" | "NAVIGATE";
  }>;
}

interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
}
```

### 7.12 Integration Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MODULE 13 INTEGRATION EVENT FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   Module 09  │
                              │ Registration │
                              └──────┬───────┘
                                     │
              ParticipantRegistered  │  MediaAccreditationApproved
                                     ▼
┌──────────────┐           ┌─────────────────┐           ┌──────────────┐
│   Module 04  │◀─────────▶│    MODULE 13    │◀─────────▶│   Module 05  │
│   Workflow   │           │     PEOPLE      │           │   Security   │
│              │           │   & WORKFORCE   │           │              │
│ - Staff      │           │                 │           │ - Zone Access│
│   Approval   │           │ ┌─────────────┐ │           │ - RBAC       │
│ - Volunteer  │           │ │Staff Mgmt   │ │           │ - Audit      │
│   Onboard    │           │ ├─────────────┤ │           └──────────────┘
│ - Interview  │           │ │Interpret.   │ │
│   Request    │           │ ├─────────────┤ │           ┌──────────────┐
└──────────────┘           │ │Media Ops    │ │◀─────────▶│   Module 07  │
                           │ └─────────────┘ │           │     API      │
                           └────────┬────────┘           │              │
                                    │                    │ - SSE Events │
           ┌────────────────────────┼────────────────────│ - Webhooks   │
           │                        │                    └──────────────┘
           ▼                        ▼
┌──────────────┐           ┌──────────────┐           ┌──────────────┐
│   Module 10  │           │   Module 11  │           │   Module 12  │
│  Event Ops   │           │   Logistics  │           │   Protocol   │
│              │           │              │           │              │
│ - Dashboard  │           │ - Zone Staff │           │ - Bilateral  │
│ - Check-in   │           │ - Transport  │           │   Interpret. │
│ - Coverage   │           │ - Accommod.  │           │ - VIP Staff  │
└──────────────┘           └──────────────┘           └──────────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
                           ┌──────────────┐           ┌──────────────┐
                           │   Module 14  │           │   Module 16  │
                           │   Content    │           │ Participant  │
                           │              │           │  Experience  │
                           │ - Advisory   │           │              │
                           │   Templates  │           │ - Journalist │
                           │ - Volunteer  │           │   Mobile App │
                           │   Certs      │           │ - Staff Push │
                           └──────────────┘           └──────────────┘

Event Types:
───────────
→ Domain Events (async, via EventBus)
◀▶ REST API / Service Calls (sync)
⟹ SSE Real-time Events (push)
```

---

## 8. Configuration

Module 13 uses a layered configuration system with settings stored in the database (SystemSetting) and feature flags managed through Module 17. This section defines all configuration keys, default values, and their effects.

### 8.1 Settings Key Registry

All settings are namespaced under `people.*` and registered with Module 17's configuration system.

```typescript
// file: app/modules/people/config/settings-registry.ts

import type { SettingDefinition } from "~/core/config/types";

/**
 * Settings definitions for Module 13.
 * These are registered with Module 17 at application startup.
 */
export const PEOPLE_SETTINGS: SettingDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF MANAGEMENT SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.staff.max_shift_hours",
    name: "Maximum Shift Duration",
    description: "Maximum hours a staff member can be scheduled for a single shift",
    type: "number",
    defaultValue: 8,
    validation: { min: 4, max: 12 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.mandatory_rest_hours",
    name: "Mandatory Rest Period",
    description: "Minimum hours of rest required between consecutive shifts",
    type: "number",
    defaultValue: 10,
    validation: { min: 8, max: 16 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.overtime_threshold_hours",
    name: "Overtime Threshold",
    description: "Hours per day after which overtime rules apply",
    type: "number",
    defaultValue: 8,
    validation: { min: 6, max: 10 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.max_weekly_hours",
    name: "Maximum Weekly Hours",
    description: "Maximum total hours a staff member can work per week",
    type: "number",
    defaultValue: 48,
    validation: { min: 35, max: 60 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.break_duration_minutes",
    name: "Standard Break Duration",
    description: "Default break duration in minutes",
    type: "number",
    defaultValue: 30,
    validation: { min: 15, max: 60 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.auto_break_after_hours",
    name: "Auto-Break Threshold",
    description: "Hours after which a break is automatically required",
    type: "number",
    defaultValue: 4,
    validation: { min: 3, max: 6 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.shift_reminder_hours",
    name: "Shift Reminder Lead Time",
    description: "Hours before shift start to send reminder notification",
    type: "number",
    defaultValue: 2,
    validation: { min: 1, max: 24 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.late_threshold_minutes",
    name: "Late Check-in Threshold",
    description: "Minutes after shift start before marking as late",
    type: "number",
    defaultValue: 15,
    validation: { min: 5, max: 30 },
    scope: "event",
    category: "STAFF",
  },
  {
    key: "people.staff.auto_checkout_hours",
    name: "Auto Check-out Duration",
    description: "Hours after which system auto-checks out if no activity",
    type: "number",
    defaultValue: 12,
    validation: { min: 8, max: 16 },
    scope: "event",
    category: "STAFF",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-SCHEDULING SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.scheduling.algorithm",
    name: "Scheduling Algorithm",
    description: "Algorithm used for auto-scheduling shifts",
    type: "enum",
    defaultValue: "GREEDY_BALANCED",
    options: ["GREEDY_BALANCED", "CONSTRAINT_PROGRAMMING", "HYBRID"],
    scope: "tenant",
    category: "SCHEDULING",
  },
  {
    key: "people.scheduling.balance_weight",
    name: "Workload Balance Weight",
    description: "Weight given to workload balancing in scheduling (0-1)",
    type: "number",
    defaultValue: 0.7,
    validation: { min: 0, max: 1 },
    scope: "event",
    category: "SCHEDULING",
  },
  {
    key: "people.scheduling.preference_weight",
    name: "Staff Preference Weight",
    description: "Weight given to staff preferences in scheduling (0-1)",
    type: "number",
    defaultValue: 0.3,
    validation: { min: 0, max: 1 },
    scope: "event",
    category: "SCHEDULING",
  },
  {
    key: "people.scheduling.max_iterations",
    name: "Max Scheduling Iterations",
    description: "Maximum iterations for constraint satisfaction solver",
    type: "number",
    defaultValue: 10000,
    validation: { min: 1000, max: 100000 },
    scope: "tenant",
    category: "SCHEDULING",
  },
  {
    key: "people.scheduling.timeout_seconds",
    name: "Scheduling Timeout",
    description: "Maximum seconds allowed for auto-scheduling operation",
    type: "number",
    defaultValue: 30,
    validation: { min: 10, max: 120 },
    scope: "tenant",
    category: "SCHEDULING",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERPRETATION SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.interpretation.rotation_interval_minutes",
    name: "Interpreter Rotation Interval",
    description: "Minutes between interpreter rotations in booths",
    type: "number",
    defaultValue: 30,
    validation: { min: 15, max: 45 },
    scope: "event",
    category: "INTERPRETATION",
  },
  {
    key: "people.interpretation.max_consecutive_blocks",
    name: "Max Consecutive Interpretation Blocks",
    description: "Maximum number of consecutive rotation blocks without extended break",
    type: "number",
    defaultValue: 4,
    validation: { min: 2, max: 8 },
    scope: "event",
    category: "INTERPRETATION",
  },
  {
    key: "people.interpretation.min_rest_between_services",
    name: "Minimum Rest Between Services",
    description: "Minimum minutes of rest required between interpretation services",
    type: "number",
    defaultValue: 15,
    validation: { min: 10, max: 60 },
    scope: "event",
    category: "INTERPRETATION",
  },
  {
    key: "people.interpretation.fatigue_warning_threshold",
    name: "Fatigue Warning Threshold",
    description: "Total minutes of interpretation after which fatigue warning is triggered",
    type: "number",
    defaultValue: 240,
    validation: { min: 120, max: 360 },
    scope: "event",
    category: "INTERPRETATION",
  },
  {
    key: "people.interpretation.min_interpreters_per_booth",
    name: "Minimum Interpreters Per Booth",
    description: "Minimum number of interpreters assigned to each booth for rotation",
    type: "number",
    defaultValue: 2,
    validation: { min: 2, max: 4 },
    scope: "event",
    category: "INTERPRETATION",
  },
  {
    key: "people.interpretation.certification_required",
    name: "Certification Required",
    description: "Whether interpreters must have verified certifications",
    type: "boolean",
    defaultValue: true,
    scope: "event",
    category: "INTERPRETATION",
  },
  {
    key: "people.interpretation.accepted_certifications",
    name: "Accepted Certification Bodies",
    description: "List of accepted certification bodies/standards",
    type: "array",
    defaultValue: ["AIIC", "ATA", "ITI", "CIOL", "UN_LANGUAGE_COMPETITIVE"],
    scope: "tenant",
    category: "INTERPRETATION",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA OPERATIONS SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.media.embargo_enforcement_mode",
    name: "Embargo Enforcement Mode",
    description: "How strictly embargoes are enforced",
    type: "enum",
    defaultValue: "STRICT",
    options: ["STRICT", "WARNING_ONLY", "DISABLED"],
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.auto_lift_embargo",
    name: "Auto-Lift Embargoes",
    description: "Whether embargoes are automatically lifted at scheduled time",
    type: "boolean",
    defaultValue: true,
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.embargo_grace_period_minutes",
    name: "Embargo Grace Period",
    description: "Minutes after embargo lift time before enforcement relaxes",
    type: "number",
    defaultValue: 5,
    validation: { min: 0, max: 30 },
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.interview_request_auto_forward",
    name: "Auto-Forward Interview Requests",
    description: "Whether to auto-forward interview requests to delegations",
    type: "boolean",
    defaultValue: false,
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.interview_response_deadline_hours",
    name: "Interview Response Deadline",
    description: "Hours delegations have to respond to interview requests",
    type: "number",
    defaultValue: 24,
    validation: { min: 4, max: 72 },
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.advisory_distribution_default",
    name: "Default Advisory Distribution",
    description: "Default distribution list for media advisories",
    type: "enum",
    defaultValue: "ACCREDITED_MEDIA",
    options: ["ACCREDITED_MEDIA", "ALL_MEDIA", "SELECTED_OUTLETS", "POOL_ONLY"],
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.pool_rotation_frequency",
    name: "Media Pool Rotation Frequency",
    description: "How often media pool assignments rotate",
    type: "enum",
    defaultValue: "DAILY",
    options: ["DAILY", "PER_SESSION", "PER_EVENT"],
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.max_pool_size",
    name: "Maximum Pool Size",
    description: "Maximum number of journalists in a media pool",
    type: "number",
    defaultValue: 10,
    validation: { min: 3, max: 50 },
    scope: "event",
    category: "MEDIA",
  },
  {
    key: "people.media.press_conference_registration_required",
    name: "Press Conference Registration Required",
    description: "Whether journalists must pre-register for press conferences",
    type: "boolean",
    defaultValue: true,
    scope: "event",
    category: "MEDIA",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VOLUNTEER MANAGEMENT SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.volunteer.self_registration_enabled",
    name: "Volunteer Self-Registration",
    description: "Whether volunteers can self-register through public portal",
    type: "boolean",
    defaultValue: false,
    scope: "event",
    category: "VOLUNTEER",
  },
  {
    key: "people.volunteer.min_age",
    name: "Minimum Volunteer Age",
    description: "Minimum age requirement for volunteers",
    type: "number",
    defaultValue: 18,
    validation: { min: 16, max: 21 },
    scope: "tenant",
    category: "VOLUNTEER",
  },
  {
    key: "people.volunteer.background_check_required",
    name: "Background Check Required",
    description: "Whether background checks are required for volunteers",
    type: "boolean",
    defaultValue: true,
    scope: "tenant",
    category: "VOLUNTEER",
  },
  {
    key: "people.volunteer.training_required",
    name: "Training Required",
    description: "Whether volunteers must complete training modules",
    type: "boolean",
    defaultValue: true,
    scope: "event",
    category: "VOLUNTEER",
  },
  {
    key: "people.volunteer.min_training_modules",
    name: "Minimum Training Modules",
    description: "Minimum number of training modules to complete",
    type: "number",
    defaultValue: 3,
    validation: { min: 1, max: 10 },
    scope: "event",
    category: "VOLUNTEER",
  },
  {
    key: "people.volunteer.certificate_generation",
    name: "Certificate Generation",
    description: "Whether to auto-generate completion certificates",
    type: "boolean",
    defaultValue: true,
    scope: "tenant",
    category: "VOLUNTEER",
  },
];
```

### 8.2 Feature Flags

Feature flags control the availability of experimental or optional functionality.

```typescript
// file: app/modules/people/config/feature-flags.ts

import type { FeatureFlagDefinition } from "~/core/config/types";

/**
 * Feature flag definitions for Module 13.
 * Managed through Module 17's feature flag system.
 */
export const PEOPLE_FEATURE_FLAGS: FeatureFlagDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.staff_mobile_app",
    name: "Staff Mobile App",
    description: "Enable staff mobile app for check-in, schedules, and notifications",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "tenant",
  },
  {
    key: "people.ai_scheduling_suggestions",
    name: "AI Scheduling Suggestions",
    description: "Use AI to suggest optimal shift assignments based on historical data",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "tenant",
    dependencies: ["core.ai_features_enabled"],
  },
  {
    key: "people.biometric_checkin",
    name: "Biometric Check-in",
    description: "Enable fingerprint/face recognition for staff check-in",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
  {
    key: "people.self_service_swap",
    name: "Self-Service Shift Swap",
    description: "Allow staff to request and approve swaps without manager approval",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
  {
    key: "people.geofenced_checkin",
    name: "Geofenced Check-in",
    description: "Require staff to be within venue bounds for mobile check-in",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
    dependencies: ["people.staff_mobile_app"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERPRETATION FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.realtime_fatigue_monitoring",
    name: "Real-time Fatigue Monitoring",
    description: "Monitor interpreter fatigue in real-time with adaptive rotation",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
  {
    key: "people.ai_interpreter_matching",
    name: "AI Interpreter Matching",
    description: "Use AI to optimize interpreter-to-service matching based on expertise",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "tenant",
    dependencies: ["core.ai_features_enabled"],
  },
  {
    key: "people.booth_audio_monitoring",
    name: "Booth Audio Monitoring",
    description: "Monitor audio levels in interpretation booths for quality assurance",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
  {
    key: "people.receiver_rfid_tracking",
    name: "RFID Receiver Tracking",
    description: "Track receiver handsets using RFID for automated inventory",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.live_press_conference_streaming",
    name: "Live Press Conference Streaming",
    description: "Enable live streaming of press conferences to media portal",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
  {
    key: "people.ai_transcript_generation",
    name: "AI Transcript Generation",
    description: "Auto-generate transcripts from press conference recordings",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
    dependencies: ["core.ai_features_enabled"],
  },
  {
    key: "people.journalist_question_queue",
    name: "Journalist Question Queue",
    description: "Enable digital question queue for press conferences",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
  {
    key: "people.media_asset_distribution",
    name: "Media Asset Distribution",
    description: "Enable automated distribution of photos/videos to pool members",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VOLUNTEER FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "people.volunteer_gamification",
    name: "Volunteer Gamification",
    description: "Enable points, badges, and leaderboards for volunteer engagement",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
  {
    key: "people.volunteer_skill_matching",
    name: "Volunteer Skill Matching",
    description: "Match volunteers to tasks based on skills and preferences",
    defaultEnabled: false,
    rolloutPercentage: 0,
    scope: "event",
  },
];
```

### 8.3 Environment Variables

Environment variables for runtime configuration and external service integration.

```typescript
// file: app/modules/people/config/env.server.ts

import { z } from "zod";

/**
 * Environment variable schema for Module 13.
 * Validated at application startup.
 */
export const peopleEnvSchema = z.object({
  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF MOBILE APP
  // ═══════════════════════════════════════════════════════════════════════════
  STAFF_APP_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  STAFF_APP_API_KEY: z.string().optional(),
  STAFF_APP_PUSH_CERTIFICATE: z.string().optional(),

  // ═══════════════════════════════════════════════════════════════════════════
  // BIOMETRIC INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  BIOMETRIC_PROVIDER: z.enum(["NONE", "SUPREMA", "HIKVISION", "CUSTOM"]).default("NONE"),
  BIOMETRIC_API_ENDPOINT: z.string().url().optional(),
  BIOMETRIC_API_KEY: z.string().optional(),

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUND CHECK SERVICE
  // ═══════════════════════════════════════════════════════════════════════════
  BACKGROUND_CHECK_PROVIDER: z.enum(["NONE", "CHECKR", "STERLING", "CUSTOM"]).default("NONE"),
  BACKGROUND_CHECK_API_KEY: z.string().optional(),
  BACKGROUND_CHECK_WEBHOOK_SECRET: z.string().optional(),

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERPRETATION SERVICES
  // ═══════════════════════════════════════════════════════════════════════════
  INTERPRETATION_BOOTH_HARDWARE_INTEGRATION: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  BOOTH_CONTROL_API_ENDPOINT: z.string().url().optional(),
  RECEIVER_TRACKING_SYSTEM: z.enum(["NONE", "RFID", "BARCODE", "MANUAL"]).default("MANUAL"),

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA STREAMING
  // ═══════════════════════════════════════════════════════════════════════════
  MEDIA_STREAMING_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  STREAMING_PROVIDER: z.enum(["NONE", "AZURE_MEDIA", "AWS_MEDIACONNECT", "CUSTOM"]).default("NONE"),
  STREAMING_API_KEY: z.string().optional(),
  STREAMING_INGEST_ENDPOINT: z.string().url().optional(),

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION SERVICES
  // ═══════════════════════════════════════════════════════════════════════════
  STAFF_SMS_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  SMS_PROVIDER: z.enum(["TWILIO", "NEXMO", "AWS_SNS"]).default("TWILIO"),

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE TUNING
  // ═══════════════════════════════════════════════════════════════════════════
  PEOPLE_CACHE_TTL_SECONDS: z.coerce.number().default(300),
  SCHEDULING_WORKER_CONCURRENCY: z.coerce.number().default(4),
  COVERAGE_CHECK_INTERVAL_MS: z.coerce.number().default(60000),
  MAX_CONCURRENT_CHECKINS: z.coerce.number().default(100),
});

export type PeopleEnv = z.infer<typeof peopleEnvSchema>;

let env: PeopleEnv | null = null;

export function getPeopleEnv(): PeopleEnv {
  if (!env) {
    env = peopleEnvSchema.parse(process.env);
  }
  return env;
}
```

### 8.4 Configuration Access Service

```typescript
// file: app/modules/people/services/config.server.ts

import { prisma } from "~/db.server";
import { PEOPLE_SETTINGS } from "../config/settings-registry";
import { getPeopleEnv } from "../config/env.server";

/**
 * Retrieves a configuration value with fallback chain:
 * 1. Event-level setting
 * 2. Tenant-level setting
 * 3. Default value from registry
 */
export async function getConfig<T>(
  key: string,
  context: { tenantId: string; eventId?: string },
): Promise<T> {
  const definition = PEOPLE_SETTINGS.find((s) => s.key === key);
  if (!definition) {
    throw new Error(`Unknown setting key: ${key}`);
  }

  // Try event-level first if event context provided and setting supports it
  if (context.eventId && definition.scope === "event") {
    const eventSetting = await prisma.systemSetting.findFirst({
      where: {
        tenantId: context.tenantId,
        eventId: context.eventId,
        key,
      },
    });
    if (eventSetting) {
      return parseSettingValue(eventSetting.value, definition.type) as T;
    }
  }

  // Try tenant-level
  const tenantSetting = await prisma.systemSetting.findFirst({
    where: {
      tenantId: context.tenantId,
      eventId: null,
      key,
    },
  });
  if (tenantSetting) {
    return parseSettingValue(tenantSetting.value, definition.type) as T;
  }

  // Return default
  return definition.defaultValue as T;
}

/**
 * Checks if a feature flag is enabled.
 */
export async function isFeatureEnabled(
  flagKey: string,
  context: { tenantId: string; eventId?: string; userId?: string },
): Promise<boolean> {
  const flag = await prisma.featureFlag.findFirst({
    where: {
      key: flagKey,
      OR: [
        { tenantId: context.tenantId },
        { tenantId: null }, // Global flags
      ],
    },
  });

  if (!flag) return false;
  if (!flag.enabled) return false;

  // Check rollout percentage
  if (flag.rolloutPercentage < 100 && context.userId) {
    const hash = hashString(`${flagKey}:${context.userId}`);
    if (hash % 100 >= flag.rolloutPercentage) {
      return false;
    }
  }

  return true;
}

function parseSettingValue(value: string, type: string): unknown {
  switch (type) {
    case "number":
      return parseFloat(value);
    case "boolean":
      return value === "true";
    case "array":
      return JSON.parse(value);
    case "object":
      return JSON.parse(value);
    default:
      return value;
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

---

## 9. Testing Strategy

Module 13 encompasses complex scheduling algorithms, real-time state management, and multi-party workflows that require comprehensive testing at every level. This section defines the testing approach, test data factories, and specific test scenarios.

### 9.1 Unit Tests

Unit tests verify individual service methods, algorithm correctness, and validation logic in isolation. All unit tests use Vitest with mocked dependencies.

#### 9.1.1 Scheduling Algorithm Tests

```typescript
// file: app/modules/people/__tests__/unit/scheduling-algorithm.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShiftSchedulingAlgorithm } from "../../services/scheduling-algorithm.server";
import type { StaffMember, Zone, ShiftRequirement, SchedulingConstraint } from "../../types";

describe("ShiftSchedulingAlgorithm", () => {
  let algorithm: ShiftSchedulingAlgorithm;

  beforeEach(() => {
    algorithm = new ShiftSchedulingAlgorithm({
      balanceWeight: 0.7,
      preferenceWeight: 0.3,
      maxIterations: 1000,
    });
  });

  describe("generateSchedule", () => {
    it("should assign staff to cover all required zones", () => {
      const staff: StaffMember[] = [
        {
          id: "s1",
          firstName: "John",
          lastName: "Doe",
          role: "REGISTRATION_STAFF",
          skills: ["check-in"],
          availability: ["2025-02-11"],
        },
        {
          id: "s2",
          firstName: "Jane",
          lastName: "Smith",
          role: "REGISTRATION_STAFF",
          skills: ["check-in"],
          availability: ["2025-02-11"],
        },
        {
          id: "s3",
          firstName: "Bob",
          lastName: "Brown",
          role: "REGISTRATION_STAFF",
          skills: ["check-in"],
          availability: ["2025-02-11"],
        },
      ];

      const requirements: ShiftRequirement[] = [
        {
          zoneId: "z1",
          date: "2025-02-11",
          startTime: "08:00",
          endTime: "16:00",
          requiredCount: 2,
          role: "REGISTRATION_STAFF",
        },
      ];

      const result = algorithm.generateSchedule({ staff, requirements, constraints: [] });

      expect(result.feasible).toBe(true);
      expect(result.shifts.filter((s) => s.zoneId === "z1")).toHaveLength(2);
    });

    it("should respect maximum shift hours constraint", () => {
      const staff: StaffMember[] = [
        {
          id: "s1",
          firstName: "John",
          lastName: "Doe",
          role: "STAFF",
          skills: [],
          availability: ["2025-02-11"],
        },
      ];

      const requirements: ShiftRequirement[] = [
        {
          zoneId: "z1",
          date: "2025-02-11",
          startTime: "06:00",
          endTime: "18:00",
          requiredCount: 1,
          role: "STAFF",
        },
      ];

      const constraints: SchedulingConstraint[] = [{ type: "MAX_SHIFT_HOURS", value: 8 }];

      const result = algorithm.generateSchedule({ staff, requirements, constraints });

      // Should split into multiple shifts or mark as infeasible
      const staffShifts = result.shifts.filter((s) => s.staffMemberId === "s1");
      staffShifts.forEach((shift) => {
        const hours = calculateShiftHours(shift.startTime, shift.endTime);
        expect(hours).toBeLessThanOrEqual(8);
      });
    });

    it("should respect mandatory rest period between shifts", () => {
      const staff: StaffMember[] = [
        {
          id: "s1",
          firstName: "John",
          lastName: "Doe",
          role: "STAFF",
          skills: [],
          availability: ["2025-02-11", "2025-02-12"],
        },
      ];

      const requirements: ShiftRequirement[] = [
        {
          zoneId: "z1",
          date: "2025-02-11",
          startTime: "14:00",
          endTime: "22:00",
          requiredCount: 1,
          role: "STAFF",
        },
        {
          zoneId: "z2",
          date: "2025-02-12",
          startTime: "06:00",
          endTime: "14:00",
          requiredCount: 1,
          role: "STAFF",
        },
      ];

      const constraints: SchedulingConstraint[] = [{ type: "MIN_REST_HOURS", value: 10 }];

      const result = algorithm.generateSchedule({ staff, requirements, constraints });

      // Should not assign same staff to both shifts (only 8 hours between them)
      const day1Shift = result.shifts.find(
        (s) => s.date === "2025-02-11" && s.staffMemberId === "s1",
      );
      const day2Shift = result.shifts.find(
        (s) => s.date === "2025-02-12" && s.staffMemberId === "s1",
      );

      expect(day1Shift && day2Shift).toBeFalsy(); // Cannot have both
    });

    it("should balance workload across available staff", () => {
      const staff: StaffMember[] = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        firstName: `Staff${i}`,
        lastName: "Member",
        role: "VOLUNTEER",
        skills: [],
        availability: ["2025-02-11", "2025-02-12", "2025-02-13"],
      }));

      const requirements: ShiftRequirement[] = [
        {
          zoneId: "z1",
          date: "2025-02-11",
          startTime: "08:00",
          endTime: "16:00",
          requiredCount: 5,
          role: "VOLUNTEER",
        },
        {
          zoneId: "z1",
          date: "2025-02-12",
          startTime: "08:00",
          endTime: "16:00",
          requiredCount: 5,
          role: "VOLUNTEER",
        },
        {
          zoneId: "z1",
          date: "2025-02-13",
          startTime: "08:00",
          endTime: "16:00",
          requiredCount: 5,
          role: "VOLUNTEER",
        },
      ];

      const result = algorithm.generateSchedule({ staff, requirements, constraints: [] });

      // Count shifts per staff member
      const shiftCounts = new Map<string, number>();
      result.shifts.forEach((shift) => {
        shiftCounts.set(shift.staffMemberId, (shiftCounts.get(shift.staffMemberId) ?? 0) + 1);
      });

      // With 15 shifts and 10 staff, should be roughly 1-2 shifts each
      const counts = Array.from(shiftCounts.values());
      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);
      expect(maxCount - minCount).toBeLessThanOrEqual(2); // Balanced within 2 shifts
    });

    it("should respect staff skill requirements", () => {
      const staff: StaffMember[] = [
        {
          id: "s1",
          firstName: "John",
          lastName: "Doe",
          role: "STAFF",
          skills: ["first-aid", "check-in"],
          availability: ["2025-02-11"],
        },
        {
          id: "s2",
          firstName: "Jane",
          lastName: "Smith",
          role: "STAFF",
          skills: ["check-in"],
          availability: ["2025-02-11"],
        },
      ];

      const requirements: ShiftRequirement[] = [
        {
          zoneId: "z1",
          date: "2025-02-11",
          startTime: "08:00",
          endTime: "16:00",
          requiredCount: 1,
          role: "STAFF",
          requiredSkills: ["first-aid"],
        },
      ];

      const result = algorithm.generateSchedule({ staff, requirements, constraints: [] });

      expect(result.feasible).toBe(true);
      expect(result.shifts[0].staffMemberId).toBe("s1"); // Only s1 has first-aid
    });

    it("should return infeasible when staff is insufficient", () => {
      const staff: StaffMember[] = [
        {
          id: "s1",
          firstName: "John",
          lastName: "Doe",
          role: "STAFF",
          skills: [],
          availability: ["2025-02-11"],
        },
      ];

      const requirements: ShiftRequirement[] = [
        {
          zoneId: "z1",
          date: "2025-02-11",
          startTime: "08:00",
          endTime: "16:00",
          requiredCount: 5,
          role: "STAFF",
        },
      ];

      const result = algorithm.generateSchedule({ staff, requirements, constraints: [] });

      expect(result.feasible).toBe(false);
      expect(result.shortfalls).toContainEqual(
        expect.objectContaining({ zoneId: "z1", shortfall: 4 }),
      );
    });
  });
});

function calculateShiftHours(start: string, end: string): number {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return (endH * 60 + endM - startH * 60 - startM) / 60;
}
```

#### 9.1.2 Interpreter Rotation Algorithm Tests

```typescript
// file: app/modules/people/__tests__/unit/interpreter-rotation.test.ts

import { describe, it, expect } from "vitest";
import { InterpreterRotationAlgorithm } from "../../services/interpreter-rotation.server";

describe("InterpreterRotationAlgorithm", () => {
  const algorithm = new InterpreterRotationAlgorithm({
    rotationIntervalMinutes: 30,
    maxConsecutiveBlocks: 4,
    minRestMinutes: 15,
  });

  describe("generateRotationSchedule", () => {
    it("should rotate interpreters every 30 minutes", () => {
      const interpreters = [
        { id: "i1", name: "Interpreter A", languagePair: "EN-FR" },
        { id: "i2", name: "Interpreter B", languagePair: "EN-FR" },
      ];

      const schedule = algorithm.generateRotationSchedule({
        interpreters,
        serviceStart: "09:00",
        serviceEnd: "12:00",
        boothId: "booth-1",
      });

      // 3 hours = 6 x 30-minute blocks
      expect(schedule.rotations).toHaveLength(6);

      // Should alternate between interpreters
      expect(schedule.rotations[0].interpreterId).toBe("i1");
      expect(schedule.rotations[1].interpreterId).toBe("i2");
      expect(schedule.rotations[2].interpreterId).toBe("i1");
    });

    it("should enforce maximum consecutive blocks", () => {
      const interpreters = [
        { id: "i1", name: "Interpreter A", languagePair: "EN-FR" },
        { id: "i2", name: "Interpreter B", languagePair: "EN-FR" },
      ];

      const schedule = algorithm.generateRotationSchedule({
        interpreters,
        serviceStart: "09:00",
        serviceEnd: "15:00", // 6 hours = 12 blocks
        boothId: "booth-1",
      });

      // Count consecutive blocks for each interpreter
      let maxConsecutive = 0;
      let currentConsecutive = 0;
      let lastInterpreter = "";

      schedule.rotations.forEach((rotation) => {
        if (rotation.interpreterId === lastInterpreter) {
          currentConsecutive++;
        } else {
          currentConsecutive = 1;
          lastInterpreter = rotation.interpreterId;
        }
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      });

      expect(maxConsecutive).toBeLessThanOrEqual(4);
    });

    it("should schedule mandatory breaks after consecutive blocks", () => {
      const interpreters = [
        { id: "i1", name: "Interpreter A", languagePair: "EN-FR" },
        { id: "i2", name: "Interpreter B", languagePair: "EN-FR" },
      ];

      const schedule = algorithm.generateRotationSchedule({
        interpreters,
        serviceStart: "09:00",
        serviceEnd: "17:00", // 8 hours
        boothId: "booth-1",
      });

      // Should include break periods
      expect(schedule.breaks.length).toBeGreaterThan(0);

      // Each interpreter should get adequate rest
      const i1Breaks = schedule.breaks.filter((b) => b.interpreterId === "i1");
      const i2Breaks = schedule.breaks.filter((b) => b.interpreterId === "i2");

      expect(i1Breaks.length).toBeGreaterThan(0);
      expect(i2Breaks.length).toBeGreaterThan(0);
    });
  });

  describe("calculateFatigueLevel", () => {
    it("should increase fatigue with consecutive interpretation", () => {
      const lowFatigue = algorithm.calculateFatigueLevel({
        consecutiveMinutes: 30,
        totalMinutesToday: 60,
        breakMinutesToday: 30,
      });

      const highFatigue = algorithm.calculateFatigueLevel({
        consecutiveMinutes: 120,
        totalMinutesToday: 300,
        breakMinutesToday: 30,
      });

      expect(highFatigue).toBeGreaterThan(lowFatigue);
    });

    it("should decrease fatigue after breaks", () => {
      const beforeBreak = algorithm.calculateFatigueLevel({
        consecutiveMinutes: 120,
        totalMinutesToday: 240,
        breakMinutesToday: 0,
      });

      const afterBreak = algorithm.calculateFatigueLevel({
        consecutiveMinutes: 0,
        totalMinutesToday: 240,
        breakMinutesToday: 60,
      });

      expect(afterBreak).toBeLessThan(beforeBreak);
    });

    it("should return warning level at threshold", () => {
      const fatigue = algorithm.calculateFatigueLevel({
        consecutiveMinutes: 90,
        totalMinutesToday: 240, // 4 hours, warning threshold
        breakMinutesToday: 30,
      });

      expect(fatigue.level).toBe("WARNING");
    });
  });
});
```

#### 9.1.3 Embargo System Tests

```typescript
// file: app/modules/people/__tests__/unit/embargo-system.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmbargoService } from "../../services/embargo.server";

describe("EmbargoService", () => {
  let service: EmbargoService;

  beforeEach(() => {
    service = new EmbargoService({
      enforcementMode: "STRICT",
      gracePeriodMinutes: 5,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isUnderEmbargo", () => {
    it("should return true when current time is before embargo lift", () => {
      vi.setSystemTime(new Date("2025-02-11T10:00:00Z"));

      const result = service.isUnderEmbargo({
        embargoUntil: new Date("2025-02-11T14:00:00Z"),
      });

      expect(result).toBe(true);
    });

    it("should return false when embargo has lifted", () => {
      vi.setSystemTime(new Date("2025-02-11T15:00:00Z"));

      const result = service.isUnderEmbargo({
        embargoUntil: new Date("2025-02-11T14:00:00Z"),
      });

      expect(result).toBe(false);
    });

    it("should return false during grace period in WARNING_ONLY mode", () => {
      service = new EmbargoService({
        enforcementMode: "WARNING_ONLY",
        gracePeriodMinutes: 5,
      });

      vi.setSystemTime(new Date("2025-02-11T14:03:00Z")); // 3 minutes after lift

      const result = service.isUnderEmbargo({
        embargoUntil: new Date("2025-02-11T14:00:00Z"),
      });

      expect(result).toBe(false);
    });

    it("should return false when no embargo is set", () => {
      const result = service.isUnderEmbargo({
        embargoUntil: null,
      });

      expect(result).toBe(false);
    });
  });

  describe("validateAccess", () => {
    it("should deny access to embargoed content in STRICT mode", () => {
      vi.setSystemTime(new Date("2025-02-11T10:00:00Z"));

      const result = service.validateAccess({
        advisoryId: "adv-1",
        embargoUntil: new Date("2025-02-11T14:00:00Z"),
        userId: "user-1",
        userRole: "JOURNALIST",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("embargo");
    });

    it("should allow access to embargoed content for MEDIA_OFFICER", () => {
      vi.setSystemTime(new Date("2025-02-11T10:00:00Z"));

      const result = service.validateAccess({
        advisoryId: "adv-1",
        embargoUntil: new Date("2025-02-11T14:00:00Z"),
        userId: "user-1",
        userRole: "MEDIA_OFFICER",
      });

      expect(result.allowed).toBe(true);
      expect(result.note).toContain("staff override");
    });

    it("should warn but allow in WARNING_ONLY mode", () => {
      service = new EmbargoService({
        enforcementMode: "WARNING_ONLY",
        gracePeriodMinutes: 5,
      });

      vi.setSystemTime(new Date("2025-02-11T10:00:00Z"));

      const result = service.validateAccess({
        advisoryId: "adv-1",
        embargoUntil: new Date("2025-02-11T14:00:00Z"),
        userId: "user-1",
        userRole: "JOURNALIST",
      });

      expect(result.allowed).toBe(true);
      expect(result.warning).toBeDefined();
    });
  });

  describe("scheduleAutoLift", () => {
    it("should emit lift event at scheduled time", async () => {
      const liftCallback = vi.fn();
      service.onEmbargoLift(liftCallback);

      vi.setSystemTime(new Date("2025-02-11T13:59:00Z"));

      service.scheduleAutoLift({
        advisoryId: "adv-1",
        embargoUntil: new Date("2025-02-11T14:00:00Z"),
      });

      // Advance time past embargo
      vi.advanceTimersByTime(61000); // 61 seconds

      expect(liftCallback).toHaveBeenCalledWith({
        advisoryId: "adv-1",
        liftedAt: expect.any(Date),
        automatic: true,
      });
    });
  });
});
```

#### 9.1.4 Cost Calculation Tests

```typescript
// file: app/modules/people/__tests__/unit/interpretation-cost.test.ts

import { describe, it, expect } from "vitest";
import { InterpretationCostCalculator } from "../../services/cost-calculator.server";

describe("InterpretationCostCalculator", () => {
  const calculator = new InterpretationCostCalculator({
    baseHourlyRate: 100,
    overtimeMultiplier: 1.5,
    premiumLanguageMultiplier: 1.25,
    equipmentDailyRate: 50,
    receiverUnitRate: 5,
  });

  describe("calculateServiceCost", () => {
    it("should calculate basic service cost", () => {
      const cost = calculator.calculateServiceCost({
        interpreterCount: 2,
        durationHours: 4,
        languagePairs: ["EN-FR"],
        isOvertime: false,
        includesEquipment: false,
        receiverCount: 0,
      });

      // 2 interpreters * 4 hours * $100/hour = $800
      expect(cost.interpreterCost).toBe(800);
      expect(cost.totalCost).toBe(800);
    });

    it("should apply overtime multiplier", () => {
      const cost = calculator.calculateServiceCost({
        interpreterCount: 2,
        durationHours: 4,
        languagePairs: ["EN-FR"],
        isOvertime: true,
        includesEquipment: false,
        receiverCount: 0,
      });

      // 2 * 4 * $100 * 1.5 = $1200
      expect(cost.interpreterCost).toBe(1200);
    });

    it("should apply premium language multiplier", () => {
      const cost = calculator.calculateServiceCost({
        interpreterCount: 2,
        durationHours: 4,
        languagePairs: ["EN-ZH"], // Chinese is premium
        isOvertime: false,
        includesEquipment: false,
        receiverCount: 0,
      });

      // 2 * 4 * $100 * 1.25 = $1000
      expect(cost.interpreterCost).toBe(1000);
    });

    it("should include equipment costs", () => {
      const cost = calculator.calculateServiceCost({
        interpreterCount: 2,
        durationHours: 4,
        languagePairs: ["EN-FR"],
        isOvertime: false,
        includesEquipment: true,
        receiverCount: 100,
        days: 3,
      });

      // Interpreter: 2 * 4 * $100 = $800
      // Equipment: $50/day * 3 days = $150
      // Receivers: 100 * $5 = $500
      expect(cost.interpreterCost).toBe(800);
      expect(cost.equipmentCost).toBe(150);
      expect(cost.receiverCost).toBe(500);
      expect(cost.totalCost).toBe(1450);
    });

    it("should calculate cost breakdown by language pair", () => {
      const cost = calculator.calculateServiceCost({
        interpreterCount: 4, // 2 per pair
        durationHours: 4,
        languagePairs: ["EN-FR", "EN-AR"],
        isOvertime: false,
        includesEquipment: false,
        receiverCount: 0,
      });

      expect(cost.breakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ languagePair: "EN-FR" }),
          expect.objectContaining({ languagePair: "EN-AR" }),
        ]),
      );
    });
  });

  describe("calculateEventTotalCost", () => {
    it("should aggregate costs across all services", () => {
      const services = [
        {
          interpreterCount: 2,
          durationHours: 8,
          languagePairs: ["EN-FR"],
          isOvertime: false,
          includesEquipment: true,
          receiverCount: 200,
          days: 1,
        },
        {
          interpreterCount: 4,
          durationHours: 6,
          languagePairs: ["EN-FR", "EN-AR"],
          isOvertime: false,
          includesEquipment: true,
          receiverCount: 300,
          days: 1,
        },
      ];

      const total = calculator.calculateEventTotalCost(services);

      expect(total.services).toHaveLength(2);
      expect(total.grandTotal).toBeGreaterThan(0);
      expect(total.summary.totalInterpreterHours).toBe(2 * 8 + 4 * 6); // 40 hours
    });
  });
});
```

### 9.2 Integration Tests

Integration tests verify service interactions, database operations, and cross-module communication.

#### 9.2.1 Shift CRUD Integration Tests

```typescript
// file: app/modules/people/__tests__/integration/shift-crud.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "~/db.server";
import {
  createShift,
  updateShift,
  deleteShift,
  getShiftsForDate,
} from "../../services/shift.server";
import {
  createTestTenant,
  createTestEvent,
  createTestStaff,
  createTestZone,
  cleanupTestData,
} from "~/test/factories";

describe("Shift CRUD Operations", () => {
  let tenantId: string;
  let eventId: string;
  let staffId: string;
  let zoneId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant();
    tenantId = tenant.id;
    const event = await createTestEvent({ tenantId });
    eventId = event.id;
    const staff = await createTestStaff({ tenantId, eventId });
    staffId = staff.id;
    const zone = await createTestZone({ tenantId, eventId });
    zoneId = zone.id;
  });

  afterAll(async () => {
    await cleanupTestData([tenantId]);
  });

  beforeEach(async () => {
    await prisma.staffShift.deleteMany({ where: { eventId } });
  });

  describe("createShift", () => {
    it("should create a shift with valid data", async () => {
      const shift = await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      expect(shift.id).toBeDefined();
      expect(shift.staffMemberId).toBe(staffId);
      expect(shift.zoneId).toBe(zoneId);
      expect(shift.status).toBe("SCHEDULED");
    });

    it("should reject overlapping shifts for same staff", async () => {
      await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      await expect(
        createShift({
          tenantId,
          eventId,
          staffMemberId: staffId,
          zoneId,
          date: "2025-02-11",
          startTime: "14:00", // Overlaps with existing
          endTime: "22:00",
        }),
      ).rejects.toThrow("overlapping shift");
    });

    it("should reject shifts exceeding maximum hours", async () => {
      await expect(
        createShift({
          tenantId,
          eventId,
          staffMemberId: staffId,
          zoneId,
          date: "2025-02-11",
          startTime: "06:00",
          endTime: "20:00", // 14 hours
        }),
      ).rejects.toThrow("exceeds maximum");
    });
  });

  describe("updateShift", () => {
    it("should update shift times", async () => {
      const shift = await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      const updated = await updateShift(shift.id, {
        startTime: "09:00",
        endTime: "17:00",
      });

      expect(updated.startTime).toBe("09:00");
      expect(updated.endTime).toBe("17:00");
    });

    it("should not update checked-in shift start time", async () => {
      const shift = await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      // Simulate check-in
      await prisma.staffShift.update({
        where: { id: shift.id },
        data: { checkInTime: new Date(), status: "ACTIVE" },
      });

      await expect(updateShift(shift.id, { startTime: "09:00" })).rejects.toThrow(
        "Cannot modify start time of active shift",
      );
    });
  });

  describe("deleteShift", () => {
    it("should delete scheduled shift", async () => {
      const shift = await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      await deleteShift(shift.id);

      const deleted = await prisma.staffShift.findUnique({ where: { id: shift.id } });
      expect(deleted).toBeNull();
    });

    it("should not delete active shift", async () => {
      const shift = await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      await prisma.staffShift.update({
        where: { id: shift.id },
        data: { checkInTime: new Date(), status: "ACTIVE" },
      });

      await expect(deleteShift(shift.id)).rejects.toThrow("Cannot delete active shift");
    });
  });

  describe("getShiftsForDate", () => {
    it("should return all shifts for a date", async () => {
      await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      const staff2 = await createTestStaff({ tenantId, eventId });
      await createShift({
        tenantId,
        eventId,
        staffMemberId: staff2.id,
        zoneId,
        date: "2025-02-11",
        startTime: "16:00",
        endTime: "00:00",
      });

      const shifts = await getShiftsForDate({ eventId, date: "2025-02-11" });

      expect(shifts).toHaveLength(2);
    });

    it("should filter by zone", async () => {
      const zone2 = await createTestZone({ tenantId, eventId });

      await createShift({
        tenantId,
        eventId,
        staffMemberId: staffId,
        zoneId,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      const staff2 = await createTestStaff({ tenantId, eventId });
      await createShift({
        tenantId,
        eventId,
        staffMemberId: staff2.id,
        zoneId: zone2.id,
        date: "2025-02-11",
        startTime: "08:00",
        endTime: "16:00",
      });

      const shifts = await getShiftsForDate({ eventId, date: "2025-02-11", zoneId });

      expect(shifts).toHaveLength(1);
      expect(shifts[0].zoneId).toBe(zoneId);
    });
  });
});
```

#### 9.2.2 Interpreter Assignment Pipeline Tests

```typescript
// file: app/modules/people/__tests__/integration/interpreter-assignment.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "~/db.server";
import {
  createInterpretationService,
  assignInterpreter,
  rotateInterpreter,
  getBoothStatus,
} from "../../services/interpretation.server";
import {
  createTestTenant,
  createTestEvent,
  createTestInterpreter,
  cleanupTestData,
} from "~/test/factories";

describe("Interpreter Assignment Pipeline", () => {
  let tenantId: string;
  let eventId: string;
  let interpreter1Id: string;
  let interpreter2Id: string;

  beforeAll(async () => {
    const tenant = await createTestTenant();
    tenantId = tenant.id;
    const event = await createTestEvent({ tenantId });
    eventId = event.id;

    // Create interpreters with specific language pairs
    const i1 = await createTestInterpreter({
      tenantId,
      eventId,
      languages: ["EN", "FR"],
      certifications: [{ body: "AIIC", language: "EN-FR", validUntil: "2026-12-31" }],
    });
    interpreter1Id = i1.id;

    const i2 = await createTestInterpreter({
      tenantId,
      eventId,
      languages: ["EN", "FR"],
      certifications: [{ body: "AIIC", language: "EN-FR", validUntil: "2026-12-31" }],
    });
    interpreter2Id = i2.id;
  });

  afterAll(async () => {
    await cleanupTestData([tenantId]);
  });

  beforeEach(async () => {
    await prisma.interpreterAssignment.deleteMany({ where: { service: { eventId } } });
    await prisma.interpretationService.deleteMany({ where: { eventId } });
  });

  describe("Full Assignment Flow", () => {
    it("should create service and assign interpreters", async () => {
      // Step 1: Create interpretation service
      const service = await createInterpretationService({
        tenantId,
        eventId,
        name: "Plenary Session - Day 1",
        serviceType: "PLENARY",
        date: new Date("2025-02-11"),
        startTime: "09:00",
        endTime: "13:00",
        sourceLanguages: ["EN"],
        targetLanguages: ["FR"],
        isSimultaneous: true,
      });

      expect(service.id).toBeDefined();
      expect(service.status).toBe("PENDING_ASSIGNMENT");

      // Step 2: Assign first interpreter
      const assignment1 = await assignInterpreter({
        serviceId: service.id,
        interpreterId: interpreter1Id,
        languagePair: "EN-FR",
        startTime: new Date("2025-02-11T09:00:00"),
        endTime: new Date("2025-02-11T13:00:00"),
      });

      expect(assignment1.status).toBe("ASSIGNED");

      // Step 3: Assign second interpreter for rotation
      const assignment2 = await assignInterpreter({
        serviceId: service.id,
        interpreterId: interpreter2Id,
        languagePair: "EN-FR",
        startTime: new Date("2025-02-11T09:00:00"),
        endTime: new Date("2025-02-11T13:00:00"),
      });

      expect(assignment2.status).toBe("ASSIGNED");

      // Verify service status updated
      const updatedService = await prisma.interpretationService.findUnique({
        where: { id: service.id },
        include: { assignments: true },
      });

      expect(updatedService?.status).toBe("ASSIGNED");
      expect(updatedService?.assignments).toHaveLength(2);
    });

    it("should enforce minimum interpreters per booth", async () => {
      const service = await createInterpretationService({
        tenantId,
        eventId,
        name: "Long Session",
        serviceType: "PLENARY",
        date: new Date("2025-02-11"),
        startTime: "09:00",
        endTime: "17:00", // 8 hours requires rotation
        sourceLanguages: ["EN"],
        targetLanguages: ["FR"],
        isSimultaneous: true,
      });

      // Assign only one interpreter
      await assignInterpreter({
        serviceId: service.id,
        interpreterId: interpreter1Id,
        languagePair: "EN-FR",
        startTime: new Date("2025-02-11T09:00:00"),
        endTime: new Date("2025-02-11T17:00:00"),
      });

      // Service should remain in warning state
      const status = await getBoothStatus(service.id);

      expect(status.warnings).toContainEqual(
        expect.objectContaining({ type: "INSUFFICIENT_INTERPRETERS" }),
      );
    });
  });

  describe("Rotation Operations", () => {
    it("should execute interpreter rotation", async () => {
      const service = await createInterpretationService({
        tenantId,
        eventId,
        name: "Rotation Test",
        serviceType: "PLENARY",
        date: new Date("2025-02-11"),
        startTime: "09:00",
        endTime: "13:00",
        sourceLanguages: ["EN"],
        targetLanguages: ["FR"],
        isSimultaneous: true,
      });

      await assignInterpreter({
        serviceId: service.id,
        interpreterId: interpreter1Id,
        languagePair: "EN-FR",
        startTime: new Date("2025-02-11T09:00:00"),
        endTime: new Date("2025-02-11T13:00:00"),
        isActive: true,
      });

      await assignInterpreter({
        serviceId: service.id,
        interpreterId: interpreter2Id,
        languagePair: "EN-FR",
        startTime: new Date("2025-02-11T09:00:00"),
        endTime: new Date("2025-02-11T13:00:00"),
        isActive: false,
      });

      // Execute rotation
      const rotation = await rotateInterpreter({
        serviceId: service.id,
        languagePair: "EN-FR",
        outgoingInterpreterId: interpreter1Id,
        incomingInterpreterId: interpreter2Id,
        reason: "SCHEDULED",
      });

      expect(rotation.success).toBe(true);

      // Verify status updated
      const assignments = await prisma.interpreterAssignment.findMany({
        where: { serviceId: service.id },
      });

      const i1Assignment = assignments.find((a) => a.interpreterId === interpreter1Id);
      const i2Assignment = assignments.find((a) => a.interpreterId === interpreter2Id);

      expect(i1Assignment?.isActive).toBe(false);
      expect(i2Assignment?.isActive).toBe(true);
    });
  });
});
```

### 9.3 End-to-End Tests

E2E tests use Playwright to verify complete user workflows through the browser.

#### 9.3.1 Shift Drag-and-Drop Test

```typescript
// file: app/modules/people/__tests__/e2e/shift-drag-drop.spec.ts

import { test, expect } from "@playwright/test";
import { loginAsStaffManager, createTestDataForE2E, cleanupE2EData } from "~/test/e2e/helpers";

test.describe("Shift Scheduling Drag-and-Drop", () => {
  let eventId: string;

  test.beforeAll(async () => {
    const data = await createTestDataForE2E({
      staffCount: 5,
      zoneCount: 3,
      days: 3,
    });
    eventId = data.eventId;
  });

  test.afterAll(async () => {
    await cleanupE2EData(eventId);
  });

  test("should drag staff to create new shift", async ({ page }) => {
    await loginAsStaffManager(page);
    await page.goto(`/events/${eventId}/staff/schedule`);

    // Wait for schedule to load
    await expect(page.locator('[data-testid="schedule-grid"]')).toBeVisible();

    // Find unassigned staff in sidebar
    const staffCard = page.locator('[data-testid="staff-card"]').first();
    await expect(staffCard).toBeVisible();

    // Find target time slot
    const timeSlot = page.locator(
      '[data-testid="time-slot"][data-time="08:00"][data-zone="zone-1"]',
    );

    // Drag staff to time slot
    await staffCard.dragTo(timeSlot);

    // Verify shift created modal appears
    await expect(page.locator('[data-testid="shift-confirm-modal"]')).toBeVisible();

    // Confirm shift creation
    await page.click('[data-testid="confirm-shift-button"]');

    // Verify shift appears on grid
    await expect(page.locator('[data-testid="shift-block"]').first()).toBeVisible();
  });

  test("should drag existing shift to different time", async ({ page }) => {
    await loginAsStaffManager(page);
    await page.goto(`/events/${eventId}/staff/schedule`);

    // Wait for existing shift to load
    const shiftBlock = page.locator('[data-testid="shift-block"]').first();
    await expect(shiftBlock).toBeVisible();

    // Get original position
    const originalSlot = await shiftBlock.getAttribute("data-slot");

    // Find target slot (2 hours later)
    const targetSlot = page.locator('[data-testid="time-slot"][data-time="10:00"]').first();

    // Drag shift to new time
    await shiftBlock.dragTo(targetSlot);

    // Verify confirmation dialog
    await expect(page.locator('[data-testid="shift-move-confirm"]')).toBeVisible();
    await page.click('[data-testid="confirm-move-button"]');

    // Verify shift moved
    const movedShift = page.locator('[data-testid="shift-block"]').first();
    const newSlot = await movedShift.getAttribute("data-slot");
    expect(newSlot).not.toBe(originalSlot);
  });

  test("should show error for invalid drop target", async ({ page }) => {
    await loginAsStaffManager(page);
    await page.goto(`/events/${eventId}/staff/schedule`);

    const shiftBlock = page.locator('[data-testid="shift-block"]').first();
    await expect(shiftBlock).toBeVisible();

    // Try to drag to occupied slot
    const occupiedSlot = page.locator('[data-testid="time-slot"][data-occupied="true"]').first();

    if ((await occupiedSlot.count()) > 0) {
      await shiftBlock.dragTo(occupiedSlot);

      // Should show error toast
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-error"]')).toContainText("overlap");
    }
  });
});
```

#### 9.3.2 Staff Check-in Kiosk Test

```typescript
// file: app/modules/people/__tests__/e2e/checkin-kiosk.spec.ts

import { test, expect } from "@playwright/test";
import { createTestDataForE2E, cleanupE2EData } from "~/test/e2e/helpers";

test.describe("Staff Check-in Kiosk", () => {
  let eventId: string;
  let staffBadgeNumber: string;

  test.beforeAll(async () => {
    const data = await createTestDataForE2E({
      staffCount: 3,
      withShifts: true,
    });
    eventId = data.eventId;
    staffBadgeNumber = data.staff[0].badgeNumber;
  });

  test.afterAll(async () => {
    await cleanupE2EData(eventId);
  });

  test("should check in staff with badge scan", async ({ page }) => {
    // Navigate to kiosk mode
    await page.goto(`/kiosk/${eventId}/checkin`);

    // Verify kiosk mode UI
    await expect(page.locator('[data-testid="kiosk-header"]')).toContainText("Staff Check-in");

    // Simulate badge scan (keyboard input)
    const scanInput = page.locator('[data-testid="badge-scan-input"]');
    await scanInput.fill(staffBadgeNumber);
    await scanInput.press("Enter");

    // Wait for staff lookup
    await expect(page.locator('[data-testid="staff-info-card"]')).toBeVisible({ timeout: 5000 });

    // Verify staff details shown
    await expect(page.locator('[data-testid="staff-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="shift-info"]')).toBeVisible();

    // Confirm check-in
    await page.click('[data-testid="confirm-checkin-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="checkin-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkin-success"]')).toContainText("Checked In");

    // Verify kiosk resets for next scan
    await expect(scanInput).toBeEmpty({ timeout: 3000 });
  });

  test("should show error for unrecognized badge", async ({ page }) => {
    await page.goto(`/kiosk/${eventId}/checkin`);

    const scanInput = page.locator('[data-testid="badge-scan-input"]');
    await scanInput.fill("INVALID-BADGE-123");
    await scanInput.press("Enter");

    // Should show error
    await expect(page.locator('[data-testid="scan-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="scan-error"]')).toContainText("not found");
  });

  test("should show error for staff without shift today", async ({ page }) => {
    await page.goto(`/kiosk/${eventId}/checkin`);

    // Use staff member without shift scheduled
    const staffWithoutShift = "NO-SHIFT-BADGE";

    const scanInput = page.locator('[data-testid="badge-scan-input"]');
    await scanInput.fill(staffWithoutShift);
    await scanInput.press("Enter");

    // Should show no shift warning
    await expect(page.locator('[data-testid="no-shift-warning"]')).toBeVisible();
  });

  test("should handle check-out flow", async ({ page }) => {
    // First check in
    await page.goto(`/kiosk/${eventId}/checkin`);
    const scanInput = page.locator('[data-testid="badge-scan-input"]');
    await scanInput.fill(staffBadgeNumber);
    await scanInput.press("Enter");
    await page.click('[data-testid="confirm-checkin-button"]');
    await expect(page.locator('[data-testid="checkin-success"]')).toBeVisible();

    // Now scan again for check-out
    await page.waitForTimeout(1000); // Wait for reset
    await scanInput.fill(staffBadgeNumber);
    await scanInput.press("Enter");

    // Should show check-out option (already checked in)
    await expect(page.locator('[data-testid="checkout-option"]')).toBeVisible();
    await page.click('[data-testid="confirm-checkout-button"]');

    // Verify check-out success
    await expect(page.locator('[data-testid="checkout-success"]')).toBeVisible();
  });
});
```

### 9.4 Test Data Factories

```typescript
// file: app/modules/people/__tests__/factories/index.ts

import { faker } from "@faker-js/faker";
import { prisma } from "~/db.server";

// ═══════════════════════════════════════════════════════════════════════════
// STAFF MEMBER FACTORY
// ═══════════════════════════════════════════════════════════════════════════

interface CreateStaffMemberOptions {
  tenantId: string;
  eventId: string;
  role?: string;
  status?: string;
  skills?: string[];
  department?: string;
}

export async function createStaffMember(options: CreateStaffMemberOptions) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return prisma.staffMember.create({
    data: {
      tenantId: options.tenantId,
      eventId: options.eventId,
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }),
      phone: faker.phone.number(),
      role:
        options.role ??
        faker.helpers.arrayElement([
          "REGISTRATION_STAFF",
          "VOLUNTEER",
          "LOGISTICS",
          "SECURITY",
          "TECHNICAL",
        ]),
      department:
        options.department ??
        faker.helpers.arrayElement([
          "OPERATIONS",
          "LOGISTICS",
          "REGISTRATION",
          "SECURITY",
          "MEDIA",
        ]),
      status: options.status ?? "ACTIVE",
      skills:
        options.skills ??
        faker.helpers.arrayElements(
          ["check-in", "first-aid", "crowd-control", "driving", "language-en", "language-fr"],
          { min: 1, max: 4 },
        ),
      badgeNumber: faker.string.alphanumeric(8).toUpperCase(),
      emergencyContactName: faker.person.fullName(),
      emergencyContactPhone: faker.phone.number(),
      hiredDate: faker.date.past({ years: 2 }),
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERPRETER FACTORY
// ═══════════════════════════════════════════════════════════════════════════

interface CreateInterpreterOptions {
  tenantId: string;
  eventId: string;
  languages: string[];
  certifications?: Array<{
    body: string;
    language: string;
    validUntil: string;
  }>;
}

export async function createInterpreter(options: CreateInterpreterOptions) {
  const staff = await createStaffMember({
    tenantId: options.tenantId,
    eventId: options.eventId,
    role: "INTERPRETER",
    department: "INTERPRETATION",
  });

  // Add language capabilities
  await prisma.staffMember.update({
    where: { id: staff.id },
    data: {
      languages: options.languages,
    },
  });

  // Add certifications
  if (options.certifications) {
    for (const cert of options.certifications) {
      await prisma.interpreterCertification.create({
        data: {
          interpreterId: staff.id,
          certificationBody: cert.body,
          languagePair: cert.language,
          certificateNumber: faker.string.alphanumeric(12).toUpperCase(),
          issuedDate: faker.date.past({ years: 3 }),
          validUntil: new Date(cert.validUntil),
          status: "VERIFIED",
        },
      });
    }
  }

  return staff;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHIFT FACTORY
// ═══════════════════════════════════════════════════════════════════════════

interface CreateShiftOptions {
  tenantId: string;
  eventId: string;
  staffMemberId: string;
  zoneId: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

export async function createShift(options: CreateShiftOptions) {
  const date = options.date ?? faker.date.soon({ days: 14 }).toISOString().split("T")[0];
  const startHour = faker.number.int({ min: 6, max: 14 });
  const duration = faker.number.int({ min: 4, max: 8 });

  return prisma.staffShift.create({
    data: {
      tenantId: options.tenantId,
      eventId: options.eventId,
      staffMemberId: options.staffMemberId,
      zoneId: options.zoneId,
      date,
      startTime: options.startTime ?? `${startHour.toString().padStart(2, "0")}:00`,
      endTime: options.endTime ?? `${(startHour + duration).toString().padStart(2, "0")}:00`,
      status: options.status ?? "SCHEDULED",
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESS CONFERENCE FACTORY
// ═══════════════════════════════════════════════════════════════════════════

interface CreatePressConferenceOptions {
  tenantId: string;
  eventId: string;
  roomId: string;
  speakerCount?: number;
  scheduledAt?: Date;
  status?: string;
}

export async function createPressConference(options: CreatePressConferenceOptions) {
  const conference = await prisma.pressConference.create({
    data: {
      tenantId: options.tenantId,
      eventId: options.eventId,
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      scheduledAt: options.scheduledAt ?? faker.date.soon({ days: 7 }),
      duration: faker.helpers.arrayElement([30, 45, 60]),
      roomId: options.roomId,
      location: faker.location.streetAddress(),
      status: options.status ?? "SCHEDULED",
      maxAttendees: faker.number.int({ min: 20, max: 100 }),
      registrationRequired: faker.datatype.boolean(),
      livestreamEnabled: faker.datatype.boolean(),
    },
  });

  // Add speakers
  const speakerCount = options.speakerCount ?? faker.number.int({ min: 1, max: 5 });
  for (let i = 0; i < speakerCount; i++) {
    await prisma.pressConferenceSpeaker.create({
      data: {
        pressConferenceId: conference.id,
        participantId: faker.string.uuid(), // Would link to real participant in production
        name: faker.person.fullName(),
        title: faker.person.jobTitle(),
        organization: faker.company.name(),
        speakingOrder: i + 1,
        topicFocus: faker.lorem.sentence(),
      },
    });
  }

  return conference;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA ADVISORY FACTORY
// ═══════════════════════════════════════════════════════════════════════════

interface CreateMediaAdvisoryOptions {
  tenantId: string;
  eventId: string;
  status?: string;
  hasEmbargo?: boolean;
  pressConferenceId?: string;
}

export async function createMediaAdvisory(options: CreateMediaAdvisoryOptions) {
  const hasEmbargo = options.hasEmbargo ?? faker.datatype.boolean();

  return prisma.mediaAdvisory.create({
    data: {
      tenantId: options.tenantId,
      eventId: options.eventId,
      advisoryNumber: `MA-${faker.string.numeric(4)}`,
      advisoryType: faker.helpers.arrayElement([
        "PRESS_CONFERENCE",
        "PHOTO_OPPORTUNITY",
        "MEDIA_AVAILABILITY",
        "SCHEDULE_CHANGE",
        "GENERAL",
      ]),
      headline: faker.company.catchPhrase(),
      subheadline: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(3),
      keyPoints: [faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence()],
      status: options.status ?? "DRAFT",
      embargoUntil: hasEmbargo ? faker.date.soon({ days: 3 }) : null,
      publishedAt: options.status === "PUBLISHED" ? new Date() : null,
      mediaContactName: faker.person.fullName(),
      mediaContactEmail: faker.internet.email(),
      mediaContactPhone: faker.phone.number(),
      distributionList: ["ACCREDITED_MEDIA"],
      pressConferenceId: options.pressConferenceId,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK FACTORIES
// ═══════════════════════════════════════════════════════════════════════════

export async function createBulkStaffWithShifts(options: {
  tenantId: string;
  eventId: string;
  staffCount: number;
  shiftsPerStaff: number;
  zoneIds: string[];
  dateRange: { start: string; end: string };
}) {
  const staff = await Promise.all(
    Array.from({ length: options.staffCount }, () =>
      createStaffMember({
        tenantId: options.tenantId,
        eventId: options.eventId,
      }),
    ),
  );

  const shifts = [];
  for (const member of staff) {
    for (let i = 0; i < options.shiftsPerStaff; i++) {
      const shift = await createShift({
        tenantId: options.tenantId,
        eventId: options.eventId,
        staffMemberId: member.id,
        zoneId: faker.helpers.arrayElement(options.zoneIds),
      });
      shifts.push(shift);
    }
  }

  return { staff, shifts };
}

export async function createInterpretationServiceWithAssignments(options: {
  tenantId: string;
  eventId: string;
  languagePairs: string[];
  interpretersPerPair: number;
}) {
  const service = await prisma.interpretationService.create({
    data: {
      tenantId: options.tenantId,
      eventId: options.eventId,
      name: faker.company.catchPhrase(),
      serviceType: faker.helpers.arrayElement(["PLENARY", "BILATERAL", "COMMITTEE"]),
      date: faker.date.soon({ days: 14 }),
      startTime: "09:00",
      endTime: "17:00",
      sourceLanguages: options.languagePairs.map((p) => p.split("-")[0]),
      targetLanguages: options.languagePairs.map((p) => p.split("-")[1]),
      isSimultaneous: true,
      status: "PENDING_ASSIGNMENT",
    },
  });

  const assignments = [];
  for (const pair of options.languagePairs) {
    const [source, target] = pair.split("-");
    for (let i = 0; i < options.interpretersPerPair; i++) {
      const interpreter = await createInterpreter({
        tenantId: options.tenantId,
        eventId: options.eventId,
        languages: [source, target],
        certifications: [{ body: "AIIC", language: pair, validUntil: "2026-12-31" }],
      });

      const assignment = await prisma.interpreterAssignment.create({
        data: {
          serviceId: service.id,
          interpreterId: interpreter.id,
          languagePair: pair,
          startTime: new Date(`2025-02-11T09:00:00`),
          endTime: new Date(`2025-02-11T17:00:00`),
          status: "ASSIGNED",
          isActive: i === 0,
        },
      });
      assignments.push(assignment);
    }
  }

  return { service, assignments };
}
```

### 9.5 Performance Test Scenarios

```typescript
// file: app/modules/people/__tests__/performance/scenarios.ts

import { check, sleep } from "k6";
import http from "k6/http";

/**
 * K6 performance test scenarios for Module 13.
 * Run with: k6 run --vus 50 --duration 5m scenarios.ts
 */

const BASE_URL = __ENV.API_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 1: Bulk Shift Generation
// ═══════════════════════════════════════════════════════════════════════════

export function bulkShiftGeneration() {
  const payload = JSON.stringify({
    eventId: __ENV.EVENT_ID,
    dateRange: { start: "2025-02-10", end: "2025-02-23" },
    staffCount: 500,
    zonesCount: 100,
    algorithm: "GREEDY_BALANCED",
  });

  const response = http.post(`${BASE_URL}/api/staff/auto-schedule`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    timeout: "60s",
  });

  check(response, {
    "auto-schedule completes within 30s": (r) => r.timings.duration < 30000,
    "status is 200": (r) => r.status === 200,
    "returns schedule": (r) => JSON.parse(r.body).schedule !== undefined,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 2: Concurrent Check-ins
// ═══════════════════════════════════════════════════════════════════════════

export function concurrentCheckins() {
  const badgeNumber = `STAFF-${__VU}-${__ITER}`;

  const response = http.post(
    `${BASE_URL}/api/staff/checkin`,
    JSON.stringify({
      badgeNumber,
      eventId: __ENV.EVENT_ID,
      method: "KIOSK",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    },
  );

  check(response, {
    "checkin responds within 500ms": (r) => r.timings.duration < 500,
    "status is 200 or 404": (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.1); // 100ms between requests per VU
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 3: SSE Coverage Gap Detection
// ═══════════════════════════════════════════════════════════════════════════

export function coverageGapSSE() {
  const url = `${BASE_URL}/api/staff/coverage/stream?eventId=${__ENV.EVENT_ID}`;

  const response = http.get(url, {
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    timeout: "10s",
  });

  check(response, {
    "SSE connection established": (r) => r.status === 200,
    "receives events within 2s": (r) => r.timings.duration < 2000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO 4: Embargo Lift Notification Burst
// ═══════════════════════════════════════════════════════════════════════════

export function embargoLiftBurst() {
  // Simulate many clients waiting for embargo lift
  const advisoryId = __ENV.ADVISORY_ID;

  const response = http.get(`${BASE_URL}/api/media/advisory/${advisoryId}`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  });

  check(response, {
    "advisory fetch within 200ms": (r) => r.timings.duration < 200,
    "status is 200": (r) => r.status === 200,
  });

  sleep(0.05); // 50ms between requests
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const options = {
  scenarios: {
    bulk_scheduling: {
      executor: "shared-iterations",
      vus: 5,
      iterations: 10,
      exec: "bulkShiftGeneration",
    },
    concurrent_checkins: {
      executor: "constant-vus",
      vus: 200,
      duration: "2m",
      exec: "concurrentCheckins",
    },
    coverage_sse: {
      executor: "constant-vus",
      vus: 50,
      duration: "1m",
      exec: "coverageGapSSE",
    },
    embargo_burst: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 500 },
        { duration: "1m", target: 500 },
        { duration: "30s", target: 0 },
      ],
      exec: "embargoLiftBurst",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};
```

---

## 10. Security Considerations

Module 13 handles sensitive workforce data including personal information, evaluations, and media operations. This section defines access controls, data protection measures, and audit requirements.

### 10.1 Access Control Matrix

Module 13 implements role-based access control (RBAC) integrated with Module 05's security framework. All permissions are scoped by tenant and event.

#### 10.1.1 Staff Management Permissions

| Action                  | Staff Manager | Shift Supervisor | Staff Member | Volunteer Coordinator | HR Admin | System Admin |
| ----------------------- | ------------- | ---------------- | ------------ | --------------------- | -------- | ------------ |
| **Staff Profiles**      |               |                  |              |                       |          |              |
| View all staff profiles | Yes           | Department only  | No           | Volunteers only       | Yes      | Yes          |
| View own profile        | Yes           | Yes              | Yes          | Yes                   | Yes      | Yes          |
| Create staff member     | Yes           | No               | No           | Volunteers only       | Yes      | Yes          |
| Update staff profile    | Yes           | No               | Self only    | Volunteers only       | Yes      | Yes          |
| Deactivate staff member | Yes           | No               | No           | Volunteers only       | Yes      | Yes          |
| Delete staff member     | No            | No               | No           | No                    | Yes      | Yes          |
| **Shifts**              |               |                  |              |                       |          |              |
| View all shifts         | Yes           | Yes              | Own only     | Volunteers only       | Yes      | Yes          |
| Create shifts           | Yes           | Yes              | No           | Volunteers only       | No       | Yes          |
| Update shifts           | Yes           | Yes              | No           | Volunteers only       | No       | Yes          |
| Delete shifts           | Yes           | No               | No           | No                    | No       | Yes          |
| Run auto-scheduler      | Yes           | No               | No           | No                    | No       | Yes          |
| **Check-in/Out**        |               |                  |              |                       |          |              |
| Perform check-in (any)  | Yes           | Yes              | No           | Yes                   | No       | Yes          |
| Self check-in           | Yes           | Yes              | Yes          | Yes                   | Yes      | Yes          |
| Override check-in rules | Yes           | No               | No           | No                    | No       | Yes          |
| View check-in history   | Yes           | Yes              | Own only     | Volunteers only       | Yes      | Yes          |
| **Evaluations**         |               |                  |              |                       |          |              |
| View all evaluations    | No            | No               | No           | No                    | Yes      | Yes          |
| View own evaluations    | Yes           | Yes              | Yes          | Yes                   | Yes      | Yes          |
| Create evaluations      | Yes           | Yes              | No           | Yes                   | Yes      | Yes          |
| Update evaluations      | No            | No               | No           | No                    | Yes      | Yes          |
| **Swap Requests**       |               |                  |              |                       |          |              |
| Submit swap request     | Yes           | Yes              | Yes          | Yes                   | No       | Yes          |
| Approve swap requests   | Yes           | Yes              | No           | Volunteers only       | No       | Yes          |

#### 10.1.2 Interpretation Services Permissions

| Action                    | Interpretation Manager | Booth Supervisor | Interpreter   | Protocol Officer | System Admin |
| ------------------------- | ---------------------- | ---------------- | ------------- | ---------------- | ------------ |
| **Services**              |                        |                  |               |                  |              |
| View all services         | Yes                    | Yes              | Assigned only | Yes              | Yes          |
| Create services           | Yes                    | No               | No            | Yes              | Yes          |
| Update services           | Yes                    | No               | No            | Yes              | Yes          |
| Cancel services           | Yes                    | No               | No            | No               | Yes          |
| **Assignments**           |                        |                  |               |                  |              |
| View all assignments      | Yes                    | Yes              | Own only      | Yes              | Yes          |
| Assign interpreters       | Yes                    | Yes              | No            | No               | Yes          |
| Remove assignments        | Yes                    | Yes              | No            | No               | Yes          |
| Execute rotations         | Yes                    | Yes              | No            | No               | Yes          |
| **Certifications**        |                        |                  |               |                  |              |
| View certifications       | Yes                    | Yes              | Own only      | No               | Yes          |
| Add/update certifications | Yes                    | No               | No            | No               | Yes          |
| Verify certifications     | Yes                    | No               | No            | No               | Yes          |
| **Booths**                |                        |                  |               |                  |              |
| Manage booths             | Yes                    | Yes              | No            | No               | Yes          |
| View booth status         | Yes                    | Yes              | Assigned only | Yes              | Yes          |
| **Receivers**             |                        |                  |               |                  |              |
| Track receivers           | Yes                    | Yes              | No            | No               | Yes          |
| Issue/return receivers    | Yes                    | Yes              | No            | No               | Yes          |

#### 10.1.3 Media Operations Permissions

| Action                  | Media Manager | Press Officer | Journalist       | Delegation Focal Point | System Admin |
| ----------------------- | ------------- | ------------- | ---------------- | ---------------------- | ------------ |
| **Press Conferences**   |               |               |                  |                        |              |
| View all conferences    | Yes           | Yes           | Public only      | Yes                    | Yes          |
| Create conferences      | Yes           | Yes           | No               | No                     | Yes          |
| Update conferences      | Yes           | Yes           | No               | No                     | Yes          |
| Cancel conferences      | Yes           | No            | No               | No                     | Yes          |
| Register for conference | Yes           | Yes           | Yes              | No                     | Yes          |
| **Interview Requests**  |               |               |                  |                        |              |
| View all requests       | Yes           | Yes           | Own only         | Delegation only        | Yes          |
| Submit requests         | No            | No            | Yes              | No                     | No           |
| Forward requests        | Yes           | Yes           | No               | No                     | Yes          |
| Respond to requests     | No            | No            | No               | Yes                    | Yes          |
| **Media Advisories**    |               |               |                  |                        |              |
| View all advisories     | Yes           | Yes           | Published only\* | Published only\*       | Yes          |
| Create advisories       | Yes           | Yes           | No               | No                     | Yes          |
| Update advisories       | Yes           | Yes           | No               | No                     | Yes          |
| Publish advisories      | Yes           | No            | No               | No                     | Yes          |
| Manage embargoes        | Yes           | Yes           | No               | No                     | Yes          |
| **Media Pools**         |               |               |                  |                        |              |
| Manage pools            | Yes           | Yes           | No               | No                     | Yes          |
| View pool assignments   | Yes           | Yes           | Own only         | No                     | Yes          |
| Assign to pools         | Yes           | Yes           | No               | No                     | Yes          |

\*Embargoed advisories are hidden until embargo lifts.

### 10.2 Data Sensitivity Classification

| Data Category                            | Classification | Encryption             | Access Logging | Retention       |
| ---------------------------------------- | -------------- | ---------------------- | -------------- | --------------- |
| Staff personal data (name, email, phone) | INTERNAL (PII) | AES-256 at rest        | Standard       | Event + 2 years |
| Staff evaluations                        | CONFIDENTIAL   | Enhanced encryption    | Full audit     | Event + 5 years |
| Staff disciplinary records               | RESTRICTED     | Field-level encryption | Full audit     | Event + 7 years |
| Shift schedules                          | INTERNAL       | Standard               | Standard       | Event + 1 year  |
| Check-in/out timestamps                  | INTERNAL       | Standard               | Standard       | Event + 1 year  |
| Training records                         | INTERNAL       | Standard               | Standard       | Event + 3 years |
| Volunteer applications                   | INTERNAL (PII) | Standard               | Standard       | Event + 1 year  |
| Background check results                 | RESTRICTED     | Field-level encryption | Full audit     | Event + 7 years |
| Interpreter certifications               | INTERNAL       | Standard               | Standard       | Valid + 1 year  |
| Interpreter fatigue data                 | CONFIDENTIAL   | Enhanced               | Enhanced audit | Event + 90 days |
| Press conference details                 | INTERNAL       | Standard               | Standard       | Event + 2 years |
| Interview request content                | CONFIDENTIAL   | Enhanced               | Enhanced audit | Event + 2 years |
| Media advisory (embargoed)               | CONFIDENTIAL   | Enhanced               | Full audit     | Event + 5 years |
| Media advisory (published)               | PUBLIC         | Standard               | Standard       | Indefinite      |
| Journalist credentials                   | INTERNAL (PII) | Standard               | Standard       | Event + 1 year  |
| Media pool assignments                   | INTERNAL       | Standard               | Standard       | Event + 1 year  |

### 10.3 Data Protection Measures

#### 10.3.1 Staff Evaluation Confidentiality

Staff evaluations contain sensitive performance data that requires special handling:

```typescript
// file: app/modules/people/security/evaluation-access.server.ts

import { prisma } from "~/db.server";
import { auditLog } from "~/core/audit/audit-log.server";

/**
 * Evaluation access control rules:
 * - Staff members can view their own evaluations
 * - Direct supervisors can view evaluations they created
 * - HR Admin can view all evaluations
 * - Evaluations are never exposed in bulk API responses
 */
export async function canAccessEvaluation(
  userId: string,
  evaluationId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const evaluation = await prisma.staffEvaluation.findUnique({
    where: { id: evaluationId },
    select: {
      staffMemberId: true,
      evaluatorId: true,
      tenantId: true,
    },
  });

  if (!evaluation) {
    return { allowed: false, reason: "Evaluation not found" };
  }

  // Check if user is the evaluated staff member
  const userStaff = await prisma.staffMember.findFirst({
    where: { userId, tenantId: evaluation.tenantId },
  });

  if (userStaff?.id === evaluation.staffMemberId) {
    await auditLog.record({
      action: "EVALUATION_VIEWED",
      entityType: "StaffEvaluation",
      entityId: evaluationId,
      actorId: userId,
      metadata: { accessReason: "SELF_VIEW" },
    });
    return { allowed: true };
  }

  // Check if user is the evaluator
  if (userStaff?.id === evaluation.evaluatorId) {
    await auditLog.record({
      action: "EVALUATION_VIEWED",
      entityType: "StaffEvaluation",
      entityId: evaluationId,
      actorId: userId,
      metadata: { accessReason: "EVALUATOR_VIEW" },
    });
    return { allowed: true };
  }

  // Check if user has HR Admin role
  const userRoles = await prisma.userRole.findMany({
    where: { userId, tenantId: evaluation.tenantId },
  });

  const hasHRAccess = userRoles.some((r) => r.role === "HR_ADMIN" || r.role === "SYSTEM_ADMIN");

  if (hasHRAccess) {
    await auditLog.record({
      action: "EVALUATION_VIEWED",
      entityType: "StaffEvaluation",
      entityId: evaluationId,
      actorId: userId,
      metadata: { accessReason: "HR_ADMIN_ACCESS" },
    });
    return { allowed: true };
  }

  return { allowed: false, reason: "Insufficient permissions" };
}
```

#### 10.3.2 Interview Request Visibility Scoping

Interview requests are visible only to relevant parties:

```typescript
// file: app/modules/people/security/interview-visibility.server.ts

import { prisma } from "~/db.server";

/**
 * Interview request visibility rules:
 * - Journalist sees their own requests
 * - Delegation focal point sees requests targeting their delegation
 * - Media officers see all requests
 * - Request details (topics) are redacted for unauthorized viewers
 */
export async function getVisibleInterviewRequests(
  userId: string,
  eventId: string,
  userRole: string,
): Promise<InterviewRequestView[]> {
  // Media officers see everything
  if (userRole === "MEDIA_OFFICER" || userRole === "MEDIA_MANAGER") {
    return prisma.interviewRequest.findMany({
      where: { eventId },
      include: {
        journalist: { select: { firstName: true, familyName: true, organization: true } },
        targetDelegation: { select: { name: true, countryCode: true } },
      },
    });
  }

  // Journalists see own requests
  if (userRole === "JOURNALIST") {
    const journalist = await prisma.participant.findFirst({
      where: { userId, eventId, participantType: "MEDIA" },
    });

    if (!journalist) return [];

    return prisma.interviewRequest.findMany({
      where: { eventId, journalistId: journalist.id },
      include: {
        targetDelegation: { select: { name: true, countryCode: true } },
      },
    });
  }

  // Focal points see requests targeting their delegation
  if (userRole === "FOCAL_POINT") {
    const focalPoint = await prisma.participant.findFirst({
      where: { userId, eventId, role: "FOCAL_POINT" },
      include: { delegation: true },
    });

    if (!focalPoint?.delegationId) return [];

    const requests = await prisma.interviewRequest.findMany({
      where: { eventId, targetDelegationId: focalPoint.delegationId },
      include: {
        journalist: { select: { firstName: true, familyName: true, organization: true } },
      },
    });

    // Redact detailed notes for focal points
    return requests.map((r) => ({
      ...r,
      internalNotes: null, // Redacted
    }));
  }

  return [];
}

interface InterviewRequestView {
  id: string;
  status: string;
  journalist?: { firstName: string; familyName: string; organization: string };
  targetDelegation?: { name: string; countryCode: string };
  requestedDate: Date | null;
  topic: string | null;
  internalNotes: string | null;
}
```

#### 10.3.3 Media Advisory Embargo Enforcement

```typescript
// file: app/modules/people/security/embargo-enforcement.server.ts

import { prisma } from "~/db.server";
import { auditLog } from "~/core/audit/audit-log.server";

/**
 * Embargo enforcement for media advisories.
 * Embargoed content is completely hidden from unauthorized users.
 */
export async function getAccessibleAdvisories(
  userId: string,
  eventId: string,
  userRole: string,
): Promise<MediaAdvisoryView[]> {
  const now = new Date();

  // Media staff can see all advisories including embargoed
  if (["MEDIA_OFFICER", "MEDIA_MANAGER", "SYSTEM_ADMIN"].includes(userRole)) {
    return prisma.mediaAdvisory.findMany({
      where: { eventId, status: { in: ["DRAFT", "PUBLISHED"] } },
    });
  }

  // Everyone else only sees published, non-embargoed advisories
  const advisories = await prisma.mediaAdvisory.findMany({
    where: {
      eventId,
      status: "PUBLISHED",
      OR: [{ embargoUntil: null }, { embargoUntil: { lte: now } }],
    },
  });

  // Log access for compliance
  for (const advisory of advisories) {
    if (advisory.embargoUntil && advisory.embargoUntil <= now) {
      // This was previously embargoed, log the access
      await auditLog.record({
        action: "EMBARGO_CONTENT_ACCESSED",
        entityType: "MediaAdvisory",
        entityId: advisory.id,
        actorId: userId,
        metadata: {
          embargoLiftedAt: advisory.embargoUntil.toISOString(),
          accessedAt: now.toISOString(),
        },
      });
    }
  }

  return advisories;
}

interface MediaAdvisoryView {
  id: string;
  headline: string;
  body: string;
  publishedAt: Date | null;
  embargoUntil: Date | null;
}
```

### 10.4 Input Validation

All user inputs are validated using Zod schemas to prevent injection attacks and ensure data integrity.

```typescript
// file: app/modules/people/validation/schemas.ts

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════
// STAFF MEMBER VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const staffMemberCreateSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\s'-]+$/u, "Invalid characters in name"),
  lastName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\s'-]+$/u, "Invalid characters in name"),
  email: z.string().email().max(255),
  phone: z
    .string()
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Invalid phone format")
    .optional(),
  role: z.enum([
    "STAFF_MANAGER",
    "SHIFT_SUPERVISOR",
    "REGISTRATION_STAFF",
    "PROTOCOL_OFFICER",
    "VIP_LIAISON",
    "INTERPRETER",
    "MEDIA_OFFICER",
    "PRESS_COORDINATOR",
    "VOLUNTEER",
    "SECURITY",
    "LOGISTICS",
    "CATERING",
    "TECHNICAL",
  ]),
  department: z.string().min(1).max(100),
  skills: z.array(z.string().max(50)).max(20).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// SHIFT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const shiftCreateSchema = z
  .object({
    staffMemberId: z.string().uuid(),
    zoneId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format"),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      const start = parseTime(data.startTime);
      const end = parseTime(data.endTime);
      return end > start || (end < start && end < 360); // Allow overnight shifts
    },
    { message: "End time must be after start time" },
  );

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA ADVISORY VALIDATION (XSS Prevention)
// ═══════════════════════════════════════════════════════════════════════════

const sanitizeHtml = (html: string): string => {
  // Strip potentially dangerous tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<iframe/gi, "&lt;iframe")
    .replace(/<object/gi, "&lt;object")
    .replace(/<embed/gi, "&lt;embed");
};

export const mediaAdvisorySchema = z.object({
  headline: z.string().min(1).max(200),
  subheadline: z.string().max(300).optional(),
  body: z.string().min(1).max(10000).transform(sanitizeHtml),
  keyPoints: z.array(z.string().max(500)).max(10).optional(),
  advisoryType: z.enum([
    "PRESS_CONFERENCE",
    "PHOTO_OPPORTUNITY",
    "MEDIA_AVAILABILITY",
    "SCHEDULE_CHANGE",
    "GENERAL",
  ]),
  embargoUntil: z.string().datetime().optional().nullable(),
  mediaContactName: z.string().max(200),
  mediaContactEmail: z.string().email(),
  mediaContactPhone: z.string().max(20).optional(),
  distributionList: z.array(
    z.enum(["ACCREDITED_MEDIA", "ALL_MEDIA", "SELECTED_OUTLETS", "POOL_ONLY"]),
  ),
  attachmentUrl: z.string().url().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// FILE UPLOAD VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const mediaAttachmentSchema = z.object({
  filename: z
    .string()
    .max(255)
    .regex(/^[\w\s.-]+$/, "Invalid filename characters")
    .refine((name) => !name.includes(".."), "Path traversal not allowed"),
  mimeType: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  size: z.number().max(10 * 1024 * 1024, "File size must be under 10MB"),
});

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
```

### 10.5 Audit Trail Requirements

Module 13 generates comprehensive audit entries for all state-changing operations.

```typescript
// file: app/modules/people/audit/audit-events.ts

/**
 * Audit event definitions for Module 13.
 * All events are stored in the immutable audit log with tamper-evident checksums.
 */
export const PEOPLE_AUDIT_EVENTS = {
  // Staff lifecycle
  STAFF_CREATED: {
    category: "STAFF",
    severity: "INFO",
    retention: "5_YEARS",
  },
  STAFF_UPDATED: {
    category: "STAFF",
    severity: "INFO",
    retention: "5_YEARS",
    capturesDiff: true,
  },
  STAFF_DEACTIVATED: {
    category: "STAFF",
    severity: "WARNING",
    retention: "7_YEARS",
  },
  STAFF_ROLE_CHANGED: {
    category: "STAFF",
    severity: "WARNING",
    retention: "7_YEARS",
    capturesDiff: true,
  },

  // Check-in/out
  STAFF_CHECKED_IN: {
    category: "ATTENDANCE",
    severity: "INFO",
    retention: "2_YEARS",
  },
  STAFF_CHECKED_OUT: {
    category: "ATTENDANCE",
    severity: "INFO",
    retention: "2_YEARS",
  },
  CHECKIN_OVERRIDE: {
    category: "ATTENDANCE",
    severity: "WARNING",
    retention: "5_YEARS",
  },

  // Shifts
  SHIFT_CREATED: {
    category: "SCHEDULING",
    severity: "INFO",
    retention: "2_YEARS",
  },
  SHIFT_MODIFIED: {
    category: "SCHEDULING",
    severity: "INFO",
    retention: "2_YEARS",
    capturesDiff: true,
  },
  SHIFT_DELETED: {
    category: "SCHEDULING",
    severity: "WARNING",
    retention: "2_YEARS",
  },
  SHIFT_SWAP_REQUESTED: {
    category: "SCHEDULING",
    severity: "INFO",
    retention: "2_YEARS",
  },
  SHIFT_SWAP_APPROVED: {
    category: "SCHEDULING",
    severity: "INFO",
    retention: "2_YEARS",
  },

  // Evaluations
  EVALUATION_CREATED: {
    category: "HR",
    severity: "INFO",
    retention: "7_YEARS",
  },
  EVALUATION_VIEWED: {
    category: "HR",
    severity: "INFO",
    retention: "5_YEARS",
  },

  // Interpretation
  INTERPRETER_ASSIGNED: {
    category: "INTERPRETATION",
    severity: "INFO",
    retention: "2_YEARS",
  },
  INTERPRETER_ROTATED: {
    category: "INTERPRETATION",
    severity: "INFO",
    retention: "2_YEARS",
  },
  FATIGUE_WARNING_TRIGGERED: {
    category: "INTERPRETATION",
    severity: "WARNING",
    retention: "2_YEARS",
  },

  // Media operations
  ADVISORY_PUBLISHED: {
    category: "MEDIA",
    severity: "INFO",
    retention: "5_YEARS",
  },
  EMBARGO_SET: {
    category: "MEDIA",
    severity: "WARNING",
    retention: "5_YEARS",
  },
  EMBARGO_LIFTED: {
    category: "MEDIA",
    severity: "INFO",
    retention: "5_YEARS",
  },
  EMBARGO_OVERRIDE: {
    category: "MEDIA",
    severity: "CRITICAL",
    retention: "7_YEARS",
  },
  INTERVIEW_FORWARDED: {
    category: "MEDIA",
    severity: "INFO",
    retention: "2_YEARS",
  },
} as const;
```

### 10.6 Rate Limiting

Critical endpoints are protected with rate limiting to prevent abuse.

```typescript
// file: app/modules/people/middleware/rate-limit.server.ts

import { RateLimiter } from "~/core/security/rate-limiter";

/**
 * Rate limit configurations for Module 13 endpoints.
 */
export const PEOPLE_RATE_LIMITS = {
  // Bulk operations
  "POST /api/staff/auto-schedule": {
    windowMs: 60000, // 1 minute
    maxRequests: 2,
    message: "Auto-scheduling can only be run twice per minute",
  },

  "POST /api/staff/bulk-import": {
    windowMs: 300000, // 5 minutes
    maxRequests: 5,
    message: "Bulk import rate limit exceeded",
  },

  // Check-in endpoints (higher limit for kiosk use)
  "POST /api/staff/checkin": {
    windowMs: 1000, // 1 second
    maxRequests: 10, // 10 per second per IP
    message: "Too many check-in requests",
  },

  // Media advisory distribution
  "POST /api/media/advisory/:id/publish": {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
    message: "Advisory publication rate limit exceeded",
  },

  // Interview request submission
  "POST /api/media/interview-request": {
    windowMs: 3600000, // 1 hour
    maxRequests: 20,
    keyGenerator: (req) => req.user?.id, // Per user
    message: "Interview request limit exceeded (max 20 per hour)",
  },

  // SSE connections
  "GET /api/staff/coverage/stream": {
    windowMs: 60000,
    maxRequests: 5,
    message: "Too many SSE connection attempts",
  },
};

export function createPeopleRateLimiter() {
  return new RateLimiter(PEOPLE_RATE_LIMITS);
}
```

---

## 11. Performance Requirements

Module 13 handles time-sensitive operations during live events. Staff check-ins, real-time coverage monitoring, and media embargo lifts require predictable, low-latency responses.

### 11.1 Response Time Targets

| Operation                       | Target (P50) | Target (P95) | Target (P99) | Max Acceptable |
| ------------------------------- | ------------ | ------------ | ------------ | -------------- |
| **Staff Operations**            |              |              |              |                |
| Load staff roster (100 members) | 100ms        | 200ms        | 350ms        | 500ms          |
| Single staff profile lookup     | 50ms         | 100ms        | 150ms        | 250ms          |
| Staff check-in                  | 100ms        | 200ms        | 300ms        | 500ms          |
| Staff check-out                 | 100ms        | 200ms        | 300ms        | 500ms          |
| Break start/end                 | 75ms         | 150ms        | 250ms        | 400ms          |
| **Shift Scheduling**            |              |              |              |                |
| Load day schedule (all zones)   | 200ms        | 400ms        | 600ms        | 1000ms         |
| Create single shift             | 100ms        | 200ms        | 300ms        | 500ms          |
| Update shift                    | 100ms        | 200ms        | 300ms        | 500ms          |
| Shift swap request              | 150ms        | 300ms        | 450ms        | 700ms          |
| **Auto-Scheduling**             |              |              |              |                |
| 100 staff, 20 zones, 7 days     | 5s           | 10s          | 15s          | 20s            |
| 500 staff, 100 zones, 14 days   | 15s          | 25s          | 35s          | 45s            |
| Coverage gap detection          | 500ms        | 1s           | 2s           | 3s             |
| **Interpretation**              |              |              |              |                |
| Load booth status               | 100ms        | 200ms        | 300ms        | 500ms          |
| Assign interpreter              | 150ms        | 300ms        | 450ms        | 700ms          |
| Execute rotation                | 100ms        | 200ms        | 300ms        | 500ms          |
| Fatigue calculation             | 50ms         | 100ms        | 150ms        | 250ms          |
| Cost calculation (event)        | 200ms        | 400ms        | 600ms        | 1000ms         |
| **Media Operations**            |              |              |              |                |
| Load press conference list      | 100ms        | 200ms        | 300ms        | 500ms          |
| Create press conference         | 150ms        | 300ms        | 450ms        | 700ms          |
| Advisory publication            | 500ms        | 1s           | 1.5s         | 2s             |
| Embargo lift notification       | 200ms        | 400ms        | 600ms        | 1000ms         |
| Interview request submission    | 150ms        | 300ms        | 450ms        | 700ms          |
| **Real-time**                   |              |              |              |                |
| SSE event delivery (check-in)   | 100ms        | 200ms        | 400ms        | 600ms          |
| Coverage gap alert              | 500ms        | 1s           | 2s           | 3s             |
| Webhook delivery                | 500ms        | 1s           | 2s           | 5s             |

### 11.2 Throughput Targets

| Scenario                              | Target                 | Notes                                |
| ------------------------------------- | ---------------------- | ------------------------------------ |
| Concurrent staff check-ins            | 200/second             | Peak morning rush                    |
| SSE connections (coverage monitoring) | 500 concurrent         | Operations center + zone supervisors |
| Auto-scheduling operations            | 10/minute              | Concurrent scheduling jobs           |
| Advisory distribution                 | 1000 recipients/minute | Email + push delivery                |
| Embargo lift notifications            | 500/second burst       | All waiting clients notified         |
| Interview request processing          | 100/minute             | Peak media activity                  |
| Receiver tracking updates             | 50/second              | RFID scanner throughput              |

### 11.3 Optimization Strategies

#### 11.3.1 Scheduling Algorithm Optimization

```typescript
// file: app/modules/people/services/scheduling-optimizer.server.ts

/**
 * Optimization techniques for shift scheduling.
 */

// 1. Constraint pre-processing
function preprocessConstraints(constraints: SchedulingConstraint[]): OptimizedConstraints {
  // Sort constraints by restrictiveness (most restrictive first)
  const sorted = constraints.sort((a, b) => {
    const scoreA = getConstraintRestrictiveness(a);
    const scoreB = getConstraintRestrictiveness(b);
    return scoreB - scoreA;
  });

  // Pre-compute constraint lookup tables
  const staffConstraints = new Map<string, SchedulingConstraint[]>();
  const zoneConstraints = new Map<string, SchedulingConstraint[]>();
  const timeConstraints = new Map<string, SchedulingConstraint[]>();

  for (const constraint of sorted) {
    // Index by staff ID for fast lookup
    if (constraint.staffMemberId) {
      const existing = staffConstraints.get(constraint.staffMemberId) ?? [];
      staffConstraints.set(constraint.staffMemberId, [...existing, constraint]);
    }
    // Index by zone ID
    if (constraint.zoneId) {
      const existing = zoneConstraints.get(constraint.zoneId) ?? [];
      zoneConstraints.set(constraint.zoneId, [...existing, constraint]);
    }
  }

  return { sorted, staffConstraints, zoneConstraints, timeConstraints };
}

// 2. Availability bitmap for O(1) conflict detection
class AvailabilityBitmap {
  private bitmap: Uint8Array;
  private slotsPerDay: number;

  constructor(days: number, slotMinutes: number = 15) {
    this.slotsPerDay = (24 * 60) / slotMinutes;
    this.bitmap = new Uint8Array(Math.ceil((days * this.slotsPerDay) / 8));
  }

  markOccupied(dayIndex: number, startSlot: number, endSlot: number): void {
    for (let slot = startSlot; slot < endSlot; slot++) {
      const bitIndex = dayIndex * this.slotsPerDay + slot;
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;
      this.bitmap[byteIndex] |= 1 << bitOffset;
    }
  }

  isAvailable(dayIndex: number, startSlot: number, endSlot: number): boolean {
    for (let slot = startSlot; slot < endSlot; slot++) {
      const bitIndex = dayIndex * this.slotsPerDay + slot;
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;
      if (this.bitmap[byteIndex] & (1 << bitOffset)) {
        return false;
      }
    }
    return true;
  }
}

// 3. Parallel constraint checking
async function checkConstraintsParallel(
  assignment: ProposedAssignment,
  constraints: OptimizedConstraints,
): Promise<ConstraintViolation[]> {
  const checks = [
    checkStaffConstraints(assignment, constraints.staffConstraints),
    checkZoneConstraints(assignment, constraints.zoneConstraints),
    checkTimeConstraints(assignment, constraints.timeConstraints),
  ];

  const results = await Promise.all(checks);
  return results.flat();
}

// 4. Early termination on infeasibility
function detectInfeasibility(
  requirements: ShiftRequirement[],
  availableStaff: StaffMember[],
): InfeasibilityReport | null {
  // Check if total staff hours available can meet requirements
  const totalRequiredHours = requirements.reduce(
    (sum, r) => sum + r.requiredCount * getShiftHours(r.startTime, r.endTime),
    0,
  );

  const totalAvailableHours = availableStaff.reduce(
    (sum, s) => sum + s.availability.length * 8, // Assume 8 hours max per available day
    0,
  );

  if (totalAvailableHours < totalRequiredHours) {
    return {
      reason: "INSUFFICIENT_STAFF_HOURS",
      required: totalRequiredHours,
      available: totalAvailableHours,
      shortfall: totalRequiredHours - totalAvailableHours,
    };
  }

  // Check skill coverage
  const requiredSkills = new Set(requirements.flatMap((r) => r.requiredSkills ?? []));

  for (const skill of requiredSkills) {
    const staffWithSkill = availableStaff.filter((s) => s.skills.includes(skill));
    if (staffWithSkill.length === 0) {
      return {
        reason: "MISSING_SKILL",
        skill,
        requiredBy: requirements.filter((r) => r.requiredSkills?.includes(skill)),
      };
    }
  }

  return null; // Feasible (so far)
}

interface OptimizedConstraints {
  sorted: SchedulingConstraint[];
  staffConstraints: Map<string, SchedulingConstraint[]>;
  zoneConstraints: Map<string, SchedulingConstraint[]>;
  timeConstraints: Map<string, SchedulingConstraint[]>;
}

interface InfeasibilityReport {
  reason: string;
  required?: number;
  available?: number;
  shortfall?: number;
  skill?: string;
  requiredBy?: ShiftRequirement[];
}
```

#### 11.3.2 Caching Strategy

```typescript
// file: app/modules/people/cache/cache-config.ts

import { Redis } from "ioredis";

/**
 * Cache configuration for Module 13.
 * Uses Redis for distributed caching across application instances.
 */
export const PEOPLE_CACHE_CONFIG = {
  // Staff roster (changes infrequently, read often)
  "staff:roster": {
    keyPattern: "people:staff:roster:{eventId}",
    ttl: 300, // 5 minutes
    invalidateOn: ["STAFF_CREATED", "STAFF_UPDATED", "STAFF_DEACTIVATED"],
  },

  // Today's shift schedule (high read volume)
  "shift:today": {
    keyPattern: "people:shift:today:{eventId}:{date}",
    ttl: 60, // 1 minute
    invalidateOn: ["SHIFT_CREATED", "SHIFT_MODIFIED", "SHIFT_DELETED"],
  },

  // Zone coverage status (real-time sensitive)
  "coverage:status": {
    keyPattern: "people:coverage:{eventId}:{zoneId}",
    ttl: 10, // 10 seconds
    invalidateOn: ["STAFF_CHECKED_IN", "STAFF_CHECKED_OUT", "SHIFT_MODIFIED"],
  },

  // Interpreter availability (medium frequency)
  "interpreter:available": {
    keyPattern: "people:interpreter:available:{eventId}:{date}",
    ttl: 120, // 2 minutes
    invalidateOn: ["INTERPRETER_ASSIGNED", "ASSIGNMENT_REMOVED"],
  },

  // Language pair availability
  "language:pairs": {
    keyPattern: "people:language:pairs:{eventId}",
    ttl: 600, // 10 minutes
    invalidateOn: ["INTERPRETER_CREATED", "CERTIFICATION_ADDED"],
  },

  // Press conference list
  "press:conferences": {
    keyPattern: "people:press:conferences:{eventId}",
    ttl: 300, // 5 minutes
    invalidateOn: ["PRESS_CONFERENCE_CREATED", "PRESS_CONFERENCE_UPDATED"],
  },

  // Published advisories
  "advisory:published": {
    keyPattern: "people:advisory:published:{eventId}",
    ttl: 60, // 1 minute (embargo-sensitive)
    invalidateOn: ["ADVISORY_PUBLISHED", "EMBARGO_LIFTED"],
  },
};

export class PeopleCache {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async invalidateForEvent(
    eventId: string,
    cacheType: keyof typeof PEOPLE_CACHE_CONFIG,
  ): Promise<void> {
    const config = PEOPLE_CACHE_CONFIG[cacheType];
    const pattern = config.keyPattern.replace("{eventId}", eventId).replace(/\{[^}]+\}/g, "*");
    await this.invalidate(pattern);
  }
}
```

#### 11.3.3 Database Query Optimization

```typescript
// file: app/modules/people/db/optimized-queries.server.ts

import { prisma } from "~/db.server";

/**
 * Optimized queries for high-frequency operations.
 */

// Batch load staff with shifts for schedule view
export async function loadScheduleData(eventId: string, dateRange: { start: string; end: string }) {
  // Single query with all necessary joins
  const staff = await prisma.staffMember.findMany({
    where: {
      eventId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      skills: true,
      currentStatus: true,
      shifts: {
        where: {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          zoneId: true,
          status: true,
          checkInTime: true,
          checkOutTime: true,
        },
      },
    },
  });

  // Separate query for zones (small dataset, cache-friendly)
  const zones = await prisma.zone.findMany({
    where: { eventId },
    select: {
      id: true,
      name: true,
      type: true,
      requiredStaffCount: true,
      parentZoneId: true,
    },
  });

  return { staff, zones };
}

// Optimized coverage gap detection using raw SQL
export async function detectCoverageGaps(eventId: string, date: string) {
  const gaps = await prisma.$queryRaw<CoverageGap[]>`
    WITH zone_requirements AS (
      SELECT
        z.id AS zone_id,
        z.name AS zone_name,
        z.required_staff_count,
        gs.slot_time
      FROM zones z
      CROSS JOIN generate_series(
        '00:00'::time,
        '23:45'::time,
        '15 minutes'::interval
      ) AS gs(slot_time)
      WHERE z.event_id = ${eventId}
        AND z.required_staff_count > 0
    ),
    slot_coverage AS (
      SELECT
        ss.zone_id,
        gs.slot_time,
        COUNT(ss.id) AS staff_count
      FROM staff_shifts ss
      CROSS JOIN generate_series(
        '00:00'::time,
        '23:45'::time,
        '15 minutes'::interval
      ) AS gs(slot_time)
      WHERE ss.event_id = ${eventId}
        AND ss.date = ${date}
        AND ss.status IN ('SCHEDULED', 'ACTIVE')
        AND gs.slot_time >= ss.start_time::time
        AND gs.slot_time < ss.end_time::time
      GROUP BY ss.zone_id, gs.slot_time
    )
    SELECT
      zr.zone_id,
      zr.zone_name,
      zr.slot_time::text AS time_slot,
      zr.required_staff_count AS required,
      COALESCE(sc.staff_count, 0) AS actual,
      zr.required_staff_count - COALESCE(sc.staff_count, 0) AS shortfall
    FROM zone_requirements zr
    LEFT JOIN slot_coverage sc ON zr.zone_id = sc.zone_id AND zr.slot_time = sc.slot_time
    WHERE COALESCE(sc.staff_count, 0) < zr.required_staff_count
    ORDER BY zr.zone_name, zr.slot_time
  `;

  return gaps;
}

interface CoverageGap {
  zone_id: string;
  zone_name: string;
  time_slot: string;
  required: number;
  actual: number;
  shortfall: number;
}

// Optimized interpreter availability check
export async function findAvailableInterpreters(
  eventId: string,
  date: string,
  startTime: string,
  endTime: string,
  languagePair: string,
): Promise<AvailableInterpreter[]> {
  const [sourceLang, targetLang] = languagePair.split("-");

  return prisma.$queryRaw<AvailableInterpreter[]>`
    SELECT
      sm.id,
      sm.first_name,
      sm.last_name,
      ic.certification_body,
      ic.valid_until,
      COALESCE(
        (
          SELECT SUM(
            EXTRACT(EPOCH FROM (ia.end_time - ia.start_time)) / 60
          )
          FROM interpreter_assignments ia
          JOIN interpretation_services is2 ON ia.service_id = is2.id
          WHERE ia.interpreter_id = sm.id
            AND is2.date = ${date}::date
        ),
        0
      ) AS minutes_today
    FROM staff_members sm
    JOIN interpreter_certifications ic ON ic.interpreter_id = sm.id
    WHERE sm.event_id = ${eventId}
      AND sm.role = 'INTERPRETER'
      AND sm.status = 'ACTIVE'
      AND ic.language_pair = ${languagePair}
      AND ic.status = 'VERIFIED'
      AND ic.valid_until > CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1
        FROM interpreter_assignments ia
        JOIN interpretation_services is2 ON ia.service_id = is2.id
        WHERE ia.interpreter_id = sm.id
          AND is2.date = ${date}::date
          AND (
            (is2.start_time <= ${startTime} AND is2.end_time > ${startTime})
            OR (is2.start_time < ${endTime} AND is2.end_time >= ${endTime})
            OR (is2.start_time >= ${startTime} AND is2.end_time <= ${endTime})
          )
      )
    ORDER BY minutes_today ASC, sm.last_name ASC
  `;
}

interface AvailableInterpreter {
  id: string;
  first_name: string;
  last_name: string;
  certification_body: string;
  valid_until: Date;
  minutes_today: number;
}
```

### 11.4 Scalability Considerations

#### 11.4.1 Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODULE 13 HORIZONTAL SCALING ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │  Load Balancer  │
                         │   (Layer 7)     │
                         └────────┬────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Server 1  │    │   App Server 2  │    │   App Server 3  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Staff APIs  │ │    │ │ Staff APIs  │ │    │ │ Staff APIs  │ │
│ ├─────────────┤ │    │ ├─────────────┤ │    │ ├─────────────┤ │
│ │ Interp APIs │ │    │ │ Interp APIs │ │    │ │ Interp APIs │ │
│ ├─────────────┤ │    │ ├─────────────┤ │    │ ├─────────────┤ │
│ │ Media APIs  │ │    │ │ Media APIs  │ │    │ │ Media APIs  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
         ┌──────────────────────┴──────────────────────┐
         │                                             │
         ▼                                             ▼
┌─────────────────┐                           ┌─────────────────┐
│  Redis Cluster  │                           │ PostgreSQL      │
│                 │                           │ (Primary +      │
│ ┌─────────────┐ │                           │  Read Replicas) │
│ │ Cache       │ │                           │                 │
│ ├─────────────┤ │                           │ ┌─────────────┐ │
│ │ Session     │ │                           │ │  Primary    │ │
│ ├─────────────┤ │                           │ ├─────────────┤ │
│ │ Pub/Sub     │ │                           │ │  Replica 1  │ │
│ │ (SSE events)│ │                           │ ├─────────────┤ │
│ └─────────────┘ │                           │ │  Replica 2  │ │
└─────────────────┘                           │ └─────────────┘ │
                                              └─────────────────┘

Background Workers (Separate Process Group):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Worker 1       │    │  Worker 2       │    │  Worker 3       │
│                 │    │                 │    │                 │
│ - Auto-schedule │    │ - Auto-schedule │    │ - Embargo lift  │
│ - Coverage calc │    │ - Coverage calc │    │ - Notification  │
│ - Rotation      │    │ - Rotation      │    │ - Report gen    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 11.4.2 Multi-Event Isolation

```typescript
// file: app/modules/people/scaling/event-isolation.ts

/**
 * Event isolation ensures operations for different events
 * don't impact each other's performance.
 */

// All database queries include eventId scope
const EVENT_SCOPED_TABLES = [
  "staff_members",
  "staff_shifts",
  "staff_task_logs",
  "staff_evaluations",
  "interpretation_services",
  "interpreter_assignments",
  "press_conferences",
  "media_advisories",
  "interview_requests",
  "media_pool_assignments",
];

// Background jobs are partitioned by event
export const JOB_QUEUE_PARTITIONS = {
  "people:auto-schedule": {
    partitionKey: "eventId",
    maxConcurrentPerPartition: 1, // One auto-schedule per event at a time
  },
  "people:coverage-check": {
    partitionKey: "eventId",
    maxConcurrentPerPartition: 2,
  },
  "people:embargo-lift": {
    partitionKey: "eventId",
    maxConcurrentPerPartition: 10, // Many advisories may lift simultaneously
  },
};

// SSE channels are scoped by event
export function getSSEChannel(eventId: string, channelType: string): string {
  return `people:${channelType}:${eventId}`;
}

// Cache keys include event ID
export function getCacheKey(eventId: string, dataType: string, ...args: string[]): string {
  return `people:${eventId}:${dataType}:${args.join(":")}`;
}
```

---

## 12. Open Questions and Decisions

This section tracks architectural decisions, open questions, and pending decisions for Module 13.

### 12.1 Architecture Decision Records

#### ADR-13-001: Staff Scheduling Algorithm Approach

| Field                  | Value                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**             | ACCEPTED                                                                                                                                                                                           |
| **Date**               | 2025-01-20                                                                                                                                                                                         |
| **Decision**           | Use hybrid approach: greedy algorithm for initial pass, constraint programming for optimization                                                                                                    |
| **Context**            | Staff scheduling is an NP-hard constraint satisfaction problem. Pure constraint programming (CP) solvers can be slow for large instances. Pure greedy algorithms may produce suboptimal solutions. |
| **Options Considered** | 1) Pure greedy (fast but suboptimal), 2) Pure CP (optimal but slow), 3) Hybrid (greedy + local search), 4) Commercial solver (OR-Tools, Gurobi)                                                    |
| **Decision Rationale** | Hybrid approach provides good balance: greedy gets a feasible solution quickly, then local search improves it within time budget. Avoids licensing costs of commercial solvers.                    |
| **Consequences**       | - Initial solution available in < 5 seconds for most cases<br>- Quality improves with more time budget<br>- May not find globally optimal solution<br>- Implementation complexity is moderate      |

#### ADR-13-002: Interpreter Rotation Interval

| Field                  | Value                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**             | ACCEPTED                                                                                                                                                                |
| **Date**               | 2025-01-25                                                                                                                                                              |
| **Decision**           | Fixed 30-minute rotation interval as default, configurable per event                                                                                                    |
| **Context**            | Interpreter rotation frequency affects fatigue, interpretation quality, and scheduling complexity. Industry standards vary from 15-45 minutes.                          |
| **Options Considered** | 1) Fixed 30 minutes (industry standard), 2) Configurable per event, 3) Adaptive based on fatigue monitoring, 4) Per-language-pair configuration                         |
| **Decision Rationale** | 30 minutes is widely accepted as optimal for simultaneous interpretation. Configurable override allows for specific event needs. Adaptive rotation deferred to Phase 2. |
| **Consequences**       | - Predictable rotation schedules<br>- Easy to plan booth coverage<br>- May not be optimal for all language pairs/contexts<br>- Adaptive rotation is future enhancement  |

#### ADR-13-003: Media Advisory Distribution Mechanism

| Field                  | Value                                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**             | ACCEPTED                                                                                                                                                                           |
| **Date**               | 2025-02-01                                                                                                                                                                         |
| **Decision**           | Support both push notification (via mobile app) and email distribution                                                                                                             |
| **Context**            | Journalists need timely access to media advisories. Distribution channels affect reach and immediacy.                                                                              |
| **Options Considered** | 1) Email only, 2) Push notification only, 3) Both email and push, 4) RSS feed, 5) API polling                                                                                      |
| **Decision Rationale** | Email provides universal reach (all journalists have email). Push provides immediacy for mobile app users. Supporting both maximizes coverage. RSS and polling are less immediate. |
| **Consequences**       | - Maximum reach for advisories<br>- Increased infrastructure complexity<br>- Need to manage notification preferences<br>- Potential for duplicate notifications                    |

#### ADR-13-004: Volunteer Management Scope

| Field                  | Value                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**             | PROPOSED                                                                                                                                                                         |
| **Date**               | 2025-02-05                                                                                                                                                                       |
| **Decision**           | Implement basic volunteer lifecycle (application, onboarding, scheduling)                                                                                                        |
| **Context**            | Volunteers are a significant workforce component but have different management needs than staff. Full volunteer management is a large scope.                                     |
| **Options Considered** | 1) Basic (application + onboarding), 2) Full lifecycle (includes gamification, certificates, alumni), 3) External integration (volunteer.gov), 4) Out of scope                   |
| **Decision Rationale** | Basic lifecycle covers MVP needs. Gamification and alumni management can be added later based on demand.                                                                         |
| **Consequences**       | - Volunteers can be managed in same system as staff<br>- Limits initial scope<br>- May need extension for large volunteer programs<br>- Certificate generation included in basic |

#### ADR-13-005: Staff Mobile App Technology

| Field                  | Value                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**             | PROPOSED                                                                                                                                                     |
| **Date**               | 2025-02-08                                                                                                                                                   |
| **Decision**           | Progressive Web App (PWA) for staff mobile experience                                                                                                        |
| **Context**            | Staff need mobile access for check-in, schedules, and notifications. Native apps have higher development/maintenance cost.                                   |
| **Options Considered** | 1) PWA (web-based, installable), 2) React Native (cross-platform native), 3) Native iOS + Android, 4) Capacitor wrapper                                      |
| **Decision Rationale** | PWA provides good mobile experience with lower development cost. Eliminates app store approval delays. Works offline. Can upgrade to native later if needed. |
| **Consequences**       | - Single codebase for web and mobile<br>- Limited access to native APIs<br>- No app store presence<br>- Offline support via service workers                  |

### 12.2 Open Questions

| ID        | Question                                                                                                                                       | Priority | Owner               | Due Date   | Status        | Notes                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- | ---------- | ------------- | --------------------------------------------------------- |
| OQ-13-001 | How should the system integrate with external HR systems for staff import? What data formats are standard?                                     | HIGH     | Integration Team    | 2025-02-20 | OPEN          | Need to survey common HRIS APIs (Workday, SAP, etc.)      |
| OQ-13-002 | What union/labor regulations apply to shift scheduling? Are there specific rules for overtime, rest periods, or shift lengths we must enforce? | HIGH     | Legal/HR            | 2025-02-15 | INVESTIGATING | Varies by country. AU staff may have specific agreements. |
| OQ-13-003 | How should interpreter certification verification work? Is there an API to verify AIIC membership or other certifications?                     | MEDIUM   | Interpretation Team | 2025-02-25 | OPEN          | May need manual verification as fallback.                 |
| OQ-13-004 | Should the system support split shifts (e.g., 08:00-12:00 then 16:00-20:00)? How does this affect fatigue calculation?                         | MEDIUM   | Operations          | 2025-03-01 | OPEN          | Current model assumes continuous shifts.                  |
| OQ-13-005 | What accessibility requirements apply to the check-in kiosk? Are there ADA/EN 301 549 compliance requirements?                                 | MEDIUM   | UX Team             | 2025-02-28 | OPEN          | May need screen reader support, high contrast mode.       |
| OQ-13-006 | How should the system handle interpreter no-shows? Is automatic reassignment acceptable or must it be manual?                                  | MEDIUM   | Interpretation Team | 2025-03-05 | OPEN          | Impacts service continuity.                               |
| OQ-13-007 | Should media advisories support rich media embeds (images, video links)? What content types are needed?                                        | LOW      | Media Team          | 2025-03-10 | OPEN          | Current spec supports attachments but not inline embeds.  |
| OQ-13-008 | What is the retention policy for staff evaluations and disciplinary records? Are there legal requirements by jurisdiction?                     | HIGH     | Legal/HR            | 2025-02-20 | OPEN          | May vary by country of employment.                        |

### 12.3 Deferred Features

The following features are explicitly deferred to future phases:

| Feature                                  | Phase   | Rationale                                       | Dependencies               |
| ---------------------------------------- | ------- | ----------------------------------------------- | -------------------------- |
| AI-powered scheduling optimization       | Phase 2 | Requires training data from initial deployments | Core scheduling working    |
| Real-time interpreter fatigue monitoring | Phase 2 | Hardware integration complexity                 | Basic rotation working     |
| Biometric check-in                       | Phase 2 | Hardware procurement and integration            | Basic check-in working     |
| Volunteer gamification                   | Phase 2 | Nice-to-have, not core functionality            | Basic volunteer management |
| External HR system integration           | Phase 2 | API standardization needed                      | Staff management core      |
| AI transcript generation                 | Phase 3 | Requires speech-to-text infrastructure          | Press conference streaming |
| Multi-language media advisories          | Phase 2 | Translation workflow complexity                 | Basic advisory publishing  |

---

## Appendix

### A. Staff Role Permissions Matrix

Complete RBAC permission grid for all Module 13 roles and operations.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    STAFF ROLE PERMISSIONS MATRIX                                         │
├───────────────────────┬─────────┬───────────┬─────────┬───────────┬──────────┬─────────┬───────────────┤
│ Permission            │ Staff   │ Shift     │ Staff   │ Volunteer │ HR       │ System  │ Interpretation│
│                       │ Manager │ Supervisor│ Member  │ Coord.    │ Admin    │ Admin   │ Manager       │
├───────────────────────┼─────────┼───────────┼─────────┼───────────┼──────────┼─────────┼───────────────┤
│ STAFF PROFILES        │         │           │         │           │          │         │               │
│ staff:read:all        │    ✓    │     D     │    ✗    │     V     │    ✓     │    ✓    │       ✗       │
│ staff:read:own        │    ✓    │     ✓     │    ✓    │    ✓      │    ✓     │    ✓    │       ✓       │
│ staff:create          │    ✓    │     ✗     │    ✗    │     V     │    ✓     │    ✓    │       ✗       │
│ staff:update          │    ✓    │     ✗     │    S    │     V     │    ✓     │    ✓    │       ✗       │
│ staff:delete          │    ✗    │     ✗     │    ✗    │    ✗      │    ✓     │    ✓    │       ✗       │
│ staff:approve         │    ✓    │     ✗     │    ✗    │     V     │    ✓     │    ✓    │       ✗       │
├───────────────────────┼─────────┼───────────┼─────────┼───────────┼──────────┼─────────┼───────────────┤
│ SHIFTS                │         │           │         │           │          │         │               │
│ shift:read:all        │    ✓    │     ✓     │    ✗    │     V     │    ✓     │    ✓    │       ✗       │
│ shift:read:own        │    ✓    │     ✓     │    ✓    │    ✓      │    ✓     │    ✓    │       ✓       │
│ shift:create          │    ✓    │     ✓     │    ✗    │     V     │    ✗     │    ✓    │       ✗       │
│ shift:update          │    ✓    │     ✓     │    ✗    │     V     │    ✗     │    ✓    │       ✗       │
│ shift:delete          │    ✓    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ shift:auto-schedule   │    ✓    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
├───────────────────────┼─────────┼───────────┼─────────┼───────────┼──────────┼─────────┼───────────────┤
│ CHECK-IN/OUT          │         │           │         │           │          │         │               │
│ checkin:perform:any   │    ✓    │     ✓     │    ✗    │    ✓      │    ✗     │    ✓    │       ✗       │
│ checkin:perform:self  │    ✓    │     ✓     │    ✓    │    ✓      │    ✓     │    ✓    │       ✓       │
│ checkin:override      │    ✓    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ checkin:view:history  │    ✓    │     ✓     │    S    │     V     │    ✓     │    ✓    │       ✗       │
├───────────────────────┼─────────┼───────────┼─────────┼───────────┼──────────┼─────────┼───────────────┤
│ EVALUATIONS           │         │           │         │           │          │         │               │
│ evaluation:read:all   │    ✗    │     ✗     │    ✗    │    ✗      │    ✓     │    ✓    │       ✗       │
│ evaluation:read:own   │    ✓    │     ✓     │    ✓    │    ✓      │    ✓     │    ✓    │       ✓       │
│ evaluation:create     │    ✓    │     ✓     │    ✗    │    ✓      │    ✓     │    ✓    │       ✓       │
│ evaluation:update     │    ✗    │     ✗     │    ✗    │    ✗      │    ✓     │    ✓    │       ✗       │
├───────────────────────┼─────────┼───────────┼─────────┼───────────┼──────────┼─────────┼───────────────┤
│ INTERPRETATION        │         │           │         │           │          │         │               │
│ service:read:all      │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✓       │
│ service:read:assigned │    ✗    │     ✗     │    A    │    ✗      │    ✗     │    ✓    │       ✓       │
│ service:create        │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✓       │
│ interpreter:assign    │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✓       │
│ interpreter:rotate    │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✓       │
│ certification:verify  │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✓       │
│ booth:manage          │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✓       │
│ receiver:track        │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✓       │
├───────────────────────┼─────────┼───────────┼─────────┼───────────┼──────────┼─────────┼───────────────┤
│ MEDIA OPERATIONS      │         │           │         │           │          │         │               │
│ conference:read:all   │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ conference:create     │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ advisory:read:all     │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ advisory:publish      │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ embargo:manage        │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ interview:forward     │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
│ pool:manage           │    ✗    │     ✗     │    ✗    │    ✗      │    ✗     │    ✓    │       ✗       │
└───────────────────────┴─────────┴───────────┴─────────┴───────────┴──────────┴─────────┴───────────────┘

Legend:
  ✓ = Full access
  ✗ = No access
  D = Department only
  V = Volunteers only
  S = Self only
  A = Assigned services only
```

### B. Shift Scheduling Constraints Reference

Complete reference of constraints enforced by the scheduling algorithm.

| Constraint Type        | Parameters         | Default Value | Description                                 | Hard/Soft |
| ---------------------- | ------------------ | ------------- | ------------------------------------------- | --------- |
| `MAX_SHIFT_HOURS`      | hours              | 8             | Maximum duration of a single shift          | Hard      |
| `MIN_SHIFT_HOURS`      | hours              | 4             | Minimum duration of a single shift          | Soft      |
| `MAX_DAILY_HOURS`      | hours              | 10            | Maximum hours per staff member per day      | Hard      |
| `MAX_WEEKLY_HOURS`     | hours              | 48            | Maximum hours per staff member per week     | Hard      |
| `MIN_REST_HOURS`       | hours              | 10            | Minimum rest between consecutive shifts     | Hard      |
| `MANDATORY_BREAK`      | hours_before_break | 4             | Continuous work hours before break required | Soft      |
| `BREAK_DURATION`       | minutes            | 30            | Duration of mandatory breaks                | Soft      |
| `OVERTIME_THRESHOLD`   | hours              | 8             | Hours after which overtime applies          | Soft      |
| `SKILL_REQUIRED`       | skill_name         | -             | Staff must have specific skill for zone     | Hard      |
| `ROLE_REQUIRED`        | role_name          | -             | Staff must have specific role for zone      | Hard      |
| `MIN_ZONE_COVERAGE`    | count              | varies        | Minimum staff count per zone per slot       | Hard      |
| `MAX_CONSECUTIVE_DAYS` | days               | 6             | Maximum days worked in a row                | Soft      |
| `AVAILABILITY`         | dates[]            | -             | Staff available dates                       | Hard      |
| `PREFERENCE`           | dates[], priority  | -             | Staff preferred dates/times                 | Soft      |
| `EXCLUSION`            | dates[]            | -             | Staff unavailable dates                     | Hard      |
| `PAIRING_REQUIRED`     | staff_id           | -             | Two staff must work together                | Soft      |
| `PAIRING_FORBIDDEN`    | staff_id           | -             | Two staff cannot work together              | Hard      |

**Constraint Priority Order (for conflict resolution):**

1. Hard constraints (must be satisfied)
2. Legal/regulatory constraints
3. Zone coverage requirements
4. Staff availability
5. Workload balancing
6. Staff preferences

### C. Interpretation Language Pair Reference

Common language pairs and their characteristics for AU events.

| Language Pair        | Code  | Classification | Availability | Notes                     |
| -------------------- | ----- | -------------- | ------------ | ------------------------- |
| English - French     | EN-FR | Standard       | High         | Primary working languages |
| English - Arabic     | EN-AR | Standard       | High         | Primary working languages |
| English - Portuguese | EN-PT | Standard       | Medium       | Primary working languages |
| English - Spanish    | EN-ES | Standard       | Medium       | Primary working languages |
| French - Arabic      | FR-AR | Standard       | Medium       | Common combination        |
| French - Portuguese  | FR-PT | Standard       | Medium       | Common combination        |
| English - Swahili    | EN-SW | Regional       | Low          | East African events       |
| English - Amharic    | EN-AM | Regional       | Low          | Ethiopian events          |
| French - Wolof       | FR-WO | Regional       | Low          | West African events       |
| Arabic - French      | AR-FR | Standard       | Medium       | North African context     |
| Portuguese - French  | PT-FR | Standard       | Low          | Lusophone-Francophone     |
| English - Chinese    | EN-ZH | Premium        | Low          | Special events            |
| English - German     | EN-DE | Premium        | Low          | International partners    |

**Interpreter Certification Bodies:**

| Code   | Full Name                                            | Recognition Level |
| ------ | ---------------------------------------------------- | ----------------- |
| AIIC   | International Association of Conference Interpreters | Highest           |
| UN_LCP | UN Language Competitive Programme                    | Highest           |
| ATA    | American Translators Association                     | High              |
| ITI    | Institute of Translation and Interpreting            | High              |
| CIOL   | Chartered Institute of Linguists                     | High              |
| SATI   | South African Translators' Institute                 | Regional          |
| NAJIT  | National Association of Judiciary Interpreters       | Specialized       |

### D. Media Operations Glossary

| Term                      | Definition                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Accredited Journalist** | A media professional who has completed the accreditation process and received credentials for event access.          |
| **Advisory**              | An official communication to media containing event information, announcements, or schedule updates.                 |
| **Embargo**               | A restriction on publishing information until a specified date/time. Violations may result in credential revocation. |
| **Media Pool**            | A rotating group of journalists selected to cover restricted-access events and share content with other media.       |
| **Photo Op**              | A brief photo opportunity, typically without questions, for media to capture images.                                 |
| **Press Conference**      | A formal media briefing with one or more speakers, typically including a Q&A session.                                |
| **Press Gaggle**          | An informal, impromptu briefing, often conducted while walking.                                                      |
| **Media Availability**    | A scheduled time when a principal is available for interviews, often one-on-one.                                     |
| **Pool Report**           | A written summary of an event provided by pool reporters to all accredited media.                                    |
| **Backgrounder**          | Information provided to journalists for context, not for direct quotation.                                           |
| **Off the Record**        | Information that cannot be published or attributed.                                                                  |
| **On Background**         | Information that can be used but not attributed to the source by name.                                               |
| **On the Record**         | Information that can be published and attributed directly.                                                           |
| **Stakeout**              | Journalists waiting outside a venue to interview officials as they arrive/depart.                                    |
| **Spray**                 | Brief photo/video opportunity at the start of a meeting, before substantive discussions begin.                       |

### E. Related ADRs and References

#### Internal Module References

| Module    | Document                                                                 | Relevance to Module 13                                            |
| --------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Module 01 | [Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                   | Base entities (Tenant, Event, User, Participant)                  |
| Module 04 | [Workflow Engine](./04-WORKFLOW-ENGINE.md)                               | Staff approval workflows, volunteer onboarding, interview routing |
| Module 05 | [Security and Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       | RBAC, zone access, audit logging                                  |
| Module 07 | [API and Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)           | SSE channels, webhook definitions, API patterns                   |
| Module 08 | [UI/UX and Frontend](./08-UI-UX-AND-FRONTEND.md)                         | Component library, form patterns, calendar widget                 |
| Module 09 | [Registration and Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | Participant linking, badge zones, media accreditation             |
| Module 10 | [Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md)               | Command center integration, check-in kiosk                        |
| Module 11 | [Logistics and Venue](./11-LOGISTICS-AND-VENUE.md)                       | Zone definitions, transport, accommodation                        |
| Module 12 | [Protocol and Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md)                 | Bilateral interpretation, VIP support staff                       |
| Module 14 | [Content and Documents](./14-CONTENT-AND-DOCUMENTS.md)                   | Advisory templates, certificate generation                        |
| Module 16 | [Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)                 | Mobile app integration, push notifications                        |
| Module 17 | [Configuration Management](./17-CONFIGURATION-MANAGEMENT.md)             | Settings registry, feature flags                                  |

#### Technology Stack

| Technology      | Version | Usage in Module 13                                    |
| --------------- | ------- | ----------------------------------------------------- |
| Node.js         | 20 LTS  | Server runtime                                        |
| React           | 18      | UI components for staff, scheduling, media interfaces |
| React Router    | 7       | Client and server routing, loaders, actions           |
| Express         | 4       | API server for workforce endpoints                    |
| PostgreSQL      | 16      | Primary data store for all workforce entities         |
| Prisma          | 5       | ORM and database migration management                 |
| Redis           | 7       | Caching (staff rosters, coverage status), SSE pub/sub |
| Vitest          | Latest  | Unit and integration testing                          |
| Playwright      | Latest  | End-to-end browser testing                            |
| @faker-js/faker | Latest  | Test data generation                                  |
| k6              | Latest  | Performance/load testing                              |
| Zod             | 3       | Input validation schemas                              |
| date-fns        | Latest  | Date/time manipulation                                |
| p-queue         | Latest  | Concurrency control for scheduling jobs               |

#### External Standards and References

| Standard             | Description                                            | Applicability                            |
| -------------------- | ------------------------------------------------------ | ---------------------------------------- |
| AIIC Standards       | International conference interpretation best practices | Interpreter rotation, booth requirements |
| ISO 2603:2016        | Simultaneous interpreting booth requirements           | Booth equipment specifications           |
| ISO 20109:2016       | Simultaneous interpreting delivery platforms           | Receiver equipment standards             |
| ILO Conventions      | International Labour Organization standards            | Shift scheduling, rest periods           |
| GDPR                 | EU General Data Protection Regulation                  | Staff personal data handling             |
| AU Staff Regulations | African Union staff employment regulations             | AU-specific employment rules             |

#### API Documentation

| API Endpoint         | Documentation                                              |
| -------------------- | ---------------------------------------------------------- |
| Staff Management API | `/api/v1/staff/*` - Staff CRUD, shifts, check-in           |
| Interpretation API   | `/api/v1/interpretation/*` - Services, assignments, booths |
| Media Operations API | `/api/v1/media/*` - Conferences, advisories, interviews    |
| SSE Endpoints        | `/api/v1/stream/*` - Real-time event streams               |
| Webhooks             | See Module 07 webhook documentation                        |

---

_End of Module 13: People and Workforce_
