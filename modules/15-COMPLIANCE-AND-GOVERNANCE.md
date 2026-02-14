# Module 15: Compliance and Governance

> **Module:** 15 - Compliance and Governance
> **Version:** 1.0
> **Last Updated:** February 13, 2026
> **Status:** Draft
> **Owner:** Compliance Engineering Team
> **Classification:** INTERNAL — CONFIDENTIAL

---

## Dependencies

| Type                | Module                                                                              | Relationship                             |
| ------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| **Requires**        | [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                   | Base entity schemas, tenant model        |
| **Requires**        | [Module 05: Security and Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       | RBAC permissions, audit framework        |
| **Required By**     | [Module 09: Registration and Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | Document compliance gates                |
| **Required By**     | [Module 10: Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md)               | Risk alerts, command center widgets      |
| **Required By**     | [Module 14: Content and Documents](./14-CONTENT-AND-DOCUMENTS.md)                   | Expiry notifications, compliance reports |
| **Integrates With** | [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md)                               | Compliance gates in workflows            |
| **Integrates With** | [Module 06: Infrastructure and DevOps](./06-INFRASTRUCTURE-AND-DEVOPS.md)           | Background jobs, scheduled scans         |
| **Integrates With** | [Module 07: API and Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)           | REST API, SSE alerts                     |
| **Integrates With** | [Module 11: Logistics and Venue](./11-LOGISTICS-AND-VENUE.md)                       | Carbon tracking from transport/catering  |
| **Integrates With** | [Module 12: Protocol and Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md)                 | VIP compliance, diplomatic immunity      |
| **Integrates With** | [Module 13: People and Workforce](./13-PEOPLE-AND-WORKFORCE.md)                     | Staff compliance, certification tracking |
| **Integrates With** | [Module 16: Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)                 | Consent UX, sustainability badges        |
| **Integrates With** | [Module 17: Settings and Configuration](./17-SETTINGS-AND-CONFIGURATION.md)         | Compliance settings registry             |

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
12. [Open Questions and Decisions](#12-open-questions-and-decisions)

---

## 1. Overview

### 1.1 Purpose

Module 15 provides comprehensive compliance, risk management, and sustainability tracking for the Accreditation Platform. Accreditation for diplomatic events requires strict adherence to document validity rules (passports must not expire before travel), visa tracking across dozens of embassies, consent management under GDPR and African Union data protection frameworks, and data retention enforcement after events conclude. Beyond document compliance, event organizers must assess and mitigate risks (security threats, weather disruptions, technical failures) and increasingly report on environmental sustainability (carbon footprint, paperless initiatives).

This module serves as the governance backbone — ensuring every participant meets entry requirements, every risk is identified and monitored, and every event's environmental impact is measured and mitigated.

### 1.2 Scope

Module 15 encompasses three functional domains:

```
┌─────────────────────────────────────────────────────────────────┐
│                Module 15: Compliance & Governance                │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Document        │  │   Risk            │  │ Sustainability│  │
│  │   Compliance      │  │   Management      │  │   Tracker     │  │
│  │                   │  │                   │  │               │  │
│  │ • Passport expiry │  │ • Risk register   │  │ • Carbon calc │  │
│  │ • Visa tracking   │  │ • Risk matrix     │  │ • Air travel  │  │
│  │ • Doc completeness│  │ • Contingency     │  │ • Catering    │  │
│  │ • Consent mgmt    │  │ • Monitoring      │  │ • Offsets     │  │
│  │ • GDPR / erasure  │  │ • Checklists      │  │ • Paperless   │  │
│  │ • Data retention  │  │ • Lessons learned │  │ • Goals       │  │
│  │ • Compliance scan │  │ • Alert triggers  │  │ • Reporting   │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Personas

| Persona                        | Responsibilities                                                                                                                                | Primary Features                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Compliance Officer**         | Monitors document compliance across all participants. Runs batch compliance checks. Resolves alerts. Manages visa tracking and support letters. | Compliance dashboard, batch scanner, alert management, visa tracking board, document completion reports |
| **Data Protection Officer**    | Manages consent records, data retention policies, GDPR requests. Ensures platform meets regulatory requirements.                                | Consent management, data retention config, GDPR request workflow, audit trail, regulatory framework     |
| **Risk Manager**               | Identifies and assesses event risks. Creates mitigation plans. Monitors real-time risk triggers. Reviews post-event lessons.                    | Risk register, risk matrix, contingency planning, real-time monitoring, lessons learned                 |
| **Sustainability Coordinator** | Tracks environmental impact. Sets sustainability goals. Manages carbon offset procurement. Reports on progress.                                 | Carbon dashboard, emission calculators, paperless metrics, offset management, YoY comparison            |
| **Event Administrator**        | Day-to-day operations. Uses compliance tools for operational decisions. Manages checklists and readiness.                                       | Compliance overview, alert resolution, checklist completion, visa status, sustainability review         |
| **Legal Counsel**              | Advises on regulatory requirements. Reviews data retention policies. Ensures legal compliance.                                                  | Regulatory framework config, compliance reports, GDPR review, policy approval                           |

### 1.4 Compliance Standards

| Standard / Regulation        | Applicability                       | Module Coverage                                                        |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| **GDPR (EU)**                | Events involving EU participants    | Consent management, right to erasure, data portability, data retention |
| **AU Data Policy Framework** | All AU-organized events             | Multi-tenant data isolation, cross-border data rules                   |
| **ISO 31000:2018**           | Risk management standard            | Risk register structure, assessment methodology, monitoring            |
| **ISO 14064**                | Greenhouse gas accounting           | Carbon footprint calculation, emission factors, offset tracking        |
| **ICAO Carbon Calculator**   | Aviation emission factors           | Air travel emission calculations                                       |
| **GHG Protocol**             | Event carbon accounting             | Scope 1 & 2 emissions, offset categories                               |
| **Malabo Convention**        | AU Cyber Security & Data Protection | Data protection, consent, cross-border data flows                      |

### 1.5 Design Principles

1. **Compliance by Design** — Compliance checks are woven into every participant lifecycle event, not bolted on as an afterthought. A participant cannot progress through accreditation without passing mandatory compliance gates.

2. **Tenant Isolation** — Every compliance record, risk entry, and sustainability metric is scoped to a tenant. Cross-tenant data access is impossible by design.

3. **Audit Everything** — Every consent change, alert resolution, risk status transition, and data retention execution is logged with timestamp, actor, IP address, and before/after state.

4. **Escalation by Default** — Unresolved compliance alerts escalate automatically. Passport expiring in 90 days = INFO; 30 days = WARNING; 7 days = CRITICAL with Event Director notification.

5. **Calculate, Don't Guess** — Sustainability metrics use published emission factors (ICAO for air travel, DEFRA for ground transport). No estimates without methodology.

6. **Actionable Risk Scores** — Risk scores above configurable threshold (default: 15) automatically trigger contingency plans and notify mitigation owners.

7. **Data Minimization** — Collect only what is needed. Retain only as long as required. The data retention engine enforces this automatically.

---

## 2. Architecture

### 2.1 Component Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Module 15: Compliance & Governance                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                       Compliance API Layer                          │ │
│  │  /api/v1/compliance/*  │  /api/v1/risks/*  │  /api/v1/sustainability│ │
│  └────────────┬───────────┴────────┬──────────┴──────────┬────────────┘ │
│               │                    │                     │               │
│  ┌────────────▼──────────┐ ┌──────▼───────────┐ ┌──────▼────────────┐  │
│  │  Document Compliance  │ │ Risk Management  │ │  Sustainability   │  │
│  │       Engine          │ │     System       │ │    Tracker        │  │
│  │                       │ │                  │ │                   │  │
│  │ ┌──────────────────┐  │ │ ┌──────────────┐ │ │ ┌───────────────┐ │  │
│  │ │ Compliance       │  │ │ │ Risk         │ │ │ │ Carbon        │ │  │
│  │ │ Scanner          │  │ │ │ Assessor     │ │ │ │ Calculator    │ │  │
│  │ └──────────────────┘  │ │ └──────────────┘ │ │ └───────────────┘ │  │
│  │ ┌──────────────────┐  │ │ ┌──────────────┐ │ │ ┌───────────────┐ │  │
│  │ │ Visa Tracker     │  │ │ │ Monitoring   │ │ │ │ Offset        │ │  │
│  │ │                  │  │ │ │ Engine       │ │ │ │ Manager       │ │  │
│  │ └──────────────────┘  │ │ └──────────────┘ │ │ └───────────────┘ │  │
│  │ ┌──────────────────┐  │ │ ┌──────────────┐ │ │ ┌───────────────┐ │  │
│  │ │ Consent Manager  │  │ │ │ Checklist    │ │ │ │ Paperless     │ │  │
│  │ │                  │  │ │ │ Engine       │ │ │ │ Tracker       │ │  │
│  │ └──────────────────┘  │ │ └──────────────┘ │ │ └───────────────┘ │  │
│  │ ┌──────────────────┐  │ │ ┌──────────────┐ │ │ ┌───────────────┐ │  │
│  │ │ Retention Engine │  │ │ │ Contingency  │ │ │ │ Goal Tracker  │ │  │
│  │ │                  │  │ │ │ Planner      │ │ │ │               │ │  │
│  │ └──────────────────┘  │ │ └──────────────┘ │ │ └───────────────┘ │  │
│  │ ┌──────────────────┐  │ │                  │ │                   │  │
│  │ │ GDPR Processor   │  │ │                  │ │                   │  │
│  │ └──────────────────┘  │ │                  │ │                   │  │
│  └───────────────────────┘ └──────────────────┘ └───────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Background Job Scheduler                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐  │ │
│  │  │ Compliance  │ │ Retention   │ │ Risk Monitor │ │ Carbon     │  │ │
│  │  │ Scan (daily)│ │ Exec (daily)│ │ (15-min)     │ │ Calc (daily│  │ │
│  │  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                       Domain Event Bus                              │ │
│  │  COMPLIANCE_ALERT_CREATED │ RISK_TRIGGERED │ RETENTION_EXECUTED     │ │
│  │  CONSENT_CHANGED │ GDPR_REQUEST_COMPLETED │ CARBON_UPDATED         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — Compliance Scan

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐
│ Scheduler│────►│ Compliance   │────►│ Participant   │
│ (cron)   │     │ Scanner      │     │ Query Service │
└──────────┘     └──────┬───────┘     └───────┬───────┘
                        │                     │
                        │  For each participant│
                        │◄────────────────────┘
                        │
              ┌─────────▼─────────┐
              │  Check Pipeline   │
              │                   │
              │ 1. Passport Expiry│
              │ 2. Missing Docs   │
              │ 3. Visa Status    │
              │ 4. Photo Quality  │
              │ 5. Consent Status │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │  Alert Generator  │
              │                   │
              │ Dedup existing    │
              │ Set severity      │
              │ Escalate if needed│
              └─────────┬─────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌────────────┐ ┌───────────────┐ ┌──────────┐
│ Alert DB   │ │ Notification  │ │ Dashboard│
│ Storage    │ │ Service (M14) │ │ SSE Push │
└────────────┘ └───────────────┘ └──────────┘
```

### 2.3 Data Flow — Risk Monitoring

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│ Scheduler│────►│ Risk Monitor  │────►│ Metric       │
│ (15-min) │     │ Engine        │     │ Evaluator    │
└──────────┘     └──────┬────────┘     └──────┬───────┘
                        │                     │
                        │  Current metric     │
                        │  values             │
                        │◄────────────────────┘
                        │
              ┌─────────▼─────────┐
              │ Threshold Check   │
              │                   │
              │ metric >= threshold│
              │ → TRIGGER risk    │
              └─────────┬─────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌────────────┐ ┌───────────────┐ ┌──────────────┐
│ Risk       │ │ Alert to      │ │ Command      │
│ Status →   │ │ Mitigation    │ │ Center Feed  │
│ MATERIALIZED│ │ Owner (M14)   │ │ (M10 SSE)    │
└────────────┘ └───────────────┘ └──────────────┘
```

### 2.4 Tech Stack (Module-Specific)

| Component             | Technology               | Purpose                               |
| --------------------- | ------------------------ | ------------------------------------- |
| Compliance Scanner    | Node.js + pg-boss        | Scheduled batch checks                |
| Risk Matrix UI        | React + D3.js            | Interactive 5×5 heat map              |
| Carbon Calculator     | TypeScript               | ICAO/DEFRA emission factor library    |
| Consent Audit         | PostgreSQL triggers      | Immutable consent change log          |
| Retention Engine      | pg-boss + Azure Blob SDK | Data anonymization/deletion           |
| Checklist UI          | React + @dnd-kit         | Drag-and-drop checklist management    |
| Sustainability Charts | Recharts                 | Carbon breakdown visualization        |
| GDPR Processor        | Node.js worker           | Right to erasure execution            |
| PDF Reports           | @react-pdf/renderer      | Compliance and sustainability reports |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE & GOVERNANCE DATA MODEL                        │
│                                                                             │
│  DOCUMENT COMPLIANCE DOMAIN                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐                  │
│  │ VisaTracking │  │ConsentRecord │  │ ComplianceAlert   │                  │
│  │              │  │              │  │                   │                  │
│  │ participantId│  │ participantId│  │ tenantId          │                  │
│  │ status       │  │ consentType  │  │ eventId           │                  │
│  │ visaNumber   │  │ granted      │  │ participantId     │                  │
│  │ embassy      │  │ version      │  │ alertType         │                  │
│  │ expiryDate   │  │ ipAddress    │  │ severity          │                  │
│  └──────┬───────┘  └──────┬───────┘  │ isResolved        │                  │
│         │                 │          └──────────┬────────┘                  │
│         │                 │                     │                           │
│         └─────────────────┼─────────────────────┘                           │
│                           │                                                 │
│  ┌────────────────────┐   │   ┌─────────────────────┐                      │
│  │DataRetentionPolicy │   │   │DataRetentionExecution│                      │
│  │                    │   │   │                      │                      │
│  │ tenantId           │   │   │ tenantId             │                      │
│  │ entityType         │───┼──►│ policyId             │                      │
│  │ retentionDays      │   │   │ recordsProcessed     │                      │
│  │ action             │   │   │ action               │                      │
│  └────────────────────┘   │   └──────────────────────┘                      │
│                           │                                                 │
│  ENHANCED MODELS          │                                                 │
│  ┌──────────────────┐     │   ┌──────────────────────┐                      │
│  │ GDPRRequest      │     │   │ ConsentAuditLog      │                      │
│  │                  │     │   │                      │                      │
│  │ participantId    │     └──►│ consentRecordId      │                      │
│  │ requestType      │        │ action               │                      │
│  │ status           │        │ changedBy             │                      │
│  │ processingLog    │        │ ipAddress             │                      │
│  └──────────────────┘        └──────────────────────┘                      │
│                                                                             │
│  RISK MANAGEMENT DOMAIN                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ RiskRegister     │  │ EventChecklist   │  │ RiskMitigation   │          │
│  │                  │  │                  │  │   Action          │          │
│  │ tenantId         │  │ tenantId         │  │                  │          │
│  │ eventId          │  │ eventId          │  │ riskId           │          │
│  │ category         │  │ name             │  │ title            │          │
│  │ likelihood       │  │ category         │  │ assigneeId       │          │
│  │ impact           │  │ assignedTo       │  │ status           │          │
│  │ riskScore        │──┤ status           │  │ dueDate          │          │
│  │ mitigationPlan   │  │                  │  │ completedAt      │          │
│  │ triggerCondition │  │ items[]          │  └──────────────────┘          │
│  │ isTriggered      │  └────────┬─────────┘                                │
│  └──────────────────┘           │                                           │
│                        ┌────────▼─────────┐                                │
│                        │ ChecklistItem    │                                │
│                        │                  │                                │
│                        │ order            │                                │
│                        │ description      │                                │
│                        │ isCompleted      │                                │
│                        │ completedBy      │                                │
│                        └──────────────────┘                                │
│                                                                             │
│  SUSTAINABILITY DOMAIN                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ CarbonFootprint  │  │SustainabilityGoal│  │ ComplianceReport │          │
│  │                  │  │                  │  │                  │          │
│  │ airTravelKgCO2   │  │ tenantId         │  │ tenantId         │          │
│  │ groundTransport  │  │ eventId          │  │ eventId          │          │
│  │ cateringKgCO2    │  │ category         │  │ reportType       │          │
│  │ venueEnergyKgCO2 │  │ targetValue      │  │ generatedAt      │          │
│  │ printingKgCO2    │  │ currentValue     │  │ fileUrl          │          │
│  │ offsetsPurchased │  │ unit             │  │ status           │          │
│  │ totalKgCO2       │  │ deadline         │  │ generatedBy      │          │
│  │ netKgCO2         │  │ status           │  └──────────────────┘          │
│  └──────────────────┘  └──────────────────┘                                │
│                                                                             │
│  ┌────────────────────┐                                                    │
│  │RegulatoryFramework │                                                    │
│  │                    │                                                    │
│  │ tenantId           │                                                    │
│  │ name               │                                                    │
│  │ jurisdiction       │                                                    │
│  │ requirements       │                                                    │
│  │ isActive           │                                                    │
│  └────────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Prisma Schema — Document Compliance Domain

```prisma
// ══════════════════════════════════════════════════════════
// DOCUMENT COMPLIANCE ENUMS
// ══════════════════════════════════════════════════════════

enum VisaStatus {
  NOT_NEEDED
  PENDING
  APPLIED
  ISSUED
  DENIED
  EXPIRED
}

enum ConsentType {
  DATA_PROCESSING
  PHOTO_USAGE
  COMMUNICATION
  BADGE_DISPLAY
}

enum RetentionAction {
  ANONYMIZE
  DELETE
  ARCHIVE
}

// ══════════════════════════════════════════════════════════
// VISA TRACKING
// ══════════════════════════════════════════════════════════

model VisaTracking {
  id              String     @id @default(cuid())
  participantId   String     @unique
  status          VisaStatus
  applicationDate DateTime?
  issueDate       DateTime?
  expiryDate      DateTime?
  visaNumber      String?
  embassy         String?
  supportLetterSent Boolean  @default(false)
  supportLetterDate DateTime?
  notes           String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

// ══════════════════════════════════════════════════════════
// CONSENT MANAGEMENT
// ══════════════════════════════════════════════════════════

model ConsentRecord {
  id              String      @id @default(cuid())
  participantId   String
  consentType     ConsentType
  granted         Boolean
  grantedAt       DateTime    @default(now())
  revokedAt       DateTime?
  ipAddress       String?
  version         String      // Version of privacy policy accepted

  auditLog        ConsentAuditLog[]

  @@unique([participantId, consentType])
  @@index([participantId])
}

// ══════════════════════════════════════════════════════════
// COMPLIANCE ALERTS
// ══════════════════════════════════════════════════════════

model ComplianceAlert {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  participantId   String
  alertType       String   // PASSPORT_EXPIRING, DOCUMENT_MISSING, VISA_DEADLINE, DATA_RETENTION_DUE
  details         String   // "Passport expires Feb 5, 2026 — 5 days before event start"
  severity        String   // INFO, WARNING, CRITICAL
  isResolved      Boolean  @default(false)
  resolvedAt      DateTime?
  resolvedBy      String?
  resolvedNote    String?
  escalationLevel Int      @default(0)
  lastEscalatedAt DateTime?
  createdAt       DateTime @default(now())

  @@index([eventId, alertType, isResolved])
  @@index([participantId])
  @@index([tenantId, eventId, severity])
  @@index([eventId, isResolved, severity])
}

// ══════════════════════════════════════════════════════════
// DATA RETENTION
// ══════════════════════════════════════════════════════════

model DataRetentionPolicy {
  id            String          @id @default(cuid())
  tenantId      String
  entityType    String          // "Participant", "Approval", "Document", "AccessLog"
  retentionDays Int
  action        RetentionAction
  isActive      Boolean         @default(true)
  description   String?
  legalBasis    String?         // "GDPR Art. 5(1)(e)", "AU Data Policy §4.2"
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  executions    DataRetentionExecution[]

  @@unique([tenantId, entityType])
}

model DataRetentionExecution {
  id            String   @id @default(cuid())
  tenantId      String
  eventId       String
  policyId      String
  policy        DataRetentionPolicy @relation(fields: [policyId], references: [id])
  entityType    String
  recordsProcessed Int
  action        RetentionAction
  executedAt    DateTime @default(now())
  executedBy    String   // "SYSTEM" for automated, userId for manual
  errorLog      String?
  duration      Int?     // Execution time in seconds

  @@index([tenantId, eventId])
  @@index([policyId])
}
```

### 3.3 Prisma Schema — Enhanced Compliance Models

```prisma
// ══════════════════════════════════════════════════════════
// ENHANCED: GDPR REQUEST MANAGEMENT
// ══════════════════════════════════════════════════════════

enum GDPRRequestType {
  RIGHT_TO_ERASURE       // Delete all personal data
  RIGHT_TO_ACCESS        // Export all personal data
  RIGHT_TO_RECTIFICATION // Correct personal data
  RIGHT_TO_PORTABILITY   // Export in machine-readable format
  RIGHT_TO_RESTRICT      // Restrict processing
}

enum GDPRRequestStatus {
  RECEIVED
  IDENTITY_VERIFIED
  PROCESSING
  COMPLETED
  REJECTED
  APPEAL_PENDING
}

model GDPRRequest {
  id              String            @id @default(cuid())
  tenantId        String
  participantId   String
  requestType     GDPRRequestType
  status          GDPRRequestStatus @default(RECEIVED)
  requestedAt     DateTime          @default(now())
  identityVerifiedAt DateTime?
  identityVerifiedBy String?
  processingStartedAt DateTime?
  completedAt     DateTime?
  rejectedAt      DateTime?
  rejectionReason String?
  processingLog   Json              @default("[]") // Step-by-step execution log
  dataExportUrl   String?           // For access/portability requests
  dataExportExpiresAt DateTime?
  affectedRecords Json?             // { participants: 1, approvals: 3, documents: 5, ... }
  deadline        DateTime          // 30 days from request per GDPR
  createdBy       String            // User who submitted request
  processedBy     String?           // DPO or admin who processed

  @@index([tenantId, status])
  @@index([participantId])
  @@index([deadline, status])
}

// ══════════════════════════════════════════════════════════
// ENHANCED: CONSENT AUDIT LOG (IMMUTABLE)
// ══════════════════════════════════════════════════════════

model ConsentAuditLog {
  id              String   @id @default(cuid())
  consentRecordId String
  consentRecord   ConsentRecord @relation(fields: [consentRecordId], references: [id])
  action          String   // GRANTED, REVOKED, VERSION_UPDATED
  previousValue   Boolean?
  newValue        Boolean
  policyVersion   String   // Privacy policy version at time of change
  changedBy       String   // participantId or "SYSTEM"
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime @default(now())

  @@index([consentRecordId, timestamp])
  @@index([changedBy])
}

// ══════════════════════════════════════════════════════════
// ENHANCED: COMPLIANCE SCAN RESULTS
// ══════════════════════════════════════════════════════════

model ComplianceScanResult {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  scanType        String   // FULL, PASSPORT_ONLY, VISA_ONLY, DOCUMENT_ONLY
  totalParticipants Int
  compliantCount  Int
  alertsGenerated Int
  passportExpiring Int
  documentsMissing Int
  visasPending    Int
  visasDenied     Int
  photoIssues     Int
  scanDuration    Int      // Seconds
  triggeredBy     String   // "SYSTEM" or userId
  completedAt     DateTime @default(now())

  @@index([tenantId, eventId, completedAt])
}

// ══════════════════════════════════════════════════════════
// ENHANCED: REGULATORY FRAMEWORK
// ══════════════════════════════════════════════════════════

model RegulatoryFramework {
  id              String   @id @default(cuid())
  tenantId        String
  name            String   // "GDPR", "AU Data Policy", "Local Data Protection Act"
  jurisdiction    String   // "EU", "AU", "Ethiopia", "South Africa"
  description     String?
  requirements    Json     // Structured requirements list
  consentRequired Boolean  @default(true)
  retentionMaxDays Int?    // Maximum retention period
  erasureDeadlineDays Int  @default(30) // Days to process erasure requests
  crossBorderRules Json?   // Cross-border data transfer rules
  isActive        Boolean  @default(true)
  effectiveDate   DateTime
  expiryDate      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, name])
  @@index([tenantId, isActive])
}

// ══════════════════════════════════════════════════════════
// ENHANCED: COMPLIANCE REPORT
// ══════════════════════════════════════════════════════════

model ComplianceReport {
  id              String   @id @default(cuid())
  tenantId        String
  eventId         String
  reportType      String   // DOCUMENT_COMPLIANCE, GDPR_AUDIT, RISK_ASSESSMENT, SUSTAINABILITY, FULL
  title           String
  status          String   // GENERATING, COMPLETED, FAILED
  generatedAt     DateTime?
  fileUrl         String?  // Azure Blob URL for PDF
  fileSizeBytes   Int?
  dataSnapshot    Json?    // Key metrics at time of generation
  generatedBy     String
  createdAt       DateTime @default(now())

  @@index([tenantId, eventId, reportType])
}
```

### 3.4 Prisma Schema — Risk Management Domain

```prisma
// ══════════════════════════════════════════════════════════
// RISK MANAGEMENT ENUMS
// ══════════════════════════════════════════════════════════

enum RiskCategory {
  SECURITY        // Terrorism, crowd control, VIP safety
  HEALTH          // Pandemic, food poisoning, medical emergency
  WEATHER         // Storms, extreme heat, flooding
  TECHNICAL       // Power failure, IT outage, AV malfunction
  LOGISTICS       // Transport delays, supply chain, vendor no-show
  POLITICAL       // Diplomatic incident, protest, boycott
  FINANCIAL       // Budget overrun, sponsor withdrawal, currency fluctuation
  REPUTATIONAL    // Negative press, social media crisis
  OPERATIONAL     // Staff shortage, overcrowding, registration delays
  LEGAL           // Compliance violation, contract dispute
}

enum RiskStatus {
  IDENTIFIED
  ASSESSED
  MITIGATING
  ACCEPTED      // Risk accepted, no further action
  CLOSED        // Risk no longer relevant
  MATERIALIZED  // Risk event occurred
}

// ══════════════════════════════════════════════════════════
// RISK REGISTER
// ══════════════════════════════════════════════════════════

model RiskRegister {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  title       String
  description String
  category    RiskCategory
  likelihood  Int      // 1-5 (1=Rare, 5=Almost Certain)
  impact      Int      // 1-5 (1=Negligible, 5=Catastrophic)
  riskScore   Int      // likelihood × impact (auto-calculated)
  status      RiskStatus @default(IDENTIFIED)

  // Mitigation
  mitigationPlan   String?
  mitigationOwner  String?  // userId
  mitigationStatus String?  // NOT_STARTED, IN_PROGRESS, COMPLETED

  // Contingency (if risk materializes)
  contingencyPlan  String?
  contingencyOwner String?

  // Monitoring
  triggerCondition String?  // "Registration exceeds 90% of capacity"
  monitoringField  String?  // "participant_count" — links to real-time data
  monitoringThreshold Float? // 0.9 (90%)
  isTriggered      Boolean  @default(false)

  // Post-event review
  didMaterialize   Boolean?
  actualImpact     String?
  lessonsLearned   String?

  mitigationActions RiskMitigationAction[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([eventId, riskScore])
  @@index([eventId, status])
  @@index([eventId, category])
  @@index([tenantId, eventId, isTriggered])
}

// ══════════════════════════════════════════════════════════
// ENHANCED: RISK MITIGATION ACTIONS
// ══════════════════════════════════════════════════════════

model RiskMitigationAction {
  id          String   @id @default(cuid())
  riskId      String
  risk        RiskRegister @relation(fields: [riskId], references: [id], onDelete: Cascade)
  title       String
  description String?
  assigneeId  String
  status      String   // NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED
  priority    String   // LOW, MEDIUM, HIGH, CRITICAL
  dueDate     DateTime?
  completedAt DateTime?
  completedBy String?
  evidence    String?  // URL to supporting documentation
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([riskId, status])
  @@index([assigneeId, status])
  @@index([dueDate, status])
}

// ══════════════════════════════════════════════════════════
// EVENT CHECKLISTS
// ══════════════════════════════════════════════════════════

model EventChecklist {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  name        String   // "Pre-Event Setup", "Day-Of Operations", "Emergency: Power Failure"
  category    String   // PRE_EVENT, DAY_OF, POST_EVENT, EMERGENCY
  assignedTo  String?  // userId or team name
  dueDate     DateTime?
  status      String   // NOT_STARTED, IN_PROGRESS, COMPLETED
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items       ChecklistItem[]

  @@index([eventId, category])
  @@index([eventId, status])
}

model ChecklistItem {
  id          String   @id @default(cuid())
  checklistId String
  checklist   EventChecklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  order       Int
  description String
  isCompleted Boolean  @default(false)
  completedBy String?
  completedAt DateTime?
  notes       String?

  @@index([checklistId])
  @@index([checklistId, order])
}
```

### 3.5 Prisma Schema — Sustainability Domain

```prisma
// ══════════════════════════════════════════════════════════
// CARBON FOOTPRINT TRACKING
// ══════════════════════════════════════════════════════════

model CarbonFootprint {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  event       Event    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Travel emissions (auto-calculated from participant data)
  airTravelKgCO2      Float  @default(0)
  groundTransportKgCO2 Float @default(0)

  // Venue & operations
  venueEnergyKgCO2    Float  @default(0) // From venue utility data
  cateringKgCO2       Float  @default(0) // Based on meal types and counts
  printingKgCO2       Float  @default(0) // Paper volume × emission factor

  // Offsets
  offsetsPurchasedKgCO2 Float @default(0)
  offsetVendor        String?
  offsetCertificateUrl String?

  // Paper tracking
  badgesPrinted       Int    @default(0)
  digitalBadgesIssued Int    @default(0)
  documentsDigitized  Int    @default(0)
  estimatedPaperSavedKg Float @default(0)

  totalKgCO2          Float  @default(0) // Sum of all emission categories
  netKgCO2            Float  @default(0) // total - offsets

  calculatedAt        DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([tenantId, eventId])
}

// ══════════════════════════════════════════════════════════
// ENHANCED: SUSTAINABILITY GOALS
// ══════════════════════════════════════════════════════════

model SustainabilityGoal {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  category    String   // CARBON_REDUCTION, PAPERLESS, OFFSET, WASTE_REDUCTION, ENERGY
  title       String   // "Reduce carbon footprint by 10% vs previous edition"
  targetValue Float    // 10 (percent) or 5000 (kgCO2)
  currentValue Float   @default(0)
  unit        String   // "percent", "kgCO2", "pages", "kg"
  baseline    Float?   // Previous event value for comparison
  deadline    DateTime?
  status      String   // ON_TRACK, AT_RISK, BEHIND, ACHIEVED, MISSED
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, eventId, category])
  @@index([tenantId, eventId, status])
}
```

### 3.6 Index Catalog

| Table                  | Index Name                      | Columns                          | Type    | Rationale                             |
| ---------------------- | ------------------------------- | -------------------------------- | ------- | ------------------------------------- |
| VisaTracking           | `PK`                            | `id`                             | Primary | Record lookup                         |
| VisaTracking           | `visa_participant_unique`       | `participantId`                  | Unique  | One visa record per participant       |
| ConsentRecord          | `PK`                            | `id`                             | Primary | Record lookup                         |
| ConsentRecord          | `consent_participant_type`      | `participantId, consentType`     | Unique  | One consent per type per participant  |
| ConsentRecord          | `idx_consent_participant`       | `participantId`                  | B-tree  | Load all consents for participant     |
| ComplianceAlert        | `PK`                            | `id`                             | Primary | Record lookup                         |
| ComplianceAlert        | `idx_alert_event_type_resolved` | `eventId, alertType, isResolved` | B-tree  | Filter alerts by type and status      |
| ComplianceAlert        | `idx_alert_participant`         | `participantId`                  | B-tree  | Participant alert history             |
| ComplianceAlert        | `idx_alert_severity`            | `tenantId, eventId, severity`    | B-tree  | Dashboard severity filtering          |
| ComplianceAlert        | `idx_alert_unresolved`          | `eventId, isResolved, severity`  | B-tree  | Unresolved alerts queue               |
| DataRetentionPolicy    | `PK`                            | `id`                             | Primary | Record lookup                         |
| DataRetentionPolicy    | `retention_tenant_entity`       | `tenantId, entityType`           | Unique  | One policy per entity type per tenant |
| DataRetentionExecution | `PK`                            | `id`                             | Primary | Record lookup                         |
| DataRetentionExecution | `idx_retention_exec_tenant`     | `tenantId, eventId`              | B-tree  | Execution history by tenant/event     |
| DataRetentionExecution | `idx_retention_exec_policy`     | `policyId`                       | B-tree  | Executions per policy                 |
| GDPRRequest            | `PK`                            | `id`                             | Primary | Record lookup                         |
| GDPRRequest            | `idx_gdpr_tenant_status`        | `tenantId, status`               | B-tree  | GDPR request queue                    |
| GDPRRequest            | `idx_gdpr_participant`          | `participantId`                  | B-tree  | Participant request history           |
| GDPRRequest            | `idx_gdpr_deadline`             | `deadline, status`               | B-tree  | Deadline monitoring (SLA compliance)  |
| ConsentAuditLog        | `PK`                            | `id`                             | Primary | Record lookup                         |
| ConsentAuditLog        | `idx_consent_audit_record`      | `consentRecordId, timestamp`     | B-tree  | Consent change history                |
| ConsentAuditLog        | `idx_consent_audit_actor`       | `changedBy`                      | B-tree  | Audit by actor                        |
| ComplianceScanResult   | `PK`                            | `id`                             | Primary | Record lookup                         |
| ComplianceScanResult   | `idx_scan_tenant_event`         | `tenantId, eventId, completedAt` | B-tree  | Scan history                          |
| RegulatoryFramework    | `PK`                            | `id`                             | Primary | Record lookup                         |
| RegulatoryFramework    | `reg_tenant_name`               | `tenantId, name`                 | Unique  | One framework per name per tenant     |
| RegulatoryFramework    | `idx_reg_active`                | `tenantId, isActive`             | B-tree  | Active frameworks                     |
| ComplianceReport       | `PK`                            | `id`                             | Primary | Record lookup                         |
| ComplianceReport       | `idx_report_tenant_event`       | `tenantId, eventId, reportType`  | B-tree  | Report listing                        |
| RiskRegister           | `PK`                            | `id`                             | Primary | Record lookup                         |
| RiskRegister           | `idx_risk_event_score`          | `eventId, riskScore`             | B-tree  | Risk matrix sorting                   |
| RiskRegister           | `idx_risk_event_status`         | `eventId, status`                | B-tree  | Active risks filter                   |
| RiskRegister           | `idx_risk_event_category`       | `eventId, category`              | B-tree  | Category filtering                    |
| RiskRegister           | `idx_risk_triggered`            | `tenantId, eventId, isTriggered` | B-tree  | Triggered risk monitoring             |
| RiskMitigationAction   | `PK`                            | `id`                             | Primary | Record lookup                         |
| RiskMitigationAction   | `idx_mitigation_risk`           | `riskId, status`                 | B-tree  | Actions per risk                      |
| RiskMitigationAction   | `idx_mitigation_assignee`       | `assigneeId, status`             | B-tree  | Assignee task list                    |
| RiskMitigationAction   | `idx_mitigation_due`            | `dueDate, status`                | B-tree  | Overdue action detection              |
| EventChecklist         | `PK`                            | `id`                             | Primary | Record lookup                         |
| EventChecklist         | `idx_checklist_event_cat`       | `eventId, category`              | B-tree  | Checklists by category                |
| EventChecklist         | `idx_checklist_event_status`    | `eventId, status`                | B-tree  | Completion tracking                   |
| ChecklistItem          | `PK`                            | `id`                             | Primary | Record lookup                         |
| ChecklistItem          | `idx_checklist_item_order`      | `checklistId, order`             | B-tree  | Ordered item listing                  |
| CarbonFootprint        | `PK`                            | `id`                             | Primary | Record lookup                         |
| CarbonFootprint        | `carbon_tenant_event`           | `tenantId, eventId`              | Unique  | One footprint per event               |
| SustainabilityGoal     | `PK`                            | `id`                             | Primary | Record lookup                         |
| SustainabilityGoal     | `idx_goal_event_cat`            | `tenantId, eventId, category`    | B-tree  | Goals by category                     |
| SustainabilityGoal     | `idx_goal_event_status`         | `tenantId, eventId, status`      | B-tree  | Goal status tracking                  |

---

## 4. API Specification

### 4.1 Document Compliance API

#### 4.1.1 Compliance Scanning

```
POST   /api/v1/compliance/scans                    Run compliance scan
GET    /api/v1/compliance/scans                    List scan history
GET    /api/v1/compliance/scans/:scanId            Get scan result details
```

#### 4.1.2 Compliance Alerts

```
GET    /api/v1/compliance/alerts                   List alerts (paginated, filterable)
GET    /api/v1/compliance/alerts/:alertId          Get alert details
PATCH  /api/v1/compliance/alerts/:alertId/resolve  Resolve an alert
POST   /api/v1/compliance/alerts/bulk-remind       Send bulk reminders for open alerts
GET    /api/v1/compliance/alerts/summary           Get alert summary (counts by type/severity)
```

#### 4.1.3 Visa Tracking

```
GET    /api/v1/compliance/visas                    List visa records
GET    /api/v1/compliance/visas/:participantId     Get visa status for participant
PUT    /api/v1/compliance/visas/:participantId     Update visa status
POST   /api/v1/compliance/visas/support-letter     Generate visa support letter
GET    /api/v1/compliance/visas/summary            Visa status summary
```

#### 4.1.4 Consent Management

```
GET    /api/v1/compliance/consents/:participantId  Get all consents for participant
POST   /api/v1/compliance/consents                 Record consent grant/revoke
GET    /api/v1/compliance/consents/audit/:recordId Consent audit trail
GET    /api/v1/compliance/consents/summary         Consent coverage summary
```

#### 4.1.5 Data Retention

```
GET    /api/v1/compliance/retention/policies       List retention policies
POST   /api/v1/compliance/retention/policies       Create retention policy
PUT    /api/v1/compliance/retention/policies/:id   Update retention policy
POST   /api/v1/compliance/retention/execute         Execute retention for event
GET    /api/v1/compliance/retention/executions      List execution history
GET    /api/v1/compliance/retention/preview          Preview retention impact
```

#### 4.1.6 GDPR Requests

```
POST   /api/v1/compliance/gdpr/requests            Submit GDPR request
GET    /api/v1/compliance/gdpr/requests             List GDPR requests
GET    /api/v1/compliance/gdpr/requests/:id         Get request details
PATCH  /api/v1/compliance/gdpr/requests/:id/verify  Verify identity
POST   /api/v1/compliance/gdpr/requests/:id/process Process request
GET    /api/v1/compliance/gdpr/requests/:id/export  Download data export
```

### 4.2 Risk Management API

```
GET    /api/v1/risks                                List risks (paginated)
POST   /api/v1/risks                                Create risk entry
GET    /api/v1/risks/:riskId                        Get risk details
PUT    /api/v1/risks/:riskId                        Update risk
DELETE /api/v1/risks/:riskId                        Delete risk
GET    /api/v1/risks/matrix                         Get risk matrix data
POST   /api/v1/risks/:riskId/assess                 Submit risk assessment
GET    /api/v1/risks/:riskId/actions                List mitigation actions
POST   /api/v1/risks/:riskId/actions                Create mitigation action
PATCH  /api/v1/risks/:riskId/actions/:actionId      Update action status
POST   /api/v1/risks/monitor/evaluate               Trigger risk monitoring evaluation
GET    /api/v1/risks/monitor/status                  Current monitoring status
```

#### 4.2.1 Checklists

```
GET    /api/v1/risks/checklists                     List checklists
POST   /api/v1/risks/checklists                     Create checklist
GET    /api/v1/risks/checklists/:id                 Get checklist with items
PUT    /api/v1/risks/checklists/:id                 Update checklist
DELETE /api/v1/risks/checklists/:id                 Delete checklist
POST   /api/v1/risks/checklists/:id/items           Add checklist item
PATCH  /api/v1/risks/checklists/:id/items/:itemId   Toggle item completion
PUT    /api/v1/risks/checklists/:id/items/reorder   Reorder items
```

### 4.3 Sustainability API

```
GET    /api/v1/sustainability/carbon                Get carbon footprint
POST   /api/v1/sustainability/carbon/calculate      Recalculate emissions
GET    /api/v1/sustainability/carbon/breakdown       Emissions by category
GET    /api/v1/sustainability/dashboard              Sustainability dashboard
POST   /api/v1/sustainability/offsets                Record offset purchase
GET    /api/v1/sustainability/offsets                List offset purchases
GET    /api/v1/sustainability/paperless              Paperless metrics
GET    /api/v1/sustainability/goals                  List sustainability goals
POST   /api/v1/sustainability/goals                  Create sustainability goal
PUT    /api/v1/sustainability/goals/:id              Update goal progress
GET    /api/v1/sustainability/comparison              YoY event comparison
```

### 4.4 Compliance Reports API

```
POST   /api/v1/compliance/reports                   Generate report
GET    /api/v1/compliance/reports                   List reports
GET    /api/v1/compliance/reports/:id               Get report details
GET    /api/v1/compliance/reports/:id/download       Download report PDF
```

### 4.5 TypeScript Types and Zod Schemas

```typescript
// ── API Types: Compliance Scanning ──

import { z } from "zod";

export const RunComplianceScanSchema = z.object({
  eventId: z.string().cuid(),
  scanType: z.enum(["FULL", "PASSPORT_ONLY", "VISA_ONLY", "DOCUMENT_ONLY"]).default("FULL"),
  notifyParticipants: z.boolean().default(false),
});

export type RunComplianceScanInput = z.infer<typeof RunComplianceScanSchema>;

export interface ComplianceScanResponse {
  id: string;
  scanType: string;
  totalParticipants: number;
  compliantCount: number;
  alertsGenerated: number;
  breakdown: {
    passportExpiring: number;
    documentsMissing: number;
    visasPending: number;
    visasDenied: number;
    photoIssues: number;
  };
  complianceRate: number;
  scanDuration: number;
  completedAt: string;
}

// ── API Types: Alert Management ──

export const ListAlertsSchema = z.object({
  eventId: z.string().cuid(),
  alertType: z
    .enum([
      "PASSPORT_EXPIRING",
      "DOCUMENT_MISSING",
      "VISA_DEADLINE",
      "VISA_DENIED",
      "PHOTO_QUALITY",
      "CONSENT_MISSING",
      "DATA_RETENTION_DUE",
    ])
    .optional(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  isResolved: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["createdAt", "severity", "alertType"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const ResolveAlertSchema = z.object({
  resolvedNote: z.string().max(1000).optional(),
});

export interface AlertSummary {
  total: number;
  unresolved: number;
  bySeverity: { INFO: number; WARNING: number; CRITICAL: number };
  byType: Record<string, number>;
  complianceRate: number;
}

// ── API Types: Visa Tracking ──

export const UpdateVisaSchema = z.object({
  status: z.nativeEnum(VisaStatus),
  applicationDate: z.string().datetime().optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  visaNumber: z.string().max(100).optional(),
  embassy: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const GenerateSupportLetterSchema = z.object({
  participantIds: z.array(z.string().cuid()).min(1).max(100),
  embassyName: z.string().optional(),
  additionalNotes: z.string().max(2000).optional(),
});

// ── API Types: GDPR Requests ──

export const CreateGDPRRequestSchema = z.object({
  participantId: z.string().cuid(),
  requestType: z.nativeEnum(GDPRRequestType),
  justification: z.string().max(2000).optional(),
});

export const VerifyGDPRIdentitySchema = z.object({
  verificationMethod: z.enum(["EMAIL_CONFIRMATION", "DOCUMENT_CHECK", "IN_PERSON"]),
  verificationNotes: z.string().max(1000).optional(),
});

// ── API Types: Risk Management ──

export const CreateRiskSchema = z.object({
  eventId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.nativeEnum(RiskCategory),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  mitigationPlan: z.string().max(5000).optional(),
  mitigationOwner: z.string().cuid().optional(),
  contingencyPlan: z.string().max(5000).optional(),
  contingencyOwner: z.string().cuid().optional(),
  triggerCondition: z.string().max(500).optional(),
  monitoringField: z.string().max(100).optional(),
  monitoringThreshold: z.number().min(0).max(1).optional(),
});

export interface RiskMatrixResponse {
  matrix: {
    likelihood: number;
    impact: number;
    risks: {
      id: string;
      title: string;
      category: RiskCategory;
      status: RiskStatus;
    }[];
  }[];
  summary: {
    total: number;
    byLevel: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
    byStatus: Record<RiskStatus, number>;
    averageScore: number;
    triggeredCount: number;
  };
}

// ── API Types: Sustainability ──

export const CalculateCarbonSchema = z.object({
  eventId: z.string().cuid(),
  categories: z
    .array(z.enum(["AIR_TRAVEL", "GROUND_TRANSPORT", "CATERING", "VENUE_ENERGY", "PRINTING"]))
    .optional(), // If omitted, calculate all
  forceRecalculate: z.boolean().default(false),
});

export const RecordOffsetSchema = z.object({
  eventId: z.string().cuid(),
  offsetKgCO2: z.number().positive(),
  vendor: z.string().min(1).max(200),
  certificateUrl: z.string().url().optional(),
  cost: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  purchaseDate: z.string().datetime().optional(),
  standard: z.enum(["GOLD_STANDARD", "VCS", "CDM", "OTHER"]).default("GOLD_STANDARD"),
});

export const CreateGoalSchema = z.object({
  eventId: z.string().cuid(),
  category: z.enum(["CARBON_REDUCTION", "PAPERLESS", "OFFSET", "WASTE_REDUCTION", "ENERGY"]),
  title: z.string().min(1).max(200),
  targetValue: z.number().positive(),
  unit: z.enum(["percent", "kgCO2", "tonnes", "pages", "kg"]),
  baseline: z.number().optional(),
  deadline: z.string().datetime().optional(),
});

// ── API Types: Error Responses ──

export interface ComplianceErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
  };
}

export const COMPLIANCE_ERROR_CODES = {
  SCAN_IN_PROGRESS: "A compliance scan is already running for this event",
  ALERT_ALREADY_RESOLVED: "This alert has already been resolved",
  GDPR_DEADLINE_EXCEEDED: "GDPR processing deadline has been exceeded",
  RETENTION_POLICY_LOCKED: "Cannot modify retention policy with pending executions",
  RISK_SCORE_OUT_OF_RANGE: "Risk score must be between 1 and 25",
  CHECKLIST_ALREADY_COMPLETED: "This checklist has already been completed",
  CARBON_CALCULATION_FAILED: "Carbon calculation failed — check input data",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions for this compliance operation",
} as const;
```

---

## 5. Business Logic

### 5.1 Compliance Scan Engine

The compliance scanner runs as a scheduled background job (daily at 02:00 UTC) and can also be triggered manually. It evaluates every approved participant against configurable compliance rules and generates or updates alerts.

```typescript
// ── Business Logic: Compliance Scanner ──

interface ComplianceScanConfig {
  passportExpiryThresholdDays: number[]; // [90, 30, 7, 1]
  passportMinValidityMonths: number; // 6 months before event
  requiredDocumentFields: string[]; // From form template
  visaDeadlineDays: number; // Days before event to warn
  photoMinWidth: number; // 400px
  photoMinHeight: number; // 500px
  photoFaceConfidenceMin: number; // 0.8
}

export class ComplianceScanner {
  constructor(
    private readonly participantRepo: ParticipantRepository,
    private readonly alertRepo: ComplianceAlertRepository,
    private readonly scanResultRepo: ComplianceScanResultRepository,
    private readonly notificationService: NotificationService,
    private readonly config: ComplianceScanConfig,
  ) {}

  async runFullScan(
    tenantId: string,
    eventId: string,
    triggeredBy: string,
  ): Promise<ComplianceScanResult> {
    const startTime = Date.now();

    // 1. Load all approved/pending participants
    const participants = await this.participantRepo.findMany({
      where: {
        tenantId,
        eventId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] },
        deletedAt: null,
      },
      include: { documents: true, customData: true },
    });

    const event = await this.eventRepo.findUnique({ where: { id: eventId } });
    let alertsGenerated = 0;
    let compliantCount = 0;
    const breakdown = {
      passportExpiring: 0,
      documentsMissing: 0,
      visasPending: 0,
      visasDenied: 0,
      photoIssues: 0,
    };

    // 2. Run checks for each participant
    for (const participant of participants) {
      const alerts = await this.checkParticipant(participant, event);

      if (alerts.length === 0) {
        compliantCount++;
      } else {
        for (const alert of alerts) {
          // Dedup: don't create if identical unresolved alert exists
          const existing = await this.alertRepo.findFirst({
            where: {
              participantId: participant.id,
              alertType: alert.alertType,
              isResolved: false,
            },
          });

          if (!existing) {
            await this.alertRepo.create({
              data: {
                tenantId,
                eventId,
                participantId: participant.id,
                ...alert,
              },
            });
            alertsGenerated++;
          } else {
            // Escalate if severity increased
            if (this.severityRank(alert.severity) > this.severityRank(existing.severity)) {
              await this.alertRepo.update({
                where: { id: existing.id },
                data: {
                  severity: alert.severity,
                  details: alert.details,
                  escalationLevel: existing.escalationLevel + 1,
                  lastEscalatedAt: new Date(),
                },
              });
            }
          }

          // Track breakdown
          switch (alert.alertType) {
            case "PASSPORT_EXPIRING":
              breakdown.passportExpiring++;
              break;
            case "DOCUMENT_MISSING":
              breakdown.documentsMissing++;
              break;
            case "VISA_DEADLINE":
              breakdown.visasPending++;
              break;
            case "VISA_DENIED":
              breakdown.visasDenied++;
              break;
            case "PHOTO_QUALITY":
              breakdown.photoIssues++;
              break;
          }
        }
      }
    }

    // 3. Record scan result
    const scanDuration = Math.round((Date.now() - startTime) / 1000);
    const result = await this.scanResultRepo.create({
      data: {
        tenantId,
        eventId,
        scanType: "FULL",
        totalParticipants: participants.length,
        compliantCount,
        alertsGenerated,
        passportExpiring: breakdown.passportExpiring,
        documentsMissing: breakdown.documentsMissing,
        visasPending: breakdown.visasPending,
        visasDenied: breakdown.visasDenied,
        photoIssues: breakdown.photoIssues,
        scanDuration,
        triggeredBy,
      },
    });

    return result;
  }

  private async checkParticipant(
    participant: ParticipantWithDocs,
    event: Event,
  ): Promise<AlertInput[]> {
    const alerts: AlertInput[] = [];

    // Check 1: Passport Expiry
    const passportExpiry = participant.customData?.passportExpiry;
    if (passportExpiry) {
      const expiryDate = new Date(passportExpiry);
      const eventStart = new Date(event.startDate);
      const minValidDate = new Date(eventStart);
      minValidDate.setMonth(minValidDate.getMonth() + this.config.passportMinValidityMonths);

      if (expiryDate < eventStart) {
        alerts.push({
          alertType: "PASSPORT_EXPIRING",
          severity: "CRITICAL",
          details: `Passport expires ${expiryDate.toLocaleDateString()} — BEFORE event start ${eventStart.toLocaleDateString()}`,
        });
      } else if (expiryDate < minValidDate) {
        const daysUntil = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const severity = daysUntil <= 7 ? "CRITICAL" : daysUntil <= 30 ? "WARNING" : "INFO";
        alerts.push({
          alertType: "PASSPORT_EXPIRING",
          severity,
          details: `Passport expires ${expiryDate.toLocaleDateString()} — ${daysUntil} days remaining, requires ${this.config.passportMinValidityMonths} months validity`,
        });
      }
    }

    // Check 2: Missing Required Documents
    for (const field of this.config.requiredDocumentFields) {
      const hasDocument = participant.documents?.some((d) => d.fieldName === field);
      if (!hasDocument) {
        alerts.push({
          alertType: "DOCUMENT_MISSING",
          severity: "WARNING",
          details: `Missing required document: ${field}`,
        });
      }
    }

    // Check 3: Visa Status
    const visa = await this.visaRepo.findUnique({
      where: { participantId: participant.id },
    });
    if (visa) {
      const daysToEvent = Math.ceil(
        (new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      if (visa.status === "DENIED") {
        alerts.push({
          alertType: "VISA_DENIED",
          severity: "CRITICAL",
          details: `Visa DENIED by ${visa.embassy || "embassy"}. Participant cannot travel.`,
        });
      } else if (
        visa.status !== "ISSUED" &&
        visa.status !== "NOT_NEEDED" &&
        daysToEvent <= this.config.visaDeadlineDays
      ) {
        alerts.push({
          alertType: "VISA_DEADLINE",
          severity: daysToEvent <= 7 ? "CRITICAL" : "WARNING",
          details: `Visa status: ${visa.status}. Event in ${daysToEvent} days. Embassy: ${visa.embassy || "unknown"}`,
        });
      }
    }

    // Check 4: Photo Quality
    const photo = participant.documents?.find((d) => d.fieldName === "photo");
    if (photo) {
      if (
        photo.metadata?.width < this.config.photoMinWidth ||
        photo.metadata?.height < this.config.photoMinHeight
      ) {
        alerts.push({
          alertType: "PHOTO_QUALITY",
          severity: "INFO",
          details: `Photo resolution ${photo.metadata?.width}×${photo.metadata?.height} below minimum ${this.config.photoMinWidth}×${this.config.photoMinHeight}`,
        });
      }
    }

    return alerts;
  }

  private severityRank(severity: string): number {
    return { INFO: 1, WARNING: 2, CRITICAL: 3 }[severity] || 0;
  }
}
```

### 5.2 Data Retention Execution Engine

```typescript
// ── Business Logic: Data Retention Engine ──

export class DataRetentionEngine {
  constructor(
    private readonly policyRepo: DataRetentionPolicyRepository,
    private readonly executionRepo: DataRetentionExecutionRepository,
    private readonly blobService: AzureBlobService,
    private readonly auditService: AuditService,
    private readonly db: PrismaClient,
  ) {}

  /**
   * Runs daily at 02:00 UTC
   * Finds events past their retention period and executes configured actions
   */
  async executeScheduledRetention(): Promise<void> {
    const policies = await this.policyRepo.findMany({
      where: { isActive: true },
    });

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      // Find events that ended before cutoff
      const qualifyingEvents = await this.db.event.findMany({
        where: {
          tenantId: policy.tenantId,
          endDate: { lt: cutoffDate },
        },
      });

      for (const event of qualifyingEvents) {
        // Check if already executed for this event + policy
        const alreadyExecuted = await this.executionRepo.findFirst({
          where: { policyId: policy.id, eventId: event.id },
        });
        if (alreadyExecuted) continue;

        await this.executeRetention(policy, event);
      }
    }
  }

  private async executeRetention(policy: DataRetentionPolicy, event: Event): Promise<void> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let errorLog: string | undefined;

    try {
      switch (policy.action) {
        case "ANONYMIZE":
          recordsProcessed = await this.anonymizeRecords(
            policy.tenantId,
            event.id,
            policy.entityType,
          );
          break;
        case "DELETE":
          recordsProcessed = await this.deleteRecords(policy.tenantId, event.id, policy.entityType);
          break;
        case "ARCHIVE":
          recordsProcessed = await this.archiveRecords(
            policy.tenantId,
            event.id,
            policy.entityType,
          );
          break;
      }
    } catch (error) {
      errorLog = error instanceof Error ? error.message : String(error);
    }

    // Record execution
    await this.executionRepo.create({
      data: {
        tenantId: policy.tenantId,
        eventId: event.id,
        policyId: policy.id,
        entityType: policy.entityType,
        recordsProcessed,
        action: policy.action,
        executedBy: "SYSTEM",
        errorLog,
        duration: Math.round((Date.now() - startTime) / 1000),
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: policy.tenantId,
      action: "DATA_RETENTION_EXECUTED",
      entityType: policy.entityType,
      details: {
        eventId: event.id,
        action: policy.action,
        recordsProcessed,
        retentionDays: policy.retentionDays,
      },
    });
  }

  private async anonymizeRecords(
    tenantId: string,
    eventId: string,
    entityType: string,
  ): Promise<number> {
    if (entityType === "Participant") {
      const participants = await this.db.participant.findMany({
        where: { tenantId, eventId, deletedAt: null },
      });

      for (const p of participants) {
        const anonHash = crypto.createHash("sha256").update(p.id).digest("hex").substring(0, 8);

        await this.db.participant.update({
          where: { id: p.id },
          data: {
            firstName: `ANON-${anonHash}`,
            lastName: "REDACTED",
            email: `anon-${anonHash}@redacted.local`,
            phone: null,
            passportNumber: null,
            customData: {}, // Clear personal custom data
          },
        });

        // Delete uploaded documents from blob storage
        const documents = await this.db.document.findMany({
          where: { participantId: p.id },
        });
        for (const doc of documents) {
          await this.blobService.delete(doc.blobUrl);
          await this.db.document.delete({ where: { id: doc.id } });
        }
      }

      return participants.length;
    }

    return 0;
  }

  private async deleteRecords(
    tenantId: string,
    eventId: string,
    entityType: string,
  ): Promise<number> {
    const result = await this.db[entityType.toLowerCase()].deleteMany({
      where: { tenantId, eventId },
    });
    return result.count;
  }

  private async archiveRecords(
    tenantId: string,
    eventId: string,
    entityType: string,
  ): Promise<number> {
    const records = await this.db[entityType.toLowerCase()].findMany({
      where: { tenantId, eventId },
    });

    // Export to compressed JSON in cold storage
    const archiveData = JSON.stringify(records);
    const compressed = await gzip(archiveData);
    const archivePath = `archives/${tenantId}/${eventId}/${entityType}-${Date.now()}.json.gz`;
    await this.blobService.upload(archivePath, compressed, "application/gzip");

    // Delete from primary database
    await this.db[entityType.toLowerCase()].deleteMany({
      where: { tenantId, eventId },
    });

    return records.length;
  }
}
```

### 5.3 GDPR Right to Erasure Processor

```typescript
// ── Business Logic: GDPR Erasure Processor ──

export class GDPREraseProcessor {
  constructor(
    private readonly db: PrismaClient,
    private readonly blobService: AzureBlobService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async processErasureRequest(requestId: string): Promise<void> {
    const request = await this.db.gDPRRequest.findUniqueOrThrow({
      where: { id: requestId },
    });

    if (request.status !== "IDENTITY_VERIFIED") {
      throw new Error("Identity must be verified before processing");
    }

    await this.db.gDPRRequest.update({
      where: { id: requestId },
      data: { status: "PROCESSING", processingStartedAt: new Date() },
    });

    const log: string[] = [];
    const affectedRecords: Record<string, number> = {};

    try {
      // 1. Delete participant records across all events
      const participants = await this.db.participant.findMany({
        where: { id: request.participantId },
      });

      for (const p of participants) {
        // Delete documents from blob storage
        const docs = await this.db.document.findMany({
          where: { participantId: p.id },
        });
        for (const doc of docs) {
          await this.blobService.delete(doc.blobUrl);
        }
        affectedRecords.documents = (affectedRecords.documents || 0) + docs.length;
        log.push(`Deleted ${docs.length} documents from blob storage`);

        // Delete document records
        await this.db.document.deleteMany({ where: { participantId: p.id } });

        // Delete approvals
        const approvals = await this.db.approval.deleteMany({
          where: { participantId: p.id },
        });
        affectedRecords.approvals = (affectedRecords.approvals || 0) + approvals.count;
        log.push(`Deleted ${approvals.count} approval records`);

        // Delete access logs
        const accessLogs = await this.db.accessLog.deleteMany({
          where: { participantId: p.id },
        });
        affectedRecords.accessLogs = (affectedRecords.accessLogs || 0) + accessLogs.count;
        log.push(`Deleted ${accessLogs.count} access log entries`);

        // Delete consent records
        const consents = await this.db.consentRecord.deleteMany({
          where: { participantId: p.id },
        });
        affectedRecords.consents = (affectedRecords.consents || 0) + consents.count;
        log.push(`Deleted ${consents.count} consent records`);

        // Delete visa tracking
        await this.db.visaTracking.deleteMany({
          where: { participantId: p.id },
        });
        log.push("Deleted visa tracking record");

        // Delete compliance alerts
        await this.db.complianceAlert.deleteMany({
          where: { participantId: p.id },
        });
        log.push("Deleted compliance alerts");
      }

      // Delete participant records themselves
      const deleted = await this.db.participant.deleteMany({
        where: { id: request.participantId },
      });
      affectedRecords.participants = deleted.count;
      log.push(`Deleted ${deleted.count} participant records`);

      // 2. Update GDPR request as completed
      await this.db.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          processingLog: log,
          affectedRecords,
        },
      });

      // 3. Send confirmation notification
      await this.notificationService.send({
        templateSlug: "gdpr-erasure-confirmation",
        recipientEmail: request.requestEmail,
        variables: { requestId: request.id },
      });

      // 4. Audit log (immutable)
      await this.auditService.log({
        tenantId: request.tenantId,
        action: "GDPR_ERASURE_COMPLETED",
        entityType: "GDPRRequest",
        entityId: requestId,
        details: { affectedRecords, participantId: request.participantId },
      });
    } catch (error) {
      await this.db.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: "RECEIVED", // Revert to allow retry
          processingLog: [...log, `ERROR: ${error.message}`],
        },
      });
      throw error;
    }
  }
}
```

### 5.4 Risk Assessment and Monitoring

```typescript
// ── Business Logic: Risk Assessment ──

