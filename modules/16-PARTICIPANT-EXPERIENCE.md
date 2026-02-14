# Module 16: Participant Experience

> **Accreditation Platform — Participant-Facing Digital Experience & Event Continuity**

| Metadata       | Value                             |
| -------------- | --------------------------------- |
| Module ID      | 16                                |
| Title          | Participant Experience            |
| Version        | 1.0                               |
| Last Updated   | 2025-07-15                        |
| Author         | Architecture Team                 |
| Status         | Draft                             |
| Classification | Internal — Architecture Reference |

---

## Dependencies

| Relationship    | Module                                                                              |
| --------------- | ----------------------------------------------------------------------------------- |
| **Requires**    | [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                   |
|                 | [Module 05: Security and Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       |
|                 | [Module 07: API and Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)           |
|                 | [Module 08: UI/UX and Frontend](./08-UI-UX-AND-FRONTEND.md)                         |
| **Required By** | [Module 10: Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md)               |
|                 | [Module 18: Implementation Roadmap](./18-IMPLEMENTATION-ROADMAP.md)                 |
| **Integrates**  | [Module 03: Visual Form Designer](./03-VISUAL-FORM-DESIGNER.md)                     |
|                 | [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md)                               |
|                 | [Module 09: Registration and Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) |
|                 | [Module 11: Logistics and Venue](./11-LOGISTICS-AND-VENUE.md)                       |
|                 | [Module 12: Protocol and Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md)                 |
|                 | [Module 13: People and Workforce](./13-PEOPLE-AND-WORKFORCE.md)                     |
|                 | [Module 14: Content and Documents](./14-CONTENT-AND-DOCUMENTS.md)                   |
|                 | [Module 15: Compliance and Governance](./15-COMPLIANCE-AND-GOVERNANCE.md)           |
|                 | [Module 17: Settings and Configuration](./17-SETTINGS-AND-CONFIGURATION.md)         |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [API Specification](#4-api-specification)
5. [Business Logic](#5-business-logic)
6. [User Interface](#6-user-interface)
7. [Integration Points](#7-integration-points)
8. [Configuration](#8-configuration)
9. [Testing Strategy](#9-testing-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Performance Requirements](#11-performance-requirements)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)

---

## 1. Overview

### 1.1 Purpose

Module 16 defines the **participant-facing digital experience** — the mobile app, self-service portal, personal agenda, digital badge wallet integration, networking features, and event continuity (cloning/series) capabilities. While previous modules focus on administrator workflows, this module inverts the perspective to address what the **participant** — the delegate, minister, observer, media member, or companion — sees, touches, and interacts with before, during, and after the event.

The participant experience encompasses three distinct lifecycle phases:

1. **Pre-Event** — Registration status tracking, document upload, agenda browsing, badge provisioning, travel/accommodation visibility
2. **During Event** — Digital badge access, personal agenda with real-time updates, navigation/wayfinding, networking, contact exchange, session feedback, self-service portal
3. **Post-Event** — Certificate download, contact export, survey completion, event series continuity for returning participants

Additionally, this module covers **event cloning and series management** — the administrative capability that enables institutional memory across recurring events, directly benefiting participants through pre-filled registrations, carry-forward profiles, and year-over-year continuity.

### 1.2 Scope

| In Scope                                      | Out of Scope                                             |
| --------------------------------------------- | -------------------------------------------------------- |
| Participant mobile PWA                        | Admin-facing event management UI                         |
| Digital badge with wallet integration         | Physical badge design and printing                       |
| Personal agenda with multi-source integration | Full meeting/session scheduling engine                   |
| Registration status self-service tracker      | Registration form builder (→ Module 03)                  |
| Participant networking and contact exchange   | Staff scheduling and shift management (→ Module 13)      |
| Event cloning deep copy engine                | Workflow definition and step configuration (→ Module 04) |
| Event series and edition management           | Venue/floor plan designer (→ Module 11)                  |
| Year-over-year analytics dashboard            | Communication hub and broadcast (→ Module 14)            |
| Carry-forward participant profiles            | Full analytics platform (→ Module 10)                    |
| Session feedback and micro-surveys            | Catering management (→ Module 11)                        |
| Wayfinding and venue navigation               | Transport booking engine (→ Module 11)                   |
| Push notifications and reminder engine        | Protocol seating arrangement (→ Module 12)               |
| iCal export and calendar sync                 | Accommodation booking (→ Module 11)                      |

### 1.3 Key Personas

| Persona                    | Description                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Participant**            | Any registered attendee — head of state, minister, delegate, observer, or media member                 |
| **Delegation Focal Point** | Manages registration for their country's delegation; sees aggregated status for all delegation members |
| **Companion**              | Spouse or family member of a VIP; has separate agenda focused on companion program events              |
| **Event Admin**            | Configures event settings, monitors demand analytics, manages event cloning and series                 |
| **Series Manager**         | Oversees multi-edition events; responsible for YoY analytics and configuration carry-forward           |
| **Returning Participant**  | Someone who attended a previous edition; benefits from pre-filled data and institutional memory        |

### 1.4 Design Principles

| Principle                | Description                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Mobile-First**         | All participant interfaces designed for mobile screens first, progressively enhanced for desktop             |
| **Offline-Capable**      | Critical features (badge display, agenda, venue map) work without network connectivity                       |
| **Zero-Install**         | PWA approach — participants access via browser URL, no app store download required                           |
| **Privacy by Default**   | Networking directory visibility is opt-in; contact exchange requires explicit consent                        |
| **Institutional Memory** | Event series preserve configuration and participant data across editions                                     |
| **Real-Time Awareness**  | Schedule changes, room swaps, and alerts propagate instantly via SSE/push notifications                      |
| **Accessibility**        | WCAG 2.1 AA compliance including screen reader support, high contrast, and large touch targets               |
| **Multi-Language**       | Participant UI available in all AU working languages (English, French, Arabic, Portuguese, Spanish, Swahili) |

---

## 2. Architecture

### 2.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PARTICIPANT EXPERIENCE LAYER                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  Participant PWA      │  │  Self-Service Portal  │  │  Digital Badge  │   │
│  │  (React + Service    │  │  (React Router 7)     │  │  Wallet Engine  │   │
│  │   Worker + Cache)    │  │                       │  │                 │   │
│  └──────────┬───────────┘  └──────────┬────────────┘  └────────┬────────┘   │
│             │                         │                        │            │
│  ┌──────────┴─────────────────────────┴────────────────────────┴─────────┐  │
│  │                     Participant API Gateway                            │  │
│  │  (Scoped endpoints — participant can only access own data)            │  │
│  └──────────┬────────────────────────────────────────────────────────────┘  │
│             │                                                               │
│  ┌──────────┴───────────────────────────────────────────────────────────┐   │
│  │                     Participant Service Layer                         │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐               │   │
│  │  │ Agenda      │  │ Badge        │  │ Networking    │               │   │
│  │  │ Service     │  │ Service      │  │ Service       │               │   │
│  │  └─────────────┘  └──────────────┘  └───────────────┘               │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐               │   │
│  │  │ Status      │  │ Wayfinding   │  │ Notification  │               │   │
│  │  │ Tracker     │  │ Service      │  │ Service       │               │   │
│  │  └─────────────┘  └──────────────┘  └───────────────┘               │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐               │   │
│  │  │ Feedback    │  │ Calendar     │  │ Contact       │               │   │
│  │  │ Service     │  │ Sync Service │  │ Exchange Svc  │               │   │
│  │  └─────────────┘  └──────────────┘  └───────────────┘               │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        EVENT CONTINUITY LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  Event Clone Engine   │  │  Series Manager      │  │  YoY Analytics  │   │
│  │  (Deep copy with     │  │  (Edition lifecycle   │  │  (Cross-edition │   │
│  │   FK remapping)      │  │   and linking)        │  │   comparisons)  │   │
│  └──────────┬───────────┘  └──────────┬────────────┘  └────────┬────────┘   │
│             │                         │                        │            │
│  ┌──────────┴─────────────────────────┴────────────────────────┴─────────┐  │
│  │                    Carry-Forward Engine                                │  │
│  │  (Participant profile migration, pre-fill, delegation import)         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Module 09:      │  │ Module 11:      │  │ Module 12:      │
│ Registration    │  │ Logistics &     │  │ Protocol &      │
│ & Accreditation │  │ Venue           │  │ Diplomacy       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Data Flow — Participant Lifecycle

```
PRE-EVENT                        DURING EVENT                    POST-EVENT
─────────────────────────       ─────────────────────────       ──────────────────

 Registration      ──┐          Badge Scan         ──┐          Certificate
 Submitted           │           at Gate              │          Download
       │             │              │                 │              │
       ▼             │              ▼                 │              ▼
 Status Tracker    ──┤          Access Granted      ──┤          Contact Export
 (Real-time SSE)     │              │                 │          (.vcf vCard)
       │             │              ▼                 │              │
       ▼             │          Personal Agenda     ──┤              ▼
 Document Upload   ──┤          (Live schedule)       │          Post-Event
 (Camera capture)    │              │                 │          Survey
       │             │              ▼                 │              │
       ▼             │          Session Check-in   ──┤              ▼
 Badge Provisioned ──┤          (QR scan)             │          YoY Analytics
 (Wallet pass)       │              │                 │          (Admin view)
       │             │              ▼                 │              │
       ▼             │          Micro-Feedback     ──┤              ▼
 Agenda Browse     ──┤          (Post-session)        │          Carry-Forward
 (Pre-event)         │              │                 │          (Next edition)
       │             │              ▼                 │
       ▼             │          Networking         ──┤
 Travel Info       ──┘          & Contact Exchange ──┘
 (View only)
```

### 2.3 Technology Stack

| Layer             | Technology                            | Purpose                                                    |
| ----------------- | ------------------------------------- | ---------------------------------------------------------- |
| **PWA Shell**     | React 18 + Vite + Workbox             | Service worker registration, offline caching, app manifest |
| **Routing**       | React Router 7                        | Client-side navigation, lazy-loaded routes                 |
| **State**         | TanStack Query + Zustand              | Server state caching, offline-first sync, local UI state   |
| **UI Components** | Radix UI + Tailwind CSS               | Accessible primitives, responsive design, theme tokens     |
| **QR Scanning**   | html5-qrcode                          | Camera-based QR code scanning for contact exchange         |
| **Wallet**        | passkit-generator / Google Wallet API | Apple/Google Wallet pass generation                        |
| **Calendar**      | ical-generator                        | iCal (.ics) file generation for agenda export              |
| **Maps**          | Leaflet + Indoor Tiles                | Venue floor plan navigation, wayfinding overlays           |
| **Push**          | Web Push API + VAPID                  | Background push notifications for schedule changes         |
| **Encryption**    | crypto (Node.js built-in)             | AES-256-GCM QR payload encryption                          |
| **Real-time**     | Server-Sent Events (SSE)              | Live status updates, schedule change broadcasts            |
| **Clone Engine**  | pg-boss + Prisma Transactions         | Background job processing for deep clone operations        |
| **Analytics**     | Custom aggregation views              | Year-over-year comparison across event editions            |

### 2.4 PWA Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  App Shell (HTML + CSS + JS — cached on install)    │    │
│  │  ┌───────────┐ ┌───────────┐ ┌────────────────┐    │    │
│  │  │ Navigation│ │ Layout    │ │ Offline Banner │    │    │
│  │  │ Tabs      │ │ Framework │ │ & Sync Status  │    │    │
│  │  └───────────┘ └───────────┘ └────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Service Worker (Workbox)                            │    │
│  │                                                      │    │
│  │  Strategies:                                         │    │
│  │  ├─ CacheFirst: App shell, fonts, icons, venue maps │    │
│  │  ├─ StaleWhileRevalidate: Agenda, profile data      │    │
│  │  ├─ NetworkFirst: Notifications, real-time status   │    │
│  │  └─ NetworkOnly: Contact exchange, feedback submit  │    │
│  │                                                      │    │
│  │  Background Sync:                                    │    │
│  │  ├─ Queue offline feedback submissions              │    │
│  │  ├─ Queue contact exchange records                  │    │
│  │  └─ Retry failed document uploads                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  IndexedDB (Dexie.js wrapper)                       │    │
│  │                                                      │    │
│  │  Tables:                                             │    │
│  │  ├─ agenda: PersonalAgenda items (synced)           │    │
│  │  ├─ badge: DigitalBadge data + QR payload           │    │
│  │  ├─ contacts: ContactExchange records (synced)      │    │
│  │  ├─ venueMap: Floor plan tiles + zone metadata      │    │
│  │  ├─ notifications: Push notification history        │    │
│  │  └─ pendingActions: Offline queue for sync          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Web App Manifest                                    │    │
│  │                                                      │    │
│  │  {                                                   │    │
│  │    "name": "AU Summit 2026",                        │    │
│  │    "short_name": "AU Summit",                       │    │
│  │    "start_url": "/participant",                     │    │
│  │    "display": "standalone",                         │    │
│  │    "theme_color": "#006B3F",                        │    │
│  │    "background_color": "#FFFFFF",                   │    │
│  │    "orientation": "portrait",                       │    │
│  │    "icons": [...],                                  │    │
│  │    "screenshots": [...]                             │    │
│  │  }                                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 Event Continuity Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENT CONTINUITY SYSTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EventSeries                                                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  "AU Summit"                                                    │  │
│  │                                                                  │  │
│  │  Edition 35 (2023)    Edition 36 (2024)    Edition 37 (2025)    │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │  │
│  │  │ Addis Ababa  │    │ Addis Ababa  │    │ Addis Ababa  │      │  │
│  │  │ 1,542 reg    │    │ 1,687 reg    │    │ 1,847 reg    │      │  │
│  │  │ 52 countries │    │ 54 countries │    │ 55 countries │      │  │
│  │  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │  │
│  │         │    Clone ──────►  │    Clone ──────►  │              │  │
│  │         │                   │                   │              │  │
│  │         └───────────────────┴───────────────────┘              │  │
│  │                    YoY Analytics View                           │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Clone Operation Pipeline                                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │  1. Initiate     2. Deep Copy      3. Remap FKs    4. Verify   │  │
│  │  ┌─────────┐    ┌─────────────┐   ┌───────────┐   ┌─────────┐ │  │
│  │  │ Create  │───►│ Copy each   │──►│ Generate  │──►│ Validate│ │  │
│  │  │ Clone   │    │ selected    │   │ new IDs,  │   │ refs &  │ │  │
│  │  │ Operation│    │ element     │   │ update    │   │ complete│ │  │
│  │  │         │    │ category    │   │ all refs  │   │ audit   │ │  │
│  │  └─────────┘    └─────────────┘   └───────────┘   └─────────┘ │  │
│  │                                                                  │  │
│  │  Elements: Workflows│Forms│Badges│Invitations│Protocol│Seating  │  │
│  │            Hotels│Shuttles│Access Restrictions│Custom Fields     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PARTICIPANT EXPERIENCE DATA MODEL                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │   EventSeries    │────1:N──│  EventEdition    │                          │
│  │  ─────────────── │         │  ─────────────── │                          │
│  │  id              │         │  id              │                          │
│  │  tenantId        │         │  seriesId   (FK) │                          │
│  │  name            │         │  eventId   (FK)  │                          │
│  │  description     │         │  editionNumber   │                          │
│  │  createdAt       │         │  year            │                          │
│  │  updatedAt       │         │  hostCountry     │                          │
│  └──────────────────┘         │  hostCity        │                          │
│                               └──────────────────┘                          │
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │  CloneOperation  │         │  CloneElement    │                          │
│  │  ─────────────── │────1:N──│  ─────────────── │                          │
│  │  id              │         │  id              │                          │
│  │  tenantId        │         │  cloneOpId  (FK) │                          │
│  │  sourceEventId   │         │  elementType     │                          │
│  │  targetEventId   │         │  sourceId        │                          │
│  │  status          │         │  targetId        │                          │
│  │  options         │         │  status          │                          │
│  │  elementsCopied  │         │  errorMessage    │                          │
│  │  errorLog        │         │  copiedAt        │                          │
│  │  startedAt       │         └──────────────────┘                          │
│  │  completedAt     │                                                        │
│  │  createdBy       │                                                        │
│  └──────────────────┘                                                        │
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │  Participant     │────1:N──│  PersonalAgenda  │                          │
│  │  (from Module 09)│         │  ─────────────── │                          │
│  │                  │         │  id              │                          │
│  │                  │────1:1──│  participantId   │                          │
│  │                  │    │    │  meetingId  (FK) │                          │
│  │                  │    │    │  status          │                          │
│  │                  │    │    │  reminder        │                          │
│  │                  │    │    │  reminderMinutes │                          │
│  │                  │    │    │  notes           │                          │
│  │                  │    │    └──────────────────┘                          │
│  │                  │    │                                                    │
│  │                  │    │    ┌──────────────────┐                          │
│  │                  │    └───│  DigitalBadge    │                          │
│  │                  │         │  ─────────────── │                          │
│  │                  │         │  id              │                          │
│  │                  │         │  participantId   │                          │
│  │                  │         │  walletPassUrl   │                          │
│  │                  │         │  walletPassType  │                          │
│  │                  │         │  qrPayload       │                          │
│  │                  │         │  isActive        │                          │
│  │                  │         │  lastScannedAt   │                          │
│  │                  │         │  generatedAt     │                          │
│  │                  │         └──────────────────┘                          │
│  │                  │                                                        │
│  │                  │────1:N──┌──────────────────┐                          │
│  │                  │         │ NetworkingRequest│                          │
│  │                  │         │  ─────────────── │                          │
│  │                  │         │  id              │                          │
│  │                  │         │  fromParticipant │                          │
│  │                  │         │  toParticipant   │                          │
│  │                  │         │  status          │                          │
│  │                  │         │  message         │                          │
│  │                  │         │  proposedTime    │                          │
│  │                  │         │  proposedLocation│                          │
│  │                  │         └──────────────────┘                          │
│  │                  │                                                        │
│  │                  │────1:N──┌──────────────────┐                          │
│  │                  │         │ ContactExchange  │                          │
│  │                  │         │  ─────────────── │                          │
│  │                  │         │  id              │                          │
│  │                  │         │  participantId   │                          │
│  │                  │         │  scannedPartId   │                          │
│  │                  │         │  scannedAt       │                          │
│  └──────────────────┘         └──────────────────┘                          │
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │ SessionFeedback  │         │ ParticipantNotif │                          │
│  │  ─────────────── │         │  ─────────────── │                          │
│  │  id              │         │  id              │                          │
│  │  participantId   │         │  participantId   │                          │
│  │  meetingId       │         │  type            │                          │
│  │  rating          │         │  title           │                          │
│  │  comment         │         │  body            │                          │
│  │  isAnonymous     │         │  data            │                          │
│  │  submittedAt     │         │  readAt          │                          │
│  └──────────────────┘         │  pushSentAt      │                          │
│                               │  createdAt       │                          │
│                               └──────────────────┘                          │
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │ CarryForwardMap  │         │ ParticipantPref  │                          │
│  │  ─────────────── │         │  ─────────────── │                          │
│  │  id              │         │  id              │                          │
│  │  seriesId        │         │  participantId   │                          │
│  │  sourceEditionId │         │  language        │                          │
│  │  targetEditionId │         │  timezone        │                          │
│  │  participantEmail│         │  notifySchedule  │                          │
│  │  sourcePartId    │         │  notifyNetwork   │                          │
│  │  targetPartId    │         │  networkVisible  │                          │
│  │  dataCarried     │         │  calendarSync    │                          │
│  │  createdAt       │         │  theme           │                          │
│  └──────────────────┘         └──────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Prisma Schema — Source Models (Verbatim)

#### 3.2.1 Event Series & Cloning

```prisma
// ─── Enums ────────────────────────────────────────────────────

enum CloneStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  ROLLED_BACK
}

// ─── Event Series ─────────────────────────────────────────────

model EventSeries {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   // "AU Summit", "Annual Conference"
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  editions    EventEdition[]

  @@unique([tenantId, name])
}

model EventEdition {
  id            String      @id @default(cuid())
  seriesId      String
  series        EventSeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  eventId       String      @unique // Links to the Event model
  editionNumber Int         // 34, 35, 36...
  year          Int
  hostCountry   String?
  hostCity      String?
  notes         String?
  createdAt     DateTime    @default(now())

  @@unique([seriesId, editionNumber])
  @@index([seriesId, year])
}

// ─── Clone Operations ─────────────────────────────────────────

model CloneOperation {
  id              String      @id @default(cuid())
  tenantId        String
  sourceEventId   String
  targetEventId   String?     // Created during clone
  status          CloneStatus
  options         Json        // { workflows: true, forms: true, badges: true, invitations: true, restrictions: true, protocolRanks: true }
  elementsCopied  Json?       // { workflows: 5, forms: 3, badges: 2, ... }
  errorLog        String?
  startedAt       DateTime    @default(now())
  completedAt     DateTime?
  createdBy       String

  @@index([tenantId, status])
}
```

#### 3.2.2 Participant Experience Models

```prisma
// ─── Personal Agenda ──────────────────────────────────────────

model PersonalAgenda {
  id            String   @id @default(cuid())
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  meetingId     String
  meeting       Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  status        String   // INTERESTED, CONFIRMED, ATTENDED, CANCELLED
  reminder      Boolean  @default(true)
  reminderMinutes Int    @default(15)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([participantId, meetingId])
  @@index([participantId, status])
  @@index([meetingId])
}

// ─── Digital Badge ────────────────────────────────────────────

model DigitalBadge {
  id              String   @id @default(cuid())
  participantId   String   @unique
  participant     Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  walletPassUrl   String?  // Apple Wallet .pkpass or Google Wallet JWT URL
  walletPassType  String?  // APPLE, GOOGLE
  qrPayload       String   // Encrypted payload for QR scanning
  isActive        Boolean  @default(true)
  lastScannedAt   DateTime?
  generatedAt     DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ─── Networking ───────────────────────────────────────────────

model NetworkingRequest {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  fromParticipantId String
  fromParticipant Participant @relation("NetworkingFrom", fields: [fromParticipantId], references: [id], onDelete: Cascade)
  toParticipantId String
  toParticipant   Participant @relation("NetworkingTo", fields: [toParticipantId], references: [id], onDelete: Cascade)
  status          String   // PENDING, ACCEPTED, DECLINED, EXPIRED
  message         String?
  proposedTime    DateTime?
  proposedLocation String?
  respondedAt     DateTime?
  createdAt       DateTime @default(now())

  @@unique([fromParticipantId, toParticipantId, eventId])
  @@index([toParticipantId, status])
}

model ContactExchange {
  id              String   @id @default(cuid())
  participantId   String
  scannedParticipantId String
  scannedAt       DateTime @default(now())

  @@unique([participantId, scannedParticipantId])
  @@index([participantId])
}
```

### 3.3 Enhanced Models — Architectural Additions

#### 3.3.1 Clone Element Tracking

```prisma
// ─── Granular clone element tracking ──────────────────────────

enum CloneElementType {
  WORKFLOW
  WORKFLOW_STEP
  FORM_TEMPLATE
  FORM_PAGE
  FORM_SECTION
  FORM_FIELD
  BADGE_TEMPLATE
  INVITATION_QUOTA
  INVITATION_RECIPIENT
  ACCESS_RESTRICTION
  PROTOCOL_RANK
  SEATING_RULE
  ACCOMMODATION_BLOCK
  SHUTTLE_ROUTE
  CUSTOM_FIELD_DEF
  CUSTOM_OBJECT_DEF
}

enum CloneElementStatus {
  PENDING
  COPIED
  REMAPPED
  FAILED
  SKIPPED
}

model CloneElement {
  id            String              @id @default(cuid())
  cloneOpId     String
  cloneOp       CloneOperation      @relation(fields: [cloneOpId], references: [id], onDelete: Cascade)
  elementType   CloneElementType
  sourceId      String              // ID in source event
  targetId      String?             // ID in target event (after copy)
  status        CloneElementStatus  @default(PENDING)
  errorMessage  String?
  copiedAt      DateTime?

  @@index([cloneOpId, elementType])
  @@index([cloneOpId, status])
}
```

#### 3.3.2 Session Feedback & Micro-Surveys

```prisma
// ─── Session Feedback ─────────────────────────────────────────

model SessionFeedback {
  id            String   @id @default(cuid())
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  meetingId     String
  meeting       Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  rating        Int      // 1-5 stars
  comment       String?  // Optional free-text
  isAnonymous   Boolean  @default(false)
  tags          Json     @default("[]") // ["informative", "well-organized", "too-long"]
  submittedAt   DateTime @default(now())

  @@unique([participantId, meetingId])
  @@index([meetingId, rating])
  @@index([meetingId, submittedAt])
}
```

#### 3.3.3 Participant Notifications

```prisma
// ─── Notification enums ───────────────────────────────────────

enum ParticipantNotificationType {
  SCHEDULE_CHANGE       // Session time/room changed
  SESSION_REMINDER      // 15 min before your session
  STATUS_UPDATE         // Registration status changed
  NETWORKING_REQUEST    // Someone wants to connect
  NETWORKING_RESPONSE   // Your request was accepted/declined
  CONTACT_EXCHANGE      // Someone saved your contact
  DOCUMENT_REQUEST      // Missing document reminder
  BADGE_READY           // Digital badge available
  TRANSPORT_UPDATE      // Driver/shuttle change
  EMERGENCY_ALERT       // Security/weather alert
  GENERAL_ANNOUNCEMENT  // Admin broadcast
  SURVEY_AVAILABLE      // Post-session/event survey
  ROOM_CHANGE           // Meeting room reassignment
}

model ParticipantNotification {
  id              String                       @id @default(cuid())
  participantId   String
  participant     Participant                  @relation(fields: [participantId], references: [id], onDelete: Cascade)
  type            ParticipantNotificationType
  title           String
  body            String
  data            Json?                        // { meetingId, networkingRequestId, etc. }
  actionUrl       String?                      // Deep link within PWA
  priority        String                       @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  readAt          DateTime?
  dismissedAt     DateTime?
  pushSentAt      DateTime?                    // When web push was sent
  pushDeliveredAt DateTime?                    // When push was confirmed delivered
  createdAt       DateTime                     @default(now())

  @@index([participantId, readAt])
  @@index([participantId, type])
  @@index([createdAt])
}
```

#### 3.3.4 Participant Preferences

```prisma
// ─── Participant Preferences ──────────────────────────────────

model ParticipantPreference {
  id              String   @id @default(cuid())
  participantId   String   @unique
  participant     Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  // Display
  language        String   @default("en")     // UI language (en, fr, ar, pt, es, sw)
  timezone        String   @default("UTC")    // For time display
  theme           String   @default("system") // light, dark, system

  // Notifications
  notifySchedule  Boolean  @default(true)     // Schedule change alerts
  notifyNetwork   Boolean  @default(true)     // Networking request alerts
  notifyReminders Boolean  @default(true)     // Session reminders
  reminderMinutes Int      @default(15)       // Default reminder lead time

  // Privacy
  networkVisible  Boolean  @default(false)    // Visible in networking directory
  showOrganization Boolean @default(true)     // Show org in public profile
  showTitle       Boolean  @default(true)     // Show title in public profile
  showPhoto       Boolean  @default(true)     // Show photo in public profile

  // Calendar
  calendarSync    Boolean  @default(false)    // Auto-sync agenda changes
  calendarUrl     String?                     // External calendar webhook URL

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### 3.3.5 Carry-Forward Mapping

```prisma
// ─── Carry-Forward ────────────────────────────────────────────

enum CarryForwardStatus {
  MAPPED          // Contact identified in previous edition
  INVITED         // Invitation sent for new edition
  PRE_FILLED      // Registration pre-filled with previous data
  REGISTERED      // Participant completed registration
  DECLINED        // Participant declined this edition
}

model CarryForwardMap {
  id                String              @id @default(cuid())
  seriesId          String
  series            EventSeries         @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  sourceEditionId   String              // Previous edition
  targetEditionId   String              // New edition
  participantEmail  String              // Canonical identifier
  sourceParticipantId String            // Participant ID in previous edition
  targetParticipantId String?           // Participant ID in new edition (once registered)
  status            CarryForwardStatus  @default(MAPPED)
  dataCarried       Json?               // { name, passport, org, country, dietaryReqs, ... }
  invitedAt         DateTime?
  registeredAt      DateTime?
  createdAt         DateTime            @default(now())

  @@unique([seriesId, sourceEditionId, targetEditionId, participantEmail])
  @@index([targetEditionId, status])
  @@index([participantEmail])
}
```

#### 3.3.6 Push Subscription

```prisma
// ─── Web Push Subscriptions ──────────────────────────────────

model PushSubscription {
  id              String   @id @default(cuid())
  participantId   String
  participant     Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  endpoint        String   // Web Push endpoint URL
  p256dh          String   // Client public key
  auth            String   // Auth secret
  userAgent       String?  // Device info for targeting
  isActive        Boolean  @default(true)
  subscribedAt    DateTime @default(now())
  lastUsedAt      DateTime?

  @@unique([participantId, endpoint])
  @@index([participantId, isActive])
}
```

### 3.4 Index Strategy

```sql
-- ═══════════════════════════════════════════════════════════════
-- PARTICIPANT EXPERIENCE INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Event Series & Editions
CREATE INDEX idx_event_edition_series_year
  ON "EventEdition" ("seriesId", "year");
CREATE UNIQUE INDEX idx_event_edition_event
  ON "EventEdition" ("eventId");

-- Clone Operations
CREATE INDEX idx_clone_op_tenant_status
  ON "CloneOperation" ("tenantId", "status");
CREATE INDEX idx_clone_element_op_type
  ON "CloneElement" ("cloneOpId", "elementType");

-- Personal Agenda — participant's schedule view
CREATE INDEX idx_personal_agenda_participant
  ON "PersonalAgenda" ("participantId", "status");
CREATE INDEX idx_personal_agenda_meeting
  ON "PersonalAgenda" ("meetingId");

-- Digital Badge — lookup by participant
CREATE UNIQUE INDEX idx_digital_badge_participant
  ON "DigitalBadge" ("participantId");

-- Networking — incoming requests for a participant
CREATE INDEX idx_networking_to_status
  ON "NetworkingRequest" ("toParticipantId", "status");
CREATE UNIQUE INDEX idx_networking_unique_pair
  ON "NetworkingRequest" ("fromParticipantId", "toParticipantId", "eventId");

-- Contact Exchange — participant's collected contacts
CREATE INDEX idx_contact_exchange_participant
  ON "ContactExchange" ("participantId");

-- Session Feedback — analytics per meeting
CREATE INDEX idx_session_feedback_meeting
  ON "SessionFeedback" ("meetingId", "rating");
CREATE INDEX idx_session_feedback_time
  ON "SessionFeedback" ("meetingId", "submittedAt");

-- Notifications — unread count query
CREATE INDEX idx_notification_participant_unread
  ON "ParticipantNotification" ("participantId", "readAt")
  WHERE "readAt" IS NULL;

-- Notifications — by type for filtering
CREATE INDEX idx_notification_participant_type
  ON "ParticipantNotification" ("participantId", "type");

-- Carry-Forward — lookup by edition
CREATE INDEX idx_carry_forward_target
  ON "CarryForwardMap" ("targetEditionId", "status");
CREATE INDEX idx_carry_forward_email
  ON "CarryForwardMap" ("participantEmail");

-- Push Subscriptions — active for participant
CREATE INDEX idx_push_sub_participant_active
  ON "PushSubscription" ("participantId", "isActive")
  WHERE "isActive" = true;
```

### 3.5 Data Lifecycle

| Entity                  | Retention                | Archival Strategy                                              |
| ----------------------- | ------------------------ | -------------------------------------------------------------- |
| EventSeries             | Permanent                | Core reference data — never deleted                            |
| EventEdition            | Permanent                | Linked to Event; archived when event is archived               |
| CloneOperation          | 2 years                  | Audit trail; compressed after 90 days                          |
| CloneElement            | 90 days                  | Detailed tracking only needed for troubleshooting              |
| PersonalAgenda          | Event duration + 30 days | Deleted with event cleanup batch                               |
| DigitalBadge            | Event duration + 90 days | QR payload invalidated immediately after event                 |
| NetworkingRequest       | Event duration + 30 days | Anonymized after event (names → hashes)                        |
| ContactExchange         | Event duration + 30 days | Participant can export before deletion                         |
| SessionFeedback         | 1 year                   | Aggregated statistics retained; individual comments anonymized |
| ParticipantNotification | Event duration + 7 days  | Bulk deleted after event conclusion                            |
| ParticipantPreference   | Permanent per tenant     | Follows participant record lifecycle                           |
| CarryForwardMap         | Permanent per series     | Essential for multi-edition continuity                         |
| PushSubscription        | Event duration + 1 day   | Endpoint invalidated and deleted after event                   |

---

## 4. API Specification

### 4.1 Route Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  PARTICIPANT EXPERIENCE API ROUTES                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Participant Portal (Participant-Scoped — can only access own data)          │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/profile                  → Own profile & status     │
│  PATCH  /api/participant/profile                  → Update profile fields    │
│  GET    /api/participant/status                   → Registration status      │
│  POST   /api/participant/documents                → Upload missing document  │
│                                                                              │
│  Personal Agenda                                                             │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/agenda                   → Full agenda for dates    │
│  GET    /api/participant/agenda/:date             → Agenda for specific day  │
│  POST   /api/participant/agenda/:meetingId        → Add session to agenda   │
│  PATCH  /api/participant/agenda/:meetingId        → Update status/reminder  │
│  DELETE /api/participant/agenda/:meetingId        → Remove from agenda      │
│  GET    /api/participant/agenda/export/ical       → Export as .ics file     │
│  GET    /api/participant/schedule                 → Full event schedule     │
│  GET    /api/participant/schedule/:meetingId      → Session details         │
│                                                                              │
│  Digital Badge                                                               │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/badge                    → Badge data + QR         │
│  GET    /api/participant/badge/wallet/apple       → Apple Wallet .pkpass    │
│  GET    /api/participant/badge/wallet/google      → Google Wallet JWT URL   │
│  POST   /api/participant/badge/refresh            → Regenerate QR payload   │
│                                                                              │
│  Networking                                                                  │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/directory                → Opt-in participants     │
│  GET    /api/participant/directory/:id            → Public profile          │
│  POST   /api/participant/networking/request       → Send meeting request    │
│  GET    /api/participant/networking/requests       → List my requests       │
│  PATCH  /api/participant/networking/requests/:id  → Accept/decline          │
│  POST   /api/participant/contacts/exchange        → Save scanned contact   │
│  GET    /api/participant/contacts                 → My collected contacts   │
│  GET    /api/participant/contacts/export/vcard    → Export as .vcf          │
│                                                                              │
│  Feedback                                                                    │
│  ────────────────────────────────────────────────────────────────────        │
│  POST   /api/participant/feedback/:meetingId      → Submit session feedback │
│  GET    /api/participant/feedback                 → My submitted feedback   │
│                                                                              │
│  Notifications                                                               │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/notifications            → Notification list       │
│  PATCH  /api/participant/notifications/:id/read   → Mark as read           │
│  POST   /api/participant/notifications/read-all   → Mark all as read       │
│  GET    /api/participant/notifications/unread-count → Badge count           │
│  POST   /api/participant/push/subscribe           → Register push sub      │
│  DELETE /api/participant/push/subscribe           → Unsubscribe push       │
│                                                                              │
│  Preferences                                                                 │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/preferences              → Get preferences        │
│  PATCH  /api/participant/preferences              → Update preferences     │
│                                                                              │
│  Logistics (Read-Only)                                                       │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/transport                 → My transport schedule  │
│  GET    /api/participant/accommodation             → My room assignment    │
│  GET    /api/participant/venue/map                 → Venue floor plans     │
│  GET    /api/participant/venue/wayfinding          → Walking directions    │
│  GET    /api/participant/emergency                 → Emergency contacts    │
│                                                                              │
│  Real-Time (SSE)                                                             │
│  ────────────────────────────────────────────────────────────────────        │
│  GET    /api/participant/events/stream             → SSE for live updates  │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────        │
│  Admin: Event Cloning & Series                                               │
│  ────────────────────────────────────────────────────────────────────        │
│  POST   /api/events/:eventId/clone                → Initiate clone         │
│  GET    /api/events/clone/:cloneId                → Clone operation status │
│  GET    /api/events/clone/:cloneId/elements       → Clone element details │
│  POST   /api/events/clone/:cloneId/rollback       → Rollback failed clone │
│                                                                              │
│  GET    /api/event-series                         → List all series        │
│  POST   /api/event-series                         → Create new series      │
│  GET    /api/event-series/:seriesId               → Series details         │
│  PATCH  /api/event-series/:seriesId               → Update series          │
│  GET    /api/event-series/:seriesId/editions      → List editions          │
│  POST   /api/event-series/:seriesId/editions      → Link event as edition  │
│  GET    /api/event-series/:seriesId/analytics     → YoY comparison         │
│                                                                              │
│  POST   /api/events/:eventId/carry-forward        → Import prev. edition  │
│  GET    /api/events/:eventId/carry-forward/status → Carry-forward progress│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Participant Profile & Status

```typescript
// ─── GET /api/participant/profile ─────────────────────────────

interface ParticipantProfileResponse {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  title: string;
  organization: string;
  country: string;
  participantType: string;
  accessLevel: string;
  status: string; // PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, BADGE_PRINTED
  registrationCode: string;
  photo: string | null;
  delegationName: string | null;
  focalPointName: string | null;
  focalPointEmail: string | null;
  badgeReady: boolean;
  digitalBadgeAvailable: boolean;
}

// ─── GET /api/participant/status ──────────────────────────────

interface RegistrationStatusResponse {
  registrationCode: string;
  currentStep: {
    name: string;
    number: number;
    totalSteps: number;
    assignedTo: string | null; // "First Validator" (anonymized role, not person name)
  };
  timeline: Array<{
    step: string;
    status: "COMPLETED" | "CURRENT" | "PENDING";
    completedAt: string | null;
    note: string | null;
  }>;
  submittedAt: string;
  lastUpdatedAt: string;
  missingDocuments: Array<{
    documentType: string;
    label: string;
    required: boolean;
    uploadUrl: string;
  }>;
  estimatedCompletionDate: string | null;
}
```

### 4.3 Personal Agenda API

```typescript
// ─── GET /api/participant/agenda?from=2026-02-10&to=2026-02-17 ──

interface AgendaResponse {
  dates: Array<{
    date: string; // ISO date
    dayLabel: string; // "Day 1 — Monday, Feb 10"
    items: AgendaItem[];
  }>;
  summary: {
    confirmedCount: number;
    interestedCount: number;
    totalSessions: number;
  };
}

interface AgendaItem {
  meetingId: string;
  title: string;
  type: "SESSION" | "BILATERAL" | "MEAL" | "CEREMONY" | "SOCIAL" | "BREAK" | "TRANSPORT";
  startTime: string;
  endTime: string;
  location: {
    venueName: string;
    roomName: string;
    floorNumber: number | null;
    zoneId: string | null;
  };
  status: "INTERESTED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  attendeeCount: number | null; // null if private meeting
  capacity: number | null;
  walkingTime: number | null; // minutes from previous session location
  walkingFrom: string | null; // previous location name
  personalNotes: {
    mealType: string | null; // "Halal", "Vegetarian"
    seatAssignment: string | null; // "Table 12, Seat 3"
    dressCode: string | null; // "Black tie"
    driverPickup: string | null; // "14:15 from main entrance"
    isStarred: boolean;
  };
  reminder: {
    enabled: boolean;
    minutesBefore: number;
  };
}

// ─── POST /api/participant/agenda/:meetingId ──────────────────

interface AddToAgendaRequest {
  status: "INTERESTED" | "CONFIRMED";
  reminder: boolean;
  reminderMinutes?: number; // default 15
  notes?: string;
}

// Response: 201 Created with AgendaItem

// ─── GET /api/participant/agenda/export/ical ──────────────────

// Returns: text/calendar (.ics file)
// Content-Disposition: attachment; filename="AU-Summit-2026-MyAgenda.ics"
// Includes: All CONFIRMED agenda items with location, description, reminders
```

### 4.4 Digital Badge API

```typescript
// ─── GET /api/participant/badge ───────────────────────────────

interface DigitalBadgeResponse {
  id: string;
  participantName: string;
  title: string;
  organization: string;
  participantType: string;
  accessLevel: string;
  registrationCode: string;
  eventName: string;
  eventDates: { start: string; end: string };
  photo: string; // URL to participant photo
  qrCode: string; // Base64 SVG of QR code (for display)
  isActive: boolean;
  walletOptions: {
    apple: { available: boolean; url: string | null };
    google: { available: boolean; url: string | null };
  };
  lastScannedAt: string | null;
  generatedAt: string;
}

// ─── GET /api/participant/badge/wallet/apple ──────────────────

// Returns: application/vnd.apple.pkpass
// Content-Disposition: attachment; filename="AU-Summit-2026.pkpass"
// The .pkpass file contains:
//   - Event pass with QR barcode
//   - Location triggers for venue proximity
//   - Automatic updates via pass type ID + serial number

// ─── GET /api/participant/badge/wallet/google ─────────────────

// Returns: 302 redirect to Google Wallet save URL
// URL format: https://pay.google.com/gp/v/save/<JWT>
// JWT contains: Event ticket class + object with QR barcode
```

### 4.5 Networking API

```typescript
// ─── GET /api/participant/directory?page=1&limit=20&search=Kenya ──

interface DirectoryResponse {
  participants: Array<{
    id: string;
    name: string;
    title: string | null;
    organization: string | null;
    country: string | null;
    photo: string | null;
    participantType: string;
    isConnected: boolean; // Already exchanged contacts
    hasPendingRequest: boolean; // Meeting request pending
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Note: Only participants with networkVisible=true appear in directory.
// Participant's own entry is excluded.

// ─── POST /api/participant/networking/request ─────────────────

interface NetworkingRequestCreate {
  toParticipantId: string;
  message?: string;
  proposedTime?: string; // ISO datetime
  proposedLocation?: string;
}

// Response: 201 Created with NetworkingRequest

// ─── PATCH /api/participant/networking/requests/:id ───────────

interface NetworkingRequestUpdate {
  action: "ACCEPT" | "DECLINE" | "COUNTER_PROPOSE";
  counterProposedTime?: string;
  counterProposedLocation?: string;
  message?: string;
}

// ─── POST /api/participant/contacts/exchange ──────────────────

interface ContactExchangeRequest {
  qrPayload: string; // Encrypted QR payload scanned from badge
}

interface ContactExchangeResponse {
  success: boolean;
  contact: {
    name: string;
    title: string | null;
    organization: string | null;
    country: string | null;
    photo: string | null;
    participantType: string;
  };
  alreadyExchanged: boolean;
}

// ─── GET /api/participant/contacts/export/vcard ───────────────

// Returns: text/vcard (.vcf file)
// Content-Disposition: attachment; filename="AU-Summit-2026-Contacts.vcf"
// Each contact as vCard 3.0 entry:
// BEGIN:VCARD
// VERSION:3.0
// FN:H.E. John Doe
// ORG:Republic of Kenya
// TITLE:Minister of Foreign Affairs
// END:VCARD
```

### 4.6 Feedback API

```typescript
// ─── POST /api/participant/feedback/:meetingId ────────────────

interface SessionFeedbackRequest {
  rating: number; // 1-5
  comment?: string;
  isAnonymous?: boolean; // default false
  tags?: string[]; // ["informative", "well-organized", "too-long", "great-speaker"]
}

// Response: 201 Created
// Validation: Can only submit within 24 hours after session end
// Validation: One feedback per participant per session

// ─── GET /api/participant/feedback ────────────────────────────

interface MyFeedbackResponse {
  feedback: Array<{
    meetingId: string;
    meetingTitle: string;
    meetingDate: string;
    rating: number;
    comment: string | null;
    tags: string[];
    submittedAt: string;
  }>;
}
```

### 4.7 Notification & Push API

```typescript
// ─── GET /api/participant/notifications?unread=true&type=SCHEDULE_CHANGE ──

interface NotificationListResponse {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    data: Record<string, unknown>;
    actionUrl: string | null;
    readAt: string | null;
    createdAt: string;
  }>;
  pagination: { page: number; limit: number; total: number };
  unreadCount: number;
}

// ─── POST /api/participant/push/subscribe ─────────────────────

interface PushSubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent?: string;
}

// Response: 201 Created
```

### 4.8 Event Cloning API (Admin)

```typescript
// ─── POST /api/events/:eventId/clone ──────────────────────────

interface CloneEventRequest {
  name: string; // "38th AU Summit"
  startDate: string; // ISO date
  endDate: string; // ISO date
  options: {
    workflows: boolean;
    forms: boolean;
    badges: boolean;
    invitations: boolean;
    invitationRecipients: boolean; // Carry forward contacts
    accessRestrictions: boolean;
    protocolRanks: boolean;
    seatingRules: boolean;
    accommodationBlocks: boolean;
    shuttleRoutes: boolean;
    customFields: boolean;
  };
  series?: {
    seriesId: string;
    editionNumber: number;
  };
}

interface CloneEventResponse {
  cloneOperationId: string;
  status: "PENDING";
  estimatedDuration: number; // seconds
  pollUrl: string; // GET /api/events/clone/:cloneId
}

// ─── GET /api/events/clone/:cloneId ───────────────────────────

interface CloneStatusResponse {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
  sourceEventId: string;
  sourceEventName: string;
  targetEventId: string | null;
  targetEventName: string | null;
  progress: {
    totalElements: number;
    copiedElements: number;
    failedElements: number;
    percentage: number;
  };
  elementsCopied: Record<string, number>; // { workflows: 5, forms: 3, ... }
  errorLog: string | null;
  startedAt: string;
  completedAt: string | null;
  duration: number | null; // seconds
}
```

### 4.9 Event Series & YoY Analytics API (Admin)

```typescript
// ─── GET /api/event-series/:seriesId/analytics ────────────────

interface YoYAnalyticsResponse {
  seriesName: string;
  editions: Array<{
    editionNumber: number;
    year: number;
    hostCity: string | null;
    hostCountry: string | null;
    eventId: string;
    metrics: {
      totalRegistrations: number;
      approvalRate: number; // percentage
      avgApprovalTimeHours: number;
      badgeCollectionRate: number; // percentage
      noShowRate: number; // percentage
      incidentCount: number;
      countryCount: number;
      delegationCount: number;
      sessionCount: number;
      avgSessionRating: number | null; // 1-5
      networkingRequestCount: number;
      contactExchangeCount: number;
    };
  }>;
  trends: {
    registrationGrowth: number; // percentage per year
    noShowTrend: "IMPROVING" | "STABLE" | "DECLINING";
    satisfactionTrend: "IMPROVING" | "STABLE" | "DECLINING";
  };
}

// ─── POST /api/events/:eventId/carry-forward ──────────────────

interface CarryForwardRequest {
  sourceEditionId: string;
  options: {
    importContacts: boolean; // Import participant contact list
    preFillRegistration: boolean; // Pre-fill registration forms
    sendInvitations: boolean; // Auto-send invitations to previous attendees
    filterByStatus: string[]; // Only carry forward participants with these statuses
  };
}

interface CarryForwardResponse {
  totalParticipants: number;
  mapped: number;
  invited: number;
  errors: number;
  operationId: string;
}
```

### 4.10 SSE Event Stream

```typescript
// ─── GET /api/participant/events/stream ───────────────────────

// SSE event types sent to participant:

type ParticipantSSEEvent =
  | {
      type: "schedule:change";
      data: { meetingId: string; field: string; oldValue: string; newValue: string };
    }
  | { type: "schedule:cancel"; data: { meetingId: string; title: string; reason: string } }
  | { type: "room:change"; data: { meetingId: string; oldRoom: string; newRoom: string } }
  | { type: "status:update"; data: { newStatus: string; step: string; note: string | null } }
  | { type: "badge:ready"; data: { badgeId: string; walletAvailable: boolean } }
  | {
      type: "networking:request";
      data: { requestId: string; fromName: string; message: string | null };
    }
  | { type: "networking:response"; data: { requestId: string; toName: string; action: string } }
  | { type: "contact:exchanged"; data: { contactName: string } }
  | { type: "transport:update"; data: { type: string; details: string } }
  | { type: "alert:emergency"; data: { level: string; message: string; instructions: string } }
  | { type: "announcement"; data: { title: string; body: string } };

// Connection management:
// - Authenticated via participant token in query param (SSE doesn't support headers)
// - Heartbeat every 30 seconds
// - Auto-reconnect with Last-Event-ID
// - Max connection duration: 4 hours (reconnect after)
```

### 4.11 Wayfinding API

```typescript
// ─── GET /api/participant/venue/wayfinding?from=zone-a1&to=zone-b3 ──

interface WayfindingResponse {
  from: { zoneId: string; name: string; floor: number };
  to: { zoneId: string; name: string; floor: number };
  estimatedWalkMinutes: number;
  steps: Array<{
    instruction: string; // "Exit Plenary Hall through main doors"
    direction: "STRAIGHT" | "LEFT" | "RIGHT" | "UP" | "DOWN";
    distanceMeters: number;
    floor: number;
    landmark: string | null; // "Past the registration desk"
    accessibility: {
      hasElevator: boolean;
      hasRamp: boolean;
      hasEscalator: boolean;
    };
  }>;
  mapOverlay: {
    pathCoordinates: Array<{ x: number; y: number; floor: number }>;
    floorPlanUrls: Record<number, string>; // floor → image URL
  };
}
```

---

## 5. Business Logic

### 5.1 Event Clone Engine

#### 5.1.1 Deep Clone Algorithm

```typescript
// ─── Deep Clone Service ───────────────────────────────────────

import { prisma } from "~/db.server";
import { createId } from "@paralleldrive/cuid2";
import type { CloneStatus, CloneElementType } from "@prisma/client";

interface CloneOptions {
  workflows: boolean;
  forms: boolean;
  badges: boolean;
  invitations: boolean;
  invitationRecipients: boolean;
  accessRestrictions: boolean;
  protocolRanks: boolean;
  seatingRules: boolean;
  accommodationBlocks: boolean;
  shuttleRoutes: boolean;
  customFields: boolean;
}

interface CloneContext {
  cloneOpId: string;
  sourceEventId: string;
  targetEventId: string;
  dateDelta: number; // milliseconds between old and new start dates
  idMap: Map<string, string>; // sourceId → targetId mapping
}

export class EventCloneService {
  /**
   * Initiates a deep clone operation as a background job.
   * The clone runs within a database transaction with savepoints
   * for each element category, allowing partial rollback.
   */
  async initiateClone(
    tenantId: string,
    sourceEventId: string,
    newName: string,
    startDate: Date,
    endDate: Date,
    options: CloneOptions,
    seriesConfig: { seriesId: string; editionNumber: number } | null,
    createdBy: string,
  ): Promise<{ cloneOperationId: string }> {
    // 1. Create CloneOperation record
    const cloneOp = await prisma.cloneOperation.create({
      data: {
        tenantId,
        sourceEventId,
        status: "PENDING",
        options: options as any,
        createdBy,
      },
    });

    // 2. Queue background job
    await this.jobQueue.send("event:clone", {
      cloneOpId: cloneOp.id,
      tenantId,
      sourceEventId,
      newName,
      startDate,
      endDate,
      options,
      seriesConfig,
    });

    return { cloneOperationId: cloneOp.id };
  }

  /**
   * Background job handler: executes the deep clone.
   */
  async executeClone(jobData: {
    cloneOpId: string;
    tenantId: string;
    sourceEventId: string;
    newName: string;
    startDate: Date;
    endDate: Date;
    options: CloneOptions;
    seriesConfig: { seriesId: string; editionNumber: number } | null;
  }) {
    const {
      cloneOpId,
      tenantId,
      sourceEventId,
      newName,
      startDate,
      endDate,
      options,
      seriesConfig,
    } = jobData;

    // Update status to IN_PROGRESS
    await prisma.cloneOperation.update({
      where: { id: cloneOpId },
      data: { status: "IN_PROGRESS" },
    });

    try {
      await prisma.$transaction(
        async (tx) => {
          // ── Step 1: Get source event ──────────────────────────
          const sourceEvent = await tx.event.findUniqueOrThrow({
            where: { id: sourceEventId },
          });

          // ── Step 2: Calculate date delta ──────────────────────
          const dateDelta = startDate.getTime() - sourceEvent.startDate.getTime();

          // ── Step 3: Create target event ───────────────────────
          const targetEvent = await tx.event.create({
            data: {
              id: createId(),
              tenantId,
              name: newName,
              startDate,
              endDate,
              status: "DRAFT",
              // Copy non-date event configuration
              settings: sourceEvent.settings,
              timezone: sourceEvent.timezone,
              location: sourceEvent.location,
            },
          });

          const ctx: CloneContext = {
            cloneOpId,
            sourceEventId,
            targetEventId: targetEvent.id,
            dateDelta,
            idMap: new Map(),
          };

          // ── Step 4: Clone selected elements ───────────────────
          const elementsCopied: Record<string, number> = {};

          if (options.customFields) {
            elementsCopied.customFields = await this.cloneCustomFields(tx, ctx);
          }
          if (options.workflows) {
            elementsCopied.workflows = await this.cloneWorkflows(tx, ctx);
          }
          if (options.forms) {
            elementsCopied.forms = await this.cloneForms(tx, ctx);
          }
          if (options.badges) {
            elementsCopied.badges = await this.cloneBadgeTemplates(tx, ctx);
          }
          if (options.invitations) {
            elementsCopied.invitations = await this.cloneInvitationQuotas(tx, ctx);
          }
          if (options.invitationRecipients) {
            elementsCopied.recipients = await this.cloneInvitationRecipients(tx, ctx);
          }
          if (options.accessRestrictions) {
            elementsCopied.restrictions = await this.cloneAccessRestrictions(tx, ctx);
          }
          if (options.protocolRanks) {
            elementsCopied.protocolRanks = await this.cloneProtocolRanks(tx, ctx);
          }
          if (options.seatingRules) {
            elementsCopied.seatingRules = await this.cloneSeatingRules(tx, ctx);
          }
          if (options.accommodationBlocks) {
            elementsCopied.accommodations = await this.cloneAccommodationBlocks(tx, ctx);
          }
          if (options.shuttleRoutes) {
            elementsCopied.shuttleRoutes = await this.cloneShuttleRoutes(tx, ctx);
          }

          // ── Step 5: Link to series ────────────────────────────
          if (seriesConfig) {
            await tx.eventEdition.create({
              data: {
                seriesId: seriesConfig.seriesId,
                eventId: targetEvent.id,
                editionNumber: seriesConfig.editionNumber,
                year: startDate.getFullYear(),
              },
            });
          }

          // ── Step 6: Update clone operation ────────────────────
          await tx.cloneOperation.update({
            where: { id: cloneOpId },
            data: {
              targetEventId: targetEvent.id,
              status: "COMPLETED",
              elementsCopied: elementsCopied as any,
              completedAt: new Date(),
            },
          });
        },
        {
          timeout: 120_000, // 2 minute timeout for large events
        },
      );
    } catch (error) {
      await prisma.cloneOperation.update({
        where: { id: cloneOpId },
        data: {
          status: "FAILED",
          errorLog: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Clone workflows: copies all workflow definitions, steps,
   * actions, and conditions. Remaps step references (nextStepId).
   */
  private async cloneWorkflows(tx: any, ctx: CloneContext): Promise<number> {
    const workflows = await tx.workflow.findMany({
      where: { eventId: ctx.sourceEventId },
      include: { steps: { include: { actions: true, conditions: true } } },
    });

    let count = 0;
    for (const workflow of workflows) {
      const newWorkflowId = createId();
      ctx.idMap.set(workflow.id, newWorkflowId);

      // First pass: create steps with placeholder nextStepId
      const stepIdMap = new Map<string, string>();
      for (const step of workflow.steps) {
        const newStepId = createId();
        stepIdMap.set(step.id, newStepId);
        ctx.idMap.set(step.id, newStepId);
      }

      // Create workflow
      await tx.workflow.create({
        data: {
          id: newWorkflowId,
          tenantId: workflow.tenantId,
          eventId: ctx.targetEventId,
          name: workflow.name,
          description: workflow.description,
          version: 1,
          status: "DRAFT",
          settings: workflow.settings,
        },
      });

      // Create steps with remapped references
      for (const step of workflow.steps) {
        const newStepId = stepIdMap.get(step.id)!;
        await tx.workflowStep.create({
          data: {
            id: newStepId,
            workflowId: newWorkflowId,
            name: step.name,
            type: step.type,
            order: step.order,
            nextStepId: step.nextStepId ? stepIdMap.get(step.nextStepId) : null,
            config: step.config,
            slaHours: step.slaHours,
          },
        });

        // Clone step actions
        for (const action of step.actions) {
          await tx.workflowAction.create({
            data: {
              id: createId(),
              stepId: newStepId,
              type: action.type,
              config: action.config,
              order: action.order,
            },
          });
        }
      }

      // Track element
      await tx.cloneElement.create({
        data: {
          cloneOpId: ctx.cloneOpId,
          elementType: "WORKFLOW",
          sourceId: workflow.id,
          targetId: newWorkflowId,
          status: "COPIED",
          copiedAt: new Date(),
        },
      });

      count++;
    }
    return count;
  }

  /**
   * Clone forms: copies form templates, pages, sections, and fields.
   * Remaps conditional visibility references to new field IDs.
   */
  private async cloneForms(tx: any, ctx: CloneContext): Promise<number> {
    const forms = await tx.formTemplate.findMany({
      where: { eventId: ctx.sourceEventId },
      include: {
        pages: {
          include: {
            sections: {
              include: { fields: true },
            },
          },
        },
      },
    });

    let count = 0;
    for (const form of forms) {
      const newFormId = createId();
      ctx.idMap.set(form.id, newFormId);

      // Build field ID map first for conditional visibility remapping
      const fieldIdMap = new Map<string, string>();
      for (const page of form.pages) {
        for (const section of page.sections) {
          for (const field of section.fields) {
            fieldIdMap.set(field.id, createId());
          }
        }
      }

      await tx.formTemplate.create({
        data: {
          id: newFormId,
          tenantId: form.tenantId,
          eventId: ctx.targetEventId,
          name: form.name,
          version: 1,
          status: "DRAFT",
          settings: form.settings,
        },
      });

      for (const page of form.pages) {
        const newPageId = createId();
        await tx.formPage.create({
          data: {
            id: newPageId,
            formId: newFormId,
            title: page.title,
            order: page.order,
          },
        });

        for (const section of page.sections) {
          const newSectionId = createId();
          await tx.formSection.create({
            data: {
              id: newSectionId,
              pageId: newPageId,
              title: section.title,
              order: section.order,
              columns: section.columns,
            },
          });

          for (const field of section.fields) {
            const newFieldId = fieldIdMap.get(field.id)!;
            // Remap conditional visibility references
            let conditions = field.conditions;
            if (conditions && typeof conditions === "object") {
              conditions = this.remapConditionFieldRefs(conditions, fieldIdMap);
            }

            await tx.formField.create({
              data: {
                id: newFieldId,
                sectionId: newSectionId,
                type: field.type,
                label: field.label,
                required: field.required,
                order: field.order,
                config: field.config,
                conditions,
              },
            });
          }
        }
      }

      await tx.cloneElement.create({
        data: {
          cloneOpId: ctx.cloneOpId,
          elementType: "FORM_TEMPLATE",
          sourceId: form.id,
          targetId: newFormId,
          status: "COPIED",
          copiedAt: new Date(),
        },
      });

      count++;
    }
    return count;
  }

  /**
   * Remap field references in conditional visibility rules.
   * Traverses JSON conditions tree, replaces old field IDs with new ones.
   */
  private remapConditionFieldRefs(conditions: any, fieldIdMap: Map<string, string>): any {
    if (Array.isArray(conditions)) {
      return conditions.map((c) => this.remapConditionFieldRefs(c, fieldIdMap));
    }
    if (typeof conditions === "object" && conditions !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(conditions)) {
        if (key === "fieldId" && typeof value === "string") {
          result[key] = fieldIdMap.get(value) || value;
        } else {
          result[key] = this.remapConditionFieldRefs(value, fieldIdMap);
        }
      }
      return result;
    }
    return conditions;
  }

  // Additional clone methods (cloneBadgeTemplates, cloneInvitationQuotas,
  // cloneAccessRestrictions, cloneProtocolRanks, cloneSeatingRules,
  // cloneAccommodationBlocks, cloneShuttleRoutes, cloneCustomFields)
  // follow the same pattern: query source → generate new IDs →
  // remap FK references → insert into target event → track in CloneElement.
}
```

#### 5.1.2 Clone Rollback

```typescript
// ─── Clone Rollback ───────────────────────────────────────────

export class CloneRollbackService {
  /**
   * Rolls back a failed or unwanted clone by deleting all
   * elements tracked in CloneElement records, then the
   * target event itself.
   */
  async rollback(cloneOpId: string): Promise<void> {
    const cloneOp = await prisma.cloneOperation.findUniqueOrThrow({
      where: { id: cloneOpId },
      include: { elements: { where: { status: "COPIED" } } },
    });

    if (!cloneOp.targetEventId) {
      throw new Error("No target event to rollback");
    }

    await prisma.$transaction(async (tx) => {
      // Delete cloned elements in reverse dependency order
      const deleteOrder: CloneElementType[] = [
        "SEATING_RULE",
        "PROTOCOL_RANK",
        "ACCESS_RESTRICTION",
        "INVITATION_RECIPIENT",
        "INVITATION_QUOTA",
        "FORM_FIELD",
        "FORM_SECTION",
        "FORM_PAGE",
        "FORM_TEMPLATE",
        "BADGE_TEMPLATE",
        "WORKFLOW_STEP",
        "WORKFLOW",
        "SHUTTLE_ROUTE",
        "ACCOMMODATION_BLOCK",
        "CUSTOM_FIELD_DEF",
        "CUSTOM_OBJECT_DEF",
      ];

      for (const elementType of deleteOrder) {
        const elements = cloneOp.elements.filter((e) => e.elementType === elementType);
        for (const element of elements) {
          if (element.targetId) {
            try {
              await this.deleteElement(tx, elementType, element.targetId);
            } catch {
              // Element may already be cascade-deleted
            }
          }
        }
      }

      // Delete the target event
      await tx.event.delete({ where: { id: cloneOp.targetEventId! } });

      // Delete edition link if exists
      await tx.eventEdition.deleteMany({
        where: { eventId: cloneOp.targetEventId! },
      });

      // Update clone operation status
      await tx.cloneOperation.update({
        where: { id: cloneOpId },
        data: { status: "ROLLED_BACK", completedAt: new Date() },
      });
    });
  }

  private async deleteElement(tx: any, type: CloneElementType, id: string) {
    const modelMap: Record<string, string> = {
      WORKFLOW: "workflow",
      WORKFLOW_STEP: "workflowStep",
      FORM_TEMPLATE: "formTemplate",
      FORM_PAGE: "formPage",
      FORM_SECTION: "formSection",
      FORM_FIELD: "formField",
      BADGE_TEMPLATE: "badgeTemplate",
      // ... other mappings
    };
    const model = modelMap[type];
    if (model) {
      await (tx as any)[model].delete({ where: { id } });
    }
  }
}
```

### 5.2 Digital Badge Engine

```typescript
// ─── Digital Badge Generation ─────────────────────────────────

import crypto from "crypto";
import { PassKit } from "passkit-generator";

const QR_ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY!; // 32-byte hex
const QR_ENCRYPTION_IV_LENGTH = 16;

export class DigitalBadgeService {
  /**
   * Generates a digital badge when participant is approved.
   * Creates encrypted QR payload and wallet passes.
   */
  async generateBadge(participantId: string): Promise<void> {
    const participant = await prisma.participant.findUniqueOrThrow({
      where: { id: participantId },
      include: { event: true },
    });

    // 1. Generate encrypted QR payload
    const qrPayload = this.encryptQRPayload({
      pid: participant.id,
      eid: participant.eventId,
      al: participant.accessLevel,
      rc: participant.registrationCode,
      ts: Date.now(),
    });

    // 2. Generate Apple Wallet pass
    const applePassUrl = await this.generateApplePass(participant, qrPayload);

    // 3. Generate Google Wallet save URL
    const googlePassUrl = await this.generateGooglePass(participant, qrPayload);

    // 4. Store digital badge
    await prisma.digitalBadge.upsert({
      where: { participantId },
      create: {
        participantId,
        qrPayload,
        walletPassUrl: applePassUrl || googlePassUrl,
        walletPassType: applePassUrl ? "APPLE" : "GOOGLE",
        isActive: true,
      },
      update: {
        qrPayload,
        walletPassUrl: applePassUrl || googlePassUrl,
        walletPassType: applePassUrl ? "APPLE" : "GOOGLE",
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // 5. Send notification
    await this.notificationService.send(participantId, {
      type: "BADGE_READY",
      title: "Your Digital Badge is Ready",
      body: `Your badge for ${participant.event.name} is now available. Add it to your wallet for easy access.`,
      data: { badgeId: participantId, walletAvailable: !!(applePassUrl || googlePassUrl) },
      actionUrl: "/participant/badge",
    });

    // 6. Send email with wallet links
    await this.emailService.send(participant.email, "digital-badge-ready", {
      participantName: participant.name,
      eventName: participant.event.name,
      appleWalletUrl: applePassUrl,
      googleWalletUrl: googlePassUrl,
      portalUrl: `${process.env.APP_URL}/participant/badge`,
    });
  }

  /**
   * Encrypts QR payload using AES-256-GCM.
   * The same payload is used for both physical and digital badges.
   */
  private encryptQRPayload(data: Record<string, unknown>): string {
    const iv = crypto.randomBytes(QR_ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(QR_ENCRYPTION_KEY, "hex"), iv);

    const plaintext = JSON.stringify(data);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all base64)
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  }

  /**
   * Decrypts QR payload scanned from badge (physical or digital).
   * Used by access control scanners and contact exchange.
   */
  static decryptQRPayload(payload: string): {
    pid: string;
    eid: string;
    al: string;
    rc: string;
    ts: number;
  } {
    const [ivB64, authTagB64, ciphertext] = payload.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(QR_ENCRYPTION_KEY, "hex"),
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }

  /**
   * Generates Apple Wallet .pkpass file.
   */
  private async generateApplePass(participant: any, qrPayload: string): Promise<string | null> {
    try {
      const pass = new PassKit({
        model: "./wallet-templates/event-pass.pass",
        certificates: {
          wwdr: process.env.APPLE_WWDR_CERT!,
          signerCert: process.env.APPLE_SIGNER_CERT!,
          signerKey: process.env.APPLE_SIGNER_KEY!,
          signerKeyPassphrase: process.env.APPLE_SIGNER_PASSPHRASE,
        },
      });

      pass.primaryFields([{ key: "participantName", label: "NAME", value: participant.name }]);
      pass.secondaryFields([
        { key: "organization", label: "ORGANIZATION", value: participant.organization },
        { key: "participantType", label: "TYPE", value: participant.participantType },
      ]);
      pass.auxiliaryFields([
        { key: "accessLevel", label: "ACCESS", value: participant.accessLevel },
        { key: "regCode", label: "CODE", value: participant.registrationCode },
      ]);
      pass.barcode({
        format: "PKBarcodeFormatQR",
        message: qrPayload,
        messageEncoding: "iso-8859-1",
      });
      pass.relevantDate(participant.event.startDate);
      pass.locations([
        {
          latitude: 9.0192,
          longitude: 38.7525,
          relevantText: participant.event.name,
        },
      ]);

      const buffer = await pass.generate();
      const blobUrl = await this.blobService.upload(
        `badges/${participant.id}/pass.pkpass`,
        buffer,
        "application/vnd.apple.pkpass",
      );
      return blobUrl;
    } catch (error) {
      console.error("Apple Wallet pass generation failed:", error);
      return null;
    }
  }

  /**
   * Generates Google Wallet save URL via JWT.
   */
  private async generateGooglePass(participant: any, qrPayload: string): Promise<string | null> {
    try {
      const eventTicketObject = {
        id: `${process.env.GOOGLE_WALLET_ISSUER_ID}.${participant.id}`,
        classId: `${process.env.GOOGLE_WALLET_ISSUER_ID}.${participant.eventId}`,
        state: "ACTIVE",
        heroImage: {
          sourceUri: { uri: participant.event.bannerUrl },
        },
        textModulesData: [
          { header: "Name", body: participant.name },
          { header: "Organization", body: participant.organization },
          { header: "Access Level", body: participant.accessLevel },
        ],
        barcode: {
          type: "QR_CODE",
          value: qrPayload,
        },
        ticketHolderName: participant.name,
        eventName: { defaultValue: { language: "en", value: participant.event.name } },
      };

      const jwt = this.googleWalletClient.signJWT(eventTicketObject);
      return `https://pay.google.com/gp/v/save/${jwt}`;
    } catch (error) {
      console.error("Google Wallet pass generation failed:", error);
      return null;
    }
  }

  /**
   * Invalidates a digital badge (e.g., when participant status changes to REJECTED).
   */
  async invalidateBadge(participantId: string, reason: string): Promise<void> {
    await prisma.digitalBadge.updateMany({
      where: { participantId, isActive: true },
      data: { isActive: false, updatedAt: new Date() },
    });

    // Push update to wallet (pass appears "voided")
    await this.pushWalletUpdate(participantId, { isVoided: true });

    await this.notificationService.send(participantId, {
      type: "STATUS_UPDATE",
      title: "Badge Deactivated",
      body: `Your digital badge has been deactivated. Reason: ${reason}`,
      priority: "HIGH",
    });
  }
}
```

### 5.3 Agenda Service

```typescript
// ─── Personal Agenda Service ──────────────────────────────────

export class AgendaService {
  /**
   * Builds the participant's personal agenda by merging data
   * from multiple source systems.
   */
  async getAgenda(
    participantId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<AgendaResponse> {
    const participant = await prisma.participant.findUniqueOrThrow({
      where: { id: participantId },
      include: { event: true },
    });

    // 1. Get participant's personal agenda items
    const agendaItems = await prisma.personalAgenda.findMany({
      where: {
        participantId,
        meeting: {
          startTime: { gte: dateRange.from },
          endTime: { lte: dateRange.to },
        },
      },
      include: {
        meeting: {
          include: { venue: true },
        },
      },
      orderBy: { meeting: { startTime: "asc" } },
    });

    // 2. Get bilateral meetings involving this participant
    const bilaterals = await prisma.bilateralRequest.findMany({
      where: {
        eventId: participant.eventId,
        status: "CONFIRMED",
        OR: [{ requestingCountry: participant.country }, { receivingCountry: participant.country }],
        meeting: {
          startTime: { gte: dateRange.from },
          endTime: { lte: dateRange.to },
        },
      },
      include: { meeting: { include: { venue: true } } },
    });

    // 3. Get transport pickups
    const transports = await prisma.transportRequest.findMany({
      where: {
        participantId,
        pickupTime: { gte: dateRange.from, lte: dateRange.to },
      },
      include: { vehicle: true },
    });

    // 4. Get meal assignments
    const dietaryPref = participant.customData?.dietaryRequirements;

    // 5. Get seating assignments for gala events
    const seatAssignments = await prisma.seatAssignment.findMany({
      where: {
        participantId,
        arrangement: {
          meeting: {
            startTime: { gte: dateRange.from },
            endTime: { lte: dateRange.to },
          },
        },
      },
      include: {
        arrangement: { include: { meeting: true } },
      },
    });

    // 6. Merge all data sources into unified agenda
    const mergedItems = this.mergeAgendaSources(
      agendaItems,
      bilaterals,
      transports,
      seatAssignments,
      dietaryPref,
    );

    // 7. Calculate walking times between consecutive sessions
    const itemsWithWalking = await this.calculateWalkingTimes(mergedItems);

    // 8. Group by date
    return this.groupByDate(itemsWithWalking);
  }

  /**
   * Calculates estimated walking time between consecutive
   * sessions using venue zone adjacency data.
   */
  private async calculateWalkingTimes(items: AgendaItem[]): Promise<AgendaItem[]> {
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1];
      const curr = items[i];

      if (prev.location?.zoneId && curr.location?.zoneId) {
        const walkTime = await this.wayfindingService.getWalkingTime(
          prev.location.zoneId,
          curr.location.zoneId,
        );
        curr.walkingTime = walkTime.minutes;
        curr.walkingFrom = prev.location.roomName;
      }
    }
    return items;
  }

  /**
   * Demand aggregation: returns session demand vs capacity
   * for admin analytics.
   */
  async getSessionDemand(eventId: string): Promise<
    Array<{
      meetingId: string;
      title: string;
      capacity: number;
      interested: number;
      confirmed: number;
      demandRatio: number;
      alert: boolean;
    }>
  > {
    const meetings = await prisma.meeting.findMany({
      where: { eventId },
      include: {
        venue: true,
        _count: {
          select: {
            personalAgendas: {
              // Count per status not directly supported; use raw
            },
          },
        },
      },
    });

    const demand = [];
    for (const meeting of meetings) {
      const counts = await prisma.personalAgenda.groupBy({
        by: ["status"],
        where: { meetingId: meeting.id },
        _count: true,
      });

      const interested = counts.find((c) => c.status === "INTERESTED")?._count || 0;
      const confirmed = counts.find((c) => c.status === "CONFIRMED")?._count || 0;
      const capacity = meeting.venue?.capacity || 0;
      const totalDemand = interested + confirmed;

      demand.push({
        meetingId: meeting.id,
        title: meeting.title,
        capacity,
        interested,
        confirmed,
        demandRatio: capacity > 0 ? totalDemand / capacity : 0,
        alert: capacity > 0 && totalDemand > capacity * 0.9, // Alert at 90% capacity
      });
    }

    return demand.sort((a, b) => b.demandRatio - a.demandRatio);
  }
}
```

### 5.4 Networking Service

```typescript
// ─── Networking & Contact Exchange Service ────────────────────

export class NetworkingService {
  /**
   * Processes a contact exchange via QR code scan.
   * Decrypts the badge QR, validates the participant,
   * and creates a bidirectional contact record.
   */
  async exchangeContact(
    scannerParticipantId: string,
    qrPayload: string,
  ): Promise<ContactExchangeResponse> {
    // 1. Decrypt QR payload
    const decoded = DigitalBadgeService.decryptQRPayload(qrPayload);

    // 2. Validate scanned participant exists and is active
    const scannedParticipant = await prisma.participant.findUniqueOrThrow({
      where: { id: decoded.pid },
    });

    if (scannedParticipant.status !== "APPROVED") {
      throw new AppError("INVALID_BADGE", "Scanned badge is not active");
    }

    // 3. Prevent self-scan
    if (scannerParticipantId === decoded.pid) {
      throw new AppError("SELF_SCAN", "Cannot scan your own badge");
    }

    // 4. Check if already exchanged
    const existing = await prisma.contactExchange.findUnique({
      where: {
        participantId_scannedParticipantId: {
          participantId: scannerParticipantId,
          scannedParticipantId: decoded.pid,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        contact: this.buildContactProfile(scannedParticipant),
        alreadyExchanged: true,
      };
    }

    // 5. Create contact exchange record
    await prisma.contactExchange.create({
      data: {
        participantId: scannerParticipantId,
        scannedParticipantId: decoded.pid,
      },
    });

    // 6. Notify the scanned participant
    const scanner = await prisma.participant.findUniqueOrThrow({
      where: { id: scannerParticipantId },
    });

    await this.notificationService.send(decoded.pid, {
      type: "CONTACT_EXCHANGE",
      title: "New Contact",
      body: `${scanner.name} saved your contact`,
      data: { scannerId: scannerParticipantId },
    });

    return {
      success: true,
      contact: this.buildContactProfile(scannedParticipant),
      alreadyExchanged: false,
    };
  }

  /**
   * Processes a networking meeting request.
   * Validates participants, checks for duplicates,
   * and optionally auto-books a bilateral room.
   */
  async sendMeetingRequest(
    fromParticipantId: string,
    request: NetworkingRequestCreate,
  ): Promise<NetworkingRequest> {
    const fromParticipant = await prisma.participant.findUniqueOrThrow({
      where: { id: fromParticipantId },
    });

    // Validate target participant is visible in directory
    const toPrefs = await prisma.participantPreference.findUnique({
      where: { participantId: request.toParticipantId },
    });

    if (!toPrefs?.networkVisible) {
      throw new AppError("NOT_FOUND", "Participant not found in directory");
    }

    // Check for existing request
    const existing = await prisma.networkingRequest.findUnique({
      where: {
        fromParticipantId_toParticipantId_eventId: {
          fromParticipantId,
          toParticipantId: request.toParticipantId,
          eventId: fromParticipant.eventId,
        },
      },
    });

    if (existing && existing.status === "PENDING") {
      throw new AppError("DUPLICATE", "You already have a pending request to this participant");
    }

    // Create request
    const networkingRequest = await prisma.networkingRequest.create({
      data: {
        tenantId: fromParticipant.tenantId,
        eventId: fromParticipant.eventId,
        fromParticipantId,
        toParticipantId: request.toParticipantId,
        status: "PENDING",
        message: request.message,
        proposedTime: request.proposedTime ? new Date(request.proposedTime) : null,
        proposedLocation: request.proposedLocation,
      },
    });

    // Notify target participant
    await this.notificationService.send(request.toParticipantId, {
      type: "NETWORKING_REQUEST",
      title: "Meeting Request",
      body: `${fromParticipant.name} from ${fromParticipant.organization} would like to meet`,
      data: {
        requestId: networkingRequest.id,
        fromName: fromParticipant.name,
        message: request.message,
      },
      actionUrl: `/participant/networking/requests/${networkingRequest.id}`,
    });

    return networkingRequest;
  }

  /**
   * Exports collected contacts as vCard (.vcf) file.
   */
  async exportContactsVCard(participantId: string): Promise<string> {
    const exchanges = await prisma.contactExchange.findMany({
      where: { participantId },
      include: {
        scannedParticipant: true,
      },
      orderBy: { scannedAt: "asc" },
    });

    const vcards = exchanges.map((exchange) => {
      const p = exchange.scannedParticipant;
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${p.name}`,
        p.organization ? `ORG:${p.organization}` : "",
        p.title ? `TITLE:${p.title}` : "",
        p.email ? `EMAIL:${p.email}` : "",
        p.phone ? `TEL:${p.phone}` : "",
        p.country ? `ADR:;;;;;;${p.country}` : "",
        `NOTE:Met at ${p.eventId} on ${exchange.scannedAt.toISOString().split("T")[0]}`,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\r\n");
    });

    return vcards.join("\r\n");
  }
}
```

### 5.5 Carry-Forward Engine

```typescript
// ─── Carry-Forward Engine ─────────────────────────────────────

export class CarryForwardEngine {
  /**
   * Imports participant data from a previous edition into a new edition.
   * Maps previous participants by email, pre-fills registration data,
   * and optionally sends invitations referencing previous participation.
   */
  async carryForward(
    seriesId: string,
    sourceEditionId: string,
    targetEditionId: string,
    options: {
      importContacts: boolean;
      preFillRegistration: boolean;
      sendInvitations: boolean;
      filterByStatus: string[];
    },
  ): Promise<CarryForwardResult> {
    const sourceEdition = await prisma.eventEdition.findUniqueOrThrow({
      where: { id: sourceEditionId },
    });
    const targetEdition = await prisma.eventEdition.findUniqueOrThrow({
      where: { id: targetEditionId },
    });

    // 1. Extract unique contacts from source event
    const sourceParticipants = await prisma.participant.findMany({
      where: {
        eventId: sourceEdition.eventId,
        status: { in: options.filterByStatus },
      },
      select: {
        id: true,
        email: true,
        name: true,
        title: true,
        organization: true,
        country: true,
        participantType: true,
        customData: true,
        delegation: { select: { name: true } },
      },
    });

    let mapped = 0;
    let invited = 0;
    let errors = 0;

    for (const participant of sourceParticipants) {
      try {
        // 2. Create carry-forward mapping
        const dataCarried = {
          name: participant.name,
          title: participant.title,
          organization: participant.organization,
          country: participant.country,
          participantType: participant.participantType,
          delegationName: participant.delegation?.name,
          // Carry forward relevant custom data (passport, dietary, etc.)
          passport: participant.customData?.passportNumber,
          passportExpiry: participant.customData?.passportExpiry,
          dietaryRequirements: participant.customData?.dietaryRequirements,
          accessibilityNeeds: participant.customData?.accessibilityNeeds,
        };

        await prisma.carryForwardMap.upsert({
          where: {
            seriesId_sourceEditionId_targetEditionId_participantEmail: {
              seriesId,
              sourceEditionId,
              targetEditionId,
              participantEmail: participant.email,
            },
          },
          create: {
            seriesId,
            sourceEditionId,
            targetEditionId,
            participantEmail: participant.email,
            sourceParticipantId: participant.id,
            status: "MAPPED",
            dataCarried: dataCarried as any,
          },
          update: {
            dataCarried: dataCarried as any,
            status: "MAPPED",
          },
        });
        mapped++;

        // 3. Send invitation if requested
        if (options.sendInvitations) {
          await this.invitationService.sendReturningParticipantInvitation(
            targetEdition.eventId,
            participant.email,
            {
              name: participant.name,
              previousEdition: sourceEdition.editionNumber,
              previousYear: sourceEdition.year,
            },
          );

          await prisma.carryForwardMap.updateMany({
            where: {
              seriesId,
              sourceEditionId,
              targetEditionId,
              participantEmail: participant.email,
            },
            data: { status: "INVITED", invitedAt: new Date() },
          });
          invited++;
        }
      } catch (error) {
        errors++;
        console.error(`Carry-forward failed for ${participant.email}:`, error);
      }
    }

    return {
      totalParticipants: sourceParticipants.length,
      mapped,
      invited,
      errors,
    };
  }

  /**
   * Pre-fills a registration form for a returning participant.
   * Called when participant starts registration for new edition.
   */
  async preFillRegistration(
    email: string,
    targetEventId: string,
  ): Promise<Record<string, unknown> | null> {
    const targetEdition = await prisma.eventEdition.findFirst({
      where: { eventId: targetEventId },
    });

    if (!targetEdition) return null;

    const carryForward = await prisma.carryForwardMap.findFirst({
      where: {
        targetEditionId: targetEdition.id,
        participantEmail: email,
      },
    });

    if (!carryForward?.dataCarried) return null;

    // Update status to PRE_FILLED
    await prisma.carryForwardMap.update({
      where: { id: carryForward.id },
      data: { status: "PRE_FILLED" },
    });

    return carryForward.dataCarried as Record<string, unknown>;
  }
}
```

### 5.6 Notification & Reminder Engine

```typescript
// ─── Participant Notification Service ─────────────────────────

export class ParticipantNotificationService {
  /**
   * Sends a notification to a participant via multiple channels:
   * 1. In-app notification (always)
   * 2. Web push notification (if subscribed)
   * 3. SSE real-time event (if connected)
   */
  async send(
    participantId: string,
    notification: {
      type: ParticipantNotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      actionUrl?: string;
      priority?: string;
    },
  ): Promise<void> {
    // Check participant preferences
    const prefs = await prisma.participantPreference.findUnique({
      where: { participantId },
    });

    // Respect notification preferences
    if (prefs) {
      if (!prefs.notifySchedule && notification.type.startsWith("SCHEDULE_")) return;
      if (!prefs.notifyNetwork && notification.type.startsWith("NETWORKING_")) return;
      if (!prefs.notifyReminders && notification.type === "SESSION_REMINDER") return;
    }

    // 1. Create in-app notification
    const notif = await prisma.participantNotification.create({
      data: {
        participantId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: (notification.data || {}) as any,
        actionUrl: notification.actionUrl,
        priority: notification.priority || "NORMAL",
      },
    });

    // 2. Send web push notification
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { participantId, isActive: true },
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: "/icons/notification-192.png",
            badge: "/icons/badge-72.png",
            data: { url: notification.actionUrl, notifId: notif.id },
            tag: notification.type,
            renotify: notification.priority === "URGENT",
          }),
        );

        await prisma.participantNotification.update({
          where: { id: notif.id },
          data: { pushSentAt: new Date() },
        });

        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        });
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Subscription expired — deactivate
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          });
        }
      }
    }

    // 3. Send SSE event if participant is connected
    this.sseService.sendToParticipant(participantId, {
      type: `notification:${notification.type.toLowerCase()}`,
      data: {
        id: notif.id,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        priority: notification.priority,
      },
    });
  }

  /**
   * Scheduled job: sends session reminders based on
   * participant preferences (default 15 minutes before).
   * Runs every minute.
   */
  async processSessionReminders(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60_000); // 1 minute window

    // Find agenda items where reminder should fire
    const upcomingItems = await prisma.personalAgenda.findMany({
      where: {
        status: { in: ["CONFIRMED", "INTERESTED"] },
        reminder: true,
        meeting: {
          startTime: {
            // Meeting starts between (now + reminderMinutes) and (now + reminderMinutes + 1min)
            // This requires a raw query since reminderMinutes varies per record
          },
        },
      },
      include: {
        participant: true,
        meeting: { include: { venue: true } },
      },
    });

    // Use raw query for variable reminder windows
    const reminders = await prisma.$queryRaw<
      Array<{
        agendaId: string;
        participantId: string;
        meetingId: string;
        meetingTitle: string;
        meetingStartTime: Date;
        venueName: string;
        roomName: string;
        reminderMinutes: number;
      }>
    >`
      SELECT
        pa.id as "agendaId",
        pa."participantId",
        pa."meetingId",
        m.title as "meetingTitle",
        m."startTime" as "meetingStartTime",
        v.name as "venueName",
        v."roomName"
      FROM "PersonalAgenda" pa
      JOIN "Meeting" m ON m.id = pa."meetingId"
      LEFT JOIN "Venue" v ON v.id = m."venueId"
      WHERE pa.reminder = true
        AND pa.status IN ('CONFIRMED', 'INTERESTED')
        AND m."startTime" - (pa."reminderMinutes" * interval '1 minute')
            BETWEEN ${now} AND ${windowEnd}
        AND NOT EXISTS (
          SELECT 1 FROM "ParticipantNotification" pn
          WHERE pn."participantId" = pa."participantId"
            AND pn.type = 'SESSION_REMINDER'
            AND pn.data->>'meetingId' = pa."meetingId"
        )
    `;

    for (const reminder of reminders) {
      await this.send(reminder.participantId, {
        type: "SESSION_REMINDER",
        title: `Starting in ${reminder.reminderMinutes} min`,
        body: `${reminder.meetingTitle} at ${reminder.roomName || reminder.venueName}`,
        data: { meetingId: reminder.meetingId },
        actionUrl: `/participant/agenda/${reminder.meetingId}`,
      });
    }
  }
}
```

### 5.7 YoY Analytics Engine

```typescript
// ─── Year-over-Year Analytics ─────────────────────────────────

export class YoYAnalyticsService {
  /**
   * Computes cross-edition comparison metrics for an event series.
   * Aggregates data from Registration, Workflow, Badge, Feedback,
   * and Networking systems across all editions.
   */
  async getSeriesAnalytics(seriesId: string): Promise<YoYAnalyticsResponse> {
    const series = await prisma.eventSeries.findUniqueOrThrow({
      where: { id: seriesId },
      include: {
        editions: { orderBy: { year: "asc" } },
      },
    });

    const editionMetrics = await Promise.all(
      series.editions.map(async (edition) => {
        const eventId = edition.eventId;

        // Parallel metric queries
        const [
          registrationStats,
          workflowStats,
          badgeStats,
          incidentCount,
          countryCount,
          sessionStats,
          networkingStats,
        ] = await Promise.all([
          this.getRegistrationStats(eventId),
          this.getWorkflowStats(eventId),
          this.getBadgeStats(eventId),
          this.getIncidentCount(eventId),
          this.getCountryCount(eventId),
          this.getSessionStats(eventId),
          this.getNetworkingStats(eventId),
        ]);

        return {
          editionNumber: edition.editionNumber,
          year: edition.year,
          hostCity: edition.hostCity,
          hostCountry: edition.hostCountry,
          eventId,
          metrics: {
            totalRegistrations: registrationStats.total,
            approvalRate: registrationStats.approvalRate,
            avgApprovalTimeHours: workflowStats.avgApprovalTimeHours,
            badgeCollectionRate: badgeStats.collectionRate,
            noShowRate: registrationStats.noShowRate,
            incidentCount,
            countryCount,
            delegationCount: registrationStats.delegationCount,
            sessionCount: sessionStats.count,
            avgSessionRating: sessionStats.avgRating,
            networkingRequestCount: networkingStats.requestCount,
            contactExchangeCount: networkingStats.exchangeCount,
          },
        };
      }),
    );

    // Calculate trends (minimum 2 editions needed)
    const trends = this.calculateTrends(editionMetrics);

    return {
      seriesName: series.name,
      editions: editionMetrics,
      trends,
    };
  }

  private calculateTrends(editions: any[]): YoYAnalyticsResponse["trends"] {
    if (editions.length < 2) {
      return {
        registrationGrowth: 0,
        noShowTrend: "STABLE",
        satisfactionTrend: "STABLE",
      };
    }

    const recent = editions.slice(-3); // Last 3 editions
    const regGrowthRates = [];
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1].metrics.totalRegistrations;
      const curr = recent[i].metrics.totalRegistrations;
      regGrowthRates.push(prev > 0 ? ((curr - prev) / prev) * 100 : 0);
    }

    const avgRegGrowth = regGrowthRates.reduce((a, b) => a + b, 0) / regGrowthRates.length;

    const noShowFirst = recent[0].metrics.noShowRate;
    const noShowLast = recent[recent.length - 1].metrics.noShowRate;
    const noShowTrend =
      noShowLast < noShowFirst - 2
        ? "IMPROVING"
        : noShowLast > noShowFirst + 2
          ? "DECLINING"
          : "STABLE";

    const ratingFirst = recent[0].metrics.avgSessionRating;
    const ratingLast = recent[recent.length - 1].metrics.avgSessionRating;
    const satisfactionTrend =
      ratingLast && ratingFirst
        ? ratingLast > ratingFirst + 0.2
          ? "IMPROVING"
          : ratingLast < ratingFirst - 0.2
            ? "DECLINING"
            : "STABLE"
        : "STABLE";

    return {
      registrationGrowth: Math.round(avgRegGrowth * 10) / 10,
      noShowTrend,
      satisfactionTrend,
    };
  }

  private async getRegistrationStats(eventId: string) {
    const total = await prisma.participant.count({ where: { eventId } });
    const approved = await prisma.participant.count({
      where: { eventId, status: "APPROVED" },
    });
    const noShows = await prisma.participant.count({
      where: { eventId, status: "APPROVED", checkedIn: false },
    });
    const delegations = await prisma.participant.groupBy({
      by: ["delegationId"],
      where: { eventId, delegationId: { not: null } },
    });

    return {
      total,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      noShowRate: approved > 0 ? Math.round((noShows / approved) * 100) : 0,
      delegationCount: delegations.length,
    };
  }

  private async getCountryCount(eventId: string): Promise<number> {
    const countries = await prisma.participant.groupBy({
      by: ["country"],
      where: { eventId, country: { not: null } },
    });
    return countries.length;
  }

  private async getSessionStats(eventId: string) {
    const count = await prisma.meeting.count({ where: { eventId } });
    const avgRating = await prisma.sessionFeedback.aggregate({
      where: { meeting: { eventId } },
      _avg: { rating: true },
    });
    return {
      count,
      avgRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
    };
  }

  private async getNetworkingStats(eventId: string) {
    const requestCount = await prisma.networkingRequest.count({
      where: { eventId },
    });
    const exchangeCount = await prisma.contactExchange.count({
      where: {
        participant: { eventId },
      },
    });
    return { requestCount, exchangeCount };
  }
}
```

### 5.8 Session Feedback Processing

```typescript
// ─── Session Feedback Service ─────────────────────────────────

export class SessionFeedbackService {
  private static readonly FEEDBACK_WINDOW_HOURS = 24;
  private static readonly PREDEFINED_TAGS = [
    "informative",
    "well-organized",
    "great-speaker",
    "interactive",
    "too-long",
    "too-short",
    "off-topic",
    "needs-improvement",
    "excellent-content",
  ];

  async submitFeedback(
    participantId: string,
    meetingId: string,
    input: SessionFeedbackRequest,
  ): Promise<void> {
    // 1. Validate meeting exists and has ended
    const meeting = await prisma.meeting.findUniqueOrThrow({
      where: { id: meetingId },
    });

    const now = new Date();
    if (now < meeting.endTime) {
      throw new AppError("TOO_EARLY", "Feedback can only be submitted after the session ends");
    }

    const feedbackDeadline = new Date(
      meeting.endTime.getTime() + SessionFeedbackService.FEEDBACK_WINDOW_HOURS * 3600_000,
    );
    if (now > feedbackDeadline) {
      throw new AppError("TOO_LATE", "Feedback window has closed for this session");
    }

    // 2. Validate participant was in the agenda
    const agendaItem = await prisma.personalAgenda.findUnique({
      where: {
        participantId_meetingId: { participantId, meetingId },
      },
    });

    if (!agendaItem) {
      throw new AppError(
        "NOT_ATTENDING",
        "You can only submit feedback for sessions on your agenda",
      );
    }

    // 3. Validate no duplicate feedback
    const existing = await prisma.sessionFeedback.findUnique({
      where: { participantId_meetingId: { participantId, meetingId } },
    });
    if (existing) {
      throw new AppError("DUPLICATE", "You have already submitted feedback for this session");
    }

    // 4. Validate tags
    const validTags = (input.tags || []).filter((tag) =>
      SessionFeedbackService.PREDEFINED_TAGS.includes(tag),
    );

    // 5. Create feedback record
    await prisma.sessionFeedback.create({
      data: {
        participantId,
        meetingId,
        rating: input.rating,
        comment: input.comment?.trim() || null,
        isAnonymous: input.isAnonymous ?? false,
        tags: validTags as any,
      },
    });

    // 6. Mark agenda item as ATTENDED
    await prisma.personalAgenda.update({
      where: { participantId_meetingId: { participantId, meetingId } },
      data: { status: "ATTENDED" },
    });

    // 7. Emit event for analytics
    this.eventBus.emit("session:feedback:submitted", {
      meetingId,
      rating: input.rating,
      hasComment: !!input.comment,
      tags: validTags,
    });
  }

  /**
   * Returns aggregated feedback for a session (admin view).
   */
  async getSessionFeedbackSummary(meetingId: string): Promise<{
    totalResponses: number;
    avgRating: number;
    ratingDistribution: Record<number, number>;
    topTags: Array<{ tag: string; count: number }>;
    comments: Array<{ comment: string; rating: number; submittedAt: string }>;
  }> {
    const feedback = await prisma.sessionFeedback.findMany({
      where: { meetingId },
      orderBy: { submittedAt: "desc" },
    });

    const totalResponses = feedback.length;
    const avgRating =
      totalResponses > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalResponses : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tagCounts: Record<string, number> = {};

    for (const f of feedback) {
      ratingDistribution[f.rating]++;
      for (const tag of f.tags as string[]) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const comments = feedback
      .filter((f) => f.comment && !f.isAnonymous)
      .map((f) => ({
        comment: f.comment!,
        rating: f.rating,
        submittedAt: f.submittedAt.toISOString(),
      }));

    return {
      totalResponses,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingDistribution,
      topTags,
      comments,
    };
  }
}
```

---

## 6. User Interface

### 6.1 Participant PWA Navigation

```
┌──────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────┐  │
│  │  AU Summit 2026            [🔔 3]    [≡ Menu]      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │              [ Page Content Area ]                 │  │
│  │                                                    │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │  │
│  │  │ 📅   │ │ 🪪   │ │ 📍   │ │ 🤝   │ │ 👤   │   │  │
│  │  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│   │  │
│  │  │      │ │      │ │      │ │      │ │      │   │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘

Tab Routes:
  /participant/agenda      → Personal Agenda (default)
  /participant/badge       → Digital Badge & Wallet
  /participant/map         → Venue Map & Wayfinding
  /participant/networking  → Directory & Contacts
  /participant/profile     → Profile & Settings
```

### 6.2 Personal Agenda View

```
┌──────────────────────────────────────────────────────────┐
│  My Agenda                          [Calendar] [List]    │
│                                                          │
│  ◄ Feb 9      Feb 10 - Day 1       Feb 11 ►            │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  08:00 ── Registration Opens                             │
│           African Union Conference Centre, Lobby          │
│           ┌──────────────────────────────────────┐       │
│           │ 📍 Show on map                       │       │
│           └──────────────────────────────────────┘       │
│                                                          │
│  09:00 ── Opening Ceremony               ★ [Confirmed]  │
│           Plenary Hall  |  600 attending                 │
│           ⏰ Starts in 45 minutes                        │
│           🚶 Walk 2 min from Registration                │
│                                                          │
│  11:00 ── ☕ Coffee Break                                │
│           Exhibition Hall                                │
│                                                          │
│  11:30 ── Committee on Political Affairs  ★ [Confirmed]  │
│           Conference Room B  |  120 attending            │
│           🚶 Walk 5 min from Plenary Hall                │
│                                                          │
│  13:00 ── 🍽 Lunch                                       │
│           Restaurant Level 2                             │
│           Your meal: Halal                               │
│                                                          │
│  14:30 ── Bilateral: Kenya - Ethiopia     ★ [Confirmed]  │
│           Bilateral Room 7  |  Private                   │
│           🚗 Driver pickup at 14:15 from main entrance   │
│                                                          │
│  16:00 ── Press Conference: Climate       [Interested]   │
│           Press Center  |  45 attending                   │
│           ┌───────────┐ ┌─────────────┐                  │
│           │ [Confirm] │ │ [Remove]    │                  │
│           └───────────┘ └─────────────┘                  │
│                                                          │
│  19:00 ── 🎩 Gala Dinner                  ★ [Confirmed]  │
│           Grand Ballroom                                 │
│           Table 12, Seat 3                               │
│           Dress code: Black tie                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [📋 Browse Full Schedule]  [📤 Export to Calendar]│   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.3 Digital Badge Screen

```
┌──────────────────────────────────────────────────────────┐
│  My Badge                                                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │                                              │  │  │
│  │  │           38th African Union Summit          │  │  │
│  │  │           Addis Ababa, Ethiopia              │  │  │
│  │  │           February 10-17, 2026               │  │  │
│  │  │                                              │  │  │
│  │  │      ┌──────────┐                            │  │  │
│  │  │      │          │    H.E. John Doe           │  │  │
│  │  │      │  [Photo] │    Minister of Foreign     │  │  │
│  │  │      │          │    Affairs                  │  │  │
│  │  │      └──────────┘    Republic of Kenya       │  │  │
│  │  │                                              │  │  │
│  │  │      Type: DELEGATE                          │  │  │
│  │  │      Access: CLOSED SESSION                  │  │  │
│  │  │      Code: REG-2026-0042                     │  │  │
│  │  │                                              │  │  │
│  │  │          ┌──────────────────┐                │  │  │
│  │  │          │                  │                │  │  │
│  │  │          │   [QR CODE]     │                │  │  │
│  │  │          │                  │                │  │  │
│  │  │          │                  │                │  │  │
│  │  │          └──────────────────┘                │  │  │
│  │  │                                              │  │  │
│  │  │      ✅ Active — Last scanned: Feb 10, 09:15 │  │  │
│  │  │                                              │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  ┌────────────────────┐ ┌──────────────────────┐  │  │
│  │  │  Add to Apple     │ │  Add to Google       │  │  │
│  │  │  Wallet           │ │  Wallet              │  │  │
│  │  └────────────────────┘ └──────────────────────┘  │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 💡 Your badge will appear on your lock screen     │   │
│  │    when you're near the venue.                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.4 Registration Status Tracker

```
┌──────────────────────────────────────────────────────────┐
│  Registration Status                   REG-2026-0042     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  ✓ Submitted ── ✓ Doc Review ── ● Approval ──    │  │
│  │                                    │               │  │
│  │                          ── ○ Badge Print ── ○ Ready│  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Current Step: Approval (3 of 5)                         │
│  Assigned to: First Validator                            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  📅 Submitted:    Feb 1, 2026 at 14:32            │  │
│  │  📅 Last update:  Feb 3, 2026 at 09:15            │  │
│  │  ⏱ Est. completion: Feb 5, 2026                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ⚠ Action Required                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  Missing document: Letter of Invitation            │  │
│  │                                                    │  │
│  │  ┌───────────────────────────────────────────┐    │  │
│  │  │  📷 Take Photo    📁 Choose File          │    │  │
│  │  └───────────────────────────────────────────┘    │  │
│  │                                                    │  │
│  │  Missing document: Passport Copy                   │  │
│  │  Status: Under review (uploaded Feb 2)             │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Timeline                                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Feb 3, 09:15  Document review completed           │  │
│  │  Feb 2, 11:30  Passport copy uploaded              │  │
│  │  Feb 1, 14:45  Acknowledgment email sent           │  │
│  │  Feb 1, 14:32  Registration submitted              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Need help? Contact your focal point:                    │
│  📧 focal-point@example.com                              │
│  📞 +251-xx-xxx-xxxx                                     │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.5 Networking Directory & Contact Exchange

```
┌──────────────────────────────────────────────────────────┐
│  Networking                                              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🔍 Search participants...                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Directory  │ │ My Contacts│ │ Requests   │           │
│  │            │ │     (12)   │ │    (2)     │           │
│  └────────────┘ └────────────┘ └────────────┘           │
│                                                          │
│  Filter: [All Types ▾] [All Countries ▾]                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ┌────┐  Dr. Amina Osei                           │  │
│  │  │ 📷 │  Deputy Minister, Republic of Ghana       │  │
│  │  └────┘  DELEGATE                                 │  │
│  │          ┌──────────────┐ ┌───────────────┐       │  │
│  │          │ 📨 Message   │ │ 📅 Request    │       │  │
│  │          │              │ │    Meeting    │       │  │
│  │          └──────────────┘ └───────────────┘       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ┌────┐  Prof. Ahmed Hassan                       │  │
│  │  │ 📷 │  Commissioner, AU Peace & Security       │  │
│  │  └────┘  COMMISSIONER                ✓ Connected  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ┌────┐  Ms. Fatou Diallo                         │  │
│  │  │ 📷 │  Ambassador, Republic of Senegal          │  │
│  │  └────┘  AMBASSADOR           ⏳ Request Pending   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         [📷 Scan Badge to Exchange Contact]       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.6 Contact Exchange Scanner

```
┌──────────────────────────────────────────────────────────┐
│  Scan Contact                              [✕ Close]     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │                                                    │  │
│  │              ┌────────────────────┐                │  │
│  │              │                    │                │  │
│  │              │   [Camera Feed]    │                │  │
│  │              │                    │                │  │
│  │              │   Point at badge   │                │  │
│  │              │   QR code          │                │  │
│  │              │                    │                │  │
│  │              └────────────────────┘                │  │
│  │                                                    │  │
│  │         Align QR code within the frame             │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ─── After successful scan: ───                          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │           ┌──────────┐                             │  │
│  │           │          │                             │  │
│  │           │  [Photo] │  Dr. Amina Osei            │  │
│  │           │          │  Deputy Minister            │  │
│  │           └──────────┘  Republic of Ghana         │  │
│  │                         DELEGATE                   │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │            ✓ Contact Saved!                   │ │  │
│  │  │  You can export all contacts as vCard later  │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌──────────────┐  ┌───────────────────────────┐  │  │
│  │  │ Scan Another │  │ View Contact Details      │  │  │
│  │  └──────────────┘  └───────────────────────────┘  │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.7 Session Feedback (Post-Session)

```
┌──────────────────────────────────────────────────────────┐
│  Session Feedback                          [✕ Dismiss]   │
│                                                          │
│  Committee on Political Affairs                          │
│  Feb 10, 11:30 - 13:00 | Conference Room B              │
│                                                          │
│  How was this session?                                   │
│                                                          │
│         ☆    ☆    ★    ★    ★                           │
│         1    2    3    4    5                             │
│                     ▲                                    │
│                  Selected                                │
│                                                          │
│  Tags (select all that apply):                           │
│  ┌──────────────┐ ┌────────────┐ ┌──────────────────┐   │
│  │ informative  │ │ interactive│ │ well-organized   │   │
│  └──────────────┘ └────────────┘ └──────────────────┘   │
│  ┌──────────────┐ ┌────────────┐ ┌──────────────────┐   │
│  │ great-speaker│ │ too-long   │ │ excellent-content│   │
│  └──────────────┘ └────────────┘ └──────────────────┘   │
│                                                          │
│  Comments (optional):                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  Great discussion on regional integration...       │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ☐ Submit anonymously                                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              [Submit Feedback]                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ⏱ Feedback closes in 23 hours                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.8 Venue Map & Wayfinding

```
┌──────────────────────────────────────────────────────────┐
│  Venue Map              [Floor: Ground ▾]  [🔍 Search]   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │   ┌─────────────────────┐                         │  │
│  │   │                     │  ┌─────────────────┐    │  │
│  │   │   Plenary Hall      │  │  Conference     │    │  │
│  │   │   (600 capacity)    │  │  Room A         │    │  │
│  │   │   [Session now]     │  │  (80 capacity)  │    │  │
│  │   │                     │  └─────────────────┘    │  │
│  │   │                     │                         │  │
│  │   └─────────────────────┘  ┌─────────────────┐    │  │
│  │                            │  Conference     │    │  │
│  │   ┌───────────┐           │  Room B         │    │  │
│  │   │ Lobby &   │           │  (120 capacity) │    │  │
│  │   │ Registra- │           │  [Your next     │    │  │
│  │   │ tion      │  ═══════  │   session]      │    │  │
│  │   │ 📍 You    │  Hallway  └─────────────────┘    │  │
│  │   │ are here  │                                   │  │
│  │   └───────────┘           ┌─────────────────┐    │  │
│  │                           │  Restaurant     │    │  │
│  │                           │  Level 2 ↑      │    │  │
│  │                           └─────────────────┘    │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Navigate to:                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Conference Room B — 5 min walk                    │  │
│  │  → Exit Plenary Hall through main doors            │  │
│  │  → Turn right into main hallway                    │  │
│  │  → Conference Room B is on your left               │  │
│  │  ♿ Elevator available on this floor               │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.9 Notification Center

```
┌──────────────────────────────────────────────────────────┐
│  Notifications                      [Mark All as Read]   │
│                                                          │
│  Today                                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔴 ⏰ Starting in 15 min                  9:45 AM │  │
│  │    Committee on Political Affairs                  │  │
│  │    Conference Room B                               │  │
│  │    → Tap to view on agenda                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔴 🤝 Meeting Request                     9:30 AM │  │
│  │    Dr. Amina Osei from Ghana                       │  │
│  │    "Would like to discuss regional trade..."       │  │
│  │    [Accept] [Decline] [Counter-propose]            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │    📋 Room Change                          8:15 AM │  │
│  │    Press Conference moved to Media Center 2        │  │
│  │    (was: Press Center)                             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Yesterday                                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │    🪪 Badge Ready                          4:30 PM │  │
│  │    Your digital badge is now available.             │  │
│  │    Add to Apple Wallet or Google Wallet.            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │    📧 New Contact                          2:15 PM │  │
│  │    Prof. Ahmed Hassan saved your contact           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.10 Event Clone Dialog (Admin)

```
┌──────────────────────────────────────────────────────────┐
│  Clone Event: 37th AU Summit                 [✕ Close]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  New Event Details                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Event Name:  [38th AU Summit                    ]│  │
│  │  Start Date:  [2026-02-10                        ]│  │
│  │  End Date:    [2026-02-17                        ]│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Elements to Clone                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [✓] Workflows          (5 workflows, 23 steps)   │  │
│  │  [✓] Registration Forms (3 form templates)        │  │
│  │  [✓] Badge Templates    (2 templates)             │  │
│  │  [✓] Invitation Quotas  (12 quota rules)          │  │
│  │  [ ] Invitation Recipients (carry forward contacts)│  │
│  │  [✓] Access Restrictions (8 zone rules)           │  │
│  │  [✓] Protocol Rankings  (45 precedence entries)   │  │
│  │  [✓] Seating Rules      (12 conflict rules)       │  │
│  │  [ ] Hotel Blocks       (6 accommodation blocks)  │  │
│  │  [ ] Shuttle Routes     (4 routes)                │  │
│  │  [✓] Custom Fields      (28 field definitions)    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Link to Series                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Series:     [AU Summit ▾]                        │  │
│  │  Edition:    [38       ]                          │  │
│  │  Host City:  [Addis Ababa                        ]│  │
│  │  Host Country:[Ethiopia                          ]│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Summary                                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  • 9 element categories selected                  │  │
│  │  • ~150 records will be cloned                    │  │
│  │  • Date fields shifted by +364 days               │  │
│  │  • Estimated time: 15-30 seconds                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ [Preview Changes]│  │ [Clone Now]                  │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.11 Year-over-Year Analytics Dashboard (Admin)

```
┌──────────────────────────────────────────────────────────────────┐
│  AU Summit — Edition Comparison                                   │
│                                                                    │
│  Series: [AU Summit ▾]       Editions: [Last 3 ▾]                │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Metric              │ 35th (2023)│ 36th (2024)│ 37th (2025)│ │
│  │  ─────────────────── │ ────────── │ ────────── │ ──────────│ │
│  │  Total Registrations │    1,542   │    1,687   │    1,847  │ │
│  │  Approval Rate       │     87%    │     89%    │     91%   │ │
│  │  Avg Approval Time   │   6.2 hrs  │   5.1 hrs  │   4.2 hrs│ │
│  │  Badge Collection %  │     78%    │     82%    │     85%   │ │
│  │  No-Show Rate        │     12%    │      9%    │      7%   │ │
│  │  Incidents           │     18     │     14     │     11    │ │
│  │  Countries           │     52     │     54     │     55    │ │
│  │  Delegations         │     48     │     50     │     52    │ │
│  │  Sessions            │     34     │     38     │     42    │ │
│  │  Avg Session Rating  │    3.8     │    4.0     │    4.2    │ │
│  │  Networking Requests │     -      │    124     │    287    │ │
│  │  Contact Exchanges   │     -      │    356     │    892    │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Trends                                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  📈 Registration: +8.7% per year (growing)                   │ │
│  │  📉 No-Show Rate: Improving (12% → 7%)                      │ │
│  │  📈 Satisfaction: Improving (3.8 → 4.2)                      │ │
│  │  📈 Networking: +131% adoption (edition 36 → 37)             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Registration Trend (Bar Chart)                               │ │
│  │                                                              │ │
│  │  2023  ████████████████████ 1,542                            │ │
│  │  2024  ██████████████████████ 1,687                          │ │
│  │  2025  ████████████████████████ 1,847                        │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  [📤 Export Report]  [📊 Detailed Analytics]  [🔄 Clone Next Ed.] │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 6.12 Participant Preferences Screen

```
┌──────────────────────────────────────────────────────────┐
│  Settings & Preferences                                  │
│                                                          │
│  Display                                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Language:       [English ▾]                       │  │
│  │  Timezone:       [Africa/Addis_Ababa ▾]           │  │
│  │  Theme:          ○ Light  ○ Dark  ● System        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Notifications                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Schedule changes    [═══════●] On                │  │
│  │  Session reminders   [═══════●] On                │  │
│  │  Reminder lead time  [15 minutes ▾]               │  │
│  │  Networking alerts   [═══════●] On                │  │
│  │  Push notifications  [═══════●] On                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Privacy                                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Visible in directory  [●═══════] Off             │  │
│  │  Show organization     [═══════●] On              │  │
│  │  Show title            [═══════●] On              │  │
│  │  Show photo            [═══════●] On              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Calendar                                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Auto-sync agenda     [●═══════] Off              │  │
│  │  Export agenda:  [📤 Download .ics]               │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Account                                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [📤 Export My Data]                              │  │
│  │  [🗑 Delete My Account]                           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Agenda│ │Badge │ │ Map  │ │Network│ │Profile│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.13 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PARTICIPANT PWA COMPONENT TREE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  <ParticipantShell>                                              │
│  ├── <TopBar>                                                    │
│  │   ├── <EventLogo />                                          │
│  │   ├── <NotificationBell count={unread} />                    │
│  │   └── <OfflineIndicator />                                   │
│  │                                                               │
│  ├── <Outlet /> (React Router)                                   │
│  │   ├── <AgendaPage>                                            │
│  │   │   ├── <DateSelector />                                   │
│  │   │   ├── <ViewToggle mode="calendar|list" />                │
│  │   │   ├── <AgendaTimeline>                                   │
│  │   │   │   ├── <AgendaItem variant="session" />               │
│  │   │   │   ├── <AgendaItem variant="bilateral" />             │
│  │   │   │   ├── <AgendaItem variant="meal" />                  │
│  │   │   │   ├── <AgendaItem variant="transport" />             │
│  │   │   │   └── <WalkingTimeIndicator />                       │
│  │   │   └── </AgendaTimeline>                                  │
│  │   │   └── <AgendaActions export={true} browse={true} />     │
│  │   │                                                           │
│  │   ├── <BadgePage>                                             │
│  │   │   ├── <BadgeCard>                                        │
│  │   │   │   ├── <ParticipantPhoto />                           │
│  │   │   │   ├── <BadgeDetails />                               │
│  │   │   │   └── <QRCodeDisplay />                              │
│  │   │   └── </BadgeCard>                                       │
│  │   │   ├── <WalletButtons apple={url} google={url} />        │
│  │   │   └── <BadgeStatusIndicator active={bool} />             │
│  │   │                                                           │
│  │   ├── <MapPage>                                               │
│  │   │   ├── <FloorSelector />                                  │
│  │   │   ├── <VenueMap>                                         │
│  │   │   │   ├── <FloorPlanLayer />                             │
│  │   │   │   ├── <ZoneOverlay zones={[]} />                     │
│  │   │   │   ├── <PathOverlay path={[]} />                      │
│  │   │   │   └── <YouAreHereMarker />                           │
│  │   │   └── </VenueMap>                                        │
│  │   │   └── <WayfindingPanel steps={[]} />                     │
│  │   │                                                           │
│  │   ├── <NetworkingPage>                                        │
│  │   │   ├── <NetworkingTabs directory|contacts|requests />     │
│  │   │   ├── <ParticipantSearch />                              │
│  │   │   ├── <DirectoryList>                                    │
│  │   │   │   └── <ParticipantCard compact={true} />             │
│  │   │   └── </DirectoryList>                                   │
│  │   │   ├── <ContactScanner>                                   │
│  │   │   │   ├── <QRScanner />                                  │
│  │   │   │   └── <ScannedContactCard />                         │
│  │   │   └── </ContactScanner>                                  │
│  │   │   └── <ContactExportButton format="vcard" />             │
│  │   │                                                           │
│  │   └── <ProfilePage>                                           │
│  │       ├── <StatusTracker steps={[]} current={n} />           │
│  │       ├── <DocumentUploader missing={[]} />                  │
│  │       ├── <PreferencesForm />                                │
│  │       └── <SelfServiceActions />                              │
│  │                                                               │
│  ├── <NotificationPanel> (slide-over)                            │
│  │   └── <NotificationItem /> (repeated)                        │
│  │                                                               │
│  ├── <FeedbackModal> (triggered post-session)                    │
│  │   ├── <StarRating />                                         │
│  │   ├── <TagSelector tags={[]} />                              │
│  │   └── <CommentInput />                                       │
│  │                                                               │
│  └── <BottomNav>                                                 │
│      ├── <NavItem icon="calendar" label="Agenda" />             │
│      ├── <NavItem icon="badge" label="Badge" />                 │
│      ├── <NavItem icon="map" label="Map" />                     │
│      ├── <NavItem icon="handshake" label="Network" />           │
│      └── <NavItem icon="user" label="Profile" />               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.14 Responsive Design Breakpoints

| Breakpoint  | Width      | Layout Behavior                                                  |
| ----------- | ---------- | ---------------------------------------------------------------- |
| **Mobile**  | < 640px    | Single column, bottom tab navigation, stacked agenda items       |
| **Tablet**  | 640-1024px | Two-column agenda (time + details side by side), side navigation |
| **Desktop** | > 1024px   | Three-column layout (navigation + content + detail panel)        |

### 6.15 Accessibility Requirements

| Requirement         | Implementation                                                         |
| ------------------- | ---------------------------------------------------------------------- |
| Screen Reader       | All interactive elements have `aria-label`; agenda uses `role="feed"`  |
| Keyboard Navigation | Full tab navigation through agenda, badge, and networking tabs         |
| Color Contrast      | All text meets WCAG 2.1 AA (4.5:1 ratio minimum)                       |
| Touch Targets       | Minimum 44×44px for all interactive elements on mobile                 |
| Motion Sensitivity  | `prefers-reduced-motion` respected; animations can be disabled         |
| Font Scaling        | Supports up to 200% browser zoom without layout breaking               |
| High Contrast Mode  | Provides `forced-colors` media query support                           |
| Focus Indicators    | Visible focus ring on all interactive elements (3px solid, offset 2px) |

---

## 7. Integration Points

### 7.1 Module 04: Workflow Engine

```typescript
// ─── Workflow → Participant Status Updates ────────────────────

// When a workflow step completes, notify the participant
// about their registration status change via SSE + push.

import { eventBus } from "~/events/bus.server";

eventBus.on("workflow:step:completed", async (event) => {
  const { participantId, stepName, workflowName, newStatus } = event;
  if (!participantId) return;

  await participantNotificationService.send(participantId, {
    type: "STATUS_UPDATE",
    title: `Registration Updated`,
    body: `Your registration has moved to: ${stepName}`,
    data: { step: stepName, workflow: workflowName, status: newStatus },
    actionUrl: "/participant/profile",
  });

  // If approved, trigger digital badge generation
  if (newStatus === "APPROVED") {
    await digitalBadgeService.generateBadge(participantId);
  }
});
```

### 7.2 Module 09: Registration and Accreditation

```typescript
// ─── Registration → Participant Self-Service ──────────────────

// Pre-fill registration form with carry-forward data
// when a returning participant starts a new registration.

export async function loader({ request }: LoaderFunctionArgs) {
  const email = await getAuthenticatedEmail(request);
  const eventId = getEventIdFromParams(request);

  // Check for carry-forward data from previous editions
  const preFillData = await carryForwardEngine.preFillRegistration(email, eventId);

  return json({
    formTemplate: await getFormTemplate(eventId),
    preFillData, // Participant's previous data if available
    isReturning: !!preFillData,
  });
}

// Document upload from mobile camera → Registration document processing
export async function uploadDocument(participantId: string, file: File, documentType: string) {
  // Process upload through existing document pipeline
  const result = await documentService.processUpload({
    participantId,
    file,
    documentType,
    source: "PARTICIPANT_SELF_SERVICE",
  });

  // Notify focal point of new upload
  const participant = await prisma.participant.findUniqueOrThrow({
    where: { id: participantId },
    include: { delegation: { include: { focalPoint: true } } },
  });

  if (participant.delegation?.focalPoint) {
    await notificationService.send(participant.delegation.focalPoint.userId, {
      type: "DOCUMENT_UPLOADED",
      title: "Document Uploaded",
      body: `${participant.name} uploaded: ${documentType}`,
    });
  }

  return result;
}
```

### 7.3 Module 10: Event Operations Center

```typescript
// ─── Operations Center → Participant Experience ───────────────

// Real-time demand data feeds into Operations Command Center.
// Session demand vs capacity alerts appear on the ops dashboard.

eventBus.on("agenda:item:added", async (event) => {
  const { meetingId, status } = event;
  const demand = await agendaService.getSessionDemand(event.eventId);
  const session = demand.find((d) => d.meetingId === meetingId);

  if (session?.alert) {
    // Alert operations center about capacity issue
    await commandCenterService.createAlert({
      type: "CAPACITY_WARNING",
      severity: "WARNING",
      title: `${session.title}: Demand exceeds capacity`,
      body: `${session.confirmed + session.interested} interested vs ${session.capacity} capacity`,
      data: { meetingId, demand: session },
    });
  }
});

// Schedule changes from operations propagate to participants
eventBus.on("meeting:updated", async (event) => {
  const { meetingId, changes } = event;

  // Find all participants with this meeting on their agenda
  const agendaItems = await prisma.personalAgenda.findMany({
    where: { meetingId, status: { in: ["CONFIRMED", "INTERESTED"] } },
    select: { participantId: true },
  });

  for (const item of agendaItems) {
    if (changes.room) {
      await participantNotificationService.send(item.participantId, {
        type: "ROOM_CHANGE",
        title: "Room Change",
        body: `Session moved to ${changes.room.newValue}`,
        data: { meetingId, oldRoom: changes.room.oldValue, newRoom: changes.room.newValue },
        priority: "HIGH",
      });
    }
    if (changes.startTime) {
      await participantNotificationService.send(item.participantId, {
        type: "SCHEDULE_CHANGE",
        title: "Time Change",
        body: `Session time changed to ${formatTime(changes.startTime.newValue)}`,
        data: { meetingId, field: "startTime", ...changes.startTime },
        priority: "HIGH",
      });
    }
  }
});
```

### 7.4 Module 11: Logistics and Venue

```typescript
// ─── Logistics → Participant Experience ───────────────────────

// Transport schedule displayed on participant's agenda.
// Venue zones provide wayfinding data.

export class ParticipantLogisticsIntegration {
  /**
   * Fetches transport schedule for participant's agenda view.
   */
  async getTransportForAgenda(participantId: string, date: Date): Promise<AgendaItem[]> {
    const transports = await prisma.transportRequest.findMany({
      where: {
        participantId,
        pickupTime: {
          gte: startOfDay(date),
          lt: endOfDay(date),
        },
      },
      include: { vehicle: true, driver: true },
    });

    return transports.map((t) => ({
      meetingId: `transport-${t.id}`,
      title: `Transport: ${t.pickupLocation} → ${t.dropoffLocation}`,
      type: "TRANSPORT" as const,
      startTime: t.pickupTime.toISOString(),
      endTime: t.estimatedArrival?.toISOString() || "",
      location: {
        venueName: t.pickupLocation,
        roomName: "",
        floorNumber: null,
        zoneId: null,
      },
      status: "CONFIRMED" as const,
      attendeeCount: null,
      capacity: null,
      walkingTime: null,
      walkingFrom: null,
      personalNotes: {
        driverPickup: `${t.driver?.name || "TBD"} - ${t.vehicle?.plateNumber || ""}`,
        mealType: null,
        seatAssignment: null,
        dressCode: null,
        isStarred: false,
      },
      reminder: { enabled: true, minutesBefore: 15 },
    }));
  }

  /**
   * Calculates walking time between two venue zones
   * using zone adjacency graph from Module 11.
   */
  async getWalkingTime(fromZoneId: string, toZoneId: string): Promise<{ minutes: number }> {
    const zones = await prisma.venueZone.findMany({
      where: { id: { in: [fromZoneId, toZoneId] } },
    });

    if (zones.length !== 2) return { minutes: 0 };

    // Use BFS on zone adjacency graph to find shortest path
    const adjacency = await this.buildZoneAdjacencyGraph(zones[0].floorPlanId);
    const path = this.bfsShortestPath(adjacency, fromZoneId, toZoneId);

    // Estimate 1 minute per zone transition, +1 per floor change
    const floorChanges = this.countFloorChanges(path, zones);
    return { minutes: path.length + floorChanges };
  }
}
```

### 7.5 Module 12: Protocol and Diplomacy

```typescript
// ─── Protocol → Participant Experience ────────────────────────

// Bilateral meetings appear on participant's personal agenda.
// Seating assignments show table/seat in gala dinner items.

eventBus.on("bilateral:confirmed", async (event) => {
  const { bilateralId, meetingId, requestingCountry, receivingCountry } = event;

  // Find participants from both countries
  const participants = await prisma.participant.findMany({
    where: {
      eventId: event.eventId,
      country: { in: [requestingCountry, receivingCountry] },
      participantType: { in: ["HEAD_OF_STATE", "MINISTER", "DELEGATE"] },
    },
  });

  for (const participant of participants) {
    // Auto-add bilateral to their agenda
    await prisma.personalAgenda.upsert({
      where: {
        participantId_meetingId: {
          participantId: participant.id,
          meetingId,
        },
      },
      create: {
        participantId: participant.id,
        meetingId,
        status: "CONFIRMED",
        reminder: true,
        reminderMinutes: 30, // More lead time for bilaterals
      },
      update: { status: "CONFIRMED" },
    });

    await participantNotificationService.send(participant.id, {
      type: "SCHEDULE_CHANGE",
      title: "Bilateral Meeting Confirmed",
      body: `${requestingCountry} - ${receivingCountry} bilateral confirmed`,
      data: { meetingId, bilateralId },
      actionUrl: `/participant/agenda/${meetingId}`,
    });
  }
});
```

### 7.6 Module 14: Content and Documents

```typescript
// ─── Content → Participant Experience ─────────────────────────

// Post-event survey integration.
// Certificate download for participants.

export class ParticipantContentIntegration {
  /**
   * After event ends, trigger post-event survey notification
   * for all approved participants.
   */
  async triggerPostEventSurvey(eventId: string, surveyId: string): Promise<void> {
    const participants = await prisma.participant.findMany({
      where: { eventId, status: "APPROVED" },
      select: { id: true },
    });

    for (const participant of participants) {
      await participantNotificationService.send(participant.id, {
        type: "SURVEY_AVAILABLE",
        title: "Share Your Feedback",
        body: "Please take a moment to complete the post-event survey",
        data: { surveyId },
        actionUrl: `/participant/surveys/${surveyId}`,
      });
    }
  }

  /**
   * Generates participation certificate for download.
   */
  async getParticipationCertificate(participantId: string): Promise<Buffer> {
    const participant = await prisma.participant.findUniqueOrThrow({
      where: { id: participantId },
      include: { event: true },
    });

    if (participant.status !== "APPROVED") {
      throw new AppError("NOT_ELIGIBLE", "Certificate only available for approved participants");
    }

    return certificateGenerator.generate({
      participantName: participant.name,
      eventName: participant.event.name,
      eventDates: `${formatDate(participant.event.startDate)} - ${formatDate(participant.event.endDate)}`,
      participantType: participant.participantType,
      organization: participant.organization,
    });
  }
}
```

### 7.7 Module 17: Settings and Configuration

```typescript
// ─── Settings Registry ───────────────────────────────────────

// Settings keys contributed by Module 16:
const MODULE_16_SETTINGS = {
  "participant.pwa.enabled": {
    type: "boolean",
    default: true,
    description: "Enable participant PWA mobile experience",
  },
  "participant.networking.enabled": {
    type: "boolean",
    default: true,
    description: "Enable participant networking directory",
  },
  "participant.feedback.enabled": {
    type: "boolean",
    default: true,
    description: "Enable post-session feedback collection",
  },
  "participant.feedback.windowHours": {
    type: "number",
    default: 24,
    description: "Hours after session end that feedback can be submitted",
  },
  "participant.badge.walletEnabled": {
    type: "boolean",
    default: true,
    description: "Enable Apple/Google Wallet badge integration",
  },
  "participant.wayfinding.enabled": {
    type: "boolean",
    default: true,
    description: "Enable indoor wayfinding and walking times",
  },
  "participant.agenda.maxReminders": {
    type: "number",
    default: 10,
    description: "Max concurrent session reminders per participant",
  },
  "clone.maxElementsPerCategory": {
    type: "number",
    default: 1000,
    description: "Max elements cloned per category before chunking",
  },
  "clone.transactionTimeoutMs": {
    type: "number",
    default: 120000,
    description: "Database transaction timeout for clone operations",
  },
  "series.maxEditions": {
    type: "number",
    default: 50,
    description: "Maximum editions per event series",
  },
} as const;
```

### 7.8 Integration Summary Matrix

| Module                  | Direction  | Integration Point                            | Mechanism           |
| ----------------------- | ---------- | -------------------------------------------- | ------------------- |
| 03 Visual Form Designer | ← Consumes | Form templates for registration pre-fill     | Prisma query        |
| 04 Workflow Engine      | ← Consumes | Status change events trigger notifications   | Event Bus           |
| 04 Workflow Engine      | → Produces | Cloned workflow templates for new editions   | Clone Engine        |
| 05 Security             | ← Consumes | Participant auth scope, QR encryption keys   | JWT + Crypto        |
| 07 API Layer            | ← Consumes | SSE connection management                    | SSE Service         |
| 09 Registration         | ← Consumes | Registration status for self-service tracker | Prisma query        |
| 09 Registration         | → Produces | Carry-forward pre-fill data for new editions | CarryForward Engine |
| 10 Operations           | → Produces | Session demand data and capacity alerts      | Event Bus           |
| 10 Operations           | ← Consumes | Schedule changes broadcast to participants   | Event Bus           |
| 11 Logistics            | ← Consumes | Transport schedule and venue zone data       | Prisma query        |
| 11 Logistics            | ← Consumes | Walking time via zone adjacency graph        | Wayfinding Service  |
| 12 Protocol             | ← Consumes | Bilateral meetings and seating assignments   | Event Bus + Query   |
| 13 People               | ← Consumes | Staff contact info for focal point display   | Prisma query        |
| 14 Content              | ← Consumes | Post-event survey and certificate generation | Service call        |
| 15 Compliance           | → Produces | Consent records for networking opt-in        | Compliance API      |
| 17 Settings             | → Produces | 10 settings keys for participant config      | Settings Registry   |

---

## 8. Configuration

### 8.1 Settings Keys

| Key                                        | Type    | Default  | Description                       |
| ------------------------------------------ | ------- | -------- | --------------------------------- |
| `participant.pwa.enabled`                  | boolean | `true`   | Master toggle for participant PWA |
| `participant.pwa.installPrompt`            | boolean | `true`   | Show PWA install prompt           |
| `participant.networking.enabled`           | boolean | `true`   | Enable networking directory       |
| `participant.networking.maxRequestsPerDay` | number  | `20`     | Rate limit on meeting requests    |
| `participant.networking.autoExpireHours`   | number  | `48`     | Auto-expire pending requests      |
| `participant.feedback.enabled`             | boolean | `true`   | Enable session feedback           |
| `participant.feedback.windowHours`         | number  | `24`     | Feedback submission window        |
| `participant.feedback.anonymousAllowed`    | boolean | `true`   | Allow anonymous feedback          |
| `participant.badge.walletEnabled`          | boolean | `true`   | Wallet integration toggle         |
| `participant.badge.autoGenerate`           | boolean | `true`   | Auto-generate on approval         |
| `participant.badge.locationTrigger`        | boolean | `true`   | Location-based pass surfacing     |
| `participant.wayfinding.enabled`           | boolean | `true`   | Indoor navigation toggle          |
| `participant.wayfinding.walkSpeedMpm`      | number  | `80`     | Walking speed meters/minute       |
| `participant.agenda.maxReminders`          | number  | `10`     | Max concurrent reminders          |
| `participant.agenda.defaultReminderMin`    | number  | `15`     | Default reminder minutes          |
| `participant.push.vapidPublicKey`          | string  | `''`     | VAPID public key for web push     |
| `participant.push.maxSubscriptions`        | number  | `5`      | Max push subs per participant     |
| `participant.notifications.batchInterval`  | number  | `5000`   | Batch notification interval ms    |
| `clone.enabled`                            | boolean | `true`   | Enable event cloning              |
| `clone.maxElementsPerCategory`             | number  | `1000`   | Max elements per clone category   |
| `clone.transactionTimeoutMs`               | number  | `120000` | Clone transaction timeout         |
| `clone.previewEnabled`                     | boolean | `true`   | Show preview before clone         |
| `series.enabled`                           | boolean | `true`   | Enable event series               |
| `series.maxEditions`                       | number  | `50`     | Max editions per series           |
| `series.carryForward.enabled`              | boolean | `true`   | Enable participant carry-forward  |
| `series.carryForward.autoInvite`           | boolean | `false`  | Auto-send invitations             |
| `series.analytics.cacheMinutes`            | number  | `30`     | YoY analytics cache duration      |

### 8.2 Feature Flags

| Flag                          | Default | Description                             |
| ----------------------------- | ------- | --------------------------------------- |
| `FF_PARTICIPANT_PWA`          | `true`  | Participant mobile PWA                  |
| `FF_DIGITAL_BADGE`            | `true`  | Digital badge with wallet               |
| `FF_APPLE_WALLET`             | `true`  | Apple Wallet integration                |
| `FF_GOOGLE_WALLET`            | `true`  | Google Wallet integration               |
| `FF_NETWORKING`               | `true`  | Participant networking                  |
| `FF_CONTACT_EXCHANGE`         | `true`  | QR-based contact exchange               |
| `FF_SESSION_FEEDBACK`         | `true`  | Post-session micro-surveys              |
| `FF_WAYFINDING`               | `false` | Indoor navigation (requires venue data) |
| `FF_EVENT_CLONE`              | `true`  | Event cloning capability                |
| `FF_EVENT_SERIES`             | `true`  | Event series management                 |
| `FF_CARRY_FORWARD`            | `true`  | Participant carry-forward               |
| `FF_YOY_ANALYTICS`            | `true`  | Year-over-year analytics                |
| `FF_PUSH_NOTIFICATIONS`       | `true`  | Web push notifications                  |
| `FF_CALENDAR_SYNC`            | `false` | External calendar sync                  |
| `FF_PARTICIPANT_CERTIFICATES` | `true`  | Post-event certificates                 |

### 8.3 Environment Variables

```typescript
// ─── Environment Configuration ────────────────────────────────

const participantEnvSchema = z.object({
  // QR Encryption
  QR_ENCRYPTION_KEY: z.string().length(64), // 32-byte hex key

  // Apple Wallet
  APPLE_WWDR_CERT: z.string().optional(),
  APPLE_SIGNER_CERT: z.string().optional(),
  APPLE_SIGNER_KEY: z.string().optional(),
  APPLE_SIGNER_PASSPHRASE: z.string().optional(),
  APPLE_PASS_TYPE_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),

  // Google Wallet
  GOOGLE_WALLET_ISSUER_ID: z.string().optional(),
  GOOGLE_WALLET_KEY_FILE: z.string().optional(),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string(),
  VAPID_PRIVATE_KEY: z.string(),
  VAPID_SUBJECT: z.string().email(), // mailto: or https: URL

  // PWA
  PWA_ORIGIN: z.string().url(),
  PWA_SCOPE: z.string().default("/participant"),
});
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// ─── Clone Engine Tests ───────────────────────────────────────

describe("EventCloneService", () => {
  describe("executeClone", () => {
    it("should create new event with shifted dates", async () => {
      const source = await createTestEvent({ startDate: "2025-02-10" });
      const result = await cloneService.initiateClone(
        source.tenantId,
        source.id,
        "38th AU Summit",
        new Date("2026-02-10"),
        new Date("2026-02-17"),
        {
          workflows: true,
          forms: true,
          badges: false,
          invitations: false,
          invitationRecipients: false,
          accessRestrictions: false,
          protocolRanks: false,
          seatingRules: false,
          accommodationBlocks: false,
          shuttleRoutes: false,
          customFields: false,
        },
        null,
        "admin-1",
      );

      await waitForJobCompletion(result.cloneOperationId);

      const cloneOp = await prisma.cloneOperation.findUnique({
        where: { id: result.cloneOperationId },
      });
      expect(cloneOp!.status).toBe("COMPLETED");
      expect(cloneOp!.targetEventId).toBeTruthy();
    });

    it("should remap workflow step nextStepId references", async () => {
      const source = await createTestEventWithWorkflow();
      const result = await cloneService.initiateClone(
        source.tenantId,
        source.id,
        "Clone Test",
        new Date("2026-01-01"),
        new Date("2026-01-07"),
        {
          workflows: true,
          forms: false,
          badges: false,
          invitations: false,
          invitationRecipients: false,
          accessRestrictions: false,
          protocolRanks: false,
          seatingRules: false,
          accommodationBlocks: false,
          shuttleRoutes: false,
          customFields: false,
        },
        null,
        "admin-1",
      );

      await waitForJobCompletion(result.cloneOperationId);

      const cloneOp = await prisma.cloneOperation.findUnique({
        where: { id: result.cloneOperationId },
      });
      const targetSteps = await prisma.workflowStep.findMany({
        where: { workflow: { eventId: cloneOp!.targetEventId! } },
      });

      // All nextStepId should reference new step IDs, not source step IDs
      for (const step of targetSteps) {
        if (step.nextStepId) {
          expect(targetSteps.find((s) => s.id === step.nextStepId)).toBeTruthy();
        }
      }
    });

    it("should rollback on failure", async () => {
      // Mock a failure during form cloning
      const source = await createTestEventWithForms();
      jest.spyOn(cloneService as any, "cloneForms").mockRejectedValue(new Error("Disk full"));

      const result = await cloneService.initiateClone(
        source.tenantId,
        source.id,
        "Fail Test",
        new Date("2026-01-01"),
        new Date("2026-01-07"),
        {
          workflows: false,
          forms: true,
          badges: false,
          invitations: false,
          invitationRecipients: false,
          accessRestrictions: false,
          protocolRanks: false,
          seatingRules: false,
          accommodationBlocks: false,
          shuttleRoutes: false,
          customFields: false,
        },
        null,
        "admin-1",
      );

      await waitForJobCompletion(result.cloneOperationId);

      const cloneOp = await prisma.cloneOperation.findUnique({
        where: { id: result.cloneOperationId },
      });
      expect(cloneOp!.status).toBe("FAILED");
      expect(cloneOp!.errorLog).toContain("Disk full");
    });
  });
});

// ─── Digital Badge Tests ──────────────────────────────────────

describe("DigitalBadgeService", () => {
  describe("QR payload encryption", () => {
    it("should encrypt and decrypt QR payload roundtrip", () => {
      const original = { pid: "part-1", eid: "evt-1", al: "CLOSED", rc: "REG-001", ts: Date.now() };
      const encrypted = badgeService["encryptQRPayload"](original);
      const decrypted = DigitalBadgeService.decryptQRPayload(encrypted);

      expect(decrypted.pid).toBe(original.pid);
      expect(decrypted.eid).toBe(original.eid);
      expect(decrypted.al).toBe(original.al);
    });

    it("should reject tampered payloads", () => {
      const encrypted = badgeService["encryptQRPayload"]({
        pid: "part-1",
        eid: "evt-1",
        al: "CLOSED",
        rc: "REG-001",
        ts: Date.now(),
      });
      const tampered = encrypted.slice(0, -2) + "XX";
      expect(() => DigitalBadgeService.decryptQRPayload(tampered)).toThrow();
    });
  });

  describe("badge generation", () => {
    it("should generate badge on participant approval", async () => {
      const participant = await createApprovedParticipant();
      await badgeService.generateBadge(participant.id);

      const badge = await prisma.digitalBadge.findUnique({
        where: { participantId: participant.id },
      });
      expect(badge).toBeTruthy();
      expect(badge!.isActive).toBe(true);
      expect(badge!.qrPayload).toBeTruthy();
    });

    it("should invalidate badge when participant status changes", async () => {
      const participant = await createApprovedParticipant();
      await badgeService.generateBadge(participant.id);
      await badgeService.invalidateBadge(participant.id, "Status changed to REJECTED");

      const badge = await prisma.digitalBadge.findUnique({
        where: { participantId: participant.id },
      });
      expect(badge!.isActive).toBe(false);
    });
  });
});

// ─── Networking Tests ─────────────────────────────────────────

describe("NetworkingService", () => {
  it("should create contact exchange from QR scan", async () => {
    const [scanner, scanned] = await createTwoParticipants();
    const badge = await badgeService.generateBadge(scanned.id);
    const badgeRecord = await prisma.digitalBadge.findUnique({
      where: { participantId: scanned.id },
    });

    const result = await networkingService.exchangeContact(scanner.id, badgeRecord!.qrPayload);

    expect(result.success).toBe(true);
    expect(result.alreadyExchanged).toBe(false);
    expect(result.contact.name).toBe(scanned.name);
  });

  it("should prevent self-scan", async () => {
    const participant = await createApprovedParticipant();
    await badgeService.generateBadge(participant.id);
    const badge = await prisma.digitalBadge.findUnique({
      where: { participantId: participant.id },
    });

    await expect(
      networkingService.exchangeContact(participant.id, badge!.qrPayload),
    ).rejects.toThrow("Cannot scan your own badge");
  });

  it("should export contacts as vCard", async () => {
    const [scanner, scanned1, scanned2] = await createThreeParticipants();
    // Exchange contacts
    await exchangeContacts(scanner.id, scanned1.id);
    await exchangeContacts(scanner.id, scanned2.id);

    const vcard = await networkingService.exportContactsVCard(scanner.id);
    expect(vcard).toContain("BEGIN:VCARD");
    expect(vcard.match(/BEGIN:VCARD/g)!.length).toBe(2);
    expect(vcard).toContain(scanned1.name);
    expect(vcard).toContain(scanned2.name);
  });
});
```

### 9.2 Integration Tests

```typescript
// ─── Participant Lifecycle Integration Tests ──────────────────

describe("Participant Lifecycle", () => {
  it("should handle full participant journey: register → approve → badge → attend → feedback", async () => {
    // 1. Create participant via registration
    const participant = await registerParticipant(testEvent.id, {
      name: "Test Delegate",
      email: "delegate@test.com",
      country: "Kenya",
    });

    // 2. Approve through workflow
    await workflowEngine.processStep(participant.workflowInstanceId, {
      action: "APPROVE",
      userId: "validator-1",
    });

    // 3. Verify digital badge was generated
    const badge = await prisma.digitalBadge.findUnique({
      where: { participantId: participant.id },
    });
    expect(badge).toBeTruthy();
    expect(badge!.isActive).toBe(true);

    // 4. Add sessions to agenda
    const session = await prisma.meeting.findFirst({ where: { eventId: testEvent.id } });
    await request(app)
      .post(`/api/participant/agenda/${session!.id}`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ status: "CONFIRMED", reminder: true })
      .expect(201);

    // 5. Submit feedback after session
    await request(app)
      .post(`/api/participant/feedback/${session!.id}`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ rating: 4, comment: "Great session", tags: ["informative"] })
      .expect(201);

    // 6. Verify feedback recorded
    const feedback = await prisma.sessionFeedback.findUnique({
      where: { participantId_meetingId: { participantId: participant.id, meetingId: session!.id } },
    });
    expect(feedback!.rating).toBe(4);
  });
});

// ─── Event Clone Integration Tests ────────────────────────────

describe("Event Clone Integration", () => {
  it("should clone event with all elements and verify FK integrity", async () => {
    const source = await createFullTestEvent(); // Event with workflows, forms, badges

    const cloneResult = await request(app)
      .post(`/api/events/${source.id}/clone`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Cloned Event",
        startDate: "2026-06-01",
        endDate: "2026-06-07",
        options: {
          workflows: true,
          forms: true,
          badges: true,
          invitations: true,
          invitationRecipients: false,
          accessRestrictions: true,
          protocolRanks: true,
          seatingRules: false,
          accommodationBlocks: false,
          shuttleRoutes: false,
          customFields: true,
        },
      })
      .expect(202);

    // Poll until complete
    let status;
    do {
      const res = await request(app)
        .get(`/api/events/clone/${cloneResult.body.cloneOperationId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      status = res.body.status;
      if (status === "IN_PROGRESS") await sleep(500);
    } while (status === "IN_PROGRESS");

    expect(status).toBe("COMPLETED");

    // Verify cloned event exists
    const cloneOp = await prisma.cloneOperation.findUnique({
      where: { id: cloneResult.body.cloneOperationId },
    });
    const clonedEvent = await prisma.event.findUnique({
      where: { id: cloneOp!.targetEventId! },
    });
    expect(clonedEvent!.name).toBe("Cloned Event");

    // Verify no dangling FK references in cloned workflows
    const clonedWorkflows = await prisma.workflow.findMany({
      where: { eventId: clonedEvent!.id },
      include: { steps: true },
    });
    for (const wf of clonedWorkflows) {
      for (const step of wf.steps) {
        if (step.nextStepId) {
          const exists = wf.steps.find((s) => s.id === step.nextStepId);
          expect(exists).toBeTruthy();
        }
      }
    }
  });
});
```

### 9.3 E2E Tests (Playwright)

```typescript
// ─── Participant PWA E2E Tests ────────────────────────────────

import { test, expect } from "@playwright/test";

test.describe("Participant PWA", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParticipant(page);
  });

  test("should display personal agenda with sessions", async ({ page }) => {
    await page.goto("/participant/agenda");
    await expect(page.getByText("My Agenda")).toBeVisible();
    await expect(page.getByText("Opening Ceremony")).toBeVisible();
    await expect(page.getByText("Confirmed")).toBeVisible();
  });

  test("should add session to agenda", async ({ page }) => {
    await page.goto("/participant/agenda");
    await page.click("text=Browse Full Schedule");
    await page.click('[data-meeting-id="meeting-1"] >> text=Add to Agenda');
    await page.click("text=Confirm");
    await expect(page.getByText("Added to your agenda")).toBeVisible();
  });

  test("should display digital badge with QR code", async ({ page }) => {
    await page.goto("/participant/badge");
    await expect(page.getByText("My Badge")).toBeVisible();
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();
  });

  test("should show wallet buttons when supported", async ({ page }) => {
    await page.goto("/participant/badge");
    const appleButton = page.getByText("Add to Apple Wallet");
    const googleButton = page.getByText("Add to Google Wallet");
    // At least one should be visible
    const visible = (await appleButton.isVisible()) || (await googleButton.isVisible());
    expect(visible).toBe(true);
  });

  test("should scan QR and exchange contact", async ({ page }) => {
    await page.goto("/participant/networking");
    await page.click("text=Scan Badge to Exchange Contact");
    // Mock QR scan result
    await page.evaluate((payload) => {
      window.dispatchEvent(new CustomEvent("qr-scanned", { detail: payload }));
    }, testQRPayload);
    await expect(page.getByText("Contact Saved!")).toBeVisible();
  });

  test("should submit session feedback", async ({ page }) => {
    await page.goto("/participant/agenda");
    // Click on completed session
    await page.click('[data-meeting-id="completed-meeting-1"]');
    await page.click("text=Give Feedback");
    // Rate 4 stars
    await page.click('[data-rating="4"]');
    await page.click("text=informative");
    await page.fill('[name="comment"]', "Great session");
    await page.click("text=Submit Feedback");
    await expect(page.getByText("Thank you for your feedback")).toBeVisible();
  });

  test("should export agenda as iCal", async ({ page }) => {
    await page.goto("/participant/agenda");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("text=Export to Calendar"),
    ]);
    expect(download.suggestedFilename()).toContain(".ics");
  });

  test("should work offline for badge display", async ({ page, context }) => {
    await page.goto("/participant/badge");
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();

    // Go offline
    await context.setOffline(true);
    await page.reload();

    // Badge should still be visible from cache
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.getByText("Offline")).toBeVisible();
  });
});

test.describe("Event Clone (Admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should clone event via dialog", async ({ page }) => {
    await page.goto("/admin/events");
    await page.click('[data-event-id="event-1"] >> text=Clone');
    await page.fill('[name="name"]', "38th AU Summit");
    await page.fill('[name="startDate"]', "2026-02-10");
    await page.fill('[name="endDate"]', "2026-02-17");
    await page.click("text=Clone Now");
    await expect(page.getByText("Clone operation started")).toBeVisible();
    // Wait for completion
    await expect(page.getByText("Clone completed")).toBeVisible({ timeout: 30000 });
  });

  test("should display YoY analytics for event series", async ({ page }) => {
    await page.goto("/admin/series/au-summit/analytics");
    await expect(page.getByText("Edition Comparison")).toBeVisible();
    await expect(page.getByText("Total Registrations")).toBeVisible();
    await expect(page.getByText("Approval Rate")).toBeVisible();
  });
});
```

### 9.4 Performance Tests

```typescript
// ─── K6 Performance Scenarios ─────────────────────────────────

// k6/participant-experience.js

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    agenda_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 500 }, // Ramp to 500 participants
        { duration: "5m", target: 500 }, // Hold steady
        { duration: "2m", target: 1000 }, // Peak: 1000 concurrent
        { duration: "5m", target: 1000 }, // Hold peak
        { duration: "2m", target: 0 }, // Ramp down
      ],
      exec: "agendaScenario",
    },
    badge_display: {
      executor: "constant-vus",
      vus: 200,
      duration: "5m",
      exec: "badgeScenario",
    },
    sse_connections: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5m", target: 2000 }, // 2000 concurrent SSE connections
        { duration: "10m", target: 2000 },
        { duration: "2m", target: 0 },
      ],
      exec: "sseScenario",
    },
  },
  thresholds: {
    "http_req_duration{scenario:agenda_load}": ["p(95)<500", "p(99)<1000"],
    "http_req_duration{scenario:badge_display}": ["p(95)<200", "p(99)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export function agendaScenario() {
  const token = getParticipantToken();
  const res = http.get(`${BASE_URL}/api/participant/agenda?from=2026-02-10&to=2026-02-17`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(res, {
    "agenda loaded": (r) => r.status === 200,
    "has items": (r) => JSON.parse(r.body).dates.length > 0,
  });
  sleep(Math.random() * 5 + 5); // 5-10s between views
}

export function badgeScenario() {
  const token = getParticipantToken();
  const res = http.get(`${BASE_URL}/api/participant/badge`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(res, {
    "badge loaded": (r) => r.status === 200,
    "has QR code": (r) => JSON.parse(r.body).qrCode !== undefined,
  });
  sleep(Math.random() * 3 + 2);
}
```

---

## 10. Security Considerations

### 10.1 Participant Data Scoping

```typescript
// ─── Participant Auth Middleware ───────────────────────────────

// All /api/participant/* routes use this middleware.
// Participant can ONLY access their own data.

export async function participantAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  const decoded = verifyParticipantToken(token);

  // Token contains: { participantId, eventId, accessLevel }
  req.participantId = decoded.participantId;
  req.eventId = decoded.eventId;
  req.accessLevel = decoded.accessLevel;

  // Verify participant still exists and is active
  const participant = await prisma.participant.findUnique({
    where: { id: decoded.participantId },
  });

  if (!participant || participant.eventId !== decoded.eventId) {
    return res.status(401).json({ error: "Invalid participant token" });
  }

  next();
}

// Every query is scoped to the authenticated participant:
// ❌ prisma.personalAgenda.findMany({ where: { meetingId } })
// ✅ prisma.personalAgenda.findMany({ where: { participantId: req.participantId, meetingId } })
```

### 10.2 QR Payload Security

| Threat                   | Mitigation                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| QR forgery               | AES-256-GCM encryption with HMAC authentication tag                                         |
| Replay attack            | Timestamp (`ts`) in payload; scanners reject payloads older than event duration             |
| Badge screenshot sharing | QR payload tied to specific participantId; scanner verifies photo match                     |
| Payload extraction       | IV is randomized per badge; key stored only in server environment                           |
| Badge cloning            | Access control scanners flag multiple scans from different entry points within short window |

### 10.3 Networking Privacy

| Control                  | Implementation                                                  |
| ------------------------ | --------------------------------------------------------------- |
| Directory opt-in         | `networkVisible` defaults to `false` in ParticipantPreference   |
| Contact exchange consent | QR scan requires physical proximity (badge must be shown)       |
| Profile visibility       | Only name, title, org, country, photo shown — never email/phone |
| Request rate limiting    | Max 20 networking requests per day per participant              |
| Request expiry           | Pending requests auto-expire after 48 hours                     |
| Data minimization        | Contact exports contain only public profile fields              |
| Blocking                 | Participant can decline and block repeat requests               |

### 10.4 RBAC Matrix

| Action                 | Participant (Own) | Focal Point (Delegation) | Event Admin | Series Manager |
| ---------------------- | ----------------- | ------------------------ | ----------- | -------------- |
| View own agenda        | ✅                | —                        | —           | —              |
| View delegation status | —                 | ✅                       | ✅          | —              |
| View digital badge     | ✅                | —                        | —           | —              |
| Exchange contacts      | ✅                | —                        | —           | —              |
| Submit feedback        | ✅                | —                        | —           | —              |
| View feedback summary  | —                 | —                        | ✅          | —              |
| Initiate clone         | —                 | —                        | ✅          | ✅             |
| Rollback clone         | —                 | —                        | ✅          | ✅             |
| Manage series          | —                 | —                        | ✅          | ✅             |
| View YoY analytics     | —                 | —                        | ✅          | ✅             |
| Carry-forward          | —                 | —                        | ✅          | ✅             |
| View session demand    | —                 | —                        | ✅          | —              |

### 10.5 SSE Authentication

```typescript
// SSE connections cannot use Authorization headers.
// Use short-lived, single-use SSE tokens.

export async function createSSEToken(participantId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await redis.set(`sse:token:${token}`, participantId, "EX", 30); // 30s TTL
  return token;
}

// Client connects: GET /api/participant/events/stream?token=<sse-token>
// Server validates and consumes token (single use)
```

---

## 11. Performance Requirements

### 11.1 Response Time Targets

| Endpoint                            | P50     | P95      | P99      | Notes                             |
| ----------------------------------- | ------- | -------- | -------- | --------------------------------- |
| GET /participant/agenda             | < 100ms | < 300ms  | < 500ms  | Multi-source join; heavy caching  |
| GET /participant/badge              | < 50ms  | < 100ms  | < 200ms  | Single record lookup; cached      |
| GET /participant/directory          | < 200ms | < 500ms  | < 1000ms | Paginated; search indexed         |
| POST /participant/contacts/exchange | < 150ms | < 300ms  | < 500ms  | Decrypt + validate + write        |
| POST /participant/feedback          | < 100ms | < 200ms  | < 300ms  | Single write                      |
| GET /participant/notifications      | < 100ms | < 200ms  | < 400ms  | Indexed by participant            |
| POST /events/:id/clone              | < 500ms | < 1000ms | < 2000ms | Async job; returns immediately    |
| GET /event-series/:id/analytics     | < 1s    | < 3s     | < 5s     | Cross-edition aggregation; cached |
| SSE connection setup                | < 200ms | < 500ms  | < 1000ms | Token validation + upgrade        |

### 11.2 Throughput Requirements

| Metric                    | Target | Notes                         |
| ------------------------- | ------ | ----------------------------- |
| Concurrent participants   | 2,000  | Peak during event opening     |
| SSE connections           | 2,000  | One per active participant    |
| Badge scans/minute        | 200    | Peak at registration desk     |
| Contact exchanges/minute  | 50     | Peak during networking breaks |
| Feedback submissions/hour | 500    | Post-session bursts           |
| Push notifications/minute | 1,000  | Schedule change broadcast     |
| Clone operations/day      | 10     | Admin-only, infrequent        |

### 11.3 Caching Strategy

| Data                   | Cache Layer                 | TTL      | Invalidation                         |
| ---------------------- | --------------------------- | -------- | ------------------------------------ |
| Personal agenda        | TanStack Query (client)     | 5 min    | SSE invalidation event               |
| Digital badge          | IndexedDB (client)          | 24 hours | Manual refresh only                  |
| Venue floor plans      | Service Worker (CacheFirst) | 30 days  | App version update                   |
| Participant directory  | TanStack Query (client)     | 10 min   | Stale-while-revalidate               |
| Session demand (admin) | Redis (server)              | 2 min    | Write-through on agenda change       |
| YoY analytics          | Redis (server)              | 30 min   | Manual invalidation on data change   |
| Notification count     | Redis (server)              | 30 sec   | Write-through on notification create |

### 11.4 Database Optimization

```sql
-- Materialized view for session demand analytics (refreshed every 2 minutes)
CREATE MATERIALIZED VIEW mv_session_demand AS
SELECT
  m.id as meeting_id,
  m.title,
  m."eventId",
  v.capacity,
  COUNT(*) FILTER (WHERE pa.status = 'INTERESTED') as interested,
  COUNT(*) FILTER (WHERE pa.status = 'CONFIRMED') as confirmed,
  COUNT(*) FILTER (WHERE pa.status = 'ATTENDED') as attended
FROM "Meeting" m
LEFT JOIN "PersonalAgenda" pa ON pa."meetingId" = m.id
LEFT JOIN "Venue" v ON v.id = m."venueId"
GROUP BY m.id, m.title, m."eventId", v.capacity;

CREATE UNIQUE INDEX idx_mv_session_demand_meeting ON mv_session_demand (meeting_id);

-- Materialized view for YoY analytics (refreshed hourly)
CREATE MATERIALIZED VIEW mv_edition_metrics AS
SELECT
  ee."seriesId",
  ee.id as edition_id,
  ee."editionNumber",
  ee.year,
  COUNT(p.id) as total_registrations,
  COUNT(p.id) FILTER (WHERE p.status = 'APPROVED') as approved,
  AVG(EXTRACT(EPOCH FROM (p."approvedAt" - p."submittedAt")) / 3600)
    FILTER (WHERE p."approvedAt" IS NOT NULL) as avg_approval_hours,
  COUNT(DISTINCT p.country) as country_count
FROM "EventEdition" ee
JOIN "Participant" p ON p."eventId" = ee."eventId"
GROUP BY ee."seriesId", ee.id, ee."editionNumber", ee.year;

CREATE UNIQUE INDEX idx_mv_edition_metrics ON mv_edition_metrics (edition_id);
```

### 11.5 Scalability Tiers

| Tier                     | Participants   | SSE Connections                  | Architecture  |
| ------------------------ | -------------- | -------------------------------- | ------------- |
| **Small** (< 500)        | Single server  | Direct SSE                       | Monolith      |
| **Medium** (500-2,000)   | 2 app servers  | Redis pub/sub SSE fanout         | Load balanced |
| **Large** (2,000-10,000) | 4+ app servers | Dedicated SSE servers            | Microservice  |
| **Mega** (10,000+)       | Auto-scaling   | SSE gateway + WebSocket fallback | Event-driven  |

---

## 12. Open Questions & Decisions

### 12.1 Architecture Decision Records

#### ADR-16-001: PWA vs Native Mobile App

- **Status:** Decided — PWA
- **Decision:** Use PWA (Progressive Web App) instead of native iOS/Android apps
- **Rationale:**
  - Zero-install experience for international delegates (no app store friction)
  - Single codebase for all platforms
  - Offline support via Service Worker covers critical features (badge, agenda)
  - Push notifications supported on all modern browsers
  - Camera API available for QR scanning and document upload
  - App store review process would delay event-specific customizations
- **Trade-offs:**
  - Limited access to NFC (would be useful for badge tap-to-share)
  - Push notifications less reliable on iOS than native
  - No background location tracking (wayfinding limited to manual refresh)

#### ADR-16-002: Wallet Integration Approach

- **Status:** Decided — Apple Wallet + Google Wallet
- **Decision:** Support both Apple Wallet (.pkpass) and Google Wallet (JWT) for digital badges
- **Rationale:**
  - Covers ~95% of smartphone users
  - Location-triggered pass surfacing reduces friction at venue entry
  - Auto-update capability when badge details change
  - Professional appearance vs. custom QR display
- **Trade-offs:**
  - Requires Apple Developer Program membership and WWDR certificate
  - Google Wallet API requires Google Cloud project setup
  - Pass updates require push notification infrastructure per wallet platform

#### ADR-16-003: QR Encryption Algorithm

- **Status:** Decided — AES-256-GCM
- **Decision:** Use AES-256-GCM for QR payload encryption
- **Rationale:**
  - Authenticated encryption prevents both forgery and data extraction
  - Random IV per badge prevents pattern analysis
  - Compact output suitable for QR code capacity
  - Native Node.js crypto support (no external dependencies)
- **Trade-offs:**
  - Server-side decryption required (scanners must be online)
  - Key rotation requires re-generation of all active badges

#### ADR-16-004: Clone Strategy — Transaction vs Saga

- **Status:** Decided — Single Transaction with Savepoints
- **Decision:** Execute clone within a single database transaction
- **Rationale:**
  - Atomic guarantee: clone either fully succeeds or fully rolls back
  - Simpler than saga pattern for an operation with no external service calls
  - 2-minute timeout is sufficient for events with up to 1,000 total elements
  - Savepoints allow logging progress within the transaction
- **Trade-offs:**
  - Long-running transaction holds locks (mitigated by running as background job)
  - Cannot clone across databases or tenants
  - Very large events (10,000+ elements) may require chunked approach

### 12.2 Open Questions

| #   | Question                                                       | Impact      | Options                                                                 | Status                     |
| --- | -------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- | -------------------------- |
| 1   | Should networking support in-app chat?                         | UX          | (a) Chat feature, (b) Meeting request only, (c) External messaging link | Deferred to Phase 5        |
| 2   | How to handle participant badge photos taken by mobile camera? | Quality     | (a) Client-side crop/resize, (b) Server-side processing, (c) Both       | Pending design review      |
| 3   | Should carry-forward support cross-series import?              | Scope       | (a) Same series only, (b) Any event in tenant, (c) Cross-tenant         | Same series only (current) |
| 4   | Real-time wayfinding with indoor positioning?                  | Complexity  | (a) Static maps only, (b) BLE beacons, (c) WiFi fingerprinting          | Static maps for Phase 3    |
| 5   | Should session feedback include speaker-specific ratings?      | Granularity | (a) Session-level only, (b) Speaker-level, (c) Both                     | Pending PM input           |
| 6   | Multi-device sync for participant preferences?                 | UX          | (a) Per-device, (b) Server-synced, (c) Last-write-wins                  | Server-synced (current)    |
| 7   | Should clone operation support incremental updates?            | Admin UX    | (a) Full clone only, (b) Incremental diff + merge                       | Full clone only (current)  |
| 8   | Export personal agenda to Google Calendar API?                 | Integration | (a) iCal file only, (b) Google Calendar API, (c) Both                   | iCal only for now          |

---

## Appendix

### A. Glossary

| Term                 | Definition                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Carry-Forward**    | Process of importing participant data from a previous event edition into a new edition for pre-filled registration |
| **Clone Operation**  | Deep copy of an entire event configuration (workflows, forms, badges, etc.) to create a new event                  |
| **Contact Exchange** | QR-based process where two participants scan each other's badges to save contact information                       |
| **Digital Badge**    | Electronic version of the physical accreditation badge, stored in mobile wallet                                    |
| **Edition**          | A specific occurrence of a recurring event within a series (e.g., 37th AU Summit)                                  |
| **Event Series**     | A grouping of related recurring events (e.g., "AU Summit" series with annual editions)                             |
| **Focal Point**      | The designated contact person for a country's delegation who manages registration                                  |
| **Micro-Survey**     | Brief post-session feedback form (1-5 star rating + optional tags/comment)                                         |
| **Personal Agenda**  | Participant's curated schedule of sessions they plan to attend                                                     |
| **PWA**              | Progressive Web App — web application with native-like capabilities (offline, push, install)                       |
| **QR Payload**       | Encrypted data embedded in the QR code on badges (contains participant ID, event ID, access level)                 |
| **Session Demand**   | Aggregate count of participants interested/confirmed for a session vs room capacity                                |
| **SSE Token**        | Short-lived, single-use token for authenticating Server-Sent Events connections                                    |
| **VAPID**            | Voluntary Application Server Identification — protocol for web push notifications                                  |
| **Wayfinding**       | Indoor navigation system providing walking directions between venue zones                                          |
| **Wallet Pass**      | Digital pass stored in Apple Wallet or Google Wallet with QR barcode and event information                         |
| **YoY Analytics**    | Year-over-Year analytics comparing metrics across editions of an event series                                      |

### B. Wallet Pass JSON Specification

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.accredio.event",
  "serialNumber": "<participant-id>",
  "teamIdentifier": "<APPLE_TEAM_ID>",
  "organizationName": "African Union",
  "description": "Event Badge",
  "logoText": "AU Summit 2026",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb(0, 107, 63)",
  "labelColor": "rgb(200, 200, 200)",
  "eventTicket": {
    "primaryFields": [{ "key": "name", "label": "NAME", "value": "H.E. John Doe" }],
    "secondaryFields": [
      { "key": "org", "label": "ORGANIZATION", "value": "Republic of Kenya" },
      { "key": "type", "label": "TYPE", "value": "Minister" }
    ],
    "auxiliaryFields": [
      { "key": "access", "label": "ACCESS", "value": "CLOSED SESSION" },
      { "key": "code", "label": "CODE", "value": "REG-2026-0042" }
    ],
    "backFields": [
      { "key": "event", "label": "EVENT", "value": "38th African Union Summit" },
      { "key": "dates", "label": "DATES", "value": "February 10-17, 2026" },
      { "key": "venue", "label": "VENUE", "value": "African Union Conference Centre, Addis Ababa" },
      { "key": "emergency", "label": "EMERGENCY", "value": "+251-xx-xxx-xxxx" }
    ]
  },
  "barcode": {
    "format": "PKBarcodeFormatQR",
    "message": "<encrypted-qr-payload>",
    "messageEncoding": "iso-8859-1"
  },
  "locations": [
    { "latitude": 9.0192, "longitude": 38.7525, "relevantText": "Welcome to AU Summit 2026" }
  ],
  "relevantDate": "2026-02-10T08:00:00+03:00",
  "expirationDate": "2026-02-18T23:59:59+03:00",
  "voided": false,
  "webServiceURL": "https://api.accredio.com/wallet",
  "authenticationToken": "<wallet-auth-token>"
}
```

### C. iCal Export Format

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Accredio//Participant Agenda//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:AU Summit 2026 - My Agenda
X-WR-TIMEZONE:Africa/Addis_Ababa

BEGIN:VEVENT
DTSTART:20260210T090000
DTEND:20260210T103000
SUMMARY:Opening Ceremony
LOCATION:Plenary Hall, African Union Conference Centre
DESCRIPTION:38th African Union Summit Opening Ceremony\n\nAttendees: 600\nAccess: OPEN
STATUS:CONFIRMED
UID:meeting-<meeting-id>@accredio.com
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Opening Ceremony starts in 15 minutes
END:VALARM
END:VEVENT

BEGIN:VEVENT
DTSTART:20260210T143000
DTEND:20260210T160000
SUMMARY:Bilateral: Kenya - Ethiopia
LOCATION:Bilateral Room 7
DESCRIPTION:Bilateral meeting\n\nPrivate meeting\nDriver pickup at 14:15
STATUS:CONFIRMED
UID:meeting-<meeting-id>@accredio.com
SEQUENCE:0
CLASS:PRIVATE
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Bilateral meeting starts in 30 minutes
END:VALARM
END:VEVENT

END:VCALENDAR
```

### D. PWA Service Worker Strategy

```typescript
// ─── Service Worker Registration ──────────────────────────────

// workbox-config.js
module.exports = {
  globDirectory: "build/client/",
  globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
  swDest: "build/client/sw.js",
  runtimeCaching: [
    {
      // App shell — cache first, update in background
      urlPattern: /\/participant\/.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "participant-pages",
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // API responses — network first, fallback to cache
      urlPattern: /\/api\/participant\/(agenda|badge|notifications)/,
      handler: "NetworkFirst",
      options: {
        cacheName: "participant-api",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      // Venue maps — cache first (rarely change)
      urlPattern: /\/api\/participant\/venue\/(map|wayfinding)/,
      handler: "CacheFirst",
      options: {
        cacheName: "venue-maps",
        expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // Participant photos — cache first
      urlPattern: /\.blob\.core\.windows\.net\/.*\.(jpg|jpeg|png|webp)/,
      handler: "CacheFirst",
      options: {
        cacheName: "participant-photos",
        expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
  ],
};
```

### E. Cross-Module Reference Index

| Section                            | References To                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| 3.2 EventSeries/EventEdition       | [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md#event-model)                   |
| 3.2 PersonalAgenda → Meeting       | [Module 01: Meeting Model](./01-DATA-MODEL-FOUNDATION.md#meeting)                    |
| 3.2 DigitalBadge → Participant     | [Module 09: Participant](./09-REGISTRATION-AND-ACCREDITATION.md#participant-model)   |
| 5.1 Clone → Workflow               | [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md#workflow-schema)                |
| 5.1 Clone → FormTemplate           | [Module 03: Visual Form Designer](./03-VISUAL-FORM-DESIGNER.md#form-schema)          |
| 5.2 Badge → QR Encryption          | [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md#encryption)                |
| 5.3 Agenda → BilateralRequest      | [Module 12: Protocol](./12-PROTOCOL-AND-DIPLOMACY.md#bilateral-meetings)             |
| 5.3 Agenda → TransportRequest      | [Module 11: Logistics](./11-LOGISTICS-AND-VENUE.md#transport)                        |
| 5.3 Agenda → SeatAssignment        | [Module 12: Protocol](./12-PROTOCOL-AND-DIPLOMACY.md#seating)                        |
| 5.6 Notifications → Web Push       | [Module 07: API Layer](./07-API-AND-INTEGRATION-LAYER.md#push-notifications)         |
| 6.8 Venue Map → FloorPlan          | [Module 11: Logistics](./11-LOGISTICS-AND-VENUE.md#floor-plans)                      |
| 7.3 Demand Alerts → Command Center | [Module 10: Operations](./10-EVENT-OPERATIONS-CENTER.md#command-center)              |
| 7.6 Certificate → Template Engine  | [Module 14: Content](./14-CONTENT-AND-DOCUMENTS.md#certificates)                     |
| 8.1 Settings Keys                  | [Module 17: Settings Registry](./17-SETTINGS-AND-CONFIGURATION.md#settings-registry) |

---

_End of Module 16: Participant Experience_
