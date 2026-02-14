# Module 10: Event Operations Center

> **Module:** 10 - Event Operations Center
> **Version:** 1.0
> **Last Updated:** February 12, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md), [Module 05: Security & Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md), [Module 07: API & Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)
> **Required By:** [Module 11: Logistics & Venue](./11-LOGISTICS-AND-VENUE.md), [Module 12: Protocol & Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md)
> **Integrates With:** [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md), [Module 06: Infrastructure & DevOps](./06-INFRASTRUCTURE-AND-DEVOPS.md), [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Module Boundaries](#14-module-boundaries)
2. [Architecture](#2-architecture)
   - 2.1 [Event Operations Platform Architecture](#21-event-operations-platform-architecture)
   - 2.2 [Real-Time Data Aggregation Pipeline](#22-real-time-data-aggregation-pipeline)
   - 2.3 [Scanner Device Management System](#23-scanner-device-management-system)
   - 2.4 [Alert Correlation Engine](#24-alert-correlation-engine)
   - 2.5 [Kiosk Architecture](#25-kiosk-architecture)
   - 2.6 [Command Center Architecture](#26-command-center-architecture)
3. [Data Model](#3-data-model)
   - 3.1 [Core Enums](#31-core-enums)
   - 3.2 [Check-In & Access Control Models](#32-check-in--access-control-models)
   - 3.3 [Analytics Models](#33-analytics-models)
   - 3.4 [Kiosk Models](#34-kiosk-models)
   - 3.5 [Command Center Models](#35-command-center-models)
   - 3.6 [Extended Operations Models](#36-extended-operations-models)
   - 3.7 [ER Diagram](#37-er-diagram)
   - 3.8 [Index Catalog](#38-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Check-In & Scan Endpoints](#41-check-in--scan-endpoints)
   - 4.2 [Checkpoint Management](#42-checkpoint-management)
   - 4.3 [Occupancy Endpoints](#43-occupancy-endpoints)
   - 4.4 [Analytics Endpoints](#44-analytics-endpoints)
   - 4.5 [Kiosk Session Management](#45-kiosk-session-management)
   - 4.6 [Command Center SSE Streams](#46-command-center-sse-streams)
   - 4.7 [Alert Management](#47-alert-management)
5. [Business Logic](#5-business-logic)
   - 5.1 [QR Badge Scanning Flow](#51-qr-badge-scanning-flow)
   - 5.2 [QR Badge Scanning Engine](#52-qr-badge-scanning-engine)
   - 5.3 [Scanner Device Management](#53-scanner-device-management)
   - 5.4 [Real-Time Occupancy Tracking](#54-real-time-occupancy-tracking)
   - 5.5 [Offline Scanner Capability](#55-offline-scanner-capability)
   - 5.6 [Alert Correlation Engine](#56-alert-correlation-engine)
   - 5.7 [Real-Time Data Pipeline](#57-real-time-data-pipeline)
   - 5.8 [PDF Snapshot Generation](#58-pdf-snapshot-generation)
   - 5.9 [Kiosk Mode Implementation](#59-kiosk-mode-implementation)
   - 5.10 [Self-Service Badge Collection Flow](#510-self-service-badge-collection-flow)
   - 5.11 [Command Center Decision Support](#511-command-center-decision-support)
   - 5.12 [Historical Event Replay](#512-historical-event-replay)
   - 5.13 [Predictive Analytics](#513-predictive-analytics)
   - 5.14 [Analytics Aggregation Engine](#514-analytics-aggregation-engine)
6. [User Interface](#6-user-interface)
   - 6.1 [Scanner Interface](#61-scanner-interface)
   - 6.2 [Enhanced Scanner with Photo Verification](#62-enhanced-scanner-with-photo-verification)
   - 6.3 [Real-Time Occupancy Dashboard](#63-real-time-occupancy-dashboard)
   - 6.4 [Analytics Dashboard](#64-analytics-dashboard)
   - 6.5 [Kiosk Self-Service Interface](#65-kiosk-self-service-interface)
   - 6.6 [Queue Display Board](#66-queue-display-board)
   - 6.7 [Command Center War Room Layout](#67-command-center-war-room-layout)
   - 6.8 [Event Timeline Visualization](#68-event-timeline-visualization)
   - 6.9 [Gate Throughput Heatmap](#69-gate-throughput-heatmap)
   - 6.10 [Alert Management Console](#610-alert-management-console)
   - 6.11 [Mobile Scanner App](#611-mobile-scanner-app)
7. [Integration Points](#7-integration-points)
   - 7.1 [Module Integration Map](#71-module-integration-map)
   - 7.2 [Check-In Integration Points](#72-check-in-integration-points)
   - 7.3 [Analytics Integration Points](#73-analytics-integration-points)
   - 7.4 [Kiosk Integration Points](#74-kiosk-integration-points)
   - 7.5 [Command Center Integration Points](#75-command-center-integration-points)
8. [Configuration](#8-configuration)
   - 8.1 [Environment Variables](#81-environment-variables)
   - 8.2 [Runtime Configuration](#82-runtime-configuration)
   - 8.3 [Alert Configuration](#83-alert-configuration)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Scanner Offline/Online Transition Tests](#91-scanner-offlineonline-transition-tests)
   - 9.2 [Occupancy Calculation Accuracy Tests](#92-occupancy-calculation-accuracy-tests)
   - 9.3 [Alert Threshold and Correlation Tests](#93-alert-threshold-and-correlation-tests)
   - 9.4 [Kiosk Mode Security Tests](#94-kiosk-mode-security-tests)
   - 9.5 [Analytics Aggregation Accuracy Tests](#95-analytics-aggregation-accuracy-tests)
   - 9.6 [Command Center SSE Reliability Tests](#96-command-center-sse-reliability-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [QR Payload Encryption](#101-qr-payload-encryption)
    - 10.2 [Scanner Device Authentication](#102-scanner-device-authentication)
    - 10.3 [Kiosk Lockdown](#103-kiosk-lockdown)
    - 10.4 [Offline Scan Data Integrity](#104-offline-scan-data-integrity)
    - 10.5 [Access Log Tamper Detection](#105-access-log-tamper-detection)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [SLA Targets](#111-sla-targets)
    - 11.2 [Scalability Analysis](#112-scalability-analysis)
    - 11.3 [Caching Strategy](#113-caching-strategy)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [ScanResult Code Catalog](#c-scanresult-code-catalog)

---

## 1. Overview

### 1.1 Purpose

Every accreditation system ultimately converges on a single moment: a participant stands at a gate, presents a badge, and the system must decide -- in under a second -- whether to grant or deny entry. This decision depends on the participant's approval status, access level, the meeting's access restrictions, and real-time capacity. A robust check-in and access control system is the operational backbone that turns accreditation data into physical security enforcement.

The Event Operations Center is the real-time operational backbone of the accreditation platform. It unifies four critical operational subsystems into a single, cohesive module:

- **Check-In and Access Control** -- QR badge scanning, gate management, and entry/exit decisions that enforce accreditation rules at physical access points.
- **Advanced Analytics** -- Real-time dashboards that transform raw operational data (registrations, approvals, scan logs, incidents) into actionable intelligence for decision-makers.
- **Kiosk Self-Service** -- Touch-screen stations that enable participants to look up their status, join badge collection queues, and access event information without staff assistance.
- **Live Command Center** -- A unified multi-panel display designed for wall-mounted screens in operations rooms, consolidating every data stream into real-time situational awareness with one-click emergency responses.

Together, these subsystems transform accreditation data into physical security enforcement, operational intelligence, and participant-facing self-service -- covering the full lifecycle from badge scan to post-event analytics.

### 1.2 Scope

This module covers:

- QR badge scanning and validation engine (decode, decrypt, validate, access check, capacity check, log, respond)
- Checkpoint and gate management across multi-zone venues
- Real-time venue occupancy tracking with capacity alerts
- Scanner device management (registration, health monitoring, offline sync)
- Advanced analytics dashboards with SSE-powered real-time updates
- Metric alerting with configurable thresholds and cooldown periods
- Saved report builder with scheduled PDF generation
- Self-service kiosk mode (status lookup, badge collection queue, wayfinding)
- Queue management with priority-based serving (VIP escalation)
- Live command center with configurable widget layouts
- Alert feed with priority-based routing and escalation chains
- Quick actions for emergency operations (broadcast, lockdown, evacuation)
- Historical event replay for post-event analysis and training
- Predictive analytics for arrival forecasting and staffing recommendations

This module does **not** cover:

- Badge design and printing (see [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md))
- Venue floor plan management (see [Module 11: Logistics & Venue](./11-LOGISTICS-AND-VENUE.md))
- Protocol-specific VIP handling rules (see [Module 12: Protocol & Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md))
- Incident investigation workflows (see Module 14: Incident Management)
- Transport vehicle dispatching (see Module 15: Transport & Fleet)

### 1.3 Key Personas

| Persona                     | Role                                           | Primary Use Cases                                                                                      |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Security Staff**          | Gate officers operating scanner devices        | Scan badges at checkpoints, process manual overrides, report incidents at gates                        |
| **Event Manager**           | Overall event operations lead                  | Monitor occupancy dashboards, review analytics, configure alert thresholds, generate reports           |
| **Command Center Operator** | Operations room staff on wall-mounted displays | Monitor all data streams in real-time, acknowledge alerts, execute quick actions (broadcast, lockdown) |
| **Kiosk User**              | Participant at self-service station            | Look up accreditation status, join badge collection queue, access event information and wayfinding     |
| **Analytics Analyst**       | Post-event review and reporting staff          | Build custom reports, analyze trends, generate PDF snapshots, review historical data                   |
| **Zone Lead**               | Area supervisor responsible for a venue zone   | Monitor zone-specific occupancy, manage zone gates, respond to zone alerts                             |

### 1.4 Module Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENT OPERATIONS CENTER                           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Check-In &  │  │  Advanced    │  │   Kiosk    │  │ Command  │ │
│  │  Access      │  │  Analytics   │  │   Self-    │  │ Center   │ │
│  │  Control     │  │  Dashboard   │  │   Service  │  │          │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  └────┬─────┘ │
│         │                 │                │              │        │
│  ┌──────┴─────────────────┴────────────────┴──────────────┴─────┐  │
│  │              Real-Time Data Aggregation Pipeline              │  │
│  │         (Scan Events -> Metric Aggregation -> SSE)           │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────┐  ┌───────┴──────┐  ┌──────────────────────────┐ │
│  │   Scanner    │  │    Alert     │  │   Analytics Aggregation  │ │
│  │   Device     │  │  Correlation │  │   Engine                 │ │
│  │   Manager    │  │    Engine    │  │                          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                     │
    ┌────┴────┐         ┌────┴────┐           ┌────┴────┐
    │Module 09│         │Module 04│           │Module 07│
    │Badge    │         │Workflow │           │API/SSE  │
    │Data     │         │Metrics  │           │Infra    │
    └─────────┘         └─────────┘           └─────────┘
```

---

## 2. Architecture

### 2.1 Event Operations Platform Architecture

The Event Operations Center follows a real-time, event-driven architecture where every scan, status change, and operational action produces events that flow through a central aggregation pipeline and are broadcast to all subscribed consumers (dashboards, command center widgets, alert engine, analytics snapshots).

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     EVENT OPERATIONS PLATFORM                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      INPUT LAYER                                │    │
│  │                                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │    │
│  │  │  Scanner  │  │  Kiosk   │  │  Manual  │  │  External     │  │    │
│  │  │  Devices  │  │  Devices │  │  Entry   │  │  Systems      │  │    │
│  │  │  (QR/NFC)│  │  (Touch) │  │  (Staff) │  │  (Workflow,   │  │    │
│  │  │          │  │          │  │          │  │   Incidents)  │  │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │    │
│  └───────┼──────────────┼────────────┼────────────────┼───────────┘    │
│          │              │            │                │                  │
│  ┌───────┴──────────────┴────────────┴────────────────┴───────────┐    │
│  │                    EVENT BUS (In-Memory Pub/Sub)                │    │
│  │                                                                  │    │
│  │  Events: scan:completed, occupancy:changed, alert:created,      │    │
│  │          kiosk:interaction, state:changed, metric:updated       │    │
│  └───────┬──────────────┬────────────┬────────────────┬───────────┘    │
│          │              │            │                │                  │
│  ┌───────┴───────┐ ┌───┴────────┐ ┌┴──────────┐ ┌───┴──────────────┐  │
│  │  Metric       │ │  Alert     │ │ State     │ │  SSE             │  │
│  │  Aggregator   │ │ Correlation│ │ Change    │ │  Broadcaster     │  │
│  │               │ │  Engine    │ │ Recorder  │ │                  │  │
│  │ - Running     │ │            │ │           │ │ - Per-client     │  │
│  │   totals      │ │ - Group    │ │ - Event   │ │   connections    │  │
│  │ - Snapshots   │ │   related  │ │   sourcing│ │ - Channel-based  │  │
│  │ - Forecasts   │ │ - Suppress │ │ - Audit   │ │   multiplexing   │  │
│  │               │ │   dupes    │ │   trail   │ │ - Delta updates  │  │
│  └───────┬───────┘ └───┬────────┘ └┬──────────┘ └───┬──────────────┘  │
│          │              │           │                │                  │
│  ┌───────┴──────────────┴───────────┴────────────────┴───────────┐    │
│  │                     OUTPUT LAYER                                │    │
│  │                                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │    │
│  │  │ Analytics│  │ Command  │  │ Occupancy│  │  Alert        │  │    │
│  │  │ Dashboard│  │ Center   │  │ Dashboard│  │  Notifications│  │    │
│  │  │          │  │ Widgets  │  │          │  │  (SMS/Email)  │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   PERSISTENCE LAYER                              │    │
│  │                                                                  │    │
│  │  PostgreSQL          Redis                  S3/MinIO             │    │
│  │  - AccessLog         - Occupancy counters   - PDF reports       │    │
│  │  - AnalyticsSnapshot - Scanner heartbeats   - Analytics exports │    │
│  │  - AlertFeed         - Session cache        - Offline scan logs │    │
│  │  - EventStateChange  - SSE client registry                      │    │
│  │  - CommandCenter*    - Metric aggregates                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Real-Time Data Aggregation Pipeline

The aggregation pipeline converts raw operational events into computed metrics broadcast via SSE. Every action in the system (registration, approval, scan, incident) triggers a metric update.

```
┌─────────────────────────────────────────────────────────────────────┐
│                REAL-TIME AGGREGATION PIPELINE                       │
│                                                                     │
│  1. EVENT CAPTURE                                                   │
│  ┌─────────────┐                                                    │
│  │ Prisma       │  Every DB write triggers middleware               │
│  │ Middleware    │──> Emits typed event to EventBus                  │
│  │              │    e.g., { type: 'scan:completed',                │
│  │              │           data: { checkpointId, result, ... } }   │
│  └──────┬───────┘                                                    │
│         │                                                            │
│  2. METRIC COMPUTATION                                               │
│  ┌──────┴───────┐                                                    │
│  │ Metric       │  Maintains running aggregates in Redis:           │
│  │ Aggregator   │  - Occupancy counters (INCR/DECR)                │
│  │              │  - Scan result counts per checkpoint              │
│  │              │  - Registration funnel counts                     │
│  │              │  - Gate throughput (sliding window)               │
│  │              │  - Approval velocity (requests/hour)              │
│  └──────┬───────┘                                                    │
│         │                                                            │
│  3. SNAPSHOT PERSISTENCE                                             │
│  ┌──────┴───────┐                                                    │
│  │ Snapshot     │  Periodically persists Redis aggregates to        │
│  │ Scheduler    │  AnalyticsSnapshot records:                       │
│  │              │  - HOURLY: every 60 minutes                       │
│  │              │  - DAILY: at 23:59 UTC                            │
│  │              │  - WEEKLY: Sunday 23:59 UTC                       │
│  └──────┬───────┘                                                    │
│         │                                                            │
│  4. SSE BROADCAST                                                    │
│  ┌──────┴───────┐                                                    │
│  │ SSE          │  Pushes delta updates to subscribed clients:      │
│  │ Broadcaster  │  - Channel: /events/:eventId/metrics/summary     │
│  │              │  - Channel: /events/:eventId/metrics/funnel       │
│  │              │  - Channel: /events/:eventId/metrics/occupancy    │
│  │              │  - Channel: /events/:eventId/alerts               │
│  │              │  Only sends changed fields (incremental patches)  │
│  └──────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Scanner Device Management System

```
┌─────────────────────────────────────────────────────────────────────┐
│              SCANNER DEVICE MANAGEMENT                               │
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │  Device       │     │  Health      │     │  Firmware    │        │
│  │  Registry     │     │  Monitor     │     │  Manager     │        │
│  │               │     │              │     │              │        │
│  │ - Register    │     │ - Heartbeat  │     │ - Version    │        │
│  │ - Deactivate  │     │   (30s)      │     │   tracking   │        │
│  │ - Assign to   │     │ - Battery    │     │ - OTA update │        │
│  │   checkpoint  │     │   level      │     │   scheduling │        │
│  │ - Certificate │     │ - Offline    │     │ - Rollback   │        │
│  │   provisioning│     │   detection  │     │              │        │
│  └───────┬───────┘     └───────┬──────┘     └──────────────┘        │
│          │                     │                                     │
│  ┌───────┴─────────────────────┴──────────────────────────────┐     │
│  │                    OFFLINE SYNC PROTOCOL                    │     │
│  │                                                              │     │
│  │  Online Mode:                                                │     │
│  │    Scan -> API call -> real-time validation -> response      │     │
│  │                                                              │     │
│  │  Offline Mode (network lost):                                │     │
│  │    Scan -> local cache lookup -> local validation -> queue   │     │
│  │    Cached data: participant table, blacklist, access rules   │     │
│  │    Sync interval: every 5 minutes when online                │     │
│  │                                                              │     │
│  │  Reconnection:                                               │     │
│  │    Network restored -> batch upload queued scans ->          │     │
│  │    server reconciles occupancy counts -> delta sync cache    │     │
│  └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Alert Correlation Engine

```
┌─────────────────────────────────────────────────────────────────────┐
│              ALERT CORRELATION ENGINE                                 │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  INGESTION                                                 │      │
│  │  Raw alerts from all subsystems flow in:                   │      │
│  │  - Capacity thresholds (occupancy > 75/90/100%)           │      │
│  │  - SLA breaches (approval time > threshold)               │      │
│  │  - Security events (blacklisted badge, multiple denials)  │      │
│  │  - Equipment failures (scanner offline, kiosk down)       │      │
│  │  - Transport delays (vehicle > 10 min late)               │      │
│  └────────────────────────┬──────────────────────────────────┘      │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────────────┐      │
│  │  CORRELATION                                               │      │
│  │                                                             │      │
│  │  1. Deduplication: Suppress identical alerts within         │      │
│  │     cooldown window (default 30 min)                       │      │
│  │  2. Grouping: Cluster related alerts                       │      │
│  │     e.g., 3 gates reporting capacity -> 1 "venue full"    │      │
│  │  3. Priority scoring: Combine base priority + frequency    │      │
│  │     + affected-population-size                             │      │
│  │  4. Escalation: Unacknowledged CRITICAL -> SMS after 5min │      │
│  └────────────────────────┬──────────────────────────────────┘      │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────────────┐      │
│  │  ROUTING                                                   │      │
│  │                                                             │      │
│  │  CRITICAL -> Audio alarm + screen flash + SMS to all       │      │
│  │  HIGH     -> Audio chime + command center + zone lead      │      │
│  │  MEDIUM   -> Command center feed + relevant team           │      │
│  │  LOW      -> Command center feed only (auto-expire 30min) │      │
│  └───────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.5 Kiosk Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     KIOSK ARCHITECTURE                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  KIOSK DEVICE (Locked Browser Mode)                       │       │
│  │                                                            │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │       │
│  │  │  Self-Service │  │  Queue       │  │  Info/       │   │       │
│  │  │  Module       │  │  Display     │  │  Wayfinding  │   │       │
│  │  │              │  │  Module       │  │  Module      │   │       │
│  │  │ - Status     │  │              │  │              │   │       │
│  │  │   lookup     │  │ - Now serving│  │ - Venue map  │   │       │
│  │  │ - Queue join │  │ - Next up    │  │ - Schedule   │   │       │
│  │  │ - Badge scan │  │ - Wait time  │  │ - Directions │   │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │       │
│  │                                                            │       │
│  │  ┌────────────────────────────────────────────────────┐   │       │
│  │  │  Security Layer                                     │   │       │
│  │  │  - Disable OS shortcuts (Alt+Tab, Ctrl+Alt+Del)    │   │       │
│  │  │  - Prevent browser navigation (address bar hidden) │   │       │
│  │  │  - Auto-reset after 120s inactivity                │   │       │
│  │  │  - No file system access                           │   │       │
│  │  │  - Kiosk-only URL whitelist                        │   │       │
│  │  └────────────────────────────────────────────────────┘   │       │
│  │                                                            │       │
│  │  ┌────────────────────────────────────────────────────┐   │       │
│  │  │  Peripherals                                        │   │       │
│  │  │  - Thermal printer (queue ticket slips)            │   │       │
│  │  │  - QR/barcode scanner (badge/passport)             │   │       │
│  │  │  - Touchscreen (primary interaction)               │   │       │
│  │  └────────────────────────────────────────────────────┘   │       │
│  └──────────────────────────────────────────────────────────┘       │
│                              │                                       │
│                    Heartbeat (60s)                                    │
│                              │                                       │
│  ┌──────────────────────────┴───────────────────────────────┐       │
│  │  ADMIN MANAGEMENT PLANE                                   │       │
│  │  - Device registration and provisioning                   │       │
│  │  - Online/offline monitoring (3 min heartbeat threshold)  │       │
│  │  - Remote restart capability                              │       │
│  │  - Usage statistics (lookups/hour, queue joins/hour)      │       │
│  │  - Language preference distribution                       │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.6 Command Center Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                 COMMAND CENTER ARCHITECTURE                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  CLIENT (Wall-Mounted Display / Operator Workstation)     │       │
│  │                                                            │       │
│  │  Single SSE Connection (multiplexed):                     │       │
│  │  GET /api/events/:eventId/command-center/stream           │       │
│  │                                                            │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │       │
│  │  │Widget:   │ │Widget:   │ │Widget:   │ │Widget:   │   │       │
│  │  │Occupancy │ │Alert Feed│ │Transport │ │Gate      │   │       │
│  │  │(2s)      │ │(instant) │ │(5s)      │ │Throughput│   │       │
│  │  └──────────┘ └──────────┘ └──────────┘ │(2s)      │   │       │
│  │                                          └──────────┘   │       │
│  │  Layout: CommandCenterLayout (12x8 grid)                  │       │
│  │  Auto-Rotate: cycles layouts every N seconds              │       │
│  │  Manual Override: click pauses rotation for 5 minutes     │       │
│  └──────────────────────────────────────────────────────────┘       │
│                              │                                       │
│  ┌──────────────────────────┴───────────────────────────────┐       │
│  │  SERVER-SIDE SSE HANDLER                                  │       │
│  │                                                            │       │
│  │  For each connected client:                               │       │
│  │    1. Load client's CommandCenterLayout                   │       │
│  │    2. For each widget in layout:                          │       │
│  │       - Subscribe to relevant EventBus channel            │       │
│  │       - Push initial state snapshot                       │       │
│  │    3. On EventBus event:                                  │       │
│  │       - Compute widget-specific payload                   │       │
│  │       - Push typed SSE event to client                    │       │
│  │       - e.g., { type: "venue_occupancy",                  │       │
│  │                  data: { roomId, count, capacity, pct } } │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  QUICK ACTIONS ENGINE                                     │       │
│  │                                                            │       │
│  │  Standard actions: single operator confirmation           │       │
│  │  CRITICAL actions (LOCKDOWN, EVACUATION):                 │       │
│  │    -> Dual authorization required                         │       │
│  │    -> First operator initiates                            │       │
│  │    -> Second operator authorizes with credentials         │       │
│  │  All actions logged in QuickAction table                  │       │
│  │  All actions are reversible via [Reverse] button          │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Core Enums

```prisma
enum ScanType {
  ENTRY
  EXIT
}

enum ScanResult {
  ALLOWED
  DENIED_QUOTA
  DENIED_ACCESS_LEVEL
  DENIED_INVALID_BADGE
  DENIED_REVOKED
  DENIED_CAPACITY_FULL
  DENIED_BLACKLISTED
  MANUAL_OVERRIDE
}

enum QueueStatus {
  WAITING
  CALLED
  SERVING
  COMPLETED
  NO_SHOW
  CANCELLED
}

enum WidgetType {
  REGISTRATION_PIPELINE
  INCIDENT_FEED
  VENUE_OCCUPANCY
  TRANSPORT_STATUS
  WEATHER_CLOCK
  UPCOMING_SESSIONS
  STAFF_AVAILABILITY
  CATERING_TRACKER
  GATE_THROUGHPUT
  VIP_ARRIVALS
  CUSTOM_METRIC
}

enum AlertPriority {
  CRITICAL    // Immediate action required (security breach, medical emergency)
  HIGH        // Urgent attention (VIP arrival, SLA breach, capacity exceeded)
  MEDIUM      // Notable event (incident reported, staff no-show)
  LOW         // Informational (session starting, milestone reached)
}

enum AlertStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
  EXPIRED
}

enum QuickActionType {
  EMERGENCY_BROADCAST
  GATE_CLOSE_ALL
  GATE_OPEN_ALL
  EVENT_PAUSE
  EVENT_RESUME
  LOCKDOWN
  EVACUATION_ALERT
}
```

### 3.2 Check-In & Access Control Models

```prisma
model Checkpoint {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  name        String   // "Main Gate A", "Plenary Hall Entrance", "VIP Lounge"
  location    String?  // Floor/building reference
  zoneId      String?  // Links to EventZone if multi-zone
  type        String   // GATE, DOOR, SCANNER_STATION
  direction   String   // ENTRY_ONLY, EXIT_ONLY, BIDIRECTIONAL
  isActive    Boolean  @default(true)
  capacity    Int?     // Max throughput per hour (for load balancing)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  accessLogs  AccessLog[]

  @@unique([tenantId, eventId, name])
  @@index([eventId, isActive])
}

model AccessLog {
  id              String     @id @default(cuid())
  checkpointId    String
  checkpoint      Checkpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  participantId   String?    // null if badge scan failed to resolve
  meetingId       String?    // If scanning for a specific meeting/session
  scanType        ScanType
  scanResult      ScanResult
  qrPayload       String     // Raw QR data scanned
  scannedBy       String     // userId of security staff
  deviceId        String?    // Scanner device identifier
  overrideReason  String?    // If MANUAL_OVERRIDE, reason recorded
  scannedAt       DateTime   @default(now())

  @@index([checkpointId, scannedAt])
  @@index([participantId, scannedAt])
  @@index([meetingId, scannedAt])
  @@index([scanResult, scannedAt])
}

model VenueOccupancy {
  id          String   @id @default(cuid())
  eventId     String
  meetingId   String?  // null = overall venue
  zoneId      String?
  currentCount Int     @default(0)
  maxCapacity  Int
  lastUpdated  DateTime @default(now())

  @@unique([eventId, meetingId, zoneId])
}
```

### 3.3 Analytics Models

```prisma
model AnalyticsSnapshot {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  snapshotType String  // HOURLY, DAILY, WEEKLY, ON_DEMAND
  metrics     Json     // { registrationCount, approvalRate, avgApprovalTime, ... }
  generatedAt DateTime @default(now())
  generatedBy String?  // userId if ON_DEMAND, null if automated

  @@index([eventId, snapshotType, generatedAt])
}

model MetricAlert {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  metricName  String   // "approval_sla_breach", "capacity_threshold", "registration_velocity_drop"
  threshold   Float    // Trigger value
  comparator  String   // GT, LT, GTE, LTE, EQ
  isActive    Boolean  @default(true)
  channels    String[] // ["EMAIL", "SSE", "SMS"]
  recipients  String[] // userIds
  cooldownMin Int      @default(30) // Don't re-alert within cooldown
  lastFiredAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([eventId, isActive])
}

model SavedReport {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  name        String
  description String?
  filters     Json     // { dateRange, participantTypes, countries, ... }
  columns     String[] // Selected data columns
  chartType   String?  // BAR, LINE, PIE, TABLE, FUNNEL
  schedule    String?  // Cron expression for automated generation
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([eventId, createdBy])
}
```

### 3.4 Kiosk Models

```prisma
model KioskDevice {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  name        String   // "Kiosk 1 - Main Lobby"
  location    String
  isOnline    Boolean  @default(true)
  lastHeartbeat DateTime @default(now())
  language    String   @default("en")
  mode        String   // SELF_SERVICE, QUEUE_DISPLAY, INFO_ONLY
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sessions    KioskSession[]

  @@unique([tenantId, eventId, name])
}

model QueueTicket {
  id            String      @id @default(cuid())
  tenantId      String
  eventId       String
  participantId String
  ticketNumber  String      // "A-042" (prefix by participant type)
  counterNumber Int?        // Assigned counter when called
  status        QueueStatus
  priority      Int         @default(0) // Higher = served first (VIPs)
  estimatedWait Int?        // Minutes
  joinedAt      DateTime    @default(now())
  calledAt      DateTime?
  servedAt      DateTime?
  completedAt   DateTime?

  @@unique([tenantId, eventId, ticketNumber])
  @@index([eventId, status, priority])
  @@index([participantId])
}

model KioskSession {
  id            String   @id @default(cuid())
  kioskDeviceId String
  kioskDevice   KioskDevice @relation(fields: [kioskDeviceId], references: [id], onDelete: Cascade)
  participantId String?  // null for anonymous browsing (info/wayfinding)
  sessionType   String   // STATUS_LOOKUP, QUEUE_JOIN, BADGE_SCAN, WAYFINDING, INFO
  language      String   @default("en")
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  timedOut      Boolean  @default(false) // true if ended by inactivity timeout
  metadata      Json?    // { pagesVisited, actionsPerformed, ... }

  @@index([kioskDeviceId, startedAt])
  @@index([participantId])
}
```

### 3.5 Command Center Models

```prisma
model CommandCenterLayout {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String   // "Main Ops Screen", "VIP Protocol View", "Transport Desk"
  isDefault   Boolean  @default(false)
  gridCols    Int      @default(12)
  gridRows    Int      @default(8)
  autoRotate  Boolean  @default(false)
  rotateInterval Int   @default(30) // seconds between view rotation
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  widgets     CommandCenterWidget[]

  @@index([eventId])
}

model CommandCenterWidget {
  id          String   @id @default(cuid())
  layoutId    String
  layout      CommandCenterLayout @relation(fields: [layoutId], references: [id], onDelete: Cascade)
  widgetType  WidgetType
  title       String
  config      Json     @default("{}") // Widget-specific: filters, thresholds, colors
  gridX       Int      // Column position (0-based)
  gridY       Int      // Row position (0-based)
  gridW       Int      // Width in grid units
  gridH       Int      // Height in grid units
  refreshRate Int      @default(5) // Seconds between data refresh (SSE reconnect)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([layoutId])
}

model AlertFeed {
  id          String        @id @default(cuid())
  tenantId    String
  eventId     String
  priority    AlertPriority
  status      AlertStatus   @default(ACTIVE)
  source      String        // "access_control", "incident", "workflow", "transport", "catering"
  title       String
  message     String
  metadata    Json?         // Source-specific data: {"gateId": "...", "participantId": "..."}
  acknowledgedBy String?    // userId who acknowledged
  acknowledgedAt DateTime?
  resolvedAt  DateTime?
  expiresAt   DateTime?     // Auto-expire low-priority alerts
  createdAt   DateTime      @default(now())

  @@index([eventId, priority, status])
  @@index([eventId, createdAt])
  @@index([source, status])
}

model QuickAction {
  id          String          @id @default(cuid())
  tenantId    String
  eventId     String
  actionType  QuickActionType
  executedBy  String          // userId
  confirmedBy String?         // Second user for dual-confirmation actions
  parameters  Json?           // {"message": "...", "gateIds": [...]}
  executedAt  DateTime        @default(now())
  reversedAt  DateTime?       // If action was reversed

  @@index([eventId, executedAt])
}

model EventStateChange {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  source      String   // System that produced the change
  entityType  String   // "participant", "incident", "vehicle", "gate", etc.
  entityId    String
  changeType  String   // "created", "updated", "deleted"
  beforeState Json?
  afterState  Json
  timestamp   DateTime @default(now())

  @@index([eventId, timestamp])
  @@index([eventId, entityType, timestamp])
}
```

### 3.6 Extended Operations Models

```prisma
model ScannerDevice {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  deviceSerial    String   @unique // Hardware serial number
  name            String   // "Scanner-Gate-A-01"
  checkpointId    String?  // Currently assigned checkpoint
  firmwareVersion String
  appVersion      String   // Scanner app version
  batteryLevel    Int?     // 0-100, null for wired devices
  isOnline        Boolean  @default(false)
  lastHeartbeat   DateTime?
  lastSyncAt      DateTime? // Last successful data sync
  offlineScans    Int      @default(0) // Pending offline scans to upload
  certificateHash String   // Device certificate fingerprint for auth
  ipAddress       String?
  osVersion       String?  // Android/iOS version
  registeredAt    DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId, eventId])
  @@index([checkpointId])
  @@index([isOnline])
}

model CommandCenterAlert {
  id              String        @id @default(cuid())
  tenantId        String
  eventId         String
  correlationId   String?       // Groups related alerts together
  parentAlertId   String?       // If this alert was merged from children
  priority        AlertPriority
  status          AlertStatus   @default(ACTIVE)
  source          String        // Originating subsystem
  category        String        // "capacity", "security", "equipment", "sla", "transport"
  title           String
  message         String
  suggestedAction String?       // AI-generated suggestion: "Redirect to Overflow Room B"
  metadata        Json?
  acknowledgedBy  String?
  acknowledgedAt  DateTime?
  resolvedBy      String?
  resolvedAt      DateTime?
  escalatedAt     DateTime?     // When escalation was triggered
  escalationLevel Int           @default(0) // 0=initial, 1=zone lead, 2=event director
  suppressedUntil DateTime?     // Cooldown: don't re-fire until this time
  expiresAt       DateTime?
  createdAt       DateTime      @default(now())

  @@index([eventId, priority, status])
  @@index([correlationId])
  @@index([eventId, category, createdAt])
  @@index([status, escalationLevel])
}

model EventTimeline {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  timestamp   DateTime
  category    String   // "scan", "incident", "alert", "action", "milestone", "system"
  title       String
  description String?
  severity    String   @default("INFO") // INFO, WARNING, ERROR, CRITICAL
  entityType  String?  // Related entity type
  entityId    String?  // Related entity ID
  actorId     String?  // User who caused the event
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([eventId, timestamp])
  @@index([eventId, category, timestamp])
  @@index([entityType, entityId])
}
```

### 3.7 ER Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     EVENT OPERATIONS ER DIAGRAM                       │
│                                                                      │
│  ┌─────────────┐    1:N    ┌─────────────┐                          │
│  │ Checkpoint   │──────────│  AccessLog   │                          │
│  │              │          │              │                          │
│  │ id           │          │ id           │                          │
│  │ tenantId     │          │ checkpointId │──┐                      │
│  │ eventId      │          │ participantId│  │                      │
│  │ name         │          │ scanType     │  │                      │
│  │ zoneId       │          │ scanResult   │  │                      │
│  │ direction    │          │ deviceId     │──┼─── ScannerDevice     │
│  └─────────────┘          │ scannedBy    │  │                      │
│                            │ scannedAt    │  │                      │
│  ┌─────────────┐          └─────────────┘  │                      │
│  │VenueOccupancy│                           │                      │
│  │              │  ┌─────────────┐          │                      │
│  │ eventId      │  │ScannerDevice│          │                      │
│  │ meetingId    │  │             │<─────────┘                      │
│  │ zoneId       │  │ deviceSerial│                                  │
│  │ currentCount │  │ checkpointId│─── Checkpoint                    │
│  │ maxCapacity  │  │ batteryLevel│                                  │
│  └─────────────┘  │ isOnline    │                                  │
│                    │ offlineScans│                                  │
│                    └─────────────┘                                  │
│                                                                      │
│  ┌─────────────┐  1:N   ┌────────────────┐                         │
│  │AnalyticsSnap│        │  MetricAlert    │                         │
│  │  shot       │        │                │                         │
│  │ eventId     │        │ eventId        │                         │
│  │ snapshotType│        │ metricName     │                         │
│  │ metrics     │        │ threshold      │                         │
│  └─────────────┘        │ cooldownMin    │                         │
│                          └────────────────┘                         │
│  ┌─────────────┐                                                    │
│  │ SavedReport  │        ┌────────────────┐                         │
│  │              │        │  KioskDevice    │                         │
│  │ eventId      │        │                │  1:N  ┌──────────────┐ │
│  │ filters      │        │ eventId        │──────│ KioskSession  │ │
│  │ columns      │        │ mode           │      │               │ │
│  │ schedule     │        │ isOnline       │      │ sessionType   │ │
│  └─────────────┘        └────────────────┘      │ participantId │ │
│                                                    └──────────────┘ │
│  ┌─────────────────────┐  1:N  ┌────────────────────┐              │
│  │CommandCenterLayout   │──────│CommandCenterWidget   │              │
│  │                     │      │                      │              │
│  │ eventId             │      │ widgetType           │              │
│  │ gridCols/gridRows   │      │ gridX/Y/W/H         │              │
│  │ autoRotate          │      │ refreshRate          │              │
│  └─────────────────────┘      └────────────────────┘              │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐               │
│  │  AlertFeed   │  │ QuickAction  │  │EventState    │               │
│  │             │  │             │  │  Change      │               │
│  │ priority    │  │ actionType  │  │              │               │
│  │ status      │  │ executedBy  │  │ entityType   │               │
│  │ source      │  │ confirmedBy │  │ beforeState  │               │
│  └─────────────┘  └─────────────┘  │ afterState   │               │
│                                      └──────────────┘               │
│  ┌──────────────────┐  ┌─────────────┐  ┌──────────────┐          │
│  │CommandCenterAlert │  │ QueueTicket  │  │EventTimeline  │          │
│  │                  │  │             │  │              │          │
│  │ correlationId    │  │ ticketNumber│  │ category     │          │
│  │ suggestedAction  │  │ priority    │  │ severity     │          │
│  │ escalationLevel  │  │ status      │  │ timestamp    │          │
│  └──────────────────┘  └─────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.8 Index Catalog

| Model               | Index      | Columns                                | Purpose                                        |
| ------------------- | ---------- | -------------------------------------- | ---------------------------------------------- |
| Checkpoint          | `@@unique` | `[tenantId, eventId, name]`            | Prevent duplicate checkpoint names per event   |
| Checkpoint          | `@@index`  | `[eventId, isActive]`                  | Fast lookup of active checkpoints for an event |
| AccessLog           | `@@index`  | `[checkpointId, scannedAt]`            | Gate throughput queries                        |
| AccessLog           | `@@index`  | `[participantId, scannedAt]`           | Participant scan history                       |
| AccessLog           | `@@index`  | `[meetingId, scannedAt]`               | Meeting attendance queries                     |
| AccessLog           | `@@index`  | `[scanResult, scannedAt]`              | Denial analysis and reporting                  |
| VenueOccupancy      | `@@unique` | `[eventId, meetingId, zoneId]`         | One occupancy record per venue/meeting/zone    |
| AnalyticsSnapshot   | `@@index`  | `[eventId, snapshotType, generatedAt]` | Time-series snapshot queries                   |
| MetricAlert         | `@@index`  | `[eventId, isActive]`                  | Active alert rule lookup                       |
| SavedReport         | `@@index`  | `[eventId, createdBy]`                 | User's saved reports                           |
| KioskDevice         | `@@unique` | `[tenantId, eventId, name]`            | Prevent duplicate kiosk names                  |
| QueueTicket         | `@@unique` | `[tenantId, eventId, ticketNumber]`    | Unique ticket numbers per event                |
| QueueTicket         | `@@index`  | `[eventId, status, priority]`          | Queue processing (next ticket to call)         |
| QueueTicket         | `@@index`  | `[participantId]`                      | Participant's queue history                    |
| KioskSession        | `@@index`  | `[kioskDeviceId, startedAt]`           | Kiosk usage analytics                          |
| KioskSession        | `@@index`  | `[participantId]`                      | Participant kiosk interactions                 |
| CommandCenterLayout | `@@index`  | `[eventId]`                            | Event layout lookup                            |
| CommandCenterWidget | `@@index`  | `[layoutId]`                           | Layout widget loading                          |
| AlertFeed           | `@@index`  | `[eventId, priority, status]`          | Active alert queries by priority               |
| AlertFeed           | `@@index`  | `[eventId, createdAt]`                 | Chronological alert feed                       |
| AlertFeed           | `@@index`  | `[source, status]`                     | Source-specific alert queries                  |
| QuickAction         | `@@index`  | `[eventId, executedAt]`                | Action audit trail                             |
| EventStateChange    | `@@index`  | `[eventId, timestamp]`                 | Historical replay queries                      |
| EventStateChange    | `@@index`  | `[eventId, entityType, timestamp]`     | Entity-specific history                        |
| ScannerDevice       | `@@index`  | `[tenantId, eventId]`                  | Device listing per event                       |
| ScannerDevice       | `@@index`  | `[checkpointId]`                       | Devices at checkpoint                          |
| ScannerDevice       | `@@index`  | `[isOnline]`                           | Online device monitoring                       |
| CommandCenterAlert  | `@@index`  | `[eventId, priority, status]`          | Priority-filtered alert queries                |
| CommandCenterAlert  | `@@index`  | `[correlationId]`                      | Correlated alert grouping                      |
| CommandCenterAlert  | `@@index`  | `[eventId, category, createdAt]`       | Category-based alert browsing                  |
| CommandCenterAlert  | `@@index`  | `[status, escalationLevel]`            | Escalation monitoring                          |
| EventTimeline       | `@@index`  | `[eventId, timestamp]`                 | Chronological timeline                         |
| EventTimeline       | `@@index`  | `[eventId, category, timestamp]`       | Category-filtered timeline                     |
| EventTimeline       | `@@index`  | `[entityType, entityId]`               | Entity-specific timeline                       |

---

## 4. API Specification

All endpoints are scoped under `/api/v1/tenants/:tenantId/events/:eventId` and require JWT authentication with appropriate role-based access. Multi-tenancy is enforced via Prisma middleware that automatically filters by `tenantId`.

### 4.1 Check-In & Scan Endpoints

#### POST /checkpoints/:checkpointId/scan

Scan a badge at a checkpoint. This is the primary endpoint called by scanner devices.

```typescript
// Request
interface ScanBadgeRequest {
  qrPayload: string; // Raw QR code data from camera
  scanType: "ENTRY" | "EXIT";
  deviceId?: string; // Scanner device identifier
  meetingId?: string; // If scanning for a specific meeting/session
}

// Response (< 500ms)
interface ScanBadgeResponse {
  result: ScanResult;
  participant?: {
    id: string;
    fullName: string;
    title: string;
    organization: string;
    country: string;
    photoUrl: string;
    accessLevel: string;
    badgeNumber: string;
  };
  checkpoint: {
    id: string;
    name: string;
    currentOccupancy: number;
    maxCapacity: number;
  };
  timestamp: string;
  accessLogId: string;
  message: string; // Human-readable: "Access granted" or denial reason
}
```

```typescript
// POST /checkpoints/:checkpointId/scan
export async function scanBadge(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, eventId, checkpointId } = req.params;
  const { qrPayload, scanType, deviceId, meetingId } = req.body;
  const scannedBy = req.user.id;

  const startTime = Date.now();

  try {
    // Step 1: Decrypt QR payload (AES-256)
    const decrypted = decryptQrPayload(qrPayload, eventId);
    // decrypted: { participantId, eventId, accessLevel, registrationCode }

    // Step 2: Validate participant
    const result = await validateScanAccess({
      tenantId,
      eventId,
      participantId: decrypted.participantId,
      accessLevel: decrypted.accessLevel,
      meetingId,
      checkpointId,
      scanType,
    });

    // Step 3: If allowed, update occupancy
    if (result.scanResult === "ALLOWED") {
      await updateOccupancy(eventId, meetingId, checkpointId, scanType);
    }

    // Step 4: Create access log
    const accessLog = await prisma.accessLog.create({
      data: {
        checkpointId,
        participantId: decrypted.participantId,
        meetingId,
        scanType,
        scanResult: result.scanResult,
        qrPayload,
        scannedBy,
        deviceId,
        scannedAt: new Date(),
      },
    });

    // Step 5: Emit events for real-time pipeline
    eventBus.emit("scan:completed", {
      tenantId,
      eventId,
      checkpointId,
      accessLogId: accessLog.id,
      scanResult: result.scanResult,
      scanType,
      participantId: decrypted.participantId,
    });

    const elapsed = Date.now() - startTime;
    logger.info(`Scan completed in ${elapsed}ms`, { checkpointId, result: result.scanResult });

    res.json({
      result: result.scanResult,
      participant: result.participant,
      checkpoint: result.checkpoint,
      timestamp: accessLog.scannedAt.toISOString(),
      accessLogId: accessLog.id,
      message: getScanResultMessage(result.scanResult),
    });
  } catch (error) {
    // Decryption failure = invalid badge
    if (error instanceof QrDecryptionError) {
      const accessLog = await prisma.accessLog.create({
        data: {
          checkpointId,
          scanType,
          scanResult: "DENIED_INVALID_BADGE",
          qrPayload,
          scannedBy,
          deviceId,
          scannedAt: new Date(),
        },
      });

      res.json({
        result: "DENIED_INVALID_BADGE",
        message: "Invalid or unreadable badge",
        accessLogId: accessLog.id,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    throw error;
  }
}
```

#### POST /checkpoints/:checkpointId/manual-entry

Manual entry when QR scan is not possible (damaged badge, technical issue).

```typescript
// Request
interface ManualEntryRequest {
  participantId?: string; // If known
  registrationCode?: string; // Alternative lookup
  passportNumber?: string; // Alternative lookup
  fullName?: string; // Fallback search
  scanType: "ENTRY" | "EXIT";
  reason: string; // Why manual entry is needed
}

// Response: Same as ScanBadgeResponse
```

```typescript
// POST /checkpoints/:checkpointId/manual-entry
export async function manualEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, eventId, checkpointId } = req.params;
  const { participantId, registrationCode, passportNumber, fullName, scanType, reason } = req.body;

  // Look up participant by any available identifier
  const participant = await resolveParticipant({
    tenantId,
    eventId,
    participantId,
    registrationCode,
    passportNumber,
    fullName,
  });

  if (!participant) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }

  // Perform same validation chain as QR scan
  const result = await validateScanAccess({
    tenantId,
    eventId,
    participantId: participant.id,
    accessLevel: participant.accessLevel,
    meetingId: null,
    checkpointId,
    scanType,
  });

  // Log as manual entry (no QR payload)
  const accessLog = await prisma.accessLog.create({
    data: {
      checkpointId,
      participantId: participant.id,
      scanType,
      scanResult: result.scanResult,
      qrPayload: `MANUAL:${registrationCode || participant.id}`,
      scannedBy: req.user.id,
      overrideReason: `Manual entry: ${reason}`,
      scannedAt: new Date(),
    },
  });

  if (result.scanResult === "ALLOWED") {
    await updateOccupancy(eventId, null, checkpointId, scanType);
  }

  eventBus.emit("scan:completed", {
    tenantId,
    eventId,
    checkpointId,
    accessLogId: accessLog.id,
    scanResult: result.scanResult,
    scanType,
    participantId: participant.id,
  });

  res.json({
    result: result.scanResult,
    participant: formatParticipantResponse(participant),
    timestamp: accessLog.scannedAt.toISOString(),
    accessLogId: accessLog.id,
    message: getScanResultMessage(result.scanResult),
  });
}
```

#### POST /checkpoints/:checkpointId/override

Override a denied scan (requires elevated permissions).

```typescript
// Request
interface OverrideRequest {
  accessLogId: string; // The denied scan to override
  reason: string; // Mandatory override reason
  scanType: "ENTRY" | "EXIT";
}

// Response: Same as ScanBadgeResponse with result = MANUAL_OVERRIDE
```

```typescript
// POST /checkpoints/:checkpointId/override
export async function overrideScan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, eventId, checkpointId } = req.params;
  const { accessLogId, reason, scanType } = req.body;

  // Verify caller has OVERRIDE permission
  await requirePermission(req.user, "access_control:override");

  // Fetch original denied scan
  const originalLog = await prisma.accessLog.findUniqueOrThrow({
    where: { id: accessLogId },
  });

  if (originalLog.scanResult === "ALLOWED") {
    res.status(400).json({ error: "Cannot override an already allowed scan" });
    return;
  }

  // Create override log entry
  const overrideLog = await prisma.accessLog.create({
    data: {
      checkpointId,
      participantId: originalLog.participantId,
      meetingId: originalLog.meetingId,
      scanType,
      scanResult: "MANUAL_OVERRIDE",
      qrPayload: originalLog.qrPayload,
      scannedBy: req.user.id,
      deviceId: originalLog.deviceId,
      overrideReason: reason,
      scannedAt: new Date(),
    },
  });

  // Update occupancy for the override
  if (scanType === "ENTRY") {
    await updateOccupancy(eventId, originalLog.meetingId, checkpointId, "ENTRY");
  }

  eventBus.emit("scan:override", {
    tenantId,
    eventId,
    checkpointId,
    originalLogId: accessLogId,
    overrideLogId: overrideLog.id,
    overrideBy: req.user.id,
    reason,
  });

  const participant = originalLog.participantId
    ? await prisma.participant.findUnique({ where: { id: originalLog.participantId } })
    : null;

  res.json({
    result: "MANUAL_OVERRIDE",
    participant: participant ? formatParticipantResponse(participant) : null,
    timestamp: overrideLog.scannedAt.toISOString(),
    accessLogId: overrideLog.id,
    message: `Access granted via manual override by ${req.user.name}`,
  });
}
```

### 4.2 Checkpoint Management

```typescript
// GET /checkpoints
// List all checkpoints for the event
// Query params: ?isActive=true&zoneId=xxx&type=GATE
interface ListCheckpointsResponse {
  checkpoints: Checkpoint[];
  total: number;
}

// POST /checkpoints
// Create a new checkpoint
interface CreateCheckpointRequest {
  name: string;
  location?: string;
  zoneId?: string;
  type: "GATE" | "DOOR" | "SCANNER_STATION";
  direction: "ENTRY_ONLY" | "EXIT_ONLY" | "BIDIRECTIONAL";
  capacity?: number;
}

// PATCH /checkpoints/:checkpointId
// Update checkpoint (e.g., activate/deactivate)
interface UpdateCheckpointRequest {
  name?: string;
  location?: string;
  isActive?: boolean;
  capacity?: number;
}

// DELETE /checkpoints/:checkpointId
// Soft-delete (set isActive = false)

// GET /checkpoints/:checkpointId/logs
// Query access logs for a checkpoint
// Query params: ?from=ISO&to=ISO&scanResult=ALLOWED&limit=50&offset=0
interface CheckpointLogsResponse {
  logs: AccessLog[];
  total: number;
  summary: {
    totalEntries: number;
    totalExits: number;
    deniedCount: number;
    overrideCount: number;
  };
}
```

### 4.3 Occupancy Endpoints

```typescript
// GET /occupancy
// Get all venue occupancy records
interface OccupancyListResponse {
  occupancy: Array<{
    eventId: string;
    meetingId: string | null;
    zoneId: string | null;
    zoneName: string | null;
    meetingName: string | null;
    currentCount: number;
    maxCapacity: number;
    percentage: number;
    alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
    lastUpdated: string;
  }>;
}

// GET /occupancy/:zoneId
// Get occupancy for a specific zone
interface ZoneOccupancyResponse {
  zoneId: string;
  zoneName: string;
  currentCount: number;
  maxCapacity: number;
  percentage: number;
  alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  checkpoints: Array<{
    id: string;
    name: string;
    throughputLastHour: number;
  }>;
  history: Array<{
    timestamp: string;
    count: number;
  }>;
}

// POST /occupancy/reconcile
// Trigger manual occupancy reconciliation (admin only)
// Recalculates from access logs to correct any drift
interface ReconcileResponse {
  corrections: Array<{
    zoneId: string;
    previousCount: number;
    correctedCount: number;
    delta: number;
  }>;
}
```

### 4.4 Analytics Endpoints

```typescript
// GET /analytics/metrics/summary
// Current key metrics for the event
interface MetricsSummaryResponse {
  registrationCount: number;
  approvedCount: number;
  approvalRate: number;
  avgApprovalTimeHours: number;
  printedCount: number;
  collectedCount: number;
  checkedInCount: number;
  activeIncidents: number;
  registrationVelocity: number; // per hour
  approvalVelocity: number; // per hour
  lastUpdated: string;
}

// GET /analytics/metrics/funnel
// Registration funnel data
interface FunnelResponse {
  stages: Array<{
    name: string;
    count: number;
    percentage: number;
    changeFromYesterday: number;
  }>;
}

// GET /analytics/snapshots
// Query historical snapshots
// Query params: ?type=HOURLY&from=ISO&to=ISO&limit=100
interface SnapshotsResponse {
  snapshots: AnalyticsSnapshot[];
  total: number;
}

// POST /analytics/snapshots
// Generate an on-demand snapshot
interface CreateSnapshotRequest {
  snapshotType: "ON_DEMAND";
  metrics?: string[]; // Specific metrics to include, or all if empty
}

// GET /analytics/alerts
// List metric alerts
// Query params: ?isActive=true
interface MetricAlertsResponse {
  alerts: MetricAlert[];
}

// POST /analytics/alerts
// Create a metric alert rule
interface CreateMetricAlertRequest {
  metricName: string;
  threshold: number;
  comparator: "GT" | "LT" | "GTE" | "LTE" | "EQ";
  channels: Array<"EMAIL" | "SSE" | "SMS">;
  recipients: string[];
  cooldownMin?: number;
}

// PATCH /analytics/alerts/:alertId
// Update alert (toggle active, change threshold)

// DELETE /analytics/alerts/:alertId
// Delete alert rule

// GET /analytics/reports
// List saved reports for the event
interface SavedReportsResponse {
  reports: SavedReport[];
}

// POST /analytics/reports
// Create a saved report
interface CreateReportRequest {
  name: string;
  description?: string;
  filters: Record<string, unknown>;
  columns: string[];
  chartType?: "BAR" | "LINE" | "PIE" | "TABLE" | "FUNNEL";
  schedule?: string; // Cron expression
}

// POST /analytics/reports/:reportId/generate
// Generate a report (PDF or CSV)
interface GenerateReportRequest {
  format: "PDF" | "CSV";
}
interface GenerateReportResponse {
  downloadUrl: string;
  expiresAt: string;
}
```

### 4.5 Kiosk Session Management

```typescript
// GET /kiosks
// List kiosk devices
interface KioskListResponse {
  kiosks: Array<
    KioskDevice & {
      sessionsToday: number;
      avgSessionDuration: number;
    }
  >;
}

// POST /kiosks
// Register a new kiosk device
interface CreateKioskRequest {
  name: string;
  location: string;
  mode: "SELF_SERVICE" | "QUEUE_DISPLAY" | "INFO_ONLY";
  language?: string;
}

// POST /kiosks/:kioskId/heartbeat
// Kiosk heartbeat (called every 60 seconds)
interface KioskHeartbeatRequest {
  batteryLevel?: number;
  activeSessionId?: string;
}

// POST /kiosks/:kioskId/sessions
// Start a kiosk session
interface StartKioskSessionRequest {
  sessionType: "STATUS_LOOKUP" | "QUEUE_JOIN" | "BADGE_SCAN" | "WAYFINDING" | "INFO";
  language?: string;
}
interface StartKioskSessionResponse {
  sessionId: string;
}

// PATCH /kiosks/:kioskId/sessions/:sessionId
// Update/end a kiosk session
interface UpdateKioskSessionRequest {
  participantId?: string;
  endedAt?: string;
  timedOut?: boolean;
  metadata?: Record<string, unknown>;
}

// POST /kiosks/:kioskId/lookup
// Look up participant status from kiosk
interface KioskLookupRequest {
  registrationCode?: string;
  passportLastFour?: string;
  fullName?: string;
}
interface KioskLookupResponse {
  found: boolean;
  participant?: {
    fullName: string;
    status: string; // PENDING, APPROVED, PRINTED, COLLECTED
    photoUrl: string;
    badgeReady: boolean;
    estimatedWait?: number; // Minutes until badge ready
    currentStep: string; // Human-readable workflow step
  };
}

// POST /queue/join
// Join the badge collection queue
interface JoinQueueRequest {
  participantId: string;
  kioskId?: string;
}
interface JoinQueueResponse {
  ticketNumber: string;
  position: number;
  estimatedWait: number; // Minutes
  priority: number;
}

// GET /queue/status
// Get current queue status
interface QueueStatusResponse {
  nowServing: Array<{
    ticketNumber: string;
    counterNumber: number;
  }>;
  nextUp: string[]; // Next 5 ticket numbers
  waitingCount: number;
  servedToday: number;
  avgServiceTime: number; // Minutes
  currentWait: number; // Minutes for new joiners
}

// PATCH /queue/:ticketId/call
// Call next ticket to a counter (staff endpoint)
interface CallTicketRequest {
  counterNumber: number;
}

// PATCH /queue/:ticketId/complete
// Mark ticket as completed
```

### 4.6 Command Center SSE Streams

```typescript
// GET /command-center/stream
// Server-Sent Events stream for the command center
// Multiplexes all widget data into a single connection

// SSE Event Types:
interface SSEEvent {
  type: string;
  data: unknown;
}

// type: "venue_occupancy"
interface VenueOccupancyEvent {
  type: "venue_occupancy";
  data: {
    roomId: string;
    roomName: string;
    count: number;
    capacity: number;
    percentage: number;
    alertLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  };
}

// type: "gate_throughput"
interface GateThroughputEvent {
  type: "gate_throughput";
  data: {
    gateId: string;
    gateName: string;
    entriesLastHour: number;
    exitsLastHour: number;
    currentRate: number; // entries per minute (5-min rolling avg)
  };
}

// type: "alert"
interface AlertEvent {
  type: "alert";
  data: AlertFeed;
}

// type: "registration_pipeline"
interface RegistrationPipelineEvent {
  type: "registration_pipeline";
  data: {
    pending: number;
    approved: number;
    printed: number;
    collected: number;
    todayDelta: number;
    avgProcessingMin: number;
  };
}

// type: "transport_status"
interface TransportStatusEvent {
  type: "transport_status";
  data: {
    activeVehicles: number;
    totalVehicles: number;
    enRoutePickups: number;
    completedToday: number;
    nextVipPickup: {
      time: string;
      participantName: string;
      route: string;
      vehicleId: string;
    } | null;
    delays: Array<{ vehicleId: string; delayMinutes: number }>;
  };
}

// type: "vip_arrival"
interface VipArrivalEvent {
  type: "vip_arrival";
  data: {
    participantId: string;
    fullName: string;
    title: string;
    country: string;
    gate: string;
    arrivalTime: string;
    protocolOfficer: string | null;
  };
}

// type: "metric_update"
interface MetricUpdateEvent {
  type: "metric_update";
  data: {
    metricName: string;
    value: number;
    previousValue: number;
    delta: number;
    timestamp: string;
  };
}
```

```typescript
// GET /command-center/stream - SSE Handler
export async function commandCenterStream(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId, eventId } = req.params;

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Load operator's layout
  const layout = await prisma.commandCenterLayout.findFirst({
    where: { tenantId, eventId, isDefault: true },
    include: { widgets: true },
  });

  // Subscribe to channels based on layout widgets
  const subscriptions: Array<() => void> = [];

  for (const widget of layout?.widgets ?? []) {
    const channel = getChannelForWidgetType(widget.widgetType);

    // Push initial state snapshot
    const initialData = await getWidgetSnapshot(tenantId, eventId, widget);
    res.write(`event: ${channel}\ndata: ${JSON.stringify(initialData)}\n\n`);

    // Subscribe to real-time updates
    const unsub = eventBus.on(channel, (data: unknown) => {
      if (isRelevantToWidget(data, widget.config)) {
        res.write(`event: ${channel}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    });
    subscriptions.push(unsub);
  }

  // Heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30_000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    subscriptions.forEach((unsub) => unsub());
  });
}

function getChannelForWidgetType(type: WidgetType): string {
  const channelMap: Record<WidgetType, string> = {
    REGISTRATION_PIPELINE: "registration_pipeline",
    INCIDENT_FEED: "incident_feed",
    VENUE_OCCUPANCY: "venue_occupancy",
    TRANSPORT_STATUS: "transport_status",
    WEATHER_CLOCK: "weather_clock",
    UPCOMING_SESSIONS: "upcoming_sessions",
    STAFF_AVAILABILITY: "staff_availability",
    CATERING_TRACKER: "catering_tracker",
    GATE_THROUGHPUT: "gate_throughput",
    VIP_ARRIVALS: "vip_arrivals",
    CUSTOM_METRIC: "metric_update",
  };
  return channelMap[type];
}
```

#### GET /command-center/layouts

```typescript
// List available layouts
interface LayoutsResponse {
  layouts: CommandCenterLayout[];
}

// POST /command-center/layouts
interface CreateLayoutRequest {
  name: string;
  isDefault?: boolean;
  gridCols?: number;
  gridRows?: number;
  autoRotate?: boolean;
  rotateInterval?: number;
  widgets: Array<{
    widgetType: WidgetType;
    title: string;
    config?: Record<string, unknown>;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
    refreshRate?: number;
  }>;
}

// PATCH /command-center/layouts/:layoutId
// Update layout configuration or widgets

// POST /command-center/quick-actions
interface ExecuteQuickActionRequest {
  actionType: QuickActionType;
  parameters?: Record<string, unknown>;
}
interface ExecuteQuickActionResponse {
  actionId: string;
  status: "EXECUTED" | "AWAITING_CONFIRMATION";
  message: string;
  requiresConfirmation?: boolean; // true for LOCKDOWN, EVACUATION_ALERT
}

// POST /command-center/quick-actions/:actionId/confirm
// Second operator confirms a dual-authorization action
interface ConfirmQuickActionRequest {
  confirmedBy: string; // userId of second operator
}

// POST /command-center/quick-actions/:actionId/reverse
// Reverse a previously executed action
```

### 4.7 Alert Management

```typescript
// GET /alerts
// List alerts with filtering
// Query params: ?priority=CRITICAL&status=ACTIVE&source=access_control&limit=50
interface AlertsListResponse {
  alerts: AlertFeed[];
  total: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// POST /alerts/:alertId/acknowledge
interface AcknowledgeAlertRequest {
  note?: string;
}

// POST /alerts/:alertId/resolve
interface ResolveAlertRequest {
  resolution: string; // Description of how it was resolved
}

// GET /alerts/correlated
// Get correlated alert groups
interface CorrelatedAlertsResponse {
  groups: Array<{
    correlationId: string;
    category: string;
    alertCount: number;
    highestPriority: AlertPriority;
    suggestedAction: string | null;
    alerts: CommandCenterAlert[];
  }>;
}

// GET /timeline
// Get event timeline
// Query params: ?from=ISO&to=ISO&category=scan&severity=CRITICAL&limit=100
interface TimelineResponse {
  entries: EventTimeline[];
  total: number;
}

// POST /command-center/replay
// Start historical replay
interface StartReplayRequest {
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  speed: 1 | 2 | 5 | 10 | 60; // Playback speed multiplier
}
interface StartReplayResponse {
  replaySessionId: string;
  totalEvents: number;
  estimatedDuration: number; // Seconds at chosen speed
}
```

---

## 5. Business Logic

### 5.1 QR Badge Scanning Flow

```
Security staff opens scanner app on tablet/phone
  -> Camera activates, points at participant's badge QR code
  -> QR decoded -> encrypted payload extracted
  -> Payload decrypted: { participantId, eventId, accessLevel, registrationCode }
  -> System lookup:
      1. Participant exists? -> No -> DENIED_INVALID_BADGE
      2. Participant status = APPROVED and badge printed? -> No -> DENIED_REVOKED
      3. Blacklist check -> Match -> DENIED_BLACKLISTED
      4. Meeting access level check:
         - Meeting requires CLOSED, participant has OPEN -> DENIED_ACCESS_LEVEL
         - Meeting requires CLOSED, participant has CLOSED -> PASS
      5. Capacity check:
         - VenueOccupancy.currentCount >= maxCapacity -> DENIED_CAPACITY_FULL
         - Under capacity -> PASS
      6. All checks pass -> ALLOWED
         - Increment VenueOccupancy.currentCount
         - Create AccessLog record
         - Display green checkmark with participant name + photo
  -> Total time: < 500ms
```

### 5.2 QR Badge Scanning Engine

Full implementation of the scan validation pipeline. Every step is designed to complete within the 500ms total budget.

```typescript
// ==========================================
// QR BADGE SCANNING ENGINE
// ==========================================

import crypto from "crypto";

// Step 1: QR Payload Decryption (target: <10ms)
interface QrPayload {
  participantId: string;
  eventId: string;
  accessLevel: string;
  registrationCode: string;
  issuedAt: number; // Unix timestamp
  checksum: string; // HMAC for integrity
}

export function decryptQrPayload(encryptedPayload: string, eventId: string): QrPayload {
  // Event-specific AES-256 key derived from master key + eventId
  const eventKey = deriveEventKey(eventId);

  // Decode base64 payload
  const buffer = Buffer.from(encryptedPayload, "base64");

  // Extract IV (first 16 bytes) and ciphertext
  const iv = buffer.subarray(0, 16);
  const ciphertext = buffer.subarray(16);

  // Decrypt AES-256-CBC
  const decipher = crypto.createDecipheriv("aes-256-cbc", eventKey, iv);
  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");

  const payload: QrPayload = JSON.parse(decrypted);

  // Verify HMAC integrity
  const expectedChecksum = crypto
    .createHmac("sha256", eventKey)
    .update(`${payload.participantId}:${payload.eventId}:${payload.issuedAt}`)
    .digest("hex")
    .substring(0, 16);

  if (payload.checksum !== expectedChecksum) {
    throw new QrDecryptionError("QR payload integrity check failed");
  }

  // Verify payload is for this event
  if (payload.eventId !== eventId) {
    throw new QrDecryptionError("QR payload event mismatch");
  }

  return payload;
}

function deriveEventKey(eventId: string): Buffer {
  const masterKey = process.env.QR_ENCRYPTION_MASTER_KEY!;
  return crypto.createHash("sha256").update(`${masterKey}:${eventId}`).digest();
}

// Step 2: Full Validation Chain (target: <400ms including DB queries)
interface ValidationResult {
  scanResult: ScanResult;
  participant: ParticipantSummary | null;
  checkpoint: CheckpointSummary;
  denialReason?: string;
}

export async function validateScanAccess(params: {
  tenantId: string;
  eventId: string;
  participantId: string;
  accessLevel: string;
  meetingId: string | null;
  checkpointId: string;
  scanType: ScanType;
}): Promise<ValidationResult> {
  const { tenantId, eventId, participantId, accessLevel, meetingId, checkpointId, scanType } =
    params;

  // Parallel fetch: participant, checkpoint, blacklist, meeting, occupancy
  const [participant, checkpoint, blacklistEntry, meeting, occupancy] = await Promise.all([
    prisma.participant.findFirst({
      where: { id: participantId, tenantId, eventId },
      select: {
        id: true,
        fullName: true,
        title: true,
        organization: true,
        country: true,
        photoUrl: true,
        accessLevel: true,
        status: true,
        badgePrinted: true,
        registrationCode: true,
      },
    }),
    prisma.checkpoint.findUniqueOrThrow({
      where: { id: checkpointId },
    }),
    prisma.blacklistEntry.findFirst({
      where: {
        tenantId,
        OR: [
          { participantId },
          { passportNumber: { not: undefined } }, // Will be refined below
        ],
        isActive: true,
      },
    }),
    meetingId ? prisma.meeting.findUnique({ where: { id: meetingId } }) : null,
    getOccupancy(eventId, meetingId, checkpoint.zoneId),
  ]);

  // Check 1: Participant exists
  if (!participant) {
    return {
      scanResult: "DENIED_INVALID_BADGE",
      participant: null,
      checkpoint: formatCheckpoint(checkpoint, occupancy),
      denialReason: "Participant not found in system",
    };
  }

  // Check 2: Participant approved and badge printed
  if (participant.status !== "APPROVED" || !participant.badgePrinted) {
    return {
      scanResult: "DENIED_REVOKED",
      participant: formatParticipant(participant),
      checkpoint: formatCheckpoint(checkpoint, occupancy),
      denialReason: `Status: ${participant.status}, Badge printed: ${participant.badgePrinted}`,
    };
  }

  // Check 3: Blacklist
  if (blacklistEntry) {
    return {
      scanResult: "DENIED_BLACKLISTED",
      participant: formatParticipant(participant),
      checkpoint: formatCheckpoint(checkpoint, occupancy),
      denialReason: "Participant is on the blacklist",
    };
  }

  // Check 4: Meeting access level (only for meeting-specific scans)
  if (meeting && meeting.accessLevel === "CLOSED" && participant.accessLevel === "OPEN") {
    return {
      scanResult: "DENIED_ACCESS_LEVEL",
      participant: formatParticipant(participant),
      checkpoint: formatCheckpoint(checkpoint, occupancy),
      denialReason: `Meeting requires ${meeting.accessLevel}, participant has ${participant.accessLevel}`,
    };
  }

  // Check 5: Capacity (only for ENTRY scans)
  if (scanType === "ENTRY" && occupancy && occupancy.currentCount >= occupancy.maxCapacity) {
    return {
      scanResult: "DENIED_CAPACITY_FULL",
      participant: formatParticipant(participant),
      checkpoint: formatCheckpoint(checkpoint, occupancy),
      denialReason: `Capacity full: ${occupancy.currentCount}/${occupancy.maxCapacity}`,
    };
  }

  // All checks passed
  return {
    scanResult: "ALLOWED",
    participant: formatParticipant(participant),
    checkpoint: formatCheckpoint(checkpoint, occupancy),
  };
}
```

### 5.3 Scanner Device Management

```typescript
// ==========================================
// SCANNER DEVICE MANAGEMENT
// ==========================================

// Device Registration
export async function registerScannerDevice(
  tenantId: string,
  eventId: string,
  registration: {
    deviceSerial: string;
    name: string;
    firmwareVersion: string;
    appVersion: string;
    osVersion?: string;
    certificateHash: string;
  },
): Promise<ScannerDevice> {
  // Verify device certificate is valid
  await verifyCertificate(registration.certificateHash);

  const device = await prisma.scannerDevice.upsert({
    where: { deviceSerial: registration.deviceSerial },
    create: {
      tenantId,
      eventId,
      ...registration,
      isOnline: true,
      lastHeartbeat: new Date(),
    },
    update: {
      firmwareVersion: registration.firmwareVersion,
      appVersion: registration.appVersion,
      osVersion: registration.osVersion,
      isOnline: true,
      lastHeartbeat: new Date(),
    },
  });

  eventBus.emit("scanner:registered", { tenantId, eventId, deviceId: device.id });
  return device;
}

// Health Monitoring with Heartbeat (every 30 seconds)
export async function processScannerHeartbeat(
  deviceId: string,
  heartbeat: {
    batteryLevel?: number;
    offlineScans: number;
    ipAddress?: string;
    checkpointId?: string;
  },
): Promise<void> {
  await prisma.scannerDevice.update({
    where: { id: deviceId },
    data: {
      isOnline: true,
      lastHeartbeat: new Date(),
      batteryLevel: heartbeat.batteryLevel,
      offlineScans: heartbeat.offlineScans,
      ipAddress: heartbeat.ipAddress,
      checkpointId: heartbeat.checkpointId,
    },
  });

  // Alert on low battery
  if (heartbeat.batteryLevel !== undefined && heartbeat.batteryLevel < 15) {
    const device = await prisma.scannerDevice.findUniqueOrThrow({ where: { id: deviceId } });
    await createAlert({
      tenantId: device.tenantId,
      eventId: device.eventId,
      priority: "MEDIUM",
      source: "access_control",
      category: "equipment",
      title: `Scanner ${device.name} battery low`,
      message: `Battery at ${heartbeat.batteryLevel}%. Replace or charge soon.`,
      metadata: { deviceId, batteryLevel: heartbeat.batteryLevel },
    });
  }
}

// Offline Detection Job (runs every 60 seconds)
export async function detectOfflineScanners(): Promise<void> {
  const offlineThreshold = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes

  const newlyOffline = await prisma.scannerDevice.findMany({
    where: {
      isOnline: true,
      lastHeartbeat: { lt: offlineThreshold },
    },
  });

  for (const device of newlyOffline) {
    await prisma.scannerDevice.update({
      where: { id: device.id },
      data: { isOnline: false },
    });

    await createAlert({
      tenantId: device.tenantId,
      eventId: device.eventId,
      priority: "HIGH",
      source: "access_control",
      category: "equipment",
      title: `Scanner ${device.name} went offline`,
      message: `No heartbeat since ${device.lastHeartbeat?.toISOString()}. Check device connectivity.`,
      metadata: { deviceId: device.id, lastHeartbeat: device.lastHeartbeat },
    });

    eventBus.emit("scanner:offline", { deviceId: device.id, eventId: device.eventId });
  }
}

// Firmware Version Tracking
export async function checkFirmwareCompliance(eventId: string): Promise<FirmwareComplianceReport> {
  const devices = await prisma.scannerDevice.findMany({
    where: { eventId },
  });

  const latestFirmware = process.env.SCANNER_LATEST_FIRMWARE!;
  const latestAppVersion = process.env.SCANNER_LATEST_APP_VERSION!;

  const outdated = devices.filter(
    (d) => d.firmwareVersion !== latestFirmware || d.appVersion !== latestAppVersion,
  );

  return {
    totalDevices: devices.length,
    compliant: devices.length - outdated.length,
    outdated: outdated.map((d) => ({
      deviceId: d.id,
      name: d.name,
      currentFirmware: d.firmwareVersion,
      currentApp: d.appVersion,
      requiredFirmware: latestFirmware,
      requiredApp: latestAppVersion,
    })),
  };
}
```

### 5.4 Real-Time Occupancy Tracking

```typescript
// ==========================================
// REAL-TIME OCCUPANCY TRACKING
// ==========================================

// Increment on ENTRY, decrement on EXIT
export async function updateOccupancy(
  eventId: string,
  meetingId: string | null,
  checkpointId: string,
  scanType: ScanType,
): Promise<void> {
  const checkpoint = await prisma.checkpoint.findUniqueOrThrow({
    where: { id: checkpointId },
  });

  const delta = scanType === "ENTRY" ? 1 : -1;

  // Update zone occupancy
  if (checkpoint.zoneId) {
    await prisma.venueOccupancy.upsert({
      where: {
        eventId_meetingId_zoneId: {
          eventId,
          meetingId: meetingId ?? "",
          zoneId: checkpoint.zoneId,
        },
      },
      create: {
        eventId,
        meetingId,
        zoneId: checkpoint.zoneId,
        currentCount: Math.max(0, delta),
        maxCapacity: await getZoneCapacity(checkpoint.zoneId),
        lastUpdated: new Date(),
      },
      update: {
        currentCount: { increment: delta },
        lastUpdated: new Date(),
      },
    });
  }

  // Update overall venue occupancy
  await prisma.venueOccupancy.upsert({
    where: {
      eventId_meetingId_zoneId: {
        eventId,
        meetingId: "",
        zoneId: "",
      },
    },
    create: {
      eventId,
      currentCount: Math.max(0, delta),
      maxCapacity: await getVenueCapacity(eventId),
      lastUpdated: new Date(),
    },
    update: {
      currentCount: { increment: delta },
      lastUpdated: new Date(),
    },
  });

  // Also update Redis for fast reads
  const redisKey = `occupancy:${eventId}:${checkpoint.zoneId || "venue"}`;
  if (scanType === "ENTRY") {
    await redis.incr(redisKey);
  } else {
    await redis.decr(redisKey);
  }

  // Check capacity thresholds and emit alerts
  await checkCapacityThresholds(eventId, checkpoint.zoneId, meetingId);

  // Emit occupancy change for SSE
  eventBus.emit("occupancy:changed", {
    eventId,
    zoneId: checkpoint.zoneId,
    meetingId,
    checkpointId,
    scanType,
  });
}

// Capacity Alert Thresholds
async function checkCapacityThresholds(
  eventId: string,
  zoneId: string | null,
  meetingId: string | null,
): Promise<void> {
  const occupancy = await getOccupancy(eventId, meetingId, zoneId);
  if (!occupancy) return;

  const percentage = (occupancy.currentCount / occupancy.maxCapacity) * 100;

  // 75%: Yellow indicator - staff notified
  if (percentage >= 75 && percentage < 90) {
    await createAlertIfNotCoolingDown({
      eventId,
      category: "capacity",
      priority: "LOW",
      title: `${occupancy.zoneName || "Venue"} at ${Math.round(percentage)}% capacity`,
      message: `Current: ${occupancy.currentCount} / ${occupancy.maxCapacity}. Staff notified.`,
      cooldownKey: `capacity:yellow:${zoneId || "venue"}`,
    });
  }

  // 90%: Orange indicator - consider stopping new entries
  if (percentage >= 90 && percentage < 100) {
    await createAlertIfNotCoolingDown({
      eventId,
      category: "capacity",
      priority: "HIGH",
      title: `${occupancy.zoneName || "Venue"} at ${Math.round(percentage)}% capacity`,
      message: `Current: ${occupancy.currentCount} / ${occupancy.maxCapacity}. Consider stopping new entries.`,
      cooldownKey: `capacity:orange:${zoneId || "venue"}`,
    });
  }

  // 100%: Red indicator - gate scanners auto-deny with DENIED_CAPACITY_FULL
  if (percentage >= 100) {
    await createAlertIfNotCoolingDown({
      eventId,
      category: "capacity",
      priority: "CRITICAL",
      title: `${occupancy.zoneName || "Venue"} at FULL CAPACITY`,
      message: `${occupancy.currentCount} / ${occupancy.maxCapacity}. Gate scanners now auto-denying entry.`,
      cooldownKey: `capacity:red:${zoneId || "venue"}`,
    });
  }
}

// Reconciliation Job (runs every 15 minutes)
// Corrects drift between Redis counters and actual DB state
export async function reconcileOccupancy(eventId: string): Promise<ReconciliationResult> {
  const corrections: ReconciliationCorrection[] = [];

  const occupancyRecords = await prisma.venueOccupancy.findMany({
    where: { eventId },
  });

  for (const record of occupancyRecords) {
    // Count from access logs: entries minus exits since last reset
    const entryCount = await prisma.accessLog.count({
      where: {
        checkpoint: { eventId, zoneId: record.zoneId || undefined },
        scanType: "ENTRY",
        scanResult: { in: ["ALLOWED", "MANUAL_OVERRIDE"] },
        scannedAt: { gte: getEventStartTime(eventId) },
      },
    });

    const exitCount = await prisma.accessLog.count({
      where: {
        checkpoint: { eventId, zoneId: record.zoneId || undefined },
        scanType: "EXIT",
        scanResult: { in: ["ALLOWED", "MANUAL_OVERRIDE"] },
        scannedAt: { gte: getEventStartTime(eventId) },
      },
    });

    const actualCount = Math.max(0, entryCount - exitCount);

    if (actualCount !== record.currentCount) {
      corrections.push({
        zoneId: record.zoneId,
        previousCount: record.currentCount,
        correctedCount: actualCount,
        delta: actualCount - record.currentCount,
      });

      await prisma.venueOccupancy.update({
        where: { id: record.id },
        data: { currentCount: actualCount, lastUpdated: new Date() },
      });

      // Also fix Redis
      const redisKey = `occupancy:${eventId}:${record.zoneId || "venue"}`;
      await redis.set(redisKey, actualCount.toString());
    }
  }

  if (corrections.length > 0) {
    logger.warn("Occupancy reconciliation corrections applied", { eventId, corrections });
  }

  return { eventId, corrections, reconciledAt: new Date() };
}
```

### 5.5 Offline Scanner Capability

Network connectivity at large venues can be unreliable. The scanner app caches:

- Full participant lookup table (id, name, photo thumbnail, access level, status) -- synced every 5 minutes
- Blacklist entries
- Meeting access requirements

When offline, scans are validated locally and logged to device storage. When connectivity resumes, logs are batch-uploaded and occupancy counts are reconciled.

```typescript
// ==========================================
// OFFLINE SYNC PROTOCOL
// ==========================================

// Data that scanners cache locally for offline operation
interface ScannerOfflineCache {
  participants: Array<{
    id: string;
    fullName: string;
    photoThumbnail: string; // Base64 encoded, max 10KB each
    accessLevel: string;
    status: string;
    badgePrinted: boolean;
    registrationCode: string;
  }>;
  blacklist: Array<{
    participantId?: string;
    passportNumber?: string;
  }>;
  meetings: Array<{
    id: string;
    accessLevel: string;
    name: string;
  }>;
  checkpoints: Array<{
    id: string;
    zoneId: string | null;
    maxCapacity: number;
  }>;
  syncedAt: string; // ISO timestamp
  version: number; // Incremental version for delta sync
}

// Endpoint: GET /scanners/:deviceId/sync
// Returns delta updates since the device's last sync version
export async function getScannerSyncData(
  deviceId: string,
  lastVersion: number,
): Promise<ScannerOfflineCache> {
  const device = await prisma.scannerDevice.findUniqueOrThrow({
    where: { id: deviceId },
  });

  // Full sync if version is 0 or too old, otherwise delta
  const participants = await prisma.participant.findMany({
    where: {
      tenantId: device.tenantId,
      eventId: device.eventId,
      ...(lastVersion > 0 ? { updatedAt: { gt: new Date(lastVersion) } } : {}),
    },
    select: {
      id: true,
      fullName: true,
      photoUrl: true,
      accessLevel: true,
      status: true,
      badgePrinted: true,
      registrationCode: true,
    },
  });

  const blacklist = await prisma.blacklistEntry.findMany({
    where: { tenantId: device.tenantId, isActive: true },
    select: { participantId: true, passportNumber: true },
  });

  // Generate thumbnail versions of photos for cache efficiency
  const participantsWithThumbnails = await Promise.all(
    participants.map(async (p) => ({
      ...p,
      photoThumbnail: p.photoUrl ? await generateThumbnail(p.photoUrl, 64, 64) : "",
    })),
  );

  await prisma.scannerDevice.update({
    where: { id: deviceId },
    data: { lastSyncAt: new Date() },
  });

  return {
    participants: participantsWithThumbnails,
    blacklist,
    meetings: await prisma.meeting.findMany({
      where: { eventId: device.eventId },
      select: { id: true, accessLevel: true, name: true },
    }),
    checkpoints: await prisma.checkpoint.findMany({
      where: { eventId: device.eventId, isActive: true },
      select: { id: true, zoneId: true, capacity: true },
    }),
    syncedAt: new Date().toISOString(),
    version: Date.now(),
  };
}

// Endpoint: POST /scanners/:deviceId/upload
// Batch upload offline scans when connectivity resumes
export async function uploadOfflineScans(
  deviceId: string,
  offlineScans: Array<{
    qrPayload: string;
    scanType: ScanType;
    scanResult: ScanResult;
    scannedBy: string;
    checkpointId: string;
    scannedAt: string;
    localValidation: boolean; // true = validated from local cache
    signedHash: string; // HMAC signature for integrity
  }>,
): Promise<OfflineUploadResult> {
  const device = await prisma.scannerDevice.findUniqueOrThrow({
    where: { id: deviceId },
  });

  let uploaded = 0;
  let rejected = 0;
  const conflicts: OfflineScanConflict[] = [];

  for (const scan of offlineScans) {
    // Verify signature to ensure log integrity
    const expectedHash = computeScanSignature(scan, device.certificateHash);
    if (scan.signedHash !== expectedHash) {
      rejected++;
      conflicts.push({
        scan,
        reason: "Integrity check failed: signature mismatch",
      });
      continue;
    }

    // Check for duplicate (same device, same timestamp, same payload)
    const existing = await prisma.accessLog.findFirst({
      where: {
        deviceId,
        qrPayload: scan.qrPayload,
        scannedAt: new Date(scan.scannedAt),
      },
    });

    if (existing) {
      rejected++;
      conflicts.push({ scan, reason: "Duplicate scan already exists" });
      continue;
    }

    // Create the access log
    await prisma.accessLog.create({
      data: {
        checkpointId: scan.checkpointId,
        participantId: await resolveParticipantFromPayload(scan.qrPayload, device.eventId),
        scanType: scan.scanType,
        scanResult: scan.scanResult,
        qrPayload: scan.qrPayload,
        scannedBy: scan.scannedBy,
        deviceId,
        scannedAt: new Date(scan.scannedAt),
        overrideReason: scan.localValidation ? "Validated offline from local cache" : undefined,
      },
    });

    uploaded++;
  }

  // Update device offline scan counter
  await prisma.scannerDevice.update({
    where: { id: deviceId },
    data: { offlineScans: 0 },
  });

  // Trigger occupancy reconciliation for affected zones
  await reconcileOccupancy(device.eventId);

  return { uploaded, rejected, conflicts, reconciledAt: new Date() };
}
```

### 5.6 Alert Correlation Engine

```typescript
// ==========================================
// ALERT CORRELATION ENGINE
// ==========================================

interface RawAlert {
  tenantId: string;
  eventId: string;
  priority: AlertPriority;
  source: string;
  category: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// Main entry point: create an alert with correlation logic
export async function createAlert(alert: RawAlert): Promise<CommandCenterAlert> {
  // Step 1: Deduplication -- check if identical alert exists within cooldown
  const isDuplicate = await checkDuplicate(alert);
  if (isDuplicate) {
    logger.debug("Alert suppressed (duplicate within cooldown)", { title: alert.title });
    return isDuplicate;
  }

  // Step 2: Correlation -- find related alerts to group
  const correlationId = await findCorrelationGroup(alert);

  // Step 3: Priority scoring -- adjust priority based on context
  const adjustedPriority = await computeAdjustedPriority(alert);

  // Step 4: Generate suggested action (decision support)
  const suggestedAction = await generateSuggestedAction(alert);

  // Step 5: Create the alert record
  const created = await prisma.commandCenterAlert.create({
    data: {
      tenantId: alert.tenantId,
      eventId: alert.eventId,
      correlationId,
      priority: adjustedPriority,
      source: alert.source,
      category: alert.category,
      title: alert.title,
      message: alert.message,
      suggestedAction,
      metadata: alert.metadata ?? undefined,
      expiresAt:
        adjustedPriority === "LOW"
          ? new Date(Date.now() + 30 * 60 * 1000) // 30 min auto-expire
          : undefined,
    },
  });

  // Also create in the simpler AlertFeed for backward compatibility
  await prisma.alertFeed.create({
    data: {
      tenantId: alert.tenantId,
      eventId: alert.eventId,
      priority: adjustedPriority,
      source: alert.source,
      title: alert.title,
      message: alert.message,
      metadata: alert.metadata ?? undefined,
      expiresAt: adjustedPriority === "LOW" ? new Date(Date.now() + 30 * 60 * 1000) : undefined,
    },
  });

  // Step 6: Route the alert
  await routeAlert(created);

  // Step 7: Emit for SSE broadcast
  eventBus.emit("alert:created", {
    eventId: alert.eventId,
    alert: created,
  });

  return created;
}

// Deduplication: Suppress identical alerts within cooldown
async function checkDuplicate(alert: RawAlert): Promise<CommandCenterAlert | null> {
  const cooldownMinutes = getCooldownForCategory(alert.category);
  const cooldownStart = new Date(Date.now() - cooldownMinutes * 60 * 1000);

  const existing = await prisma.commandCenterAlert.findFirst({
    where: {
      eventId: alert.eventId,
      category: alert.category,
      title: alert.title,
      status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      createdAt: { gte: cooldownStart },
    },
    orderBy: { createdAt: "desc" },
  });

  return existing;
}

function getCooldownForCategory(category: string): number {
  const cooldowns: Record<string, number> = {
    capacity: 10, // 10 minutes between capacity alerts for same zone
    security: 5, // 5 minutes for security alerts
    equipment: 15, // 15 minutes for equipment alerts
    sla: 30, // 30 minutes for SLA breach alerts
    transport: 10, // 10 minutes for transport alerts
  };
  return cooldowns[category] ?? 30;
}

// Correlation: Group related alerts
async function findCorrelationGroup(alert: RawAlert): Promise<string> {
  // Look for existing active alerts in the same category from the last 30 minutes
  const recentRelated = await prisma.commandCenterAlert.findMany({
    where: {
      eventId: alert.eventId,
      category: alert.category,
      status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
  });

  // If 3+ related alerts exist, group them under a single correlation ID
  if (recentRelated.length >= 2 && recentRelated[0].correlationId) {
    return recentRelated[0].correlationId;
  }

  // If 2 alerts exist, create a new correlation group including both
  if (recentRelated.length >= 2) {
    const correlationId = `corr_${Date.now()}_${alert.category}`;
    await prisma.commandCenterAlert.updateMany({
      where: { id: { in: recentRelated.map((a) => a.id) } },
      data: { correlationId },
    });
    return correlationId;
  }

  return `corr_${Date.now()}_${alert.category}`;
}

// Priority scoring: Combine base priority + frequency + affected population
async function computeAdjustedPriority(alert: RawAlert): Promise<AlertPriority> {
  // Count similar alerts in the last hour
  const recentCount = await prisma.commandCenterAlert.count({
    where: {
      eventId: alert.eventId,
      category: alert.category,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  // Escalate priority if there is a pattern of recurring alerts
  if (recentCount >= 5 && alert.priority === "MEDIUM") {
    return "HIGH";
  }
  if (recentCount >= 10 && alert.priority === "HIGH") {
    return "CRITICAL";
  }

  return alert.priority;
}

// Alert routing based on priority
async function routeAlert(alert: CommandCenterAlert): Promise<void> {
  const routing: Record<AlertPriority, () => Promise<void>> = {
    CRITICAL: async () => {
      // Audio alarm + screen flash + SMS to all coordinators
      eventBus.emit("alert:audio", { type: "alarm", alertId: alert.id });
      eventBus.emit("alert:flash", { alertId: alert.id });
      await sendSmsToCoordinators(alert);

      // Schedule escalation if not acknowledged in 5 minutes
      scheduleEscalation(alert.id, 5 * 60 * 1000);
    },
    HIGH: async () => {
      // Audio chime + command center highlight + notify zone lead
      eventBus.emit("alert:audio", { type: "chime", alertId: alert.id });
      await notifyZoneLead(alert);
    },
    MEDIUM: async () => {
      // Command center feed + notify relevant team
      await notifyRelevantTeam(alert);
    },
    LOW: async () => {
      // Command center feed only, auto-expires after 30 min
      // No additional routing needed
    },
  };

  await routing[alert.priority]();
}

// Escalation: Unacknowledged CRITICAL alerts escalate after 5 minutes
async function scheduleEscalation(alertId: string, delayMs: number): Promise<void> {
  setTimeout(async () => {
    const alert = await prisma.commandCenterAlert.findUnique({
      where: { id: alertId },
    });

    if (alert && alert.status === "ACTIVE" && !alert.acknowledgedAt) {
      // Escalate: SMS to event director
      await prisma.commandCenterAlert.update({
        where: { id: alertId },
        data: {
          escalatedAt: new Date(),
          escalationLevel: alert.escalationLevel + 1,
        },
      });

      await sendSmsToEventDirector(alert);
      logger.warn("CRITICAL alert escalated", {
        alertId,
        escalationLevel: alert.escalationLevel + 1,
      });
    }
  }, delayMs);
}
```

### 5.7 Real-Time Data Pipeline

Each dashboard widget subscribes to a specific SSE channel:

```
Widget: "Key Metrics"     -> SSE channel: /events/:eventId/metrics/summary
Widget: "Funnel"          -> SSE channel: /events/:eventId/metrics/funnel
Widget: "Occupancy"       -> SSE channel: /events/:eventId/metrics/occupancy
Widget: "Alerts"          -> SSE channel: /events/:eventId/alerts

Server-side:
  -> Every action (registration, approval, scan, incident) triggers a metric update
  -> Metric aggregator computes running totals in VenueOccupancy / AnalyticsSnapshot
  -> SSE broadcaster pushes delta updates to subscribed clients
  -> Clients patch local state (no full refresh, only incremental updates)
```

### 5.8 PDF Snapshot Generation

```
Admin clicks [Export] -> Choose: "Daily Briefing" or "Full Report"
  -> System reads current AnalyticsSnapshot for selected period
  -> Renders dashboard charts as static SVG images
  -> Assembles PDF layout: cover page + key metrics + charts + data tables
  -> Generates PDF using @react-pdf/renderer (same engine as badge/certificate generation)
  -> Returns download link
  -> Optionally: schedule daily briefing PDF to be emailed at 07:00 every morning
```

```typescript
// ==========================================
// PDF SNAPSHOT GENERATION
// ==========================================

export async function generateAnalyticsPdf(
  tenantId: string,
  eventId: string,
  options: {
    type: "DAILY_BRIEFING" | "FULL_REPORT";
    dateRange?: { from: Date; to: Date };
    generatedBy: string;
  },
): Promise<{ downloadUrl: string; expiresAt: Date }> {
  // Fetch latest snapshot
  const snapshot = await prisma.analyticsSnapshot.findFirst({
    where: { tenantId, eventId },
    orderBy: { generatedAt: "desc" },
  });

  // Fetch supporting data
  const [occupancy, alerts, throughput] = await Promise.all([
    prisma.venueOccupancy.findMany({ where: { eventId } }),
    prisma.alertFeed.findMany({
      where: { eventId, createdAt: { gte: options.dateRange?.from } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getGateThroughputData(eventId, options.dateRange),
  ]);

  // Render PDF using @react-pdf/renderer
  const pdfBuffer = await renderPdf({
    template: options.type === "DAILY_BRIEFING" ? "daily-briefing" : "full-report",
    data: {
      event: await prisma.event.findUniqueOrThrow({ where: { id: eventId } }),
      snapshot: snapshot?.metrics,
      occupancy,
      alerts,
      throughput,
      generatedAt: new Date(),
    },
  });

  // Upload to S3
  const key = `reports/${tenantId}/${eventId}/${options.type.toLowerCase()}-${Date.now()}.pdf`;
  const downloadUrl = await uploadToS3(pdfBuffer, key);

  // Create snapshot record
  await prisma.analyticsSnapshot.create({
    data: {
      tenantId,
      eventId,
      snapshotType: "ON_DEMAND",
      metrics: snapshot?.metrics ?? {},
      generatedBy: options.generatedBy,
    },
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { downloadUrl, expiresAt };
}
```

### 5.9 Kiosk Mode Implementation

```typescript
// ==========================================
// KIOSK MODE IMPLEMENTATION
// ==========================================

// Locked browser mode configuration
export const KIOSK_CONFIG = {
  // Auto-reset after inactivity timeout (seconds)
  inactivityTimeout: 120,

  // Maximum session duration (seconds)
  maxSessionDuration: 300,

  // Accessibility mode defaults
  accessibility: {
    largeFontsThreshold: 24, // Base font size in px
    highContrastMode: false,
    screenReaderSupport: true,
  },

  // Security: prevent browser escape
  security: {
    disableContextMenu: true,
    disableDevTools: true,
    disableAddressBar: true,
    disableKeyboardShortcuts: [
      "Alt+Tab",
      "Alt+F4",
      "Ctrl+Alt+Delete",
      "Ctrl+W",
      "Ctrl+T",
      "Ctrl+N",
      "F5",
      "F11",
      "F12",
      "Ctrl+Shift+I",
      "Ctrl+Shift+J",
    ],
    allowedUrls: ["/kiosk/*"], // Whitelist only kiosk routes
    disableFileSystem: true,
    disableClipboard: true,
  },

  // Peripheral integration
  peripherals: {
    thermalPrinter: {
      enabled: true,
      paperWidth: 80, // mm
      ticketTemplate: "queue-ticket",
    },
    barcodeScanner: {
      enabled: true,
      supportedFormats: ["QR_CODE", "CODE_128", "PDF_417"],
    },
  },
};

// Kiosk session lifecycle
export class KioskSessionManager {
  private inactivityTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;

  async startSession(
    kioskId: string,
    sessionType: string,
    language: string = "en",
  ): Promise<KioskSession> {
    // End any existing active session
    await this.endActiveSession(kioskId);

    const session = await prisma.kioskSession.create({
      data: {
        kioskDeviceId: kioskId,
        sessionType,
        language,
        startedAt: new Date(),
      },
    });

    // Start inactivity timer
    this.resetInactivityTimer(session.id, kioskId);

    // Start max session timer
    this.sessionTimer = setTimeout(
      () => this.endSession(session.id, true),
      KIOSK_CONFIG.maxSessionDuration * 1000,
    );

    eventBus.emit("kiosk:session_start", { kioskId, sessionId: session.id, sessionType });

    return session;
  }

  async recordInteraction(sessionId: string, kioskId: string): Promise<void> {
    // Reset inactivity timer on any user interaction
    this.resetInactivityTimer(sessionId, kioskId);
  }

  private resetInactivityTimer(sessionId: string, kioskId: string): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(
      () => this.endSession(sessionId, true),
      KIOSK_CONFIG.inactivityTimeout * 1000,
    );
  }

  async endSession(sessionId: string, timedOut: boolean = false): Promise<void> {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.sessionTimer) clearTimeout(this.sessionTimer);

    await prisma.kioskSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        timedOut,
      },
    });

    eventBus.emit("kiosk:session_end", { sessionId, timedOut });
  }

  private async endActiveSession(kioskId: string): Promise<void> {
    const active = await prisma.kioskSession.findFirst({
      where: { kioskDeviceId: kioskId, endedAt: null },
    });
    if (active) {
      await this.endSession(active.id, true);
    }
  }
}

// Accessibility mode
export function getAccessibilityConfig(enabled: boolean): AccessibilityConfig {
  if (!enabled) return { fontSize: 16, contrast: "normal", screenReader: false };

  return {
    fontSize: KIOSK_CONFIG.accessibility.largeFontsThreshold,
    contrast: "high",
    screenReader: true,
    additionalStyles: {
      "--font-size-base": "24px",
      "--font-size-heading": "36px",
      "--button-min-height": "64px",
      "--button-min-width": "200px",
      "--color-bg": "#000000",
      "--color-text": "#FFFFFF",
      "--color-primary": "#FFD700",
      "--color-accent": "#00FF00",
      "--border-width": "3px",
    },
  };
}
```

### 5.10 Self-Service Badge Collection Flow

```
Participant taps [Join Badge Collection Queue]
  -> Lookup screen: enter registration code or scan passport barcode
  -> System finds participant record
  -> Verify identity:
    - Display participant photo on screen
    - Staff visually confirms face matches
    - OR: participant enters last 4 digits of passport number
  -> Check badge status:
    - Not printed yet -> "Your badge is being prepared. Estimated wait: 15 minutes."
    - Printed and ready -> "Your badge is ready for collection!"
  -> Generate QueueTicket:
    - VIP/Head of State -> priority: 10 (served first)
    - Minister -> priority: 5
    - Others -> priority: 0 (FIFO)
    - Ticket number displayed on screen: "Your number: A-042"
    - Estimated wait calculated: (tickets ahead / avg service time)
  -> Participant takes printed ticket slip (kiosk has thermal printer)
  -> When counter becomes available:
    - QueueTicket.status -> CALLED
    - Announcement display shows: "A-042 -> Counter 3"
    - Staff at counter sees participant details, hands over badge
    - QueueTicket.status -> COMPLETED
```

```typescript
// ==========================================
// QUEUE MANAGEMENT
// ==========================================

export async function joinBadgeQueue(
  tenantId: string,
  eventId: string,
  participantId: string,
  kioskId?: string,
): Promise<QueueTicket> {
  const participant = await prisma.participant.findUniqueOrThrow({
    where: { id: participantId },
    include: { participantType: true },
  });

  // Check if already in queue
  const existingTicket = await prisma.queueTicket.findFirst({
    where: {
      tenantId,
      eventId,
      participantId,
      status: { in: ["WAITING", "CALLED", "SERVING"] },
    },
  });
  if (existingTicket) {
    return existingTicket; // Return existing ticket, don't create duplicate
  }

  // Determine priority based on participant type
  const priority = getQueuePriority(participant.participantType?.name);

  // Generate ticket number
  const prefix = getTicketPrefix(participant.participantType?.name);
  const nextNumber = await getNextTicketNumber(tenantId, eventId, prefix);
  const ticketNumber = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

  // Calculate estimated wait
  const ticketsAhead = await prisma.queueTicket.count({
    where: {
      tenantId,
      eventId,
      status: "WAITING",
      priority: { gte: priority },
    },
  });
  const avgServiceTime = await getAverageServiceTime(tenantId, eventId);
  const estimatedWait = Math.ceil(ticketsAhead * avgServiceTime);

  const ticket = await prisma.queueTicket.create({
    data: {
      tenantId,
      eventId,
      participantId,
      ticketNumber,
      status: "WAITING",
      priority,
      estimatedWait,
    },
  });

  // Emit for queue display boards
  eventBus.emit("queue:joined", { tenantId, eventId, ticket });

  return ticket;
}

function getQueuePriority(participantType?: string): number {
  const priorities: Record<string, number> = {
    "Head of State": 10,
    "Head of Government": 10,
    Minister: 5,
    Ambassador: 5,
    "Senior Official": 3,
    Delegate: 0,
    Observer: 0,
    Media: 0,
    Staff: 0,
  };
  return priorities[participantType ?? ""] ?? 0;
}

function getTicketPrefix(participantType?: string): string {
  if (
    ["Head of State", "Head of Government", "Minister", "Ambassador"].includes(
      participantType ?? "",
    )
  ) {
    return "V"; // VIP prefix
  }
  return "A"; // General prefix
}

// Call next ticket to a counter
export async function callNextTicket(
  tenantId: string,
  eventId: string,
  counterNumber: number,
): Promise<QueueTicket | null> {
  // Get highest-priority waiting ticket
  const nextTicket = await prisma.queueTicket.findFirst({
    where: { tenantId, eventId, status: "WAITING" },
    orderBy: [{ priority: "desc" }, { joinedAt: "asc" }],
  });

  if (!nextTicket) return null;

  const updated = await prisma.queueTicket.update({
    where: { id: nextTicket.id },
    data: {
      status: "CALLED",
      counterNumber,
      calledAt: new Date(),
    },
  });

  // Emit for display boards and kiosks
  eventBus.emit("queue:called", {
    tenantId,
    eventId,
    ticketNumber: updated.ticketNumber,
    counterNumber,
  });

  return updated;
}
```

### 5.11 Command Center Decision Support

```typescript
// ==========================================
// COMMAND CENTER DECISION SUPPORT
// ==========================================

// Generate automated suggested actions based on current event state
export async function generateSuggestedAction(alert: RawAlert): Promise<string | null> {
  // Capacity-related suggestions
  if (alert.category === "capacity") {
    const metadata = alert.metadata as { zoneId?: string; percentage?: number };
    if (metadata?.percentage && metadata.percentage >= 90) {
      const alternateZones = await findAlternateZones(alert.eventId, metadata.zoneId!);
      if (alternateZones.length > 0) {
        const best = alternateZones[0];
        return `Redirect overflow from ${alert.title.split(" at ")[0]} to ${best.name} (currently at ${best.percentage}% capacity)`;
      }
    }
  }

  // Staffing suggestions based on gate throughput
  if (alert.category === "throughput" && alert.source === "access_control") {
    const metadata = alert.metadata as { gateId?: string; throughput?: number };
    if (metadata?.throughput && metadata.throughput > 150) {
      return `Deploy 2 additional staff to ${alert.title.split(":")[0]} to manage high throughput (${metadata.throughput}/hr)`;
    }
  }

  // Equipment failure suggestions
  if (alert.category === "equipment") {
    if (alert.title.includes("offline")) {
      return `Check network connectivity at device location. If unresolved, deploy backup scanner device.`;
    }
    if (alert.title.includes("battery")) {
      return `Replace or charge device. Backup device available at Operations Room.`;
    }
  }

  // Transport delay suggestions
  if (alert.category === "transport") {
    return `Contact driver for status update. Consider dispatching alternate vehicle if delay exceeds 15 minutes.`;
  }

  return null;
}

async function findAlternateZones(
  eventId: string,
  currentZoneId: string,
): Promise<Array<{ name: string; percentage: number }>> {
  const allOccupancy = await prisma.venueOccupancy.findMany({
    where: {
      eventId,
      zoneId: { not: currentZoneId, not: null },
    },
  });

  return allOccupancy
    .map((o) => ({
      name: o.zoneId || "Unknown",
      percentage: Math.round((o.currentCount / o.maxCapacity) * 100),
    }))
    .filter((z) => z.percentage < 70)
    .sort((a, b) => a.percentage - b.percentage);
}

// Quick Action Execution Engine
export async function executeQuickAction(
  tenantId: string,
  eventId: string,
  actionType: QuickActionType,
  executedBy: string,
  parameters?: Record<string, unknown>,
): Promise<QuickAction> {
  // Check if dual authorization is required
  const requiresDualAuth = ["LOCKDOWN", "EVACUATION_ALERT"].includes(actionType);

  if (requiresDualAuth) {
    // Create pending action, await second operator confirmation
    return prisma.quickAction.create({
      data: {
        tenantId,
        eventId,
        actionType,
        executedBy,
        parameters: parameters ?? undefined,
        // confirmedBy is null until second operator confirms
      },
    });
  }

  // Execute immediately for non-critical actions
  const action = await prisma.quickAction.create({
    data: {
      tenantId,
      eventId,
      actionType,
      executedBy,
      confirmedBy: executedBy, // Self-confirmed for standard actions
      parameters: parameters ?? undefined,
    },
  });

  await performQuickAction(action);
  return action;
}

async function performQuickAction(action: QuickAction): Promise<void> {
  const handlers: Record<QuickActionType, () => Promise<void>> = {
    EMERGENCY_BROADCAST: async () => {
      const message = (action.parameters as any)?.message;
      await broadcastToAllParticipants(action.eventId, message);
    },
    GATE_CLOSE_ALL: async () => {
      await prisma.checkpoint.updateMany({
        where: { eventId: action.eventId },
        data: { isActive: false },
      });
      eventBus.emit("gates:closed", { eventId: action.eventId });
    },
    GATE_OPEN_ALL: async () => {
      await prisma.checkpoint.updateMany({
        where: { eventId: action.eventId },
        data: { isActive: true },
      });
      eventBus.emit("gates:opened", { eventId: action.eventId });
    },
    EVENT_PAUSE: async () => {
      eventBus.emit("event:paused", { eventId: action.eventId });
    },
    EVENT_RESUME: async () => {
      eventBus.emit("event:resumed", { eventId: action.eventId });
    },
    LOCKDOWN: async () => {
      await prisma.checkpoint.updateMany({
        where: { eventId: action.eventId },
        data: { isActive: false },
      });
      await broadcastToAllParticipants(
        action.eventId,
        "SECURITY LOCKDOWN: Please remain in your current location.",
      );
      eventBus.emit("event:lockdown", { eventId: action.eventId });
    },
    EVACUATION_ALERT: async () => {
      await broadcastToAllParticipants(
        action.eventId,
        "EVACUATION: Please proceed to the nearest exit immediately.",
      );
      // Close non-exit gates, keep exit gates open
      await prisma.checkpoint.updateMany({
        where: { eventId: action.eventId, direction: { not: "EXIT_ONLY" } },
        data: { isActive: false },
      });
      eventBus.emit("event:evacuation", { eventId: action.eventId });
    },
  };

  await handlers[action.actionType]();
}
```

### 5.12 Historical Event Replay

```
Replay mode:
  Admin opens Command Center -> selects "Historical Replay"
  -> Chooses date range and playback speed (1x, 2x, 5x, 10x, 60x)
  -> System queries EventStateChange records ordered by timestamp
  -> Replays state changes into the widget data streams
  -> Dashboard animates through the event timeline
  -> Pause at any point to inspect state
  -> Useful for: incident post-mortems, training new ops staff, process improvement
```

```typescript
// ==========================================
// HISTORICAL EVENT REPLAY
// ==========================================

export class EventReplayEngine {
  private isPaused: boolean = false;
  private currentIndex: number = 0;
  private events: EventStateChange[] = [];
  private speed: number = 1;
  private timer: NodeJS.Timeout | null = null;

  async startReplay(
    eventId: string,
    startTime: Date,
    endTime: Date,
    speed: number,
    onEvent: (event: EventStateChange) => void,
  ): Promise<{ totalEvents: number; estimatedDuration: number }> {
    this.speed = speed;
    this.currentIndex = 0;
    this.isPaused = false;

    // Load all state changes in the time range
    this.events = await prisma.eventStateChange.findMany({
      where: {
        eventId,
        timestamp: { gte: startTime, lte: endTime },
      },
      orderBy: { timestamp: "asc" },
    });

    const totalDuration = endTime.getTime() - startTime.getTime();
    const estimatedDuration = totalDuration / (speed * 1000);

    // Start replay loop
    this.replayNext(onEvent);

    return {
      totalEvents: this.events.length,
      estimatedDuration: Math.round(estimatedDuration),
    };
  }

  private replayNext(onEvent: (event: EventStateChange) => void): void {
    if (this.isPaused || this.currentIndex >= this.events.length) return;

    const current = this.events[this.currentIndex];
    onEvent(current);
    this.currentIndex++;

    if (this.currentIndex < this.events.length) {
      const next = this.events[this.currentIndex];
      const realDelay = next.timestamp.getTime() - current.timestamp.getTime();
      const replayDelay = realDelay / this.speed;

      this.timer = setTimeout(() => this.replayNext(onEvent), Math.max(replayDelay, 10));
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.timer) clearTimeout(this.timer);
  }

  resume(onEvent: (event: EventStateChange) => void): void {
    this.isPaused = false;
    this.replayNext(onEvent);
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentIndex,
      total: this.events.length,
      percentage:
        this.events.length > 0 ? Math.round((this.currentIndex / this.events.length) * 100) : 0,
    };
  }
}
```

### 5.13 Predictive Analytics

```typescript
// ==========================================
// PREDICTIVE ANALYTICS
// ==========================================

// Arrival prediction based on historical patterns and registration data
export async function predictArrivals(
  eventId: string,
  targetDate: Date,
): Promise<ArrivalPrediction> {
  // Get historical arrival patterns from previous events
  const historicalPatterns = await getHistoricalArrivalPatterns(eventId);

  // Get registration data for expected participants
  const registeredCount = await prisma.participant.count({
    where: { eventId, status: "APPROVED", badgePrinted: true },
  });

  // Get already checked-in count for today
  const checkedInToday = await prisma.accessLog.count({
    where: {
      checkpoint: { eventId },
      scanType: "ENTRY",
      scanResult: "ALLOWED",
      scannedAt: {
        gte: startOfDay(targetDate),
        lt: endOfDay(targetDate),
      },
    },
  });

  // Generate hourly predictions
  const hourlyPredictions: HourlyPrediction[] = [];
  for (let hour = 7; hour <= 20; hour++) {
    const historicalRate = historicalPatterns.find((p) => p.hour === hour)?.rate ?? 0;
    const expectedArrivals = Math.round(registeredCount * historicalRate);

    hourlyPredictions.push({
      hour,
      expectedArrivals,
      cumulativeExpected:
        hourlyPredictions.reduce((sum, p) => sum + p.expectedArrivals, 0) + expectedArrivals,
      confidenceInterval: {
        low: Math.round(expectedArrivals * 0.8),
        high: Math.round(expectedArrivals * 1.2),
      },
    });
  }

  // Capacity forecasting: when will we hit thresholds?
  const venueCapacity = await getVenueCapacity(eventId);
  const peakHour = hourlyPredictions.reduce((max, p) =>
    p.expectedArrivals > max.expectedArrivals ? p : max,
  );

  // Staffing recommendations
  const staffingRecommendations = generateStaffingRecommendations(hourlyPredictions, venueCapacity);

  return {
    date: targetDate,
    registeredCount,
    checkedInToday,
    remainingExpected: registeredCount - checkedInToday,
    hourlyPredictions,
    peakHour: peakHour.hour,
    peakExpected: peakHour.expectedArrivals,
    capacityForecast: {
      threshold75: findThresholdTime(hourlyPredictions, venueCapacity, 0.75),
      threshold90: findThresholdTime(hourlyPredictions, venueCapacity, 0.9),
      threshold100: findThresholdTime(hourlyPredictions, venueCapacity, 1.0),
    },
    staffingRecommendations,
  };
}

function generateStaffingRecommendations(
  predictions: HourlyPrediction[],
  venueCapacity: number,
): StaffingRecommendation[] {
  return predictions.map((p) => {
    // Base: 1 staff per 50 expected arrivals per hour
    const baseStaff = Math.ceil(p.expectedArrivals / 50);
    // Add extra staff when approaching capacity
    const capacityFactor = p.cumulativeExpected / venueCapacity;
    const extraStaff = capacityFactor > 0.8 ? 2 : capacityFactor > 0.6 ? 1 : 0;

    return {
      hour: p.hour,
      recommendedGateStaff: baseStaff + extraStaff,
      recommendedKioskStaff: Math.ceil(baseStaff / 3),
      reason:
        capacityFactor > 0.8
          ? "High load expected - additional staff recommended"
          : "Normal staffing level",
    };
  });
}
```

### 5.14 Analytics Aggregation Engine

```typescript
// ==========================================
// ANALYTICS AGGREGATION ENGINE
// ==========================================

// Real-time metric computation
export class MetricAggregator {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // Called on every scan event
  async onScanCompleted(event: ScanCompletedEvent): Promise<void> {
    const { eventId, checkpointId, scanResult, scanType } = event;
    const pipeline = this.redis.pipeline();

    // Total scans
    pipeline.incr(`metrics:${eventId}:scans:total`);

    // Scans by result
    pipeline.incr(`metrics:${eventId}:scans:${scanResult}`);

    // Scans by checkpoint
    pipeline.incr(`metrics:${eventId}:checkpoint:${checkpointId}:${scanType}`);

    // Gate throughput (sliding window - current hour)
    const hourKey = `metrics:${eventId}:throughput:${checkpointId}:${getCurrentHourKey()}`;
    pipeline.incr(hourKey);
    pipeline.expire(hourKey, 7200); // Expire after 2 hours

    await pipeline.exec();
  }

  // Called on every registration status change
  async onRegistrationChanged(event: RegistrationChangedEvent): Promise<void> {
    const { eventId, newStatus } = event;
    const pipeline = this.redis.pipeline();

    pipeline.incr(`metrics:${eventId}:registration:${newStatus}`);

    // Track velocity (registrations in the last hour)
    const velocityKey = `metrics:${eventId}:velocity:registration:${getCurrentHourKey()}`;
    pipeline.incr(velocityKey);
    pipeline.expire(velocityKey, 7200);

    await pipeline.exec();
  }

  // Get current metrics summary
  async getMetricsSummary(eventId: string): Promise<MetricsSummary> {
    const keys = await this.redis.keys(`metrics:${eventId}:*`);
    const values = keys.length > 0 ? await this.redis.mget(keys) : [];

    const metrics: Record<string, number> = {};
    keys.forEach((key, i) => {
      const shortKey = key.replace(`metrics:${eventId}:`, "");
      metrics[shortKey] = parseInt(values[i] || "0", 10);
    });

    return {
      totalScans: metrics["scans:total"] || 0,
      allowedScans: metrics["scans:ALLOWED"] || 0,
      deniedScans: (metrics["scans:total"] || 0) - (metrics["scans:ALLOWED"] || 0),
      registrationCount: metrics["registration:SUBMITTED"] || 0,
      approvedCount: metrics["registration:APPROVED"] || 0,
      printedCount: metrics["registration:PRINTED"] || 0,
      collectedCount: metrics["registration:COLLECTED"] || 0,
    };
  }
}

// Snapshot scheduling
export async function scheduleSnapshots(eventId: string): Promise<void> {
  // Hourly snapshots
  cron.schedule("0 * * * *", async () => {
    await createScheduledSnapshot(eventId, "HOURLY");
  });

  // Daily snapshots
  cron.schedule("59 23 * * *", async () => {
    await createScheduledSnapshot(eventId, "DAILY");
  });

  // Weekly snapshots
  cron.schedule("59 23 * * 0", async () => {
    await createScheduledSnapshot(eventId, "WEEKLY");
  });
}

async function createScheduledSnapshot(eventId: string, snapshotType: string): Promise<void> {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  const aggregator = new MetricAggregator(redis);
  const metrics = await aggregator.getMetricsSummary(eventId);

  await prisma.analyticsSnapshot.create({
    data: {
      tenantId: event.tenantId,
      eventId,
      snapshotType,
      metrics: metrics as unknown as Prisma.JsonObject,
      generatedAt: new Date(),
    },
  });

  logger.info(`${snapshotType} snapshot created`, { eventId });
}

// Custom report builder
export async function executeCustomReport(reportId: string): Promise<ReportResult> {
  const report = await prisma.savedReport.findUniqueOrThrow({
    where: { id: reportId },
  });

  const filters = report.filters as ReportFilters;
  const columns = report.columns;

  // Build dynamic query based on report configuration
  const queryBuilder = new ReportQueryBuilder(report.eventId);

  if (filters.dateRange) {
    queryBuilder.withDateRange(filters.dateRange.from, filters.dateRange.to);
  }
  if (filters.participantTypes) {
    queryBuilder.withParticipantTypes(filters.participantTypes);
  }
  if (filters.countries) {
    queryBuilder.withCountries(filters.countries);
  }
  if (filters.scanResults) {
    queryBuilder.withScanResults(filters.scanResults);
  }

  const data = await queryBuilder.execute(columns);

  return {
    reportId,
    name: report.name,
    generatedAt: new Date(),
    data,
    chartType: report.chartType,
    totalRows: data.length,
  };
}
```

---

## 6. User Interface

### 6.1 Scanner Interface

```
┌─────────────────────────────────────────────────────────┐
│  # Scanner Active          Checkpoint: Main Gate A      │
│  ────────────────────────────────────────────────────── │
│                                                         │
│              ┌─────────────────────┐                    │
│              │                     │                    │
│              │    Camera Feed      │                    │
│              │                     │                    │
│              │   [ QR viewfinder ] │                    │
│              │                     │                    │
│              └─────────────────────┘                    │
│                                                         │
│  Last scan:                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [OK] ALLOWED                                    │   │
│  │  ┌──────┐                                        │   │
│  │  │ Photo│  H.E. John Doe                        │   │
│  │  │      │  Republic of Kenya | Minister          │   │
│  │  └──────┘  Access: CLOSED  |  Badge: REG-0042   │   │
│  │            Scanned at 09:15:32                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Today: 342 entries | 28 exits | 314 inside            │
│                                                         │
│  [Manual Entry]  [Override]  [Report Incident]         │
└─────────────────────────────────────────────────────────┘
```

When a scan is **denied**, the screen flashes red with the denial reason in large text. The security staff can tap **[Override]** to manually allow entry, which requires typing a reason (stored in `overrideReason`).

### 6.2 Enhanced Scanner with Photo Verification

```
┌─────────────────────────────────────────────────────────────┐
│  # Scanner Active      Checkpoint: VIP Gate    [Settings]   │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │                      │  │  SCAN RESULT                  │ │
│  │   Camera Feed        │  │                               │ │
│  │                      │  │  [OK] ALLOWED                 │ │
│  │   [ QR viewfinder ]  │  │                               │ │
│  │                      │  │  ┌────────┐  ┌────────────┐  │ │
│  │   Point camera at    │  │  │ Badge  │  │ Live       │  │ │
│  │   badge QR code      │  │  │ Photo  │  │ Camera     │  │ │
│  │                      │  │  │        │  │ Snapshot   │  │ │
│  └──────────────────────┘  │  └────────┘  └────────────┘  │ │
│                             │                               │ │
│  Device: Scanner-VIP-01    │  H.E. Maria Santos            │ │
│  Battery: 87% [||||||||.]  │  Republic of Mozambique        │ │
│  Signal: Strong            │  Minister of Foreign Affairs   │ │
│  Mode: Online              │  Access: CLOSED                │ │
│                             │  Badge: REG-0108               │ │
│  ┌──────────────────────┐  │  Scanned: 10:22:45             │ │
│  │  PHOTO MATCH          │  │                               │ │
│  │  [ ] Verified          │  │  [!] Protocol officer         │ │
│  │  Badge photo matches  │  │      notified of arrival      │ │
│  │  person at gate       │  │                               │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│                                                              │
│  Today: 87 entries | 12 exits | 75 inside | 2 denied        │
│                                                              │
│  [Manual Entry]  [Override]  [Report Incident]  [Sync Now]  │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Real-Time Occupancy Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Venue Occupancy -- Live                    Auto-refresh: 5s │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Overall Venue        ████████████░░░░  1,247 / 2,000 (62%) │
│                                                              │
│  Plenary Hall         ████████████████  598 / 600   (99%) ! │
│  Conference Room A    ████████░░░░░░░░  89 / 150    (59%)   │
│  Conference Room B    ████████████░░░░  112 / 150   (75%)   │
│  Press Center         ████░░░░░░░░░░░░  32 / 100    (32%)   │
│  VIP Lounge           ██████░░░░░░░░░░  24 / 50     (48%)   │
│  Exhibition Hall      ██████████░░░░░░  392 / 600   (65%)   │
│                                                              │
│  ! Plenary Hall at 99% -- consider redirecting overflow      │
│                                                              │
│  Gate Throughput (last hour):                                │
│  Main Gate A:  142 entries/hr  ▓▓▓▓▓▓▓▓▓▓                   │
│  Main Gate B:  98 entries/hr   ▓▓▓▓▓▓▓                       │
│  VIP Gate:     23 entries/hr   ▓▓                             │
│  Service Gate: 15 entries/hr   ▓                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Capacity thresholds trigger automatic alerts:

- **75%**: Yellow indicator -- staff notified
- **90%**: Orange indicator -- consider stopping new entries
- **100%**: Red indicator -- gate scanners auto-deny with `DENIED_CAPACITY_FULL`

### 6.4 Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics Dashboard -- 38th AU Summit         [Live *] [Export] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Key Metrics (updated every 30s via SSE)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   1,847  │ │   1,203  │ │    89%   │ │   4.2h   │           │
│  │Registered│ │ Approved │ │Approval %│ │ Avg Time │           │
│  │  +23/hr  │ │  +15/hr  │ │  ^ 2%   │ │  v 0.3h │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  Registration Funnel                  SLA Compliance Heatmap     │
│  ┌──────────────────────┐           ┌───────────────────────┐   │
│  │ ████████████████ 1847│ Submitted │      Mon Tue Wed Thu  │   │
│  │ ██████████████   1580│ Docs OK   │ Val1  [G] [G] [Y] [G]│   │
│  │ ████████████     1203│ Approved  │ Val2  [G] [Y] [R] [Y]│   │
│  │ ██████████        987│ Printed   │ Val3  [G] [G] [G] [G]│   │
│  │ ████████          812│ Collected │ Val4  [Y] [R] [R] [Y]│   │
│  └──────────────────────┘           └───────────────────────┘   │
│                                                                  │
│  Registration by Country (top 10)     Validator Workload         │
│  ┌──────────────────────┐           ┌───────────────────────┐   │
│  │ Nigeria    ▓▓▓▓▓ 124 │           │ Val1 ████████░░ 45    │   │
│  │ Ethiopia   ▓▓▓▓  98  │           │ Val2 ██████████ 67 !  │   │
│  │ Kenya      ▓▓▓▓  95  │           │ Val3 ████░░░░░░ 23    │   │
│  │ S.Africa   ▓▓▓   87  │           │ Val4 ██████░░░░ 38    │   │
│  │ Egypt      ▓▓▓   82  │           │ Imbalance detected    │   │
│  │ ...                  │           └───────────────────────┘   │
│  └──────────────────────┘                                       │
│                                                                  │
│  Alerts (3 active)                                               │
│  [!] Validator 2 SLA breach: 12 requests pending > 24 hours     │
│  [*] Plenary Hall at 92% capacity                                │
│  [*] Registration velocity dropped 40% vs. yesterday             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Kiosk Self-Service Interface

Touch-optimized with large buttons, high contrast, and multilingual support:

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              38th African Union Summit                       │
│              Accreditation Self-Service                      │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │                      │  │                      │        │
│  │    [?] LOOK UP       │  │    [#] SCAN BADGE    │        │
│  │    MY STATUS         │  │    QR CODE           │        │
│  │                      │  │                      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │                      │  │                      │        │
│  │    [T] JOIN BADGE    │  │    [i] EVENT          │        │
│  │    COLLECTION QUEUE  │  │    INFORMATION       │        │
│  │                      │  │                      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │                      │  │                      │        │
│  │    [>] WAYFINDING    │  │    [A] ACCESSIBILITY  │        │
│  │    & DIRECTIONS      │  │    MODE              │        │
│  │                      │  │                      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
│  Language: [EN] [FR] [AR] [PT]                              │
│                                                              │
│  Session will auto-reset after 2 minutes of inactivity      │
└─────────────────────────────────────────────────────────────┘
```

### 6.6 Queue Display Board

A separate kiosk in QUEUE_DISPLAY mode shows the current queue status on a large screen:

```
┌─────────────────────────────────────────────────────────────┐
│  Badge Collection Queue                    Current Wait: 8m │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NOW SERVING:                                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Counter 1  │ │ Counter 2  │ │ Counter 3  │              │
│  │   A-038    │ │   A-039    │ │   V-007    │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                              │
│  NEXT UP:                                                    │
│  A-040  ->  A-041  ->  A-042  ->  A-043  ->  A-044         │
│                                                              │
│  Waiting: 23  |  Served today: 487  |  Avg service: 3.2m   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.7 Command Center War Room Layout

```
+--------------------------------------------------------------------------+
|  COMMAND CENTER - 38th AU Summit    Feb 10, 2026  11:42:15    29C        |
+---------------------------------+----------------------------------------+
|  REGISTRATION PIPELINE          |  VENUE OCCUPANCY                       |
|                                 |                                        |
|  Pending    ===------  142      |  Plenary Hall     ========--  82%      |
|  Approved   ========-  1,847    |  Conf Room A      ======----  58%      |
|  Printed    =======--  1,623    |  Conf Room B      =========- 91% [!]  |
|  Collected  ======---  1,341    |  Press Center     ===-------  32%      |
|                                 |  VIP Lounge       ======----  64%      |
|  Today: +87 collected           |  Exhibition Hall  =====-----  48%      |
|  Avg processing: 3.2 min       |                                        |
+---------------------------------+----------------------------------------+
|  ALERT FEED                     |  TRANSPORT                             |
|                                 |                                        |
|  [CRITICAL] 11:40               |  Vehicles active: 12 / 18             |
|    Medical incident - Hall B    |  En route pickups: 4                   |
|    [Acknowledge]                |  Completed today: 23                   |
|                                 |                                        |
|  [HIGH] 11:38                   |  Next VIP pickup: 12:00               |
|    VIP arrival: H.E. President  |    H.E. Minister of Foreign Affairs   |
|    Gate 1 - Protocol dispatched |    Sheraton -> AUCC  |  Car 7         |
|                                 |                                        |
|  [MEDIUM] 11:35                 |  Delayed: Car 3 (+12 min)             |
|    Conf Room B at 91% capacity  |                                        |
|                                 |                                        |
|  [LOW] 11:32                    +----------------------------------------+
|    Session starting: Committee  |  QUICK ACTIONS                         |
|    on Political Affairs         |                                        |
|                                 |  [Emergency Broadcast]  [Close Gates]  |
|  [View all 24 alerts]           |  [Pause Event]   [Evacuation Alert]   |
+---------------------------------+----------------------------------------+
|  UPCOMING: 12:00 Lunch (Restaurant L2, 455 expected) | 14:00 Plenary    |
+--------------------------------------------------------------------------+
```

Each widget is an independent React component that subscribes to a Server-Sent Events (SSE) stream scoped to its data domain. The server maintains one SSE connection per client, multiplexing widget data into typed events.

Widget refresh rates are configurable per widget. High-priority widgets (alerts, gate throughput) use 2-second intervals. Lower-priority widgets (weather, upcoming sessions) use 30-second intervals.

Auto-Rotate Mode:

```
Layout rotation sequence (configurable):
  1. "Main Overview" (30 seconds) -> full dashboard as shown above
  2. "Transport Focus" (20 seconds) -> large transport map + vehicle list
  3. "VIP Protocol" (20 seconds) -> VIP arrival timeline + protocol assignments
  4. "Catering Status" (15 seconds) -> meal collection progress + dietary counts
  -> Loop back to 1

Manual override: any click pauses rotation for 5 minutes, then resumes.
Rotation pauses automatically on CRITICAL alerts until acknowledged.
```

### 6.8 Event Timeline Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│  Event Timeline -- Feb 10, 2026           [<] [Today] [>] [Filter] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  07:00  [MILESTONE] Gates opened for Day 2                          │
│    |                                                                 │
│  07:15  [SCAN] First check-in at Main Gate A (142 in first hour)    │
│    |                                                                 │
│  08:30  [ALERT/YELLOW] Conf Room B reached 75% capacity             │
│    |                                                                 │
│  09:00  [MILESTONE] Opening Ceremony began -- Plenary Hall          │
│    |                                                                 │
│  09:12  [INCIDENT] Medical incident reported -- Hall B              │
│    |    -> Acknowledged by Ops Lead (09:14)                         │
│    |    -> Resolved: paramedics attended (09:28)                    │
│    |                                                                 │
│  09:45  [ALERT/RED] Plenary Hall at 100% -- auto-deny activated    │
│    |    -> Suggested: Redirect to Overflow Room B                   │
│    |    -> Action taken: Overflow room opened (09:47)               │
│    |                                                                 │
│  10:00  [VIP] H.E. President arrived at VIP Gate                    │
│    |    -> Protocol officer dispatched                              │
│    |                                                                 │
│  10:15  [ACTION] Emergency broadcast sent by Ops Lead               │
│    |    -> "Plenary Hall overflow -- proceed to Room B"             │
│    |                                                                 │
│  10:30  [SYSTEM] Occupancy reconciliation corrected -3 drift        │
│    |                                                                 │
│         ... showing 47 of 312 events [Load more]                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.9 Gate Throughput Heatmap

```
┌─────────────────────────────────────────────────────────────────────┐
│  Gate Throughput Heatmap -- Today              [Entries] [Exits]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│             07:00  08:00  09:00  10:00  11:00  12:00  13:00  14:00  │
│  Main A     [  ]  [##]  [###] [####] [###]  [##]   [  ]   [##]    │
│  Main B     [  ]  [# ]  [##]  [###]  [##]   [# ]   [  ]   [# ]    │
│  VIP Gate   [  ]  [  ]  [# ]  [##]   [# ]   [  ]   [  ]   [# ]    │
│  Service    [  ]  [  ]  [  ]  [# ]   [  ]   [  ]   [  ]   [  ]    │
│  Hall B     [  ]  [  ]  [# ]  [##]   [###]  [# ]   [  ]   [# ]    │
│  Press      [  ]  [  ]  [# ]  [# ]   [# ]   [  ]   [  ]   [  ]    │
│                                                                      │
│  Legend:  [  ] 0-25/hr  [# ] 26-75/hr  [##] 76-125/hr              │
│           [###] 126-175/hr  [####] 176+/hr                          │
│                                                                      │
│  Peak: Main Gate A at 09:00-10:00 (187 entries/hr)                  │
│  Current total throughput: 78 entries/hr across all gates            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.10 Alert Management Console

```
┌─────────────────────────────────────────────────────────────────────┐
│  Alert Management                          [Active: 7] [All: 142]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Filter: [All Priorities v] [All Sources v] [Active v] [Search...] │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ [CRITICAL] Security breach detected at Service Gate           │  │
│  │ Source: access_control | 11:40:23 | Escalation: Level 2      │  │
│  │ 3 denied scans from same badge in 5 minutes                  │  │
│  │ Suggested: Dispatch security to Service Gate immediately      │  │
│  │ Correlated with: 2 other security alerts                     │  │
│  │ [Acknowledge] [Resolve] [Assign To...] [View Details]        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ [HIGH] Conf Room B at 91% capacity (correlated: 3 alerts)    │  │
│  │ Source: access_control | 11:35:12 | Acknowledged by: J. Smith│  │
│  │ Suggested: Redirect overflow to Press Center (32% capacity)  │  │
│  │ [Resolve] [Assign To...] [View Correlated]                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ [MEDIUM] Scanner-Gate-B-02 went offline                       │  │
│  │ Source: equipment | 11:28:45 | No heartbeat for 4 minutes    │  │
│  │ Suggested: Check network connectivity. Deploy backup scanner. │  │
│  │ [Acknowledge] [Resolve] [Assign To...]                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Showing 3 of 7 active alerts  [Load more]                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.11 Mobile Scanner App

```
┌───────────────────────────────┐
│ Scanner App          [=] Menu │
│ Gate: Main Gate A             │
│ Status: Online  Batt: 87%    │
├───────────────────────────────┤
│                               │
│  ┌─────────────────────────┐  │
│  │                         │  │
│  │    Camera Viewfinder    │  │
│  │                         │  │
│  │   ┌─────────────────┐   │  │
│  │   │  QR Scan Area   │   │  │
│  │   │                 │   │  │
│  │   └─────────────────┘   │  │
│  │                         │  │
│  └─────────────────────────┘  │
│                               │
│  [OK] ALLOWED                 │
│  ┌────────┐                   │
│  │  Photo │ John Doe          │
│  │        │ Kenya | Minister  │
│  └────────┘ CLOSED | REG-0042│
│                               │
│  Entries: 342 | Inside: 314  │
│                               │
│  [Manual]  [Override]  [!]   │
│                               │
│  Offline scans pending: 0    │
│  Last sync: 2 min ago        │
└───────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Module Integration Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MODULE INTEGRATION MAP                               │
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  Module 09:     │ ---- Badge QR payload -----> Check-In Engine   │
│  │  Registration   │ ---- Participant status ---> Scanner Validate  │
│  │  & Accreditation│ ---- Badge print status ---> Kiosk Queue       │
│  │                 │ <--- Check-in attendance --- Access Logs        │
│  └────────────────┘                                                 │
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  Module 11:     │ ---- Venue zones/rooms ----> Checkpoint Setup  │
│  │  Logistics &    │ ---- Room capacities ------> Occupancy Limits  │
│  │  Venue          │ ---- Floor plans ----------> Kiosk Wayfinding  │
│  │                 │ <--- Occupancy data -------- Real-Time Feed    │
│  └────────────────┘                                                 │
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  Module 12:     │ ---- VIP requirements -----> Scanner Priority  │
│  │  Protocol &     │ ---- Seating protocols ----> Access Levels     │
│  │  Diplomacy      │ <--- VIP arrival alerts ---- Command Center    │
│  │                 │ <--- Gate scan data --------- Access Logs      │
│  └────────────────┘                                                 │
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  Module 04:     │ ---- Approval velocity ----> Analytics Dash    │
│  │  Workflow Engine│ ---- SLA compliance -------> Metric Alerts     │
│  │                 │ ---- Bottleneck data ------> Command Center    │
│  │                 │ <--- Scan events ----------- Real-Time Feed    │
│  └────────────────┘                                                 │
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  Module 06:     │ ---- SSE infrastructure ---> All Dashboards    │
│  │  Infrastructure │ ---- Redis pub/sub --------> Metric Aggregator │
│  │  & DevOps       │ ---- S3 storage -----------> PDF Reports       │
│  │                 │ ---- Monitoring -----------> Scanner Health     │
│  └────────────────┘                                                 │
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  Module 07:     │ ---- REST API framework ---> All Endpoints     │
│  │  API & Integ.   │ ---- Auth middleware ------> Scanner Auth      │
│  │  Layer          │ ---- Rate limiting --------> Scan Endpoints    │
│  │                 │ ---- SSE transport --------> Command Center    │
│  └────────────────┘                                                 │
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  Module 13:     │ <--- Staffing suggestions -- Predictive Engine │
│  │  Workforce      │ <--- Zone coverage gaps ---- Command Center    │
│  │  Management     │ ---- Staff availability ---> Deployment View   │
│  └────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Check-In Integration Points

| System              | Integration                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| Badge Printing      | QR payload is generated during badge print; same payload used for scanning |
| Participant Status  | Only APPROVED participants with printed badges pass validation             |
| Meeting Model       | Meeting access level compared against participant access level             |
| Blacklist           | Real-time screening on every scan                                          |
| Incident Management | "Report Incident" button on scanner creates Incident record                |
| Command Center      | Occupancy data and gate throughput stream via SSE                          |
| Catering            | Access logs used to estimate meal counts at serving points                 |
| Personal Agenda     | Check-in data marks PersonalAgenda attendance as ATTENDED                  |

### 7.3 Analytics Integration Points

| System                    | Data Source                                                    |
| ------------------------- | -------------------------------------------------------------- |
| Registration              | Registration counts, velocity, status distribution             |
| Workflow Engine           | Approval times, SLA compliance, bottleneck identification      |
| Check-In / Access Control | Venue occupancy, gate throughput, scan results                 |
| Incident Management       | Active incident count, resolution times, severity distribution |
| Communication Hub         | Message delivery rates, bounce rates                           |
| Catering                  | Meal redemption rates                                          |
| Transport                 | Vehicle utilization, on-time pickup rates                      |
| Accommodation             | Room occupancy, no-show rates                                  |

### 7.4 Kiosk Integration Points

| System             | Integration                                                     |
| ------------------ | --------------------------------------------------------------- |
| Participant Status | Lookup shows current workflow step and status                   |
| Badge Printing     | Queue ticket generated only if badge is printed and ready       |
| Check-In / Access  | Badge collection logged as first "check-in" event               |
| Analytics          | Queue wait times and throughput feed into operational dashboard |
| Communication Hub  | SMS notification when ticket is called (optional)               |
| Command Center     | Queue lengths stream via SSE for operational awareness          |

### 7.5 Command Center Integration Points

| System                        | Feed into Command Center                              |
| ----------------------------- | ----------------------------------------------------- |
| **Registration / Workflow**   | Pipeline counts, SLA breach alerts, approval velocity |
| **Check-In / Access Control** | Gate throughput, venue occupancy, denied entry alerts |
| **Incident Management**       | Active incidents by severity, resolution times        |
| **Transport**                 | Vehicle positions, delay alerts, VIP pickup schedule  |
| **Catering**                  | Meal collection progress, dietary shortage alerts     |
| **Meeting / Room Booking**    | Upcoming sessions, room capacity warnings             |
| **Staff Management**          | On-duty count by zone, no-show alerts, coverage gaps  |
| **Communication Hub**         | Broadcast status, delivery failures                   |
| **Badge Printing**            | Print queue depth, printer status, collection rate    |
| **Waitlist**                  | Promotion activity, demand-to-capacity alerts         |

---

## 8. Configuration

### 8.1 Environment Variables

```bash
# ===================================================
# Event Operations Center - Environment Configuration
# ===================================================

# --- QR Encryption ---
QR_ENCRYPTION_MASTER_KEY=           # AES-256 master key (64 hex chars)
QR_HMAC_SECRET=                     # HMAC key for QR payload integrity

# --- Scanner Device Management ---
SCANNER_HEARTBEAT_INTERVAL_SEC=30   # How often scanners send heartbeat
SCANNER_OFFLINE_THRESHOLD_SEC=180   # 3 minutes before marking offline
SCANNER_LATEST_FIRMWARE=2.1.0       # Expected firmware version
SCANNER_LATEST_APP_VERSION=3.4.2    # Expected app version
SCANNER_SYNC_INTERVAL_SEC=300       # Offline cache sync (5 minutes)

# --- Occupancy ---
OCCUPANCY_RECONCILE_INTERVAL_MIN=15 # How often to reconcile occupancy
OCCUPANCY_THRESHOLD_YELLOW=75       # Percentage for yellow alert
OCCUPANCY_THRESHOLD_ORANGE=90       # Percentage for orange alert
OCCUPANCY_THRESHOLD_RED=100         # Percentage for red (auto-deny)

# --- Analytics ---
ANALYTICS_SNAPSHOT_HOURLY=true      # Enable hourly snapshots
ANALYTICS_SNAPSHOT_DAILY=true       # Enable daily snapshots
ANALYTICS_DAILY_BRIEFING_HOUR=7     # Hour (UTC) for daily briefing PDF
ANALYTICS_METRIC_REFRESH_SEC=30     # Dashboard metric refresh interval

# --- Kiosk ---
KIOSK_INACTIVITY_TIMEOUT_SEC=120    # Auto-reset after inactivity
KIOSK_MAX_SESSION_SEC=300           # Maximum session duration
KIOSK_HEARTBEAT_INTERVAL_SEC=60    # Kiosk heartbeat interval
KIOSK_OFFLINE_THRESHOLD_SEC=180    # 3 minutes before marking offline

# --- Command Center ---
COMMAND_CENTER_SSE_HEARTBEAT_SEC=30 # SSE keepalive interval
COMMAND_CENTER_DEFAULT_REFRESH=5    # Default widget refresh (seconds)
COMMAND_CENTER_REPLAY_MAX_SPEED=60  # Maximum replay speed multiplier

# --- Alert System ---
ALERT_COOLDOWN_DEFAULT_MIN=30       # Default alert cooldown period
ALERT_CRITICAL_ESCALATION_MIN=5     # Escalation delay for CRITICAL
ALERT_LOW_EXPIRE_MIN=30             # Auto-expire LOW alerts
ALERT_MAX_ACTIVE=1000               # Max active alerts before pruning

# --- PDF Generation ---
PDF_REPORT_EXPIRY_HOURS=24          # Download link expiry
PDF_S3_BUCKET=reports               # S3 bucket for generated PDFs

# --- Redis ---
REDIS_METRICS_PREFIX=metrics        # Redis key prefix for metrics
REDIS_OCCUPANCY_PREFIX=occupancy    # Redis key prefix for occupancy
REDIS_SSE_PREFIX=sse                # Redis key prefix for SSE state
```

### 8.2 Runtime Configuration

Runtime configuration is stored per-event and can be modified by event administrators without restart.

```typescript
// Runtime configuration schema (stored in Event.config JSON)
interface EventOperationsConfig {
  // Scanner configuration
  scanner: {
    heartbeatIntervalSec: number; // Default: 30
    offlineThresholdSec: number; // Default: 180
    syncIntervalSec: number; // Default: 300
    requirePhotoVerification: boolean; // Default: false
    allowManualEntry: boolean; // Default: true
    allowOverride: boolean; // Default: true
  };

  // Occupancy configuration
  occupancy: {
    reconcileIntervalMin: number; // Default: 15
    thresholds: {
      yellow: number; // Default: 75 (%)
      orange: number; // Default: 90 (%)
      red: number; // Default: 100 (%)
    };
    autoDenyOnFull: boolean; // Default: true
  };

  // Analytics configuration
  analytics: {
    snapshotSchedule: {
      hourly: boolean; // Default: true
      daily: boolean; // Default: true
      weekly: boolean; // Default: true
    };
    dailyBriefingHourUtc: number; // Default: 7
    metricRefreshSec: number; // Default: 30
  };

  // Kiosk configuration
  kiosk: {
    inactivityTimeoutSec: number; // Default: 120
    maxSessionSec: number; // Default: 300
    enabledModes: Array<"SELF_SERVICE" | "QUEUE_DISPLAY" | "INFO_ONLY">;
    languages: string[]; // Default: ['en', 'fr', 'ar', 'pt']
    accessibilityDefault: boolean; // Default: false
    enableThermalPrinter: boolean; // Default: true
  };

  // Command center configuration
  commandCenter: {
    defaultRefreshSec: number; // Default: 5
    autoRotate: boolean; // Default: false
    rotateIntervalSec: number; // Default: 30
    audioAlertsEnabled: boolean; // Default: true
    dualAuthActions: QuickActionType[]; // Default: ['LOCKDOWN', 'EVACUATION_ALERT']
  };

  // Alert configuration
  alerts: {
    cooldownMinutes: Record<string, number>;
    escalationDelayMinutes: number; // Default: 5
    lowAlertExpireMinutes: number; // Default: 30
    maxActiveAlerts: number; // Default: 1000
  };
}
```

### 8.3 Alert Configuration

```typescript
// Per-event alert rule configuration
interface AlertRuleSet {
  rules: Array<{
    // What to monitor
    metricName: string; // e.g., "capacity_percentage", "approval_sla_hours"
    scope?: string; // e.g., zoneId, checkpointId (null = event-wide)

    // When to trigger
    threshold: number;
    comparator: "GT" | "LT" | "GTE" | "LTE" | "EQ";

    // What to do
    priority: AlertPriority;
    channels: Array<"SSE" | "EMAIL" | "SMS">;
    recipients: string[]; // userIds

    // Rate limiting
    cooldownMin: number;
  }>;

  // Escalation chain
  escalation: {
    level1: { delayMin: number; recipients: string[]; channels: string[] };
    level2: { delayMin: number; recipients: string[]; channels: string[] };
    level3: { delayMin: number; recipients: string[]; channels: string[] };
  };

  // Correlation rules
  correlation: {
    groupByCategoryWindow: number; // Minutes to group related alerts
    minAlertsForGroup: number; // Minimum alerts to create a group
    suppressChildAlerts: boolean; // Show only grouped summary
  };
}
```

---

## 9. Testing Strategy

### 9.1 Scanner Offline/Online Transition Tests

```typescript
// ==========================================
// SCANNER OFFLINE/ONLINE TESTS
// ==========================================

describe("Scanner Offline/Online Transitions", () => {
  it("should validate scans from local cache when offline", async () => {
    // Setup: register device and sync cache
    const device = await registerScannerDevice(tenantId, eventId, {
      deviceSerial: "TEST-001",
      name: "Test Scanner",
      firmwareVersion: "2.1.0",
      appVersion: "3.4.2",
      certificateHash: "valid-cert-hash",
    });

    const cache = await getScannerSyncData(device.id, 0);
    expect(cache.participants.length).toBeGreaterThan(0);
    expect(cache.blacklist).toBeDefined();

    // Simulate offline scan with local validation
    const offlineScan = {
      qrPayload: validQrPayload,
      scanType: "ENTRY" as ScanType,
      scanResult: "ALLOWED" as ScanResult,
      scannedBy: staffUserId,
      checkpointId: mainGateId,
      scannedAt: new Date().toISOString(),
      localValidation: true,
      signedHash: computeScanSignature(/* ... */),
    };

    // Upload when back online
    const result = await uploadOfflineScans(device.id, [offlineScan]);
    expect(result.uploaded).toBe(1);
    expect(result.rejected).toBe(0);
  });

  it("should detect offline devices after heartbeat timeout", async () => {
    const device = await registerScannerDevice(tenantId, eventId, {
      deviceSerial: "TEST-002",
      name: "Timeout Test",
      firmwareVersion: "2.1.0",
      appVersion: "3.4.2",
      certificateHash: "valid-cert-hash",
    });

    // Simulate time passing beyond offline threshold
    await prisma.scannerDevice.update({
      where: { id: device.id },
      data: { lastHeartbeat: new Date(Date.now() - 4 * 60 * 1000) },
    });

    await detectOfflineScanners();

    const updated = await prisma.scannerDevice.findUniqueOrThrow({
      where: { id: device.id },
    });
    expect(updated.isOnline).toBe(false);
  });

  it("should reconcile occupancy after offline scan upload", async () => {
    // Create offline scans that were validated locally
    const offlineScans = [
      createOfflineScan("ENTRY", "ALLOWED"),
      createOfflineScan("ENTRY", "ALLOWED"),
      createOfflineScan("EXIT", "ALLOWED"),
    ];

    await uploadOfflineScans(deviceId, offlineScans);

    // Verify occupancy was reconciled
    const occupancy = await prisma.venueOccupancy.findFirst({
      where: { eventId },
    });
    // Net change should be +1 (2 entries - 1 exit)
    expect(occupancy?.currentCount).toBe(initialCount + 1);
  });

  it("should reject offline scans with invalid signatures", async () => {
    const tampered = {
      ...validOfflineScan,
      signedHash: "tampered-hash-value",
    };

    const result = await uploadOfflineScans(deviceId, [tampered]);
    expect(result.rejected).toBe(1);
    expect(result.conflicts[0].reason).toContain("Integrity check failed");
  });

  it("should handle duplicate offline scan uploads gracefully", async () => {
    await uploadOfflineScans(deviceId, [validOfflineScan]);
    const result = await uploadOfflineScans(deviceId, [validOfflineScan]);

    expect(result.rejected).toBe(1);
    expect(result.conflicts[0].reason).toContain("Duplicate scan");
  });
});
```

### 9.2 Occupancy Calculation Accuracy Tests

```typescript
describe("Occupancy Calculation Accuracy", () => {
  it("should correctly track entry/exit counts per zone", async () => {
    // Create 10 entries and 3 exits
    for (let i = 0; i < 10; i++) {
      await scanBadge(checkpoint, participants[i], "ENTRY");
    }
    for (let i = 0; i < 3; i++) {
      await scanBadge(checkpoint, participants[i], "EXIT");
    }

    const occupancy = await getOccupancy(eventId, null, zoneId);
    expect(occupancy.currentCount).toBe(7);
  });

  it("should never allow negative occupancy", async () => {
    // More exits than entries (edge case)
    await scanBadge(checkpoint, participant, "EXIT");

    const occupancy = await getOccupancy(eventId, null, zoneId);
    expect(occupancy.currentCount).toBeGreaterThanOrEqual(0);
  });

  it("should reconcile drift between Redis and DB", async () => {
    // Manually create drift by setting Redis to wrong value
    await redis.set(`occupancy:${eventId}:${zoneId}`, "999");

    // Run reconciliation
    const result = await reconcileOccupancy(eventId);

    expect(result.corrections.length).toBeGreaterThan(0);
    const correction = result.corrections.find((c) => c.zoneId === zoneId);
    expect(correction?.previousCount).toBe(999);
    expect(correction?.correctedCount).toBe(expectedActualCount);
  });

  it("should trigger correct alert at each threshold", async () => {
    const maxCapacity = 100;
    await setZoneCapacity(zoneId, maxCapacity);

    // Fill to 75%
    for (let i = 0; i < 75; i++) {
      await scanBadge(checkpoint, participants[i], "ENTRY");
    }

    const yellowAlert = await getLatestAlert(eventId, "capacity");
    expect(yellowAlert?.priority).toBe("LOW");

    // Fill to 90%
    for (let i = 75; i < 90; i++) {
      await scanBadge(checkpoint, participants[i], "ENTRY");
    }

    const orangeAlert = await getLatestAlert(eventId, "capacity");
    expect(orangeAlert?.priority).toBe("HIGH");

    // Fill to 100%
    for (let i = 90; i < 100; i++) {
      await scanBadge(checkpoint, participants[i], "ENTRY");
    }

    const redAlert = await getLatestAlert(eventId, "capacity");
    expect(redAlert?.priority).toBe("CRITICAL");

    // Attempt entry at full capacity
    const result = await scanBadge(checkpoint, extraParticipant, "ENTRY");
    expect(result.scanResult).toBe("DENIED_CAPACITY_FULL");
  });
});
```

### 9.3 Alert Threshold and Correlation Tests

```typescript
describe("Alert Correlation Engine", () => {
  it("should deduplicate identical alerts within cooldown", async () => {
    await createAlert({
      tenantId,
      eventId,
      priority: "HIGH",
      source: "access_control",
      category: "capacity",
      title: "Zone A at 91%",
      message: "Approaching capacity",
    });

    // Create same alert again within cooldown
    const second = await createAlert({
      tenantId,
      eventId,
      priority: "HIGH",
      source: "access_control",
      category: "capacity",
      title: "Zone A at 91%",
      message: "Approaching capacity",
    });

    // Should return the original (deduplicated)
    const alerts = await prisma.commandCenterAlert.findMany({
      where: { eventId, title: "Zone A at 91%" },
    });
    expect(alerts.length).toBe(1);
  });

  it("should group 3+ related alerts into correlation group", async () => {
    for (let i = 0; i < 3; i++) {
      await createAlert({
        tenantId,
        eventId,
        priority: "HIGH",
        source: "access_control",
        category: "capacity",
        title: `Zone ${String.fromCharCode(65 + i)} at 90%`,
        message: "Approaching capacity",
      });
    }

    const alerts = await prisma.commandCenterAlert.findMany({
      where: { eventId, category: "capacity" },
    });

    // All should share the same correlation ID
    const correlationIds = [...new Set(alerts.map((a) => a.correlationId))];
    expect(correlationIds.length).toBe(1);
    expect(correlationIds[0]).toBeTruthy();
  });

  it("should escalate priority for recurring alerts", async () => {
    // Create 5 MEDIUM alerts in the same category within an hour
    for (let i = 0; i < 5; i++) {
      await createAlert({
        tenantId,
        eventId,
        priority: "MEDIUM",
        source: "access_control",
        category: "security",
        title: `Security event ${i + 1}`,
        message: "Multiple denied scans",
      });
    }

    // 6th alert should be escalated to HIGH
    const escalated = await createAlert({
      tenantId,
      eventId,
      priority: "MEDIUM",
      source: "access_control",
      category: "security",
      title: "Security event 6",
      message: "Pattern detected",
    });

    expect(escalated.priority).toBe("HIGH");
  });

  it("should auto-expire LOW alerts after 30 minutes", async () => {
    const alert = await createAlert({
      tenantId,
      eventId,
      priority: "LOW",
      source: "system",
      category: "info",
      title: "Session starting",
      message: "Committee meeting starting",
    });

    expect(alert.expiresAt).toBeDefined();
    const expiresIn = alert.expiresAt!.getTime() - Date.now();
    expect(expiresIn).toBeCloseTo(30 * 60 * 1000, -3); // ~30 minutes
  });

  it("should generate suggested actions for capacity alerts", async () => {
    const alert = await createAlert({
      tenantId,
      eventId,
      priority: "HIGH",
      source: "access_control",
      category: "capacity",
      title: "Plenary Hall at 95%",
      message: "Approaching capacity",
      metadata: { zoneId: plenaryHallId, percentage: 95 },
    });

    expect(alert.suggestedAction).toBeTruthy();
    expect(alert.suggestedAction).toContain("Redirect overflow");
  });
});
```

### 9.4 Kiosk Mode Security Tests

```typescript
describe("Kiosk Mode Security", () => {
  it("should auto-reset session after inactivity timeout", async () => {
    const session = await kioskManager.startSession(kioskId, "STATUS_LOOKUP");

    // Simulate inactivity
    jest.advanceTimersByTime(KIOSK_CONFIG.inactivityTimeout * 1000 + 1000);

    const updated = await prisma.kioskSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    expect(updated.endedAt).toBeDefined();
    expect(updated.timedOut).toBe(true);
  });

  it("should enforce maximum session duration", async () => {
    const session = await kioskManager.startSession(kioskId, "QUEUE_JOIN");

    // Keep interacting to prevent inactivity timeout
    for (let i = 0; i < 10; i++) {
      jest.advanceTimersByTime(25 * 1000);
      await kioskManager.recordInteraction(session.id, kioskId);
    }

    // But max session should still end it
    jest.advanceTimersByTime(KIOSK_CONFIG.maxSessionDuration * 1000);

    const updated = await prisma.kioskSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    expect(updated.endedAt).toBeDefined();
  });

  it("should prevent concurrent sessions on same kiosk", async () => {
    const session1 = await kioskManager.startSession(kioskId, "STATUS_LOOKUP");
    const session2 = await kioskManager.startSession(kioskId, "QUEUE_JOIN");

    // First session should be ended
    const updated1 = await prisma.kioskSession.findUniqueOrThrow({
      where: { id: session1.id },
    });
    expect(updated1.endedAt).toBeDefined();
    expect(updated1.timedOut).toBe(true);

    // Second session should be active
    const updated2 = await prisma.kioskSession.findUniqueOrThrow({
      where: { id: session2.id },
    });
    expect(updated2.endedAt).toBeNull();
  });

  it("should restrict kiosk to allowed URL paths only", () => {
    const config = KIOSK_CONFIG.security;
    expect(config.allowedUrls).toEqual(["/kiosk/*"]);
    expect(config.disableAddressBar).toBe(true);
    expect(config.disableDevTools).toBe(true);
    expect(config.disableContextMenu).toBe(true);
  });

  it("should block all escape keyboard shortcuts", () => {
    const blocked = KIOSK_CONFIG.security.disableKeyboardShortcuts;
    expect(blocked).toContain("Alt+Tab");
    expect(blocked).toContain("Alt+F4");
    expect(blocked).toContain("Ctrl+Alt+Delete");
    expect(blocked).toContain("F12");
    expect(blocked).toContain("Ctrl+Shift+I");
  });

  it("should detect kiosk offline after missed heartbeats", async () => {
    await prisma.kioskDevice.update({
      where: { id: kioskId },
      data: { lastHeartbeat: new Date(Date.now() - 4 * 60 * 1000) },
    });

    // Run health check
    await checkKioskHealth(eventId);

    const kiosk = await prisma.kioskDevice.findUniqueOrThrow({
      where: { id: kioskId },
    });
    expect(kiosk.isOnline).toBe(false);
  });
});
```

### 9.5 Analytics Aggregation Accuracy Tests

```typescript
describe("Analytics Aggregation Accuracy", () => {
  it("should compute correct registration funnel counts", async () => {
    const aggregator = new MetricAggregator(redis);

    // Simulate registration lifecycle events
    await aggregator.onRegistrationChanged({ eventId, newStatus: "SUBMITTED" });
    await aggregator.onRegistrationChanged({ eventId, newStatus: "SUBMITTED" });
    await aggregator.onRegistrationChanged({ eventId, newStatus: "APPROVED" });

    const summary = await aggregator.getMetricsSummary(eventId);
    expect(summary.registrationCount).toBe(2);
    expect(summary.approvedCount).toBe(1);
  });

  it("should track gate throughput in sliding windows", async () => {
    const aggregator = new MetricAggregator(redis);

    // Simulate 50 scans in current hour
    for (let i = 0; i < 50; i++) {
      await aggregator.onScanCompleted({
        eventId,
        checkpointId: mainGateId,
        scanResult: "ALLOWED",
        scanType: "ENTRY",
      });
    }

    const throughput = await redis.get(
      `metrics:${eventId}:throughput:${mainGateId}:${getCurrentHourKey()}`,
    );
    expect(parseInt(throughput!, 10)).toBe(50);
  });

  it("should create scheduled snapshots with correct data", async () => {
    await createScheduledSnapshot(eventId, "HOURLY");

    const snapshot = await prisma.analyticsSnapshot.findFirst({
      where: { eventId, snapshotType: "HOURLY" },
      orderBy: { generatedAt: "desc" },
    });

    expect(snapshot).toBeDefined();
    expect(snapshot!.metrics).toBeDefined();
    expect((snapshot!.metrics as any).totalScans).toBeDefined();
  });

  it("should generate PDF reports with correct data", async () => {
    const result = await generateAnalyticsPdf(tenantId, eventId, {
      type: "DAILY_BRIEFING",
      generatedBy: adminUserId,
    });

    expect(result.downloadUrl).toBeTruthy();
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should execute custom reports with filters", async () => {
    const report = await prisma.savedReport.create({
      data: {
        tenantId,
        eventId,
        name: "Test Report",
        filters: { participantTypes: ["Delegate"], countries: ["Kenya"] },
        columns: ["fullName", "status", "checkedInAt"],
        chartType: "TABLE",
        createdBy: adminUserId,
      },
    });

    const result = await executeCustomReport(report.id);
    expect(result.data).toBeDefined();
    expect(result.chartType).toBe("TABLE");
  });
});
```

### 9.6 Command Center SSE Reliability Tests

```typescript
describe("Command Center SSE Reliability", () => {
  it("should establish SSE connection and receive initial snapshots", async () => {
    const response = await request(app)
      .get(`/api/v1/tenants/${tenantId}/events/${eventId}/command-center/stream`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .expect(200)
      .expect("Content-Type", /text\/event-stream/);

    // Should receive initial state for each widget
    expect(response.text).toContain("event: venue_occupancy");
    expect(response.text).toContain("event: registration_pipeline");
  });

  it("should broadcast occupancy changes to connected clients", async () => {
    const events: SSEEvent[] = [];
    const sseClient = createSSEClient(operatorToken);
    sseClient.on("venue_occupancy", (data: unknown) => events.push(data as SSEEvent));

    // Trigger a scan
    await scanBadge(mainGateCheckpoint, participant, "ENTRY");

    // Wait for SSE propagation
    await waitFor(() => events.length > 0, 2000);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("count");
    expect(events[0]).toHaveProperty("capacity");
  });

  it("should broadcast alerts with audio signals for CRITICAL priority", async () => {
    const events: SSEEvent[] = [];
    const sseClient = createSSEClient(operatorToken);
    sseClient.on("alert", (data: unknown) => events.push(data as SSEEvent));

    await createAlert({
      tenantId,
      eventId,
      priority: "CRITICAL",
      source: "access_control",
      category: "security",
      title: "Security breach",
      message: "Unauthorized access detected",
    });

    await waitFor(() => events.length > 0, 2000);
    expect((events[0] as any).priority).toBe("CRITICAL");
  });

  it("should handle SSE client disconnection gracefully", async () => {
    const sseClient = createSSEClient(operatorToken);
    const connectionCount = getSSEConnectionCount();

    sseClient.close();

    // Wait for cleanup
    await new Promise((r) => setTimeout(r, 500));
    expect(getSSEConnectionCount()).toBe(connectionCount - 1);
  });

  it("should send heartbeats to keep connection alive", async () => {
    const heartbeats: string[] = [];
    const sseClient = createSSEClient(operatorToken);
    sseClient.on("heartbeat", () => heartbeats.push("ping"));

    // Wait for at least one heartbeat
    await new Promise((r) => setTimeout(r, 35000));
    expect(heartbeats.length).toBeGreaterThan(0);
  });

  it("should execute quick actions with dual authorization", async () => {
    // First operator initiates lockdown
    const action = await executeQuickAction(tenantId, eventId, "LOCKDOWN", operator1Id);

    expect(action.confirmedBy).toBeNull(); // Awaiting confirmation

    // Second operator confirms
    await prisma.quickAction.update({
      where: { id: action.id },
      data: { confirmedBy: operator2Id },
    });

    await performQuickAction(action);

    // All gates should be closed
    const gates = await prisma.checkpoint.findMany({
      where: { eventId, isActive: true },
    });
    expect(gates.length).toBe(0);
  });

  it("should support historical replay at various speeds", async () => {
    // Create some state changes
    for (let i = 0; i < 10; i++) {
      await prisma.eventStateChange.create({
        data: {
          tenantId,
          eventId,
          source: "test",
          entityType: "participant",
          entityId: `p-${i}`,
          changeType: "created",
          afterState: { status: "APPROVED" },
          timestamp: new Date(Date.now() - (10 - i) * 60000),
        },
      });
    }

    const replayedEvents: EventStateChange[] = [];
    const engine = new EventReplayEngine();

    const result = await engine.startReplay(
      eventId,
      new Date(Date.now() - 15 * 60000),
      new Date(),
      10, // 10x speed
      (event) => replayedEvents.push(event),
    );

    expect(result.totalEvents).toBe(10);
    await waitFor(() => replayedEvents.length === 10, 5000);
    expect(replayedEvents.length).toBe(10);
  });
});
```

---

## 10. Security Considerations

### 10.1 QR Payload Encryption

All QR badge payloads are encrypted using AES-256-CBC with event-specific key rotation. Each event derives its own encryption key from a master key, ensuring that a compromised key for one event does not affect others.

```typescript
// ==========================================
// QR PAYLOAD ENCRYPTION & KEY MANAGEMENT
// ==========================================

import crypto from "crypto";

// Key Rotation Strategy:
// - Master key stored in HSM / AWS KMS / Azure Key Vault
// - Event key derived via HKDF from master key + eventId
// - Key rotation: new key generated per event; mid-event rotation supported via dual-key window
// - Revoked keys stored in Redis blacklist with TTL matching event duration

interface EncryptionKeyInfo {
  keyId: string;
  eventId: string;
  algorithm: "aes-256-cbc";
  derivedKey: Buffer; // 32 bytes
  createdAt: Date;
  expiresAt: Date;
  rotationVersion: number; // Increments on rotation
  isActive: boolean;
}

/**
 * Derives an event-specific AES-256 key using HKDF (RFC 5869).
 * The master key never leaves the KMS boundary in production;
 * this function is used in the application layer with a locally
 * cached key material obtained via KMS Decrypt.
 */
export function deriveEventEncryptionKey(
  masterKeyMaterial: Buffer,
  eventId: string,
  rotationVersion: number = 0,
): EncryptionKeyInfo {
  const info = `accreditation:qr:${eventId}:v${rotationVersion}`;
  const salt = crypto.randomBytes(32);

  // HKDF-SHA256 key derivation
  const prk = crypto.createHmac("sha256", salt).update(masterKeyMaterial).digest();

  const derivedKey = crypto.createHmac("sha256", prk).update(`${info}\x01`).digest();

  return {
    keyId: crypto.createHash("sha256").update(derivedKey).digest("hex").substring(0, 16),
    eventId,
    algorithm: "aes-256-cbc",
    derivedKey,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    rotationVersion,
    isActive: true,
  };
}

/**
 * Encrypts a QR payload with the event-specific key.
 * Output format: base64( IV[16] || ciphertext || HMAC[32] )
 */
export function encryptQrPayload(
  payload: {
    participantId: string;
    eventId: string;
    accessLevel: string;
    registrationCode: string;
    issuedAt: number;
  },
  keyInfo: EncryptionKeyInfo,
): string {
  const iv = crypto.randomBytes(16);
  const plaintext = JSON.stringify({
    ...payload,
    checksum: crypto
      .createHmac("sha256", keyInfo.derivedKey)
      .update(`${payload.participantId}:${payload.eventId}:${payload.issuedAt}`)
      .digest("hex")
      .substring(0, 16),
  });

  const cipher = crypto.createCipheriv("aes-256-cbc", keyInfo.derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  // Append HMAC for authenticated encryption
  const hmac = crypto
    .createHmac("sha256", keyInfo.derivedKey)
    .update(Buffer.concat([iv, encrypted]))
    .digest();

  return Buffer.concat([iv, encrypted, hmac]).toString("base64");
}

/**
 * Decrypts and verifies a QR payload. Supports dual-key window
 * during key rotation by trying the current key first, then the
 * previous key if the current one fails.
 */
export async function decryptQrPayloadWithRotation(
  encryptedPayload: string,
  eventId: string,
  keyStore: EncryptionKeyStore,
): Promise<QrPayload> {
  const keys = await keyStore.getActiveKeys(eventId); // Returns [current, previous?]

  for (const keyInfo of keys) {
    try {
      const buffer = Buffer.from(encryptedPayload, "base64");
      const iv = buffer.subarray(0, 16);
      const hmac = buffer.subarray(buffer.length - 32);
      const ciphertext = buffer.subarray(16, buffer.length - 32);

      // Verify HMAC before decryption (authenticate-then-decrypt)
      const expectedHmac = crypto
        .createHmac("sha256", keyInfo.derivedKey)
        .update(Buffer.concat([iv, ciphertext]))
        .digest();

      if (!crypto.timingSafeEqual(hmac, expectedHmac)) {
        continue; // Try next key
      }

      const decipher = crypto.createDecipheriv("aes-256-cbc", keyInfo.derivedKey, iv);
      let decrypted = decipher.update(ciphertext, undefined, "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted) as QrPayload;
    } catch {
      continue; // Try next key
    }
  }

  throw new QrDecryptionError("Failed to decrypt QR payload with any active key");
}

interface EncryptionKeyStore {
  getActiveKeys(eventId: string): Promise<EncryptionKeyInfo[]>;
  rotateKey(eventId: string): Promise<EncryptionKeyInfo>;
  revokeKey(keyId: string): Promise<void>;
}
```

### 10.2 Scanner Device Authentication

Scanner devices authenticate using device certificates with mutual TLS (mTLS). Every scanner must present a valid client certificate issued by the platform CA before it can submit scan results or receive participant data.

```typescript
// ==========================================
// SCANNER DEVICE AUTHENTICATION
// ==========================================

import crypto from "crypto";
import tls from "tls";

interface DeviceCertificate {
  serialNumber: string; // Unique certificate serial
  deviceSerial: string; // Physical device serial number
  fingerprint: string; // SHA-256 fingerprint of the certificate
  issuer: string; // Platform CA identifier
  validFrom: Date;
  validTo: Date;
  isRevoked: boolean;
}

/**
 * Verifies a scanner device certificate during mTLS handshake.
 * Called by the TLS termination layer (nginx/envoy) or by the
 * application when validating the X-Client-Cert header.
 */
export async function verifyDeviceCertificate(
  certPem: string,
  expectedDeviceSerial?: string,
): Promise<{ valid: boolean; deviceId: string | null; reason?: string }> {
  try {
    // Parse the PEM certificate
    const cert = new crypto.X509Certificate(certPem);

    // 1. Verify certificate is issued by our CA
    const caCert = new crypto.X509Certificate(await loadCaCertificate());
    if (!cert.checkIssued(caCert)) {
      return { valid: false, deviceId: null, reason: "Certificate not issued by platform CA" };
    }

    // 2. Check expiration
    const now = new Date();
    if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) {
      return { valid: false, deviceId: null, reason: "Certificate expired or not yet valid" };
    }

    // 3. Check revocation list (CRL or OCSP)
    const fingerprint = cert.fingerprint256.replace(/:/g, "").toLowerCase();
    const isRevoked = await checkCertificateRevocation(fingerprint);
    if (isRevoked) {
      return { valid: false, deviceId: null, reason: "Certificate has been revoked" };
    }

    // 4. Extract device serial from certificate CN
    const cn = cert.subject.split("CN=")[1]?.split("\n")[0]?.trim();
    if (!cn) {
      return { valid: false, deviceId: null, reason: "No device identifier in certificate CN" };
    }

    // 5. Verify device serial matches if provided
    if (expectedDeviceSerial && cn !== expectedDeviceSerial) {
      return { valid: false, deviceId: null, reason: "Device serial mismatch" };
    }

    // 6. Look up device in registry
    const device = await prisma.scannerDevice.findUnique({
      where: { deviceSerial: cn },
    });

    if (!device) {
      return { valid: false, deviceId: null, reason: "Device not registered" };
    }

    // 7. Verify certificate fingerprint matches registered device
    if (device.certificateHash !== fingerprint) {
      return { valid: false, deviceId: null, reason: "Certificate fingerprint mismatch" };
    }

    return { valid: true, deviceId: device.id };
  } catch (error) {
    return {
      valid: false,
      deviceId: null,
      reason: `Certificate verification error: ${(error as Error).message}`,
    };
  }
}

/**
 * Express middleware that enforces device certificate authentication
 * on scanner API endpoints. Works with both direct mTLS and
 * certificate forwarding via reverse proxy (X-Client-Cert header).
 */
export function requireDeviceCert(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Get certificate from mTLS or proxy header
    const certPem = (req.socket as tls.TLSSocket).getPeerCertificate?.()
      ? pemFromTlsSocket(req.socket as tls.TLSSocket)
      : (req.headers["x-client-cert"] as string);

    if (!certPem) {
      return res.status(401).json({
        error: "DEVICE_CERT_REQUIRED",
        message: "Scanner device certificate is required",
      });
    }

    const result = await verifyDeviceCertificate(certPem);

    if (!result.valid) {
      await logSecurityEvent({
        type: "DEVICE_AUTH_FAILURE",
        reason: result.reason,
        ipAddress: req.ip,
        certFingerprint: extractFingerprint(certPem),
      });

      return res.status(403).json({
        error: "DEVICE_CERT_INVALID",
        message: result.reason,
      });
    }

    // Attach device ID to request for downstream handlers
    (req as any).deviceId = result.deviceId;
    next();
  };
}

async function checkCertificateRevocation(fingerprint: string): Promise<boolean> {
  // Check in-memory cache first, then Redis CRL
  const cached = revocationCache.get(fingerprint);
  if (cached !== undefined) return cached;

  const revoked = await redis.sismember("device:crl", fingerprint);
  revocationCache.set(fingerprint, revoked === 1, { ttl: 300 }); // 5 min cache
  return revoked === 1;
}
```

### 10.3 Kiosk Lockdown

Kiosk devices run in a locked-down browser mode that prevents users from escaping the kiosk application, accessing the underlying operating system, or tampering with the device.

```typescript
// ==========================================
// KIOSK LOCKDOWN CONFIGURATION
// ==========================================

/**
 * Kiosk lockdown policy enforced at both OS and browser level.
 * The browser runs in kiosk/fullscreen mode with all navigation
 * chrome removed. OS-level lockdown is handled by MDM (Mobile
 * Device Management) software (e.g., Hexnode, Jamf, Knox).
 */
interface KioskLockdownPolicy {
  browser: {
    fullscreen: true; // Always fullscreen, no title bar
    addressBarHidden: true; // No URL bar
    navigationDisabled: true; // No back/forward/refresh via UI
    contextMenuDisabled: true; // No right-click
    devToolsDisabled: true; // No F12 / Ctrl+Shift+I
    printDisabled: true; // No Ctrl+P
    downloadDisabled: true; // No file downloads
    fileUploadDisabled: true; // No file picker
    urlWhitelist: string[]; // Only allowed URLs load
    javascriptConsoleDisabled: true; // No console access
  };
  os: {
    disableAltTab: true; // No app switching
    disableCtrlAltDel: true; // No task manager
    disableWindowsKey: true; // No start menu
    disableMultiTouch: true; // Prevent gesture-based escapes
    disableUsbStorage: true; // No USB drives
    autoStartOnBoot: true; // Kiosk app starts on power on
    autoRestartOnCrash: true; // Watchdog process restarts app
    screenLockDisabled: true; // No screen lock timeout
  };
  tamperDetection: {
    detectDeviceMovement: boolean; // Accelerometer monitoring
    detectCableDisconnect: boolean; // Network cable tamper
    detectScreenCapture: boolean; // Screenshot attempt detection
    autoWipeOnTamper: boolean; // Clear cached data on tamper
    alertOnTamper: true; // Send CRITICAL alert
    maxFailedAdminLogins: 3; // Lock device after 3 failed admin attempts
  };
  session: {
    inactivityTimeoutSec: 120; // Reset after 2 min idle
    maxSessionDurationSec: 300; // Hard limit 5 min per session
    clearDataOnReset: true; // Wipe participant data between sessions
    showPrivacyNotice: true; // Display privacy notice on start
  };
}

/**
 * Browser-level lockdown implemented via the kiosk React application.
 * These event listeners prevent common escape vectors.
 */
export function initializeKioskLockdown(): void {
  // Prevent all keyboard shortcuts that could escape kiosk
  const blockedKeys: Record<string, boolean> = {
    F1: true,
    F2: true,
    F3: true,
    F4: true,
    F5: true,
    F6: true,
    F7: true,
    F8: true,
    F9: true,
    F10: true,
    F11: true,
    F12: true,
    Escape: true,
    Tab: true,
  };

  document.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      // Block function keys
      if (blockedKeys[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+* combinations
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        logTamperAttempt("keyboard_shortcut", `${e.ctrlKey ? "Ctrl" : "Cmd"}+${e.key}`);
        return false;
      }

      // Block Alt+* combinations
      if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        logTamperAttempt("keyboard_shortcut", `Alt+${e.key}`);
        return false;
      }
    },
    { capture: true },
  );

  // Disable context menu
  document.addEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();
    return false;
  });

  // Prevent text selection (reduces attack surface)
  document.addEventListener("selectstart", (e: Event) => {
    e.preventDefault();
    return false;
  });

  // Prevent drag and drop
  document.addEventListener("dragstart", (e: DragEvent) => {
    e.preventDefault();
    return false;
  });

  // Monitor for navigation attempts
  window.addEventListener("beforeunload", (e: BeforeUnloadEvent) => {
    e.preventDefault();
    logTamperAttempt("navigation", "Attempted to leave kiosk page");
  });

  // Fullscreen enforcement: re-enter if exited
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        logTamperAttempt("fullscreen_exit", "Failed to re-enter fullscreen");
      });
    }
  });

  // Start inactivity timer
  startInactivityMonitor();
}

/**
 * Auto-wipe cached data when tamper is detected.
 * Clears all participant lookup cache, session storage,
 * and local storage, then restarts the kiosk session.
 */
async function autoWipeOnTamper(tamperType: string): Promise<void> {
  // Clear all client-side storage
  localStorage.clear();
  sessionStorage.clear();

  // Clear IndexedDB (offline participant cache)
  const databases = await indexedDB.databases();
  for (const db of databases) {
    if (db.name) indexedDB.deleteDatabase(db.name);
  }

  // Report tamper event
  await fetch("/api/v1/kiosks/tamper-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kioskId: getKioskId(),
      tamperType,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    /* Ignore network errors during wipe */
  });

  // Force reload to clean state
  window.location.reload();
}

function logTamperAttempt(type: string, detail: string): void {
  console.warn(`[KIOSK TAMPER] ${type}: ${detail}`);
  navigator.sendBeacon(
    "/api/v1/kiosks/tamper-report",
    JSON.stringify({
      kioskId: getKioskId(),
      tamperType: type,
      detail,
      timestamp: new Date().toISOString(),
    }),
  );
}
```

### 10.4 Offline Scan Data Integrity

When scanners operate in offline mode, all scan records are signed with the device key and linked in a hash chain to ensure tamper detection. On reconnection, the server verifies the integrity of the entire offline scan batch before persisting.

```typescript
// ==========================================
// OFFLINE SCAN DATA INTEGRITY
// ==========================================

import crypto from "crypto";

/**
 * Each offline scan record is individually signed and chained
 * to the previous record via a hash chain. This ensures:
 * 1. No scan can be inserted or removed from the sequence
 * 2. No scan data can be modified after creation
 * 3. The device that created the scans can be verified
 */
interface SignedOfflineScan {
  sequenceNumber: number; // Monotonically increasing per device
  scanData: {
    participantId: string;
    checkpointId: string;
    scanType: "ENTRY" | "EXIT";
    scanResult: string;
    scannedAt: string; // ISO timestamp
    scannedBy: string; // userId of operator
  };
  previousHash: string; // SHA-256 of previous record (chain link)
  recordHash: string; // SHA-256 of scanData + previousHash + sequenceNumber
  deviceSignature: string; // RSA-SHA256 signature using device private key
  deviceSerial: string; // Identifies which device created this record
}

/**
 * Creates a signed offline scan record on the scanner device.
 * Called when the device is offline and cannot reach the API.
 */
export function createSignedOfflineScan(
  scanData: SignedOfflineScan["scanData"],
  previousHash: string,
  sequenceNumber: number,
  devicePrivateKey: crypto.KeyObject,
  deviceSerial: string,
): SignedOfflineScan {
  // Compute record hash (chain link)
  const hashInput = JSON.stringify({
    sequenceNumber,
    scanData,
    previousHash,
  });

  const recordHash = crypto.createHash("sha256").update(hashInput).digest("hex");

  // Sign with device private key
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(recordHash);
  const deviceSignature = signer.sign(devicePrivateKey, "base64");

  return {
    sequenceNumber,
    scanData,
    previousHash,
    recordHash,
    deviceSignature,
    deviceSerial,
  };
}

/**
 * Verifies the integrity of an entire offline scan batch.
 * Checks hash chain continuity, individual record integrity,
 * and device signature validity.
 */
export async function verifyOfflineScanBatch(
  scans: SignedOfflineScan[],
  devicePublicKey: crypto.KeyObject,
): Promise<{
  valid: boolean;
  validCount: number;
  invalidRecords: Array<{ index: number; reason: string }>;
}> {
  const invalidRecords: Array<{ index: number; reason: string }> = [];

  // Sort by sequence number
  const sorted = [...scans].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  for (let i = 0; i < sorted.length; i++) {
    const scan = sorted[i];

    // 1. Verify hash chain continuity
    if (i > 0 && scan.previousHash !== sorted[i - 1].recordHash) {
      invalidRecords.push({
        index: i,
        reason: `Hash chain break: expected previousHash=${sorted[i - 1].recordHash}, got=${scan.previousHash}`,
      });
      continue;
    }

    // 2. Verify record hash integrity
    const expectedHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          sequenceNumber: scan.sequenceNumber,
          scanData: scan.scanData,
          previousHash: scan.previousHash,
        }),
      )
      .digest("hex");

    if (scan.recordHash !== expectedHash) {
      invalidRecords.push({
        index: i,
        reason: "Record hash mismatch - data may have been tampered with",
      });
      continue;
    }

    // 3. Verify device signature
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(scan.recordHash);
    const signatureValid = verifier.verify(devicePublicKey, scan.deviceSignature, "base64");

    if (!signatureValid) {
      invalidRecords.push({
        index: i,
        reason: "Device signature verification failed",
      });
      continue;
    }

    // 4. Verify sequence number is monotonically increasing
    if (i > 0 && scan.sequenceNumber !== sorted[i - 1].sequenceNumber + 1) {
      invalidRecords.push({
        index: i,
        reason: `Sequence gap: expected ${sorted[i - 1].sequenceNumber + 1}, got ${scan.sequenceNumber}`,
      });
    }
  }

  return {
    valid: invalidRecords.length === 0,
    validCount: sorted.length - invalidRecords.length,
    invalidRecords,
  };
}

/**
 * Processes a verified offline scan batch: persists valid records,
 * reconciles occupancy counters, and flags conflicts.
 */
export async function processVerifiedOfflineBatch(
  scans: SignedOfflineScan[],
  deviceId: string,
): Promise<{
  accepted: number;
  rejected: number;
  conflicts: Array<{ sequenceNumber: number; reason: string }>;
  occupancyDelta: number;
}> {
  const conflicts: Array<{ sequenceNumber: number; reason: string }> = [];
  let accepted = 0;
  let occupancyDelta = 0;

  await prisma.$transaction(async (tx) => {
    for (const scan of scans) {
      // Check for duplicate (idempotency)
      const existing = await tx.accessLog.findFirst({
        where: {
          deviceId,
          scannedAt: new Date(scan.scanData.scannedAt),
          participantId: scan.scanData.participantId,
        },
      });

      if (existing) {
        conflicts.push({
          sequenceNumber: scan.sequenceNumber,
          reason: "Duplicate scan - already recorded",
        });
        continue;
      }

      // Create access log
      await tx.accessLog.create({
        data: {
          checkpointId: scan.scanData.checkpointId,
          participantId: scan.scanData.participantId,
          scanType: scan.scanData.scanType as ScanType,
          scanResult: scan.scanData.scanResult as ScanResult,
          qrPayload: `offline:${scan.deviceSerial}:${scan.sequenceNumber}`,
          scannedBy: scan.scanData.scannedBy,
          deviceId,
          scannedAt: new Date(scan.scanData.scannedAt),
        },
      });

      // Track occupancy delta
      if (scan.scanData.scanResult === "ALLOWED") {
        occupancyDelta += scan.scanData.scanType === "ENTRY" ? 1 : -1;
      }

      accepted++;
    }

    // Apply occupancy delta
    if (occupancyDelta !== 0) {
      const checkpoint = await tx.checkpoint.findFirstOrThrow({
        where: { id: scans[0].scanData.checkpointId },
      });

      await tx.venueOccupancy.updateMany({
        where: {
          eventId: checkpoint.eventId,
          zoneId: checkpoint.zoneId,
        },
        data: {
          currentCount: { increment: occupancyDelta },
          lastUpdated: new Date(),
        },
      });
    }
  });

  return {
    accepted,
    rejected: conflicts.length,
    conflicts,
    occupancyDelta,
  };
}
```

### 10.5 Access Log Tamper Detection

Access logs are stored as append-only records with rolling checksums. Each log entry includes a checksum that incorporates the previous entry's checksum, creating an immutable chain. Any modification or deletion is detectable through checksum verification.

```typescript
// ==========================================
// ACCESS LOG TAMPER DETECTION
// ==========================================

import crypto from "crypto";

/**
 * Access log integrity is enforced at multiple layers:
 * 1. Application layer: hash chain checksums on each log entry
 * 2. Database layer: append-only table with no UPDATE/DELETE grants
 * 3. Audit layer: periodic integrity verification job
 */

interface AccessLogWithIntegrity {
  id: string;
  checkpointId: string;
  participantId: string | null;
  scanType: string;
  scanResult: string;
  scannedAt: Date;
  scannedBy: string;
  deviceId: string | null;

  // Integrity fields
  previousChecksum: string; // Checksum of the previous log entry
  entryChecksum: string; // SHA-256( previousChecksum + serialized entry data )
  batchChecksum: string | null; // Periodic batch checksum (every 100 entries)
}

/**
 * Computes the checksum for a new access log entry.
 * This creates a hash chain: each entry's checksum depends
 * on the previous entry, making insertion/deletion/modification
 * of any entry detectable.
 */
export function computeAccessLogChecksum(
  entry: Omit<AccessLogWithIntegrity, "entryChecksum" | "batchChecksum">,
  previousChecksum: string,
): string {
  const serialized = JSON.stringify({
    checkpointId: entry.checkpointId,
    participantId: entry.participantId,
    scanType: entry.scanType,
    scanResult: entry.scanResult,
    scannedAt: entry.scannedAt.toISOString(),
    scannedBy: entry.scannedBy,
    deviceId: entry.deviceId,
    previousChecksum,
  });

  return crypto.createHash("sha256").update(serialized).digest("hex");
}

/**
 * Batch checksum computed every N entries (default: 100).
 * Provides a checkpoint for faster integrity verification --
 * instead of replaying the entire chain, verification can start
 * from the most recent batch checkpoint.
 */
export function computeBatchChecksum(
  entries: AccessLogWithIntegrity[],
  batchNumber: number,
): string {
  const concatenated = entries.map((e) => e.entryChecksum).join(":");

  return crypto.createHash("sha256").update(`batch:${batchNumber}:${concatenated}`).digest("hex");
}

/**
 * Verifies the integrity of access logs for an event.
 * Can verify the entire chain or start from a batch checkpoint.
 */
export async function verifyAccessLogIntegrity(
  eventId: string,
  options: {
    fromBatchCheckpoint?: number; // Start from a specific batch
    limit?: number; // Max entries to verify
  } = {},
): Promise<{
  valid: boolean;
  entriesVerified: number;
  firstInvalidEntry?: {
    id: string;
    position: number;
    expectedChecksum: string;
    actualChecksum: string;
  };
  batchesVerified: number;
  verificationDurationMs: number;
}> {
  const startTime = Date.now();

  const checkpoints = await prisma.checkpoint.findMany({
    where: { eventId },
    select: { id: true },
  });

  const checkpointIds = checkpoints.map((c) => c.id);

  const logs = (await prisma.accessLog.findMany({
    where: { checkpointId: { in: checkpointIds } },
    orderBy: { scannedAt: "asc" },
    take: options.limit ?? 100000,
  })) as unknown as AccessLogWithIntegrity[];

  let previousChecksum = "genesis"; // First entry chains from genesis
  let entriesVerified = 0;
  let batchesVerified = 0;

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];
    const expectedChecksum = computeAccessLogChecksum(entry, previousChecksum);

    if (entry.entryChecksum !== expectedChecksum) {
      return {
        valid: false,
        entriesVerified,
        firstInvalidEntry: {
          id: entry.id,
          position: i,
          expectedChecksum,
          actualChecksum: entry.entryChecksum,
        },
        batchesVerified,
        verificationDurationMs: Date.now() - startTime,
      };
    }

    previousChecksum = entry.entryChecksum;
    entriesVerified++;

    // Verify batch checkpoint every 100 entries
    if ((i + 1) % 100 === 0 && entry.batchChecksum) {
      const batchEntries = logs.slice(i - 99, i + 1);
      const batchNumber = Math.floor((i + 1) / 100);
      const expectedBatch = computeBatchChecksum(batchEntries, batchNumber);

      if (entry.batchChecksum !== expectedBatch) {
        return {
          valid: false,
          entriesVerified,
          firstInvalidEntry: {
            id: entry.id,
            position: i,
            expectedChecksum: expectedBatch,
            actualChecksum: entry.batchChecksum,
          },
          batchesVerified,
          verificationDurationMs: Date.now() - startTime,
        };
      }

      batchesVerified++;
    }
  }

  return {
    valid: true,
    entriesVerified,
    batchesVerified,
    verificationDurationMs: Date.now() - startTime,
  };
}

/**
 * Database-level enforcement: PostgreSQL policies that make the
 * AccessLog table append-only. These are applied via migration.
 *
 *   -- Revoke DELETE and UPDATE on access_logs
 *   REVOKE DELETE, UPDATE ON access_logs FROM app_user;
 *
 *   -- Create a trigger that prevents UPDATE and DELETE
 *   CREATE OR REPLACE FUNCTION prevent_access_log_mutation()
 *   RETURNS TRIGGER AS $$
 *   BEGIN
 *     RAISE EXCEPTION 'AccessLog records are immutable. Mutation attempted on id=%', OLD.id;
 *   END;
 *   $$ LANGUAGE plpgsql;
 *
 *   CREATE TRIGGER access_log_immutable
 *   BEFORE UPDATE OR DELETE ON access_logs
 *   FOR EACH ROW
 *   EXECUTE FUNCTION prevent_access_log_mutation();
 */
```

### 10.6 Capacity Data Integrity

Occupancy counters are critical for safety. The system uses multiple layers to ensure capacity data remains accurate even under high concurrency, network partitions, and scanner failures.

```typescript
// ==========================================
// CAPACITY DATA INTEGRITY
// ==========================================

/**
 * Capacity data integrity strategy:
 *
 * 1. ATOMIC OPERATIONS: Redis INCR/DECR for real-time counters
 *    - No race conditions from concurrent scans
 *    - Guaranteed atomic increment/decrement
 *
 * 2. PERIODIC RECONCILIATION: Scheduled job compares Redis
 *    counters against the actual AccessLog count in PostgreSQL
 *    - Corrects drift from failed transactions, offline syncs
 *    - Runs every 15 minutes by default
 *
 * 3. DUAL-WRITE VERIFICATION: Every occupancy change is written
 *    to both Redis (real-time) and PostgreSQL (durable) within
 *    a transaction. If they diverge, reconciliation corrects it.
 *
 * 4. FLOOR/CEILING BOUNDS: Occupancy can never go below 0 or
 *    above a hard maximum (2x capacity). Values outside bounds
 *    trigger immediate reconciliation.
 */

interface OccupancyReconciliationResult {
  eventId: string;
  reconciledAt: Date;
  corrections: Array<{
    zoneId: string | null;
    meetingId: string | null;
    redisCount: number;
    dbCount: number;
    correctedTo: number;
    drift: number;
    driftPercentage: number;
  }>;
  totalZonesChecked: number;
  totalCorrections: number;
  maxDriftDetected: number;
}

export async function reconcileOccupancy(eventId: string): Promise<OccupancyReconciliationResult> {
  const occupancyRecords = await prisma.venueOccupancy.findMany({
    where: { eventId },
  });

  const corrections: OccupancyReconciliationResult["corrections"] = [];

  for (const record of occupancyRecords) {
    // Count actual occupancy from access logs
    const entryCount = await prisma.accessLog.count({
      where: {
        checkpoint: { eventId, zoneId: record.zoneId },
        scanType: "ENTRY",
        scanResult: "ALLOWED",
      },
    });

    const exitCount = await prisma.accessLog.count({
      where: {
        checkpoint: { eventId, zoneId: record.zoneId },
        scanType: "EXIT",
        scanResult: "ALLOWED",
      },
    });

    const actualCount = Math.max(0, entryCount - exitCount);
    const redisKey = `occupancy:${eventId}:${record.zoneId ?? "venue"}`;
    const redisCount = parseInt((await redis.get(redisKey)) ?? "0", 10);

    // Check for drift
    if (redisCount !== actualCount || record.currentCount !== actualCount) {
      corrections.push({
        zoneId: record.zoneId,
        meetingId: record.meetingId,
        redisCount,
        dbCount: record.currentCount,
        correctedTo: actualCount,
        drift: Math.abs(redisCount - actualCount),
        driftPercentage:
          record.maxCapacity > 0
            ? (Math.abs(redisCount - actualCount) / record.maxCapacity) * 100
            : 0,
      });

      // Correct both Redis and DB
      await redis.set(redisKey, actualCount.toString());
      await prisma.venueOccupancy.update({
        where: { id: record.id },
        data: {
          currentCount: actualCount,
          lastUpdated: new Date(),
        },
      });

      // Alert if drift was significant (>5% of capacity)
      const driftPct =
        record.maxCapacity > 0
          ? (Math.abs(redisCount - actualCount) / record.maxCapacity) * 100
          : 0;

      if (driftPct > 5) {
        await createAlert({
          tenantId: record.eventId, // Will be resolved to actual tenantId
          eventId,
          priority: "MEDIUM",
          source: "access_control",
          category: "data_integrity",
          title: `Occupancy drift corrected for ${record.zoneId ?? "venue"}`,
          message: `Redis: ${redisCount}, DB: ${record.currentCount}, Actual: ${actualCount} (${driftPct.toFixed(1)}% drift)`,
          metadata: { zoneId: record.zoneId, drift: Math.abs(redisCount - actualCount) },
        });
      }
    }
  }

  return {
    eventId,
    reconciledAt: new Date(),
    corrections,
    totalZonesChecked: occupancyRecords.length,
    totalCorrections: corrections.length,
    maxDriftDetected: corrections.length > 0 ? Math.max(...corrections.map((c) => c.drift)) : 0,
  };
}
```

---

## 11. Performance Requirements

### 11.1 SLA Targets

| Metric                              | Target              | Measurement Method                                                               | Degradation Threshold          |
| ----------------------------------- | ------------------- | -------------------------------------------------------------------------------- | ------------------------------ |
| **Scan response time** (end-to-end) | < 500ms (p95)       | Server-side latency from QR payload receipt to response                          | > 750ms triggers investigation |
| **SSE occupancy update latency**    | < 1s                | Time from scan completion to all connected clients receiving the occupancy delta | > 2s triggers investigation    |
| **Analytics dashboard load**        | < 2s                | Time from initial page request to all widgets rendering with data                | > 3s triggers investigation    |
| **Occupancy update propagation**    | < 500ms             | Time from Redis counter update to all SSE clients receiving the change           | > 1s triggers investigation    |
| **Kiosk interface responsiveness**  | < 200ms             | Time from touch event to visible UI response (local rendering)                   | > 500ms triggers investigation |
| **Alert delivery (SSE)**            | < 500ms             | Time from alert creation to command center display                               | > 1s triggers investigation    |
| **Alert delivery (SMS)**            | < 30s               | Time from CRITICAL alert escalation trigger to SMS delivery                      | > 60s triggers investigation   |
| **PDF report generation**           | < 30s               | Time from report request to downloadable PDF URL                                 | > 60s triggers investigation   |
| **Offline scan sync**               | < 10s per 100 scans | Time to upload and reconcile a batch of offline scans                            | > 30s triggers investigation   |

### 11.2 Scalability Analysis

```typescript
// ==========================================
// SCALABILITY REQUIREMENTS & ANALYSIS
// ==========================================

/**
 * The Event Operations Center must support events ranging from
 * small workshops (50 participants) to major summits (10,000+
 * participants) with proportional scaling.
 */

interface ScalabilityTargets {
  // Concurrent connections
  maxConcurrentScanners: 100; // Per event
  maxConcurrentSSEClients: 500; // Per event (dashboards + command center)
  maxConcurrentKiosks: 50; // Per event

  // Throughput
  peakScanRate: 600; // Scans per minute (10/sec burst)
  sustainedScanRate: 300; // Scans per minute (5/sec sustained)
  sseMessagesPerSecond: 100; // Outbound SSE messages/sec across all clients

  // Data volumes
  maxAccessLogsPerEvent: 500_000; // ~50K participants x 10 scans average
  maxAnalyticsSnapshots: 5_000; // Hourly snapshots over multi-week events
  maxActiveAlerts: 1_000; // Concurrent active alerts

  // Query performance
  accessLogQueryLatency: "<500ms"; // For filtered queries on indexed columns
  analyticsAggregationLatency: "<2s"; // For dashboard-level aggregations
  occupancyQueryLatency: "<50ms"; // Redis-backed real-time queries

  // Offline capabilities
  offlineCacheParticipantLimit: 50_000; // Max participants in offline cache
  offlineCacheSizeMb: 50; // Participant lookup cache size limit
  offlineBlacklistSizeMb: 5; // Blacklist cache size limit
  offlineScanQueueLimit: 10_000; // Max scans queued while offline
}

/**
 * Connection pool and resource allocation per event size tier.
 */
interface EventSizeTier {
  tier: "SMALL" | "MEDIUM" | "LARGE" | "MEGA";
  participantRange: string;
  dbPoolSize: number;
  redisConnections: number;
  sseWorkerThreads: number;
  metricsFlushIntervalMs: number;
}

const EVENT_SIZE_TIERS: EventSizeTier[] = [
  {
    tier: "SMALL",
    participantRange: "1-500",
    dbPoolSize: 5,
    redisConnections: 2,
    sseWorkerThreads: 1,
    metricsFlushIntervalMs: 5000,
  },
  {
    tier: "MEDIUM",
    participantRange: "501-2000",
    dbPoolSize: 10,
    redisConnections: 5,
    sseWorkerThreads: 2,
    metricsFlushIntervalMs: 2000,
  },
  {
    tier: "LARGE",
    participantRange: "2001-10000",
    dbPoolSize: 25,
    redisConnections: 10,
    sseWorkerThreads: 4,
    metricsFlushIntervalMs: 1000,
  },
  {
    tier: "MEGA",
    participantRange: "10001+",
    dbPoolSize: 50,
    redisConnections: 20,
    sseWorkerThreads: 8,
    metricsFlushIntervalMs: 500,
  },
];
```

### 11.3 Caching Strategy

```typescript
// ==========================================
// CACHING STRATEGY
// ==========================================

/**
 * Multi-layer caching strategy to meet performance SLAs.
 * Each layer is designed for specific access patterns and
 * latency requirements.
 */

interface CacheLayerConfig {
  layer: string;
  technology: string;
  purpose: string;
  ttl: string;
  maxSize: string;
  invalidation: string;
}

const CACHE_LAYERS: CacheLayerConfig[] = [
  {
    layer: "L1 - In-Memory (per process)",
    technology: "Node.js Map / LRU Cache",
    purpose: "Hot participant lookups during scan validation",
    ttl: "60 seconds",
    maxSize: "10,000 entries (~20MB)",
    invalidation: "TTL expiry + event bus on participant status change",
  },
  {
    layer: "L2 - Redis (shared)",
    technology: "Redis 7+ with RedisJSON",
    purpose: "Occupancy counters, scanner heartbeats, SSE client registry, metric aggregates",
    ttl: "Varies: counters=persistent, heartbeats=5min, metrics=1hour",
    maxSize: "No practical limit (~100MB per event)",
    invalidation: "Explicit invalidation on data change + TTL for ephemeral data",
  },
  {
    layer: "L3 - CDN Edge (static assets)",
    technology: "CloudFront / Cloudflare",
    purpose: "Kiosk UI assets, venue maps, event branding",
    ttl: "24 hours (cache-busted on deploy)",
    maxSize: "Unlimited",
    invalidation: "Deploy-triggered cache purge",
  },
  {
    layer: "L4 - Client-Side (IndexedDB)",
    technology: "IndexedDB via Dexie.js",
    purpose: "Offline participant lookup table for scanners",
    ttl: "Synced every 5 minutes when online",
    maxSize: "50MB participant data + 5MB blacklist",
    invalidation: "Delta sync from server on reconnection",
  },
];

/**
 * Scan validation cache pipeline:
 * 1. Check L1 in-memory cache for participant (< 1ms)
 * 2. Miss -> Check Redis for participant + blacklist (< 5ms)
 * 3. Miss -> Query PostgreSQL (< 50ms)
 * 4. Populate L1 and L2 on DB hit
 *
 * Occupancy is always served from Redis (L2) for consistency.
 * Analytics snapshots are served from PostgreSQL with Redis
 * caching for the current period's running totals.
 */

export class ScanValidationCache {
  private l1Cache: Map<string, { data: ParticipantSummary; expiresAt: number }>;
  private readonly l1MaxEntries = 10_000;
  private readonly l1TtlMs = 60_000;

  constructor(
    private redis: RedisClient,
    private prisma: PrismaClient,
  ) {
    this.l1Cache = new Map();
  }

  async getParticipant(
    participantId: string,
    tenantId: string,
  ): Promise<ParticipantSummary | null> {
    // L1: In-memory
    const l1Entry = this.l1Cache.get(participantId);
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      return l1Entry.data;
    }

    // L2: Redis
    const l2Data = await this.redis.get(`participant:${tenantId}:${participantId}`);
    if (l2Data) {
      const parsed = JSON.parse(l2Data) as ParticipantSummary;
      this.setL1(participantId, parsed);
      return parsed;
    }

    // L3: PostgreSQL
    const dbResult = await this.prisma.participant.findFirst({
      where: { id: participantId, tenantId },
      select: {
        id: true,
        fullName: true,
        title: true,
        organization: true,
        country: true,
        photoUrl: true,
        accessLevel: true,
        status: true,
        badgePrinted: true,
        registrationCode: true,
      },
    });

    if (dbResult) {
      const summary = dbResult as ParticipantSummary;
      // Populate L1 and L2
      this.setL1(participantId, summary);
      await this.redis.set(
        `participant:${tenantId}:${participantId}`,
        JSON.stringify(summary),
        "EX",
        300, // 5 min TTL in Redis
      );
      return summary;
    }

    return null;
  }

  async isBlacklisted(participantId: string, tenantId: string): Promise<boolean> {
    // Blacklist always checked in Redis for freshness
    return (await this.redis.sismember(`blacklist:${tenantId}`, participantId)) === 1;
  }

  private setL1(key: string, data: ParticipantSummary): void {
    // Evict oldest entries if at capacity
    if (this.l1Cache.size >= this.l1MaxEntries) {
      const oldest = this.l1Cache.keys().next().value;
      if (oldest) this.l1Cache.delete(oldest);
    }

    this.l1Cache.set(key, {
      data,
      expiresAt: Date.now() + this.l1TtlMs,
    });
  }

  invalidateParticipant(participantId: string): void {
    this.l1Cache.delete(participantId);
    // Redis invalidation happens via event bus subscriber
  }
}
```

---

## 12. Open Questions & Decisions

The following items remain open and require decision from stakeholders before implementation can proceed. Each item includes context, trade-offs, and a preliminary recommendation where applicable.

### 12.1 Facial Recognition Integration for Photo Verification

**Status:** Under evaluation

**Context:** The current scan flow displays the participant's photo for manual visual verification by security staff. Integrating facial recognition could automate this step, reducing human error and speeding up gate throughput.

**Trade-offs:**

| Factor        | Pro                                                        | Con                                                                                           |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Accuracy      | Reduces false positives from visual inspection fatigue     | False rejection rate may be unacceptable for certain demographics                             |
| Speed         | Eliminates manual verification step (~2s savings per scan) | Model inference adds ~200-500ms to scan pipeline                                              |
| Privacy       | Standardized verification process                          | Biometric data collection subject to strict regulations (GDPR, AU data protection frameworks) |
| Cost          | Reduces staffing at gates                                  | Requires GPU infrastructure or cloud AI service subscription                                  |
| Accessibility | Consistent verification 24/7                               | May fail with masks, head coverings, glasses, aging photos                                    |

**Preliminary recommendation:** Implement as an optional enhancement layer that security staff can enable/disable per checkpoint. Use as a confidence score (green/yellow/red) alongside the photo display, rather than as an automated gate decision. Require explicit opt-in from event organizers and participant consent during registration.

**Decision needed:** Should facial recognition be included in the v1 scope or deferred to v2?

### 12.2 NFC Badge Support vs QR-Only

**Status:** Pending hardware assessment

**Context:** QR codes are the baseline badge technology. NFC (Near-Field Communication) chips embedded in badges offer faster tap-to-scan interactions and are harder to duplicate, but increase per-badge cost.

**Trade-offs:**

| Factor             | QR-Only                               | QR + NFC                                       |
| ------------------ | ------------------------------------- | ---------------------------------------------- |
| Badge cost         | ~$0.10/badge (printed)                | ~$0.80-$2.00/badge (NFC inlay)                 |
| Scan speed         | 1-2s (camera focus + decode)          | <0.5s (tap)                                    |
| Durability         | Can be obscured, creased, damaged     | Works through badge holders, resistant to wear |
| Security           | Encrypted payload, but photographable | Hardware-backed unique ID, difficult to clone  |
| Infrastructure     | Any device with camera                | Requires NFC reader hardware                   |
| Offline capability | Works offline (local decode)          | Requires local NFC UID mapping table           |

**Preliminary recommendation:** Support both as a progressive enhancement. QR remains the universal baseline. NFC is optional for events with budget for NFC badges and reader hardware. The scan engine should accept both input types via a unified `ScanInput` interface.

**Decision needed:** What is the per-badge budget threshold for recommending NFC? Should the platform provide NFC reader hardware or require event organizers to procure it?

### 12.3 Scanner Hardware Recommendations

**Status:** Testing in progress

**Context:** Security staff need reliable hardware for badge scanning. The platform must recommend supported device categories and provide guidance on procurement.

**Options under evaluation:**

| Option                                                         | Pros                                                       | Cons                                                   | Est. Cost  |
| -------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ | ---------- |
| **Consumer tablets** (iPad, Samsung Galaxy Tab)                | Large screen, camera quality, familiar UX, dual-use        | Battery life (6-8 hours), fragile, not ruggedized      | $300-$800  |
| **Ruggedized tablets** (Zebra ET4x, Samsung Galaxy Tab Active) | Drop-resistant, long battery (12+ hours), built-in scanner | Higher cost, heavier, smaller ecosystem                | $600-$1500 |
| **Dedicated barcode scanners** (Zebra TC5x, Honeywell CT60)    | Purpose-built, fastest scan speed, industrial durability   | Small screen, limited UI capability, training required | $800-$2000 |
| **Smartphone** (staff BYOD)                                    | Zero hardware cost, always available                       | Inconsistent cameras, battery drain, security concerns | $0 (BYOD)  |

**Preliminary recommendation:** Support all categories through a responsive web application (PWA) that adapts to screen size. Primary recommendation: ruggedized tablets for high-throughput gates, consumer tablets for secondary checkpoints, smartphone PWA for backup/roaming staff.

**Decision needed:** Should the platform certify specific device models, or provide general compatibility requirements?

### 12.4 Offline Scan Conflict Resolution Strategy

**Status:** Design review required

**Context:** When scanners operate offline and later sync, conflicts can arise -- for example, a participant checked in at Gate A (offline) and Gate B (online) during the same period. The system needs a deterministic conflict resolution strategy.

**Proposed conflict resolution rules:**

```
Priority order for conflicting scans:
  1. TIMESTAMP: Earlier scan wins (based on device clock)
  2. ONLINE OVER OFFLINE: If timestamps are within 30s, online scan takes priority
  3. DENIAL OVER ALLOWANCE: If one scan denied and one allowed, denial takes priority (security-first)
  4. MANUAL OVERRIDE: Manual overrides always take highest priority regardless of timestamp

Edge cases:
  - Device clock skew > 5 minutes: flag for manual review, do not auto-resolve
  - Same participant scanned at two gates within 10 seconds: flag as suspicious, keep both records
  - Offline scan for a participant whose status changed while scanner was offline:
    mark as REQUIRES_REVIEW, do not count toward occupancy until resolved
```

**Decision needed:** Should denial-over-allowance be the default, or should event organizers be able to configure the priority order? What is the acceptable clock skew tolerance?

### 12.5 Analytics Data Retention Period

**Status:** Awaiting compliance review

**Context:** Access logs, analytics snapshots, and scan data contain personally identifiable information and must be retained according to organizational policy and applicable regulations.

**Proposed retention tiers:**

| Data Type           | Active Retention          | Archive Retention                | Deletion                |
| ------------------- | ------------------------- | -------------------------------- | ----------------------- |
| Access logs (raw)   | Event duration + 90 days  | 1 year (cold storage)            | After archive retention |
| Analytics snapshots | Event duration + 1 year   | 3 years (aggregated, anonymized) | After archive retention |
| Scanner device logs | Event duration + 30 days  | None                             | After active retention  |
| Kiosk session data  | Event duration + 30 days  | None (anonymized aggregate kept) | After active retention  |
| Alert history       | Event duration + 6 months | 1 year                           | After archive retention |
| PDF reports         | Event duration + 1 year   | Indefinite (if flagged)          | Manual deletion         |

**Decision needed:** Do retention periods align with AU data governance policies? Is there a requirement for right-to-erasure (GDPR-style) that would require on-demand participant data purging?

### 12.6 Command Center Multi-Screen Layout Customization

**Status:** UX design in progress

**Context:** The command center supports a configurable 12x8 grid layout with draggable widgets. For large operations rooms with multiple wall-mounted displays, each display may need its own layout or a synchronized multi-screen layout spanning several displays.

**Open questions:**

- Should multi-screen mode use a single browser window stretched across displays, or separate synchronized browser instances per display?
- How should layout presets be shared across events (template library)?
- Should operators be able to modify layouts during a live event, or only during setup?
- What is the minimum screen resolution supported for command center displays?

**Preliminary recommendation:** Support both single-stretched and synchronized multi-instance modes. Use a layout template system that can be saved per-tenant and cloned across events. Allow live layout modifications by authorized operators with an undo capability (5-action undo buffer).

### 12.7 Predictive Model Training Data Requirements

**Status:** Data science review pending

**Context:** The predictive analytics engine (Section 5.13) requires historical event data to train arrival forecasting and staffing models. The system needs guidance on minimum training data and model retraining frequency.

**Open questions:**

- Minimum number of historical events required for useful predictions (estimated: 3-5 similar events)
- Should the model be event-type-specific (summit vs. conference vs. workshop)?
- What external data sources improve prediction accuracy (flight schedules, hotel check-ins, weather)?
- How should the model handle the first event for a new tenant (cold start)?
- What is the acceptable prediction error margin for staffing recommendations?
- Retraining frequency: per-event, monthly, or on-demand?

**Preliminary recommendation:** Start with a rule-based heuristic engine for cold-start scenarios (e.g., 70% of registered participants arrive in the first 2 hours). Transition to ML-based predictions after 3+ events of historical data. Use transfer learning from similar event types across tenants (with data anonymization).

### 12.8 Integration with External Security Systems

**Status:** Requirements gathering

**Context:** Large-scale events often have existing physical security infrastructure (CCTV, access control turnstiles, metal detectors) that should integrate with the Event Operations Center for unified situational awareness.

**Potential integration points:**

| System                           | Integration Type                          | Data Flow                          | Priority |
| -------------------------------- | ----------------------------------------- | ---------------------------------- | -------- |
| CCTV / IP cameras                | Video feed embed in command center        | Inbound (camera -> command center) | Medium   |
| Access control turnstiles        | Scan result triggers turnstile open/close | Outbound (platform -> turnstile)   | High     |
| Metal detector gates             | Alert feed on alarm trigger               | Inbound (detector -> alert system) | Medium   |
| Fire alarm system                | Auto-trigger evacuation quick action      | Inbound (fire panel -> platform)   | High     |
| PA / announcement system         | Emergency broadcast audio                 | Outbound (platform -> PA)          | High     |
| Visitor management (third-party) | Participant data sync                     | Bidirectional                      | Low      |

**Open questions:**

- Which integration protocols should be supported (ONVIF for cameras, Wiegand/OSDP for access control, BACnet for building systems)?
- Should the platform act as a primary access control system or as an overlay that coordinates with existing systems?
- What is the certification/compliance requirement for integration with fire safety systems?
- How should the system handle conflicting signals (e.g., platform says DENY but turnstile is mechanically open)?

**Decision needed:** Define the integration boundary -- which systems does the platform control directly vs. receive data from vs. ignore?

---

## Appendix

### A. Glossary

| Term                         | Definition                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Access Level**             | The security tier assigned to a participant (e.g., OPEN, CLOSED, VIP). Determines which meetings and zones the participant can enter.                                       |
| **Access Log**               | An immutable record of every badge scan attempt, whether allowed or denied. Includes timestamp, checkpoint, participant, result, and device information.                    |
| **Badge Collection**         | The process where a participant physically picks up their printed accreditation badge, typically at a staffed counter with queue management.                                |
| **Blacklist**                | A list of participants or passport numbers that are denied entry regardless of their accreditation status. Checked on every scan.                                           |
| **Capacity**                 | The maximum number of occupants allowed in a venue, zone, or meeting room. Enforced at scan time; entry denied when capacity is reached.                                    |
| **Checkpoint**               | A physical location where badge scanning occurs. Can be a gate, door, or scanner station. Each checkpoint belongs to a zone and has a direction (entry/exit/bidirectional). |
| **Command Center**           | A real-time operational dashboard designed for wall-mounted displays in operations rooms. Consolidates all data streams into configurable widget layouts.                   |
| **Cooldown**                 | The minimum time interval between duplicate alerts of the same type. Prevents alert fatigue from rapidly recurring conditions.                                              |
| **Dual Authorization**       | A security mechanism requiring two different operators to confirm critical quick actions (e.g., lockdown, evacuation). Prevents accidental activation.                      |
| **Event Bus**                | An in-memory publish/subscribe system that routes operational events (scans, alerts, state changes) to all interested consumers within the application.                     |
| **Event Replay**             | A post-event analysis feature that replays all state changes at configurable speed, allowing operators to review how events unfolded.                                       |
| **Gate Throughput**          | The rate of successful scans per unit time at a checkpoint. Used to identify bottlenecks and optimize staffing.                                                             |
| **Hash Chain**               | A sequence of records where each record includes a cryptographic hash of the previous record. Used for tamper detection in access logs and offline scans.                   |
| **Heartbeat**                | A periodic signal sent by scanner devices and kiosks to indicate they are online and operational. Absence of heartbeats triggers offline detection.                         |
| **Kiosk**                    | A self-service touch-screen station where participants can look up their status, join badge collection queues, and access event information.                                |
| **mTLS (Mutual TLS)**        | A security protocol where both the client (scanner device) and server present certificates to each other, providing bidirectional authentication.                           |
| **Occupancy**                | The current number of people inside a venue, zone, or meeting room. Tracked in real-time via entry/exit scan pairs.                                                         |
| **Offline Mode**             | A scanner operating state where the device cannot reach the API. Scans are validated against a local cache and queued for later sync.                                       |
| **QR Payload**               | The encrypted data embedded in a badge QR code. Contains participant ID, event ID, access level, and integrity checksum.                                                    |
| **Quick Action**             | A one-click emergency operation available in the command center (e.g., lockdown, evacuation alert, gate close all). Critical actions require dual authorization.            |
| **Reconciliation**           | The process of comparing real-time counters (Redis) with durable records (PostgreSQL) and correcting any drift. Runs periodically for occupancy data.                       |
| **Scan Result**              | The outcome of a badge scan attempt. See Appendix C for the complete catalog of possible results.                                                                           |
| **SSE (Server-Sent Events)** | A unidirectional streaming protocol where the server pushes real-time updates to connected browser clients. Used for dashboard and command center live data.                |
| **Zone**                     | A logical or physical subdivision of an event venue. Each zone has independent occupancy tracking and capacity limits.                                                      |

### B. References

| Reference                                                                         | Module                         | Description                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                 | Core data models               | Tenant, Event, Participant, Meeting base models extended by this module                  |
| [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md)                             | Workflow processing            | Approval workflow metrics feed into analytics; SLA breach detection triggers alerts      |
| [Module 05: Security & Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       | Authentication & authorization | User authentication, role-based access control for scanner operators and event managers  |
| [Module 06: Infrastructure & DevOps](./06-INFRASTRUCTURE-AND-DEVOPS.md)           | Infrastructure                 | Redis, SSE infrastructure, S3 storage, monitoring, deployment pipeline                   |
| [Module 07: API & Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)           | API framework                  | REST API conventions, authentication middleware, rate limiting, SSE transport            |
| [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | Registration                   | Participant registration, badge design and printing, QR code generation                  |
| [Module 11: Logistics & Venue](./11-LOGISTICS-AND-VENUE.md)                       | Venue management               | Floor plans, room assignments, zone definitions consumed by checkpoint configuration     |
| [Module 12: Protocol & Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md)                 | Protocol rules                 | VIP handling rules, precedence orders, protocol-specific access restrictions             |
| Module 13: Workforce Management                                                   | Staff scheduling               | Staff availability feeds into predictive staffing recommendations                        |
| Module 14: Incident Management                                                    | Incident tracking              | Incident creation from scanner "Report Incident" button; incident feed in command center |
| Module 15: Transport & Fleet                                                      | Transport logistics            | Vehicle status and delay alerts stream into command center transport widget              |

### C. ScanResult Code Catalog

Every scan attempt produces exactly one `ScanResult` enum value. This catalog documents each value, its trigger conditions, the UI display treatment, and the recommended operator action.

| Code                   | Description                                                                          | Trigger Conditions                                                                                                                                    | UI Color             | UI Icon                | Audio                      | Recommended Action                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALLOWED`              | Entry or exit permitted                                                              | All validation checks passed: participant exists, status is APPROVED, badge is printed, not blacklisted, access level sufficient, capacity available  | **Green** (#22C55E)  | Checkmark circle       | Success chime              | Display participant name and photo. Allow passage.                                                                                                 |
| `DENIED_INVALID_BADGE` | QR code does not resolve to a valid participant                                      | QR payload decryption failed, participant ID not found in database, QR payload is for a different event, or QR data is corrupted/unreadable           | **Red** (#EF4444)    | X circle               | Error buzzer               | Do not allow passage. Ask participant to present a valid badge. Escalate to supervisor if participant claims valid accreditation.                  |
| `DENIED_REVOKED`       | Participant accreditation is not active                                              | Participant status is not APPROVED (e.g., PENDING, REJECTED, WITHDRAWN, CANCELLED) or badge has not been printed yet                                  | **Red** (#EF4444)    | Shield with X          | Error buzzer               | Do not allow passage. Direct participant to the accreditation help desk. Check if status was recently changed.                                     |
| `DENIED_ACCESS_LEVEL`  | Participant lacks required access level for this meeting or zone                     | Meeting or zone requires CLOSED access, participant has OPEN access. Or specific access restrictions are in place that the participant does not meet. | **Orange** (#F97316) | Lock closed            | Warning tone               | Do not allow passage. Inform participant this area requires a different access level. Direct to information desk for access upgrade if applicable. |
| `DENIED_CAPACITY_FULL` | Venue, zone, or meeting room is at maximum capacity                                  | `VenueOccupancy.currentCount >= maxCapacity` for the relevant zone or meeting                                                                         | **Orange** (#F97316) | Users with exclamation | Warning tone               | Do not allow passage. Inform participant that the area is at capacity. Advise waiting or suggest alternative sessions. Notify zone lead.           |
| `DENIED_BLACKLISTED`   | Participant or associated identity is on the security blacklist                      | Participant ID matches an active blacklist entry, or passport number matches a blacklisted passport                                                   | **Red** (#EF4444)    | Ban icon               | Alert siren                | Do not allow passage. **Do not disclose blacklist status to participant.** Immediately contact security supervisor. Follow security protocol.      |
| `DENIED_QUOTA`         | Participant has exceeded their allowed number of entries for this meeting or session | Per-participant entry quota configured for the meeting has been reached (e.g., single-entry sessions)                                                 | **Orange** (#F97316) | Repeat with X          | Warning tone               | Do not allow passage. Inform participant they have already attended this session. Direct to information desk if they believe this is an error.     |
| `MANUAL_OVERRIDE`      | Entry allowed via security staff manual override, bypassing normal validation        | Security staff explicitly approved entry despite a validation failure. Requires override reason to be recorded. Logged for audit trail.               | **Yellow** (#EAB308) | Shield with check      | Override confirmation tone | Entry is permitted. Override reason is recorded in the access log. Supervisor will review all manual overrides in the daily audit report.          |