export class RiskAssessmentService {
  /**
   * Calculate risk score and determine risk level
   */
  calculateRiskScore(
    likelihood: number,
    impact: number,
  ): {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  } {
    const score = likelihood * impact;
    let level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

    if (score <= 4) level = "LOW";
    else if (score <= 9) level = "MEDIUM";
    else if (score <= 16) level = "HIGH";
    else level = "CRITICAL";

    return { score, level };
  }

  /**
   * Generate risk matrix data for visualization
   */
  async getRiskMatrix(tenantId: string, eventId: string): Promise<RiskMatrixData> {
    const risks = await this.riskRepo.findMany({
      where: { tenantId, eventId, status: { not: "CLOSED" } },
    });

    const matrix: RiskMatrixCell[][] = [];
    for (let likelihood = 5; likelihood >= 1; likelihood--) {
      const row: RiskMatrixCell[] = [];
      for (let impact = 1; impact <= 5; impact++) {
        const cellRisks = risks.filter((r) => r.likelihood === likelihood && r.impact === impact);
        const { level } = this.calculateRiskScore(likelihood, impact);
        row.push({ likelihood, impact, level, risks: cellRisks });
      }
      matrix.push(row);
    }

    return {
      matrix,
      summary: {
        total: risks.length,
        byLevel: {
          LOW: risks.filter((r) => r.riskScore <= 4).length,
          MEDIUM: risks.filter((r) => r.riskScore > 4 && r.riskScore <= 9).length,
          HIGH: risks.filter((r) => r.riskScore > 9 && r.riskScore <= 16).length,
          CRITICAL: risks.filter((r) => r.riskScore > 16).length,
        },
        byStatus: this.groupBy(risks, "status"),
        averageScore:
          risks.length > 0 ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length : 0,
        triggeredCount: risks.filter((r) => r.isTriggered).length,
      },
    };
  }
}

