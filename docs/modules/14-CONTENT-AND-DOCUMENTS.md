# Module 14: Content and Documents

> **Module:** 14 - Content and Documents
> **Version:** 1.0
> **Last Updated:** February 13, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md), [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md)
> **Required By:** [Module 16: Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)
> **Integrates With:** [Module 03: Visual Form Designer](./03-VISUAL-FORM-DESIGNER.md), [Module 04: Workflow](./04-WORKFLOW-ENGINE.md), [Module 07: API](./07-API-AND-INTEGRATION-LAYER.md), [Module 08: UI/UX](./08-UI-UX-AND-FRONTEND.md), [Module 09: Registration](./09-REGISTRATION-AND-ACCREDITATION.md), [Module 10: Event Operations](./10-EVENT-OPERATIONS-CENTER.md), [Module 13: People](./13-PEOPLE-AND-WORKFORCE.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Domain Concepts](#14-domain-concepts)
   - 1.5 [Design Principles](#15-design-principles)
2. [Architecture](#2-architecture)
   - 2.1 [Content Platform Architecture](#21-content-platform-architecture)
   - 2.2 [Message Delivery Pipeline](#22-message-delivery-pipeline)
   - 2.3 [Certificate Generation Pipeline](#23-certificate-generation-pipeline)
   - 2.4 [Survey Distribution Pipeline](#24-survey-distribution-pipeline)
   - 2.5 [Template Marketplace Architecture](#25-template-marketplace-architecture)
   - 2.6 [Bounded Context Map](#26-bounded-context-map)
3. [Data Model](#3-data-model)
   - 3.1 [Communication Hub Models](#31-communication-hub-models)
   - 3.2 [Template Marketplace Models](#32-template-marketplace-models)
   - 3.3 [Survey and Feedback Models](#33-survey-and-feedback-models)
   - 3.4 [Certificate and Document Models](#34-certificate-and-document-models)
   - 3.5 [Enhanced Models](#35-enhanced-models)
   - 3.6 [ER Diagram](#36-er-diagram)
   - 3.7 [Index Catalog](#37-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Communication Hub APIs](#41-communication-hub-apis)
   - 4.2 [Template Marketplace APIs](#42-template-marketplace-apis)
   - 4.3 [Survey APIs](#43-survey-apis)
   - 4.4 [Certificate APIs](#44-certificate-apis)
   - 4.5 [SSE Events](#45-sse-events)
   - 4.6 [Webhook Events](#46-webhook-events)
5. [Business Logic](#5-business-logic)
   - 5.1 [Message Delivery Pipeline](#51-message-delivery-pipeline)
   - 5.2 [Template Publishing Workflow](#52-template-publishing-workflow)
   - 5.3 [Template Installation and Conflict Resolution](#53-template-installation-and-conflict-resolution)
   - 5.4 [Survey Auto-Distribution](#54-survey-auto-distribution)
   - 5.5 [Survey Reminder Engine](#55-survey-reminder-engine)
   - 5.6 [Sentiment Analysis Pipeline](#56-sentiment-analysis-pipeline)
   - 5.7 [Year-over-Year Survey Comparison](#57-year-over-year-survey-comparison)
   - 5.8 [Certificate Conditional Issuance Engine](#58-certificate-conditional-issuance-engine)
   - 5.9 [Bulk Certificate Generation Pipeline](#59-bulk-certificate-generation-pipeline)
   - 5.10 [Certificate Verification and Anti-Forgery](#510-certificate-verification-and-anti-forgery)
   - 5.11 [Emergency Broadcast Bypass Logic](#511-emergency-broadcast-bypass-logic)
6. [User Interface](#6-user-interface)
   - 6.1 [Template Builder](#61-template-builder)
   - 6.2 [Broadcast Composer Wizard](#62-broadcast-composer-wizard)
   - 6.3 [Emergency Broadcast Dialog](#63-emergency-broadcast-dialog)
   - 6.4 [Template Marketplace Discovery](#64-template-marketplace-discovery)
   - 6.5 [Template Preview and Installation](#65-template-preview-and-installation)
   - 6.6 [Survey Builder Interface](#66-survey-builder-interface)
   - 6.7 [Survey Results Dashboard](#67-survey-results-dashboard)
   - 6.8 [Certificate Designer](#68-certificate-designer)
   - 6.9 [Certificate Verification Page](#69-certificate-verification-page)
   - 6.10 [Delivery Analytics Dashboard](#610-delivery-analytics-dashboard)
   - 6.11 [Responsive and Mobile Patterns](#611-responsive-and-mobile-patterns)
7. [Integration Points](#7-integration-points)
   - 7.1 [Module Integration Map](#71-module-integration-map)
   - 7.2 [Event-Driven Integration](#72-event-driven-integration)
   - 7.3 [Integration Contracts](#73-integration-contracts)
8. [Configuration](#8-configuration)
   - 8.1 [Feature Flags](#81-feature-flags)
   - 8.2 [Communication Configuration](#82-communication-configuration)
   - 8.3 [Template Marketplace Configuration](#83-template-marketplace-configuration)
   - 8.4 [Survey Configuration](#84-survey-configuration)
   - 8.5 [Certificate Configuration](#85-certificate-configuration)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Message Delivery Tests](#91-message-delivery-tests)
   - 9.2 [Template Marketplace Tests](#92-template-marketplace-tests)
   - 9.3 [Survey Distribution Tests](#93-survey-distribution-tests)
   - 9.4 [Certificate Generation Tests](#94-certificate-generation-tests)
   - 9.5 [Integration Tests](#95-integration-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [Communication Security](#101-communication-security)
    - 10.2 [Template Security](#102-template-security)
    - 10.3 [Survey Data Protection](#103-survey-data-protection)
    - 10.4 [Certificate Anti-Forgery](#104-certificate-anti-forgery)
    - 10.5 [Role-Based Access Matrix](#105-role-based-access-matrix)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Message Throughput](#111-message-throughput)
    - 11.2 [Certificate Generation Latency](#112-certificate-generation-latency)
    - 11.3 [Survey Response Processing](#113-survey-response-processing)
    - 11.4 [Template Search Performance](#114-template-search-performance)
    - 11.5 [Real-Time Update Propagation](#115-real-time-update-propagation)
12. [Open Questions and Decisions](#12-open-questions-and-decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Message Template Variables Catalog](#c-message-template-variables-catalog)
  - D. [Survey Question Types Reference](#d-survey-question-types-reference)
  - E. [Certificate Field Placeholders](#e-certificate-field-placeholders)

---

## 1. Overview

### 1.1 Purpose

Module 14: Content and Documents provides the comprehensive content management, communication, and document generation infrastructure for the Accreditation Platform. This module consolidates four critical subsystems that work together to deliver seamless content experiences:

1. **Communication Hub**: Centralized multi-channel messaging with templated communications, audience targeting, scheduled delivery, and real-time tracking across email, SMS, push notifications, and in-app messages.

2. **Template Marketplace**: A collaborative ecosystem for sharing and reusing design assets including badge templates, workflow configurations, registration forms, seating layouts, and certificate designs across tenants.

3. **Post-Event Surveys & Feedback**: Intelligent survey distribution system with automatic targeting, sentiment analysis, and longitudinal comparison capabilities for continuous event improvement.

4. **Certificate & Document Generation**: Professional certificate creation with conditional issuance rules, bulk generation pipelines, and cryptographic verification for authenticity.

Together, these subsystems enable event organizers to communicate effectively with participants, leverage community-created assets, gather actionable feedback, and deliver professional documentation that validates participation and achievements.

### 1.2 Scope

This module encompasses the following capabilities:

**Communication Hub**

- Multi-channel message delivery (Email, SMS, Push, In-App)
- Template management with variable substitution
- Audience filtering and segmentation
- Scheduled and immediate broadcast capabilities
- Emergency broadcast with priority bypass
- Delivery tracking and analytics
- Bounce handling and retry logic

**Template Marketplace**

- Template publishing workflow with review process
- Category-based discovery (Badge, Workflow, Form, Report, Certificate, Seating Layout)
- Version control and changelog tracking
- Rating and review system
- Installation with conflict detection
- Template forking and customization
- Usage analytics

**Post-Event Surveys & Feedback**

- Drag-and-drop survey builder
- Multiple question types (Rating, Text, Multiple Choice, Scale, NPS, Yes/No)
- Automatic distribution based on attendance
- Reminder scheduling
- Sentiment analysis and theme extraction
- Year-over-year comparison
- Session-level feedback correlation

**Certificate & Document Generation**

- Canvas-based certificate designer
- Conditional issuance rules (Attendance, Sessions, Manual)
- Bulk generation with concurrent processing
- QR code verification
- Digital signature support
- Public verification portal
- Revocation management

**Out of Scope**

- Document management systems (file storage handled by Module 07)
- Learning management systems (external integration)
- Marketing automation (handled by external CRM)
- Print fulfillment (external vendor integration)
- Translation services (infrastructure provided, content external)

### 1.3 Key Personas

#### Communication Administrator

**Role**: Manages all outbound communications for events

**Responsibilities**:

- Creating and maintaining message templates
- Composing and scheduling broadcasts
- Monitoring delivery metrics
- Handling emergency communications
- Managing bounce lists and deliverability

**Key Needs**:

- Rich text editor with variable insertion
- Audience preview before sending
- Real-time delivery tracking
- Easy template cloning and versioning
- Quick access to emergency broadcast

**Pain Points**:

- Coordinating messages across multiple channels
- Ensuring message personalization
- Tracking which participants received which communications
- Managing time zones for scheduled sends

#### Template Publisher

**Role**: Creates and shares reusable templates in the marketplace

**Responsibilities**:

- Designing high-quality templates
- Writing documentation and usage guides
- Maintaining template versions
- Responding to reviews and feedback
- Monitoring usage analytics

**Key Needs**:

- Preview across different contexts
- Version control with rollback
- Usage metrics and feedback
- Revenue sharing (future feature)
- Promotion tools

**Pain Points**:

- Ensuring cross-tenant compatibility
- Managing multiple template versions
- Gathering meaningful feedback
- Protecting intellectual property

#### Survey Designer

**Role**: Creates and analyzes post-event feedback surveys

**Responsibilities**:

- Designing effective survey questions
- Configuring distribution rules
- Analyzing response data
- Generating insights reports
- Comparing trends across events

**Key Needs**:

- Intuitive question builder
- Skip logic and branching
- Real-time response monitoring
- Sentiment analysis automation
- Export and visualization tools

**Pain Points**:

- Achieving high response rates
- Correlating feedback with sessions
- Identifying actionable insights
- Comparing across different event editions

#### Certificate Manager

**Role**: Manages certificate issuance and verification

**Responsibilities**:

- Designing certificate templates
- Configuring issuance rules
- Managing bulk generation
- Handling verification requests
- Processing revocations

**Key Needs**:

- WYSIWYG certificate designer
- Flexible conditional rules
- Progress tracking for bulk jobs
- Verification audit trail
- Integration with attendance data

**Pain Points**:

- Manual verification requests
- Ensuring anti-forgery measures
- Managing large batch generations
- Coordinating with attendance tracking

### 1.4 Domain Concepts

#### Communication Hub Domain

| Concept                   | Definition                                                                     |
| ------------------------- | ------------------------------------------------------------------------------ |
| **Message Template**      | Reusable message structure with variable placeholders for personalization      |
| **Broadcast Message**     | A single communication sent to multiple recipients                             |
| **Message Delivery**      | Individual delivery record tracking status per recipient                       |
| **Message Channel**       | Communication medium (Email, SMS, Push, In-App)                                |
| **Audience Filter**       | JSON-based criteria for selecting broadcast recipients                         |
| **Variable Substitution** | Runtime replacement of placeholders with participant data                      |
| **Delivery Status**       | Lifecycle state of message (Queued, Sending, Sent, Delivered, Bounced, Failed) |
| **Emergency Broadcast**   | High-priority message bypassing normal scheduling                              |
| **Bounce Handling**       | Process for managing undeliverable messages                                    |

#### Template Marketplace Domain

| Concept                   | Definition                                                                  |
| ------------------------- | --------------------------------------------------------------------------- |
| **Marketplace Template**  | Publishable asset available for cross-tenant installation                   |
| **Template Category**     | Classification (Badge, Workflow, Form, Report, Certificate, Seating Layout) |
| **Template Version**      | Immutable snapshot with changelog                                           |
| **Template Installation** | Record of template adoption by tenant                                       |
| **Template Review**       | Rating and comment from installing tenant                                   |
| **Publish Status**        | Workflow state (Draft, In Review, Published, Deprecated)                    |
| **Template Fork**         | Copy of template for customization                                          |
| **Conflict Detection**    | Analysis of incompatibilities during installation                           |

#### Survey and Feedback Domain

| Concept                       | Definition                                                       |
| ----------------------------- | ---------------------------------------------------------------- |
| **Survey**                    | Collection of questions with distribution rules                  |
| **Survey Question**           | Individual prompt with type and options                          |
| **Survey Response**           | Participant's submission record                                  |
| **Survey Answer**             | Individual question response                                     |
| **Question Type**             | Input format (Rating, Text, Multiple Choice, Scale, NPS, Yes/No) |
| **Auto-Distribution**         | Automatic survey sending based on triggers                       |
| **Sentiment Analysis**        | NLP-based emotional classification of text responses             |
| **Theme Extraction**          | Keyword and topic identification from responses                  |
| **Year-over-Year Comparison** | Longitudinal analysis across event editions                      |

#### Certificate and Document Domain

| Concept                    | Definition                                    |
| -------------------------- | --------------------------------------------- |
| **Certificate Template**   | Canvas-based design with dynamic fields       |
| **Certificate**            | Issued document for specific participant      |
| **Issuance Rule**          | Condition triggering automatic generation     |
| **Verification Code**      | Unique identifier for authenticity checking   |
| **QR Payload**             | Encoded data for mobile verification          |
| **Certificate Batch**      | Group of certificates generated together      |
| **Certificate Revocation** | Invalidation with reason tracking             |
| **Attendance Threshold**   | Minimum participation percentage for issuance |
| **Canvas Data**            | JSON representation of certificate design     |

### 1.5 Design Principles

#### 1.5.1 Channel Agnosticism

The Communication Hub treats all delivery channels uniformly through a common abstraction:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHANNEL ABSTRACTION                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌──────────────────┐                                                 │
│    │  Message Content  │                                                 │
│    └────────┬─────────┘                                                 │
│             │                                                            │
│             ▼                                                            │
│    ┌──────────────────┐                                                 │
│    │  Channel Router   │                                                 │
│    └────────┬─────────┘                                                 │
│             │                                                            │
│    ┌────────┼────────┬───────────┬───────────┐                          │
│    │        │        │           │           │                          │
│    ▼        ▼        ▼           ▼           ▼                          │
│ ┌──────┐ ┌──────┐ ┌──────┐  ┌──────┐  ┌──────────┐                      │
│ │ Email│ │ SMS  │ │ Push │  │In-App│  │  Future  │                      │
│ │Adapter│ │Adapter│ │Adapter│  │Adapter│  │ Channels │                      │
│ └──────┘ └──────┘ └──────┘  └──────┘  └──────────┘                      │
│                                                                          │
│  Common Interface:                                                       │
│  - send(recipient, content, options)                                    │
│  - getStatus(deliveryId)                                                │
│  - handleCallback(webhookData)                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Benefits**:

- Easy addition of new channels
- Consistent delivery tracking
- Unified analytics
- Channel failover support

#### 1.5.2 Template Composability

Templates in the marketplace are designed for composition and extension:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TEMPLATE COMPOSABILITY                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Base Template (Published)                                              │
│  ┌─────────────────────────────────────────────┐                        │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │                        │
│  │  │ Header  │ │  Body   │ │ Footer  │       │                        │
│  │  │Component│ │Component│ │Component│       │                        │
│  │  └─────────┘ └─────────┘ └─────────┘       │                        │
│  │                                              │                        │
│  │  + Variables: {{name}}, {{title}}, {{date}} │                        │
│  │  + Styles: colors, fonts, spacing           │                        │
│  └─────────────────────────────────────────────┘                        │
│                    │                                                     │
│         ┌──────────┴──────────┐                                         │
│         │    Fork/Extend      │                                         │
│         └──────────┬──────────┘                                         │
│                    ▼                                                     │
│  Tenant Customization                                                   │
│  ┌─────────────────────────────────────────────┐                        │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │                        │
│  │  │ Custom  │ │  Body   │ │ Custom  │       │                        │
│  │  │ Header  │ │(inherited)│ │ Footer  │       │                        │
│  │  └─────────┘ └─────────┘ └─────────┘       │                        │
│  │                                              │                        │
│  │  + Added: {{organization}}, {{logo}}        │                        │
│  │  + Override: brand colors                   │                        │
│  └─────────────────────────────────────────────┘                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Principles**:

- Immutable published versions
- Fork for customization
- Inherit updates optionally
- Clear lineage tracking

#### 1.5.3 Feedback Loop Integration

Surveys connect feedback directly to event improvement:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FEEDBACK LOOP INTEGRATION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │  Event  │───▶│ Check-In │───▶│ Survey  │───▶│ Analysis│             │
│   │ Ends    │    │  Data   │    │ Sent    │    │ Engine  │             │
│   └─────────┘    └─────────┘    └─────────┘    └────┬────┘             │
│                                                      │                   │
│                                                      ▼                   │
│                                        ┌─────────────────────┐          │
│                                        │   Insights Layer    │          │
│                                        │  ┌───────────────┐  │          │
│                                        │  │ Sentiment     │  │          │
│                                        │  │ Themes        │  │          │
│                                        │  │ Correlations  │  │          │
│                                        │  │ Trends        │  │          │
│                                        │  └───────────────┘  │          │
│                                        └──────────┬──────────┘          │
│                                                   │                      │
│         ┌─────────────────────────────────────────┼───────────┐         │
│         │                                         │           │         │
│         ▼                                         ▼           ▼         │
│   ┌───────────┐                           ┌───────────┐ ┌───────────┐   │
│   │  Command  │                           │ Next Event│ │ Reports & │   │
│   │  Center   │                           │ Planning  │ │ Analytics │   │
│   │ (Real-time)│                           │ (Future)  │ │ (Export)  │   │
│   └───────────┘                           └───────────┘ └───────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Connections**:

- Check-in data triggers survey eligibility
- Session attendance correlates with feedback
- Sentiment feeds command center
- Trends inform future planning

#### 1.5.4 Verification-First Certificates

Every certificate is designed with verification as a primary concern:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     VERIFICATION-FIRST DESIGN                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Certificate Generation                    Verification Flow            │
│  ┌─────────────────────┐                  ┌─────────────────────┐       │
│  │ ┌─────────────────┐ │                  │  Third Party        │       │
│  │ │  Canvas Design  │ │                  │  (Employer/Org)     │       │
│  │ └────────┬────────┘ │                  └──────────┬──────────┘       │
│  │          │          │                             │                   │
│  │          ▼          │                   ┌─────────▼─────────┐        │
│  │ ┌─────────────────┐ │                   │  Scan QR Code or  │        │
│  │ │ Generate Unique │ │                   │  Enter Code       │        │
│  │ │ - Certificate # │ │                   └─────────┬─────────┘        │
│  │ │ - Verify Code   │ │                             │                   │
│  │ │ - QR Payload    │ │                   ┌─────────▼─────────┐        │
│  │ └────────┬────────┘ │                   │  Public Verify    │        │
│  │          │          │                   │  Portal           │        │
│  │          ▼          │                   └─────────┬─────────┘        │
│  │ ┌─────────────────┐ │                             │                   │
│  │ │ Sign with       │ │                   ┌─────────▼─────────┐        │
│  │ │ Crypto Hash     │ │                   │  Database Lookup  │        │
│  │ └────────┬────────┘ │                   │  + Status Check   │        │
│  │          │          │                   └─────────┬─────────┘        │
│  │          ▼          │                             │                   │
│  │ ┌─────────────────┐ │                   ┌─────────▼─────────┐        │
│  │ │ Generate PDF    │ │                   │  Return Status:   │        │
│  │ │ with QR Code    │ │                   │  - Valid          │        │
│  │ └─────────────────┘ │                   │  - Revoked        │        │
│  └─────────────────────┘                   │  - Not Found      │        │
│                                            └───────────────────┘        │
│                                                                          │
│  Security Measures:                                                      │
│  - Unique certificate numbers                                           │
│  - Short verification codes (human-readable)                            │
│  - QR with cryptographic payload                                        │
│  - Audit trail of verifications                                         │
│  - Revocation with reason                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 1.5.5 Multi-Tenant Content Isolation

All content respects tenant boundaries while enabling controlled sharing:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONTENT ISOLATION MODEL                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    GLOBAL MARKETPLACE                            │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │  Published Templates (Opt-in Sharing)                      │ │    │
│  │  │  - Read: All Tenants                                       │ │    │
│  │  │  - Write: Author Tenant Only                               │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────┐    ┌─────────────────────────┐             │
│  │      TENANT A           │    │      TENANT B           │             │
│  │  ┌───────────────────┐  │    │  ┌───────────────────┐  │             │
│  │  │ Message Templates │  │    │  │ Message Templates │  │             │
│  │  │ (Private)         │  │    │  │ (Private)         │  │             │
│  │  └───────────────────┘  │    │  └───────────────────┘  │             │
│  │  ┌───────────────────┐  │    │  ┌───────────────────┐  │             │
│  │  │ Surveys           │  │    │  │ Surveys           │  │             │
│  │  │ (Event-Scoped)    │  │    │  │ (Event-Scoped)    │  │             │
│  │  └───────────────────┘  │    │  └───────────────────┘  │             │
│  │  ┌───────────────────┐  │    │  ┌───────────────────┐  │             │
│  │  │ Certificates      │  │    │  │ Certificates      │  │             │
│  │  │ (Event-Scoped)    │  │    │  │ (Event-Scoped)    │  │             │
│  │  └───────────────────┘  │    │  └───────────────────┘  │             │
│  │  ┌───────────────────┐  │    │  ┌───────────────────┐  │             │
│  │  │ Installed         │  │    │  │ Installed         │  │             │
│  │  │ Marketplace       │  │    │  │ Marketplace       │  │             │
│  │  │ Templates         │  │    │  │ Templates         │  │             │
│  │  └───────────────────┘  │    │  └───────────────────┘  │             │
│  └─────────────────────────┘    └─────────────────────────┘             │
│                                                                          │
│  Isolation Rules:                                                        │
│  - Templates are tenant-private until published to marketplace          │
│  - Surveys and certificates are always event-scoped                     │
│  - Installations create tenant-local copies                             │
│  - Delivery records never cross tenant boundaries                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Content Platform Architecture

The Content and Documents module orchestrates four major subsystems through a unified architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CONTENT PLATFORM ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                    API GATEWAY                                             │  │
│  │   /api/v1/communications  /api/v1/marketplace  /api/v1/surveys  /api/v1/certificates     │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────┘  │
│                │                        │                    │                    │              │
│                ▼                        ▼                    ▼                    ▼              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  COMMUNICATION HUB   │  │ TEMPLATE MARKETPLACE │  │  SURVEY SYSTEM   │  │ CERTIFICATE GEN  │ │
│  │                      │  │                      │  │                  │  │                  │ │
│  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │ │
│  │ │ Template Engine  │ │  │ │ Discovery Engine │ │  │ │ Form Builder │ │  │ │Canvas Engine │ │ │
│  │ │ - Variable Parse │ │  │ │ - Search Index   │ │  │ │ - Questions  │ │  │ │ - Designer   │ │ │
│  │ │ - Personalization│ │  │ │ - Categories     │ │  │ │ - Logic      │ │  │ │ - Placeholders│ │ │
│  │ └──────────────────┘ │  │ │ - Recommendations│ │  │ │ - Sections   │ │  │ │ - Rendering  │ │ │
│  │                      │  │ └──────────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │ │
│  │ ┌──────────────────┐ │  │                      │  │                  │  │                  │ │
│  │ │ Broadcast Engine │ │  │ ┌──────────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │ │
│  │ │ - Audience Filter│ │  │ │ Install Manager  │ │  │ │ Distribution │ │  │ │ Issuance     │ │ │
│  │ │ - Scheduling     │ │  │ │ - Conflict Check │ │  │ │ - Targeting  │ │  │ │ Engine       │ │ │
│  │ │ - Progress Track │ │  │ │ - Fork/Clone     │ │  │ │ - Scheduling │ │  │ │ - Rules      │ │ │
│  │ └──────────────────┘ │  │ │ - Version Control│ │  │ │ - Reminders  │ │  │ │ - Conditions │ │ │
│  │                      │  │ └──────────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │ │
│  │ ┌──────────────────┐ │  │                      │  │                  │  │                  │ │
│  │ │ Delivery Manager │ │  │ ┌──────────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │ │
│  │ │ - Multi-channel  │ │  │ │ Review System    │ │  │ │ Analysis     │ │  │ │ Verification │ │ │
│  │ │ - Status Track   │ │  │ │ - Ratings        │ │  │ │ - Sentiment  │ │  │ │ Service      │ │ │
│  │ │ - Retry Logic    │ │  │ │ - Comments       │ │  │ │ - Themes     │ │  │ │ - QR Code    │ │ │
│  │ │ - Bounce Handle  │ │  │ │ - Moderation     │ │  │ │ - Comparison │ │  │ │ - Audit Log  │ │ │
│  │ └──────────────────┘ │  │ └──────────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘  └──────────────────┘ │
│                │                        │                    │                    │              │
│                └────────────────────────┴────────────────────┴────────────────────┘              │
│                                                │                                                 │
│                                                ▼                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               SHARED SERVICES LAYER                                        │  │
│  │                                                                                            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ Queue Service   │  │ Storage Service │  │ PDF Generator   │  │ Analytics Engine│       │  │
│  │  │ (Bull/Redis)    │  │ (Azure Blob)    │  │ (@react-pdf)    │  │ (Aggregation)   │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                                            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ Event Bus (SSE) │  │ Webhook Manager │  │ NLP Service     │  │ Search Index    │       │  │
│  │  │                 │  │                 │  │ (Sentiment)     │  │ (Full-text)     │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                │                                                 │
│                                                ▼                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               EXTERNAL INTEGRATIONS                                        │  │
│  │                                                                                            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ Azure Comm Svc  │  │ Azure Blob      │  │ Workflow Engine │  │ Check-In System │       │  │
│  │  │ (Email/SMS)     │  │ Storage         │  │ (Module 04)     │  │ (Module 10)     │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                                            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ Push Service    │  │ Badge Designer  │  │ Registration    │  │ Analytics       │       │  │
│  │  │ (FCM/APNS)      │  │ (Module 08)     │  │ (Module 09)     │  │ (Module 15)     │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Message Delivery Pipeline

The Communication Hub uses a sophisticated pipeline for reliable multi-channel message delivery:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MESSAGE DELIVERY PIPELINE                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌─────────────────┐                                                                            │
│  │ Broadcast       │                                                                            │
│  │ Request         │                                                                            │
│  └────────┬────────┘                                                                            │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              AUDIENCE RESOLUTION                                        │     │
│  │                                                                                         │     │
│  │   Filter Criteria (JSON)              Resolved Recipients                              │     │
│  │   ┌─────────────────────┐            ┌─────────────────────────────────────┐           │     │
│  │   │ participantType:    │            │ Participant 1 → email, phone, push  │           │     │
│  │   │   ["DELEGATE"]      │ ────────▶  │ Participant 2 → email, phone        │           │     │
│  │   │ status: ["APPROVED"]│            │ Participant 3 → email               │           │     │
│  │   │ country: ["US","UK"]│            │ ... (N participants)                │           │     │
│  │   └─────────────────────┘            └─────────────────────────────────────┘           │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              MESSAGE PREPARATION                                        │     │
│  │                                                                                         │     │
│  │   Template                  Variables                    Rendered Message              │     │
│  │   ┌─────────────────┐      ┌─────────────────┐         ┌─────────────────────┐        │     │
│  │   │ Dear {{name}}, │      │ name: "John"    │         │ Dear John,          │        │     │
│  │   │ Your badge for │  +   │ event: "Summit" │  ────▶  │ Your badge for the  │        │     │
│  │   │ {{event}} is   │      │ date: "Mar 15"  │         │ Summit is ready...  │        │     │
│  │   │ ready...       │      │                 │         │                     │        │     │
│  │   └─────────────────┘      └─────────────────┘         └─────────────────────┘        │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              MESSAGE QUEUE (BULL/REDIS)                                 │     │
│  │                                                                                         │     │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                         │     │
│  │   │  Job 1  │ │  Job 2  │ │  Job 3  │ │  Job 4  │ │  Job N  │                         │     │
│  │   │ EMAIL   │ │ SMS     │ │ PUSH    │ │ EMAIL   │ │ IN_APP  │                         │     │
│  │   │ Prio: 5 │ │ Prio: 5 │ │ Prio: 5 │ │ Prio: 5 │ │ Prio: 5 │                         │     │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                         │     │
│  │                                                                                         │     │
│  │   Emergency Queue (Priority: 10)                                                        │     │
│  │   ┌─────────┐ ┌─────────┐                                                              │     │
│  │   │ URGENT  │ │ URGENT  │  ← Bypass normal scheduling                                  │     │
│  │   │ SMS     │ │ PUSH    │                                                              │     │
│  │   └─────────┘ └─────────┘                                                              │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              CHANNEL WORKERS                                            │     │
│  │                                                                                         │     │
│  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │     │
│  │   │ Email Worker   │  │ SMS Worker     │  │ Push Worker    │  │ In-App Worker  │       │     │
│  │   │                │  │                │  │                │  │                │       │     │
│  │   │ Azure Comm Svc │  │ Azure Comm Svc │  │ FCM / APNS     │  │ SSE Broadcast  │       │     │
│  │   │                │  │                │  │                │  │                │       │     │
│  │   │ Rate: 100/sec  │  │ Rate: 50/sec   │  │ Rate: 500/sec  │  │ Rate: 1000/sec │       │     │
│  │   │ Retry: 3       │  │ Retry: 3       │  │ Retry: 2       │  │ Retry: 1       │       │     │
│  │   └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘       │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              CALLBACK PROCESSING                                        │     │
│  │                                                                                         │     │
│  │   ┌─────────────────────────────────────────────────────────────────────────────┐      │     │
│  │   │  Webhook Receiver                                                           │      │     │
│  │   │  /api/v1/communications/webhooks/:channel                                   │      │     │
│  │   │                                                                             │      │     │
│  │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │      │     │
│  │   │  │  Delivered  │  │  Bounced    │  │  Failed     │  │  Opened     │        │      │     │
│  │   │  │  ────────▶  │  │  ────────▶  │  │  ────────▶  │  │  ────────▶  │        │      │     │
│  │   │  │  Update DB  │  │  Mark Bounce│  │  Retry/Fail │  │  Track Open │        │      │     │
│  │   │  │  + SSE      │  │  + Suppress │  │  + Alert    │  │  + Analytics│        │      │     │
│  │   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │      │     │
│  │   │                                                                             │      │     │
│  │   └─────────────────────────────────────────────────────────────────────────────┘      │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              DELIVERY TRACKING                                          │     │
│  │                                                                                         │     │
│  │   ┌─────────────────────────────────────────────────────────────────────────────┐      │     │
│  │   │                      MessageDelivery Records                                │      │     │
│  │   │                                                                             │      │     │
│  │   │  ID       Participant  Channel  Status      SentAt      DeliveredAt        │      │     │
│  │   │  ────────────────────────────────────────────────────────────────────────  │      │     │
│  │   │  del_001  part_123     EMAIL    DELIVERED   10:00:01    10:00:15           │      │     │
│  │   │  del_002  part_123     SMS      SENT        10:00:02    -                  │      │     │
│  │   │  del_003  part_124     EMAIL    BOUNCED     10:00:01    -                  │      │     │
│  │   │  del_004  part_125     PUSH     DELIVERED   10:00:03    10:00:04           │      │     │
│  │   │                                                                             │      │     │
│  │   └─────────────────────────────────────────────────────────────────────────────┘      │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Message Delivery State Machine

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          MESSAGE DELIVERY STATE MACHINE                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                                                                          │
│                              ┌──────────────────┐                                       │
│                              │                  │                                       │
│        ┌────────────────────▶│     QUEUED       │◀────────────┐                        │
│        │                     │                  │             │                        │
│        │                     └────────┬─────────┘             │                        │
│        │                              │                        │                        │
│        │                              │ Worker picks up        │                        │
│        │                              │                        │                        │
│        │                              ▼                        │                        │
│        │                     ┌──────────────────┐             │                        │
│        │                     │                  │             │                        │
│        │                     │    SENDING       │             │                        │
│        │                     │                  │             │                        │
│        │                     └────────┬─────────┘             │                        │
│        │                              │                        │                        │
│        │               ┌──────────────┼──────────────┐        │                        │
│        │               │              │              │        │                        │
│        │               ▼              ▼              ▼        │                        │
│        │      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│        │      │              │ │              │ │              │                       │
│        │      │    SENT      │ │   BOUNCED    │ │   FAILED     │                       │
│        │      │              │ │              │ │              │                       │
│        │      └──────┬───────┘ └──────────────┘ └──────┬───────┘                       │
│        │             │                                  │                               │
│        │             │                                  │ Retry limit                   │
│        │             │ Delivery confirmation            │ not reached                   │
│        │             │                                  │                               │
│        │             ▼                                  │                               │
│        │      ┌──────────────┐                         │                               │
│        │      │              │                         │                               │
│        │      │  DELIVERED   │                         │                               │
│        │      │              │                         │                               │
│        │      └──────────────┘                         │                               │
│        │                                               │                               │
│        │                                               │                               │
│        └───────────────────────────────────────────────┘                               │
│                      Retry (exponential backoff)                                        │
│                                                                                          │
│                                                                                          │
│  Transitions:                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │ QUEUED → SENDING      : Worker dequeues message                                   │   │
│  │ SENDING → SENT        : Provider accepts message                                  │   │
│  │ SENDING → FAILED      : Provider rejects (retryable)                             │   │
│  │ SENDING → BOUNCED     : Invalid recipient (permanent)                            │   │
│  │ SENT → DELIVERED      : Delivery confirmation webhook                            │   │
│  │ SENT → BOUNCED        : Delayed bounce notification                              │   │
│  │ FAILED → QUEUED       : Retry with backoff (max 3 attempts)                      │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Certificate Generation Pipeline

The certificate system uses a concurrent generation pipeline for efficient bulk processing:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CERTIFICATE GENERATION PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌─────────────────┐                                                                            │
│  │ Bulk Generation │                                                                            │
│  │ Request         │                                                                            │
│  │                 │                                                                            │
│  │ - Template ID   │                                                                            │
│  │ - Participant   │                                                                            │
│  │   Filter        │                                                                            │
│  └────────┬────────┘                                                                            │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              ELIGIBILITY CHECK                                          │     │
│  │                                                                                         │     │
│  │   Issuance Rule                Evaluation                      Result                  │     │
│  │   ┌─────────────────────┐     ┌─────────────────────┐         ┌─────────────────────┐ │     │
│  │   │ ALL_APPROVED        │     │ Check status        │         │ ✓ Eligible          │ │     │
│  │   │                     │ ──▶ │ == APPROVED         │ ──────▶ │ ✗ Not Eligible      │ │     │
│  │   └─────────────────────┘     └─────────────────────┘         └─────────────────────┘ │     │
│  │                                                                                         │     │
│  │   ┌─────────────────────┐     ┌─────────────────────┐         ┌─────────────────────┐ │     │
│  │   │ ATTENDANCE_THRESHOLD │     │ Calculate attendance│         │ ✓ 85% >= 80%       │ │     │
│  │   │ minAttendance: 80%  │ ──▶ │ from check-in data  │ ──────▶ │ ✗ 65% < 80%        │ │     │
│  │   └─────────────────────┘     └─────────────────────┘         └─────────────────────┘ │     │
│  │                                                                                         │     │
│  │   ┌─────────────────────┐     ┌─────────────────────┐         ┌─────────────────────┐ │     │
│  │   │ COMPLETED_SESSIONS  │     │ Check required      │         │ ✓ All 5 completed   │ │     │
│  │   │ sessions: [1,2,3,4,5]│ ──▶ │ session check-ins   │ ──────▶ │ ✗ Missing 2 sessions│ │     │
│  │   └─────────────────────┘     └─────────────────────┘         └─────────────────────┘ │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              CERTIFICATE BATCH                                          │     │
│  │                                                                                         │     │
│  │   ┌─────────────────────────────────────────────────────────────────────────────┐      │     │
│  │   │  CertificateBatch                                                           │      │     │
│  │   │                                                                             │      │     │
│  │   │  batchId: "batch_12345"                                                     │      │     │
│  │   │  templateId: "tmpl_cert_001"                                                │      │     │
│  │   │  totalCount: 500                                                            │      │     │
│  │   │  processedCount: 0                                                          │      │     │
│  │   │  successCount: 0                                                            │      │     │
│  │   │  failedCount: 0                                                             │      │     │
│  │   │  status: PROCESSING                                                         │      │     │
│  │   │                                                                             │      │     │
│  │   └─────────────────────────────────────────────────────────────────────────────┘      │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              CONCURRENT WORKERS (10 max)                                │     │
│  │                                                                                         │     │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │     │
│  │   │  Worker 1  │ │  Worker 2  │ │  Worker 3  │ │  Worker 4  │ │  Worker 5  │          │     │
│  │   │            │ │            │ │            │ │            │ │            │          │     │
│  │   │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │          │     │
│  │   │ │Generate│ │ │ │Generate│ │ │ │Generate│ │ │ │Generate│ │ │ │Generate│ │          │     │
│  │   │ │PDF     │ │ │ │PDF     │ │ │ │PDF     │ │ │ │PDF     │ │ │ │PDF     │ │          │     │
│  │   │ └───┬────┘ │ │ └───┬────┘ │ │ └───┬────┘ │ │ └───┬────┘ │ │ └───┬────┘ │          │     │
│  │   │     │      │ │     │      │ │     │      │ │     │      │ │     │      │          │     │
│  │   │ ┌───▼────┐ │ │ ┌───▼────┐ │ │ ┌───▼────┐ │ │ ┌───▼────┐ │ │ ┌───▼────┐ │          │     │
│  │   │ │Upload  │ │ │ │Upload  │ │ │ │Upload  │ │ │ │Upload  │ │ │ │Upload  │ │          │     │
│  │   │ │to Blob │ │ │ │to Blob │ │ │ │to Blob │ │ │ │to Blob │ │ │ │to Blob │ │          │     │
│  │   │ └───┬────┘ │ │ └───┬────┘ │ │ └───┬────┘ │ │ └───┬────┘ │ │ └───┬────┘ │          │     │
│  │   │     │      │ │     │      │ │     │      │ │     │      │ │     │      │          │     │
│  │   │ ┌───▼────┐ │ │ ┌───▼────┐ │ │ ┌───▼────┐ │ │ ┌───▼────┐ │ │ ┌───▼────┐ │          │     │
│  │   │ │Save DB │ │ │ │Save DB │ │ │ │Save DB │ │ │ │Save DB │ │ │ │Save DB │ │          │     │
│  │   │ │+ Update│ │ │ │+ Update│ │ │ │+ Update│ │ │ │+ Update│ │ │ │+ Update│ │          │     │
│  │   │ │Progress│ │ │ │Progress│ │ │ │Progress│ │ │ │Progress│ │ │ │Progress│ │          │     │
│  │   │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │          │     │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘          │     │
│  │                                                                                         │     │
│  │   + 5 more workers (Worker 6-10)                                                       │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              PDF GENERATION (@react-pdf/renderer)                       │     │
│  │                                                                                         │     │
│  │   Canvas Data (JSON)              Rendered PDF                   Output                 │     │
│  │   ┌─────────────────────┐        ┌─────────────────────┐        ┌──────────────────┐   │     │
│  │   │ {                   │        │ ┌─────────────────┐ │        │ certificates/    │   │     │
│  │   │   "elements": [     │        │ │   CERTIFICATE   │ │        │   batch_12345/   │   │     │
│  │   │     { "type":"text",│  ───▶  │ │                 │ │  ───▶  │   cert_001.pdf   │   │     │
│  │   │       "content":... │        │ │  John Smith     │ │        │   cert_002.pdf   │   │     │
│  │   │     },              │        │ │                 │ │        │   ...            │   │     │
│  │   │     { "type":"qr",  │        │ │  [QR CODE]      │ │        │                  │   │     │
│  │   │       "payload":... │        │ │                 │ │        │                  │   │     │
│  │   │     }               │        │ │  Verify: ABC123 │ │        │                  │   │     │
│  │   │   ]                 │        │ └─────────────────┘ │        │                  │   │     │
│  │   │ }                   │        │                     │        │                  │   │     │
│  │   └─────────────────────┘        └─────────────────────┘        └──────────────────┘   │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│           │                                                                                      │
│           ▼                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐     │
│  │                              COMPLETION & NOTIFICATION                                  │     │
│  │                                                                                         │     │
│  │   ┌──────────────────────────────────────────────────────────────────────────────┐     │     │
│  │   │                                                                              │     │     │
│  │   │   Batch Complete                                                             │     │     │
│  │   │   ├── Update batch status: COMPLETED                                        │     │     │
│  │   │   ├── Send SSE event: certificate.batch.completed                           │     │     │
│  │   │   ├── Trigger email notification to admin                                   │     │     │
│  │   │   └── Optional: Auto-send certificates to participants                      │     │     │
│  │   │                                                                              │     │     │
│  │   │   Progress Tracking (Real-time via SSE):                                    │     │     │
│  │   │   ├── certificate.generation.progress { batchId, processed, total }        │     │     │
│  │   │   ├── certificate.generation.success { batchId, certificateId }            │     │     │
│  │   │   └── certificate.generation.failed { batchId, participantId, error }      │     │     │
│  │   │                                                                              │     │     │
│  │   └──────────────────────────────────────────────────────────────────────────────┘     │     │
│  │                                                                                         │     │
│  └───────────────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Survey Distribution Pipeline

The survey system automates distribution based on event attendance and participant eligibility:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              SURVEY DISTRIBUTION PIPELINE                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              TRIGGER EVENTS                                              │    │
│  │                                                                                          │    │
│  │   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐     │    │
│  │   │ Event Ends     │   │ Session Ends   │   │ Scheduled Time │   │ Manual Trigger │     │    │
│  │   │ (Event Status) │   │ (Check-Out)    │   │ (Cron Job)     │   │ (Admin Action) │     │    │
│  │   └───────┬────────┘   └───────┬────────┘   └───────┬────────┘   └───────┬────────┘     │    │
│  │           │                    │                    │                    │              │    │
│  │           └────────────────────┴────────────────────┴────────────────────┘              │    │
│  │                                          │                                               │    │
│  └──────────────────────────────────────────┼───────────────────────────────────────────────┘    │
│                                             │                                                    │
│                                             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              ELIGIBILITY ENGINE                                          │    │
│  │                                                                                          │    │
│  │   Survey Configuration                  Participant Filter                              │    │
│  │   ┌───────────────────────────────┐    ┌───────────────────────────────┐               │    │
│  │   │ sendAfterHours: 24            │    │ targetFilter: {               │               │    │
│  │   │ reminderDays: [3, 7]          │    │   participantType: ["DELEGATE"],│              │    │
│  │   │ closesAfterDays: 14           │    │   status: ["APPROVED"],       │               │    │
│  │   │ targetFilter: {...}           │    │   checkedIn: true,            │               │    │
│  │   └───────────────────────────────┘    │   country: ["US", "UK"]       │               │    │
│  │                                        │ }                              │               │    │
│  │                                        └───────────────────────────────┘               │    │
│  │                                                                                          │    │
│  │   Eligibility Checks:                                                                   │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────────────┐  │    │
│  │   │ 1. Event has ended (for post-event surveys)                                     │  │    │
│  │   │ 2. Participant matches targetFilter criteria                                    │  │    │
│  │   │ 3. Participant has not already responded                                        │  │    │
│  │   │ 4. Survey is in ACTIVE status                                                   │  │    │
│  │   │ 5. Current time is within survey open window                                    │  │    │
│  │   │ 6. Participant has valid contact info (email/phone)                             │  │    │
│  │   └─────────────────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                             │                                                    │
│                                             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              RESPONSE TOKEN GENERATION                                   │    │
│  │                                                                                          │    │
│  │   ┌───────────────────────────────────────────────────────────────────────────────┐     │    │
│  │   │                                                                               │     │    │
│  │   │   For each eligible participant:                                              │     │    │
│  │   │                                                                               │     │    │
│  │   │   SurveyResponse {                                                            │     │    │
│  │   │     id: "resp_12345"                                                          │     │    │
│  │   │     surveyId: "survey_001"                                                    │     │    │
│  │   │     participantId: "part_789"                                                 │     │    │
│  │   │     accessToken: "tok_unique_secure_token"  ← Unique per participant         │     │    │
│  │   │     status: PENDING                                                           │     │    │
│  │   │     startedAt: null                                                           │     │    │
│  │   │     completedAt: null                                                         │     │    │
│  │   │     remindersSent: 0                                                          │     │    │
│  │   │   }                                                                           │     │    │
│  │   │                                                                               │     │    │
│  │   │   Survey URL: /surveys/respond?token={accessToken}                           │     │    │
│  │   │                                                                               │     │    │
│  │   └───────────────────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                             │                                                    │
│                                             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              DISTRIBUTION ENGINE                                         │    │
│  │                                                                                          │    │
│  │   Initial Send                          Reminder Cycle                                  │    │
│  │   ┌───────────────────────────────┐    ┌───────────────────────────────┐               │    │
│  │   │ Time: event_end + 24 hours    │    │ Reminder 1: Day 3             │               │    │
│  │   │ Channel: EMAIL                │    │ Reminder 2: Day 7             │               │    │
│  │   │ Template: survey_invitation   │    │                               │               │    │
│  │   │ Variables:                    │    │ Conditions:                   │               │    │
│  │   │   - participant.name          │    │   - response.status != COMPLETED│              │    │
│  │   │   - event.name                │    │   - survey.status == ACTIVE   │               │    │
│  │   │   - survey.url                │    │   - remindersSent < maxReminders│              │    │
│  │   │   - survey.deadline           │    │                               │               │    │
│  │   └───────────────────────────────┘    └───────────────────────────────┘               │    │
│  │                                                                                          │    │
│  │   ──▶ Communication Hub (Message Delivery Pipeline)                                     │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                             │                                                    │
│                                             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              RESPONSE COLLECTION                                         │    │
│  │                                                                                          │    │
│  │   ┌───────────────────────────────────────────────────────────────────────────────┐     │    │
│  │   │                                                                               │     │    │
│  │   │   Participant Flow:                                                           │     │    │
│  │   │                                                                               │     │    │
│  │   │   1. Click survey link with token                                             │     │    │
│  │   │      └── Validate token, load survey                                          │     │    │
│  │   │                                                                               │     │    │
│  │   │   2. Start survey                                                             │     │    │
│  │   │      └── Update: status = IN_PROGRESS, startedAt = now()                     │     │    │
│  │   │                                                                               │     │    │
│  │   │   3. Answer questions (auto-save)                                             │     │    │
│  │   │      └── Save SurveyAnswer for each question                                 │     │    │
│  │   │                                                                               │     │    │
│  │   │   4. Submit survey                                                            │     │    │
│  │   │      └── Update: status = COMPLETED, completedAt = now()                     │     │    │
│  │   │      └── Show thankYouMessage                                                 │     │    │
│  │   │                                                                               │     │    │
│  │   └───────────────────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                             │                                                    │
│                                             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              ANALYSIS PIPELINE                                           │    │
│  │                                                                                          │    │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐ │    │
│  │   │ Real-time       │   │ Sentiment       │   │ Theme           │   │ Year-over-Year  │ │    │
│  │   │ Aggregation     │   │ Analysis        │   │ Extraction      │   │ Comparison      │ │    │
│  │   │                 │   │                 │   │                 │   │                 │ │    │
│  │   │ - Response rate │   │ - NLP processing│   │ - Keyword freq  │   │ - Question match│ │    │
│  │   │ - NPS score     │   │ - Sentiment tag │   │ - Topic cluster │   │ - Trend analysis│ │    │
│  │   │ - Avg ratings   │   │ - Emotion detect│   │ - Word cloud    │   │ - Delta report  │ │    │
│  │   │ - Distribution  │   │                 │   │                 │   │                 │ │    │
│  │   └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘ │    │
│  │                                                                                          │    │
│  │   ──▶ Dashboard & Command Center                                                        │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Survey Response State Machine

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SURVEY RESPONSE STATE MACHINE                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                                                                          │
│                              ┌──────────────────┐                                       │
│                              │                  │                                       │
│           ┌─────────────────▶│    PENDING       │◀─────────────────┐                   │
│           │                  │                  │                  │                   │
│           │                  └────────┬─────────┘                  │                   │
│           │                           │                             │                   │
│           │                           │ Participant opens           │                   │
│           │                           │ survey link                 │                   │
│           │                           │                             │                   │
│           │                           ▼                             │                   │
│           │                  ┌──────────────────┐                  │                   │
│           │                  │                  │                  │                   │
│           │                  │  IN_PROGRESS     │──────────────────┘                   │
│           │                  │                  │   Save & Exit (can resume)           │
│           │                  └────────┬─────────┘                                       │
│           │                           │                                                 │
│           │                           │ Submit all answers                              │
│           │                           │                                                 │
│           │                           ▼                                                 │
│           │                  ┌──────────────────┐                                       │
│           │                  │                  │                                       │
│           │                  │   COMPLETED      │                                       │
│           │                  │                  │                                       │
│           │                  └──────────────────┘                                       │
│           │                                                                              │
│           │                                                                              │
│           │                  ┌──────────────────┐                                       │
│           │                  │                  │                                       │
│           └──────────────────│    EXPIRED       │                                       │
│              Survey closes   │                  │                                       │
│              (closesAfterDays)│                  │                                       │
│                              └──────────────────┘                                       │
│                                                                                          │
│                                                                                          │
│  Transitions:                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │ PENDING → IN_PROGRESS    : Participant accesses survey via token                 │   │
│  │ IN_PROGRESS → PENDING    : Participant saves and exits (resume later)            │   │
│  │ IN_PROGRESS → COMPLETED  : Participant submits all required answers              │   │
│  │ PENDING → EXPIRED        : Survey closes before participant responds             │   │
│  │ IN_PROGRESS → EXPIRED    : Survey closes while participant in progress           │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Template Marketplace Architecture

The Template Marketplace enables cross-tenant sharing with version control and quality assurance:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              TEMPLATE MARKETPLACE ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              PUBLISHING FLOW                                             │    │
│  │                                                                                          │    │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │    │
│  │   │  DRAFT   │───▶│IN_REVIEW │───▶│PUBLISHED │───▶│NEW VERSION│───▶│DEPRECATED│         │    │
│  │   │          │    │          │    │          │    │          │    │          │         │    │
│  │   │ Author   │    │ Platform │    │ Available│    │ Update   │    │ Sunset   │         │    │
│  │   │ prepares │    │ reviews  │    │ to all   │    │ released │    │ old ver  │         │    │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘         │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              DISCOVERY ENGINE                                            │    │
│  │                                                                                          │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────────────┐   │    │
│  │   │                         SEARCH & FILTER                                          │   │    │
│  │   │                                                                                  │   │    │
│  │   │   Categories         Tags              Sort Options      Search                 │   │    │
│  │   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐ │   │    │
│  │   │   │☐ Badge      │   │ conference  │   │◉ Popular    │   │ 🔍 Search templates │ │   │    │
│  │   │   │☐ Workflow   │   │ corporate   │   │○ Newest     │   │                     │ │   │    │
│  │   │   │☐ Form       │   │ government  │   │○ Highest    │   │                     │ │   │    │
│  │   │   │☐ Report     │   │ academic    │   │  Rated      │   │                     │ │   │    │
│  │   │   │☐ Certificate│   │ sports      │   │○ Most       │   │                     │ │   │    │
│  │   │   │☐ Seating    │   │ healthcare  │   │  Installed  │   │                     │ │   │    │
│  │   │   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────────────┘ │   │    │
│  │   │                                                                                  │   │    │
│  │   └─────────────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                          │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────────────┐   │    │
│  │   │                         FULL-TEXT SEARCH INDEX                                   │   │    │
│  │   │                                                                                  │   │    │
│  │   │   PostgreSQL GIN Index:                                                          │   │    │
│  │   │   - name (weight A)                                                              │   │    │
│  │   │   - description (weight B)                                                       │   │    │
│  │   │   - longDescription (weight C)                                                   │   │    │
│  │   │   - tags (weight A)                                                              │   │    │
│  │   │   - authorName (weight B)                                                        │   │    │
│  │   │                                                                                  │   │    │
│  │   └─────────────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              INSTALLATION FLOW                                           │    │
│  │                                                                                          │    │
│  │   1. PREVIEW                     2. CONFLICT CHECK                3. INSTALL/FORK       │    │
│  │   ┌───────────────────────┐     ┌───────────────────────┐        ┌───────────────────┐  │    │
│  │   │                       │     │                       │        │                   │  │    │
│  │   │  Template Preview     │     │  Checking for         │        │  ◉ Install as-is  │  │    │
│  │   │  ┌─────────────────┐  │     │  conflicts...         │        │                   │  │    │
│  │   │  │                 │  │     │                       │        │  ○ Fork & customize│  │    │
│  │   │  │  [Preview       │  │     │  ✓ No naming conflicts│        │                   │  │    │
│  │   │  │   Rendering]    │  │ ──▶ │  ✓ Compatible version │  ──▶   │  Target Event:    │  │    │
│  │   │  │                 │  │     │  ⚠ Custom fields      │        │  [Event Dropdown] │  │    │
│  │   │  └─────────────────┘  │     │    may need mapping   │        │                   │  │    │
│  │   │                       │     │                       │        │  [Install Button] │  │    │
│  │   │  Author: Acme Corp    │     │                       │        │                   │  │    │
│  │   │  Rating: ★★★★☆ (4.2)  │     │                       │        │                   │  │    │
│  │   │  Installs: 1,234      │     │                       │        │                   │  │    │
│  │   │                       │     │                       │        │                   │  │    │
│  │   └───────────────────────┘     └───────────────────────┘        └───────────────────┘  │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              VERSION CONTROL                                             │    │
│  │                                                                                          │    │
│  │   Template Versions                          Installation Tracking                       │    │
│  │   ┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐     │    │
│  │   │                                     │   │                                     │     │    │
│  │   │  v1.0.0 (Published)                 │   │  Tenant A                           │     │    │
│  │   │  └── templateData: {...}            │   │  ├── Event 1: v1.0.0 (as-is)       │     │    │
│  │   │  └── changelog: "Initial release"   │   │  └── Event 2: v1.1.0 (upgraded)    │     │    │
│  │   │                                     │   │                                     │     │    │
│  │   │  v1.1.0 (Published)                 │   │  Tenant B                           │     │    │
│  │   │  └── templateData: {...}            │   │  └── Event 1: v1.0.0 (forked)      │     │    │
│  │   │  └── changelog: "Added dark mode"   │   │      └── customizations: {...}     │     │    │
│  │   │                                     │   │                                     │     │    │
│  │   │  v2.0.0 (Published)                 │   │  Tenant C                           │     │    │
│  │   │  └── templateData: {...}            │   │  └── Event 1: v2.0.0 (latest)      │     │    │
│  │   │  └── changelog: "Major redesign"    │   │                                     │     │    │
│  │   │                                     │   │                                     │     │    │
│  │   └─────────────────────────────────────┘   └─────────────────────────────────────┘     │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              REVIEW & RATING SYSTEM                                      │    │
│  │                                                                                          │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────────────┐   │    │
│  │   │                                                                                  │   │    │
│  │   │   Template: "Professional Conference Badge"                                      │   │    │
│  │   │                                                                                  │   │    │
│  │   │   Overall Rating: ★★★★☆ (4.3)  |  156 Reviews  |  1,234 Installs               │   │    │
│  │   │                                                                                  │   │    │
│  │   │   ┌─────────────────────────────────────────────────────────────────────────┐   │   │    │
│  │   │   │ ★★★★★  ████████████████████████████████████████  78%  (122)              │   │   │    │
│  │   │   │ ★★★★☆  ████████████  12%  (19)                                          │   │   │    │
│  │   │   │ ★★★☆☆  █████  5%  (8)                                                   │   │   │    │
│  │   │   │ ★★☆☆☆  ██  2%  (3)                                                      │   │   │    │
│  │   │   │ ★☆☆☆☆  ██  3%  (4)                                                      │   │   │    │
│  │   │   └─────────────────────────────────────────────────────────────────────────┘   │   │    │
│  │   │                                                                                  │   │    │
│  │   │   Recent Reviews:                                                                │   │    │
│  │   │   ┌────────────────────────────────────────────────────────────────────────┐    │   │    │
│  │   │   │ ★★★★★  "Excellent quality, easy to customize"                          │    │   │    │
│  │   │   │        - TechConf Inc, 2 days ago                                      │    │   │    │
│  │   │   ├────────────────────────────────────────────────────────────────────────┤    │   │    │
│  │   │   │ ★★★★☆  "Great template, would love more color options"                 │    │   │    │
│  │   │   │        - Summit Organizers, 1 week ago                                 │    │   │    │
│  │   │   └────────────────────────────────────────────────────────────────────────┘    │   │    │
│  │   │                                                                                  │   │    │
│  │   └─────────────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Template Publish State Machine

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          TEMPLATE PUBLISH STATE MACHINE                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                                                                          │
│                              ┌──────────────────┐                                       │
│                              │                  │                                       │
│        ┌────────────────────▶│     DRAFT        │◀────────────┐                        │
│        │                     │                  │             │                        │
│        │                     └────────┬─────────┘             │                        │
│        │                              │                        │                        │
│        │                              │ Submit for review      │ Rejected              │
│        │                              │                        │                        │
│        │                              ▼                        │                        │
│        │                     ┌──────────────────┐             │                        │
│        │                     │                  │             │                        │
│        │                     │   IN_REVIEW      │─────────────┘                        │
│        │                     │                  │                                       │
│        │                     └────────┬─────────┘                                       │
│        │                              │                                                 │
│        │                              │ Approved                                        │
│        │                              │                                                 │
│        │                              ▼                                                 │
│        │                     ┌──────────────────┐                                       │
│        │                     │                  │                                       │
│        │ Edit (new version)  │   PUBLISHED      │                                       │
│        │                     │                  │                                       │
│        └─────────────────────┴────────┬─────────┘                                       │
│                                       │                                                 │
│                                       │ Deprecate                                       │
│                                       │                                                 │
│                                       ▼                                                 │
│                              ┌──────────────────┐                                       │
│                              │                  │                                       │
│                              │   DEPRECATED     │                                       │
│                              │                  │                                       │
│                              └──────────────────┘                                       │
│                                                                                          │
│                                                                                          │
│  Transitions:                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │ DRAFT → IN_REVIEW        : Author submits template for platform review           │   │
│  │ IN_REVIEW → DRAFT        : Reviewer rejects with feedback                        │   │
│  │ IN_REVIEW → PUBLISHED    : Reviewer approves template                            │   │
│  │ PUBLISHED → DRAFT        : Author creates new version (original stays published)│   │
│  │ PUBLISHED → DEPRECATED   : Author or admin deprecates template                   │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Bounded Context Map

The Content and Documents module integrates with multiple other modules in the platform:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BOUNDED CONTEXT MAP                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              UPSTREAM CONTEXTS                                            │   │
│  │                                                                                           │   │
│  │   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐            │   │
│  │   │    Module 09:       │   │    Module 10:       │   │    Module 13:       │            │   │
│  │   │   Registration      │   │  Event Operations   │   │      People         │            │   │
│  │   │                     │   │                     │   │                     │            │   │
│  │   │ Provides:           │   │ Provides:           │   │ Provides:           │            │   │
│  │   │ - Participant data  │   │ - Check-in events   │   │ - Staff assignments │            │   │
│  │   │ - Status changes    │   │ - Session attendance│   │ - Volunteer contacts│            │   │
│  │   │ - Contact info      │   │ - Room bookings     │   │ - Team rosters      │            │   │
│  │   │                     │   │ - Event lifecycle   │   │                     │            │   │
│  │   └──────────┬──────────┘   └──────────┬──────────┘   └──────────┬──────────┘            │   │
│  │              │                         │                         │                        │   │
│  │              │ participant.*           │ checkin.*               │ staff.*                │   │
│  │              │ registration.*          │ session.*               │ volunteer.*            │   │
│  │              │                         │ event.*                 │                        │   │
│  │              └─────────────────────────┼─────────────────────────┘                        │   │
│  │                                        │                                                  │   │
│  └────────────────────────────────────────┼──────────────────────────────────────────────────┘   │
│                                           │                                                      │
│                                           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         MODULE 14: CONTENT AND DOCUMENTS                                  │   │
│  │                                                                                           │   │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │   │ Communication   │  │    Template     │  │     Survey      │  │   Certificate   │     │   │
│  │   │      Hub        │  │   Marketplace   │  │     System      │  │   Generation    │     │   │
│  │   │                 │  │                 │  │                 │  │                 │     │   │
│  │   │ - Templates     │  │ - Publishing    │  │ - Questions     │  │ - Design        │     │   │
│  │   │ - Broadcasts    │  │ - Discovery     │  │ - Distribution  │  │ - Issuance      │     │   │
│  │   │ - Deliveries    │  │ - Installation  │  │ - Responses     │  │ - Verification  │     │   │
│  │   │ - Tracking      │  │ - Reviews       │  │ - Analysis      │  │ - Revocation    │     │   │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  │           │                    │                    │                    │                │   │
│  │           │ message.*          │ template.*         │ survey.*           │ certificate.*  │   │
│  │           │ broadcast.*        │ installation.*     │ response.*         │ verification.* │   │
│  │           │ delivery.*         │ review.*           │ analysis.*         │ batch.*        │   │
│  │           │                    │                    │                    │                │   │
│  └───────────┴────────────────────┴────────────────────┴────────────────────┴────────────────┘   │
│                                           │                                                      │
│                                           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              DOWNSTREAM CONTEXTS                                          │   │
│  │                                                                                           │   │
│  │   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐            │   │
│  │   │    Module 04:       │   │    Module 08:       │   │    Module 15:       │            │   │
│  │   │     Workflow        │   │      UI/UX          │   │     Analytics       │            │   │
│  │   │                     │   │                     │   │                     │            │   │
│  │   │ Consumes:           │   │ Consumes:           │   │ Consumes:           │            │   │
│  │   │ - Trigger actions   │   │ - Badge Designer    │   │ - Delivery metrics  │            │   │
│  │   │ - Send messages     │   │ - Canvas components │   │ - Survey results    │            │   │
│  │   │ - Auto-certificates │   │ - Form builder      │   │ - Certificate stats │            │   │
│  │   │                     │   │                     │   │ - Template usage    │            │   │
│  │   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘            │   │
│  │                                                                                           │   │
│  │   ┌─────────────────────┐   ┌─────────────────────┐                                      │   │
│  │   │    Module 16:       │   │    Module 07:       │                                      │   │
│  │   │   Participant       │   │        API          │                                      │   │
│  │   │    Experience       │   │                     │                                      │   │
│  │   │                     │   │ Consumes:           │                                      │   │
│  │   │ Consumes:           │   │ - External webhooks │                                      │   │
│  │   │ - In-app messages   │   │ - SSE streams       │                                      │   │
│  │   │ - Survey links      │   │ - API endpoints     │                                      │   │
│  │   │ - Certificate DL    │   │                     │                                      │   │
│  │   └─────────────────────┘   └─────────────────────┘                                      │   │
│  │                                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              EXTERNAL INTEGRATIONS                                        │   │
│  │                                                                                           │   │
│  │   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐            │   │
│  │   │ Azure Communication │   │    Azure Blob       │   │    Push Services    │            │   │
│  │   │     Services        │   │     Storage         │   │    (FCM/APNS)       │            │   │
│  │   │                     │   │                     │   │                     │            │   │
│  │   │ - Email delivery    │   │ - PDF storage       │   │ - Mobile push       │            │   │
│  │   │ - SMS delivery      │   │ - Template assets   │   │ - Web push          │            │   │
│  │   │ - Delivery webhooks │   │ - Preview images    │   │                     │            │   │
│  │   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘            │   │
│  │                                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                  │
│  Relationship Types:                                                                             │
│  ═══════════════════                                                                             │
│  ──────────▶  Events (SSE/Webhooks)                                                             │
│  ─ ─ ─ ─ ─▶  API Calls                                                                          │
│  ══════════▶  Shared Kernel (common models)                                                     │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Integration Events Matrix

| Source Context       | Event                               | Target Context     | Purpose                                       |
| -------------------- | ----------------------------------- | ------------------ | --------------------------------------------- |
| Registration         | `participant.approved`              | Communication Hub  | Send welcome message                          |
| Registration         | `participant.status_changed`        | Survey System      | Update eligibility                            |
| Event Operations     | `checkin.completed`                 | Survey System      | Mark attendance for survey eligibility        |
| Event Operations     | `event.ended`                       | Survey System      | Trigger post-event survey distribution        |
| Event Operations     | `session.attended`                  | Certificate System | Calculate attendance for conditional issuance |
| Workflow Engine      | `workflow.action.send_message`      | Communication Hub  | Execute automated message                     |
| Workflow Engine      | `workflow.action.issue_certificate` | Certificate System | Trigger automatic certificate generation      |
| Communication Hub    | `broadcast.sent`                    | Analytics          | Track delivery metrics                        |
| Survey System        | `survey.response.completed`         | Analytics          | Aggregate feedback data                       |
| Certificate System   | `certificate.generated`             | Communication Hub  | Send certificate notification                 |
| Template Marketplace | `template.installed`                | Analytics          | Track template adoption                       |
| Certificate System   | `certificate.verified`              | Analytics          | Track verification activity                   |

---

## 3. Data Model

This section defines the complete data model for the Content and Documents module, including all Prisma schema definitions from the source specifications and enhanced models for additional functionality.

### 3.1 Communication Hub Models

The Communication Hub manages multi-channel messaging with templates, broadcasts, and delivery tracking.

```prisma
// ============================================================================
// COMMUNICATION HUB ENUMS
// ============================================================================

/// Supported communication channels for message delivery
enum MessageChannel {
  EMAIL     // Email via Azure Communication Services
  SMS       // SMS via Azure Communication Services
  PUSH      // Push notifications via FCM/APNS
  IN_APP    // In-application notifications via SSE
}

/// Status tracking for individual message deliveries
enum MessageStatus {
  QUEUED      // Message is queued for delivery
  SENDING     // Message is being sent to provider
  SENT        // Provider accepted the message
  DELIVERED   // Delivery confirmed by provider
  BOUNCED     // Message bounced (permanent failure)
  FAILED      // Delivery failed (retryable)
}

/// Status tracking for broadcast messages
enum BroadcastStatus {
  DRAFT       // Broadcast is being composed
  SCHEDULED   // Broadcast is scheduled for future delivery
  SENDING     // Broadcast is currently being sent
  SENT        // Broadcast has completed sending
  CANCELLED   // Broadcast was cancelled before completion
}

// ============================================================================
// COMMUNICATION HUB MODELS
// ============================================================================

/// Reusable message templates with variable substitution support
model MessageTemplate {
  id          String         @id @default(cuid())
  tenantId    String
  name        String         // Template name for identification
  subject     String?        // Email subject (null for SMS/Push)
  body        String         // Template body with {{variable}} placeholders
  channel     MessageChannel // Target delivery channel
  isSystem    Boolean        @default(false) // System templates cannot be deleted
  variables   String[]       // List of available variable names

  // Metadata
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  createdBy   String?
  updatedBy   String?

  // Relations
  tenant      Tenant         @relation(fields: [tenantId], references: [id])
  broadcasts  BroadcastMessage[]

  @@unique([tenantId, name, channel])
  @@index([tenantId])
  @@index([channel])
  @@index([isSystem])
}

/// Broadcast message sent to multiple recipients
model BroadcastMessage {
  id              String          @id @default(cuid())
  tenantId        String
  eventId         String?         // Optional event scope
  templateId      String?         // Optional template reference
  subject         String?         // Resolved subject
  body            String          // Resolved body content
  channel         MessageChannel
  status          BroadcastStatus @default(DRAFT)

  // Audience targeting
  filters         Json            // Audience filter criteria

  // Delivery metrics
  recipientCount  Int             @default(0)
  sentCount       Int             @default(0)
  failedCount     Int             @default(0)
  deliveredCount  Int             @default(0)
  bouncedCount    Int             @default(0)
  openedCount     Int             @default(0)

  // Scheduling
  scheduledAt     DateTime?       // When to send (null = immediate)
  sentAt          DateTime?       // When sending started
  completedAt     DateTime?       // When sending completed

  // Emergency broadcast flag
  isEmergency     Boolean         @default(false)
  priority        Int             @default(5) // 1-10, 10 = highest

  // Metadata
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  createdBy       String?
  cancelledBy     String?
  cancelledAt     DateTime?
  cancelReason    String?

  // Relations
  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  event           Event?          @relation(fields: [eventId], references: [id])
  template        MessageTemplate? @relation(fields: [templateId], references: [id])
  deliveries      MessageDelivery[]

  @@index([tenantId])
  @@index([eventId])
  @@index([status])
  @@index([scheduledAt])
  @@index([channel])
  @@index([isEmergency])
}

/// Individual delivery record for each recipient
model MessageDelivery {
  id              String          @id @default(cuid())
  broadcastId     String
  participantId   String
  channel         MessageChannel
  recipient       String          // Email address, phone number, or device token
  status          MessageStatus   @default(QUEUED)

  // External tracking
  externalId      String?         // Provider's message ID

  // Timing
  sentAt          DateTime?
  deliveredAt     DateTime?
  bouncedAt       DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?

  // Error tracking
  errorMessage    String?
  errorCode       String?
  retryCount      Int             @default(0)
  nextRetryAt     DateTime?

  // Metadata
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  broadcast       BroadcastMessage @relation(fields: [broadcastId], references: [id], onDelete: Cascade)
  participant     Participant      @relation(fields: [participantId], references: [id])

  @@unique([broadcastId, participantId, channel])
  @@index([broadcastId])
  @@index([participantId])
  @@index([status])
  @@index([channel])
  @@index([externalId])
}
```

### 3.2 Template Marketplace Models

The Template Marketplace enables cross-tenant sharing of reusable assets with version control and reviews.

```prisma
// ============================================================================
// TEMPLATE MARKETPLACE ENUMS
// ============================================================================

/// Categories of templates available in the marketplace
enum TemplateCategory {
  BADGE           // Badge design templates
  WORKFLOW        // Workflow configuration templates
  FORM            // Registration/data collection forms
  REPORT          // Report layout templates
  CERTIFICATE     // Certificate design templates
  SEATING_LAYOUT  // Seating arrangement templates
}

/// Publishing status for marketplace templates
enum PublishStatus {
  DRAFT       // Template is being prepared
  IN_REVIEW   // Template submitted for review
  PUBLISHED   // Template is publicly available
  DEPRECATED  // Template is no longer recommended
}

// ============================================================================
// TEMPLATE MARKETPLACE MODELS
// ============================================================================

/// Marketplace template available for cross-tenant installation
model MarketplaceTemplate {
  id               String           @id @default(cuid())
  category         TemplateCategory
  name             String
  description      String           // Short description (max 200 chars)
  longDescription  String?          // Detailed description with markdown

  // Author information
  authorTenantId   String
  authorName       String           // Display name of author/organization

  // Publishing status
  status           PublishStatus    @default(DRAFT)

  // Visual assets
  previewImageUrl  String?          // Preview image in blob storage
  thumbnailUrl     String?          // Thumbnail for grid display

  // Template content
  templateData     Json             // Category-specific template data

  // Discovery
  tags             String[]         // Searchable tags

  // Metrics
  usageCount       Int              @default(0)  // Total installations
  avgRating        Float            @default(0)  // Average rating (0-5)
  ratingCount      Int              @default(0)  // Number of ratings

  // Version tracking
  currentVersion   String           @default("1.0.0")

  // Metadata
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  publishedAt      DateTime?
  deprecatedAt     DateTime?

  // Review tracking
  reviewedBy       String?
  reviewedAt       DateTime?
  reviewNotes      String?

  // Relations
  authorTenant     Tenant           @relation(fields: [authorTenantId], references: [id])
  versions         TemplateVersion[]
  reviews          TemplateReview[]
  installations    TemplateInstallation[]

  @@index([category])
  @@index([status])
  @@index([authorTenantId])
  @@index([tags])
  @@index([avgRating])
  @@index([usageCount])
}

/// Version history for marketplace templates
model TemplateVersion {
  id           String              @id @default(cuid())
  templateId   String
  version      String              // Semantic version (e.g., "1.0.0")
  changelog    String              // Description of changes
  templateData Json                // Snapshot of template data

  // Metadata
  createdAt    DateTime            @default(now())
  createdBy    String?

  // Relations
  template     MarketplaceTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@unique([templateId, version])
  @@index([templateId])
}

/// Reviews and ratings from installing tenants
model TemplateReview {
  id               String              @id @default(cuid())
  templateId       String
  reviewerTenantId String
  rating           Int                 // 1-5 stars
  comment          String?             // Optional review text

  // Response from author
  authorResponse   String?
  respondedAt      DateTime?

  // Moderation
  isHidden         Boolean             @default(false)
  hiddenReason     String?

  // Metadata
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  // Relations
  template         MarketplaceTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  reviewerTenant   Tenant              @relation(fields: [reviewerTenantId], references: [id])

  @@unique([templateId, reviewerTenantId])
  @@index([templateId])
  @@index([rating])
}

/// Record of template installation by tenant
model TemplateInstallation {
  id           String              @id @default(cuid())
  templateId   String
  tenantId     String
  eventId      String?             // Optional event-specific installation
  version      String              // Installed version
  installedBy  String              // User who installed

  // Customization tracking
  isForked     Boolean             @default(false) // True if customized
  customData   Json?               // Local customizations

  // Upgrade tracking
  hasUpdate    Boolean             @default(false) // True if newer version available

  // Metadata
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  // Relations
  template     MarketplaceTemplate @relation(fields: [templateId], references: [id])
  tenant       Tenant              @relation(fields: [tenantId], references: [id])
  event        Event?              @relation(fields: [eventId], references: [id])

  @@unique([templateId, tenantId, eventId])
  @@index([tenantId])
  @@index([eventId])
  @@index([templateId])
}
```

### 3.3 Survey and Feedback Models

The Survey system manages post-event feedback collection with automatic distribution and analysis.

```prisma
// ============================================================================
// SURVEY ENUMS
// ============================================================================

/// Types of survey questions
enum QuestionType {
  RATING           // Star rating (1-5)
  TEXT             // Free-form text input
  MULTIPLE_CHOICE  // Single selection from options
  MULTI_SELECT     // Multiple selections allowed
  SCALE            // Numeric scale (min-max)
  NET_PROMOTER     // NPS question (0-10)
  YES_NO           // Binary choice
}

/// Survey lifecycle status
enum SurveyStatus {
  DRAFT     // Survey is being designed
  ACTIVE    // Survey is accepting responses
  CLOSED    // Survey is closed for responses
  ARCHIVED  // Survey is archived
}

// ============================================================================
// SURVEY MODELS
// ============================================================================

/// Survey definition with questions and distribution rules
model Survey {
  id              String        @id @default(cuid())
  tenantId        String
  eventId         String
  title           String
  description     String?
  status          SurveyStatus  @default(DRAFT)

  // Distribution settings
  sendAfterHours  Int           @default(24)  // Hours after event end
  reminderDays    Int[]         @default([3, 7]) // Days to send reminders
  closesAfterDays Int           @default(14)  // Days until auto-close

  // Targeting
  targetFilter    Json?         // Participant filter criteria

  // Completion
  thankYouMessage String?       // Message shown after completion
  redirectUrl     String?       // Optional redirect after completion

  // Settings
  allowAnonymous  Boolean       @default(false)
  showProgress    Boolean       @default(true)
  randomizeOrder  Boolean       @default(false)

  // Metadata
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
  closedAt        DateTime?
  createdBy       String?

  // Relations
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  event           Event         @relation(fields: [eventId], references: [id])
  questions       SurveyQuestion[]
  responses       SurveyResponse[]

  @@index([tenantId])
  @@index([eventId])
  @@index([status])
}

/// Individual question within a survey
model SurveyQuestion {
  id           String       @id @default(cuid())
  surveyId     String
  questionType QuestionType
  text         String       // Question text
  description  String?      // Additional context/help text

  // Question configuration
  options      Json?        // For MULTIPLE_CHOICE, MULTI_SELECT
  scaleMin     Int?         // For SCALE type
  scaleMax     Int?         // For SCALE type
  scaleLabels  Json?        // Labels for scale points

  // Validation
  isRequired   Boolean      @default(false)
  minLength    Int?         // For TEXT type
  maxLength    Int?         // For TEXT type

  // Organization
  sortOrder    Int          @default(0)
  section      String?      // Optional section grouping

  // Conditional logic
  showIf       Json?        // Conditions for showing question

  // Metadata
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // Relations
  survey       Survey       @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  answers      SurveyAnswer[]

  @@index([surveyId])
  @@index([sortOrder])
}

/// Response record for a participant
model SurveyResponse {
  id            String      @id @default(cuid())
  surveyId      String
  participantId String?     // Null for anonymous responses
  accessToken   String      @unique // Unique token for response access
  status        ResponseStatus @default(PENDING)

  // Progress
  startedAt     DateTime?
  completedAt   DateTime?
  lastSavedAt   DateTime?

  // Reminder tracking
  remindersSent Int         @default(0)
  lastReminderAt DateTime?

  // Device info (for analytics)
  userAgent     String?
  ipAddress     String?

  // Metadata
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  survey        Survey      @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  participant   Participant? @relation(fields: [participantId], references: [id])
  answers       SurveyAnswer[]

  @@index([surveyId])
  @@index([participantId])
  @@index([status])
  @@index([accessToken])
}

/// Individual answer to a survey question
model SurveyAnswer {
  id            String          @id @default(cuid())
  responseId    String
  questionId    String

  // Answer values (only one populated based on question type)
  numericValue  Float?          // For RATING, SCALE, NET_PROMOTER
  textValue     String?         // For TEXT, YES_NO
  arrayValue    Json?           // For MULTIPLE_CHOICE, MULTI_SELECT

  // Metadata
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  // Relations
  response      SurveyResponse  @relation(fields: [responseId], references: [id], onDelete: Cascade)
  question      SurveyQuestion  @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([responseId, questionId])
  @@index([responseId])
  @@index([questionId])
}

/// Additional enum for response status
enum ResponseStatus {
  PENDING      // Invitation sent, not started
  IN_PROGRESS  // Started but not completed
  COMPLETED    // Fully completed
  EXPIRED      // Survey closed before completion
}
```

### 3.4 Certificate and Document Models

The Certificate system manages document generation, issuance rules, and verification.

```prisma
// ============================================================================
// CERTIFICATE ENUMS
// ============================================================================

/// Certificate lifecycle status
enum CertificateStatus {
  PENDING     // Eligibility being evaluated
  GENERATED   // PDF generated
  SENT        // Notification sent to participant
  DOWNLOADED  // Participant has downloaded
  REVOKED     // Certificate has been revoked
}

/// Rules for automatic certificate issuance
enum IssuanceRule {
  ALL_APPROVED         // Issue to all approved participants
  ATTENDANCE_THRESHOLD // Issue based on attendance percentage
  COMPLETED_SESSIONS   // Issue based on specific session completion
  MANUAL               // Manual issuance only
}

// ============================================================================
// CERTIFICATE MODELS
// ============================================================================

/// Certificate template with canvas-based design
model CertificateTemplate {
  id                  String        @id @default(cuid())
  tenantId            String
  eventId             String
  name                String

  // Target audience
  participantType     String?       // Optional filter by participant type

  // Document settings
  pageSize            String        @default("A4") // A4, Letter, etc.
  orientation         String        @default("LANDSCAPE") // LANDSCAPE, PORTRAIT

  // Canvas design
  canvasData          Json          // Full canvas design data

  // Issuance rules
  issuanceRule        IssuanceRule  @default(ALL_APPROVED)
  attendanceThreshold Float?        // For ATTENDANCE_THRESHOLD (0-100)
  requiredMeetings    Json?         // For COMPLETED_SESSIONS

  // Signatory information
  signatoryName       String?
  signatoryTitle      String?
  signatureImage      String?       // URL to signature image

  // Settings
  includeQrCode       Boolean       @default(true)
  qrCodePosition      Json?         // {x, y, width, height}

  // Metadata
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  createdBy           String?

  // Relations
  tenant              Tenant        @relation(fields: [tenantId], references: [id])
  event               Event         @relation(fields: [eventId], references: [id])
  certificates        Certificate[]

  @@index([tenantId])
  @@index([eventId])
  @@index([participantType])
}

/// Issued certificate for a participant
model Certificate {
  id                String            @id @default(cuid())
  templateId        String
  participantId     String

  // Unique identifiers
  certificateNumber String            @unique // Human-readable number
  verificationCode  String            @unique // Short code for manual entry
  verificationUrl   String            // Full verification URL
  qrPayload         String            // QR code data payload

  // Document storage
  pdfUrl            String?           // URL to generated PDF

  // Status tracking
  status            CertificateStatus @default(PENDING)

  // Issuance data
  attendanceRate    Float?            // Calculated attendance percentage
  sessionsCompleted Json?             // List of completed sessions

  // Activity tracking
  generatedAt       DateTime?
  sentAt            DateTime?
  downloadCount     Int               @default(0)
  lastDownloadAt    DateTime?

  // Revocation
  revokedAt         DateTime?
  revokedBy         String?
  revokedReason     String?

  // Metadata
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  // Relations
  template          CertificateTemplate @relation(fields: [templateId], references: [id])
  participant       Participant         @relation(fields: [participantId], references: [id])
  verifications     CertificateVerification[]

  @@index([templateId])
  @@index([participantId])
  @@index([status])
  @@index([certificateNumber])
  @@index([verificationCode])
}

/// Verification audit trail
model CertificateVerification {
  id            String      @id @default(cuid())
  certificateId String
  verifiedAt    DateTime    @default(now())

  // Verifier information
  verifierIp    String?
  verifierAgent String?     // User agent string
  verifierNote  String?     // Optional note from verifier

  // Verification result
  wasValid      Boolean     @default(true)
  failureReason String?

  // Relations
  certificate   Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  @@index([certificateId])
  @@index([verifiedAt])
}
```

### 3.5 Enhanced Models

Additional models to support advanced functionality across all four subsystems.

```prisma
// ============================================================================
// ENHANCED MODELS
// ============================================================================

/// Analytics tracking for marketplace templates
model TemplateAnalytics {
  id              String              @id @default(cuid())
  templateId      String
  date            DateTime            @db.Date

  // Daily metrics
  views           Int                 @default(0)
  installs        Int                 @default(0)
  uninstalls      Int                 @default(0)
  ratings         Int                 @default(0)
  avgRating       Float?

  // Geographic distribution
  countryStats    Json?               // {countryCode: installCount}

  // Relations
  template        MarketplaceTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@unique([templateId, date])
  @@index([templateId])
  @@index([date])
}

/// Section grouping for survey questions
model SurveySection {
  id           String    @id @default(cuid())
  surveyId     String
  name         String
  description  String?
  sortOrder    Int       @default(0)

  // Conditional display
  showIf       Json?     // Conditions for showing section

  // Metadata
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  survey       Survey    @relation(fields: [surveyId], references: [id], onDelete: Cascade)

  @@index([surveyId])
  @@index([sortOrder])
}

/// Scheduled message management
model MessageSchedule {
  id            String          @id @default(cuid())
  tenantId      String
  eventId       String?
  name          String

  // Schedule configuration
  cronExpression String?        // For recurring messages
  sendAt         DateTime?      // For one-time scheduled messages
  timezone       String         @default("UTC")

  // Message configuration
  templateId     String
  channel        MessageChannel
  filters        Json           // Audience filter

  // Status
  isActive       Boolean        @default(true)
  lastRunAt      DateTime?
  nextRunAt      DateTime?

  // Metadata
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  createdBy      String?

  // Relations
  tenant         Tenant         @relation(fields: [tenantId], references: [id])
  event          Event?         @relation(fields: [eventId], references: [id])
  template       MessageTemplate @relation(fields: [templateId], references: [id])

  @@index([tenantId])
  @@index([eventId])
  @@index([isActive])
  @@index([nextRunAt])
}

/// Batch tracking for bulk certificate generation
model CertificateBatch {
  id              String            @id @default(cuid())
  tenantId        String
  eventId         String
  templateId      String

  // Progress tracking
  status          BatchStatus       @default(PENDING)
  totalCount      Int               @default(0)
  processedCount  Int               @default(0)
  successCount    Int               @default(0)
  failedCount     Int               @default(0)

  // Filter used for generation
  filters         Json?

  // Timing
  startedAt       DateTime?
  completedAt     DateTime?
  estimatedEndAt  DateTime?

  // Error tracking
  errors          Json?             // Array of {participantId, error}

  // Metadata
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  createdBy       String?

  // Relations
  tenant          Tenant            @relation(fields: [tenantId], references: [id])
  event           Event             @relation(fields: [eventId], references: [id])
  template        CertificateTemplate @relation(fields: [templateId], references: [id])

  @@index([tenantId])
  @@index([eventId])
  @@index([status])
}

/// Batch status enum
enum BatchStatus {
  PENDING     // Batch created, not started
  PROCESSING  // Batch is being processed
  COMPLETED   // All items processed
  FAILED      // Batch failed with errors
  CANCELLED   // Batch was cancelled
}

/// Content translation for multi-language support
model ContentTranslation {
  id            String    @id @default(cuid())

  // Reference to source content
  entityType    String    // "MessageTemplate", "Survey", "CertificateTemplate"
  entityId      String
  field         String    // Field being translated (e.g., "body", "title")

  // Translation
  languageCode  String    // ISO 639-1 code (e.g., "en", "es", "fr")
  translation   String    // Translated content

  // Status
  isApproved    Boolean   @default(false)
  approvedBy    String?
  approvedAt    DateTime?

  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdBy     String?

  @@unique([entityType, entityId, field, languageCode])
  @@index([entityType, entityId])
  @@index([languageCode])
}

/// Webhook delivery log for external integrations
model DeliveryWebhookLog {
  id            String    @id @default(cuid())
  tenantId      String

  // Webhook details
  channel       MessageChannel
  eventType     String    // "delivered", "bounced", "opened", etc.

  // Payload
  rawPayload    Json      // Original webhook payload
  externalId    String?   // Provider's message ID

  // Processing
  processedAt   DateTime?
  processingError String?

  // Metadata
  receivedAt    DateTime  @default(now())
  ipAddress     String?

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@index([channel])
  @@index([eventType])
  @@index([externalId])
  @@index([receivedAt])
}

/// Sentiment analysis results for survey responses
model SurveyAnalysis {
  id              String    @id @default(cuid())
  surveyId        String

  // Analysis type
  analysisType    String    // "SENTIMENT", "THEMES", "NPS", "COMPARISON"

  // Results
  results         Json      // Analysis-specific results

  // Configuration
  configuration   Json?     // Analysis parameters

  // Comparison reference
  comparisonSurveyId String? // For year-over-year comparison

  // Metadata
  analyzedAt      DateTime  @default(now())

  // Relations
  survey          Survey    @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  comparisonSurvey Survey?  @relation("ComparisonSurvey", fields: [comparisonSurveyId], references: [id])

  @@index([surveyId])
  @@index([analysisType])
}

/// Suppression list for unsubscribed/bounced recipients
model MessageSuppression {
  id            String          @id @default(cuid())
  tenantId      String

  // Recipient info
  channel       MessageChannel
  recipient     String          // Email, phone, or device token

  // Suppression reason
  reason        SuppressionReason

  // Bounce details (if applicable)
  bounceType    String?         // "hard", "soft"
  bounceCode    String?

  // Metadata
  suppressedAt  DateTime        @default(now())
  expiresAt     DateTime?       // Soft bounces may expire

  // Relations
  tenant        Tenant          @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, channel, recipient])
  @@index([tenantId])
  @@index([channel])
  @@index([recipient])
}

/// Suppression reason enum
enum SuppressionReason {
  UNSUBSCRIBED    // User opted out
  HARD_BOUNCE     // Permanent delivery failure
  SOFT_BOUNCE     // Temporary delivery failure
  COMPLAINT       // Spam complaint
  INVALID         // Invalid address/number
  MANUAL          // Manually suppressed by admin
}
```

### 3.6 ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                    CONTENT AND DOCUMENTS ER DIAGRAM                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                              COMMUNICATION HUB                                                           │    │
│  │                                                                                                                          │    │
│  │   ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐                               │    │
│  │   │  MessageTemplate    │         │  BroadcastMessage   │         │  MessageDelivery    │                               │    │
│  │   ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤                               │    │
│  │   │ id (PK)             │    1    │ id (PK)             │    1    │ id (PK)             │                               │    │
│  │   │ tenantId (FK)       │◄───────▶│ tenantId (FK)       │◄───────▶│ broadcastId (FK)    │                               │    │
│  │   │ name                │    N    │ eventId (FK)        │    N    │ participantId (FK)  │                               │    │
│  │   │ subject             │         │ templateId (FK)     │         │ channel             │                               │    │
│  │   │ body                │         │ subject             │         │ recipient           │                               │    │
│  │   │ channel             │         │ body                │         │ status              │                               │    │
│  │   │ isSystem            │         │ channel             │         │ externalId          │                               │    │
│  │   │ variables[]         │         │ status              │         │ sentAt              │                               │    │
│  │   │ createdAt           │         │ filters (JSON)      │         │ deliveredAt         │                               │    │
│  │   │ updatedAt           │         │ recipientCount      │         │ errorMessage        │                               │    │
│  │   └─────────────────────┘         │ scheduledAt         │         └─────────────────────┘                               │    │
│  │            │                      │ isEmergency         │                    │                                          │    │
│  │            │                      └─────────────────────┘                    │                                          │    │
│  │            │                               │                                  │                                          │    │
│  │            │                               │                                  │                                          │    │
│  │            └───────────────────────────────┴──────────────────────────────────┘                                          │    │
│  │                                                                                                                          │    │
│  │   ┌─────────────────────┐         ┌─────────────────────┐                                                               │    │
│  │   │  MessageSchedule    │         │  MessageSuppression │                                                               │    │
│  │   ├─────────────────────┤         ├─────────────────────┤                                                               │    │
│  │   │ id (PK)             │         │ id (PK)             │                                                               │    │
│  │   │ tenantId (FK)       │         │ tenantId (FK)       │                                                               │    │
│  │   │ templateId (FK)     │         │ channel             │                                                               │    │
│  │   │ cronExpression      │         │ recipient           │                                                               │    │
│  │   │ sendAt              │         │ reason              │                                                               │    │
│  │   │ filters (JSON)      │         │ bounceType          │                                                               │    │
│  │   │ isActive            │         │ suppressedAt        │                                                               │    │
│  │   └─────────────────────┘         └─────────────────────┘                                                               │    │
│  │                                                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                            TEMPLATE MARKETPLACE                                                          │    │
│  │                                                                                                                          │    │
│  │   ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐                               │    │
│  │   │ MarketplaceTemplate │         │   TemplateVersion   │         │   TemplateReview    │                               │    │
│  │   ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤                               │    │
│  │   │ id (PK)             │    1    │ id (PK)             │    1    │ id (PK)             │                               │    │
│  │   │ category            │◄───────▶│ templateId (FK)     │◄───────▶│ templateId (FK)     │                               │    │
│  │   │ name                │    N    │ version             │    N    │ reviewerTenantId(FK)│                               │    │
│  │   │ description         │         │ changelog           │         │ rating              │                               │    │
│  │   │ authorTenantId (FK) │         │ templateData (JSON) │         │ comment             │                               │    │
│  │   │ status              │         │ createdAt           │         │ authorResponse      │                               │    │
│  │   │ templateData (JSON) │         └─────────────────────┘         │ isHidden            │                               │    │
│  │   │ tags[]              │                                         └─────────────────────┘                               │    │
│  │   │ usageCount          │                                                                                                │    │
│  │   │ avgRating           │    1    ┌─────────────────────┐         ┌─────────────────────┐                               │    │
│  │   └─────────────────────┘◄───────▶│TemplateInstallation │         │  TemplateAnalytics  │                               │    │
│  │            │                  N   ├─────────────────────┤         ├─────────────────────┤                               │    │
│  │            │                      │ id (PK)             │         │ id (PK)             │                               │    │
│  │            │                      │ templateId (FK)     │         │ templateId (FK)     │                               │    │
│  │            │                      │ tenantId (FK)       │         │ date                │                               │    │
│  │            └──────────────────────│ eventId (FK)        │         │ views               │                               │    │
│  │                                   │ version             │         │ installs            │                               │    │
│  │                                   │ isForked            │         │ avgRating           │                               │    │
│  │                                   │ customData (JSON)   │         └─────────────────────┘                               │    │
│  │                                   └─────────────────────┘                                                                │    │
│  │                                                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                              SURVEY SYSTEM                                                               │    │
│  │                                                                                                                          │    │
│  │   ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐                               │    │
│  │   │      Survey         │         │   SurveyQuestion    │         │   SurveyResponse    │                               │    │
│  │   ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤                               │    │
│  │   │ id (PK)             │    1    │ id (PK)             │    1    │ id (PK)             │                               │    │
│  │   │ tenantId (FK)       │◄───────▶│ surveyId (FK)       │◄───────▶│ surveyId (FK)       │                               │    │
│  │   │ eventId (FK)        │    N    │ questionType        │    N    │ participantId (FK)  │                               │    │
│  │   │ title               │         │ text                │         │ accessToken         │                               │    │
│  │   │ description         │         │ options (JSON)      │         │ status              │                               │    │
│  │   │ status              │         │ scaleMin/Max        │         │ startedAt           │                               │    │
│  │   │ sendAfterHours      │         │ isRequired          │         │ completedAt         │                               │    │
│  │   │ reminderDays[]      │         │ sortOrder           │         │ remindersSent       │                               │    │
│  │   │ closesAfterDays     │         │ section             │         └─────────────────────┘                               │    │
│  │   │ targetFilter (JSON) │         │ showIf (JSON)       │                    │                                          │    │
│  │   │ thankYouMessage     │         └─────────────────────┘                    │                                          │    │
│  │   └─────────────────────┘                    │                               │                                          │    │
│  │            │                                 │                               │                                          │    │
│  │            │                                 │              1                │                                          │    │
│  │            │              ┌──────────────────┴──────────────▼────────────────▼───────────────┐                          │    │
│  │            │              │                     SurveyAnswer                                  │                          │    │
│  │            │              ├───────────────────────────────────────────────────────────────────┤                          │    │
│  │            │              │ id (PK)  │ responseId (FK) │ questionId (FK)                      │                          │    │
│  │            │              │ numericValue │ textValue │ arrayValue (JSON)                     │                          │    │
│  │            │              └───────────────────────────────────────────────────────────────────┘                          │    │
│  │            │                                                                                                              │    │
│  │            │    1         ┌─────────────────────┐         ┌─────────────────────┐                                        │    │
│  │            └─────────────▶│   SurveySection     │         │   SurveyAnalysis    │                                        │    │
│  │                       N   ├─────────────────────┤         ├─────────────────────┤                                        │    │
│  │                           │ id (PK)             │         │ id (PK)             │                                        │    │
│  │                           │ surveyId (FK)       │         │ surveyId (FK)       │                                        │    │
│  │                           │ name                │         │ analysisType        │                                        │    │
│  │                           │ sortOrder           │         │ results (JSON)      │                                        │    │
│  │                           └─────────────────────┘         │ comparisonSurveyId  │                                        │    │
│  │                                                           └─────────────────────┘                                        │    │
│  │                                                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                           CERTIFICATE SYSTEM                                                             │    │
│  │                                                                                                                          │    │
│  │   ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐                               │    │
│  │   │CertificateTemplate  │         │    Certificate      │         │CertificateVerification│                              │    │
│  │   ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤                               │    │
│  │   │ id (PK)             │    1    │ id (PK)             │    1    │ id (PK)             │                               │    │
│  │   │ tenantId (FK)       │◄───────▶│ templateId (FK)     │◄───────▶│ certificateId (FK)  │                               │    │
│  │   │ eventId (FK)        │    N    │ participantId (FK)  │    N    │ verifiedAt          │                               │    │
│  │   │ name                │         │ certificateNumber   │         │ verifierIp          │                               │    │
│  │   │ participantType     │         │ verificationCode    │         │ verifierAgent       │                               │    │
│  │   │ pageSize            │         │ verificationUrl     │         │ wasValid            │                               │    │
│  │   │ canvasData (JSON)   │         │ qrPayload           │         └─────────────────────┘                               │    │
│  │   │ issuanceRule        │         │ pdfUrl              │                                                                │    │
│  │   │ attendanceThreshold │         │ status              │                                                                │    │
│  │   │ requiredMeetings    │         │ attendanceRate      │                                                                │    │
│  │   │ signatoryName       │         │ revokedAt           │                                                                │    │
│  │   │ signatureImage      │         │ revokedReason       │         ┌─────────────────────┐                               │    │
│  │   └─────────────────────┘         └─────────────────────┘         │  CertificateBatch   │                               │    │
│  │            │                                                       ├─────────────────────┤                               │    │
│  │            │    1                                                  │ id (PK)             │                               │    │
│  │            └──────────────────────────────────────────────────────▶│ templateId (FK)     │                               │    │
│  │                           N                                        │ status              │                               │    │
│  │                                                                    │ totalCount          │                               │    │
│  │                                                                    │ processedCount      │                               │    │
│  │                                                                    │ successCount        │                               │    │
│  │                                                                    │ errors (JSON)       │                               │    │
│  │                                                                    └─────────────────────┘                               │    │
│  │                                                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                           SHARED/ENHANCED                                                                │    │
│  │                                                                                                                          │    │
│  │   ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐                               │    │
│  │   │ ContentTranslation  │         │ DeliveryWebhookLog  │         │      Tenant         │                               │    │
│  │   ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤                               │    │
│  │   │ id (PK)             │         │ id (PK)             │         │ id (PK)             │◄─────── All tenant-scoped     │    │
│  │   │ entityType          │         │ tenantId (FK)       │         │ name                │         models reference      │    │
│  │   │ entityId            │         │ channel             │         │ ...                 │         this entity           │    │
│  │   │ field               │         │ eventType           │         └─────────────────────┘                               │    │
│  │   │ languageCode        │         │ rawPayload (JSON)   │                    │                                          │    │
│  │   │ translation         │         │ processedAt         │                    │                                          │    │
│  │   │ isApproved          │         └─────────────────────┘                    │                                          │    │
│  │   └─────────────────────┘                                                    │                                          │    │
│  │                                                                               │                                          │    │
│  │                                           ┌─────────────────────┐            │                                          │    │
│  │                                           │        Event        │◄───────────┘                                          │    │
│  │                                           ├─────────────────────┤                                                        │    │
│  │                                           │ id (PK)             │◄─────── Event-scoped models                           │    │
│  │                                           │ tenantId (FK)       │         (surveys, certificates,                       │    │
│  │                                           │ name                │          broadcasts) reference                        │    │
│  │                                           │ ...                 │         this entity                                   │    │
│  │                                           └─────────────────────┘                                                        │    │
│  │                                                                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Index Catalog

The following indexes optimize query performance across all Content and Documents tables.

#### Communication Hub Indexes

| Table              | Index Name                  | Columns                               | Type   | Purpose                  |
| ------------------ | --------------------------- | ------------------------------------- | ------ | ------------------------ |
| MessageTemplate    | `idx_msgtemplate_tenant`    | `tenantId`                            | B-tree | Tenant isolation         |
| MessageTemplate    | `idx_msgtemplate_channel`   | `channel`                             | B-tree | Channel filtering        |
| MessageTemplate    | `idx_msgtemplate_system`    | `isSystem`                            | B-tree | System template lookup   |
| MessageTemplate    | `uq_msgtemplate_name`       | `tenantId, name, channel`             | Unique | Prevent duplicates       |
| BroadcastMessage   | `idx_broadcast_tenant`      | `tenantId`                            | B-tree | Tenant isolation         |
| BroadcastMessage   | `idx_broadcast_event`       | `eventId`                             | B-tree | Event filtering          |
| BroadcastMessage   | `idx_broadcast_status`      | `status`                              | B-tree | Status filtering         |
| BroadcastMessage   | `idx_broadcast_scheduled`   | `scheduledAt`                         | B-tree | Scheduled job queries    |
| BroadcastMessage   | `idx_broadcast_emergency`   | `isEmergency`                         | B-tree | Emergency prioritization |
| MessageDelivery    | `idx_delivery_broadcast`    | `broadcastId`                         | B-tree | Broadcast lookups        |
| MessageDelivery    | `idx_delivery_participant`  | `participantId`                       | B-tree | Participant history      |
| MessageDelivery    | `idx_delivery_status`       | `status`                              | B-tree | Status filtering         |
| MessageDelivery    | `idx_delivery_external`     | `externalId`                          | B-tree | Webhook callbacks        |
| MessageDelivery    | `uq_delivery_unique`        | `broadcastId, participantId, channel` | Unique | Prevent duplicates       |
| MessageSuppression | `idx_suppression_tenant`    | `tenantId`                            | B-tree | Tenant isolation         |
| MessageSuppression | `idx_suppression_recipient` | `recipient`                           | B-tree | Recipient lookup         |
| MessageSuppression | `uq_suppression_unique`     | `tenantId, channel, recipient`        | Unique | One per recipient        |

#### Template Marketplace Indexes

| Table                | Index Name                 | Columns                         | Type           | Purpose             |
| -------------------- | -------------------------- | ------------------------------- | -------------- | ------------------- |
| MarketplaceTemplate  | `idx_mkttemplate_category` | `category`                      | B-tree         | Category filtering  |
| MarketplaceTemplate  | `idx_mkttemplate_status`   | `status`                        | B-tree         | Status filtering    |
| MarketplaceTemplate  | `idx_mkttemplate_author`   | `authorTenantId`                | B-tree         | Author lookup       |
| MarketplaceTemplate  | `idx_mkttemplate_rating`   | `avgRating`                     | B-tree         | Rating sort         |
| MarketplaceTemplate  | `idx_mkttemplate_usage`    | `usageCount`                    | B-tree         | Popularity sort     |
| MarketplaceTemplate  | `idx_mkttemplate_tags`     | `tags`                          | GIN            | Tag search          |
| MarketplaceTemplate  | `idx_mkttemplate_search`   | `name, description, tags`       | GIN (tsvector) | Full-text search    |
| TemplateVersion      | `idx_tplversion_template`  | `templateId`                    | B-tree         | Version lookup      |
| TemplateVersion      | `uq_tplversion_unique`     | `templateId, version`           | Unique         | One per version     |
| TemplateReview       | `idx_tplreview_template`   | `templateId`                    | B-tree         | Review lookup       |
| TemplateReview       | `idx_tplreview_rating`     | `rating`                        | B-tree         | Rating distribution |
| TemplateReview       | `uq_tplreview_unique`      | `templateId, reviewerTenantId`  | Unique         | One per tenant      |
| TemplateInstallation | `idx_tplinstall_tenant`    | `tenantId`                      | B-tree         | Tenant lookup       |
| TemplateInstallation | `idx_tplinstall_event`     | `eventId`                       | B-tree         | Event lookup        |
| TemplateInstallation | `uq_tplinstall_unique`     | `templateId, tenantId, eventId` | Unique         | One per event       |

#### Survey System Indexes

| Table          | Index Name                 | Columns                  | Type   | Purpose              |
| -------------- | -------------------------- | ------------------------ | ------ | -------------------- |
| Survey         | `idx_survey_tenant`        | `tenantId`               | B-tree | Tenant isolation     |
| Survey         | `idx_survey_event`         | `eventId`                | B-tree | Event filtering      |
| Survey         | `idx_survey_status`        | `status`                 | B-tree | Status filtering     |
| SurveyQuestion | `idx_question_survey`      | `surveyId`               | B-tree | Survey lookup        |
| SurveyQuestion | `idx_question_order`       | `sortOrder`              | B-tree | Question ordering    |
| SurveyResponse | `idx_response_survey`      | `surveyId`               | B-tree | Survey lookup        |
| SurveyResponse | `idx_response_participant` | `participantId`          | B-tree | Participant lookup   |
| SurveyResponse | `idx_response_status`      | `status`                 | B-tree | Status filtering     |
| SurveyResponse | `idx_response_token`       | `accessToken`            | Unique | Token validation     |
| SurveyAnswer   | `idx_answer_response`      | `responseId`             | B-tree | Response lookup      |
| SurveyAnswer   | `idx_answer_question`      | `questionId`             | B-tree | Question aggregation |
| SurveyAnswer   | `uq_answer_unique`         | `responseId, questionId` | Unique | One per question     |

#### Certificate System Indexes

| Table                   | Index Name                | Columns             | Type   | Purpose             |
| ----------------------- | ------------------------- | ------------------- | ------ | ------------------- |
| CertificateTemplate     | `idx_certtemplate_tenant` | `tenantId`          | B-tree | Tenant isolation    |
| CertificateTemplate     | `idx_certtemplate_event`  | `eventId`           | B-tree | Event filtering     |
| CertificateTemplate     | `idx_certtemplate_type`   | `participantType`   | B-tree | Type filtering      |
| Certificate             | `idx_cert_template`       | `templateId`        | B-tree | Template lookup     |
| Certificate             | `idx_cert_participant`    | `participantId`     | B-tree | Participant lookup  |
| Certificate             | `idx_cert_status`         | `status`            | B-tree | Status filtering    |
| Certificate             | `idx_cert_number`         | `certificateNumber` | Unique | Number lookup       |
| Certificate             | `idx_cert_verifycode`     | `verificationCode`  | Unique | Verification lookup |
| CertificateVerification | `idx_certverify_cert`     | `certificateId`     | B-tree | Certificate lookup  |
| CertificateVerification | `idx_certverify_date`     | `verifiedAt`        | B-tree | Date filtering      |
| CertificateBatch        | `idx_certbatch_tenant`    | `tenantId`          | B-tree | Tenant isolation    |
| CertificateBatch        | `idx_certbatch_event`     | `eventId`           | B-tree | Event filtering     |
| CertificateBatch        | `idx_certbatch_status`    | `status`            | B-tree | Status filtering    |

#### Full-Text Search Configuration

```sql
-- Create full-text search index for Template Marketplace
CREATE INDEX idx_mkttemplate_fts ON "MarketplaceTemplate"
USING GIN (
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce("longDescription", '') || ' ' ||
    coalesce("authorName", '') || ' ' ||
    array_to_string(tags, ' ')
  )
);

-- Search function
CREATE OR REPLACE FUNCTION search_templates(search_query TEXT)
RETURNS TABLE(id TEXT, rank REAL) AS $$
BEGIN
  RETURN QUERY
  SELECT mt.id, ts_rank(
    to_tsvector('english',
      coalesce(mt.name, '') || ' ' ||
      coalesce(mt.description, '') || ' ' ||
      coalesce(mt."longDescription", '') || ' ' ||
      coalesce(mt."authorName", '') || ' ' ||
      array_to_string(mt.tags, ' ')
    ),
    plainto_tsquery('english', search_query)
  ) as rank
  FROM "MarketplaceTemplate" mt
  WHERE mt.status = 'PUBLISHED'
    AND to_tsvector('english',
      coalesce(mt.name, '') || ' ' ||
      coalesce(mt.description, '') || ' ' ||
      coalesce(mt."longDescription", '') || ' ' ||
      coalesce(mt."authorName", '') || ' ' ||
      array_to_string(mt.tags, ' ')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. API Specification

This section defines the complete API surface for the Content and Documents module, including request/response types, validation schemas, and endpoint documentation.

### 4.1 Communication Hub APIs

#### 4.1.1 Types and Validation Schemas

```typescript
// ============================================================================
// COMMUNICATION HUB TYPES
// ============================================================================

import { z } from "zod";

// Enums
export const MessageChannelSchema = z.enum(["EMAIL", "SMS", "PUSH", "IN_APP"]);
export type MessageChannel = z.infer<typeof MessageChannelSchema>;

export const MessageStatusSchema = z.enum([
  "QUEUED",
  "SENDING",
  "SENT",
  "DELIVERED",
  "BOUNCED",
  "FAILED",
]);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const BroadcastStatusSchema = z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"]);
export type BroadcastStatus = z.infer<typeof BroadcastStatusSchema>;

// Message Template Schemas
export const MessageTemplateCreateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(50000),
  channel: MessageChannelSchema,
  variables: z.array(z.string()).optional(),
});
export type MessageTemplateCreate = z.infer<typeof MessageTemplateCreateSchema>;

export const MessageTemplateUpdateSchema = MessageTemplateCreateSchema.partial();
export type MessageTemplateUpdate = z.infer<typeof MessageTemplateUpdateSchema>;

export const MessageTemplateResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  subject: z.string().nullable(),
  body: z.string(),
  channel: MessageChannelSchema,
  isSystem: z.boolean(),
  variables: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MessageTemplateResponse = z.infer<typeof MessageTemplateResponseSchema>;

// Broadcast Schemas
export const AudienceFilterSchema = z.object({
  participantTypes: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  organizations: z.array(z.string()).optional(),
  registrationDateFrom: z.string().datetime().optional(),
  registrationDateTo: z.string().datetime().optional(),
  checkedIn: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  hasPushToken: z.boolean().optional(),
  customFields: z.record(z.any()).optional(),
});
export type AudienceFilter = z.infer<typeof AudienceFilterSchema>;

export const BroadcastCreateSchema = z.object({
  eventId: z.string().optional(),
  templateId: z.string().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(50000),
  channel: MessageChannelSchema,
  filters: AudienceFilterSchema,
  scheduledAt: z.string().datetime().optional(),
  isEmergency: z.boolean().optional(),
});
export type BroadcastCreate = z.infer<typeof BroadcastCreateSchema>;

export const BroadcastUpdateSchema = BroadcastCreateSchema.partial();
export type BroadcastUpdate = z.infer<typeof BroadcastUpdateSchema>;

export const BroadcastResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  eventId: z.string().nullable(),
  templateId: z.string().nullable(),
  subject: z.string().nullable(),
  body: z.string(),
  channel: MessageChannelSchema,
  status: BroadcastStatusSchema,
  filters: AudienceFilterSchema,
  recipientCount: z.number(),
  sentCount: z.number(),
  failedCount: z.number(),
  deliveredCount: z.number(),
  bouncedCount: z.number(),
  openedCount: z.number(),
  scheduledAt: z.string().datetime().nullable(),
  sentAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  isEmergency: z.boolean(),
  priority: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type BroadcastResponse = z.infer<typeof BroadcastResponseSchema>;

export const BroadcastSendSchema = z.object({
  sendImmediately: z.boolean().optional(),
});
export type BroadcastSend = z.infer<typeof BroadcastSendSchema>;

export const AudiencePreviewResponseSchema = z.object({
  totalCount: z.number(),
  byChannel: z.object({
    email: z.number(),
    sms: z.number(),
    push: z.number(),
    inApp: z.number(),
  }),
  sampleRecipients: z.array(
    z.object({
      participantId: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      hasPushToken: z.boolean(),
    }),
  ),
});
export type AudiencePreviewResponse = z.infer<typeof AudiencePreviewResponseSchema>;

// Emergency Broadcast Schema
export const EmergencyBroadcastSchema = z.object({
  eventId: z.string(),
  subject: z.string().max(200),
  body: z.string().min(1).max(5000),
  channels: z.array(MessageChannelSchema).min(1),
  filters: AudienceFilterSchema.optional(),
  confirmationCode: z.string().min(6), // Required for emergency broadcasts
});
export type EmergencyBroadcast = z.infer<typeof EmergencyBroadcastSchema>;

// Delivery Status Schema
export const DeliveryStatusResponseSchema = z.object({
  id: z.string(),
  broadcastId: z.string(),
  participantId: z.string(),
  participantName: z.string(),
  channel: MessageChannelSchema,
  recipient: z.string(),
  status: MessageStatusSchema,
  sentAt: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
  bouncedAt: z.string().datetime().nullable(),
  openedAt: z.string().datetime().nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number(),
});
export type DeliveryStatusResponse = z.infer<typeof DeliveryStatusResponseSchema>;

// Message History Schema
export const MessageHistoryQuerySchema = z.object({
  participantId: z.string().optional(),
  eventId: z.string().optional(),
  channel: MessageChannelSchema.optional(),
  status: MessageStatusSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type MessageHistoryQuery = z.infer<typeof MessageHistoryQuerySchema>;
```

#### 4.1.2 API Endpoints

```typescript
// ============================================================================
// COMMUNICATION HUB API ROUTES
// ============================================================================

// Base path: /api/v1/communications

// ----------------------------------------------------------------------------
// MESSAGE TEMPLATES
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/communications/templates
 * List all message templates for tenant
 *
 * Query Parameters:
 *   - channel?: MessageChannel
 *   - search?: string
 *   - isSystem?: boolean
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: MessageTemplateResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/communications/templates
 * Create a new message template
 *
 * Request Body: MessageTemplateCreate
 *
 * Response: 201 Created
 * MessageTemplateResponse
 */

/**
 * GET /api/v1/communications/templates/:id
 * Get a specific message template
 *
 * Response: 200 OK
 * MessageTemplateResponse
 */

/**
 * PATCH /api/v1/communications/templates/:id
 * Update a message template
 *
 * Request Body: MessageTemplateUpdate
 *
 * Response: 200 OK
 * MessageTemplateResponse
 */

/**
 * DELETE /api/v1/communications/templates/:id
 * Delete a message template (non-system only)
 *
 * Response: 204 No Content
 */

/**
 * POST /api/v1/communications/templates/:id/preview
 * Preview a template with sample data
 *
 * Request Body: {
 *   variables: Record<string, string>
 * }
 *
 * Response: 200 OK
 * {
 *   subject: string | null,
 *   body: string
 * }
 */

/**
 * POST /api/v1/communications/templates/:id/clone
 * Clone an existing template
 *
 * Request Body: {
 *   name: string
 * }
 *
 * Response: 201 Created
 * MessageTemplateResponse
 */

// ----------------------------------------------------------------------------
// BROADCAST MESSAGES
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/communications/broadcasts
 * List broadcast messages
 *
 * Query Parameters:
 *   - eventId?: string
 *   - status?: BroadcastStatus
 *   - channel?: MessageChannel
 *   - dateFrom?: string (ISO datetime)
 *   - dateTo?: string (ISO datetime)
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: BroadcastResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/communications/broadcasts
 * Create a new broadcast message
 *
 * Request Body: BroadcastCreate
 *
 * Response: 201 Created
 * BroadcastResponse
 */

/**
 * GET /api/v1/communications/broadcasts/:id
 * Get a specific broadcast message
 *
 * Response: 200 OK
 * BroadcastResponse
 */

/**
 * PATCH /api/v1/communications/broadcasts/:id
 * Update a broadcast message (draft only)
 *
 * Request Body: BroadcastUpdate
 *
 * Response: 200 OK
 * BroadcastResponse
 */

/**
 * DELETE /api/v1/communications/broadcasts/:id
 * Delete a broadcast message (draft only)
 *
 * Response: 204 No Content
 */

/**
 * POST /api/v1/communications/broadcasts/:id/preview-audience
 * Preview recipients matching broadcast filters
 *
 * Response: 200 OK
 * AudiencePreviewResponse
 */

/**
 * POST /api/v1/communications/broadcasts/:id/send
 * Send or schedule a broadcast message
 *
 * Request Body: BroadcastSend
 *
 * Response: 200 OK
 * BroadcastResponse (with updated status)
 */

/**
 * POST /api/v1/communications/broadcasts/:id/cancel
 * Cancel a scheduled or sending broadcast
 *
 * Request Body: {
 *   reason?: string
 * }
 *
 * Response: 200 OK
 * BroadcastResponse
 */

/**
 * GET /api/v1/communications/broadcasts/:id/deliveries
 * Get delivery status for a broadcast
 *
 * Query Parameters:
 *   - status?: MessageStatus
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: DeliveryStatusResponse[],
 *   summary: {
 *     total: number,
 *     queued: number,
 *     sending: number,
 *     sent: number,
 *     delivered: number,
 *     bounced: number,
 *     failed: number
 *   },
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/communications/broadcasts/:id/retry-failed
 * Retry failed deliveries for a broadcast
 *
 * Response: 200 OK
 * {
 *   retriedCount: number
 * }
 */

// ----------------------------------------------------------------------------
// EMERGENCY BROADCAST
// ----------------------------------------------------------------------------

/**
 * POST /api/v1/communications/emergency-broadcast
 * Send an emergency broadcast (high priority, bypasses scheduling)
 *
 * Request Body: EmergencyBroadcast
 *
 * Response: 201 Created
 * BroadcastResponse
 *
 * Notes:
 * - Requires EMERGENCY_BROADCAST permission
 * - Bypasses all scheduling delays
 * - Sends to all specified channels simultaneously
 * - Logs to audit trail with confirmation code
 */

/**
 * GET /api/v1/communications/emergency-broadcast/confirm-code
 * Generate a confirmation code for emergency broadcast
 *
 * Response: 200 OK
 * {
 *   code: string,
 *   expiresAt: string (ISO datetime)
 * }
 */

// ----------------------------------------------------------------------------
// MESSAGE HISTORY
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/communications/history
 * Get message history for tenant
 *
 * Query Parameters: MessageHistoryQuery
 *
 * Response: 200 OK
 * {
 *   data: DeliveryStatusResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * GET /api/v1/communications/history/participant/:participantId
 * Get message history for a specific participant
 *
 * Query Parameters:
 *   - channel?: MessageChannel
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: DeliveryStatusResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

// ----------------------------------------------------------------------------
// DELIVERY WEBHOOKS
// ----------------------------------------------------------------------------

/**
 * POST /api/v1/communications/webhooks/email
 * Webhook endpoint for email delivery status (Azure Communication Services)
 *
 * Request Body: Provider-specific webhook payload
 *
 * Response: 200 OK
 */

/**
 * POST /api/v1/communications/webhooks/sms
 * Webhook endpoint for SMS delivery status
 *
 * Request Body: Provider-specific webhook payload
 *
 * Response: 200 OK
 */

/**
 * POST /api/v1/communications/webhooks/push
 * Webhook endpoint for push notification delivery status
 *
 * Request Body: Provider-specific webhook payload
 *
 * Response: 200 OK
 */

// ----------------------------------------------------------------------------
// SUPPRESSION LIST
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/communications/suppressions
 * Get suppression list
 *
 * Query Parameters:
 *   - channel?: MessageChannel
 *   - reason?: SuppressionReason
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: Array<{
 *     id: string,
 *     channel: MessageChannel,
 *     recipient: string,
 *     reason: SuppressionReason,
 *     suppressedAt: string
 *   }>,
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/communications/suppressions
 * Add to suppression list (manual)
 *
 * Request Body: {
 *   channel: MessageChannel,
 *   recipient: string,
 *   reason: 'MANUAL'
 * }
 *
 * Response: 201 Created
 */

/**
 * DELETE /api/v1/communications/suppressions/:id
 * Remove from suppression list
 *
 * Response: 204 No Content
 */
```

### 4.2 Template Marketplace APIs

#### 4.2.1 Types and Validation Schemas

```typescript
// ============================================================================
// TEMPLATE MARKETPLACE TYPES
// ============================================================================

import { z } from "zod";

// Enums
export const TemplateCategorySchema = z.enum([
  "BADGE",
  "WORKFLOW",
  "FORM",
  "REPORT",
  "CERTIFICATE",
  "SEATING_LAYOUT",
]);
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const PublishStatusSchema = z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "DEPRECATED"]);
export type PublishStatus = z.infer<typeof PublishStatusSchema>;

// Template Create/Update Schemas
export const MarketplaceTemplateCreateSchema = z.object({
  category: TemplateCategorySchema,
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(200),
  longDescription: z.string().max(5000).optional(),
  previewImageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  templateData: z.record(z.any()), // Category-specific structure
  tags: z.array(z.string().max(30)).max(10),
});
export type MarketplaceTemplateCreate = z.infer<typeof MarketplaceTemplateCreateSchema>;

export const MarketplaceTemplateUpdateSchema = MarketplaceTemplateCreateSchema.partial();
export type MarketplaceTemplateUpdate = z.infer<typeof MarketplaceTemplateUpdateSchema>;

export const MarketplaceTemplateResponseSchema = z.object({
  id: z.string(),
  category: TemplateCategorySchema,
  name: z.string(),
  description: z.string(),
  longDescription: z.string().nullable(),
  authorTenantId: z.string(),
  authorName: z.string(),
  status: PublishStatusSchema,
  previewImageUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  templateData: z.record(z.any()),
  tags: z.array(z.string()),
  usageCount: z.number(),
  avgRating: z.number(),
  ratingCount: z.number(),
  currentVersion: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
});
export type MarketplaceTemplateResponse = z.infer<typeof MarketplaceTemplateResponseSchema>;

// Search and Filter Schemas
export const TemplateSearchQuerySchema = z.object({
  query: z.string().optional(),
  category: TemplateCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.enum(["popular", "newest", "rating", "name"]).default("popular"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});
export type TemplateSearchQuery = z.infer<typeof TemplateSearchQuerySchema>;

export const TemplateSearchResponseSchema = z.object({
  data: z.array(MarketplaceTemplateResponseSchema),
  facets: z.object({
    categories: z.array(
      z.object({
        category: TemplateCategorySchema,
        count: z.number(),
      }),
    ),
    tags: z.array(
      z.object({
        tag: z.string(),
        count: z.number(),
      }),
    ),
    ratingDistribution: z.array(
      z.object({
        rating: z.number(),
        count: z.number(),
      }),
    ),
  }),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type TemplateSearchResponse = z.infer<typeof TemplateSearchResponseSchema>;

// Version Schemas
export const TemplateVersionCreateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Must be semantic version"),
  changelog: z.string().min(10).max(2000),
  templateData: z.record(z.any()),
});
export type TemplateVersionCreate = z.infer<typeof TemplateVersionCreateSchema>;

export const TemplateVersionResponseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  version: z.string(),
  changelog: z.string(),
  createdAt: z.string().datetime(),
});
export type TemplateVersionResponse = z.infer<typeof TemplateVersionResponseSchema>;

// Review Schemas
export const TemplateReviewCreateSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type TemplateReviewCreate = z.infer<typeof TemplateReviewCreateSchema>;

export const TemplateReviewResponseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  reviewerTenantId: z.string(),
  reviewerName: z.string(),
  rating: z.number(),
  comment: z.string().nullable(),
  authorResponse: z.string().nullable(),
  respondedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type TemplateReviewResponse = z.infer<typeof TemplateReviewResponseSchema>;

// Installation Schemas
export const TemplateInstallSchema = z.object({
  eventId: z.string().optional(),
  version: z.string().optional(), // Defaults to current
  fork: z.boolean().default(false),
});
export type TemplateInstall = z.infer<typeof TemplateInstallSchema>;

export const TemplateInstallationResponseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  templateName: z.string(),
  tenantId: z.string(),
  eventId: z.string().nullable(),
  version: z.string(),
  isForked: z.boolean(),
  hasUpdate: z.boolean(),
  installedAt: z.string().datetime(),
  installedBy: z.string(),
});
export type TemplateInstallationResponse = z.infer<typeof TemplateInstallationResponseSchema>;

// Conflict Check Schema
export const ConflictCheckResponseSchema = z.object({
  hasConflicts: z.boolean(),
  conflicts: z.array(
    z.object({
      type: z.enum(["NAME", "FIELD", "DEPENDENCY", "VERSION"]),
      message: z.string(),
      resolution: z.enum(["RENAME", "MERGE", "SKIP", "UPGRADE"]).optional(),
    }),
  ),
  canInstall: z.boolean(),
});
export type ConflictCheckResponse = z.infer<typeof ConflictCheckResponseSchema>;
```

#### 4.2.2 API Endpoints

```typescript
// ============================================================================
// TEMPLATE MARKETPLACE API ROUTES
// ============================================================================

// Base path: /api/v1/marketplace

// ----------------------------------------------------------------------------
// TEMPLATE DISCOVERY
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/marketplace/templates
 * Search and browse marketplace templates
 *
 * Query Parameters: TemplateSearchQuery
 *
 * Response: 200 OK
 * TemplateSearchResponse
 */

/**
 * GET /api/v1/marketplace/templates/:id
 * Get template details
 *
 * Response: 200 OK
 * MarketplaceTemplateResponse & {
 *   versions: TemplateVersionResponse[],
 *   reviews: {
 *     summary: { average: number, count: number, distribution: number[] },
 *     recent: TemplateReviewResponse[]
 *   },
 *   relatedTemplates: MarketplaceTemplateResponse[]
 * }
 */

/**
 * GET /api/v1/marketplace/templates/:id/preview
 * Preview template rendering
 *
 * Query Parameters:
 *   - version?: string
 *   - sampleData?: boolean
 *
 * Response: 200 OK
 * {
 *   previewUrl: string, // Rendered preview image
 *   templateData: Record<string, any>
 * }
 */

/**
 * GET /api/v1/marketplace/categories
 * Get all template categories with counts
 *
 * Response: 200 OK
 * {
 *   categories: Array<{
 *     category: TemplateCategory,
 *     name: string,
 *     description: string,
 *     count: number,
 *     iconUrl: string
 *   }>
 * }
 */

/**
 * GET /api/v1/marketplace/tags
 * Get popular tags
 *
 * Query Parameters:
 *   - category?: TemplateCategory
 *   - limit?: number (default 50)
 *
 * Response: 200 OK
 * {
 *   tags: Array<{
 *     tag: string,
 *     count: number
 *   }>
 * }
 */

/**
 * GET /api/v1/marketplace/featured
 * Get featured templates
 *
 * Response: 200 OK
 * {
 *   featured: MarketplaceTemplateResponse[],
 *   trending: MarketplaceTemplateResponse[],
 *   newArrivals: MarketplaceTemplateResponse[]
 * }
 */

// ----------------------------------------------------------------------------
// TEMPLATE PUBLISHING (Author Operations)
// ----------------------------------------------------------------------------

/**
 * POST /api/v1/marketplace/templates
 * Create a new template (draft)
 *
 * Request Body: MarketplaceTemplateCreate
 *
 * Response: 201 Created
 * MarketplaceTemplateResponse
 */

/**
 * PATCH /api/v1/marketplace/templates/:id
 * Update template (draft or create new version)
 *
 * Request Body: MarketplaceTemplateUpdate
 *
 * Response: 200 OK
 * MarketplaceTemplateResponse
 */

/**
 * DELETE /api/v1/marketplace/templates/:id
 * Delete template (draft only, or deprecate if published)
 *
 * Response: 204 No Content
 */

/**
 * POST /api/v1/marketplace/templates/:id/submit
 * Submit template for review
 *
 * Response: 200 OK
 * MarketplaceTemplateResponse (status: IN_REVIEW)
 */

/**
 * POST /api/v1/marketplace/templates/:id/versions
 * Create a new version of published template
 *
 * Request Body: TemplateVersionCreate
 *
 * Response: 201 Created
 * TemplateVersionResponse
 */

/**
 * GET /api/v1/marketplace/templates/:id/versions
 * Get all versions of a template
 *
 * Response: 200 OK
 * {
 *   data: TemplateVersionResponse[]
 * }
 */

/**
 * POST /api/v1/marketplace/templates/:id/deprecate
 * Deprecate a published template
 *
 * Request Body: {
 *   reason: string,
 *   replacementId?: string
 * }
 *
 * Response: 200 OK
 * MarketplaceTemplateResponse
 */

/**
 * GET /api/v1/marketplace/my-templates
 * Get templates created by current tenant
 *
 * Query Parameters:
 *   - status?: PublishStatus
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: MarketplaceTemplateResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

// ----------------------------------------------------------------------------
// TEMPLATE INSTALLATION
// ----------------------------------------------------------------------------

/**
 * POST /api/v1/marketplace/templates/:id/check-conflicts
 * Check for conflicts before installation
 *
 * Request Body: {
 *   eventId?: string,
 *   version?: string
 * }
 *
 * Response: 200 OK
 * ConflictCheckResponse
 */

/**
 * POST /api/v1/marketplace/templates/:id/install
 * Install a template
 *
 * Request Body: TemplateInstall
 *
 * Response: 201 Created
 * TemplateInstallationResponse
 */

/**
 * GET /api/v1/marketplace/installations
 * Get installed templates for current tenant
 *
 * Query Parameters:
 *   - eventId?: string
 *   - category?: TemplateCategory
 *   - hasUpdate?: boolean
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: TemplateInstallationResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * GET /api/v1/marketplace/installations/:id
 * Get installation details
 *
 * Response: 200 OK
 * TemplateInstallationResponse & {
 *   customData: Record<string, any> | null,
 *   availableVersions: string[]
 * }
 */

/**
 * PATCH /api/v1/marketplace/installations/:id
 * Update installation (customizations for forked templates)
 *
 * Request Body: {
 *   customData: Record<string, any>
 * }
 *
 * Response: 200 OK
 * TemplateInstallationResponse
 */

/**
 * POST /api/v1/marketplace/installations/:id/upgrade
 * Upgrade to a newer version
 *
 * Request Body: {
 *   version?: string // Defaults to latest
 * }
 *
 * Response: 200 OK
 * TemplateInstallationResponse
 */

/**
 * DELETE /api/v1/marketplace/installations/:id
 * Uninstall a template
 *
 * Response: 204 No Content
 */

// ----------------------------------------------------------------------------
// REVIEWS AND RATINGS
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/marketplace/templates/:id/reviews
 * Get reviews for a template
 *
 * Query Parameters:
 *   - rating?: number (filter by rating)
 *   - sortBy?: 'newest' | 'rating' | 'helpful'
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: TemplateReviewResponse[],
 *   summary: {
 *     average: number,
 *     count: number,
 *     distribution: { [rating: number]: number }
 *   },
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/marketplace/templates/:id/reviews
 * Submit a review (requires installation)
 *
 * Request Body: TemplateReviewCreate
 *
 * Response: 201 Created
 * TemplateReviewResponse
 */

/**
 * PATCH /api/v1/marketplace/templates/:id/reviews/:reviewId
 * Update own review
 *
 * Request Body: TemplateReviewCreate
 *
 * Response: 200 OK
 * TemplateReviewResponse
 */

/**
 * DELETE /api/v1/marketplace/templates/:id/reviews/:reviewId
 * Delete own review
 *
 * Response: 204 No Content
 */

/**
 * POST /api/v1/marketplace/templates/:id/reviews/:reviewId/respond
 * Author responds to a review
 *
 * Request Body: {
 *   response: string
 * }
 *
 * Response: 200 OK
 * TemplateReviewResponse
 */

// ----------------------------------------------------------------------------
// ADMIN OPERATIONS (Platform Review)
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/marketplace/admin/pending-reviews
 * Get templates pending review
 *
 * Response: 200 OK
 * {
 *   data: MarketplaceTemplateResponse[]
 * }
 */

/**
 * POST /api/v1/marketplace/admin/templates/:id/approve
 * Approve a template for publication
 *
 * Request Body: {
 *   notes?: string
 * }
 *
 * Response: 200 OK
 * MarketplaceTemplateResponse
 */

/**
 * POST /api/v1/marketplace/admin/templates/:id/reject
 * Reject a template
 *
 * Request Body: {
 *   reason: string,
 *   notes?: string
 * }
 *
 * Response: 200 OK
 * MarketplaceTemplateResponse
 */
```

### 4.3 Survey APIs

#### 4.3.1 Types and Validation Schemas

```typescript
// ============================================================================
// SURVEY TYPES
// ============================================================================

import { z } from "zod";

// Enums
export const QuestionTypeSchema = z.enum([
  "RATING",
  "TEXT",
  "MULTIPLE_CHOICE",
  "MULTI_SELECT",
  "SCALE",
  "NET_PROMOTER",
  "YES_NO",
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const SurveyStatusSchema = z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]);
export type SurveyStatus = z.infer<typeof SurveyStatusSchema>;

export const ResponseStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "EXPIRED"]);
export type ResponseStatus = z.infer<typeof ResponseStatusSchema>;

// Survey Schemas
export const SurveyQuestionSchema = z.object({
  id: z.string().optional(), // Optional for creation
  questionType: QuestionTypeSchema,
  text: z.string().min(1).max(500),
  description: z.string().max(1000).optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    )
    .optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleLabels: z
    .object({
      min: z.string().optional(),
      max: z.string().optional(),
      mid: z.string().optional(),
    })
    .optional(),
  isRequired: z.boolean().default(false),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  sortOrder: z.number().default(0),
  section: z.string().optional(),
  showIf: z
    .object({
      questionId: z.string(),
      operator: z.enum(["equals", "notEquals", "contains", "greaterThan", "lessThan"]),
      value: z.any(),
    })
    .optional(),
});
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;

export const TargetFilterSchema = z.object({
  participantTypes: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  checkedIn: z.boolean().optional(),
  attendedSessions: z.array(z.string()).optional(),
  minAttendanceRate: z.number().min(0).max(100).optional(),
});
export type TargetFilter = z.infer<typeof TargetFilterSchema>;

export const SurveyCreateSchema = z.object({
  eventId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sendAfterHours: z.number().min(0).max(720).default(24),
  reminderDays: z.array(z.number().min(1).max(30)).default([3, 7]),
  closesAfterDays: z.number().min(1).max(90).default(14),
  targetFilter: TargetFilterSchema.optional(),
  thankYouMessage: z.string().max(1000).optional(),
  redirectUrl: z.string().url().optional(),
  allowAnonymous: z.boolean().default(false),
  showProgress: z.boolean().default(true),
  randomizeOrder: z.boolean().default(false),
  questions: z.array(SurveyQuestionSchema).optional(),
});
export type SurveyCreate = z.infer<typeof SurveyCreateSchema>;

export const SurveyUpdateSchema = SurveyCreateSchema.partial().omit({ eventId: true });
export type SurveyUpdate = z.infer<typeof SurveyUpdateSchema>;

export const SurveyResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: SurveyStatusSchema,
  sendAfterHours: z.number(),
  reminderDays: z.array(z.number()),
  closesAfterDays: z.number(),
  targetFilter: TargetFilterSchema.nullable(),
  thankYouMessage: z.string().nullable(),
  allowAnonymous: z.boolean(),
  showProgress: z.boolean(),
  randomizeOrder: z.boolean(),
  questions: z.array(SurveyQuestionSchema),
  responseCount: z.number(),
  completionRate: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  closedAt: z.string().datetime().nullable(),
});
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;

// Response Submission Schemas
export const AnswerSubmitSchema = z.object({
  questionId: z.string(),
  value: z.union([
    z.number(), // RATING, SCALE, NET_PROMOTER
    z.string(), // TEXT, YES_NO, MULTIPLE_CHOICE
    z.array(z.string()), // MULTI_SELECT
  ]),
});
export type AnswerSubmit = z.infer<typeof AnswerSubmitSchema>;

export const SurveySubmitSchema = z.object({
  answers: z.array(AnswerSubmitSchema),
});
export type SurveySubmit = z.infer<typeof SurveySubmitSchema>;

// Results Schemas
export const QuestionResultSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  questionType: QuestionTypeSchema,
  responseCount: z.number(),
  statistics: z.union([
    // Numeric questions (RATING, SCALE, NET_PROMOTER)
    z.object({
      type: z.literal("numeric"),
      average: z.number(),
      median: z.number(),
      mode: z.number(),
      min: z.number(),
      max: z.number(),
      standardDeviation: z.number(),
      distribution: z.array(
        z.object({
          value: z.number(),
          count: z.number(),
          percentage: z.number(),
        }),
      ),
      npsScore: z.number().optional(), // Only for NET_PROMOTER
      npsCategories: z
        .object({
          promoters: z.number(),
          passives: z.number(),
          detractors: z.number(),
        })
        .optional(),
    }),
    // Choice questions (MULTIPLE_CHOICE, MULTI_SELECT, YES_NO)
    z.object({
      type: z.literal("choice"),
      options: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          count: z.number(),
          percentage: z.number(),
        }),
      ),
    }),
    // Text questions
    z.object({
      type: z.literal("text"),
      responseCount: z.number(),
      avgLength: z.number(),
      themes: z.array(
        z.object({
          theme: z.string(),
          count: z.number(),
          sentiment: z.enum(["positive", "negative", "neutral"]),
        }),
      ),
      wordCloud: z.array(
        z.object({
          word: z.string(),
          count: z.number(),
        }),
      ),
      sampleResponses: z.array(z.string()),
    }),
  ]),
});
export type QuestionResult = z.infer<typeof QuestionResultSchema>;

export const SurveyResultsSchema = z.object({
  surveyId: z.string(),
  surveyTitle: z.string(),
  eventName: z.string(),
  totalInvited: z.number(),
  totalResponded: z.number(),
  totalCompleted: z.number(),
  responseRate: z.number(),
  completionRate: z.number(),
  averageCompletionTime: z.number(), // seconds
  overallNps: z.number().nullable(),
  overallSatisfaction: z.number().nullable(),
  questionResults: z.array(QuestionResultSchema),
  responsesByDay: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
    }),
  ),
  sentiment: z.object({
    positive: z.number(),
    negative: z.number(),
    neutral: z.number(),
  }),
});
export type SurveyResults = z.infer<typeof SurveyResultsSchema>;

// Comparison Schemas
export const SurveyComparisonSchema = z.object({
  surveys: z.array(
    z.object({
      surveyId: z.string(),
      surveyTitle: z.string(),
      eventName: z.string(),
      eventDate: z.string(),
    }),
  ),
  metrics: z.array(
    z.object({
      metric: z.string(),
      values: z.array(
        z.object({
          surveyId: z.string(),
          value: z.number(),
          change: z.number().nullable(), // % change from previous
        }),
      ),
    }),
  ),
  questionComparisons: z.array(
    z.object({
      questionText: z.string(),
      matchedQuestions: z.array(
        z.object({
          surveyId: z.string(),
          questionId: z.string(),
          average: z.number(),
          change: z.number().nullable(),
        }),
      ),
    }),
  ),
  trends: z.object({
    improvingAreas: z.array(z.string()),
    decliningAreas: z.array(z.string()),
    consistentAreas: z.array(z.string()),
  }),
});
export type SurveyComparison = z.infer<typeof SurveyComparisonSchema>;
```

#### 4.3.2 API Endpoints

```typescript
// ============================================================================
// SURVEY API ROUTES
// ============================================================================

// Base path: /api/v1/surveys

// ----------------------------------------------------------------------------
// SURVEY CRUD
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/surveys
 * List surveys for tenant
 *
 * Query Parameters:
 *   - eventId?: string
 *   - status?: SurveyStatus
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: SurveyResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/surveys
 * Create a new survey
 *
 * Request Body: SurveyCreate
 *
 * Response: 201 Created
 * SurveyResponse
 */

/**
 * GET /api/v1/surveys/:id
 * Get survey details
 *
 * Response: 200 OK
 * SurveyResponse
 */

/**
 * PATCH /api/v1/surveys/:id
 * Update survey (draft only)
 *
 * Request Body: SurveyUpdate
 *
 * Response: 200 OK
 * SurveyResponse
 */

/**
 * DELETE /api/v1/surveys/:id
 * Delete survey (draft only)
 *
 * Response: 204 No Content
 */

/**
 * POST /api/v1/surveys/:id/clone
 * Clone a survey
 *
 * Request Body: {
 *   title: string,
 *   eventId: string
 * }
 *
 * Response: 201 Created
 * SurveyResponse
 */

// ----------------------------------------------------------------------------
// SURVEY QUESTIONS
// ----------------------------------------------------------------------------

/**
 * POST /api/v1/surveys/:id/questions
 * Add a question to survey
 *
 * Request Body: SurveyQuestion
 *
 * Response: 201 Created
 * SurveyQuestion
 */

/**
 * PATCH /api/v1/surveys/:id/questions/:questionId
 * Update a question
 *
 * Request Body: Partial<SurveyQuestion>
 *
 * Response: 200 OK
 * SurveyQuestion
 */

/**
 * DELETE /api/v1/surveys/:id/questions/:questionId
 * Delete a question
 *
 * Response: 204 No Content
 */

/**
 * POST /api/v1/surveys/:id/questions/reorder
 * Reorder questions
 *
 * Request Body: {
 *   questionIds: string[] // In new order
 * }
 *
 * Response: 200 OK
 */

// ----------------------------------------------------------------------------
// SURVEY DISTRIBUTION
// ----------------------------------------------------------------------------

/**
 * POST /api/v1/surveys/:id/publish
 * Publish survey and start distribution
 *
 * Response: 200 OK
 * SurveyResponse (status: ACTIVE)
 */

/**
 * POST /api/v1/surveys/:id/close
 * Close survey for responses
 *
 * Response: 200 OK
 * SurveyResponse (status: CLOSED)
 */

/**
 * POST /api/v1/surveys/:id/distribute
 * Manually trigger distribution
 *
 * Request Body: {
 *   participantIds?: string[], // Specific participants, or all eligible
 *   sendNow?: boolean // Override sendAfterHours
 * }
 *
 * Response: 200 OK
 * {
 *   invitationsSent: number
 * }
 */

/**
 * POST /api/v1/surveys/:id/send-reminders
 * Manually send reminder to non-responders
 *
 * Response: 200 OK
 * {
 *   remindersSent: number
 * }
 */

/**
 * GET /api/v1/surveys/:id/distribution-status
 * Get distribution statistics
 *
 * Response: 200 OK
 * {
 *   totalEligible: number,
 *   invitationsSent: number,
 *   remindersSent: number,
 *   pendingResponses: number,
 *   inProgressResponses: number,
 *   completedResponses: number,
 *   expiredResponses: number
 * }
 */

// ----------------------------------------------------------------------------
// SURVEY RESPONSE (Participant-facing)
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/surveys/respond
 * Get survey for response (via token)
 *
 * Query Parameters:
 *   - token: string (accessToken)
 *
 * Response: 200 OK
 * {
 *   survey: {
 *     id: string,
 *     title: string,
 *     description: string,
 *     questions: SurveyQuestion[],
 *     showProgress: boolean
 *   },
 *   response: {
 *     id: string,
 *     status: ResponseStatus,
 *     existingAnswers: AnswerSubmit[]
 *   }
 * }
 */

/**
 * POST /api/v1/surveys/respond
 * Submit survey response
 *
 * Query Parameters:
 *   - token: string (accessToken)
 *
 * Request Body: SurveySubmit
 *
 * Response: 200 OK
 * {
 *   success: boolean,
 *   thankYouMessage: string | null,
 *   redirectUrl: string | null
 * }
 */

/**
 * POST /api/v1/surveys/respond/save
 * Auto-save partial response
 *
 * Query Parameters:
 *   - token: string (accessToken)
 *
 * Request Body: {
 *   answers: AnswerSubmit[]
 * }
 *
 * Response: 200 OK
 * {
 *   saved: boolean
 * }
 */

// ----------------------------------------------------------------------------
// RESULTS AND ANALYTICS
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/surveys/:id/results
 * Get survey results and analytics
 *
 * Response: 200 OK
 * SurveyResults
 */

/**
 * GET /api/v1/surveys/:id/results/export
 * Export results
 *
 * Query Parameters:
 *   - format: 'csv' | 'xlsx' | 'pdf'
 *   - includeRaw?: boolean // Include raw responses
 *
 * Response: 200 OK
 * Binary file download
 */

/**
 * GET /api/v1/surveys/:id/responses
 * Get individual responses
 *
 * Query Parameters:
 *   - status?: ResponseStatus
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: Array<{
 *     id: string,
 *     participantId: string | null,
 *     participantName: string | null,
 *     status: ResponseStatus,
 *     answers: AnswerSubmit[],
 *     startedAt: string,
 *     completedAt: string | null
 *   }>,
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/surveys/compare
 * Compare multiple surveys (year-over-year)
 *
 * Request Body: {
 *   surveyIds: string[]
 * }
 *
 * Response: 200 OK
 * SurveyComparison
 */

/**
 * GET /api/v1/surveys/:id/sentiment-analysis
 * Get sentiment analysis for text responses
 *
 * Response: 200 OK
 * {
 *   overallSentiment: {
 *     positive: number,
 *     negative: number,
 *     neutral: number
 *   },
 *   themes: Array<{
 *     theme: string,
 *     count: number,
 *     sentiment: 'positive' | 'negative' | 'neutral',
 *     sampleQuotes: string[]
 *   }>,
 *   keyPhrases: Array<{
 *     phrase: string,
 *     frequency: number,
 *     sentiment: 'positive' | 'negative' | 'neutral'
 *   }>,
 *   recurringIssues: Array<{
 *     issue: string,
 *     frequency: number,
 *     severity: 'low' | 'medium' | 'high'
 *   }>
 * }
 */
```

### 4.4 Certificate APIs

#### 4.4.1 Types and Validation Schemas

```typescript
// ============================================================================
// CERTIFICATE TYPES
// ============================================================================

import { z } from "zod";

// Enums
export const CertificateStatusSchema = z.enum([
  "PENDING",
  "GENERATED",
  "SENT",
  "DOWNLOADED",
  "REVOKED",
]);
export type CertificateStatus = z.infer<typeof CertificateStatusSchema>;

export const IssuanceRuleSchema = z.enum([
  "ALL_APPROVED",
  "ATTENDANCE_THRESHOLD",
  "COMPLETED_SESSIONS",
  "MANUAL",
]);
export type IssuanceRule = z.infer<typeof IssuanceRuleSchema>;

export const BatchStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export type BatchStatus = z.infer<typeof BatchStatusSchema>;

// Canvas Element Schemas
export const CanvasElementSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    content: z.string(),
    fontFamily: z.string(),
    fontSize: z.number(),
    fontWeight: z.enum(["normal", "bold"]),
    fontStyle: z.enum(["normal", "italic"]),
    color: z.string(),
    align: z.enum(["left", "center", "right"]),
    verticalAlign: z.enum(["top", "middle", "bottom"]),
    rotation: z.number().optional(),
  }),
  z.object({
    type: z.literal("image"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    src: z.string(),
    opacity: z.number().min(0).max(1),
    rotation: z.number().optional(),
  }),
  z.object({
    type: z.literal("shape"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    shape: z.enum(["rectangle", "circle", "line"]),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
    rotation: z.number().optional(),
  }),
  z.object({
    type: z.literal("qrcode"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    // QR content is auto-generated with verification URL
  }),
  z.object({
    type: z.literal("placeholder"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    field: z.enum([
      "participant.name",
      "participant.title",
      "participant.organization",
      "event.name",
      "event.date",
      "event.location",
      "certificate.number",
      "certificate.verificationCode",
      "certificate.issueDate",
      "signatory.name",
      "signatory.title",
      "attendance.percentage",
      "custom",
    ]),
    customField: z.string().optional(),
    fontFamily: z.string(),
    fontSize: z.number(),
    fontWeight: z.enum(["normal", "bold"]),
    color: z.string(),
    align: z.enum(["left", "center", "right"]),
    format: z.string().optional(), // Date format, number format, etc.
  }),
]);
export type CanvasElement = z.infer<typeof CanvasElementSchema>;

export const CanvasDataSchema = z.object({
  version: z.string(),
  background: z.object({
    color: z.string().optional(),
    image: z.string().optional(),
  }),
  elements: z.array(CanvasElementSchema),
});
export type CanvasData = z.infer<typeof CanvasDataSchema>;

// Certificate Template Schemas
export const CertificateTemplateCreateSchema = z.object({
  eventId: z.string(),
  name: z.string().min(1).max(100),
  participantType: z.string().optional(),
  pageSize: z.enum(["A4", "LETTER", "LEGAL"]).default("A4"),
  orientation: z.enum(["LANDSCAPE", "PORTRAIT"]).default("LANDSCAPE"),
  canvasData: CanvasDataSchema,
  issuanceRule: IssuanceRuleSchema.default("ALL_APPROVED"),
  attendanceThreshold: z.number().min(0).max(100).optional(),
  requiredMeetings: z.array(z.string()).optional(),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
  signatureImage: z.string().url().optional(),
  includeQrCode: z.boolean().default(true),
  qrCodePosition: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});
export type CertificateTemplateCreate = z.infer<typeof CertificateTemplateCreateSchema>;

export const CertificateTemplateUpdateSchema = CertificateTemplateCreateSchema.partial().omit({
  eventId: true,
});
export type CertificateTemplateUpdate = z.infer<typeof CertificateTemplateUpdateSchema>;

export const CertificateTemplateResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  eventId: z.string(),
  name: z.string(),
  participantType: z.string().nullable(),
  pageSize: z.string(),
  orientation: z.string(),
  canvasData: CanvasDataSchema,
  issuanceRule: IssuanceRuleSchema,
  attendanceThreshold: z.number().nullable(),
  requiredMeetings: z.array(z.string()).nullable(),
  signatoryName: z.string().nullable(),
  signatoryTitle: z.string().nullable(),
  signatureImage: z.string().nullable(),
  includeQrCode: z.boolean(),
  qrCodePosition: z.any().nullable(),
  certificateCount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CertificateTemplateResponse = z.infer<typeof CertificateTemplateResponseSchema>;

// Certificate Schemas
export const CertificateResponseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  templateName: z.string(),
  participantId: z.string(),
  participantName: z.string(),
  certificateNumber: z.string(),
  verificationCode: z.string(),
  verificationUrl: z.string(),
  pdfUrl: z.string().nullable(),
  status: CertificateStatusSchema,
  attendanceRate: z.number().nullable(),
  sessionsCompleted: z.array(z.string()).nullable(),
  generatedAt: z.string().datetime().nullable(),
  sentAt: z.string().datetime().nullable(),
  downloadCount: z.number(),
  lastDownloadAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  revokedReason: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type CertificateResponse = z.infer<typeof CertificateResponseSchema>;

// Batch Generation Schemas
export const BatchGenerateSchema = z.object({
  templateId: z.string(),
  filters: z
    .object({
      participantTypes: z.array(z.string()).optional(),
      statuses: z.array(z.string()).optional(),
      participantIds: z.array(z.string()).optional(),
    })
    .optional(),
  sendOnComplete: z.boolean().default(false),
});
export type BatchGenerate = z.infer<typeof BatchGenerateSchema>;

export const BatchResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  eventId: z.string(),
  templateId: z.string(),
  templateName: z.string(),
  status: BatchStatusSchema,
  totalCount: z.number(),
  processedCount: z.number(),
  successCount: z.number(),
  failedCount: z.number(),
  progress: z.number(), // 0-100
  filters: z.any().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  estimatedEndAt: z.string().datetime().nullable(),
  errors: z
    .array(
      z.object({
        participantId: z.string(),
        error: z.string(),
      }),
    )
    .nullable(),
  createdAt: z.string().datetime(),
});
export type BatchResponse = z.infer<typeof BatchResponseSchema>;

// Verification Schemas
export const VerificationResultSchema = z.object({
  isValid: z.boolean(),
  status: z.enum(["VALID", "REVOKED", "NOT_FOUND", "EXPIRED"]),
  certificate: z
    .object({
      certificateNumber: z.string(),
      participantName: z.string(),
      eventName: z.string(),
      eventDate: z.string(),
      issuedAt: z.string(),
      templateName: z.string(),
    })
    .nullable(),
  revocationInfo: z
    .object({
      revokedAt: z.string(),
      reason: z.string(),
    })
    .nullable(),
  organization: z
    .object({
      name: z.string(),
      logoUrl: z.string().nullable(),
    })
    .nullable(),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// Revocation Schema
export const RevokeSchema = z.object({
  reason: z.string().min(10).max(500),
});
export type Revoke = z.infer<typeof RevokeSchema>;
```

#### 4.4.2 API Endpoints

```typescript
// ============================================================================
// CERTIFICATE API ROUTES
// ============================================================================

// Base path: /api/v1/certificates

// ----------------------------------------------------------------------------
// CERTIFICATE TEMPLATES
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/certificates/templates
 * List certificate templates
 *
 * Query Parameters:
 *   - eventId?: string
 *   - participantType?: string
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: CertificateTemplateResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * POST /api/v1/certificates/templates
 * Create a certificate template
 *
 * Request Body: CertificateTemplateCreate
 *
 * Response: 201 Created
 * CertificateTemplateResponse
 */

/**
 * GET /api/v1/certificates/templates/:id
 * Get template details
 *
 * Response: 200 OK
 * CertificateTemplateResponse
 */

/**
 * PATCH /api/v1/certificates/templates/:id
 * Update a template
 *
 * Request Body: CertificateTemplateUpdate
 *
 * Response: 200 OK
 * CertificateTemplateResponse
 */

/**
 * DELETE /api/v1/certificates/templates/:id
 * Delete a template (no certificates issued)
 *
 * Response: 204 No Content
 */

/**
 * POST /api/v1/certificates/templates/:id/clone
 * Clone a template
 *
 * Request Body: {
 *   name: string,
 *   eventId?: string
 * }
 *
 * Response: 201 Created
 * CertificateTemplateResponse
 */

/**
 * POST /api/v1/certificates/templates/:id/preview
 * Preview certificate with sample data
 *
 * Request Body: {
 *   participantId?: string // Use specific participant or sample
 * }
 *
 * Response: 200 OK
 * {
 *   previewUrl: string // PDF preview URL
 * }
 */

// ----------------------------------------------------------------------------
// CERTIFICATE GENERATION
// ----------------------------------------------------------------------------

/**
 * POST /api/v1/certificates/generate
 * Generate certificate for single participant
 *
 * Request Body: {
 *   templateId: string,
 *   participantId: string,
 *   overrideRules?: boolean // Skip issuance rule check
 * }
 *
 * Response: 201 Created
 * CertificateResponse
 */

/**
 * POST /api/v1/certificates/generate-bulk
 * Start bulk certificate generation
 *
 * Request Body: BatchGenerate
 *
 * Response: 202 Accepted
 * BatchResponse
 */

/**
 * GET /api/v1/certificates/batches
 * List generation batches
 *
 * Query Parameters:
 *   - eventId?: string
 *   - status?: BatchStatus
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: BatchResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * GET /api/v1/certificates/batches/:id
 * Get batch status
 *
 * Response: 200 OK
 * BatchResponse
 */

/**
 * POST /api/v1/certificates/batches/:id/cancel
 * Cancel a running batch
 *
 * Response: 200 OK
 * BatchResponse
 */

/**
 * POST /api/v1/certificates/batches/:id/retry-failed
 * Retry failed certificates in batch
 *
 * Response: 200 OK
 * {
 *   retriedCount: number
 * }
 */

// ----------------------------------------------------------------------------
// CERTIFICATE MANAGEMENT
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/certificates
 * List issued certificates
 *
 * Query Parameters:
 *   - eventId?: string
 *   - templateId?: string
 *   - participantId?: string
 *   - status?: CertificateStatus
 *   - search?: string // Certificate number or participant name
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: CertificateResponse[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

/**
 * GET /api/v1/certificates/:id
 * Get certificate details
 *
 * Response: 200 OK
 * CertificateResponse
 */

/**
 * POST /api/v1/certificates/:id/send
 * Send certificate notification to participant
 *
 * Request Body: {
 *   channel?: 'EMAIL' | 'SMS' // Defaults to EMAIL
 *   customMessage?: string
 * }
 *
 * Response: 200 OK
 * {
 *   sent: boolean
 * }
 */

/**
 * POST /api/v1/certificates/:id/regenerate
 * Regenerate certificate PDF
 *
 * Response: 200 OK
 * CertificateResponse
 */

/**
 * POST /api/v1/certificates/:id/revoke
 * Revoke a certificate
 *
 * Request Body: RevokeSchema
 *
 * Response: 200 OK
 * CertificateResponse
 */

/**
 * GET /api/v1/certificates/:id/download
 * Download certificate PDF
 *
 * Response: 200 OK
 * Binary PDF file
 */

/**
 * GET /api/v1/certificates/:id/verifications
 * Get verification history
 *
 * Query Parameters:
 *   - page?: number
 *   - limit?: number
 *
 * Response: 200 OK
 * {
 *   data: Array<{
 *     id: string,
 *     verifiedAt: string,
 *     verifierIp: string,
 *     verifierAgent: string,
 *     wasValid: boolean
 *   }>,
 *   pagination: { page, limit, total, totalPages }
 * }
 */

// ----------------------------------------------------------------------------
// PUBLIC VERIFICATION (No Auth Required)
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/certificates/verify/:code
 * Verify certificate by code
 *
 * Path Parameters:
 *   - code: verification code or certificate number
 *
 * Response: 200 OK
 * VerificationResult
 */

/**
 * POST /api/v1/certificates/verify
 * Verify certificate (alternative endpoint)
 *
 * Request Body: {
 *   code: string // verification code or certificate number
 * }
 *
 * Response: 200 OK
 * VerificationResult
 */

// ----------------------------------------------------------------------------
// ELIGIBILITY CHECK
// ----------------------------------------------------------------------------

/**
 * GET /api/v1/certificates/eligibility
 * Check certificate eligibility for participants
 *
 * Query Parameters:
 *   - templateId: string
 *   - participantIds?: string[] // Check specific, or all
 *
 * Response: 200 OK
 * {
 *   eligible: Array<{
 *     participantId: string,
 *     participantName: string,
 *     isEligible: boolean,
 *     reason?: string,
 *     attendanceRate?: number,
 *     sessionsCompleted?: string[]
 *   }>
 * }
 */

/**
 * GET /api/v1/certificates/statistics
 * Get certificate statistics for event
 *
 * Query Parameters:
 *   - eventId: string
 *
 * Response: 200 OK
 * {
 *   total: number,
 *   byStatus: {
 *     pending: number,
 *     generated: number,
 *     sent: number,
 *     downloaded: number,
 *     revoked: number
 *   },
 *   byTemplate: Array<{
 *     templateId: string,
 *     templateName: string,
 *     count: number
 *   }>,
 *   verificationStats: {
 *     totalVerifications: number,
 *     uniqueCertificates: number,
 *     last7Days: number
 *   }
 * }
 */
```

### 4.5 SSE Events

Server-Sent Events for real-time updates across all Content and Documents subsystems.

```typescript
// ============================================================================
// SSE EVENT DEFINITIONS
// ============================================================================

// SSE Endpoint: GET /api/v1/events/stream?topics=communications,certificates,surveys,marketplace

// ----------------------------------------------------------------------------
// COMMUNICATION HUB EVENTS
// ----------------------------------------------------------------------------

interface BroadcastStatusEvent {
  type: "broadcast.status";
  payload: {
    broadcastId: string;
    status: BroadcastStatus;
    sentCount: number;
    failedCount: number;
    deliveredCount: number;
  };
}

interface DeliveryStatusEvent {
  type: "delivery.status";
  payload: {
    deliveryId: string;
    broadcastId: string;
    participantId: string;
    status: MessageStatus;
    channel: MessageChannel;
  };
}

interface BroadcastCompleteEvent {
  type: "broadcast.complete";
  payload: {
    broadcastId: string;
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    duration: number; // seconds
  };
}

interface EmergencyBroadcastEvent {
  type: "emergency.broadcast";
  payload: {
    broadcastId: string;
    eventId: string;
    subject: string;
    channels: MessageChannel[];
    recipientCount: number;
    triggeredBy: string;
  };
}

// ----------------------------------------------------------------------------
// TEMPLATE MARKETPLACE EVENTS
// ----------------------------------------------------------------------------

interface TemplatePublishedEvent {
  type: "template.published";
  payload: {
    templateId: string;
    name: string;
    category: TemplateCategory;
    authorName: string;
  };
}

interface TemplateInstalledEvent {
  type: "template.installed";
  payload: {
    installationId: string;
    templateId: string;
    templateName: string;
    eventId: string | null;
  };
}

interface TemplateUpdateAvailableEvent {
  type: "template.update_available";
  payload: {
    installationId: string;
    templateId: string;
    currentVersion: string;
    newVersion: string;
    changelog: string;
  };
}

interface TemplateReviewEvent {
  type: "template.review";
  payload: {
    templateId: string;
    reviewId: string;
    rating: number;
    reviewerName: string;
  };
}

// ----------------------------------------------------------------------------
// SURVEY EVENTS
// ----------------------------------------------------------------------------

interface SurveyResponseEvent {
  type: "survey.response";
  payload: {
    surveyId: string;
    responseId: string;
    status: ResponseStatus;
    completedCount: number;
    totalInvited: number;
  };
}

interface SurveyDistributedEvent {
  type: "survey.distributed";
  payload: {
    surveyId: string;
    invitationsSent: number;
    timestamp: string;
  };
}

interface SurveyClosedEvent {
  type: "survey.closed";
  payload: {
    surveyId: string;
    totalResponses: number;
    completionRate: number;
  };
}

interface SurveyAnalysisCompleteEvent {
  type: "survey.analysis_complete";
  payload: {
    surveyId: string;
    analysisType: string;
    overallSentiment: "positive" | "negative" | "neutral";
    npsScore: number | null;
  };
}

// ----------------------------------------------------------------------------
// CERTIFICATE EVENTS
// ----------------------------------------------------------------------------

interface CertificateGeneratedEvent {
  type: "certificate.generated";
  payload: {
    certificateId: string;
    participantId: string;
    participantName: string;
    templateName: string;
  };
}

interface CertificateBatchProgressEvent {
  type: "certificate.batch.progress";
  payload: {
    batchId: string;
    processedCount: number;
    totalCount: number;
    successCount: number;
    failedCount: number;
    progress: number;
    estimatedEndAt: string | null;
  };
}

interface CertificateBatchCompleteEvent {
  type: "certificate.batch.complete";
  payload: {
    batchId: string;
    status: BatchStatus;
    totalCount: number;
    successCount: number;
    failedCount: number;
    duration: number; // seconds
  };
}

interface CertificateVerifiedEvent {
  type: "certificate.verified";
  payload: {
    certificateId: string;
    certificateNumber: string;
    verifierIp: string;
    wasValid: boolean;
  };
}

interface CertificateRevokedEvent {
  type: "certificate.revoked";
  payload: {
    certificateId: string;
    certificateNumber: string;
    participantName: string;
    reason: string;
    revokedBy: string;
  };
}

// Union type for all events
type ContentEvent =
  | BroadcastStatusEvent
  | DeliveryStatusEvent
  | BroadcastCompleteEvent
  | EmergencyBroadcastEvent
  | TemplatePublishedEvent
  | TemplateInstalledEvent
  | TemplateUpdateAvailableEvent
  | TemplateReviewEvent
  | SurveyResponseEvent
  | SurveyDistributedEvent
  | SurveyClosedEvent
  | SurveyAnalysisCompleteEvent
  | CertificateGeneratedEvent
  | CertificateBatchProgressEvent
  | CertificateBatchCompleteEvent
  | CertificateVerifiedEvent
  | CertificateRevokedEvent;
```

### 4.6 Webhook Events

External webhook events for integration with other systems.

```typescript
// ============================================================================
// WEBHOOK EVENT DEFINITIONS
// ============================================================================

// Webhook Configuration: POST /api/v1/webhooks/configure
// {
//   url: string,
//   secret: string,
//   events: string[],
//   headers?: Record<string, string>
// }

// All webhooks include:
// - X-Webhook-Signature: HMAC-SHA256 signature
// - X-Webhook-Timestamp: ISO timestamp
// - X-Webhook-Event: Event type

// ----------------------------------------------------------------------------
// COMMUNICATION WEBHOOKS
// ----------------------------------------------------------------------------

interface WebhookBroadcastSent {
  event: "broadcast.sent";
  payload: {
    tenantId: string;
    eventId: string | null;
    broadcastId: string;
    channel: MessageChannel;
    recipientCount: number;
    sentAt: string;
  };
}

interface WebhookBroadcastComplete {
  event: "broadcast.complete";
  payload: {
    tenantId: string;
    eventId: string | null;
    broadcastId: string;
    channel: MessageChannel;
    statistics: {
      sent: number;
      delivered: number;
      bounced: number;
      failed: number;
      opened: number;
    };
    completedAt: string;
  };
}

interface WebhookDeliveryBounced {
  event: "delivery.bounced";
  payload: {
    tenantId: string;
    broadcastId: string;
    participantId: string;
    channel: MessageChannel;
    recipient: string;
    bounceType: "hard" | "soft";
    errorMessage: string;
    bouncedAt: string;
  };
}

// ----------------------------------------------------------------------------
// SURVEY WEBHOOKS
// ----------------------------------------------------------------------------

interface WebhookSurveyResponse {
  event: "survey.response.completed";
  payload: {
    tenantId: string;
    eventId: string;
    surveyId: string;
    responseId: string;
    participantId: string | null;
    completedAt: string;
    answers: Array<{
      questionId: string;
      questionText: string;
      value: any;
    }>;
  };
}

interface WebhookSurveyAnalysis {
  event: "survey.analysis.complete";
  payload: {
    tenantId: string;
    eventId: string;
    surveyId: string;
    analysisType: string;
    summary: {
      npsScore: number | null;
      averageRating: number | null;
      sentiment: {
        positive: number;
        negative: number;
        neutral: number;
      };
      responseCount: number;
      completionRate: number;
    };
    analyzedAt: string;
  };
}

// ----------------------------------------------------------------------------
// CERTIFICATE WEBHOOKS
// ----------------------------------------------------------------------------

interface WebhookCertificateIssued {
  event: "certificate.issued";
  payload: {
    tenantId: string;
    eventId: string;
    certificateId: string;
    certificateNumber: string;
    participantId: string;
    participantName: string;
    templateName: string;
    verificationUrl: string;
    issuedAt: string;
  };
}

interface WebhookCertificateBatchComplete {
  event: "certificate.batch.complete";
  payload: {
    tenantId: string;
    eventId: string;
    batchId: string;
    templateId: string;
    templateName: string;
    statistics: {
      total: number;
      success: number;
      failed: number;
    };
    completedAt: string;
  };
}

interface WebhookCertificateRevoked {
  event: "certificate.revoked";
  payload: {
    tenantId: string;
    eventId: string;
    certificateId: string;
    certificateNumber: string;
    participantId: string;
    reason: string;
    revokedBy: string;
    revokedAt: string;
  };
}

interface WebhookCertificateVerified {
  event: "certificate.verified";
  payload: {
    tenantId: string;
    certificateId: string;
    certificateNumber: string;
    verificationResult: "VALID" | "REVOKED" | "NOT_FOUND";
    verifierIp: string;
    verifiedAt: string;
  };
}

// ----------------------------------------------------------------------------
// MARKETPLACE WEBHOOKS
// ----------------------------------------------------------------------------

interface WebhookTemplateInstalled {
  event: "marketplace.template.installed";
  payload: {
    tenantId: string;
    templateId: string;
    templateName: string;
    category: TemplateCategory;
    version: string;
    eventId: string | null;
    installedAt: string;
  };
}

// Union type for all webhook events
type WebhookEvent =
  | WebhookBroadcastSent
  | WebhookBroadcastComplete
  | WebhookDeliveryBounced
  | WebhookSurveyResponse
  | WebhookSurveyAnalysis
  | WebhookCertificateIssued
  | WebhookCertificateBatchComplete
  | WebhookCertificateRevoked
  | WebhookCertificateVerified
  | WebhookTemplateInstalled;
```

---

## 5. Business Logic

This section details the core algorithms, workflows, and business rules that govern the Content and Documents module.

### 5.1 Message Delivery Pipeline

The message delivery pipeline handles multi-channel message distribution with retry logic and bounce handling.

#### 5.1.1 Message Processing Flow

```typescript
// ============================================================================
// MESSAGE DELIVERY PIPELINE
// ============================================================================

import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";

// Queue configuration
const QUEUE_NAME = "message-delivery";
const CONCURRENCY_BY_CHANNEL = {
  EMAIL: 50,
  SMS: 20,
  PUSH: 100,
  IN_APP: 200,
};

interface DeliveryJob {
  deliveryId: string;
  broadcastId: string;
  participantId: string;
  channel: MessageChannel;
  recipient: string;
  subject: string | null;
  body: string;
  isEmergency: boolean;
  priority: number;
  attempt: number;
}

export class MessageDeliveryPipeline {
  private queue: Queue<DeliveryJob>;
  private workers: Map<MessageChannel, Worker<DeliveryJob>>;
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.queue = new Queue(QUEUE_NAME, { connection: redis });
    this.workers = new Map();

    // Initialize workers per channel
    for (const channel of Object.keys(CONCURRENCY_BY_CHANNEL) as MessageChannel[]) {
      this.initializeWorker(channel);
    }
  }

  /**
   * Queue messages for a broadcast
   */
  async queueBroadcast(
    broadcast: BroadcastMessage,
    recipients: ResolvedRecipient[],
  ): Promise<void> {
    const jobs: { name: string; data: DeliveryJob; opts: any }[] = [];

    for (const recipient of recipients) {
      const deliveryId = generateId("del");

      // Create delivery record
      await prisma.messageDelivery.create({
        data: {
          id: deliveryId,
          broadcastId: broadcast.id,
          participantId: recipient.participantId,
          channel: broadcast.channel,
          recipient: recipient.address,
          status: "QUEUED",
        },
      });

      jobs.push({
        name: `deliver-${deliveryId}`,
        data: {
          deliveryId,
          broadcastId: broadcast.id,
          participantId: recipient.participantId,
          channel: broadcast.channel,
          recipient: recipient.address,
          subject: broadcast.subject,
          body: this.renderTemplate(broadcast.body, recipient.variables),
          isEmergency: broadcast.isEmergency,
          priority: broadcast.priority,
          attempt: 1,
        },
        opts: {
          priority: broadcast.isEmergency ? 1 : broadcast.priority,
          delay: broadcast.scheduledAt ? new Date(broadcast.scheduledAt).getTime() - Date.now() : 0,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 60000, // 1 minute initial
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
    }

    // Bulk add jobs
    await this.queue.addBulk(jobs);

    // Update broadcast status
    await prisma.broadcastMessage.update({
      where: { id: broadcast.id },
      data: {
        status: broadcast.scheduledAt ? "SCHEDULED" : "SENDING",
        recipientCount: recipients.length,
      },
    });
  }

  /**
   * Initialize worker for a specific channel
   */
  private initializeWorker(channel: MessageChannel): void {
    const worker = new Worker<DeliveryJob>(QUEUE_NAME, async (job) => this.processDelivery(job), {
      connection: this.redis,
      concurrency: CONCURRENCY_BY_CHANNEL[channel],
      limiter: this.getRateLimiter(channel),
    });

    worker.on("completed", (job) => this.handleCompleted(job));
    worker.on("failed", (job, err) => this.handleFailed(job, err));

    this.workers.set(channel, worker);
  }

  /**
   * Process individual delivery
   */
  private async processDelivery(job: Job<DeliveryJob>): Promise<void> {
    const { data } = job;

    // Check suppression list
    const suppressed = await this.checkSuppression(data.channel, data.recipient);
    if (suppressed) {
      await this.updateDeliveryStatus(data.deliveryId, "FAILED", {
        errorMessage: "Recipient is suppressed",
        errorCode: "SUPPRESSED",
      });
      return;
    }

    // Update status to SENDING
    await this.updateDeliveryStatus(data.deliveryId, "SENDING");

    // Get channel adapter
    const adapter = this.getChannelAdapter(data.channel);

    try {
      // Send via provider
      const result = await adapter.send({
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        priority: data.isEmergency ? "high" : "normal",
      });

      // Update with external ID
      await this.updateDeliveryStatus(data.deliveryId, "SENT", {
        externalId: result.messageId,
        sentAt: new Date(),
      });

      // Update broadcast metrics
      await this.incrementBroadcastMetric(data.broadcastId, "sentCount");
    } catch (error) {
      // Determine if retryable
      if (this.isPermanentFailure(error)) {
        await this.handlePermanentFailure(data, error);
      } else {
        throw error; // BullMQ will retry
      }
    }
  }

  /**
   * Check if recipient is suppressed
   */
  private async checkSuppression(channel: MessageChannel, recipient: string): Promise<boolean> {
    const suppression = await prisma.messageSuppression.findFirst({
      where: {
        channel,
        recipient,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return !!suppression;
  }

  /**
   * Handle permanent delivery failure
   */
  private async handlePermanentFailure(data: DeliveryJob, error: any): Promise<void> {
    const isBounce = this.isBounceError(error);

    await this.updateDeliveryStatus(data.deliveryId, isBounce ? "BOUNCED" : "FAILED", {
      errorMessage: error.message,
      errorCode: error.code,
      bouncedAt: isBounce ? new Date() : null,
    });

    // Add to suppression list for hard bounces
    if (isBounce && error.bounceType === "hard") {
      await prisma.messageSuppression.create({
        data: {
          tenantId: await this.getTenantId(data.broadcastId),
          channel: data.channel,
          recipient: data.recipient,
          reason: "HARD_BOUNCE",
          bounceType: "hard",
          bounceCode: error.code,
        },
      });
    }

    // Update broadcast metrics
    const metric = isBounce ? "bouncedCount" : "failedCount";
    await this.incrementBroadcastMetric(data.broadcastId, metric);
  }

  /**
   * Handle delivery callback from provider webhook
   */
  async handleDeliveryCallback(
    channel: MessageChannel,
    externalId: string,
    status: "delivered" | "bounced" | "opened" | "clicked",
    metadata?: any,
  ): Promise<void> {
    const delivery = await prisma.messageDelivery.findFirst({
      where: { externalId },
    });

    if (!delivery) {
      // Log webhook for unmatched delivery
      await this.logUnmatchedWebhook(channel, externalId, status, metadata);
      return;
    }

    const updates: any = {};
    let broadcastMetric: string | null = null;

    switch (status) {
      case "delivered":
        updates.status = "DELIVERED";
        updates.deliveredAt = new Date();
        broadcastMetric = "deliveredCount";
        break;
      case "bounced":
        updates.status = "BOUNCED";
        updates.bouncedAt = new Date();
        updates.errorMessage = metadata?.reason;
        broadcastMetric = "bouncedCount";

        // Add to suppression
        if (metadata?.bounceType === "hard") {
          await prisma.messageSuppression.upsert({
            where: {
              tenantId_channel_recipient: {
                tenantId: delivery.broadcast.tenantId,
                channel: delivery.channel,
                recipient: delivery.recipient,
              },
            },
            create: {
              tenantId: delivery.broadcast.tenantId,
              channel: delivery.channel,
              recipient: delivery.recipient,
              reason: "HARD_BOUNCE",
              bounceType: "hard",
            },
            update: {},
          });
        }
        break;
      case "opened":
        updates.openedAt = new Date();
        broadcastMetric = "openedCount";
        break;
      case "clicked":
        updates.clickedAt = new Date();
        break;
    }

    await prisma.messageDelivery.update({
      where: { id: delivery.id },
      data: updates,
    });

    if (broadcastMetric) {
      await this.incrementBroadcastMetric(delivery.broadcastId, broadcastMetric);
    }

    // Emit SSE event
    await this.emitDeliveryEvent(delivery, status);
  }

  /**
   * Get rate limiter configuration per channel
   */
  private getRateLimiter(channel: MessageChannel) {
    const limits = {
      EMAIL: { max: 100, duration: 1000 }, // 100/sec
      SMS: { max: 50, duration: 1000 }, // 50/sec
      PUSH: { max: 500, duration: 1000 }, // 500/sec
      IN_APP: { max: 1000, duration: 1000 }, // 1000/sec
    };
    return limits[channel];
  }

  /**
   * Template variable substitution
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const keys = key.split(".");
      let value: any = variables;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) return match;
      }
      return String(value);
    });
  }
}
```

#### 5.1.2 Audience Resolution

```typescript
// ============================================================================
// AUDIENCE RESOLUTION ENGINE
// ============================================================================

interface ResolvedRecipient {
  participantId: string;
  address: string; // Email, phone, or device token
  variables: Record<string, string>;
}

export class AudienceResolver {
  /**
   * Resolve recipients from audience filter
   */
  async resolveAudience(
    tenantId: string,
    eventId: string | null,
    channel: MessageChannel,
    filters: AudienceFilter,
  ): Promise<ResolvedRecipient[]> {
    // Build query conditions
    const where: any = {
      tenantId,
      ...(eventId && { eventId }),
    };

    if (filters.participantTypes?.length) {
      where.participantType = { in: filters.participantTypes };
    }

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters.countries?.length) {
      where.country = { in: filters.countries };
    }

    if (filters.organizations?.length) {
      where.organization = { in: filters.organizations };
    }

    if (filters.registrationDateFrom || filters.registrationDateTo) {
      where.createdAt = {};
      if (filters.registrationDateFrom) {
        where.createdAt.gte = new Date(filters.registrationDateFrom);
      }
      if (filters.registrationDateTo) {
        where.createdAt.lte = new Date(filters.registrationDateTo);
      }
    }

    if (filters.checkedIn !== undefined) {
      where.checkedInAt = filters.checkedIn ? { not: null } : null;
    }

    // Channel-specific filters
    switch (channel) {
      case "EMAIL":
        if (filters.hasEmail !== false) {
          where.email = { not: null };
        }
        break;
      case "SMS":
        if (filters.hasPhone !== false) {
          where.phone = { not: null };
        }
        break;
      case "PUSH":
        where.pushTokens = { some: {} };
        break;
    }

    // Custom field filters
    if (filters.customFields) {
      for (const [key, value] of Object.entries(filters.customFields)) {
        where.customFields = {
          path: [key],
          equals: value,
        };
      }
    }

    // Fetch participants
    const participants = await prisma.participant.findMany({
      where,
      include: {
        event: true,
        pushTokens: channel === "PUSH",
      },
    });

    // Map to recipients
    const recipients: ResolvedRecipient[] = [];

    for (const participant of participants) {
      const address = this.getRecipientAddress(participant, channel);
      if (!address) continue;

      recipients.push({
        participantId: participant.id,
        address,
        variables: this.buildVariables(participant),
      });
    }

    return recipients;
  }

  /**
   * Preview audience count without fetching all data
   */
  async previewAudience(
    tenantId: string,
    eventId: string | null,
    channel: MessageChannel,
    filters: AudienceFilter,
  ): Promise<AudiencePreviewResponse> {
    // Get counts by channel capability
    const [emailCount, smsCount, pushCount, inAppCount] = await Promise.all([
      this.countByChannel(tenantId, eventId, "EMAIL", filters),
      this.countByChannel(tenantId, eventId, "SMS", filters),
      this.countByChannel(tenantId, eventId, "PUSH", filters),
      this.countByChannel(tenantId, eventId, "IN_APP", filters),
    ]);

    // Get sample recipients
    const sampleRecipients = await this.getSampleRecipients(tenantId, eventId, channel, filters, 5);

    const totalCount = {
      EMAIL: emailCount,
      SMS: smsCount,
      PUSH: pushCount,
      IN_APP: inAppCount,
    }[channel];

    return {
      totalCount,
      byChannel: {
        email: emailCount,
        sms: smsCount,
        push: pushCount,
        inApp: inAppCount,
      },
      sampleRecipients,
    };
  }

  /**
   * Build template variables from participant
   */
  private buildVariables(participant: Participant): Record<string, string> {
    return {
      "participant.name": participant.fullName,
      "participant.firstName": participant.firstName,
      "participant.lastName": participant.lastName,
      "participant.email": participant.email || "",
      "participant.title": participant.title || "",
      "participant.organization": participant.organization || "",
      "participant.country": participant.country || "",
      "participant.badgeNumber": participant.badgeNumber || "",
      "event.name": participant.event?.name || "",
      "event.startDate": participant.event?.startDate?.toISOString() || "",
      "event.endDate": participant.event?.endDate?.toISOString() || "",
      "event.location": participant.event?.location || "",
      // Add more as needed
    };
  }

  private getRecipientAddress(participant: Participant, channel: MessageChannel): string | null {
    switch (channel) {
      case "EMAIL":
        return participant.email;
      case "SMS":
        return participant.phone;
      case "PUSH":
        return participant.pushTokens?.[0]?.token || null;
      case "IN_APP":
        return participant.id; // Use participant ID for in-app
      default:
        return null;
    }
  }
}
```

### 5.2 Template Publishing Workflow

The template publishing workflow manages the lifecycle of marketplace templates from creation to deprecation.

```typescript
// ============================================================================
// TEMPLATE PUBLISHING WORKFLOW
// ============================================================================

export class TemplatePublishingWorkflow {
  /**
   * Submit template for review
   */
  async submitForReview(templateId: string, submitterId: string): Promise<MarketplaceTemplate> {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    if (template.status !== "DRAFT") {
      throw new ValidationError("Only draft templates can be submitted for review");
    }

    // Validate template completeness
    await this.validateTemplateCompleteness(template);

    // Update status
    const updated = await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: {
        status: "IN_REVIEW",
        updatedAt: new Date(),
      },
    });

    // Notify platform reviewers
    await this.notifyReviewers(template);

    // Log audit event
    await this.logAuditEvent(templateId, "SUBMITTED_FOR_REVIEW", submitterId);

    return updated;
  }

  /**
   * Approve template for publication
   */
  async approveTemplate(
    templateId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<MarketplaceTemplate> {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    if (template.status !== "IN_REVIEW") {
      throw new ValidationError("Only templates in review can be approved");
    }

    // Create initial version if first publication
    const isFirstPublication = !template.publishedAt;
    if (isFirstPublication) {
      await prisma.templateVersion.create({
        data: {
          templateId,
          version: "1.0.0",
          changelog: "Initial release",
          templateData: template.templateData as any,
        },
      });
    }

    // Update template
    const updated = await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: {
        status: "PUBLISHED",
        publishedAt: isFirstPublication ? new Date() : template.publishedAt,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        updatedAt: new Date(),
      },
    });

    // Notify author
    await this.notifyAuthor(template, "APPROVED");

    // Emit SSE event
    await this.emitTemplatePublished(updated);

    // Log audit event
    await this.logAuditEvent(templateId, "APPROVED", reviewerId, notes);

    return updated;
  }

  /**
   * Reject template with feedback
   */
  async rejectTemplate(
    templateId: string,
    reviewerId: string,
    reason: string,
    notes?: string,
  ): Promise<MarketplaceTemplate> {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    if (template.status !== "IN_REVIEW") {
      throw new ValidationError("Only templates in review can be rejected");
    }

    // Update template back to draft
    const updated = await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: {
        status: "DRAFT",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: `Rejected: ${reason}${notes ? `\n\nNotes: ${notes}` : ""}`,
        updatedAt: new Date(),
      },
    });

    // Notify author with feedback
    await this.notifyAuthor(template, "REJECTED", reason);

    // Log audit event
    await this.logAuditEvent(templateId, "REJECTED", reviewerId, reason);

    return updated;
  }

  /**
   * Create new version of published template
   */
  async createVersion(
    templateId: string,
    version: string,
    changelog: string,
    templateData: any,
    authorId: string,
  ): Promise<TemplateVersion> {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    if (template.status !== "PUBLISHED") {
      throw new ValidationError("Only published templates can have new versions");
    }

    // Validate version increment
    const currentVersion = template.currentVersion;
    if (!this.isValidVersionIncrement(currentVersion, version)) {
      throw new ValidationError(
        `Invalid version: ${version}. Must be greater than ${currentVersion}`,
      );
    }

    // Create version record
    const newVersion = await prisma.templateVersion.create({
      data: {
        templateId,
        version,
        changelog,
        templateData,
        createdBy: authorId,
      },
    });

    // Update template with new data and version
    await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: {
        currentVersion: version,
        templateData,
        updatedAt: new Date(),
      },
    });

    // Notify installers of update
    await this.notifyInstallersOfUpdate(templateId, version, changelog);

    // Log audit event
    await this.logAuditEvent(templateId, "VERSION_CREATED", authorId, `v${version}`);

    return newVersion;
  }

  /**
   * Deprecate template
   */
  async deprecateTemplate(
    templateId: string,
    reason: string,
    replacementId?: string,
  ): Promise<MarketplaceTemplate> {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    if (template.status !== "PUBLISHED") {
      throw new ValidationError("Only published templates can be deprecated");
    }

    // Verify replacement if provided
    if (replacementId) {
      const replacement = await prisma.marketplaceTemplate.findUnique({
        where: { id: replacementId },
      });
      if (!replacement || replacement.status !== "PUBLISHED") {
        throw new ValidationError("Replacement template must be published");
      }
    }

    // Update template
    const updated = await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: {
        status: "DEPRECATED",
        deprecatedAt: new Date(),
        reviewNotes: `Deprecated: ${reason}${replacementId ? ` Replaced by: ${replacementId}` : ""}`,
        updatedAt: new Date(),
      },
    });

    // Notify installers
    await this.notifyInstallersOfDeprecation(templateId, reason, replacementId);

    return updated;
  }

  /**
   * Validate template completeness before review
   */
  private async validateTemplateCompleteness(template: MarketplaceTemplate): Promise<void> {
    const errors: string[] = [];

    if (!template.name || template.name.length < 3) {
      errors.push("Name must be at least 3 characters");
    }

    if (!template.description || template.description.length < 10) {
      errors.push("Description must be at least 10 characters");
    }

    if (!template.tags || template.tags.length < 1) {
      errors.push("At least one tag is required");
    }

    if (!template.previewImageUrl) {
      errors.push("Preview image is required");
    }

    if (!template.templateData || Object.keys(template.templateData as object).length === 0) {
      errors.push("Template data is required");
    }

    // Category-specific validation
    await this.validateCategorySpecific(template, errors);

    if (errors.length > 0) {
      throw new ValidationError(`Template incomplete: ${errors.join(", ")}`);
    }
  }

  private isValidVersionIncrement(current: string, next: string): boolean {
    const [curMajor, curMinor, curPatch] = current.split(".").map(Number);
    const [nextMajor, nextMinor, nextPatch] = next.split(".").map(Number);

    if (nextMajor > curMajor) return true;
    if (nextMajor === curMajor && nextMinor > curMinor) return true;
    if (nextMajor === curMajor && nextMinor === curMinor && nextPatch > curPatch) return true;

    return false;
  }
}
```

### 5.3 Template Installation and Conflict Resolution

```typescript
// ============================================================================
// TEMPLATE INSTALLATION ENGINE
// ============================================================================

export class TemplateInstallationEngine {
  /**
   * Check for conflicts before installation
   */
  async checkConflicts(
    templateId: string,
    tenantId: string,
    eventId?: string,
  ): Promise<ConflictCheckResponse> {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    const conflicts: Array<{
      type: "NAME" | "FIELD" | "DEPENDENCY" | "VERSION";
      message: string;
      resolution?: "RENAME" | "MERGE" | "SKIP" | "UPGRADE";
    }> = [];

    // Check for existing installation
    const existingInstallation = await prisma.templateInstallation.findFirst({
      where: {
        templateId,
        tenantId,
        eventId: eventId || null,
      },
    });

    if (existingInstallation) {
      conflicts.push({
        type: "VERSION",
        message: `Template already installed (v${existingInstallation.version})`,
        resolution: "UPGRADE",
      });
    }

    // Category-specific conflict checks
    switch (template.category) {
      case "BADGE":
        await this.checkBadgeConflicts(template, tenantId, eventId, conflicts);
        break;
      case "WORKFLOW":
        await this.checkWorkflowConflicts(template, tenantId, eventId, conflicts);
        break;
      case "FORM":
        await this.checkFormConflicts(template, tenantId, eventId, conflicts);
        break;
      case "CERTIFICATE":
        await this.checkCertificateConflicts(template, tenantId, eventId, conflicts);
        break;
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      canInstall: conflicts.every((c) => c.resolution !== undefined),
    };
  }

  /**
   * Install template
   */
  async installTemplate(
    templateId: string,
    tenantId: string,
    userId: string,
    options: {
      eventId?: string;
      version?: string;
      fork?: boolean;
    },
  ): Promise<TemplateInstallation> {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
      include: {
        versions: {
          where: options.version ? { version: options.version } : undefined,
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    if (template.status !== "PUBLISHED") {
      throw new ValidationError("Only published templates can be installed");
    }

    const version = options.version || template.currentVersion;
    const versionData = template.versions[0]?.templateData || template.templateData;

    // Create installation record
    const installation = await prisma.templateInstallation.create({
      data: {
        templateId,
        tenantId,
        eventId: options.eventId || null,
        version,
        installedBy: userId,
        isForked: options.fork || false,
        customData: options.fork ? versionData : null,
      },
    });

    // Apply template based on category
    await this.applyTemplate(template, tenantId, options.eventId, versionData, options.fork);

    // Increment usage count
    await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    // Emit SSE event
    await this.emitTemplateInstalled(installation, template);

    return installation;
  }

  /**
   * Apply template content to target context
   */
  private async applyTemplate(
    template: MarketplaceTemplate,
    tenantId: string,
    eventId: string | undefined,
    templateData: any,
    fork: boolean,
  ): Promise<void> {
    switch (template.category) {
      case "BADGE":
        await this.applyBadgeTemplate(templateData, tenantId, eventId, fork);
        break;
      case "WORKFLOW":
        await this.applyWorkflowTemplate(templateData, tenantId, eventId, fork);
        break;
      case "FORM":
        await this.applyFormTemplate(templateData, tenantId, eventId, fork);
        break;
      case "CERTIFICATE":
        await this.applyCertificateTemplate(templateData, tenantId, eventId, fork);
        break;
      case "SEATING_LAYOUT":
        await this.applySeatingTemplate(templateData, tenantId, eventId, fork);
        break;
      case "REPORT":
        await this.applyReportTemplate(templateData, tenantId, eventId, fork);
        break;
    }
  }

  /**
   * Upgrade installation to new version
   */
  async upgradeInstallation(
    installationId: string,
    targetVersion?: string,
  ): Promise<TemplateInstallation> {
    const installation = await prisma.templateInstallation.findUnique({
      where: { id: installationId },
      include: { template: true },
    });

    if (!installation) {
      throw new NotFoundError("Installation not found");
    }

    if (installation.isForked) {
      throw new ValidationError("Forked installations cannot be upgraded automatically");
    }

    const version = targetVersion || installation.template.currentVersion;

    if (version === installation.version) {
      throw new ValidationError("Already on this version");
    }

    // Get version data
    const versionRecord = await prisma.templateVersion.findUnique({
      where: {
        templateId_version: {
          templateId: installation.templateId,
          version,
        },
      },
    });

    if (!versionRecord) {
      throw new NotFoundError("Version not found");
    }

    // Apply upgraded template
    await this.applyTemplate(
      installation.template,
      installation.tenantId,
      installation.eventId || undefined,
      versionRecord.templateData,
      false,
    );

    // Update installation record
    const updated = await prisma.templateInstallation.update({
      where: { id: installationId },
      data: {
        version,
        hasUpdate: false,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  private async checkBadgeConflicts(
    template: MarketplaceTemplate,
    tenantId: string,
    eventId: string | undefined,
    conflicts: any[],
  ): Promise<void> {
    const templateData = template.templateData as any;

    // Check for badge template name conflicts
    const existingBadge = await prisma.badgeTemplate.findFirst({
      where: {
        tenantId,
        eventId: eventId || null,
        name: templateData.name,
      },
    });

    if (existingBadge) {
      conflicts.push({
        type: "NAME",
        message: `Badge template "${templateData.name}" already exists`,
        resolution: "RENAME",
      });
    }
  }
}
```

### 5.4 Survey Auto-Distribution

```typescript
// ============================================================================
// SURVEY AUTO-DISTRIBUTION ENGINE
// ============================================================================

export class SurveyDistributionEngine {
  private communicationHub: MessageDeliveryPipeline;

  /**
   * Process survey distribution triggers
   */
  async processTriggers(): Promise<void> {
    // Find surveys ready for distribution
    const surveys = await prisma.survey.findMany({
      where: {
        status: "ACTIVE",
        publishedAt: { not: null },
      },
      include: {
        event: true,
        responses: {
          select: { participantId: true },
        },
      },
    });

    for (const survey of surveys) {
      await this.checkAndDistribute(survey);
    }
  }

  /**
   * Check if survey should be distributed and send invitations
   */
  private async checkAndDistribute(
    survey: Survey & { event: Event; responses: { participantId: string }[] },
  ): Promise<void> {
    // Check if event has ended
    if (!survey.event.endDate || survey.event.endDate > new Date()) {
      return;
    }

    // Calculate distribution time
    const distributionTime = new Date(survey.event.endDate);
    distributionTime.setHours(distributionTime.getHours() + survey.sendAfterHours);

    if (distributionTime > new Date()) {
      return; // Not yet time to distribute
    }

    // Check close date
    const closeDate = new Date(distributionTime);
    closeDate.setDate(closeDate.getDate() + survey.closesAfterDays);

    if (closeDate < new Date()) {
      // Auto-close survey
      await this.closeSurvey(survey.id);
      return;
    }

    // Get eligible participants
    const eligibleParticipants = await this.getEligibleParticipants(survey);

    // Filter out those who already have responses
    const existingResponseIds = new Set(survey.responses.map((r) => r.participantId));
    const newParticipants = eligibleParticipants.filter((p) => !existingResponseIds.has(p.id));

    if (newParticipants.length === 0) {
      return;
    }

    // Create response records and send invitations
    await this.distributeToParticipants(survey, newParticipants);
  }

  /**
   * Get participants eligible for survey based on targetFilter
   */
  private async getEligibleParticipants(survey: Survey): Promise<Participant[]> {
    const where: any = {
      eventId: survey.eventId,
    };

    const filters = survey.targetFilter as TargetFilter;

    if (filters?.participantTypes?.length) {
      where.participantType = { in: filters.participantTypes };
    }

    if (filters?.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters?.countries?.length) {
      where.country = { in: filters.countries };
    }

    if (filters?.checkedIn !== undefined) {
      where.checkedInAt = filters.checkedIn ? { not: null } : null;
    }

    if (filters?.attendedSessions?.length) {
      // Filter by session attendance
      where.sessionAttendances = {
        some: {
          sessionId: { in: filters.attendedSessions },
          status: "ATTENDED",
        },
      };
    }

    if (filters?.minAttendanceRate !== undefined) {
      // This requires a subquery or post-filtering
      // For simplicity, we'll post-filter
    }

    // Must have email for survey invitation
    where.email = { not: null };

    const participants = await prisma.participant.findMany({
      where,
      include: {
        sessionAttendances: filters?.minAttendanceRate !== undefined,
      },
    });

    // Post-filter by attendance rate if needed
    if (filters?.minAttendanceRate !== undefined) {
      const totalSessions = await prisma.session.count({
        where: { eventId: survey.eventId },
      });

      return participants.filter((p) => {
        const attendedCount =
          p.sessionAttendances?.filter((a) => a.status === "ATTENDED").length || 0;
        const rate = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;
        return rate >= filters.minAttendanceRate!;
      });
    }

    return participants;
  }

  /**
   * Distribute survey to participants
   */
  private async distributeToParticipants(
    survey: Survey,
    participants: Participant[],
  ): Promise<void> {
    const baseUrl = process.env.APP_URL;

    for (const participant of participants) {
      // Generate unique access token
      const accessToken = generateSecureToken(32);
      const surveyUrl = `${baseUrl}/surveys/respond?token=${accessToken}`;

      // Create response record
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          participantId: participant.id,
          accessToken,
          status: "PENDING",
        },
      });

      // Send invitation email
      await this.sendInvitation(survey, participant, surveyUrl);
    }

    // Emit distribution event
    await this.emitDistributionEvent(survey.id, participants.length);
  }

  /**
   * Send survey invitation
   */
  private async sendInvitation(
    survey: Survey,
    participant: Participant,
    surveyUrl: string,
  ): Promise<void> {
    const template = await this.getSurveyInvitationTemplate(survey.tenantId);

    const variables = {
      "participant.name": participant.fullName,
      "participant.firstName": participant.firstName,
      "survey.title": survey.title,
      "survey.url": surveyUrl,
      "survey.deadline": this.calculateDeadline(survey),
    };

    await this.communicationHub.queueSingleMessage({
      tenantId: survey.tenantId,
      participantId: participant.id,
      channel: "EMAIL",
      recipient: participant.email!,
      subject: template.subject,
      body: this.renderTemplate(template.body, variables),
    });
  }

  private calculateDeadline(survey: Survey): string {
    const event = survey.event || { endDate: new Date() };
    const deadline = new Date(event.endDate as Date);
    deadline.setHours(deadline.getHours() + survey.sendAfterHours);
    deadline.setDate(deadline.getDate() + survey.closesAfterDays);
    return deadline.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
```

### 5.5 Survey Reminder Engine

```typescript
// ============================================================================
// SURVEY REMINDER ENGINE
// ============================================================================

export class SurveyReminderEngine {
  /**
   * Process reminders for active surveys
   */
  async processReminders(): Promise<void> {
    const activeSurveys = await prisma.survey.findMany({
      where: { status: "ACTIVE" },
      include: { event: true },
    });

    for (const survey of activeSurveys) {
      await this.processSurveyReminders(survey);
    }
  }

  /**
   * Process reminders for a specific survey
   */
  private async processSurveyReminders(survey: Survey & { event: Event }): Promise<void> {
    // Calculate days since distribution
    const distributionTime = new Date(survey.event.endDate!);
    distributionTime.setHours(distributionTime.getHours() + survey.sendAfterHours);

    const daysSinceDistribution = Math.floor(
      (Date.now() - distributionTime.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check if today is a reminder day
    if (!survey.reminderDays.includes(daysSinceDistribution)) {
      return;
    }

    // Get pending responses that haven't received this reminder
    const pendingResponses = await prisma.surveyResponse.findMany({
      where: {
        surveyId: survey.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        remindersSent: { lt: survey.reminderDays.indexOf(daysSinceDistribution) + 1 },
      },
      include: {
        participant: true,
      },
    });

    // Send reminders
    for (const response of pendingResponses) {
      await this.sendReminder(survey, response);
    }
  }

  /**
   * Send reminder to participant
   */
  private async sendReminder(
    survey: Survey,
    response: SurveyResponse & { participant: Participant },
  ): Promise<void> {
    const baseUrl = process.env.APP_URL;
    const surveyUrl = `${baseUrl}/surveys/respond?token=${response.accessToken}`;

    const template = await this.getSurveyReminderTemplate(survey.tenantId);

    const variables = {
      "participant.name": response.participant.fullName,
      "participant.firstName": response.participant.firstName,
      "survey.title": survey.title,
      "survey.url": surveyUrl,
      "survey.deadline": this.calculateDeadline(survey),
      "reminder.number": String(response.remindersSent + 1),
    };

    await this.communicationHub.queueSingleMessage({
      tenantId: survey.tenantId,
      participantId: response.participantId!,
      channel: "EMAIL",
      recipient: response.participant.email!,
      subject: template.subject,
      body: this.renderTemplate(template.body, variables),
    });

    // Update reminder count
    await prisma.surveyResponse.update({
      where: { id: response.id },
      data: {
        remindersSent: response.remindersSent + 1,
        lastReminderAt: new Date(),
      },
    });
  }
}
```

### 5.6 Sentiment Analysis Pipeline

```typescript
// ============================================================================
// SENTIMENT ANALYSIS PIPELINE
// ============================================================================

interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  keywords: string[];
}

interface ThemeResult {
  theme: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
  sampleQuotes: string[];
}

export class SentimentAnalysisPipeline {
  /**
   * Analyze text responses for a survey
   */
  async analyzeSurvey(surveyId: string): Promise<SurveyAnalysis> {
    // Get all text responses
    const textAnswers = await prisma.surveyAnswer.findMany({
      where: {
        response: { surveyId },
        question: { questionType: "TEXT" },
        textValue: { not: null },
      },
      include: {
        question: true,
      },
    });

    if (textAnswers.length === 0) {
      return this.createEmptyAnalysis(surveyId);
    }

    // Analyze each response
    const sentimentResults: SentimentResult[] = [];
    const allKeywords: string[] = [];

    for (const answer of textAnswers) {
      const result = await this.analyzeText(answer.textValue!);
      sentimentResults.push(result);
      allKeywords.push(...result.keywords);
    }

    // Aggregate sentiment
    const sentimentCounts = {
      positive: sentimentResults.filter((r) => r.sentiment === "positive").length,
      negative: sentimentResults.filter((r) => r.sentiment === "negative").length,
      neutral: sentimentResults.filter((r) => r.sentiment === "neutral").length,
    };

    // Extract themes
    const themes = await this.extractThemes(textAnswers, sentimentResults);

    // Build word cloud
    const wordCloud = this.buildWordCloud(allKeywords);

    // Identify recurring issues
    const recurringIssues = await this.identifyRecurringIssues(textAnswers, sentimentResults);

    // Save analysis
    const analysis = await prisma.surveyAnalysis.create({
      data: {
        surveyId,
        analysisType: "SENTIMENT",
        results: {
          overallSentiment: sentimentCounts,
          themes,
          wordCloud,
          recurringIssues,
          analyzedCount: textAnswers.length,
        },
      },
    });

    return analysis;
  }

  /**
   * Analyze individual text
   */
  private async analyzeText(text: string): Promise<SentimentResult> {
    // Simple rule-based sentiment analysis
    // In production, use Azure Cognitive Services or similar

    const positiveWords = new Set([
      "excellent",
      "great",
      "amazing",
      "wonderful",
      "fantastic",
      "love",
      "best",
      "outstanding",
      "perfect",
      "helpful",
      "enjoyable",
      "impressed",
      "recommend",
      "satisfied",
      "happy",
      "pleased",
      "valuable",
      "useful",
    ]);

    const negativeWords = new Set([
      "poor",
      "bad",
      "terrible",
      "awful",
      "horrible",
      "hate",
      "worst",
      "disappointed",
      "frustrating",
      "confusing",
      "boring",
      "waste",
      "difficult",
      "problem",
      "issue",
      "unhappy",
      "dissatisfied",
      "improve",
    ]);

    const words = text.toLowerCase().split(/\W+/);
    let positiveScore = 0;
    let negativeScore = 0;
    const keywords: string[] = [];

    for (const word of words) {
      if (positiveWords.has(word)) {
        positiveScore++;
        keywords.push(word);
      } else if (negativeWords.has(word)) {
        negativeScore++;
        keywords.push(word);
      }
    }

    const totalScore = positiveScore + negativeScore;
    let sentiment: "positive" | "negative" | "neutral";
    let confidence: number;

    if (totalScore === 0) {
      sentiment = "neutral";
      confidence = 0.5;
    } else if (positiveScore > negativeScore) {
      sentiment = "positive";
      confidence = positiveScore / totalScore;
    } else if (negativeScore > positiveScore) {
      sentiment = "negative";
      confidence = negativeScore / totalScore;
    } else {
      sentiment = "neutral";
      confidence = 0.5;
    }

    return { sentiment, confidence, keywords };
  }

  /**
   * Extract themes from responses
   */
  private async extractThemes(
    answers: (SurveyAnswer & { question: SurveyQuestion })[],
    sentiments: SentimentResult[],
  ): Promise<ThemeResult[]> {
    // Group by question for context
    const byQuestion = new Map<string, { text: string; sentiment: SentimentResult }[]>();

    for (let i = 0; i < answers.length; i++) {
      const questionId = answers[i].questionId;
      if (!byQuestion.has(questionId)) {
        byQuestion.set(questionId, []);
      }
      byQuestion.get(questionId)!.push({
        text: answers[i].textValue!,
        sentiment: sentiments[i],
      });
    }

    // Extract common themes using keyword clustering
    const themes: ThemeResult[] = [];
    const themeClusters = new Map<string, { count: number; sentiment: number; quotes: string[] }>();

    // Common theme keywords to look for
    const themeKeywords = {
      registration: ["registration", "sign up", "register", "check-in", "checkin"],
      venue: ["venue", "location", "room", "space", "building", "facility"],
      food: ["food", "catering", "lunch", "coffee", "refreshment", "meal"],
      networking: ["networking", "connect", "meet", "social", "interaction"],
      speakers: ["speaker", "presentation", "session", "talk", "keynote"],
      organization: ["organization", "organized", "schedule", "timing", "logistics"],
      technology: ["app", "website", "technology", "tech", "digital", "platform"],
      content: ["content", "topics", "agenda", "program", "workshop"],
    };

    for (const [, responses] of byQuestion) {
      for (const { text, sentiment } of responses) {
        const lowerText = text.toLowerCase();

        for (const [theme, keywords] of Object.entries(themeKeywords)) {
          if (keywords.some((k) => lowerText.includes(k))) {
            if (!themeClusters.has(theme)) {
              themeClusters.set(theme, { count: 0, sentiment: 0, quotes: [] });
            }
            const cluster = themeClusters.get(theme)!;
            cluster.count++;
            cluster.sentiment +=
              sentiment.sentiment === "positive" ? 1 : sentiment.sentiment === "negative" ? -1 : 0;
            if (cluster.quotes.length < 3) {
              cluster.quotes.push(text.substring(0, 200));
            }
          }
        }
      }
    }

    // Convert to results
    for (const [theme, data] of themeClusters) {
      if (data.count >= 2) {
        // Minimum threshold
        themes.push({
          theme,
          count: data.count,
          sentiment: data.sentiment > 0 ? "positive" : data.sentiment < 0 ? "negative" : "neutral",
          sampleQuotes: data.quotes,
        });
      }
    }

    return themes.sort((a, b) => b.count - a.count);
  }

  /**
   * Build word cloud data
   */
  private buildWordCloud(keywords: string[]): Array<{ word: string; count: number }> {
    const counts = new Map<string, number>();

    for (const word of keywords) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }

  /**
   * Identify recurring issues
   */
  private async identifyRecurringIssues(
    answers: (SurveyAnswer & { question: SurveyQuestion })[],
    sentiments: SentimentResult[],
  ): Promise<Array<{ issue: string; frequency: number; severity: "low" | "medium" | "high" }>> {
    // Focus on negative sentiments
    const negativeResponses = answers.filter((_, i) => sentiments[i].sentiment === "negative");

    if (negativeResponses.length < 2) {
      return [];
    }

    // Extract common phrases from negative responses
    const issues: Array<{ issue: string; frequency: number; severity: "low" | "medium" | "high" }> =
      [];

    // Look for common complaint patterns
    const issuePatterns = [
      { pattern: /too (long|short|crowded|expensive)/gi, extract: (m: RegExpMatchArray) => m[0] },
      {
        pattern: /not enough (time|space|food|information)/gi,
        extract: (m: RegExpMatchArray) => m[0],
      },
      {
        pattern: /difficult to (find|navigate|understand|access)/gi,
        extract: (m: RegExpMatchArray) => m[0],
      },
      { pattern: /should (have|be|provide)/gi, extract: (m: RegExpMatchArray) => m[0] },
      {
        pattern: /improve(d|ment)? (the|on)/gi,
        extract: (m: RegExpMatchArray) => "needs improvement",
      },
    ];

    const issueCounts = new Map<string, number>();

    for (const answer of negativeResponses) {
      for (const { pattern, extract } of issuePatterns) {
        const matches = answer.textValue!.matchAll(pattern);
        for (const match of matches) {
          const issue = extract(match);
          issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
        }
      }
    }

    const totalNegative = negativeResponses.length;

    for (const [issue, count] of issueCounts) {
      if (count >= 2) {
        const frequency = count / totalNegative;
        issues.push({
          issue,
          frequency: count,
          severity: frequency > 0.3 ? "high" : frequency > 0.15 ? "medium" : "low",
        });
      }
    }

    return issues.sort((a, b) => b.frequency - a.frequency);
  }
}
```

### 5.7 Year-over-Year Survey Comparison

```typescript
// ============================================================================
// YEAR-OVER-YEAR COMPARISON ENGINE
// ============================================================================

export class SurveyComparisonEngine {
  /**
   * Compare multiple surveys across editions
   */
  async compareSurveys(surveyIds: string[]): Promise<SurveyComparison> {
    if (surveyIds.length < 2) {
      throw new ValidationError("At least 2 surveys required for comparison");
    }

    // Load surveys with results
    const surveys = await prisma.survey.findMany({
      where: { id: { in: surveyIds } },
      include: {
        event: true,
        questions: true,
        responses: {
          where: { status: "COMPLETED" },
          include: { answers: true },
        },
      },
      orderBy: { event: { startDate: "asc" } },
    });

    // Match questions across surveys
    const questionMatches = this.matchQuestions(surveys);

    // Calculate metrics for each survey
    const surveyMetrics = await Promise.all(surveys.map((s) => this.calculateSurveyMetrics(s)));

    // Build comparison
    const comparison: SurveyComparison = {
      surveys: surveys.map((s) => ({
        surveyId: s.id,
        surveyTitle: s.title,
        eventName: s.event.name,
        eventDate: s.event.startDate?.toISOString() || "",
      })),
      metrics: this.buildMetricsComparison(surveys, surveyMetrics),
      questionComparisons: this.buildQuestionComparisons(surveys, questionMatches),
      trends: this.analyzeTrends(surveys, surveyMetrics, questionMatches),
    };

    // Save comparison analysis
    await prisma.surveyAnalysis.create({
      data: {
        surveyId: surveys[0].id,
        analysisType: "COMPARISON",
        comparisonSurveyId: surveys[surveys.length - 1].id,
        results: comparison,
      },
    });

    return comparison;
  }

  /**
   * Match similar questions across surveys
   */
  private matchQuestions(surveys: Survey[]): Map<string, string[]> {
    const matches = new Map<string, string[]>(); // canonical text -> [questionIds]

    for (const survey of surveys) {
      for (const question of survey.questions) {
        // Normalize question text for matching
        const normalized = this.normalizeQuestionText(question.text);

        // Find existing match
        let matched = false;
        for (const [canonical, ids] of matches) {
          if (this.questionsMatch(canonical, normalized)) {
            ids.push(question.id);
            matched = true;
            break;
          }
        }

        if (!matched) {
          matches.set(normalized, [question.id]);
        }
      }
    }

    // Filter to questions that appear in multiple surveys
    return new Map(Array.from(matches.entries()).filter(([, ids]) => ids.length >= 2));
  }

  /**
   * Normalize question text for comparison
   */
  private normalizeQuestionText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Check if two question texts are similar enough
   */
  private questionsMatch(text1: string, text2: string): boolean {
    // Simple similarity check
    const words1 = new Set(text1.split(" "));
    const words2 = new Set(text2.split(" "));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    const jaccard = intersection.size / union.size;
    return jaccard > 0.7; // 70% similarity threshold
  }

  /**
   * Calculate metrics for a single survey
   */
  private async calculateSurveyMetrics(survey: Survey): Promise<Record<string, number>> {
    const responses = survey.responses;
    const completedCount = responses.length;

    // Calculate NPS if applicable
    const npsQuestion = survey.questions.find((q) => q.questionType === "NET_PROMOTER");
    let npsScore: number | null = null;

    if (npsQuestion) {
      const npsAnswers = responses
        .flatMap((r) => r.answers)
        .filter((a) => a.questionId === npsQuestion.id && a.numericValue !== null);

      if (npsAnswers.length > 0) {
        const promoters = npsAnswers.filter((a) => a.numericValue! >= 9).length;
        const detractors = npsAnswers.filter((a) => a.numericValue! <= 6).length;
        npsScore = ((promoters - detractors) / npsAnswers.length) * 100;
      }
    }

    // Calculate overall satisfaction (average of all rating questions)
    const ratingQuestions = survey.questions.filter((q) =>
      ["RATING", "SCALE"].includes(q.questionType),
    );

    let avgSatisfaction: number | null = null;
    if (ratingQuestions.length > 0) {
      const ratingAnswers = responses
        .flatMap((r) => r.answers)
        .filter(
          (a) => ratingQuestions.some((q) => q.id === a.questionId) && a.numericValue !== null,
        );

      if (ratingAnswers.length > 0) {
        avgSatisfaction =
          ratingAnswers.reduce((sum, a) => sum + a.numericValue!, 0) / ratingAnswers.length;
      }
    }

    // Response rate
    const totalInvited = await prisma.surveyResponse.count({
      where: { surveyId: survey.id },
    });
    const responseRate = totalInvited > 0 ? (completedCount / totalInvited) * 100 : 0;

    return {
      responseCount: completedCount,
      responseRate,
      npsScore: npsScore || 0,
      avgSatisfaction: avgSatisfaction || 0,
    };
  }

  /**
   * Build metrics comparison across surveys
   */
  private buildMetricsComparison(
    surveys: Survey[],
    metrics: Record<string, number>[],
  ): SurveyComparison["metrics"] {
    const metricNames = ["responseRate", "npsScore", "avgSatisfaction", "responseCount"];

    return metricNames.map((metric) => ({
      metric,
      values: surveys.map((survey, i) => {
        const value = metrics[i][metric];
        const previousValue = i > 0 ? metrics[i - 1][metric] : null;
        const change =
          previousValue !== null && previousValue !== 0
            ? ((value - previousValue) / previousValue) * 100
            : null;

        return {
          surveyId: survey.id,
          value,
          change,
        };
      }),
    }));
  }

  /**
   * Build question-level comparisons
   */
  private buildQuestionComparisons(
    surveys: Survey[],
    questionMatches: Map<string, string[]>,
  ): SurveyComparison["questionComparisons"] {
    const comparisons: SurveyComparison["questionComparisons"] = [];

    for (const [questionText, questionIds] of questionMatches) {
      const matchedQuestions: Array<{
        surveyId: string;
        questionId: string;
        average: number;
        change: number | null;
      }> = [];

      let previousAvg: number | null = null;

      for (const survey of surveys) {
        const question = survey.questions.find((q) => questionIds.includes(q.id));
        if (!question) continue;

        // Calculate average for this question
        const answers = survey.responses
          .flatMap((r) => r.answers)
          .filter((a) => a.questionId === question.id && a.numericValue !== null);

        if (answers.length === 0) continue;

        const avg = answers.reduce((sum, a) => sum + a.numericValue!, 0) / answers.length;
        const change = previousAvg !== null ? ((avg - previousAvg) / previousAvg) * 100 : null;

        matchedQuestions.push({
          surveyId: survey.id,
          questionId: question.id,
          average: avg,
          change,
        });

        previousAvg = avg;
      }

      if (matchedQuestions.length >= 2) {
        comparisons.push({
          questionText,
          matchedQuestions,
        });
      }
    }

    return comparisons;
  }

  /**
   * Analyze trends across surveys
   */
  private analyzeTrends(
    surveys: Survey[],
    metrics: Record<string, number>[],
    questionMatches: Map<string, string[]>,
  ): SurveyComparison["trends"] {
    const improvingAreas: string[] = [];
    const decliningAreas: string[] = [];
    const consistentAreas: string[] = [];

    // Analyze metric trends
    const metricTrends = {
      npsScore: this.calculateTrend(metrics.map((m) => m.npsScore)),
      avgSatisfaction: this.calculateTrend(metrics.map((m) => m.avgSatisfaction)),
      responseRate: this.calculateTrend(metrics.map((m) => m.responseRate)),
    };

    for (const [metric, trend] of Object.entries(metricTrends)) {
      if (trend > 0.05) {
        improvingAreas.push(this.formatMetricName(metric));
      } else if (trend < -0.05) {
        decliningAreas.push(this.formatMetricName(metric));
      } else {
        consistentAreas.push(this.formatMetricName(metric));
      }
    }

    return {
      improvingAreas,
      decliningAreas,
      consistentAreas,
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private formatMetricName(metric: string): string {
    const names: Record<string, string> = {
      npsScore: "Net Promoter Score",
      avgSatisfaction: "Overall Satisfaction",
      responseRate: "Response Rate",
    };
    return names[metric] || metric;
  }
}
```

### 5.8 Certificate Conditional Issuance Engine

```typescript
// ============================================================================
// CERTIFICATE CONDITIONAL ISSUANCE ENGINE
// ============================================================================

export class CertificateIssuanceEngine {
  /**
   * Check eligibility for certificate issuance
   */
  async checkEligibility(
    template: CertificateTemplate,
    participantId: string,
  ): Promise<{
    isEligible: boolean;
    reason?: string;
    attendanceRate?: number;
    sessionsCompleted?: string[];
  }> {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        sessionAttendances: {
          where: { status: "ATTENDED" },
          include: { session: true },
        },
      },
    });

    if (!participant) {
      return { isEligible: false, reason: "Participant not found" };
    }

    // Check participant type filter
    if (template.participantType && participant.participantType !== template.participantType) {
      return {
        isEligible: false,
        reason: `Certificate is for ${template.participantType} participants only`,
      };
    }

    // Apply issuance rule
    switch (template.issuanceRule) {
      case "ALL_APPROVED":
        return this.checkAllApproved(participant);

      case "ATTENDANCE_THRESHOLD":
        return this.checkAttendanceThreshold(template, participant);

      case "COMPLETED_SESSIONS":
        return this.checkCompletedSessions(template, participant);

      case "MANUAL":
        return {
          isEligible: false,
          reason: "Certificate requires manual issuance",
        };

      default:
        return { isEligible: false, reason: "Unknown issuance rule" };
    }
  }

  /**
   * ALL_APPROVED: Issue to all approved participants
   */
  private async checkAllApproved(participant: Participant): Promise<{
    isEligible: boolean;
    reason?: string;
  }> {
    if (participant.status !== "APPROVED") {
      return {
        isEligible: false,
        reason: `Participant status is ${participant.status}, must be APPROVED`,
      };
    }

    return { isEligible: true };
  }

  /**
   * ATTENDANCE_THRESHOLD: Check minimum attendance percentage
   */
  private async checkAttendanceThreshold(
    template: CertificateTemplate,
    participant: Participant & { sessionAttendances: any[] },
  ): Promise<{
    isEligible: boolean;
    reason?: string;
    attendanceRate?: number;
  }> {
    // Get total sessions for the event
    const totalSessions = await prisma.session.count({
      where: { eventId: template.eventId },
    });

    if (totalSessions === 0) {
      return { isEligible: true, attendanceRate: 100 };
    }

    const attendedCount = participant.sessionAttendances.length;
    const attendanceRate = (attendedCount / totalSessions) * 100;

    const threshold = template.attendanceThreshold || 0;

    if (attendanceRate < threshold) {
      return {
        isEligible: false,
        reason: `Attendance ${attendanceRate.toFixed(1)}% is below required ${threshold}%`,
        attendanceRate,
      };
    }

    return { isEligible: true, attendanceRate };
  }

  /**
   * COMPLETED_SESSIONS: Check specific session attendance
   */
  private async checkCompletedSessions(
    template: CertificateTemplate,
    participant: Participant & { sessionAttendances: any[] },
  ): Promise<{
    isEligible: boolean;
    reason?: string;
    sessionsCompleted?: string[];
  }> {
    const requiredSessionIds = (template.requiredMeetings as string[]) || [];

    if (requiredSessionIds.length === 0) {
      return { isEligible: true, sessionsCompleted: [] };
    }

    const attendedSessionIds = new Set(participant.sessionAttendances.map((a) => a.sessionId));

    const completedSessions = requiredSessionIds.filter((id) => attendedSessionIds.has(id));
    const missingSessions = requiredSessionIds.filter((id) => !attendedSessionIds.has(id));

    if (missingSessions.length > 0) {
      // Get session names for better error message
      const missingNames = await prisma.session.findMany({
        where: { id: { in: missingSessions } },
        select: { name: true },
      });

      return {
        isEligible: false,
        reason: `Missing required sessions: ${missingNames.map((s) => s.name).join(", ")}`,
        sessionsCompleted: completedSessions,
      };
    }

    return { isEligible: true, sessionsCompleted: completedSessions };
  }

  /**
   * Generate certificate for eligible participant
   */
  async generateCertificate(
    template: CertificateTemplate,
    participantId: string,
    overrideRules: boolean = false,
  ): Promise<Certificate> {
    // Check eligibility unless overriding
    if (!overrideRules) {
      const eligibility = await this.checkEligibility(template, participantId);
      if (!eligibility.isEligible) {
        throw new ValidationError(`Not eligible: ${eligibility.reason}`);
      }
    }

    // Check for existing certificate
    const existing = await prisma.certificate.findFirst({
      where: {
        templateId: template.id,
        participantId,
        status: { not: "REVOKED" },
      },
    });

    if (existing) {
      throw new ValidationError("Certificate already exists for this participant");
    }

    // Generate unique identifiers
    const certificateNumber = await this.generateCertificateNumber(template);
    const verificationCode = this.generateVerificationCode();
    const qrPayload = this.generateQrPayload(certificateNumber, verificationCode);
    const verificationUrl = `${process.env.APP_URL}/verify/${verificationCode}`;

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        templateId: template.id,
        participantId,
        certificateNumber,
        verificationCode,
        verificationUrl,
        qrPayload,
        status: "PENDING",
      },
    });

    // Generate PDF
    const pdfUrl = await this.generatePdf(certificate, template);

    // Update with PDF URL
    const updated = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        pdfUrl,
        status: "GENERATED",
        generatedAt: new Date(),
      },
    });

    // Emit SSE event
    await this.emitCertificateGenerated(updated);

    return updated;
  }

  /**
   * Generate unique certificate number
   */
  private async generateCertificateNumber(template: CertificateTemplate): Promise<string> {
    const prefix = "CERT";
    const eventCode = template.eventId.substring(0, 4).toUpperCase();
    const year = new Date().getFullYear();

    // Get next sequence number
    const count = await prisma.certificate.count({
      where: { templateId: template.id },
    });

    const sequence = String(count + 1).padStart(5, "0");

    return `${prefix}-${eventCode}-${year}-${sequence}`;
  }

  /**
   * Generate short verification code
   */
  private generateVerificationCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate QR payload with signature
   */
  private generateQrPayload(certificateNumber: string, verificationCode: string): string {
    const data = {
      cert: certificateNumber,
      code: verificationCode,
      ts: Date.now(),
    };

    const payload = Buffer.from(JSON.stringify(data)).toString("base64");
    const signature = this.signPayload(payload);

    return `${payload}.${signature}`;
  }

  private signPayload(payload: string): string {
    const secret = process.env.CERTIFICATE_SIGNING_SECRET!;
    return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  }
}
```

### 5.9 Bulk Certificate Generation Pipeline

```typescript
// ============================================================================
// BULK CERTIFICATE GENERATION PIPELINE
// ============================================================================

const MAX_CONCURRENT_WORKERS = 10;

export class BulkCertificateGenerator {
  private issuanceEngine: CertificateIssuanceEngine;
  private pdfGenerator: CertificatePdfGenerator;

  /**
   * Start bulk generation job
   */
  async startBulkGeneration(
    templateId: string,
    filters?: { participantTypes?: string[]; statuses?: string[]; participantIds?: string[] },
    sendOnComplete: boolean = false,
  ): Promise<CertificateBatch> {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    // Get eligible participants
    const participants = await this.getEligibleParticipants(template, filters);

    if (participants.length === 0) {
      throw new ValidationError("No eligible participants found");
    }

    // Create batch record
    const batch = await prisma.certificateBatch.create({
      data: {
        tenantId: template.tenantId,
        eventId: template.eventId,
        templateId,
        status: "PENDING",
        totalCount: participants.length,
        filters: filters || null,
      },
    });

    // Start async processing
    this.processBatch(batch.id, template, participants, sendOnComplete);

    return batch;
  }

  /**
   * Process batch asynchronously with worker pool
   */
  private async processBatch(
    batchId: string,
    template: CertificateTemplate,
    participants: Participant[],
    sendOnComplete: boolean,
  ): Promise<void> {
    // Update status to PROCESSING
    await prisma.certificateBatch.update({
      where: { id: batchId },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        estimatedEndAt: this.estimateEndTime(participants.length),
      },
    });

    // Process with worker pool
    const errors: Array<{ participantId: string; error: string }> = [];
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    // Create worker pool using Promise.allSettled with chunking
    const chunks = this.chunkArray(participants, MAX_CONCURRENT_WORKERS);

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map(async (participant) => {
          try {
            await this.issuanceEngine.generateCertificate(template, participant.id);
            return { success: true, participantId: participant.id };
          } catch (error: any) {
            return { success: false, participantId: participant.id, error: error.message };
          }
        }),
      );

      // Process results
      for (const result of results) {
        processedCount++;

        if (result.status === "fulfilled") {
          if (result.value.success) {
            successCount++;
          } else {
            failedCount++;
            errors.push({
              participantId: result.value.participantId,
              error: result.value.error!,
            });
          }
        } else {
          failedCount++;
          errors.push({
            participantId: "unknown",
            error: result.reason?.message || "Unknown error",
          });
        }

        // Emit progress event
        await this.emitProgressEvent(
          batchId,
          processedCount,
          participants.length,
          successCount,
          failedCount,
        );

        // Update batch progress periodically
        if (processedCount % 10 === 0 || processedCount === participants.length) {
          await prisma.certificateBatch.update({
            where: { id: batchId },
            data: {
              processedCount,
              successCount,
              failedCount,
              errors: errors.length > 0 ? errors.slice(-100) : null, // Keep last 100 errors
            },
          });
        }
      }
    }

    // Final update
    const finalStatus =
      failedCount === 0
        ? "COMPLETED"
        : failedCount === participants.length
          ? "FAILED"
          : "COMPLETED";

    await prisma.certificateBatch.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        processedCount,
        successCount,
        failedCount,
        completedAt: new Date(),
        errors: errors.length > 0 ? errors : null,
      },
    });

    // Emit completion event
    await this.emitBatchCompleteEvent(batchId, finalStatus, successCount, failedCount);

    // Send certificates if requested
    if (sendOnComplete && successCount > 0) {
      await this.sendCertificates(batchId);
    }
  }

  /**
   * Get participants eligible for certificate
   */
  private async getEligibleParticipants(
    template: CertificateTemplate,
    filters?: { participantTypes?: string[]; statuses?: string[]; participantIds?: string[] },
  ): Promise<Participant[]> {
    const where: any = {
      eventId: template.eventId,
      // Exclude those who already have a certificate
      certificates: {
        none: {
          templateId: template.id,
          status: { not: "REVOKED" },
        },
      },
    };

    if (template.participantType) {
      where.participantType = template.participantType;
    }

    if (filters?.participantTypes?.length) {
      where.participantType = { in: filters.participantTypes };
    }

    if (filters?.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters?.participantIds?.length) {
      where.id = { in: filters.participantIds };
    }

    return prisma.participant.findMany({
      where,
      include: {
        sessionAttendances: template.issuanceRule !== "ALL_APPROVED",
      },
    });
  }

  /**
   * Retry failed certificates in batch
   */
  async retryFailed(batchId: string): Promise<number> {
    const batch = await prisma.certificateBatch.findUnique({
      where: { id: batchId },
      include: { template: true },
    });

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    const errors = (batch.errors as Array<{ participantId: string; error: string }>) || [];
    const failedParticipantIds = errors
      .map((e) => e.participantId)
      .filter((id) => id !== "unknown");

    if (failedParticipantIds.length === 0) {
      return 0;
    }

    // Get failed participants
    const participants = await prisma.participant.findMany({
      where: { id: { in: failedParticipantIds } },
    });

    // Start new batch for retries
    const retryBatch = await this.startBulkGeneration(
      batch.templateId,
      { participantIds: failedParticipantIds },
      false,
    );

    return participants.length;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private estimateEndTime(count: number): Date {
    // Estimate ~2 seconds per certificate
    const estimatedSeconds = count * 2;
    return new Date(Date.now() + estimatedSeconds * 1000);
  }
}
```

### 5.10 Certificate Verification and Anti-Forgery

```typescript
// ============================================================================
// CERTIFICATE VERIFICATION ENGINE
// ============================================================================

export class CertificateVerificationEngine {
  /**
   * Verify certificate by code
   */
  async verify(
    code: string,
    verifierInfo?: {
      ip?: string;
      userAgent?: string;
      note?: string;
    },
  ): Promise<VerificationResult> {
    // Try verification code first, then certificate number
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ verificationCode: code.toUpperCase() }, { certificateNumber: code.toUpperCase() }],
      },
      include: {
        template: {
          include: {
            event: true,
            tenant: true,
          },
        },
        participant: true,
      },
    });

    // Log verification attempt
    const verification = certificate
      ? await prisma.certificateVerification.create({
          data: {
            certificateId: certificate.id,
            verifierIp: verifierInfo?.ip,
            verifierAgent: verifierInfo?.userAgent,
            verifierNote: verifierInfo?.note,
            wasValid: certificate.status !== "REVOKED",
            failureReason: certificate.status === "REVOKED" ? "Certificate revoked" : null,
          },
        })
      : null;

    if (!certificate) {
      return {
        isValid: false,
        status: "NOT_FOUND",
        certificate: null,
        revocationInfo: null,
        organization: null,
      };
    }

    // Check revocation status
    if (certificate.status === "REVOKED") {
      return {
        isValid: false,
        status: "REVOKED",
        certificate: {
          certificateNumber: certificate.certificateNumber,
          participantName: certificate.participant.fullName,
          eventName: certificate.template.event.name,
          eventDate: certificate.template.event.startDate?.toISOString() || "",
          issuedAt: certificate.generatedAt?.toISOString() || "",
          templateName: certificate.template.name,
        },
        revocationInfo: {
          revokedAt: certificate.revokedAt!.toISOString(),
          reason: certificate.revokedReason || "No reason provided",
        },
        organization: {
          name: certificate.template.tenant.name,
          logoUrl: certificate.template.tenant.logoUrl,
        },
      };
    }

    // Emit verification event
    await this.emitVerificationEvent(certificate, verifierInfo);

    return {
      isValid: true,
      status: "VALID",
      certificate: {
        certificateNumber: certificate.certificateNumber,
        participantName: certificate.participant.fullName,
        eventName: certificate.template.event.name,
        eventDate: certificate.template.event.startDate?.toISOString() || "",
        issuedAt: certificate.generatedAt?.toISOString() || "",
        templateName: certificate.template.name,
      },
      revocationInfo: null,
      organization: {
        name: certificate.template.tenant.name,
        logoUrl: certificate.template.tenant.logoUrl,
      },
    };
  }

  /**
   * Verify QR code payload
   */
  async verifyQrPayload(
    payload: string,
    verifierInfo?: {
      ip?: string;
      userAgent?: string;
    },
  ): Promise<VerificationResult> {
    try {
      const [data, signature] = payload.split(".");

      if (!data || !signature) {
        throw new Error("Invalid payload format");
      }

      // Verify signature
      const expectedSignature = this.signPayload(data);
      if (signature !== expectedSignature) {
        throw new Error("Invalid signature");
      }

      // Decode payload
      const decoded = JSON.parse(Buffer.from(data, "base64").toString());
      const { cert, code } = decoded;

      // Verify certificate
      return this.verify(code, verifierInfo);
    } catch (error) {
      return {
        isValid: false,
        status: "NOT_FOUND",
        certificate: null,
        revocationInfo: null,
        organization: null,
      };
    }
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(
    certificateId: string,
    reason: string,
    revokedBy: string,
  ): Promise<Certificate> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundError("Certificate not found");
    }

    if (certificate.status === "REVOKED") {
      throw new ValidationError("Certificate is already revoked");
    }

    const updated = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy,
        revokedReason: reason,
      },
    });

    // Emit revocation event
    await this.emitRevocationEvent(updated, reason, revokedBy);

    return updated;
  }

  private signPayload(payload: string): string {
    const secret = process.env.CERTIFICATE_SIGNING_SECRET!;
    return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  }
}
```

### 5.11 Emergency Broadcast Bypass Logic

```typescript
// ============================================================================
// EMERGENCY BROADCAST ENGINE
// ============================================================================

export class EmergencyBroadcastEngine {
  private deliveryPipeline: MessageDeliveryPipeline;
  private audienceResolver: AudienceResolver;

  /**
   * Send emergency broadcast (bypasses all scheduling)
   */
  async sendEmergencyBroadcast(
    request: EmergencyBroadcast,
    senderId: string
  ): Promise<BroadcastMessage> {
    // Validate confirmation code
    const isValidCode = await this.validateConfirmationCode(request.confirmationCode);
    if (!isValidCode) {
      throw new ValidationError('Invalid or expired confirmation code');
    }

    // Get tenant
    const event = await prisma.event.findUnique({
      where: { id: request.eventId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Resolve audience for each channel
    const recipients = new Map<MessageChannel, ResolvedRecipient[]>();

    for (const channel of request.channels) {
      const channelRecipients = await this.audienceResolver.resolveAudience(
        event.tenantId,
        request.eventId,
        channel,
        request.filters || {}
      );
      recipients.set(channel, channelRecipients);
    }

    // Create emergency broadcasts for each channel (parallel)
    const broadcasts = await Promise.all(
      request.channels.map(async (channel) => {
        const channelRecipients = recipients.get(channel) || [];

        if (channelRecipients.length === 0) {
          return null;
        }

        // Create broadcast with emergency flag
        const broadcast = await prisma.broadcastMessage.create({
          data: {
            tenantId: event.tenantId,
            eventId: request.eventId,
            subject: channel === 'EMAIL' ? request.subject : null,
            body: request.body,
            channel,
            status: 'SENDING',
            filters: request.filters || {},
            recipientCount: channelRecipients.length,
            isEmergency: true,
            priority: 10, // Maximum priority
            createdBy: senderId,
          },
        });

        // Queue with highest priority, no delay
        await this.deliveryPipeline.queueBroadcast(broadcast, channelRecipients);

        return broadcast;
      })
    );

    // Log audit event
    await this.logEmergencyBroadcast(request, senderId, broadcasts.filter(Boolean) as BroadcastMessage[]);

    // Emit SSE event
    await this.emitEmergencyBroadcastEvent(request, senderId);

    // Return first broadcast (or create combined response)
    return broadcasts.find(b => b !== null)!;
  }

  /**
   * Generate confirmation code for emergency broadcast
   */
  async generateConfirmationCode(userId: string): Promise<{
    code: string;
    expiresAt: Date;
  }> {
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in Redis
    await this.redis.setex(
      `emergency_code:${userId}:${code}`,
      300, // 5 minutes TTL
      JSON.stringify({ userId, createdAt: new Date().toISOString() })
    );

    return { code, expiresAt };
  }

  /**
   * Validate confirmation code
   */
  private async validateConfirmationCode(code: string): Promise<boolean> {
    // Check all matching keys (we don't know userId at this point)
    const keys = await this.redis.keys(`emergency_code:*:${code}`);

    if (keys.length === 0) {
      return false;
    }

    // Invalidate the code after use
    await this.redis.del(keys[0]);

    return true;
  }

  /**
   * Log emergency broadcast for audit
   */
  private async logEmergencyBroadcast(
    request: EmergencyBroadcast,
    senderId: string,
    broadcasts: BroadcastMessage[]
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        entityType: 'EMERGENCY_BROADCAST',
        entityId: broadcasts[0]?.id || 'unknown',
        action: 'SEND',
        userId: senderId,
        details: {
          eventId: request.eventId,
          channels: request.channels,
          recipientCounts: broadcasts.map(b => ({
            channel: b.channel,
            count: b.recipientCount,
          })),
          subject: request.subject,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
}

---

## 6. User Interface

This section defines the user interface components, wireframes, and interaction patterns for the Content and Documents module.

### 6.1 Template Builder

The Template Builder provides a rich text editor for creating message templates with variable insertion.

#### 6.1.1 Template Builder Wireframe (Source: 12.4)

```

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Template Builder [Save] [Preview] │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ Template Details │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│ │ Name: [Conference Welcome Email ] ││
│ │ Channel: ◉ Email ○ SMS ○ Push ○ In-App ││
│ └─────────────────────────────────────────────────────────────────────────────────────┘│
│ │
│ ┌───────────────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ SUBJECT (Email only) │ │ AVAILABLE VARIABLES ││
│ │ ┌─────────────────────────────────────┐ │ │ ┌───────────────────────────────┐ ││
│ │ │ Welcome to {{event.name}}, {{parti │  │  │  │ + Participant                 │ ││
│  │  │ cipant.firstName}}! │ │ │ │ {{participant.name}} │ ││
│ │ └─────────────────────────────────────┘ │ │ │ {{participant.firstName}} │ ││
│ └───────────────────────────────────────────┘ │ │ {{participant.lastName}} │ ││
│ │ │ {{participant.title}} │ ││
│ ┌───────────────────────────────────────────┐ │ │ {{participant.organization}}│ ││
│ │ MESSAGE BODY │ │ │ {{participant.email}} │ ││
│ │ ┌─────────────────────────────────────┐ │ │ │ {{participant.badgeNumber}} │ ││
│ │ │ [B] [I] [U] [Link] [Image] [Var ▾] │ │ │ │ │ ││
│ │ ├─────────────────────────────────────┤ │ │ │ + Event │ ││
│ │ │ Dear {{participant.name}}, │ │ │ │ {{event.name}} │ ││
│ │ │ │ │ │ │ {{event.startDate}} │ ││
│ │ │ Welcome to {{event.name}}! We are │ │ │ │ {{event.endDate}} │ ││
│ │ │ excited to have you join us for │ │ │ │ {{event.location}} │ ││
│ │ │ this year's conference. │ │ │ │ {{event.venue}} │ ││
│ │ │ │ │ │ │ │ ││
│ │ │ Your registration details: │ │ │ │ + Badge │ ││
│ │ │ - Badge Number: {{participant.badge │  │  │  │   {{badge.url}} │ ││
│ │ │ Number}} │ │ │ │ {{badge.downloadLink}} │ ││
│ │ │ - Check-in: {{event.startDate}} │ │ │ │ │ ││
│ │ │ - Location: {{event.venue}} │ │ │ │ + Custom │ ││
│ │ │ │ │ │ │ [Add Custom Variable] │ ││
│ │ │ See you soon! │ │ │ │ │ ││
│ │ │ │ │ │ └───────────────────────────────┘ ││
│ │ │ Best regards, │ │ │ ││
│ │ │ The {{event.name}} Team │ │ │ Character Count: 487/5000 ││
│ │ │ │ │ │ ││
│ │ └─────────────────────────────────────┘ │ └─────────────────────────────────────┘│
│ └───────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│ │ Used Variables: participant.name, participant.firstName, participant.badgeNumber, ││
│ │ event.name, event.startDate, event.venue ││
│ └─────────────────────────────────────────────────────────────────────────────────────┘│
│ │
└─────────────────────────────────────────────────────────────────────────────────────────┘

```

#### 6.1.2 Enhanced Template Builder with Preview

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Template Builder │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [Edit Mode] [Preview Mode] [Split View] [Test Send] [Save] │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────────────────────────────────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │ EDIT PANEL │ │ PREVIEW PANEL │ │
│ │ │ │ │ │
│ │ Name: [Conference Welcome Email ] │ │ Preview as: [John Smith - Delegate ▾] │ │
│ │ Channel: ◉ Email ○ SMS ○ Push ○ In-App │ │ │ │
│ │ │ │ ┌──────────────────────────────────────────┐ │ │
│ │ Subject: │ │ │ EMAIL PREVIEW │ │ │
│ │ ┌────────────────────────────────────────┐ │ │ │ ┌────────────────────────────────────┐ │ │ │
│ │ │ Welcome to {{event.name}}, {{participa │  │ │  │  │ From: noreply@conference.com      │  │   │   │
│  │  └────────────────────────────────────────┘  │ │  │  │ To: john.smith@example.com         │  │   │   │
│  │                                              │ │  │  │ Subject: Welcome to Global Summit  │  │   │   │
│  │  Body:                                       │ │  │  │          2026, John!               │  │   │   │
│  │  ┌────────────────────────────────────────┐  │ │  │  ├────────────────────────────────────┤  │   │   │
│  │  │ [B][I][U][S][Link][Img][📎][{{}}] │ │ │ │ │ │ │ │ │
│ │ ├────────────────────────────────────────┤ │ │ │ │ Dear John Smith, │ │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ Dear {{participant.name}}, │ │ │ │ │ Welcome to Global Summit 2026! │ │ │ │
│ │ │ │ │ │ │ │ We are excited to have you join │ │ │ │
│ │ │ Welcome to {{event.name}}! We are │ │ │ │ │ us for this year's conference. │ │ │ │
│ │ │ excited to have you join us for this │ │ │ │ │ │ │ │ │
│ │ │ year's conference. │ │ │ │ │ Your registration details: │ │ │ │
│ │ │ │ │ │ │ │ - Badge Number: DEL-2026-00123 │ │ │ │
│ │ │ Your registration details: │ │ │ │ │ - Check-in: March 15, 2026 │ │ │ │
│ │ │ - Badge Number: {{participant.badge    │  │ │  │  │ - Location: Grand Convention Ctr  │  │   │   │
│  │  │   Number}} │ │ │ │ │ │ │ │ │
│ │ │ - Check-in: {{event.startDate}} │ │ │ │ │ See you soon! │ │ │ │
│ │ │ - Location: {{event.venue}} │ │ │ │ │ │ │ │ │
│ │ │ │ │ │ │ │ Best regards, │ │ │ │
│ │ │ See you soon! │ │ │ │ │ The Global Summit 2026 Team │ │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ Best regards, │ │ │ │ └────────────────────────────────────┘ │ │ │
│ │ │ The {{event.name}} Team │ │ │ │ │ │ │
│ │ │ │ │ │ └──────────────────────────────────────────┘ │ │
│ │ └────────────────────────────────────────┘ │ │ │ │
│ │ │ │ Device: [Desktop] [Mobile] │ │
│ │ Variables Panel: [Show/Hide] │ │ │ │
│ └──────────────────────────────────────────────┘ └─────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.2 Broadcast Composer Wizard

The Broadcast Composer guides users through a 4-step process: Audience, Compose, Schedule, Confirm.

#### 6.2.1 Broadcast Flow Wireframe (Source: 12.4)

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ New Broadcast │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ● 1. Audience ──────── ○ 2. Compose ──────── ○ 3. Schedule ──────── ○ 4. Confirm │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 1: SELECT AUDIENCE │ │
│ │ │ │
│ │ Channel: ◉ Email ○ SMS ○ Push ○ In-App │ │
│ │ │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ AUDIENCE FILTERS │ │ │
│ │ │ │ │ │
│ │ │ Participant Type: Status: │ │ │
│ │ │ ☑ Delegate ☑ Approved │ │ │
│ │ │ ☑ VIP ☐ Pending │ │ │
│ │ │ ☐ Media ☐ Waitlisted │ │ │
│ │ │ ☐ Staff ☐ Rejected │ │ │
│ │ │ ☐ Exhibitor │ │ │
│ │ │ │ │ │
│ │ │ Country: Check-in Status: │ │ │
│ │ │ [All Countries ▾] ○ All ◉ Checked In ○ Not Checked In │ │ │
│ │ │ │ │ │
│ │ │ Registration Date: │ │ │
│ │ │ From: [ ] To: [ ] │ │ │
│ │ │ │ │ │
│ │ │ [+ Add Custom Filter] │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ AUDIENCE PREVIEW │ │ │
│ │ │ │ │ │
│ │ │ Total Recipients: 1,247 │ │ │
│ │ │ │ │ │
│ │ │ By Channel Capability: │ │ │
│ │ │ ├── Email: 1,247 (100%) │ │ │
│ │ │ ├── SMS: 892 (71%) │ │ │
│ │ │ ├── Push: 456 (37%) │ │ │
│ │ │ └── In-App: 1,247 (100%) │ │ │
│ │ │ │ │ │
│ │ │ Sample Recipients: │ │ │
│ │ │ ┌───────────────────────────────────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ Name │ Type │ Email │ Phone │ Push │ │ │ │
│ │ │ ├───────────────────┼──────────┼──────────────────────────┼──────────────┼────────────│ │ │ │
│ │ │ │ John Smith │ Delegate │ john.smith@example.com │ +1-555-0123 │ ✓ │ │ │ │
│ │ │ │ Maria Garcia │ VIP │ maria.garcia@corp.com │ +1-555-0124 │ ✓ │ │ │ │
│ │ │ │ David Lee │ Delegate │ david.lee@company.org │ - │ - │ │ │ │
│ │ │ │ Sarah Johnson │ VIP │ sarah.j@enterprise.com │ +1-555-0126 │ ✓ │ │ │ │
│ │ │ │ Ahmed Hassan │ Delegate │ ahmed.h@organization.net │ +1-555-0127 │ - │ │ │ │
│ │ │ └───────────────────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ │ │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ [Cancel] [Next: Compose →]│ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

#### 6.2.2 Step 2: Compose Message

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ New Broadcast │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ✓ 1. Audience ──────── ● 2. Compose ──────── ○ 3. Schedule ──────── ○ 4. Confirm │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 2: COMPOSE MESSAGE │ │
│ │ │ │
│ │ Template: [Select a template... ▾] │ │
│ │ [Conference Welcome Email] │ │
│ │ [Schedule Update Notification] │ │
│ │ [Badge Ready Notification] │ │
│ │ [Create from scratch] │ │
│ │ │ │
│ │ ─────────────────────────────── OR ─────────────────────────────── │ │
│ │ │ │
│ │ Subject: │ │
│ │ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Important: Schedule Change for Day 2 │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ Message: │ │
│ │ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ [B] [I] [U] [Link] [Image] [Insert Variable ▾] │ │ │
│ │ ├───────────────────────────────────────────────────────────────────────────────────────────┤ │ │
│ │ │ │ │ │
│ │ │ Dear {{participant.firstName}}, │ │ │
│ │ │ │ │ │
│ │ │ Please be advised that the Day 2 schedule for {{event.name}} has been updated. │ │ │
│ │ │ │ │ │
│ │ │ Key changes: │ │ │
│ │ │ • Keynote moved to 9:30 AM (was 9:00 AM) │ │ │
│ │ │ • Lunch break extended to 90 minutes │ │ │
│ │ │ • Networking session added at 4:00 PM │ │ │
│ │ │ │ │ │
│ │ │ Please review the updated schedule in your event app or on our website. │ │ │
│ │ │ │ │ │
│ │ │ Best regards, │ │ │
│ │ │ Event Team │ │ │
│ │ │ │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ [Preview Message] Characters: 523/5000 │ │
│ │ │ │
│ │ [← Back] [Cancel] [Next: Schedule →] │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

#### 6.2.3 Step 3: Schedule

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ New Broadcast │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ✓ 1. Audience ──────── ✓ 2. Compose ──────── ● 3. Schedule ──────── ○ 4. Confirm │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 3: SCHEDULE DELIVERY │ │
│ │ │ │
│ │ When should this message be sent? │ │
│ │ │ │
│ │ ◉ Send immediately │ │
│ │ │ │
│ │ ○ Schedule for later │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Date: [March 14, 2026 📅] Time: [09:00 AM ▾] │ │ │
│ │ │ │ │ │
│ │ │ Timezone: [America/New_York (EST) ▾] │ │ │
│ │ │ │ │ │
│ │ │ ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ MARCH 2026 │ │ │ │
│ │ │ │ Su Mo Tu We Th Fr Sa │ │ │ │
│ │ │ │ 1 2 3 4 5 6 7 │ │ │ │
│ │ │ │ 8 9 10 11 12 13 [14] │ │ │ │
│ │ │ │ 15 16 17 18 19 20 21 │ │ │ │
│ │ │ │ 22 23 24 25 26 27 28 │ │ │ │
│ │ │ │ 29 30 31 │ │ │ │
│ │ │ └─────────────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ │ │ │ │
│ │ │ Recipients will receive at: 9:00 AM EST / 2:00 PM GMT / 11:00 PM JST │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ │ │
│ │ [← Back] [Cancel] [Next: Confirm →] │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

#### 6.2.4 Step 4: Confirm and Send

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ New Broadcast │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ✓ 1. Audience ──────── ✓ 2. Compose ──────── ✓ 3. Schedule ──────── ● 4. Confirm │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ STEP 4: REVIEW AND CONFIRM │ │
│ │ │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ BROADCAST SUMMARY │ │ │
│ │ │ │ │ │
│ │ │ Channel: Email │ │ │
│ │ │ Recipients: 1,247 participants │ │ │
│ │ │ Schedule: Send immediately │ │ │
│ │ │ │ │ │
│ │ │ Subject: Important: Schedule Change for Day 2 │ │ │
│ │ │ │ │ │
│ │ │ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ MESSAGE PREVIEW │ │ │ │
│ │ │ │ │ │ │ │
│ │ │ │ Dear John, │ │ │ │
│ │ │ │ │ │ │ │
│ │ │ │ Please be advised that the Day 2 schedule for Global Summit 2026 has been │ │ │ │
│ │ │ │ updated. │ │ │ │
│ │ │ │ │ │ │ │
│ │ │ │ Key changes: │ │ │ │
│ │ │ │ • Keynote moved to 9:30 AM (was 9:00 AM) │ │ │ │
│ │ │ │ • Lunch break extended to 90 minutes │ │ │ │
│ │ │ │ • Networking session added at 4:00 PM │ │ │ │
│ │ │ │ │ │ │ │
│ │ │ │ Please review the updated schedule in your event app or on our website. │ │ │ │
│ │ │ │ │ │ │ │
│ │ │ │ Best regards, │ │ │ │
│ │ │ │ Event Team │ │ │ │
│ │ │ └─────────────────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ │ │ │ │
│ │ │ ⚠️ This action will send 1,247 emails immediately. This cannot be undone. │ │ │
│ │ │ │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ [← Back] [Cancel] [📧 Send Broadcast] │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.3 Emergency Broadcast Dialog

A modal dialog for sending high-priority emergency communications with confirmation safeguards.

```

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ EMERGENCY BROADCAST │ │
│ │ │ │
│ │ This will send a high-priority message to all selected recipients │ │
│ │ immediately, bypassing all scheduling delays. │ │
│ │ │ │
│ │ ────────────────────────────────────────────────────────────────────────── │ │
│ │ │ │
│ │ Event: [Global Summit 2026 ▾] │ │
│ │ │ │
│ │ Channels: │ │
│ │ ☑ Email ☑ SMS ☑ Push Notification ☐ In-App │ │
│ │ │ │
│ │ Audience: │ │
│ │ ◉ All participants (1,892) │ │
│ │ ○ Only checked-in participants (456) │ │
│ │ ○ Custom filter... │ │
│ │ │ │
│ │ Subject: │ │
│ │ ┌──────────────────────────────────────────────────────────────────────────┐│ │
│ │ │ URGENT: Venue Evacuation Notice ││ │
│ │ └──────────────────────────────────────────────────────────────────────────┘│ │
│ │ │ │
│ │ Message: │ │
│ │ ┌──────────────────────────────────────────────────────────────────────────┐│ │
│ │ │ Due to a fire alarm activation, please evacuate the building immediately ││ │
│ │ │ using the nearest exit. Proceed to the designated assembly point in the ││ │
│ │ │ parking lot. Do not use elevators. Further instructions will follow. ││ │
│ │ │ ││ │
│ │ └──────────────────────────────────────────────────────────────────────────┘│ │
│ │ │ │
│ │ ────────────────────────────────────────────────────────────────────────── │ │
│ │ │ │
│ │ 🔒 CONFIRMATION REQUIRED │ │
│ │ │ │
│ │ Enter the 6-digit confirmation code sent to your registered device: │ │
│ │ │ │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │ │
│ │ │ 7 │ │ 3 │ │ 8 │ │ 4 │ │ 2 │ │ 1 │ [Resend Code] │ │
│ │ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ │ │
│ │ │ │
│ │ ⚠️ This broadcast will reach 1,892 people across 3 channels immediately. │ │
│ │ │ │
│ │ [Cancel] [🚨 Send Emergency Broadcast] │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.4 Template Marketplace Discovery

The Template Marketplace provides a searchable catalog of shared templates with ratings and reviews.

#### 6.4.1 Discovery Wireframe (Source: 12.7)

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Template Marketplace [My Templates] │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 [Search templates... ] │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────┐ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ CATEGORIES │ │ FEATURED TEMPLATES │ │
│ │ │ │ │ │
│ │ ☐ All Categories │ │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │ │
│ │ ☐ Badge Templates │ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ │
│ │ ☐ Workflow Configs │ │ │ │ BADGE │ │ │ │ WORKFLOW │ │ │ │ FORM │ │ │ │
│ │ ☐ Registration Forms │ │ │ │ ┌─────┐ │ │ │ │ ┌─────┐ │ │ │ │ ┌─────┐ │ │ │ │
│ │ ☐ Report Templates │ │ │ │ │ 📛 │ │ │ │ │ │ ⚙️ │ │ │ │ │ │ 📝 │ │ │ │ │
│ │ ☐ Certificate Designs │ │ │ │ └─────┘ │ │ │ │ └─────┘ │ │ │ │ └─────┘ │ │ │ │
│ │ ☐ Seating Layouts │ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ ───────────────────── │ │ │ Professional │ │ 3-Stage │ │ Multi-Day │ │ │
│ │ │ │ │ Conference │ │ Approval │ │ Conference │ │ │
│ │ FILTERS │ │ │ Badge │ │ Workflow │ │ Registration │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ Rating: │ │ │ ★★★★★ (4.8) │ │ ★★★★☆ (4.2) │ │ ★★★★★ (4.9) │ │ │
│ │ ○ All │ │ │ 1.2K installs │ │ 892 installs │ │ 2.1K installs │ │ │
│ │ ○ 4+ Stars │ │ │ │ │ │ │ │ │ │
│ │ ○ 3+ Stars │ │ │ [Preview] │ │ [Preview] │ │ [Preview] │ │ │
│ │ │ │ └────────────────┘ └────────────────┘ └────────────────┘ │ │
│ │ Sort By: │ │ │ │
│ │ ◉ Most Popular │ └──────────────────────────────────────────────────────────────────────┘ │
│ │ ○ Highest Rated │ │
│ │ ○ Newest │ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ ○ Name A-Z │ │ ALL TEMPLATES │ │
│ │ │ │ │ │
│ │ ───────────────────── │ │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ TAGS │ │ │ Corporate │ │ Healthcare │ │ Academic │ │ │
│ │ │ │ │ Summit Badge │ │ Conference │ │ Symposium │ │ │
│ │ [conference] [summit] │ │ │ │ │ Badge │ │ Form │ │ │
│ │ [corporate] [academic] │ │ │ ★★★★☆ (4.1) │ │ ★★★★★ (4.7) │ │ ★★★★☆ (4.3) │ │ │
│ │ [government] [sports] │ │ │ 567 installs │ │ 1.8K installs │ │ 923 installs │ │ │
│ │ [healthcare] [tech] │ │ │ │ │ │ │ │ │ │
│ │ │ │ └────────────────┘ └────────────────┘ └────────────────┘ │ │
│ │ │ │ │ │
│ │ │ │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ │ │ VIP Seating │ │ Certificate │ │ Exhibitor │ │ │
│ │ │ │ │ Layout │ │ of Completion │ │ Registration │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ │ │ ★★★★★ (4.6) │ │ ★★★★☆ (4.4) │ │ ★★★★☆ (4.0) │ │ │
│ │ │ │ │ 445 installs │ │ 1.5K installs │ │ 678 installs │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ │ └────────────────┘ └────────────────┘ └────────────────┘ │ │
│ │ │ │ │ │
│ │ │ │ [Load More] │ │
│ └─────────────────────────┘ └──────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.5 Template Preview and Installation

Detailed template view with preview, version history, and installation options.

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Template Marketplace > Professional Conference Badge [Back to Gallery] │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────┐ ┌───────────────────────────────────────────────────┐│
│ │ │ │ ││
│ │ TEMPLATE PREVIEW │ │ Professional Conference Badge ││
│ │ │ │ ││
│ │ ┌────────────────────────────────────────┐ │ │ by Acme Events Inc. ││
│ │ │ │ │ │ ││
│ │ │ ┌─────────────────────┐ │ │ │ ★★★★★ 4.8 (156 reviews) 1,234 installs ││
│ │ │ │ │ │ │ │ ││
│ │ │ │ [PHOTO] │ │ │ │ Category: Badge Templates ││
│ │ │ │ │ │ │ │ Version: 2.1.0 ││
│ │ │ │ │ │ │ │ Updated: February 10, 2026 ││
│ │ │ └─────────────────────┘ │ │ │ ││
│ │ │ │ │ │ Tags: [conference] [corporate] [professional] ││
│ │ │ JOHN SMITH │ │ │ ││
│ │ │ CEO, Acme Corporation │ │ │ ──────────────────────────────────────────── ││
│ │ │ │ │ │ ││
│ │ │ ████████ DELEGATE │ │ │ Description: ││
│ │ │ │ │ │ A professional badge template designed for ││
│ │ │ Global Summit 2026 │ │ │ corporate conferences and summits. Features ││
│ │ │ │ │ │ clean typography, photo placement, and QR ││
│ │ └────────────────────────────────────────┘ │ │ code integration. Supports A6 and CR80 sizes. ││
│ │ │ │ ││
│ │ [◀ Previous] ●○○ [Next ▶] │ │ Features: ││
│ │ │ │ • Clean, professional design ││
│ └──────────────────────────────────────────────┘ │ • Photo placeholder with cropping ││
│ │ • QR code for check-in ││
│ ┌──────────────────────────────────────────────┐ │ • Customizable colors and fonts ││
│ │ VERSION HISTORY │ │ • Multi-size support (A6, CR80) ││
│ │ │ │ ││
│ │ v2.1.0 (Current) - Feb 10, 2026 │ │ ──────────────────────────────────────────── ││
│ │ └─ Added dark mode variant │ │ ││
│ │ │ │ [ 🔧 Install Template ] ││
│ │ v2.0.0 - Jan 15, 2026 │ │ ││
│ │ └─ Major redesign with new fonts │ │ Install Options: ││
│ │ │ │ ○ Install as-is (receive updates) ││
│ │ v1.2.0 - Dec 01, 2025 │ │ ○ Fork and customize (independent copy) ││
│ │ └─ Added QR code support │ │ ││
│ │ │ │ Target Event: ││
│ │ [Show All Versions] │ │ [Select an event... ▾] ││
│ └──────────────────────────────────────────────┘ │ ││
│ │ [Check for Conflicts] ││
│ ┌──────────────────────────────────────────────┐ │ ││
│ │ RECENT REVIEWS │ └───────────────────────────────────────────────────┘│
│ │ │ │
│ │ ★★★★★ "Excellent design, very easy to..." │ ┌───────────────────────────────────────────────────┐│
│ │ by TechCorp Events - 2 days ago │ │ RELATED TEMPLATES ││
│ │ │ │ ││
│ │ ★★★★☆ "Great template, would love more..." │ │ [Corporate VIP Badge] [Summit Name Tag] [...] ││
│ │ by Global Conferences - 1 week ago │ │ ││
│ │ │ └───────────────────────────────────────────────────┘│
│ │ [See All 156 Reviews] │ │
│ └──────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.6 Survey Builder Interface

Drag-and-drop survey builder with question types, sections, and preview.

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Survey Builder [Save Draft] [Preview] [Publish]│
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐│
│ │ Survey Title: [Post-Event Feedback Survey - Global Summit 2026 ] ││
│ │ Description: [Help us improve future events by sharing your experience ] ││
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────┐ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ QUESTION TYPES │ │ SURVEY CANVAS │ │
│ │ │ │ │ │
│ │ ┌──────────────────┐│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ ★ Rating ││ │ │ Section: Overall Experience [⋮] ↕ │ │ │
│ │ └──────────────────┘│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │ ┌──────────────────┐│ │ │ │
│ │ │ 📝 Text ││ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ └──────────────────┘│ │ │ Q1. How would you rate your overall experience? [⋮] ↕ │ │ │
│ │ ┌──────────────────┐│ │ │ │ │ │
│ │ │ ○ Multiple Choice││ │ │ Type: Rating (1-5 stars) ☑ Required │ │ │
│ │ └──────────────────┘│ │ │ │ │ │
│ │ ┌──────────────────┐│ │ │ ☆ ☆ ☆ ☆ ☆ │ │ │
│ │ │ ☑ Multi-Select ││ │ │ Poor Average Excellent │ │ │
│ │ └──────────────────┘│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │ ┌──────────────────┐│ │ │ │
│ │ │ 📊 Scale ││ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ └──────────────────┘│ │ │ Q2. How likely are you to recommend this event? [⋮] ↕ │ │ │
│ │ ┌──────────────────┐│ │ │ │ │ │
│ │ │ 📈 NPS ││ │ │ Type: Net Promoter Score (0-10) ☑ Required │ │ │
│ │ └──────────────────┘│ │ │ │ │ │
│ │ ┌──────────────────┐│ │ │ 0 1 2 3 4 5 6 7 8 9 10 │ │ │
│ │ │ ✓ Yes/No ││ │ │ Not likely Neutral Very likely │ │ │
│ │ └──────────────────┘│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │ │ │
│ │ ─────────────────── │ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ │ │ Section: Content & Sessions [⋮] ↕ │ │ │
│ │ ┌──────────────────┐│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │ │ 📑 Section ││ │ │ │
│ │ └──────────────────┘│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ │ │ Q3. Which sessions did you find most valuable? [⋮] ↕ │ │ │
│ │ ─────────────────── │ │ │ │ │ │
│ │ │ │ │ Type: Multi-Select ☐ Required │ │ │
│ │ Drag question types │ │ │ │ │ │
│ │ to the canvas to │ │ │ ☐ Opening Keynote │ │ │
│ │ add them to your │ │ │ ☐ Workshop A: Digital Transformation │ │ │
│ │ survey. │ │ │ ☐ Workshop B: Leadership Skills │ │ │
│ │ │ │ │ ☐ Panel Discussion: Future of Work │ │ │
│ │ │ │ │ ☐ Closing Ceremony │ │ │
│ │ │ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ │ │ Q4. What could we improve for future events? [⋮] ↕ │ │ │
│ │ │ │ │ │ │ │
│ │ │ │ │ Type: Text (Long answer) ☐ Required │ │ │
│ │ │ │ │ │ │ │
│ │ │ │ │ ┌──────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ │ │ │ │ │ │
│ │ │ │ │ │ │ │ │ │
│ │ │ │ │ └──────────────────────────────────────────────────────────┘ │ │ │
│ │ │ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │ │ │
│ │ │ │ [+ Add Question] │ │
│ │ │ │ │ │
│ └──────────────────────┘ └─────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐│
│ │ DISTRIBUTION SETTINGS ││
│ │ ││
│ │ Send After: [24] hours after event ends Reminders: Day [3] and Day [7] Close After: [14] days││
│ │ ││
│ │ Target Audience: ◉ All approved participants ○ Custom filter... ││
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘│
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.7 Survey Results Dashboard

Comprehensive results view with NPS, satisfaction metrics, word cloud, and year-over-year comparison.

#### 6.7.1 Survey Results Dashboard (Source: 12.18)

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Survey Results: Post-Event Feedback Survey - Global Summit 2026 [Export Results]│
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ RESPONSE OVERVIEW │ │
│ │ │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ │ RESPONSE RATE │ │ COMPLETED │ │ IN PROGRESS │ │ AVG TIME │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ 72.3% │ │ 892 │ │ 45 │ │ 4:32 │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ 892 of 1,234 │ │ completed │ │ pending │ │ minutes │ │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────┐ ┌───────────────────────────────────────────────────────┐│
│ │ NET PROMOTER SCORE │ │ SATISFACTION BY CATEGORY ││
│ │ │ │ ││
│ │ ┌───────────┐ │ │ Overall Experience ████████████████████ 4.5/5 ││
│ │ ┌─┤ +47 ├─┐ │ │ Session Content ███████████████████ 4.3/5 ││
│ │ ╱ │ │ ╲ │ │ Speakers █████████████████████ 4.6/5 ││
│ │ ╱ │ │ ╲ │ │ Networking ████████████████ 4.0/5 ││
│ │ ╱ │ │ ╲ │ │ Venue & Facilities ███████████████████ 4.3/5 ││
│ │ ╱ │ EXCELLENT │ ╲ │ │ Organization ████████████████████ 4.4/5 ││
│ │ ╱ │ │ ╲ │ │ Food & Catering ███████████████ 3.9/5 ││
│ │ ╱ └───────────┘ ╲ │ │ Registration Process █████████████████████ 4.5/5 ││
│ │ ╱ ╲ │ │ ││
│ │ ╱ ╲ │ │ ││
│ │ ╱ ╲ │ │ Legend: ████ 4.5+ ███ 4.0+ ██ 3.5+ █ 3.0+ ││
│ │ │ │ ││
│ │ Promoters: 62% Passives: 23% Det: 15%│ │ ││
│ └─────────────────────────────────────────┘ └───────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────┐ ┌───────────────────────────────────────────────────────┐│
│ │ RESPONSE TRENDS │ │ FREE-TEXT THEMES ││
│ │ │ │ ││
│ │ Responses │ │ networking ││
│ │ │ │ │ speakers content ││
│ │ 150├─ ╭───── │ │ venue SESSIONS organization ││
│ │ │ ╭──╯ │ │ registration workshops FOOD ││
│ │ 100├─ ╭────╯ │ │ timing helpful lunch ││
│ │ │ ╭───╯ │ │ schedule breaks staff ││
│ │ 50├─ ╭────╯ │ │ excellent improve more time ││
│ │ │ ╭────╯ │ │ ││
│ │ 0├─────┴────┴────┴────┴────┴──── │ │ ││
│ │ Day1 Day2 Day3 Day4 Day5 Day6 │ │ Top Positive: excellent, helpful, organized ││
│ └─────────────────────────────────────────┘ │ Top Negative: crowded, improve, long ││
│ └───────────────────────────────────────────────────────┘│
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ RECURRING ISSUES │ │
│ │ │ │
│ │ ⚠️ High Priority │ │
│ │ ├── "Not enough networking time" - mentioned 47 times (5.3% of responses) │ │
│ │ └── "Sessions too crowded" - mentioned 38 times (4.3% of responses) │ │
│ │ │ │
│ │ ⚡ Medium Priority │ │
│ │ ├── "Lunch break too short" - mentioned 23 times (2.6% of responses) │ │
│ │ └── "Difficult to navigate venue" - mentioned 19 times (2.1% of responses) │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ YEAR-OVER-YEAR COMPARISON │ │
│ │ │ │
│ │ Compare with: [Global Summit 2025 ▾] │ │
│ │ │ │
│ │ Metric 2025 2026 Change │ │
│ │ ────────────────────────────────────────────────────────────────── │ │
│ │ Response Rate 68.5% 72.3% ▲ +3.8% │ │
│ │ Net Promoter Score +42 +47 ▲ +5 pts │ │
│ │ Overall Satisfaction 4.2/5 4.5/5 ▲ +0.3 │ │
│ │ Session Content 4.1/5 4.3/5 ▲ +0.2 │ │
│ │ Networking 4.2/5 4.0/5 ▼ -0.2 │ │
│ │ Food & Catering 3.5/5 3.9/5 ▲ +0.4 │ │
│ │ │ │
│ │ Key Improvements: Areas for Attention: │ │
│ │ • Food quality improved significantly • Networking declined slightly │ │
│ │ • Overall satisfaction trending up • Some sessions still too crowded │ │
│ │ • Response rate increased │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.8 Certificate Designer

Canvas-based certificate designer with WYSIWYG editing, dynamic fields, and preview.

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Certificate Designer [Save] [Preview] [Test Print] │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ Template: [Certificate of Attendance - Global Summit 2026 ] │
│ │
│ ┌──────────────────────┐ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ DESIGN TOOLS │ │ CANVAS (A4 Landscape) │ │
│ │ │ │ │ │
│ │ Elements: │ │ ┌────────────────────────────────────────────────────────────────┐ │ │
│ │ ┌──────────────────┐│ │ │ │ │ │
│ │ │ T Text ││ │ │ CERTIFICATE │ │ │
│ │ └──────────────────┘│ │ │ OF ATTENDANCE │ │ │
│ │ ┌──────────────────┐│ │ │ │ │ │
│ │ │ 🖼 Image ││ │ │ │ │ │
│ │ └──────────────────┘│ │ │ This is to certify that │ │ │
│ │ ┌──────────────────┐│ │ │ │ │ │
│ │ │ 📐 Shape ││ │ │ ┌───────────────────────────┐ │ │ │
│ │ └──────────────────┘│ │ │ │ {{participant.name}} │ ← Dynamic Field │ │ │
│ │ ┌──────────────────┐│ │ │ └───────────────────────────┘ │ │ │
│ │ │ 📱 QR Code ││ │ │ │ │ │
│ │ └──────────────────┘│ │ │ has successfully attended the │ │ │
│ │ │ │ │ │ │ │
│ │ Dynamic Fields: │ │ │ ┌───────────────────────────┐ │ │ │
│ │ ┌──────────────────┐│ │ │ │ {{event.name}} │ ← Dynamic Field │ │ │
│ │ │ {{participant.*}}││ │ │ └───────────────────────────┘ │ │ │
│ │ └──────────────────┘│ │ │ │ │ │
│ │ ┌──────────────────┐│ │ │ held on {{event.date}} at {{event.location}} │ │ │
│ │ │ {{event.*}} ││ │ │ │ │ │
│ │ └──────────────────┘│ │ │ │ │ │
│ │ ┌──────────────────┐│ │ │ ┌──────────────┐ ┌──────────────┐ │ │ │
│ │ │ {{certificate.*}}││ │ │ │ │ │ │ │ │ │
│ │ └──────────────────┘│ │ │ │ [QR CODE] │ │ [SIGNATURE] │ │ │ │
│ │ ┌──────────────────┐│ │ │ │ │ │ │ │ │ │
│ │ │ {{signatory.*}} ││ │ │ └──────────────┘ └──────────────┘ │ │ │
│ │ └──────────────────┘│ │ │ │ │ │
│ │ │ │ │ Verify: {{certificate.verificationCode}} │ │ │
│ │ ─────────────────── │ │ │ {{signatory.name}} │ │ │
│ │ │ │ │ Certificate #: {{signatory.title}} │ │ │
│ │ Page Size: │ │ │ {{certificate.number}} │ │ │
│ │ [A4 ▾] │ │ │ │ │ │
│ │ │ │ └────────────────────────────────────────────────────────────────┘ │ │
│ │ Orientation: │ │ │ │
│ │ ◉ Landscape │ │ Zoom: [100% ▾] Grid: [On] Snap: [On] │ │
│ │ ○ Portrait │ │ │ │
│ │ │ └────────────────────────────────────────────────────────────────────────┘ │
│ │ │ │
│ │ ─────────────────── │ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ │ │ SELECTED ELEMENT PROPERTIES │ │
│ │ Issuance Rules: │ │ │ │
│ │ ┌──────────────────┐│ │ Element: Dynamic Text Field (participant.name) │ │
│ │ │◉ All Approved ││ │ │ │
│ │ │○ Attendance 80%+ ││ │ Position: X: [145mm] Y: [85mm] Size: W: [150mm] H: [15mm] │ │
│ │ │○ Sessions Req. ││ │ Font: [Open Sans ▾] Size: [28pt] Style: [Bold ▾] │ │
│ │ │○ Manual Only ││ │ Color: [#1a1a2e 🎨] Align: [Center ▾] │ │
│ │ └──────────────────┘│ │ │ │
│ │ │ └────────────────────────────────────────────────────────────────────────┘ │
│ │ Signatory: │ │
│ │ Name: [John Smith ]│ │
│ │ Title: [CEO ]│ │
│ │ Signature: [Upload]│ │
│ │ │ │
│ └──────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.9 Certificate Verification Page

Public-facing verification page for validating certificate authenticity.

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ │
│ CERTIFICATE VERIFICATION │
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ │ │
│ │ Enter the verification code or certificate number to verify authenticity: │ │
│ │ │ │
│ │ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ [ABCD1234 ]│ │ │
│ │ └──────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ │ │
│ │ [🔍 Verify Certificate] │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ───────────────────────────────────────────────────────────────────────────────────────────────────── │
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ │ │
│ │ ✅ CERTIFICATE VERIFIED │ │
│ │ │ │
│ │ ┌───────────────────────────────────────────────────────────────────────────────────────────────┐│ │
│ │ │ ││ │
│ │ │ ┌─────────────────┐ ││ │
│ │ │ │ │ GLOBAL SUMMIT 2026 ││ │
│ │ │ │ [ORG LOGO] │ Certificate of Attendance ││ │
│ │ │ │ │ ││ │
│ │ │ └─────────────────┘ ││ │
│ │ │ ││ │
│ │ │ Certificate Details: ││ │
│ │ │ ───────────────────────────────────────────────────────────────────────── ││ │
│ │ │ Certificate Number: CERT-GSUM-2026-00123 ││ │
│ │ │ Recipient: John Smith ││ │
│ │ │ Event: Global Summit 2026 ││ │
│ │ │ Event Date: March 15-17, 2026 ││ │
│ │ │ Issued On: March 18, 2026 ││ │
│ │ │ Issued By: Global Events International ││ │
│ │ │ ││ │
│ │ │ ───────────────────────────────────────────────────────────────────────── ││ │
│ │ │ ││ │
│ │ │ This certificate confirms that the above-named individual successfully ││ │
│ │ │ attended the specified event. ││ │
│ │ │ ││ │
│ │ │ Verified at: February 13, 2026 at 2:45 PM UTC ││ │
│ │ │ ││ │
│ │ └───────────────────────────────────────────────────────────────────────────────────────────────┘│ │
│ │ │ │
│ │ [Download Certificate PDF] [Report an Issue] │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ │ │
│ │ ❌ CERTIFICATE NOT FOUND │ │
│ │ │ │
│ │ The verification code or certificate number you entered could not be found in our system. │ │
│ │ │ │
│ │ Please check the code and try again. If you believe this is an error, please contact │ │
│ │ the issuing organization. │ │
│ │ │ │
│ │ [Try Again] │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ │ │
│ │ ⚠️ CERTIFICATE REVOKED │ │
│ │ │ │
│ │ This certificate has been revoked and is no longer valid. │ │
│ │ │ │
│ │ Certificate Number: CERT-GSUM-2026-00456 │ │
│ │ Revoked On: February 10, 2026 │ │
│ │ Reason: Participant registration cancelled │ │
│ │ │ │
│ │ If you have questions about this revocation, please contact the issuing organization. │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ Powered by Accreditation Platform │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.10 Delivery Analytics Dashboard

Comprehensive analytics for message delivery performance across all channels.

```

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Delivery Analytics Date Range: [Last 30 Days ▾] │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ DELIVERY OVERVIEW │ │
│ │ │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ │ TOTAL SENT │ │ DELIVERED │ │ OPEN RATE │ │ BOUNCE RATE │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ 15,234 │ │ 14,892 │ │ 42.3% │ │ 2.2% │ │ │
│ │ │ │ │ │ │ │ │ │ │ │
│ │ │ ▲ +12% vs prev │ │ 97.8% success │ │ ▲ +3.1% vs prev│ │ ▼ -0.5% vs prev│ │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │
│ │ │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────┐ ┌───────────────────────────────────────────────────────┐│
│ │ DELIVERY BY CHANNEL │ │ DELIVERY TREND ││
│ │ │ │ ││
│ │ Channel Sent Delivered Rate │ │ Messages ││
│ │ ──────────────────────────────────── │ │ │ ││
│ │ 📧 Email 8,234 8,105 98.4% │ │ 800├─ ╭──────── ││
│ │ 📱 SMS 3,456 3,401 98.4% │ │ │ ╭────╯ ││
│ │ 🔔 Push 2,344 2,186 93.3% │ │ 600├─ ╭────╯ ││
│ │ 💬 In-App 1,200 1,200 100% │ │ │ ╭──────╯ ││
│ │ │ │ 400├─ ╭─────╯ ││
│ │ ┌─────────────────────────────────┐ │ │ │ ╭─────╯ ││
│ │ │ 📧 █████████████████████ 54% │ │ │ 200├──╯ ││
│ │ │ 📱 ████████████ 23% │ │ │ │ ││
│ │ │ 🔔 ████████ 15% │ │ │ 0├────┬────┬────┬────┬────┬────┬──── ││
│ │ │ 💬 ████ 8% │ │ │ Week1 Week2 Week3 Week4 ││
│ │ └─────────────────────────────────┘ │ │ ││
│ └─────────────────────────────────────────┘ │ ── Email ── SMS ── Push ── In-App ││
│ └───────────────────────────────────────────────────────┘│
│ │
│ ┌─────────────────────────────────────────┐ ┌───────────────────────────────────────────────────────┐│
│ │ BOUNCE ANALYSIS │ │ RECENT BROADCASTS ││
│ │ │ │ ││
│ │ Bounce Type Count % │ │ Broadcast Channel Sent Delivered ││
│ │ ────────────────────────────────── │ │ ───────────────────────────────────────────────── ││
│ │ Hard Bounce 89 0.6% │ │ Schedule Update Email 1,247 1,241 ││
│ │ Soft Bounce 253 1.6% │ │ Badge Ready Push 892 834 ││
│ │ │ │ Welcome Message Email 456 451 ││
│ │ Top Bounce Reasons: │ │ Reminder Day 2 SMS 1,892 1,876 ││
│ │ • Invalid email: 45 │ │ Survey Invitation Email 892 889 ││
│ │ • Mailbox full: 38 │ │ ││
│ │ • Domain not found: 29 │ │ [View All Broadcasts] ││
│ │ • Blocked by recipient: 17 │ │ ││
│ │ │ │ ││
│ │ [Export Bounce Report] │ │ ││
│ └─────────────────────────────────────────┘ └───────────────────────────────────────────────────────┘│
│ │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ SUPPRESSION SUMMARY │ │
│ │ │ │
│ │ Total Suppressed: 342 recipients │ │
│ │ │ │
│ │ By Reason: By Channel: │ │
│ │ • Hard Bounces: 89 (26%) • Email: 198 (58%) │ │
│ │ • Unsubscribed: 156 (46%) • SMS: 98 (29%) │ │
│ │ • Complaints: 45 (13%) • Push: 46 (13%) │ │
│ │ • Manual: 52 (15%) │ │
│ │ │ │
│ │ [Manage Suppression List] │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

```

### 6.11 Responsive and Mobile Patterns

Mobile-optimized views for key interfaces.

#### 6.11.1 Mobile Survey Response

```

┌─────────────────────────────────┐
│ Post-Event Survey │
│ │
│ Question 2 of 8 │
│ ████████░░░░░░░░░░░ 25% │
│ │
├─────────────────────────────────┤
│ │
│ How would you rate your │
│ overall experience at │
│ Global Summit 2026? │
│ │
│ │
│ ☆ ☆ ☆ ☆ ☆ │
│ │
│ 1 2 3 4 5 │
│ Poor Excellent │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
├─────────────────────────────────┤
│ │
│ [← Previous] [Next →] │
│ │
│ [Save & Exit] │
│ │
└─────────────────────────────────┘

```

#### 6.11.2 Mobile Certificate Verification

```

┌─────────────────────────────────┐
│ Certificate Verification │
├─────────────────────────────────┤
│ │
│ ┌─────────────────────────────┐│
│ │ ││
│ │ 📷 Scan QR Code ││
│ │ ││
│ │ ┌─────────────────┐ ││
│ │ │ │ ││
│ │ │ [Camera │ ││
│ │ │ View] │ ││
│ │ │ │ ││
│ │ │ │ ││
│ │ └─────────────────┘ ││
│ │ ││
│ │ Point camera at QR ││
│ │ code on certificate ││
│ │ ││
│ └─────────────────────────────┘│
│ │
│ ─────── OR ENTER CODE ─────── │
│ │
│ ┌─────────────────────────────┐│
│ │ [ABCD1234 ]││
│ └─────────────────────────────┘│
│ │
│ [🔍 Verify] │
│ │
├─────────────────────────────────┤
│ │
│ ✅ VERIFIED │
│ │
│ ┌─────────────────────────────┐│
│ │ ││
│ │ John Smith ││
│ │ Certificate of Attendance ││
│ │ ││
│ │ Global Summit 2026 ││
│ │ March 15-17, 2026 ││
│ │ ││
│ │ Cert #: CERT-2026-00123 ││
│ │ Issued: March 18, 2026 ││
│ │ ││
│ └─────────────────────────────┘│
│ │
│ [View Full Details] │
│ │
└─────────────────────────────────┘

```

#### 6.11.3 Mobile Broadcast List

```

┌─────────────────────────────────┐
│ Broadcasts [+ New] │
├─────────────────────────────────┤
│ 🔍 [Search broadcasts...] │
├─────────────────────────────────┤
│ │
│ ┌─────────────────────────────┐│
│ │ 📧 Schedule Update ││
│ │ Sent • 1,247 recipients ││
│ │ 98.5% delivered • 2h ago ││
│ │ ██████████░░ 85% opened ││
│ └─────────────────────────────┘│
│ │
│ ┌─────────────────────────────┐│
│ │ 🔔 Badge Ready ││
│ │ Sent • 892 recipients ││
│ │ 93.3% delivered • 5h ago ││
│ │ █████░░░░░░░ 42% opened ││
│ └─────────────────────────────┘│
│ │
│ ┌─────────────────────────────┐│
│ │ 📱 Reminder Day 2 ││
│ │ Scheduled • 1,892 recipients││
│ │ Tomorrow at 9:00 AM ││
│ │ [Edit] [Cancel] ││
│ └─────────────────────────────┘│
│ │
│ ┌─────────────────────────────┐│
│ │ 📧 Welcome Message ││
│ │ Draft • ~450 recipients ││
│ │ Last edited 3 days ago ││
│ │ [Continue Editing] ││
│ └─────────────────────────────┘│
│ │
│ [Load More] │
│ │
└─────────────────────────────────┘

```

---

## 7. Integration Points

Module 14 provides communication, template sharing, survey, and certification services that integrate with virtually every other module in the Accreditation Platform. This section documents all bidirectional dependencies, data exchange patterns, and integration contracts.

### 7.1 Module Integration Matrix

| Source Module | Target Module | Direction | Data Exchanged | Integration Method | Trigger |
|---|---|---|---|---|---|
| **14 → 01** | Data Model Foundation | Bidirectional | Tenant, Event, Participant base entities | Shared Prisma schema | Every request |
| **14 → 02** | Dynamic Schema Engine | Inbound | Custom field definitions for template variables | Field resolver API | Template rendering |
| **14 → 03** | Visual Form Designer | Bidirectional | Survey builder reuses form designer components | Shared React components | Survey creation |
| **14 → 04** | Workflow Engine | Bidirectional | NOTIFY action triggers, certificate issuance steps | Domain events | Workflow transitions |
| **14 → 05** | Security & Access | Inbound | RBAC permissions, tenant isolation, audit context | Middleware, guards | Every request |
| **14 → 07** | API & Integration | Outbound | SSE broadcast progress, webhook delivery events | Event streams, webhooks | Async operations |
| **14 → 08** | UI/UX & Frontend | Bidirectional | Rich text editor, DataTable, design tokens | Shared component library | UI rendering |
| **14 → 09** | Registration | Bidirectional | Confirmation emails, approval notifications | Domain events | Registration lifecycle |
| **14 → 10** | Event Operations | Outbound | Command center communication widgets | Real-time SSE events | Monitoring |
| **14 → 11** | Logistics & Venue | Bidirectional | Transport notifications, accommodation confirmations | Template variables | Logistics updates |
| **14 → 12** | Protocol & Diplomacy | Bidirectional | VIP communication templates, bilateral confirmations | Template engine | Protocol operations |
| **14 → 13** | People & Workforce | Bidirectional | Staff shift notifications, volunteer certificates | Domain events | Workforce management |
| **14 → 15** | Compliance & Governance | Outbound | Document expiry notifications, audit trail | Domain events | Compliance checks |
| **14 → 16** | Participant Experience | Outbound | Push notifications, digital certificates, survey links | Mobile API | Participant actions |
| **14 → 17** | Settings & Config | Bidirectional | Configuration keys, feature flags | Settings registry | Config changes |

### 7.2 Integration Architecture

```

┌─────────────────────────────────────────────────────────────────────┐
│ Module 14: Content & Documents │
│ │
│ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ ┌────────────┐ │
│ │Communication │ │ Template │ │ Survey │ │Certificate │ │
│ │ Hub │ │ Marketplace │ │ Engine │ │ Generator │ │
│ └──────┬───────┘ └──────┬───────┘ └────┬────┘ └─────┬──────┘ │
│ │ │ │ │ │
│ ┌──────┴─────────────────┴───────────────┴──────────────┴──────┐ │
│ │ Unified Content Event Bus │ │
│ └──────────────────────────┬───────────────────────────────────┘ │
│ │ │
└─────────────────────────────┼──────────────────────────────────────┘
│
┌───────────────┼───────────────┐
▼ ▼ ▼
┌───────────────────┐ ┌──────────┐ ┌─────────────────┐
│ Domain Event Bus │ │ REST API │ │ SSE Channels │
│ (Internal) │ │ Layer │ │ (Real-time) │
└─────────┬─────────┘ └────┬─────┘ └────────┬────────┘
│ │ │
┌─────────┴────┐ ┌───────┴──────┐ ┌──────┴─────────┐
│ Module 04 │ │ Module 09 │ │ Module 10 │
│ Workflow │ │ Registration │ │ Event Ops │
│ NOTIFY │ │ Confirm Emails│ │ Command Center │
└──────────────┘ └──────────────┘ └────────────────┘

````

### 7.3 Detailed Integration Contracts

#### 7.3.1 Module 04: Workflow Engine — NOTIFY Action

The Workflow Engine's `NOTIFY` action type delegates to Module 14's Communication Hub for all outbound notifications.

```typescript
// ── Integration: Workflow NOTIFY action handler ──

import type { WorkflowAction, WorkflowContext } from '@/modules/workflow/types';

/**
 * Domain event emitted by Module 04 when a NOTIFY action fires
 */
interface WorkflowNotifyEvent {
  type: 'WORKFLOW_NOTIFY';
  payload: {
    workflowInstanceId: string;
    actionId: string;
    templateId: string;
    recipientQuery: RecipientQuery;
    variables: Record<string, unknown>;
    channels: ('EMAIL' | 'SMS' | 'IN_APP' | 'PUSH')[];
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    scheduledAt?: Date;
    tenantId: string;
    eventId: string;
  };
  metadata: {
    correlationId: string;
    timestamp: Date;
    source: 'workflow-engine';
  };
}

/**
 * Recipient query resolved by Module 14
 */
interface RecipientQuery {
  type: 'EXPLICIT' | 'ROLE_BASED' | 'DELEGATION' | 'WORKFLOW_ACTORS';
  participantIds?: string[];
  roles?: string[];
  delegationIds?: string[];
  actorTypes?: ('SUBMITTER' | 'APPROVER' | 'REVIEWER')[];
  excludeIds?: string[];
}

/**
 * Module 14 handler for workflow NOTIFY events
 */
export class WorkflowNotifyHandler {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly templateEngine: TemplateEngine,
    private readonly recipientResolver: RecipientResolver,
    private readonly eventBus: EventBus,
  ) {}

  async handle(event: WorkflowNotifyEvent): Promise<void> {
    const { payload, metadata } = event;

    // 1. Resolve recipients from query
    const recipients = await this.recipientResolver.resolve(
      payload.recipientQuery,
      payload.tenantId,
      payload.eventId,
    );

    if (recipients.length === 0) {
      await this.eventBus.emit({
        type: 'WORKFLOW_NOTIFY_SKIPPED',
        payload: {
          workflowInstanceId: payload.workflowInstanceId,
          reason: 'NO_RECIPIENTS',
        },
        metadata: { correlationId: metadata.correlationId },
      });
      return;
    }

    // 2. Load and render template
    const template = await this.templateEngine.load(
      payload.templateId,
      payload.tenantId,
    );

    // 3. Create broadcast message
    const broadcastId = await this.communicationService.createBroadcast({
      tenantId: payload.tenantId,
      eventId: payload.eventId,
      templateId: payload.templateId,
      channels: payload.channels,
      recipients: recipients.map(r => ({
        participantId: r.id,
        variables: {
          ...payload.variables,
          participantName: r.fullName,
          participantEmail: r.email,
          participantRole: r.role,
        },
      })),
      priority: payload.priority,
      scheduledAt: payload.scheduledAt,
      source: 'WORKFLOW',
      sourceRef: payload.workflowInstanceId,
      correlationId: metadata.correlationId,
    });

    // 4. Emit completion event back to workflow
    await this.eventBus.emit({
      type: 'WORKFLOW_NOTIFY_INITIATED',
      payload: {
        workflowInstanceId: payload.workflowInstanceId,
        actionId: payload.actionId,
        broadcastId,
        recipientCount: recipients.length,
        channels: payload.channels,
      },
      metadata: { correlationId: metadata.correlationId },
    });
  }
}
````

#### 7.3.2 Module 09: Registration — Confirmation Emails

```typescript
// ── Integration: Registration lifecycle notifications ──

/**
 * Domain events from Module 09 that trigger Module 14 communications
 */
type RegistrationContentEvents =
  | "PARTICIPANT_REGISTERED"
  | "PARTICIPANT_APPROVED"
  | "PARTICIPANT_REJECTED"
  | "ACCREDITATION_ISSUED"
  | "DELEGATION_SUBMITTED"
  | "DELEGATION_APPROVED"
  | "WAITLIST_PROMOTED"
  | "DOCUMENT_EXPIRING"
  | "BADGE_READY";

/**
 * Auto-notification configuration per event type
 */
const REGISTRATION_NOTIFICATION_MAP: Record<RegistrationContentEvents, NotificationConfig> = {
  PARTICIPANT_REGISTERED: {
    templateSlug: "registration-confirmation",
    channels: ["EMAIL"],
    priority: "NORMAL",
    delay: 0,
  },
  PARTICIPANT_APPROVED: {
    templateSlug: "approval-notification",
    channels: ["EMAIL", "SMS", "PUSH"],
    priority: "HIGH",
    delay: 0,
  },
  PARTICIPANT_REJECTED: {
    templateSlug: "rejection-notification",
    channels: ["EMAIL"],
    priority: "NORMAL",
    delay: 300_000, // 5-min delay for rejection review window
  },
  ACCREDITATION_ISSUED: {
    templateSlug: "accreditation-issued",
    channels: ["EMAIL", "PUSH"],
    priority: "HIGH",
    delay: 0,
    attachCertificate: true,
  },
  DELEGATION_SUBMITTED: {
    templateSlug: "delegation-submitted",
    channels: ["EMAIL"],
    priority: "NORMAL",
    delay: 0,
  },
  DELEGATION_APPROVED: {
    templateSlug: "delegation-approved",
    channels: ["EMAIL", "PUSH"],
    priority: "HIGH",
    delay: 0,
  },
  WAITLIST_PROMOTED: {
    templateSlug: "waitlist-promoted",
    channels: ["EMAIL", "SMS"],
    priority: "HIGH",
    delay: 0,
  },
  DOCUMENT_EXPIRING: {
    templateSlug: "document-expiry-warning",
    channels: ["EMAIL"],
    priority: "NORMAL",
    delay: 0,
  },
  BADGE_READY: {
    templateSlug: "badge-ready-pickup",
    channels: ["EMAIL", "PUSH"],
    priority: "NORMAL",
    delay: 0,
  },
};

interface NotificationConfig {
  templateSlug: string;
  channels: ("EMAIL" | "SMS" | "IN_APP" | "PUSH")[];
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  delay: number;
  attachCertificate?: boolean;
}

/**
 * Registration event listener in Module 14
 */
export class RegistrationNotificationListener {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly certificateService: CertificateService,
    private readonly templateResolver: TemplateResolver,
  ) {}

  async onRegistrationEvent(
    eventType: RegistrationContentEvents,
    payload: RegistrationEventPayload,
  ): Promise<void> {
    const config = REGISTRATION_NOTIFICATION_MAP[eventType];
    if (!config) return;

    // Resolve template for tenant (may be customized)
    const template = await this.templateResolver.resolveBySlug(
      config.templateSlug,
      payload.tenantId,
      payload.eventId,
    );

    if (!template) {
      console.warn(`No template found for ${config.templateSlug} in tenant ${payload.tenantId}`);
      return;
    }

    // Build variable context
    const variables = {
      participantName: payload.participant.fullName,
      participantEmail: payload.participant.email,
      eventName: payload.event.name,
      eventDate: payload.event.startDate,
      eventVenue: payload.event.venue,
      delegationName: payload.delegation?.name,
      delegationCountry: payload.delegation?.country,
      ...payload.additionalVariables,
    };

    // Attach certificate PDF if configured
    let attachments: Attachment[] = [];
    if (config.attachCertificate && payload.certificateId) {
      const pdfBuffer = await this.certificateService.generatePdf(payload.certificateId);
      attachments = [
        {
          filename: `accreditation-${payload.participant.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    // Send with configured delay
    if (config.delay > 0) {
      await this.communicationService.scheduleMessage({
        templateId: template.id,
        recipientId: payload.participant.id,
        channels: config.channels,
        variables,
        attachments,
        scheduledAt: new Date(Date.now() + config.delay),
        tenantId: payload.tenantId,
        eventId: payload.eventId,
      });
    } else {
      await this.communicationService.sendImmediate({
        templateId: template.id,
        recipientId: payload.participant.id,
        channels: config.channels,
        variables,
        attachments,
        priority: config.priority,
        tenantId: payload.tenantId,
        eventId: payload.eventId,
      });
    }
  }
}
```

#### 7.3.3 Module 10: Event Operations — Command Center Widgets

```typescript
// ── Integration: Communication metrics for Command Center ──

/**
 * Real-time communication metrics exposed to Module 10
 */
interface CommunicationDashboardData {
  /** Active broadcast progress */
  activeBroadcasts: {
    id: string;
    subject: string;
    totalRecipients: number;
    delivered: number;
    failed: number;
    pending: number;
    progressPercent: number;
    startedAt: Date;
    estimatedCompletion: Date;
  }[];

  /** Delivery statistics (rolling 24h) */
  deliveryStats: {
    totalSent: number;
    delivered: number;
    bounced: number;
    opened: number;
    clicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };

  /** Channel health */
  channelHealth: {
    channel: "EMAIL" | "SMS" | "PUSH";
    status: "HEALTHY" | "DEGRADED" | "DOWN";
    latencyMs: number;
    errorRate: number;
    lastChecked: Date;
  }[];

  /** Survey response rates */
  surveyMetrics: {
    activeSurveys: number;
    totalResponses: number;
    averageCompletionRate: number;
    averageResponseTime: string;
  };

  /** Certificate generation queue */
  certificateQueue: {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    estimatedWaitTime: string;
  };
}

/**
 * SSE event stream for real-time command center updates
 */
export class ContentDashboardSSE {
  private readonly channels = new Map<string, Set<Response>>();

  /**
   * Module 10 subscribes to content metrics stream
   */
  subscribe(tenantId: string, eventId: string, res: Response): void {
    const key = `${tenantId}:${eventId}`;
    if (!this.channels.has(key)) {
      this.channels.set(key, new Set());
    }
    this.channels.get(key)!.add(res);

    res.on("close", () => {
      this.channels.get(key)?.delete(res);
    });
  }

  /**
   * Emit metric update to all command center subscribers
   */
  emit(tenantId: string, eventId: string, data: Partial<CommunicationDashboardData>): void {
    const key = `${tenantId}:${eventId}`;
    const subscribers = this.channels.get(key);
    if (!subscribers) return;

    const payload = `data: ${JSON.stringify({
      type: "CONTENT_METRICS_UPDATE",
      timestamp: new Date().toISOString(),
      data,
    })}\n\n`;

    for (const res of subscribers) {
      res.write(payload);
    }
  }
}
```

#### 7.3.4 Module 03: Visual Form Designer — Survey Builder Reuse

```typescript
// ── Integration: Survey builder extends form designer ──

/**
 * Survey question types map to form field types with extensions
 */
const SURVEY_FIELD_TYPE_MAP: Record<string, FormFieldType> = {
  SHORT_TEXT: 'TEXT',
  LONG_TEXT: 'TEXTAREA',
  SINGLE_CHOICE: 'RADIO',
  MULTIPLE_CHOICE: 'CHECKBOX',
  RATING: 'CUSTOM', // Extended with star rating component
  SCALE: 'CUSTOM',  // Extended with Likert scale component
  MATRIX: 'CUSTOM', // Extended with matrix grid component
  NPS: 'CUSTOM',    // Extended with NPS score component
  DATE: 'DATE',
  NUMBER: 'NUMBER',
  DROPDOWN: 'SELECT',
  FILE_UPLOAD: 'FILE',
  RANKING: 'CUSTOM', // Extended with drag-to-rank component
};

/**
 * Shared form designer components reused by survey builder
 */
interface SurveyDesignerConfig {
  /** Reuse @dnd-kit drag-and-drop from Module 03 */
  dragAndDrop: typeof import('@dnd-kit/core');

  /** Reuse 12-column grid system */
  gridSystem: GridSystemConfig;

  /** Reuse conditional visibility engine */
  conditionalVisibility: ConditionalEngine;

  /** Survey-specific extensions */
  extensions: {
    /** Section/page breaks with progress indicator */
    sectionBreaks: true;
    /** Question piping (insert previous answer) */
    questionPiping: true;
    /** Skip logic (more complex than form conditionals) */
    skipLogic: true;
    /** Randomization of question/option order */
    randomization: true;
    /** Response validation with custom rules */
    responseValidation: true;
  };
}

/**
 * Survey builder component wrapping form designer
 */
export function SurveyBuilder({
  survey,
  onSave,
}: {
  survey: Survey;
  onSave: (survey: Survey) => void;
}) {
  // Reuses FormDesigner from Module 03 with survey-specific
  // field palette, preview mode, and analytics preview
  return (
    <FormDesigner
      mode="survey"
      schema={surveyToFormSchema(survey)}
      fieldPalette={SURVEY_FIELD_PALETTE}
      onSchemaChange={(schema) => onSave(formSchemaToSurvey(schema, survey))}
      previewMode="survey"
      extensions={{
        sectionBreaks: true,
        skipLogic: true,
        questionPiping: true,
        randomization: true,
      }}
    />
  );
}
```

#### 7.3.5 Module 16: Participant Experience — Mobile Push & Digital Certificates

```typescript
// ── Integration: Push notifications and digital certificates ──

/**
 * Module 14 pushes to Module 16's mobile notification system
 */
interface MobilePushIntegration {
  /** Send push notification via Module 16's push service */
  sendPush(params: {
    participantId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
    action?: {
      type: "OPEN_SURVEY" | "VIEW_CERTIFICATE" | "VIEW_MESSAGE";
      targetId: string;
    };
    tenantId: string;
    eventId: string;
  }): Promise<{ delivered: boolean; pushId: string }>;

  /** Register certificate in participant's digital wallet */
  registerDigitalCertificate(params: {
    participantId: string;
    certificateId: string;
    certificateType: string;
    qrCode: string;
    pdfUrl: string;
    validUntil?: Date;
    tenantId: string;
    eventId: string;
  }): Promise<void>;

  /** Embed survey link in participant's event agenda */
  embedSurveyLink(params: {
    participantId: string;
    surveyId: string;
    surveyTitle: string;
    dueDate?: Date;
    sessionId?: string;
    tenantId: string;
    eventId: string;
  }): Promise<void>;
}

/**
 * Implementation bridge between Module 14 and Module 16
 */
export class ParticipantContentBridge implements MobilePushIntegration {
  constructor(
    private readonly pushService: PushNotificationService,
    private readonly walletService: DigitalWalletService,
    private readonly agendaService: AgendaService,
  ) {}

  async sendPush(params: Parameters<MobilePushIntegration["sendPush"]>[0]) {
    const deviceTokens = await this.pushService.getDeviceTokens(params.participantId);

    if (deviceTokens.length === 0) {
      return { delivered: false, pushId: "" };
    }

    const pushId = await this.pushService.send({
      tokens: deviceTokens,
      notification: {
        title: params.title,
        body: params.body,
        imageUrl: params.imageUrl,
      },
      data: {
        ...params.data,
        action: params.action ? JSON.stringify(params.action) : undefined,
      },
    });

    return { delivered: true, pushId };
  }

  async registerDigitalCertificate(
    params: Parameters<MobilePushIntegration["registerDigitalCertificate"]>[0],
  ) {
    await this.walletService.addItem({
      participantId: params.participantId,
      type: "CERTIFICATE",
      itemId: params.certificateId,
      metadata: {
        certificateType: params.certificateType,
        qrCode: params.qrCode,
        pdfUrl: params.pdfUrl,
        validUntil: params.validUntil,
      },
      tenantId: params.tenantId,
      eventId: params.eventId,
    });
  }

  async embedSurveyLink(params: Parameters<MobilePushIntegration["embedSurveyLink"]>[0]) {
    await this.agendaService.addAgendaItem({
      participantId: params.participantId,
      type: "SURVEY",
      title: params.surveyTitle,
      itemId: params.surveyId,
      dueDate: params.dueDate,
      linkedSessionId: params.sessionId,
      tenantId: params.tenantId,
      eventId: params.eventId,
    });
  }
}
```

#### 7.3.6 Module 15: Compliance & Governance — Expiry Notifications

```typescript
// ── Integration: Compliance-driven notifications ──

/**
 * Module 15 triggers content notifications for compliance events
 */
interface ComplianceContentTriggers {
  /** Document approaching expiry */
  DOCUMENT_EXPIRY_WARNING: {
    participantId: string;
    documentType: string;
    documentName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    renewalUrl: string;
  };

  /** Data retention notice */
  DATA_RETENTION_NOTICE: {
    participantId: string;
    dataCategory: string;
    retentionEndDate: Date;
    actionRequired: "ACKNOWLEDGE" | "DOWNLOAD" | "NONE";
  };

  /** Risk assessment requires notification */
  RISK_ALERT_NOTIFICATION: {
    recipientRoles: string[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    riskCategory: string;
    description: string;
    mitigationRequired: boolean;
  };

  /** Sustainability report ready */
  SUSTAINABILITY_REPORT_READY: {
    reportId: string;
    reportType: string;
    recipientRoles: string[];
    downloadUrl: string;
  };
}

/**
 * Compliance notification scheduler
 * Runs as a background job to check upcoming expirations
 */
export class ComplianceNotificationScheduler {
  async checkExpiringDocuments(tenantId: string, eventId: string): Promise<void> {
    const warningThresholds = [30, 14, 7, 3, 1]; // days before expiry

    for (const days of warningThresholds) {
      const expiringDocs = await this.documentService.findExpiring(tenantId, eventId, days);

      for (const doc of expiringDocs) {
        const alreadyNotified = await this.notificationLog.exists(doc.id, `expiry-${days}d`);

        if (!alreadyNotified) {
          await this.communicationService.sendImmediate({
            templateSlug: `document-expiry-${days}d`,
            recipientId: doc.participantId,
            channels: days <= 3 ? ["EMAIL", "SMS"] : ["EMAIL"],
            variables: {
              documentName: doc.name,
              documentType: doc.type,
              expiryDate: doc.expiryDate,
              daysUntilExpiry: days,
              renewalUrl: doc.renewalUrl,
            },
            priority: days <= 3 ? "HIGH" : "NORMAL",
            tenantId,
            eventId,
          });

          await this.notificationLog.record(doc.id, `expiry-${days}d`);
        }
      }
    }
  }
}
```

#### 7.3.7 Module 17: Settings & Configuration — Content Settings Registry

```typescript
// ── Integration: Content module settings registration ──

/**
 * Settings keys registered with Module 17's settings registry
 * See Section 8 for full configuration details
 */
export const CONTENT_SETTINGS_REGISTRY = {
  namespace: "content",
  categories: [
    {
      key: "communication",
      label: "Communication Hub",
      settingsCount: 18,
      description: "Email, SMS, and push notification configuration",
    },
    {
      key: "templates",
      label: "Template Marketplace",
      settingsCount: 12,
      description: "Template sharing and marketplace settings",
    },
    {
      key: "surveys",
      label: "Post-Event Surveys",
      settingsCount: 10,
      description: "Survey creation and distribution settings",
    },
    {
      key: "certificates",
      label: "Certificate Generation",
      settingsCount: 14,
      description: "Certificate design, signing, and verification",
    },
  ],
  totalSettings: 54,
} as const;

/**
 * Settings change listener for runtime reconfiguration
 */
export class ContentSettingsListener {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly communicationService: CommunicationService,
    private readonly templateService: TemplateService,
  ) {
    // Subscribe to settings changes from Module 17
    this.settingsService.onSettingsChange("content.*", this.handleSettingsChange.bind(this));
  }

  private async handleSettingsChange(
    key: string,
    newValue: unknown,
    oldValue: unknown,
  ): Promise<void> {
    const [, category, setting] = key.split(".");

    switch (category) {
      case "communication":
        await this.communicationService.reconfigure(setting, newValue);
        break;
      case "templates":
        await this.templateService.reconfigure(setting, newValue);
        break;
    }
  }
}
```

---

## 8. Configuration

Module 14 exposes a comprehensive set of configuration keys organized across its four functional domains. All settings follow the hierarchical override pattern: System Default → Tenant → Event.

### 8.1 Settings Keys

#### 8.1.1 Communication Hub Settings

| Key                                               | Type       | Default                  | Scope  | Description                                    |
| ------------------------------------------------- | ---------- | ------------------------ | ------ | ---------------------------------------------- |
| `content.communication.provider`                  | `enum`     | `'AZURE_CS'`             | System | Email service provider                         |
| `content.communication.azureConnectionString`     | `string`   | `''`                     | System | Azure Communication Services connection string |
| `content.communication.senderEmail`               | `string`   | `'noreply@platform.com'` | Tenant | Default sender email address                   |
| `content.communication.senderName`                | `string`   | `'Event Platform'`       | Tenant | Default sender display name                    |
| `content.communication.batchSize`                 | `number`   | `100`                    | System | Messages per batch in broadcast                |
| `content.communication.batchDelayMs`              | `number`   | `1000`                   | System | Delay between batches (rate limiting)          |
| `content.communication.maxRecipientsPerBroadcast` | `number`   | `10000`                  | Tenant | Maximum recipients per single broadcast        |
| `content.communication.retryPolicy.maxAttempts`   | `number`   | `3`                      | System | Maximum delivery retry attempts                |
| `content.communication.retryPolicy.backoffMs`     | `number[]` | `[1000, 5000, 30000]`    | System | Exponential backoff delays                     |
| `content.communication.bounceThreshold`           | `number`   | `5`                      | Tenant | Bounces before address suppression             |
| `content.communication.unsubscribeEnabled`        | `boolean`  | `true`                   | Tenant | Show unsubscribe link in emails                |
| `content.communication.trackOpens`                | `boolean`  | `true`                   | Event  | Track email open rates                         |
| `content.communication.trackClicks`               | `boolean`  | `true`                   | Event  | Track link click rates                         |
| `content.communication.dailySendLimit`            | `number`   | `50000`                  | Tenant | Maximum daily send volume                      |
| `content.communication.smsProvider`               | `enum`     | `'AZURE_CS'`             | System | SMS service provider                           |
| `content.communication.smsMaxLength`              | `number`   | `160`                    | System | SMS character limit per segment                |
| `content.communication.pushEnabled`               | `boolean`  | `true`                   | Event  | Enable push notifications                      |
| `content.communication.inAppEnabled`              | `boolean`  | `true`                   | Event  | Enable in-app notifications                    |

#### 8.1.2 Template Marketplace Settings

| Key                                        | Type       | Default    | Scope  | Description                                 |
| ------------------------------------------ | ---------- | ---------- | ------ | ------------------------------------------- |
| `content.templates.marketplaceEnabled`     | `boolean`  | `true`     | System | Enable template marketplace                 |
| `content.templates.reviewMode`             | `enum`     | `'MANUAL'` | System | `MANUAL` \| `AUTO_APPROVE` \| `AI_ASSISTED` |
| `content.templates.maxTemplateSizeKb`      | `number`   | `512`      | System | Maximum template file size                  |
| `content.templates.maxVersions`            | `number`   | `20`       | System | Maximum versions per template               |
| `content.templates.categoriesEnabled`      | `string[]` | `['all']`  | Tenant | Enabled marketplace categories              |
| `content.templates.allowCrossEventSharing` | `boolean`  | `true`     | Tenant | Allow templates across events               |
| `content.templates.defaultLicense`         | `enum`     | `'FREE'`   | Tenant | Default template license type               |
| `content.templates.richTextEditor`         | `enum`     | `'TIPTAP'` | System | Rich text editor library                    |
| `content.templates.variablePrefix`         | `string`   | `'{{'`     | System | Template variable open delimiter            |
| `content.templates.variableSuffix`         | `string`   | `'}}'`     | System | Template variable close delimiter           |
| `content.templates.previewSampleData`      | `boolean`  | `true`     | System | Auto-generate preview sample data           |
| `content.templates.auditChanges`           | `boolean`  | `true`     | System | Audit trail for template edits              |

#### 8.1.3 Survey Settings

| Key                                      | Type       | Default                  | Scope  | Description                         |
| ---------------------------------------- | ---------- | ------------------------ | ------ | ----------------------------------- |
| `content.surveys.sendAfterHours`         | `number`   | `2`                      | Event  | Hours after session to send survey  |
| `content.surveys.reminderSchedule`       | `number[]` | `[24, 72]`               | Event  | Reminder intervals in hours         |
| `content.surveys.maxReminders`           | `number`   | `3`                      | Event  | Maximum reminder count              |
| `content.surveys.autoCloseAfterDays`     | `number`   | `14`                     | Event  | Auto-close survey after N days      |
| `content.surveys.sentimentAnalysis`      | `boolean`  | `false`                  | Tenant | Enable AI sentiment analysis        |
| `content.surveys.anonymousDefault`       | `boolean`  | `false`                  | Event  | Default survey anonymity            |
| `content.surveys.requiredCompletionRate` | `number`   | `0`                      | Event  | Minimum completion % (0 = optional) |
| `content.surveys.exportFormats`          | `string[]` | `['csv', 'xlsx', 'pdf']` | System | Available export formats            |
| `content.surveys.questionBank.enabled`   | `boolean`  | `true`                   | Tenant | Enable shared question bank         |
| `content.surveys.responseRateAlert`      | `number`   | `20`                     | Event  | Alert if rate below this %          |

#### 8.1.4 Certificate Settings

| Key                                        | Type       | Default                      | Scope  | Description                       |
| ------------------------------------------ | ---------- | ---------------------------- | ------ | --------------------------------- |
| `content.certificates.signingEnabled`      | `boolean`  | `true`                       | Tenant | Enable digital signing            |
| `content.certificates.signingSecret`       | `string`   | `''`                         | Tenant | HMAC signing secret (encrypted)   |
| `content.certificates.signingAlgorithm`    | `enum`     | `'HMAC-SHA256'`              | System | Signing algorithm                 |
| `content.certificates.qrCodeFormat`        | `enum`     | `'URL'`                      | Tenant | `URL` \| `DATA_MATRIX` \| `AZTEC` |
| `content.certificates.qrCodeSize`          | `number`   | `200`                        | System | QR code pixel dimensions          |
| `content.certificates.verificationBaseUrl` | `string`   | `'/verify'`                  | Tenant | Public verification URL prefix    |
| `content.certificates.pdfRenderer`         | `enum`     | `'REACT_PDF'`                | System | `REACT_PDF` \| `PUPPETEER`        |
| `content.certificates.bulkConcurrency`     | `number`   | `5`                          | System | Parallel certificate generation   |
| `content.certificates.bulkBatchSize`       | `number`   | `50`                         | System | Certificates per batch            |
| `content.certificates.templateFormats`     | `string[]` | `['A4', 'LETTER', 'CUSTOM']` | System | Available page formats            |
| `content.certificates.cacheTtlSeconds`     | `number`   | `3600`                       | System | Generated PDF cache TTL           |
| `content.certificates.maxFileSizeMb`       | `number`   | `10`                         | System | Maximum certificate PDF size      |
| `content.certificates.expiryEnabled`       | `boolean`  | `false`                      | Event  | Certificates can expire           |
| `content.certificates.defaultValidityDays` | `number`   | `365`                        | Event  | Default certificate validity      |

### 8.2 Feature Flags

| Flag                                  | Default | Description                                |
| ------------------------------------- | ------- | ------------------------------------------ |
| `FF_CONTENT_BROADCAST_COMPOSER_V2`    | `false` | New broadcast composer with AI assistance  |
| `FF_CONTENT_TEMPLATE_MARKETPLACE`     | `true`  | Enable marketplace feature                 |
| `FF_CONTENT_TEMPLATE_AI_REVIEW`       | `false` | AI-assisted template review                |
| `FF_CONTENT_SURVEY_SENTIMENT`         | `false` | Sentiment analysis for open-text responses |
| `FF_CONTENT_SURVEY_BRANCHING`         | `true`  | Survey skip logic / branching              |
| `FF_CONTENT_SURVEY_PIPING`            | `false` | Question piping (insert prior answers)     |
| `FF_CONTENT_CERTIFICATE_DIGITAL_SIGN` | `true`  | HMAC digital signing                       |
| `FF_CONTENT_CERTIFICATE_BLOCKCHAIN`   | `false` | Blockchain-based verification              |
| `FF_CONTENT_CERTIFICATE_BULK_V2`      | `false` | Improved bulk generation pipeline          |
| `FF_CONTENT_PUSH_NOTIFICATIONS`       | `true`  | Push notification channel                  |
| `FF_CONTENT_SMS_CHANNEL`              | `true`  | SMS notification channel                   |
| `FF_CONTENT_SCHEDULED_MESSAGES`       | `true`  | Scheduled message delivery                 |
| `FF_CONTENT_A_B_TESTING`              | `false` | A/B testing for message subject lines      |
| `FF_CONTENT_WEBHOOK_DELIVERY_LOG`     | `true`  | Detailed webhook delivery logging          |
| `FF_CONTENT_INLINE_ANALYTICS`         | `true`  | Inline delivery analytics                  |
| `FF_CONTENT_DARK_MODE_TEMPLATES`      | `false` | Dark mode support in email templates       |

### 8.3 Environment Variables

```typescript
// ── Environment variable schema (Zod) ──

import { z } from "zod";

export const ContentEnvSchema = z.object({
  // Azure Communication Services
  AZURE_CS_CONNECTION_STRING: z.string().min(1),
  AZURE_CS_SENDER_EMAIL: z.string().email().default("noreply@events.platform.com"),
  AZURE_CS_SMS_SENDER: z.string().optional(),

  // Email Configuration
  EMAIL_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(100),
  EMAIL_BATCH_DELAY_MS: z.coerce.number().int().min(100).max(10000).default(1000),
  EMAIL_DAILY_LIMIT: z.coerce.number().int().min(100).default(50000),
  EMAIL_TRACK_OPENS: z.enum(["true", "false"]).default("true"),
  EMAIL_TRACK_CLICKS: z.enum(["true", "false"]).default("true"),

  // Certificate Generation
  CERTIFICATE_SIGNING_SECRET: z.string().min(32).optional(),
  CERTIFICATE_VERIFICATION_BASE_URL: z.string().url().optional(),
  CERTIFICATE_PDF_RENDERER: z.enum(["REACT_PDF", "PUPPETEER"]).default("REACT_PDF"),
  CERTIFICATE_BULK_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(5),
  CERTIFICATE_CACHE_TTL: z.coerce.number().int().default(3600),

  // Survey Configuration
  SURVEY_SENTIMENT_ENDPOINT: z.string().url().optional(),
  SURVEY_SENTIMENT_API_KEY: z.string().optional(),
  SURVEY_AUTO_CLOSE_DAYS: z.coerce.number().int().default(14),

  // Template Marketplace
  TEMPLATE_MAX_SIZE_KB: z.coerce.number().int().default(512),
  TEMPLATE_MARKETPLACE_ENABLED: z.enum(["true", "false"]).default("true"),

  // Push Notifications
  PUSH_FIREBASE_PROJECT_ID: z.string().optional(),
  PUSH_FIREBASE_CREDENTIALS_PATH: z.string().optional(),

  // File Storage
  AZURE_BLOB_CONTENT_CONTAINER: z.string().default("content-assets"),

  // Background Jobs
  CONTENT_JOB_QUEUE_CONCURRENCY: z.coerce.number().int().default(5),
  CONTENT_JOB_RETENTION_DAYS: z.coerce.number().int().default(30),
});

export type ContentEnv = z.infer<typeof ContentEnvSchema>;
```

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E (12)  │  Playwright
                    │  Critical   │  browser tests
                    │  workflows  │
                   ─┤             ├─
                  / └─────────────┘ \
                 /   ┌───────────────┐\
                /    │Integration(28)│  \
               /     │ API + DB      │   \
              /      │ multi-service │    \
             /       └───────────────┘     \
            /      ┌───────────────────┐    \
           /       │   Unit (180+)     │     \
          /        │ Pure functions    │      \
         /         │ Business logic    │       \
        /          │ Validation rules  │        \
       /           └───────────────────┘         \
      ─────────────────────────────────────────────
```

### 9.2 Unit Tests

#### 9.2.1 Communication Hub Unit Tests

```typescript
// ── tests/unit/communication/delivery-pipeline.test.ts ──

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeliveryPipeline } from "@/modules/content/services/delivery-pipeline";
import { createMockTemplate, createMockRecipient } from "@/tests/factories/content";

describe("DeliveryPipeline", () => {
  let pipeline: DeliveryPipeline;
  let mockEmailProvider: MockEmailProvider;
  let mockSmsProvider: MockSmsProvider;
  let mockDeliveryRepo: MockDeliveryRepository;

  beforeEach(() => {
    mockEmailProvider = createMockEmailProvider();
    mockSmsProvider = createMockSmsProvider();
    mockDeliveryRepo = createMockDeliveryRepository();
    pipeline = new DeliveryPipeline(mockEmailProvider, mockSmsProvider, mockDeliveryRepo);
  });

  describe("sendBatch", () => {
    it("should send emails in configured batch sizes", async () => {
      const recipients = Array.from({ length: 250 }, (_, i) =>
        createMockRecipient({ id: `r-${i}` }),
      );
      const template = createMockTemplate({ channels: ["EMAIL"] });

      await pipeline.sendBatch({
        template,
        recipients,
        batchSize: 100,
        batchDelayMs: 0,
      });

      // 3 batches: 100 + 100 + 50
      expect(mockEmailProvider.sendBatch).toHaveBeenCalledTimes(3);
      expect(mockEmailProvider.sendBatch.mock.calls[0][0]).toHaveLength(100);
      expect(mockEmailProvider.sendBatch.mock.calls[1][0]).toHaveLength(100);
      expect(mockEmailProvider.sendBatch.mock.calls[2][0]).toHaveLength(50);
    });

    it("should record delivery status for each recipient", async () => {
      const recipients = [
        createMockRecipient({ id: "r-1", email: "success@test.com" }),
        createMockRecipient({ id: "r-2", email: "bounce@test.com" }),
      ];
      const template = createMockTemplate();

      mockEmailProvider.sendBatch.mockResolvedValue([
        { recipientId: "r-1", status: "DELIVERED", messageId: "msg-1" },
        { recipientId: "r-2", status: "BOUNCED", error: "Invalid address" },
      ]);

      await pipeline.sendBatch({ template, recipients, batchSize: 100 });

      expect(mockDeliveryRepo.updateStatus).toHaveBeenCalledWith("r-1", "DELIVERED");
      expect(mockDeliveryRepo.updateStatus).toHaveBeenCalledWith("r-2", "BOUNCED");
    });

    it("should retry failed messages up to maxAttempts", async () => {
      const recipients = [createMockRecipient({ id: "r-1" })];
      const template = createMockTemplate();

      mockEmailProvider.sendBatch
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce([{ recipientId: "r-1", status: "DELIVERED", messageId: "msg-1" }]);

      await pipeline.sendBatch({
        template,
        recipients,
        batchSize: 100,
        retryPolicy: { maxAttempts: 3, backoffMs: [0, 0, 0] },
      });

      expect(mockEmailProvider.sendBatch).toHaveBeenCalledTimes(3);
      expect(mockDeliveryRepo.updateStatus).toHaveBeenCalledWith("r-1", "DELIVERED");
    });

    it("should suppress bounced addresses after threshold", async () => {
      const recipient = createMockRecipient({ id: "r-1", email: "bounced@test.com" });
      mockDeliveryRepo.getBounceCount.mockResolvedValue(5);

      const result = await pipeline.shouldSuppress(recipient.email, "tenant-1");

      expect(result).toBe(true);
    });
  });

  describe("renderTemplate", () => {
    it("should interpolate variables in template body", () => {
      const template = createMockTemplate({
        body: "Hello {{participantName}}, welcome to {{eventName}}!",
      });
      const variables = {
        participantName: "Dr. Abebe",
        eventName: "AU Summit 2025",
      };

      const rendered = pipeline.renderTemplate(template, variables);

      expect(rendered).toBe("Hello Dr. Abebe, welcome to AU Summit 2025!");
    });

    it("should handle missing variables with fallback", () => {
      const template = createMockTemplate({
        body: "Hello {{participantName|Guest}}, your role is {{role|Participant}}.",
      });

      const rendered = pipeline.renderTemplate(template, {});

      expect(rendered).toBe("Hello Guest, your role is Participant.");
    });

    it("should sanitize HTML in variable values", () => {
      const template = createMockTemplate({
        body: "Welcome {{name}}!",
      });

      const rendered = pipeline.renderTemplate(template, {
        name: '<script>alert("xss")</script>John',
      });

      expect(rendered).not.toContain("<script>");
      expect(rendered).toContain("John");
    });
  });
});
```

#### 9.2.2 Certificate Generation Unit Tests

```typescript
// ── tests/unit/certificates/certificate-generator.test.ts ──

describe("CertificateGenerator", () => {
  let generator: CertificateGenerator;

  beforeEach(() => {
    generator = new CertificateGenerator({
      signingSecret: "test-secret-key-minimum-32-chars!",
      qrCodeFormat: "URL",
      verificationBaseUrl: "https://verify.events.com",
    });
  });

  describe("generateVerificationCode", () => {
    it("should produce unique codes for different certificates", () => {
      const code1 = generator.generateVerificationCode("cert-1", "tenant-1");
      const code2 = generator.generateVerificationCode("cert-2", "tenant-1");

      expect(code1).not.toBe(code2);
      expect(code1).toHaveLength(32);
    });

    it("should produce deterministic codes for same input", () => {
      const code1 = generator.generateVerificationCode("cert-1", "tenant-1");
      const code2 = generator.generateVerificationCode("cert-1", "tenant-1");

      expect(code1).toBe(code2);
    });
  });

  describe("generateQRCode", () => {
    it("should encode verification URL in QR code", async () => {
      const qrData = await generator.generateQRCode("VERIFY-ABC123", "https://verify.events.com");

      expect(qrData).toContain("data:image/png;base64,");
    });
  });

  describe("signCertificate", () => {
    it("should produce valid HMAC-SHA256 signature", () => {
      const payload = {
        certificateId: "cert-1",
        participantName: "Dr. Abebe Kebede",
        eventName: "AU Summit 2025",
        issuedAt: new Date("2025-01-15"),
      };

      const signature = generator.signCertificate(payload);

      expect(signature).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
    });

    it("should verify valid signatures", () => {
      const payload = {
        certificateId: "cert-1",
        participantName: "Dr. Abebe Kebede",
        issuedAt: new Date("2025-01-15"),
      };

      const signature = generator.signCertificate(payload);
      const isValid = generator.verifyCertificate(payload, signature);

      expect(isValid).toBe(true);
    });

    it("should reject tampered signatures", () => {
      const payload = {
        certificateId: "cert-1",
        participantName: "Dr. Abebe Kebede",
        issuedAt: new Date("2025-01-15"),
      };

      const signature = generator.signCertificate(payload);

      // Tamper with payload
      payload.participantName = "Fake Name";
      const isValid = generator.verifyCertificate(payload, signature);

      expect(isValid).toBe(false);
    });
  });

  describe("bulkGenerate", () => {
    it("should generate certificates with concurrency limit", async () => {
      const participants = Array.from({ length: 20 }, (_, i) => ({
        id: `p-${i}`,
        name: `Participant ${i}`,
        role: "DELEGATE",
      }));

      const results = await generator.bulkGenerate({
        templateId: "tmpl-1",
        participants,
        concurrency: 5,
        tenantId: "tenant-1",
        eventId: "event-1",
      });

      expect(results.successful).toHaveLength(20);
      expect(results.failed).toHaveLength(0);
    });
  });
});
```

#### 9.2.3 Survey Distribution Unit Tests

```typescript
// ── tests/unit/surveys/survey-distribution.test.ts ──

describe("SurveyDistribution", () => {
  let distribution: SurveyDistributionService;

  beforeEach(() => {
    distribution = new SurveyDistributionService(
      createMockSurveyRepo(),
      createMockCommunicationService(),
      createMockParticipantService(),
    );
  });

  describe("distributePostSession", () => {
    it("should send survey after configured delay", async () => {
      const survey = createMockSurvey({
        triggerType: "POST_SESSION",
        sendAfterHours: 2,
      });
      const session = createMockSession({ endedAt: new Date() });

      const result = await distribution.schedulePostSession(survey, session);

      expect(result.scheduledAt.getTime()).toBe(session.endedAt.getTime() + 2 * 60 * 60 * 1000);
    });

    it("should exclude participants who already responded", async () => {
      const survey = createMockSurvey({ id: "survey-1" });
      const attendees = ["p-1", "p-2", "p-3"];

      distribution.surveyRepo.getRespondents.mockResolvedValue(["p-2"]);

      const recipients = await distribution.resolveRecipients(survey, attendees);

      expect(recipients).toEqual(["p-1", "p-3"]);
    });

    it("should respect survey anonymity settings", async () => {
      const survey = createMockSurvey({ anonymous: true });

      const link = distribution.generateResponseLink(survey, "p-1");

      expect(link).not.toContain("p-1");
      expect(link).toContain("anonymous=true");
    });
  });

  describe("sendReminders", () => {
    it("should send reminders at configured intervals", async () => {
      const survey = createMockSurvey({
        reminderSchedule: [24, 72],
        maxReminders: 3,
        distributedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h ago
      });

      const pendingReminders = distribution.getDueReminders(survey);

      expect(pendingReminders).toHaveLength(1);
      expect(pendingReminders[0].reminderNumber).toBe(1);
    });

    it("should not exceed maxReminders", async () => {
      const survey = createMockSurvey({
        reminderSchedule: [24, 48, 72],
        maxReminders: 2,
      });

      distribution.surveyRepo.getReminderCount.mockResolvedValue(2);

      const shouldSend = await distribution.shouldSendReminder(survey, "p-1");

      expect(shouldSend).toBe(false);
    });
  });

  describe("calculateCompletionRate", () => {
    it("should calculate response rate correctly", () => {
      const stats = {
        totalDistributed: 200,
        totalResponses: 150,
        completedResponses: 120,
        partialResponses: 30,
      };

      const rate = distribution.calculateCompletionRate(stats);

      expect(rate.responseRate).toBe(75); // 150/200
      expect(rate.completionRate).toBe(60); // 120/200
      expect(rate.partialRate).toBe(15); // 30/200
    });
  });
});
```

### 9.3 Integration Tests

```typescript
// ── tests/integration/content/broadcast-lifecycle.test.ts ──

describe("Broadcast Lifecycle (Integration)", () => {
  let app: TestApp;
  let db: PrismaClient;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(PrismaClient);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should complete full broadcast lifecycle", async () => {
    // 1. Create template
    const template = await request(app.server)
      .post("/api/v1/content/templates")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Welcome Email",
        subject: "Welcome to {{eventName}}",
        body: "<p>Dear {{participantName}},</p><p>Welcome!</p>",
        channel: "EMAIL",
      })
      .expect(201);

    // 2. Create broadcast
    const broadcast = await request(app.server)
      .post("/api/v1/content/broadcasts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        templateId: template.body.id,
        recipientFilter: { status: "APPROVED" },
        scheduledAt: null, // Send immediately
      })
      .expect(201);

    expect(broadcast.body.status).toBe("DRAFT");

    // 3. Send broadcast
    await request(app.server)
      .post(`/api/v1/content/broadcasts/${broadcast.body.id}/send`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // 4. Verify delivery records created
    await waitForCondition(async () => {
      const deliveries = await db.messageDelivery.findMany({
        where: { broadcastId: broadcast.body.id },
      });
      return deliveries.length > 0;
    });

    const deliveries = await db.messageDelivery.findMany({
      where: { broadcastId: broadcast.body.id },
    });

    expect(deliveries.length).toBeGreaterThan(0);
    expect(deliveries.every((d) => d.status !== "PENDING")).toBe(true);

    // 5. Verify broadcast status updated
    const updatedBroadcast = await db.broadcastMessage.findUnique({
      where: { id: broadcast.body.id },
    });

    expect(updatedBroadcast?.status).toBe("COMPLETED");
  });

  it("should handle template installation from marketplace", async () => {
    // 1. Publish template to marketplace
    const published = await request(app.server)
      .post("/api/v1/content/marketplace/publish")
      .set("Authorization", `Bearer ${publisherToken}`)
      .send({
        templateId: "tmpl-1",
        category: "REGISTRATION",
        description: "Registration confirmation template",
        tags: ["registration", "confirmation"],
      })
      .expect(201);

    // 2. Install in different tenant
    const installed = await request(app.server)
      .post("/api/v1/content/marketplace/install")
      .set("Authorization", `Bearer ${otherTenantToken}`)
      .send({ marketplaceTemplateId: published.body.id })
      .expect(201);

    // 3. Verify installed template is independent copy
    const installedTemplate = await db.messageTemplate.findUnique({
      where: { id: installed.body.templateId },
    });

    expect(installedTemplate?.tenantId).not.toBe(published.body.tenantId);
    expect(installedTemplate?.sourceTemplateId).toBe(published.body.templateId);
  });
});
```

### 9.4 E2E Tests (Playwright)

```typescript
// ── tests/e2e/content/broadcast-composer.spec.ts ──

import { test, expect } from "@playwright/test";
import { loginAsAdmin, seedTestData } from "@/tests/e2e/helpers";

test.describe("Broadcast Composer", () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData("broadcast-composer");
    await loginAsAdmin(page);
  });

  test("should create and send a broadcast message", async ({ page }) => {
    await page.goto("/content/broadcasts/new");

    // Step 1: Select template
    await page.getByRole("combobox", { name: "Template" }).click();
    await page.getByRole("option", { name: "Welcome Email" }).click();

    // Step 2: Configure recipients
    await page.getByRole("tab", { name: "Recipients" }).click();
    await page.getByRole("combobox", { name: "Filter by status" }).click();
    await page.getByRole("option", { name: "Approved" }).click();

    const recipientCount = page.getByTestId("recipient-count");
    await expect(recipientCount).toContainText("150 recipients");

    // Step 3: Preview
    await page.getByRole("tab", { name: "Preview" }).click();
    await expect(page.getByTestId("preview-frame")).toBeVisible();

    // Step 4: Send
    await page.getByRole("button", { name: "Send Now" }).click();
    await page.getByRole("button", { name: "Confirm Send" }).click();

    // Verify success
    await expect(page.getByText("Broadcast sent successfully")).toBeVisible();
    await expect(page.getByTestId("broadcast-status")).toContainText("SENDING");
  });

  test("should save broadcast as draft and resume", async ({ page }) => {
    await page.goto("/content/broadcasts/new");

    await page.getByRole("combobox", { name: "Template" }).click();
    await page.getByRole("option", { name: "Event Reminder" }).click();

    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page.getByText("Draft saved")).toBeVisible();

    // Navigate away and back
    await page.goto("/content/broadcasts");
    await page.getByText("Event Reminder").click();

    // Verify draft state preserved
    await expect(page.getByRole("combobox", { name: "Template" })).toHaveText("Event Reminder");
  });
});

// ── tests/e2e/content/certificate-designer.spec.ts ──

test.describe("Certificate Designer", () => {
  test("should design and preview certificate template", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/content/certificates/templates/new");

    // Set certificate title
    await page.getByLabel("Certificate Title").fill("Certificate of Participation");

    // Add participant name field
    await page.getByRole("button", { name: "Add Field" }).click();
    await page.getByRole("option", { name: "Participant Name" }).click();

    // Position field using drag
    const field = page.getByTestId("field-participantName");
    await field.dragTo(page.getByTestId("certificate-canvas"), {
      targetPosition: { x: 300, y: 250 },
    });

    // Add QR code
    await page.getByRole("button", { name: "Add QR Code" }).click();

    // Preview
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByTestId("certificate-preview")).toBeVisible();

    // Save
    await page.getByRole("button", { name: "Save Template" }).click();
    await expect(page.getByText("Template saved successfully")).toBeVisible();
  });
});
```

### 9.5 Test Data Factories

```typescript
// ── tests/factories/content.ts ──

import { faker } from "@faker-js/faker";

export function createMockTemplate(overrides: Partial<MessageTemplate> = {}): MessageTemplate {
  return {
    id: faker.string.uuid(),
    tenantId: "test-tenant",
    eventId: "test-event",
    name: faker.lorem.words(3),
    slug: faker.helpers.slugify(faker.lorem.words(3)),
    subject: faker.lorem.sentence(),
    body: `<p>Hello {{participantName}},</p><p>${faker.lorem.paragraph()}</p>`,
    channel: "EMAIL",
    category: "NOTIFICATION",
    variables: ["participantName", "eventName"],
    isActive: true,
    version: 1,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    createdBy: faker.string.uuid(),
    ...overrides,
  };
}

export function createMockBroadcast(overrides: Partial<BroadcastMessage> = {}): BroadcastMessage {
  return {
    id: faker.string.uuid(),
    tenantId: "test-tenant",
    eventId: "test-event",
    templateId: faker.string.uuid(),
    subject: faker.lorem.sentence(),
    status: "DRAFT",
    totalRecipients: faker.number.int({ min: 10, max: 1000 }),
    deliveredCount: 0,
    failedCount: 0,
    openedCount: 0,
    clickedCount: 0,
    scheduledAt: null,
    sentAt: null,
    completedAt: null,
    createdBy: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockSurvey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: faker.string.uuid(),
    tenantId: "test-tenant",
    eventId: "test-event",
    title: faker.lorem.words(4),
    description: faker.lorem.paragraph(),
    status: "DRAFT",
    anonymous: false,
    triggerType: "MANUAL",
    sendAfterHours: 2,
    reminderSchedule: [24, 72],
    maxReminders: 3,
    autoCloseAfterDays: 14,
    questions: [],
    createdBy: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockCertificate(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: faker.string.uuid(),
    tenantId: "test-tenant",
    eventId: "test-event",
    templateId: faker.string.uuid(),
    participantId: faker.string.uuid(),
    participantName: faker.person.fullName(),
    certificateType: "PARTICIPATION",
    status: "ISSUED",
    verificationCode: faker.string.alphanumeric(32).toUpperCase(),
    signature: faker.string.hexadecimal({ length: 64 }),
    qrCodeUrl: faker.internet.url(),
    pdfUrl: faker.internet.url(),
    issuedAt: faker.date.past(),
    validUntil: faker.date.future(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

export function createMockRecipient(overrides: Partial<Recipient> = {}): Recipient {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    fullName: faker.person.fullName(),
    phone: faker.phone.number(),
    role: "DELEGATE",
    delegationId: faker.string.uuid(),
    locale: "en",
    ...overrides,
  };
}
```

### 9.6 Performance Test Scenarios (K6)

```javascript
// ── tests/performance/content/broadcast-load.k6.js ──

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const deliveryLatency = new Trend("delivery_latency");
const deliveryErrorRate = new Rate("delivery_errors");

export const options = {
  scenarios: {
    broadcast_send: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "2m", target: 50 },
        { duration: "1m", target: 100 },
        { duration: "30s", target: 0 },
      ],
    },
    survey_submission: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "3m",
      preAllocatedVUs: 200,
    },
    certificate_generation: {
      executor: "shared-iterations",
      vus: 20,
      iterations: 1000,
      maxDuration: "10m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    delivery_errors: ["rate<0.01"],
    delivery_latency: ["p(95)<3000"],
  },
};

export function broadcastSend() {
  const res = http.post(
    `${__ENV.BASE_URL}/api/v1/content/broadcasts`,
    JSON.stringify({
      templateId: __ENV.TEMPLATE_ID,
      recipientFilter: { status: "APPROVED" },
    }),
    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${__ENV.TOKEN}` } },
  );

  check(res, {
    "broadcast created": (r) => r.status === 201,
  });

  deliveryLatency.add(res.timings.duration);
  if (res.status !== 201) deliveryErrorRate.add(1);

  sleep(1);
}

export function surveySubmission() {
  const res = http.post(
    `${__ENV.BASE_URL}/api/v1/content/surveys/${__ENV.SURVEY_ID}/responses`,
    JSON.stringify({
      answers: [
        { questionId: "q1", value: 4 },
        { questionId: "q2", value: "Excellent organization" },
        { questionId: "q3", value: ["networking", "sessions"] },
      ],
    }),
    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${__ENV.TOKEN}` } },
  );

  check(res, {
    "survey submitted": (r) => r.status === 201,
    "response time OK": (r) => r.timings.duration < 2000,
  });
}
```

---

## 10. Security Considerations

### 10.1 RBAC Permission Matrix

| Permission               | Communication Admin | Template Publisher | Survey Designer | Certificate Manager | Event Admin | Viewer |
| ------------------------ | :-----------------: | :----------------: | :-------------: | :-----------------: | :---------: | :----: |
| **Communication Hub**    |                     |                    |                 |                     |             |        |
| Create/edit templates    |         ✅          |         ❌         |       ❌        |         ❌          |     ✅      |   ❌   |
| Send broadcasts          |         ✅          |         ❌         |       ❌        |         ❌          |     ✅      |   ❌   |
| View delivery analytics  |         ✅          |         ❌         |       ❌        |         ❌          |     ✅      |   ✅   |
| Manage suppression list  |         ✅          |         ❌         |       ❌        |         ❌          |     ❌      |   ❌   |
| View message content     |         ✅          |         ❌         |       ❌        |         ❌          |     ✅      |   ❌   |
| **Template Marketplace** |                     |                    |                 |                     |             |        |
| Publish templates        |         ❌          |         ✅         |       ❌        |         ❌          |     ✅      |   ❌   |
| Review submissions       |         ❌          |         ✅         |       ❌        |         ❌          |     ✅      |   ❌   |
| Install templates        |         ✅          |         ✅         |       ✅        |         ✅          |     ✅      |   ❌   |
| Manage categories        |         ❌          |         ✅         |       ❌        |         ❌          |     ✅      |   ❌   |
| **Surveys**              |                     |                    |                 |                     |             |        |
| Create/edit surveys      |         ❌          |         ❌         |       ✅        |         ❌          |     ✅      |   ❌   |
| Distribute surveys       |         ❌          |         ❌         |       ✅        |         ❌          |     ✅      |   ❌   |
| View responses           |         ❌          |         ❌         |       ✅        |         ❌          |     ✅      |   ✅   |
| Export data              |         ❌          |         ❌         |       ✅        |         ❌          |     ✅      |   ❌   |
| Delete responses         |         ❌          |         ❌         |       ❌        |         ❌          |     ✅      |   ❌   |
| **Certificates**         |                     |                    |                 |                     |             |        |
| Design templates         |         ❌          |         ❌         |       ❌        |         ✅          |     ✅      |   ❌   |
| Issue certificates       |         ❌          |         ❌         |       ❌        |         ✅          |     ✅      |   ❌   |
| Bulk generate            |         ❌          |         ❌         |       ❌        |         ✅          |     ✅      |   ❌   |
| Revoke certificates      |         ❌          |         ❌         |       ❌        |         ✅          |     ✅      |   ❌   |
| Verify certificates      |         ✅          |         ✅         |       ✅        |         ✅          |     ✅      |   ✅   |

### 10.2 Data Protection

#### 10.2.1 Message Content Security

```typescript
// ── Security: Message content protection ──

/**
 * Encryption for stored message content
 */
export class MessageContentEncryption {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32;

  /**
   * Encrypt message body before storage
   * Personal data in messages is encrypted at rest
   */
  encrypt(plaintext: string, tenantKey: Buffer): EncryptedPayload {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, tenantKey, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      algorithm: this.algorithm,
    };
  }

  /**
   * Decrypt for authorized viewing
   */
  decrypt(payload: EncryptedPayload, tenantKey: Buffer): string {
    const decipher = crypto.createDecipheriv(
      payload.algorithm,
      tenantKey,
      Buffer.from(payload.iv, "hex"),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));

    let decrypted = decipher.update(payload.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
```

#### 10.2.2 Survey Anonymity Protection

```typescript
// ── Security: Survey anonymity ──

/**
 * Ensures anonymous survey responses cannot be linked to participants
 */
export class SurveyAnonymityGuard {
  /**
   * For anonymous surveys, generate one-time response tokens
   * that cannot be traced back to participants
   */
  generateAnonymousToken(surveyId: string, participantId: string): string {
    // Use HMAC with survey-specific salt to create unlinkable token
    const salt = crypto.randomBytes(32);
    const hmac = crypto.createHmac("sha256", salt);
    hmac.update(`${surveyId}:${participantId}:${Date.now()}`);
    const token = hmac.digest("hex");

    // Store only the hashed token (not the original participant mapping)
    // This allows detecting duplicate submissions without identifying respondent
    return token;
  }

  /**
   * Validate response doesn't leak identity in anonymous mode
   */
  sanitizeAnonymousResponse(response: SurveyResponse): SurveyResponse {
    return {
      ...response,
      // Strip all identifying fields
      participantId: null,
      ipAddress: null,
      userAgent: null,
      // Keep only anonymous token for duplicate detection
      anonymousToken: response.anonymousToken,
      // Sanitize free-text responses (optional, configurable)
      answers: response.answers.map((a) => ({
        ...a,
        // Flag but don't auto-remove potential PII in text answers
        containsPotentialPII: this.detectPII(a.textValue),
      })),
    };
  }

  private detectPII(text?: string): boolean {
    if (!text) return false;
    const piiPatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/, // SSN-like
    ];
    return piiPatterns.some((p) => p.test(text));
  }
}
```

#### 10.2.3 Certificate Anti-Forgery

```typescript
// ── Security: Certificate verification ──

/**
 * Multi-layer certificate verification
 */
export class CertificateVerificationService {
  constructor(
    private readonly certificateRepo: CertificateRepository,
    private readonly signingService: SigningService,
  ) {}

  /**
   * Public verification endpoint (no auth required)
   */
  async verify(verificationCode: string): Promise<VerificationResult> {
    // 1. Lookup certificate by verification code
    const certificate = await this.certificateRepo.findByVerificationCode(verificationCode);

    if (!certificate) {
      return {
        valid: false,
        reason: "CERTIFICATE_NOT_FOUND",
        message: "No certificate found with this verification code.",
      };
    }

    // 2. Check revocation status
    if (certificate.status === "REVOKED") {
      return {
        valid: false,
        reason: "CERTIFICATE_REVOKED",
        message: "This certificate has been revoked.",
        revokedAt: certificate.revokedAt,
      };
    }

    // 3. Check expiration
    if (certificate.validUntil && certificate.validUntil < new Date()) {
      return {
        valid: false,
        reason: "CERTIFICATE_EXPIRED",
        message: "This certificate has expired.",
        expiredAt: certificate.validUntil,
      };
    }

    // 4. Verify digital signature integrity
    const signatureValid = await this.signingService.verify(
      certificate.signaturePayload,
      certificate.signature,
      certificate.tenantId,
    );

    if (!signatureValid) {
      return {
        valid: false,
        reason: "SIGNATURE_INVALID",
        message:
          "Certificate signature verification failed. This certificate may have been tampered with.",
      };
    }

    // 5. All checks passed
    return {
      valid: true,
      certificate: {
        participantName: certificate.participantName,
        eventName: certificate.eventName,
        certificateType: certificate.certificateType,
        issuedAt: certificate.issuedAt,
        validUntil: certificate.validUntil,
        issuerName: certificate.issuerName,
      },
    };
  }
}
```

### 10.3 Input Validation & XSS Prevention

```typescript
// ── Security: Content input validation ──

import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

/**
 * Template content validation with XSS prevention
 */
export const TemplateContentSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  subject: z.string().min(1).max(500).trim(),
  body: z
    .string()
    .min(1)
    .max(500_000) // 500KB max
    .transform((html) =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "h1",
          "h2",
          "h3",
          "h4",
          "ul",
          "ol",
          "li",
          "a",
          "img",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "div",
          "span",
          "blockquote",
          "hr",
        ],
        ALLOWED_ATTR: [
          "href",
          "src",
          "alt",
          "class",
          "style",
          "target",
          "width",
          "height",
          "align",
          "colspan",
          "rowspan",
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        FORBID_TAGS: ["script", "iframe", "form", "input", "object", "embed"],
        FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
      }),
    ),
  variables: z.array(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)).optional(),
});

/**
 * Survey question validation
 */
export const SurveyQuestionSchema = z.object({
  text: z.string().min(1).max(1000).trim(),
  type: z.enum([
    "SHORT_TEXT",
    "LONG_TEXT",
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "RATING",
    "SCALE",
    "MATRIX",
    "NPS",
    "DATE",
    "NUMBER",
    "DROPDOWN",
    "FILE_UPLOAD",
    "RANKING",
  ]),
  required: z.boolean().default(false),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(500).trim(),
        value: z.string().min(1).max(200),
      }),
    )
    .optional(),
  validation: z
    .object({
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().max(10000).optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      pattern: z.string().max(500).optional(),
    })
    .optional(),
});

/**
 * File upload validation for template assets
 */
export const TemplateFileSchema = z.object({
  filename: z
    .string()
    .max(255)
    .regex(/^[a-zA-Z0-9_\-. ]+$/),
  mimetype: z.enum([
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
    "text/html",
    "text/css",
  ]),
  size: z.number().max(5 * 1024 * 1024), // 5MB max
});
```

### 10.4 Rate Limiting

```typescript
// ── Security: Content-specific rate limits ──

export const CONTENT_RATE_LIMITS = {
  // Broadcast operations
  "POST /broadcasts": {
    windowMs: 60_000,
    maxRequests: 10,
    scope: "tenant",
    message: "Too many broadcast attempts. Please wait before creating another.",
  },
  "POST /broadcasts/:id/send": {
    windowMs: 300_000, // 5 minutes
    maxRequests: 5,
    scope: "tenant",
    message: "Send rate limit exceeded. Broadcasting is throttled for safety.",
  },

  // Survey submissions (per participant)
  "POST /surveys/:id/responses": {
    windowMs: 60_000,
    maxRequests: 5,
    scope: "user",
    message: "Too many survey submissions. Please wait.",
  },

  // Certificate generation
  "POST /certificates/bulk": {
    windowMs: 600_000, // 10 minutes
    maxRequests: 3,
    scope: "tenant",
    message: "Bulk generation rate limit. Please wait for current batch.",
  },

  // Certificate verification (public, needs protection)
  "GET /verify/:code": {
    windowMs: 60_000,
    maxRequests: 30,
    scope: "ip",
    message: "Too many verification attempts.",
  },

  // Template marketplace
  "POST /marketplace/publish": {
    windowMs: 3600_000, // 1 hour
    maxRequests: 10,
    scope: "user",
    message: "Publishing rate limit exceeded.",
  },

  // File uploads
  "POST /templates/:id/assets": {
    windowMs: 60_000,
    maxRequests: 20,
    scope: "user",
    message: "File upload rate limit exceeded.",
  },
};
```

### 10.5 Audit Trail

```typescript
// ── Security: Content audit events ──

export const CONTENT_AUDIT_EVENTS = {
  // Communication
  BROADCAST_CREATED: { severity: "INFO", category: "COMMUNICATION" },
  BROADCAST_SENT: { severity: "INFO", category: "COMMUNICATION" },
  BROADCAST_CANCELLED: { severity: "WARN", category: "COMMUNICATION" },
  TEMPLATE_MODIFIED: { severity: "INFO", category: "COMMUNICATION" },
  SUPPRESSION_ADDED: { severity: "WARN", category: "COMMUNICATION" },
  SUPPRESSION_REMOVED: { severity: "WARN", category: "COMMUNICATION" },

  // Marketplace
  TEMPLATE_PUBLISHED: { severity: "INFO", category: "MARKETPLACE" },
  TEMPLATE_UNPUBLISHED: { severity: "WARN", category: "MARKETPLACE" },
  TEMPLATE_INSTALLED: { severity: "INFO", category: "MARKETPLACE" },
  TEMPLATE_REVIEW_APPROVED: { severity: "INFO", category: "MARKETPLACE" },
  TEMPLATE_REVIEW_REJECTED: { severity: "WARN", category: "MARKETPLACE" },

  // Surveys
  SURVEY_CREATED: { severity: "INFO", category: "SURVEY" },
  SURVEY_DISTRIBUTED: { severity: "INFO", category: "SURVEY" },
  SURVEY_CLOSED: { severity: "INFO", category: "SURVEY" },
  SURVEY_RESPONSE_DELETED: { severity: "WARN", category: "SURVEY" },
  SURVEY_DATA_EXPORTED: { severity: "INFO", category: "SURVEY" },

  // Certificates
  CERTIFICATE_ISSUED: { severity: "INFO", category: "CERTIFICATE" },
  CERTIFICATE_REVOKED: { severity: "WARN", category: "CERTIFICATE" },
  CERTIFICATE_VERIFIED: { severity: "INFO", category: "CERTIFICATE" },
  CERTIFICATE_BULK_GENERATED: { severity: "INFO", category: "CERTIFICATE" },
  CERTIFICATE_TEMPLATE_MODIFIED: { severity: "INFO", category: "CERTIFICATE" },
} as const;
```

---

## 11. Performance Requirements

### 11.1 Response Time Targets

| Operation                    | P50   | P95   | P99   | Max   | Notes                   |
| ---------------------------- | ----- | ----- | ----- | ----- | ----------------------- |
| **Communication Hub**        |       |       |       |       |                         |
| Load template list           | 80ms  | 200ms | 500ms | 1s    | Paginated, cached       |
| Render template preview      | 100ms | 300ms | 600ms | 1.5s  | Client-side rendering   |
| Create broadcast (draft)     | 50ms  | 150ms | 300ms | 800ms | Metadata only           |
| Start broadcast send         | 200ms | 500ms | 1s    | 2s    | Enqueues background job |
| Delivery status update (SSE) | 10ms  | 50ms  | 100ms | 200ms | Real-time push          |
| Load delivery analytics      | 150ms | 400ms | 800ms | 2s    | Aggregated queries      |
| **Template Marketplace**     |       |       |       |       |                         |
| Browse marketplace           | 100ms | 250ms | 500ms | 1s    | Paginated, cached       |
| Install template             | 200ms | 500ms | 1s    | 2s    | Copy + validate         |
| Publish template             | 300ms | 800ms | 1.5s  | 3s    | Validation + indexing   |
| Search templates             | 80ms  | 200ms | 400ms | 1s    | Full-text search        |
| **Surveys**                  |       |       |       |       |                         |
| Load survey form             | 100ms | 250ms | 500ms | 1s    | Client-side rendering   |
| Submit response              | 50ms  | 150ms | 300ms | 800ms | Single write            |
| Load results dashboard       | 200ms | 500ms | 1s    | 2s    | Aggregation queries     |
| Export survey data           | 500ms | 2s    | 5s    | 15s   | Depends on volume       |
| **Certificates**             |       |       |       |       |                         |
| Generate single PDF          | 500ms | 1.5s  | 3s    | 5s    | React-PDF rendering     |
| Verify certificate           | 30ms  | 80ms  | 150ms | 300ms | Cached lookup + HMAC    |
| Bulk generate (per cert)     | 300ms | 800ms | 1.5s  | 3s    | Parallel processing     |
| Load certificate gallery     | 100ms | 250ms | 500ms | 1s    | Paginated               |

### 11.2 Throughput Requirements

| Metric                        | Target                         | Strategy                                  |
| ----------------------------- | ------------------------------ | ----------------------------------------- |
| Email broadcast throughput    | 10,000 emails in < 5 min       | Batched sending with Azure CS SDK         |
| SMS broadcast throughput      | 5,000 SMS in < 10 min          | Rate-limited batches per provider limits  |
| Certificate bulk generation   | 1,000 certificates in < 10 min | Parallel workers (5 concurrent)           |
| Survey concurrent submissions | 500+ simultaneous              | Connection pooling, write batching        |
| Template marketplace search   | 1,000 req/min                  | Elasticsearch / PostgreSQL FTS with cache |
| SSE connections (active)      | 500 per event                  | Redis-backed pub/sub                      |
| Webhook delivery attempts     | 100 req/sec peak               | Background job queue with backpressure    |

### 11.3 Caching Strategy

```typescript
// ── Performance: Caching configuration ──

export const CONTENT_CACHE_CONFIG = {
  // Template caching
  templates: {
    key: "content:template:{tenantId}:{templateId}",
    ttl: 300, // 5 minutes
    invalidateOn: ["TEMPLATE_MODIFIED", "TEMPLATE_DELETED"],
    strategy: "write-through",
  },

  // Marketplace listing cache
  marketplace: {
    key: "content:marketplace:list:{category}:{page}",
    ttl: 60, // 1 minute (frequently updated)
    invalidateOn: ["TEMPLATE_PUBLISHED", "TEMPLATE_UNPUBLISHED"],
    strategy: "cache-aside",
  },

  // Survey form structure (rarely changes once distributed)
  surveyForm: {
    key: "content:survey:{surveyId}:form",
    ttl: 3600, // 1 hour
    invalidateOn: ["SURVEY_MODIFIED"],
    strategy: "write-through",
  },

  // Survey aggregate results (frequently read during active survey)
  surveyResults: {
    key: "content:survey:{surveyId}:results",
    ttl: 30, // 30 seconds (near real-time)
    invalidateOn: ["SURVEY_RESPONSE_SUBMITTED"],
    strategy: "cache-aside",
  },

  // Certificate verification (public, high-traffic)
  certificateVerification: {
    key: "content:cert:verify:{verificationCode}",
    ttl: 3600, // 1 hour
    invalidateOn: ["CERTIFICATE_REVOKED"],
    strategy: "write-through",
  },

  // Generated PDF cache
  certificatePdf: {
    key: "content:cert:pdf:{certificateId}",
    ttl: 86400, // 24 hours
    invalidateOn: ["CERTIFICATE_REVOKED", "CERTIFICATE_REGENERATED"],
    strategy: "cache-aside",
    storage: "blob", // Stored in Azure Blob, not Redis
  },

  // Delivery analytics aggregation
  deliveryAnalytics: {
    key: "content:analytics:{tenantId}:{eventId}:{period}",
    ttl: 60, // 1 minute
    invalidateOn: ["DELIVERY_STATUS_UPDATED"],
    strategy: "cache-aside",
  },
};
```

### 11.4 Database Optimization

```sql
-- ── Performance: Content-specific indexes ──

-- Broadcast message delivery tracking
CREATE INDEX CONCURRENTLY idx_message_delivery_broadcast_status
  ON "MessageDelivery" ("broadcastId", "status")
  WHERE "status" IN ('PENDING', 'SENDING');

-- Fast bounce count lookup for suppression
CREATE INDEX CONCURRENTLY idx_message_delivery_bounce_count
  ON "MessageDelivery" ("recipientEmail", "status")
  WHERE "status" = 'BOUNCED';

-- Survey response aggregation
CREATE INDEX CONCURRENTLY idx_survey_response_survey_completed
  ON "SurveyResponse" ("surveyId", "completedAt")
  WHERE "completedAt" IS NOT NULL;

-- Certificate verification (public endpoint, must be fast)
CREATE UNIQUE INDEX CONCURRENTLY idx_certificate_verification_code
  ON "Certificate" ("verificationCode")
  WHERE "status" != 'REVOKED';

-- Template marketplace full-text search
CREATE INDEX CONCURRENTLY idx_marketplace_template_search
  ON "MarketplaceTemplate" USING GIN (
    to_tsvector('english', "name" || ' ' || COALESCE("description", ''))
  )
  WHERE "status" = 'PUBLISHED';

-- Scheduled message processing
CREATE INDEX CONCURRENTLY idx_message_schedule_pending
  ON "MessageSchedule" ("scheduledAt", "status")
  WHERE "status" = 'PENDING' AND "scheduledAt" <= NOW();

-- Delivery analytics time-series
CREATE INDEX CONCURRENTLY idx_message_delivery_analytics
  ON "MessageDelivery" ("tenantId", "eventId", "createdAt")
  INCLUDE ("status", "channel");
```

### 11.5 Scalability Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                 Content Module Scaling Tiers                 │
├─────────────────┬────────────────┬──────────────────────────┤
│                 │   Tier 1       │   Tier 2                 │
│   Metric        │   (< 5K users) │   (5K-50K users)         │
├─────────────────┼────────────────┼──────────────────────────┤
│ Email Provider  │ Azure CS       │ Azure CS + SendGrid      │
│                 │ Single region  │ Multi-region failover    │
├─────────────────┼────────────────┼──────────────────────────┤
│ PDF Generation  │ React-PDF      │ React-PDF + Puppeteer    │
│                 │ In-process     │ Worker pool (k8s jobs)   │
├─────────────────┼────────────────┼──────────────────────────┤
│ Survey Storage  │ PostgreSQL     │ PostgreSQL + TimescaleDB │
│                 │ Single table   │ Partitioned by event     │
├─────────────────┼────────────────┼──────────────────────────┤
│ Cache Layer     │ In-memory      │ Redis Cluster            │
│                 │ LRU cache      │ Read replicas            │
├─────────────────┼────────────────┼──────────────────────────┤
│ SSE Connections │ Node.js native │ Redis pub/sub adapter    │
│                 │ Single server  │ Distributed backplane    │
├─────────────────┼────────────────┼──────────────────────────┤
│ Job Queue       │ pg-boss        │ pg-boss + partitioned    │
│                 │ Single worker  │ Multi-worker, priority   │
└─────────────────┴────────────────┴──────────────────────────┘
```

---

## 12. Open Questions and Decisions

### 12.1 Architecture Decision Records

#### ADR-14-001: Email Service Provider Selection

| Aspect           | Decision                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                          |
| **Context**      | Need reliable email delivery for broadcasts, notifications, and transactional messages            |
| **Decision**     | Use Azure Communication Services as primary provider                                              |
| **Rationale**    | Already in Azure ecosystem; unified API for email + SMS; good deliverability; SLA alignment       |
| **Alternatives** | SendGrid (more email features, higher volume), AWS SES (cheapest), Postmark (best deliverability) |
| **Consequences** | Vendor lock-in to Azure; may need secondary provider for high-volume tenants                      |
| **Review Date**  | Q3 2025 — evaluate volume needs and deliverability metrics                                        |

#### ADR-14-002: Template Marketplace Moderation Model

| Aspect           | Decision                                                                      |
| ---------------- | ----------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                      |
| **Context**      | Need to balance template quality with publishing velocity                     |
| **Decision**     | Manual review for initial launch, AI-assisted review in Phase 2               |
| **Rationale**    | Small initial catalog justifies manual review; AI review can accelerate later |
| **Alternatives** | Auto-approve all (risk of low quality), community voting (cold-start problem) |
| **Consequences** | Review bottleneck possible; need dedicated reviewer role                      |

#### ADR-14-003: PDF Rendering Engine

| Aspect           | Decision                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                        |
| **Context**      | Need PDF generation for certificates and reports                                                |
| **Decision**     | @react-pdf/renderer as primary, Puppeteer as fallback for complex layouts                       |
| **Rationale**    | React-PDF is lighter, faster, and maintains React component model; Puppeteer handles edge cases |
| **Alternatives** | Puppeteer-only (heavier, slower), wkhtmltopdf (legacy), PDFKit (low-level)                      |
| **Consequences** | Two rendering paths to maintain; need clear criteria for when to use each                       |

#### ADR-14-004: Rich Text Editor Selection

| Aspect           | Decision                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                  |
| **Context**      | Template editor needs rich text with variable insertion, tables, and images               |
| **Decision**     | Tiptap (based on ProseMirror)                                                             |
| **Rationale**    | Extensible, headless architecture, good TypeScript support, active community              |
| **Alternatives** | Slate.js (more flexibility, steeper learning), TinyMCE (mature, heavier), Quill (simpler) |
| **Consequences** | Need custom extensions for template variables and preview mode                            |

#### ADR-14-005: Survey Question Matching for Analytics

| Aspect           | Decision                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Status**       | Proposed                                                                                |
| **Context**      | Cross-event survey comparison needs question matching (same question asked differently) |
| **Decision**     | Use question bank with canonical IDs; optional NLP matching in Phase 3                  |
| **Rationale**    | Canonical IDs are reliable and simple; NLP adds value for legacy surveys                |
| **Alternatives** | Manual mapping only, embedding-based similarity (complex), no cross-event comparison    |
| **Consequences** | Requires question bank adoption; NLP matching deferred                                  |

### 12.2 Open Questions

| #   | Question                                                                         | Priority | Owner       | Status    | Target Date |
| --- | -------------------------------------------------------------------------------- | -------- | ----------- | --------- | ----------- |
| 1   | Should we support email A/B testing for subject lines in v1?                     | Medium   | Product     | Open      | Phase 2     |
| 2   | How to handle template variable conflicts during marketplace install?            | High     | Engineering | In Review | Phase 1     |
| 3   | Should survey responses be stored in separate partitioned tables per event?      | Medium   | DBA         | Open      | Phase 2     |
| 4   | Certificate blockchain verification — is there actual demand?                    | Low      | Product     | Open      | Phase 3     |
| 5   | Should we support multi-language template variants or single template with i18n? | High     | Engineering | In Review | Phase 1     |
| 6   | What is the SLA for email delivery confirmation (real-time vs batch)?            | Medium   | Engineering | Open      | Phase 1     |
| 7   | Should marketplace templates support paid/premium tiers?                         | Low      | Product     | Open      | Phase 3     |
| 8   | How to handle template version rollback when broadcast is in progress?           | High     | Engineering | Open      | Phase 1     |
| 9   | Should we generate certificates as SVG for better scaling?                       | Medium   | Engineering | Open      | Phase 2     |
| 10  | What is the data retention policy for delivery tracking data?                    | High     | Compliance  | In Review | Phase 1     |

---

## Appendix

### A. Message Template Variable Reference

| Variable                      | Type     | Source        | Description          | Example                                 |
| ----------------------------- | -------- | ------------- | -------------------- | --------------------------------------- |
| `{{participantName}}`         | `string` | Participant   | Full name            | Dr. Abebe Kebede                        |
| `{{participantEmail}}`        | `string` | Participant   | Email address        | abebe@example.com                       |
| `{{participantTitle}}`        | `string` | Participant   | Title/honorific      | H.E. Ambassador                         |
| `{{participantRole}}`         | `string` | Participant   | Registration role    | DELEGATE                                |
| `{{participantBadgeId}}`      | `string` | Badge         | Badge identifier     | AU-2025-DEL-0042                        |
| `{{delegationName}}`          | `string` | Delegation    | Delegation name      | Federal Democratic Republic of Ethiopia |
| `{{delegationCountry}}`       | `string` | Delegation    | Country code         | ET                                      |
| `{{eventName}}`               | `string` | Event         | Event name           | 38th AU Summit                          |
| `{{eventDate}}`               | `date`   | Event         | Start date           | February 15, 2025                       |
| `{{eventEndDate}}`            | `date`   | Event         | End date             | February 16, 2025                       |
| `{{eventVenue}}`              | `string` | Event         | Primary venue        | African Union Headquarters              |
| `{{eventCity}}`               | `string` | Event         | City                 | Addis Ababa                             |
| `{{registrationStatus}}`      | `string` | Registration  | Current status       | APPROVED                                |
| `{{accreditationNumber}}`     | `string` | Accreditation | Accreditation ID     | ACC-2025-0142                           |
| `{{accommodationHotel}}`      | `string` | Logistics     | Hotel name           | Sheraton Addis                          |
| `{{accommodationCheckIn}}`    | `date`   | Logistics     | Check-in date        | February 14, 2025                       |
| `{{transportPickupTime}}`     | `time`   | Logistics     | Pickup time          | 08:30 AM                                |
| `{{transportPickupLocation}}` | `string` | Logistics     | Pickup point         | Hotel Lobby                             |
| `{{verificationUrl}}`         | `url`    | Certificate   | Verification link    | https://verify.events.com/ABCD1234      |
| `{{surveyUrl}}`               | `url`    | Survey        | Survey response link | https://app.events.com/s/xyz            |
| `{{unsubscribeUrl}}`          | `url`    | System        | Unsubscribe link     | https://app.events.com/unsub/token      |
| `{{currentDate}}`             | `date`   | System        | Today's date         | February 13, 2025                       |
| `{{tenantName}}`              | `string` | Tenant        | Organization name    | African Union Commission                |
| `{{tenantLogo}}`              | `url`    | Tenant        | Logo URL             | https://cdn.events.com/logo.png         |

### B. Template Marketplace Categories and Tags

| Category             | Subcategories                                            | Common Tags                            |
| -------------------- | -------------------------------------------------------- | -------------------------------------- |
| **Registration**     | Confirmation, Approval, Rejection, Waitlist              | `registration`, `approval`, `welcome`  |
| **Accreditation**    | Badge Ready, Credential Issued, Document Request         | `accreditation`, `badge`, `credential` |
| **Event Operations** | Check-in, Schedule Change, Emergency                     | `operations`, `schedule`, `alert`      |
| **Logistics**        | Transport, Accommodation, Catering                       | `logistics`, `transport`, `hotel`      |
| **Protocol**         | VIP Welcome, Bilateral Confirmation, Gift Acknowledgment | `protocol`, `vip`, `diplomatic`        |
| **Survey**           | Post-Session, Post-Event, Feedback Request               | `survey`, `feedback`, `evaluation`     |
| **Certificate**      | Participation, Completion, Speaker, Volunteer            | `certificate`, `recognition`, `award`  |
| **Administrative**   | Password Reset, Account Setup, System Notice             | `admin`, `system`, `account`           |
| **Reminders**        | Event Reminder, Document Expiry, Action Required         | `reminder`, `deadline`, `action`       |
| **Communication**    | Newsletter, Announcement, Press Release                  | `announcement`, `newsletter`, `media`  |

### C. Survey Question Type Configuration

| Question Type     | Response Format       | Validation Options                      | Analysis Method            |
| ----------------- | --------------------- | --------------------------------------- | -------------------------- |
| `SHORT_TEXT`      | String (≤500 chars)   | Required, min/max length, regex pattern | Word cloud, text search    |
| `LONG_TEXT`       | String (≤5000 chars)  | Required, min/max length                | Sentiment analysis, themes |
| `SINGLE_CHOICE`   | Single option ID      | Required                                | Frequency distribution     |
| `MULTIPLE_CHOICE` | Array of option IDs   | Required, min/max selections            | Co-occurrence matrix       |
| `RATING`          | Integer (1-5 or 1-10) | Required, custom scale                  | Mean, median, distribution |
| `SCALE`           | Integer (Likert 1-7)  | Required, custom anchors                | Mean, standard deviation   |
| `MATRIX`          | Map of row→column     | Required rows, single/multi per row     | Cross-tabulation           |
| `NPS`             | Integer (0-10)        | Required                                | NPS score calculation      |
| `DATE`            | ISO date string       | Required, min/max date                  | Timeline distribution      |
| `NUMBER`          | Numeric               | Required, min/max, decimal places       | Statistical analysis       |
| `DROPDOWN`        | Single option ID      | Required                                | Frequency distribution     |
| `FILE_UPLOAD`     | File reference        | Required, max size, allowed types       | Manual review              |
| `RANKING`         | Ordered array of IDs  | Required, rank all/partial              | Weighted ranking score     |

### D. Certificate Verification Protocol

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Verifier   │        │  Verification │        │   Database   │
│  (Browser)   │        │   API (Public)│        │  (Encrypted) │
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │
       │  1. Scan QR Code      │                       │
       │  GET /verify/{code}   │                       │
       │──────────────────────►│                       │
       │                       │  2. Lookup by code    │
       │                       │──────────────────────►│
       │                       │                       │
       │                       │  3. Certificate data  │
       │                       │◄──────────────────────│
       │                       │                       │
       │                       │  4. Check status      │
       │                       │  - Not revoked?       │
       │                       │  - Not expired?       │
       │                       │  - Signature valid?   │
       │                       │                       │
       │  5. Verification      │                       │
       │     Result (JSON)     │                       │
       │◄──────────────────────│                       │
       │                       │                       │
       │  ┌─────────────────┐  │                       │
       │  │ ✅ VALID         │  │                       │
       │  │ Name: Dr. Abebe │  │                       │
       │  │ Event: AU Summit│  │                       │
       │  │ Issued: 2025-01 │  │                       │
       │  └─────────────────┘  │                       │
       │                       │  6. Log verification  │
       │                       │──────────────────────►│
```

**Verification Response Schema:**

```typescript
interface VerificationResponse {
  valid: boolean;
  reason?:
    | "CERTIFICATE_NOT_FOUND"
    | "CERTIFICATE_REVOKED"
    | "CERTIFICATE_EXPIRED"
    | "SIGNATURE_INVALID";
  message?: string;
  certificate?: {
    participantName: string;
    eventName: string;
    certificateType: string;
    issuedAt: string;
    validUntil?: string;
    issuerName: string;
  };
  verifiedAt: string;
}
```

### E. Related ADRs and References

**Cross-Module References:**

| Reference                                                                           | Module | Section | Relationship                              |
| ----------------------------------------------------------------------------------- | ------ | ------- | ----------------------------------------- |
| [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)                   | 01     | §3      | Base entity schemas, tenant model         |
| [Module 02: Dynamic Schema Engine](./02-DYNAMIC-SCHEMA-ENGINE.md)                   | 02     | §5.4    | Custom field resolution in templates      |
| [Module 03: Visual Form Designer](./03-VISUAL-FORM-DESIGNER.md)                     | 03     | §6      | Shared form components for survey builder |
| [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md)                               | 04     | §5.3    | NOTIFY action integration                 |
| [Module 05: Security and Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)       | 05     | §3.2    | RBAC permission definitions               |
| [Module 06: Infrastructure and DevOps](./06-INFRASTRUCTURE-AND-DEVOPS.md)           | 06     | §4.3    | Background job framework (pg-boss)        |
| [Module 07: API and Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)           | 07     | §4.4    | SSE event streaming, webhook delivery     |
| [Module 08: UI/UX and Frontend](./08-UI-UX-AND-FRONTEND.md)                         | 08     | §6      | Design tokens, shared components          |
| [Module 09: Registration and Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md) | 09     | §5.5    | Registration lifecycle notifications      |
| [Module 10: Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md)               | 10     | §7      | Command center communication widgets      |
| [Module 11: Logistics and Venue](./11-LOGISTICS-AND-VENUE.md)                       | 11     | §7      | Transport/accommodation notifications     |
| [Module 12: Protocol and Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md)                 | 12     | §7      | VIP communication templates               |
| [Module 13: People and Workforce](./13-PEOPLE-AND-WORKFORCE.md)                     | 13     | §7      | Staff/volunteer notifications             |
| [Module 15: Compliance and Governance](./15-COMPLIANCE-AND-GOVERNANCE.md)           | 15     | §7      | Document expiry, data retention           |
| [Module 16: Participant Experience](./16-PARTICIPANT-EXPERIENCE.md)                 | 16     | §7      | Mobile push, digital certificates         |
| [Module 17: Settings and Configuration](./17-SETTINGS-AND-CONFIGURATION.md)         | 17     | §3      | Settings keys registry                    |

**External References:**

| Resource                             | URL                                                            | Relevance                  |
| ------------------------------------ | -------------------------------------------------------------- | -------------------------- |
| Azure Communication Services — Email | docs.microsoft.com/azure/communication-services/concepts/email | Primary email provider     |
| Tiptap Rich Text Editor              | tiptap.dev/docs                                                | Template editor            |
| @react-pdf/renderer                  | react-pdf.org                                                  | Certificate PDF generation |
| DOMPurify                            | github.com/cure53/DOMPurify                                    | HTML sanitization          |
| Zod Schema Validation                | zod.dev                                                        | Input validation           |
| pg-boss                              | github.com/timgit/pg-boss                                      | Background job queue       |
| MJML Email Framework                 | mjml.io                                                        | Responsive email templates |
| QRCode.js                            | github.com/soldair/node-qrcode                                 | QR code generation         |

**Applicable Standards:**

| Standard       | Description                    | Module Sections |
| -------------- | ------------------------------ | --------------- |
| CAN-SPAM Act   | Email marketing compliance     | §10.3, §8.1.1   |
| GDPR Article 7 | Consent for communications     | §10.2, §7.3.6   |
| RFC 5321       | SMTP protocol                  | §5.1            |
| RFC 6749       | OAuth 2.0 for API auth         | §4, §10         |
| ISO 27001      | Information security           | §10             |
| WCAG 2.1 AA    | Accessibility for survey forms | §6, §9.4        |

---

_End of Module 14: Content and Documents_
