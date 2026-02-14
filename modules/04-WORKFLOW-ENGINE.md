# Module 04: Workflow Engine

> **Module:** 04 - Workflow Engine
> **Version:** 1.0
> **Last Updated:** February 11, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md), [Module 02: Dynamic Schema Engine](./02-DYNAMIC-SCHEMA-ENGINE.md)
> **Required By:** [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md), [Module 10: Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md)
> **Integrates With:** [Module 03: Visual Form Designer](./03-VISUAL-FORM-DESIGNER.md), [Module 05: Security & Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md), [Module 07: API & Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Design Philosophy](#14-design-philosophy)
2. [Architecture](#2-architecture)
   - 2.1 [Component Architecture](#21-component-architecture)
   - 2.2 [State Machine Formalization](#22-state-machine-formalization)
   - 2.3 [Event-Driven Execution](#23-event-driven-execution)
   - 2.4 [Workflow Execution Context](#24-workflow-execution-context)
   - 2.5 [Engine Lifecycle](#25-engine-lifecycle)
3. [Data Model](#3-data-model)
   - 3.1 [Enumerations](#31-enumerations)
   - 3.2 [Core Schemas](#32-core-schemas)
   - 3.3 [ER Diagram](#33-er-diagram)
   - 3.4 [Index Catalog](#34-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Workflow Management](#41-workflow-management)
   - 4.2 [Step Management](#42-step-management)
   - 4.3 [Workflow Lifecycle](#43-workflow-lifecycle)
   - 4.4 [Workflow Execution](#44-workflow-execution)
   - 4.5 [Step Assignment](#45-step-assignment)
   - 4.6 [SLA & Monitoring](#46-sla--monitoring)
   - 4.7 [Analytics](#47-analytics)
   - 4.8 [Template Marketplace](#48-template-marketplace)
5. [Business Logic](#5-business-logic)
   - 5.1 [Core State Machine](#51-core-state-machine)
   - 5.2 [Workflow Versioning](#52-workflow-versioning)
   - 5.3 [Conditional Routing](#53-conditional-routing)
   - 5.4 [Process Participant — Full Implementation](#54-process-participant--full-implementation)
   - 5.5 [SLA Enforcement](#55-sla-enforcement)
   - 5.6 [Step Assignment & Reassignment](#56-step-assignment--reassignment)
   - 5.7 [Auto-Action Rules](#57-auto-action-rules)
   - 5.8 [Batch Operations](#58-batch-operations)
   - 5.9 [Parallel Paths (Fork/Join)](#59-parallel-paths-forkjoin)
   - 5.10 [Multi-Level Escalation Chains](#510-multi-level-escalation-chains)
   - 5.11 [Simulation / Dry-Run Mode](#511-simulation--dry-run-mode)
   - 5.12 [Workflow Analytics](#512-workflow-analytics)
   - 5.13 [Webhook Triggers](#513-webhook-triggers)
   - 5.14 [Audit Trail Visualization](#514-audit-trail-visualization)
   - 5.15 [Error Handling & Recovery](#515-error-handling--recovery)
   - 5.16 [Timer-Based Triggers](#516-timer-based-triggers)
   - 5.17 [Counter-Based Triggers](#517-counter-based-triggers)
   - 5.18 [Delegation of Authority](#518-delegation-of-authority)
   - 5.19 [Return-to-Step](#519-return-to-step)
   - 5.20 [Step-Specific Forms](#520-step-specific-forms)
6. [User Interface](#6-user-interface)
   - 6.1 [Visual Workflow Builder](#61-visual-workflow-builder)
   - 6.2 [Step Palette](#62-step-palette)
   - 6.3 [Connection Rules](#63-connection-rules)
   - 6.4 [Step Property Panel](#64-step-property-panel)
   - 6.5 [Workflow Simulation Panel](#65-workflow-simulation-panel)
   - 6.6 [Version Comparison View](#66-version-comparison-view)
   - 6.7 [Analytics Dashboard](#67-analytics-dashboard)
   - 6.8 [Audit Trail Timeline](#68-audit-trail-timeline)
7. [Integration Points](#7-integration-points)
   - 7.1 [Module Integration Map](#71-module-integration-map)
   - 7.2 [Integration Details](#72-integration-details)
8. [Configuration](#8-configuration)
   - 8.1 [Feature Flags](#81-feature-flags)
   - 8.2 [Runtime Configuration](#82-runtime-configuration)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Unit Tests](#91-unit-tests)
   - 9.2 [Concurrency Tests](#92-concurrency-tests)
   - 9.3 [SLA Timer Tests](#93-sla-timer-tests)
   - 9.4 [Simulation Mode Tests](#94-simulation-mode-tests)
   - 9.5 [Batch Processing Tests](#95-batch-processing-tests)
   - 9.6 [E2E Integration Test](#96-e2e-integration-test)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [Step-Level Authorization](#101-step-level-authorization)
    - 10.2 [Approval Fraud Detection](#102-approval-fraud-detection)
    - 10.3 [Audit Trail Integrity](#103-audit-trail-integrity)
    - 10.4 [Tenant Isolation](#104-tenant-isolation)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Latency Targets](#111-latency-targets)
    - 11.2 [Throughput Targets](#112-throughput-targets)
    - 11.3 [Optimization Strategies](#113-optimization-strategies)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Action Type Catalog](#c-action-type-catalog)

---

## 1. Overview

### 1.1 Purpose

The Workflow Engine is the central orchestration layer of the accreditation platform. It implements a **linked-list state machine** with **conditional routing** that drives accreditation approval pipelines from initial submission through final badge printing.

Every participant who registers for an event passes through a tenant-defined workflow -- a sequence of steps where human validators or automated rules evaluate, approve, reject, or route the participant toward accreditation. The engine guarantees:

- **Deterministic execution**: Given the same inputs, the same path is followed.
- **Audit completeness**: Every action on every participant is recorded immutably.
- **Version safety**: In-flight participants complete under the workflow version they entered.
- **SLA enforcement**: Overdue steps trigger escalation automatically.
- **Tenant isolation**: Each tenant's workflows are completely separate.

### 1.2 Scope

This module covers:

| Capability               | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Workflow Definition**  | Creating and configuring multi-step approval pipelines with a visual builder |
| **Workflow Execution**   | Processing participants through steps with action-based transitions          |
| **Workflow Versioning**  | Snapshot-based versioning so in-flight participants are unaffected by edits  |
| **Conditional Routing**  | Dynamic path selection based on participant attributes                       |
| **SLA Enforcement**      | Time-based monitoring with automatic escalation on breach                    |
| **Parallel Paths**       | Fork/join patterns for concurrent review tracks                              |
| **Auto-Actions**         | Rule-based automatic processing (auto-approve, auto-route)                   |
| **Batch Operations**     | Bulk approve/reject/bypass for high-volume events                            |
| **Visual Builder**       | Drag-and-drop workflow design with @xyflow/react                             |
| **Simulation**           | Dry-run mode to test workflows before activation                             |
| **Analytics**            | Bottleneck detection, throughput analysis, SLA compliance                    |
| **Template Marketplace** | Reusable workflow templates across events and tenants                        |

### 1.3 Key Personas

| Persona            | Role                                 | Workflow Interaction                                                                               |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Tenant Admin**   | Designs and manages workflows        | Creates workflow definitions, configures steps, sets SLAs, publishes workflows, monitors analytics |
| **Validator**      | Processes participants through steps | Reviews participant data, approves/rejects/routes, manages assigned queue                          |
| **Supervisor**     | Oversees validation teams            | Handles escalations, reassigns work, monitors SLA compliance                                       |
| **Platform Admin** | Manages platform-wide operations     | Monitors workflow health across tenants, manages template marketplace                              |
| **Participant**    | Passes through the workflow          | Receives status notifications, may be asked to provide additional information                      |

### 1.4 Design Philosophy

1. **Workflows are data, not code.** Tenant admins define workflows through a visual interface; no developer intervention required.
2. **Immutable execution history.** Every state transition is recorded. Approval records cannot be modified or deleted.
3. **Graceful versioning.** Editing a live workflow never disrupts in-flight participants.
4. **Fail-safe defaults.** If a condition cannot be evaluated, the default path is taken. If an auto-action fails, the step remains for manual processing.
5. **Observable execution.** Every transition emits domain events consumable by other modules.

---

## 2. Architecture

### 2.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW ENGINE                              │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Workflow         │  │  Execution       │  │  Visual          │  │
│  │  Definition       │  │  Engine          │  │  Builder         │  │
│  │  Service          │  │                  │  │  (Client)        │  │
│  │                   │  │  ┌────────────┐  │  │                  │  │
│  │  - CRUD           │  │  │ State      │  │  │  - @xyflow/react │  │
│  │  - Versioning     │  │  │ Machine    │  │  │  - dagre layout  │  │
│  │  - Validation     │  │  │ Core       │  │  │  - Step palette  │  │
│  │  - Publishing     │  │  └────────────┘  │  │  - Properties    │  │
│  │  - Cloning        │  │  ┌────────────┐  │  │  - Simulation    │  │
│  └──────────────────┘  │  │ Routing    │  │  └──────────────────┘  │
│                         │  │ Engine     │  │                        │
│  ┌──────────────────┐  │  └────────────┘  │  ┌──────────────────┐  │
│  │  SLA              │  │  ┌────────────┐  │  │  Analytics       │  │
│  │  Enforcement      │  │  │ Side       │  │  │  Service         │  │
│  │                   │  │  │ Effect     │  │  │                  │  │
│  │  - pg-boss jobs   │  │  │ Executor   │  │  │  - Bottleneck    │  │
│  │  - Escalation     │  │  └────────────┘  │  │  - Throughput    │  │
│  │  - Timer triggers │  │  ┌────────────┐  │  │  - SLA rates     │  │
│  │  - Notifications  │  │  │ Assignment │  │  │  - Workload      │  │
│  └──────────────────┘  │  │ Manager    │  │  └──────────────────┘  │
│                         │  └────────────┘  │                        │
│  ┌──────────────────┐  └──────────────────┘  ┌──────────────────┐  │
│  │  Template         │                        │  Webhook         │  │
│  │  Marketplace      │                        │  Dispatcher      │  │
│  │                   │                        │                  │  │
│  │  - Browse         │                        │  - Per-step      │  │
│  │  - Import/Export  │                        │  - Retry policy  │  │
│  │  - Rating         │                        │  - Dead letter   │  │
│  └──────────────────┘                        └──────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────┐    ┌───────────────────┐
│ PostgreSQL  │    │ pg-boss      │    │ Domain Event Bus  │
│ (Prisma)    │    │ (Job Queue)  │    │ (EventEmitter)    │
└─────────────┘    └──────────────┘    └───────────────────┘
```

### 2.2 State Machine Formalization

The workflow engine implements a formal state machine defined as a 5-tuple:

**M = (S, A, T, s₀, F)**

| Symbol | Definition                    | Implementation                                                                            |
| ------ | ----------------------------- | ----------------------------------------------------------------------------------------- |
| **S**  | Finite set of states          | Steps in a workflow (each Step record)                                                    |
| **A**  | Finite set of actions         | `Action` enum: APPROVE, REJECT, BYPASS, PRINT, COLLECT, NOTIFY, ARCHIVE, RETURN, ESCALATE |
| **T**  | Transition function S x A → S | `nextStepId`, `rejectionTarget`, `bypassTarget`, conditional routing rules                |
| **s₀** | Initial state                 | First step in workflow (step with no predecessor)                                         |
| **F**  | Set of final states           | Steps with no `nextStepId` (terminal steps)                                               |

**Core State Machine Diagram (from source):**

```
Step A (APPROVE) → nextStepId → Step B (APPROVE) → nextStepId → Step C (PRINT) → ...
                ↓ REJECT
        Step with isRejectionTarget: true
                ↓ BYPASS
        Step with isBypassTarget: true
```

**Extended transitions with all action types:**

```
                                    ┌─────────────────┐
                                    │                 │
                                    ▼                 │ RETURN
┌──────────┐  APPROVE   ┌──────────┐  APPROVE   ┌──────────┐  APPROVE   ┌──────────┐
│  Step 1  │──────────▶│  Step 2  │──────────▶│  Step 3  │──────────▶│  Step 4  │
│ (REVIEW) │            │(APPROVAL)│            │ (PRINT)  │            │(COLLECT) │
└──────────┘            └──────────┘            └──────────┘            └──────────┘
     │                       │                       │
     │ REJECT                │ BYPASS                │ ESCALATE
     ▼                       ▼                       ▼
┌──────────┐            ┌──────────┐            ┌──────────┐
│ Rejection│            │  Skip to │            │Supervisor│
│  Target  │            │  Step 4  │            │  Review  │
└──────────┘            └──────────┘            └──────────┘
```

**Participant status transitions:**

```
    REGISTERED
        │
        ▼
     PENDING ◄──────────── RETURNED
        │                      ▲
        ▼                      │
    INPROGRESS ────────────────┘
        │
        ├──▶ APPROVED ──▶ (next step or terminal)
        ├──▶ REJECTED
        ├──▶ BYPASSED
        ├──▶ PRINTED
        ├──▶ COLLECTED
        ├──▶ ESCALATED
        └──▶ ARCHIVED
```

### 2.3 Event-Driven Execution

Every state transition emits domain events that other modules can subscribe to:

```typescript
// Domain events emitted by the workflow engine
interface WorkflowDomainEvents {
  // Participant lifecycle events
  "participant.entered": {
    participantId: string;
    workflowId: string;
    versionId: string;
    stepId: string;
  };
  "participant.advanced": {
    participantId: string;
    fromStepId: string;
    toStepId: string;
    action: Action;
  };
  "participant.approved": {
    participantId: string;
    stepId: string;
    userId: string;
    remarks?: string;
  };
  "participant.rejected": { participantId: string; stepId: string; userId: string; reason: string };
  "participant.bypassed": { participantId: string; stepId: string; userId: string; reason: string };
  "participant.returned": {
    participantId: string;
    stepId: string;
    targetStepId: string;
    reason: string;
  };
  "participant.escalated": { participantId: string; stepId: string; escalationLevel: number };
  "participant.completed": {
    participantId: string;
    workflowId: string;
    finalStatus: ParticipantStatus;
  };

  // SLA events
  "sla.warning": { participantId: string; stepId: string; remainingMinutes: number };
  "sla.breached": { participantId: string; stepId: string; overdueMinutes: number };

  // Workflow lifecycle events
  "workflow.published": { workflowId: string; versionId: string };
  "workflow.activated": { workflowId: string };
  "workflow.deactivated": { workflowId: string };

  // Assignment events
  "step.assigned": { participantId: string; stepId: string; assignedTo: string };
  "step.reassigned": { participantId: string; stepId: string; from: string; to: string };

  // Batch events
  "batch.started": { batchId: string; count: number; action: Action };
  "batch.completed": { batchId: string; succeeded: number; failed: number };

  // Fork/Join events
  "parallel.forked": { participantId: string; forkStepId: string; branchStepIds: string[] };
  "parallel.joined": { participantId: string; joinStepId: string };
}
```

**Event emission in the execution pipeline:**

```typescript
import { EventEmitter } from "events";

class WorkflowEventBus extends EventEmitter {
  private static instance: WorkflowEventBus;

  static getInstance(): WorkflowEventBus {
    if (!WorkflowEventBus.instance) {
      WorkflowEventBus.instance = new WorkflowEventBus();
    }
    return WorkflowEventBus.instance;
  }

  emitWorkflowEvent<K extends keyof WorkflowDomainEvents>(
    event: K,
    payload: WorkflowDomainEvents[K],
  ): void {
    this.emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
      traceId: getTraceId(),
    });
  }

  onWorkflowEvent<K extends keyof WorkflowDomainEvents>(
    event: K,
    handler: (payload: WorkflowDomainEvents[K] & { timestamp: string; traceId: string }) => void,
  ): void {
    this.on(event, handler);
  }
}

export const workflowEvents = WorkflowEventBus.getInstance();
```

### 2.4 Workflow Execution Context

Every workflow execution operates within a context object that carries state through the processing pipeline:

```typescript
interface WorkflowExecutionContext {
  // Identifiers
  participantId: string;
  workflowId: string;
  workflowVersionId: string;
  currentStepId: string;
  tenantId: string;
  eventId: string;

  // Actor
  userId: string;
  userRoles: string[];

  // Action
  action: Action;
  remarks?: string;

  // Participant data (for conditional routing)
  participantData: Record<string, unknown>;
  customData: Record<string, unknown>;

  // Execution metadata
  isDryRun: boolean;
  isBatchOperation: boolean;
  batchId?: string;
  traceId: string;
  startedAt: Date;

  // Results (populated during execution)
  previousStepId?: string;
  nextStepId?: string;
  sideEffects: SideEffect[];
  approvalRecord?: ApprovalRecord;
  errors: ExecutionError[];
}

interface SideEffect {
  type: "EMAIL" | "NOTIFICATION" | "WEBHOOK" | "AUTO_ACTION" | "ASSIGNMENT";
  status: "PENDING" | "EXECUTED" | "FAILED";
  payload: Record<string, unknown>;
  error?: string;
}

interface ExecutionError {
  code: string;
  message: string;
  step: string;
  recoverable: boolean;
}
```

### 2.5 Engine Lifecycle

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  DRAFT  │────▶│PUBLISHED │────▶│  ACTIVE  │────▶│ ARCHIVED │
└─────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                │               │
     │                │               │
     └────────────────┘               │
        (unpublish)                   │
                                      ▼
                                ┌──────────┐
                                │SUSPENDED │
                                └──────────┘
```

| State         | Description                        | Allowed Operations                        |
| ------------- | ---------------------------------- | ----------------------------------------- |
| **DRAFT**     | Workflow is being designed         | Edit steps, configure routing, set SLAs   |
| **PUBLISHED** | Workflow is validated and ready    | Review, activate, unpublish back to draft |
| **ACTIVE**    | Workflow is accepting participants | Process participants, monitor, deactivate |
| **SUSPENDED** | Temporarily paused                 | Resume to active, archive                 |
| **ARCHIVED**  | No longer in use                   | View history, clone to new draft          |

---

## 3. Data Model

### 3.1 Enumerations

```prisma
enum Action {
  APPROVE
  REJECT
  BYPASS
  PRINT
  COLLECT
  NOTIFY
  ARCHIVE
  RETURN
  ESCALATE
}

enum StepType {
  REVIEW
  APPROVAL
  PRINT
  COLLECT
  NOTIFICATION
  CUSTOM
  FORK
  JOIN
  TIMER
  COUNTER
}

enum ParticipantStatus {
  REGISTERED
  PENDING
  INPROGRESS
  APPROVED
  REJECTED
  BYPASSED
  PRINTED
  COLLECTED
  NOTIFIED
  ARCHIVED
  RETURNED
  ESCALATED
  COMPLETED
}

enum WorkflowStatus {
  DRAFT
  PUBLISHED
  ACTIVE
  SUSPENDED
  ARCHIVED
}

enum SLAAction {
  NOTIFY
  ESCALATE
  AUTO_APPROVE
  AUTO_REJECT
  REASSIGN
}

enum AssignmentStrategy {
  ROUND_ROBIN
  LEAST_LOADED
  MANUAL
  AUTO
}

enum WebhookMethod {
  GET
  POST
  PUT
  PATCH
}
```

### 3.2 Core Schemas

```prisma
// ─── Workflow Definition ───────────────────────────────────────────

model Workflow {
  id                String          @id @default(cuid())
  tenantId          String
  eventId           String
  name              String
  description       String?
  status            WorkflowStatus  @default(DRAFT)
  isDefault         Boolean         @default(false)

  // Metadata
  createdBy         String
  updatedBy         String?
  publishedAt       DateTime?
  publishedBy       String?
  activatedAt       DateTime?
  activatedBy       String?

  // Configuration
  maxParallelPaths  Int             @default(3)
  enableSimulation  Boolean         @default(true)
  enableAutoActions Boolean         @default(true)
  enableParallel    Boolean         @default(false)
  enableCounters    Boolean         @default(false)
  enableDelegation  Boolean         @default(false)
  enableWebhooks    Boolean         @default(false)

  // Relations
  tenant            Tenant          @relation(fields: [tenantId], references: [id])
  event             Event           @relation(fields: [eventId], references: [id])
  steps             Step[]
  versions          WorkflowVersion[]
  participants      Participant[]
  analytics         WorkflowAnalytics[]
  templateSource    WorkflowTemplate? @relation("templateInstances")

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  deletedAt         DateTime?

  @@unique([eventId, name])
  @@index([tenantId])
  @@index([eventId])
  @@index([status])
  @@index([tenantId, eventId])
  @@map("workflows")
}

// ─── Workflow Version (Snapshot) ───────────────────────────────────

model WorkflowVersion {
  id                String          @id @default(cuid())
  workflowId        String
  version           Int
  snapshot          Json            // Complete serialized workflow + steps
  changeDescription String?
  createdBy         String

  // Relations
  workflow          Workflow        @relation(fields: [workflowId], references: [id])
  participants      Participant[]   // Participants locked to this version

  createdAt         DateTime        @default(now())

  @@unique([workflowId, version])
  @@index([workflowId])
  @@map("workflow_versions")
}

// ─── Step Definition ───────────────────────────────────────────────

model Step {
  id                  String        @id @default(cuid())
  workflowId          String
  name                String
  description         String?
  order               Int           // Display/execution order
  stepType            StepType      @default(REVIEW)
  action              Action        @default(APPROVE)
  roleId              String?       // Required role to process this step
  formId              String?       // Step-specific form (Module 03)

  // ─── Linked-list navigation ─────────────────
  nextStepId          String?       // Default next step on APPROVE
  rejectionTargetId   String?       // Step to go to on REJECT
  bypassTargetId      String?       // Step to go to on BYPASS
  returnTargetId      String?       // Step to go to on RETURN
  escalationTargetId  String?       // Step to go to on ESCALATE
  isRejectionTarget   Boolean       @default(false)
  isBypassTarget      Boolean       @default(false)
  isEntryPoint        Boolean       @default(false)
  isTerminal          Boolean       @default(false)

  // ─── Conditional routing ────────────────────
  conditions          Json?         // Array of routing conditions
  // [{ field, operator, value, nextStepId }]

  // ─── Auto-action rules ──────────────────────
  autoAction          Json?         // Auto-action configuration
  // { rule, conditions, delay }

  // ─── SLA configuration ──────────────────────
  slaDurationMinutes  Int?          // SLA deadline in minutes
  slaWarningMinutes   Int?          // Warning threshold before breach
  slaAction           SLAAction?    // Action to take on SLA breach
  slaEscalationRoleId String?       // Role to escalate to

  // ─── Parallel path configuration ────────────
  isForkStep          Boolean       @default(false)
  isJoinStep          Boolean       @default(false)
  forkStepIds         String[]      // Steps to fork to (for fork steps)
  joinRequirement     Int?          // Number of paths required (for join steps)
  joinStrategy        String?       // 'ALL' | 'ANY' | 'MAJORITY'

  // ─── Counter-based triggers ─────────────────
  requiredApprovals   Int?          // Number of approvals needed
  counterThreshold    Int?          // Generic counter threshold

  // ─── Timer-based triggers ───────────────────
  timerDurationMinutes Int?         // Auto-advance after this duration
  timerAction         Action?       // Action to take on timer expiry

  // ─── Webhook configuration ──────────────────
  webhookUrl          String?
  webhookMethod       WebhookMethod?
  webhookHeaders      Json?
  webhookPayloadTemplate Json?

  // ─── Visual builder positions ───────────────
  positionX           Float         @default(0)
  positionY           Float         @default(0)

  // ─── Assignment configuration ───────────────
  assignmentStrategy  AssignmentStrategy @default(MANUAL)
  maxAssignees        Int           @default(1)

  // Relations
  workflow            Workflow      @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  role                Role?         @relation(fields: [roleId], references: [id])
  form                Form?         @relation(fields: [formId], references: [id])
  nextStep            Step?         @relation("StepToNext", fields: [nextStepId], references: [id])
  previousSteps       Step[]        @relation("StepToNext")
  rejectionTarget     Step?         @relation("StepToRejection", fields: [rejectionTargetId], references: [id])
  bypassTarget        Step?         @relation("StepToBypass", fields: [bypassTargetId], references: [id])
  returnTarget        Step?         @relation("StepToReturn", fields: [returnTargetId], references: [id])
  escalationTarget    Step?         @relation("StepToEscalation", fields: [escalationTargetId], references: [id])
  assignments         StepAssignment[]
  approvals           Approval[]
  parallelBranches    ParallelBranch[]

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@unique([workflowId, name])
  @@unique([workflowId, order])
  @@index([workflowId])
  @@index([nextStepId])
  @@index([roleId])
  @@index([stepType])
  @@map("steps")
}

// ─── Step Template ─────────────────────────────────────────────────

model StepTemplate {
  id                String        @id @default(cuid())
  tenantId          String?       // null = platform-level template
  name              String
  description       String?
  stepType          StepType
  action            Action
  defaultConfig     Json          // Default step configuration
  icon              String?
  color             String?
  category          String?       // e.g., "Review", "Print", "Notification"

  tenant            Tenant?       @relation(fields: [tenantId], references: [id])

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([tenantId])
  @@index([category])
  @@map("step_templates")
}

// ─── Workflow Template ─────────────────────────────────────────────

model WorkflowTemplate {
  id                String        @id @default(cuid())
  tenantId          String?       // null = platform-level (marketplace)
  name              String
  description       String?
  category          String?
  tags              String[]
  snapshot          Json          // Complete workflow + steps definition
  isPublic          Boolean       @default(false)
  usageCount        Int           @default(0)
  rating            Float?
  ratingCount       Int           @default(0)

  // Relations
  tenant            Tenant?       @relation(fields: [tenantId], references: [id])
  instances         Workflow[]    @relation("templateInstances")

  createdBy         String
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([tenantId])
  @@index([isPublic])
  @@index([category])
  @@index([tags])
  @@map("workflow_templates")
}

// ─── Approval (Audit Record) ──────────────────────────────────────

model Approval {
  id                String          @id @default(cuid())
  participantId     String
  stepId            String
  userId            String
  action            Action
  remarks           String?
  previousStatus    ParticipantStatus
  newStatus         ParticipantStatus

  // Context
  workflowVersionId String?
  batchId           String?         // If part of a batch operation
  isDryRun          Boolean         @default(false)
  delegatedFrom     String?         // If acting under delegation

  // Metadata
  ipAddress         String?
  userAgent         String?
  processingTimeMs  Int?            // Time from step entry to action
  metadata          Json?           // Additional context

  // Relations
  participant       Participant     @relation(fields: [participantId], references: [id])
  step              Step            @relation(fields: [stepId], references: [id])
  user              User            @relation(fields: [userId], references: [id])

  createdAt         DateTime        @default(now())

  @@index([participantId])
  @@index([stepId])
  @@index([userId])
  @@index([participantId, stepId])
  @@index([createdAt])
  @@index([batchId])
  @@map("approvals")
}

// ─── Step Assignment ──────────────────────────────────────────────

model StepAssignment {
  id                String        @id @default(cuid())
  participantId     String
  stepId            String
  assignedTo        String        // userId
  assignedBy        String        // userId
  isActive          Boolean       @default(true)
  reason            String?

  // Relations
  participant       Participant   @relation(fields: [participantId], references: [id])
  step              Step          @relation(fields: [stepId], references: [id])
  assignee          User          @relation("assignedTo", fields: [assignedTo], references: [id])
  assigner          User          @relation("assignedBy", fields: [assignedBy], references: [id])

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([participantId, stepId, assignedTo])
  @@index([assignedTo, isActive])
  @@index([stepId, isActive])
  @@index([participantId])
  @@map("step_assignments")
}

// ─── Parallel Branch Tracking ─────────────────────────────────────

model ParallelBranch {
  id                String        @id @default(cuid())
  participantId     String
  forkStepId        String        // The step that created the fork
  branchStepId      String        // The branch step
  status            ParticipantStatus @default(PENDING)
  completedAt       DateTime?
  completedBy       String?
  action            Action?
  remarks           String?

  // Relations
  participant       Participant   @relation(fields: [participantId], references: [id])
  branchStep        Step          @relation(fields: [branchStepId], references: [id])

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([participantId, forkStepId, branchStepId])
  @@index([participantId, forkStepId])
  @@index([status])
  @@map("parallel_branches")
}

// ─── Delegation of Authority ──────────────────────────────────────

model Delegation {
  id                String        @id @default(cuid())
  tenantId          String
  delegatorId       String        // User delegating authority
  delegateeId       String        // User receiving authority
  roleId            String        // Role being delegated
  workflowId        String?       // Optional: scope to specific workflow
  stepId            String?       // Optional: scope to specific step
  reason            String
  startDate         DateTime
  endDate           DateTime
  isActive          Boolean       @default(true)
  revokedAt         DateTime?
  revokedBy         String?

  // Relations
  tenant            Tenant        @relation(fields: [tenantId], references: [id])
  delegator         User          @relation("delegator", fields: [delegatorId], references: [id])
  delegatee         User          @relation("delegatee", fields: [delegateeId], references: [id])
  role              Role          @relation(fields: [roleId], references: [id])

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([tenantId])
  @@index([delegateeId, isActive])
  @@index([delegatorId])
  @@index([startDate, endDate])
  @@map("delegations")
}

// ─── Workflow Analytics (Aggregated) ──────────────────────────────

model WorkflowAnalytics {
  id                  String      @id @default(cuid())
  workflowId          String
  stepId              String?     // null = workflow-level metric
  date                DateTime    @db.Date
  metricType          String      // 'throughput', 'avg_processing_time', 'sla_compliance', etc.
  value               Float
  metadata            Json?

  workflow            Workflow     @relation(fields: [workflowId], references: [id])

  createdAt           DateTime    @default(now())

  @@unique([workflowId, stepId, date, metricType])
  @@index([workflowId, date])
  @@index([metricType])
  @@map("workflow_analytics")
}

// ─── Webhook Log ──────────────────────────────────────────────────

model WebhookLog {
  id                String        @id @default(cuid())
  stepId            String
  participantId     String
  url               String
  method            WebhookMethod
  requestHeaders    Json?
  requestBody       Json?
  responseStatus    Int?
  responseBody      String?
  responseTimeMs    Int?
  attempt           Int           @default(1)
  maxAttempts       Int           @default(3)
  success           Boolean       @default(false)
  error             String?

  createdAt         DateTime      @default(now())

  @@index([stepId])
  @@index([participantId])
  @@index([success])
  @@map("webhook_logs")
}
```

### 3.3 ER Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Tenant     │       │    Workflow       │       │    Event     │
│              │1────M│                  │M────1│              │
│              │       │  - name          │       │              │
└──────────────┘       │  - status        │       └──────────────┘
                       │  - config flags  │
                       └────────┬─────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
          ┌─────────────┐ ┌─────────┐ ┌──────────────────┐
          │  Workflow    │ │  Step   │ │  Workflow         │
          │  Version     │ │         │ │  Analytics        │
          │              │ │ - type  │ │                   │
          │ - version    │ │ - action│ │ - metricType      │
          │ - snapshot   │ │ - SLA   │ │ - value           │
          └──────┬───────┘ │ - conds │ └───────────────────┘
                 │         │ - pos   │
                 │         └────┬────┘
                 │              │
                 │    ┌─────────┼──────────┬─────────────┐
                 │    │         │          │             │
                 │    ▼         ▼          ▼             ▼
                 │ ┌────────┐┌────────┐┌──────────┐┌──────────┐
                 │ │Approval││ Step   ││ Parallel ││ Webhook  │
                 │ │        ││Assign  ││ Branch   ││ Log      │
                 │ │-action ││-ment   ││          ││          │
                 │ │-remarks││-user   ││-status   ││-url      │
                 │ │-status ││-active ││-action   ││-response │
                 │ └────────┘└────────┘└──────────┘└──────────┘
                 │
                 ▼
          ┌─────────────┐
          │ Participant │
          │             │
          │ - status    │
          │ - stepId    │
          │ - versionId │
          └─────────────┘

  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
  │ Step         │    │ Workflow         │    │  Delegation  │
  │ Template     │    │ Template         │    │              │
  │              │    │                  │    │ - delegator  │
  │ - type       │    │ - snapshot       │    │ - delegatee  │
  │ - defaults   │    │ - isPublic       │    │ - dateRange  │
  └──────────────┘    └──────────────────┘    └──────────────┘
```

### 3.4 Index Catalog

| Table                | Index                           | Columns                     | Purpose                            |
| -------------------- | ------------------------------- | --------------------------- | ---------------------------------- |
| `workflows`          | `ix_workflows_tenant`           | `tenantId`                  | Tenant-scoped queries              |
| `workflows`          | `ix_workflows_event`            | `eventId`                   | Event-scoped workflow lookup       |
| `workflows`          | `ix_workflows_status`           | `status`                    | Filter by lifecycle state          |
| `workflows`          | `ix_workflows_tenant_event`     | `tenantId, eventId`         | Composite for tenant+event queries |
| `workflow_versions`  | `ix_versions_workflow`          | `workflowId`                | Version lookup by workflow         |
| `steps`              | `ix_steps_workflow`             | `workflowId`                | All steps for a workflow           |
| `steps`              | `ix_steps_next`                 | `nextStepId`                | Reverse lookup for predecessors    |
| `steps`              | `ix_steps_role`                 | `roleId`                    | Steps assignable to a role         |
| `steps`              | `ix_steps_type`                 | `stepType`                  | Filter by step type                |
| `approvals`          | `ix_approvals_participant`      | `participantId`             | Participant approval history       |
| `approvals`          | `ix_approvals_step`             | `stepId`                    | Step-level audit trail             |
| `approvals`          | `ix_approvals_user`             | `userId`                    | User activity audit                |
| `approvals`          | `ix_approvals_participant_step` | `participantId, stepId`     | Composite for step-specific lookup |
| `approvals`          | `ix_approvals_created`          | `createdAt`                 | Time-based queries                 |
| `approvals`          | `ix_approvals_batch`            | `batchId`                   | Batch operation lookup             |
| `step_assignments`   | `ix_assignments_assignee`       | `assignedTo, isActive`      | User's active assignments          |
| `step_assignments`   | `ix_assignments_step`           | `stepId, isActive`          | Step's active assignments          |
| `parallel_branches`  | `ix_branches_participant_fork`  | `participantId, forkStepId` | Branch status for join evaluation  |
| `parallel_branches`  | `ix_branches_status`            | `status`                    | Pending branch lookup              |
| `delegations`        | `ix_delegations_delegatee`      | `delegateeId, isActive`     | Active delegation lookup           |
| `delegations`        | `ix_delegations_dates`          | `startDate, endDate`        | Date-range queries for expiry      |
| `workflow_analytics` | `ix_analytics_workflow_date`    | `workflowId, date`          | Time-series queries                |
| `webhook_logs`       | `ix_webhook_step`               | `stepId`                    | Step webhook history               |

---

## 4. API Specification

### 4.1 Workflow Management

#### Create Workflow

```
POST /api/v1/workflows
Authorization: Bearer <token>
X-Tenant-ID: <tenantId>
```

**Request Body:**

```json
{
  "eventId": "evt_abc123",
  "name": "Standard Accreditation",
  "description": "Default approval pipeline for media accreditation",
  "enableSimulation": true,
  "enableAutoActions": true,
  "enableParallel": false
}
```

**Response: 201 Created**

```json
{
  "id": "wf_xyz789",
  "tenantId": "tenant_001",
  "eventId": "evt_abc123",
  "name": "Standard Accreditation",
  "status": "DRAFT",
  "steps": [],
  "createdAt": "2026-02-11T10:00:00Z"
}
```

#### List Workflows

```
GET /api/v1/workflows?eventId={eventId}&status={status}&page=1&limit=20
Authorization: Bearer <token>
X-Tenant-ID: <tenantId>
```

#### Get Workflow

```
GET /api/v1/workflows/{workflowId}
Authorization: Bearer <token>
X-Tenant-ID: <tenantId>
```

**Response: 200 OK**

```json
{
  "id": "wf_xyz789",
  "name": "Standard Accreditation",
  "status": "ACTIVE",
  "steps": [
    {
      "id": "step_001",
      "name": "Initial Review",
      "order": 1,
      "stepType": "REVIEW",
      "action": "APPROVE",
      "nextStepId": "step_002",
      "slaDurationMinutes": 480,
      "isEntryPoint": true
    }
  ],
  "versions": [{ "id": "ver_001", "version": 1, "createdAt": "2026-02-10T10:00:00Z" }],
  "analytics": {
    "totalParticipants": 1250,
    "avgCompletionTimeMinutes": 2880,
    "slaComplianceRate": 0.94
  }
}
```

#### Update Workflow

```
PUT /api/v1/workflows/{workflowId}
Authorization: Bearer <token>
X-Tenant-ID: <tenantId>
```

#### Delete Workflow

```
DELETE /api/v1/workflows/{workflowId}
Authorization: Bearer <token>
X-Tenant-ID: <tenantId>
```

> Only DRAFT workflows can be deleted. ACTIVE workflows must be archived.

### 4.2 Step Management

#### Add Step

```
POST /api/v1/workflows/{workflowId}/steps
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Security Clearance",
  "stepType": "APPROVAL",
  "action": "APPROVE",
  "roleId": "role_security",
  "order": 2,
  "nextStepId": "step_003",
  "rejectionTargetId": "step_rejection",
  "slaDurationMinutes": 1440,
  "slaAction": "ESCALATE",
  "slaEscalationRoleId": "role_supervisor",
  "conditions": [
    {
      "field": "participantType.name",
      "operator": "eq",
      "value": "VIP",
      "nextStepId": "step_vip_fast_track"
    }
  ],
  "autoAction": {
    "rule": "autoApprove",
    "conditions": [
      { "field": "organization", "operator": "in", "value": ["AU Commission", "UN Secretariat"] }
    ],
    "delay": 0
  },
  "positionX": 300,
  "positionY": 150
}
```

#### Update Step

```
PUT /api/v1/workflows/{workflowId}/steps/{stepId}
Authorization: Bearer <token>
```

#### Delete Step

```
DELETE /api/v1/workflows/{workflowId}/steps/{stepId}
Authorization: Bearer <token>
```

#### Reorder Steps

```
POST /api/v1/workflows/{workflowId}/steps/reorder
Authorization: Bearer <token>
```

```json
{
  "order": [
    { "stepId": "step_001", "order": 1 },
    { "stepId": "step_003", "order": 2 },
    { "stepId": "step_002", "order": 3 }
  ]
}
```

### 4.3 Workflow Lifecycle

#### Publish Workflow

```
POST /api/v1/workflows/{workflowId}/publish
Authorization: Bearer <token>
```

> Validates workflow structure (entry point exists, no orphan steps, no cycles) before publishing.

**Response: 200 OK**

```json
{
  "workflowId": "wf_xyz789",
  "status": "PUBLISHED",
  "version": {
    "id": "ver_002",
    "version": 2,
    "createdAt": "2026-02-11T12:00:00Z"
  },
  "validation": {
    "valid": true,
    "warnings": ["Step 'Print Badge' has no SLA configured"]
  }
}
```

#### Activate Workflow

```
POST /api/v1/workflows/{workflowId}/activate
Authorization: Bearer <token>
```

#### Suspend Workflow

```
POST /api/v1/workflows/{workflowId}/suspend
Authorization: Bearer <token>
```

#### Archive Workflow

```
POST /api/v1/workflows/{workflowId}/archive
Authorization: Bearer <token>
```

#### Clone Workflow

```
POST /api/v1/workflows/{workflowId}/clone
Authorization: Bearer <token>
```

```json
{
  "name": "VIP Accreditation (Copy)",
  "eventId": "evt_new_event"
}
```

### 4.4 Workflow Execution

#### Process Participant

```
POST /api/v1/workflows/execute/process
Authorization: Bearer <token>
```

```json
{
  "participantId": "part_001",
  "action": "APPROVE",
  "remarks": "Documents verified, all clear"
}
```

**Response: 200 OK**

```json
{
  "participantId": "part_001",
  "previousStep": { "id": "step_001", "name": "Initial Review" },
  "action": "APPROVE",
  "newStep": { "id": "step_002", "name": "Security Clearance" },
  "newStatus": "PENDING",
  "approval": {
    "id": "apr_abc",
    "createdAt": "2026-02-11T14:30:00Z"
  },
  "sideEffects": [
    { "type": "NOTIFICATION", "status": "EXECUTED" },
    { "type": "WEBHOOK", "status": "EXECUTED" }
  ]
}
```

#### Batch Process

```
POST /api/v1/workflows/execute/batch
Authorization: Bearer <token>
```

```json
{
  "participantIds": ["part_001", "part_002", "part_003"],
  "action": "APPROVE",
  "remarks": "Batch approval - standard category"
}
```

**Response: 200 OK**

```json
{
  "batchId": "batch_xyz",
  "total": 3,
  "succeeded": 2,
  "failed": 1,
  "results": [
    { "participantId": "part_001", "status": "success", "newStep": "step_002" },
    { "participantId": "part_002", "status": "success", "newStep": "step_002" },
    {
      "participantId": "part_003",
      "status": "error",
      "error": "Participant not at processable step"
    }
  ]
}
```

#### Simulate / Dry-Run

```
POST /api/v1/workflows/execute/simulate
Authorization: Bearer <token>
```

```json
{
  "workflowId": "wf_xyz789",
  "participantData": {
    "participantType": { "name": "VIP" },
    "organization": "AU Commission",
    "customData": { "needs_visa": true }
  },
  "actions": ["APPROVE", "APPROVE", "APPROVE"]
}
```

**Response: 200 OK**

```json
{
  "simulation": true,
  "path": [
    {
      "step": "Initial Review",
      "action": "APPROVE",
      "autoAction": false,
      "timeEstimateMinutes": 30
    },
    {
      "step": "VIP Fast Track",
      "action": "APPROVE",
      "autoAction": true,
      "routing": "conditional:VIP",
      "timeEstimateMinutes": 0
    },
    { "step": "Badge Printing", "action": "PRINT", "autoAction": false, "timeEstimateMinutes": 5 }
  ],
  "totalSteps": 3,
  "estimatedTotalMinutes": 35,
  "conditionalRoutesUsed": ["VIP Fast Track"],
  "autoActionsTriggered": 1,
  "warnings": []
}
```

### 4.5 Step Assignment

#### Assign Participant to Validator

```
POST /api/v1/workflows/assignments
Authorization: Bearer <token>
```

```json
{
  "participantId": "part_001",
  "stepId": "step_002",
  "assignedTo": "user_validator_01"
}
```

#### Reassign

```
PUT /api/v1/workflows/assignments/{assignmentId}/reassign
Authorization: Bearer <token>
```

```json
{
  "newAssignee": "user_validator_02",
  "reason": "Workload balancing"
}
```

#### Get Validator Queue

```
GET /api/v1/workflows/assignments/queue?assignedTo={userId}&status=active
Authorization: Bearer <token>
```

### 4.6 SLA & Monitoring

#### Get SLA Status

```
GET /api/v1/workflows/{workflowId}/sla-status
Authorization: Bearer <token>
```

**Response: 200 OK**

```json
{
  "workflowId": "wf_xyz789",
  "steps": [
    {
      "stepId": "step_001",
      "stepName": "Initial Review",
      "slaDurationMinutes": 480,
      "participantsAtStep": 45,
      "onTrack": 38,
      "warning": 5,
      "breached": 2
    }
  ],
  "overallComplianceRate": 0.94
}
```

#### Get Overdue Participants

```
GET /api/v1/workflows/{workflowId}/overdue
Authorization: Bearer <token>
```

### 4.7 Analytics

#### Workflow Analytics

```
GET /api/v1/workflows/{workflowId}/analytics?from={date}&to={date}
Authorization: Bearer <token>
```

**Response: 200 OK**

```json
{
  "workflowId": "wf_xyz789",
  "period": { "from": "2026-02-01", "to": "2026-02-11" },
  "summary": {
    "totalProcessed": 1250,
    "avgCompletionMinutes": 2880,
    "slaComplianceRate": 0.94,
    "throughputPerHour": 12.5
  },
  "bottlenecks": [
    {
      "stepId": "step_002",
      "stepName": "Security Clearance",
      "avgMinutes": 1440,
      "severity": "HIGH"
    }
  ],
  "stepMetrics": [
    {
      "stepId": "step_001",
      "stepName": "Initial Review",
      "avgProcessingMinutes": 120,
      "throughputPerHour": 25,
      "slaComplianceRate": 0.98,
      "validatorWorkload": [
        { "userId": "user_01", "processed": 320, "avgMinutes": 115 },
        { "userId": "user_02", "processed": 280, "avgMinutes": 130 }
      ]
    }
  ]
}
```

#### Bottleneck Detection

```
GET /api/v1/workflows/{workflowId}/analytics/bottlenecks
Authorization: Bearer <token>
```

### 4.8 Template Marketplace

#### List Templates

```
GET /api/v1/workflow-templates?category={category}&isPublic=true&page=1&limit=20
Authorization: Bearer <token>
```

#### Create Template from Workflow

```
POST /api/v1/workflow-templates
Authorization: Bearer <token>
```

```json
{
  "workflowId": "wf_xyz789",
  "name": "Standard Media Accreditation",
  "description": "4-step approval pipeline for media events",
  "category": "Media",
  "tags": ["media", "accreditation", "4-step"],
  "isPublic": true
}
```

#### Import Template to Workflow

```
POST /api/v1/workflow-templates/{templateId}/import
Authorization: Bearer <token>
```

```json
{
  "eventId": "evt_new_event",
  "name": "Media Accreditation (from template)"
}
```

---

## 5. Business Logic

### 5.1 Core State Machine

The workflow engine implements a **linked-list state machine** with conditional routing:

```
Step A (APPROVE) → nextStepId → Step B (APPROVE) → nextStepId → Step C (PRINT) → ...
                ↓ REJECT
        Step with isRejectionTarget: true
                ↓ BYPASS
        Step with isBypassTarget: true
```

**`processParticipant(participantId, userId, action, remarks)`** is the core function:

1. Look up participant's current step
2. Execute action (APPROVE, REJECT, BYPASS, PRINT, COLLECT, NOTIFY, ARCHIVE)
3. Evaluate conditional routing rules if any
4. Update participant's status and stepId
5. Create Approval audit record
6. Trigger side effects (email, notification, webhook)

### 5.2 Workflow Versioning

When a participant enters a workflow, a snapshot of the workflow is captured:

```typescript
async function enterWorkflow(participantId: string, workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: true },
  });

  // Get or create version snapshot
  const latestVersion = await prisma.workflowVersion.findFirst({
    where: { workflowId },
    orderBy: { version: "desc" },
  });

  let version = latestVersion;
  if (!version || hasWorkflowChanged(workflow, version.snapshot)) {
    version = await prisma.workflowVersion.create({
      data: {
        workflowId,
        version: (latestVersion?.version ?? 0) + 1,
        snapshot: serializeWorkflow(workflow),
      },
    });
  }

  await prisma.participant.update({
    where: { id: participantId },
    data: { workflowVersionId: version.id },
  });
}
```

In-flight participants complete under their entry version. Editing a live workflow doesn't affect participants already in the pipeline.

**Version comparison utility:**

```typescript
function hasWorkflowChanged(workflow: Workflow & { steps: Step[] }, snapshot: JsonValue): boolean {
  const currentHash = computeWorkflowHash(workflow);
  const snapshotHash = computeWorkflowHash(deserializeWorkflow(snapshot as string));
  return currentHash !== snapshotHash;
}

function computeWorkflowHash(workflow: Workflow & { steps: Step[] }): string {
  const normalized = {
    steps: workflow.steps
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        name: s.name,
        stepType: s.stepType,
        action: s.action,
        nextStepId: s.nextStepId,
        rejectionTargetId: s.rejectionTargetId,
        bypassTargetId: s.bypassTargetId,
        conditions: s.conditions,
        autoAction: s.autoAction,
        slaDurationMinutes: s.slaDurationMinutes,
        slaAction: s.slaAction,
      })),
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function serializeWorkflow(workflow: Workflow & { steps: Step[] }): string {
  return JSON.stringify({
    id: workflow.id,
    name: workflow.name,
    steps: workflow.steps.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      stepType: s.stepType,
      action: s.action,
      roleId: s.roleId,
      formId: s.formId,
      nextStepId: s.nextStepId,
      rejectionTargetId: s.rejectionTargetId,
      bypassTargetId: s.bypassTargetId,
      returnTargetId: s.returnTargetId,
      escalationTargetId: s.escalationTargetId,
      isRejectionTarget: s.isRejectionTarget,
      isBypassTarget: s.isBypassTarget,
      isEntryPoint: s.isEntryPoint,
      isTerminal: s.isTerminal,
      conditions: s.conditions,
      autoAction: s.autoAction,
      slaDurationMinutes: s.slaDurationMinutes,
      slaAction: s.slaAction,
      slaEscalationRoleId: s.slaEscalationRoleId,
      isForkStep: s.isForkStep,
      isJoinStep: s.isJoinStep,
      forkStepIds: s.forkStepIds,
      joinRequirement: s.joinRequirement,
      joinStrategy: s.joinStrategy,
      requiredApprovals: s.requiredApprovals,
      timerDurationMinutes: s.timerDurationMinutes,
      timerAction: s.timerAction,
      webhookUrl: s.webhookUrl,
      webhookMethod: s.webhookMethod,
      assignmentStrategy: s.assignmentStrategy,
    })),
  });
}
```

### 5.3 Conditional Routing

Steps can define conditions for dynamic routing based on participant attributes:

```json
// Step.conditions JSON
[
  {
    "field": "participantType.name",
    "operator": "eq",
    "value": "VIP",
    "nextStepId": "step_vip_fast_track"
  },
  {
    "field": "customData.needs_visa",
    "operator": "eq",
    "value": true,
    "nextStepId": "step_visa_review"
  }
]
```

If no condition matches, the default `nextStepId` is used.

**Condition evaluation engine:**

```typescript
interface RoutingCondition {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "notIn"
    | "contains"
    | "startsWith"
    | "regex";
  value: unknown;
  nextStepId: string;
}

function evaluateConditions(
  conditions: RoutingCondition[],
  participantData: Record<string, unknown>,
): string | null {
  for (const condition of conditions) {
    const fieldValue = getNestedValue(participantData, condition.field);

    if (evaluateSingleCondition(fieldValue, condition.operator, condition.value)) {
      return condition.nextStepId;
    }
  }
  return null; // No condition matched; use default nextStepId
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateSingleCondition(
  fieldValue: unknown,
  operator: RoutingCondition["operator"],
  conditionValue: unknown,
): boolean {
  switch (operator) {
    case "eq":
      return fieldValue === conditionValue;
    case "neq":
      return fieldValue !== conditionValue;
    case "gt":
      return (fieldValue as number) > (conditionValue as number);
    case "gte":
      return (fieldValue as number) >= (conditionValue as number);
    case "lt":
      return (fieldValue as number) < (conditionValue as number);
    case "lte":
      return (fieldValue as number) <= (conditionValue as number);
    case "in":
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
    case "notIn":
      return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(conditionValue as string);
    case "startsWith":
      return typeof fieldValue === "string" && fieldValue.startsWith(conditionValue as string);
    case "regex":
      return (
        typeof fieldValue === "string" && new RegExp(conditionValue as string).test(fieldValue)
      );
    default:
      return false;
  }
}
```

### 5.4 Process Participant -- Full Implementation

The `processParticipant` function is the heart of the workflow engine. It handles all action types, conditional routing, auto-actions, side effects, and error recovery.

```typescript
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// ─── Types ─────────────────────────────────────────────────────────

interface ProcessResult {
  success: boolean;
  participantId: string;
  previousStep: { id: string; name: string };
  action: Action;
  newStep: { id: string; name: string } | null;
  newStatus: ParticipantStatus;
  approval: { id: string; createdAt: Date };
  sideEffects: SideEffectResult[];
  errors: ExecutionError[];
}

interface SideEffectResult {
  type: string;
  status: "EXECUTED" | "FAILED" | "SKIPPED";
  detail?: string;
}

// ─── Core Function ─────────────────────────────────────────────────

async function processParticipant(
  participantId: string,
  userId: string,
  action: Action,
  remarks?: string,
  options: { isDryRun?: boolean; batchId?: string } = {},
): Promise<ProcessResult> {
  const traceId = uuidv4();
  const startTime = Date.now();
  const sideEffects: SideEffectResult[] = [];
  const errors: ExecutionError[] = [];

  // ── Step 1: Load participant with current step ──────────────────

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      step: true,
      event: true,
      participantType: true,
      workflow: { include: { steps: true } },
    },
  });

  if (!participant) {
    throw new WorkflowError("PARTICIPANT_NOT_FOUND", `Participant ${participantId} not found`);
  }

  if (!participant.step) {
    throw new WorkflowError(
      "NO_CURRENT_STEP",
      `Participant ${participantId} is not in a workflow step`,
    );
  }

  const currentStep = participant.step;

  // ── Step 1b: Authorization check ────────────────────────────────

  await validateStepAuthorization(userId, currentStep, participant.tenantId);

  // ── Step 1c: Check for active delegation ────────────────────────

  const delegation = await checkDelegation(userId, currentStep.roleId, participant.workflow?.id);
  const effectiveUserId = delegation ? delegation.delegatorId : userId;
  const delegatedFrom = delegation ? userId : undefined;

  // ── Step 2: Validate action is allowed for this step ────────────

  validateActionForStep(action, currentStep);

  // ── Step 3: Determine next step based on action ─────────────────

  let nextStepId: string | null = null;
  let newStatus: ParticipantStatus;

  switch (action) {
    case "APPROVE": {
      // Check conditional routing first
      const participantData = buildParticipantData(participant);
      if (currentStep.conditions) {
        const conditions = currentStep.conditions as RoutingCondition[];
        const conditionalNext = evaluateConditions(conditions, participantData);
        nextStepId = conditionalNext ?? currentStep.nextStepId;
      } else {
        nextStepId = currentStep.nextStepId;
      }

      // Check if current step is a fork step
      if (currentStep.isForkStep && currentStep.forkStepIds.length > 0) {
        if (!options.isDryRun) {
          await createParallelBranches(participantId, currentStep);
        }
        newStatus = "INPROGRESS";
        nextStepId = currentStep.forkStepIds[0]; // Primary branch
        break;
      }

      // Check counter-based triggers
      if (currentStep.requiredApprovals && currentStep.requiredApprovals > 1) {
        const approvalCount = await getApprovalCountForStep(participantId, currentStep.id);
        if (approvalCount + 1 < currentStep.requiredApprovals) {
          newStatus = "INPROGRESS";
          nextStepId = currentStep.id; // Stay at same step
          break;
        }
      }

      newStatus = nextStepId ? "PENDING" : "APPROVED";
      break;
    }

    case "REJECT": {
      nextStepId = currentStep.rejectionTargetId ?? null;
      newStatus = nextStepId ? "RETURNED" : "REJECTED";
      break;
    }

    case "BYPASS": {
      nextStepId = currentStep.bypassTargetId ?? currentStep.nextStepId;
      newStatus = nextStepId ? "PENDING" : "BYPASSED";
      break;
    }

    case "RETURN": {
      nextStepId = currentStep.returnTargetId;
      if (!nextStepId) {
        throw new WorkflowError(
          "NO_RETURN_TARGET",
          `Step ${currentStep.name} has no return target configured`,
        );
      }
      newStatus = "RETURNED";
      break;
    }

    case "ESCALATE": {
      nextStepId = currentStep.escalationTargetId;
      if (!nextStepId) {
        throw new WorkflowError(
          "NO_ESCALATION_TARGET",
          `Step ${currentStep.name} has no escalation target configured`,
        );
      }
      newStatus = "ESCALATED";
      break;
    }

    case "PRINT": {
      nextStepId = currentStep.nextStepId;
      newStatus = nextStepId ? "PENDING" : "PRINTED";
      // Side effect: trigger badge print job
      sideEffects.push(
        await executeSideEffect("PRINT_BADGE", {
          participantId,
          stepId: currentStep.id,
          isDryRun: options.isDryRun,
        }),
      );
      break;
    }

    case "COLLECT": {
      nextStepId = currentStep.nextStepId;
      newStatus = nextStepId ? "PENDING" : "COLLECTED";
      break;
    }

    case "NOTIFY": {
      nextStepId = currentStep.nextStepId;
      newStatus = nextStepId ? "PENDING" : "NOTIFIED";
      sideEffects.push(
        await executeSideEffect("SEND_NOTIFICATION", {
          participantId,
          stepId: currentStep.id,
          isDryRun: options.isDryRun,
        }),
      );
      break;
    }

    case "ARCHIVE": {
      nextStepId = null;
      newStatus = "ARCHIVED";
      break;
    }

    default:
      throw new WorkflowError("UNKNOWN_ACTION", `Unknown action: ${action}`);
  }

  // ── Step 4: Resolve next step details ───────────────────────────

  let nextStep: Step | null = null;
  if (nextStepId) {
    nextStep = participant.workflow?.steps.find((s) => s.id === nextStepId) ?? null;
    if (!nextStep) {
      nextStep = await prisma.step.findUnique({ where: { id: nextStepId } });
    }
    if (!nextStep) {
      throw new WorkflowError("NEXT_STEP_NOT_FOUND", `Next step ${nextStepId} not found`);
    }

    // If moving to a terminal step, set final status
    if (nextStep.isTerminal && newStatus === "PENDING") {
      newStatus = "COMPLETED";
    }
  }

  // ── Step 5: Persist changes (skip if dry run) ───────────────────

  let approvalRecord: { id: string; createdAt: Date };

  if (options.isDryRun) {
    approvalRecord = { id: `dry_run_${uuidv4()}`, createdAt: new Date() };
  } else {
    const result = await prisma.$transaction(async (tx) => {
      // Update participant
      const updatedParticipant = await tx.participant.update({
        where: { id: participantId },
        data: {
          stepId: nextStepId ?? currentStep.id,
          status: newStatus,
          updatedBy: effectiveUserId,
        },
      });

      // Create approval audit record
      const approval = await tx.approval.create({
        data: {
          participantId,
          stepId: currentStep.id,
          userId: effectiveUserId,
          action,
          remarks,
          previousStatus: participant.status as ParticipantStatus,
          newStatus,
          workflowVersionId: participant.workflowVersionId,
          batchId: options.batchId,
          isDryRun: false,
          delegatedFrom,
          processingTimeMs: Date.now() - startTime,
        },
      });

      // Deactivate current assignments
      await tx.stepAssignment.updateMany({
        where: { participantId, stepId: currentStep.id, isActive: true },
        data: { isActive: false },
      });

      return { participant: updatedParticipant, approval };
    });

    approvalRecord = { id: result.approval.id, createdAt: result.approval.createdAt };

    // ── Step 6: Trigger side effects ──────────────────────────────

    // Emit domain events
    workflowEvents.emitWorkflowEvent("participant.advanced", {
      participantId,
      fromStepId: currentStep.id,
      toStepId: nextStepId ?? currentStep.id,
      action,
    });

    if (action === "APPROVE") {
      workflowEvents.emitWorkflowEvent("participant.approved", {
        participantId,
        stepId: currentStep.id,
        userId: effectiveUserId,
        remarks,
      });
    } else if (action === "REJECT") {
      workflowEvents.emitWorkflowEvent("participant.rejected", {
        participantId,
        stepId: currentStep.id,
        userId: effectiveUserId,
        reason: remarks ?? "",
      });
    }

    // Check for terminal state
    if (
      !nextStepId ||
      newStatus === "COMPLETED" ||
      newStatus === "REJECTED" ||
      newStatus === "ARCHIVED"
    ) {
      workflowEvents.emitWorkflowEvent("participant.completed", {
        participantId,
        workflowId: participant.workflowId!,
        finalStatus: newStatus,
      });
    }

    // Execute webhook if configured
    if (currentStep.webhookUrl) {
      sideEffects.push(
        await executeSideEffect("WEBHOOK", {
          participantId,
          stepId: currentStep.id,
          url: currentStep.webhookUrl,
          method: currentStep.webhookMethod ?? "POST",
          headers: currentStep.webhookHeaders,
          payloadTemplate: currentStep.webhookPayloadTemplate,
          participant,
          action,
          isDryRun: false,
        }),
      );
    }

    // Send notification
    sideEffects.push(
      await executeSideEffect("NOTIFICATION", {
        participantId,
        action,
        stepName: currentStep.name,
        nextStepName: nextStep?.name,
        isDryRun: false,
      }),
    );

    // Auto-assign at next step if configured
    if (nextStep && nextStep.assignmentStrategy !== "MANUAL") {
      sideEffects.push(
        await executeSideEffect("AUTO_ASSIGN", {
          participantId,
          step: nextStep,
          isDryRun: false,
        }),
      );
    }

    // Check for auto-action at next step
    if (nextStep?.autoAction) {
      sideEffects.push(await executeAutoAction(participantId, nextStep, options));
    }
  }

  return {
    success: true,
    participantId,
    previousStep: { id: currentStep.id, name: currentStep.name },
    action,
    newStep: nextStep ? { id: nextStep.id, name: nextStep.name } : null,
    newStatus,
    approval: approvalRecord,
    sideEffects,
    errors,
  };
}

// ─── Side Effect Executor ──────────────────────────────────────────

async function executeSideEffect(
  type: string,
  payload: Record<string, unknown>,
): Promise<SideEffectResult> {
  if (payload.isDryRun) {
    return { type, status: "SKIPPED", detail: "Dry run mode" };
  }

  try {
    switch (type) {
      case "WEBHOOK":
        await executeWebhook(payload);
        return { type, status: "EXECUTED" };

      case "NOTIFICATION":
        await sendWorkflowNotification(payload);
        return { type, status: "EXECUTED" };

      case "PRINT_BADGE":
        await triggerBadgePrint(payload.participantId as string);
        return { type, status: "EXECUTED" };

      case "SEND_NOTIFICATION":
        await sendStepNotification(payload);
        return { type, status: "EXECUTED" };

      case "AUTO_ASSIGN":
        await autoAssignParticipant(payload);
        return { type, status: "EXECUTED" };

      default:
        return { type, status: "SKIPPED", detail: `Unknown side effect type: ${type}` };
    }
  } catch (error) {
    // Side effects should not fail the main transaction
    console.error(`Side effect ${type} failed:`, error);
    return { type, status: "FAILED", detail: (error as Error).message };
  }
}

// ─── Authorization ─────────────────────────────────────────────────

async function validateStepAuthorization(
  userId: string,
  step: Step,
  tenantId: string,
): Promise<void> {
  if (!step.roleId) return; // No role restriction

  // Check direct role assignment
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId: step.roleId,
      tenantId,
    },
  });

  if (userRole) return;

  // Check delegation
  const delegation = await prisma.delegation.findFirst({
    where: {
      delegateeId: userId,
      roleId: step.roleId,
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
  });

  if (delegation) return;

  throw new WorkflowError(
    "UNAUTHORIZED_STEP",
    `User ${userId} does not have role ${step.roleId} required for step ${step.name}`,
  );
}

// ─── Action Validation ─────────────────────────────────────────────

function validateActionForStep(action: Action, step: Step): void {
  const allowedActions: Record<StepType, Action[]> = {
    REVIEW: ["APPROVE", "REJECT", "BYPASS", "RETURN", "ESCALATE"],
    APPROVAL: ["APPROVE", "REJECT", "BYPASS", "RETURN", "ESCALATE"],
    PRINT: ["PRINT", "BYPASS", "RETURN"],
    COLLECT: ["COLLECT", "BYPASS", "RETURN"],
    NOTIFICATION: ["NOTIFY", "BYPASS"],
    CUSTOM: ["APPROVE", "REJECT", "BYPASS", "RETURN", "ESCALATE", "ARCHIVE"],
    FORK: ["APPROVE"],
    JOIN: ["APPROVE"],
    TIMER: ["APPROVE", "BYPASS"],
    COUNTER: ["APPROVE", "REJECT"],
  };

  const allowed = allowedActions[step.stepType] ?? [];
  if (!allowed.includes(action)) {
    throw new WorkflowError(
      "INVALID_ACTION",
      `Action ${action} is not valid for step type ${step.stepType} at step ${step.name}`,
    );
  }
}

// ─── Workflow Error Class ──────────────────────────────────────────

class WorkflowError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean = false,
  ) {
    super(message);
    this.name = "WorkflowError";
  }
}
```

### 5.5 SLA Enforcement

Background job checks for overdue steps and triggers configurable actions:

```typescript
async function checkOverdueSLAs() {
  const overdueParticipants = await prisma.participant.findMany({
    where: {
      status: { in: ["PENDING", "INPROGRESS"] },
      step: { slaDurationMinutes: { not: null } },
    },
    include: { step: true, approvals: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  for (const p of overdueParticipants) {
    const lastAction = p.approvals[0]?.createdAt ?? p.createdAt;
    const slaDeadline = addMinutes(lastAction, p.step.slaDurationMinutes!);
    if (isAfter(new Date(), slaDeadline)) {
      await escalateParticipant(p.id, p.step);
    }
  }
}
```

Actions on SLA breach: email alert, auto-escalate to supervisor, auto-approve, create notification.

**Extended SLA enforcement with warning thresholds and multiple actions:**

```typescript
import { addMinutes, isAfter, differenceInMinutes } from "date-fns";

async function checkOverdueSLAsExtended(): Promise<SLACheckResult> {
  const result: SLACheckResult = {
    checked: 0,
    warnings: 0,
    breached: 0,
    actions: [],
  };

  const participantsWithSLA = await prisma.participant.findMany({
    where: {
      status: { in: ["PENDING", "INPROGRESS"] },
      step: { slaDurationMinutes: { not: null } },
    },
    include: {
      step: true,
      approvals: { orderBy: { createdAt: "desc" }, take: 1 },
      event: { select: { tenantId: true } },
    },
  });

  result.checked = participantsWithSLA.length;

  for (const p of participantsWithSLA) {
    const lastAction = p.approvals[0]?.createdAt ?? p.createdAt;
    const slaDeadline = addMinutes(lastAction, p.step.slaDurationMinutes!);
    const now = new Date();

    // Check warning threshold
    if (p.step.slaWarningMinutes) {
      const warningDeadline = addMinutes(
        lastAction,
        p.step.slaDurationMinutes! - p.step.slaWarningMinutes,
      );
      if (isAfter(now, warningDeadline) && !isAfter(now, slaDeadline)) {
        result.warnings++;
        const remainingMinutes = differenceInMinutes(slaDeadline, now);

        workflowEvents.emitWorkflowEvent("sla.warning", {
          participantId: p.id,
          stepId: p.step.id,
          remainingMinutes,
        });

        await sendSLAWarningNotification(p, remainingMinutes);
      }
    }

    // Check breach
    if (isAfter(now, slaDeadline)) {
      result.breached++;
      const overdueMinutes = differenceInMinutes(now, slaDeadline);

      workflowEvents.emitWorkflowEvent("sla.breached", {
        participantId: p.id,
        stepId: p.step.id,
        overdueMinutes,
      });

      const actionResult = await executeSLAAction(p, overdueMinutes);
      result.actions.push(actionResult);
    }
  }

  return result;
}

async function executeSLAAction(
  participant: ParticipantWithStep,
  overdueMinutes: number,
): Promise<SLAActionResult> {
  const step = participant.step;

  switch (step.slaAction) {
    case "NOTIFY":
      await sendSLABreachNotification(participant, overdueMinutes);
      return { participantId: participant.id, action: "NOTIFY", success: true };

    case "ESCALATE":
      await escalateParticipant(participant.id, step);
      return { participantId: participant.id, action: "ESCALATE", success: true };

    case "AUTO_APPROVE":
      await processParticipant(
        participant.id,
        "SYSTEM",
        "APPROVE",
        `Auto-approved: SLA breached by ${overdueMinutes} minutes`,
      );
      return { participantId: participant.id, action: "AUTO_APPROVE", success: true };

    case "AUTO_REJECT":
      await processParticipant(
        participant.id,
        "SYSTEM",
        "REJECT",
        `Auto-rejected: SLA breached by ${overdueMinutes} minutes`,
      );
      return { participantId: participant.id, action: "AUTO_REJECT", success: true };

    case "REASSIGN":
      await reassignToLeastLoaded(participant.id, step);
      return { participantId: participant.id, action: "REASSIGN", success: true };

    default:
      await sendSLABreachNotification(participant, overdueMinutes);
      return { participantId: participant.id, action: "NOTIFY", success: true };
  }
}

async function escalateParticipant(participantId: string, step: Step): Promise<void> {
  if (step.escalationTargetId) {
    await processParticipant(
      participantId,
      "SYSTEM",
      "ESCALATE",
      `Auto-escalated: SLA breached at step ${step.name}`,
    );
  } else if (step.slaEscalationRoleId) {
    // Find supervisor in the escalation role and assign
    const supervisor = await findAvailableUser(step.slaEscalationRoleId);
    if (supervisor) {
      await assignParticipant(participantId, step.id, supervisor.id, "SYSTEM");
    }
  }
}

interface SLACheckResult {
  checked: number;
  warnings: number;
  breached: number;
  actions: SLAActionResult[];
}

interface SLAActionResult {
  participantId: string;
  action: string;
  success: boolean;
  error?: string;
}
```

**SLA check job registration with pg-boss:**

```typescript
import PgBoss from "pg-boss";

async function registerSLACheckJob(boss: PgBoss): Promise<void> {
  await boss.schedule("workflow:check-sla", "*/5 * * * *"); // Every 5 minutes

  await boss.work("workflow:check-sla", async () => {
    const result = await checkOverdueSLAsExtended();
    console.log(
      `SLA check complete: ${result.checked} checked, ${result.warnings} warnings, ${result.breached} breached`,
    );
    return result;
  });
}

async function registerTimerCheckJob(boss: PgBoss): Promise<void> {
  await boss.schedule("workflow:check-timers", "*/1 * * * *"); // Every minute

  await boss.work("workflow:check-timers", async () => {
    return await checkTimerTriggers();
  });
}
```

### 5.6 Step Assignment & Reassignment

```typescript
// Assign a participant to a specific user within the step's role
async function assignParticipant(participantId, stepId, assignedTo, assignedBy) {
  await prisma.stepAssignment.create({
    data: { participantId, stepId, assignedTo, assignedBy },
  });
  // Notify assigned user
  await createNotification(assignedTo, "ASSIGNMENT", `New assignment: ${participantId}`);
}
```

**Extended assignment with round-robin and least-loaded strategies:**

```typescript
async function autoAssignParticipant(payload: {
  participantId: string;
  step: Step;
}): Promise<void> {
  const { participantId, step } = payload;

  if (!step.roleId) return;

  let assigneeId: string | null = null;

  switch (step.assignmentStrategy) {
    case "ROUND_ROBIN":
      assigneeId = await getNextRoundRobinUser(step.roleId, step.id);
      break;

    case "LEAST_LOADED":
      assigneeId = await getLeastLoadedUser(step.roleId, step.id);
      break;

    case "AUTO":
      // Try least-loaded first, fall back to round-robin
      assigneeId = await getLeastLoadedUser(step.roleId, step.id);
      if (!assigneeId) {
        assigneeId = await getNextRoundRobinUser(step.roleId, step.id);
      }
      break;

    case "MANUAL":
    default:
      return; // No auto-assignment
  }

  if (assigneeId) {
    await assignParticipant(participantId, step.id, assigneeId, "SYSTEM");
  }
}

async function getNextRoundRobinUser(roleId: string, stepId: string): Promise<string | null> {
  // Get all users with this role
  const usersWithRole = await prisma.userRole.findMany({
    where: { roleId },
    select: { userId: true },
  });

  if (usersWithRole.length === 0) return null;

  // Get last assignment for this step
  const lastAssignment = await prisma.stepAssignment.findFirst({
    where: { stepId },
    orderBy: { createdAt: "desc" },
    select: { assignedTo: true },
  });

  const userIds = usersWithRole.map((u) => u.userId);
  if (!lastAssignment) return userIds[0];

  const lastIndex = userIds.indexOf(lastAssignment.assignedTo);
  const nextIndex = (lastIndex + 1) % userIds.length;
  return userIds[nextIndex];
}

async function getLeastLoadedUser(roleId: string, stepId: string): Promise<string | null> {
  const usersWithRole = await prisma.userRole.findMany({
    where: { roleId },
    select: { userId: true },
  });

  if (usersWithRole.length === 0) return null;

  // Count active assignments per user
  const workloads = await Promise.all(
    usersWithRole.map(async (u) => ({
      userId: u.userId,
      activeCount: await prisma.stepAssignment.count({
        where: { assignedTo: u.userId, isActive: true },
      }),
    })),
  );

  // Check for active delegations (exclude absent validators)
  const availableUsers = [];
  for (const w of workloads) {
    const isDelegating = await prisma.delegation.findFirst({
      where: {
        delegatorId: w.userId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });
    if (!isDelegating) {
      availableUsers.push(w);
    }
  }

  if (availableUsers.length === 0) {
    // All users are delegating; fall back to all users
    availableUsers.push(...workloads);
  }

  availableUsers.sort((a, b) => a.activeCount - b.activeCount);
  return availableUsers[0].userId;
}

async function reassignParticipant(
  participantId: string,
  stepId: string,
  newAssignee: string,
  reassignedBy: string,
  reason: string,
): Promise<void> {
  // Deactivate current assignment
  const currentAssignment = await prisma.stepAssignment.findFirst({
    where: { participantId, stepId, isActive: true },
  });

  if (currentAssignment) {
    await prisma.stepAssignment.update({
      where: { id: currentAssignment.id },
      data: { isActive: false },
    });

    workflowEvents.emitWorkflowEvent("step.reassigned", {
      participantId,
      stepId,
      from: currentAssignment.assignedTo,
      to: newAssignee,
    });
  }

  // Create new assignment
  await prisma.stepAssignment.create({
    data: {
      participantId,
      stepId,
      assignedTo: newAssignee,
      assignedBy: reassignedBy,
      reason,
    },
  });

  await createNotification(newAssignee, "REASSIGNMENT", `Reassigned: ${participantId} - ${reason}`);
}
```

### 5.7 Auto-Action Rules

Steps can define rules for automatic execution:

```json
// Step.autoAction JSON
{
  "rule": "autoApprove",
  "conditions": [
    { "field": "organization", "operator": "in", "value": ["AU Commission", "UN Secretariat"] }
  ],
  "delay": 0
}
```

**Auto-action execution engine:**

```typescript
interface AutoActionConfig {
  rule: "autoApprove" | "autoReject" | "autoBypass" | "autoRoute" | "autoNotify";
  conditions: RoutingCondition[];
  delay: number; // Delay in minutes before auto-action (0 = immediate)
  targetStepId?: string; // For autoRoute
}

async function executeAutoAction(
  participantId: string,
  step: Step,
  options: { isDryRun?: boolean } = {},
): Promise<SideEffectResult> {
  const config = step.autoAction as unknown as AutoActionConfig;
  if (!config) return { type: "AUTO_ACTION", status: "SKIPPED" };

  // Load participant data for condition evaluation
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { participantType: true },
  });

  if (!participant)
    return { type: "AUTO_ACTION", status: "FAILED", detail: "Participant not found" };

  const participantData = buildParticipantData(participant);

  // Evaluate conditions
  const conditionsMet = config.conditions.every((condition) =>
    evaluateSingleCondition(
      getNestedValue(participantData, condition.field),
      condition.operator,
      condition.value,
    ),
  );

  if (!conditionsMet) {
    return { type: "AUTO_ACTION", status: "SKIPPED", detail: "Conditions not met" };
  }

  if (options.isDryRun) {
    return { type: "AUTO_ACTION", status: "SKIPPED", detail: `Would execute ${config.rule}` };
  }

  // Apply delay if configured
  if (config.delay > 0) {
    await scheduleDelayedAutoAction(participantId, step.id, config);
    return { type: "AUTO_ACTION", status: "EXECUTED", detail: `Scheduled for ${config.delay}m` };
  }

  // Execute immediately
  const actionMap: Record<string, Action> = {
    autoApprove: "APPROVE",
    autoReject: "REJECT",
    autoBypass: "BYPASS",
    autoNotify: "NOTIFY",
  };

  const action = actionMap[config.rule];
  if (action) {
    await processParticipant(
      participantId,
      "SYSTEM",
      action,
      `Auto-action: ${config.rule} triggered by rule`,
    );
    return { type: "AUTO_ACTION", status: "EXECUTED", detail: config.rule };
  }

  return { type: "AUTO_ACTION", status: "FAILED", detail: `Unknown rule: ${config.rule}` };
}

async function scheduleDelayedAutoAction(
  participantId: string,
  stepId: string,
  config: AutoActionConfig,
): Promise<void> {
  const boss = getPgBossInstance();
  await boss.send(
    "workflow:delayed-auto-action",
    {
      participantId,
      stepId,
      config,
    },
    {
      startAfter: config.delay * 60, // Convert minutes to seconds
      retryLimit: 3,
      retryDelay: 30,
    },
  );
}
```

### 5.8 Batch Operations

First-class batch approve/reject/bypass:

```typescript
async function batchProcessParticipants(
  participantIds: string[],
  userId: string,
  action: Action,
  remarks: string,
) {
  const results = await Promise.allSettled(
    participantIds.map((id) => processParticipant(id, userId, action, remarks)),
  );
  // Single audit entry for batch + individual approval records
  await createAuditLog({
    action: "BATCH_" + action,
    metadata: {
      count: participantIds.length,
      succeeded: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    },
  });
}
```

**Extended batch processing with concurrency control and progress tracking:**

```typescript
interface BatchProcessOptions {
  concurrency: number; // Max parallel operations
  stopOnError: boolean; // Stop batch on first error
  notifyOnComplete: boolean; // Send summary notification
}

interface BatchResult {
  batchId: string;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: BatchItemResult[];
  durationMs: number;
}

interface BatchItemResult {
  participantId: string;
  status: "success" | "error" | "skipped";
  newStep?: string;
  error?: string;
}

async function batchProcessParticipantsExtended(
  participantIds: string[],
  userId: string,
  action: Action,
  remarks: string,
  options: BatchProcessOptions = { concurrency: 10, stopOnError: false, notifyOnComplete: true },
): Promise<BatchResult> {
  const batchId = uuidv4();
  const startTime = Date.now();
  const results: BatchItemResult[] = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  workflowEvents.emitWorkflowEvent("batch.started", {
    batchId,
    count: participantIds.length,
    action,
  });

  // Process in chunks for concurrency control
  const chunks = chunkArray(participantIds, options.concurrency);

  for (const chunk of chunks) {
    if (options.stopOnError && failed > 0) {
      skipped += chunk.length;
      chunk.forEach((id) => results.push({ participantId: id, status: "skipped" }));
      continue;
    }

    const chunkResults = await Promise.allSettled(
      chunk.map((id) => processParticipant(id, userId, action, remarks, { batchId })),
    );

    for (let i = 0; i < chunkResults.length; i++) {
      const result = chunkResults[i];
      const participantId = chunk[i];

      if (result.status === "fulfilled") {
        succeeded++;
        results.push({
          participantId,
          status: "success",
          newStep: result.value.newStep?.name,
        });
      } else {
        failed++;
        results.push({
          participantId,
          status: "error",
          error: result.reason?.message ?? "Unknown error",
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;

  // Create batch audit log
  await createAuditLog({
    action: "BATCH_" + action,
    userId,
    metadata: {
      batchId,
      count: participantIds.length,
      succeeded,
      failed,
      skipped,
      durationMs,
    },
  });

  workflowEvents.emitWorkflowEvent("batch.completed", {
    batchId,
    succeeded,
    failed,
  });

  if (options.notifyOnComplete) {
    await createNotification(
      userId,
      "BATCH_COMPLETE",
      `Batch ${action}: ${succeeded}/${participantIds.length} succeeded (${failed} failed)`,
    );
  }

  return { batchId, total: participantIds.length, succeeded, failed, skipped, results, durationMs };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 5.9 Parallel Paths (Fork/Join)

When a step forks to multiple parallel review paths, a join step waits for all parallel paths to complete before advancing.

```
                        ┌──────────────┐
                   ┌───▶│ Security     │───┐
                   │    │ Review       │   │
┌──────────┐       │    └──────────────┘   │    ┌──────────┐
│  Fork    │───────┤                       ├───▶│  Join    │──▶ Next Step
│  Step    │       │    ┌──────────────┐   │    │  Step    │
└──────────┘       ├───▶│ Document     │───┤    └──────────┘
                   │    │ Verification │   │
                   │    └──────────────┘   │
                   │    ┌──────────────┐   │
                   └───▶│ Background   │───┘
                        │ Check        │
                        └──────────────┘
```

```typescript
// ─── Fork: Create parallel branches ────────────────────────────────

async function createParallelBranches(participantId: string, forkStep: Step): Promise<void> {
  const branches = forkStep.forkStepIds;

  if (branches.length === 0) {
    throw new WorkflowError(
      "NO_FORK_BRANCHES",
      `Fork step ${forkStep.name} has no branches configured`,
    );
  }

  // Create a ParallelBranch record for each branch
  await prisma.parallelBranch.createMany({
    data: branches.map((branchStepId) => ({
      participantId,
      forkStepId: forkStep.id,
      branchStepId,
      status: "PENDING" as ParticipantStatus,
    })),
  });

  workflowEvents.emitWorkflowEvent("parallel.forked", {
    participantId,
    forkStepId: forkStep.id,
    branchStepIds: branches,
  });
}

// ─── Process a parallel branch ─────────────────────────────────────

async function processParallelBranch(
  participantId: string,
  branchStepId: string,
  userId: string,
  action: Action,
  remarks?: string,
): Promise<{ branchComplete: boolean; allComplete: boolean }> {
  // Find the branch record
  const branch = await prisma.parallelBranch.findFirst({
    where: { participantId, branchStepId, status: "PENDING" },
    include: { branchStep: true },
  });

  if (!branch) {
    throw new WorkflowError("BRANCH_NOT_FOUND", `No pending branch at step ${branchStepId}`);
  }

  // Update branch status
  await prisma.parallelBranch.update({
    where: { id: branch.id },
    data: {
      status: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "BYPASSED",
      completedAt: new Date(),
      completedBy: userId,
      action,
      remarks,
    },
  });

  // Create approval record for the branch
  await prisma.approval.create({
    data: {
      participantId,
      stepId: branchStepId,
      userId,
      action,
      remarks,
      previousStatus: "INPROGRESS",
      newStatus: action === "APPROVE" ? "APPROVED" : "REJECTED",
    },
  });

  // Check if join condition is met
  const allComplete = await checkJoinCondition(participantId, branch.forkStepId);

  return { branchComplete: true, allComplete };
}

// ─── Join: Check if all branches are complete ──────────────────────

async function checkJoinCondition(participantId: string, forkStepId: string): Promise<boolean> {
  const forkStep = await prisma.step.findUnique({
    where: { id: forkStepId },
  });

  if (!forkStep) return false;

  const branches = await prisma.parallelBranch.findMany({
    where: { participantId, forkStepId },
  });

  const completedBranches = branches.filter(
    (b) => b.status !== "PENDING" && b.status !== "INPROGRESS",
  );
  const approvedBranches = branches.filter((b) => b.status === "APPROVED");

  const joinStrategy = forkStep.joinStrategy ?? "ALL";
  const joinRequirement = forkStep.joinRequirement ?? branches.length;

  let conditionMet = false;

  switch (joinStrategy) {
    case "ALL":
      conditionMet = completedBranches.length === branches.length;
      break;
    case "ANY":
      conditionMet = approvedBranches.length >= 1;
      break;
    case "MAJORITY":
      conditionMet = approvedBranches.length > branches.length / 2;
      break;
    default:
      conditionMet = completedBranches.length >= joinRequirement;
  }

  if (conditionMet) {
    // Find the join step (next step after the fork step)
    const joinStepId = forkStep.nextStepId;
    if (joinStepId) {
      // Advance participant to the join step
      await prisma.participant.update({
        where: { id: participantId },
        data: { stepId: joinStepId, status: "PENDING" },
      });

      workflowEvents.emitWorkflowEvent("parallel.joined", {
        participantId,
        joinStepId,
      });
    }
  }

  return conditionMet;
}
```

### 5.10 Multi-Level Escalation Chains

Escalation flows from reviewer to supervisor to admin with configurable timeouts at each level.

```typescript
interface EscalationChain {
  levels: EscalationLevel[];
}

interface EscalationLevel {
  level: number;
  roleId: string;
  timeoutMinutes: number;
  action: "REASSIGN" | "NOTIFY" | "AUTO_APPROVE" | "AUTO_REJECT";
  notifyPrevious: boolean;
}

// Default escalation chain
const DEFAULT_ESCALATION_CHAIN: EscalationChain = {
  levels: [
    {
      level: 1,
      roleId: "role_reviewer",
      timeoutMinutes: 480,
      action: "NOTIFY",
      notifyPrevious: false,
    },
    {
      level: 2,
      roleId: "role_supervisor",
      timeoutMinutes: 240,
      action: "REASSIGN",
      notifyPrevious: true,
    },
    {
      level: 3,
      roleId: "role_admin",
      timeoutMinutes: 120,
      action: "AUTO_APPROVE",
      notifyPrevious: true,
    },
  ],
};

async function handleEscalation(
  participantId: string,
  stepId: string,
  currentLevel: number,
  chain: EscalationChain = DEFAULT_ESCALATION_CHAIN,
): Promise<void> {
  const nextLevel = chain.levels.find((l) => l.level === currentLevel + 1);

  if (!nextLevel) {
    // Final escalation level reached -- auto-approve
    await processParticipant(
      participantId,
      "SYSTEM",
      "APPROVE",
      `Auto-approved: Maximum escalation level reached`,
    );
    return;
  }

  // Find available user at the escalation role
  const escalateTo = await findAvailableUser(nextLevel.roleId);

  if (!escalateTo) {
    // No user available at this level -- skip to next
    await handleEscalation(participantId, stepId, nextLevel.level, chain);
    return;
  }

  // Execute escalation action
  switch (nextLevel.action) {
    case "REASSIGN":
      await reassignParticipant(participantId, stepId, escalateTo.id, "SYSTEM", "SLA escalation");
      break;

    case "NOTIFY":
      await createNotification(
        escalateTo.id,
        "ESCALATION",
        `Escalation Level ${nextLevel.level}: Participant ${participantId} requires attention`,
      );
      break;

    case "AUTO_APPROVE":
      await processParticipant(
        participantId,
        "SYSTEM",
        "APPROVE",
        `Auto-approved at escalation level ${nextLevel.level}`,
      );
      return;

    case "AUTO_REJECT":
      await processParticipant(
        participantId,
        "SYSTEM",
        "REJECT",
        `Auto-rejected at escalation level ${nextLevel.level}`,
      );
      return;
  }

  // Notify previous assignees if configured
  if (nextLevel.notifyPrevious) {
    const previousAssignments = await prisma.stepAssignment.findMany({
      where: { participantId, stepId, isActive: false },
      select: { assignedTo: true },
    });

    for (const prev of previousAssignments) {
      await createNotification(
        prev.assignedTo,
        "ESCALATION_NOTICE",
        `Participant ${participantId} has been escalated to level ${nextLevel.level}`,
      );
    }
  }

  // Schedule next escalation check
  const boss = getPgBossInstance();
  await boss.send(
    "workflow:escalation-check",
    {
      participantId,
      stepId,
      currentLevel: nextLevel.level,
      chain,
    },
    {
      startAfter: nextLevel.timeoutMinutes * 60,
      singletonKey: `escalation:${participantId}:${stepId}`,
    },
  );

  workflowEvents.emitWorkflowEvent("participant.escalated", {
    participantId,
    stepId,
    escalationLevel: nextLevel.level,
  });
}

async function findAvailableUser(roleId: string): Promise<{ id: string } | null> {
  const usersWithRole = await prisma.userRole.findMany({
    where: { roleId },
    select: { userId: true },
  });

  // Filter out users who are currently delegating their authority
  for (const u of usersWithRole) {
    const isDelegating = await prisma.delegation.findFirst({
      where: {
        delegatorId: u.userId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });
    if (!isDelegating) {
      return { id: u.userId };
    }
  }

  return usersWithRole.length > 0 ? { id: usersWithRole[0].userId } : null;
}
```

### 5.11 Simulation / Dry-Run Mode

Test a workflow with sample participant data, showing the path taken and time estimates, without creating real records.

```typescript
interface SimulationInput {
  workflowId: string;
  participantData: Record<string, unknown>;
  actions: Action[]; // Sequence of actions to simulate
  maxSteps?: number; // Safety limit (default 50)
}

interface SimulationResult {
  simulation: true;
  path: SimulationStep[];
  totalSteps: number;
  estimatedTotalMinutes: number;
  conditionalRoutesUsed: string[];
  autoActionsTriggered: number;
  parallelPathsEncountered: number;
  warnings: string[];
}

interface SimulationStep {
  step: string;
  stepId: string;
  stepType: StepType;
  action: Action;
  autoAction: boolean;
  routing: string; // 'default' | 'conditional:<reason>' | 'rejection' | 'bypass'
  timeEstimateMinutes: number;
  slaConfigured: boolean;
  slaDurationMinutes?: number;
  roleRequired?: string;
  formRequired?: string;
}

async function simulateWorkflow(input: SimulationInput): Promise<SimulationResult> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: input.workflowId },
    include: { steps: true },
  });

  if (!workflow) {
    throw new WorkflowError("WORKFLOW_NOT_FOUND", `Workflow ${input.workflowId} not found`);
  }

  const maxSteps = input.maxSteps ?? 50;
  const path: SimulationStep[] = [];
  const warnings: string[] = [];
  const conditionalRoutesUsed: string[] = [];
  let autoActionsTriggered = 0;
  let parallelPathsEncountered = 0;
  let estimatedTotalMinutes = 0;

  // Find entry point
  let currentStep = workflow.steps.find((s) => s.isEntryPoint);
  if (!currentStep) {
    currentStep = workflow.steps.sort((a, b) => a.order - b.order)[0];
  }

  if (!currentStep) {
    throw new WorkflowError("NO_ENTRY_POINT", "Workflow has no steps");
  }

  let actionIndex = 0;

  while (currentStep && path.length < maxSteps) {
    const action = input.actions[actionIndex] ?? "APPROVE";
    let routing = "default";
    let isAutoAction = false;

    // Check auto-action
    if (currentStep.autoAction) {
      const config = currentStep.autoAction as unknown as AutoActionConfig;
      const conditionsMet = config.conditions.every((cond) =>
        evaluateSingleCondition(
          getNestedValue(input.participantData, cond.field),
          cond.operator,
          cond.value,
        ),
      );
      if (conditionsMet) {
        isAutoAction = true;
        autoActionsTriggered++;
      }
    }

    // Estimate processing time
    let timeEstimate = 0;
    if (!isAutoAction) {
      // Estimate based on step type
      const timeEstimates: Record<StepType, number> = {
        REVIEW: 30,
        APPROVAL: 60,
        PRINT: 5,
        COLLECT: 2,
        NOTIFICATION: 0,
        CUSTOM: 30,
        FORK: 0,
        JOIN: 0,
        TIMER: currentStep.timerDurationMinutes ?? 0,
        COUNTER: 30,
      };
      timeEstimate = timeEstimates[currentStep.stepType] ?? 30;
    }

    // Check parallel paths
    if (currentStep.isForkStep) {
      parallelPathsEncountered++;
    }

    path.push({
      step: currentStep.name,
      stepId: currentStep.id,
      stepType: currentStep.stepType,
      action: isAutoAction
        ? (currentStep.autoAction as any).rule === "autoApprove"
          ? "APPROVE"
          : action
        : action,
      autoAction: isAutoAction,
      routing,
      timeEstimateMinutes: timeEstimate,
      slaConfigured: currentStep.slaDurationMinutes !== null,
      slaDurationMinutes: currentStep.slaDurationMinutes ?? undefined,
      roleRequired: currentStep.roleId ?? undefined,
      formRequired: currentStep.formId ?? undefined,
    });

    estimatedTotalMinutes += timeEstimate;

    // Determine next step
    let nextStepId: string | null = null;

    if (action === "APPROVE" || isAutoAction) {
      // Check conditional routing
      if (currentStep.conditions) {
        const conditions = currentStep.conditions as RoutingCondition[];
        const conditionalNext = evaluateConditions(conditions, input.participantData);
        if (conditionalNext) {
          nextStepId = conditionalNext;
          const matchedCondition = conditions.find((c) => c.nextStepId === conditionalNext);
          routing = `conditional:${matchedCondition?.field}=${matchedCondition?.value}`;
          conditionalRoutesUsed.push(routing);
        }
      }
      if (!nextStepId) {
        nextStepId = currentStep.nextStepId;
      }
    } else if (action === "REJECT") {
      nextStepId = currentStep.rejectionTargetId;
      routing = "rejection";
    } else if (action === "BYPASS") {
      nextStepId = currentStep.bypassTargetId ?? currentStep.nextStepId;
      routing = "bypass";
    }

    // Update routing in path
    path[path.length - 1].routing = routing;

    // Move to next step
    if (nextStepId) {
      currentStep = workflow.steps.find((s) => s.id === nextStepId) ?? null;
    } else {
      currentStep = null;
    }

    if (!isAutoAction) {
      actionIndex++;
    }
  }

  if (path.length >= maxSteps) {
    warnings.push(`Simulation stopped at ${maxSteps} steps (safety limit)`);
  }

  return {
    simulation: true,
    path,
    totalSteps: path.length,
    estimatedTotalMinutes,
    conditionalRoutesUsed,
    autoActionsTriggered,
    parallelPathsEncountered,
    warnings,
  };
}
```

### 5.12 Workflow Analytics

Bottleneck detection, throughput analysis, SLA compliance rates, and validator workload distribution.

```typescript
interface WorkflowAnalyticsResult {
  workflowId: string;
  period: { from: Date; to: Date };
  summary: WorkflowSummary;
  bottlenecks: BottleneckReport[];
  stepMetrics: StepMetrics[];
  throughputTimeSeries: TimeSeriesPoint[];
  slaComplianceTimeSeries: TimeSeriesPoint[];
}

interface WorkflowSummary {
  totalParticipants: number;
  completedParticipants: number;
  activeParticipants: number;
  rejectedParticipants: number;
  avgCompletionMinutes: number;
  medianCompletionMinutes: number;
  slaComplianceRate: number;
  throughputPerHour: number;
}

interface BottleneckReport {
  stepId: string;
  stepName: string;
  avgProcessingMinutes: number;
  medianProcessingMinutes: number;
  p95ProcessingMinutes: number;
  currentQueueSize: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface StepMetrics {
  stepId: string;
  stepName: string;
  totalProcessed: number;
  avgProcessingMinutes: number;
  throughputPerHour: number;
  slaComplianceRate: number;
  approvalRate: number;
  rejectionRate: number;
  bypassRate: number;
  validatorWorkload: ValidatorWorkload[];
}

interface ValidatorWorkload {
  userId: string;
  userName: string;
  processed: number;
  avgProcessingMinutes: number;
  slaComplianceRate: number;
}

interface TimeSeriesPoint {
  date: string;
  value: number;
}

async function generateWorkflowAnalytics(
  workflowId: string,
  from: Date,
  to: Date,
): Promise<WorkflowAnalyticsResult> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: true },
  });

  if (!workflow) throw new WorkflowError("WORKFLOW_NOT_FOUND", "Workflow not found");

  // ── Summary metrics ──────────────────────────────────────────────

  const approvals = await prisma.approval.findMany({
    where: {
      step: { workflowId },
      createdAt: { gte: from, lte: to },
      isDryRun: false,
    },
    include: { step: true },
    orderBy: { createdAt: "asc" },
  });

  const participants = await prisma.participant.findMany({
    where: { workflowId },
  });

  const completedParticipants = participants.filter((p) =>
    ["APPROVED", "COMPLETED", "PRINTED", "COLLECTED"].includes(p.status),
  );

  const completionTimes = await calculateCompletionTimes(workflowId, from, to);
  const avgCompletion =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;
  const medianCompletion =
    completionTimes.length > 0
      ? completionTimes.sort((a, b) => a - b)[Math.floor(completionTimes.length / 2)]
      : 0;

  const hoursBetween = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
  const throughput = hoursBetween > 0 ? completedParticipants.length / hoursBetween : 0;

  // ── SLA compliance ───────────────────────────────────────────────

  const slaApprovals = approvals.filter((a) => a.step.slaDurationMinutes !== null);
  const slaCompliant = slaApprovals.filter((a) => {
    if (!a.processingTimeMs || !a.step.slaDurationMinutes) return true;
    return a.processingTimeMs <= a.step.slaDurationMinutes * 60 * 1000;
  });
  const slaComplianceRate = slaApprovals.length > 0 ? slaCompliant.length / slaApprovals.length : 1;

  // ── Bottleneck detection ─────────────────────────────────────────

  const bottlenecks: BottleneckReport[] = [];
  for (const step of workflow.steps) {
    const stepApprovals = approvals.filter((a) => a.stepId === step.id);
    if (stepApprovals.length === 0) continue;

    const processingTimes = stepApprovals
      .filter((a) => a.processingTimeMs !== null)
      .map((a) => a.processingTimeMs! / (1000 * 60));

    if (processingTimes.length === 0) continue;

    const avg = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const sorted = [...processingTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    const currentQueue = await prisma.participant.count({
      where: { stepId: step.id, status: { in: ["PENDING", "INPROGRESS"] } },
    });

    let severity: BottleneckReport["severity"] = "LOW";
    if (step.slaDurationMinutes) {
      const slaRatio = avg / step.slaDurationMinutes;
      if (slaRatio > 0.9) severity = "CRITICAL";
      else if (slaRatio > 0.7) severity = "HIGH";
      else if (slaRatio > 0.5) severity = "MEDIUM";
    }

    bottlenecks.push({
      stepId: step.id,
      stepName: step.name,
      avgProcessingMinutes: Math.round(avg),
      medianProcessingMinutes: Math.round(median),
      p95ProcessingMinutes: Math.round(p95),
      currentQueueSize: currentQueue,
      severity,
    });
  }

  bottlenecks.sort((a, b) => b.avgProcessingMinutes - a.avgProcessingMinutes);

  // ── Step-level metrics with validator workload ───────────────────

  const stepMetrics: StepMetrics[] = [];
  for (const step of workflow.steps) {
    const stepApprovals = approvals.filter((a) => a.stepId === step.id);
    if (stepApprovals.length === 0) continue;

    const processingTimes = stepApprovals
      .filter((a) => a.processingTimeMs !== null)
      .map((a) => a.processingTimeMs! / (1000 * 60));
    const avgTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    // Validator workload
    const validatorMap = new Map<
      string,
      { processed: number; totalMs: number; slaCompliant: number; slaTotal: number }
    >();
    for (const a of stepApprovals) {
      const entry = validatorMap.get(a.userId) ?? {
        processed: 0,
        totalMs: 0,
        slaCompliant: 0,
        slaTotal: 0,
      };
      entry.processed++;
      entry.totalMs += a.processingTimeMs ?? 0;
      if (step.slaDurationMinutes) {
        entry.slaTotal++;
        if ((a.processingTimeMs ?? 0) <= step.slaDurationMinutes * 60 * 1000) {
          entry.slaCompliant++;
        }
      }
      validatorMap.set(a.userId, entry);
    }

    const validatorWorkload: ValidatorWorkload[] = [];
    for (const [userId, data] of validatorMap) {
      validatorWorkload.push({
        userId,
        userName: userId, // Would be resolved from User table in production
        processed: data.processed,
        avgProcessingMinutes: Math.round(data.totalMs / data.processed / (1000 * 60)),
        slaComplianceRate: data.slaTotal > 0 ? data.slaCompliant / data.slaTotal : 1,
      });
    }

    const approved = stepApprovals.filter((a) => a.action === "APPROVE").length;
    const rejected = stepApprovals.filter((a) => a.action === "REJECT").length;
    const bypassed = stepApprovals.filter((a) => a.action === "BYPASS").length;

    stepMetrics.push({
      stepId: step.id,
      stepName: step.name,
      totalProcessed: stepApprovals.length,
      avgProcessingMinutes: Math.round(avgTime),
      throughputPerHour: hoursBetween > 0 ? stepApprovals.length / hoursBetween : 0,
      slaComplianceRate: step.slaDurationMinutes
        ? stepApprovals.filter(
            (a) => (a.processingTimeMs ?? 0) <= step.slaDurationMinutes! * 60 * 1000,
          ).length / stepApprovals.length
        : 1,
      approvalRate: stepApprovals.length > 0 ? approved / stepApprovals.length : 0,
      rejectionRate: stepApprovals.length > 0 ? rejected / stepApprovals.length : 0,
      bypassRate: stepApprovals.length > 0 ? bypassed / stepApprovals.length : 0,
      validatorWorkload,
    });
  }

  return {
    workflowId,
    period: { from, to },
    summary: {
      totalParticipants: participants.length,
      completedParticipants: completedParticipants.length,
      activeParticipants: participants.filter((p) => ["PENDING", "INPROGRESS"].includes(p.status))
        .length,
      rejectedParticipants: participants.filter((p) => p.status === "REJECTED").length,
      avgCompletionMinutes: Math.round(avgCompletion),
      medianCompletionMinutes: Math.round(medianCompletion),
      slaComplianceRate,
      throughputPerHour: Math.round(throughput * 10) / 10,
    },
    bottlenecks,
    stepMetrics,
    throughputTimeSeries: [], // Populated by aggregation query
    slaComplianceTimeSeries: [], // Populated by aggregation query
  };
}

async function calculateCompletionTimes(
  workflowId: string,
  from: Date,
  to: Date,
): Promise<number[]> {
  // Get first and last approval for each completed participant
  const completedParticipants = await prisma.participant.findMany({
    where: {
      workflowId,
      status: { in: ["APPROVED", "COMPLETED", "PRINTED", "COLLECTED"] },
      updatedAt: { gte: from, lte: to },
    },
    include: {
      approvals: { orderBy: { createdAt: "asc" } },
    },
  });

  return completedParticipants
    .filter((p) => p.approvals.length >= 2)
    .map((p) => {
      const first = p.approvals[0].createdAt;
      const last = p.approvals[p.approvals.length - 1].createdAt;
      return (last.getTime() - first.getTime()) / (1000 * 60);
    });
}
```

### 5.13 Webhook Triggers

Configurable per-step webhook calls with retry logic and dead letter handling.

```typescript
interface WebhookConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  payloadTemplate?: Record<string, unknown>;
}

async function executeWebhook(payload: Record<string, unknown>): Promise<void> {
  const { participantId, stepId, url, method, headers, payloadTemplate, participant, action } =
    payload;

  const webhookPayload = buildWebhookPayload(
    payloadTemplate as Record<string, unknown> | undefined,
    participant as Record<string, unknown>,
    action as string,
  );

  const maxAttempts = 3;
  let attempt = 0;
  let lastError: string | undefined;
  let success = false;
  let responseStatus: number | undefined;
  let responseBody: string | undefined;
  let responseTimeMs: number | undefined;

  while (attempt < maxAttempts && !success) {
    attempt++;
    const startTime = Date.now();

    try {
      const response = await fetch(url as string, {
        method: (method as string) ?? "POST",
        headers: {
          "Content-Type": "application/json",
          ...((headers as Record<string, string>) ?? {}),
        },
        body: method !== "GET" ? JSON.stringify(webhookPayload) : undefined,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      responseTimeMs = Date.now() - startTime;
      responseStatus = response.status;
      responseBody = await response.text();
      success = response.ok;

      if (!success) {
        lastError = `HTTP ${response.status}: ${responseBody.substring(0, 500)}`;
      }
    } catch (error) {
      responseTimeMs = Date.now() - startTime;
      lastError = (error as Error).message;
    }

    // Log each attempt
    await prisma.webhookLog.create({
      data: {
        stepId: stepId as string,
        participantId: participantId as string,
        url: url as string,
        method: (method as WebhookMethod) ?? "POST",
        requestBody: webhookPayload,
        requestHeaders: headers as Record<string, string>,
        responseStatus,
        responseBody: responseBody?.substring(0, 5000),
        responseTimeMs,
        attempt,
        maxAttempts,
        success,
        error: lastError,
      },
    });

    if (!success && attempt < maxAttempts) {
      // Exponential backoff: 1s, 4s, 9s
      await new Promise((resolve) => setTimeout(resolve, attempt * attempt * 1000));
    }
  }

  if (!success) {
    // Send to dead letter queue
    const boss = getPgBossInstance();
    await boss.send("workflow:webhook-dead-letter", {
      stepId,
      participantId,
      url,
      lastError,
      attempts: maxAttempts,
    });
  }
}

function buildWebhookPayload(
  template: Record<string, unknown> | undefined,
  participant: Record<string, unknown>,
  action: string,
): Record<string, unknown> {
  if (!template) {
    return {
      event: "workflow.step.processed",
      action,
      participant: {
        id: participant.id,
        status: participant.status,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Template variable interpolation
  return JSON.parse(
    JSON.stringify(template).replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const value = getNestedValue(participant, path);
      return value !== undefined ? String(value) : "";
    }),
  );
}
```

### 5.14 Audit Trail Visualization

Complete timeline of all actions on a participant, suitable for rendering as a timeline component.

```typescript
interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  type:
    | "ACTION"
    | "ASSIGNMENT"
    | "SLA_WARNING"
    | "SLA_BREACH"
    | "ESCALATION"
    | "SYSTEM"
    | "DELEGATION";
  stepName: string;
  stepType: StepType;
  action?: Action;
  userId: string;
  userName: string;
  remarks?: string;
  previousStatus: ParticipantStatus;
  newStatus: ParticipantStatus;
  metadata?: Record<string, unknown>;
  delegatedFrom?: string;
  batchId?: string;
  processingTimeMs?: number;
}

async function getParticipantAuditTrail(participantId: string): Promise<AuditTrailEntry[]> {
  const approvals = await prisma.approval.findMany({
    where: { participantId },
    include: {
      step: { select: { name: true, stepType: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const assignments = await prisma.stepAssignment.findMany({
    where: { participantId },
    include: {
      step: { select: { name: true, stepType: true } },
      assignee: { select: { name: true } },
      assigner: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const trail: AuditTrailEntry[] = [];

  // Add approval entries
  for (const a of approvals) {
    trail.push({
      id: a.id,
      timestamp: a.createdAt,
      type: a.delegatedFrom ? "DELEGATION" : a.userId === "SYSTEM" ? "SYSTEM" : "ACTION",
      stepName: a.step.name,
      stepType: a.step.stepType,
      action: a.action,
      userId: a.userId,
      userName: a.user.name,
      remarks: a.remarks ?? undefined,
      previousStatus: a.previousStatus,
      newStatus: a.newStatus,
      delegatedFrom: a.delegatedFrom ?? undefined,
      batchId: a.batchId ?? undefined,
      processingTimeMs: a.processingTimeMs ?? undefined,
      metadata: (a.metadata as Record<string, unknown>) ?? undefined,
    });
  }

  // Add assignment entries
  for (const a of assignments) {
    trail.push({
      id: a.id,
      timestamp: a.createdAt,
      type: "ASSIGNMENT",
      stepName: a.step.name,
      stepType: a.step.stepType,
      userId: a.assignedTo,
      userName: a.assignee.name,
      remarks: a.reason ?? undefined,
      previousStatus: "PENDING" as ParticipantStatus,
      newStatus: "INPROGRESS" as ParticipantStatus,
      metadata: { assignedBy: a.assigner.name },
    });
  }

  // Sort all entries chronologically
  trail.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return trail;
}
```

### 5.15 Error Handling & Recovery

Retry policies for failed side effects, dead letter for unprocessable participants, and compensation actions for partial failures.

```typescript
// ─── Retry Policy ──────────────────────────────────────────────────

interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "SERVICE_UNAVAILABLE", "DATABASE_DEADLOCK"],
};

async function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  operationName: string = "operation",
): Promise<T> {
  let lastError: Error | undefined;
  let delay = policy.initialDelayMs;

  for (let attempt = 1; attempt <= policy.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as WorkflowError).code ?? "UNKNOWN";

      if (attempt > policy.maxRetries || !policy.retryableErrors.includes(errorCode)) {
        break;
      }

      console.warn(
        `${operationName} attempt ${attempt} failed (${errorCode}), retrying in ${delay}ms`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * policy.backoffMultiplier, policy.maxDelayMs);
    }
  }

  throw lastError;
}

// ─── Dead Letter Queue ─────────────────────────────────────────────

interface DeadLetterEntry {
  participantId: string;
  stepId: string;
  action: Action;
  userId: string;
  error: string;
  errorCode: string;
  attempts: number;
  originalPayload: Record<string, unknown>;
  createdAt: Date;
}

async function sendToDeadLetter(
  participantId: string,
  stepId: string,
  action: Action,
  userId: string,
  error: Error,
  payload: Record<string, unknown>,
): Promise<void> {
  const boss = getPgBossInstance();

  await boss.send("workflow:dead-letter", {
    participantId,
    stepId,
    action,
    userId,
    error: error.message,
    errorCode: (error as WorkflowError).code ?? "UNKNOWN",
    originalPayload: payload,
    createdAt: new Date().toISOString(),
  });

  // Notify administrators
  await createNotification(
    "SYSTEM_ADMIN",
    "DEAD_LETTER",
    `Participant ${participantId} sent to dead letter queue: ${error.message}`,
  );
}

// ─── Compensation Actions ──────────────────────────────────────────

interface CompensationAction {
  type: "ROLLBACK_STATUS" | "RESTORE_ASSIGNMENT" | "REVERT_STEP" | "NOTIFY_ADMIN";
  payload: Record<string, unknown>;
}

async function executeCompensation(
  participantId: string,
  compensations: CompensationAction[],
): Promise<void> {
  for (const compensation of compensations) {
    try {
      switch (compensation.type) {
        case "ROLLBACK_STATUS":
          await prisma.participant.update({
            where: { id: participantId },
            data: {
              status: compensation.payload.previousStatus as string,
              stepId: compensation.payload.previousStepId as string,
            },
          });
          break;

        case "RESTORE_ASSIGNMENT":
          await prisma.stepAssignment.update({
            where: { id: compensation.payload.assignmentId as string },
            data: { isActive: true },
          });
          break;

        case "REVERT_STEP":
          await prisma.participant.update({
            where: { id: participantId },
            data: { stepId: compensation.payload.previousStepId as string },
          });
          break;

        case "NOTIFY_ADMIN":
          await createNotification(
            "SYSTEM_ADMIN",
            "COMPENSATION_EXECUTED",
            `Compensation executed for participant ${participantId}: ${compensation.type}`,
          );
          break;
      }
    } catch (compError) {
      console.error(`Compensation ${compensation.type} failed for ${participantId}:`, compError);
    }
  }
}

// ─── Safe Process Participant (with full error handling) ───────────

async function safeProcessParticipant(
  participantId: string,
  userId: string,
  action: Action,
  remarks?: string,
  options: { isDryRun?: boolean; batchId?: string } = {},
): Promise<ProcessResult> {
  const compensations: CompensationAction[] = [];

  try {
    return await withRetry(
      () => processParticipant(participantId, userId, action, remarks, options),
      DEFAULT_RETRY_POLICY,
      `processParticipant(${participantId})`,
    );
  } catch (error) {
    const workflowError = error as WorkflowError;

    if (workflowError.recoverable) {
      // Execute compensation actions
      await executeCompensation(participantId, compensations);
    }

    // Send to dead letter if all retries exhausted
    await sendToDeadLetter(participantId, "", action, userId, error as Error, {
      remarks,
      ...options,
    });

    return {
      success: false,
      participantId,
      previousStep: { id: "", name: "" },
      action,
      newStep: null,
      newStatus: "PENDING" as ParticipantStatus,
      approval: { id: "", createdAt: new Date() },
      sideEffects: [],
      errors: [
        {
          code: workflowError.code ?? "UNKNOWN",
          message: workflowError.message,
          step: "",
          recoverable: workflowError.recoverable ?? false,
        },
      ],
    };
  }
}
```

### 5.16 Timer-Based Triggers

Auto-advance after configurable time (e.g., auto-approve after 48 hours if no action).

```typescript
async function checkTimerTriggers(): Promise<{ checked: number; triggered: number }> {
  let checked = 0;
  let triggered = 0;

  // Find participants at steps with timer triggers
  const participantsWithTimers = await prisma.participant.findMany({
    where: {
      status: { in: ["PENDING", "INPROGRESS"] },
      step: {
        timerDurationMinutes: { not: null },
        timerAction: { not: null },
      },
    },
    include: {
      step: true,
      approvals: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  checked = participantsWithTimers.length;

  for (const p of participantsWithTimers) {
    const step = p.step;
    if (!step.timerDurationMinutes || !step.timerAction) continue;

    const lastAction = p.approvals[0]?.createdAt ?? p.createdAt;
    const timerDeadline = addMinutes(lastAction, step.timerDurationMinutes);

    if (isAfter(new Date(), timerDeadline)) {
      try {
        await processParticipant(
          p.id,
          "SYSTEM",
          step.timerAction,
          `Timer trigger: auto-${step.timerAction.toLowerCase()} after ${step.timerDurationMinutes} minutes`,
        );
        triggered++;
      } catch (error) {
        console.error(`Timer trigger failed for participant ${p.id}:`, error);
      }
    }
  }

  return { checked, triggered };
}
```

### 5.17 Counter-Based Triggers

Advance after N approvals (e.g., require 2 of 3 validators to approve).

```typescript
async function getApprovalCountForStep(participantId: string, stepId: string): Promise<number> {
  return prisma.approval.count({
    where: {
      participantId,
      stepId,
      action: "APPROVE",
      isDryRun: false,
    },
  });
}

async function checkCounterTrigger(
  participantId: string,
  step: Step,
  action: Action,
): Promise<{ shouldAdvance: boolean; currentCount: number; required: number }> {
  if (!step.requiredApprovals || step.requiredApprovals <= 1) {
    return { shouldAdvance: true, currentCount: 1, required: 1 };
  }

  if (action !== "APPROVE") {
    // Rejections at counter steps are immediate
    return { shouldAdvance: true, currentCount: 0, required: step.requiredApprovals };
  }

  const currentCount = await getApprovalCountForStep(participantId, step.id);
  // +1 because the current approval hasn't been recorded yet
  const newCount = currentCount + 1;

  return {
    shouldAdvance: newCount >= step.requiredApprovals,
    currentCount: newCount,
    required: step.requiredApprovals,
  };
}

// Counter-based step with configurable threshold
interface CounterConfig {
  requiredApprovals: number;
  uniqueApprovers: boolean; // Require different users for each approval
  approverRoles: string[]; // Restrict to specific roles
}

async function validateCounterApproval(
  participantId: string,
  stepId: string,
  userId: string,
  config: CounterConfig,
): Promise<void> {
  if (config.uniqueApprovers) {
    const existingApproval = await prisma.approval.findFirst({
      where: {
        participantId,
        stepId,
        userId,
        action: "APPROVE",
      },
    });

    if (existingApproval) {
      throw new WorkflowError(
        "DUPLICATE_APPROVER",
        `User ${userId} has already approved at this step. Unique approvers required.`,
      );
    }
  }
}
```

### 5.18 Delegation of Authority

Temporary role assignment during validator absence.

```typescript
async function createDelegation(
  tenantId: string,
  delegatorId: string,
  delegateeId: string,
  roleId: string,
  reason: string,
  startDate: Date,
  endDate: Date,
  options: { workflowId?: string; stepId?: string } = {},
): Promise<Delegation> {
  // Validate: delegatee must exist and not already have the role
  const delegatee = await prisma.user.findUnique({ where: { id: delegateeId } });
  if (!delegatee) {
    throw new WorkflowError("USER_NOT_FOUND", `Delegatee ${delegateeId} not found`);
  }

  // Validate: delegator must have the role
  const delegatorRole = await prisma.userRole.findFirst({
    where: { userId: delegatorId, roleId, tenantId },
  });
  if (!delegatorRole) {
    throw new WorkflowError("UNAUTHORIZED_DELEGATION", `Delegator does not have role ${roleId}`);
  }

  // Validate: no circular delegation
  const reverseDeleg = await prisma.delegation.findFirst({
    where: {
      delegatorId: delegateeId,
      delegateeId: delegatorId,
      roleId,
      isActive: true,
    },
  });
  if (reverseDeleg) {
    throw new WorkflowError("CIRCULAR_DELEGATION", "Circular delegation detected");
  }

  const delegation = await prisma.delegation.create({
    data: {
      tenantId,
      delegatorId,
      delegateeId,
      roleId,
      reason,
      startDate,
      endDate,
      workflowId: options.workflowId,
      stepId: options.stepId,
    },
  });

  await createNotification(
    delegateeId,
    "DELEGATION_RECEIVED",
    `You have been delegated ${roleId} authority by ${delegatorId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
  );

  return delegation;
}

async function revokeDelegation(delegationId: string, revokedBy: string): Promise<void> {
  await prisma.delegation.update({
    where: { id: delegationId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
    },
  });
}

async function checkDelegation(
  userId: string,
  roleId: string | null,
  workflowId?: string | null,
): Promise<Delegation | null> {
  if (!roleId) return null;

  return prisma.delegation.findFirst({
    where: {
      delegateeId: userId,
      roleId,
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
      OR: [{ workflowId: null }, { workflowId: workflowId ?? undefined }],
    },
  });
}

// Background job to expire delegations
async function expireDelegations(): Promise<number> {
  const result = await prisma.delegation.updateMany({
    where: {
      isActive: true,
      endDate: { lt: new Date() },
    },
    data: { isActive: false },
  });

  return result.count;
}
```

### 5.19 Return-to-Step

Send a participant back to a previous step for corrections.

```typescript
async function returnToStep(
  participantId: string,
  userId: string,
  targetStepId: string,
  reason: string,
): Promise<ProcessResult> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      step: true,
      workflow: { include: { steps: true } },
    },
  });

  if (!participant || !participant.step) {
    throw new WorkflowError("PARTICIPANT_NOT_FOUND", "Participant not found or not in workflow");
  }

  // Validate target step exists in the workflow
  const targetStep = participant.workflow?.steps.find((s) => s.id === targetStepId);
  if (!targetStep) {
    throw new WorkflowError("INVALID_RETURN_TARGET", `Step ${targetStepId} not found in workflow`);
  }

  // Validate target step comes before current step (prevent forward jumps)
  if (targetStep.order >= participant.step.order) {
    throw new WorkflowError("INVALID_RETURN_TARGET", "Can only return to a previous step");
  }

  // Update participant
  await prisma.$transaction(async (tx) => {
    await tx.participant.update({
      where: { id: participantId },
      data: {
        stepId: targetStepId,
        status: "RETURNED",
      },
    });

    await tx.approval.create({
      data: {
        participantId,
        stepId: participant.step!.id,
        userId,
        action: "RETURN",
        remarks: `Returned to step "${targetStep.name}": ${reason}`,
        previousStatus: participant.status as ParticipantStatus,
        newStatus: "RETURNED",
      },
    });
  });

  workflowEvents.emitWorkflowEvent("participant.returned", {
    participantId,
    stepId: participant.step.id,
    targetStepId,
    reason,
  });

  return {
    success: true,
    participantId,
    previousStep: { id: participant.step.id, name: participant.step.name },
    action: "RETURN",
    newStep: { id: targetStep.id, name: targetStep.name },
    newStatus: "RETURNED",
    approval: { id: "", createdAt: new Date() },
    sideEffects: [],
    errors: [],
  };
}
```

### 5.20 Step-Specific Forms

Each workflow step can reference a different form (from Module 03: Visual Form Designer) to collect step-appropriate information.

```typescript
interface StepFormConfig {
  stepId: string;
  formId: string;
  formName: string;
  requiredBeforeAction: boolean; // Must submit form before processing
  visibleToParticipant: boolean; // Participant can see/fill this form
  visibleToValidator: boolean; // Validator can see/fill this form
}

async function getStepForm(
  stepId: string,
  participantId: string,
): Promise<{ form: Form; submission?: FormSubmission } | null> {
  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: { form: true },
  });

  if (!step?.formId || !step.form) return null;

  // Check for existing submission
  const submission = await prisma.formSubmission.findFirst({
    where: {
      formId: step.formId,
      participantId,
      stepId,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    form: step.form,
    submission: submission ?? undefined,
  };
}

async function validateStepFormSubmission(stepId: string, participantId: string): Promise<boolean> {
  const step = await prisma.step.findUnique({
    where: { id: stepId },
  });

  if (!step?.formId) return true; // No form required

  // Check if form submission exists
  const submission = await prisma.formSubmission.findFirst({
    where: {
      formId: step.formId,
      participantId,
      stepId,
    },
  });

  return submission !== null;
}
```

**Helper for building participant data context (used by routing, auto-actions, etc.):**

```typescript
function buildParticipantData(
  participant: Participant & {
    participantType?: ParticipantType | null;
    event?: Event | null;
  },
): Record<string, unknown> {
  return {
    id: participant.id,
    status: participant.status,
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    organization: participant.organization,
    nationality: participant.nationality,
    participantType: participant.participantType
      ? { id: participant.participantType.id, name: participant.participantType.name }
      : null,
    event: participant.event ? { id: participant.event.id, name: participant.event.name } : null,
    customData: participant.customData ?? {},
    createdAt: participant.createdAt,
  };
}
```

---

## 6. User Interface

### 6.1 Visual Workflow Builder

The visual builder uses `@xyflow/react` (React Flow) with `dagre` auto-layout for directed graph positioning.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Workflow Builder: "Standard Media Accreditation" (v3)           [Save] [Publish]│
├────────┬────────────────────────────────────────────────────────┬───────────────┤
│        │                                                        │               │
│  STEP  │            ┌──────────┐    ┌──────────┐               │  PROPERTIES   │
│ PALETTE│            │ Initial  │───▶│ Security │               │               │
│        │            │ Review   │    │ Clearance│               │ Step: Security│
│ ┌────┐ │            │ [REVIEW] │    │[APPROVAL]│               │ Clearance     │
│ │REV │ │            └────┬─────┘    └────┬─────┘               │               │
│ └────┘ │                 │               │                      │ Type:         │
│ ┌────┐ │            REJECT│          ┌───┴───┐                 │ [APPROVAL v]  │
│ │APR │ │                 │          │       │                  │               │
│ └────┘ │                 ▼          ▼       ▼                  │ Action:       │
│ ┌────┐ │          ┌──────────┐  ┌──────┐ ┌──────┐             │ [APPROVE  v]  │
│ │PRT │ │          │ Rejection│  │Badge │ │ VIP  │             │               │
│ └────┘ │          │ Handler  │  │Print │ │ Fast │             │ Role:         │
│ ┌────┐ │          │ [REVIEW] │  │[PRINT│ │Track │             │ [Security  v] │
│ │COL │ │          └──────────┘  └──┬───┘ │[APPR]│             │               │
│ └────┘ │                           │     └──┬───┘             │ SLA:          │
│ ┌────┐ │                           ▼        │                 │ [1440] min    │
│ │NTF │ │                     ┌──────────┐   │                 │               │
│ └────┘ │                     │ Badge    │◀──┘                 │ SLA Action:   │
│ ┌────┐ │                     │ Collect  │                     │ [ESCALATE v]  │
│ │FRK │ │                     │[COLLECT] │                     │               │
│ └────┘ │                     └──────────┘                     │ Conditions:   │
│ ┌────┐ │                                                       │ [+ Add Rule ] │
│ │JON │ │                                                       │               │
│ └────┘ │         [Zoom: 100%] [Fit View] [Auto Layout]        │ Auto-Action:  │
│ ┌────┐ │                                                       │ [ Configure ] │
│ │TMR │ │                                                       │               │
│ └────┘ │                                                       │ Webhook:      │
│        │                                                        │ [ Configure ] │
├────────┴────────────────────────────────────────────────────────┴───────────────┤
│  Status: Draft  |  Steps: 7  |  Last saved: 2 min ago  |  Validation: 1 warn  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**React Flow implementation structure:**

```typescript
import { ReactFlow, Background, Controls, MiniMap, Panel } from '@xyflow/react';
import dagre from 'dagre';

// Custom node types for each step type
const nodeTypes = {
  reviewStep:       ReviewStepNode,
  approvalStep:     ApprovalStepNode,
  printStep:        PrintStepNode,
  collectStep:      CollectStepNode,
  notificationStep: NotificationStepNode,
  forkStep:         ForkStepNode,
  joinStep:         JoinStepNode,
  timerStep:        TimerStepNode,
  counterStep:      CounterStepNode,
  customStep:       CustomStepNode,
};

// Custom edge types
const edgeTypes = {
  approval:   ApprovalEdge,   // Green arrow
  rejection:  RejectionEdge,  // Red dashed arrow
  bypass:     BypassEdge,     // Orange dotted arrow
  escalation: EscalationEdge, // Purple arrow
  returnEdge: ReturnEdge,     // Gray reverse arrow
};

function WorkflowBuilder({ workflowId }: { workflowId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Load workflow data
  useEffect(() => {
    loadWorkflow(workflowId).then(({ nodes, edges }) => {
      const layouted = applyDagreLayout(nodes, edges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    });
  }, [workflowId]);

  return (
    <div className="workflow-builder">
      <StepPalette onDragStart={handleDragStart} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onConnect={handleConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="bottom-center">
          <WorkflowToolbar onAutoLayout={autoLayout} onValidate={validate} />
        </Panel>
      </ReactFlow>
      {selectedNode && (
        <StepPropertyPanel
          stepId={selectedNode}
          onUpdate={handleStepUpdate}
          onDelete={handleStepDelete}
        />
      )}
    </div>
  );
}

// Dagre auto-layout
function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 180, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const position = g.node(node.id);
    return { ...node, position: { x: position.x - 90, y: position.y - 40 } };
  });

  return { nodes: layoutedNodes, edges };
}
```

### 6.2 Step Palette

Draggable step types organized by category.

```
┌─────────────────────┐
│    STEP PALETTE     │
├─────────────────────┤
│                     │
│  Review & Approval  │
│  ┌────────────────┐ │
│  │ [icon] Review  │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ [icon] Approval│ │
│  └────────────────┘ │
│                     │
│  Actions            │
│  ┌────────────────┐ │
│  │ [icon] Print   │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ [icon] Collect │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ [icon] Notify  │ │
│  └────────────────┘ │
│                     │
│  Flow Control       │
│  ┌────────────────┐ │
│  │ [icon] Fork    │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ [icon] Join    │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ [icon] Timer   │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ [icon] Counter │ │
│  └────────────────┘ │
│                     │
│  Custom             │
│  ┌────────────────┐ │
│  │ [icon] Custom  │ │
│  └────────────────┘ │
│                     │
└─────────────────────┘
```

### 6.3 Connection Rules

Not all step types can connect to all other step types. The builder enforces these rules:

| Source Step Type | Allowed Targets                         | Connection Type                                                         |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| REVIEW           | Any                                     | Approval (green), Rejection (red), Bypass (orange)                      |
| APPROVAL         | Any                                     | Approval (green), Rejection (red), Bypass (orange), Escalation (purple) |
| PRINT            | COLLECT, REVIEW, APPROVAL, NOTIFICATION | Approval (green), Return (gray)                                         |
| COLLECT          | Any except FORK                         | Approval (green)                                                        |
| NOTIFICATION     | Any                                     | Approval (green)                                                        |
| FORK             | REVIEW, APPROVAL, CUSTOM (multiple)     | Fork branches (blue)                                                    |
| JOIN             | Any except FORK                         | Approval (green)                                                        |
| TIMER            | Any                                     | Timer expiry (yellow)                                                   |
| COUNTER          | Any                                     | Threshold met (green)                                                   |

**Connection validation:**

```typescript
function isValidConnection(source: Step, target: Step): { valid: boolean; reason?: string } {
  // Cannot connect to self
  if (source.id === target.id) {
    return { valid: false, reason: "Cannot connect a step to itself" };
  }

  // Fork can only connect to review/approval/custom steps
  if (source.stepType === "FORK" && !["REVIEW", "APPROVAL", "CUSTOM"].includes(target.stepType)) {
    return {
      valid: false,
      reason: "Fork steps can only branch to Review, Approval, or Custom steps",
    };
  }

  // Join cannot be a source to Fork
  if (source.stepType === "JOIN" && target.stepType === "FORK") {
    return { valid: false, reason: "Join step cannot directly connect to a Fork step" };
  }

  // Cannot create cycles (would need full graph traversal)
  // This is validated at publish time with a topological sort

  return { valid: true };
}
```

### 6.4 Step Property Panel

```
┌──────────────────────────────────┐
│  STEP PROPERTIES                 │
│  ─────────────────────────────── │
│                                  │
│  Name:                           │
│  ┌──────────────────────────┐    │
│  │ Security Clearance       │    │
│  └──────────────────────────┘    │
│                                  │
│  Description:                    │
│  ┌──────────────────────────┐    │
│  │ Verify security docs... │    │
│  └──────────────────────────┘    │
│                                  │
│  Step Type:     Action:          │
│  [APPROVAL v]   [APPROVE  v]    │
│                                  │
│  Role:          Form:            │
│  [Security v]   [Sec Form  v]   │
│                                  │
│  ── SLA Configuration ────────── │
│  Duration: [1440] minutes        │
│  Warning:  [ 240] minutes before │
│  On Breach: [ESCALATE      v]   │
│  Escalate to: [Supervisor  v]   │
│                                  │
│  ── Conditional Routing ──────── │
│  ┌──────────────────────────┐    │
│  │ IF participantType = VIP │    │
│  │ THEN → VIP Fast Track   │    │
│  └──────────────────────────┘    │
│  [+ Add Condition]               │
│                                  │
│  ── Auto-Action ──────────────── │
│  Rule: [autoApprove       v]    │
│  Conditions:                     │
│  ┌──────────────────────────┐    │
│  │ org IN [AU, UN]          │    │
│  └──────────────────────────┘    │
│  Delay: [0] minutes             │
│                                  │
│  ── Assignment ───────────────── │
│  Strategy: [LEAST_LOADED  v]    │
│  Max assignees: [1]              │
│                                  │
│  ── Webhook ──────────────────── │
│  URL: [https://api.example...]  │
│  Method: [POST v]                │
│  [Configure Headers & Payload]   │
│                                  │
│  ── Counter Trigger ──────────── │
│  Required approvals: [2]         │
│  Unique approvers: [x]           │
│                                  │
│  ── Timer Trigger ────────────── │
│  Duration: [2880] minutes        │
│  Action: [AUTO_APPROVE    v]    │
│                                  │
│                    [Delete Step]  │
└──────────────────────────────────┘
```

### 6.5 Workflow Simulation Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│  WORKFLOW SIMULATION                                    [Run Again] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Participant Profile:                                               │
│  Type: [VIP          v]  Organization: [AU Commission        ]     │
│  Nationality: [Ethiopia   ]   Custom: { "needs_visa": false }      │
│                                                                     │
│  Actions Sequence: [APPROVE] [APPROVE] [APPROVE]  [+ Add Action]  │
│                                                                     │
│  ── Simulation Result ──────────────────────────────────────────── │
│                                                                     │
│   (1) Initial Review ──APPROVE──▶ (2) VIP Fast Track              │
│       [30 min est.]    routing:      [0 min - AUTO]                │
│       Role: Reviewer   conditional   autoApprove                    │
│                        VIP match                                    │
│                            │                                        │
│                            ▼                                        │
│   (3) Badge Printing ──PRINT──▶ (4) Badge Collection              │
│       [5 min est.]              [2 min est.]                       │
│       Role: Printer             Role: Collector                     │
│                                                                     │
│  ── Summary ────────────────────────────────────────────────────── │
│  Total steps:          4                                            │
│  Estimated time:       37 minutes                                   │
│  Auto-actions:         1 (VIP Fast Track)                           │
│  Conditional routes:   1 (VIP type match)                           │
│  Parallel paths:       0                                            │
│  Warnings:             None                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.6 Version Comparison View

Side-by-side diff showing changes between workflow versions.

```
┌─────────────────────────────────────────────────────────────────────┐
│  VERSION COMPARISON: v2 ←→ v3                                       │
├───────────────────────────────┬─────────────────────────────────────┤
│  Version 2 (Feb 8, 2026)     │  Version 3 (Feb 10, 2026)          │
│  Published by: admin@org.et  │  Published by: admin@org.et         │
├───────────────────────────────┼─────────────────────────────────────┤
│                               │                                     │
│  Steps: 5                     │  Steps: 7  (+2)                     │
│                               │                                     │
│  1. Initial Review            │  1. Initial Review                  │
│     SLA: 480 min              │     SLA: 480 min                    │
│                               │                                     │
│  2. Security Clearance        │  2. Security Clearance              │
│     SLA: 1440 min             │     SLA: 1440 min                   │
│  -  No conditions             │  +  Condition: VIP → Fast Track     │
│                               │                                     │
│                               │  3. VIP Fast Track  [NEW]           │
│                               │     Auto-approve: org IN [AU, UN]   │
│                               │                                     │
│  3. Badge Print               │  4. Badge Print                     │
│                               │                                     │
│  4. Badge Collection          │  5. Badge Collection                │
│                               │                                     │
│  5. (none)                    │  6. Rejection Handler  [NEW]        │
│                               │     Return target for step 2        │
│                               │                                     │
│                               │  7. Archive  [NEW]                  │
│                               │                                     │
│  Changes Summary:              │                                     │
│  + 2 steps added               │                                     │
│  ~ 1 step modified             │                                     │
│  - 0 steps removed             │                                     │
│                               │                                     │
│  In-flight on v2: 23 participants                                   │
│  In-flight on v3: 0 participants (just published)                   │
└───────────────────────────────┴─────────────────────────────────────┘
```

### 6.7 Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW ANALYTICS: Standard Media Accreditation                           │
│  Period: Feb 1 - Feb 11, 2026                          [Export CSV] [PDF]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   1,250     │  │   48 hrs    │  │    94%      │  │   12.5/hr   │       │
│  │  Processed  │  │  Avg Time   │  │ SLA Comply  │  │  Throughput │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│  ── Bottleneck Analysis ────────────────────────────────────────────────── │
│                                                                             │
│  Step                  Avg Time    Queue    SLA Compliance   Severity       │
│  ┌──────────────────┬──────────┬─────────┬───────────────┬──────────┐      │
│  │Security Clearance│ 24 hrs   │   12    │     87%       │  HIGH    │      │
│  │Initial Review    │  2 hrs   │    5    │     98%       │  LOW     │      │
│  │Badge Print       │  5 min   │    0    │    100%       │  LOW     │      │
│  │Badge Collection  │  2 min   │    0    │    100%       │  LOW     │      │
│  └──────────────────┴──────────┴─────────┴───────────────┴──────────┘      │
│                                                                             │
│  ── SLA Heatmap (by step and day) ──────────────────────────────────────── │
│                                                                             │
│              Mon   Tue   Wed   Thu   Fri   Sat   Sun                       │
│  Review     [95%] [97%] [96%] [98%] [94%] [  -] [  -]                     │
│  Security   [88%] [85%] [90%] [87%] [82%] [  -] [  -]                     │
│  Print      [100] [100] [100] [100] [100] [  -] [  -]                     │
│  Collect    [100] [100] [100] [100] [100] [  -] [  -]                     │
│                                                                             │
│  Legend: [95+%] Green  [80-94%] Yellow  [<80%] Red  [-] No data            │
│                                                                             │
│  ── Throughput Over Time ───────────────────────────────────────────────── │
│                                                                             │
│  25│          *                                                             │
│  20│    *    * *    *                                                       │
│  15│   * *  *   *  * *                                                     │
│  10│  *   **     **   *                                                    │
│   5│ *                  *                                                   │
│   0│________________________                                               │
│     Feb1  Feb3  Feb5  Feb7  Feb9  Feb11                                    │
│                                                                             │
│  ── Validator Workload Distribution ────────────────────────────────────── │
│                                                                             │
│  validator_01  ████████████████████████  320 processed (avg 115 min)       │
│  validator_02  ████████████████████      280 processed (avg 130 min)       │
│  validator_03  ██████████████            210 processed (avg 95 min)        │
│  validator_04  ████████████████████████████████  440 processed (avg 88 min)│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.8 Audit Trail Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  AUDIT TRAIL: Participant P-2026-00142                               │
│  Name: John Doe | Type: Media | Org: Reuters                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ○ Feb 5, 09:15 — ENTERED WORKFLOW                                 │
│  │  Workflow: Standard Media Accreditation (v3)                     │
│  │  Entry step: Initial Review                                      │
│  │                                                                   │
│  ● Feb 5, 09:20 — ASSIGNED                                        │
│  │  Step: Initial Review                                            │
│  │  Assigned to: validator_01 (auto: round-robin)                  │
│  │                                                                   │
│  ● Feb 5, 11:45 — APPROVED                                        │
│  │  Step: Initial Review                                            │
│  │  By: validator_01 | Processing time: 2h 25m                     │
│  │  Remarks: "Documents verified, photo meets requirements"         │
│  │  Route: conditional → VIP Fast Track (type = Media)             │
│  │                                                                   │
│  ● Feb 5, 11:45 — AUTO-APPROVED                                   │
│  │  Step: VIP Fast Track                                            │
│  │  By: SYSTEM (auto-action: org IN [Reuters])                     │
│  │  Processing time: <1s                                            │
│  │                                                                   │
│  ● Feb 5, 11:46 — ASSIGNED                                        │
│  │  Step: Badge Print                                               │
│  │  Assigned to: printer_02 (auto: least-loaded)                   │
│  │                                                                   │
│  ● Feb 5, 11:50 — PRINTED                                         │
│  │  Step: Badge Print                                               │
│  │  By: printer_02 | Processing time: 4m                           │
│  │                                                                   │
│  ● Feb 5, 12:30 — COLLECTED                                       │
│  │  Step: Badge Collection                                          │
│  │  By: desk_agent_01 | Processing time: 40m                      │
│  │                                                                   │
│  ◉ Feb 5, 12:30 — COMPLETED                                       │
│     Final status: COLLECTED                                         │
│     Total workflow time: 3h 15m                                     │
│     Steps traversed: 4 of 7                                        │
│     SLA compliance: All within SLA                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Module Integration Map

```
                    ┌───────────────────┐
                    │  Module 09:       │
                    │  Registration     │──── Triggers workflow entry
                    └────────┬──────────┘     (enterWorkflow)
                             │
                             ▼
┌───────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  Module 03:   │──▶│                   │◀──│  Module 05:       │
│  Form Designer│   │  Module 04:       │   │  Security         │
│               │   │  WORKFLOW ENGINE  │   │                   │
│  Step-specific│   │                   │   │  Step-level       │
│  forms        │   └───────┬───────────┘   │  authorization    │
└───────────────┘           │               └───────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
┌───────────────┐  ┌──────────────┐  ┌───────────────────┐
│  Module 07:   │  │  Module 14:  │  │  Module 06:       │
│  API Layer    │  │  Communication│  │  Infrastructure   │
│               │  │              │  │                   │
│  REST API for │  │  Email/SMS   │  │  pg-boss for      │
│  execution    │  │  on events   │  │  SLA check jobs   │
└───────────────┘  └──────────────┘  └───────────────────┘
              │
              ▼
┌───────────────────┐
│  Module 10:       │
│  Event Operations │
│                   │
│  Workflow metrics  │
│  on dashboard     │
└───────────────────┘
```

### 7.2 Integration Details

#### Module 09: Registration & Accreditation

Registration triggers workflow entry when a participant submits their application:

```typescript
// Called by Module 09 after successful registration
async function onParticipantRegistered(participantId: string, eventId: string): Promise<void> {
  // Find active workflow for this event
  const workflow = await prisma.workflow.findFirst({
    where: { eventId, status: "ACTIVE", isDefault: true },
  });

  if (!workflow) {
    throw new Error(`No active workflow found for event ${eventId}`);
  }

  // Enter the participant into the workflow
  await enterWorkflow(participantId, workflow.id);

  // Find entry point step
  const entryStep = await prisma.step.findFirst({
    where: { workflowId: workflow.id, isEntryPoint: true },
    orderBy: { order: "asc" },
  });

  if (entryStep) {
    await prisma.participant.update({
      where: { id: participantId },
      data: { stepId: entryStep.id, status: "PENDING" },
    });

    workflowEvents.emitWorkflowEvent("participant.entered", {
      participantId,
      workflowId: workflow.id,
      versionId: "", // Set by enterWorkflow
      stepId: entryStep.id,
    });
  }
}
```

#### Module 03: Visual Form Designer

Each workflow step can reference a form from the Form Designer module. The form is displayed to the validator (or participant) when they reach that step.

```typescript
// Resolve the form for the current step
async function resolveStepForm(stepId: string): Promise<FormDefinition | null> {
  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: { form: { include: { fields: true, sections: true } } },
  });

  return step?.form ?? null;
}
```

#### Module 05: Security & Access Control

The Security module enforces step-level authorization. Only users with the correct role can process a step.

```typescript
// Called during processParticipant
// See Section 5.4: validateStepAuthorization
```

#### Module 07: API & Integration Layer

All workflow execution endpoints are exposed through the API layer with proper authentication, rate limiting, and tenant context.

#### Module 14: Communication

The Communication module sends notifications on workflow transitions:

```typescript
// Subscribed to workflow domain events
workflowEvents.onWorkflowEvent("participant.approved", async (event) => {
  await communicationService.sendNotification({
    type: "WORKFLOW_APPROVED",
    recipientId: event.participantId, // Notify the participant
    data: { stepName: event.stepId },
  });
});

workflowEvents.onWorkflowEvent("sla.breached", async (event) => {
  await communicationService.sendAlert({
    type: "SLA_BREACH",
    recipientRole: "SUPERVISOR",
    data: { participantId: event.participantId, overdueMinutes: event.overdueMinutes },
  });
});
```

#### Module 06: Infrastructure & DevOps

The Infrastructure module provides pg-boss for running scheduled SLA check jobs and timer-based triggers.

```typescript
// Registered during application startup (see Section 5.5)
await registerSLACheckJob(boss); // Every 5 minutes
await registerTimerCheckJob(boss); // Every 1 minute
```

#### Module 10: Event Operations Center

The Event Operations dashboard displays live workflow metrics for event managers.

---

## 8. Configuration

### 8.1 Feature Flags

| Flag                                 | Type    | Default | Description                            |
| ------------------------------------ | ------- | ------- | -------------------------------------- |
| `workflow.enableParallelPaths`       | boolean | `false` | Enable fork/join parallel path support |
| `workflow.enableSimulation`          | boolean | `true`  | Enable dry-run simulation mode         |
| `workflow.enableAutoActions`         | boolean | `true`  | Enable auto-action rules on steps      |
| `workflow.enableCounterTriggers`     | boolean | `false` | Enable counter-based step advancement  |
| `workflow.enableTimerTriggers`       | boolean | `true`  | Enable timer-based auto-advance        |
| `workflow.enableDelegation`          | boolean | `false` | Enable delegation of authority         |
| `workflow.enableWebhooks`            | boolean | `false` | Enable per-step webhook triggers       |
| `workflow.enableBatchProcessing`     | boolean | `true`  | Enable batch approve/reject/bypass     |
| `workflow.enableAnalytics`           | boolean | `true`  | Enable workflow analytics collection   |
| `workflow.enableTemplateMarketplace` | boolean | `false` | Enable public template marketplace     |

### 8.2 Runtime Configuration

```typescript
interface WorkflowConfig {
  // SLA enforcement
  slaCheckIntervalCron: string; // Default: '*/5 * * * *' (every 5 min)
  slaWarningThresholdPercent: number; // Default: 80 (warn at 80% of SLA)

  // Timer triggers
  timerCheckIntervalCron: string; // Default: '*/1 * * * *' (every 1 min)

  // Limits
  maxWorkflowSteps: number; // Default: 50
  maxParallelPaths: number; // Default: 5
  maxConditionsPerStep: number; // Default: 10
  maxAutoActionDelay: number; // Default: 10080 (7 days in minutes)

  // Escalation
  defaultEscalationTimeout: number; // Default: 1440 (24 hours in minutes)
  maxEscalationLevels: number; // Default: 3

  // Batch processing
  maxBatchSize: number; // Default: 500
  batchConcurrency: number; // Default: 10
  batchStopOnError: boolean; // Default: false

  // Webhook
  webhookTimeout: number; // Default: 30000 (30 seconds)
  webhookMaxRetries: number; // Default: 3
  webhookRetryDelay: number; // Default: 1000 (1 second)

  // Analytics
  analyticsRetentionDays: number; // Default: 365
  analyticsAggregationCron: string; // Default: '0 2 * * *' (2 AM daily)

  // Caching
  workflowCacheTTL: number; // Default: 300 (5 minutes in seconds)
  stepCacheTTL: number; // Default: 300

  // Delegation
  maxDelegationDays: number; // Default: 90
  delegationExpiryCheckCron: string; // Default: '0 0 * * *' (midnight daily)
}

const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  slaCheckIntervalCron: "*/5 * * * *",
  slaWarningThresholdPercent: 80,
  timerCheckIntervalCron: "*/1 * * * *",
  maxWorkflowSteps: 50,
  maxParallelPaths: 5,
  maxConditionsPerStep: 10,
  maxAutoActionDelay: 10080,
  defaultEscalationTimeout: 1440,
  maxEscalationLevels: 3,
  maxBatchSize: 500,
  batchConcurrency: 10,
  batchStopOnError: false,
  webhookTimeout: 30000,
  webhookMaxRetries: 3,
  webhookRetryDelay: 1000,
  analyticsRetentionDays: 365,
  analyticsAggregationCron: "0 2 * * *",
  workflowCacheTTL: 300,
  stepCacheTTL: 300,
  maxDelegationDays: 90,
  delegationExpiryCheckCron: "0 0 * * *",
};
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

#### Action Type Tests

Every action type must be tested for correct state transitions, audit record creation, and side effect triggering.

```typescript
describe("processParticipant", () => {
  describe("APPROVE action", () => {
    it("should advance participant to next step", async () => {
      const result = await processParticipant(participant.id, user.id, "APPROVE", "Looks good");
      expect(result.newStep?.id).toBe(step2.id);
      expect(result.newStatus).toBe("PENDING");
    });

    it("should set APPROVED status when at terminal step", async () => {
      // Place participant at terminal step
      const result = await processParticipant(participant.id, user.id, "APPROVE");
      expect(result.newStep).toBeNull();
      expect(result.newStatus).toBe("APPROVED");
    });

    it("should follow conditional routing when condition matches", async () => {
      // Participant is VIP type
      const result = await processParticipant(vipParticipant.id, user.id, "APPROVE");
      expect(result.newStep?.id).toBe(vipFastTrackStep.id);
    });

    it("should use default nextStepId when no condition matches", async () => {
      const result = await processParticipant(regularParticipant.id, user.id, "APPROVE");
      expect(result.newStep?.id).toBe(step2.id);
    });

    it("should create approval audit record", async () => {
      await processParticipant(participant.id, user.id, "APPROVE", "Verified");
      const approval = await prisma.approval.findFirst({
        where: { participantId: participant.id, stepId: step1.id },
      });
      expect(approval).toBeTruthy();
      expect(approval?.action).toBe("APPROVE");
      expect(approval?.remarks).toBe("Verified");
    });
  });

  describe("REJECT action", () => {
    it("should move participant to rejection target", async () => {
      const result = await processParticipant(participant.id, user.id, "REJECT", "Invalid docs");
      expect(result.newStep?.id).toBe(rejectionStep.id);
      expect(result.newStatus).toBe("RETURNED");
    });

    it("should set REJECTED status when no rejection target", async () => {
      const result = await processParticipant(participantAtStepWithNoTarget.id, user.id, "REJECT");
      expect(result.newStep).toBeNull();
      expect(result.newStatus).toBe("REJECTED");
    });
  });

  describe("BYPASS action", () => {
    it("should move participant to bypass target", async () => {
      const result = await processParticipant(participant.id, user.id, "BYPASS", "Pre-cleared");
      expect(result.newStep?.id).toBe(bypassStep.id);
      expect(result.newStatus).toBe("PENDING");
    });

    it("should fall back to nextStepId when no bypass target", async () => {
      const result = await processParticipant(participantNoBypTarget.id, user.id, "BYPASS");
      expect(result.newStep?.id).toBe(step2.id);
    });
  });

  describe("RETURN action", () => {
    it("should send participant back to return target step", async () => {
      const result = await processParticipant(
        participant.id,
        user.id,
        "RETURN",
        "Needs correction",
      );
      expect(result.newStep?.id).toBe(returnStep.id);
      expect(result.newStatus).toBe("RETURNED");
    });

    it("should throw when no return target configured", async () => {
      await expect(processParticipant(participantNoReturn.id, user.id, "RETURN")).rejects.toThrow(
        "NO_RETURN_TARGET",
      );
    });
  });

  describe("ESCALATE action", () => {
    it("should move to escalation target", async () => {
      const result = await processParticipant(
        participant.id,
        user.id,
        "ESCALATE",
        "Needs supervisor",
      );
      expect(result.newStep?.id).toBe(escalationStep.id);
      expect(result.newStatus).toBe("ESCALATED");
    });
  });

  describe("PRINT action", () => {
    it("should trigger badge print side effect", async () => {
      const result = await processParticipant(participant.id, user.id, "PRINT");
      expect(result.sideEffects).toContainEqual(
        expect.objectContaining({ type: "PRINT_BADGE", status: "EXECUTED" }),
      );
    });
  });

  describe("COLLECT action", () => {
    it("should mark participant as collected at terminal step", async () => {
      const result = await processParticipant(participant.id, user.id, "COLLECT");
      expect(result.newStatus).toBe("COLLECTED");
    });
  });

  describe("NOTIFY action", () => {
    it("should trigger notification side effect", async () => {
      const result = await processParticipant(participant.id, user.id, "NOTIFY");
      expect(result.sideEffects).toContainEqual(
        expect.objectContaining({ type: "SEND_NOTIFICATION", status: "EXECUTED" }),
      );
    });
  });

  describe("ARCHIVE action", () => {
    it("should set ARCHIVED status with no next step", async () => {
      const result = await processParticipant(participant.id, user.id, "ARCHIVE");
      expect(result.newStep).toBeNull();
      expect(result.newStatus).toBe("ARCHIVED");
    });
  });

  describe("Authorization", () => {
    it("should reject user without required role", async () => {
      await expect(
        processParticipant(participant.id, unauthorizedUser.id, "APPROVE"),
      ).rejects.toThrow("UNAUTHORIZED_STEP");
    });

    it("should allow user with delegated role", async () => {
      await createDelegation(tenant.id, validator.id, delegate.id, role.id, "On leave", start, end);
      const result = await processParticipant(participant.id, delegate.id, "APPROVE");
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid actions", () => {
    it("should reject PRINT action on REVIEW step type", async () => {
      await expect(processParticipant(participantAtReview.id, user.id, "PRINT")).rejects.toThrow(
        "INVALID_ACTION",
      );
    });
  });
});
```

#### Conditional Routing Tests

```typescript
describe("evaluateConditions", () => {
  const conditions: RoutingCondition[] = [
    { field: "participantType.name", operator: "eq", value: "VIP", nextStepId: "step_vip" },
    { field: "customData.needs_visa", operator: "eq", value: true, nextStepId: "step_visa" },
    { field: "organization", operator: "in", value: ["AU", "UN"], nextStepId: "step_fast" },
  ];

  it("should match first condition (VIP type)", () => {
    const data = { participantType: { name: "VIP" } };
    expect(evaluateConditions(conditions, data)).toBe("step_vip");
  });

  it("should match second condition (visa needed)", () => {
    const data = { participantType: { name: "Regular" }, customData: { needs_visa: true } };
    expect(evaluateConditions(conditions, data)).toBe("step_visa");
  });

  it("should return null when no condition matches", () => {
    const data = { participantType: { name: "Regular" }, customData: {} };
    expect(evaluateConditions(conditions, data)).toBeNull();
  });

  it('should match "in" operator for array values', () => {
    const data = { participantType: { name: "Regular" }, organization: "AU" };
    expect(evaluateConditions(conditions, data)).toBe("step_fast");
  });
});
```

#### Parallel Fork/Join Tests

```typescript
describe("Parallel paths (fork/join)", () => {
  it("should create parallel branches on fork step approval", async () => {
    await processParticipant(participantAtFork.id, user.id, "APPROVE");
    const branches = await prisma.parallelBranch.findMany({
      where: { participantId: participantAtFork.id },
    });
    expect(branches.length).toBe(3);
    expect(branches.every((b) => b.status === "PENDING")).toBe(true);
  });

  it("should advance to join step when ALL branches complete", async () => {
    for (const branchId of forkStep.forkStepIds) {
      await processParallelBranch(participant.id, branchId, user.id, "APPROVE");
    }
    const updated = await prisma.participant.findUnique({ where: { id: participant.id } });
    expect(updated?.stepId).toBe(joinStep.id);
  });

  it("should advance on MAJORITY when majority approves", async () => {
    // 2 of 3 branches approved
    await processParallelBranch(participant.id, branch1.id, user.id, "APPROVE");
    await processParallelBranch(participant.id, branch2.id, user.id, "APPROVE");
    const allComplete = await checkJoinCondition(participant.id, forkStep.id);
    expect(allComplete).toBe(true);
  });
});
```

### 9.2 Concurrency Tests

```typescript
describe("Concurrency", () => {
  it("should handle two validators processing the same participant", async () => {
    // Simulate race condition
    const [result1, result2] = await Promise.allSettled([
      processParticipant(participant.id, validator1.id, "APPROVE"),
      processParticipant(participant.id, validator2.id, "APPROVE"),
    ]);

    // One should succeed, one should fail
    const succeeded = [result1, result2].filter((r) => r.status === "fulfilled");
    const failed = [result1, result2].filter((r) => r.status === "rejected");

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);
  });

  it("should handle concurrent batch operations on different participants", async () => {
    const batch1 = batchProcessParticipantsExtended(groupA, validator1.id, "APPROVE", "Batch 1");
    const batch2 = batchProcessParticipantsExtended(groupB, validator2.id, "APPROVE", "Batch 2");

    const [r1, r2] = await Promise.all([batch1, batch2]);
    expect(r1.succeeded + r2.succeeded).toBe(groupA.length + groupB.length);
  });
});
```

### 9.3 SLA Timer Tests

```typescript
describe("SLA Enforcement", () => {
  it("should detect overdue participants", async () => {
    // Create participant with overdue SLA
    jest.useFakeTimers();
    jest.advanceTimersByTime(1441 * 60 * 1000); // 1441 minutes (SLA is 1440)

    const result = await checkOverdueSLAsExtended();
    expect(result.breached).toBeGreaterThan(0);
  });

  it("should trigger warning before breach", async () => {
    jest.advanceTimersByTime(1200 * 60 * 1000); // 1200 min (warning at 1200 for 1440 SLA)

    const result = await checkOverdueSLAsExtended();
    expect(result.warnings).toBeGreaterThan(0);
    expect(result.breached).toBe(0);
  });

  it("should auto-escalate on SLA breach when configured", async () => {
    jest.advanceTimersByTime(1441 * 60 * 1000);

    await checkOverdueSLAsExtended();

    const updated = await prisma.participant.findUnique({ where: { id: participant.id } });
    expect(updated?.status).toBe("ESCALATED");
  });

  it("should auto-approve on SLA breach when configured", async () => {
    // Step configured with slaAction: AUTO_APPROVE
    jest.advanceTimersByTime(481 * 60 * 1000);

    await checkOverdueSLAsExtended();

    const updated = await prisma.participant.findUnique({
      where: { id: participantAutoApprove.id },
    });
    expect(updated?.status).not.toBe("PENDING");
  });
});
```

### 9.4 Simulation Mode Tests

```typescript
describe("Simulation / Dry-Run", () => {
  it("should trace workflow path without creating records", async () => {
    const result = await simulateWorkflow({
      workflowId: workflow.id,
      participantData: { participantType: { name: "VIP" }, organization: "AU Commission" },
      actions: ["APPROVE", "APPROVE", "APPROVE"],
    });

    expect(result.simulation).toBe(true);
    expect(result.path.length).toBeGreaterThan(0);

    // Verify no approval records were created
    const approvals = await prisma.approval.findMany({
      where: { isDryRun: true },
    });
    expect(approvals.length).toBe(0);
  });

  it("should identify conditional routes in simulation", async () => {
    const result = await simulateWorkflow({
      workflowId: workflow.id,
      participantData: { participantType: { name: "VIP" } },
      actions: ["APPROVE"],
    });

    expect(result.conditionalRoutesUsed.length).toBeGreaterThan(0);
  });

  it("should calculate time estimates", async () => {
    const result = await simulateWorkflow({
      workflowId: workflow.id,
      participantData: {},
      actions: ["APPROVE", "APPROVE", "APPROVE", "APPROVE"],
    });

    expect(result.estimatedTotalMinutes).toBeGreaterThan(0);
  });

  it("should detect auto-actions in simulation", async () => {
    const result = await simulateWorkflow({
      workflowId: workflow.id,
      participantData: { organization: "AU Commission" },
      actions: ["APPROVE"],
    });

    expect(result.autoActionsTriggered).toBeGreaterThan(0);
  });
});
```

### 9.5 Batch Processing Tests

```typescript
describe("Batch Processing", () => {
  it("should process multiple participants in a single batch", async () => {
    const ids = participants.map((p) => p.id);
    const result = await batchProcessParticipantsExtended(ids, user.id, "APPROVE", "Batch");

    expect(result.total).toBe(ids.length);
    expect(result.succeeded).toBe(ids.length);
    expect(result.failed).toBe(0);
  });

  it("should handle partial failures gracefully", async () => {
    const ids = [...validIds, "nonexistent_id"];
    const result = await batchProcessParticipantsExtended(ids, user.id, "APPROVE", "Batch");

    expect(result.succeeded).toBe(validIds.length);
    expect(result.failed).toBe(1);
  });

  it("should stop on error when configured", async () => {
    const ids = ["bad_id", ...validIds];
    const result = await batchProcessParticipantsExtended(ids, user.id, "APPROVE", "Batch", {
      concurrency: 1,
      stopOnError: true,
      notifyOnComplete: false,
    });

    expect(result.failed).toBe(1);
    expect(result.skipped).toBeGreaterThan(0);
  });

  it("should respect concurrency limits", async () => {
    const startTime = Date.now();
    await batchProcessParticipantsExtended(largeParticipantList, user.id, "APPROVE", "Batch", {
      concurrency: 5,
      stopOnError: false,
      notifyOnComplete: false,
    });
    // Should not exceed concurrency -- verified by mock tracking
  });

  it("should create batch audit log", async () => {
    const result = await batchProcessParticipantsExtended(ids, user.id, "APPROVE", "Batch");

    // Verify batch audit log exists
    // Implementation depends on createAuditLog mock
    expect(result.batchId).toBeTruthy();
  });
});
```

### 9.6 E2E Integration Test

```typescript
describe("E2E: Complete Workflow Lifecycle", () => {
  it("should complete full workflow: create → configure → register → process → complete", async () => {
    // 1. Create workflow
    const workflow = await createWorkflow({
      tenantId: tenant.id,
      eventId: event.id,
      name: "E2E Test Workflow",
    });
    expect(workflow.status).toBe("DRAFT");

    // 2. Add steps
    const reviewStep = await addStep(workflow.id, {
      name: "Initial Review",
      stepType: "REVIEW",
      action: "APPROVE",
      order: 1,
      isEntryPoint: true,
      slaDurationMinutes: 480,
      conditions: [
        { field: "participantType.name", operator: "eq", value: "VIP", nextStepId: null }, // Will update
      ],
    });

    const approvalStep = await addStep(workflow.id, {
      name: "Final Approval",
      stepType: "APPROVAL",
      action: "APPROVE",
      order: 2,
    });

    const printStep = await addStep(workflow.id, {
      name: "Badge Print",
      stepType: "PRINT",
      action: "PRINT",
      order: 3,
      isTerminal: true,
    });

    // 3. Configure routing
    await updateStep(reviewStep.id, { nextStepId: approvalStep.id });
    await updateStep(approvalStep.id, { nextStepId: printStep.id });

    // 4. Publish and activate
    await publishWorkflow(workflow.id);
    await activateWorkflow(workflow.id);

    const activeWorkflow = await getWorkflow(workflow.id);
    expect(activeWorkflow.status).toBe("ACTIVE");

    // 5. Register participant (triggers workflow entry)
    const participant = await registerParticipant({
      eventId: event.id,
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    });

    await onParticipantRegistered(participant.id, event.id);

    const entered = await prisma.participant.findUnique({ where: { id: participant.id } });
    expect(entered?.stepId).toBe(reviewStep.id);
    expect(entered?.status).toBe("PENDING");

    // 6. Process through workflow
    const r1 = await processParticipant(participant.id, validator.id, "APPROVE", "Documents OK");
    expect(r1.newStep?.id).toBe(approvalStep.id);

    const r2 = await processParticipant(participant.id, supervisor.id, "APPROVE", "Approved");
    expect(r2.newStep?.id).toBe(printStep.id);

    const r3 = await processParticipant(participant.id, printer.id, "PRINT");
    expect(r3.newStatus).toBe("PRINTED");

    // 7. Verify final status
    const completed = await prisma.participant.findUnique({ where: { id: participant.id } });
    expect(["PRINTED", "COMPLETED"]).toContain(completed?.status);

    // 8. Verify audit trail
    const trail = await getParticipantAuditTrail(participant.id);
    expect(trail.length).toBeGreaterThanOrEqual(3);
    expect(trail[0].action).toBe("APPROVE");
    expect(trail[trail.length - 1].action).toBe("PRINT");

    // 9. Verify workflow version was captured
    expect(entered?.workflowVersionId).toBeTruthy();
  });
});
```

---

## 10. Security Considerations

### 10.1 Step-Level Authorization

Only users with the correct role can process a workflow step. This is enforced at every `processParticipant` call.

```typescript
// Authorization matrix
interface StepAuthorizationPolicy {
  // Step role requirement
  roleRequired: string | null; // null = any authenticated user
  tenantScope: boolean; // Must be in the same tenant
  eventScope: boolean; // Must be assigned to the event

  // Assignment enforcement
  requireAssignment: boolean; // Must be specifically assigned
  allowSelfApproval: boolean; // Can the participant approve themselves

  // Delegation
  allowDelegatedAccess: boolean; // Allow delegated authority
}

async function enforceStepAuthorization(
  userId: string,
  step: Step,
  participant: Participant,
  policy: StepAuthorizationPolicy,
): Promise<void> {
  // 1. Tenant scope check
  if (policy.tenantScope) {
    const userTenant = await getUserTenant(userId);
    if (userTenant !== participant.tenantId) {
      throw new WorkflowError(
        "CROSS_TENANT_ACCESS",
        "Cannot access participant from another tenant",
      );
    }
  }

  // 2. Role check (see Section 5.4)
  if (policy.roleRequired) {
    await validateStepAuthorization(userId, step, participant.tenantId);
  }

  // 3. Assignment check
  if (policy.requireAssignment) {
    const assignment = await prisma.stepAssignment.findFirst({
      where: { participantId: participant.id, stepId: step.id, assignedTo: userId, isActive: true },
    });
    if (!assignment) {
      throw new WorkflowError(
        "NOT_ASSIGNED",
        "You are not assigned to this participant at this step",
      );
    }
  }

  // 4. Self-approval prevention
  if (!policy.allowSelfApproval && participant.userId === userId) {
    throw new WorkflowError("SELF_APPROVAL", "Cannot approve your own registration");
  }
}
```

### 10.2 Approval Fraud Detection

Detect suspicious approval patterns that may indicate fraud.

```typescript
interface FraudDetectionResult {
  suspicious: boolean;
  alerts: FraudAlert[];
}

interface FraudAlert {
  type: "SAME_USER_MULTI_STEP" | "UNUSUAL_SPEED" | "OFF_HOURS" | "BULK_PATTERN" | "ROLE_MISMATCH";
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  metadata: Record<string, unknown>;
}

async function detectApprovalFraud(
  participantId: string,
  userId: string,
  stepId: string,
): Promise<FraudDetectionResult> {
  const alerts: FraudAlert[] = [];

  // 1. Same user approving at multiple steps
  const userApprovals = await prisma.approval.findMany({
    where: { participantId, userId, action: "APPROVE" },
    include: { step: true },
  });

  if (userApprovals.length > 0) {
    const previousStepIds = userApprovals.map((a) => a.stepId);
    if (!previousStepIds.includes(stepId)) {
      alerts.push({
        type: "SAME_USER_MULTI_STEP",
        severity: "HIGH",
        description: `User ${userId} has already approved at steps: ${previousStepIds.join(", ")}`,
        metadata: { previousStepIds, currentStepId: stepId },
      });
    }
  }

  // 2. Unusually fast approval (less than 5 seconds)
  const recentApprovals = await prisma.approval.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - 60000) } },
    orderBy: { createdAt: "desc" },
  });

  if (recentApprovals.length > 10) {
    alerts.push({
      type: "UNUSUAL_SPEED",
      severity: "MEDIUM",
      description: `User ${userId} approved ${recentApprovals.length} participants in the last minute`,
      metadata: { count: recentApprovals.length },
    });
  }

  // 3. Off-hours approval
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    alerts.push({
      type: "OFF_HOURS",
      severity: "LOW",
      description: `Approval at unusual hour: ${hour}:00`,
      metadata: { hour },
    });
  }

  return {
    suspicious: alerts.some((a) => a.severity === "HIGH"),
    alerts,
  };
}
```

### 10.3 Audit Trail Integrity

Approval records are immutable. The system implements tamper detection.

```typescript
// Approval records have no UPDATE or DELETE operations exposed
// The Prisma schema uses @default(now()) for createdAt with no updatedAt

// Integrity check: verify no gaps in approval sequence
async function verifyAuditTrailIntegrity(participantId: string): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const approvals = await prisma.approval.findMany({
    where: { participantId },
    orderBy: { createdAt: "asc" },
  });

  const issues: string[] = [];

  for (let i = 1; i < approvals.length; i++) {
    const prev = approvals[i - 1];
    const curr = approvals[i];

    // Verify status chain consistency
    if (prev.newStatus !== curr.previousStatus) {
      issues.push(
        `Gap at index ${i}: previous newStatus (${prev.newStatus}) != current previousStatus (${curr.previousStatus})`,
      );
    }

    // Verify chronological order
    if (curr.createdAt < prev.createdAt) {
      issues.push(`Chronological violation at index ${i}`);
    }
  }

  return { valid: issues.length === 0, issues };
}
```

### 10.4 Tenant Isolation

Every workflow query includes tenant context, enforced at the service layer.

```typescript
// Middleware applied to all workflow service methods
function withTenantContext<T>(
  tenantId: string,
  operation: (tenantId: string) => Promise<T>,
): Promise<T> {
  if (!tenantId) {
    throw new WorkflowError("MISSING_TENANT", "Tenant context is required");
  }
  return operation(tenantId);
}

// Example: get workflow always scoped to tenant
async function getWorkflow(workflowId: string, tenantId: string): Promise<Workflow> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, tenantId },
  });

  if (!workflow) {
    throw new WorkflowError("WORKFLOW_NOT_FOUND", "Workflow not found in tenant");
  }

  return workflow;
}
```

---

## 11. Performance Requirements

### 11.1 Latency Targets

| Operation                         | Target  | P99 Target |
| --------------------------------- | ------- | ---------- |
| Single `processParticipant`       | < 200ms | < 500ms    |
| Batch process (100 participants)  | < 5s    | < 10s      |
| Workflow definition load          | < 50ms  | < 100ms    |
| Step routing evaluation           | < 5ms   | < 10ms     |
| SLA check job (1000 participants) | < 10s   | < 30s      |
| Simulation / dry-run              | < 100ms | < 300ms    |
| Analytics query (30 days)         | < 2s    | < 5s       |
| Audit trail retrieval             | < 100ms | < 300ms    |

### 11.2 Throughput Targets

| Metric                                | Target                     |
| ------------------------------------- | -------------------------- |
| Concurrent `processParticipant` calls | 100/second                 |
| Batch processing throughput           | 100 participants/second    |
| Webhook dispatch rate                 | 50/second                  |
| SLA check scan rate                   | 10,000 participants/minute |
| Concurrent workflow builder sessions  | 50 per tenant              |

### 11.3 Optimization Strategies

**Workflow definition caching:**

```typescript
import { LRUCache } from "lru-cache";

const workflowCache = new LRUCache<string, Workflow & { steps: Step[] }>({
  max: 500,
  ttl: 5 * 60 * 1000, // 5 minutes
});

async function getCachedWorkflow(workflowId: string): Promise<Workflow & { steps: Step[] }> {
  const cached = workflowCache.get(workflowId);
  if (cached) return cached;

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: true },
  });

  if (workflow) {
    workflowCache.set(workflowId, workflow);
  }

  return workflow!;
}

// Invalidate on workflow update
function invalidateWorkflowCache(workflowId: string): void {
  workflowCache.delete(workflowId);
}
```

**SLA check optimization with index-based queries:**

```typescript
// Optimized SLA query using database index on (status, stepId)
// Combined with a single query instead of N+1
async function getOverdueParticipantsOptimized(): Promise<OverdueParticipant[]> {
  // Single query with raw SQL for maximum performance
  const result = await prisma.$queryRaw<OverdueParticipant[]>`
    SELECT
      p.id as "participantId",
      p."stepId",
      s."slaDurationMinutes",
      s."slaAction",
      s."slaEscalationRoleId",
      COALESCE(
        (SELECT MAX(a."createdAt") FROM approvals a WHERE a."participantId" = p.id),
        p."createdAt"
      ) as "lastActionAt"
    FROM participants p
    JOIN steps s ON s.id = p."stepId"
    WHERE p.status IN ('PENDING', 'INPROGRESS')
      AND s."slaDurationMinutes" IS NOT NULL
      AND (
        COALESCE(
          (SELECT MAX(a."createdAt") FROM approvals a WHERE a."participantId" = p.id),
          p."createdAt"
        ) + (s."slaDurationMinutes" * interval '1 minute')
      ) < NOW()
    ORDER BY "lastActionAt" ASC
    LIMIT 1000
  `;

  return result;
}
```

**Concurrent execution handling with optimistic locking:**

```typescript
async function processParticipantWithLock(
  participantId: string,
  userId: string,
  action: Action,
  remarks?: string,
): Promise<ProcessResult> {
  // Optimistic lock using version column
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, version: true, stepId: true },
  });

  if (!participant) throw new WorkflowError("PARTICIPANT_NOT_FOUND", "Not found");

  try {
    // Attempt to acquire lock by updating with version check
    const locked = await prisma.participant.updateMany({
      where: { id: participantId, version: participant.version },
      data: { version: { increment: 1 }, status: "INPROGRESS" },
    });

    if (locked.count === 0) {
      throw new WorkflowError(
        "CONCURRENT_MODIFICATION",
        "Participant was modified by another user",
        true,
      );
    }

    return await processParticipant(participantId, userId, action, remarks);
  } catch (error) {
    if ((error as WorkflowError).code === "CONCURRENT_MODIFICATION") {
      // Retry after short delay
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));
      return processParticipantWithLock(participantId, userId, action, remarks);
    }
    throw error;
  }
}
```

---

## 12. Open Questions & Decisions

| #   | Question                                       | Options                                                                                                        | Status | Impact              |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ | ------------------- |
| 1   | **Maximum workflow complexity**                | (a) 50 steps, 5 parallel paths (b) 100 steps, 10 paths (c) Configurable per tenant                             | Open   | Performance, UX     |
| 2   | **Workflow migration between events**          | (a) Clone only (b) Clone + remap participants (c) Live migration                                               | Open   | Data integrity      |
| 3   | **Collaborative workflow editing**             | (a) Lock-based (one editor at a time) (b) CRDT-based (real-time collab) (c) Branch-and-merge                   | Open   | Complexity, UX      |
| 4   | **Workflow marketplace curation**              | (a) Open marketplace (any tenant can publish) (b) Curated (platform admin reviews) (c) Both with quality tiers | Open   | Governance          |
| 5   | **Real-time workflow monitoring refresh rate** | (a) Polling every 5s (b) WebSocket push (c) SSE (Server-Sent Events)                                           | Open   | Infrastructure      |
| 6   | **Workflow version migration**                 | How to handle participants when force-migrating to new version                                                 | Open   | Data integrity      |
| 7   | **Step timeout vs SLA**                        | Are timers and SLAs redundant? Should they be unified?                                                         | Open   | Simplicity          |
| 8   | **Counter-based steps and partial approvals**  | How to display partial approval state in the UI                                                                | Open   | UX                  |
| 9   | **Webhook authentication**                     | (a) API key in header (b) OAuth2 (c) HMAC signature (d) All three                                              | Open   | Security            |
| 10  | **Analytics data retention**                   | How long to keep granular approval data vs aggregated metrics                                                  | Open   | Storage, compliance |
| 11  | **Workflow testing in production**             | Can simulation mode be used on ACTIVE workflows with real data?                                                | Open   | Safety              |
| 12  | **Delegation audit requirements**              | Should delegated actions be flagged differently in compliance reports?                                         | Open   | Compliance          |

---

## Appendix

### A. Glossary

#### State Machine Terms

| Term               | Definition                                                                         |
| ------------------ | ---------------------------------------------------------------------------------- |
| **State**          | A node in the workflow graph representing a step where a participant awaits action |
| **Transition**     | The movement from one state to another, triggered by an action                     |
| **Guard**          | A condition that must be true for a transition to occur (conditional routing)      |
| **Action**         | An operation performed by a user or system that triggers a transition              |
| **Side Effect**    | An operation triggered by a transition (email, webhook, notification)              |
| **Terminal State** | A state with no outgoing transitions (workflow endpoint)                           |
| **Entry State**    | The initial state where participants begin the workflow                            |
| **Fork**           | A state that splits execution into multiple parallel paths                         |
| **Join**           | A state that waits for multiple parallel paths to converge                         |

#### Workflow Terms

| Term                    | Definition                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| **Workflow**            | A complete definition of an approval pipeline for a specific event    |
| **Step**                | A single node in the workflow where an action must be taken           |
| **Participant**         | A person (registrant) who passes through the workflow                 |
| **Validator**           | A user authorized to process participants at specific steps           |
| **SLA**                 | Service Level Agreement -- the maximum time allowed at a step         |
| **Escalation**          | Moving a participant to a higher authority when SLA is breached       |
| **Delegation**          | Temporary transfer of a validator's authority to another user         |
| **Version**             | A snapshot of the workflow at a point in time                         |
| **Approval Record**     | An immutable audit entry recording every action taken                 |
| **Batch Operation**     | Processing multiple participants with a single action                 |
| **Dry Run**             | Testing a workflow path without creating real records                 |
| **Auto-Action**         | A rule that automatically processes a step without human intervention |
| **Conditional Routing** | Dynamic path selection based on participant attributes                |
| **Dead Letter**         | A queue for unprocessable items that have exhausted all retries       |

### B. References

| Reference                                                                         | Description                                          |
| --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                 | Core data models (Tenant, Event, Participant)        |
| [Module 02: Dynamic Schema Engine](./02-DYNAMIC-SCHEMA-ENGINE.md)                 | Custom field definitions used in conditional routing |
| [Module 03: Visual Form Designer](./03-VISUAL-FORM-DESIGNER.md)                   | Step-specific forms for data collection              |
| [Module 05: Security & Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       | Role-based authorization for step processing         |
| [Module 06: Infrastructure & DevOps](./06-INFRASTRUCTURE-AND-DEVOPS.md)           | pg-boss job scheduling for SLA checks                |
| [Module 07: API & Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)           | REST API exposure for workflow endpoints             |
| [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | Participant registration triggers workflow entry     |
| [Module 10: Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md)             | Workflow metrics on operations dashboard             |
| [@xyflow/react](https://reactflow.dev/)                                           | React Flow library for visual workflow builder       |
| [dagre](https://github.com/dagrejs/dagre)                                         | Graph layout library for auto-positioning            |
| [pg-boss](https://github.com/timgit/pg-boss)                                      | PostgreSQL-based job queue for background tasks      |

### C. Action Type Catalog

| Action       | Description                                             | Valid Step Types                                              | Side Effects                                    | Valid Transitions                                                 |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| **APPROVE**  | Accept the participant at this step and advance to next | REVIEW, APPROVAL, CUSTOM, FORK, JOIN, TIMER, COUNTER          | Notification, webhook, auto-assign at next step | `nextStepId` (default), conditional routing target, fork branches |
| **REJECT**   | Deny the participant at this step                       | REVIEW, APPROVAL, CUSTOM, COUNTER                             | Notification, webhook                           | `rejectionTargetId` or terminal REJECTED status                   |
| **BYPASS**   | Skip this step and advance                              | REVIEW, APPROVAL, PRINT, COLLECT, NOTIFICATION, CUSTOM, TIMER | Notification                                    | `bypassTargetId` or `nextStepId`                                  |
| **PRINT**    | Trigger badge printing                                  | PRINT                                                         | Badge print job, notification                   | `nextStepId` or terminal PRINTED status                           |
| **COLLECT**  | Record badge collection                                 | COLLECT                                                       | Notification                                    | `nextStepId` or terminal COLLECTED status                         |
| **NOTIFY**   | Send notification and advance                           | NOTIFICATION, CUSTOM                                          | Email/SMS/push notification                     | `nextStepId` or terminal NOTIFIED status                          |
| **ARCHIVE**  | Permanently archive the participant                     | CUSTOM                                                        | None                                            | Terminal ARCHIVED status (no next step)                           |
| **RETURN**   | Send participant back to a previous step                | REVIEW, APPROVAL, PRINT, COLLECT, CUSTOM                      | Notification to previous step validator         | `returnTargetId` (must be earlier step)                           |
| **ESCALATE** | Escalate to a higher authority                          | REVIEW, APPROVAL, CUSTOM                                      | Escalation notification, reassignment           | `escalationTargetId` or escalation chain                          |

**Action state diagram:**

```
                    APPROVE
         ┌──────────────────────────────────┐
         │                                  ▼
    ┌─────────┐  REJECT   ┌──────────┐  ┌──────────┐
    │ Current │──────────▶│ Rejection│  │  Next    │
    │  Step   │           │  Target  │  │  Step    │
    │         │  BYPASS   └──────────┘  └──────────┘
    │         │──────────▶ Bypass Target / Next Step
    │         │
    │         │  RETURN   ┌──────────┐
    │         │──────────▶│ Previous │
    │         │           │  Step    │
    │         │           └──────────┘
    │         │  ESCALATE ┌──────────┐
    │         │──────────▶│ Escalate │
    │         │           │  Target  │
    │         │           └──────────┘
    │         │  ARCHIVE
    │         │──────────▶ [ARCHIVED - Terminal]
    │         │
    │         │  PRINT
    │         │──────────▶ Next Step / [PRINTED - Terminal]
    │         │
    │         │  COLLECT
    │         │──────────▶ Next Step / [COLLECTED - Terminal]
    │         │
    │         │  NOTIFY
    │         │──────────▶ Next Step / [NOTIFIED - Terminal]
    └─────────┘
```

---

_This module document is part of the multi-tenant accreditation platform design series. For questions or updates, refer to the [Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md)._