// ── Business Logic: Real-Time Risk Monitoring ──

export class RiskMonitoringEngine {
  constructor(
    private readonly riskRepo: RiskRepository,
    private readonly metricService: MetricService,
    private readonly notificationService: NotificationService,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Runs every 15 minutes via pg-boss scheduled job
   */
  async evaluateRiskTriggers(eventId: string): Promise<void> {
    const risks = await this.riskRepo.findMany({
      where: {
        eventId,
        monitoringField: { not: null },
        isTriggered: false,
        status: { in: ["IDENTIFIED", "ASSESSED", "MITIGATING"] },
      },
    });

    for (const risk of risks) {
      const currentValue = await this.metricService.getValue(eventId, risk.monitoringField!);

      if (currentValue >= risk.monitoringThreshold!) {
        // Trigger the risk
        await this.riskRepo.update({
          where: { id: risk.id },
          data: {
            isTriggered: true,
            status: "MATERIALIZED",
          },
        });

        // Notify mitigation owner
        if (risk.mitigationOwner) {
          await this.notificationService.send({
            templateSlug: "risk-triggered",
            recipientId: risk.mitigationOwner,
            channels: ["EMAIL", "SMS", "PUSH"],
            priority: "URGENT",
            variables: {
              riskTitle: risk.title,
              riskCategory: risk.category,
              riskScore: risk.riskScore,
              triggerCondition: risk.triggerCondition,
              currentValue: currentValue.toString(),
              threshold: risk.monitoringThreshold!.toString(),
              contingencyPlan: risk.contingencyPlan || "No contingency plan defined",
            },
          });
        }

        // Emit to command center
        await this.eventBus.emit({
          type: "RISK_TRIGGERED",
          payload: {
            riskId: risk.id,
            title: risk.title,
            category: risk.category,
            riskScore: risk.riskScore,
            currentValue,
            threshold: risk.monitoringThreshold,
          },
        });
      }
    }
  }
}

// ── Business Logic: Metric Value Resolver ──

export class MetricService {
  async getValue(eventId: string, field: string): Promise<number> {
    switch (field) {
      case "registration_capacity_ratio": {
        const count = await this.db.participant.count({
          where: { eventId, deletedAt: null },
        });
        const capacity = await this.getEventCapacity(eventId);
        return count / capacity;
      }
      case "incident_count_today": {
        return await this.db.incident.count({
          where: {
            eventId,
            reportedAt: { gte: startOfDay(new Date()) },
          },
        });
      }
      case "budget_variance_ratio": {
        const budget = await this.db.eventBudget.findFirst({
          where: { eventId },
        });
        if (!budget) return 0;
        return budget.actualTotal / budget.budgetedTotal;
      }
      case "visa_denial_rate": {
        const total = await this.db.visaTracking.count({
          where: { participant: { eventId } },
        });
        const denied = await this.db.visaTracking.count({
          where: { participant: { eventId }, status: "DENIED" },
        });
        return total > 0 ? denied / total : 0;
      }
      case "compliance_alert_critical_count": {
        return await this.db.complianceAlert.count({
          where: { eventId, severity: "CRITICAL", isResolved: false },
        });
      }
      default:
        throw new Error(`Unknown monitoring field: ${field}`);
    }
  }
}
```

### 5.5 Carbon Footprint Calculator

```typescript
// ── Business Logic: Carbon Footprint Calculator ──

/**
 * ICAO emission factors (kg CO2 per passenger-km)
 */
const FLIGHT_EMISSION_FACTORS = {
  SHORT_HAUL: 0.156, // < 1,500 km
  MEDIUM_HAUL: 0.131, // 1,500 - 4,000 km
  LONG_HAUL: 0.115, // > 4,000 km
};

const RADIATIVE_FORCING_MULTIPLIER = 1.9; // High-altitude emission impact

/**
 * Emission factors per meal type (kg CO2 per meal)
 */
const MEAL_EMISSION_FACTORS: Record<string, number> = {
  standard: 3.8,
  vegetarian: 1.7,
  vegan: 0.9,
  halal: 3.5,
  kosher: 3.5,
  pescatarian: 2.5,
};

/**
 * Ground transport emission factors (kg CO2 per km)
 */
const GROUND_TRANSPORT_FACTORS = {
  bus: 0.089,
  minibus: 0.12,
  car: 0.171,
  taxi: 0.209,
  train: 0.041,
  electric_bus: 0.022,
};

/**
 * Paper emission factors
 */
const PAPER_EMISSION_FACTOR = 0.005; // kg CO2 per sheet of A4

export class CarbonCalculator {
  constructor(
    private readonly participantRepo: ParticipantRepository,
    private readonly carbonRepo: CarbonFootprintRepository,
    private readonly flightDistanceService: FlightDistanceService,
    private readonly cateringService: CateringService,
  ) {}

  async calculateAll(tenantId: string, eventId: string): Promise<CarbonFootprint> {
    const [airTravel, groundTransport, catering, venueEnergy, printing] = await Promise.all([
      this.calculateAirTravel(eventId),
      this.calculateGroundTransport(eventId),
      this.calculateCatering(eventId),
      this.calculateVenueEnergy(eventId),
      this.calculatePrinting(eventId),
    ]);

    const totalKgCO2 = airTravel + groundTransport + catering + venueEnergy + printing;

    // Get existing offset data
    const existing = await this.carbonRepo.findUnique({
      where: { tenantId_eventId: { tenantId, eventId } },
    });

    const offsetsPurchased = existing?.offsetsPurchasedKgCO2 || 0;
    const netKgCO2 = totalKgCO2 - offsetsPurchased;

    // Get paperless metrics
    const paperless = await this.calculatePaperlessMetrics(eventId);

    return await this.carbonRepo.upsert({
      where: { tenantId_eventId: { tenantId, eventId } },
      create: {
        tenantId,
        eventId,
        airTravelKgCO2: airTravel,
        groundTransportKgCO2: groundTransport,
        cateringKgCO2: catering,
        venueEnergyKgCO2: venueEnergy,
        printingKgCO2: printing,
        offsetsPurchasedKgCO2: offsetsPurchased,
        totalKgCO2,
        netKgCO2,
        ...paperless,
      },
      update: {
        airTravelKgCO2: airTravel,
        groundTransportKgCO2: groundTransport,
        cateringKgCO2: catering,
        venueEnergyKgCO2: venueEnergy,
        printingKgCO2: printing,
        totalKgCO2,
        netKgCO2,
        ...paperless,
        calculatedAt: new Date(),
      },
    });
  }

  /**
   * Air travel emissions — typically 70-80% of event carbon footprint
   * Uses ICAO emission factors with radiative forcing multiplier
   */
  async calculateAirTravel(eventId: string): Promise<number> {
    const participants = await this.participantRepo.findMany({
      where: {
        eventId,
        status: { not: "CANCELLED" },
        deletedAt: null,
      },
      select: { id: true, nationality: true },
    });

    const eventCity = await this.getEventCity(eventId);
    let totalKgCO2 = 0;

    for (const p of participants) {
      const distanceKm = await this.flightDistanceService.getDistance(p.nationality, eventCity);

      let factor: number;
      if (distanceKm < 1500) factor = FLIGHT_EMISSION_FACTORS.SHORT_HAUL;
      else if (distanceKm < 4000) factor = FLIGHT_EMISSION_FACTORS.MEDIUM_HAUL;
      else factor = FLIGHT_EMISSION_FACTORS.LONG_HAUL;

      // Round trip × radiative forcing multiplier
      totalKgCO2 += distanceKm * 2 * factor * RADIATIVE_FORCING_MULTIPLIER;
    }

    return Math.round(totalKgCO2);
  }

  /**
   * Catering emissions from meal service data
   */
  async calculateCatering(eventId: string): Promise<number> {
    const dietaryCounts = await this.cateringService.aggregateDietaryData(eventId);
    let totalKgCO2 = 0;

    for (const [type, count] of Object.entries(dietaryCounts)) {
      const factor = MEAL_EMISSION_FACTORS[type] || MEAL_EMISSION_FACTORS.standard;
      totalKgCO2 += count * factor;
    }

    return Math.round(totalKgCO2);
  }

  /**
   * Ground transport from shuttle/vehicle records
   */
  async calculateGroundTransport(eventId: string): Promise<number> {
    const trips = await this.db.vehicleTrip.findMany({
      where: { eventId },
      select: { distanceKm: true, vehicleType: true, passengerCount: true },
    });

    let totalKgCO2 = 0;
    for (const trip of trips) {
      const factor = GROUND_TRANSPORT_FACTORS[trip.vehicleType] || GROUND_TRANSPORT_FACTORS.bus;
      totalKgCO2 += trip.distanceKm * factor * trip.passengerCount;
    }

    return Math.round(totalKgCO2);
  }

  /**
   * Printing emissions from badge and document printing records
   */
  async calculatePrinting(eventId: string): Promise<number> {
    const badgesPrinted = await this.db.badge.count({
      where: { eventId, printedAt: { not: null } },
    });

    const documentPages = await this.db.printJob.aggregate({
      where: { eventId },
      _sum: { pageCount: true },
    });

    const totalPages = badgesPrinted + (documentPages._sum.pageCount || 0);
    return Math.round(totalPages * PAPER_EMISSION_FACTOR);
  }
}
```

---

## 6. User Interface

### 6.1 Compliance Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Compliance Dashboard                    [Run Compliance Check] [Export]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Compliance Overview                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │     96%      │ │      42      │ │      8       │ │    1,203     │  │
│  │  Compliant   │ │ Open Alerts  │ │ Visa Denied  │ │   Scanned    │  │
│  │     ↑ 2%     │ │   12 CRIT    │ │   ⚠ Action   │ │  Last: 2h ago│  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  Document Completion by Type                                            │
│  Passport Copy     ████████████████░ 1,185/1,203  (98.5%)             │
│  Official Photo    ██████████████░░░ 1,142/1,203  (94.9%)             │
│  Nomination Letter ████████████░░░░░ 1,089/1,203  (90.5%)             │
│  Diplomatic Note   ████████░░░░░░░░░   487/612    (79.6%) ⚠           │
│                                                                         │
│  Passport Expiry Alerts                                                 │
│  🔴 12 participants — passport expires BEFORE event                    │
│  🟡 23 participants — passport expires within 6 months of event        │
│  🟢 1,168 participants — passport valid                                │
│                                                                         │
│  Visa Tracking Summary                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐              │
│  │Not Needed│  Issued  │ Applied  │ Pending  │  Denied  │              │
│  │   789    │   312    │    48    │    39    │    8     │              │
│  │  65.6%   │  25.9%   │   4.0%   │   3.2%   │   0.7%   │              │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘              │
│  ⚠ 87 visa applications still pending — event in 12 days              │
│                                                                         │
│  Recent Alerts                                                          │
│  ┌──────┬──────────────┬──────────────────────────┬────────┬──────┐    │
│  │ Sev  │ Participant  │ Alert                    │ Type   │ Age  │    │
│  ├──────┼──────────────┼──────────────────────────┼────────┼──────┤    │
│  │ CRIT │ H.E. Amb. K. │ Passport expires Feb 5   │ EXPIRY │ 2d   │    │
│  │ CRIT │ Dr. Abebe M. │ Visa DENIED by Ethiopia  │ VISA   │ 5d   │    │
│  │ WARN │ Mary J.      │ Missing: Official photo  │ DOC    │ 1d   │    │
│  │ INFO │ Peter O.     │ Photo below 400x500 res  │ PHOTO  │ 3h   │    │
│  └──────┴──────────────┴──────────────────────────┴────────┴──────┘    │
│  Showing 4 of 42 alerts  [View All Alerts]                             │
│                                                                         │
│  [Send Bulk Reminders]  [Export Compliance Report]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Visa Tracking Board

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Visa Tracking Board            Event: 38th AU Summit    [+ Add Visa]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ NOT NEEDED (789) ─┐ ┌─ PENDING (39) ────┐ ┌─ APPLIED (48) ────┐  │
│  │                     │ │                    │ │                    │  │
│  │ Ethiopia (local)    │ │ ┌────────────────┐ │ │ ┌────────────────┐ │  │
│  │ 245 participants    │ │ │ John K. (Kenya)│ │ │ │ Ali M. (Egypt) │ │  │
│  │                     │ │ │ Req: Embassy   │ │ │ │ Applied: Jan 20│ │  │
│  │ South Africa (visa  │ │ │ Addis Ababa    │ │ │ │ Embassy: Cairo │ │  │
│  │ waiver agreement)   │ │ │ Days waiting:  │ │ │ │ Support letter │ │  │
│  │ 89 participants     │ │ │ 14 ⚠          │ │ │ │ sent: ✅        │ │  │
│  │                     │ │ │ [Send Letter]  │ │ │ └────────────────┘ │  │
│  │ ... 38 more         │ │ └────────────────┘ │ │                    │  │
│  │ countries           │ │ ┌────────────────┐ │ │ ... 47 more        │  │
│  │                     │ │ │ Sarah L. (UK)  │ │ │                    │  │
│  │                     │ │ │ Req: E-visa    │ │ │                    │  │
│  └─────────────────────┘ │ │ Days: 7 ⚠     │ │ └────────────────────┘  │
│                          │ └────────────────┘ │                         │
│  ┌─ ISSUED (312) ─────┐ │ ... 37 more        │ ┌─ DENIED (8) ──────┐  │
│  │                     │ └────────────────────┘ │                    │  │
│  │ ✅ 312 visas issued │                        │ 🔴 8 visas denied │  │
│  │ Most recent:        │                        │                    │  │
│  │ Feb 10: 5 visas     │                        │ Dr. Abebe M.      │  │
│  │ Feb 9: 12 visas     │                        │ Embassy: Nairobi  │  │
│  │ Feb 8: 8 visas      │                        │ Reason: Incomplete│  │
│  │                     │                        │ [Appeal] [Reassign│  │
│  └─────────────────────┘                        │                    │  │
│                                                  │ ... 7 more        │  │
│                                                  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Data Retention Configuration

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Data Retention Policies                              [+ New Policy]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Active Policies                                                        │
│  ┌──────────────┬───────┬────────────┬─────────────┬──────┬──────────┐ │
│  │ Entity Type  │ Days  │ Action     │ Legal Basis │Status│ Actions  │ │
│  ├──────────────┼───────┼────────────┼─────────────┼──────┼──────────┤ │
│  │ Participant  │ 365   │ ANONYMIZE  │ GDPR 5(1)(e)│Active│[Edit]    │ │
│  │ Approval     │ 365   │ DELETE     │ GDPR 5(1)(e)│Active│[Edit]    │ │
│  │ Document     │ 180   │ DELETE     │ Data Min.   │Active│[Edit]    │ │
│  │ AccessLog    │ 90    │ ARCHIVE    │ Audit Req.  │Active│[Edit]    │ │
│  │ ConsentRecord│ 730   │ ARCHIVE    │ GDPR 7      │Active│[Edit]    │ │
│  └──────────────┴───────┴────────────┴─────────────┴──────┴──────────┘ │
│                                                                         │
│  Upcoming Executions                                                    │
│  ┌──────────────────────┬──────────┬─────────┬────────────┬──────────┐ │
│  │ Event                │ Entity   │ Records │ Scheduled  │ Action   │ │
│  ├──────────────────────┼──────────┼─────────┼────────────┼──────────┤ │
│  │ 36th AU Summit (2024)│Participant│ 1,542  │ Mar 15, '25│ANONYMIZE │ │
│  │ 36th AU Summit (2024)│ Document │ 4,230  │ Jun 15, '25│ DELETE   │ │
│  │ ECOWAS Conf (2024)   │Participant│  842   │ Apr 1, '25 │ANONYMIZE │ │
│  └──────────────────────┴──────────┴─────────┴────────────┴──────────┘ │
│                                                                         │
│  Execution History                                                      │
│  ┌──────────────────────┬──────────┬─────────┬────────┬──────────────┐ │
│  │ Event                │ Entity   │ Records │ Action │ Executed     │ │
│  ├──────────────────────┼──────────┼─────────┼────────┼──────────────┤ │
│  │ 35th AU Summit (2023)│Participant│ 1,380  │ ANON   │ Jan 15, '25  │ │
│  │ 35th AU Summit (2023)│ AccessLog │12,400  │ARCHIVE │ Oct 15, '24  │ │
│  │ Regional Conf (2023) │ Document │ 2,100  │ DELETE │ Sep 1, '24   │ │
│  └──────────────────────┴──────────┴─────────┴────────┴──────────────┘ │
│                                                                         │
│  [Preview Next Execution]  [Run Manual Retention]  [Export Audit Log]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 GDPR Request Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GDPR Requests                                    [+ New Request]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  3 Received  │ │ 2 Verifying  │ │ 1 Processing │ │ 12 Completed │  │
│  │              │ │              │ │              │ │              │  │
│  │  ⏱ Avg: 2d   │ │  ⏱ Avg: 1d   │ │  ⏱ Avg: 3d   │ │  Total: 18d  │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  Active Requests                                                        │
│  ┌──────┬──────────┬────────────┬──────────┬──────────┬──────────────┐ │
│  │  ID  │  Type    │ Participant│ Status   │ Deadline │   Actions    │ │
│  ├──────┼──────────┼────────────┼──────────┼──────────┼──────────────┤ │
│  │ GR-7 │ Erasure  │ John D.   │ RECEIVED │ Mar 10   │[Verify] [Rej]│ │
│  │ GR-8 │ Access   │ Sarah M.  │ VERIFIED │ Mar 12   │ [Process]    │ │
│  │ GR-9 │ Erasure  │ Ali K.    │PROCESSING│ Mar 15   │ [View Log]   │ │
│  │ GR-6 │ Portabil.│ Emma L.   │ RECEIVED │ Mar 8 ⚠ │[Verify] [Rej]│ │
│  └──────┴──────────┴────────────┴──────────┴──────────┴──────────────┘ │
│                                                                         │
│  Request Detail: GR-9 (Erasure)                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Participant: Ali K. (ali.k@example.com)                        │   │
│  │ Request Type: Right to Erasure                                 │   │
│  │ Submitted: Feb 15, 2026                                        │   │
│  │ Identity Verified: Feb 16, 2026 (Email confirmation)           │   │
│  │ Deadline: Mar 15, 2026 (28 days remaining)                     │   │
│  │                                                                 │   │
│  │ Processing Log:                                                 │   │
│  │  ✅ Identified 1 participant record across 2 events            │   │
│  │  ✅ Deleted 5 documents from blob storage                     │   │
│  │  ✅ Deleted 3 approval records                                │   │
│  │  ⏳ Deleting 142 access log entries...                        │   │
│  │  ⬜ Delete consent records                                    │   │
│  │  ⬜ Delete visa tracking                                      │   │
│  │  ⬜ Delete participant record                                 │   │
│  │  ⬜ Send confirmation email                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Risk Register Table

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Risk Register — 38th AU Summit         [+ Add Risk] [Matrix View]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Summary: 18 risks | 3 Critical | 5 High | 7 Medium | 3 Low          │
│  Triggered: 1 | Mitigating: 6 | Accepted: 4                          │
│                                                                         │
│  Filter: [All Categories ▾] [All Status ▾] [All Scores ▾] 🔍 Search  │
│                                                                         │
│  ┌─────┬────────────────────────┬────────────┬───┬───┬─────┬─────────┐│
│  │Score│ Title                  │ Category   │ L │ I │Level│ Status  ││
│  ├─────┼────────────────────────┼────────────┼───┼───┼─────┼─────────┤│
│  │ 🔴25│ Terrorist threat       │ SECURITY   │ 5 │ 5 │CRIT │MITIGATING│
│  │ 🔴20│ Power failure (full)   │ TECHNICAL  │ 4 │ 5 │CRIT │MITIGATING│
│  │ 🔴20│ VIP cancellation      │ POLITICAL  │ 4 │ 5 │CRIT │ ACCEPTED│
│  │ 🟠15│ Overcrowding          │ OPERATIONAL│ 5 │ 3 │HIGH │⚡TRIGGER ││
│  │ 🟠12│ Registration delays   │ OPERATIONAL│ 4 │ 3 │HIGH │MITIGATING│
│  │ 🟠12│ Food safety incident  │ HEALTH     │ 3 │ 4 │HIGH │MITIGATING│
│  │ 🟡 9│ Vendor no-show        │ LOGISTICS  │ 3 │ 3 │ MED │ ASSESSED│
│  │ 🟡 8│ Badge printer failure │ TECHNICAL  │ 2 │ 4 │ MED │MITIGATING│
│  │ 🟡 6│ Protest outside venue  │ POLITICAL  │ 2 │ 3 │ MED │ ACCEPTED│
│  │ 🟢 4│ Earthquake            │ WEATHER    │ 1 │ 4 │ LOW │ ACCEPTED│
│  └─────┴────────────────────────┴────────────┴───┴───┴─────┴─────────┘│
│  Showing 10 of 18 risks  [Load More]                                  │
│                                                                         │
│  [Export Risk Report]  [Evaluate Triggers]  [Post-Event Review]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Risk Matrix Visualization (5×5 Heat Map)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Risk Matrix — 38th AU Summit                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                              IMPACT                                     │
│          1-Negligible  2-Minor   3-Moderate  4-Major  5-Catastrophic   │
│         ┌───────────┬──────────┬──────────┬─────────┬──────────────┐   │
│ 5-Almost│           │          │  ⬤ Over- │ ⬤ Power │  ⬤ Terrorist │   │
│  Certain│   LOW     │  MEDIUM  │  crowd   │ failure │    threat    │   │
│         │   (5)     │  (10)    │  (15)    │  (20)   │    (25)      │   │
│         ├───────────┼──────────┼──────────┼─────────┼──────────────┤   │
│ 4-Likely│           │          │ ⬤ Reg    │ ⬤ VIP   │              │   │
│         │   LOW     │  MEDIUM  │ delays   │ cancel  │    HIGH      │   │
│         │   (4)     │  (8)     │  (12)    │  (16)   │    (20)      │   │
│ L       ├───────────┼──────────┼──────────┼─────────┼──────────────┤   │
│ I 3-Poss│           │ ⬤ Vendor │ ⬤ Food   │         │              │   │
│ K       │   LOW     │ no-show  │  safety  │  HIGH   │   CRITICAL   │   │
│ E       │   (3)     │  (6)     │  (9)     │  (12)   │    (15)      │   │
│ L       ├───────────┼──────────┼──────────┼─────────┼──────────────┤   │
│ I 2-Unl │           │ ⬤ Badge  │          │ ⬤ Prot- │              │   │
│ H       │   LOW     │ printer  │  MEDIUM  │  est    │   CRITICAL   │   │
│ O       │   (2)     │  (4)     │  (6)     │  (8)    │    (10)      │   │
│ O       ├───────────┼──────────┼──────────┼─────────┼──────────────┤   │
│ D 1-Rare│           │          │          │         │ ⬤ Earthquake │   │
│         │   LOW     │   LOW    │   LOW    │ MEDIUM  │              │   │
│         │   (1)     │   (2)    │   (3)    │  (4)    │    (5)       │   │
│         └───────────┴──────────┴──────────┴─────────┴──────────────┘   │
│                                                                         │
│  Legend: 🟢 Low (1-4)  🟡 Medium (5-9)  🟠 High (10-16)  🔴 Crit (17+)│
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.7 Contingency Checklist Manager

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Checklists — 38th AU Summit              [+ New Checklist] [Templates]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌── PRE_EVENT ──────────────────────────────────────────────────────┐ │
│  │ ✅ Venue Setup Verification (12/12 items) — Completed Feb 8      │ │
│  │ ✅ IT Infrastructure Test (8/8 items) — Completed Feb 9           │ │
│  │ ⏳ Staff Briefing & Training (4/7 items) — Due: Feb 10           │ │
│  │ ⬜ Final Security Walkthrough (0/10 items) — Due: Feb 11          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌── EMERGENCY ──────────────────────────────────────────────────────┐ │
│  │ ⬜ Emergency: Venue Power Failure (12 items)                      │ │
│  │ ⬜ Emergency: Medical Emergency (8 items)                         │ │
│  │ ⬜ Emergency: Security Threat (15 items)                          │ │
│  │ ⬜ Emergency: Fire Evacuation (10 items)                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Checklist Detail: Staff Briefing & Training                           │
│  Assigned to: HR Team  |  Due: Feb 10, 2026  |  Status: IN_PROGRESS   │
│  ┌───┬──────────────────────────────────────────────┬────────┬───────┐ │
│  │ # │ Item                                         │ Status │ Done  │ │
│  ├───┼──────────────────────────────────────────────┼────────┼───────┤ │
│  │ 1 │ ✅ Complete volunteer orientation sessions    │ Mary K.│ Feb 6 │ │
│  │ 2 │ ✅ Distribute walkie-talkies and test comms   │ John M.│ Feb 7 │ │
│  │ 3 │ ✅ Brief protocol team on VIP procedures      │ Sarah L│ Feb 8 │ │
│  │ 4 │ ✅ Test badge scanner at all entry points     │ IT Team│ Feb 8 │ │
│  │ 5 │ ⬜ Run emergency drill with full staff        │        │       │ │
│  │ 6 │ ⬜ Brief medical team on venue layout          │        │       │ │
│  │ 7 │ ⬜ Final headcount confirmation               │        │       │ │
│  └───┴──────────────────────────────────────────────┴────────┴───────┘ │
│                                                                         │
│  [Add Item]  [Assign All]  [Mark Checklist Complete]                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.8 Sustainability Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Sustainability Report — 38th AU Summit      [Recalculate] [Export PDF]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CARBON FOOTPRINT                                                       │
│  Total: 4,850 tonnes CO2e        Net: -150t CO2e  ✅ CARBON NEUTRAL   │
│                                                                         │
│  Breakdown by Category                                                  │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │  Air Travel          ██████████████████████████ 3,880t (80%) │      │
│  │  Ground Transport    ██░░░░░░░░░░░░░░░░░░░░░░░   340t  (7%) │      │
│  │  Catering            █░░░░░░░░░░░░░░░░░░░░░░░░   290t  (6%) │      │
│  │  Venue Energy        █░░░░░░░░░░░░░░░░░░░░░░░░   240t  (5%) │      │
│  │  Printing            ░░░░░░░░░░░░░░░░░░░░░░░░░   100t  (2%) │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  Offsets Purchased: 5,000t CO2e ($75,000 via Gold Standard)            │
│  Net Footprint: -150t CO2e  ✅                                         │
│                                                                         │
│  PAPERLESS IMPACT                                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │ Digital Badges   │ │ Pages Avoided    │ │ Paper Saved      │        │
│  │ 1,800 / 2,400   │ │ 12,400 pages     │ │ ~62 kg           │        │
│  │ 75% adoption    │ │ via digital dist │ │ ≈ 1 tree          │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                         │
│  vs. PREVIOUS EVENT (37th Summit)                                      │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ Carbon:        5,200t → 4,850t     (-6.7%)  ✅ Improving │         │
│  │ Digital Badges: 45%  → 75%         (+30pp)  ✅ Improving │         │
│  │ Paper Saved:    38kg → 62kg        (+63%)   ✅ Improving │         │
│  │ Offset %:       80%  → 103%        (+23pp)  ✅ Surplus   │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                         │
│  SUSTAINABILITY GOALS                                                   │
│  ┌──────────────────────────┬────────┬────────┬────────┬──────────┐    │
│  │ Goal                     │ Target │Current │Progress│ Status   │    │
│  ├──────────────────────────┼────────┼────────┼────────┼──────────┤    │
│  │ Reduce carbon by 10%    │  10%   │  6.7%  │  67%   │ AT_RISK  │    │
│  │ 80% digital badges      │  80%   │  75%   │  94%   │ ON_TRACK │    │
│  │ Carbon neutral event    │ 100%   │ 103%   │ 100%   │ ACHIEVED │    │
│  │ Zero single-use plastic │ 100%   │  85%   │  85%   │ AT_RISK  │    │
│  └──────────────────────────┴────────┴────────┴────────┴──────────┘    │
│                                                                         │
│  [Add Goal]  [Record Offset Purchase]  [Download Sustainability Report]│
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.9 Consent Management Panel

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Consent Management — 38th AU Summit                    [Export Audit] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Consent Coverage                                                       │
│  ┌───────────────────────┬──────────┬──────────┬──────────┐            │
│  │ Consent Type          │ Granted  │ Revoked  │ Pending  │            │
│  ├───────────────────────┼──────────┼──────────┼──────────┤            │
│  │ Data Processing       │ 1,180    │    12    │    11    │            │
│  │ Photo Usage           │ 1,156    │    35    │    12    │            │
│  │ Communication         │ 1,102    │    89    │    12    │            │
│  │ Badge Display         │ 1,175    │    16    │    12    │            │
│  └───────────────────────┴──────────┴──────────┴──────────┘            │
│                                                                         │
│  Search Participant: [_______________________________] [Search]        │
│                                                                         │
│  Participant: Dr. Abebe Kebede                                         │
│  ┌───────────────────────┬─────────┬────────────┬─────────────────┐    │
│  │ Consent Type          │ Status  │ Last Changed│ Policy Version  │    │
│  ├───────────────────────┼─────────┼────────────┼─────────────────┤    │
│  │ Data Processing       │ ✅ Yes  │ Jan 15, '26│ v2.1            │    │
│  │ Photo Usage           │ ✅ Yes  │ Jan 15, '26│ v2.1            │    │
│  │ Communication         │ ❌ No   │ Feb 1, '26 │ v2.1 (revoked)  │    │
│  │ Badge Display         │ ✅ Yes  │ Jan 15, '26│ v2.1            │    │
│  └───────────────────────┴─────────┴────────────┴─────────────────┘    │
│                                                                         │
│  Audit Trail for: Communication Consent                                │
│  ┌────────────────┬──────────┬─────────────┬──────────────────────┐    │
│  │ Timestamp      │ Action   │ Changed By  │ Details              │    │
│  ├────────────────┼──────────┼─────────────┼──────────────────────┤    │
│  │ Feb 1, 10:30   │ REVOKED  │ Dr. Abebe   │ Self-service revoke  │    │
│  │ Jan 15, 09:15  │ GRANTED  │ Dr. Abebe   │ During registration  │    │
│  └────────────────┴──────────┴─────────────┴──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.10 Component Specifications

| Component                 | Props                     | Accessibility                         | Responsive                  |
| ------------------------- | ------------------------- | ------------------------------------- | --------------------------- |
| `ComplianceDashboard`     | `tenantId, eventId`       | ARIA live regions for alert counts    | Stack KPI cards on mobile   |
| `VisaTrackingBoard`       | `tenantId, eventId`       | Keyboard navigation between columns   | Single column on mobile     |
| `RiskMatrix`              | `risks, onRiskClick`      | Screen reader labels for each cell    | Scrollable on small screens |
| `RiskRegisterTable`       | `risks, onSort, onFilter` | Sortable column headers with ARIA     | Horizontal scroll on mobile |
| `ChecklistManager`        | `checklists, onToggle`    | Checkbox ARIA states                  | Full width on mobile        |
| `SustainabilityDashboard` | `tenantId, eventId`       | Chart descriptions for screen readers | Stack charts vertically     |
| `ConsentPanel`            | `participantId`           | Form labels, error announcements      | Single column on mobile     |
| `GDPRRequestWorkflow`     | `requestId`               | Progress indicator ARIA               | Simplified mobile layout    |
| `DataRetentionConfig`     | `tenantId`                | Table navigation with ARIA            | Scrollable table on mobile  |
| `ComplianceAlertList`     | `alerts, onResolve`       | Alert severity announcements          | Card layout on mobile       |

---

## 7. Integration Points

### 7.1 Module Integration Matrix

| Source Module | Target Module          | Direction     | Data Exchanged                                     | Integration Method    | Trigger                |
| ------------- | ---------------------- | ------------- | -------------------------------------------------- | --------------------- | ---------------------- |
| **15 → 01**   | Data Model Foundation  | Bidirectional | Tenant, Event, Participant base entities           | Shared Prisma schema  | Every request          |
| **15 → 04**   | Workflow Engine        | Bidirectional | Compliance gates block workflow progression        | Domain events, guards | Workflow transitions   |
| **15 → 05**   | Security & Access      | Inbound       | RBAC permissions, audit framework                  | Middleware            | Every request          |
| **15 → 06**   | Infrastructure         | Bidirectional | Background jobs (compliance scans, retention)      | pg-boss queue         | Scheduled              |
| **15 → 07**   | API & Integration      | Outbound      | SSE compliance alerts, webhook notifications       | Event streams         | Alert creation         |
| **15 → 09**   | Registration           | Bidirectional | Document compliance gates, consent at registration | Domain events         | Registration lifecycle |
| **15 → 10**   | Event Operations       | Outbound      | Risk alerts for command center, compliance widgets | SSE events            | Real-time              |
| **15 → 11**   | Logistics & Venue      | Inbound       | Transport/catering data for carbon calculation     | Data queries          | Carbon recalculation   |
| **15 → 12**   | Protocol               | Bidirectional | VIP compliance status, diplomatic immunity rules   | Shared services       | Protocol operations    |
| **15 → 13**   | People & Workforce     | Bidirectional | Staff compliance, certification tracking           | Domain events         | Staff management       |
| **15 → 14**   | Content & Documents    | Outbound      | Expiry notifications, compliance report generation | Template engine       | Alert escalation       |
| **15 → 16**   | Participant Experience | Outbound      | Consent UI in registration, sustainability badges  | Mobile API            | Participant actions    |
| **15 → 17**   | Settings & Config      | Bidirectional | Compliance settings registry                       | Settings API          | Config changes         |

### 7.2 Key Integration: Workflow Compliance Gates (Module 04)

```typescript
// ── Integration: Compliance gate in workflow engine ──

export class ComplianceWorkflowGuard {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly alertRepo: ComplianceAlertRepository,
  ) {}

  /**
   * Called by Module 04 workflow engine before allowing state transitions
   * Returns true if participant passes all compliance checks
   */
  async canTransition(
    participantId: string,
    targetState: string,
    eventId: string,
  ): Promise<{ allowed: boolean; blockers: string[] }> {
    const blockers: string[] = [];

    if (targetState === "APPROVED" || targetState === "ACCREDITED") {
      // Check for unresolved CRITICAL alerts
      const criticalAlerts = await this.alertRepo.findMany({
        where: {
          participantId,
          eventId,
          severity: "CRITICAL",
          isResolved: false,
        },
      });

      if (criticalAlerts.length > 0) {
        blockers.push(...criticalAlerts.map((a) => `${a.alertType}: ${a.details}`));
      }

      // Check mandatory consents
      const requiredConsents = ["DATA_PROCESSING", "PHOTO_USAGE"];
      for (const type of requiredConsents) {
        const consent = await this.complianceService.getConsent(participantId, type);
        if (!consent || !consent.granted) {
          blockers.push(`Missing consent: ${type}`);
        }
      }
    }

    return {
      allowed: blockers.length === 0,
      blockers,
    };
  }
}
```

### 7.3 Key Integration: Command Center Risk Feed (Module 10)

```typescript
// ── Integration: Real-time risk alerts for command center ──

export class RiskCommandCenterBridge {
  constructor(
    private readonly sseService: SSEService,
    private readonly eventBus: EventBus,
  ) {
    // Subscribe to risk events
    this.eventBus.on("RISK_TRIGGERED", this.onRiskTriggered.bind(this));
    this.eventBus.on("COMPLIANCE_ALERT_CRITICAL", this.onCriticalAlert.bind(this));
  }

  private async onRiskTriggered(event: RiskTriggeredEvent): Promise<void> {
    await this.sseService.broadcast(
      event.payload.tenantId,
      event.payload.eventId,
      "COMMAND_CENTER",
      {
        type: "RISK_ALERT",
        severity: "CRITICAL",
        title: `Risk Triggered: ${event.payload.title}`,
        category: event.payload.category,
        riskScore: event.payload.riskScore,
        contingencyPlan: event.payload.contingencyPlan,
        timestamp: new Date().toISOString(),
      },
    );
  }

  private async onCriticalAlert(event: ComplianceAlertEvent): Promise<void> {
    await this.sseService.broadcast(
      event.payload.tenantId,
      event.payload.eventId,
      "COMMAND_CENTER",
      {
        type: "COMPLIANCE_ALERT",
        severity: event.payload.severity,
        title: `Compliance: ${event.payload.alertType}`,
        details: event.payload.details,
        participantId: event.payload.participantId,
        timestamp: new Date().toISOString(),
      },
    );
  }
}
```

### 7.4 Key Integration: Carbon Data from Logistics (Module 11)

```typescript
// ── Integration: Transport and catering data for carbon calculation ──

export class LogisticsCarbonBridge {
  constructor(
    private readonly carbonCalculator: CarbonCalculator,
    private readonly eventBus: EventBus,
  ) {
    // Recalculate when transport or catering data changes
    this.eventBus.on("TRANSPORT_TRIP_COMPLETED", this.onTransportUpdate.bind(this));
    this.eventBus.on("MEAL_SERVICE_COMPLETED", this.onCateringUpdate.bind(this));
  }

  private async onTransportUpdate(event: TransportEvent): Promise<void> {
    await this.carbonCalculator.recalculateCategory(
      event.payload.tenantId,
      event.payload.eventId,
      "GROUND_TRANSPORT",
    );
  }

  private async onCateringUpdate(event: CateringEvent): Promise<void> {
    await this.carbonCalculator.recalculateCategory(
      event.payload.tenantId,
      event.payload.eventId,
      "CATERING",
    );
  }
}
```

---

## 8. Configuration

### 8.1 Settings Keys

| Key                                           | Type       | Default       | Scope  | Description                       |
| --------------------------------------------- | ---------- | ------------- | ------ | --------------------------------- |
| `compliance.scan.scheduleCron`                | `string`   | `'0 2 * * *'` | System | Compliance scan schedule          |
| `compliance.scan.notifyOnComplete`            | `boolean`  | `true`        | Tenant | Email scan results to admins      |
| `compliance.passport.minValidityMonths`       | `number`   | `6`           | Tenant | Minimum passport validity         |
| `compliance.passport.expiryWarningDays`       | `number[]` | `[90,30,7,1]` | Tenant | Warning thresholds                |
| `compliance.visa.deadlineWarningDays`         | `number`   | `30`          | Tenant | Days before event to warn         |
| `compliance.photo.minWidth`                   | `number`   | `400`         | System | Minimum photo width (px)          |
| `compliance.photo.minHeight`                  | `number`   | `500`         | System | Minimum photo height (px)         |
| `compliance.gdpr.erasureDeadlineDays`         | `number`   | `30`          | System | GDPR erasure deadline             |
| `compliance.gdpr.autoDeleteExports`           | `number`   | `7`           | System | Days to keep data exports         |
| `compliance.retention.executionTime`          | `string`   | `'02:00'`     | System | Daily retention job time          |
| `compliance.retention.dryRunFirst`            | `boolean`  | `true`        | Tenant | Preview before executing          |
| `compliance.alert.escalationHours`            | `number[]` | `[24,72,168]` | Tenant | Hours between escalations         |
| `compliance.alert.maxEscalationLevel`         | `number`   | `3`           | Tenant | Maximum escalation levels         |
| `risk.monitoring.intervalMinutes`             | `number`   | `15`          | System | Risk monitoring frequency         |
| `risk.monitoring.alertThreshold`              | `number`   | `15`          | Tenant | Score threshold for auto-alert    |
| `risk.checklist.templateLibrary`              | `boolean`  | `true`        | System | Enable checklist templates        |
| `sustainability.carbon.autoRecalculate`       | `boolean`  | `true`        | Event  | Auto-recalculate on data change   |
| `sustainability.carbon.emissionFactorSource`  | `string`   | `'ICAO_2024'` | System | Emission factor dataset           |
| `sustainability.goals.trackAutomatically`     | `boolean`  | `true`        | Event  | Auto-update goal progress         |
| `sustainability.paperless.countDigitalBadges` | `boolean`  | `true`        | Event  | Include digital badges in metrics |

### 8.2 Feature Flags

| Flag                                 | Default | Description                         |
| ------------------------------------ | ------- | ----------------------------------- |
| `FF_COMPLIANCE_BATCH_SCANNER`        | `true`  | Automated compliance scanning       |
| `FF_COMPLIANCE_GDPR_MODULE`          | `true`  | GDPR request processing             |
| `FF_COMPLIANCE_VISA_SUPPORT_LETTERS` | `true`  | Auto-generate visa support letters  |
| `FF_COMPLIANCE_PHOTO_QUALITY_CHECK`  | `false` | AI-based photo quality validation   |
| `FF_COMPLIANCE_CONSENT_AUDIT`        | `true`  | Immutable consent audit trail       |
| `FF_RISK_REAL_TIME_MONITORING`       | `true`  | Real-time risk threshold monitoring |
| `FF_RISK_POST_EVENT_REVIEW`          | `true`  | Post-event lessons learned capture  |
| `FF_RISK_CHECKLIST_TEMPLATES`        | `true`  | Predefined checklist templates      |
| `FF_SUSTAINABILITY_CARBON_CALC`      | `true`  | Carbon footprint calculator         |
| `FF_SUSTAINABILITY_GOALS`            | `true`  | Sustainability goal tracking        |
| `FF_SUSTAINABILITY_OFFSET_MGMT`      | `true`  | Carbon offset management            |
| `FF_SUSTAINABILITY_YOY_COMPARISON`   | `true`  | Year-over-year comparison           |
| `FF_COMPLIANCE_REGULATORY_FRAMEWORK` | `false` | Multi-regulation framework support  |
| `FF_COMPLIANCE_AUTO_ESCALATION`      | `true`  | Automatic alert escalation          |

### 8.3 Environment Variables

```typescript
import { z } from "zod";

export const ComplianceEnvSchema = z.object({
  // Compliance Scanner
  COMPLIANCE_SCAN_CRON: z.string().default("0 2 * * *"),
  COMPLIANCE_SCAN_BATCH_SIZE: z.coerce.number().int().default(100),
  COMPLIANCE_SCAN_TIMEOUT_MS: z.coerce.number().int().default(300000),

  // Data Retention
  RETENTION_EXECUTION_TIME: z.string().default("02:00"),
  RETENTION_DRY_RUN: z.enum(["true", "false"]).default("true"),
  RETENTION_ARCHIVE_CONTAINER: z.string().default("retention-archives"),

  // GDPR
  GDPR_ERASURE_DEADLINE_DAYS: z.coerce.number().int().default(30),
  GDPR_EXPORT_CONTAINER: z.string().default("gdpr-exports"),
  GDPR_EXPORT_TTL_DAYS: z.coerce.number().int().default(7),

  // Risk Monitoring
  RISK_MONITOR_INTERVAL_MINUTES: z.coerce.number().int().default(15),
  RISK_ALERT_THRESHOLD: z.coerce.number().int().default(15),

  // Sustainability
  CARBON_EMISSION_FACTOR_SOURCE: z.string().default("ICAO_2024"),
  CARBON_RECALC_DEBOUNCE_MS: z.coerce.number().int().default(60000),

  // Background Jobs
  COMPLIANCE_JOB_CONCURRENCY: z.coerce.number().int().default(3),
  COMPLIANCE_JOB_RETENTION_DAYS: z.coerce.number().int().default(90),
});
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// ── tests/unit/compliance/compliance-scanner.test.ts ──

describe("ComplianceScanner", () => {
  describe("checkParticipant — passport expiry", () => {
    it("should flag CRITICAL when passport expires before event", async () => {
      const participant = createMockParticipant({
        customData: { passportExpiry: "2026-02-05" },
      });
      const event = createMockEvent({ startDate: "2026-02-10" });

      const alerts = await scanner.checkParticipant(participant, event);

      expect(alerts).toContainEqual(
        expect.objectContaining({
          alertType: "PASSPORT_EXPIRING",
          severity: "CRITICAL",
        }),
      );
    });

    it("should flag WARNING when passport expires within 6 months", async () => {
      const participant = createMockParticipant({
        customData: { passportExpiry: "2026-06-01" },
      });
      const event = createMockEvent({ startDate: "2026-02-10" });

      const alerts = await scanner.checkParticipant(participant, event);

      expect(alerts).toContainEqual(
        expect.objectContaining({
          alertType: "PASSPORT_EXPIRING",
          severity: "WARNING",
        }),
      );
    });

    it("should not flag when passport valid beyond 6 months", async () => {
      const participant = createMockParticipant({
        customData: { passportExpiry: "2027-12-01" },
      });
      const event = createMockEvent({ startDate: "2026-02-10" });

      const alerts = await scanner.checkParticipant(participant, event);

      expect(alerts.filter((a) => a.alertType === "PASSPORT_EXPIRING")).toHaveLength(0);
    });
  });

  describe("checkParticipant — visa status", () => {
    it("should flag CRITICAL when visa is DENIED", async () => {
      mockVisaRepo.findUnique.mockResolvedValue(
        createMockVisa({ status: "DENIED", embassy: "Nairobi" }),
      );

      const alerts = await scanner.checkParticipant(participant, event);

      expect(alerts).toContainEqual(
        expect.objectContaining({
          alertType: "VISA_DENIED",
          severity: "CRITICAL",
        }),
      );
    });
  });

  describe("deduplication", () => {
    it("should not create duplicate alerts for same issue", async () => {
      mockAlertRepo.findFirst.mockResolvedValue(
        createMockAlert({ alertType: "PASSPORT_EXPIRING", isResolved: false }),
      );

      await scanner.runFullScan(tenantId, eventId, "SYSTEM");

      expect(mockAlertRepo.create).not.toHaveBeenCalled();
    });

    it("should escalate severity when issue worsens", async () => {
      mockAlertRepo.findFirst.mockResolvedValue(
        createMockAlert({ severity: "WARNING", escalationLevel: 0 }),
      );

      await scanner.runFullScan(tenantId, eventId, "SYSTEM");

      expect(mockAlertRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ severity: "CRITICAL", escalationLevel: 1 }),
        }),
      );
    });
  });
});
```

### 9.2 Integration Tests

```typescript
// ── tests/integration/compliance/retention-execution.test.ts ──

describe("Data Retention Execution (Integration)", () => {
  it("should anonymize participant records after retention period", async () => {
    // Setup: Create event that ended 400 days ago
    const event = await createTestEvent({ endDate: dayjs().subtract(400, "days").toDate() });
    const participant = await createTestParticipant({ eventId: event.id });

    // Create retention policy: 365 days, ANONYMIZE
    await createTestRetentionPolicy({
      tenantId: event.tenantId,
      entityType: "Participant",
      retentionDays: 365,
      action: "ANONYMIZE",
    });

    // Execute retention
    await retentionEngine.executeScheduledRetention();

    // Verify anonymization
    const updated = await db.participant.findUnique({ where: { id: participant.id } });
    expect(updated?.firstName).toMatch(/^ANON-/);
    expect(updated?.email).toMatch(/@redacted\.local$/);
    expect(updated?.passportNumber).toBeNull();

    // Verify execution record created
    const execution = await db.dataRetentionExecution.findFirst({
      where: { eventId: event.id },
    });
    expect(execution).toBeTruthy();
    expect(execution?.recordsProcessed).toBe(1);
    expect(execution?.action).toBe("ANONYMIZE");
  });

  it("should not process events still within retention period", async () => {
    const event = await createTestEvent({ endDate: dayjs().subtract(100, "days").toDate() });
    await createTestRetentionPolicy({
      tenantId: event.tenantId,
      entityType: "Participant",
      retentionDays: 365,
      action: "ANONYMIZE",
    });

    await retentionEngine.executeScheduledRetention();

    const execution = await db.dataRetentionExecution.findFirst({
      where: { eventId: event.id },
    });
    expect(execution).toBeNull();
  });
});
```

### 9.3 E2E Tests

```typescript
// ── tests/e2e/compliance/compliance-dashboard.spec.ts ──

test.describe("Compliance Dashboard", () => {
  test("should run compliance scan and display results", async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto("/compliance/dashboard");

    await page.getByRole("button", { name: "Run Compliance Check" }).click();

    // Wait for scan to complete
    await expect(page.getByText("Scan complete")).toBeVisible({ timeout: 30000 });

    // Verify KPI cards updated
    await expect(page.getByTestId("compliance-rate")).toContainText("%");
    await expect(page.getByTestId("open-alerts")).toBeVisible();

    // Verify alerts table populated
    const alertRows = page.getByTestId("alert-row");
    await expect(alertRows.first()).toBeVisible();
  });

  test("should resolve a compliance alert", async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto("/compliance/alerts");

    await page.getByTestId("alert-row").first().click();
    await page.getByRole("button", { name: "Resolve" }).click();
    await page.getByLabel("Resolution Note").fill("Document updated by participant");
    await page.getByRole("button", { name: "Confirm Resolve" }).click();

    await expect(page.getByText("Alert resolved")).toBeVisible();
  });
});
```

### 9.4 Test Data Factories

```typescript
export function createMockAlert(overrides: Partial<ComplianceAlert> = {}): ComplianceAlert {
  return {
    id: faker.string.uuid(),
    tenantId: "test-tenant",
    eventId: "test-event",
    participantId: faker.string.uuid(),
    alertType: "PASSPORT_EXPIRING",
    details: "Passport expires Feb 5, 2026",
    severity: "WARNING",
    isResolved: false,
    resolvedAt: null,
    resolvedBy: null,
    escalationLevel: 0,
    createdAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockRisk(overrides: Partial<RiskRegister> = {}): RiskRegister {
  return {
    id: faker.string.uuid(),
    tenantId: "test-tenant",
    eventId: "test-event",
    title: faker.lorem.words(4),
    description: faker.lorem.paragraph(),
    category: "OPERATIONAL",
    likelihood: 3,
    impact: 3,
    riskScore: 9,
    status: "IDENTIFIED",
    mitigationPlan: faker.lorem.paragraph(),
    mitigationOwner: faker.string.uuid(),
    isTriggered: false,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
```

---

## 10. Security Considerations

### 10.1 RBAC Permission Matrix

| Permission            | Compliance Officer | DPO | Risk Manager | Sustainability Coord. | Event Admin |  Viewer   |
| --------------------- | :----------------: | :-: | :----------: | :-------------------: | :---------: | :-------: |
| Run compliance scan   |         ✅         | ✅  |      ❌      |          ❌           |     ✅      |    ❌     |
| View/resolve alerts   |         ✅         | ✅  |      ❌      |          ❌           |     ✅      | ✅ (view) |
| Manage visa tracking  |         ✅         | ❌  |      ❌      |          ❌           |     ✅      | ✅ (view) |
| Manage consents       |         ❌         | ✅  |      ❌      |          ❌           |     ❌      |    ❌     |
| Configure retention   |         ❌         | ✅  |      ❌      |          ❌           |     ❌      |    ❌     |
| Execute retention     |         ❌         | ✅  |      ❌      |          ❌           |     ❌      |    ❌     |
| Process GDPR requests |         ❌         | ✅  |      ❌      |          ❌           |     ❌      |    ❌     |
| CRUD risks            |         ❌         | ❌  |      ✅      |          ❌           |     ✅      |    ❌     |
| View risk matrix      |         ✅         | ❌  |      ✅      |          ❌           |     ✅      |    ✅     |
| Manage checklists     |         ❌         | ❌  |      ✅      |          ❌           |     ✅      |    ❌     |
| View carbon footprint |         ❌         | ❌  |      ❌      |          ✅           |     ✅      |    ✅     |
| Record offsets        |         ❌         | ❌  |      ❌      |          ✅           |     ✅      |    ❌     |
| Manage goals          |         ❌         | ❌  |      ❌      |          ✅           |     ✅      |    ❌     |
| Generate reports      |         ✅         | ✅  |      ✅      |          ✅           |     ✅      |    ❌     |

### 10.2 Data Protection

- **Consent records** are immutable — revocations create new audit log entries, original grant records preserved
- **GDPR data exports** are encrypted at rest, stored in isolated Azure Blob container, auto-deleted after `GDPR_EXPORT_TTL_DAYS`
- **Data retention execution** logs are retained indefinitely (even after data deletion) to prove compliance
- **Risk register** entries with contingency plans may contain sensitive security procedures — access restricted to Risk Manager role
- **Passport/visa data** is PII — encrypted at rest, masked in audit logs, never exposed in SSE streams

### 10.3 Audit Events

| Event                        | Severity | Logged Fields                                        |
| ---------------------------- | -------- | ---------------------------------------------------- |
| `COMPLIANCE_SCAN_COMPLETED`  | INFO     | scanId, totalChecked, alertsGenerated, duration      |
| `COMPLIANCE_ALERT_CREATED`   | INFO     | alertId, alertType, severity, participantId          |
| `COMPLIANCE_ALERT_RESOLVED`  | INFO     | alertId, resolvedBy, resolvedNote                    |
| `COMPLIANCE_ALERT_ESCALATED` | WARN     | alertId, fromLevel, toLevel, notifiedUser            |
| `CONSENT_GRANTED`            | INFO     | participantId, consentType, policyVersion, ipAddress |
| `CONSENT_REVOKED`            | WARN     | participantId, consentType, revokedBy                |
| `GDPR_REQUEST_RECEIVED`      | INFO     | requestId, requestType, participantId                |
| `GDPR_ERASURE_COMPLETED`     | WARN     | requestId, affectedRecords                           |
| `RETENTION_EXECUTED`         | WARN     | policyId, eventId, action, recordsProcessed          |
| `RISK_CREATED`               | INFO     | riskId, title, category, riskScore                   |
| `RISK_TRIGGERED`             | CRITICAL | riskId, title, currentValue, threshold               |
| `RISK_STATUS_CHANGED`        | INFO     | riskId, fromStatus, toStatus                         |
| `CARBON_RECALCULATED`        | INFO     | eventId, totalKgCO2, netKgCO2                        |

---

## 11. Performance Requirements

### 11.1 Response Time Targets

| Operation                             | P50   | P95   | P99   | Max   | Notes                        |
| ------------------------------------- | ----- | ----- | ----- | ----- | ---------------------------- |
| Load compliance dashboard             | 150ms | 400ms | 800ms | 2s    | Aggregation queries, cached  |
| Run compliance scan (1K participants) | 5s    | 15s   | 30s   | 60s   | Background job, async        |
| Resolve single alert                  | 50ms  | 150ms | 300ms | 500ms | Single write                 |
| Load visa tracking board              | 100ms | 300ms | 600ms | 1s    | Paginated                    |
| Load risk matrix                      | 80ms  | 200ms | 400ms | 800ms | Cached query                 |
| Risk monitoring evaluation            | 2s    | 5s    | 10s   | 30s   | All risks per event          |
| Calculate carbon footprint            | 3s    | 10s   | 20s   | 60s   | Depends on participant count |
| Load sustainability dashboard         | 150ms | 400ms | 800ms | 2s    | Cached                       |
| GDPR erasure processing               | 10s   | 30s   | 60s   | 300s  | Depends on data volume       |
| Data retention execution              | 30s   | 120s  | 300s  | 600s  | Batch processing             |
| Generate compliance report (PDF)      | 2s    | 5s    | 10s   | 30s   | Complex aggregation          |

### 11.2 Throughput

| Metric                          | Target                  |
| ------------------------------- | ----------------------- |
| Compliance scans per hour       | 10 (across all tenants) |
| Alert resolution per minute     | 50                      |
| GDPR requests per day           | 100                     |
| Risk monitoring cycles per hour | 4 per event             |
| Carbon recalculations per day   | 24 (hourly per event)   |
| Concurrent dashboard users      | 100                     |

### 11.3 Caching Strategy

| Cache Key                                   | TTL   | Invalidation            |
| ------------------------------------------- | ----- | ----------------------- |
| `compliance:dashboard:{tenantId}:{eventId}` | 60s   | On alert create/resolve |
| `compliance:visa:summary:{eventId}`         | 120s  | On visa status change   |
| `risk:matrix:{eventId}`                     | 300s  | On risk create/update   |
| `sustainability:carbon:{eventId}`           | 3600s | On carbon recalculation |
| `sustainability:goals:{eventId}`            | 300s  | On goal update          |
| `compliance:consent:summary:{eventId}`      | 120s  | On consent change       |

---

## 12. Open Questions and Decisions

### 12.1 Architecture Decision Records

#### ADR-15-001: Consent Storage Model

| Aspect           | Decision                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                       |
| **Context**      | Need immutable consent tracking with full audit trail                                          |
| **Decision**     | Append-only ConsentAuditLog with materialized ConsentRecord view                               |
| **Rationale**    | Regulatory requirement for complete consent history; current state queryable via ConsentRecord |
| **Consequences** | More storage; need periodic archival of old audit entries                                      |

#### ADR-15-002: Risk Score Calculation

| Aspect           | Decision                                                                           |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                           |
| **Context**      | Need standardized risk scoring methodology                                         |
| **Decision**     | Simple likelihood × impact (1-5 each, max 25), with configurable threshold levels  |
| **Rationale**    | ISO 31000 aligned; simple enough for non-specialist users; extensible              |
| **Alternatives** | Weighted scoring, FMEA (severity × occurrence × detection), Monte Carlo simulation |

#### ADR-15-003: Carbon Calculation Methodology

| Aspect           | Decision                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Status**       | Accepted                                                                                         |
| **Context**      | Need defensible, published emission factor methodology                                           |
| **Decision**     | ICAO for air travel, DEFRA for ground transport, peer-reviewed factors for catering              |
| **Rationale**    | ICAO is the international aviation authority; DEFRA is well-established; transparent methodology |
| **Consequences** | Must update emission factors annually; need methodology documentation                            |

### 12.2 Open Questions

| #   | Question                                                      | Priority | Owner          | Status    |
| --- | ------------------------------------------------------------- | -------- | -------------- | --------- |
| 1   | Should we support consent withdrawal via mobile app?          | High     | Product        | In Review |
| 2   | How to handle cross-border data transfers under AU framework? | High     | Legal          | Open      |
| 3   | Should risk matrix support custom likelihood/impact labels?   | Medium   | Engineering    | Open      |
| 4   | Integration with external carbon offset marketplaces?         | Low      | Product        | Open      |
| 5   | Real-time face detection for photo quality during upload?     | Medium   | Engineering    | Open      |
| 6   | Should we support Scope 3 emissions in carbon tracking?       | Low      | Sustainability | Open      |
| 7   | Automated visa support letter generation via embassy APIs?    | Medium   | Engineering    | Open      |
| 8   | Multi-language support for GDPR notices and consent forms?    | High     | Product        | In Review |

---

## Appendix

### A. Compliance Alert Type Reference

| Alert Type           | Severity Levels           | Auto-Escalation      | Notification Channels |
| -------------------- | ------------------------- | -------------------- | --------------------- |
| `PASSPORT_EXPIRING`  | INFO → WARNING → CRITICAL | Yes (90d → 30d → 7d) | Email, SMS (CRITICAL) |
| `DOCUMENT_MISSING`   | WARNING → CRITICAL        | Yes (14d → 3d)       | Email                 |
| `VISA_DEADLINE`      | WARNING → CRITICAL        | Yes (30d → 7d)       | Email, SMS            |
| `VISA_DENIED`        | CRITICAL                  | No (immediate)       | Email, SMS, Push      |
| `PHOTO_QUALITY`      | INFO                      | No                   | Email                 |
| `CONSENT_MISSING`    | WARNING                   | Yes (7d)             | Email                 |
| `DATA_RETENTION_DUE` | INFO → WARNING            | Yes (30d → 7d)       | Email (admin)         |

### B. Risk Category Descriptions

| Category     | Example Risks                               | Typical Monitoring Fields                                  |
| ------------ | ------------------------------------------- | ---------------------------------------------------------- |
| SECURITY     | Terrorism, crowd control, VIP safety        | `incident_count_today`, `security_breach_count`            |
| HEALTH       | Pandemic, food poisoning, medical emergency | `medical_incident_count`, `temperature_check_failure_rate` |
| WEATHER      | Storms, extreme heat, flooding              | External weather API                                       |
| TECHNICAL    | Power failure, IT outage, AV malfunction    | `system_error_rate`, `uptime_percentage`                   |
| LOGISTICS    | Transport delays, vendor no-show            | `shuttle_delay_minutes`, `vendor_confirmation_rate`        |
| POLITICAL    | Diplomatic incident, protest, boycott       | `delegation_withdrawal_count`                              |
| FINANCIAL    | Budget overrun, sponsor withdrawal          | `budget_variance_ratio`                                    |
| REPUTATIONAL | Negative press, social media crisis         | External media monitoring                                  |
| OPERATIONAL  | Staff shortage, overcrowding                | `registration_capacity_ratio`, `staff_coverage_ratio`      |
| LEGAL        | Compliance violation, contract dispute      | `compliance_alert_critical_count`                          |

### C. Carbon Emission Factor Tables

| Category                        | Factor | Unit          | Source             |
| ------------------------------- | ------ | ------------- | ------------------ |
| Air Travel (short-haul <1500km) | 0.156  | kg CO2/pax-km | ICAO 2024          |
| Air Travel (medium 1500-4000km) | 0.131  | kg CO2/pax-km | ICAO 2024          |
| Air Travel (long-haul >4000km)  | 0.115  | kg CO2/pax-km | ICAO 2024          |
| Radiative forcing multiplier    | 1.9    | multiplier    | IPCC               |
| Bus (diesel)                    | 0.089  | kg CO2/km     | DEFRA 2024         |
| Minibus                         | 0.120  | kg CO2/km     | DEFRA 2024         |
| Car (average)                   | 0.171  | kg CO2/km     | DEFRA 2024         |
| Taxi                            | 0.209  | kg CO2/km     | DEFRA 2024         |
| Train                           | 0.041  | kg CO2/km     | DEFRA 2024         |
| Electric bus                    | 0.022  | kg CO2/km     | DEFRA 2024         |
| Meal (standard/mixed)           | 3.8    | kg CO2/meal   | Scarborough et al. |
| Meal (vegetarian)               | 1.7    | kg CO2/meal   | Scarborough et al. |
| Meal (vegan)                    | 0.9    | kg CO2/meal   | Scarborough et al. |
| A4 paper (per sheet)            | 0.005  | kg CO2/sheet  | EPA                |

### D. GDPR Processing Timeline

```
Day 0:  Request received → Status: RECEIVED
        └─ Auto-acknowledge email sent to data subject
Day 1-3: Identity verification
        └─ Status: IDENTITY_VERIFIED (or REJECTED if unverifiable)
Day 3-7: Impact assessment
        └─ System identifies all affected records across events
Day 7-25: Processing
        └─ Status: PROCESSING
        └─ Sequential deletion of: documents, approvals, access logs,
           consent records, visa tracking, compliance alerts, participant records
Day 25-28: Verification
        └─ DPO reviews processing log, confirms completeness
Day 28-30: Completion
        └─ Status: COMPLETED
        └─ Confirmation email sent to data subject
        └─ Audit record created (retained indefinitely)

SLA: Must complete within 30 calendar days per GDPR Article 12(3)
```

### E. Related ADRs and References

| Reference                                                                           | Module | Section | Relationship                   |
| ----------------------------------------------------------------------------------- | ------ | ------- | ------------------------------ |
| [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                   | 01     | §3      | Base entity schemas            |
| [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md)                               | 04     | §5      | Compliance gates in workflows  |
| [Module 05: Security and Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       | 05     | §3      | RBAC, audit framework          |
| [Module 06: Infrastructure and DevOps](./06-INFRASTRUCTURE-AND-DEVOPS.md)           | 06     | §4      | Background job framework       |
| [Module 09: Registration and Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | 09     | §5      | Consent at registration        |
| [Module 10: Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md)               | 10     | §7      | Command center risk feed       |
| [Module 11: Logistics and Venue](./11-LOGISTICS-AND-VENUE.md)                       | 11     | §5      | Transport/catering carbon data |
| [Module 14: Content and Documents](./14-CONTENT-AND-DOCUMENTS.md)                   | 14     | §7      | Expiry notifications           |
| [Module 17: Settings and Configuration](./17-SETTINGS-AND-CONFIGURATION.md)         | 17     | §3      | Settings registry              |

---

_End of Module 15: Compliance and Governance_
